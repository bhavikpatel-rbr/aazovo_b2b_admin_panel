import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
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
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Tag, Checkbox, Dropdown } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
  TbUsers,
  TbBuilding,
  TbInbox,
  TbUserScan,
  TbColumns,
  TbX,
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
import {
  getDepartmentsAction,
  addDepartmentAction,
  editDepartmentAction,
  deleteDepartmentAction, 
  deleteAllDepartmentsAction, 
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Type for Select options
type SelectOption = {
  value: string | number;
  label: string;
};

// --- Define Department Type ---
export type DepartmentItem = {
  id: string | number;
  name: string;
  status: "Active" | "Inactive";
  totalemployee?: string;
  totaljobpost?: string;
  totalapplication?: string;
  created_at?: string;
  updated_at?: string;
  created_by_user?: { name: string; roles: { display_name: string }[] };
  updated_by_user?: { name: string; roles: { display_name: string }[] };
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// --- Zod Schema for Add/Edit Department Form ---
const departmentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required.")
    .max(100, "Department name cannot exceed 100 characters."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type DepartmentFormData = z.infer<typeof departmentFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
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
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter Utility ---
const CSV_HEADERS_DEPT = [
    "ID",
    "Department Name",
    "Status",
    "Updated By",
    "Updated Role",
    "Updated At",
];
type DepartmentExportItem = Omit<DepartmentItem, "created_at" | "updated_at" | "created_by_user" | "updated_by_user" | "totalemployee" | "totaljobpost" | "totalapplication"> & {
  status: "Active" | "Inactive";
  updated_by_name?: string;
  updated_by_role?: string;
  updated_at_formatted?: string;
};
const CSV_KEYS_DEPT: (keyof DepartmentExportItem)[] = [
  "id",
  "name",
  "status",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportDepartmentsToCsv(filename: string, rows: DepartmentItem[]) {
  if (!rows || !rows.length) {
    return false;
  }
  const transformedRows: DepartmentExportItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    updated_by_name: row.updated_by_user?.name || "N/A",
    updated_by_role: row.updated_by_user?.roles?.[0]?.display_name || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_DEPT.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_DEPT.map((k) => {
          let cell = row[k as keyof DepartmentExportItem];
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
  return false;
}

const ActionColumn = ({
  onEdit,
}: {
  onEdit: () => void;
  onDelete?: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
    </div>
  );
};

type DepartmentsSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const DepartmentsSearch = React.forwardRef<
  HTMLInputElement,
  DepartmentsSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
DepartmentsSearch.displayName = "DepartmentsSearch";

const DepartmentsTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<DepartmentItem>[];
  filteredColumns: ColumnDef<DepartmentItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<DepartmentItem>[]>>;
  activeFilterCount: number;
}) => {
    const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
    const toggleColumn = (checked: boolean, colId: string) => {
      if (checked) {
          const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
          if (originalColumn) {
              setFilteredColumns(prev => {
                  const newCols = [...prev, originalColumn];
                  newCols.sort((a, b) => {
                      const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
                      const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
                      return indexA - indexB;
                  });
                  return newCols;
              });
          }
      } else {
          setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
      }
    };
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow">
                <DepartmentsSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2">
                        <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => {
                            const id = col.id || col.accessorKey as string;
                            return col.header && (
                                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>
                                        {col.header as string}
                                    </Checkbox>
                                </div>
                            );
                        })}
                    </div>
                </Dropdown>
                <Button title="Clear Filters" icon={<TbReload />} onClick={onClearFilters} />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
                    Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
                </Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
    const { filterNames, filterStatus } = filterData;
    if (!filterNames?.length && !filterStatus?.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {filterNames?.map(item => <Tag key={`name-${item.value}`} prefix>Name: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterNames', item.value)} /></Tag>)}
            {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
};

type DepartmentsTableProps = {
  columns: ColumnDef<DepartmentItem>[];
  data: DepartmentItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
};
const DepartmentsTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: DepartmentsTableProps) => (
  <DataTable
    columns={columns}
    data={data}
    loading={loading}
    pagingData={pagingData}
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
    noData={!loading && data.length === 0}
  />
);

const Departments = () => {
  const dispatch = useAppDispatch();
  const { departmentsData = { data: [], counts: {} }, status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DepartmentItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterStatus: [],
  });
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const defaultFormValues: DepartmentFormData = useMemo(
    () => ({ name: "", status: "Active" }),
    []
  );

  useEffect(() => {
    dispatch(getDepartmentsAction());
  }, [dispatch]);

  const addFormMethods = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
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

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  }, [addFormMethods, defaultFormValues]);

  const closeAddDrawer = useCallback(() => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(false);
  }, [addFormMethods, defaultFormValues]);

  const onAddDepartmentSubmit = useCallback(
    async (data: DepartmentFormData) => {
      setIsSubmitting(true);
      try {
        const payload = { name: data.name, status: data.status };
        await dispatch(addDepartmentAction(payload)).unwrap();
        toast.push(
          <Notification
            title="Department Added"
            type="success"
            duration={2000}
          >{`Department "${data.name}" added.`}</Notification>
        );
        closeAddDrawer();
        dispatch(getDepartmentsAction());
      } catch (error: any) {
        toast.push(
          <Notification title="Failed to Add" type="danger" duration={3000}>
            {error.message || "Could not add department."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, closeAddDrawer]
  );

  const openEditDrawer = useCallback(
    (item: DepartmentItem) => {
      setEditingItem(item);
      editFormMethods.reset({
        name: item.name,
        status: item.status || "Active",
      });
      setIsEditDrawerOpen(true);
    },
    [editFormMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    editFormMethods.reset(defaultFormValues);
    setIsEditDrawerOpen(false);
  }, [editFormMethods, defaultFormValues]);

  const onEditDepartmentSubmit = useCallback(
    async (data: DepartmentFormData) => {
      if (!editingItem?.id) return;
      setIsSubmitting(true);
      try {
        const payload = {
          id: editingItem.id,
          name: data.name,
          status: data.status,
        };
        await dispatch(editDepartmentAction(payload)).unwrap();
        toast.push(
          <Notification
            title="Department Updated"
            type="success"
            duration={2000}
          >{`Department "${data.name}" updated.`}</Notification>
        );
        closeEditDrawer();
        dispatch(getDepartmentsAction());
      } catch (error: any) {
        toast.push(
          <Notification title="Failed to Update" type="danger" duration={3000}>
            {error.message || "Could not update department."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, editingItem, closeEditDrawer]
  );

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({
        filterNames: data.filterNames || [],
        filterStatus: data.filterStatus || [],
      });
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [closeFilterDrawer, handleSetTableData]
  );
  
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [], filterStatus: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1, query: "" });
    dispatch(getDepartmentsAction());
    setIsFilterDrawerOpen(false);
  }, [filterFormMethods, dispatch, handleSetTableData]);

  const handleCardClick = (status: 'Active' | 'Inactive' | 'all') => {
      onClearFilters();
      if(status !== 'all') {
          const statusOption = statusOptions.find(opt => opt.value === status);
          if(statusOption) {
            setFilterCriteria({ filterStatus: [statusOption] });
          }
      }
  };

  const handleRemoveFilter = (key: keyof FilterFormData, value: string) => {
    setFilterCriteria(prev => {
        const newFilters = { ...prev };
        const currentValues = prev[key] as { value: string; label: string }[] | undefined;
        if (currentValues) {
            const newValues = currentValues.filter(item => item.value !== value);
            (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
        }
        return newFilters;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  };

  const departmentNameOptions = useMemo(() => {
    const sourceData: DepartmentItem[] = Array.isArray(departmentsData?.data)
      ? departmentsData?.data
      : [];
    const uniqueNames = new Set(sourceData.map((item) => item.name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [departmentsData?.data]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataFromStore: DepartmentItem[] = Array.isArray(departmentsData?.data)
      ? departmentsData.data
      : [];
    const sourceData: DepartmentItem[] = sourceDataFromStore.map(item => ({
        ...item,
        status: item.status || "Inactive",
    }));
    let processedData: DepartmentItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedFilterNames.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterStatus?.length) {
      const statuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        statuses.includes(item.status)
      );
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.trim().toLowerCase() ?? "").includes(query) ||
          (item.status?.trim().toLowerCase() ?? "").includes(query) ||
          String(item.id ?? "")
            .trim()
            .toLowerCase()
            .includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      ["id", "name", "status", "updated_at"].includes(key) &&
      processedData.length > 0
    ) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "updated_at") {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return order === "asc" ? dateA - dateB : dateB - dateA;
        } else if (key === "status") {
          aValue = a.status ?? "";
          bValue = b.status ?? "";
        } else {
          aValue = a[key as keyof Omit<DepartmentItem, 'created_by_user' | 'updated_by_user'>] ?? "";
          bValue = b[key as keyof Omit<DepartmentItem, 'created_by_user' | 'updated_by_user'>] ?? "";
        }
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
  }, [departmentsData?.data, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length;
  }, [filterCriteria]);

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
    const moduleName = "Departments";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `departments_export_${timestamp}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );

      const exportSuccess = exportDepartmentsToCsv(fileName, allFilteredAndSortedData);
      if (exportSuccess) {
        toast.push(
            <Notification title="Export Successful" type="success">
                Data exported to {fileName}.
            </Notification>
        );
      } else {
         if(allFilteredAndSortedData && allFilteredAndSortedData.length > 0) { 
            toast.push(
                <Notification title="Export Failed" type="danger">
                Browser does not support this feature.
                </Notification>
            );
         }
      }
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
        >
          {error.message || "Could not submit export reason."}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

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

  const columns: ColumnDef<DepartmentItem>[] = useMemo(
    () => [
      { header: "Department Name", accessorKey: "name", enableSorting: true, size: 200 },
      
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => {
          const status = props.row.original.status;
          return (
            <Tag
              className={classNames(
                "capitalize font-semibold whitespace-nowrap",
                {
                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500":
                    status === "Active",
                  "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500":
                    status === "Inactive",
                }
              )}
            >
              {status}
            </Tag>
          );
        },
      },
      {
        header: "Total Employee",
        accessorKey: "totalemployee",
        enableSorting: false,
        size: 120,
        cell: (props) => <span>{props.row.original.totalemployee || 0}</span>,
      },
      {
        header: "Total Job Post",
        accessorKey: "totaljobpost",
        enableSorting: false,
        size: 120,
        cell: (props) => <span>{props.row.original.totaljobpost || 0}</span>,
      },
      {
        header: "Total Application",
        accessorKey: "totalapplication",
        enableSorting: false,
        size: 130,
        cell: (props) => <span>{props.row.original.totalapplication || 0}</span>,
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 150,
        cell: (props) => {
          const { updated_at, updated_by_user } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", { month: "long" })} ${new Date(
                updated_at
              ).getFullYear()}, ${new Date(updated_at).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_user?.name || "N/A"}
                {updated_by_user?.roles?.[0]?.display_name && (
                  <>
                    <br />
                    <b>{updated_by_user.roles[0].display_name}</b>
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
        header: "Actions",
        id: "action",
        size: 80,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer]
  );
  
  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<DepartmentItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Departments</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 gap-4">
            <Tooltip title="Click to show all departments"><div onClick={() => handleCardClick('all')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-3" className="rounded-md border border-blue-200 dark:border-blue-700">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200">
                <TbBuilding size={24} />
              </div>
              <div>
                <h6 className="text-blue-500 dark:text-blue-200">{departmentsData?.counts?.departments || 0}</h6>
                <span className="font-semibold text-xs">Total Departments</span>
              </div>
            </Card></div></Tooltip>
            <Tooltip title="Total employees across all departments"><Card bodyClass="flex gap-2 p-3" className="rounded-md border border-violet-200 dark:border-violet-700 cursor-default">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200">
                <TbUserScan size={24} />
              </div>
              <div>
                <h6 className="text-violet-500 dark:text-violet-200">{departmentsData?.counts?.employees || 0}</h6>
                <span className="font-semibold text-xs">Total Employees</span>
              </div>
            </Card></Tooltip>
            <Tooltip title="Total jobs posted across all departments"><Card bodyClass="flex gap-2 p-3" className="rounded-md border border-pink-200 dark:border-pink-700 cursor-default">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 dark:bg-pink-500/20 text-pink-500 dark:text-pink-200">
                <TbInbox size={24} />
              </div>
              <div>
                <h6 className="text-pink-500 dark:text-pink-200">{departmentsData?.counts?.job_posts || 0}</h6>
                <span className="font-semibold text-xs">Jobs Posted</span>
              </div>
            </Card></Tooltip>
            <Tooltip title="Total applicants for all jobs"><Card bodyClass="flex gap-2 p-3" className="rounded-md border border-green-200 dark:border-green-700 cursor-default">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-200">
                <TbUsers size={24} />
              </div>
              <div>
                <h6 className="text-green-500 dark:text-green-200">{departmentsData?.counts?.applicants || 0}</h6>
                <span className="font-semibold text-xs">Total Applicants</span>
              </div>
            </Card></Tooltip>
          </div>

          <div className="mb-4">
            <DepartmentsTableTools
                onSearchChange={handleSearchChange}
                onFilter={openFilterDrawer}
                onExport={handleOpenExportReasonModal}
                onClearFilters={onClearFilters}
                columns={columns}
                filteredColumns={filteredColumns}
                setFilteredColumns={setFilteredColumns}
                activeFilterCount={activeFilterCount}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4">
            <DepartmentsTable
              columns={filteredColumns}
              data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting}
              pagingData={{
                total,
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
        {
          formMethods: addFormMethods,
          onSubmit: onAddDepartmentSubmit,
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          title: "Add Department",
          formId: "addDepartmentForm",
          submitText: "Adding...",
          saveText: "Save",
          isEdit: false,
        },
        {
          formMethods: editFormMethods,
          onSubmit: onEditDepartmentSubmit,
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          title: "Edit Department",
          formId: "editDepartmentForm",
          submitText: "Saving...",
          saveText: "Save",
          isEdit: true,
        },
      ].map((drawerProps) => (
        <Drawer
          key={drawerProps.formId}
          title={drawerProps.title}
          isOpen={drawerProps.isOpen}
          onClose={drawerProps.closeFn}
          onRequestClose={drawerProps.closeFn}
          width={480}
          bodyClass="relative"
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
                  !drawerProps.formMethods.formState.isValid || isSubmitting
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
            className="flex flex-col gap-4 relative pb-28"
          >
            <FormItem
              label={
                <div>Department Name<span className="text-red-500"> * </span></div>
              }
              invalid={!!drawerProps.formMethods.formState.errors.name}
              errorMessage={drawerProps.formMethods.formState.errors.name?.message as string | undefined}
            >
              <Controller
                name="name"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Department Name" />
                )}
              />
            </FormItem>
            <FormItem
              label={
                <div>Status<span className="text-red-500"> * </span></div>
              }
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
                    value={statusOptions.find((option) => option.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                  />
                )}
              />
            </FormItem>
          </Form>
          {drawerProps.isEdit && editingItem && (
             <div className="absolute bottom-[3%] w-[90%]">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                  <p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p>
                  <p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p>
                </div>
                <div className="text-right">
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>
                    {editingItem.created_at
                      ? `${new Date(editingItem.created_at).getDate()} ${new Date(editingItem.created_at).toLocaleString("en-US", { month: "short" })} ${new Date(editingItem.created_at).getFullYear()}, ${new Date(editingItem.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                      : "N/A"}
                  </span>
                  <br />
                  <span className="font-semibold">Updated At:</span>{" "}
                  <span>
                    {editingItem.updated_at
                      ? `${new Date(editingItem.updated_at).getDate()} ${new Date(editingItem.updated_at).toLocaleString("en-US", { month: "short" })} ${new Date(editingItem.updated_at).getFullYear()}, ${new Date(editingItem.updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
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
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button>
            <Button size="sm" variant="solid" form="filterDepartmentForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form
          id="filterDepartmentForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Department Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select department names..."
                  options={departmentNameOptions}
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
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{
          disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
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
    </>
  );
};

export default Departments;