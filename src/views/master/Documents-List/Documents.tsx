// src/views/your-path/Documents.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames"; // Assuming this is from 'classnames' package

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
// import StickyFooter from "@/components/shared/StickyFooter"; // Still imported, but DocumentSelectedFooter using it is commented
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected
import Select from "@/components/ui/Select"; // Keep alias if needed, or use directly
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Dialog removed, Tag is used

// Icons
import {
  TbPencil,
  TbTrash,
  // TbChecks, // No longer needed for selected footer
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
  // Add other icons if used by ActionColumn or other parts
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  // Row, // No longer needed as onAllRowSelect is commented out
} from "@/components/shared/DataTable";
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
  // deleteAllDocumentListAction, // No longer used as handleDeleteSelected is commented out
  getDocumentTypeAction, // Action to fetch document types
  submitExportReasonAction, // Placeholder for future action
} from "@/reduxtool/master/middleware";

// --- Define DocumentItem Type (matching your API response) ---
export type DocumentItem = {
  id: string | number;
  name: string;
  document_type?: string | number;
  document_type_name?: string;
  status: 'Active' | 'Inactive'; // Added status field
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Define DocumentType Type (what getDocumentTypeAction fetches) ---
export type DocumentType = {
  id: string | number;
  name: string;
};
export type SelectOption = { value: string; label: string };

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

// --- Zod Schema for Add/Edit Document Form ---
const documentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Document name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  document_type: z.string().min(1, "Document Type is required."), // Store ID from select
  status: z.enum(['Active', 'Inactive'], { required_error: "Status is required." }), // Added status
});
type DocumentFormData = z.infer<typeof documentFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDocumentTypeIds: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z // Added status filter
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter Utility ---
const CSV_HEADERS_DOCUMENT = ["ID", "Document Name", "Document Type", "Status", "Updated By", "Updated Role", "Updated At"]; // Added Status
const CSV_KEYS_DOCUMENT: (
  | keyof Pick<DocumentItem, "id" | "name" | "status" | "updated_by_name" | "updated_by_role" | "updated_at"> // Added status
  | "documentTypeNameForCsv"
)[] = ["id", "name", "documentTypeNameForCsv", "status", "updated_by_name", "updated_by_role", "updated_at"];

function exportToCsvDocument(
  filename: string,
  rows: DocumentItem[],
  docTypeOptions: SelectOption[]
) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows = rows.map((row) => ({
    id: row.id,
    name: row.name,
    documentTypeNameForCsv:
      docTypeOptions.find((dt) => dt.value === String(row.document_type))
        ?.label ||
      String(row.document_type) ||
      "N/A",
    status: row.status, // Added status
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_DOCUMENT.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_DOCUMENT.map((k) => {
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
    toast.push(
      <Notification title="Export Successful" type="success">
        Data exported to {filename}.
      </Notification>
    );
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support.
    </Notification>
  );
  return false;
}

// --- ActionColumn, Search, TableTools ---
const ActionColumn = ({
  onEdit,
  // onDelete, // Delete action is commented out from ActionColumn for now
}: {
  onEdit: () => void;
  // onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit">
        <div
          className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* Delete button can be re-added here if needed, using handleDeleteClick */}
    </div>
  );
};
type DocumentSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const DocumentSearch = React.forwardRef<HTMLInputElement, DocumentSearchProps>(
  ({ onInputChange }, ref) => (
    <DebounceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
DocumentSearch.displayName = "DocumentSearch";
type DocumentTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
};
const DocumentTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: DocumentTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <DocumentSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button
        title="Clear Filters"
        icon={<TbReload />}
        onClick={() => onClearFilters()}
      ></Button>
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport} // This will now open the reason modal
        className="w-full sm:w-auto"
      >
        Export
      </Button>
    </div>
  </div>
);

type DocumentTableProps = {
  columns: ColumnDef<DocumentItem>[];
  data: DocumentItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
};
const DocumentTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: DocumentTableProps) => (
  <DataTable
    columns={columns}
    data={data}
    noData={!loading && data.length === 0}
    loading={loading}
    pagingData={pagingData}
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
  />
);

// --- Main Documents Component ---
const Documents = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Kept for single delete
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);


  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterDocumentTypeIds: [],
    filterStatus: [],
  });

  const {
    DocumentListData = [],  
    DocumentTypeData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const documentTypeOptionsForSelect = useMemo(() => {
    if (!Array.isArray(DocumentTypeData)) return [];
    return DocumentTypeData.map((type: DocumentType) => ({
      value: String(type.id),
      label: type.name,
    }));
  }, [DocumentTypeData]);

  useEffect(() => {
    dispatch(getDocumentListAction());
    dispatch(getDocumentTypeAction());
  }, [dispatch]);

  const formMethods = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { name: "", document_type: "", status: 'Active' },
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const openAddDrawer = () => {
    formMethods.reset({
      name: "",
      document_type: documentTypeOptionsForSelect[0]?.value || "",
      status: 'Active',
    });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    formMethods.reset();
    setIsAddDrawerOpen(false);
  };

  const onAddDocumentSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        document_type: data.document_type,
        status: data.status,
      };
      await dispatch(addDocumentListAction(payload)).unwrap();
      toast.push(
        <Notification
          title="Document Added"
          type="success"
        >{`Document "${data.name}" added.`}</Notification>
      );
      closeAddDrawer();
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger">
          {error.message || "Could not add."}
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
      status: doc.status || 'Active',
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingDocument(null);
    formMethods.reset();
    setIsEditDrawerOpen(false);
  };

  const onEditDocumentSubmit = async (data: DocumentFormData) => {
    if (!editingDocument || !editingDocument.id) {
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        document_type: data.document_type,
        status: data.status,
      };
      await dispatch(
        editDocumentListAction({ id: editingDocument.id, ...payload })
      ).unwrap();
      toast.push(
        <Notification
          title="Document Updated"
          type="success"
        >{`"${data.name}" updated.`}</Notification>
      );
      closeEditDrawer();
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger">
          {error.message || "Could not update."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (doc: DocumentItem) => {
    if (!doc.id) return;
    setDocumentToDelete(doc);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!documentToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deleteDocumentListAction({ id: documentToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Document Deleted"
          type="success"
        >{`"${documentToDelete.name}" deleted.`}</Notification>
      );
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger">
          {error.message || `Could not delete.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawerCb = useCallback(
    () => setIsFilterDrawerOpen(false),
    []
  );
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterDocumentTypeIds: data.filterDocumentTypeIds || [],
      filterStatus: data.filterStatus || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawerCb();
  };
  const onClearFilters = () => {
    const defaults = { filterNames: [], filterDocumentTypeIds: [], filterStatus: [] };
    filterFormMethods.reset(defaults);
    setFilterCriteria(defaults);
    handleSetTableData({ pageIndex: 1 });
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const documentNameOptions = useMemo(() => {
    if (!Array.isArray(DocumentListData)) return [];
    const uniqueNames = new Set(DocumentListData.map((doc) => doc.name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [DocumentListData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDerivedFields: DocumentItem[] = Array.isArray(
      DocumentListData
    )
      ? DocumentListData.map((doc) => ({
          ...doc,
          status: doc.status || 'Inactive',
          document_type_name:
            documentTypeOptionsForSelect.find(
              (opt) => opt.value === String(doc.document_type)
            )?.label || "N/A",
        }))
      : [];
    let processedData: DocumentItem[] = cloneDeep(sourceDataWithDerivedFields);

    if (filterCriteria.filterNames?.length) {
      const names = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        names.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterDocumentTypeIds?.length) {
      const typeIds = filterCriteria.filterDocumentTypeIds.map(
        (opt) => opt.value
      );
      processedData = processedData.filter((item) =>
        item.document_type
          ? typeIds.includes(String(item.document_type))
          : false
      );
    }
    if (filterCriteria.filterStatus?.length) {
      const statuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        statuses.includes(item.status)
      );
    }
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.trim().toLowerCase() ?? "").includes(query) ||
          (item.document_type_name?.trim().toLowerCase() ?? "").includes(query) ||
          (item.status?.trim().toLowerCase() ?? "").includes(query) ||
          String(item.id ?? "").trim().toLowerCase().includes(query)
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      (key === "id" || key === "name" || key === "document_type_name" || key === "status" || key === "updated_at" || key === "updated_by_name") &&
      processedData.length > 0
    ) {
      processedData.sort((a, b) => {
        let aValue = a[key as keyof DocumentItem] ?? "";
        let bValue = b[key as keyof DocumentItem] ?? "";

        if (key === "document_type_name") {
            aValue = (a as any).document_type_name || "";
            bValue = (b as any).document_type_name || "";
        }
        
        if (key === 'updated_at') {
            const dateA = aValue ? new Date(aValue as string).getTime() : 0;
            const dateB = bValue ? new Date(bValue as string).getTime() : 0;
            return order === 'asc' ? dateA - dateB : dateB - dateA;
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
    filterCriteria,
  ]);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
        toast.push(
          <Notification title="No Data" type="info">
            Nothing to export.
          </Notification>
        );
        return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Documents";
    try {
      await dispatch(submitExportReasonAction({
        reason: data.reason,
        module: moduleName,
      })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      
      // Proceed with CSV export after successful reason submit
      exportToCsvDocument(
        "documents_export.csv",
        allFilteredAndSortedData,
        documentTypeOptionsForSelect
      );
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
          message={error.message}
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };



  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectPageSizeChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
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

  const columns: ColumnDef<DocumentItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      { header: "Document Name", accessorKey: "name", enableSorting: true, size:200 },
      {
        header: "Document Type",
        accessorKey: "document_type_name",
        enableSorting: true,
        size:200,
        cell: (props) => props.row.original.document_type_name || "N/A",
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        size: 140,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", {
                month: "long",
              })} ${new Date(updated_at).getFullYear()}, ${new Date(
                updated_at
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_name || "N/A"}
                {updated_by_role && <><br /><b>{updated_by_role}</b></>}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
      { 
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 80,
        cell: (props) => {
          const status = props.row.original.status;
          return (
            <Tag
              className={classNames(
                "capitalize font-semibold",
                {
                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500": status === 'Active',
                  "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500": status === 'Inactive',
                }
              )}
            >
              {status}
            </Tag>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 60,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
          />
        ),
      },
    ],
    [documentTypeOptionsForSelect, openEditDrawer]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Documents List</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <DocumentTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <DocumentTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "idle" || isSubmitting || isDeleting
              }
              pagingData={{
                total: total,
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
            label="Document Name"
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
            label="Document Type"
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
                      (option) => option.value === field.value
                    ) || null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Status"
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
                    statusOptions.find(
                      (option) => option.value === field.value
                    ) || null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
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
            label="Document Name"
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
            label="Document Type"
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
                      (option) => option.value === field.value
                    ) || null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Status"
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
                    statusOptions.find(
                      (option) => option.value === field.value
                    ) || null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
                />
              )}
            />
          </FormItem>
        </Form>

        {editingDocument && (
            <div className="absolute bottom-[14%] w-[92%]">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">
                    Latest Update By:
                  </b>
                  <br />
                  <p className="text-sm font-semibold">
                    {editingDocument.updated_by_name || "N/A"}
                  </p>
                  <p>{editingDocument.updated_by_role || "N/A"}</p>
                </div>
                <div>
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>
                    {editingDocument.created_at
                      ? new Date(editingDocument.created_at).toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </span>
                  <br />
                  <span className="font-semibold">Updated At:</span>{" "}
                  <span>
                    {editingDocument.updated_at
                      ? new Date(editingDocument.updated_at).toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
        )}
      </Drawer>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawerCb}
        onRequestClose={closeFilterDrawerCb}
        width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterDocumentForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterDocumentForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Document Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select document names..."
                  options={documentNameOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Document Type">
            <Controller
              name="filterDocumentTypeIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select document types..."
                  options={documentTypeOptionsForSelect}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status..."
                  options={statusOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{
            disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => { 
            e.preventDefault(); 
            exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); 
          }} 
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input textArea {...field} placeholder="Enter reason..." rows={3} />
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
          <strong>{documentToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default Documents;