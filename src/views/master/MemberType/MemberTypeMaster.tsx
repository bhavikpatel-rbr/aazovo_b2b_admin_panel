// src/views/your-path/MemberTypeMaster.tsx

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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
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
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  // === NEW MEMBER TYPE ACTIONS ===
  getMemberTypeAction,    // Placeholder - replace with your actual action
  addMemberTypeAction,     // Placeholder - replace with your actual action
  editMemberTypeAction,    // Placeholder - replace with your actual action
  // ==============================
  submitExportReasonAction, // Assuming this can be reused
} from "@/reduxtool/master/middleware"; // Adjust path as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path as needed

// Type for Select options
type SelectOption = {
  value: string | number;
  label: string;
};

// --- Define MemberTypeItem Type ---
export type MemberTypeItem = {
  id: string | number;
  name: string;
  status: "Active" | "Inactive";
  created_at?: string; // ISO Date string
  updated_at?: string; // ISO Date string
  updated_by_name?: string; // Or updated_by_user: { name: string, roles: [{ display_name: string }] }
  updated_by_role?: string;
  // If your API returns user object for updated_by:
  updated_by_user?: {
    name: string;
    roles?: { display_name: string }[]; // Make roles optional or ensure it always exists
  };
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// --- Zod Schema for Add/Edit Member Type Form ---
const memberTypeFormSchema = z.object({
  name: z
    .string()
    .min(1, "Member type name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type MemberTypeFormData = z.infer<typeof memberTypeFormSchema>;

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
    .min(10, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_MEMBER_TYPE = [
  "ID",
  "Member Type Name",
  "Status",
  "Updated By",
  "Updated Role",
  "Updated At",
];
type MemberTypeExportItem = Omit<
  MemberTypeItem,
  "created_at" | "updated_at" | "updated_by_user" // Exclude original audit fields if transforming
> & {
  status: "Active" | "Inactive";
  updated_at_formatted?: string;
  // Add transformed updated_by_name and updated_by_role if needed
  updated_by_name_export?: string;
  updated_by_role_export?: string;
};
const CSV_KEYS_MEMBER_TYPE_EXPORT: (keyof MemberTypeExportItem)[] = [
  "id",
  "name",
  "status",
  "updated_by_name_export", // Use transformed field
  "updated_by_role_export", // Use transformed field
  "updated_at_formatted",
];

function exportToCsvMemberType(filename: string, rows: MemberTypeItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: MemberTypeExportItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    updated_by_name_export: row.updated_by_user?.name || row.updated_by_name || "N/A",
    updated_by_role_export: row.updated_by_user?.roles?.[0]?.display_name || row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_MEMBER_TYPE.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_MEMBER_TYPE_EXPORT.map((k) => {
          let cell = row[k as keyof MemberTypeExportItem];
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

// --- ActionColumn Component (Identical to Documentmaster) ---
const ActionColumn = ({
  onEdit,
}:
{
  onEdit: () => void;
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
    </div>
  );
};

// --- MemberTypeSearch Component ---
type MemberTypeSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const MemberTypeSearch = React.forwardRef<
  HTMLInputElement,
  MemberTypeSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
MemberTypeSearch.displayName = "MemberTypeSearch";

// --- MemberTypeTableTools Component ---
const MemberTypeTableTools = ({
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
        <MemberTypeSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button
          title="Clear Filters"
          icon={<TbReload />}
          onClick={() => onClearFilters()}
        ></Button>
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

// --- MemberTypeTable Component ---
type MemberTypeTableProps = {
  columns: ColumnDef<MemberTypeItem>[];
  data: MemberTypeItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
};
const MemberTypeTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: MemberTypeTableProps) => {
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

// --- Main MemberTypeMaster Component ---
const MemberTypeMaster = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingMemberType, setEditingMemberType] =
    useState<MemberTypeItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterStatus: [],
  });

  // === SELECT MEMBER TYPE DATA FROM REDUX ===
  const { MemberTypeData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector); // Ensure masterSelector provides MemberTypeData
  // ===========================================

  const defaultFormValues: MemberTypeFormData = useMemo(
    () => ({
      name: "",
      status: "Active",
    }),
    []
  );

  useEffect(() => {
    dispatch(getMemberTypeAction()); // Dispatch action to get member types
  }, [dispatch]);

  const addFormMethods = useForm<MemberTypeFormData>({
    resolver: zodResolver(memberTypeFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<MemberTypeFormData>({
    resolver: zodResolver(memberTypeFormSchema),
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
  const onAddMemberTypeSubmit = async (data: MemberTypeFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addMemberTypeAction(data)).unwrap(); // Use addMemberTypeAction
      toast.push(
        <Notification
          title="Member Type Added"
          type="success"
          duration={2000}
        >
          Member Type "{data.name}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getMemberTypeAction()); // Refresh data
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add member type."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (memberType: MemberTypeItem) => {
    setEditingMemberType(memberType);
    editFormMethods.reset({
      name: memberType.name,
      status: memberType.status || "Active",
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingMemberType(null);
    editFormMethods.reset(defaultFormValues);
    setIsEditDrawerOpen(false);
  };
  const onEditMemberTypeSubmit = async (data: MemberTypeFormData) => {
    if (!editingMemberType?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Member Type ID is missing.
        </Notification>
      );
      setIsSubmitting(false); // Added to ensure isSubmitting is reset
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        editMemberTypeAction({ id: editingMemberType.id, ...data }) // Use editMemberTypeAction
      ).unwrap();
      toast.push(
        <Notification
          title="Member Type Updated"
          type="success"
          duration={2000}
        >
          Member Type "{data.name}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getMemberTypeAction()); // Refresh data
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update member type."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterStatus: data.filterStatus || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterNames: [],
      filterStatus: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 }); // Reset to page 1
    dispatch(getMemberTypeAction()); // Refetch all data
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" }, // Default sort, or fetch from API preference
    query: "",
  });

  const memberTypeNameOptions = useMemo(() => {
    if (!Array.isArray(MemberTypeData)) return [];
    const uniqueNames = new Set(
      MemberTypeData.map((memberType) => memberType.name)
    );
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [MemberTypeData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    // Ensure MemberTypeData is an array before mapping
    const sourceData: MemberTypeItem[] = Array.isArray(MemberTypeData)
      ? MemberTypeData.map((item) => ({
          ...item,
          status: item.status || "Inactive", // Default status if not present
        }))
      : [];
    let processedData: MemberTypeItem[] = cloneDeep(sourceData);

    // Apply filters
    if (filterCriteria.filterNames?.length) {
      const names = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        names.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterStatus?.length) {
      const statuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        statuses.includes(item.status)
      );
    }

    // Apply global search query
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.trim().toLowerCase() ?? "").includes(query) ||
          (item.status?.trim().toLowerCase() ?? "").includes(query) ||
          (item.updated_by_user?.name?.trim().toLowerCase() ?? item.updated_by_name?.trim().toLowerCase() ?? "").includes(query) ||
          String(item.id ?? "")
            .trim()
            .toLowerCase()
            .includes(query)
      );
    }

    // Apply sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      ["id", "name", "status", "updated_at", "updated_by_name"].includes(key) // Add more sortable keys if needed
    ) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "updated_at") {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else if (key === "updated_by_name") { // Sort by updated_by_user.name if available
            aValue = a.updated_by_user?.name || a.updated_by_name || "";
            bValue = b.updated_by_user?.name || b.updated_by_name || "";
        } else if (key === "status") {
          aValue = a.status ?? "";
          bValue = b.status ?? "";
        } else {
          aValue = a[key as keyof MemberTypeItem] ?? "";
          bValue = b[key as keyof MemberTypeItem] ?? "";
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
      allFilteredAndSortedData: processedData, // This is all data after filtering and sorting
    };
  }, [MemberTypeData, tableData, filterCriteria]);

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
    const moduleName = "Member Type"; // Changed module name

    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `member_types_export_${timestamp}.csv`; // Dynamic filename

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
      exportToCsvMemberType(fileName, allFilteredAndSortedData); // Use member type exporter
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
          message={error.message} // Display error message from Redux
        />
      );
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
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1, // Reset to first page when page size changes
      });
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 }); // Reset to first page on sort
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }), // Reset to first page on search
    [handleSetTableData]
  );

  const columns: ColumnDef<MemberTypeItem>[] = useMemo(
    () => [
      {
        header: "Member Type Name",
        accessorKey: "name",
        enableSorting: true,
        size: 360, // Adjust size as needed
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at", // Or 'updated_by_name' if primarily sorting by name
        enableSorting: true,
        size: 160,
        cell: (props) => {
          const { updated_at, updated_by_user, updated_by_name, updated_by_role } =
            props.row.original;
          const formattedDate = updated_at
            ? new Date(updated_at).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              })
            : "N/A";
          
          const updaterName = updated_by_user?.name || updated_by_name || "N/A";
          const updaterRole = updated_by_user?.roles?.[0]?.display_name || updated_by_role || "N/A";

          return (
            <div className="text-xs">
              <span>
                {updaterName}
                {updaterRole !== "N/A" && (
                  <>
                    <br />
                    <b>{updaterRole}</b>
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
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 80,
        cell: (props) => {
          const status = props.row.original.status;
          return (
            <Tag
              className={classNames(
                "capitalize font-semibold whitespace-nowrap", // Ensure tag content doesn't wrap
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
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center", cellClass: "text-center" }, // Center align header and cell
        size: 80,
        cell: (props) => (
          <ActionColumn
            onEdit={() =>
              openEditDrawer(props.row.original as MemberTypeItem)
            } // Cast to MemberTypeItem if needed
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openEditDrawer] // Dependency for openEditDrawer
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Member Types</h5> {/* Changed title */}
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <MemberTypeTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <MemberTypeTable
              columns={columns}
              data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting}
              pagingData={{
                total: total,
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

      {/* Reusable Drawer for Add/Edit */}
      {[
        {
          formMethods: addFormMethods,
          onSubmit: onAddMemberTypeSubmit,
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          title: "Add Member Type", // Changed title
          formId: "addMemberTypeForm",
          submitText: "Adding...",
          saveText: "Save",
          isEdit: false,
        },
        {
          formMethods: editFormMethods,
          onSubmit: onEditMemberTypeSubmit,
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          title: "Edit Member Type", // Changed title
          formId: "editMemberTypeForm",
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
          bodyClass="relative" // Added relative for absolute positioning of audit info
          footer={
            <div className="text-right w-full">
              <Button
                size="sm"
                className="mr-2"
                onClick={drawerProps.closeFn}
                disabled={isSubmitting}
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
            className="flex flex-col gap-4 relative" // Added relative for audit info
          >
            <FormItem
              label={<div>Member Type Name<span className="text-red-500"> * </span></div>} // Changed label
              invalid={!!drawerProps.formMethods.formState.errors.name}
              errorMessage={
                drawerProps.formMethods.formState.errors.name?.message as
                  | string
                  | undefined
              }
            >
              <Controller
                name="name"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Member Type Name" />
                )}
              />
            </FormItem>
            <FormItem
              label={<div>Status<span className="text-red-500"> * </span></div>}
              invalid={!!drawerProps.formMethods.formState.errors.status}
              errorMessage={
                drawerProps.formMethods.formState.errors.status?.message as
                  | string
                  | undefined
              }
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
          </Form>
          {/* Audit Info Section - Ensure editingMemberType has updated_by_user */}
          {drawerProps.isEdit && editingMemberType && (
            <div className="absolute bottom-[3%] w-[90%]"> {/* Positioned at bottom */}
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                  <p className="text-sm font-semibold">{editingMemberType.updated_by_user?.name || editingMemberType.updated_by_name || "N/A"}</p>
                  <p>{editingMemberType.updated_by_user?.roles?.[0]?.display_name || editingMemberType.updated_by_role || "N/A"}</p>
                </div>
                <div className='text-right'>
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>{editingMemberType.created_at ? new Date(editingMemberType.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "N/A"}</span>
                  <br />
                  <span className="font-semibold">Updated At:</span>{" "}
                  <span>{editingMemberType.updated_at ? new Date(editingMemberType.updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "N/A"}</span>
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
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterMemberTypeForm" // Changed formId
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterMemberTypeForm" // Changed formId
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Member Type Name"> {/* Changed label */}
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select member type names..." // Changed placeholder
                  options={memberTypeNameOptions} // Use member type names
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
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); // Manually trigger submit
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            isRequired // Added for clarity, though Zod handles validation
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input textArea // Ensure this is a multiline input
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

export default MemberTypeMaster;