import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate was unused, Link might be if not used in breadcrumbs
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
import Select from "@/components/ui/Select"; // Added for filter drawer
import { Drawer, Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
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
  getDocumentTypeAction,
  addDocumentTypeAction, // Ensure these actions exist or are created
  editDocumentTypeAction, // Ensure these actions exist or are created
  deleteDocumentTypeAction, // Ensure these actions exist or are created
  deleteAllDocumentTypeAction, // Ensure these actions exist or are created
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define DocumentItem Type ---
export type DocumentItem = {
  id: string | number; // Allow number for consistency if backend might send it
  name: string;
};

// --- Zod Schema for Add/Edit Document Type Form ---
const documentTypeFormSchema = z.object({
  name: z
    .string()
    .min(1, "Document type name is required.")
    .max(100, "Name cannot exceed 100 characters."),
});
type DocumentTypeFormData = z.infer<typeof documentTypeFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DOC_TYPE = ["ID", "Document Type Name"];
const CSV_KEYS_DOC_TYPE: (keyof DocumentItem)[] = ["id", "name"];

function exportToCsvDocType(filename: string, rows: DocumentItem[]) {
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
    CSV_HEADERS_DOC_TYPE.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS_DOC_TYPE.map((k) => {
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

// --- DocumentTypeSearch Component (was FormListSearch) ---
type DocumentTypeSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const DocumentTypeSearch = React.forwardRef<
  HTMLInputElement,
  DocumentTypeSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      className="w-full" // Use w-full for better layout in TableTools
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
DocumentTypeSearch.displayName = "DocumentTypeSearch";

// --- DocumentTypeTableTools Component (Patterned after UnitsTableTools) ---
const DocumentTypeTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,

}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: ()=> void
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <DocumentTypeSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button>
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

// --- DocumentTypeTable Component (was FormListTable) ---
type DocumentTypeTableProps = {
  columns: ColumnDef<DocumentItem>[];
  data: DocumentItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: DocumentItem[]; // Renamed from selectedForms
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: DocumentItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<DocumentItem>[]) => void;
};
const DocumentTypeTable = ({
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
}: DocumentTypeTableProps) => {
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

// --- DocumentTypeSelectedFooter Component (was FormListSelected) ---
type DocumentTypeSelectedFooterProps = {
  selectedItems: DocumentItem[]; // Renamed from selectedForms
  onDeleteSelected: () => void;
};
const DocumentTypeSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: DocumentTypeSelectedFooterProps) => {
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
        title={`Delete ${selectedItems.length} Document Type${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected document type
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Documentmaster Component ---
const Documentmaster = () => {
  const dispatch = useAppDispatch();
  // const navigate = useNavigate(); // Uncomment if navigation on edit/add is needed

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingDocumentType, setEditingDocumentType] =
    useState<DocumentItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [documentTypeToDelete, setDocumentTypeToDelete] =
    useState<DocumentItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
  });

  const { DocumentTypeData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  useEffect(() => {
    dispatch(getDocumentTypeAction());
  }, [dispatch]);

  const addFormMethods = useForm<DocumentTypeFormData>({
    resolver: zodResolver(documentTypeFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });
  const editFormMethods = useForm<DocumentTypeFormData>({
    resolver: zodResolver(documentTypeFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = () => {
    addFormMethods.reset({ name: "" });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset({ name: "" });
    setIsAddDrawerOpen(false);
  };
  const onAddDocumentTypeSubmit = async (data: DocumentTypeFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addDocumentTypeAction({ name: data.name })).unwrap();
      toast.push(
        <Notification
          title="Document Type Added"
          type="success"
          duration={2000}
        >
          Document Type "{data.name}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getDocumentTypeAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add document type."}
        </Notification>
      );
      console.error("Add Document Type Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (docType: DocumentItem) => {
    setEditingDocumentType(docType);
    editFormMethods.setValue("name", docType.name); // Set form value for editing
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingDocumentType(null);
    editFormMethods.reset({ name: "" });
    setIsEditDrawerOpen(false);
  };
  const onEditDocumentTypeSubmit = async (data: DocumentTypeFormData) => {
    if (
      !editingDocumentType ||
      editingDocumentType.id === undefined ||
      editingDocumentType.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Document Type ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        editDocumentTypeAction({
          id: editingDocumentType.id,
          name: data.name,
        })
      ).unwrap();
      toast.push(
        <Notification
          title="Document Type Updated"
          type="success"
          duration={2000}
        >
          Document Type "{data.name}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getDocumentTypeAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update document type."}
        </Notification>
      );
      console.error("Edit Document Type Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (docType: DocumentItem) => {
    if (docType.id === undefined || docType.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Document Type ID is missing.
        </Notification>
      );
      return;
    }
    setDocumentTypeToDelete(docType);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (
      !documentTypeToDelete ||
      documentTypeToDelete.id === undefined ||
      documentTypeToDelete.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Document Type ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setDocumentTypeToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteDocumentTypeAction(documentTypeToDelete)).unwrap(); // Ensure action takes correct payload
      toast.push(
        <Notification
          title="Document Type Deleted"
          type="success"
          duration={2000}
        >
          Document Type "{documentTypeToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== documentTypeToDelete!.id)
      );
      dispatch(getDocumentTypeAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete document type.`}
        </Notification>
      );
      console.error("Delete Document Type Error:", error);
    } finally {
      setIsDeleting(false);
      setDocumentTypeToDelete(null);
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
        deleteAllDocumentTypeAction({ ids: commaSeparatedIds })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} document type(s) successfully processed
          for deletion.
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected document types."}
        </Notification>
      );
      console.error("Delete selected document types error:", error);
    } finally {
      setSelectedItems([]);
      dispatch(getDocumentTypeAction());
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria); // Reset form with current criteria
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({ filterNames: data.filterNames || [] });
    handleSetTableData({ pageIndex: 1 }); // Reset to first page on filter change
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = { filterNames: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page
    // Optionally close drawer: closeFilterDrawer();
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<DocumentItem[]>([]); // Renamed from selectedForms

  const documentTypeNameOptions = useMemo(() => {
    if (!Array.isArray(DocumentTypeData)) return [];
    const uniqueNames = new Set(
      DocumentTypeData.map((docType) => docType.name)
    );
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [DocumentTypeData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: DocumentItem[] = Array.isArray(DocumentTypeData)
      ? DocumentTypeData
      : [];
    let processedData: DocumentItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item: DocumentItem) =>
        selectedFilterNames.includes(item.name?.trim().toLowerCase() ?? "")
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item: DocumentItem) => {
        const itemNameLower = item.name?.trim().toLowerCase() ?? "";
        const itemIdString = String(item.id ?? "").trim();
        const itemIdLower = itemIdString.toLowerCase();
        return itemNameLower.includes(query) || itemIdLower.includes(query);
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      (key === "id" || key === "name") &&
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
  }, [DocumentTypeData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvDocType(
      "document_types_export.csv",
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
        header: "Document Type Name",
        accessorKey: "name",
        enableSorting: true,
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
    [] // openEditDrawer and handleDeleteClick are stable
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Document Types</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <DocumentTypeTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <DocumentTypeTable
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

      <DocumentTypeSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Document Type"
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
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="addDocumentTypeForm"
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
          id="addDocumentTypeForm"
          onSubmit={addFormMethods.handleSubmit(onAddDocumentTypeSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Document Type"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Document Type" />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Document Type"
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
              form="editDocumentTypeForm"
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
          id="editDocumentTypeForm"
          onSubmit={editFormMethods.handleSubmit(onEditDocumentTypeSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Document Type"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Document Type" />
              )}
            />
          </FormItem>
        </Form>
        <div className="absolute bottom-[14%] w-[88%]">
          <div className="flex justify-between gap-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div className="">
              <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br/>
              <p className="text-sm font-semibold">Tushar Joshi</p>
              <p>System Admin</p>
            </div>
            <div className="w-[210px]"><br/>
              <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br/>
              <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Filter Drawer */}
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
              form="filterDocumentTypeForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterDocumentTypeForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Document Type">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select document types..."
                  options={documentTypeNameOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
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
        title="Delete Document Type"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setDocumentTypeToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setDocumentTypeToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setDocumentTypeToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        // loading={isDeleting} // Add if your ConfirmDialog supports it
      >
        <p>
          Are you sure you want to delete the document type "
          <strong>{documentTypeToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default Documentmaster;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
