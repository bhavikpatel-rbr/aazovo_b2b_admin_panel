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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";
import Textarea from "@/views/ui-components/forms/Input/Textarea"; // Ensure this path is correct

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
  TbSwitchHorizontal,
  TbBuildingSkyscraper,
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
  getJobDepartmentsAction, // Action to fetch job departments
} from "@/reduxtool/master/middleware"; // Adjust path as necessary
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust as necessary

// --- Define Types ---
export type JobDepartmentListItem = {
  id: string | number;
  name: string;
};
export type JobDepartmentOption = { value: string; label: string };

export type JobPostStatusApi = "Active" | "Disabled" | string;
export type JobPostStatusForm = "Active" | "Disabled";

export type JobPostItem = {
  id: string | number;
  job_title?: string; // Assuming this field exists in your API response
  status: JobPostStatusApi;
  job_department_id: string;
  description: string;
  location: string;
  created_by?: string;
  vacancies: string | number; // API might send string, form uses number
  experience: string;
  created_at?: string;
  updated_at?: string;
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
    .min(1, "Description is required.") // Or make it optional if it truly is
    // .min(10, 'Description must be at least 10 characters.') // Keep if this is a business rule
    .max(5000, "Description too long (max 5000 chars).")
    .optional() // If description can be empty or not sent
    .or(z.literal("")), // Allow empty string if optional
  location: z.string().min(1, "Location is required.").max(100),
  experience: z.string().min(1, "Experience level is required.").max(50),
  vacancies: z.coerce
    .number()
    .int()
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
  "Department ID",
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
function exportJobPostsToCsv(filename: string, rows: JobPostItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_HEADERS_JOB.join(separator) +
    "\n" +
    rows
      .map((row: any) =>
        CSV_KEYS_JOB.map((k) => {
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
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center">
      {" "}
      <Tooltip title="Edit Job Post">
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
      </Tooltip>{" "}
      {/* <Tooltip title="Change Status">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
          )}
          role="button"
          onClick={onChangeStatus}
        >
          <TbSwitchHorizontal />
        </div>
      </Tooltip>{" "} */}
      <Tooltip title="Delete Job Post">
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
      </Tooltip>{" "}
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
};
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    {" "}
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} />
    </div>{" "}
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {" "}
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>{" "}
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>{" "}
    </div>{" "}
  </div>
);

// --- JobPostsTable Component (Corrected) ---
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

// --- JobPostsSelectedFooter Component (Corrected) ---
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
                {" "}
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
        title={`Delete ${selectedItems.length} Job Post${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected job post
          {selectedItems.length > 1 ? "s" : ""}?
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
    jobDepartmentsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [departmentOptions, setDepartmentOptions] = useState<
    JobDepartmentOption[]
  >([]);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobPostItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
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
    dispatch(getJobDepartmentsAction());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(jobDepartmentsData) && jobDepartmentsData.length > 0) {
      const options = jobDepartmentsData.map((dept: JobDepartmentListItem) => ({
        value: String(dept.id),
        label: dept.name,
      }));
      setDepartmentOptions((prevOptions) => {
        if (JSON.stringify(prevOptions) !== JSON.stringify(options))
          return options;
        return prevOptions;
      });
    } else if (departmentOptions.length > 0) {
      setDepartmentOptions([]);
    }
  }, [jobDepartmentsData, departmentOptions.length]);

  const defaultFormValues: JobPostFormData = {
    job_title: "",
    job_department_id: departmentOptions[0]?.value || "",
    description: "",
    location: "",
    experience: "",
    vacancies: 1,
    status: "Active",
  };

  const formMethods = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultFormValues);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultFormValues]); // defaultFormValues depends on departmentOptions, so it's better to pass it if it changes
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: JobPostItem) => {
      setEditingItem(item);
      formMethods.reset({
        job_title: item.job_title || "",
        job_department_id: String(item.job_department_id),
        description: item.description,
        location: item.location,
        experience: item.experience,
        vacancies:
          typeof item.vacancies === "string"
            ? parseInt(item.vacancies, 10) || 0
            : Number(item.vacancies) || 0,
        status: item.status as JobPostStatusForm,
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
    const loggedInUserId = "1"; // Placeholder: Get actual logged-in user ID
    console.log("data", data);

    const apiPayload = {
      // Map form field names to API expected field names
      title: data.job_title, // Assuming API expects 'title' for job_title
      job_department_id: parseInt(data.job_department_id),
      description: data.description,

      location: data.location,
      experience: data.experience,
      vacancies: String(data.vacancies), // API example showed "tet", ensure backend handles string or number
      status: data.status,
      created_by: loggedInUserId,
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
      dispatch(getJobPostsAction());
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
        // Construct full payload as editJobPostAction likely expects it
        id: item.id,
        status: newStatus,
        title: item.job_title || "",
        job_department_id: item.job_department_id,
        description: item.description,
        location: item.location,
        experience: item.experience,
        vacancies: String(item.vacancies),
        created_by: item.created_by, // Preserve existing created_by
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
        dispatch(getJobPostsAction());
      } catch (error: any) {
        toast.push(
          <Notification
            title="Status Change Failed"
            type="danger"
            duration={3000}
          >
            {error.message}
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
        >{`Job post "${
          itemToDelete.job_title || itemToDelete.id
        }" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getJobPostsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message}
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
      dispatch(getJobPostsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message}
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
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterStatus: [], filterDepartment: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: JobPostItem[] = Array.isArray(jobPostsData)
      ? jobPostsData
      : [];
    let processedData: JobPostItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterStatus?.length) {
      const v = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) => v.includes(item.status));
    }
    if (filterCriteria.filterDepartment?.length) {
      const v = filterCriteria.filterDepartment.map((d) => d.value);
      processedData = processedData.filter((item) =>
        v.includes(String(item.job_department_id))
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (j) =>
          (j.job_title?.toLowerCase() ?? "").includes(q) ||
          (j.description?.toLowerCase() ?? "").includes(q) ||
          (j.location?.toLowerCase() ?? "").includes(q) ||
          (j.experience?.toLowerCase() ?? "").includes(q) ||
          String(j.id).toLowerCase().includes(q)
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
          const numA =
            typeof aVal === "string"
              ? parseInt(aVal, 10) || 0
              : Number(aVal) || 0;
          const numB =
            typeof bVal === "string"
              ? parseInt(bVal, 10) || 0
              : Number(bVal) || 0;
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
  const handleRowSelect = useCallback((checked: boolean, row: JobPostItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<JobPostItem>[]) => {
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

  const columns: ColumnDef<JobPostItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        size: 140,
        enableSorting: true,
        cell: (props) => {
          const statusVal = props.getValue<JobPostStatusApi>();
          return (
            <Tag
              className={classNames(
                "capitalize whitespace-nowrap",
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
        size: 200,
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
        size: 200,
        cell: (props) => (
            <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
              {props.getValue<string>()}
            </span>
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
        size: 180,
        enableSorting: true,
        meta: { cellClass: "text-center" },
      },
      {
        header: "Actions",
        id: "actions",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 140,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original)}
          />
        ),
      },
    ],
    [departmentOptions, openEditDrawer, handleDeleteClick, handleChangeStatus]
  );

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
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
              placeholder="Select Department"
              options={departmentOptions}
              value={departmentOptions.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
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
              prefix={<TbFileText />}
              placeholder="Detailed job description, responsibilities, qualifications..."
              textArea
            />
          )}
        />
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Job Posts</h5>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/hr-employees/job-application')}>
              View All
              </Button>
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
              </Button>
            </div>
            </div>
          <ItemTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <JobPostsTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" ||
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
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={editingItem ? closeEditDrawer : closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="jobPostForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {" "}
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                ? "Save Changes"
                : "Save"}
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="jobPostForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <div>
              {" "}
              <Button
                size="sm"
                className="mr-2"
                onClick={closeFilterDrawer}
                type="button"
              >
                Clear
              </Button>{" "}
              <Button
                size="sm"
                variant="solid"
                form="filterJobPostForm"
                type="submit"
              >
                Apply
              </Button>{" "}
            </div>{" "}
          </div>
        }
      >
        <Form
          id="filterJobPostForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Any Status"
                  options={JOB_POST_STATUS_OPTIONS_FORM.map((s) => ({
                    value: s.value,
                    label: s.label,
                  }))}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Department">
            <Controller
              name="filterDepartment"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Any Department"
                  options={departmentOptions}
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
          <strong>{itemToDelete?.job_title || itemToDelete?.id}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default JobPostsListing;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
