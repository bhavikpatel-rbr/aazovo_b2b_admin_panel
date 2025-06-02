// src/views/your-path/AutoMessages.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate not used, Link might be for breadcrumbs
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames"; // Ensure this is installed
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
  TbDotsVertical,
  TbEye,
  TbShare,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbSwitchHorizontal, // For status change action if needed
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// --- Define Auto Message Type ---
export type AutoMessageItem = {
  id: string | number;
  name: string; // User-friendly name for the auto message rule
  templateId: string; // ID of the MessageTemplateItem to use
  triggerEvent: string; // e.g., 'order_shipped', 'user_registered', 'appointment_reminder'
  status: "active" | "inactive" | "draft"; // Status of this auto-message rule
  delay?: string; // e.g., "1 hour", "30 minutes after event", "immediately"
  conditions?: string; // JSON string or descriptive text of conditions
  createdDate?: Date;
  // For display from related template:
  templateName?: string;
  templateType?: "SMS" | "PushNotification" | "InApp" | "Webhook" | "Other";
};

// --- Zod Schema for Add/Edit Auto Message Form ---
const autoMessageFormSchema = z.object({
  name: z
    .string()
    .min(1, "Rule name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  templateId: z.string().min(1, "Message template is required."), // Should be a select
  triggerEvent: z
    .string()
    .min(1, "Trigger event is required.")
    .max(100, "Trigger event cannot exceed 100 characters."),
  delay: z.string().max(50, "Delay description too long.").optional(),
  conditions: z.string().optional(), // Could be a JSON editor or textarea
  status: z.enum(["active", "inactive", "draft"]).default("draft"), // Add status to form
});
type AutoMessageFormData = z.infer<typeof autoMessageFormSchema>;

// --- Zod Schema for Filter Form ---
const selectOptionSchema = z.object({ value: z.string(), label: z.string() });
const filterFormSchema = z.object({
  filterNames: z.array(selectOptionSchema).optional().default([]),
  filterTemplateIds: z.array(selectOptionSchema).optional().default([]), // Filter by template used
  filterTriggerEvents: z.array(selectOptionSchema).optional().default([]),
  filterStatus: z.array(selectOptionSchema).optional().default([]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Rule Name",
  "Template ID",
  "Template Name",
  "Template Type",
  "Trigger Event",
  "Status",
  "Delay",
  "Conditions",
  "Created Date",
];
const CSV_KEYS: (keyof AutoMessageItem)[] = [
  "id",
  "name",
  "templateId",
  "templateName",
  "templateType",
  "triggerEvent",
  "status",
  "delay",
  "conditions",
  "createdDate",
];

function exportToCsv(filename: string, rows: AutoMessageItem[]) {
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

// --- Mock Message Templates (for templateId select) ---
// This would typically come from your MessageTemplateItem data store
const mockMessageTemplateOptions = [
  { value: "AMT001", label: "SMS - Appointment Reminder (24hr)", type: "SMS" },
  { value: "AMT002", label: "Push - Order Shipped", type: "PushNotification" },
  { value: "AMT003", label: "InApp - Welcome Tour Step 1", type: "InApp" },
  {
    value: "AMT004",
    label: "Webhook - New Lead Notification",
    type: "Webhook",
  },
  { value: "AMT005", label: "SMS - Password Reset Code", type: "SMS" },
] as const; // Use `as const` for better type inference on `type`

// --- Constants for Select Options and Styling ---
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];
const ruleStatusColor: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  draft: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
};
// Re-use messageTypeColor if displaying template type
const messageTypeColor: Record<string, string> = {
  SMS: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100",
  PushNotification:
    "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100",
  InApp: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100",
  Webhook:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100",
  Other: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
};

// --- Initial Dummy Data for AutoMessage Rules ---
const initialDummyAutoMessages: AutoMessageItem[] = [
  {
    id: "AMR001",
    name: "24hr Appointment Reminder",
    templateId: "AMT001",
    triggerEvent: "appointment_scheduled",
    status: "active",
    delay: "24 hours before",
    conditions: "Type = consultation",
    createdDate: new Date(2023, 9, 12),
    templateName: "SMS - Appointment Reminder (24hr)",
    templateType: "SMS",
  },
  {
    id: "AMR002",
    name: "Order Shipped Notification",
    templateId: "AMT002",
    triggerEvent: "order_shipped",
    status: "active",
    delay: "Immediately",
    createdDate: new Date(2023, 8, 16),
    templateName: "Push - Order Shipped",
    templateType: "PushNotification",
  },
  {
    id: "AMR003",
    name: "Welcome Tour Start",
    templateId: "AMT003",
    triggerEvent: "user_registered",
    status: "draft",
    delay: "5 minutes after registration",
    createdDate: new Date(2023, 10, 2),
    templateName: "InApp - Welcome Tour Step 1",
    templateType: "InApp",
  },
  {
    id: "AMR004",
    name: "Abandoned Cart Email (Tier 1)",
    templateId: "AMT005",
    triggerEvent: "cart_abandoned",
    status: "inactive",
    delay: "1 hour after abandonment",
    conditions: "CartValue > $50",
    createdDate: new Date(2023, 9, 7),
    templateName: "SMS - Password Reset Code",
    templateType: "SMS",
  }, // Example, template might not match name
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

// --- AutoMessagesSearch Component ---
type AutoMessagesSearchProps = {
  // Renamed from AutoMessagesSearchProps to avoid conflict if in same scope
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const RuleSearch = React.forwardRef<
  // Renamed component
  HTMLInputElement,
  AutoMessagesSearchProps
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
RuleSearch.displayName = "RuleSearch"; // Updated display name

// --- AutoMessagesTableTools Component ---
const RuleTableTools = ({
  // Renamed component
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
        <RuleSearch onInputChange={onSearchChange} /> {/* Use renamed search */}
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

// --- AutoMessagesTable Component ---
type RuleTableProps = {
  // Renamed props type
  columns: ColumnDef<AutoMessageItem>[];
  data: AutoMessageItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: AutoMessageItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: AutoMessageItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<AutoMessageItem>[]) => void;
};
const RuleTable = ({
  // Renamed component
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
}: RuleTableProps) => {
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

// --- AutoMessagesSelectedFooter Component ---
type RuleSelectedFooterProps = {
  // Renamed props type
  selectedItems: AutoMessageItem[];
  onDeleteSelected: () => void;
};
const RuleSelectedFooter = ({
  // Renamed component
  selectedItems,
  onDeleteSelected,
}: RuleSelectedFooterProps) => {
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
                Rule{selectedItems.length > 1 ? "s" : ""}{" "}
                {/* Changed from Item to Rule */}
                selected
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
        title={`Delete ${selectedItems.length} Rule${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected auto message rule
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main AutoMessages Component ---
const AutoMessages = () => {
  const [allAutoMessages, setAllAutoMessages] = useState<AutoMessageItem[]>(
    initialDummyAutoMessages
  );
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "idle" | "succeeded" | "failed"
  >("idle");

  const dispatchSimulated = useCallback(
    async (action: { type: string; payload?: any }) => {
      setLoadingStatus("idle");
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        switch (action.type) {
          case "autoMessages/get":
            break;
          case "autoMessages/add":
            const newRule = {
              ...action.payload,
              id: `AMR${Date.now()}`,
              createdDate: new Date(),
              // Fetch template details to enrich the rule item
              templateName: mockMessageTemplateOptions.find(
                (t) => t.value === action.payload.templateId
              )?.label,
              templateType: mockMessageTemplateOptions.find(
                (t) => t.value === action.payload.templateId
              )?.type,
            };
            setAllAutoMessages((prev) => [newRule, ...prev]);
            break;
          case "autoMessages/edit":
            const editedRule = {
              ...action.payload,
              templateName: mockMessageTemplateOptions.find(
                (t) => t.value === action.payload.templateId
              )?.label,
              templateType: mockMessageTemplateOptions.find(
                (t) => t.value === action.payload.templateId
              )?.type,
            };
            setAllAutoMessages((prev) =>
              prev.map((item) =>
                item.id === action.payload.id ? editedRule : item
              )
            );
            break;
          case "autoMessages/delete":
            setAllAutoMessages((prev) =>
              prev.filter((item) => item.id !== action.payload.id)
            );
            break;
          case "autoMessages/deleteAll":
            const idsToDelete = new Set(action.payload.ids.split(","));
            setAllAutoMessages((prev) =>
              prev.filter((item) => !idsToDelete.has(String(item.id)))
            );
            break;
          case "autoMessages/changeStatus": // For dedicated status change
            setAllAutoMessages((prev) =>
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
  const [editingRule, setEditingRule] = useState<AutoMessageItem | null>(null); // Renamed from editingTemplate
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = // Renamed
    useState<AutoMessageItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterTemplateIds: [],
    filterTriggerEvents: [],
    filterStatus: [],
  });

  useEffect(() => {
    dispatchSimulated({ type: "autoMessages/get" });
  }, [dispatchSimulated]);

  const addFormMethods = useForm<AutoMessageFormData>({
    resolver: zodResolver(autoMessageFormSchema),
    defaultValues: {
      name: "",
      templateId: "",
      triggerEvent: "",
      delay: "",
      conditions: "",
      status: "draft",
    },
    mode: "onChange",
  });
  const editFormMethods = useForm<AutoMessageFormData>({
    resolver: zodResolver(autoMessageFormSchema),
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset({
      name: "",
      templateId: "",
      triggerEvent: "",
      delay: "",
      conditions: "",
      status: "draft",
    });
    setIsAddDrawerOpen(true);
  }, [addFormMethods]);

  const closeAddDrawer = useCallback(() => {
    setIsAddDrawerOpen(false);
  }, []);

  const onAddRuleSubmit = useCallback(
    async (data: AutoMessageFormData) => {
      // Renamed
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "autoMessages/add",
          payload: data,
        }).unwrap();
        toast.push(
          <Notification
            title="Auto Message Rule Added"
            type="success"
            duration={2000}
          >
            Rule "{data.name}" added.
          </Notification>
        );
        closeAddDrawer();
      } catch (error: any) {
        toast.push(
          <Notification
            title="Failed to Add Rule"
            type="danger"
            duration={3000}
          >
            {error.message || "Could not add rule."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, closeAddDrawer]
  );

  const openEditDrawer = useCallback(
    (rule: AutoMessageItem) => {
      // Renamed
      setEditingRule(rule);
      editFormMethods.reset({
        name: rule.name,
        templateId: rule.templateId,
        triggerEvent: rule.triggerEvent,
        delay: rule.delay || "",
        conditions: rule.conditions || "",
        status: rule.status,
      });
      setIsEditDrawerOpen(true);
    },
    [editFormMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setEditingRule(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onEditRuleSubmit = useCallback(
    async (data: AutoMessageFormData) => {
      // Renamed
      if (!editingRule) return;
      setIsSubmitting(true);
      try {
        const payload = { ...data, id: editingRule.id };
        await dispatchSimulated({
          type: "autoMessages/edit",
          payload: payload,
        }).unwrap();
        toast.push(
          <Notification
            title="Auto Message Rule Updated"
            type="success"
            duration={2000}
          >
            Rule "{data.name}" updated.
          </Notification>
        );
        closeEditDrawer();
      } catch (error: any) {
        toast.push(
          <Notification
            title="Failed to Update Rule"
            type="danger"
            duration={3000}
          >
            {error.message || "Could not update rule."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, editingRule, closeEditDrawer]
  );

  const handleChangeStatus = useCallback(
    async (rule: AutoMessageItem) => {
      const newStatus =
        rule.status === "active"
          ? "inactive"
          : rule.status === "inactive"
          ? "draft"
          : "active";
      // Simple cycle: active -> inactive -> draft -> active
      // Or use a dialog to pick status

      setIsSubmitting(true); // Use submitting flag for status change as well
      try {
        await dispatchSimulated({
          type: "autoMessages/changeStatus",
          payload: { id: rule.id, newStatus },
        }).unwrap();
        toast.push(
          <Notification title="Status Changed" type="success" duration={2000}>
            Rule "{rule.name}" status changed to {newStatus}.
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

  const handleDeleteClick = useCallback((rule: AutoMessageItem) => {
    // Renamed
    setRuleToDelete(rule);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    // Renamed
    if (!ruleToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatchSimulated({
        type: "autoMessages/delete",
        payload: { id: ruleToDelete.id },
      }).unwrap();
      toast.push(
        <Notification title="Rule Deleted" type="success" duration={2000}>
          Rule "{ruleToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== ruleToDelete!.id)
      );
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Delete Rule"
          type="danger"
          duration={3000}
        >
          {error.message || `Could not delete rule.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setRuleToDelete(null);
    }
  }, [dispatchSimulated, ruleToDelete]);
  const [selectedItems, setSelectedItems] = useState<AutoMessageItem[]>([]);
  const handleDeleteSelected = useCallback(async () => {
    // Renamed
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatchSimulated({
        type: "autoMessages/deleteAll",
        payload: { ids: idsToDelete },
      }).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {selectedItems.length} rule(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected rules."}
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
      filterTemplateIds: [],
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
    return [...new Set(allAutoMessages.map((t) => t.name))]
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [allAutoMessages]);

  const templateIdOptions = useMemo(() => {
    return mockMessageTemplateOptions.map((t) => ({
      value: t.value,
      label: t.label,
    }));
  }, []);

  const triggerEventOptions = useMemo(() => {
    return [...new Set(allAutoMessages.map((t) => t.triggerEvent))]
      .sort()
      .map((event) => ({
        value: event,
        label: event
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
  }, [allAutoMessages]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: AutoMessageItem[] = cloneDeep(allAutoMessages);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const names = new Set(filterCriteria.filterNames.map((opt) => opt.value));
      processedData = processedData.filter((item) => names.has(item.name));
    }
    if (
      filterCriteria.filterTemplateIds &&
      filterCriteria.filterTemplateIds.length > 0
    ) {
      const tIds = new Set(
        filterCriteria.filterTemplateIds.map((opt) => opt.value)
      );
      processedData = processedData.filter((item) => tIds.has(item.templateId));
    }
    if (
      filterCriteria.filterTriggerEvents &&
      filterCriteria.filterTriggerEvents.length > 0
    ) {
      const events = new Set(
        filterCriteria.filterTriggerEvents.map((opt) => opt.value)
      );
      processedData = processedData.filter((item) =>
        events.has(item.triggerEvent)
      );
    }
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const statuses = new Set(
        filterCriteria.filterStatus.map(
          (opt) => opt.value as AutoMessageItem["status"]
        )
      );
      processedData = processedData.filter((item) => statuses.has(item.status));
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.templateId.toLowerCase().includes(query) ||
          (item.templateName &&
            item.templateName.toLowerCase().includes(query)) ||
          item.triggerEvent.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query)
        );
      });
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof AutoMessageItem];
        let bVal = b[key as keyof AutoMessageItem];
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
  }, [allAutoMessages, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportToCsv(
      "auto_message_rules_export.csv", // Changed filename
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
    (checked: boolean, row: AutoMessageItem) => {
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
    (checked: boolean, currentRows: Row<AutoMessageItem>[]) => {
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

  const columns: ColumnDef<AutoMessageItem>[] = useMemo(
    () => [
      {
        header: "Rule Name",
        accessorKey: "name",
        enableSorting: true,
        size: 200,
      },
      {
        header: "Template Used",
        accessorKey: "templateId",
        enableSorting: true,
        size: 250,
        cell: (props) => {
          const rule = props.row.original;
          const templateTypeDisplay = rule.templateType ? (
            <Tag
              className={classNames(
                messageTypeColor[rule.templateType] ||
                  "bg-gray-100 text-gray-600",
                "ml-2 text-xs"
              )}
            >
              {rule.templateType}
            </Tag>
          ) : null;
          return (
            <div>
              <span>{rule.templateName || rule.templateId}</span>
              {templateTypeDisplay}
            </div>
          );
        },
      },
      {
        header: "Trigger Event",
        accessorKey: "triggerEvent",
        enableSorting: true,
        size: 180,
        cell: (props) =>
          props.row.original.triggerEvent
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
              ruleStatusColor[props.row.original.status] ||
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
            onChangeStatus={() => handleChangeStatus(props.row.original)} // Pass status change handler
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
            <h5 className="mb-2 sm:mb-0">Auto Message Rules</h5>{" "}
            {/* Changed title */}
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <RuleTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <RuleTable
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

      <RuleSelectedFooter /* Use renamed footer */
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Auto Message Rule"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={600} // Increased width for more fields
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
              form="addAutoMessageForm"
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
          id="addAutoMessageForm"
          onSubmit={addFormMethods.handleSubmit(onAddRuleSubmit)}
          className="flex flex-col gap-y-4"
        >
          <FormItem
            label="Rule Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter rule name (e.g., Welcome Email Rule)"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Message Template"
            invalid={!!addFormMethods.formState.errors.templateId}
            errorMessage={addFormMethods.formState.errors.templateId?.message}
          >
            <Controller
              name="templateId"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select message template"
                  options={mockMessageTemplateOptions}
                  value={mockMessageTemplateOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Trigger Event"
            invalid={!!addFormMethods.formState.errors.triggerEvent}
            errorMessage={addFormMethods.formState.errors.triggerEvent?.message}
          >
            <Controller
              name="triggerEvent"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g., user_registered, order_placed"
                />
              )}
            />
          </FormItem>
          <FormItem label="Rule Status">
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
          <FormItem label="Delay (Optional)">
            <Controller
              name="delay"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g., 1 hour after event, Immediately"
                />
              )}
            />
          </FormItem>
          <FormItem label="Conditions (Optional)">
            <Controller
              name="conditions"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input textArea 
                  {...field}
                  rows={3}
                  placeholder="Describe conditions, e.g., user_role = 'premium' AND order_total > 100"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Auto Message Rule"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={600}
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
              form="editAutoMessageForm"
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
          id="editAutoMessageForm"
          onSubmit={editFormMethods.handleSubmit(onEditRuleSubmit)}
          className="flex flex-col gap-y-4"
        >
          <FormItem
            label="Rule Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter rule name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Message Template"
            invalid={!!editFormMethods.formState.errors.templateId}
            errorMessage={editFormMethods.formState.errors.templateId?.message}
          >
            <Controller
              name="templateId"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select message template"
                  options={mockMessageTemplateOptions}
                  value={mockMessageTemplateOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Trigger Event"
            invalid={!!editFormMethods.formState.errors.triggerEvent}
            errorMessage={
              editFormMethods.formState.errors.triggerEvent?.message
            }
          >
            <Controller
              name="triggerEvent"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., user_registered" />
              )}
            />
          </FormItem>
          <FormItem label="Rule Status">
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
          <FormItem label="Delay (Optional)">
            <Controller
              name="delay"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., 1 hour after event" />
              )}
            />
          </FormItem>
          <FormItem label="Conditions (Optional)">
            <Controller
              name="conditions"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input textArea 
                  {...field}
                  rows={3}
                  placeholder="Describe conditions"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Auto Message Rules"
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
              form="filterAutoMessageForm"
              type="submit"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <Form
          id="filterAutoMessageForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Rule Name(s)">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select rule names..."
                  options={nameOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Template Used">
            <Controller
              name="filterTemplateIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select templates..."
                  options={templateIdOptions} // Uses mockMessageTemplateOptions for labels
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Trigger Event(s)">
            <Controller
              name="filterTriggerEvents"
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
        title="Delete Auto Message Rule"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setRuleToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setRuleToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setRuleToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
      >
        <p>
          Are you sure you want to delete the rule "
          <strong>{ruleToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default AutoMessages;
