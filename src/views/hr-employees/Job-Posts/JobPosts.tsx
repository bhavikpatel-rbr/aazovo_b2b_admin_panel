// src/views/your-path/JobPostsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
// import Textarea from "@/views/ui-components/forms/Input/Textarea"; // Ensure this path is correct, seems unused in this file for Input prefix

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbBriefcase,
  TbMapPin,
  TbUsers,
  TbFileText,
  TbSwitchHorizontal, // Keep if change status is re-enabled
  TbBuildingSkyscraper,
  TbReload,
  TbFileCheck,
  TbFileExcel,
  TbFileSmile,
  TbFileLike,
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
  getJobPostsAction,
  addJobPostAction,
  editJobPostAction,
  deleteJobPostAction,
  deleteAllJobPostsAction,
  getJobDepartmentsAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Types ---
export type JobDepartmentListItem = {
  id: string | number; // API might send number, but Select usually works well with string values
  name: string;
  // Add any other properties your API returns for departments
};
export type JobDepartmentOption = { value: string; label: string };

export type JobPostStatusApi = "Active" | "Disabled" | string; // string for other potential statuses
export type JobPostStatusForm = "Active" | "Disabled";

export type JobPostItem = {
  id: string | number;
  job_title?: string;
  status: JobPostStatusApi;
  job_department_id: string | number; // API might send number
  description: string;
  location: string;
  created_by?: string;
  vacancies: string | number;
  experience: string;
  created_at?: string;
  updated_at?: string;
  // Add any other fields from your API response
};

// --- Constants for Form Selects ---
const JOB_POST_STATUS_OPTIONS_FORM: {
  value: JobPostStatusForm;
  label: string;
}[] = [
    { value: "Active", label: "Active" },
    { value: "Disabled", label: "Disabled" },
  ];
const jobPostStatusFormValues = JOB_POST_STATUS_OPTIONS_FORM.map(
  (s) => s.value
) as [JobPostStatusForm, ...JobPostStatusForm[]];

const jobStatusColor: Record<JobPostStatusApi, string> = {
  Active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Disabled: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  // Add other potential statuses from API if they need distinct colors
};

// --- Zod Schema for Add/Edit Job Post Form ---
const jobPostFormSchema = z.object({
  job_title: z
    .string()
    .min(1, "Job Title is required.")
    .max(150, "Title too long"),
  job_department_id: z.string().min(1, "Please select a department."),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(5000, "Description too long (max 5000 chars).")
    .optional()
    .or(z.literal("")),
  location: z.string().min(1, "Location is required.").max(100),
  experience: z.string().min(1, "Experience level is required.").max(50),
  vacancies: z.coerce // coerce will attempt to convert string to number
    .number({ invalid_type_error: "Vacancies must be a number." })
    .int("Vacancies must be a whole number.")
    .min(0, "Vacancies must be a non-negative number."),
  status: z.enum(jobPostStatusFormValues, {
    errorMap: () => ({ message: "Please select a status." }),
  }),
});
type JobPostFormData = z.infer<typeof jobPostFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDepartment: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_JOB = [
  "ID",
  "Job Title",
  "Status",
  "Department ID", // Consider changing to "Department Name" if you map it before export
  "Description",
  "Location",
  "Experience",
  "Vacancies",
  "Created At",
];
const CSV_KEYS_JOB: (keyof JobPostItem)[] = [
  "id",
  "job_title",
  "status",
  "job_department_id",
  "description",
  "location",
  "experience",
  "vacancies",
  "created_at",
];

function exportJobPostsToCsv(filename: string, rows: JobPostItem[], departmentOptions: JobDepartmentOption[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  const preparedRows = rows.map(row => ({
    ...row,
    job_department_name: departmentOptions.find(d => String(d.value) === String(row.job_department_id))?.label || row.job_department_id,
  }));

  const csvKeysWithDeptName: (keyof JobPostItem | 'job_department_name')[] = [
    "id", "job_title", "status", "job_department_name", "description",
    "location", "experience", "vacancies", "created_at"
  ];
  const csvHeadersWithDeptName = [
    "ID", "Job Title", "Status", "Department Name", "Description",
    "Location", "Experience", "Vacancies", "Created At"
  ];


  const separator = ",";
  const csvContent =
    csvHeadersWithDeptName.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        csvKeysWithDeptName.map((k) => {
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


// --- ActionColumn Component ---
const ActionColumn = ({
  item, // Pass the full item
  onEdit,
  onDelete,
  onChangeStatus, // Keep if you re-enable the button
}: {
  item: JobPostItem;
  onEdit: (item: JobPostItem) => void;
  onDelete: (item: JobPostItem) => void;
  onChangeStatus: (item: JobPostItem) => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit Job Post">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={() => onEdit(item)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* <Tooltip title="Change Status">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
          )}
          role="button"
          onClick={() => onChangeStatus(item)}
        >
          <TbSwitchHorizontal />
        </div>
      </Tooltip> */}
      <Tooltip title="Delete Job Post">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          )}
          role="button"
          onClick={() => onDelete(item)}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};

// --- JobPostsSearch Component ---
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

// --- JobPostsTableTools Component ---
type ItemTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
};
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button icon={<TbReload />} onClick={onClearFilters} ></Button>
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

// --- JobPostsTable Component ---
type JobPostsTableProps = {
  columns: ColumnDef<JobPostItem>[];
  data: JobPostItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: JobPostItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: JobPostItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<JobPostItem>[]) => void;
};
const JobPostsTable = ({
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
}: JobPostsTableProps) => (
  <DataTable
    selectable
    columns={columns}
    data={data}
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
    noData={!loading && data.length === 0}
  />
);

// --- JobPostsSelectedFooter Component ---
type JobPostsSelectedFooterProps = {
  selectedItems: JobPostItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const JobPostsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: JobPostsSelectedFooterProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  const handleDeleteClick = () => setDeleteConfirmOpen(true);
  const handleCancelDelete = () => setDeleteConfirmOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmOpen(false);
  };

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
                Job Post{selectedItems.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
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
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Job Post${selectedItems.length > 1 ? "s" : ""
          }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the selected job post
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Component: JobPostsListing ---
const JobPostsListing = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    jobPostsData = [],
    jobDepartmentsData = [], // This will hold the raw department data from Redux
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  // Memoize department options to prevent unnecessary re-renders
  const departmentOptions = useMemo(() => {
    if (Array.isArray(jobDepartmentsData) && jobDepartmentsData.length > 0) {
      console.log(jobDepartmentsData);
      return jobDepartmentsData.map((dept: JobDepartmentListItem) => ({
        value: String(dept.id), // Ensure value is string for Select component
        label: dept.name,
      }));
    }
    return [];
  }, [jobDepartmentsData]);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobPostItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false); // Keep if status change is re-enabled
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JobPostItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<JobPostItem[]>([]);

  useEffect(() => {
    dispatch(getJobPostsAction());
    dispatch(getJobDepartmentsAction()); // Fetch departments on component mount
  }, [dispatch]);

  const defaultFormValues: JobPostFormData = useMemo(() => ({
    job_title: "",
    job_department_id: departmentOptions[0]?.value || "", // Use memoized options
    description: "",
    location: "",
    experience: "",
    vacancies: 1,
    status: "Active",
  }), [departmentOptions]); // Recompute defaultFormValues if departmentOptions change


  const formMethods = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // Reset form with potentially new default values if departmentOptions load after form init
  useEffect(() => {
    if (!isAddDrawerOpen && !isEditDrawerOpen) { // Only reset if no drawer is open
      formMethods.reset(defaultFormValues);
    }
  }, [defaultFormValues, formMethods, isAddDrawerOpen, isEditDrawerOpen]);


  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // This will be updated by onApplyFiltersSubmit
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultFormValues); // Reset with current default values
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: JobPostItem) => {
      setEditingItem(item);
      formMethods.reset({
        job_title: item.job_title || "",
        job_department_id: String(item.job_department_id), // Ensure string
        description: item.description || "",
        location: item.location || "",
        experience: item.experience || "",
        vacancies:
          typeof item.vacancies === "string"
            ? parseInt(item.vacancies, 10) || 0
            : Number(item.vacancies) || 0,
        status: (item.status as JobPostStatusForm) || "Active", // Default to Active if undefined
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: JobPostFormData) => {
    setIsSubmitting(true);
    // const loggedInUserId = "1"; // Placeholder: Get actual logged-in user ID
    // For now, let's assume 'created_by' is handled by backend or not required for add/edit

    const apiPayload = {
      job_title: data.job_title, // API seems to use job_title directly
      job_department_id: parseInt(data.job_department_id, 10), // Ensure it's a number
      description: data.description,
      location: data.location,
      experience: data.experience,
      vacancies: String(data.vacancies), // API might expect string, adjust if number
      status: data.status,
      // created_by: loggedInUserId, // Add if your API requires/handles this
    };

    try {
      if (editingItem) {
        await dispatch(
          editJobPostAction({ id: editingItem.id, ...apiPayload })
        ).unwrap();
        toast.push(
          <Notification title="Job Post Updated" type="success" duration={2000}>
            Job post saved.
          </Notification>
        );
        closeEditDrawer();
      } else {
        await dispatch(addJobPostAction(apiPayload)).unwrap();
        toast.push(
          <Notification title="Job Post Added" type="success" duration={2000}>
            New job post created.
          </Notification>
        );
        closeAddDrawer();
      }
      dispatch(getJobPostsAction()); // Refresh list
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
      console.error("Job Post Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = useCallback(
    async (item: JobPostItem) => {
      setIsChangingStatus(true);
      const newStatus = item.status === "Active" ? "Disabled" : "Active";
      const payload = {
        id: item.id,
        status: newStatus,
        job_title: item.job_title || "", // Ensure all required fields are present
        job_department_id: typeof item.job_department_id === 'string' ? parseInt(item.job_department_id, 10) : item.job_department_id,
        description: item.description || "",
        location: item.location || "",
        experience: item.experience || "",
        vacancies: String(item.vacancies),
        // created_by: item.created_by, // If API expects this
      };
      try {
        await dispatch(editJobPostAction(payload)).unwrap();
        toast.push(
          <Notification
            title="Status Changed"
            type="success"
            duration={2000}
          >{`Job Post status changed to ${newStatus}.`}</Notification>
        );
        dispatch(getJobPostsAction()); // Refresh list
      } catch (error: any) {
        toast.push(
          <Notification
            title="Status Change Failed"
            type="danger"
            duration={3000}
          >
            {error.message || "Failed to change status."}
          </Notification>
        );
        console.error("Change Status Error:", error);
      } finally {
        setIsChangingStatus(false);
      }
    },
    [dispatch]
  );

  const handleDeleteClick = useCallback((item: JobPostItem) => {
    if (!item.id) return;
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteJobPostAction({ id: itemToDelete.id })).unwrap();
      toast.push(
        <Notification
          title="Job Post Deleted"
          type="success"
          duration={2000}
        >{`Job post "${itemToDelete.job_title || itemToDelete.id
          }" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getJobPostsAction()); // Refresh list
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete job post."}
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
        deleteAllJobPostsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >{`${validItems.length} job post(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getJobPostsAction()); // Refresh list
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected job posts."}
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
      setFilterCriteria({
        filterStatus: data.filterStatus || [],
        filterDepartment: data.filterDepartment || [],
      });
      setTableData((prev) => ({ ...prev, pageIndex: 1 })); // Reset to first page
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );

  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterStatus: [], filterDepartment: [] };
    filterFormMethods.reset(defaultFilters); // Reset the form in the drawer
    setFilterCriteria(defaultFilters);      // Reset the applied criteria
    setTableData((prev) => ({ ...prev, pageIndex: 1 })); // Reset to first page
    // closeFilterDrawer(); // Optionally close drawer after clearing
  }, [filterFormMethods, closeFilterDrawer]); // Added closeFilterDrawer to dependencies if used

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: JobPostItem[] = Array.isArray(jobPostsData)
      ? jobPostsData
      : [];
    let processedData: JobPostItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterStatus?.length) {
      const statusValues = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) =>
        statusValues.includes(item.status)
      );
    }
    if (filterCriteria.filterDepartment?.length) {
      const deptValues = filterCriteria.filterDepartment.map((d) => d.value);
      processedData = processedData.filter((item) =>
        deptValues.includes(String(item.job_department_id))
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.job_title?.toLowerCase() ?? "").includes(query) ||
          (item.description?.toLowerCase() ?? "").includes(query) ||
          (item.location?.toLowerCase() ?? "").includes(query) ||
          (item.experience?.toLowerCase() ?? "").includes(query) ||
          String(item.id).toLowerCase().includes(query)
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof JobPostItem];
        const bVal = b[key as keyof JobPostItem];

        if (key === "created_at" || key === "updated_at") {
          const dateA = aVal ? new Date(aVal as string).getTime() : 0;
          const dateB = bVal ? new Date(bVal as string).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (key === "vacancies") {
          const numA = typeof aVal === 'string' ? parseInt(aVal, 10) || 0 : Number(aVal) || 0;
          const numB = typeof bVal === 'string' ? parseInt(bVal, 10) || 0 : Number(bVal) || 0;
          return order === "asc" ? numA - numB : numB - numA;
        }
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
  }, [jobPostsData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportJobPostsToCsv(
      "job_posts_export.csv",
      allFilteredAndSortedData,
      departmentOptions // Pass departmentOptions for mapping
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
  }, [allFilteredAndSortedData, departmentOptions]); // Add departmentOptions dependency

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
  const handleRowSelect = useCallback((checked: boolean, row: JobPostItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<JobPostItem>[]) => {
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

  const columns: ColumnDef<JobPostItem>[] = useMemo(
    () => [
      {
        header: "Job Title", // Moved Job Title to be more prominent
        accessorKey: "job_title",
        size: 250,
        enableSorting: true,
        cell: (props) => (
          <span className="font-semibold">{props.getValue<string>()}</span>
        )
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        enableSorting: true,
        cell: (props) => {
          const statusVal = props.getValue<JobPostStatusApi>();
          return (
            <Tag
              className={classNames(
                "capitalize whitespace-nowrap min-w-[70px] text-center", // Added min-width and text-center
                jobStatusColor[statusVal] || "bg-gray-100 text-gray-600"
              )}
            >
              {statusVal}
            </Tag>
          );
        },
      },
      {
        header: "Department",
        accessorKey: "job_department_id",
        size: 180,
        enableSorting: true,
        cell: (props) => {
          const deptId = String(props.getValue());
          const department = departmentOptions.find(
            (opt) => opt.value === deptId
          );
          return department ? department.label : `ID: ${deptId}`;
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: false,
        size: 200, // Adjusted size
        cell: (props) => (
          <Tooltip title={props.getValue<string>()} placement="top-start">
            <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
              {props.getValue<string>()}
            </span>
          </Tooltip>
        ),
      },
      {
        header: "Location",
        accessorKey: "location",
        size: 150,
        enableSorting: true,
      },
      {
        header: "Experience",
        accessorKey: "experience",
        size: 130,
        enableSorting: true,
      },
      {
        header: "Vacancies",
        accessorKey: "vacancies",
        size: 100, // Adjusted size
        enableSorting: true,
        meta: { cellClass: "text-center", headerClass: "text-center" },
      },
      {
        header: "Actions",
        id: "actions",
        meta: { headerClass: "text-center", cellClass: "text-center" },
        size: 120, // Adjusted size
        cell: (props) => (
          <ActionColumn
            item={props.row.original}
            onEdit={openEditDrawer}
            onDelete={handleDeleteClick}
            onChangeStatus={handleChangeStatus} // Keep if you re-enable status change button
          />
        ),
      },
    ],
    [departmentOptions, openEditDrawer, handleDeleteClick, handleChangeStatus]
  );

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => {
    type Portal = {
      id: number,
    }
    const [portals, setPortals] = useState<Portal[]>([{ id: 1 }])
    const addPortal = (id: number) => setPortals(prev => [...prev, { id: prev[prev.length - 1].id + 1 }])
    const removePortal = (id: number) => setPortals(prev => prev.length > 1 ? prev.filter(portal => portal.id !== id) : prev)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormItem
          label="Job Title"
          className="md:col-span-2"
          invalid={!!currentFormMethods.formState.errors.job_title}
          errorMessage={currentFormMethods.formState.errors.job_title?.message}
        >
          <Controller
            name="job_title"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<TbBriefcase />}
                placeholder="e.g., Software Engineer"
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Job Department"
          invalid={!!currentFormMethods.formState.errors.job_department_id}
          errorMessage={
            currentFormMethods.formState.errors.job_department_id?.message
          }
        >
          <Controller
            name="job_department_id"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Select
                placeholder={departmentOptions.length > 0 ? "Select Department" : "Loading Departments..."}
                options={departmentOptions}
                value={departmentOptions.find((o) => o.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
                disabled={departmentOptions.length === 0 && masterLoadingStatus === "idle"}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Status"
          invalid={!!currentFormMethods.formState.errors.status}
          errorMessage={currentFormMethods.formState.errors.status?.message}
        >
          <Controller
            name="status"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Select
                placeholder="Select Status"
                options={JOB_POST_STATUS_OPTIONS_FORM}
                value={JOB_POST_STATUS_OPTIONS_FORM.find(
                  (o) => o.value === field.value
                )}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Location"
          className="md:col-span-2"
          invalid={!!currentFormMethods.formState.errors.location}
          errorMessage={currentFormMethods.formState.errors.location?.message}
        >
          <Controller
            name="location"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<TbMapPin />}
                placeholder="e.g., Remote, New York"
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Experience Required"
          invalid={!!currentFormMethods.formState.errors.experience}
          errorMessage={currentFormMethods.formState.errors.experience?.message}
        >
          <Controller
            name="experience"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., 2+ Years, Entry Level" />
            )}
          />
        </FormItem>
        <FormItem
          label="Total Vacancies"
          invalid={!!currentFormMethods.formState.errors.vacancies}
          errorMessage={currentFormMethods.formState.errors.vacancies?.message}
        >
          <Controller
            name="vacancies"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Input {...field} type="number" prefix={<TbUsers />} min={0} />
            )}
          />
        </FormItem>

        <FormItem
          label="Description"
          className="md:col-span-2"
          invalid={!!currentFormMethods.formState.errors.description}
          errorMessage={currentFormMethods.formState.errors.description?.message}
        >
          <Controller
            name="description"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Input
                {...field}
                rows={5}
                // prefix={<TbFileText />} // prefix on textArea might look odd, remove if so
                placeholder="Detailed job description, responsibilities, qualifications..."
                textArea
              />
            )}
          />
        </FormItem>
        <div className="col-span-2 text-red-500">
          <div className="">
            <div className="flex justify-between">
              <b className="text-base">Post on</b>
              <Button onClick={() => addPortal()} type="button">Add Portal</Button>
            </div>
            {
              portals?.map(portal => {
                return (
                  <div className="flex flex-col gap-2 border p-5 pb-0 mt-2 rounded-xl">
                    <div className="flex gap-2">
                      <FormItem className="w-full">
                        <Controller
                          name={`portal_${portal.id}`}
                          control={currentFormMethods.control}
                          render={({ field }) => (
                            <Select
                              placeholder="Select Portal"
                              options={[
                                { label: "Linkedin", value: "Linkedin" },
                                { label: "Naukri", value: "Naukri" },
                                { label: "Internal", value: "Internal" },
                                { label: "Glassdoor", value: "Glassdoor" },
                              ]}
                            />
                          )}
                        />
                      </FormItem>
                      <FormItem className="w-full">
                        <Controller
                          name={`url_${portal.id}`}
                          control={currentFormMethods.control}
                          render={({ field }) => (
                            <Input placeholder="Application Count" />
                          )}
                        />
                      </FormItem>
                      <Button
                        type="button"
                        className="w-18 h-9.5"
                        onClick={() => removePortal(portal.id)} icon={<TbTrash className="" />}
                      ></Button>

                    </div>
                    <FormItem className="w-full">
                      <Controller
                        name={`url_${portal.id}`}
                        control={currentFormMethods.control}
                        render={({ field }) => (
                          <Input placeholder="Enter url link" />
                        )}
                      />
                    </FormItem>

                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    )
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Job Posts</h5>
            <div className="flex gap-2">
              {/* <Button onClick={() => navigate("/hr-employees/job-application")}>
                View Applications
              </Button> */}
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
                Add New
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-5 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbBriefcase size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">879</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbFileCheck size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">23</h6>
                <span className="font-semibold text-xs">Active</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbFileExcel size={24} />
              </div>
              <div>
                <h6 className="text-red-500">78</h6>
                <span className="font-semibold text-xs">Expired Portals</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbFileSmile size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">345</h6>
                <span className="font-semibold text-xs">Total Views</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbFileLike size={24} />
              </div>
              <div>
                <h6 className="text-green-500">34</h6>
                <span className="font-semibold text-xs">Applicants</span>
              </div>
            </Card>
          </div>
          <ItemTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <JobPostsTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "idle" ||
                isSubmitting ||
                isDeleting ||
                isChangingStatus
              }
              pagingData={{
                total,
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

      <JobPostsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      <Drawer
        title={editingItem ? "Edit Job Post" : "Add New Job Post"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700}
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
              form="jobPostForm" // Ensure this matches the form's ID
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                  ? "Save"
                  : "Save Job Post"}
            </Button>
          </div>
        }
      >
        <Form
          id="jobPostForm" // This ID is targeted by the footer submit button
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm(formMethods)}
        </Form>
        {
          editingItem && (
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
          )
        }
      </Drawer>

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full flex justify-end gap-2">
            <Button
              size="sm"
              onClick={onClearFilters} // Use onClearFilters
              type="button"
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterJobPostForm" // Ensure this matches the form's ID
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterJobPostForm" // This ID is targeted by the footer submit button
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Any Status"
                  options={JOB_POST_STATUS_OPTIONS_FORM.map((s) => ({ // Use _FORM options
                    value: s.value,
                    label: s.label,
                  }))}
                  value={field.value || []} // field.value should be an array of option objects
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Department">
            <Controller
              name="filterDepartment"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder={departmentOptions.length > 0 ? "Any Department" : "Loading Departments..."}
                  options={departmentOptions}
                  value={field.value || []} // field.value should be an array of option objects
                  onChange={(val) => field.onChange(val || [])}
                  disabled={departmentOptions.length === 0 && masterLoadingStatus === "idle"}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Job Post"
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
          Are you sure you want to delete the job post "
          <strong>{itemToDelete?.job_title || itemToDelete?.id}</strong>"? This
          action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default JobPostsListing;

// Helper for classNames if not globally available
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}