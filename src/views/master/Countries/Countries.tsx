// src/views/your-path/Countries.tsx

import React, {
  useState,
  useMemo,
  useCallback,
  Ref,
  useEffect,
} from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
// import StickyFooter from "@/components/shared/StickyFooter"; // Not needed as CountrySelectedFooter is commented out
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Added Tag

// Icons
import {
  TbPencil,
  TbTrash,
  // TbChecks, // Not needed as CountrySelectedFooter is commented out
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  // Row, // Not needed as onAllRowSelect is commented out
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  getCountriesAction,
  addCountryAction,
  editCountryAction,
  deleteCountryAction,
  // deleteAllCountriesAction, // Commented out
  getContinentsAction,
  submitExportReasonAction, // Placeholder for future action
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Type for Continent & Status options in Select
type SelectOption = {
  value: string | number;
  label: string;
};

// --- Define CountryItem Type ---
export type CountryItem = {
  id: string | number;
  continent_id: string | number;
  name: string;
  iso: string;
  phonecode: string;
  status: 'Active' | 'Inactive'; // Added status field
  continent?: {
    id: string | number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

// --- Zod Schema for Add/Edit Country Form ---
const countryFormSchema = z.object({
  continent_id: z.union([
    z.string().min(1, "Continent is required."),
    z.number().min(1, "Continent is required."),
  ]),
  name: z
    .string()
    .min(1, "Country name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  iso: z
    .string()
    .min(1, "ISO code is required.")
    .max(10, "ISO code cannot exceed 10 characters."),
  phonecode: z
    .string()
    .min(1, "Phone code is required.")
    .max(10, "Phone code cannot exceed 10 characters."),
  status: z.enum(['Active', 'Inactive'], { required_error: "Status is required." }), // Added status
});
type CountryFormData = z.infer<typeof countryFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterContinentIds: z
    .array(
      z.object({ value: z.union([z.string(), z.number()]), label: z.string() })
    )
    .optional(),
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterIsos: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z // Added status filter
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter Utility ---
const CSV_HEADERS_COUNTRY = [
  "ID",
  "Continent Name",
  "Country Name",
  "ISO Code",
  "Phone Code",
  "Status", // Added Status
  "Updated By",
  "Updated Role",
  "Updated At",
];

type CountryExportItem = Omit<CountryItem, "continent_id" | "continent" | "created_at" | "updated_at"> & {
  continentName?: string;
  status: 'Active' | 'Inactive'; // Ensure status is part of export
  updated_at_formatted?: string;
};

const CSV_KEYS_COUNTRY_EXPORT: (keyof CountryExportItem)[] = [
  "id",
  "continentName",
  "name",
  "iso",
  "phonecode",
  "status", // Added Status
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];


function exportToCsvCountry(filename: string, rows: CountryItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: CountryExportItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    iso: row.iso,
    phonecode: row.phonecode,
    status: row.status, // Added status
    continentName: row.continent?.name || String(row.continent_id) || "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_COUNTRY.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_COUNTRY_EXPORT.map((k) => {
          let cell = row[k as keyof CountryExportItem];
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
    toast.push(
      <Notification title="Export Successful" type="success">
        Data exported to {filename}.
      </Notification>
    );
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
  // onDelete, // Delete action is commented out for now
}: {
  onEdit: () => void;
  // onDelete: () => void;
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
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* Delete button can be re-added here */}
    </div>
  );
};

// --- CountrySearch Component ---
type CountrySearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const CountrySearch = React.forwardRef<HTMLInputElement, CountrySearchProps>(
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
CountrySearch.displayName = "CountrySearch";

// --- CountryTableTools Component ---
const CountryTableTools = ({
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
        <CountrySearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button title="Clear Filters" icon={<TbReload />} onClick={() => onClearFilters()}></Button>
        <Button
          icon={<TbFilter />}
          onClick={onFilter}
          className="w-full sm:w-auto"
        >
          Filter
        </Button>
        <Button
          icon={<TbCloudUpload />}
          onClick={onExport} // This will now open the reason modal
          className="w-full sm:w-auto"
        >
          Export
        </Button>
      </div>
    </div>
  );
};

// --- CountryTable Component ---
type CountryTableProps = {
  columns: ColumnDef<CountryItem>[];
  data: CountryItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
};
const CountryTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: CountryTableProps) => {
  return (
    <DataTable
      columns={columns}
      data={data}
      noData={!loading && data.length === 0}
      loading={loading}
      pagingData={pagingData}
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
    />
  );
};

// --- Main Countries Component ---
const Countries = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryItem | null>(null);
  
  // State for export reason modal
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterContinentIds: [],
    filterNames: [],
    filterIsos: [],
    filterStatus: [], // Added
  });

  const {
    CountriesData = [],
    ContinentsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const continentOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(ContinentsData)) return [];
    return ContinentsData.map(
      (continent: { id: string | number; name: string }) => ({
        value: continent.id,
        label: continent.name,
      })
    );
  }, [ContinentsData]);
  
  const defaultFormValues: CountryFormData = useMemo(() => ({
    continent_id: continentOptions[0]?.value || "", 
    name: "", 
    iso: "", 
    phonecode: "",
    status: 'Active', // Default status
  }), [continentOptions]);


  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
  }, [dispatch]);

  const addFormMethods = useForm<CountryFormData>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<CountryFormData>({
    resolver: zodResolver(countryFormSchema),
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

  const openAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(false);
  };
  const onAddCountrySubmit = async (data: CountryFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addCountryAction(data)).unwrap(); // data includes status
      toast.push(
        <Notification title="Country Added" type="success" duration={2000}>
          Country "{data.name}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getCountriesAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add country."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = useCallback((country: CountryItem) => {
    setEditingCountry(country);
    editFormMethods.reset({
        continent_id: country.continent_id,
        name: country.name,
        iso: country.iso,
        phonecode: country.phonecode,
        status: country.status || 'Active', // Set status, default to Active
    });
    setIsEditDrawerOpen(true);
  }, [editFormMethods]);

  const closeEditDrawer = () => {
    setEditingCountry(null);
    editFormMethods.reset(defaultFormValues);
    setIsEditDrawerOpen(false);
  };

  const onEditCountrySubmit = async (data: CountryFormData) => {
    if (!editingCountry?.id) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        editCountryAction({ id: editingCountry.id, ...data }) // data includes status
      ).unwrap();
      toast.push(
        <Notification title="Country Updated" type="success" duration={2000}>
          Country "{data.name}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getCountriesAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update country."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((country: CountryItem) => {
    if (!country?.id) return;
    setCountryToDelete(country);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = async () => {
    if (!countryToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteCountryAction({id: countryToDelete.id})).unwrap();
      toast.push(
        <Notification title="Country Deleted" type="success" duration={2000}>
          Country "{countryToDelete.name}" deleted.
        </Notification>
      );
      dispatch(getCountriesAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete country.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setCountryToDelete(null);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawerCb = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterContinentIds: data.filterContinentIds || [],
      filterNames: data.filterNames || [],
      filterIsos: data.filterIsos || [],
      filterStatus: data.filterStatus || [], // Added
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawerCb();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterContinentIds: [],
      filterNames: [],
      filterIsos: [],
      filterStatus: [], // Added
    };
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

  const countryNameOptions = useMemo(() => {
    if (!Array.isArray(CountriesData)) return [];
    const uniqueNames = new Set(CountriesData.map((country) => country.name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [CountriesData]);

  const countryIsoOptions = useMemo(() => {
    if (!Array.isArray(CountriesData)) return [];
    const uniqueIsos = new Set(CountriesData.map((country) => country.iso));
    return Array.from(uniqueIsos).map((iso) => ({
      value: iso,
      label: iso,
    }));
  }, [CountriesData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: CountryItem[] = Array.isArray(CountriesData)
      ? CountriesData.map(item => ({
          ...item,
          status: item.status || 'Inactive' // Ensure status has a default
      }))
      : [];
    let processedData: CountryItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterContinentIds?.length) {
      const selectedContinentIds = filterCriteria.filterContinentIds.map(
        (opt) => String(opt.value)
      );
      processedData = processedData.filter((item) =>
        selectedContinentIds.includes(String(item.continent_id))
      );
    }
    if (filterCriteria.filterNames?.length) {
      const selectedNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedNames.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterIsos?.length) {
      const selectedIsos = filterCriteria.filterIsos.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedIsos.includes(item.iso?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterStatus?.length) { // Added status filter
        const statuses = filterCriteria.filterStatus.map(opt => opt.value);
        processedData = processedData.filter(item => statuses.includes(item.status));
    }

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) =>
        (item.name?.trim().toLowerCase() ?? "").includes(query) ||
        (item.iso?.trim().toLowerCase() ?? "").includes(query) ||
        (item.phonecode?.trim().toLowerCase() ?? "").includes(query) ||
        (item.status?.trim().toLowerCase() ?? "").includes(query) || // Search by status
        (item.continent?.name?.trim().toLowerCase() ?? "").includes(query) ||
        (item.updated_by_name?.trim().toLowerCase() ?? "").includes(query) ||
        String(item.id ?? "").trim().toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order && key &&
      ["id", "name", "iso", "phonecode", "status", "continent.name", "updated_at", "updated_by_name"].includes(key) && // Added status to sortable keys
      processedData.length > 0
    ) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "continent.name") { aValue = a.continent?.name ?? ""; bValue = b.continent?.name ?? "";}
        else if (key === "updated_at") {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        }
        else if (key === "status") { // Added status sorting
            aValue = a.status ?? "";
            bValue = b.status ?? "";
        }
        else { aValue = a[key as keyof CountryItem] ?? ""; bValue = b[key as keyof CountryItem] ?? "";}
        
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
  }, [CountriesData, tableData, filterCriteria]);

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
    const moduleName = "Countries";
    try {
      await dispatch(submitExportReasonAction({
        reason: data.reason,
        module: moduleName,
      })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      // Proceed with CSV export after successful reason submit
      exportToCsvCountry("countries_export.csv", allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Submit Reason" type="danger" message={error.message} />);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };


  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectPageSizeChange = useCallback(
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

  const columns: ColumnDef<CountryItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 60 },
      {
        header: "Continent",
        accessorKey: "continent.name",
        enableSorting: true,
        size:120,
        cell: (props) => props.row.original.continent?.name || "N/A",
      },
      { header: "Country Name", accessorKey: "name", enableSorting: true, size:160 },
      { header: "ISO Code", accessorKey: "iso", enableSorting: true, size: 100 },
      { header: "Phone Code", accessorKey: "phonecode", enableSorting: true, size: 130 },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" }, // Optional styling

        size: 160,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", { month: "short" })} ${new Date(updated_at).getFullYear()}, ${new Date(
                updated_at
              ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_name || "N/A"}
                {updated_by_role && <><br /><b>{updated_by_role}</b></>}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
      { // Added Status Column
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
                {
                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500": status === 'Active',
                  "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500": status === 'Inactive',
                }
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
        size: 60,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            // onDelete={() => handleDeleteClick(props.row.original)} // Can be re-added
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openEditDrawer /* , handleDeleteClick removed for now */] 
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Countries</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <CountryTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal} // Changed to open reason modal
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <CountryTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "idle" || isSubmitting || isDeleting
              }
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectPageSizeChange}
              onSort={handleSort}
            />
          </div>
        </AdaptiveCard>
      </Container>

      {[
        { formMethods: addFormMethods, onSubmit: onAddCountrySubmit, isOpen: isAddDrawerOpen, closeFn: closeAddDrawer, title: "Add Country", formId: "addCountryForm", submitText: "Adding...", saveText: "Save", isEdit: false },
        { formMethods: editFormMethods, onSubmit: onEditCountrySubmit, isOpen: isEditDrawerOpen, closeFn: closeEditDrawer, title: "Edit Country", formId: "editCountryForm", submitText: "Saving...", saveText: "Save", isEdit: true }
      ].map(drawerProps => (
        <Drawer
            key={drawerProps.formId}
            title={drawerProps.title}
            isOpen={drawerProps.isOpen}
            onClose={drawerProps.closeFn}
            onRequestClose={drawerProps.closeFn}
            width={520}
            footer={
                <div className="text-right w-full">
                <Button size="sm" className="mr-2" onClick={drawerProps.closeFn} disabled={isSubmitting}>Cancel</Button>
                <Button size="sm" variant="solid" form={drawerProps.formId} type="submit" loading={isSubmitting} disabled={!drawerProps.formMethods.formState.isValid || isSubmitting}>
                    {isSubmitting ? drawerProps.submitText : drawerProps.saveText}
                </Button>
                </div>
            }
            >
            <Form
                id={drawerProps.formId}
                onSubmit={drawerProps.formMethods.handleSubmit(drawerProps.onSubmit as any)}
                className="flex flex-col relative"
            >
              {
                <div className="grid grid-cols-2 gap-2">
                <FormItem
                    label="Continent"
                    invalid={!!drawerProps.formMethods.formState.errors.continent_id}
                    errorMessage={drawerProps.formMethods.formState.errors.continent_id?.message as string | undefined}
                >
                    <Controller
                    name="continent_id"
                    control={drawerProps.formMethods.control}
                    render={({ field }) => (
                        <Select
                            placeholder="Select Continent"
                            options={continentOptions}
                            value={continentOptions.find(option => String(option.value) === String(field.value)) || null}
                            onChange={(option) => field.onChange(option ? option.value : "")}
                        />
                    )}
                    />
                </FormItem>
                <FormItem
                    label="Country Name"
                    invalid={!!drawerProps.formMethods.formState.errors.name}
                    errorMessage={drawerProps.formMethods.formState.errors.name?.message as string | undefined}
                >
                    <Controller name="name" control={drawerProps.formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Country Name" />)} />
                </FormItem>
                <FormItem
                    label="ISO Code"
                    invalid={!!drawerProps.formMethods.formState.errors.iso}
                    errorMessage={drawerProps.formMethods.formState.errors.iso?.message as string | undefined}
                >
                    <Controller name="iso" control={drawerProps.formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter ISO Code (e.g., US)" />)} />
                </FormItem>
                <FormItem
                    label="Phone Code"
                    invalid={!!drawerProps.formMethods.formState.errors.phonecode}
                    errorMessage={drawerProps.formMethods.formState.errors.phonecode?.message as string | undefined}
                >
                    <Controller name="phonecode" control={drawerProps.formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Phone Code (e.g., +1)" />)} />
                </FormItem>
                <FormItem // Added Status Field
                    label="Status"
                    className="col-span-2"
                    invalid={!!drawerProps.formMethods.formState.errors.status}
                    errorMessage={drawerProps.formMethods.formState.errors.status?.message as string | undefined}
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
            </Form>
              {drawerProps.isEdit && editingCountry && (
                <div className="absolute bottom-[14%] w-[92%]">
                  <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                      <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b>
                      <br />
                      <p className="text-sm font-semibold">{editingCountry.updated_by_name || "N/A"}</p>
                      <p>{editingCountry.updated_by_role || "N/A"}</p>
                    </div>
                    <div>
                      <br />
                      <span className="font-semibold">Created At:</span>{" "}
                      <span>
                        {editingCountry.created_at
                          ? new Date(editingCountry.created_at).toLocaleString("en-US", {
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
                        {editingCountry.updated_at
                          ? new Date(editingCountry.updated_at).toLocaleString("en-US", {
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
        </Drawer>
      ))}

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawerCb}
        onRequestClose={closeFilterDrawerCb}
        width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterCountryForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form
          id="filterCountryForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Continent">
            <Controller
              name="filterContinentIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select continents..."
                  options={continentOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Country Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select country names..."
                  options={countryNameOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="ISO Code">
            <Controller
              name="filterIsos"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select ISO codes..."
                  options={countryIsoOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status"> {/* Added Status Filter */}
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
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        disableConfirm={!exportReasonFormMethods.formState.isValid || isSubmittingExportReason}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault(); // prevent native submit
            exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input textArea {...field} placeholder="Enter reason..." rows={3} />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Country"
        onClose={() => { setSingleDeleteConfirmOpen(false); setCountryToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setCountryToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setCountryToDelete(null); }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the country "
          <strong>{countryToDelete?.name} ({countryToDelete?.iso})</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default Countries;