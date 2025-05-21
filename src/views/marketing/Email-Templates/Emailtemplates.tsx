import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate was unused, Link might be if not used in breadcrumbs
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Added Tag

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbX, // For removing variables
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// import { useAppDispatch } from '@/reduxtool/store' // Using simulated dispatch
// import { masterSelector } from '@/reduxtool/master/masterSlice' // Using simulated selector

// --- Define Email Template Types ---
export interface TemplateVariable {
  id?: string; // For react-hook-form field array key (optional, managed by useFieldArray)
  variableName: string;
  variableType: "string" | "number" | "date" | "boolean" | "array";
}

export type EmailTemplateItem = {
  id: string | number; // DB ID
  name: string;
  templateId: string; // User-defined template ID
  roles?: { value: string; label: string }[];
  departments?: { value: string; label: string }[];
  designations?: { value: string; label: string }[];
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  variables?: TemplateVariable[] | null;
  status: "active" | "inactive" | "draft";
  createdDate?: Date; // Optional for now, can be added
  // For display in table, if IDs are stored:
  categoryName?: string;
  subCategoryName?: string;
  brandName?: string;
};

// --- Zod Schema for Add/Edit Email Template Form ---
const selectOptionSchema = z.object({ value: z.string(), label: z.string() });

const variableSchema = z.object({
  // id: z.string().optional(), // key is managed by useFieldArray, not part of data
  variableName: z
    .string()
    .min(1, "Variable name is required.")
    .max(50, "Name too long"),
  variableType: z.enum(["string", "number", "date", "boolean", "array"], {
    required_error: "Variable type is required.",
  }),
});

const emailTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  templateId: z
    .string()
    .min(1, "Template ID is required.")
    .max(50, "Template ID cannot exceed 50 characters."),
  categoryId: z.string().nullable().optional(),
  subCategoryId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  roles: z.array(selectOptionSchema).optional().default([]),
  departments: z.array(selectOptionSchema).optional().default([]),
  designations: z.array(selectOptionSchema).optional().default([]),
  variables: z.array(variableSchema).optional().default([]),
});
type EmailTemplateFormData = z.infer<typeof emailTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z.array(selectOptionSchema).optional(),
  filterTemplateIds: z.array(selectOptionSchema).optional(),
  filterCategories: z.array(selectOptionSchema).optional(),
  filterSubCategories: z.array(selectOptionSchema).optional(),
  filterBrands: z.array(selectOptionSchema).optional(),
  filterRoles: z.array(selectOptionSchema).optional(),
  filterDepartments: z.array(selectOptionSchema).optional(),
  filterDesignations: z.array(selectOptionSchema).optional(),
  filterStatus: z.array(selectOptionSchema).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Name",
  "Template ID",
  "Status",
  "Roles",
  "Departments",
  "Designations",
  "Category ID",
  "SubCategory ID",
  "Brand ID",
  "Variables",
  "Created Date",
];
const CSV_KEYS: (keyof EmailTemplateItem)[] = [
  "id",
  "name",
  "templateId",
  "status",
  "roles",
  "departments",
  "designations",
  "categoryId",
  "subCategoryId",
  "brandId",
  "variables",
  "createdDate",
];

function exportToCsv(filename: string, rows: EmailTemplateItem[]) {
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
          } else if (Array.isArray(cell)) {
            if (k === "variables") {
              cell = (cell as TemplateVariable[])
                .map((v) => `${v.variableName}:${v.variableType}`)
                .join(" | ");
            } else {
              // Assuming other arrays are {value, label}
              cell = (cell as { value: string; label: string }[])
                .map((item) => item.label)
                .join(" | ");
            }
          } else if (cell instanceof Date) {
            cell = cell.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
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

// --- Mock Data for Select Options ---
const mockCategoryOptions = [
  { value: "cat1", label: "Onboarding" },
  { value: "cat2", label: "Transactional" },
  { value: "cat3", label: "Marketing" },
  { value: "cat4", label: "Internal" },
];
const mockSubCategoryOptions = [
  { value: "sub1", label: "Welcome Email" },
  { value: "sub2", label: "Password Reset" },
  { value: "sub3", label: "Order Confirmation" },
  { value: "sub4", label: "Newsletter" },
];
const mockBrandOptions = [
  { value: "brandA", label: "Brand A" },
  { value: "brandB", label: "Brand B" },
  { value: "brandC", label: "Default Brand" },
];
const mockRoleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "customer", label: "Customer" },
  { value: "employee", label: "Employee" },
];
const mockDepartmentOptions = [
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "support", label: "Support" },
  { value: "hr", label: "Human Resources" },
];
const mockDesignationOptions = [
  { value: "s_rep", label: "Sales Rep" },
  { value: "m_mgr", label: "Marketing Manager" },
  { value: "s_agent", label: "Support Agent" },
];
const variableTypeOptions = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
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

// --- Initial Dummy Data (as in original Emailtemplates.tsx) ---
const initialDummyTemplates: EmailTemplateItem[] = [
  {
    id: "ET001",
    templateId: "welcome_new_user",
    status: "active",
    name: "Welcome - New User Signup",
    roles: [{ value: "Customer", label: "Customer" }],
    categoryId: "cat1",
    categoryName: "Onboarding",
    subCategoryId: "sub1",
    subCategoryName: "Welcome Email",
    brandId: "brandA",
    brandName: "Brand A",
    variables: [
      { variableName: "firstName", variableType: "string" },
      { variableName: "signupDate", variableType: "date" },
    ],
    createdDate: new Date(2023, 9, 1),
  },
  {
    id: "ET002",
    templateId: "pwd_reset_request",
    status: "active",
    name: "Password Reset Request",
    categoryId: "cat2",
    categoryName: "Transactional",
    subCategoryId: "sub2",
    subCategoryName: "Password Reset",
    variables: [
      { variableName: "resetLink", variableType: "string" },
      { variableName: "userName", variableType: "string" },
    ],
    createdDate: new Date(2023, 8, 15),
  },
  {
    id: "ET003",
    templateId: "promo_q4_sale",
    status: "draft",
    name: "Q4 Holiday Promotion",
    roles: [{ value: "Customer", label: "Customer" }],
    departments: [{ value: "Marketing", label: "Marketing" }],
    categoryId: "cat3",
    categoryName: "Marketing",
    subCategoryId: "sub4",
    subCategoryName: "Newsletter", // Example
    brandId: "brandB",
    brandName: "Brand B",
    variables: [
      { variableName: "discountCode", variableType: "string" },
      { variableName: "saleEndDate", variableType: "date" },
    ],
    createdDate: new Date(2023, 10, 1),
  },
];

// --- ActionColumn Component (Simplified like Units.tsx) ---
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

// --- EmailTemplatesSearch Component ---
type EmailTemplatesSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const EmailTemplatesSearch = React.forwardRef<
  HTMLInputElement,
  EmailTemplatesSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick search email templates..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
EmailTemplatesSearch.displayName = "EmailTemplatesSearch";

// --- EmailTemplatesTableTools Component ---
const EmailTemplatesTableTools = ({
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
        <EmailTemplatesSearch onInputChange={onSearchChange} />
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

// --- EmailTemplatesTable Component ---
type EmailTemplatesTableProps = {
  columns: ColumnDef<EmailTemplateItem>[];
  data: EmailTemplateItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: EmailTemplateItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: EmailTemplateItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<EmailTemplateItem>[]) => void;
};
const EmailTemplatesTable = ({
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
}: EmailTemplatesTableProps) => {
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

// --- EmailTemplatesSelectedFooter Component ---
type EmailTemplatesSelectedFooterProps = {
  selectedItems: EmailTemplateItem[];
  onDeleteSelected: () => void;
};
const EmailTemplatesSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: EmailTemplatesSelectedFooterProps) => {
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

// --- Main Emailtemplates Component ---
const Emailtemplates = () => {
  // Simulated Redux Store and Dispatch
  const [allEmailTemplates, setAllEmailTemplates] = useState<
    EmailTemplateItem[]
  >(initialDummyTemplates);
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");

  const dispatchSimulated = async (action: { type: string; payload?: any }) => {
    setLoadingStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate async
    try {
      switch (action.type) {
        case "emailTemplates/get":
          // In a real app, this would fetch from an API
          // For now, we just ensure the local state is set.
          // setAllEmailTemplates(initialDummyTemplates); // Already initialized
          break;
        case "emailTemplates/add":
          setAllEmailTemplates((prev) => [
            {
              ...action.payload,
              id: `ET${Date.now()}`, // Generate ID
              status: "draft", // Default status
              createdDate: new Date(),
            },
            ...prev,
          ]);
          break;
        case "emailTemplates/edit":
          setAllEmailTemplates((prev) =>
            prev.map((item) =>
              item.id === action.payload.id
                ? { ...item, ...action.payload }
                : item
            )
          );
          break;
        case "emailTemplates/delete":
          setAllEmailTemplates((prev) =>
            prev.filter((item) => item.id !== action.payload.id)
          );
          break;
        case "emailTemplates/deleteAll":
          const idsToDelete = new Set(action.payload.ids.split(","));
          setAllEmailTemplates((prev) =>
            prev.filter((item) => !idsToDelete.has(String(item.id)))
          );
          break;
        default:
          console.warn("Unknown action type:", action.type);
      }
      setLoadingStatus("succeeded");
      return { unwrap: () => Promise.resolve() }; // Mimic unwrap
    } catch (error) {
      setLoadingStatus("failed");
      return { unwrap: () => Promise.reject(error) }; // Mimic unwrap
    }
  };
  // End Simulated Redux

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<EmailTemplateItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<EmailTemplateItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  useEffect(() => {
    dispatchSimulated({ type: "emailTemplates/get" });
  }, []);

  const addFormMethods = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: {
      name: "",
      templateId: "",
      categoryId: null,
      subCategoryId: null,
      brandId: null,
      roles: [],
      departments: [],
      designations: [],
      variables: [],
    },
    mode: "onChange",
  });
  const editFormMethods = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateFormSchema),
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const addVariablesArray = useFieldArray({
    control: addFormMethods.control,
    name: "variables",
  });
  const editVariablesArray = useFieldArray({
    control: editFormMethods.control,
    name: "variables",
  });

  const openAddDrawer = () => {
    addFormMethods.reset({
      name: "",
      templateId: "",
      categoryId: null,
      subCategoryId: null,
      brandId: null,
      roles: [],
      departments: [],
      designations: [],
      variables: [],
    });
    addVariablesArray.replace([]); // Clear field array
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
  };
  const onAddTemplateSubmit = async (data: EmailTemplateFormData) => {
    setIsSubmitting(true);
    try {
      await dispatchSimulated({
        type: "emailTemplates/add",
        payload: data,
      }).unwrap();
      toast.push(
        <Notification title="Template Added" type="success" duration={2000}>
          Template "{data.name}" added.
        </Notification>
      );
      closeAddDrawer();
      // dispatchSimulated({ type: 'emailTemplates/get' }); // Refresh list (simulated)
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add template."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (template: EmailTemplateItem) => {
    setEditingTemplate(template);
    editFormMethods.reset({
      name: template.name,
      templateId: template.templateId,
      categoryId: template.categoryId || null,
      subCategoryId: template.subCategoryId || null,
      brandId: template.brandId || null,
      roles: template.roles || [],
      departments: template.departments || [],
      designations: template.designations || [],
      variables: template.variables || [],
    });
    editVariablesArray.replace(template.variables || []); // Ensure field array is updated
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingTemplate(null);
    setIsEditDrawerOpen(false);
  };
  const onEditTemplateSubmit = async (data: EmailTemplateFormData) => {
    if (!editingTemplate) return;
    setIsSubmitting(true);
    try {
      await dispatchSimulated({
        type: "emailTemplates/edit",
        payload: { ...data, id: editingTemplate.id },
      }).unwrap();
      toast.push(
        <Notification title="Template Updated" type="success" duration={2000}>
          Template "{data.name}" updated.
        </Notification>
      );
      closeEditDrawer();
      // dispatchSimulated({ type: 'emailTemplates/get' }); // Refresh list
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update template."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (template: EmailTemplateItem) => {
    setTemplateToDelete(template);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatchSimulated({
        type: "emailTemplates/delete",
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
      // dispatchSimulated({ type: 'emailTemplates/get' }); // Refresh
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
  };
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatchSimulated({
        type: "emailTemplates/deleteAll",
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
      // dispatchSimulated({ type: 'emailTemplates/get' }); // Refresh
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected templates."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page on filter apply
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {}; // Empty object for no filters
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<EmailTemplateItem[]>([]);

  // Options for filter dropdowns
  const nameOptions = useMemo(() => {
    if (!Array.isArray(allEmailTemplates)) return [];
    return [...new Set(allEmailTemplates.map((t) => t.name))].map((name) => ({
      value: name,
      label: name,
    }));
  }, [allEmailTemplates]);

  const templateIdOptions = useMemo(() => {
    if (!Array.isArray(allEmailTemplates)) return [];
    return [...new Set(allEmailTemplates.map((t) => t.templateId))].map(
      (id) => ({ value: id, label: id })
    );
  }, [allEmailTemplates]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: EmailTemplateItem[] = cloneDeep(allEmailTemplates);

    // Apply Filters
    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const names = new Set(filterCriteria.filterNames.map((opt) => opt.value));
      processedData = processedData.filter((item) => names.has(item.name));
    }
    if (
      filterCriteria.filterTemplateIds &&
      filterCriteria.filterTemplateIds.length > 0
    ) {
      const ids = new Set(
        filterCriteria.filterTemplateIds.map((opt) => opt.value)
      );
      processedData = processedData.filter((item) => ids.has(item.templateId));
    }
    if (
      filterCriteria.filterCategories &&
      filterCriteria.filterCategories.length > 0
    ) {
      const cats = new Set(
        filterCriteria.filterCategories.map((opt) => opt.value)
      );
      processedData = processedData.filter(
        (item) => item.categoryId && cats.has(item.categoryId)
      );
    }
    if (
      filterCriteria.filterSubCategories &&
      filterCriteria.filterSubCategories.length > 0
    ) {
      const subCats = new Set(
        filterCriteria.filterSubCategories.map((opt) => opt.value)
      );
      processedData = processedData.filter(
        (item) => item.subCategoryId && subCats.has(item.subCategoryId)
      );
    }
    if (filterCriteria.filterBrands && filterCriteria.filterBrands.length > 0) {
      const brands = new Set(
        filterCriteria.filterBrands.map((opt) => opt.value)
      );
      processedData = processedData.filter(
        (item) => item.brandId && brands.has(item.brandId)
      );
    }
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const statuses = new Set(
        filterCriteria.filterStatus.map(
          (opt) => opt.value as EmailTemplateItem["status"]
        )
      );
      processedData = processedData.filter((item) => statuses.has(item.status));
    }
    if (filterCriteria.filterRoles && filterCriteria.filterRoles.length > 0) {
      const roles = new Set(filterCriteria.filterRoles.map((opt) => opt.value));
      processedData = processedData.filter((item) =>
        item.roles?.some((r) => roles.has(r.value))
      );
    }
    if (
      filterCriteria.filterDepartments &&
      filterCriteria.filterDepartments.length > 0
    ) {
      const depts = new Set(
        filterCriteria.filterDepartments.map((opt) => opt.value)
      );
      processedData = processedData.filter((item) =>
        item.departments?.some((d) => depts.has(d.value))
      );
    }
    if (
      filterCriteria.filterDesignations &&
      filterCriteria.filterDesignations.length > 0
    ) {
      const desigs = new Set(
        filterCriteria.filterDesignations.map((opt) => opt.value)
      );
      processedData = processedData.filter((item) =>
        item.designations?.some((d) => desigs.has(d.value))
      );
    }

    // Apply Search Query
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.templateId.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          (item.categoryId &&
            mockCategoryOptions
              .find((c) => c.value === item.categoryId)
              ?.label.toLowerCase()
              .includes(query)) ||
          (item.subCategoryId &&
            mockSubCategoryOptions
              .find((c) => c.value === item.subCategoryId)
              ?.label.toLowerCase()
              .includes(query)) ||
          (item.brandId &&
            mockBrandOptions
              .find((c) => c.value === item.brandId)
              ?.label.toLowerCase()
              .includes(query)) ||
          item.roles?.some((r) => r.label.toLowerCase().includes(query)) ||
          item.departments?.some((d) =>
            d.label.toLowerCase().includes(query)
          ) ||
          item.designations?.some((d) =>
            d.label.toLowerCase().includes(query)
          ) ||
          item.variables?.some((v) =>
            v.variableName.toLowerCase().includes(query)
          )
        );
      });
    }

    // Apply Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof EmailTemplateItem];
        let bVal = b[key as keyof EmailTemplateItem];

        if (
          key === "roles" ||
          key === "departments" ||
          key === "designations"
        ) {
          aVal = (aVal as { label: string }[])?.[0]?.label || "";
          bVal = (bVal as { label: string }[])?.[0]?.label || "";
        } else if (key === "variables") {
          aVal = (aVal as TemplateVariable[])?.length || 0;
          bVal = (bVal as TemplateVariable[])?.length || 0;
        } else if (key === "categoryId") {
          aVal = mockCategoryOptions.find((c) => c.value === aVal)?.label || "";
          bVal = mockCategoryOptions.find((c) => c.value === bVal)?.label || "";
        }
        // Add similar for subCategory, brand if needed

        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        if (aVal instanceof Date && bVal instanceof Date) {
          return order === "asc"
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }
        // Default to string comparison
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
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
      allFilteredAndSortedData: processedData, // For export
    };
  }, [allEmailTemplates, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsv(
      "email_templates_export.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
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
    (checked: boolean, row: EmailTemplateItem) => {
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
    (checked: boolean, currentRows: Row<EmailTemplateItem>[]) => {
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

  const columns: ColumnDef<EmailTemplateItem>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        cell: (props) => {
          const row = props.row.original;
          return (
            <div>
              <span className="font-semibold">{row.name}</span>
              <div className="text-xs text-gray-500">{row.templateId}</div>
            </div>
          );
        },
      },
      // { header: 'Template ID', accessorKey: 'templateId', enableSorting: true },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
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
        header: "Category",
        accessorKey: "categoryId",
        enableSorting: true,
        cell: (props) =>
          mockCategoryOptions.find(
            (c) => c.value === props.row.original.categoryId
          )?.label || "-",
      },
      {
        header: "SubCategory",
        accessorKey: "subCategoryId",
        enableSorting: true,
        cell: (props) =>
          mockSubCategoryOptions.find(
            (c) => c.value === props.row.original.subCategoryId
          )?.label || "-",
      },
      {
        header: "Brand",
        accessorKey: "brandId",
        enableSorting: true,
        cell: (props) =>
          mockBrandOptions.find((c) => c.value === props.row.original.brandId)
            ?.label || "-",
      },
      {
        header: "Roles",
        accessorKey: "roles",
        enableSorting: true, // Sorting by first role label
        cell: (props) =>
          props.row.original.roles?.map((r) => r.label).join(", ") || "-",
      },
      {
        header: "Departments",
        accessorKey: "departments",
        enableSorting: true,
        cell: (props) =>
          props.row.original.departments?.map((d) => d.label).join(", ") || "-",
      },
      {
        header: "Designations",
        accessorKey: "designations",
        enableSorting: true,
        cell: (props) =>
          props.row.original.designations?.map((d) => d.label).join(", ") ||
          "-",
      },
      {
        header: "Variables",
        accessorKey: "variables",
        enableSorting: true, // Sorting by count
        cell: (props) => {
          const vars = props.row.original.variables;
          return vars && vars.length > 0 ? (
            <Tooltip
              title={vars
                .map((v) => `${v.variableName} (${v.variableType})`)
                .join("\n")}
            >
              <span>{vars.length} Var(s)</span>
            </Tooltip>
          ) : (
            "-"
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    // Dependencies for useMemo should include functions that might change if the component re-renders.
    // Since openEditDrawer and handleDeleteClick are defined with useCallback and stable references,
    // they technically don't need to be here unless their own dependencies change.
    // However, it's safer to include them if their behavior might change.
    // For this example, they are stable.
    []
  );

  const renderVariablesFields = (
    control: any,
    fieldArray: any,
    formMethods: any
  ) => {
    return (
      <div>
        <label className="form-label mb-2">Variables</label>
        {fieldArray.fields.map((field: any, index: number) => (
          <div
            key={field.id}
            className="flex items-start gap-2 mb-3 p-3 border rounded-md"
          >
            <FormItem
              label={`Name ${index + 1}`}
              className="flex-grow"
              invalid={
                !!formMethods.formState.errors.variables?.[index]?.variableName
              }
              errorMessage={
                formMethods.formState.errors.variables?.[index]?.variableName
                  ?.message
              }
            >
              <Controller
                name={`variables.${index}.variableName`}
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., userName" />
                )}
              />
            </FormItem>
            <FormItem
              label={`Type ${index + 1}`}
              className="flex-grow"
              invalid={
                !!formMethods.formState.errors.variables?.[index]?.variableType
              }
              errorMessage={
                formMethods.formState.errors.variables?.[index]?.variableType
                  ?.message
              }
            >
              <Controller
                name={`variables.${index}.variableType`}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={variableTypeOptions}
                    placeholder="Select Type"
                    value={variableTypeOptions.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(option) => field.onChange(option?.value)}
                  />
                )}
              />
            </FormItem>
            <Button
              shape="circle"
              size="sm"
              icon={<TbX />}
              className="mt-7"
              onClick={() => fieldArray.remove(index)}
              type="button"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            fieldArray.append({ variableName: "", variableType: "string" })
          }
        >
          Add Variable
        </Button>
      </div>
    );
  };

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Email Templates</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <EmailTemplatesTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <EmailTemplatesTable
              columns={columns}
              data={pageData}
              loading={
                loadingStatus === "loading" || isSubmitting || isDeleting
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

      <EmailTemplatesSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add/Edit Drawers and Dialogs */}
      {/* Add Drawer */}
      <Drawer
        title="Add Email Template"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={600}
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
              form="addEmailTemplateForm"
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
          id="addEmailTemplateForm"
          onSubmit={addFormMethods.handleSubmit(onAddTemplateSubmit)}
          className="flex flex-col gap-y-4"
        >
          <FormItem
            label="Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Template ID"
            invalid={!!addFormMethods.formState.errors.templateId}
            errorMessage={addFormMethods.formState.errors.templateId?.message}
          >
            <Controller
              name="templateId"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., welcome_email" />
              )}
            />
          </FormItem>
          <FormItem label="Category">
            <Controller
              name="categoryId"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Category"
                  options={mockCategoryOptions}
                  value={mockCategoryOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="SubCategory">
            <Controller
              name="subCategoryId"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select SubCategory"
                  options={mockSubCategoryOptions} // Ideally filter based on category
                  value={mockSubCategoryOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="Brand">
            <Controller
              name="brandId"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Brand"
                  options={mockBrandOptions}
                  value={mockBrandOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="Roles">
            <Controller
              name="roles"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Roles"
                  options={mockRoleOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Departments">
            <Controller
              name="departments"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Departments"
                  options={mockDepartmentOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Designations">
            <Controller
              name="designations"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Designations"
                  options={mockDesignationOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          {renderVariablesFields(
            addFormMethods.control,
            addVariablesArray,
            addFormMethods
          )}
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Email Template"
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
              form="editEmailTemplateForm"
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
          id="editEmailTemplateForm"
          onSubmit={editFormMethods.handleSubmit(onEditTemplateSubmit)}
          className="flex flex-col gap-y-4"
        >
          <FormItem
            label="Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Template ID"
            invalid={!!editFormMethods.formState.errors.templateId}
            errorMessage={editFormMethods.formState.errors.templateId?.message}
          >
            <Controller
              name="templateId"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., welcome_email" />
              )}
            />
          </FormItem>
          <FormItem label="Category">
            <Controller
              name="categoryId"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Category"
                  options={mockCategoryOptions}
                  value={mockCategoryOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="SubCategory">
            <Controller
              name="subCategoryId"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select SubCategory"
                  options={mockSubCategoryOptions}
                  value={mockSubCategoryOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="Brand">
            <Controller
              name="brandId"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Brand"
                  options={mockBrandOptions}
                  value={mockBrandOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(option) => field.onChange(option?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem label="Roles">
            <Controller
              name="roles"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Roles"
                  options={mockRoleOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Departments">
            <Controller
              name="departments"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Departments"
                  options={mockDepartmentOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Designations">
            <Controller
              name="designations"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Designations"
                  options={mockDesignationOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          {renderVariablesFields(
            editFormMethods.control,
            editVariablesArray,
            editFormMethods
          )}
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Email Templates"
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
              form="filterEmailTemplateForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterEmailTemplateForm"
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
          <FormItem label="Filter by Template ID(s)">
            <Controller
              name="filterTemplateIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select template IDs..."
                  options={templateIdOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Category(s)">
            <Controller
              name="filterCategories"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select categories..."
                  options={mockCategoryOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by SubCategory(s)">
            <Controller
              name="filterSubCategories"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select sub-categories..."
                  options={mockSubCategoryOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Brand(s)">
            <Controller
              name="filterBrands"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select brands..."
                  options={mockBrandOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Role(s)">
            <Controller
              name="filterRoles"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select roles..."
                  options={mockRoleOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Department(s)">
            <Controller
              name="filterDepartments"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select departments..."
                  options={mockDepartmentOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Designation(s)">
            <Controller
              name="filterDesignations"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select designations..."
                  options={mockDesignationOptions}
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

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Email Template"
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

export default Emailtemplates;

// Helper (if not globally available or imported from a shared utility)
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
