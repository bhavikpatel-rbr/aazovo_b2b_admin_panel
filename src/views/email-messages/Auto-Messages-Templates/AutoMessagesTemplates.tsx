// src/views/your-path/AutoMessagesTemplates.tsx

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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Define Message Template Type ---
export type MessageTemplateItem = {
  id: string | number;
  name: string;
  type: "SMS" | "PushNotification" | "InApp" | "Webhook" | "Other";
  triggerEvent: string;
  status: "active" | "inactive" | "draft";
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
  triggerEvent: z
    .string()
    .min(1, "Trigger event is required.")
    .max(100, "Trigger event cannot exceed 100 characters."),
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
  "Trigger Event",
  "Status",
  "Created Date",
];
const CSV_KEYS: (keyof MessageTemplateItem)[] = [
  "id",
  "name",
  "type",
  "triggerEvent",
  "status",
  "createdDate",
];

function exportToCsv(filename: string, rows: MessageTemplateItem[]) {
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

// --- Constants for Select Options and Styling ---
const messageTypeOptions = [
  { value: "SMS", label: "SMS" },
  { value: "PushNotification", label: "Push Notification" },
  { value: "InApp", label: "In-App Message" },
  { value: "Webhook", label: "Webhook" },
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

// --- Initial Dummy Data ---
const initialDummyMessageTemplates: MessageTemplateItem[] = [
  {
    id: "AMT001",
    name: "SMS - Appointment Reminder (24hr)",
    type: "SMS",
    triggerEvent: "appointment_scheduled",
    status: "active",
    createdDate: new Date(2023, 9, 10),
  },
  {
    id: "AMT002",
    name: "Push - Order Shipped",
    type: "PushNotification",
    triggerEvent: "order_shipped",
    status: "active",
    createdDate: new Date(2023, 8, 15),
  },
  {
    id: "AMT003",
    name: "InApp - Welcome Tour Step 1",
    type: "InApp",
    triggerEvent: "user_registered",
    status: "draft",
    createdDate: new Date(2023, 10, 1),
  },
  {
    id: "AMT004",
    name: "Webhook - New Lead Notification",
    type: "Webhook",
    triggerEvent: "lead_created",
    status: "active",
    createdDate: new Date(2023, 7, 25),
  },
  {
    id: "AMT005",
    name: "SMS - Password Reset Code",
    type: "SMS",
    triggerEvent: "password_reset_request",
    status: "active",
    createdDate: new Date(2023, 5, 1),
  },
];

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
      <Tooltip title="Delete">
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
      </Tooltip>
    </div>
  );
};

// --- AutoMessagesSearch Component ---
type AutoMessagesSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const AutoMessagesSearch = React.forwardRef<
  HTMLInputElement,
  AutoMessagesSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick search auto messages..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
AutoMessagesSearch.displayName = "AutoMessagesSearch";

// --- AutoMessagesTableTools Component ---
const AutoMessagesTableTools = ({
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
        <AutoMessagesSearch onInputChange={onSearchChange} />
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
type AutoMessagesTableProps = {
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
const AutoMessagesTable = ({
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
}: AutoMessagesTableProps) => {
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
type AutoMessagesSelectedFooterProps = {
  selectedItems: MessageTemplateItem[];
  onDeleteSelected: () => void;
};
const AutoMessagesSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: AutoMessagesSelectedFooterProps) => {
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
              <span>Item{selectedItems.length > 1 ? "s" : ""} selected</span>
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

// --- Main AutoMessagesTemplates Component ---
const AutoMessagesTemplates = () => {
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
            // No explicit action needed as data is initialized
            break;
          case "messageTemplates/add":
            setAllMessageTemplates((prev) => [
              {
                ...action.payload,
                id: `AMT${Date.now()}`,
                status: "draft",
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
    defaultValues: { name: "", type: "SMS", triggerEvent: "" },
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
    // console.log("openAddDrawer function called");
    addFormMethods.reset({ name: "", type: "SMS", triggerEvent: "" });
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
          <Notification title="Template Added" type="success" duration={2000}>
            Template "{data.name}" added.
          </Notification>
        );
        closeAddDrawer();
      } catch (error: any) {
        toast.push(
          <Notification title="Failed to Add" type="danger" duration={3000}>
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
      // console.log("openEditDrawer function called with template:", template);
      setEditingTemplate(template);
      editFormMethods.reset({
        name: template.name,
        type: template.type,
        triggerEvent: template.triggerEvent,
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
        const payload = {
          ...data,
          id: editingTemplate.id,
          status: editingTemplate.status,
        };
        await dispatchSimulated({
          type: "messageTemplates/edit",
          payload: payload,
        }).unwrap();
        toast.push(
          <Notification title="Template Updated" type="success" duration={2000}>
            Template "{data.name}" updated.
          </Notification>
        );
        closeEditDrawer();
      } catch (error: any) {
        toast.push(
          <Notification title="Failed to Update" type="danger" duration={3000}>
            {error.message || "Could not update template."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, editingTemplate, closeEditDrawer]
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
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete template.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  }, [dispatchSimulated, templateToDelete]);

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
  const [selectedItems, setSelectedItems] = useState<MessageTemplateItem[]>([]);

  const nameOptions = useMemo(() => {
    return [...new Set(allMessageTemplates.map((t) => t.name))]
      .sort()
      .map((name) => ({ value: name, label: name }));
  }, [allMessageTemplates]);

  const triggerEventOptions = useMemo(() => {
    return [...new Set(allMessageTemplates.map((t) => t.triggerEvent))]
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
        events.has(item.triggerEvent)
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
          item.triggerEvent.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
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
      "automessages_templates_export.csv",
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
      { header: "Name", accessorKey: "name", enableSorting: true, size: 250 },
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
        header: "Trigger Event",
        accessorKey: "triggerEvent",
        enableSorting: true,
        size: 220,
        cell: (props) =>
          props.row.original.triggerEvent
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 120,
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
        size: 100,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick] // Dependencies for useMemo
  );

  // console.log("Rendering AutoMessagesTemplates. isAddDrawerOpen:", isAddDrawerOpen, "isEditDrawerOpen:", isEditDrawerOpen);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Auto Message Templates</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={() => {
                // console.log("Add New button clicked in JSX");
                openAddDrawer();
              }}
            >
              Add New
            </Button>
          </div>
          <AutoMessagesTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <AutoMessagesTable
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

      <AutoMessagesSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Auto Message Template"
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
                  placeholder="e.g., order_shipped or user_signup"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Auto Message Template"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
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
                <Input
                  {...field}
                  placeholder="e.g., order_shipped or user_signup"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Auto Message Templates"
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
        title="Delete Auto Message Template"
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

export default AutoMessagesTemplates;
