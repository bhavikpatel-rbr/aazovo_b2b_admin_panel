// src/views/your-path/Documents.tsx

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import DebounceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dropdown,
  Checkbox,
  Card,
  Avatar,
  Dialog,
  Skeleton, // Import Skeleton
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
  TbX,
  TbColumns,
  TbFile,
  TbFileCheck,
  TbFileX,
  TbUserCircle,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux Imports
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  getDocumentListAction,
  addDocumentListAction,
  editDocumentListAction,
  deleteDocumentListAction,
  getDocumentTypeAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";

// --- FEATURE-SPECIFIC TYPES & SCHEMAS ---
export type DocumentItem = {
  id: string | number;
  name: string;
  document_type?: string | number;
  document_type_name?: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
  updated_by_user?: {
    name: string;
    profile_pic_path?: string;
    roles: { display_name: string }[];
  };
};
export type DocumentType = { id: string | number; name: string };
export type SelectOption = { value: string; label: string };
type DocumentFilterSchema = {
  names: string[];
  documentTypeIds: string[];
  status: ("Active" | "Inactive")[];
};
const documentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Document name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  document_type: z.string().min(1, "Document Type is required."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type DocumentFormData = z.infer<typeof documentFormSchema>;
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// --- HELPERS ---
function exportToCsvDocument(filename: string, rows: DocumentItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return;
  }
  const CSV_HEADERS = [
    "ID",
    "Document Name",
    "Document Type",
    "Status",
    "Updated By",
    "Updated Role",
    "Updated At",
  ];
  const preparedRows = rows.map((row) => ({
    id: row.id,
    name: row.name,
    documentTypeNameForCsv: row.document_type_name || "N/A",
    status: row.status,
    updated_by_name: row.updated_by_user?.name || "N/A",
    updated_by_role: row.updated_by_user?.roles[0]?.display_name || "N/A",
    updated_at: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));
  const csvContent = [
    CSV_HEADERS.join(","),
    ...preparedRows.map((row) =>
      [
        row.id,
        `"${String(row.name).replace(/"/g, '""')}"`,
        `"${String(row.documentTypeNameForCsv).replace(/"/g, '""')}"`,
        row.status,
        `"${String(row.updated_by_name).replace(/"/g, '""')}"`,
        `"${String(row.updated_by_role).replace(/"/g, '""')}"`,
        `"${String(row.updated_at).replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.push(
    <Notification title="Export Successful" type="success">
      Data exported to {filename}.
    </Notification>
  );
}

// --- REUSABLE DISPLAY & TOOL COMPONENTS ---
const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
  docTypeOptions,
}) => {
  const activeNames = filterData.names || [];
  const activeTypes = filterData.documentTypeIds || [];
  const activeStatuses = filterData.status || [];
  const hasActiveFilters =
    activeNames.length > 0 ||
    activeTypes.length > 0 ||
    activeStatuses.length > 0;
  if (!hasActiveFilters) return null;
  const getDocTypeName = (id: string) =>
    docTypeOptions.find((opt) => opt.value === id)?.label || id;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {activeNames.map((name) => (
        <Tag
          key={`name-${name}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          Name: {name}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("names", name)}
          />
        </Tag>
      ))}
      {activeTypes.map((typeId) => (
        <Tag
          key={`type-${typeId}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          Type: {getDocTypeName(typeId)}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("documentTypeIds", typeId)}
          />
        </Tag>
      ))}
      {activeStatuses.map((status) => (
        <Tag
          key={`status-${status}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          Status: {status}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("status", status)}
          />
        </Tag>
      ))}
      {hasActiveFilters && (
        <Button
          size="xs"
          variant="plain"
          className="text-red-600 hover:text-red-500 hover:underline ml-auto"
          onClick={onClearAll}
        >
          Clear All
        </Button>
      )}
    </div>
  );
};

const DocumentTableTools = React.forwardRef(
  (
    {
      onSearchChange,
      onApplyFilters,
      onClearFilters,
      onExport,
      activeFilters,
      activeFilterCount,
      documentNameOptions,
      documentTypeOptions,
      columns,
      filteredColumns,
      setFilteredColumns,
      searchInputValue,
      isDataReady,
    },
    ref
  ) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { control, handleSubmit, setValue } = useForm<DocumentFilterSchema>({
      defaultValues: { names: [], documentTypeIds: [], status: [] },
    });
    useEffect(() => {
      setValue("names", activeFilters.names || []);
      setValue("documentTypeIds", activeFilters.documentTypeIds || []);
      setValue("status", activeFilters.status || []);
    }, [activeFilters, setValue]);
    const onSubmit = (data: DocumentFilterSchema) => {
      onApplyFilters(data);
      setIsFilterDrawerOpen(false);
    };
    const onDrawerClear = () => {
      onApplyFilters({});
      setIsFilterDrawerOpen(false);
    };
    const toggleColumn = (checked: boolean, colHeader: string) => {
      if (checked) {
        setFilteredColumns((currentCols) => {
          const newVisibleHeaders = [
            ...currentCols.map((c) => c.header as string),
            colHeader,
          ];
          return columns.filter((c) =>
            newVisibleHeaders.includes(c.header as string)
          );
        });
      } else {
        setFilteredColumns((currentCols) =>
          currentCols.filter((c) => c.header !== colHeader)
        );
      }
    };
    const isColumnVisible = (header: string) =>
      filteredColumns.some((c) => c.header === header);
    return (
      <div className="md:flex items-center justify-between w-full gap-2">
        <div className="flex-grow mb-2 md:mb-0">
          <DebounceInput
            value={searchInputValue}
            placeholder="Quick Search..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Dropdown
            renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />}
            placement="bottom-end"
          >
            <div className="flex flex-col p-2">
              <div className="font-semibold mb-1 border-b pb-1">
                Toggle Columns
              </div>
              {columns.map(
                (col) =>
                  col.header && (
                    <div
                      key={col.header as string}
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"
                    >
                      <Checkbox
                        name={col.header as string}
                        checked={isColumnVisible(col.header as string)}
                        onChange={(checked) =>
                          toggleColumn(checked, col.header as string)
                        }
                      />
                      {col.header}
                    </div>
                  )
              )}
            </div>
          </Dropdown>
          <Button
            title="Clear Filters & Reload"
            icon={<TbReload />}
            onClick={onClearFilters}
            disabled={!isDataReady}
          />
          <Button
            icon={<TbFilter />}
            onClick={() => setIsFilterDrawerOpen(true)}
            disabled={!isDataReady}
          >
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button icon={<TbCloudUpload />} onClick={onExport} disabled={!isDataReady}>
            Export
          </Button>
        </div>
        <Drawer
          title="Filters"
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          footer={
            <div className="text-right w-full">
              <Button size="sm" className="mr-2" onClick={onDrawerClear}>
                Clear
              </Button>
              <Button
                size="sm"
                variant="solid"
                type="submit"
                form="filterDocumentForm"
              >
                Apply
              </Button>
            </div>
          }
        >
          <Form
            id="filterDocumentForm"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormItem label="Document Name">
              <Controller
                name="names"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    placeholder="Select names..."
                    options={documentNameOptions}
                    value={documentNameOptions.filter((o) =>
                      field.value?.includes(o.value)
                    )}
                    onChange={(val) => field.onChange(val.map((v) => v.value))}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Document Type">
              <Controller
                name="documentTypeIds"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    placeholder="Select types..."
                    options={documentTypeOptions}
                    value={documentTypeOptions.filter((o) =>
                      field.value?.includes(o.value)
                    )}
                    onChange={(val) => field.onChange(val.map((v) => v.value))}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    placeholder="Select status..."
                    options={statusOptions}
                    value={statusOptions.filter((o) =>
                      field.value?.includes(o.value)
                    )}
                    onChange={(val) => field.onChange(val.map((v) => v.value))}
                  />
                )}
              />
            </FormItem>
          </Form>
        </Drawer>
      </div>
    );
  }
);
DocumentTableTools.displayName = "DocumentTableTools";

// --- MAIN DOCUMENTS COMPONENT ---
const Documents = () => {
  const dispatch = useAppDispatch();
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(
    null
  );
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Partial<DocumentFilterSchema>
  >({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  const {
    DocumentListData = [],
    DocumentTypeData = [],
  } = useSelector(masterSelector, shallowEqual);

  const isDataReady = !initialLoading && !isSubmitting && !isDeleting;
  
  const documentTypeOptionsForSelect = useMemo(
    () =>
      Array.isArray(DocumentTypeData)
        ? DocumentTypeData.map((type: DocumentType) => ({
            value: String(type.id),
            label: type.name,
          }))
        : [],
    [DocumentTypeData]
  );
  const documentNameOptionsForFilter = useMemo(
    () =>
      Array.isArray(DocumentListData)
        ? [...new Set(DocumentListData.map((doc) => doc.name))]
            .sort()
            .map((name) => ({ value: name, label: name }))
        : [],
    [DocumentListData]
  );

  const refreshData = useCallback(async () => {
    setInitialLoading(true);
    try {
        await Promise.all([
            dispatch(getDocumentListAction()),
            dispatch(getDocumentTypeAction())
        ]);
    } catch (error) {
        console.error("Failed to refresh data:", error);
        toast.push(<Notification title="Data Refresh Failed" type="danger">Could not reload document data.</Notification>);
    } finally {
        setInitialLoading(false);
    }
}, [dispatch]);

useEffect(() => {
    refreshData();
}, [refreshData]);


  const formMethods = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { name: "", document_type: "", status: "Active" },
    mode: "onChange",
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const openImageViewer = (imageUrl: string | null | undefined) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  };
  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageToView(null);
  };

  const columns: ColumnDef<DocumentItem>[] = useMemo(
    () => [
      {
        header: "Document Name",
        accessorKey: "name",
        enableSorting: true,
        size: 200,
      },
      {
        header: "Document Type",
        accessorKey: "document_type_name",
        enableSorting: true,
        size: 200,
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 200,
        cell: (props) => {
          const { updated_at, updated_by_user } = props.row.original;
          return (
            <div className="flex items-center gap-2">
              <Avatar
                src={updated_by_user?.profile_pic_path}
                shape="circle"
                size="sm"
                icon={<TbUserCircle />}
                className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                onClick={() =>
                  openImageViewer(updated_by_user?.profile_pic_path)
                }
              />
              <div>
                <span>{updated_by_user?.name || "N/A"}</span>
                <div className="text-xs">
                  <b>{updated_by_user?.roles?.[0]?.display_name || ""}</b>
                </div>
                <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => (
          <Tag
            className={classNames({
              "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-b border-emerald-300 dark:border-emerald-700":
                props.row.original.status === "Active",
              "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-b border-red-300 dark:border-red-700":
                props.row.original.status === "Inactive",
            })}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Action",
        id: "action",
        size: 80,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <div className="flex items-center justify-center gap-2">
            <Tooltip title="Edit">
              <div
                className="text-lg p-1.5 cursor-pointer hover:text-blue-500"
                onClick={() => openEditDrawer(props.row.original)}
              >
                <TbPencil />
              </div>
            </Tooltip>
            {/* <Tooltip title="Delete">
              <div
                  className="text-lg p-1.5 cursor-pointer hover:text-red-500"
                  onClick={() => handleDeleteClick(props.row.original)}
              >
                  <TbTrash />
              </div>
            </Tooltip> */}
          </div>
        ),
      },
    ],
    []
  );

  const [filteredColumns, setFilteredColumns] =
    useState<ColumnDef<DocumentItem>[]>(columns);
  useEffect(() => {
    setFilteredColumns(columns);
  }, [columns]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDerivedFields: DocumentItem[] = (
      DocumentListData || []
    ).map((doc) => ({
      ...doc,
      document_type_name:
        documentTypeOptionsForSelect.find(
          (opt) => opt.value === String(doc.document_type)
        )?.label || "N/A",
    }));
    let processedData: DocumentItem[] = cloneDeep(sourceDataWithDerivedFields);
    if (activeFilters.names?.length) {
      const names = new Set(activeFilters.names.map((n) => n.toLowerCase()));
      processedData = processedData.filter((item) =>
        names.has(item.name.toLowerCase())
      );
    }
    if (activeFilters.documentTypeIds?.length) {
      const typeIds = new Set(activeFilters.documentTypeIds);
      processedData = processedData.filter((item) =>
        typeIds.has(String(item.document_type))
      );
    }
    if (activeFilters.status?.length) {
      const statuses = new Set(activeFilters.status);
      processedData = processedData.filter((item) => statuses.has(item.status));
    }

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.document_type_name?.toLowerCase().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.updated_by_user?.name?.toLowerCase().includes(query)
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        const aValue = a[key as keyof DocumentItem] ?? "";
        const bValue = b[key as keyof DocumentItem] ?? "";
        if (key === "updated_at") {
          const dateA = aValue ? new Date(aValue as string).getTime() : 0;
          const dateB = bValue ? new Date(bValue as string).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        return order === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [
    DocumentListData,
    documentTypeOptionsForSelect,
    tableData,
    activeFilters,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.names?.length) count++;
    if (activeFilters.documentTypeIds?.length) count++;
    if (activeFilters.status?.length) count++;
    return count;
  }, [activeFilters]);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectPageSizeChange = useCallback(
    (value: number) =>
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleSearchChange = useCallback((query: string) => {
    setTableData((prev) => ({
      ...prev,
      query: query,
      pageIndex: 1,
    }));
  }, []);

  const handleApplyFilters = useCallback(
    (filters: Partial<DocumentFilterSchema>) => {
      setActiveFilters(filters);
      handleSetTableData({ pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleRemoveFilter = useCallback(
    (key: keyof DocumentFilterSchema, value: string) => {
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        const currentValues = prev[key] as string[] | undefined;
        if (!currentValues) return prev;
        const newValues = currentValues.filter((item) => item !== value);
        if (newValues.length > 0) {
          (newFilters as any)[key] = newValues;
        } else {
          delete newFilters[key];
        }
        return newFilters;
      });
      handleSetTableData({ pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const onClearFiltersAndReload = () => {
    setActiveFilters({});
    setTableData({ ...tableData, query: "", pageIndex: 1 });
    refreshData();
  };
  const handleClearAllFilters = useCallback(
    () => onClearFiltersAndReload(),
    [onClearFiltersAndReload]
  );

  const handleCardClick = (status: "Active" | "Inactive" | "All") => {
    handleSetTableData({ query: "", pageIndex: 1 });
    if (status === "All") {
      setActiveFilters({});
    } else {
      setActiveFilters({ status: [status] });
    }
  };

  const openAddDrawer = () => {
    formMethods.reset({
      name: "",
      document_type: documentTypeOptionsForSelect[0]?.value || "",
      status: "Active",
    });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
  };
  const onAddDocumentSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        addDocumentListAction({
          name: data.name,
          document_type: data.document_type,
          status: data.status,
        })
      ).unwrap();
      toast.push(
        <Notification
          title="Document Added"
          type="success"
        >{`Document "${data.name}" was successfully added.`}</Notification>
      );
      closeAddDrawer();
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add Document" type="danger">
          {error.message || "An unexpected error occurred."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const openEditDrawer = (doc: DocumentItem) => {
    setEditingDocument(doc);
    formMethods.reset({
      name: doc.name,
      document_type: String(doc.document_type || ""),
      status: doc.status || "Active",
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingDocument(null);
  };
  const onEditDocumentSubmit = async (data: DocumentFormData) => {
    if (!editingDocument?.id) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        editDocumentListAction({
          id: editingDocument.id,
          name: data.name,
          document_type: data.document_type,
          status: data.status,
        })
      ).unwrap();
      toast.push(
        <Notification
          title="Document Updated"
          type="success"
        >{`"${data.name}" was successfully updated.`}</Notification>
      );
      closeEditDrawer();
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update Document" type="danger">
          {error.message || "An unexpected error occurred."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteClick = (doc: DocumentItem) => {
    setDocumentToDelete(doc);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!documentToDelete?.id) return;
    setIsDeleting(true);
    try {
      await dispatch(
        deleteDocumentListAction({ id: documentToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Document Deleted"
          type="success"
        >{`"${documentToDelete.name}" was successfully deleted.`}</Notification>
      );
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete Document" type="danger">
          {error.message || "An unexpected error occurred."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setSingleDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset();
    setIsExportReasonModalOpen(true);
  };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `documents_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: "Documents",
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      exportToCsvDocument(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Submit Reason" type="danger">
          {error.message}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const renderCardContent = (count: number) => {
    if (initialLoading) {
        return <Skeleton width={40} height={20} />;
    }
    return <h6 className="text-sm">{count}</h6>;
  };

  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Documents</h5>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                Add New
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto mb-4 gap-4">
            <Tooltip title="Click to show all documents">
              <div onClick={() => handleCardClick("All")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-blue-200")}
                >
                  <div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100">
                    <TbFile size={20} />
                  </div>
                  <div>
                    {renderCardContent(DocumentListData.length)}
                    <span className="text-xs">Total</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show active documents">
              <div onClick={() => handleCardClick("Active")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-emerald-200")}
                >
                  <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100">
                    <TbFileCheck size={20} />
                  </div>
                  <div>
                    {renderCardContent(DocumentListData?.filter((d) => d.status === "Active").length)}
                    <span className="text-xs">Active</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show inactive documents">
              <div onClick={() => handleCardClick("Inactive")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-red-200")}
                >
                  <div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100">
                    <TbFileX size={20} />
                  </div>
                  <div>
                  {renderCardContent(DocumentListData?.filter((d) => d.status === "Inactive").length)}
                    <span className="text-xs">Inactive</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
          </div>
          <div className="mb-4">
            <DocumentTableTools
              onSearchChange={handleSearchChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={onClearFiltersAndReload}
              onExport={handleOpenExportReasonModal}
              activeFilters={activeFilters}
              activeFilterCount={activeFilterCount}
              documentNameOptions={documentNameOptionsForFilter}
              documentTypeOptions={documentTypeOptionsForSelect}
              columns={columns}
              filteredColumns={filteredColumns}
              searchInputValue={tableData?.query}
              setFilteredColumns={setFilteredColumns}
              isDataReady={isDataReady}
            />
          </div>
          <ActiveFiltersDisplay
            filterData={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            docTypeOptions={documentTypeOptionsForSelect}
          />
          {(activeFilterCount > 0 || tableData.query) && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Found <strong>{total}</strong> matching document.
            </div>
          )}
          <div className="flex-grow overflow-auto">
            <DataTable
              columns={filteredColumns}
              data={pageData}
              noData={pageData.length <= 0}
              loading={initialLoading || isSubmitting || isDeleting}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectPageSizeChange}
              onSort={handleSort}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <Drawer
        title="Add Document"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={460}
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
              form="addDocumentForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="addDocumentForm"
          onSubmit={formMethods.handleSubmit(onAddDocumentSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label={
              <div>
                Document Name <span className="text-red-500">*</span>
              </div>
            }
            invalid={!!formMethods.formState.errors.name}
            errorMessage={formMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={formMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Document Name" />
              )}
            />
          </FormItem>
          <FormItem
            label={
              <div>
                Document Type <span className="text-red-500">*</span>
              </div>
            }
            invalid={!!formMethods.formState.errors.document_type}
            errorMessage={formMethods.formState.errors.document_type?.message}
          >
            <Controller
              name="document_type"
              control={formMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Document Type"
                  options={documentTypeOptionsForSelect}
                  value={
                    documentTypeOptionsForSelect.find(
                      (o) => o.value === field.value
                    ) || null
                  }
                  onChange={(o) => field.onChange(o ? o.value : "")}
                />
              )}
            />
          </FormItem>
          <FormItem
            label={
              <div>
                Status <span className="text-red-500">*</span>
              </div>
            }
            invalid={!!formMethods.formState.errors.status}
            errorMessage={formMethods.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={formMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Status"
                  options={statusOptions}
                  value={
                    statusOptions.find((o) => o.value === field.value) || null
                  }
                  onChange={(o) => field.onChange(o ? o.value : "")}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <Drawer
        title="Edit Document"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={480}
        bodyClass="relative"
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
              form="editDocumentForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="editDocumentForm"
          onSubmit={formMethods.handleSubmit(onEditDocumentSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label={
              <div>
                Document Name <span className="text-red-500">*</span>
              </div>
            }
            invalid={!!formMethods.formState.errors.name}
            errorMessage={formMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={formMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Document Name" />
              )}
            />
          </FormItem>
          <FormItem
            label={
              <div>
                Document Type <span className="text-red-500">*</span>
              </div>
            }
            invalid={!!formMethods.formState.errors.document_type}
            errorMessage={formMethods.formState.errors.document_type?.message}
          >
            <Controller
              name="document_type"
              control={formMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Document Type"
                  options={documentTypeOptionsForSelect}
                  value={
                    documentTypeOptionsForSelect.find(
                      (o) => o.value === field.value
                    ) || null
                  }
                  onChange={(o) => field.onChange(o ? o.value : "")}
                />
              )}
            />
          </FormItem>
          <FormItem
            label={
              <div>
                Status <span className="text-red-500">*</span>
              </div>
            }
            invalid={!!formMethods.formState.errors.status}
            errorMessage={formMethods.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={formMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Status"
                  options={statusOptions}
                  value={
                    statusOptions.find((o) => o.value === field.value) || null
                  }
                  onChange={(o) => field.onChange(o ? o.value : "")}
                />
              )}
            />
          </FormItem>
        </Form>
        {editingDocument && (
          <div className=" grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div>
              <b className="mt-3 mb-3 font-semibold text-primary">
                Latest Update:
              </b>
              <br />
              <p className="text-sm font-semibold">
                {editingDocument.updated_by_user?.name || "N/A"}
              </p>
              <p>
                {editingDocument.updated_by_user?.roles[0]?.display_name ||
                  "N/A"}
              </p>
            </div>
            <div className="text-right">
              <br />
              <span className="font-semibold">Created At:</span>{" "}
              <span>
                {editingDocument.created_at
                  ? `${new Date(
                      editingDocument.created_at
                    ).getDate()} ${new Date(
                      editingDocument.created_at
                    ).toLocaleString("en-US", {
                      month: "short",
                    })} ${new Date(
                      editingDocument.created_at
                    ).getFullYear()}, ${new Date(
                      editingDocument.created_at
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : "N/A"}
              </span>
              <br />
              <span className="font-semibold">Updated At:</span>{" "}
              <span>
                {}
                {editingDocument.updated_at
                  ? `${new Date(
                      editingDocument.updated_at
                    ).getDate()} ${new Date(
                      editingDocument.updated_at
                    ).toLocaleString("en-US", {
                      month: "short",
                    })} ${new Date(
                      editingDocument.updated_at
                    ).getFullYear()}, ${new Date(
                      editingDocument.updated_at
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : "N/A"}
              </span>
            </div>
          </div>
        )}
      </Drawer>
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  placeholder="Enter reason..."
                  rows={3}
                />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Document"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setDocumentToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setDocumentToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the document "
          <strong>{documentToDelete?.name}</strong>"? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        width={600}
      >
        <div className="flex justify-center items-center p-4">
          {imageToView ? (
            <img
              src={imageToView}
              alt="User Profile"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : (
            <p>No image to display.</p>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default Documents;