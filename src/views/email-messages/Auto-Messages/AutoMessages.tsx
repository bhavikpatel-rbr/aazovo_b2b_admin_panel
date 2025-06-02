import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Added Textarea

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbEye,
  TbDotsVertical,
  TbShare,
  TbCloudUpload,
  TbSwitchHorizontal,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// --- Define Message Template Type ---
export type MessageTemplateItem = {
  id: string | number;
  name: string;
  type: "SMS" | "PushNotification" | "InApp" | "Webhook" | "Other";
  triggerEventExample: string; // Example trigger, not necessarily the rule's trigger
  status: "active" | "inactive" | "draft";
  subject?: string; // For email-like messages or push titles
  body: string; // The main content of the template
  variables?: string; // Example: comma-separated list of variables used, or JSON
  createdDate?: Date;
};

// --- Zod Schema for Add/Edit Message Template Form ---
const messageTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  type: z.enum(["SMS", "PushNotification", "InApp", "Webhook", "Other"], {
    required_error: "Message type is required.",
  }),
  triggerEventExample: z
    .string()
    .min(1, "Example trigger event is required.")
    .max(100, "Example trigger event cannot exceed 100 characters."),
  subject: z.string().max(200, "Subject too long").optional(),
  body: z.string().min(1, "Message body is required."),
  variables: z.string().optional(),
  status: z.enum(["active", "inactive", "draft"]).default("draft"),
});
type MessageTemplateFormData = z.infer<typeof messageTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const selectOptionSchema = z.object({ value: z.string(), label: z.string() });
const filterFormSchema = z.object({
  filterNames: z.array(selectOptionSchema).optional().default([]),
  filterTypes: z.array(selectOptionSchema).optional().default([]),
  filterTriggerEvents: z.array(selectOptionSchema).optional().default([]),
  filterStatus: z.array(selectOptionSchema).optional().default([]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Name",
  "Type",
  "Example Trigger Event",
  "Status",
  "Subject",
  "Variables Used",
  "Created Date",
];
const CSV_KEYS: (keyof MessageTemplateItem)[] = [
  // 'body' is often too long for CSV, so excluded.
  "id",
  "name",
  "type",
  "triggerEventExample",
  "status",
  "subject",
  "variables",
  "createdDate",
];

function exportToCsv(filename: string, rows: MessageTemplateItem[]) {
  // ... (Keep the exportToCsv function from previous AutoMessagesTemplates.tsx, it's generic)
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
    CSV_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS.map((k) => {
          let cell = row[k];
          if (cell === null || cell === undefined) {
            cell = "";
          } else if (cell instanceof Date) {
            cell = cell.toISOString().split("T")[0];
          } else {
            cell = String(cell).replace(/"/g, '""'); // Escape double quotes
          }
          // Escape commas, newlines, and double quotes within a cell by wrapping in double quotes
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      })
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    // \ufeff for BOM
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

// --- Constants for Select Options and Styling ---
const messageTypeOptions = [
  { value: "SMS", label: "SMS" },
  { value: "PushNotification", label: "Push Notification" },
  { value: "InApp", label: "In-App Message" },
  { value: "Webhook", label: "Webhook Payload" },
  { value: "Other", label: "Other" },
];
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];
const templateStatusColor: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  draft: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
};
const messageTypeColor: Record<string, string> = {
  SMS: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100",
  PushNotification:
    "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100",
  InApp: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100",
  Webhook:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100",
  Other: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
};

// --- Initial Dummy Data for Message Templates ---
const initialDummyMessageTemplates: MessageTemplateItem[] = [
  {
    id: "TPL001",
    name: "SMS - Appointment Reminder",
    type: "SMS",
    triggerEventExample: "appointment_scheduled",
    status: "active",
    body: "Hi {{name}}, your appointment is scheduled for {{datetime}}.",
    variables: "name, datetime",
    createdDate: new Date(2023, 9, 10),
  },
  {
    id: "TPL002",
    name: "Push - Order Shipped",
    type: "PushNotification",
    triggerEventExample: "order_shipped",
    status: "active",
    subject: "Your Order #{{orderId}} Has Shipped!",
    body: "Track your package: {{trackingLink}}",
    variables: "orderId, trackingLink",
    createdDate: new Date(2023, 8, 15),
  },
  {
    id: "TPL003",
    name: "InApp - Welcome Greeting",
    type: "InApp",
    triggerEventExample: "user_registered",
    status: "draft",
    body: "<h1>Welcome, {{firstName}}!</h1><p>Explore our features.</p>",
    variables: "firstName",
    createdDate: new Date(2023, 10, 1),
  },
  {
    id: "TPL004",
    name: "Webhook - New Lead Data",
    type: "Webhook",
    triggerEventExample: "lead_created",
    status: "active",
    body: '{"lead_id": "{{leadId}}", "email": "{{email}}", "source": "{{source}}"}',
    variables: "leadId, email, source",
    createdDate: new Date(2023, 7, 25),
  },
];

// --- ActionColumn Component (Same as Units.tsx) ---
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
      
    </div>
  );
};

// --- MessageTemplatesSearch Component ---
type MessageTemplatesSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const MessageTemplatesSearch = React.forwardRef<
  HTMLInputElement,
  MessageTemplatesSearchProps
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
MessageTemplatesSearch.displayName = "MessageTemplatesSearch";

// --- MessageTemplatesTableTools Component ---
const MessageTemplatesTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      <div className="flex-grow">
        <MessageTemplatesSearch onInputChange={onSearchChange} />
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
};

// --- MessageTemplatesTable Component ---
type MessageTemplatesTableProps = {
  columns: ColumnDef<MessageTemplateItem>[];
  data: MessageTemplateItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: MessageTemplateItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: MessageTemplateItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<MessageTemplateItem>[]) => void;
};
const MessageTemplatesTable = ({
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
}: MessageTemplatesTableProps) => {
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

// --- MessageTemplatesSelectedFooter Component ---
type MessageTemplatesSelectedFooterProps = {
  selectedItems: MessageTemplateItem[];
  onDeleteSelected: () => void;
};
const MessageTemplatesSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: MessageTemplatesSelectedFooterProps) => {
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
                Template{selectedItems.length > 1 ? "s" : ""} selected
              </span>
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
        title={`Delete ${selectedItems.length} Template${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected template
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main MessageTemplates Component ---
const MessageTemplates = () => {
  // Renamed from AutoMessages
  const [allMessageTemplates, setAllMessageTemplates] = useState<
    MessageTemplateItem[]
  >(initialDummyMessageTemplates);
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "idle" | "succeeded" | "failed"
  >("idle");

  const dispatchSimulated = useCallback(
    async (action: { type: string; payload?: any }) => {
      setLoadingStatus("idle");
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        switch (action.type) {
          case "messageTemplates/get":
            break;
          case "messageTemplates/add":
            setAllMessageTemplates((prev) => [
              {
                ...action.payload,
                id: `TPL${Date.now()}`, // Prefix for template
                createdDate: new Date(),
              },
              ...prev,
            ]);
            break;
          case "messageTemplates/edit":
            setAllMessageTemplates((prev) =>
              prev.map((item) =>
                item.id === action.payload.id
                  ? { ...item, ...action.payload }
                  : item
              )
            );
            break;
          case "messageTemplates/delete":
            setAllMessageTemplates((prev) =>
              prev.filter((item) => item.id !== action.payload.id)
            );
            break;
          case "messageTemplates/deleteAll":
            const idsToDelete = new Set(action.payload.ids.split(","));
            setAllMessageTemplates((prev) =>
              prev.filter((item) => !idsToDelete.has(String(item.id)))
            );
            break;
          case "messageTemplates/changeStatus":
            setAllMessageTemplates((prev) =>
              prev.map((item) =>
                item.id === action.payload.id
                  ? { ...item, status: action.payload.newStatus }
                  : item
              )
            );
            break;
          default:
            console.warn(
              "Unknown action type in dispatchSimulated:",
              action.type
            );
        }
        setLoadingStatus("succeeded");
        return { unwrap: () => Promise.resolve() };
      } catch (error) {
        setLoadingStatus("failed");
        console.error("Simulated dispatch error:", error);
        return { unwrap: () => Promise.reject(error) };
      }
    },
    []
  );

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplateItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<MessageTemplateItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterTypes: [],
    filterTriggerEvents: [],
    filterStatus: [],
  });

  useEffect(() => {
    dispatchSimulated({ type: "messageTemplates/get" });
  }, [dispatchSimulated]);

  const addFormMethods = useForm<MessageTemplateFormData>({
    resolver: zodResolver(messageTemplateFormSchema),
    defaultValues: {
      name: "",
      type: "SMS",
      triggerEventExample: "",
      subject: "",
      body: "",
      variables: "",
      status: "draft",
    },
    mode: "onChange",
  });
  const editFormMethods = useForm<MessageTemplateFormData>({
    resolver: zodResolver(messageTemplateFormSchema),
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset({
      name: "",
      type: "SMS",
      triggerEventExample: "",
      subject: "",
      body: "",
      variables: "",
      status: "draft",
    });
    setIsAddDrawerOpen(true);
  }, [addFormMethods]);

  const closeAddDrawer = useCallback(() => {
    setIsAddDrawerOpen(false);
  }, []);

  const onAddTemplateSubmit = useCallback(
    async (data: MessageTemplateFormData) => {
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "messageTemplates/add",
          payload: data,
        }).unwrap();
        toast.push(
          <Notification
            title="Message Template Added"
            type="success"
            duration={2000}
          >
            Template "{data.name}" added.
          </Notification>
        );
        closeAddDrawer();
      } catch (error: any) {
        toast.push(
          <Notification
            title="Failed to Add Template"
            type="danger"
            duration={3000}
          >
            {error.message || "Could not add template."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, closeAddDrawer]
  );

  const openEditDrawer = useCallback(
    (template: MessageTemplateItem) => {
      setEditingTemplate(template);
      editFormMethods.reset({
        name: template.name,
        type: template.type,
        triggerEventExample: template.triggerEventExample,
        subject: template.subject || "",
        body: template.body,
        variables: template.variables || "",
        status: template.status,
      });
      setIsEditDrawerOpen(true);
    },
    [editFormMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setEditingTemplate(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onEditTemplateSubmit = useCallback(
    async (data: MessageTemplateFormData) => {
      if (!editingTemplate) return;
      setIsSubmitting(true);
      try {
        const payload = { ...data, id: editingTemplate.id }; // status is already in data from form
        await dispatchSimulated({
          type: "messageTemplates/edit",
          payload: payload,
        }).unwrap();
        toast.push(
          <Notification
            title="Message Template Updated"
            type="success"
            duration={2000}
          >
            Template "{data.name}" updated.
          </Notification>
        );
        closeEditDrawer();
      } catch (error: any) {
        toast.push(
          <Notification
            title="Failed to Update Template"
            type="danger"
            duration={3000}
          >
            {error.message || "Could not update template."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, editingTemplate, closeEditDrawer]
  );

  const handleChangeStatus = useCallback(
    async (template: MessageTemplateItem) => {
      const statusesCycle: MessageTemplateItem["status"][] = [
        "active",
        "inactive",
        "draft",
      ];
      const currentIndex = statusesCycle.indexOf(template.status);
      const newStatus =
        statusesCycle[(currentIndex + 1) % statusesCycle.length];

      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "messageTemplates/changeStatus",
          payload: { id: template.id, newStatus },
        }).unwrap();
        toast.push(
          <Notification title="Status Changed" type="success" duration={2000}>
            Template "{template.name}" status changed to {newStatus}.
          </Notification>
        );
      } catch (error: any) {
        toast.push(
          <Notification
            title="Failed to Change Status"
            type="danger"
            duration={3000}
          >
            {error.message || "Could not change status."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated]
  );

  const handleDeleteClick = useCallback((template: MessageTemplateItem) => {
    setTemplateToDelete(template);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatchSimulated({
        type: "messageTemplates/delete",
        payload: { id: templateToDelete.id },
      }).unwrap();
      toast.push(
        <Notification title="Template Deleted" type="success" duration={2000}>
          Template "{templateToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== templateToDelete!.id)
      );
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Delete Template"
          type="danger"
          duration={3000}
        >
          {error.message || `Could not delete template.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  }, [dispatchSimulated, templateToDelete]);
  const [selectedItems, setSelectedItems] = useState<MessageTemplateItem[]>([]);
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatchSimulated({
        type: "messageTemplates/deleteAll",
        payload: { ids: idsToDelete },
      }).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {selectedItems.length} template(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected templates."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatchSimulated, selectedItems]);

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
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [handleSetTableData, closeFilterDrawer]
  );

  const onClearFilters = useCallback(() => {
    const defaultFilters: FilterFormData = {
      filterNames: [],
      filterTypes: [],
      filterTriggerEvents: [],
      filterStatus: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const nameOptions = useMemo(() => {
    return [...new Set(allMessageTemplates.map((t) => t.name))]
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [allMessageTemplates]);

  const triggerEventOptions = useMemo(() => {
    return [...new Set(allMessageTemplates.map((t) => t.triggerEventExample))]
      .sort()
      .map((event) => ({
        value: event,
        label: event
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
  }, [allMessageTemplates]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: MessageTemplateItem[] = cloneDeep(allMessageTemplates);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const names = new Set(filterCriteria.filterNames.map((opt) => opt.value));
      processedData = processedData.filter((item) => names.has(item.name));
    }
    if (filterCriteria.filterTypes && filterCriteria.filterTypes.length > 0) {
      const types = new Set(filterCriteria.filterTypes.map((opt) => opt.value));
      processedData = processedData.filter((item) => types.has(item.type));
    }
    if (
      filterCriteria.filterTriggerEvents &&
      filterCriteria.filterTriggerEvents.length > 0
    ) {
      const events = new Set(
        filterCriteria.filterTriggerEvents.map((opt) => opt.value)
      );
      processedData = processedData.filter((item) =>
        events.has(item.triggerEventExample)
      );
    }
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const statuses = new Set(
        filterCriteria.filterStatus.map(
          (opt) => opt.value as MessageTemplateItem["status"]
        )
      );
      processedData = processedData.filter((item) => statuses.has(item.status));
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.triggerEventExample.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          (item.subject && item.subject.toLowerCase().includes(query)) ||
          (item.variables && item.variables.toLowerCase().includes(query)) ||
          String(item.id).toLowerCase().includes(query)
        );
      });
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof MessageTemplateItem];
        let bVal = b[key as keyof MessageTemplateItem];
        if (aVal instanceof Date && bVal instanceof Date) {
          return order === "asc"
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [allMessageTemplates, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportToCsv(
      "message_templates_export.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
    }
  }, [allFilteredAndSortedData]);

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
    (checked: boolean, row: MessageTemplateItem) => {
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
    (checked: boolean, currentRows: Row<MessageTemplateItem>[]) => {
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

  const columns: ColumnDef<MessageTemplateItem>[] = useMemo(
    () => [
      {
        header: "Template Name",
        accessorKey: "name",
        enableSorting: true,
        size: 250,
      },
      {
        header: "Type",
        accessorKey: "type",
        enableSorting: true,
        size: 180,
        cell: (props) => {
          const type = props.row.original.type;
          return (
            <Tag
              className={classNames(
                messageTypeColor[type] || "bg-gray-100 text-gray-600",
                "font-semibold"
              )}
            >
              {messageTypeOptions.find((opt) => opt.value === type)?.label ||
                type}
            </Tag>
          );
        },
      },
      {
        header: "Example Trigger",
        accessorKey: "triggerEventExample",
        enableSorting: true,
        size: 200,
        cell: (props) =>
          props.row.original.triggerEventExample
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => (
          <Tag
            className={classNames(
              templateStatusColor[props.row.original.status] ||
                "bg-gray-100 text-gray-600",
              "capitalize"
            )}
          >
            {props.row.original.status}
          </Tag>
        ),
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
            onChangeStatus={() => handleChangeStatus(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick, handleChangeStatus]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Message Templates</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <MessageTemplatesTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <MessageTemplatesTable
              columns={columns}
              data={pageData}
              loading={
                loadingStatus === "idle" || isSubmitting || isDeleting
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

      <MessageTemplatesSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Message Template"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={700} // Wider for more fields
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
              form="addMessageTemplateForm"
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
          id="addMessageTemplateForm"
          onSubmit={addFormMethods.handleSubmit(onAddTemplateSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div className="md:grid grid-cols-2 gap-3">
          <FormItem
            label="Template Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter template name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Message Type"
            invalid={!!addFormMethods.formState.errors.type}
            errorMessage={addFormMethods.formState.errors.type?.message}
          >
            <Controller
              name="type"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select type"
                  options={messageTypeOptions}
                  value={messageTypeOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Example Trigger Event"
            invalid={!!addFormMethods.formState.errors.triggerEventExample}
            errorMessage={
              addFormMethods.formState.errors.triggerEventExample?.message
            }
          >
            <Controller
              name="triggerEventExample"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g., order_shipped or user_signup"
                />
              )}
            />
          </FormItem>
          <FormItem label="Template Status">
            <Controller
              name="status"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select status"
                  options={statusOptions}
                  value={statusOptions.find((opt) => opt.value === field.value)}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="Subject / Title (Optional)" className="md:col-span-2">
            <Controller
              name="subject"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter subject or push title" />
              )}
            />
          </FormItem>
          <FormItem
            className="col-span-2"
            label="Message Body"
            invalid={!!addFormMethods.formState.errors.body}
            errorMessage={addFormMethods.formState.errors.body?.message}
          >
            <Controller
              name="body"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  rows={5}
                  placeholder="Enter message body. Use {{variable_name}} for placeholders."
                  textArea
                />
              )}
            />
          </FormItem>
          <FormItem label="Example Variables (Optional)" className="col-span-2">
            <Controller
              name="variables"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g., userName, orderId, productLink"
                />
              )}
            />
          </FormItem>
          </div>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Message Template"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={700}
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
              form="editMessageTemplateForm"
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
          id="editMessageTemplateForm"
          onSubmit={editFormMethods.handleSubmit(onEditTemplateSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div className="md:grid grid-cols-2 gap-3">
          <FormItem
            label="Template Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter template name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Message Type"
            invalid={!!editFormMethods.formState.errors.type}
            errorMessage={editFormMethods.formState.errors.type?.message}
          >
            <Controller
              name="type"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select type"
                  options={messageTypeOptions}
                  value={messageTypeOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Example Trigger Event"
            invalid={!!editFormMethods.formState.errors.triggerEventExample}
            errorMessage={
              editFormMethods.formState.errors.triggerEventExample?.message
            }
          >
            <Controller
              name="triggerEventExample"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., order_shipped" />
              )}
            />
          </FormItem>
          <FormItem label="Template Status">
            <Controller
              name="status"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select status"
                  options={statusOptions}
                  value={statusOptions.find((opt) => opt.value === field.value)}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="Subject / Title (Optional)" className="col-span-2">
            <Controller
              name="subject"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter subject or push title" />
              )}
            />
          </FormItem>
          <FormItem
            className="col-span-2"
            label="Message Body"
            invalid={!!editFormMethods.formState.errors.body}
            errorMessage={editFormMethods.formState.errors.body?.message}
          >
            <Controller
              name="body"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  rows={5}
                  placeholder="Enter message body"
                  textArea
                />
              )}
            />
          </FormItem>
          <FormItem label="Example Variables (Optional)" className="col-span-2">
            <Controller
              name="variables"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., userName, orderId" />
              )}
            />
          </FormItem>
          </div>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Message Templates"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear Filters
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterMessageTemplateForm"
              type="submit"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <Form
          id="filterMessageTemplateForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Name(s)">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select names..."
                  options={nameOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Type(s)">
            <Controller
              name="filterTypes"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select types..."
                  options={messageTypeOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Example Trigger Event(s)">
            <Controller
              name="filterTriggerEvents" // Corrected name
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select trigger events..."
                  options={triggerEventOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Status(s)">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select statuses..."
                  options={statusOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Message Template"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setTemplateToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setTemplateToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setTemplateToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
      >
        <p>
          Are you sure you want to delete the template "
          <strong>{templateToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default MessageTemplates; // Renamed export
