// src/views/your-path/JobDepartment.tsx

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
import Select from "@/components/ui/Select"; // For filter, if needed later
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
  TbBuildingSkyscraper, // Icon for Job Department (example)
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
  getJobDepartmentsAction, // Placeholder for your actual action
  addJobDepartmentAction, // Placeholder
  editJobDepartmentAction, // Placeholder
  deleteJobDepartmentAction, // Placeholder
  deleteAllJobDepartmentsAction, // Placeholder
} from "@/reduxtool/master/middleware"; // Adjust path as necessary
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust as necessary

// --- Define JobDepartmentItem Type (Matches your API response) ---
export type JobDepartmentItem = {
  id: string | number;
  name: string;
  status: "Active" | "Inactive" | string; // API returns 'Active', allow string for flexibility
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// --- Zod Schema for Add/Edit Form (Only Name) ---
const jobDepartmentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required.")
    .max(100, "Department name cannot exceed 100 characters."),
  // Status is handled implicitly, not part of the form schema visible to user
});
type JobDepartmentFormData = z.infer<typeof jobDepartmentFormSchema>;

// --- Zod Schema for Filter Form (Example: by name) ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_JOB_DEPT = ["ID", "Name", "Status"]; // Include status in export
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
    <div className="flex items-center justify-center gap-3">
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
      <Tooltip title="Delete Job Department">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => (
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
        title={`Delete ${selectedItems.length} Job Department${
          selectedItems.length > 1 ? "s" : ""
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
    jobDepartmentsData = [], // Ensure this is provided by masterSelector
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
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset({ name: "" });
    setEditingItem(null); // Ensure editingItem is null for add mode
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: JobDepartmentItem) => {
      setEditingItem(item);
      formMethods.reset({ name: item.name });
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
      // For editing, include the ID and existing status
      payload = {
        id: editingItem.id,
        name: data.name,
      };
    } else {
      // For adding, set status to 'Active' by default
      payload = {
        name: data.name,
      };
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
      setFilterCriteria({ filterNames: data.filterNames || [] });
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

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

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.toLowerCase() ?? "").includes(query) ||
          String(item.id).toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && ["id", "name"].includes(String(key))) {
      // Only ID and Name are sortable in the table
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

    const dataToExport = [...processedData]; // For CSV export, includes status
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

  // Columns for Listing: ID, Name
  const columns: ColumnDef<JobDepartmentItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      { header: "Department Name", accessorKey: "name", enableSorting: true },
      {
        header: "Actions",
        id: "action",
        meta: { headerClass: "text-center", cellClass: "text-center" },
        size: 100,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick] // These are stable due to useCallback
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              <TbBuildingSkyscraper /> Job Departments
            </h3>
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
              // noData={!loading && pageData.length === 0}
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
                : "Save Changes"}
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
            label="Department Name"
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
          {/* Status field is not rendered in the form */}
        </Form>
      </Drawer>

      {/* Filter Drawer (Simplified to filter by name) */}
      <Drawer
        title="Filter Job Departments"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" onClick={onClearFilters} type="button">
              Clear All
            </Button>
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
          <FormItem label="Filter by Department Name(s)">
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

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
