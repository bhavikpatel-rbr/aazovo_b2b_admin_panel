// src/views/your-path/BugReportListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected spelling
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

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
  TbEye,
  TbUserCircle,
  TbFileDescription,
  TbPaperclip,
  TbCalendarEvent,
  TbInfoCircle,
  TbReload,
  // TbTrash, // Already imported, no need to re-declare if ActionColumn handles it
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type { SelectOption } from "@/@types/select"; // Assuming SelectOption type is available globally or define it

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

// Use a more generic SelectOption if available from @/@types/select
// Otherwise, define it locally if specific to this component's form
// For example:
// export type LocalSelectOption = { value: string; label: string };


const BUG_REPORT_STATUS_OPTIONS_FORM: { value: BugReportStatusForm; label: string; }[] = [
  { value: "Unread", label: "Unread" },
  { value: "Read", label: "Read" },
];
// const bugReportStatusFormValues = BUG_REPORT_STATUS_OPTIONS_FORM.map( (s) => s.value ) as [BugReportStatusForm, ...BugReportStatusForm[]]; // Not used directly in schema

const bugStatusColor: Record<BugReportStatusApi, string> = {
  Unread: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Read: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  // Add more statuses if they exist on API but not in form
};

// --- Zod Schema for Add/Edit Bug Report Form ---
const bugReportFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name too long"),
  email: z.string().email("Invalid email format.").min(1, "Email is required."),
  mobile_no: z.string().max(20, "Mobile number too long.").optional().or(z.literal("")),
  report: z.string().min(10, "Report description must be at least 10 characters.").max(5000, "Report too long"),
  attachment: z.any().optional(),
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;


// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  // Using SelectOption type for filterStatus values for consistency if using a shared Select component
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterReportedBy: z.string().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- CSV Exporter, ActionColumn, Search, TableTools, SelectedFooter ---
const CSV_HEADERS_BUG = ["ID", "Name", "Email", "Mobile No", "Report", "Attachment", "Status", "Created At", "Updated At"];
const CSV_KEYS_BUG: (keyof BugReportItem)[] = ["id", "name", "email", "mobile_no", "report", "attachment", "status", "created_at", "updated_at"];
function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) {
    if (!rows || rows.length === 0) {
        toast.push(<Notification title="No Data" type="warning">There is no data to export.</Notification>);
        return false;
    }
    const csvContent = [
        CSV_HEADERS_BUG.join(','),
        ...rows.map(row => CSV_KEYS_BUG.map(key => {
            let val = row[key];
            if (val === null || val === undefined) val = "";
            return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported to {filename}</Notification>);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Your browser does not support this feature.</Notification>);
    return false;
}

const ActionColumn = ({ onEdit, onViewDetail, onChangeStatus }: { onEdit: () => void; onViewDetail: () => void; onChangeStatus: () => void; }) => {
  return ( <div className="flex items-center justify-start gap-2"> <Tooltip title="Edit (Admin)"> <button className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`} role="button" onClick={onEdit}><TbPencil /></button></Tooltip> <Tooltip title="View Details"> <button className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`} role="button" onClick={onViewDetail}><TbEye /></button></Tooltip> {/* Example of status change directly from action column, if needed:
     <Tooltip title={rowStatus === "Read" ? "Mark as Unread" : "Mark as Read"}>
        <button
            className={`text-xl cursor-pointer select-none p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                rowStatus === "Read" 
                ? "text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400" 
                : "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
            }`}
            role="button"
            onClick={onChangeStatus}
        >
            {rowStatus === "Read" ? <TbMailOpened /> : <TbMail />} // Assuming TbMailOpened exists or use another icon
        </button>
    </Tooltip>
     */} </div> );
};
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: ()=> void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => ( 
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> 
    <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> 
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"> 
      <Button icon={<TbReload />} onClick={onClearFilters} className=""></Button> 
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> 
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> 
    </div> 
  </div> );

type BugReportsSelectedFooterProps = { selectedItems: BugReportItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const BugReportsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: BugReportsSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; const handleDeleteClick = () => setDeleteConfirmOpen(true); const handleCancelDelete = () => setDeleteConfirmOpen(false); const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmOpen(false); }; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"> <span className="heading-text">{selectedItems.length}</span> <span>Report{selectedItems.length > 1 ? "s" : ""} selected</span> </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Report${selectedItems.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}> <p>Are you sure you want to delete the selected report{selectedItems.length > 1 ? "s" : ""}? </p> </ConfirmDialog> </> ); };


// --- Main Component: BugReportListing ---
const BugReportListing = () => {
  const dispatch = useAppDispatch();
  const {
    bugReportsData = [], // Assuming this is an array of ALL bug reports, or pre-filtered by backend based on broad criteria
    status: masterLoadingStatus = "idle",
    // If backend pagination is used, total count should come from selector:
    // bugReportsTotal = 0,
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<BugReportItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterStatus: [],
    filterReportedBy: "",
  });
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Initial data fetch.
    // This might fetch all reports or reports based on some initial broad query.
    // It includes current tableData and filterCriteria in case they are initialized differently (e.g. from URL params or localStorage)
    const initialParams = {
        ...tableData, // pageIndex, pageSize, sort, query
        filterStatus: filterCriteria.filterStatus?.map(s => s.value),
        filterReportedBy: filterCriteria.filterReportedBy,
    };
    dispatch(getBugReportsAction({ params: initialParams }));
  }, [dispatch]); // Runs once on mount if tableData and filterCriteria refs are stable initially.
                 // Consider if tableData/filterCriteria initial state can change and require re-fetch.
                 // A common pattern is dispatch; (empty array) for one-time fetch.

  const itemPath = (filename: any) => {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
    return filename ? `${baseUrl}/storage/attachments/bug_reports/${filename}` : "#";
  };

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
    defaultValues: filterCriteria, // Initialize with current filterCriteria state
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultAddFormValues);
    setSelectedFile(null);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultAddFormValues]); // defaultAddFormValues is stable
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: BugReportItem) => {
      setEditingItem(item);
      setSelectedFile(null);
      formMethods.reset({
        name: item.name,
        email: item.email,
        mobile_no: item.mobile_no || "",
        report: item.report,
        attachment: undefined, // User must re-select if changing
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const openViewDrawer = useCallback((item: BugReportItem) => {
    setViewingItem(item);
    setIsViewDrawerOpen(true);
  }, []);
  const closeViewDrawer = useCallback(() => {
    setViewingItem(null);
    setIsViewDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: BugReportFormData) => {
    setIsSubmitting(true);
    const formDataPayload = new FormData();
    formDataPayload.append("name", data.name);
    formDataPayload.append("email", data.email);
    if (data.mobile_no) formDataPayload.append("mobile_no", data.mobile_no);
    formDataPayload.append("report", data.report);
    if (selectedFile) {
      formDataPayload.append("attachment", selectedFile);
    }

    const paramsForRefetch = { // Params to refetch data after CUD operation
        ...tableData,
        filterStatus: filterCriteria.filterStatus?.map(s => s.value),
        filterReportedBy: filterCriteria.filterReportedBy,
    };

    if (editingItem) {
      formDataPayload.append("status", editingItem.status); // Preserve existing status
      formDataPayload.append("_method", "PUT");
      try {
        await dispatch(editBugReportAction({ id: editingItem.id, formData: formDataPayload })).unwrap();
        toast.push(<Notification title="Bug Report Updated" type="success" />);
        closeEditDrawer();
        dispatch(getBugReportsAction({ params: paramsForRefetch }));
      } catch (error: any) {
        toast.push(<Notification title="Update Failed" type="danger">{(error as Error).message || "Operation failed."}</Notification>);
      }
    } else {
      formDataPayload.append("status", "Unread"); // Default status for new reports
      try {
        await dispatch(addBugReportAction(formDataPayload)).unwrap();
        toast.push(<Notification title="Bug Report Submitted" type="success">Thank you for your report!</Notification>);
        closeAddDrawer();
        dispatch(getBugReportsAction({ params: paramsForRefetch }));
      } catch (error: any) {
        toast.push(<Notification title="Submission Failed" type="danger">{(error as Error).message || "Operation failed."}</Notification>);
      }
    }
    setIsSubmitting(false);
  };

  const handleChangeStatus = useCallback( async (item: BugReportItem, newStatus: BugReportStatusForm) => {
      setIsChangingStatus(true);
      const formData = new FormData();
      formData.append("name", item.name);
      formData.append("email", item.email);
      if (item.mobile_no) formData.append("mobile_no", item.mobile_no);
      formData.append("report", item.report);
      formData.append("status", newStatus);
      formData.append("_method", "PUT");

      const paramsForRefetch = {
        ...tableData,
        filterStatus: filterCriteria.filterStatus?.map(s => s.value),
        filterReportedBy: filterCriteria.filterReportedBy,
      };

      try {
        await dispatch(editBugReportAction({ id: item.id, formData })).unwrap();
        toast.push(<Notification title="Status Changed" type="success">{`Report status changed to ${newStatus}.`}</Notification>);
        dispatch(getBugReportsAction({ params: paramsForRefetch }));
      } catch (error: any) {
        toast.push(<Notification title="Status Change Failed" type="danger">{(error as Error).message}</Notification>);
      } finally {
        setIsChangingStatus(false);
      }
    }, [dispatch, tableData, filterCriteria] // Added filterCriteria
  );

  const handleDeleteClick = useCallback((item: BugReportItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false);
    const paramsForRefetch = {
        ...tableData,
        filterStatus: filterCriteria.filterStatus?.map(s => s.value),
        filterReportedBy: filterCriteria.filterReportedBy,
    };
    try { await dispatch(deleteBugReportAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Report Deleted" type="success">{`Report by "${itemToDelete.name}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getBugReportsAction({ params: paramsForRefetch })); } catch (error: any) { toast.push(<Notification title="Delete Failed" type="danger">{(error as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete, tableData, filterCriteria]); // Added filterCriteria
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id));
    const paramsForRefetch = {
        ...tableData,
        filterStatus: filterCriteria.filterStatus?.map(s => s.value),
        filterReportedBy: filterCriteria.filterReportedBy,
    };
    try { await dispatch(deleteAllBugReportsAction({ ids: idsToDelete.join(",") })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} report(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getBugReportsAction({ params: paramsForRefetch })); } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger">{(error as Error).message}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems, tableData, filterCriteria]); // Added filterCriteria

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    const newFilterCriteria = {
        filterStatus: data.filterStatus || [],
        filterReportedBy: data.filterReportedBy || "",
    };
    setFilterCriteria(newFilterCriteria);
    const newPageIndex = 1;
    setTableData((prev) => ({ ...prev, pageIndex: newPageIndex, query: prev.query })); // Maintain existing search query, reset page

    // Dispatch action to fetch data with new filters
    // The backend is expected to filter. Client-side filtering in useMemo will further refine or match this.
    dispatch(getBugReportsAction({
        params: {
            ...tableData, // Contains current sort, pageSize, query
            pageIndex: newPageIndex,
            filterStatus: newFilterCriteria.filterStatus?.map(s => s.value),
            filterReportedBy: newFilterCriteria.filterReportedBy,
        }
    }));
    closeFilterDrawer();
  }, [closeFilterDrawer, dispatch, tableData]);

  const onClearFilters = useCallback(() => {
    const defaultFilters: FilterFormData = { filterStatus: [], filterReportedBy: "" };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    const newPageIndex = 1;
    setTableData((prev) => ({ ...prev, pageIndex: newPageIndex, query: prev.query })); // Maintain existing search query, reset page

    // Dispatch action to fetch data with cleared filters
    dispatch(getBugReportsAction({
        params: {
            ...tableData, // Contains current sort, pageSize, query
            pageIndex: newPageIndex,
            filterStatus: [],
            filterReportedBy: "",
        }
    }));
  }, [filterFormMethods, dispatch, tableData]);

  // MODIFIED useMemo to include client-side filtering
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: BugReportItem[] = Array.isArray(bugReportsData) ? bugReportsData : [];
    let processedData: BugReportItem[] = cloneDeep(sourceData);

    // Apply filters from filterCriteria (client-side)
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const statusValues = filterCriteria.filterStatus.map(s => s.value);
      processedData = processedData.filter(item => statusValues.includes(item.status));
    }
    if (filterCriteria.filterReportedBy && filterCriteria.filterReportedBy.trim() !== "") {
      const reportedByQuery = filterCriteria.filterReportedBy.toLowerCase().trim();
      // Assuming 'filterReportedBy' searches name and email. Adjust if it's a specific field.
      processedData = processedData.filter(item =>
        item.name.toLowerCase().includes(reportedByQuery) ||
        item.email.toLowerCase().includes(reportedByQuery)
      );
    }

    // Client-side global search (tableData.query)
    if (tableData.query && tableData.query.trim() !== "") {
      const queryLower = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item =>
        item.name.toLowerCase().includes(queryLower) ||
        item.email.toLowerCase().includes(queryLower) ||
        item.report.toLowerCase().includes(queryLower) ||
        (item.mobile_no && item.mobile_no.toLowerCase().includes(queryLower))
      );
    }
    
    // Client-side sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
        processedData.sort((a, b) => {
            const aVal = a[key as keyof BugReportItem];
            const bVal = b[key as keyof BugReportItem];
            if (key === "created_at" || key === "updated_at") {
                const dateA = aVal ? new Date(aVal as string).getTime() : 0;
                const dateB = bVal ? new Date(bVal as string).getTime() : 0;
                return order === "asc" ? dateA - dateB : dateB - dateA;
            }
            const aStr = String(aVal ?? "").toLowerCase();
            const bStr = String(bVal ?? "").toLowerCase();
            return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
    }
    
    const dataToExport = [...processedData]; // All data after filtering and sorting for export
    const currentTotal = processedData.length; // Total items after filtering for pagination purposes

    // Client-side pagination
    const pageIndex = tableData.pageIndex as number; 
    const pageSize = tableData.pageSize as number; 
    const startIndex = (pageIndex - 1) * pageSize; 
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [bugReportsData, tableData, filterCriteria]); // Added filterCriteria to dependencies

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    const newTableData = { ...tableData, ...data };
    setTableData(newTableData);

    // Refetch data when table query parameters change (sort, pagination, global search)
    // Filters are handled by onApplyFiltersSubmit/onClearFilters which also dispatch
    if (data.sort || data.pageIndex || data.pageSize || (data.query !== undefined && data.query !== tableData.query)) {
        dispatch(getBugReportsAction({
            params: {
                ...newTableData, // Use the calculated new state for dispatch
                filterStatus: filterCriteria.filterStatus?.map(s => s.value),
                filterReportedBy: filterCriteria.filterReportedBy,
            }
        }));
    }
  }, [tableData, dispatch, filterCriteria]);

  const handleExportData = useCallback(() => { exportBugReportsToCsv("bug_reports_export.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback( (page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData] );
  const handleSelectChange = useCallback( (value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData] );
  const handleSort = useCallback( (sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData] );
  const handleSearchChange = useCallback( (query: string) => {
    handleSetTableData({ query: query, pageIndex: 1 });
  }, [handleSetTableData] );
  const handleRowSelect = useCallback( (checked: boolean, row: BugReportItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, [] );
  const handleAllRowSelect = useCallback( (checked: boolean, currentRows: Row<BugReportItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, [] );

  const columns: ColumnDef<BugReportItem>[] = useMemo( () => [
      { header: "Status", accessorKey: "status", size: 120, enableSorting: true, 
        cell: (props) => { 
            const statusVal = props.getValue<BugReportStatusApi>(); 
            return (<Tag className={classNames("capitalize whitespace-nowrap min-w-[60px] text-center", bugStatusColor[statusVal] || "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100")}>{statusVal || "N/A"}</Tag>); 
        }, 
      },
      { header: "Name", accessorKey: "name", size: 180, enableSorting: true, cell: (props) => (<span className="font-semibold">{props.getValue<string>()}</span>), },
      { header: "Email", accessorKey: "email", size: 200, enableSorting: true },
      { header: "Mobile No", accessorKey: "mobile_no", size: 130, cell: (props) => props.getValue() || "-", },
      { header: "Reported On", accessorKey: "created_at", size: 150, enableSorting: true, cell: (props) => props.getValue() ? new Date(props.getValue<string>()).toLocaleDateString() : "-", },
      { header: "Actions", id: "actions", meta: { headerClass: "text-center", cellClass: "text-center" }, size: 120, 
        cell: (props) => ( <ActionColumn 
            onEdit={() => openEditDrawer(props.row.original)} 
            onViewDetail={() => openViewDrawer(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original, props.row.original.status === "Read" ? "Unread" : "Read")} // Example direct status change
        /> ),
      },
    ], [openEditDrawer, openViewDrawer, handleChangeStatus] 
  );

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Name"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.name}
        errorMessage={currentFormMethods.formState.errors.name?.message}
      >
        <Controller name="name" control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} prefix={<TbUserCircle className="text-lg" />} placeholder="Your Name" />)}
        />
      </FormItem>
      <FormItem
        label="Email"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.email}
        errorMessage={currentFormMethods.formState.errors.email?.message}
      >
        <Controller name="email" control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} type="email" prefix={<TbMail className="text-lg"/>} placeholder="your.email@example.com" />)}
        />
      </FormItem>
      <FormItem
        label="Mobile No. (Optional)"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.mobile_no}
        errorMessage={currentFormMethods.formState.errors.mobile_no?.message}
      >
        <Controller name="mobile_no" control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone className="text-lg"/>} placeholder="+XX-XXXXXXXXXX" />)}
        />
      </FormItem>
      
      <FormItem
        label="Report / Description"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.report}
        errorMessage={currentFormMethods.formState.errors.report?.message}
      >
        <Controller name="report" control={currentFormMethods.control}
          render={({ field }) => (<Input textArea {...field} rows={6} prefix={<TbFileDescription className="text-lg mt-2.5"/>} placeholder="Please describe the bug in detail..." />)}
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
              prefix={<TbPaperclip className="text-lg" />}
            />
          )}
        />
        {editingItem?.attachment && !selectedFile && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Current: <a href={itemPath(editingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{editingItem.attachment}</a>
            </div>
          )}
      </FormItem>
    </div>
  );

  const renderViewDetails = (item: BugReportItem) => (
    <div className="p-1 space-y-5"> {/* Increased spacing */}
        <div className="flex items-start">
            <TbUserCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
            <div>
                <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Name</h6>
                <p className="text-gray-800 dark:text-gray-100 text-base">{item.name}</p>
            </div>
        </div>
        <div className="flex items-start">
            <TbMail className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
            <div>
                <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email</h6>
                <p className="text-gray-800 dark:text-gray-100 text-base">{item.email}</p>
            </div>
        </div>
        {item.mobile_no && (
            <div className="flex items-start">
                <TbPhone className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
                <div>
                    <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mobile No.</h6>
                    <p className="text-gray-800 dark:text-gray-100 text-base">{item.mobile_no}</p>
                </div>
            </div>
        )}
        <div className="flex items-start">
            <TbInfoCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
            <div>
                <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</h6>
                <Tag className={classNames("capitalize text-sm", bugStatusColor[item.status] || "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100")}>
                    {item.status}
                </Tag>
            </div>
        </div>
        <div className="flex items-start">
            <TbFileDescription className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
            <div>
                <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Report Description</h6>
                <p className="text-gray-800 dark:text-gray-100 text-base whitespace-pre-wrap">{item.report}</p>
            </div>
        </div>
        {item.attachment && (
            <div className="flex items-start">
                <TbPaperclip className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
                <div>
                    <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Attachment</h6>
                    <a
                        href={itemPath(item.attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline break-all text-base"
                    >
                        {item.attachment}
                    </a>
                </div>
            </div>
        )}
        {item.created_at && (
            <div className="flex items-start">
                <TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
                <div>
                    <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reported On</h6>
                    <p className="text-gray-800 dark:text-gray-100 text-base">
                        {new Date(item.created_at).toLocaleString()}
                    </p>
                </div>
            </div>
        )}
        {item.updated_at && item.updated_at !== item.created_at && (
             <div className="flex items-start">
                <TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
                <div>
                    <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Last Updated</h6>
                    <p className="text-gray-800 dark:text-gray-100 text-base">
                        {new Date(item.updated_at).toLocaleString()}
                    </p>
                </div>
            </div>
        )}
    </div>
);


  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Bug Reports</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Report</Button>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onClearFilters={onClearFilters}/>
          <div className="mt-4">
            <DataTable
              columns={columns} data={pageData} 
              loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting || isChangingStatus}
              pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable
              checkboxChecked={(row: BugReportItem) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
              onSort={handleSort} onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <BugReportsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

      {/* Add/Edit Drawer */}
      <Drawer
        title={editingItem ? "Edit Bug Report (Admin)" : "Report New Bug"}
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

      {/* View Details Drawer */}
      <Drawer
        title="Bug Report Details"
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        onRequestClose={closeViewDrawer}
        width={600} 
        footer={
            <div className="text-right w-full">
                <Button size="sm" variant="solid" onClick={closeViewDrawer}>
                    Close
                </Button>
            </div>
        }
      >
        {viewingItem && renderViewDetails(viewingItem)}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterBugReportForm" type="submit">Apply</Button> </div> }
      >
        <Form id="filterBugReportForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Status">
            <Controller
                name="filterStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                    <Select
                        isMulti
                        placeholder="Any Status"
                        options={BUG_REPORT_STATUS_OPTIONS_FORM.map((s) => ({ value: s.value, label: s.label }))}
                        value={field.value || []} // Ensure value is an array
                        onChange={(val) => field.onChange(val || [])} // Ensure onChange receives an array
                    />
                )}
            />
          </FormItem>
          <FormItem label="Reported By (Name/Email)">
            <Controller
                name="filterReportedBy"
                control={filterFormMethods.control}
                render={({ field }) => (
                    <Input {...field} placeholder="Enter name or email to filter" />
                )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Bug Report" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p>Are you sure you want to delete the report by "<strong>{itemToDelete?.name}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default BugReportListing;