// src/views/your-path/DesignationListing.tsx

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
import { Card, Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
  TbUsers,
  TbPresentation,
  TbPresentationAnalytics,
  TbPresentationOff,
  TbUserX,
  TbUser,
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
import {
  getDesignationsAction,
  addDesignationAction,
  editDesignationAction,
  deleteDesignationAction,
  deleteAllDesignationsAction,
  getEmployeesAction,
  getDepartmentsAction,
  submitExportReasonAction, // <-- ADDED
} from "@/reduxtool/master/middleware";
import { useSelector, shallowEqual } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import classNames from "@/utils/classNames";

// --- Define Types ---
export type DesignationItem = {
  id: string | number;
  name: string;
  department?: { id: number; name: string };
  reporting_manager?: { id: number; name: string };
  total_employees?: number;
  status?: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
  updated_by_user?: {
    name: string;
    roles: { display_name: string }[];
  } | null;
};
export type GeneralListItem = { id: string | number; name: string };
export type SelectOption = { value: string; label: string };

const STATUS_OPTIONS: SelectOption[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const statusColors: Record<string, string> = {
  Active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- Zod Schema for Add/Edit Designation Form ---
const designationFormSchema = z.object({
  name: z
    .string()
    .min(1, "Designation name is required.")
    .max(150, "Designation name cannot exceed 150 characters."),
  department_id: z.string().min(1, "Department is required."),
  reporting_manager: z.string().min(1, "Reporting person is required."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type DesignationFormData = z.infer<typeof designationFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DES = [
  "ID",
  "Designation Name",
  "Department",
  "Reporting To",
  "Status",
  "Total Employees",
  "Date Created",
  "Last Updated By",
  "Last Updated At",
];
type DesignationExportItem = Omit<
  DesignationItem,
  "created_at" | "updated_at"
> & {
  created_at_formatted?: string;
  updated_at_formatted?: string;
};
const CSV_KEYS_DES: (keyof DesignationExportItem)[] = [
  "id",
  "name",
  "department",
  "reporting_manager",
  "status",
  "total_employees",
  "created_at_formatted",
  "updated_by_name",
  "updated_at_formatted",
];

function exportDesignationsToCsv(filename: string, rows: DesignationItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows: DesignationExportItem[] = rows.map((row) => ({
    ...row,
    department: row.department?.name || "N/A",
    reporting_manager: row.reporting_manager?.name || "N/A",
    created_at_formatted: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_DES.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_DES.map((k) => {
          let cell = row[k as keyof DesignationExportItem];
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

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip> */}
    </div>
  );
};

const DesignationsSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));

const DesignationsTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <DesignationsSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button
        icon={<TbReload />}
        onClick={onClearFilters}
        title="Clear Filters"
      />
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

const DesignationsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  disabled,
}: {
  selectedItems: DesignationItem[];
  onDeleteSelected: () => void;
  disabled?: boolean;
}) => {
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
                Designation{selectedItems.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
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
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Designation${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={disabled}
      >
        <p>
          Are you sure you want to delete the selected designation
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

const DesignationListing = () => {
  const dispatch = useAppDispatch();
  const {
    designationsData: rawDesignationsData = {},
    Employees = [],
    departmentsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DesignationItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DesignationItem | null>(
    null
  );

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<DesignationItem[]>([]);

  useEffect(() => {
    dispatch(getDesignationsAction());
    dispatch(getEmployeesAction());
    dispatch(getDepartmentsAction());
  }, [dispatch]);

  const designationsData = useMemo(() => {
    const data = rawDesignationsData?.data;
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      ...item,
      updated_by_name: item.updated_by_user?.name || item.updated_by_name,
      updated_by_role:
        item.updated_by_user?.roles?.[0]?.display_name || item.updated_by_role,
    }));
  }, [rawDesignationsData?.data]);

  const employeeOptions: SelectOption[] = useMemo(
    () =>
      Array.isArray(Employees)
        ? Employees.map((emp: GeneralListItem) => ({
            value: String(emp.id),
            label: emp.name,
          }))
        : [],
    [Employees]
  );
  const departmentOptions: SelectOption[] = useMemo(
    () =>
      Array.isArray(departmentsData?.data)
        ? departmentsData?.data.map((dep: GeneralListItem) => ({
            value: String(dep.id),
            label: dep.name,
          }))
        : [],
    [departmentsData?.data]
  );

  const formMethods = useForm<DesignationFormData>({
    resolver: zodResolver(designationFormSchema),
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
    formMethods.reset({
      name: "",
      department_id: "",
      reporting_manager: undefined,
      status: "Active",
    });
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: DesignationItem) => {
      console.log("item.reporting_manager?.id ", item.reporting_manager )
      setEditingItem(item);
      formMethods.reset({
        name: item.name,
        department_id: String(item.department?.id || ""),
        reporting_manager: item.reporting_manager || "",
        status: item.status || "Active",
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = useCallback(
    async (data: DesignationFormData) => {
      setIsSubmitting(true);
      try {
        if (editingItem) {
          await dispatch(
            editDesignationAction({ id: editingItem.id, ...data })
          ).unwrap();
          toast.push(
            <Notification
              title="Designation Updated"
              type="success"
            >{`Designation "${data.name}" updated.`}</Notification>
          );
          closeEditDrawer();
        } else {
          await dispatch(addDesignationAction(data)).unwrap();
          toast.push(
            <Notification
              title="Designation Added"
              type="success"
            >{`Designation "${data.name}" added.`}</Notification>
          );
          closeAddDrawer();
        }
        dispatch(getDesignationsAction());
      } catch (error: any) {
        toast.push(
          <Notification
            title={editingItem ? "Update Failed" : "Add Failed"}
            type="danger"
          >
            {error?.message || "An error occurred."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, editingItem, closeAddDrawer, closeEditDrawer]
  );

  const handleDeleteClick = useCallback((item: DesignationItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      // await dispatch(deleteDesignationAction({ id: itemToDelete.id })).unwrap();
      toast.push(
        <Notification
          title="Designation Deleted"
          type="success"
        >{`Designation "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
      dispatch(getDesignationsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {error?.message || "Could not delete designation."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      // await dispatch(
      //   deleteAllDesignationsAction({ ids: idsToDelete.join(",") })
      // ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
        >{`${idsToDelete.length} designation(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getDesignationsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {error?.message || "Failed to delete selected designations."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({ filterNames: data.filterNames || [] });
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [closeFilterDrawer, handleSetTableData]
  );
  const onClearFilters = useCallback(() => {
    filterFormMethods.reset({});
    setFilterCriteria({});
    handleSetTableData({ pageIndex: 1, query: "" });
    dispatch(getDesignationsAction());
    setIsFilterDrawerOpen(false);
  }, [filterFormMethods, handleSetTableData]);

  const designationNameOptions = useMemo(
    () =>
      Array.from(new Set(designationsData.map((item) => item.name))).map(
        (name) => ({ value: name, label: name })
      ),
    [designationsData]
  );

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: DesignationItem[] = cloneDeep(designationsData);
    if (filterCriteria.filterNames?.length) {
      const selectedNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedNames.includes(item.name.toLowerCase())
      );
    }
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.department?.name?.toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = a[key as keyof DesignationItem];
        let bVal: any = b[key as keyof DesignationItem];
        if (key === "created_at" || key === "updated_at") {
          const dateA = aVal ? new Date(aVal).getTime() : 0;
          const dateB = bVal ? new Date(bVal).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return {
      pageData: processedData.slice(
        (tableData.pageIndex - 1) * tableData.pageSize,
        tableData.pageIndex * tableData.pageSize
      ),
      total: processedData.length,
      allFilteredAndSortedData: processedData,
    };
  }, [designationsData, tableData, filterCriteria]);

  // --- EXPORT MODAL HANDLERS ---
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
    const moduleName = "Designations";
    const date = new Date().toISOString().split("T")[0];
    const fileName = `designations_${date}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
      const success = exportDesignationsToCsv(
        fileName,
        allFilteredAndSortedData
      );
      if (success) {
        toast.push(
          <Notification title="Data Exported" type="success">
            Designations exported successfully.
          </Notification>
        );
      }
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Operation Failed"
          type="danger"
          message={error.message || "Could not complete export."}
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
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
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: DesignationItem) =>
      setSelectedItems((prev) =>
        checked ? [...prev, row] : prev.filter((item) => item.id !== row.id)
      ),
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<DesignationItem>[]) => {
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

  const columns: ColumnDef<DesignationItem>[] = useMemo(
    () => [
      { header: "Designation", accessorKey: "name", enableSorting: true },
      {
        header: "Department",
        accessorKey: "department.name",
        enableSorting: true,
        cell: (props) => props.row.original.department?.name || "N/A",
      },
      {
        header: "Reporting to",
        accessorKey: "reporting_manager.name",
        enableSorting: true,
        cell: (props) =>
          props.row.original.reporting_manager_user?.name || "N/A",
      },
      {
        header: "Total Employees",
        accessorKey: "total_employees",
        enableSorting: true,
        cell: (props) => props.row.original.total_employees ?? 0,
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => (
          <Tag
            className={classNames(
              "capitalize",
              statusColors[props.getValue<string>()]
            )}
          >
            {props.getValue<string>() || "N/A"}
          </Tag>
        ),
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 170,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
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
                {updated_by_name || "N/A"}
                {updated_by_role && (
                  <>
                    <br />
                    <b>{updated_by_role}</b>
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
        size: 120,
        meta: { HeaderClass: "text-center" },
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

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <>
      <FormItem
        label={
          <div>
            Designation Name<span className="text-red-500"> *</span>
          </div>
        }
        invalid={!!currentFormMethods.formState.errors.name}
        errorMessage={currentFormMethods.formState.errors.name?.message}
      >
        <Controller
          name="name"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input {...field} placeholder="Enter Designation Name" />
          )}
        />
      </FormItem>
      <FormItem
        label={
          <div>
            Department<span className="text-red-500"> *</span>
          </div>
        }
        invalid={!!currentFormMethods.formState.errors.department_id}
        errorMessage={
          currentFormMethods.formState.errors.department_id?.message
        }
      >
        <Controller
          name="department_id"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select Department"
              options={departmentOptions}
              value={departmentOptions.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label={
          <div>
            Reporting To<span className="text-red-500"> *</span>
          </div>
        }
        invalid={!!currentFormMethods.formState.errors.reporting_manager}
        errorMessage={
          currentFormMethods.formState.errors.reporting_manager?.message
        }
      >
        <Controller
          name="reporting_manager"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select Reporting Person"
              options={employeeOptions}
              value={employeeOptions.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label={
          <div>
            Status<span className="text-red-500"> *</span>
          </div>
        }
        invalid={!!currentFormMethods.formState.errors.status}
        errorMessage={currentFormMethods.formState.errors.status?.message}
      >
        <Controller
          name="status"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select Status"
              options={STATUS_OPTIONS}
              value={STATUS_OPTIONS.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
    </>
  );

  const tableIsLoading =
    masterLoadingStatus === "loading" || isSubmitting || isDeleting;
  const counts = rawDesignationsData?.counts || {};

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Designations</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={tableIsLoading}
            >
              Add New
            </Button>
          </div>

          <div className="grid grid-cols-6 mb-4 gap-2">
            {[
              {
                icon: TbPresentation,
                color: "blue",
                label: "Total",
                count: counts.total,
              },
              {
                icon: TbPresentationAnalytics,
                color: "violet",
                label: "Active",
                count: counts.active,
              },
              {
                icon: TbPresentationOff,
                color: "pink",
                label: "Inactive",
                count: counts.inactive,
              },
              {
                icon: TbUsers,
                color: "orange",
                label: "Total Emp.",
                count: counts.total_employees,
              },
              {
                icon: TbUser,
                color: "green",
                label: "Active Emp.",
                count: counts.active_employees,
              },
              {
                icon: TbUserX,
                color: "red",
                label: "Inactive Emp.",
                count: counts.inactive_employees,
              },
            ].map((card, index) => (
              <Card
                key={index}
                bodyClass="flex gap-2 p-2"
                className={`rounded-md border border-${card.color}-200`}
              >
                <div
                  className={`h-12 w-12 rounded-md flex items-center justify-center bg-${card.color}-100 text-${card.color}-500`}
                >
                  <card.icon size={24} />
                </div>
                <div>
                  <h6 className={`text-${card.color}-500`}>
                    {card.count ?? "..."}
                  </h6>
                  <span className="font-semibold text-xs">{card.label}</span>
                </div>
              </Card>
            ))}
          </div>

          <DesignationsTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4 flex-grow overflow-auto">
            <DataTable
              columns={columns}
              data={pageData}
              loading={tableIsLoading}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex,
                pageSize: tableData.pageSize,
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
              noData={!tableIsLoading && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <DesignationsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        disabled={tableIsLoading}
      />

      <Drawer
        title="Add Designation"
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
              form="designationForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="designationForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-y-6"
        >
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Drawer
        title="Edit Designation"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        width={480}
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
              form="designationForm"
              type="submit"
              loading={isSubmitting}
              disabled={
                !formMethods.formState.isValid ||
                isSubmitting ||
                !formMethods.formState.isDirty
              }
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="designationForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-y-6 relative pb-28"
        >
          {renderDrawerForm(formMethods)}
          {editingItem && (
            <div className="absolute bottom-0 w-full">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="font-semibold text-primary">Latest Update:</b>
                  <br />
                  <p className="text-sm font-semibold">
                    {editingItem.updated_by_name || "N/A"}
                  </p>
                  <p>{editingItem.updated_by_role || "N/A"}</p>
                </div>
                <div className="text-right">
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
              form="filterDesignationForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterDesignationForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem label="Designation Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select names..."
                  options={designationNameOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Designation"
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
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the designation "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>

      {/* --- EXPORT REASON MODAL --- */}
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Exporting Designations"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportDesignationsReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
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

export default DesignationListing;
