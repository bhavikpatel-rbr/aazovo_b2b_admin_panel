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
// import StickyFooter from "@/components/shared/StickyFooter"; // Commented out
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  // TbDotsVertical, // Commented out
  // TbShare, // Commented out
  // TbEye, // Commented out
  // TbChecks, // Commented out
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  // TbTrash, // Commented out for individual delete in ActionColumn
  TbReload,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  // Row, // Commented out
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getNumberSystemsAction,
  addNumberSystemAction,
  editNumberSystemAction,
  // deleteNumberSystemAction, // Commented out
  // deleteAllNumberSystemsAction, // Commented out
  getCountriesAction,
  // submitExportReasonAction, // Placeholder
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Placeholder for submitExportReasonAction
const submitExportReasonAction = (payload: { reason: string; module: string }) => async (dispatch: any) => {
  console.log("Dispatching submitExportReasonAction (NumberSystems) with payload:", payload);
  await new Promise(resolve => setTimeout(resolve, 500));
  return Promise.resolve({ message: "Reason submitted successfully via placeholder (NumberSystems)." });
};


// --- Define Country Type ---
export type CountryListItem = { id: string | number; name: string };
export type CountryOption = { value: string; label: string };

// --- Define NumberSystemItem Type ---
export type NumberSystemItem = {
  id: string | number;
  name: string;
  prefix?: string;
  country_ids: string;
  customer_code_starting?: string;
  current_customer_code?: string;
  non_kyc_customer_code_starting?: string;
  non_kyc_current_customer_code?: string;
  company_code_starting?: string;
  current_company_code?: string;
  non_kyc_company_code_starting?: string;
  non_kyc_current_company_code?: string;
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string; // Added
  updated_by_role?: string; // Added
};

// --- Zod Schema for Add/Edit Form ---
const numberSystemFormSchema = z
  .object({
    name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
    prefix: z.string().max(10, "Prefix too long (max 10 chars).").optional().or(z.literal("")),
    customer_code_starting: z.coerce.number().int().min(0, "Start Number must be non-negative."),
    current_customer_code: z.coerce.number().int().min(0, "Current Number must be non-negative."),
    non_kyc_customer_code_starting: z.coerce.number().int().min(0, "Temp Start Number must be non-negative."),
    non_kyc_current_customer_code: z.coerce.number().int().min(0, "Temp Current Number must be non-negative."),
    company_code_starting: z.coerce.number().int().min(0, "Verified Company Start Number must be non-negative."),
    current_company_code: z.coerce.number().int().min(0, "Verified Company Current Number must be non-negative."),
    non_kyc_company_code_starting: z.coerce.number().int().min(0, "Temporary Company Start Number must be non-negative."),
    non_kyc_current_company_code: z.coerce.number().int().min(0, "Temporary Company Current Number must be non-negative."),
    country_ids: z.array(z.string()).min(1, "At least one country must be selected."),
  })
  .superRefine((data, ctx) => {
    if (data.current_customer_code < data.customer_code_starting) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Current Number cannot be less than Start Number.", path: ["current_customer_code"] });
    if (data.non_kyc_current_customer_code < data.non_kyc_customer_code_starting) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Temp Current Number cannot be less than Start Number.", path: ["non_kyc_current_customer_code"] });
    if (data.current_company_code < data.company_code_starting) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company Current Number cannot be less than Company Start Number.", path: ["current_company_code"] });
    if (data.non_kyc_current_company_code < data.non_kyc_company_code_starting) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company Current Number cannot be less than Company Start Number.", path: ["non_kyc_current_company_code"] });
  });
type NumberSystemFormData = z.infer<typeof numberSystemFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCountryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter Utility ---
const CSV_HEADERS_NS = [
  "ID", "Name", "Prefix", "Country IDs",
  "Member Start", "Members Current", "Members Temp Start", "Members Temp Current",
  "Verified Company Start", "Verified Company Current", "Temporary Company Start", "Temporary Company Current",
  "Created At", "Updated By", "Updated Role", "Updated At", // Added Audit Info
];
type NumberSystemExportItem = Omit<NumberSystemItem, "created_at" | "updated_at"> & {
    created_at_formatted?: string;
    updated_at_formatted?: string;
};

const CSV_KEYS_NS_EXPORT: (keyof NumberSystemExportItem)[] = [
  "id", "name", "prefix", "country_ids",
  "customer_code_starting", "current_customer_code", "non_kyc_customer_code_starting", "non_kyc_current_customer_code",
  "company_code_starting", "current_company_code", "non_kyc_company_code_starting", "non_kyc_current_company_code",
  "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted", // Added Audit Info
];

function exportNumberSystemsToCsv(filename: string, rows: NumberSystemItem[]) {
  if (!rows || !rows.length) {
    // Toast handled by caller
    return false;
  }
  const preparedRows: NumberSystemExportItem[] = rows.map((row) => ({
    ...row,
    prefix: row.prefix || "N/A",
    country_ids: row.country_ids || "N/A",
    customer_code_starting: row.customer_code_starting || "0",
    current_customer_code: row.current_customer_code || "0",
    non_kyc_customer_code_starting: row.non_kyc_customer_code_starting || "0",
    non_kyc_current_customer_code: row.non_kyc_current_customer_code || "0",
    company_code_starting: row.company_code_starting || "0",
    current_company_code: row.current_company_code || "0",
    non_kyc_company_code_starting: row.non_kyc_company_code_starting || "0",
    non_kyc_current_company_code: row.non_kyc_current_company_code || "0",
    created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_NS.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_NS_EXPORT.map((k) => {
          let cell = row[k as keyof NumberSystemExportItem];
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
  toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>);
  return false;
}

// --- ActionColumn ---
const ActionColumn = ({ onEdit }: { onEdit: () => void; }) => { // Removed onDelete
  const iconButtonClass = "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div>
      </Tooltip>
      {/* Delete button commented out as per request */}
      {/* <Tooltip title="Delete">
        <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={onDelete}><TbTrash /></div>
      </Tooltip> */}
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
      <Button title="Clear Filters" icon={<TbReload/>} onClick={onClearFilters}></Button> {/* Changed onClick */}
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

// --- NumberSystemsTable (Row selection commented out) ---
type NumberSystemsTableProps = {
  columns: ColumnDef<NumberSystemItem>[];
  data: NumberSystemItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  // selectedItems: NumberSystemItem[]; // Commented out
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  // onRowSelect: (checked: boolean, row: NumberSystemItem) => void; // Commented out
  // onAllRowSelect: (checked: boolean, rows: Row<NumberSystemItem>[]) => void; // Commented out
};
const NumberSystemsTable = ({ columns, data, loading, pagingData, /*selectedItems,*/ onPaginationChange, onSelectChange, onSort, /*onRowSelect, onAllRowSelect*/ }: NumberSystemsTableProps) => (
  <DataTable
    // selectable // Commented out
    columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData}
    // checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} // Commented out
    onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
    // onCheckBoxChange={onRowSelect} // Commented out
    // onIndeterminateCheckBoxChange={onAllRowSelect} // Commented out
  />
);

// --- NumberSystemsSelectedFooter (Commented out) ---
/*
type NumberSystemsSelectedFooterProps = { selectedItems: NumberSystemItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const NumberSystemsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: NumberSystemsSelectedFooterProps) => {
  // ... (Implementation remains the same, but component will not be rendered)
};
*/

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
  // const [isDeleting, setIsDeleting] = useState(false); // Commented out
  // const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false); // Commented out
  // const [itemToDelete, setItemToDelete] = useState<NumberSystemItem | null>(null); // Commented out
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterCountryIds: [] });
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" }); // Default sort
  // const [selectedItems, setSelectedItems] = useState<NumberSystemItem[]>([]); // Commented out

  // --- Export Reason Modal State ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);


  useEffect(() => { dispatch(getNumberSystemsAction()); dispatch(getCountriesAction()); }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(CountriesData) && CountriesData.length > 0) {
      const newOptions = CountriesData.map((country: CountryListItem) => ({ value: String(country.id), label: country.name }));
      setCountryOptions(newOptions); // Simplified update
    } else {
      setCountryOptions([]);
    }
  }, [CountriesData]);

  const defaultFormValues: NumberSystemFormData = {
    name: "", prefix: "", customer_code_starting: 0, current_customer_code: 0,
    non_kyc_customer_code_starting: 0, non_kyc_current_customer_code: 0,
    company_code_starting: 0, current_company_code: 0,
    non_kyc_company_code_starting: 0, non_kyc_current_company_code: 0,
    country_ids: [],
  };

  const formMethods = useForm<NumberSystemFormData>({ resolver: zodResolver(numberSystemFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });


  const openAddDrawer = useCallback(() => { formMethods.reset(defaultFormValues); setIsAddDrawerOpen(true); }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: NumberSystemItem) => {
      setEditingItem(item);
      const selectedCountryIds = item.country_ids ? item.country_ids.split(",").map((id) => id.trim()).filter((id) => id) : [];
      formMethods.reset({
        name: item.name, prefix: item.prefix || "",
        customer_code_starting: Number(item.customer_code_starting) || 0, current_customer_code: Number(item.current_customer_code) || 0,
        non_kyc_customer_code_starting: Number(item.non_kyc_customer_code_starting) || 0, non_kyc_current_customer_code: Number(item.non_kyc_current_customer_code) || 0,
        company_code_starting: Number(item.company_code_starting) || 0, current_company_code: Number(item.current_company_code) || 0,
        non_kyc_company_code_starting: Number(item.non_kyc_company_code_starting) || 0, non_kyc_current_company_code: Number(item.non_kyc_current_company_code) || 0,
        country_ids: selectedCountryIds,
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: NumberSystemFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      name: data.name, prefix: data.prefix || null, country_ids: data.country_ids.join(","),
      customer_code_starting: String(data.customer_code_starting), current_customer_code: String(data.current_customer_code),
      non_kyc_customer_code_starting: String(data.non_kyc_customer_code_starting), non_kyc_current_customer_code: String(data.non_kyc_current_customer_code),
      company_code_starting: String(data.company_code_starting), current_company_code: String(data.current_company_code),
      non_kyc_company_code_starting: String(data.non_kyc_company_code_starting), non_kyc_current_company_code: String(data.non_kyc_current_company_code),
    };

    try {
      if (editingItem) {
        await dispatch(editNumberSystemAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Numbering System Updated" type="success" duration={2000}>System updated.</Notification>);
        closeEditDrawer();
      } else {
        await dispatch(addNumberSystemAction(apiPayload)).unwrap();
        toast.push(<Notification title="Numbering System Added" type="success" duration={2000}>New numbering system added.</Notification>);
        closeAddDrawer();
      }
      dispatch(getNumberSystemsAction());
    } catch (error: any) {
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" duration={3000}>{error?.message || "Operation failed."}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Logic (Commented out) ---
  /*
  const handleDeleteClick = useCallback((item: NumberSystemItem) => {
    // ... (single delete confirmation logic)
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    // ... (dispatch deleteNumberSystemAction)
  }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => {
    // ... (dispatch deleteAllNumberSystemsAction)
  }, [dispatch, selectedItems]);
  */
  // --- End Delete Logic ---


  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterCountryIds: data.filterCountryIds || [] }); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaultFilters = { filterCountryIds: [] }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); }, [filterFormMethods]); // Added query reset

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: NumberSystemItem[] = Array.isArray(numberSystemsData) ? numberSystemsData : [];
    let processedData: NumberSystemItem[] = cloneDeep(sourceData);
    if (filterCriteria.filterCountryIds && filterCriteria.filterCountryIds.length > 0) {
      const selectedFilterCountryOptionValues = filterCriteria.filterCountryIds.map((opt) => opt.value);
      processedData = processedData.filter((item) => { if (!item.country_ids) return false; const itemCountryIds = item.country_ids.split(",").map((id) => id.trim()); return itemCountryIds.some((id) => selectedFilterCountryOptionValues.includes(id)); });
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.toLowerCase() ?? "").includes(query) || String(item.id).toLowerCase().includes(query) ||
          (item.prefix?.toLowerCase() ?? "").includes(query) || (item.updated_by_name?.toLowerCase() ?? "").includes(query) // Search by updated_by_name
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && ["id", "name", "prefix", "countriesCount", "created_at", "updated_at", "updated_by_name"].includes(String(key))) { // Added new sort keys
        processedData.sort((a, b) => {
            let aVal: any, bVal: any;
            if (key === "created_at" || key === "updated_at") {
                const dateA = a[key as 'created_at' | 'updated_at'] ? new Date(a[key as 'created_at' | 'updated_at']!).getTime() : 0;
                const dateB = b[key as 'created_at' | 'updated_at'] ? new Date(b[key as 'created_at' | 'updated_at']!).getTime() : 0;
                return order === "asc" ? dateA - dateB : dateB - dateA;
            } else if (key === "countriesCount") {
                aVal = a.country_ids ? a.country_ids.split(",").length : 0;
                bVal = b.country_ids ? b.country_ids.split(",").length : 0;
            }
            else {
                aVal = a[key as keyof NumberSystemItem] ?? "";
                bVal = b[key as keyof NumberSystemItem] ?? "";
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
  }, [numberSystemsData, tableData, filterCriteria]);

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
    const moduleName = "Numbering Systems";
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      exportNumberSystemsToCsv("number_systems_export.csv", allFilteredAndSortedData);
      // Optional: toast.push(<Notification title="Data Exported" type="success">Number systems data exported.</Notification>);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete export."} />);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); /* setSelectedItems([]); // Commented out */ }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);

  // --- Row Select Logic (Commented out) ---
  /*
  const handleRowSelect = useCallback((checked: boolean, row: NumberSystemItem) => {
    // ... (setSelectedItems logic)
  }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<NumberSystemItem>[]) => {
    // ... (setSelectedItems logic for all rows)
  }, []);
  */
  // --- End Row Select Logic ---

  const columns: ColumnDef<NumberSystemItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 60, meta: { tdClass: "text-center", thClass: "text-center" } },
      { header: "Name", accessorKey: "name", enableSorting: true, size: 160, cell: (props) => (<span className="font-semibold">{props.row.original.name}</span>) },
      { header: "Countries", accessorKey: "country_ids", id: "countriesCount", enableSorting: true,
        cell: (props) => {
          const countryIdString = props.row.original.country_ids; if (!countryIdString) return <Tag>N/A</Tag>;
          const ids = countryIdString.split(",").map((id) => id.trim()).filter((id) => id); if (ids.length === 0) return <Tag>None</Tag>;
          const names = ids.map((id) => { const country = CountriesData.find((c: CountryListItem) => String(c.id) === id); return country ? country.name : `ID:${id}`; });
          const displayLimit = 2; const displayedNames = names.slice(0, displayLimit); const remainingCount = names.length - displayLimit;
          return (<div className="flex flex-wrap gap-1">{displayedNames.map((name, index) => (<Tag key={`${name}-${index}`} className="bg-gray-100 dark:bg-gray-600">{name}</Tag>))}{remainingCount > 0 && (<Tag className="bg-gray-200 dark:bg-gray-500">+{remainingCount} more</Tag>)}</div>);
        }, size: 360,
      },
      { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, meta: { HeaderClass: "text-red-500" }, size: 160,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } = props.row.original;
          const formattedDate = updated_at ? `${new Date(updated_at).getDate()} ${new Date(updated_at).toLocaleString("en-US", { month: "long" })} ${new Date(updated_at).getFullYear()}, ${new Date(updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "N/A";
          return (<div className="text-xs"><span>{updated_by_name || "N/A"}{updated_by_role && (<><br /><b>{updated_by_role}</b></>)}</span><br /><span>{formattedDate}</span></div>);
        },
      },
      { header: "Actions", id: "action", size: 60, meta: { HeaderClass: "text-center", cellClass: "text-center" }, // Adjusted size
        cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} /* onDelete={() => handleDeleteClick(props.row.original)} // Commented out */ />),
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [CountriesData, openEditDrawer /*, handleDeleteClick // Commented out */]
  );

  const renderDrawerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
      <FormItem label="System Name" className="md:col-span-2" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}>
        <Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., European System" />)} />
      </FormItem>
      <FormItem label="Prefix" className="md:col-span-2" invalid={!!formMethods.formState.errors.prefix} errorMessage={formMethods.formState.errors.prefix?.message}>
        <Controller name="prefix" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., EU (Optional)" />)} />
      </FormItem>
      <div className="md:col-span-2 border-t pt-3 mt-1"><h6 className="text-sm font-medium mb-2">Numbering System For Member As Per (Old Admin)</h6></div>
      <FormItem label="Member ID Starting No." invalid={!!formMethods.formState.errors.customer_code_starting} errorMessage={formMethods.formState.errors.customer_code_starting?.message}>
        <Controller name="customer_code_starting" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 10001" />)} />
      </FormItem>
      <FormItem label="Member ID Current No." invalid={!!formMethods.formState.errors.current_customer_code} errorMessage={formMethods.formState.errors.current_customer_code?.message}>
        <Controller name="current_customer_code" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 10500" />)} />
      </FormItem>
      <div className="md:col-span-2 border-t pt-3 mt-1"><h6 className="text-sm font-medium mb-2">Numbering System For Temporary Member As Per (Old Admin)</h6></div>
      <FormItem label="Member ID Starting No." invalid={!!formMethods.formState.errors.non_kyc_customer_code_starting} errorMessage={formMethods.formState.errors.non_kyc_customer_code_starting?.message}>
        <Controller name="non_kyc_customer_code_starting" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 5001" />)} />
      </FormItem>
      <FormItem label="Member ID Current No." invalid={!!formMethods.formState.errors.non_kyc_current_customer_code} errorMessage={formMethods.formState.errors.non_kyc_current_customer_code?.message}>
        <Controller name="non_kyc_current_customer_code" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 5250" />)} />
      </FormItem>
      <div className="md:col-span-2 border-t pt-3 mt-1"><h6 className="text-sm font-medium mb-2">Numbering System For Verified Company As Per (New Admin)</h6></div>
      <FormItem label="Company ID Starting No." invalid={!!formMethods.formState.errors.company_code_starting} errorMessage={formMethods.formState.errors.company_code_starting?.message}>
        <Controller name="company_code_starting" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 70001" />)} />
      </FormItem>
      <FormItem label="Company ID Current No." invalid={!!formMethods.formState.errors.current_company_code} errorMessage={formMethods.formState.errors.current_company_code?.message}>
        <Controller name="current_company_code" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 70100" />)} />
      </FormItem>
      <div className="md:col-span-2 border-t pt-3 mt-1"><h6 className="text-sm font-medium mb-2">Numbering System For Temporary Company As Per (New Admin)</h6></div>
      <FormItem label="Company ID Starting No." invalid={!!formMethods.formState.errors.non_kyc_company_code_starting} errorMessage={formMethods.formState.errors.non_kyc_company_code_starting?.message}>
        <Controller name="non_kyc_company_code_starting" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 80001" />)} />
      </FormItem>
      <FormItem label="Company ID Current No." invalid={!!formMethods.formState.errors.non_kyc_current_company_code} errorMessage={formMethods.formState.errors.non_kyc_current_company_code?.message}>
        <Controller name="non_kyc_current_company_code" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 80050" />)} />
      </FormItem>
      <FormItem label="Applicable Countries" className="md:col-span-2" invalid={!!formMethods.formState.errors.country_ids} errorMessage={formMethods.formState.errors.country_ids?.message as string}>
        <Controller name="country_ids" control={formMethods.control} render={({ field }) => (<Select isMulti placeholder="Select countries..." options={countryOptions} value={countryOptions.filter((option) => field.value?.includes(option.value))} onChange={(selectedOpts) => field.onChange(selectedOpts ? selectedOpts.map((opt) => opt.value) : [])} />)} />
      </FormItem>
    </div>
  );

  const tableLoading = masterLoadingStatus === "idle" || isSubmitting /*|| isDeleting // Commented out */;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Numbering System</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} /> {/* Changed onExport */}
          <div className="mt-4">
            <NumberSystemsTable columns={columns} data={pageData} loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              // selectedItems={selectedItems} // Commented out
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort}
              // onRowSelect={handleRowSelect} // Commented out
              // onAllRowSelect={handleAllRowSelect} // Commented out
            />
          </div>
        </AdaptiveCard>
      </Container>

      {/* <NumberSystemsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} /> // Commented out */}

      <Drawer title={editingItem ? "Edit Number System" : "Add New Number System"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
            <Button size="sm" variant="solid" form="numberSystemForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : "Save"}</Button>
          </div>
        }
      >
        <Form id="numberSystemForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-2 relative pb-28"> {/* Added relative pb-28 */}
          {renderDrawerForm()}
        
           {editingItem && (
             <div className="absolute bottom-0 w-full">
                <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                        <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                        <p className="text-sm font-semibold">{editingItem.updated_by_name || "N/A"}</p>
                        <p>{editingItem.updated_by_role || "N/A"}</p>
                    </div>
                    <div>
                        <br />
                        <span className="font-semibold">Created At:</span>{" "}
                        <span>{editingItem.created_at ? new Date(editingItem.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                        <br />
                        <span className="font-semibold">Updated At:</span>{" "}
                        <span>{editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                    </div>
                </div>
            </div>
          )}
        </Form>
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400} // Matched width
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> {/* Applied onClearFilters */}
            <Button size="sm" variant="solid" form="filterNumberSystemForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form id="filterNumberSystemForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Countries">
            <Controller name="filterCountryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select countries to filter by..." options={countryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} />
          </FormItem>
        </Form>
      </Drawer>

      {/* <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Number System" ... /> // Commented out */}

      {/* --- Export Reason Modal --- */}
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
          id="exportNumberSystemsReasonForm" // Unique ID
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

export default NumberSystems;