// src/views/your-path/JobPostsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // Not strictly needed if all actions are in-component
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
import Tag from "@/components/ui/Tag";
import { Drawer, Form, FormItem, Input } from "@/components/ui"; // Ensure Textarea is from here

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbBriefcase,
  TbMapPin,
  TbUsers,
  TbEye,
  TbDotsVertical,
  TbShare,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import Textarea from "@/views/ui-components/forms/Input/Textarea";
// Redux (Optional)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getJobPostsAction, addJobPostAction, ... } from '@/reduxtool/jobPost/middleware';
// import { jobPostSelector } from '@/reduxtool/jobPost/jobPostSlice';

// --- Define Item Type & Constants ---
export type JobPostStatus = "open" | "closed" | "draft" | "on_hold";
export type JobPostItem = {
  id: string | number;
  status: JobPostStatus;
  jobTitle: string; // Will be the "name" equivalent for the form
  department: string; // Key/ID for department dropdown
  description: string;
  location: string;
  experience: string; // e.g., "2+ Years", "Entry Level"
  totalVacancy: number;
  createdDate?: string; // ISO string for consistency (YYYY-MM-DD or full ISO)
};

const JOB_POST_STATUS_OPTIONS: { value: JobPostStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
  { value: "on_hold", label: "On Hold" },
];
const jobPostStatusValues = JOB_POST_STATUS_OPTIONS.map((s) => s.value) as [
  JobPostStatus,
  ...JobPostStatus[]
];

const jobStatusColor: Record<JobPostStatus, string> = {
  open: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  closed: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
  on_hold:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
};

// Example Department Options for dropdowns (Replace with actual data source)
const JOB_DEPARTMENT_OPTIONS = [
  { value: "eng", label: "Engineering" },
  { value: "mktg", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "Human Resources" },
  { value: "ops", label: "Operations" },
];
const jobDepartmentValues = JOB_DEPARTMENT_OPTIONS.map((d) => d.value) as [
  string,
  ...string[]
];

// --- Zod Schema for Add/Edit Job Post Form ---
const jobPostFormSchema = z.object({
  jobTitle: z
    .string()
    .min(1, "Job Title is required.")
    .max(150, "Title too long"),
  department: z.enum(jobDepartmentValues, {
    errorMap: () => ({ message: "Please select a department." }),
  }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(5000),
  location: z.string().min(1, "Location is required.").max(100),
  experience: z.string().min(1, "Experience level is required.").max(50),
  totalVacancy: z.coerce
    .number()
    .int()
    .min(1, "Total vacancies must be at least 1."),
  status: z.enum(jobPostStatusValues, {
    errorMap: () => ({ message: "Please select a status." }),
  }), // Added status to form
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
  // Can add filter by location, experience if needed
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Initial Dummy Data ---
const initialDummyJobPosts: JobPostItem[] = [
  {
    id: "JP001",
    status: "open",
    jobTitle: "Senior Frontend Engineer",
    department: "eng",
    description: "Looking for an experienced React developer...",
    location: "Remote",
    experience: "5+ Years",
    totalVacancy: 1,
    createdDate: new Date(2023, 10, 1).toISOString(),
  },
  {
    id: "JP002",
    status: "open",
    jobTitle: "Marketing Content Writer",
    department: "mktg",
    description: "Create compelling blog posts...",
    location: "New York, NY",
    experience: "2-4 Years",
    totalVacancy: 2,
    createdDate: new Date(2023, 10, 3).toISOString(),
  },
  {
    id: "JP003",
    status: "draft",
    jobTitle: "Product Manager - Mobile",
    department: "prod_mgmt",
    description: "Define the roadmap...",
    location: "Hybrid (London)",
    experience: "4+ Years",
    totalVacancy: 1,
    createdDate: new Date(2023, 10, 5).toISOString(),
  },
];
// Add 'prod_mgmt' to JOB_DEPARTMENT_OPTIONS if using this dummy data
if (!JOB_DEPARTMENT_OPTIONS.find((opt) => opt.value === "prod_mgmt")) {
  JOB_DEPARTMENT_OPTIONS.push({
    value: "prod_mgmt",
    label: "Product Management",
  });
  jobDepartmentValues.push("prod_mgmt");
}

// --- CSV Exporter ---
const CSV_HEADERS_JOB = [
  "ID",
  "Job Title",
  "Status",
  "Department",
  "Location",
  "Experience",
  "Vacancies",
  "Description",
  "Created Date",
];
const CSV_KEYS_JOB: (keyof JobPostItem)[] = [
  "id",
  "jobTitle",
  "status",
  "department",
  "location",
  "experience",
  "totalVacancy",
  "description",
  "createdDate",
];

function exportJobPostsToCsv(filename: string, rows: JobPostItem[]) {
  if (!rows || !rows.length) {
    /* ... no data toast ... */ return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row,
    status:
      JOB_POST_STATUS_OPTIONS.find((s) => s.value === row.status)?.label ||
      row.status,
    department:
      JOB_DEPARTMENT_OPTIONS.find((d) => d.value === row.department)?.label ||
      row.department,
    createdDate: row.createdDate
      ? new Date(row.createdDate).toLocaleDateString()
      : "",
  }));
  // ... (Standard exportToCsv logic using preparedRows, CSV_HEADERS_JOB, CSV_KEYS_JOB)
  const separator = ",";
  const csvContent =
    CSV_HEADERS_JOB.join(separator) +
    "\n" +
    preparedRows
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
    /* ... download logic ... */
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

const ActionColumn = ({
  onEdit,
  onDelete,
  onChangeStatus,
  onViewDetail,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
  onViewDetail: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
    </div>
  );
};

// --- JobPostsSearch & JobPostsTableTools (Similar to Units) ---
type JobPostsSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const JobPostsSearch = React.forwardRef<HTMLInputElement, JobPostsSearchProps>(
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
JobPostsSearch.displayName = "JobPostsSearch";

type JobPostsTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
};
const JobPostsTableTools = (
  {
    onSearchChange,
    onFilter,
    onExport,
  }: JobPostsTableToolsProps /* ... Same as UnitsTableTools, but with JobPostsSearch ... */
) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <JobPostsSearch onInputChange={onSearchChange} />
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

// --- JobPostsTable (Similar to UnitsTable) ---
type JobPostsTableProps = {
  /* ... Same props as UnitsTable, but with JobPostItem type ... */
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
const JobPostsTable = (
  {
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
  }: JobPostsTableProps /* ... DataTable setup ... */
) => (
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

// --- JobPostsSelectedFooter (Similar to UnitsSelectedFooter) ---
type JobPostsSelectedFooterProps = {
  selectedItems: JobPostItem[];
  onDeleteSelected: () => void;
};
const JobPostsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: JobPostsSelectedFooterProps) => {
  /* ... Same as UnitsSelectedFooter, text changed to "Job Post(s)" ... */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter /* ... */>
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold">
              {" "}
              {selectedItems.length} Job Post
              {selectedItems.length > 1 ? "s" : ""} selected{" "}
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Job Post(s)`}
        onClose={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteConfirmOpen(false);
        }}
      >
        <p>Are you sure you want to delete the selected job post(s)?</p>
      </ConfirmDialog>
    </>
  );
};

// --- Main JobPostsListing Component ---
const JobPostsListing = () => {
  const [jobPostsData, setJobPostsData] =
    useState<JobPostItem[]>(initialDummyJobPosts);
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "loading"
  >("idle");

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
    sort: { order: "desc", key: "createdDate" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<JobPostItem[]>([]);

  const formMethods = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostFormSchema),
    defaultValues: {
      jobTitle: "",
      department: jobDepartmentValues[0] || "",
      description: "",
      location: "",
      experience: "",
      totalVacancy: 1,
      status: "draft",
    },
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  // --- CRUD Handlers ---
  const openAddDrawer = useCallback(() => {
    formMethods.reset();
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback(
    (item: JobPostItem) => {
      setEditingItem(item);
      formMethods.reset({
        // Map item to form data
        jobTitle: item.jobTitle,
        department: item.department,
        description: item.description,
        location: item.location,
        experience: item.experience,
        totalVacancy: item.totalVacancy,
        status: item.status,
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setEditingItem(null);
  }, []);

  const onJobPostFormSubmit = useCallback(
    async (data: JobPostFormData) => {
      setIsSubmitting(true);
      setMasterLoadingStatus("loading");
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        if (editingItem) {
          const updatedJobPost: JobPostItem = {
            ...editingItem, // Keep id and createdDate
            ...data,
          };
          setJobPostsData((prev) =>
            prev.map((jp) =>
              jp.id === updatedJobPost.id ? updatedJobPost : jp
            )
          );
          toast.push(<Notification title="Job Post Updated" type="success" />);
          closeEditDrawer();
        } else {
          const newJobPost: JobPostItem = {
            ...data,
            id: `JP${Date.now()}`,
            createdDate: new Date().toISOString(),
          };
          setJobPostsData((prev) => [newJobPost, ...prev]);
          toast.push(<Notification title="Job Post Added" type="success" />);
          closeAddDrawer();
        }
      } catch (e: any) {
        toast.push(
          <Notification title="Operation Failed" type="danger">
            {e.message}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
        setMasterLoadingStatus("idle");
      }
    },
    [editingItem, closeAddDrawer, closeEditDrawer]
  );

  const handleDeleteClick = useCallback((item: JobPostItem) => {
    /* ... */ setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    /* ... */
    if (!itemToDelete) return;
    setIsDeleting(true);
    setMasterLoadingStatus("loading");
    setSingleDeleteConfirmOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      setJobPostsData((prev) =>
        prev.filter((jp) => jp.id !== itemToDelete!.id)
      );
      toast.push(
        <Notification
          title="Job Post Deleted"
          type="success"
        >{`Job Post "${itemToDelete.jobTitle}" deleted.`}</Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {e.message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setMasterLoadingStatus("idle");
      setItemToDelete(null);
    }
  }, [itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    /* ... */
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    setMasterLoadingStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const idsToDelete = selectedItems.map((item) => item.id);
      setJobPostsData((prev) =>
        prev.filter((jp) => !idsToDelete.includes(jp.id))
      );
      toast.push(
        <Notification title="Job Posts Deleted" type="success">
          {selectedItems.length} post(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {e.message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setMasterLoadingStatus("idle");
    }
  }, [selectedItems]);

  const handleChangeStatus = useCallback(async (item: JobPostItem) => {
    // Example: cycle through statuses
    setIsChangingStatus(true);
    const currentStatusIndex = JOB_POST_STATUS_OPTIONS.findIndex(
      (s) => s.value === item.status
    );
    const nextStatus =
      JOB_POST_STATUS_OPTIONS[
        (currentStatusIndex + 1) % JOB_POST_STATUS_OPTIONS.length
      ].value;
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      setJobPostsData((prev) =>
        prev.map((jp) =>
          jp.id === item.id ? { ...jp, status: nextStatus } : jp
        )
      );
      toast.push(
        <Notification title="Status Changed" type="success">{`Job Post "${
          item.jobTitle
        }" status changed to ${
          JOB_POST_STATUS_OPTIONS.find((s) => s.value === nextStatus)?.label
        }.`}</Notification>
      );
    } catch (e: any) {
      toast.push(
        <Notification title="Status Change Failed" type="danger">
          {e.message}
        </Notification>
      );
    } finally {
      setIsChangingStatus(false);
    }
  }, []);

  // --- Filter Handlers ---
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const df = filterFormSchema.parse({});
    filterFormMethods.reset(df);
    setFilterCriteria(df);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

  // --- Table Interaction Handlers ---
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
    /* ... */
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<JobPostItem>[]) => {
      /* ... */
    },
    []
  );

  // --- Data Processing ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: JobPostItem[] = cloneDeep(jobPostsData);
    // Apply Filters
    if (filterCriteria.filterStatus?.length) {
      const v = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) => v.includes(item.status));
    }
    if (filterCriteria.filterDepartment?.length) {
      const v = filterCriteria.filterDepartment.map((d) => d.value);
      processedData = processedData.filter((item) =>
        v.includes(item.department)
      );
    }
    // Apply Search Query
    if (tableData.query && tableData.query.trim() !== "") {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (j) =>
          j.jobTitle.toLowerCase().includes(q) ||
          j.department.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.experience.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          String(j.id).toLowerCase().includes(q)
      );
    }
    // Apply Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof JobPostItem];
        const bVal = b[key as keyof JobPostItem];

        if (key === "createdDate") {
          // Specific handling for date
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (key === "totalVacancy") {
          // Specific handling for number
          return order === "asc"
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        }
        // General string comparison
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
    exportJobPostsToCsv("job_posts_export.csv", allFilteredAndSortedData);
  }, [allFilteredAndSortedData]);

  // --- Table Column Definitions ---
  const columns: ColumnDef<JobPostItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        enableSorting: true,
        cell: (props) => (
          <Tag
            className={classNames(
              "text-white capitalize whitespace-nowrap",
              jobStatusColor[props.getValue<JobPostStatus>()]
            )}
          >
            {
              JOB_POST_STATUS_OPTIONS.find((o) => o.value === props.getValue())
                ?.label
            }
          </Tag>
        ),
      },
      {
        header: "Job Title",
        accessorKey: "jobTitle",
        size: 220,
        enableSorting: true,
        cell: (props) => (
          <span className="font-semibold">{props.getValue<string>()}</span>
        ),
      },
      {
        header: "Department",
        accessorKey: "department",
        size: 150,
        enableSorting: true,
        cell: (props) =>
          JOB_DEPARTMENT_OPTIONS.find((o) => o.value === props.getValue())
            ?.label || props.getValue(),
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: false,
        size: 250,
        cell: (props) => (
          <Tooltip title={props.getValue<string>()}>
            <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
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
        accessorKey: "totalVacancy",
        size: 100,
        enableSorting: true,
        meta: { cellClass: "text-center" },
      },
      // { header: 'Created Date', accessorKey: 'createdDate', size: 150, enableSorting: true, cell: props => props.getValue() ? new Date(props.getValue<string>()).toLocaleDateString() : '-' },
      {
        header: "Actions",
        id: "action",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick, handleChangeStatus]
  );

  // --- Render Form for Add/Edit Drawer ---
  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Job Title"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.jobTitle}
        errorMessage={currentFormMethods.formState.errors.jobTitle?.message}
      >
        <Controller
          name="jobTitle"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbBriefcase />}
              placeholder="e.g., Senior Software Engineer"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Job Department"
        invalid={!!currentFormMethods.formState.errors.department}
        errorMessage={currentFormMethods.formState.errors.department?.message}
      >
        <Controller
          name="department"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select Department"
              options={JOB_DEPARTMENT_OPTIONS}
              value={JOB_DEPARTMENT_OPTIONS.find(
                (o) => o.value === field.value
              )}
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
              options={JOB_POST_STATUS_OPTIONS}
              value={JOB_POST_STATUS_OPTIONS.find(
                (o) => o.value === field.value
              )}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Location"
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
        invalid={!!currentFormMethods.formState.errors.totalVacancy}
        errorMessage={currentFormMethods.formState.errors.totalVacancy?.message}
      >
        <Controller
          name="totalVacancy"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input {...field} type="number" prefix={<TbUsers />} min={1} />
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
            <Textarea
              {...field}
              rows={5}
              placeholder="Detailed job description, responsibilities, qualifications..."
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
            <h5 className="mb-2 sm:mb-0">
              Job Posts Management
            </h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <JobPostsTableTools
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
              form="jobPostForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                ? "Save Changes"
                : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="jobPostForm"
          onSubmit={formMethods.handleSubmit(onJobPostFormSubmit)}
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
              <Button
                size="sm"
                className="mr-2"
                onClick={closeFilterDrawer}
                type="button"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterJobPostForm"
                type="submit"
              >
                Apply
              </Button>
            </div>
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
                  placeholder="Select Status"
                  options={JOB_POST_STATUS_OPTIONS}
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
                  placeholder="Select Department"
                  options={JOB_DEPARTMENT_OPTIONS}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          {/* Add more filters here: Location (Input), Experience (Input or Select) */}
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
          <strong>{itemToDelete?.jobTitle}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default JobPostsListing;
