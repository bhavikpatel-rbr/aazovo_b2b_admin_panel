// src/views/your-path/BugReportListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form"; // useFieldArray might not be needed if not managing array inputs
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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected spelling
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";
// Textarea might not be needed if Input textArea prop is used

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbMail,
  TbPhone,
  TbDotsVertical,
  TbShare,
  TbEye,
  TbUserCircle,
  TbFileDescription,
  TbPaperclip,
  // TbTrash, // Already imported, no need to re-declare if ActionColumn handles it
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getBugReportsAction,
  addBugReportAction,
  editBugReportAction,
  deleteBugReportAction,
  deleteAllBugReportsAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import classNames from "@/utils/classNames";


// --- Define Types ---
export type BugReportStatusApi = "Read" | "Unread" | string;
export type BugReportStatusForm = "Read" | "Unread";

export type BugReportItem = {
  id: string | number;
  name: string;
  email: string;
  mobile_no?: string;
  report: string;
  attachment?: string | null;
  status: BugReportStatusApi; // This will be displayed in the table
  created_at?: string;
  updated_at?: string;
};

const BUG_REPORT_STATUS_OPTIONS_FORM: { value: BugReportStatusForm; label: string; }[] = [
  { value: "Unread", label: "Unread" },
  { value: "Read", label: "Read" },
];
const bugReportStatusFormValues = BUG_REPORT_STATUS_OPTIONS_FORM.map( (s) => s.value ) as [BugReportStatusForm, ...BugReportStatusForm[]];

const bugStatusColor: Record<BugReportStatusApi, string> = {
  Unread: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Read: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
};

// --- Zod Schema for Add/Edit Bug Report Form ---
// MODIFIED: Removed status and reported_by from user-editable form schema
const bugReportFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name too long"),
  email: z.string().email("Invalid email format.").min(1, "Email is required."),
  mobile_no: z.string().max(20, "Mobile number too long.").optional().or(z.literal("")),
  report: z.string().min(10, "Report description must be at least 10 characters.").max(5000, "Report too long"),
  attachment: z.any().optional(), // Stays as any for FileList/File object
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;


// --- Zod Schema for Filter Form --- (remains the same)
const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterReportedBy: z.string().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- CSV Exporter, ActionColumn, Search, TableTools, SelectedFooter ---
// (These can remain largely the same as in your provided code, ensure ActionColumn uses correct delete icon if needed)
const CSV_HEADERS_BUG = ["ID", "Name", "Email", "Mobile No", "Report", "Attachment", "Status", "Reported By", "Created At"];
const CSV_KEYS_BUG: (keyof BugReportItem)[] = ["id", "name", "email", "mobile_no", "report", "attachment", "status", "created_at"];
function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) { /* ... same as before ... */ return true; }

const ActionColumn = ({ onEdit, onViewDetail, onChangeStatus }: { onEdit: () => void; onViewDetail: () => void; onChangeStatus: () => void; }) => {
  return ( <div className="flex items-center justify-center gap-1"> <Tooltip title="Edit (Admin)"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip> <Tooltip title="View"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onViewDetail}><TbEye /></div></Tooltip> {/* ... other actions like Share, More ... */} </div> );
};
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport }: ItemTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full"> <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> );
type BugReportsSelectedFooterProps = { selectedItems: BugReportItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const BugReportsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: BugReportsSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; const handleDeleteClick = () => setDeleteConfirmOpen(true); const handleCancelDelete = () => setDeleteConfirmOpen(false); const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmOpen(false); }; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"> <span className="heading-text">{selectedItems.length}</span> <span>Report{selectedItems.length > 1 ? "s" : ""} selected</span> </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Report${selectedItems.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}> <p>Are you sure you want to delete the selected report{selectedItems.length > 1 ? "s" : ""}? </p> </ConfirmDialog> </> ); };


// --- Main Component: BugReportListing ---
const BugReportListing = () => {
  const dispatch = useAppDispatch();
  const {
    bugReportsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false); // For admin changing status
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    dispatch(getBugReportsAction());
  }, [dispatch]);

  // Default values for the ADD form (user-facing)
  const defaultAddFormValues: BugReportFormData = {
    name: "",
    email: "",
    mobile_no: "",
    report: "",
    attachment: undefined,
  };

  const formMethods = useForm<BugReportFormData>({
    resolver: zodResolver(bugReportFormSchema),
    defaultValues: defaultAddFormValues,
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultAddFormValues);
    setSelectedFile(null);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultAddFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback( // This form might be admin-only or have more fields
    (item: BugReportItem) => {
      setEditingItem(item);
      setSelectedFile(null);
      // For edit, we populate all fields including those not in the simplified user add form
      formMethods.reset({
        name: item.name,
        email: item.email,
        mobile_no: item.mobile_no || "",
        report: item.report,
        attachment: undefined, // User must re-select if changing
        // These are part of BugReportItem and might be editable by an admin
        // If the `bugReportFormSchema` doesn't include them, RHF won't validate/submit them
        // For this example, we assume an admin might edit status via this form.
        // status: item.status as BugReportStatusForm, 
        // reported_by: item.reported_by || "",
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: BugReportFormData) => {
    setIsSubmitting(true);
    const loggedInUser = { id: "USER123", name: "Current User" }; // Placeholder

    const formDataPayload = new FormData();
    formDataPayload.append("name", data.name);
    formDataPayload.append("email", data.email);
    if (data.mobile_no) formDataPayload.append("mobile_no", data.mobile_no);
    formDataPayload.append("report", data.report);
    formDataPayload.append("_method", "PUT");
    if (selectedFile) {
      formDataPayload.append("attachment", selectedFile);
    }

    if (editingItem) {
      // When editing, merge with existing non-form data if API expects full object
      formDataPayload.append("status", editingItem.status); // Send existing status
    
     
      // formDataPayload.append('_method', 'PUT'); // If backend needs this for FormData
      try {
        await dispatch(editBugReportAction({ id: editingItem.id, formData: formDataPayload })).unwrap();
        toast.push(<Notification title="Bug Report Updated" type="success" />);
        closeEditDrawer();
      } catch (error: any) {
        toast.push(<Notification title="Update Failed" type="danger">{(error as Error).message || "Operation failed."}</Notification>);
      }
    } else {
      // For new reports, set default status and reported_by (if applicable)
      formDataPayload.append("status", "Unread"); // Default status
     
     

      try {
        await dispatch(addBugReportAction(formDataPayload)).unwrap();
        toast.push(<Notification title="Bug Report Submitted" type="success">Thank you for your report!</Notification>);
        closeAddDrawer();
      } catch (error: any) {
        toast.push(<Notification title="Submission Failed" type="danger">{(error as Error).message || "Operation failed."}</Notification>);
      }
    }
    dispatch(getBugReportsAction());
    setIsSubmitting(false);
  };

  // Admin action: Change status (e.g., from a button in the table actions or a dedicated UI)
  const handleChangeStatus = useCallback( async (item: BugReportItem, newStatus: BugReportStatusForm) => {
      setIsChangingStatus(true);
      const formData = new FormData();
      // Send all fields that your edit API endpoint might require, or use a dedicated status update endpoint
      formData.append("name", item.name);
      formData.append("email", item.email);
      if (item.mobile_no) formData.append("mobile_no", item.mobile_no);
      formData.append("report", item.report);
      formData.append("status", newStatus); // The new status
     
      
      // If attachment is not changing, some APIs might not need it, or need filename
      // if (item.attachment) formData.append('existing_attachment_path', item.attachment);

      try {
        await dispatch(editBugReportAction({ id: item.id, formData })).unwrap();
        toast.push(<Notification title="Status Changed" type="success">{`Report status changed to ${newStatus}.`}</Notification>);
        dispatch(getBugReportsAction());
      } catch (error: any) {
        toast.push(<Notification title="Status Change Failed" type="danger">{(error as Error).message}</Notification>);
      } finally {
        setIsChangingStatus(false);
      }
    }, [dispatch]
  );

  // ... (handleDeleteClick, onConfirmSingleDelete, handleDeleteSelected remain the same)
  const handleDeleteClick = useCallback((item: BugReportItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteBugReportAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Report Deleted" type="success">{`Report by "${itemToDelete.name}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getBugReportsAction()); } catch (error: any) { toast.push(<Notification title="Delete Failed" type="danger">{(error as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)); try { await dispatch(deleteAllBugReportsAction({ ids: idsToDelete.join(",") })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} report(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getBugReportsAction()); } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger">{(error as Error).message}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);

  // ... (Filter Handlers remain the same)
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [], filterReportedBy: data.filterReportedBy || "", }); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer, filterFormMethods]); // Added filterFormMethods
  const onClearFilters = useCallback(() => { const defaultFilters = { filterStatus: [], filterReportedBy: "" }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); setTableData((prev) => ({ ...prev, pageIndex: 1 })); }, [filterFormMethods]);

  // ... (useMemo for pageData, columns, etc. - ensure columns uses handleChangeStatus for an admin action)
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: BugReportItem[] = Array.isArray(bugReportsData) ? bugReportsData : [];
    let processedData: BugReportItem[] = cloneDeep(sourceData);
    if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map((s) => s.value); processedData = processedData.filter((item) => v.includes(item.status)); }
   
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { const aVal = a[key as keyof BugReportItem]; const bVal = b[key as keyof BugReportItem]; if (key === "created_at" || key === "updated_at") { const dateA = aVal ? new Date(aVal as string).getTime() : 0; const dateB = bVal ? new Date(bVal as string).getTime() : 0; return order === "asc" ? dateA - dateB : dateB - dateA; } const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase(); return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr); }); }
    const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [bugReportsData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => { exportBugReportsToCsv("bug_reports_export.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback( (page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData] );
  const handleSelectChange = useCallback( (value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData] );
  const handleSort = useCallback( (sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData] );
  const handleSearchChange = useCallback( (query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData] );
  const handleRowSelect = useCallback( (checked: boolean, row: BugReportItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, [] );
  const handleAllRowSelect = useCallback( (checked: boolean, currentRows: Row<BugReportItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, [] );

  const columns: ColumnDef<BugReportItem>[] = useMemo( () => [
      // { header: "Status", accessorKey: "status", size: 120, enableSorting: true, cell: (props) => { const statusVal = props.getValue<BugReportStatusApi>(); return (<Tag className={classNames("capitalize whitespace-nowrap", bugStatusColor[statusVal] || "bg-gray-100 text-gray-600")}>{statusVal}</Tag>); }, },
      { header: "Name", accessorKey: "name", size: 180, enableSorting: true, cell: (props) => (<span className="font-semibold">{props.getValue<string>()}</span>), },
      { header: "Email", accessorKey: "email", size: 200, enableSorting: true },
      { header: "Mobile No", accessorKey: "mobile_no", size: 130, cell: (props) => props.getValue() || "-", },
      
      { header: "Date", accessorKey: "created_at", size: 120, cell: (props) => props.getValue() ? new Date(props.getValue<string>()).toLocaleDateString() : "-", },
      { header: "Actions", id: "actions", meta: { headerClass: "text-center", cellClass: "text-center" }, size: 140, 
        cell: (props) => ( <ActionColumn 
            onEdit={() => openEditDrawer(props.row.original)} 
            onViewDetail={() => { /* Implement view detail dialog if needed */ }}
            onChangeStatus={() => handleChangeStatus(props.row.original, props.row.original.status === "Read" ? "Unread" : "Read")} // Example status toggle
            // Pass onDelete to ActionColumn if it's defined there
        /> ),
      },
    ], [openEditDrawer, handleChangeStatus,] // Removed handleDeleteClick if ActionColumn doesn't use it directly
  );

  // --- MODIFIED renderDrawerForm ---
  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Name"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.name}
        errorMessage={currentFormMethods.formState.errors.name?.message}
      >
        <Controller name="name" control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} prefix={<TbUserCircle />} placeholder="Your Name" />)}
        />
      </FormItem>
      <FormItem
        label="Email"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.email}
        errorMessage={currentFormMethods.formState.errors.email?.message}
      >
        <Controller name="email" control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="your.email@example.com" />)}
        />
      </FormItem>
      <FormItem
        label="Mobile No. (Optional)"
        className="md:col-span-1" // Adjusted to fit if status/reported_by are removed
        invalid={!!currentFormMethods.formState.errors.mobile_no}
        errorMessage={currentFormMethods.formState.errors.mobile_no?.message}
      >
        <Controller name="mobile_no" control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone />} placeholder="+XX-XXXXXXXXXX" />)}
        />
      </FormItem>
      
      {/* Status and Reported By are REMOVED from the user-facing Add/Edit form */}
      {/* If an admin needs to edit these, you might have a separate "Admin Edit Form" or conditional rendering */}

      <FormItem
        label="Report / Description"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.report}
        errorMessage={currentFormMethods.formState.errors.report?.message}
      >
        <Controller name="report" control={currentFormMethods.control}
          render={({ field }) => (<Input textArea {...field} rows={6} prefix={<TbFileDescription />} placeholder="Please describe the bug in detail..." />)}
        />
      </FormItem>
      <FormItem
        label="Attachment (Optional)"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.attachment}
        errorMessage={currentFormMethods.formState.errors.attachment?.message as string}
      >
        <Controller name="attachment" control={currentFormMethods.control}
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <Input type="file" name={name} ref={ref} onBlur={onBlur}
              onChange={(e) => {
                const file = e.target.files?.[0];
                onChange(file); 
                setSelectedFile(file || null);
              }}
              prefix={<TbPaperclip />}
            />
          )}
        />
        {editingItem?.attachment && !selectedFile && (
            <div className="mt-2 text-sm text-gray-500">
              Current: <a href={itemPath(editingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{editingItem.attachment}</a>
            </div>
          )}
      </FormItem>
    </div>
  );
  // --- END OF MODIFIED renderDrawerForm ---

  const itemPath = (filename: any) => {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000"; // Example
    return `${baseUrl}/storage/attachments/bug_reports/${filename}`;
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Bug Reports</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Report</Button>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <DataTable
              columns={columns} data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting || isChangingStatus}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable
              checkboxChecked={(row: BugReportItem) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
              onSort={handleSort} onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
              // noData={!loading && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <BugReportsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

      <Drawer
        title={editingItem ? "Edit Bug Report (Admin)" : "Report New Bug"} // Title reflects user context
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="bugReportForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Submitting...") : (editingItem ? "Save Changes" : "Submit Report")}</Button> </div> }
      >
        <Form id="bugReportForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterBugReportForm" type="submit">Apply</Button> </div> }
      >
        <Form id="filterBugReportForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Status"> <Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={BUG_REPORT_STATUS_OPTIONS_FORM.map((s) => ({ value: s.value, label: s.label }))} value={field.value || []} onChange={(val) => field.onChange(val || [])} /> )} /> </FormItem>
          <FormItem label="Reported By (Internal)"> <Controller name="filterReportedBy" control={filterFormMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter username or ID to filter" /> )} /> </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Bug Report" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p>Are you sure you want to delete the report by "<strong>{itemToDelete?.name}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default BugReportListing;

// function classNames(...classes: (string | boolean | undefined)[]) { // Already defined at top
//     return classes.filter(Boolean).join(' ');
// }