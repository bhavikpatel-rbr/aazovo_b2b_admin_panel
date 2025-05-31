import React, {
  useState,
  useMemo,
  useCallback,
  Ref,
  useEffect,
  lazy,
  Suspense,
} from "react";
// import { Link, useNavigate } from 'react-router-dom'; // Link/useNavigate not used in this pattern
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
import Select from "@/components/ui/Select"; // For Select component in drawers
import { Drawer, Form, FormItem, Input } from "@/components/ui";
// import { CSVLink } from 'react-csv'; // Using custom export

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
  // TbCloudDownload, // Not used if custom export is preferred
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
  getCountriesAction,
  addCountryAction, // Ensure these actions exist or are created
  editCountryAction, // Ensure these actions exist or are created
  deleteCountryAction, // Ensure these actions exist or are created
  deleteAllCountriesAction,
  getContinentsAction, // Ensure these actions exist or are created
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Type for Continent options in Select
type ContinentOption = {
  value: string | number;
  label: string;
};

// --- Define CountryItem Type ---
export type CountryItem = {
  id: string | number;
  continent_id: string | number; // Changed to allow number
  name: string;
  iso: string;
  phonecode: string;
  continent?: {
    // Optional continent object from backend
    id: string | number;
    name: string;
  };
};

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
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_COUNTRY = [
  "ID",
  "Continent Name",
  "Country Name",
  "ISO Code",
  "Phone Code",
];
const CSV_KEYS_COUNTRY_EXPORT = [
  "id",
  "continentName",
  "name",
  "iso",
  "phonecode",
]; // Adjusted for transformed data

type CountryExportItem = Omit<CountryItem, "continent_id" | "continent"> & {
  continentName?: string;
};

function exportToCsvCountry(filename: string, rows: CountryItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  // Transform data for export to include continent name
  const transformedRows: CountryExportItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    iso: row.iso,
    phonecode: row.phonecode,
    continentName: row.continent?.name || String(row.continent_id) || "N/A",
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
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- ActionColumn Component (No changes needed) ---
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
          onClick={onEdit}
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
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
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
          onClick={onExport}
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
  selectedItems: CountryItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: CountryItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<CountryItem>[]) => void;
};
const CountryTable = ({
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
}: CountryTableProps) => {
  return (
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
};

// --- CountrySelectedFooter Component ---
type CountrySelectedFooterProps = {
  selectedItems: CountryItem[];
  onDeleteSelected: () => void;
};
const CountrySelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: CountrySelectedFooterProps) => {
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
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Countr${selectedItems.length > 1 ? "ies" : "y"
          }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected countr
          {selectedItems.length > 1 ? "ies" : "y"}? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Countries Component ---
const Countries = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryItem | null>(
    null
  );

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterContinentIds: [],
    filterNames: [],
    filterIsos: [],
  });

  const {
    CountriesData = [],
    ContinentsData = [], // For populating select options
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction()); // Fetch continents for select dropdown
  }, [dispatch]);

  const addFormMethods = useForm<CountryFormData>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: { continent_id: "", name: "", iso: "", phonecode: "" },
    mode: "onChange",
  });
  const editFormMethods = useForm<CountryFormData>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: { continent_id: "", name: "", iso: "", phonecode: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const continentOptions = useMemo(() => {
    if (!Array.isArray(ContinentsData)) return [];
    return ContinentsData.map(
      (continent: { id: string | number; name: string }) => ({
        value: continent.id,
        label: continent.name,
      })
    );
  }, [ContinentsData]);

  const openAddDrawer = () => {
    addFormMethods.reset({
      continent_id: "",
      name: "",
      iso: "",
      phonecode: "",
    });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset({
      continent_id: "",
      name: "",
      iso: "",
      phonecode: "",
    });
    setIsAddDrawerOpen(false);
  };
  const onAddCountrySubmit = async (data: CountryFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addCountryAction(data)).unwrap();
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
      console.error("Add Country Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (country: CountryItem) => {
    setEditingCountry(country);
    editFormMethods.setValue("continent_id", country.continent_id);
    editFormMethods.setValue("name", country.name);
    editFormMethods.setValue("iso", country.iso);
    editFormMethods.setValue("phonecode", country.phonecode);
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingCountry(null);
    editFormMethods.reset({
      continent_id: "",
      name: "",
      iso: "",
      phonecode: "",
    });
    setIsEditDrawerOpen(false);
  };
  const onEditCountrySubmit = async (data: CountryFormData) => {
    if (
      !editingCountry ||
      editingCountry.id === undefined ||
      editingCountry.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Country ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        editCountryAction({
          id: editingCountry.id,
          ...data,
        })
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
      console.error("Edit Country Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (country: CountryItem) => {
    if (country.id === undefined || country.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Country ID is missing.
        </Notification>
      );
      return;
    }
    setCountryToDelete(country);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (
      !countryToDelete ||
      countryToDelete.id === undefined ||
      countryToDelete.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Country ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setCountryToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteCountryAction(countryToDelete)).unwrap();
      toast.push(
        <Notification title="Country Deleted" type="success" duration={2000}>
          Country "{countryToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== countryToDelete!.id)
      );
      dispatch(getCountriesAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete country.`}
        </Notification>
      );
      console.error("Delete Country Error:", error);
    } finally {
      setIsDeleting(false);
      setCountryToDelete(null);
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
      const skippedCount = selectedItems.length - validItemsToDelete.length;
      toast.push(
        <Notification title="Deletion Warning" type="warning" duration={3000}>
          {skippedCount} item(s) could not be processed due to missing IDs and
          were skipped.
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

    const idsToDelete = validItemsToDelete.map((item) => item.id);
    const commaSeparatedIds = idsToDelete.join(",");

    try {
      await dispatch(
        deleteAllCountriesAction({ ids: commaSeparatedIds })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} countr
          {validItemsToDelete.length > 1 ? "ies" : "y"} successfully processed
          for deletion.
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected countries."}
        </Notification>
      );
      console.error("Delete selected countries error:", error);
    } finally {
      setSelectedItems([]);
      dispatch(getCountriesAction());
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
      filterContinentIds: data.filterContinentIds || [],
      filterNames: data.filterNames || [],
      filterIsos: data.filterIsos || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterContinentIds: [],
      filterNames: [],
      filterIsos: [],
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
  const [selectedItems, setSelectedItems] = useState<CountryItem[]>([]);

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
      ? CountriesData
      : [];
    let processedData: CountryItem[] = cloneDeep(sourceData);

    if (
      filterCriteria.filterContinentIds &&
      filterCriteria.filterContinentIds.length > 0
    ) {
      const selectedContinentIds = filterCriteria.filterContinentIds.map(
        (opt) => String(opt.value) // Ensure comparison is consistent (string vs string)
      );
      processedData = processedData.filter((item: CountryItem) =>
        selectedContinentIds.includes(String(item.continent_id))
      );
    }

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item: CountryItem) =>
        selectedFilterNames.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterIsos && filterCriteria.filterIsos.length > 0) {
      const selectedFilterIsos = filterCriteria.filterIsos.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item: CountryItem) =>
        selectedFilterIsos.includes(item.iso?.trim().toLowerCase() ?? "")
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item: CountryItem) => {
        const nameLower = item.name?.trim().toLowerCase() ?? "";
        const isoLower = item.iso?.trim().toLowerCase() ?? "";
        const phonecodeLower = item.phonecode?.trim().toLowerCase() ?? "";
        const continentNameLower =
          item.continent?.name?.trim().toLowerCase() ?? "";
        const idString = String(item.id ?? "")
          .trim()
          .toLowerCase();
        return (
          nameLower.includes(query) ||
          isoLower.includes(query) ||
          phonecodeLower.includes(query) ||
          continentNameLower.includes(query) ||
          idString.includes(query)
        );
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      (key === "id" ||
        key === "name" ||
        key === "iso" ||
        key === "phonecode" ||
        key === "continent.name") &&
      processedData.length > 0
    ) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        let aValue = "";
        let bValue = "";

        if (key === "continent.name") {
          aValue = String(a.continent?.name ?? "");
          bValue = String(b.continent?.name ?? "");
        } else {
          aValue = String(a[key as keyof CountryItem] ?? "");
          bValue = String(b[key as keyof CountryItem] ?? "");
        }

        return order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
      processedData = sortedData;
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
  }, [CountriesData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvCountry(
      "countries_export.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
    }
  };

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
  const handleRowSelect = useCallback((checked: boolean, row: CountryItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<CountryItem>[]) => {
      const currentPageRowOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prevSelected) => {
          const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
          const newRowsToAdd = currentPageRowOriginals.filter(
            (r) => !prevSelectedIds.has(r.id)
          );
          return [...prevSelected, ...newRowsToAdd];
        });
      } else {
        const currentPageRowIds = new Set(
          currentPageRowOriginals.map((r) => r.id)
        );
        setSelectedItems((prevSelected) =>
          prevSelected.filter((item) => !currentPageRowIds.has(item.id))
        );
      }
    },
    []
  );

  const columns: ColumnDef<CountryItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Continent",
        accessorKey: "continent.name", // Access nested property
        enableSorting: true,
        cell: (props) => props.row.original.continent?.name || "N/A",
      },
      {
        header: "Country Name",
        accessorKey: "name",
        enableSorting: true,
      },
      {
        header: "ISO Code",
        accessorKey: "iso",
        enableSorting: true,
      },
      {
        header: "Phone Code",
        accessorKey: "phonecode",
        enableSorting: true,
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
            onExport={handleExportData}
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

      <CountrySelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      <Drawer
        title="Add Country"
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
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="addCountryForm"
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
          id="addCountryForm"
          onSubmit={addFormMethods.handleSubmit(onAddCountrySubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Continent"
            invalid={!!addFormMethods.formState.errors.continent_id}
            errorMessage={addFormMethods.formState.errors.continent_id?.message}
          >
            <Controller
              name="continent_id"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Continent"
                  options={continentOptions}
                  value={
                    continentOptions.find(
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
          <FormItem
            label="Country Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Country Name" />
              )}
            />
          </FormItem>
          <FormItem
            label="ISO Code"
            invalid={!!addFormMethods.formState.errors.iso}
            errorMessage={addFormMethods.formState.errors.iso?.message}
          >
            <Controller
              name="iso"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter ISO Code (e.g., US)" />
              )}
            />
          </FormItem>
          <FormItem
            label="Phone Code"
            invalid={!!addFormMethods.formState.errors.phonecode}
            errorMessage={addFormMethods.formState.errors.phonecode?.message}
          >
            <Controller
              name="phonecode"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Phone Code (e.g., +1)" />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Country"
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
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="editCountryForm"
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
          id="editCountryForm"
          onSubmit={editFormMethods.handleSubmit(onEditCountrySubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Continent"
            invalid={!!editFormMethods.formState.errors.continent_id}
            errorMessage={
              editFormMethods.formState.errors.continent_id?.message
            }
          >
            <Controller
              name="continent_id"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Continent"
                  options={continentOptions}
                  value={
                    continentOptions.find(
                      (option) => option.value == field.value
                    ) || null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Country Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Country Name" />
              )}
            />
          </FormItem>
          <FormItem
            label="ISO Code"
            invalid={!!editFormMethods.formState.errors.iso}
            errorMessage={editFormMethods.formState.errors.iso?.message}
          >
            <Controller
              name="iso"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter ISO Code (e.g., US)" />
              )}
            />
          </FormItem>
          <FormItem
            label="Phone Code"
            invalid={!!editFormMethods.formState.errors.phonecode}
            errorMessage={editFormMethods.formState.errors.phonecode?.message}
          >
            <Controller
              name="phonecode"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Phone Code (e.g., +1)" />
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

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterCountryForm"
              type="submit"
            >
              Apply
            </Button>
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
                  options={continentOptions} // Use fetched continent options
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
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Country"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setCountryToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setCountryToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setCountryToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the country "
          <strong>
            {countryToDelete?.name} ({countryToDelete?.iso})
          </strong>
          "?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default Countries;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
