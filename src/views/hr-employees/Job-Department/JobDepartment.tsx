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
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbBuildingSkyscraper,
  TbReload,
  TbBuilding,
  TbBuildingCog,
  TbBuildingOff,
  TbUsers,
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
import { shallowEqual, useSelector } from "react-redux";
import {
  getJobDepartmentsAction,
  addJobDepartmentAction,
  editJobDepartmentAction,
  deleteJobDepartmentAction,
  deleteAllJobDepartmentsAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define JobDepartmentItem Type (Matches your API response) ---
export type JobDepartmentItem = {
  id: string | number;
  name: string;
  status: "Active" | "Inactive" | string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// --- Zod Schema for Add/Edit Form ---
const jobDepartmentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required.")
    .max(100, "Department name cannot exceed 100 characters."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type JobDepartmentFormData = z.infer<typeof jobDepartmentFormSchema>;

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

// --- CSV Exporter Utility ---
const CSV_HEADERS_JOB_DEPT = ["ID", "Name", "Status"];
const CSV_KEYS_JOB_DEPT: (keyof JobDepartmentItem)[] = ["id", "name", "status"];

function exportJobDepartmentsToCsv(
  filename: string,
  rows: JobDepartmentItem[]
) {
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
    CSV_HEADERS_JOB_DEPT.join(separator) +
    "\n" +
    rows
      .map((row) =>
        CSV_KEYS_JOB_DEPT.map((k) => {
          let cell = row[k];
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
    <Notification title="Export Failed" type="danger" duration={3000}>
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- ActionColumn Component ---
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
      <Tooltip title="Edit Job Department">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* <Tooltip title="Delete Job Department"> ... </Tooltip> */}
    </div>
  );
};

// --- Search Component ---
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

// --- TableTools Component ---
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<JobDepartmentItem>[];
  filteredColumns: ColumnDef<JobDepartmentItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<JobDepartmentItem>[]>>;
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
                <ItemSearch onInputChange={onSearchChange} />
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
                <Tooltip title="Clear Filters">
                    <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
                </Tooltip>
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

// --- SelectedFooter Component ---
type JobDepartmentsSelectedFooterProps = {
  selectedItems: JobDepartmentItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const JobDepartmentsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: JobDepartmentsSelectedFooterProps) => {
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
              <span>
                Department{selectedItems.length > 1 ? "s" : ""} selected
              </span>
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
        title={`Delete ${selectedItems.length} Job Department${selectedItems.length > 1 ? "s" : ""
          }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected job department
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Component: JobDepartment ---
const JobDepartment = () => {
  const dispatch = useAppDispatch();
  const {
    jobDepartmentsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobDepartmentItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JobDepartmentItem | null>(
    null
  );
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
  const [selectedItems, setSelectedItems] = useState<JobDepartmentItem[]>([]);

  useEffect(() => {
    dispatch(getJobDepartmentsAction());
  }, [dispatch]);

  const formMethods = useForm<JobDepartmentFormData>({
    resolver: zodResolver(jobDepartmentFormSchema),
    defaultValues: { name: "", status: "Active" },
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset({ name: "", status: "Active" });
    setEditingItem(null); 
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: JobDepartmentItem) => {
      setEditingItem(item);
      formMethods.reset({ name: item.name, status: item.status as "Active" | "Inactive" });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: JobDepartmentFormData) => {
    setIsSubmitting(true);
    let payload;

    if (editingItem) {
      payload = { id: editingItem.id, ...data };
    } else {
      payload = data;
    }

    try {
      if (editingItem) {
        await dispatch(editJobDepartmentAction(payload)).unwrap();
        toast.push(
          <Notification
            title="Job Department Updated"
            type="success"
            duration={2000}
          >
            Department updated.
          </Notification>
        );
        closeEditDrawer();
      } else {
        await dispatch(addJobDepartmentAction(payload)).unwrap();
        toast.push(
          <Notification
            title="Job Department Added"
            type="success"
            duration={2000}
          >
            New department added.
          </Notification>
        );
        closeAddDrawer();
      }
      dispatch(getJobDepartmentsAction());
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
      console.error("Job Department Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((item: JobDepartmentItem) => {
    if (!item.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: ID missing.
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
      await dispatch(
        deleteJobDepartmentAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Job Department Deleted"
          type="success"
          duration={2000}
        >{`Department "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getJobDepartmentsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message || "Could not delete."}
        </Notification>
      );
      console.error("Delete Error:", error);
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
        deleteAllJobDepartmentsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >{`${validItems.length} department(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getJobDepartmentsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete."}
        </Notification>
      );
      console.error("Bulk Delete Error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({ filterNames: data.filterNames || [], filterStatus: data.filterStatus || [] });
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [], filterStatus: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    closeFilterDrawer();
  }, [filterFormMethods]);

  const handleCardClick = (status?: 'Active' | 'Inactive' | 'all') => {
      onClearFilters();
      if(status && status !== 'all') {
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

  const jobDepartmentNameOptions = useMemo(() => {
    const sourceData: JobDepartmentItem[] = Array.isArray(jobDepartmentsData)
      ? jobDepartmentsData
      : [];
    const uniqueNames = new Set(sourceData.map((item) => item.name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [jobDepartmentsData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: JobDepartmentItem[] = Array.isArray(jobDepartmentsData)
      ? jobDepartmentsData
      : [];
    let processedData: JobDepartmentItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedFilterNames.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }

    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
        const selectedStatuses = filterCriteria.filterStatus.map(opt => opt.value);
        processedData = processedData.filter(item => selectedStatuses.includes(item.status));
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.toLowerCase() ?? "").includes(query) ||
          String(item.id).toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && ["id", "name", "status"].includes(String(key))) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof JobDepartmentItem];
        const bVal = b[key as keyof JobDepartmentItem];
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
  }, [jobDepartmentsData, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length;
  }, [filterCriteria]);


  const handleExportData = useCallback(() => {
    const success = exportJobDepartmentsToCsv(
      "job_departments_export.csv",
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
    (checked: boolean, row: JobDepartmentItem) => {
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
    (checked: boolean, currentRows: Row<JobDepartmentItem>[]) => {
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

  const columns: ColumnDef<JobDepartmentItem>[] = useMemo(
    () => [
      { header: "Department Name", accessorKey: "name", enableSorting: true },
      { header: "No. of Jobs", accessorKey: "jobsCount", enableSorting: false, cell: props => <div className="">12</div> },
      { header: "No. of Posts", accessorKey: "postsCount", enableSorting: false, cell: props => <div className="">18</div> },
      { header: "No. of Applicants", accessorKey: "applicantsCount", enableSorting: false, cell: props => <div className="">67</div> },
      { header: "Status", accessorKey: "status", enableSorting: true, size: 100,
        cell: (props) => {
          const status = props.row.original.status
          return (
            <Tag className={classNames('capitalize', {
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100': status === 'Active',
              'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100': status === 'Inactive'
            })}>{status}</Tag>
          )
        }
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        size: 100,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick]
  );
  
  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<JobDepartmentItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Job Departments</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>

          <div className="grid grid-cols-4 mb-4 gap-2">
            <Tooltip title="Click to show all departments"><div onClick={() => handleCardClick('all')} className={cardClass}><Card bodyClass={cardBodyClass} className="border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbBuilding size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">12</h6>
                <span className="font-semibold text-xs">Total Departments</span>
              </div>
            </Card></div></Tooltip>
            <Tooltip title="Departments with active jobs"><Card bodyClass={cardBodyClass} className="rounded-md border border-violet-200 cursor-default">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbBuildingCog size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">4</h6>
                <span className="font-semibold text-xs">Departments with jobs</span>
              </div>
            </Card></Tooltip>
            <Tooltip title="Departments with no jobs posted"><Card bodyClass={cardBodyClass} className="rounded-md border border-red-200 cursor-default">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbBuildingOff size={24} />
              </div>
              <div>
                <h6 className="text-red-500">8</h6>
                <span className="font-semibold text-xs">No jobs posted</span>
              </div>
            </Card></Tooltip>
            <Tooltip title="Total applicants across all departments"><Card bodyClass={cardBodyClass} className="rounded-md border border-green-200 cursor-default">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbUsers size={24} />
              </div>
              <div>
                <h6 className="text-green-500">34</h6>
                <span className="font-semibold text-xs">Total Applicants</span>
              </div>
            </Card></Tooltip>
          </div>
          
          <div className="mb-4">
            <ItemTableTools
              onSearchChange={handleSearchChange}
              onFilter={openFilterDrawer}
              onExport={handleExportData}
              onClearFilters={onClearFilters}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4">
            <DataTable
              columns={filteredColumns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <JobDepartmentsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      <Drawer
        title={editingItem ? "Edit Job Department" : "Add New Job Department"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
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
              form="jobDepartmentForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="jobDepartmentForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label={<div>Department Name<span className="text-red-500"> * </span></div>}
            invalid={!!formMethods.formState.errors.name}
            errorMessage={formMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={formMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Department Name" />
              )}
            />
          </FormItem>
          <FormItem
            label={<div>Status<span className="text-red-500"> * </span></div>}
            invalid={!!formMethods.formState.errors.status}
            errorMessage={formMethods.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={formMethods.control}
              render={({ field }) => (
                <Select  
                  {...field} 
                  placeholder="Select Status" 
                  options={statusOptions}
                  value={statusOptions.find(o => o.value === field.value) || null}
                  onChange={(opt) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
        </Form>
        {isEditDrawerOpen && editingItem && (
        <div className="absolute bottom-[14%] w-[88%]">
          <div className="flex justify-between gap-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div className="">
              <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
              <p className="text-sm font-semibold">Tushar Joshi</p>
              <p>System Admin</p>
            </div>
            <div className="w-[210px]"><br />
              <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br />
              <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
            </div>
          </div>
        </div>
        )}
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
                onClick={onClearFilters}
                type="button"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterJobDepartmentForm"
                type="submit"
              >
                Apply
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterJobDepartmentForm"
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
                  options={jobDepartmentNameOptions}
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
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Job Department"
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
          Are you sure you want to delete the job department "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default JobDepartment;