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
import StickyFooter from "@/components/shared/StickyFooter";
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected
import Select from "@/components/ui/Select"; // Keep alias if needed, or use directly
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
  TbReload,
  // Add other icons if used by ActionColumn or other parts
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
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
  deleteAllDocumentListAction,
  getDocumentTypeAction, // Action to fetch document types
} from "@/reduxtool/master/middleware";


// --- Define DocumentItem Type (matching your API response) ---
export type DocumentItem = {
  id: string | number;
  name: string;
  document_type?: string | number; // Assuming API stores ID for document type
  document_type_name?: string; // Optional: If API sometimes sends name, or for derived display
  created_at?: string;
  updated_at?: string;
};

// --- Define DocumentType Type (what getDocumentTypeAction fetches) ---
export type DocumentType = {
  id: string | number;
  name: string;
};
export type SelectOption = { value: string; label: string };


// --- Zod Schema for Add/Edit Document Form ---
const documentFormSchema = z.object({
  name: z.string().min(1, "Document name is required.").max(100, "Name cannot exceed 100 characters."),
  document_type: z.string().min(1, "Document Type is required."), // Store ID from select
});
type DocumentFormData = z.infer<typeof documentFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDocumentTypeIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Filter by document type IDs
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DOCUMENT = ["ID", "Document Name", "Document Type"];
const CSV_KEYS_DOCUMENT: (keyof Pick<DocumentItem, 'id' | 'name'> | 'documentTypeNameForCsv')[] = ["id", "name", "documentTypeNameForCsv"];

function exportToCsvDocument(filename: string, rows: DocumentItem[], docTypeOptions: SelectOption[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map((row) => ({
    id: row.id,
    name: row.name,
    documentTypeNameForCsv: docTypeOptions.find(dt => dt.value === String(row.document_type))?.label || String(row.document_type) || "N/A",
  }));
  // ... (rest of CSV export logic using preparedRows and CSV_KEYS_DOCUMENT)
  const separator = ",";
  const csvContent = CSV_HEADERS_DOCUMENT.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_DOCUMENT.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support.</Notification>); return false;
}


// --- ActionColumn, Search, TableTools, SelectedFooter (UI remains same) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => { /* ... as before ... */ return ( <div className="flex items-center justify-center"> <Tooltip title="Edit"> <div className={"text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"} role="button" onClick={onEdit}><TbPencil /></div> </Tooltip> <Tooltip title="Delete"> <div className={"text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"} role="button" onClick={onDelete}><TbTrash /></div> </Tooltip> </div> ); };
type DocumentSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const DocumentSearch = React.forwardRef<HTMLInputElement, DocumentSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
DocumentSearch.displayName = "DocumentSearch";
type DocumentTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: ()=> void};
const DocumentTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: DocumentTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><DocumentSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">  <Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> );
type DocumentTableProps = { columns: ColumnDef<DocumentItem>[]; data: DocumentItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: DocumentItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: DocumentItem) => void; onAllRowSelect: (checked: boolean, rows: Row<DocumentItem>[]) => void; };
const DocumentTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: DocumentTableProps) => ( <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} /> );
type DocumentSelectedFooterProps = { selectedItems: DocumentItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const DocumentSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: DocumentSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Document{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Document(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete selected document(s)?</p> </ConfirmDialog> </> ); };


// --- Main Documents Component ---
const Documents = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterNames: [], filterDocumentTypeIds: [] }); // Updated field name

  const {
    DocumentListData = [],
    DocumentTypeData = [], // Assuming this state holds data from getDocumentTypeAction
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  // Options for Document Type Select, derived from Redux state
  const documentTypeOptionsForSelect = useMemo(() => {
    if (!Array.isArray(DocumentTypeData)) return [];
    return DocumentTypeData.map((type: DocumentType) => ({
      value: String(type.id), // Assuming API expects ID for document_type_id
      label: type.name,
    }));
  }, [DocumentTypeData]);


  useEffect(() => {
    dispatch(getDocumentListAction());
    dispatch(getDocumentTypeAction()); // Fetch document types
  }, [dispatch]);

  const formMethods = useForm<DocumentFormData>({ // Renamed for clarity
    resolver: zodResolver(documentFormSchema),
    defaultValues: { name: "", document_type: "" }, // Default to empty string for select
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = () => {
    formMethods.reset({ name: "", document_type: documentTypeOptionsForSelect[0]?.value || "" });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => { formMethods.reset(); setIsAddDrawerOpen(false); };

  const onAddDocumentSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      // API payload might need 'document_type_id' or just 'document_type' as name
      // Adjust payload according to your backend requirements
      const payload = {
        name: data.name,
        document_type: data.document_type, // Send the ID
        // Or if API expects name:
        // document_type: documentTypeOptionsForSelect.find(opt => opt.value === data.document_type_id)?.label
      };
      await dispatch(addDocumentListAction(payload)).unwrap();
      toast.push(<Notification title="Document Added" type="success">{`Document "${data.name}" added.`}</Notification>);
      closeAddDrawer(); dispatch(getDocumentListAction());
    } catch (error: any) { toast.push(<Notification title="Failed to Add" type="danger">{error.message || "Could not add."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const openEditDrawer = (doc: DocumentItem) => {
    setEditingDocument(doc);
    formMethods.reset({
      name: doc.name,
      document_type: String(doc.document_type || ""), // Ensure it's a string for Select value
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => { setEditingDocument(null); formMethods.reset(); setIsEditDrawerOpen(false); };

  const onEditDocumentSubmit = async (data: DocumentFormData) => {
    if (!editingDocument || !editingDocument.id) { /* ... */ return; }
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        document_type: data.document_type,
      };
      await dispatch(editDocumentListAction({ id: editingDocument.id, ...payload })).unwrap();
      toast.push(<Notification title="Document Updated" type="success">{`"${data.name}" updated.`}</Notification>);
      closeEditDrawer(); dispatch(getDocumentListAction());
    } catch (error: any) { toast.push(<Notification title="Failed to Update" type="danger">{error.message || "Could not update."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = (doc: DocumentItem) => { if (!doc.id) return; setDocumentToDelete(doc); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => { if (!documentToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteDocumentListAction({id: documentToDelete.id})).unwrap(); toast.push(<Notification title="Document Deleted" type="success">{`"${documentToDelete.name}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((item) => item.id !== documentToDelete!.id)); dispatch(getDocumentListAction()); } catch (error: any) { toast.push(<Notification title="Failed to Delete" type="danger">{error.message || `Could not delete.`}</Notification>); } finally { setIsDeleting(false); setDocumentToDelete(null); } };
  const handleDeleteSelected = async () => { if (selectedItems.length === 0) { /* ... */ return; } setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)).join(","); try { await dispatch(deleteAllDocumentListAction({ ids: idsToDelete })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success">{`${selectedItems.length} document(s) deleted.`}</Notification>); } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger">{error.message || "Failed to delete."}</Notification>); } finally { setSelectedItems([]); dispatch(getDocumentListAction()); setIsDeleting(false); } };
  
  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const closeFilterDrawerCb = useCallback(() => setIsFilterDrawerOpen(false), []); // Renamed to avoid conflict
  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria({ filterNames: data.filterNames || [], filterDocumentTypeIds: data.filterDocumentTypeIds || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawerCb(); };
  const onClearFilters = () => { const defaults = { filterNames: [], filterDocumentTypeIds: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); };

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<DocumentItem[]>([]);

  const documentNameOptions = useMemo(() => { if (!Array.isArray(DocumentListData)) return []; const uniqueNames = new Set(DocumentListData.map((doc) => doc.name)); return Array.from(uniqueNames).map((name) => ({ value: name, label: name, })); }, [DocumentListData]);
  
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDocTypeNames: DocumentItem[] = Array.isArray(DocumentListData)
      ? DocumentListData.map(doc => ({
          ...doc,
          document_type_name: documentTypeOptionsForSelect.find(opt => opt.value === String(doc.document_type))?.label || "N/A"
        }))
      : [];
    let processedData: DocumentItem[] = cloneDeep(sourceDataWithDocTypeNames);

    if (filterCriteria.filterNames?.length) { const names = filterCriteria.filterNames.map(opt => opt.value.toLowerCase()); processedData = processedData.filter(item => names.includes(item.name?.trim().toLowerCase() ?? "")); }
    if (filterCriteria.filterDocumentTypeIds?.length) { const typeIds = filterCriteria.filterDocumentTypeIds.map(opt => opt.value); processedData = processedData.filter(item => item.document_type ? typeIds.includes(String(item.document_type)) : false); }
    if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => (item.name?.trim().toLowerCase() ?? "").includes(query) || (item.document_type_name?.trim().toLowerCase() ?? "").includes(query) || String(item.id ?? "").trim().toLowerCase().includes(query)); }
    
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && (key === "id" || key === "name" || key === "document_type_name") && processedData.length > 0) {
      processedData.sort((a, b) => {
        const aValue = String(a[key as keyof DocumentItem] ?? (key === 'document_type_name' ? (a as any).document_type_name : ''));
        const bValue = String(b[key as keyof DocumentItem] ?? (key === 'document_type_name' ? (b as any).document_type_name : ''));
        return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
    }
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [DocumentListData, documentTypeOptionsForSelect, tableData, filterCriteria]);

  const handleExportData = () => { exportToCsvDocument("documents_export.csv", allFilteredAndSortedData, documentTypeOptionsForSelect); };
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectPageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: DocumentItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<DocumentItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<DocumentItem>[] = useMemo( () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      { header: "Document Name", accessorKey: "name", enableSorting: true },
      { header: "Document Type", accessorKey: "document_type_name", enableSorting: true, meta:{HeaderClass:'text-primary'},// Sort by derived name
        cell: (props) => props.row.original.document_type_name || "N/A",
      },
      {
        header: "Update at",
        accessorKey: "updated_at",
        enableSorting: true,
        meta:{HeaderClass:'text-red-500'},
        size: 130,
        cell: (props) =>
          <div>
            <span className="text-xs p-0">Tushar Joshi <br/><b>System Admin</b></span><br/>
            <span className="text-xs p-0">{
              
              `${new Date(props.getValue<string>()).getDate()} ${new Date(props.getValue<string>()).toLocaleString("en-US", { month: "long" })} 
              ${new Date(props.getValue<string>()).getFullYear()},
              ${new Date(props.getValue<string>()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
            }
            </span>
          </div>
      },
      { header: "Actions", id: "action", meta: { HeaderClass: "text-center", cellClass: "text-center"}, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], [documentTypeOptionsForSelect, openEditDrawer, handleDeleteClick] // Added options as dep
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Documents List</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
          </div>
          <DocumentTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onClearFilters={onClearFilters} />
          <div className="mt-4">
            <DocumentTable columns={columns} data={pageData} loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting} pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <DocumentSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} /> {/* Passed isDeleting */}
      <Drawer title="Add Document" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} width={600}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button> <Button size="sm" variant="solid" form="addDocumentForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Adding..." : "Save"}</Button> </div> } >
        <Form id="addDocumentForm" onSubmit={formMethods.handleSubmit(onAddDocumentSubmit)} className="flex flex-col gap-4">
          <FormItem label="Document Name" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}>
            <Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Document Name" /> )} />
          </FormItem>
          <FormItem label="Document Type" invalid={!!formMethods.formState.errors.document_type} errorMessage={formMethods.formState.errors.document_type?.message}>
            <Controller name="document_type" control={formMethods.control} render={({ field }) => ( <Select placeholder="Select Document Type" options={documentTypeOptionsForSelect} value={documentTypeOptionsForSelect.find(option => option.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : "")} /> )}/>
          </FormItem>
        </Form>
      </Drawer>
      <Drawer title="Edit Document" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer} width={600}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button> <Button size="sm" variant="solid" form="editDocumentForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button> </div> } >
        <Form id="editDocumentForm" onSubmit={formMethods.handleSubmit(onEditDocumentSubmit)} className="flex flex-col gap-4">
          <FormItem label="Document Name" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}>
            <Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Document Name" /> )} />
          </FormItem>
          <FormItem label="Document Type" invalid={!!formMethods.formState.errors.document_type} errorMessage={formMethods.formState.errors.document_type?.message}>
            <Controller name="document_type" control={formMethods.control} render={({ field }) => ( <Select placeholder="Select Document Type" options={documentTypeOptionsForSelect} value={documentTypeOptionsForSelect.find(option => option.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : "")} /> )}/>
          </FormItem>
        </Form>
        <div className="absolute bottom-[14%] w-[92%]">
          <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div className="">
              <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br/>
              <p className="text-sm font-semibold">Tushar Joshi</p>
              <p>System Admin</p>
            </div>
            <div className=""><br/>
              <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br/>
              <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
            </div>
          </div>
        </div>
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawerCb} onRequestClose={closeFilterDrawerCb} width={400}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button> <Button size="sm" variant="solid" form="filterDocumentForm" type="submit">Apply</Button> </div> } >
        <Form id="filterDocumentForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Document Name"> <Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => ( <Select isMulti placeholder="Select document names..." options={documentNameOptions} value={field.value || []} onChange={(selectedVal) => field.onChange(selectedVal || [])}/> )}/> </FormItem>
          <FormItem label="Document Type"> <Controller name="filterDocumentTypeIds" control={filterFormMethods.control} render={({ field }) => ( <Select isMulti placeholder="Select document types..." options={documentTypeOptionsForSelect} value={field.value || []} onChange={(selectedVal) => field.onChange(selectedVal || [])}/> )}/> </FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Document" onClose={() => { setSingleDeleteConfirmOpen(false); setDocumentToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setDocumentToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setDocumentToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} >
        <p>Are you sure you want to delete the document "<strong>{documentToDelete?.name}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default Documents;

// Helper (already at top)
// function classNames(...classes: (string | boolean | undefined)[]) {
//   return classes.filter(Boolean).join(" ");
// }