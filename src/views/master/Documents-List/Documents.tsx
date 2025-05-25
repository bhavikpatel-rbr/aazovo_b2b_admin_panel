import React, {
  useState,
  useMemo,
  useCallback,
  Ref,
  useEffect,
  lazy,
  Suspense,
} from "react";
// import { Link, useNavigate } from 'react-router-dom'; // Link/useNavigate not used in this pattern
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
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
} from "@/components/ui"; // Renamed Select to UiSelect to avoid conflict

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
import { useAppDispatch } from "@/reduxtool/store";
import {
  getDocumentListAction, // Assuming this is for fetching the list of documents
  addDocumentListAction, // Action for adding a new document
  editDocumentListAction, // Action for editing a document
  deleteDocumentListAction, // Action for deleting a single document
  deleteAllDocumentListAction, // Action for deleting multiple documents
  // getDocumentTypeAction, // This might be for categories, ensure it's used correctly or removed if not
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define DocumentItem Type (matching your API response) ---
export type DocumentItem = {
  id: string | number; // API returns number, but good to be flexible
  name: string;
  // documentType is not in your provided API response for DocumentList,
  // but it's in your UI. We'll handle it in the form.
  // If documentType comes from a separate API (like DocumentType), you'll need to fetch and map it.
  document_type?: string; // Optional, as it's not in the base API data for a document item
  created_at?: string; // Optional, from API
  updated_at?: string; // Optional, from API
};

// --- Define _t (documentType) Type if fetched separately ---
// This is an assumption. If your categories are hardcoded or come from a different source, adjust accordingly.
export type DocumentType = {
  id: string | number;
  name: string; // This would be the documentType name
};

// --- Zod Schema for Add/Edit Document Form ---
const documentFormSchema = z.object({
  name: z
    .string()
    .min(1, "Document name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  document_type: z // Assuming documentType is a string selected from options
    .string()
    .min(1, "Document Type is required."),
});
type DocumentFormData = z.infer<typeof documentFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategories: z // Filter by documentType
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DOCUMENT = ["ID", "Document Name", "documentType"]; // Added documentType
const CSV_KEYS_DOCUMENT: (keyof (DocumentItem & { document_typeName?: string }))[] =
  ["id", "name", "document_typeName"];

function exportToCsvDocument(
  filename: string,
  rows: DocumentItem[],
  docTypes: DocumentType[]
) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  // Create a map for quick documentType lookup if documentType is an ID
  // const documentTypeMap = new Map(docTypes.map(dt => [String(dt.id), dt.name]));

  const transformedRows = rows.map((row) => ({
    ...row,
    // If `row.document_type` is an ID, look it up. If it's already a name, use it.
    // For now, assuming row.document_typeis already the documentType name string from the form/state.
    document_typeName: row.document_type|| "N/A",
  }));

  const separator = ",";

  const csvContent =
    CSV_HEADERS_DOCUMENT.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_DOCUMENT.map((k) => {
          let cell = row[k];
          if (cell === null || cell === undefined) {
            cell = "";
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

// --- Hardcoded Document Type Options (as per your UI) ---
const documentTypeOptions = [
  { label: "Tax Document", value: "Tax Document" },
  { label: "ID Proofs", value: "ID Proofs" },
  { label: "Business Registrations", value: "Business Registrations" },
  { label: "Address Proofs", value: "Address Proofs" },
  { label: "Bank and Finance", value: "Bank and Finance" },
  { label: "Legal Documents", value: "Legal Documents" },
  {
    label: "Complication and certificate",
    value: "Complication and certificate",
  },
  { label: "Employees", value: "Employees" },
  { label: "Finance & Loans", value: "Finance & Loans" },
  { label: "Visual/Branding", value: "Visual/Branding" },
];

// --- ActionColumn Component (No changes needed) ---
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
    <div className="flex items-center justify-center">
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

// --- DocumentSearch Component ---
type DocumentSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const DocumentSearch = React.forwardRef<HTMLInputElement, DocumentSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        className="w-full"
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
DocumentSearch.displayName = "DocumentSearch";

// --- DocumentTableTools Component ---
const DocumentTableTools = ({
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
        <DocumentSearch onInputChange={onSearchChange} />
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

// --- DocumentTable Component ---
type DocumentTableProps = {
  columns: ColumnDef<DocumentItem>[];
  data: DocumentItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: DocumentItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: DocumentItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<DocumentItem>[]) => void;
};
const DocumentTable = ({
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
}: DocumentTableProps) => {
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

// --- DocumentSelectedFooter Component ---
type DocumentSelectedFooterProps = {
  selectedItems: DocumentItem[];
  onDeleteSelected: () => void;
};
const DocumentSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: DocumentSelectedFooterProps) => {
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
                Document{selectedItems.length > 1 ? "s" : ""} selected
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
        title={`Delete ${selectedItems.length} Document${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected document
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Documents Component ---
const Documents = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(
    null
  );

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterCategories: [],
  });

  // DocumentListData is for the main list of documents.
  // DocumentTypeData might be for categories if fetched from API.
  const {
    DocumentListData = [],
    // DocumentTypeData = [], // Assuming this holds documentType data if fetched via API
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  useEffect(() => {
    dispatch(getDocumentListAction());
    // if (DocumentTypeData.length === 0) { // Fetch categories if not already loaded
    //     dispatch(getDocumentTypeAction());
    // }
  }, [dispatch]);

  const addFormMethods = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { name: "", document_type: "" },
    mode: "onChange",
  });
  const editFormMethods = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { name: "", document_type: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  // const documentTypeOptionsForSelect = useMemo(() => {
  //     // If categories come from an API (e.g., DocumentTypeData)
  //     // if (!Array.isArray(DocumentTypeData)) return [];
  //     // return DocumentTypeData.map((cat: DocumentType) => ({
  //     //     value: String(cat.id), // or cat.name if your backend expects name
  //     //     label: cat.name,
  //     // }));

  //     // If categories are hardcoded (as per your UI example)
  //     return documentTypeOptions;
  // }, [/* DocumentTypeData */]); // Add DocumentTypeData to dependency array if using API for categories

  const openAddDrawer = () => {
    addFormMethods.reset({ name: "", document_type: "" });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset({ name: "", document_type: "" });
    setIsAddDrawerOpen(false);
  };
  const onAddDocumentSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure addDocumentListAction takes the correct payload
      // Your API for adding a document might only need 'name' and 'documentType' (or documentType_id)
      await dispatch(addDocumentListAction(data)).unwrap();
      toast.push(
        <Notification title="Document Added" type="success" duration={2000}>
          Document "{data.name}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add document."}
        </Notification>
      );
      console.error("Add Document Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (doc: DocumentItem) => {
    setEditingDocument(doc);
    editFormMethods.setValue("name", doc.name);
    // Assuming doc.document_typeholds the documentType name string or ID for Select
    editFormMethods.setValue("document_type", doc.document_type|| "");
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingDocument(null);
    editFormMethods.reset({ name: "", document_type: "" });
    setIsEditDrawerOpen(false);
  };
  const onEditDocumentSubmit = async (data: DocumentFormData) => {
    if (
      !editingDocument ||
      editingDocument.id === undefined ||
      editingDocument.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Document ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        editDocumentListAction({
          id: editingDocument.id,
          ...data, // name, documentType
        })
      ).unwrap();
      toast.push(
        <Notification title="Document Updated" type="success" duration={2000}>
          Document "{data.name}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update document."}
        </Notification>
      );
      console.error("Edit Document Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (doc: DocumentItem) => {
    if (doc.id === undefined || doc.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Document ID is missing.
        </Notification>
      );
      return;
    }
    setDocumentToDelete(doc);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (
      !documentToDelete ||
      documentToDelete.id === undefined ||
      documentToDelete.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Document ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setDocumentToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteDocumentListAction(documentToDelete)).unwrap();
      toast.push(
        <Notification title="Document Deleted" type="success" duration={2000}>
          Document "{documentToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== documentToDelete!.id)
      );
      dispatch(getDocumentListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete document.`}
        </Notification>
      );
      console.error("Delete Document Error:", error);
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select items to delete.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);

    const validItemsToDelete = selectedItems.filter(
      (item) => item.id !== undefined && item.id !== null
    );

    if (validItemsToDelete.length !== selectedItems.length) {
      const skippedCount = selectedItems.length - validItemsToDelete.length;
      toast.push(
        <Notification title="Deletion Warning" type="warning" duration={3000}>
          {skippedCount} item(s) could not be processed due to missing IDs and
          were skipped.
        </Notification>
      );
    }

    if (validItemsToDelete.length === 0) {
      toast.push(
        <Notification title="No Valid Items" type="info">
          No valid items to delete.
        </Notification>
      );
      setIsDeleting(false);
      return;
    }

    const idsToDelete = validItemsToDelete.map((item) => item.id);
    const commaSeparatedIds = idsToDelete.join(",");

    try {
      await dispatch(
        deleteAllDocumentListAction({ ids: commaSeparatedIds })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} document(s) successfully processed for
          deletion.
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected documents."}
        </Notification>
      );
      console.error("Delete selected documents error:", error);
    } finally {
      setSelectedItems([]);
      dispatch(getDocumentListAction());
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterCategories: data.filterCategories || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = { filterNames: [], filterCategories: [] };
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
  const [selectedItems, setSelectedItems] = useState<DocumentItem[]>([]);

  // For filter options based on existing data
  const documentNameOptions = useMemo(() => {
    if (!Array.isArray(DocumentListData)) return [];
    const uniqueNames = new Set(DocumentListData.map((doc) => doc.name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [DocumentListData]);

  const documentTypeFilterOptions = useMemo(
    () => {
      // If categories come from API (DocumentTypeData)
      // if (!Array.isArray(DocumentTypeData)) return [];
      // const uniqueCategories = new Set(DocumentTypeData.map((cat: DocumentType) => cat.name));
      // return Array.from(uniqueCategories).map(catName => ({ value: catName, label: catName }));

      // If categories are hardcoded
      return documentTypeOptions;
    },
    [
      /* DocumentTypeData */
    ]
  );

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    // Since documentType is not directly on DocumentListData items from API,
    // we'll assume it's added/managed client-side or needs mapping if it's an ID.
    // For now, this calculation assumes 'documentType' is a string property on DocumentItem for filtering.
    // If your API sends DocumentListData WITHOUT documentType, you'll need to adjust how documentType is handled.
    const sourceData: DocumentItem[] = Array.isArray(DocumentListData)
      ? DocumentListData
      : [];
    let processedData: DocumentItem[] = cloneDeep(sourceData);

    // Apply name filters
    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item: DocumentItem) =>
        selectedFilterNames.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }

    // Apply documentType filters
    // This assumes item.document_typeis a string that matches the filter value.
    // If item.document_typeis an ID, you'd need to map it to a name or filter by ID.
    if (
      filterCriteria.filterCategories &&
      filterCriteria.filterCategories.length > 0
    ) {
      const selectedFilterCategories = filterCriteria.filterCategories.map(
        (opt) => opt.value.toLowerCase() // Assuming documentType names are used for filtering
      );
      processedData = processedData.filter(
        (item: DocumentItem) =>
          item.document_type? selectedFilterCategories.includes(
                item.document_type.trim().toLowerCase()
              )
            : false // If no documentType, it won't match
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item: DocumentItem) => {
        const nameLower = item.name?.trim().toLowerCase() ?? "";
        const documentTypeLower = item.document_type?.trim().toLowerCase() ?? "";
        const idString = String(item.id ?? "")
          .trim()
          .toLowerCase();
        return (
          nameLower.includes(query) ||
          documentTypeLower.includes(query) || // Search by documentType if present
          idString.includes(query)
        );
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      (key === "id" || key === "name" || key === "documentType") && // Added documentType for sorting
      processedData.length > 0
    ) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        const aValue = String(a[key as keyof DocumentItem] ?? "");
        const bValue = String(b[key as keyof DocumentItem] ?? "");
        return order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
      processedData = sortedData;
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
  }, [DocumentListData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvDocument(
      "documents_export.csv",
      allFilteredAndSortedData,
      [] // Pass DocumentTypeData here if categories are fetched and need mapping
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
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback((checked: boolean, row: DocumentItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<DocumentItem>[]) => {
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

  const columns: ColumnDef<DocumentItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      {
        header: "Document Name",
        accessorKey: "name",
        enableSorting: true,
      },
      {
        // Display documentType. If documentType is an ID, you might need to map it to a name here.
        // For now, assuming 'documentType' is a string name.
        header: "Document Type",
        accessorKey: "documentType",
        enableSorting: true,
        cell: (props) => props.row.original.document_type|| "N/A",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Documents</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <DocumentTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <DocumentTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
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

      <DocumentSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      <Drawer
        title="Add Document"
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
              form="addDocumentForm"
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
          id="addDocumentForm"
          onSubmit={addFormMethods.handleSubmit(onAddDocumentSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Document Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Document Name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Document Type"
            invalid={!!addFormMethods.formState.errors.document_type}
            errorMessage={addFormMethods.formState.errors.document_type?.message}
          >
            <Controller
              name="document_type"
              control={addFormMethods.control}
              render={({ field }) => (
                <UiSelect // Using UiSelect to avoid conflict
                  placeholder="Select documentType"
                  options={documentTypeOptions} // Hardcoded options
                  value={
                    documentTypeOptions.find(
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
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <Form
          id="editDocumentForm"
          onSubmit={editFormMethods.handleSubmit(onEditDocumentSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Document Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Document Name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Document Type"
            invalid={!!editFormMethods.formState.errors.document_type}
            errorMessage={editFormMethods.formState.errors.document_type?.message}
          >
            <Controller
              name="document_type"
              control={editFormMethods.control}
              render={({ field }) => (
                <UiSelect // Using UiSelect to avoid conflict
                  placeholder="Select documentType"
                  options={documentTypeOptions} // Hardcoded options
                  value={
                    documentTypeOptions.find(
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
        title="Filters"
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
                <UiSelect
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
              name="filterCategories"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select categories..."
                  options={documentTypeFilterOptions} // Hardcoded options for filter
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

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
        // loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the document "
          <strong>{documentToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default Documents;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
