// src/views/your-path/MergedTaskList.tsx
import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebounceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Dropdown,
  Card,
  Button,
  Tooltip,
  Notification,
  Checkbox,
  Skeleton,
} from "@/components/ui";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbEye,
  TbSearch,
  TbFilter,
  TbPlus,
  TbUserCircle,
  TbMail,
  TbPhone,
  TbBuilding,
  TbMessageDots,
  TbStar,
  TbPaperclip,
  TbToggleRight,
  TbReload,
  TbUser,
  TbBrandWhatsapp,
  TbBell,
  TbCalendarEvent,
  TbColumns,
  TbX,
  TbCategory,
  TbBuildingStore,
  TbUserQuestion,
  TbProgressCheck,
  TbProgress,
  TbProgressX,
  TbProgressHelp,
  TbPhoto,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getRequestFeedbacksAction,
  addRequestFeedbackAction,
  editRequestFeedbackAction,
  deleteRequestFeedbackAction,
  deleteAllRequestFeedbacksAction,
  addNotificationAction,
  getAllUsersAction,
  addScheduleAction,
  addTaskAction,
  getDepartmentsAction,
  getParentCategoriesAction, // IMPORTED
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";

// --- Define Types & Constants ---
export type SelectOption = { value: any; label: string };
export type ApiLookupItem = { id: string | number; name: string };

export type RequestFeedbackType = "Request" | "Feedback";

export type RequestFeedbackStatus =
  | "Pending"
  | "In progress"
  | "Resolved"
  | "Rejected";

export type RequestFeedbackItem = {
  id: string | number;
  customer_id: string;
  name: string;
  email: string;
  mobile_no: string;
  company_name?: string | null;
  feedback_details: string;
  attachment?: string | null;
  icon_full_path?: string | null;
  type: RequestFeedbackType;
  category_id: string | number | null; // MODIFIED
  department_id: string | number;
  status: RequestFeedbackStatus;
  rating?: number | string | null;
  created_at: string;
  updated_at: string;
  department?: { id: number; name: string };
  category?: { id: number; name: string }; // MODIFIED
  // UI Display helpers
  categoryName?: string;
};

const TYPE_OPTIONS: SelectOption[] = [
  { value: "Request", label: "Request" },
  { value: "Feedback", label: "Feedback" },
];

const STATUS_OPTIONS: { value: RequestFeedbackStatus; label: string }[] = [
  { value: "Pending", label: "Pending" },
  { value: "In progress", label: "In progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Rejected", label: "Rejected" },
];

const RATING_OPTIONS: SelectOption[] = [
  { value: "1", label: "1 Star (Poor)" },
  { value: "2", label: "2 Stars (Fair)" },
  { value: "3", label: "3 Stars (Average)" },
  { value: "4", label: "4 Stars (Good)" },
  { value: "5", label: "5 Stars (Excellent)" },
];

const statusColors: Record<RequestFeedbackStatus, string> = {
  Pending:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  "In progress":
    "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  Resolved:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Rejected: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- Zod Schemas ---
const requestFeedbackFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z
    .string()
    .email("Invalid email address.")
    .min(1, "Email is required."),
  mobile_no: z.string().min(1, "Mobile number is required.").max(20),
  company_name: z.string().max(150).optional().or(z.literal("")).nullable(),
  type: z.enum(["Request", "Feedback"], {
    errorMap: () => ({ message: "Please select a type." }),
  }),
  category_id: z.string().min(1, "Category is required."), // MODIFIED
  department_id: z.string().min(1, "Department is required."),
  feedback_details: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(5000),
  status: z.enum(["Pending", "In progress", "Resolved", "Rejected"], {
    errorMap: () => ({ message: "Please select a status." }),
  }),
  rating: z.string().optional().nullable(),
  attachment: z.any().optional(),
});
type RequestFeedbackFormData = z.infer<typeof requestFeedbackFormSchema>;

const filterFormSchema = z.object({
  filterType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Helper Functions ---
const isImageFile = (filename: string | null | undefined): boolean => {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
};

const itemPathUtil = (filename: string | null | undefined): string => {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
  return filename ? `${baseUrl}/storage/${filename}` : "#";
};

// --- Action Column ---
const ItemActionColumn = ({
  onEdit,
  onViewDetail,
  onSendEmail,
  onSendWhatsapp,
  onAddNotification,
  onAssignTask,
  onAddSchedule,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onSendEmail: () => void;
  onSendWhatsapp: () => void;
  onAddNotification: () => void;
  onAssignTask: () => void;
  onAddSchedule: () => void;
}) => (
  <div className="flex items-center justify-center gap-1">
    <Tooltip title="Edit">
      <div
        className="text-xl p-1 cursor-pointer text-gray-500 hover:text-emerald-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        role="button"
        onClick={onEdit}
      >
        <TbPencil />
      </div>
    </Tooltip>
    <Tooltip title="View">
      <div
        className="text-xl p-1 cursor-pointer text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        role="button"
        onClick={onViewDetail}
      >
        <TbEye />
      </div>
    </Tooltip>
    <Dropdown
      renderTitle={
        <BsThreeDotsVertical className="text-xl p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
      }
    >
      <Dropdown.Item onClick={onSendEmail} className="flex items-center gap-2">
        <TbMail size={18} /> <span className="text-xs">Send Email</span>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={onSendWhatsapp}
        className="flex items-center gap-2"
      >
        <TbBrandWhatsapp size={18} />{" "}
        <span className="text-xs">Send Whatsapp</span>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={onAddNotification}
        className="flex items-center gap-2"
      >
        <TbBell size={18} /> <span className="text-xs">Add Notification</span>
      </Dropdown.Item>
      <Dropdown.Item onClick={onAssignTask} className="flex items-center gap-2">
        <TbUser size={18} /> <span className="text-xs">Assign Task</span>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={onAddSchedule}
        className="flex items-center gap-2"
      >
        <TbCalendarEvent size={18} />{" "}
        <span className="text-xs">Add Schedule</span>
      </Dropdown.Item>
    </Dropdown>
  </div>
);

// --- Table Tools & Search ---
const ItemSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebounceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
ItemSearch.displayName = "ItemSearch";
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onClearFilters,
  columns,
  filteredColumns,
  setFilteredColumns,
  activeFilterCount,
  isDataReady,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<RequestFeedbackItem>[];
  filteredColumns: ColumnDef<RequestFeedbackItem>[];
  setFilteredColumns: React.Dispatch<
    React.SetStateAction<ColumnDef<RequestFeedbackItem>[]>
  >;
  activeFilterCount: number;
  isDataReady: boolean;
}) => {
  const isColumnVisible = (colId: string) =>
    filteredColumns.some((c) => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(
        (c) => (c.id || c.accessorKey) === colId
      );
      if (originalColumn)
        setFilteredColumns((prev) =>
          [...prev, originalColumn].sort(
            (a, b) =>
              columns.findIndex(
                (c) => (c.id || c.accessorKey) === (a.id || a.accessorKey)
              ) -
              columns.findIndex(
                (c) => (c.id || c.accessorKey) === (b.id || b.accessorKey)
              )
          )
        );
    } else {
      setFilteredColumns((prev) =>
        prev.filter((c) => (c.id || c.accessorKey) !== colId)
      );
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown
          renderTitle={<Button icon={<TbColumns />} />}
          placement="bottom-end"
        >
          <div className="flex flex-col p-2">
            <div className="font-semibold mb-1 border-b pb-1">
              Toggle Columns
            </div>
            {columns.map((col) => {
              const id = col.id || (col.accessorKey as string);
              return (
                col.header && (
                  <div
                    key={id}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"
                  >
                    <Checkbox
                      checked={isColumnVisible(id)}
                      onChange={(checked) => toggleColumn(checked, id)}
                    >
                      {col.header as string}
                    </Checkbox>
                  </div>
                )
              );
            })}
          </div>
        </Dropdown>
        <Tooltip title="Clear Filters">
          <Button
            icon={<TbReload />}
            onClick={onClearFilters}
            disabled={!isDataReady}
          ></Button>
        </Tooltip>
        <Button
          icon={<TbFilter />}
          onClick={onFilter}
          className="w-full sm:w-auto"
          disabled={!isDataReady}
        >
          Filter{" "}
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

// --- Active Filter Display ---
const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const { filterType, filterStatus } = filterData;
  if (!filterType?.length && !filterStatus?.length)
    return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {filterType?.map((item) => (
        <Tag key={`type-${item.value}`} prefix>
          Type: {item.label}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterType", item.value)}
          />
        </Tag>
      ))}
      {filterStatus?.map((item) => (
        <Tag key={`status-${item.value}`} prefix>
          Status: {item.label}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterStatus", item.value)}
          />
        </Tag>
      ))}
      {
        <Button
          size="xs"
          variant="plain"
          className="text-red-600 hover:text-red-500 hover:underline ml-auto"
          onClick={onClearAll}
        >
          Clear All
        </Button>
      }
    </div>
  );
};

// --- Selected Footer ---
const RequestFeedbacksSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: {
  selectedItems: RequestFeedbackItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
            <span className="font-semibold">
              {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={() => setDeleteConfirmOpen(true)}
            loading={isDeleting}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Item(s)`}
        onClose={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteConfirmOpen(false);
        }}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the selected item(s)? This action
          cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

const RequestAndFeedbackListing = () => {
  const dispatch = useAppDispatch();
  const {
    requestFeedbacksData = { data: [], counts: {} },
    departmentsData = [],
    ParentCategories: CategoriesData = [], // ADDED
  } = useSelector(masterSelector, shallowEqual);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestFeedbackItem | null>(
    null
  );
  const [viewingItem, setViewingItem] = useState<RequestFeedbackItem | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<RequestFeedbackItem | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<RequestFeedbackItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] =
    useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>(
    []
  );

  const isDataReady = !initialLoading;
  const tableLoading = initialLoading || isSubmitting || isDeleting;

  // ADDED: Memoized category options from API
  const categoryOptions = useMemo(
    () =>
      Array.isArray(CategoriesData)
        ? CategoriesData?.map((c: ApiLookupItem) => ({
            value: String(c.id),
            label: c.name,
          }))
        : [],
    [CategoriesData]
  );

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(getRequestFeedbacksAction()),
          dispatch(getAllUsersAction()),
          dispatch(getDepartmentsAction()),
          dispatch(getParentCategoriesAction()), // ADDED
        ]);
      } catch (error) {
        console.error("Failed to load initial data", error);
        toast.push(
          <Notification title="Error" type="danger">
            Could not load necessary data.
          </Notification>
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (departmentsData?.data && Array.isArray(departmentsData?.data)) {
      setDepartmentOptions(
        departmentsData?.data.map((dept: any) => ({
          value: String(dept.id),
          label: dept.name,
        }))
      );
    }
  }, [departmentsData?.data]);

  const formMethods = useForm<RequestFeedbackFormData>({
    resolver: zodResolver(requestFeedbackFormSchema),
    mode: "onChange",
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = formMethods;
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const defaultFormValues: RequestFeedbackFormData = useMemo(
    () => ({
      name: "",
      email: "",
      mobile_no: "",
      company_name: "",
      type: "Request",
      category_id: "", // MODIFIED
      department_id: "",
      feedback_details: "",
      status: "Pending",
      rating: null,
      attachment: undefined,
    }),
    []
  );

  const openAddDrawer = useCallback(() => {
    reset(defaultFormValues);
    setSelectedFile(null);
    setRemoveExistingAttachment(false);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [reset, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback(
    (item: RequestFeedbackItem) => {
      setEditingItem(item);
      setSelectedFile(null);
      setRemoveExistingAttachment(false);
      reset({
        name: item.name,
        email: item.email,
        mobile_no: item.mobile_no,
        company_name: item.company_name || "",
        type: item.type,
        category_id: String(item.category_id), // MODIFIED
        department_id: String(item.department_id),
        feedback_details: item.feedback_details,
        status: item.status,
        rating: item.rating ? String(item.rating) : null,
        attachment: undefined,
      });
      setIsEditDrawerOpen(true);
    },
    [reset]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);
  const openViewDialog = useCallback(
    (item: RequestFeedbackItem) => setViewingItem(item),
    []
  );
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  const onSubmitHandler = async (data: RequestFeedbackFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof RequestFeedbackFormData];
      if (key === "attachment") return;
      if (value !== null && value !== undefined && value !== "")
        formData.append(key, String(value));
    });
    if (editingItem) {
      formData.append("_method", "PUT");
      if (selectedFile instanceof File)
        formData.append("attachment", selectedFile);
      else if (removeExistingAttachment && editingItem.attachment)
        formData.append("delete_attachment", "true");
    } else {
      if (selectedFile instanceof File)
        formData.append("attachment", selectedFile);
    }

    try {
      if (editingItem) {
        await dispatch(
          editRequestFeedbackAction({ id: editingItem.id, formData })
        ).unwrap();
        toast.push(<Notification title="Entry Updated" type="success" />);
        closeEditDrawer();
      } else {
        await dispatch(addRequestFeedbackAction(formData)).unwrap();
        toast.push(<Notification title="Entry Added" type="success" />);
        closeAddDrawer();
      }
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        (editingItem ? "Update Failed" : "Add Failed");
      toast.push(
        <Notification
          title={editingItem ? "Update Failed" : "Add Failed"}
          type="danger"
        >
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
      setRemoveExistingAttachment(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteClick = useCallback((item: RequestFeedbackItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deleteRequestFeedbackAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Entry Deleted"
          type="success"
        >{`Entry from "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {(e as Error).message}
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
      await dispatch(
        deleteAllRequestFeedbacksAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
        >{`${idsToDelete.length} item(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {(e as Error).message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const handleSendEmail = useCallback((item: RequestFeedbackItem) => {
    window.open(`mailto:${item.email}`);
  }, []);
  const handleSendWhatsapp = useCallback((item: RequestFeedbackItem) => {
    const phone = item.mobile_no?.replace(/\D/g, "");
    if (phone) window.open(`https://wa.me/${phone}`, "_blank");
  }, []);
  const openActionModal = (
    item: RequestFeedbackItem,
    type: "notification" | "task" | "schedule"
  ) => {
    toast.push(
      <Notification
        title="Action"
        type="info"
      >{`Opening ${type} modal for ${item.name}`}</Notification>
    );
  };

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    setIsFilterDrawerOpen(false);
  }, []);
  const onClearFilters = useCallback(() => {
    filterFormMethods.reset({});
    setFilterCriteria({});
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
  }, [filterFormMethods]);
  const handleCardClick = useCallback(
    (status?: RequestFeedbackStatus | "all") => {
      onClearFilters();
      if (status && status !== "all") {
        const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
        if (statusOption) setFilterCriteria({ filterStatus: [statusOption] });
      }
    },
    [onClearFilters]
  );
  const handleRemoveFilter = (key: keyof FilterFormData, value: string) => {
    setFilterCriteria((prev) => {
      const newFilters = { ...prev };
      const currentValues = prev[key] as
        | { value: string; label: string }[]
        | undefined;
      if (currentValues) {
        const newValues = currentValues.filter((item) => item.value !== value);
        (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
      }
      return newFilters;
    });
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  };

  const { pageData, total } = useMemo(() => {
    const dataWithNames: RequestFeedbackItem[] = cloneDeep(
      Array.isArray(requestFeedbacksData?.data)
        ? requestFeedbacksData?.data
        : []
    ).map((item: RequestFeedbackItem) => ({
      ...item,
      categoryName:
        item.category?.name ||
        categoryOptions.find((c) => c.value === String(item.category_id))
          ?.label ||
        "N/A",
    }));

    let processedData = dataWithNames;
    if (filterCriteria.filterType?.length)
      processedData = processedData.filter((item) =>
        filterCriteria.filterType!.some((f) => f.value === item.type)
      );
    if (filterCriteria.filterStatus?.length)
      processedData = processedData.filter((item) =>
        filterCriteria.filterStatus!.some((f) => f.value === item.status)
      );
    if (tableData.query) {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(q))
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && typeof key === "string") {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof RequestFeedbackItem];
        const bVal = b[key as keyof RequestFeedbackItem];
        if (key === "created_at" || key === "updated_at")
          return order === "asc"
            ? new Date(aVal as string).getTime() -
            new Date(bVal as string).getTime()
            : new Date(bVal as string).getTime() -
            new Date(aVal as string).getTime();
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
    };
  }, [requestFeedbacksData?.data, tableData, filterCriteria, categoryOptions]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(filterCriteria).filter(
        (value) => Array.isArray(value) && value.length > 0
      ).length,
    [filterCriteria]
  );

  const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(
    () => [
      {
        header: "Member Info",
        accessorKey: "name",
        size: 200,
        cell: (props: CellContext<RequestFeedbackItem, unknown>) => (
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 text-xs">
              {(props.row.original as any)?.customer_code && (
                <span className="font-semibold text-sm">
                  {(props.row.original as any).customer_code} |{' '}
                </span>
              )}
              <span className="font-semibold text-sm">{props.row.original.name}</span>
              <span className="text-gray-600 dark:text-gray-400">
                {props.row.original.email || "N/A"}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {props.row.original.mobile_no || "N/A"}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Type",
        accessorKey: "type",
        size: 100,
        cell: (props) => (
          <Tag className="capitalize">{props.getValue() || "N/A"}</Tag>
        ),
      },
      {
        header: "Category",
        accessorKey: "category_id", // MODIFIED
        size: 180,
        cell: (props) => (
          <div className="truncate w-44" title={props.row.original.categoryName}>
            {props.row.original.categoryName || "N/A"}
          </div>
        ),
      },
      {
        header: "Department",
        accessorKey: "department_id",
        size: 150,
        cell: (props) => props.row.original.department?.name || "N/A",
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 110,
        cell: (props) => {
          const s = props.getValue<RequestFeedbackStatus>();
          return (
            <Tag
              className={classNames(
                "capitalize whitespace-nowrap",
                statusColors[s] || "bg-gray-200"
              )}
            >
              {s || "N/A"}
            </Tag>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        meta: { headerClass: "text-center", cellClass: "text-center" },
        size: 100,
        cell: (props) => (
          <ItemActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => openViewDialog(props.row.original)}
            onSendEmail={() => handleSendEmail(props.row.original)}
            onSendWhatsapp={() => handleSendWhatsapp(props.row.original)}
            onAddNotification={() =>
              openActionModal(props.row.original, "notification")
            }
            onAssignTask={() => openActionModal(props.row.original, "task")}
            onAddSchedule={() =>
              openActionModal(props.row.original, "schedule")
            }
          />
        ),
      },
    ],
    [openEditDrawer, openViewDialog, handleSendEmail, handleSendWhatsapp]
  );

  const [filteredColumns, setFilteredColumns] =
    useState<ColumnDef<RequestFeedbackItem>[]>(columns);

  const DrawerFormContent = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormItem
          label={<div>Name<span className="text-red-500"> *</span></div>}
          invalid={!!errors.name}
          errorMessage={errors.name?.message}
        >
          <Controller name="name" control={control} render={({ field }) => <Input {...field} prefix={<TbUserCircle />} placeholder="Full Name" />} />
        </FormItem>
        <FormItem
          label={<div>Email<span className="text-red-500"> *</span></div>}
          invalid={!!errors.email}
          errorMessage={errors.email?.message}
        >
          <Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" prefix={<TbMail />} placeholder="example@domain.com" />} />
        </FormItem>
        <FormItem
          label={<div>Mobile No.<span className="text-red-500"> *</span></div>}
          invalid={!!errors.mobile_no}
          errorMessage={errors.mobile_no?.message}
        >
          <Controller name="mobile_no" control={control} render={({ field }) => <Input {...field} type="tel" prefix={<TbPhone />} placeholder="+XX XXXXXXXXXX" />} />
        </FormItem>
        <FormItem label="Company Name">
          <Controller name="company_name" control={control} render={({ field }) => <Input {...field} prefix={<TbBuilding />} placeholder="Your Company" />} />
        </FormItem>
        <FormItem
          label={<div>Type<span className="text-red-500"> *</span></div>}
          invalid={!!errors.type}
          errorMessage={errors.type?.message}
        >
          <Controller name="type" control={control} render={({ field }) => <Select placeholder="Select Type" options={TYPE_OPTIONS} value={TYPE_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbMessageDots />} />} />
        </FormItem>
        {/* MODIFIED: Using dynamic categoryOptions */}
        <FormItem
          label={<div>Category<span className="text-red-500"> *</span></div>}
          invalid={!!errors.category_id}
          errorMessage={errors.category_id?.message}
        >
          <Controller name="category_id" control={control} render={({ field }) => <Select placeholder="Select Category" options={categoryOptions} value={categoryOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory />} />} />
        </FormItem>
        <FormItem
          label={<div>Department<span className="text-red-500"> *</span></div>}
          className="md:col-span-2"
          invalid={!!errors.department_id}
          errorMessage={errors.department_id?.message}
        >
          <Controller name="department_id" control={control} render={({ field }) => <Select placeholder="Select Department" options={departmentOptions} value={departmentOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbBuildingStore />} />} />
        </FormItem>
        <FormItem
          label={<div>Description<span className="text-red-500"> *</span></div>}
          className="md:col-span-2"
          invalid={!!errors.feedback_details}
          errorMessage={errors.feedback_details?.message}
        >
          <Controller name="feedback_details" control={control} render={({ field }) => <Input textArea {...field} rows={5} placeholder="Describe your feedback or request in detail..." />} />
        </FormItem>
        <FormItem
          label="Rating"
          className="md:col-span-2"
          invalid={!!errors.rating}
          errorMessage={errors.rating?.message}
        >
          <Controller name="rating" control={control} render={({ field }) => <Select placeholder="Select Rating (Optional)" options={RATING_OPTIONS} value={RATING_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbStar />} />} />
        </FormItem>
        <FormItem label="Attachment (Optional)" className="md:col-span-2">
          <Controller name="attachment" control={control} render={({ field: { onChange, name, ref, onBlur } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e) => { const file = e.target.files?.[0]; onChange(file); setSelectedFile(file || null); if (file) setRemoveExistingAttachment(false); }} prefix={<TbPaperclip />} />)} />
          {editingItem?.attachment && !selectedFile && !removeExistingAttachment && (
            <div className="mt-2 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <a href={itemPathUtil(editingItem.icon_full_path) || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[calc(100%-100px)]">
                  {editingItem.attachment.split("/").pop()}
                </a>
                <Button size="xs" variant="plain" className="text-red-500" onClick={() => setRemoveExistingAttachment(true)}>Remove</Button>
              </div>
              {isImageFile(editingItem.attachment) && (
                <div className="mt-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md inline-block">
                  <img src={editingItem.icon_full_path!} alt="Attachment Preview" className="h-24 w-auto rounded-md object-cover" />
                </div>
              )}
            </div>
          )}
          {selectedFile && (<div className="mt-1 text-xs text-gray-500">New file: {selectedFile.name}</div>)}
          {removeExistingAttachment && <div className="mt-1 text-xs text-red-500">Current attachment will be removed.</div>}
        </FormItem>
        <FormItem
          label={<div>Status<span className="text-red-500"> *</span></div>}
          className="md:col-span-2"
          invalid={!!errors.status}
          errorMessage={errors.status?.message}
        >
          <Controller name="status" control={control} render={({ field }) => (<Select placeholder="Select Status" options={STATUS_OPTIONS} value={STATUS_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbToggleRight />} />)} />
        </FormItem>
      </div>
    );
  };

  const renderCardContent = (content: number | undefined) => {
    if (initialLoading) {
      return <Skeleton width={40} height={20} />;
    }
    return <h6 className="font-bold">{content ?? 0}</h6>;
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Requests & Feedbacks</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={!isDataReady}
            >
              Add New
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4 gap-2">
            <Tooltip title="Click to show all entries">
              <div onClick={() => handleCardClick("all")}>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 cursor-pointer hover:shadow-lg">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUserQuestion size={24} /></div>
                  <div><div className="text-blue-500">{renderCardContent(requestFeedbacksData?.counts?.total)}</div><span className="font-semibold text-xs">Total</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show Pending entries">
              <div onClick={() => handleCardClick("Pending")}>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-amber-200 cursor-pointer hover:shadow-lg">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-amber-100 text-amber-500"><TbProgressHelp size={24} /></div>
                  <div><div className="text-amber-500">{renderCardContent(requestFeedbacksData?.counts?.pending)}</div><span className="font-semibold text-xs">Pending</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show In Progress entries">
              <div onClick={() => handleCardClick("In progress")}>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-cyan-200 cursor-pointer hover:shadow-lg">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-cyan-100 text-cyan-500"><TbProgress size={24} /></div>
                  <div><div className="text-cyan-500">{renderCardContent(requestFeedbacksData?.counts?.in_progress)}</div><span className="font-semibold text-xs">In Progress</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show Resolved entries">
              <div onClick={() => handleCardClick("Resolved")}>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-emerald-200 cursor-pointer hover:shadow-lg">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbProgressCheck size={24} /></div>
                  <div><div className="text-emerald-500">{renderCardContent(requestFeedbacksData?.counts?.resolved)}</div><span className="font-semibold text-xs">Resolved</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show Rejected entries">
              <div onClick={() => handleCardClick("Rejected")}>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 cursor-pointer hover:shadow-lg">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbProgressX size={24} /></div>
                  <div><div className="text-red-500">{renderCardContent(requestFeedbacksData?.counts?.rejected)}</div><span className="font-semibold text-xs">Rejected</span></div>
                </Card>
              </div>
            </Tooltip>
          </div>
          <div className="mb-4">
            <ItemTableTools onClearFilters={onClearFilters} onSearchChange={(q) => setTableData((p) => ({ ...p, query: q, pageIndex: 1 }))} onFilter={() => setIsFilterDrawerOpen(true)} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} isDataReady={isDataReady} />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4">
            <DataTable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} onPaginationChange={(p) => setTableData((prev) => ({ ...prev, pageIndex: p }))} onSelectChange={(s) => setTableData((prev) => ({ ...prev, pageSize: s, pageIndex: 1 }))} onSort={(s) => setTableData((prev) => ({ ...prev, sort: s }))} />
          </div>
        </AdaptiveCard>
      </Container>
      <RequestFeedbacksSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer
        title={editingItem ? "Edit Entry" : "Add New Entry"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={520}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" variant="solid" form="requestFeedbackForm" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>
              {isSubmitting ? (editingItem ? "Saving..." : "Adding...") : (editingItem ? "Save Changes" : "Submit")}
            </Button>
          </div>
        }
      >
        <Form id="requestFeedbackForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
          <DrawerFormContent />
        </Form>
      </Drawer>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={600}>
        <div className="p-1">
          <h5 className="mb-6 border-b pb-4 dark:border-gray-600">Details for Entry #{viewingItem?.id}</h5>
          {viewingItem && (
            <div className="space-y-3 text-sm">
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">ID:</span><span className="w-2/3">{viewingItem.id}</span></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Name:</span><span className="w-2/3">{viewingItem.name}</span></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Email:</span><span className="w-2/3">{viewingItem.email}</span></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Mobile No:</span><span className="w-2/3">{viewingItem.mobile_no || "N/A"}</span></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Company:</span><span className="w-2/3">{viewingItem.company_name || "N/A"}</span></div>
              <div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700">Type:</span><Tag className="capitalize">{viewingItem.type}</Tag></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Category:</span><span className="w-2/3">{viewingItem.categoryName || "N/A"}</span></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Department:</span><span className="w-2/3">{viewingItem.department?.name || "N/A"}</span></div>
              <div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700">Status:</span><Tag className={classNames("capitalize", statusColors[viewingItem.status] || "bg-gray-200")}>{viewingItem.status}</Tag></div>
              <div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700">Rating:</span><span className="w-2/3 flex items-center gap-1">{viewingItem.rating ? (<><TbStar className="text-amber-500" /> {viewingItem.rating}{" "}Stars</>) : ("N/A")}</span></div>
              {viewingItem.attachment && (
                <div className="flex items-start">
                  <span className="font-semibold w-1/3 pt-1">Attachment:</span>
                  <span className="w-2/3">
                    <a href={itemPathUtil(viewingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {viewingItem.attachment.split("/").pop()}
                    </a>
                  </span>
                </div>
              )}
              <div className="flex flex-col"><span className="font-semibold mb-1">Description:</span><p className="w-full bg-gray-50 dark:bg-gray-700/60 p-3 rounded whitespace-pre-wrap break-words">{viewingItem.feedback_details}</p></div>
              <div className="flex"><span className="font-semibold w-1/3 text-gray-700">Reported On:</span><span className="w-2/3">{new Date(viewingItem.created_at).toLocaleString()}</span></div>
            </div>
          )}
          <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
        </div>
      </Dialog>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterReqFeedbackForm" type="submit">Apply</Button></div>}>
        <Form id="filterReqFeedbackForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Type"><Controller name="filterType" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Type" options={TYPE_OPTIONS} value={field.value || []} onChange={(val: any) => field.onChange(val || [])} />} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Status" options={STATUS_OPTIONS} value={field.value || []} onChange={(val: any) => field.onChange(val || [])} />} /></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Entry" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}>
        <p>Are you sure you want to delete the entry from "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

export default RequestAndFeedbackListing;