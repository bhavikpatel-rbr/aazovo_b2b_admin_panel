// src/views/your-path/FormBuilder.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // Uncomment if needed
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames"; // Make sure classnames is imported

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
import Textarea from "@/views/ui-components/forms/Input/Textarea";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Card,
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbCopy,
  TbSwitchHorizontal,
  TbEye,
  TbFileDescription,
  TbListDetails,
  TbQuestionMark,
  TbX,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// Redux (Optional)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getFormsAction, addFormAction, ... } from '@/reduxtool/formbuilder/middleware';
// import { formBuilderSelector } from '@/reduxtool/formbuilder/formBuilderSlice';

// --- Constants for Dropdowns ---
const FORM_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
const formStatusValues = FORM_STATUS_OPTIONS.map((s) => s.value) as [
  string,
  ...string[]
];

const DEPARTMENT_OPTIONS = [
  { value: "eng", label: "Engineering" },
  { value: "mkt", label: "Marketing" },
  { value: "hr", label: "Human Resources" },
  { value: "sales", label: "Sales" },
];
const departmentValues = DEPARTMENT_OPTIONS.map((d) => d.value) as [
  string,
  ...string[]
];

const CATEGORY_OPTIONS = [
  { value: "feedback", label: "Feedback" },
  { value: "survey", label: "Survey" },
  { value: "application", label: "Application" },
  { value: "support", label: "Support Ticket" },
];
const categoryValues = CATEGORY_OPTIONS.map((c) => c.value) as [
  string,
  ...string[]
];

const QUESTION_TYPE_OPTIONS = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "file", label: "File Upload (URL)" }, // For this example, it's a URL input
  { value: "checkbox", label: "Checkbox (Multiple Choice)" },
  { value: "radio", label: "Radio Buttons (Single Choice)" },
  { value: "select", label: "Dropdown (Single Choice)" },
];
const questionTypeValues = QUESTION_TYPE_OPTIONS.map((q) => q.value) as [
  string,
  ...string[]
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100",
  published:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  archived: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- Define Types ---
export type QuestionItem = {
  id?: string; // Used by useFieldArray for key, not necessarily for backend
  questionSectionTitle?: string;
  questionText: string;
  questionType: string;
  // options?: { value: string; label: string }[]; // For checkbox, radio, select
};

export type FormBuilderItem = {
  id: string | number;
  formName: string;
  status: string;
  departmentName: string;
  categoryName: string;
  questions: QuestionItem[];
  // createdDate?: Date;
  // updatedDate?: Date;
};

// --- Zod Schemas ---
const questionSchema = z.object({
  id: z.string().optional(),
  questionSectionTitle: z
    .string()
    .max(150, "Section title too long")
    .optional()
    .or(z.literal("")),
  questionText: z
    .string()
    .min(1, "Question text is required.")
    .max(500, "Question text too long"),
  questionType: z.enum(questionTypeValues, {
    errorMap: () => ({ message: "Select a question type." }),
  }),
  // options: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).optional(), // Add if implementing dynamic options
});

const formBuilderFormSchema = z.object({
  formName: z
    .string()
    .min(1, "Form name is required.")
    .max(150, "Form name too long"),
  status: z.enum(formStatusValues, {
    errorMap: () => ({ message: "Please select a status." }),
  }),
  departmentName: z.enum(departmentValues, {
    errorMap: () => ({ message: "Please select a department." }),
  }),
  categoryName: z.enum(categoryValues, {
    errorMap: () => ({ message: "Please select a category." }),
  }),
  questions: z
    .array(questionSchema)
    .min(1, "At least one question section is required."),
});
type FormBuilderFormData = z.infer<typeof formBuilderFormSchema>;

const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDepartment: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Initial Dummy Data ---
const initialDummyForms: FormBuilderItem[] = [
  {
    id: "FORM001",
    formName: "Employee Feedback Survey Q3",
    status: "published",
    departmentName: "hr",
    categoryName: "survey",
    questions: [
      {
        questionSectionTitle: "General Feedback",
        questionText: "Overall satisfaction with Q3?",
        questionType: "radio",
      },
    ],
  },
  {
    id: "FORM002",
    formName: "New Feature Request Form",
    status: "draft",
    departmentName: "eng",
    categoryName: "feedback",
    questions: [
      {
        questionText: "Please describe the new feature you would like to see.",
        questionType: "textarea",
      },
    ],
  },
  {
    id: "FORM003",
    formName: "Job Application - Senior Frontend Developer",
    status: "published",
    departmentName: "eng",
    categoryName: "application",
    questions: [
      { questionText: "Upload Your Resume/CV", questionType: "file" },
      { questionText: "Years of experience with React?", questionType: "text" },
    ],
  },
];

// --- CSV Exporter Utility ---
const CSV_HEADERS_FORM = [
  "ID",
  "Form Name",
  "Status",
  "Department",
  "Category",
  "Question Count",
];
const CSV_KEYS_FORM: (keyof FormBuilderItem | "questionCount")[] = [
  "id",
  "formName",
  "status",
  "departmentName",
  "categoryName",
  "questionCount",
];

function exportFormsToCsv(filename: string, rows: FormBuilderItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row,
    departmentName:
      DEPARTMENT_OPTIONS.find((d) => d.value === row.departmentName)?.label ||
      row.departmentName,
    categoryName:
      CATEGORY_OPTIONS.find((c) => c.value === row.categoryName)?.label ||
      row.categoryName,
    status:
      FORM_STATUS_OPTIONS.find((s) => s.value === row.status)?.label ||
      row.status,
    questionCount: row.questions.length,
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_FORM.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_FORM.map((k) => {
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
  onClone,
  onView,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
  onClone: () => void;
  onView: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Tooltip title="View Details">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300"
          )}
          role="button"
          onClick={onView}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Edit Form">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-300"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Clone Form">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300"
          )}
          role="button"
          onClick={onClone}
        >
          <TbCopy />
        </div>
      </Tooltip>
      <Tooltip title="Change Status">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-300"
          )}
          role="button"
          onClick={onChangeStatus}
        >
          <TbSwitchHorizontal />
        </div>
      </Tooltip>
      <Tooltip title="Delete Form">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-300"
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

// --- Search and TableTools ---
type FormBuilderSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const FormBuilderSearch = React.forwardRef<
  HTMLInputElement,
  FormBuilderSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Search forms by name or ID..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
FormBuilderSearch.displayName = "FormBuilderSearch";

type FormBuilderTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
};
const FormBuilderTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: FormBuilderTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <FormBuilderSearch onInputChange={onSearchChange} />
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

// --- Main FormBuilder Component ---
const FormBuilder = () => {
  const [formsData, setFormsData] =
    useState<FormBuilderItem[]>(initialDummyForms);
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "loading"
  >("idle");

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FormBuilderItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<FormBuilderItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FormBuilderItem | null>(
    null
  );

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<FormBuilderItem[]>([]);

  const formMethods = useForm<FormBuilderFormData>({
    resolver: zodResolver(formBuilderFormSchema),
    defaultValues: {
      formName: "",
      status: formStatusValues[0],
      departmentName: departmentValues[0],
      categoryName: categoryValues[0],
      questions: [
        {
          questionSectionTitle: "",
          questionText: "",
          questionType: questionTypeValues[0],
        },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
    replace: replaceQuestions,
  } = useFieldArray({
    control: formMethods.control,
    name: "questions",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  // --- CRUD & Action Handlers ---
  const openAddDrawer = () => {
    formMethods.reset({
      formName: "",
      status: formStatusValues[0],
      departmentName: departmentValues[0],
      categoryName: categoryValues[0],
      questions: [
        {
          questionSectionTitle: "",
          questionText: "",
          questionType: questionTypeValues[0],
        },
      ],
    });
    // replaceQuestions([{ questionSectionTitle: '', questionText: '', questionType: questionTypeValues[0] }]); // Ensure field array is reset correctly
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => setIsAddDrawerOpen(false);

  const openEditDrawer = (item: FormBuilderItem) => {
    setEditingItem(item);
    formMethods.reset({
      // Reset the whole form with item data
      ...item,
      questions:
        item.questions.length > 0
          ? item.questions
          : [
              {
                questionSectionTitle: "",
                questionText: "",
                questionType: questionTypeValues[0],
              },
            ],
    });
    // replaceQuestions(item.questions.length > 0 ? item.questions : [{ questionSectionTitle: '', questionText: '', questionType: questionTypeValues[0] }]);
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingItem(null);
  };

  const openViewDialog = (item: FormBuilderItem) => setViewingItem(item);
  const closeViewDialog = () => setViewingItem(null);

  const onSubmit = async (data: FormBuilderFormData, addAnother?: boolean) => {
    setIsSubmitting(true);
    setMasterLoadingStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      if (editingItem) {
        const updatedItem: FormBuilderItem = { ...data, id: editingItem.id }; // Keep original ID
        setFormsData((prev) =>
          prev.map((f) => (f.id === updatedItem.id ? updatedItem : f))
        );
        toast.push(
          <Notification title="Form Updated" type="success" duration={2000} />
        );
        closeEditDrawer();
      } else {
        const newItem: FormBuilderItem = { ...data, id: `FORM${Date.now()}` };
        setFormsData((prev) => [newItem, ...prev]);
        toast.push(
          <Notification title="Form Created" type="success" duration={2000} />
        );
        if (addAnother) {
          formMethods.reset({
            formName: "",
            status: formStatusValues[0],
            departmentName: departmentValues[0],
            categoryName: categoryValues[0],
            questions: [
              {
                questionSectionTitle: "",
                questionText: "",
                questionType: questionTypeValues[0],
              },
            ],
          });
          // replaceQuestions([{ questionSectionTitle: '', questionText: '', questionType: questionTypeValues[0] }]);
        } else {
          closeAddDrawer();
        }
      }
    } catch (e: any) {
      toast.push(
        <Notification
          title={editingItem ? "Update Failed" : "Create Failed"}
          type="danger"
          duration={3000}
        >
          {e.message}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
      setMasterLoadingStatus("idle");
    }
  };

  const handleDeleteClick = (item: FormBuilderItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setMasterLoadingStatus("loading");
    setSingleDeleteConfirmOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      setFormsData((prev) => prev.filter((f) => f.id !== itemToDelete!.id));
      toast.push(
        <Notification
          title="Form Deleted"
          type="success"
          duration={2000}
        >{`Form "${itemToDelete.formName}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((f) => f.id !== itemToDelete!.id));
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {e.message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setMasterLoadingStatus("idle");
      setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select forms to delete.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);
    setMasterLoadingStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const idsToDelete = selectedItems.map((item) => item.id);
      setFormsData((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
      toast.push(
        <Notification title="Forms Deleted" type="success" duration={2000}>
          {selectedItems.length} form(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {e.message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setMasterLoadingStatus("idle");
    }
  };

  const handleChangeStatus = async (item: FormBuilderItem) => {
    setIsChangingStatus(true);
    const currentStatusIndex = FORM_STATUS_OPTIONS.findIndex(
      (s) => s.value === item.status
    );
    const nextStatusValue =
      FORM_STATUS_OPTIONS[(currentStatusIndex + 1) % FORM_STATUS_OPTIONS.length]
        .value;
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      setFormsData((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: nextStatusValue } : f
        )
      );
      toast.push(
        <Notification
          title="Status Changed"
          type="success"
          duration={2000}
        >{`Form "${item.formName}" status changed to ${
          FORM_STATUS_OPTIONS.find((s) => s.value === nextStatusValue)?.label
        }.`}</Notification>
      );
    } catch (e: any) {
      toast.push(
        <Notification
          title="Status Change Failed"
          type="danger"
          duration={3000}
        >
          {e.message}
        </Notification>
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleCloneForm = async (itemToClone: FormBuilderItem) => {
    setIsCloning(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const clonedForm: FormBuilderItem = {
        ...cloneDeep(itemToClone),
        id: `FORM${Date.now()}_CLONE`,
        formName: `${itemToClone.formName} (Clone)`,
        status: "draft",
      };
      setFormsData((prev) => [clonedForm, ...prev]);
      toast.push(
        <Notification
          title="Form Cloned"
          type="success"
          duration={2000}
        >{`Form "${itemToClone.formName}" cloned successfully.`}</Notification>
      );
    } catch (e: any) {
      toast.push(
        <Notification title="Clone Failed" type="danger" duration={3000}>
          {e.message}
        </Notification>
      );
    } finally {
      setIsCloning(false);
    }
  };

  // --- Filter Handlers ---
  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 })); // Reset to first page on filter change
    setIsFilterDrawerOpen(false);
  };
  const onClearFilters = () => {
    const defaultFilters = filterFormSchema.parse({}); // Get default from schema
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 })); // Reset to first page
  };

  // --- Table Interaction Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );

  const handleSelectChange = useCallback(
    // This is for page size selector
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
    (checked: boolean, row: FormBuilderItem) => {
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
    (checked: boolean, currentRows: Row<FormBuilderItem>[]) => {
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

  // --- Data Processing (Memoized) ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: FormBuilderItem[] = cloneDeep(formsData);

    if (filterCriteria.filterStatus?.length) {
      const statusValues = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) =>
        statusValues.includes(item.status)
      );
    }
    if (filterCriteria.filterDepartment?.length) {
      const deptValues = filterCriteria.filterDepartment.map((d) => d.value);
      processedData = processedData.filter((item) =>
        deptValues.includes(item.departmentName)
      );
    }
    if (filterCriteria.filterCategory?.length) {
      const catValues = filterCriteria.filterCategory.map((c) => c.value);
      processedData = processedData.filter((item) =>
        catValues.includes(item.categoryName)
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          item.formName.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          (
            DEPARTMENT_OPTIONS.find(
              (d) => d.value === item.departmentName
            )?.label.toLowerCase() || ""
          ).includes(query) ||
          (
            CATEGORY_OPTIONS.find(
              (c) => c.value === item.categoryName
            )?.label.toLowerCase() || ""
          ).includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof FormBuilderItem];
        let bVal = b[key as keyof FormBuilderItem];
        if (key === "departmentName") {
          /* ... sort by label ... */
        } else if (key === "categoryName") {
          /* ... sort by label ... */
        } else if (key === "status") {
          /* ... sort by label ... */
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
  }, [formsData, tableData, filterCriteria]);

  // --- Table Column Definitions ---
  const columns: ColumnDef<FormBuilderItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", size: 100, enableSorting: true },
      {
        header: "Form Name",
        accessorKey: "formName",
        size: 250,
        enableSorting: true,
        cell: (props) => (
          <span className="font-semibold">{props.getValue<string>()}</span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        enableSorting: true,
        cell: (props) => (
          <Tag
            className={classNames(
              "capitalize",
              statusColors[props.getValue<string>()]
            )}
          >
            {
              FORM_STATUS_OPTIONS.find((o) => o.value === props.getValue())
                ?.label
            }
          </Tag>
        ),
      },
      {
        header: "Department",
        accessorKey: "departmentName",
        size: 150,
        enableSorting: true,
        cell: (props) =>
          DEPARTMENT_OPTIONS.find((o) => o.value === props.getValue())?.label ||
          props.getValue(),
      },
      {
        header: "Category",
        accessorKey: "categoryName",
        size: 150,
        enableSorting: true,
        cell: (props) =>
          CATEGORY_OPTIONS.find((o) => o.value === props.getValue())?.label ||
          props.getValue(),
      },
      {
        header: "Actions",
        id: "action",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <div className="flex items-center justify-center gap-2">
            <ActionColumn
              onView={() => openViewDialog(props.row.original)}
              onEdit={() => openEditDrawer(props.row.original)}
              onDelete={() => handleDeleteClick(props.row.original)}
              onChangeStatus={() => handleChangeStatus(props.row.original)}
              onClone={() => handleCloneForm(props.row.original)}
            />
          </div>
        ),
      },
    ],
    [
      handleChangeStatus,
      handleCloneForm,
      handleDeleteClick,
      openEditDrawer,
      openViewDialog,
    ] // Keep minimal stable dependencies
  );

  // --- Render Form for Drawer ---
  const renderDrawerForm = (
    currentFormMethods: typeof formMethods // Renamed parameter
  ) => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormItem
          label="Form Name"
          invalid={!!currentFormMethods.formState.errors.formName}
          errorMessage={currentFormMethods.formState.errors.formName?.message}
        >
          <Controller
            name="formName"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<TbFileDescription />}
                placeholder="e.g., Customer Satisfaction Survey"
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
                placeholder="Select status"
                options={FORM_STATUS_OPTIONS}
                value={FORM_STATUS_OPTIONS.find((o) => o.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Department Name"
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
                placeholder="Select department"
                options={DEPARTMENT_OPTIONS}
                value={DEPARTMENT_OPTIONS.find((o) => o.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Category Name"
          invalid={!!currentFormMethods.formState.errors.categoryName}
          errorMessage={
            currentFormMethods.formState.errors.categoryName?.message
          }
        >
          <Controller
            name="categoryName"
            control={currentFormMethods.control}
            render={({ field }) => (
              <Select
                placeholder="Select category"
                options={CATEGORY_OPTIONS}
                value={CATEGORY_OPTIONS.find((o) => o.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
      </div>

      <div className="border-t my-4 dark:border-gray-600"></div>
      <h5 className="mb-2 text-base font-semibold flex items-center gap-2">
        <TbListDetails /> Questions Section
      </h5>
      {currentFormMethods.formState.errors.questions &&
        !Array.isArray(currentFormMethods.formState.errors.questions) && (
          <p className="text-red-500 text-xs mb-2">
            {currentFormMethods.formState.errors.questions.message}
          </p>
        )}
      <div className="space-y-6">
        {questionFields.map((field, index) => (
          <Card
            key={field.id}
            bodyClass="p-4"
            className="relative bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-600 rounded-lg"
          >
            {questionFields.length > 1 && (
              <Tooltip title="Remove Question Section">
                <Button
                  shape="circle"
                  size="xs"
                  icon={<TbX />}
                  onClick={() => removeQuestion(index)}
                  className="absolute top-2 right-2 !bg-red-100 hover:!bg-red-200 dark:!bg-red-500/30 dark:hover:!bg-red-500/50 text-red-600 dark:text-red-400 !border-red-300 dark:!border-red-500"
                />
              </Tooltip>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormItem
                label={`Question Section Title ${index + 1} (Optional)`}
                className="md:col-span-2"
                invalid={
                  !!currentFormMethods.formState.errors.questions?.[index]
                    ?.questionSectionTitle
                }
                errorMessage={
                  currentFormMethods.formState.errors.questions?.[index]
                    ?.questionSectionTitle?.message
                }
              >
                <Controller
                  name={`questions.${index}.questionSectionTitle`}
                  control={currentFormMethods.control}
                  render={({ field: qField }) => (
                    <Input
                      {...qField}
                      placeholder="e.g., Personal Information"
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={`Question ${index + 1}`}
                className="md:col-span-2"
                invalid={
                  !!currentFormMethods.formState.errors.questions?.[index]
                    ?.questionText
                }
                errorMessage={
                  currentFormMethods.formState.errors.questions?.[index]
                    ?.questionText?.message
                }
              >
                <Controller
                  name={`questions.${index}.questionText`}
                  control={currentFormMethods.control}
                  render={({ field: qField }) => (
                    <Textarea
                      {...qField}
                      rows={2}
                      placeholder="Enter your question here..."
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={`Question Type ${index + 1}`}
                invalid={
                  !!currentFormMethods.formState.errors.questions?.[index]
                    ?.questionType
                }
                errorMessage={
                  currentFormMethods.formState.errors.questions?.[index]
                    ?.questionType?.message
                }
              >
                <Controller
                  name={`questions.${index}.questionType`}
                  control={currentFormMethods.control}
                  render={({ field: qField }) => (
                    <Select
                      placeholder="Select type"
                      options={QUESTION_TYPE_OPTIONS}
                      value={QUESTION_TYPE_OPTIONS.find(
                        (o) => o.value === qField.value
                      )}
                      onChange={(opt) => qField.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              {/* Placeholder for question options: Implement if needed */}
              {["checkbox", "radio", "select"].includes(
                formMethods.watch(`questions.${index}.questionType`)
              ) && (
                <div className="md:col-span-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dynamic options editor for Checkbox/Radio/Select types would
                    go here. (Not implemented in this example).
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Button
        type="button"
        variant="dashed"
        icon={<TbPlus />}
        onClick={() =>
          appendQuestion({
            questionSectionTitle: "",
            questionText: "",
            questionType: questionTypeValues[0],
          })
        }
        className="mt-4 self-start"
      >
        Add Question Section
      </Button>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              <TbFileDescription /> Form Builder
            </h3>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Create New Form
            </Button>
          </div>
          <FormBuilderTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={function (): void {
              throw new Error("Function not implemented.");
            }} // onExport={handleExportData}
          />
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" ||
                isSubmitting ||
                isDeleting ||
                isCloning ||
                isChangingStatus
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              checkboxChecked={(row: FormBuilderItem) =>
                selectedItems.some((selected) => selected.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        hidden={selectedItems.length === 0}
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>Form{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteSelected}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>

      <Drawer
        title={editingItem ? "Edit Form" : "Create New Form"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={900}
        footer={
          <div className="text-right w-full">
            {!editingItem && (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  formMethods.handleSubmit((data) => onSubmit(data, true))()
                }
                loading={isSubmitting}
                disabled={!formMethods.formState.isValid || isSubmitting}
              >
                Save & Create Another
              </Button>
            )}
            <div
              className={
                editingItem || !isAddDrawerOpen ? "w-full text-right" : ""
              }
            >
              {" "}
              {/* Adjust based on add drawer visibility */}
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
                form="formBuilderForm"
                type="submit"
                loading={isSubmitting}
                disabled={!formMethods.formState.isValid || isSubmitting}
              >
                {isSubmitting
                  ? editingItem
                    ? "Saving..."
                    : "Creating..."
                  : editingItem
                  ? "Save Changes"
                  : "Create Form"}
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="formBuilderForm"
          onSubmit={formMethods.handleSubmit((data) => onSubmit(data, false))}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Dialog
        isOpen={!!viewingItem}
        onClose={closeViewDialog}
        onRequestClose={closeViewDialog}
        width={800}
      >
        <h4 className="mb-4">
          Form Details: {viewingItem?.formName} (ID: {viewingItem?.id})
        </h4>
        {viewingItem && (
          <div className="space-y-4 text-sm">
            {/* ... Dialog content ... */}
          </div>
        )}
        <div className="text-right mt-6">
          <Button variant="solid" onClick={closeViewDialog}>
            Close
          </Button>
        </div>
      </Dialog>

      <Drawer
        title="Filter Forms"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onRequestClose={() => setIsFilterDrawerOpen(false)}
        footer={
          <div className="text-right w-full">
            <Button size="sm" onClick={onClearFilters} type="button">
              Clear All
            </Button>
            <div>
              <Button
                size="sm"
                className="mr-2"
                onClick={() => setIsFilterDrawerOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterFormBuilderForm"
                type="submit"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterFormBuilderForm"
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
                  placeholder="Select status(es)..."
                  options={FORM_STATUS_OPTIONS}
                  value={field.value || []}
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
                  placeholder="Select department(s)..."
                  options={DEPARTMENT_OPTIONS}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Category">
            <Controller
              name="filterCategory"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select category(es)..."
                  options={CATEGORY_OPTIONS}
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
        title="Delete Form"
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
          Are you sure you want to delete the form "
          <strong>{itemToDelete?.formName}</strong>"? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default FormBuilder;

// Helper (if not globally available)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
