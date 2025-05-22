// src/views/your-path/AutoEmailTemplatesListing.tsx

import React, { useState, useMemo, useCallback, Ref } from "react";
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
import { Drawer, Form, FormItem, Input } from "@/components/ui"; // Added Tag if needed for status (not in current type)

// Icons
import {
  TbPencil,
  TbEye,
  TbShare,
  TbDotsVertical,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbMailBolt,
  TbKey,
  TbTrash, // Icon for Auto Email Templates
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// Redux (Optional)
// import { useAppDispatch, useAppSelector } from '@/reduxtool/store';
// import { getAutoEmailTemplatesAction, addAutoEmailTemplateAction, ... } from '@/reduxtool/autoEmailTemplate/middleware';
// import { autoEmailTemplateSelector } from '@/reduxtool/autoEmailTemplate/autoEmailTemplateSlice';

// --- Define Item Type & Constants ---
export type AutoEmailTemplateItem = {
  id: string | number;
  emailType: string; // e.g., "Welcome Email", "Password Reset"
  templateKey: string; // Unique key for the template, e.g., "USER_WELCOME_V1", "ORDER_CONFIRMATION_CUSTOMER"
  categoryName: string; // Key for category dropdown
  departmentName: string; // Key for department dropdown
  // status?: 'active' | 'inactive'; // Optional: if you want a status
};

// --- Dropdown Options (Replace with actual data or fetch from API) ---
const CATEGORY_OPTIONS_AET: { value: string; label: string }[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "transactional", label: "Transactional" },
  { value: "marketing", label: "Marketing Promotion" },
  { value: "support", label: "Support & Ticketing" },
  { value: "internal", label: "Internal Notifications" },
];
const categoryValuesAET = CATEGORY_OPTIONS_AET.map((c) => c.value) as [
  string,
  ...string[]
];

const DEPARTMENT_OPTIONS_AET: { value: string; label: string }[] = [
  { value: "all", label: "All Departments" }, // Generic option
  { value: "marketing_dept", label: "Marketing Department" },
  { value: "sales_dept", label: "Sales Department" },
  { value: "hr_dept", label: "Human Resources" },
  { value: "support_dept", label: "Customer Support" },
  { value: "it_dept", label: "IT Department" },
];
const departmentValuesAET = DEPARTMENT_OPTIONS_AET.map((d) => d.value) as [
  string,
  ...string[]
];

// --- Zod Schema for Add/Edit Form ---
const autoEmailTemplateFormSchema = z.object({
  emailType: z
    .string()
    .min(1, "Email Type is required.")
    .max(100, "Email Type too long."),
  templateKey: z
    .string()
    .min(1, "Template Key is required.")
    .max(50, "Template Key too long.")
    .regex(
      /^[A-Z0-9_]+$/,
      "Key must be uppercase alphanumeric with underscores."
    ),
  categoryName: z.enum(categoryValuesAET, {
    errorMap: () => ({ message: "Please select a category." }),
  }),
  departmentName: z.enum(departmentValuesAET, {
    errorMap: () => ({ message: "Please select a department." }),
  }),
  // status: z.enum(['active', 'inactive']).optional(), // If status is added
});
type AutoEmailTemplateFormData = z.infer<typeof autoEmailTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterEmailTypes: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterTemplateKeys: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategories: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDepartments: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Initial Dummy Data ---
const initialDummyAutoTemplates: AutoEmailTemplateItem[] = [
  {
    id: "AET001",
    emailType: "Welcome New User",
    templateKey: "WELCOME_NEW_USER_V1",
    categoryName: "onboarding",
    departmentName: "marketing_dept",
  },
  {
    id: "AET002",
    emailType: "Password Reset Request",
    templateKey: "PASSWORD_RESET_REQUEST",
    categoryName: "transactional",
    departmentName: "it_dept",
  },
  {
    id: "AET003",
    emailType: "Order Confirmation",
    templateKey: "ORDER_CONFIRM_CUSTOMER_V2",
    categoryName: "transactional",
    departmentName: "sales_dept",
  },
  {
    id: "AET004",
    emailType: "Weekly Newsletter",
    templateKey: "NEWSLETTER_WEEKLY_STANDARD",
    categoryName: "marketing",
    departmentName: "marketing_dept",
  },
];

// --- CSV Exporter ---
const CSV_HEADERS_AET = [
  "ID",
  "Email Type",
  "Template Key",
  "Category",
  "Department",
];
const CSV_KEYS_AET: (keyof AutoEmailTemplateItem)[] = [
  "id",
  "emailType",
  "templateKey",
  "categoryName",
  "departmentName",
];

function exportAutoEmailTemplatesToCsv(
  filename: string,
  rows: AutoEmailTemplateItem[]
) {
  if (!rows || !rows.length) {
    /* ... no data toast ... */ return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row,
    categoryName:
      CATEGORY_OPTIONS_AET.find((c) => c.value === row.categoryName)?.label ||
      row.categoryName,
    departmentName:
      DEPARTMENT_OPTIONS_AET.find((d) => d.value === row.departmentName)
        ?.label || row.departmentName,
  }));
  // ... (Standard exportToCsv logic using preparedRows, CSV_HEADERS_AET, CSV_KEYS_AET)
  const separator = ",";
  const csvContent =
    CSV_HEADERS_AET.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_AET.map((k) => {
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
    /* ... download logic ... */ const url = URL.createObjectURL(blob);
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
  onViewDetail,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
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
      <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};

// --- AutoEmailTemplatesSearch & TableTools (Similar to Units) ---
type AutoEmailTemplatesSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const AutoEmailTemplatesSearch = React.forwardRef<
  HTMLInputElement,
  AutoEmailTemplatesSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
AutoEmailTemplatesSearch.displayName = "AutoEmailTemplatesSearch";

type AutoEmailTemplatesTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
};
const AutoEmailTemplatesTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: AutoEmailTemplatesTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <AutoEmailTemplatesSearch onInputChange={onSearchChange} />
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

// --- AutoEmailTemplatesTable (Similar to UnitsTable) ---
type AutoEmailTemplatesTableProps = {
  /* ... Same props as UnitsTable, but with AutoEmailTemplateItem type ... */
  columns: ColumnDef<AutoEmailTemplateItem>[];
  data: AutoEmailTemplateItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: AutoEmailTemplateItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: AutoEmailTemplateItem) => void;
  onAllRowSelect: (
    checked: boolean,
    rows: Row<AutoEmailTemplateItem>[]
  ) => void;
};
const AutoEmailTemplatesTable = (
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
  }: AutoEmailTemplatesTableProps /* ... DataTable setup ... */
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

// --- AutoEmailTemplatesSelectedFooter (Similar to UnitsSelectedFooter) ---
type AutoEmailTemplatesSelectedFooterProps = {
  selectedItems: AutoEmailTemplateItem[];
  onDeleteSelected: () => void;
};
const AutoEmailTemplatesSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: AutoEmailTemplatesSelectedFooterProps) => {
  /* ... Same as UnitsSelectedFooter, text changed to "Template(s)" ... */
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
              {" "}
              {selectedItems.length} Template
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
        title={`Delete ${selectedItems.length} Template(s)`}
        onClose={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteConfirmOpen(false);
        }}
      >
        <p>Are you sure you want to delete the selected template(s)?</p>
      </ConfirmDialog>
    </>
  );
};

// --- Main AutoEmailTemplatesListing Component ---
const AutoEmailTemplatesListing = () => {
  const [autoEmailTemplatesData, setAutoEmailTemplatesData] = useState<
    AutoEmailTemplateItem[]
  >(initialDummyAutoTemplates);
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "loading"
  >("idle");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AutoEmailTemplateItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<AutoEmailTemplateItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "asc", key: "emailType" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<AutoEmailTemplateItem[]>(
    []
  );

  const formMethods = useForm<AutoEmailTemplateFormData>({
    resolver: zodResolver(autoEmailTemplateFormSchema),
    defaultValues: {
      emailType: "",
      templateKey: "",
      categoryName: categoryValuesAET[0],
      departmentName: departmentValuesAET[0],
    },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset();
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback(
    (item: AutoEmailTemplateItem) => {
      setEditingItem(item);
      formMethods.reset(item);
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setEditingItem(null);
  }, []);

  const onFormSubmit = useCallback(
    async (data: AutoEmailTemplateFormData) => {
      setIsSubmitting(true);
      setMasterLoadingStatus("loading");
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        if (editingItem) {
          const updatedItem: AutoEmailTemplateItem = {
            ...editingItem,
            ...data,
          };
          setAutoEmailTemplatesData((prev) =>
            prev.map((t) => (t.id === updatedItem.id ? updatedItem : t))
          );
          toast.push(<Notification title="Template Updated" type="success" />);
          closeEditDrawer();
        } else {
          const newItem: AutoEmailTemplateItem = {
            ...data,
            id: `AET${Date.now()}`,
          };
          setAutoEmailTemplatesData((prev) => [newItem, ...prev]);
          toast.push(<Notification title="Template Added" type="success" />);
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

  const handleDeleteClick = useCallback((item: AutoEmailTemplateItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    /* ... (delete logic adapted) ... */
    if (!itemToDelete) return;
    setIsDeleting(true);
    /* ... API call ... */ setAutoEmailTemplatesData((prev) =>
      prev.filter((t) => t.id !== itemToDelete.id)
    );
    toast.push(
      <Notification title="Deleted" type="success">
        Template "{itemToDelete.emailType}" deleted.
      </Notification>
    );
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    setIsDeleting(false);
    setItemToDelete(null);
    setSingleDeleteConfirmOpen(false);
  }, [itemToDelete]);
  const handleDeleteSelected = useCallback(async () => {
    /* ... (delete selected logic adapted) ... */
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    /* ... API call ... */ const ids = selectedItems.map((i) => i.id);
    setAutoEmailTemplatesData((prev) =>
      prev.filter((t) => !ids.includes(t.id))
    );
    toast.push(
      <Notification title="Deleted" type="success">
        {selectedItems.length} templates deleted.
      </Notification>
    );
    setSelectedItems([]);
    setIsDeleting(false);
  }, [selectedItems]);

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
  const handleRowSelect = useCallback(
    (checked: boolean, row: AutoEmailTemplateItem) => {
      /* ... */
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<AutoEmailTemplateItem>[]) => {
      /* ... */
    },
    []
  );

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: AutoEmailTemplateItem[] = cloneDeep(
      autoEmailTemplatesData
    );
    if (filterCriteria.filterEmailTypes?.length) {
      const v = filterCriteria.filterEmailTypes.map((et) =>
        et.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        v.includes(item.emailType.toLowerCase())
      );
    }
    if (filterCriteria.filterTemplateKeys?.length) {
      const v = filterCriteria.filterTemplateKeys.map((tk) =>
        tk.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        v.includes(item.templateKey.toLowerCase())
      );
    }
    if (filterCriteria.filterCategories?.length) {
      const v = filterCriteria.filterCategories.map((c) => c.value);
      processedData = processedData.filter((item) =>
        v.includes(item.categoryName)
      );
    }
    if (filterCriteria.filterDepartments?.length) {
      const v = filterCriteria.filterDepartments.map((d) => d.value);
      processedData = processedData.filter((item) =>
        v.includes(item.departmentName)
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(q) ||
          item.emailType.toLowerCase().includes(q) ||
          item.templateKey.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q) ||
          item.departmentName.toLowerCase().includes(q)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof AutoEmailTemplateItem];
        const bVal = b[key as keyof AutoEmailTemplateItem];
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
  }, [autoEmailTemplatesData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    exportAutoEmailTemplatesToCsv(
      "auto_email_templates.csv",
      allFilteredAndSortedData
    );
  }, [allFilteredAndSortedData]);

  const emailTypeOptionsForFilter = useMemo(
    () =>
      autoEmailTemplatesData
        .map((t) => ({ label: t.emailType, value: t.emailType }))
        .filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i),
    [autoEmailTemplatesData]
  );
  const templateKeyOptionsForFilter = useMemo(
    () =>
      autoEmailTemplatesData
        .map((t) => ({ label: t.templateKey, value: t.templateKey }))
        .filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i),
    [autoEmailTemplatesData]
  );

  const columns: ColumnDef<AutoEmailTemplateItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", size: 100, enableSorting: true },
      {
        header: "Email Type",
        accessorKey: "emailType",
        size: 200,
        enableSorting: true,
      },
      {
        header: "Template Key",
        accessorKey: "templateKey",
        size: 200,
        enableSorting: true,
      },
      {
        header: "Category",
        accessorKey: "categoryName",
        size: 150,
        enableSorting: true,
        cell: (props) =>
          CATEGORY_OPTIONS_AET.find((o) => o.value === props.getValue())
            ?.label || props.getValue(),
      },
      {
        header: "Department",
        accessorKey: "departmentName",
        size: 150,
        enableSorting: true,
        cell: (props) =>
          DEPARTMENT_OPTIONS_AET.find((o) => o.value === props.getValue())
            ?.label || props.getValue(),
      },
      {
        header: "Actions",
        id: "action",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <div className="flex items-center justify-center gap-2">
            <ActionColumn
              onEdit={() => openEditDrawer(props.row.original)}
              onDelete={() => handleDeleteClick(props.row.original)}
            />
          </div>
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick]
  );

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Email Type"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.emailType}
        errorMessage={currentFormMethods.formState.errors.emailType?.message}
      >
        <Controller
          name="emailType"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbMailBolt />}
              placeholder="e.g., Welcome Email, Monthly Newsletter"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Template Key"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.templateKey}
        errorMessage={currentFormMethods.formState.errors.templateKey?.message}
      >
        <Controller
          name="templateKey"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbKey />}
              placeholder="e.g., USER_WELCOME_V2 (UPPERCASE_WITH_UNDERSCORES)"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Category"
        invalid={!!currentFormMethods.formState.errors.categoryName}
        errorMessage={currentFormMethods.formState.errors.categoryName?.message}
      >
        <Controller
          name="categoryName"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select Category"
              options={CATEGORY_OPTIONS_AET}
              value={CATEGORY_OPTIONS_AET.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Department"
        invalid={!!currentFormMethods.formState.errors.departmentName}
        errorMessage={
          currentFormMethods.formState.errors.departmentName?.message
        }
      >
        <Controller
          name="departmentName"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select Department"
              options={DEPARTMENT_OPTIONS_AET}
              value={DEPARTMENT_OPTIONS_AET.find(
                (o) => o.value === field.value
              )}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      {/* If status field is added back to AutoEmailTemplateItem & form schema:
            <FormItem label="Status" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}>
                <Controller name="status" control={currentFormMethods.control} render={({ field }) => (
                    <Select placeholder="Select Status" options={[{value: 'active', label: 'Active'}, {value: 'inactive', label: 'Inactive'}]} value={[{value: 'active', label: 'Active'}, {value: 'inactive', label: 'Inactive'}].find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            */}
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              Auto Email Templates
            </h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <AutoEmailTemplatesTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <AutoEmailTemplatesTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
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

      <AutoEmailTemplatesSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      <Drawer
        title={
          editingItem
            ? "Edit Auto Email Template"
            : "Add New Auto Email Template"
        }
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
              form="autoEmailTemplateForm"
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
          id="autoEmailTemplateForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit)}
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
        width={400}
        footer={
          <div className="text-right w-full">
            <Button className="mr-2" size="sm" onClick={onClearFilters} type="button">
              Clear
            </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterAutoEmailTemplateForm"
                type="submit"
              >
                Apply
              </Button>
          </div>
        }
      >
        <Form
          id="filterAutoEmailTemplateForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Email Type">
            <Controller
              name="filterEmailTypes"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Email Type"
                  options={emailTypeOptionsForFilter}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Template Key(s)">
            <Controller
              name="filterTemplateKeys"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Template Key"
                  options={templateKeyOptionsForFilter}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Category">
            <Controller
              name="filterCategories"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Categories"
                  options={CATEGORY_OPTIONS_AET}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Department">
            <Controller
              name="filterDepartments"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Department"
                  options={DEPARTMENT_OPTIONS_AET}
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
        title="Delete Auto Email Template"
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
          Are you sure you want to delete the template "
          <strong>
            {itemToDelete?.emailType} - {itemToDelete?.templateKey}
          </strong>
          "?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default AutoEmailTemplatesListing;
