// src/views/your-path/Documentmaster.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DebounceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { Drawer, Form, FormItem, Input, Tag, Dropdown, Checkbox, Card, Avatar, Dialog, Skeleton } from '@/components/ui' // Import Skeleton

// Icons
import { TbPencil, TbTrash, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbReload, TbX, TbColumns, TbFile, TbFileCheck, TbFileX, TbUserCircle } from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux Imports
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    getDocumentTypeAction,
    addDocumentTypeAction,
    editDocumentTypeAction,
    deleteDocumentTypeAction,
    getDepartmentsAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'
import { formatCustomDateTime } from '@/utils/formatCustomDateTime'

// --- FEATURE-SPECIFIC TYPES & SCHEMAS ---
type Department = { id: number; name: string; };
export type DocumentTypeItem = { id: string | number; name: string; status: 'Active' | 'Inactive'; departments: Department[]; created_at?: string; updated_at?: string; updated_by_user?: { name: string; profile_pic_path?: string; roles: { display_name: string }[] }; };
export type SelectOption = { value: string | number; label: string };
type DocumentTypeFilterSchema = { names: string[]; departmentIds: string[]; status: ('Active' | 'Inactive')[]; };
const documentTypeFormSchema = z.object({ name: z.string().min(1, 'Document type name is required.').max(100, 'Name cannot exceed 100 characters.'), department_id: z.array(z.number()).min(1, "Please select at least one department."), status: z.enum(['Active', 'Inactive'], { required_error: 'Status is required.' }), });
type DocumentTypeFormData = z.infer<typeof documentTypeFormSchema>;
const exportReasonSchema = z.object({ reason: z.string().min(1, 'Reason for export is required.').max(255, 'Reason cannot exceed 255 characters.'), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const statusOptions: SelectOption[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];

// --- HELPERS ---
function exportToCsvDocType(filename: string, rows: DocumentTypeItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    const CSV_HEADERS = ["ID", "Document Type Name", "Departments", "Status", "Updated By", "Updated Role", "Updated At"];
    const preparedRows = (rows || []).map(row => ({ id: row.id, name: row.name, departments: (row.departments || []).map(d => d.name).join('; '), status: row.status, updated_by_name: row.updated_by_user?.name || "N/A", updated_by_role: row.updated_by_user?.roles?.[0]?.display_name || "N/A", updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A", }));
    const csvContent = [CSV_HEADERS.join(','), ...preparedRows.map(row => [row.id, `"${String(row.name).replace(/"/g, '""')}"`, `"${String(row.departments).replace(/"/g, '""')}"`, row.status, `"${String(row.updated_by_name).replace(/"/g, '""')}"`, `"${String(row.updated_by_role).replace(/"/g, '""')}"`, `"${String(row.updated_at).replace(/"/g, '""')}"`].join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
}

// --- REUSABLE DISPLAY & TOOL COMPONENTS ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, departmentOptions }) => {
    const activeNames = filterData.names || []; const activeDepartments = filterData.departmentIds || []; const activeStatuses = filterData.status || []; const hasActiveFilters = activeNames.length > 0 || activeDepartments.length > 0 || activeStatuses.length > 0;
    if (!hasActiveFilters) return null;
    const getDepartmentName = (id: string) => (departmentOptions || []).find(opt => String(opt.value) === id)?.label || id;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeNames.map(name => (<Tag key={`name-${name}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Name: {name}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('names', name)} /></Tag>))}
            {activeDepartments.map(deptId => (<Tag key={`dept-${deptId}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Department: {getDepartmentName(deptId)}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('departmentIds', deptId)} /></Tag>))}
            {activeStatuses.map(status => (<Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status', status)} /></Tag>))}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const DocumentTypeTableTools = React.forwardRef(({ onSearchChange, onApplyFilters, onClearFilters, onExport, activeFilters, activeFilterCount, typeNameOptions, departmentOptions, columns, filteredColumns, setFilteredColumns, searchInputValue, isDataReady }, ref) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { control, handleSubmit, setValue } = useForm<DocumentTypeFilterSchema>({ defaultValues: { names: [], departmentIds: [], status: [] } });
    
    const { names, departmentIds, status } = activeFilters;
    useEffect(() => {
        setValue('names', names || []);
        setValue('departmentIds', departmentIds || []);
        setValue('status', status || []);
    }, [names, departmentIds, status, setValue]);

    const onSubmit = (data: DocumentTypeFilterSchema) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
    const onDrawerClear = () => { onApplyFilters({}); setIsFilterDrawerOpen(false); };
    const toggleColumn = (checked: boolean, colHeader: string) => { if (checked) { setFilteredColumns((currentCols) => { const newVisibleHeaders = [...(currentCols || []).map((c) => c.header as string), colHeader]; return (columns || []).filter((c) => newVisibleHeaders.includes(c.header as string)); }); } else { setFilteredColumns((currentCols) => (currentCols || []).filter((c) => c.header !== colHeader)); } };
    const isColumnVisible = (header: string) => (filteredColumns || []).some((c) => c.header === header);
    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0"><DebounceInput value={searchInputValue} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {(columns || []).map((col) => col.header && (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady} />
                <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)} disabled={!isDataReady}>Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} disabled={!isDataReady}>Export</Button>
            </div>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button><Button size="sm" variant="solid" type="submit" form="filterDocTypeForm">Apply</Button></div>}>
                <Form id="filterDocTypeForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Document Type Name"><Controller name="names" control={control} render={({ field }) => (<Select isMulti placeholder="Select names..." options={typeNameOptions} value={typeNameOptions.filter(o => (field.value || []).includes(o.value))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Department"><Controller name="departmentIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select departments..." options={departmentOptions} value={departmentOptions.filter(o => (field.value || []).includes(String(o.value)))} onChange={(val) => field.onChange((val || []).map(v => String(v.value)))} />)} /></FormItem>
                    <FormItem label="Status"><Controller name="status" control={control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={statusOptions} value={statusOptions.filter(o => (field.value || []).includes(o.value))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                </Form>
            </Drawer>
        </div>
    );
});
DocumentTypeTableTools.displayName = 'DocumentTypeTableTools';

// --- MAIN DOCUMENT TYPE COMPONENT ---
const Documentmaster = () => {
    const dispatch = useAppDispatch();
    const [initialLoading, setInitialLoading] = useState(true);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingDocType, setEditingDocType] = useState<DocumentTypeItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<DocumentTypeItem | null>(null);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Partial<DocumentTypeFilterSchema>>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);

    const { DocumentTypeData = [], departmentsData = { data: [] } } = useSelector(masterSelector);
    const isDataReady = !initialLoading;
    
    const departmentOptionsForSelect = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: Department) => ({ value: d.id, label: d.name })) : [], [departmentsData?.data]);
    const typeNameOptionsForFilter = useMemo(() => Array.isArray(DocumentTypeData) ? [...new Set(DocumentTypeData.map(item => item.name))].sort().map(name => ({ value: name, label: name })) : [], [DocumentTypeData]);
    
    const refreshData = useCallback(async () => {
        setInitialLoading(true);
        try {
            await Promise.all([
                dispatch(getDocumentTypeAction()),
                dispatch(getDepartmentsAction())
            ]);
        } catch (error) {
            console.error("Failed to refresh data:", error);
            toast.push(<Notification title="Data Refresh Failed" type="danger">Could not reload data.</Notification>);
        } finally {
            setInitialLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const formMethods = useForm<DocumentTypeFormData>({ resolver: zodResolver(documentTypeFormSchema), defaultValues: { name: "", department_id: [], status: 'Active' }, mode: "onChange" });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

    const openImageViewer = (imageUrl: string | null | undefined) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
    const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

    const openEditDrawer = useCallback((docType: DocumentTypeItem) => {
        setEditingDocType(docType);
        const departmentIds = (docType.departments || []).map(d => d.id);
        formMethods.reset({
            name: docType.name,
            department_id: departmentIds,
            status: docType.status || 'Active'
        });
        setIsEditDrawerOpen(true);
    }, [formMethods]);

    const handleDeleteClick = useCallback((type: DocumentTypeItem) => {
        setTypeToDelete(type);
        setSingleDeleteConfirmOpen(true);
    }, []);

    const columns: ColumnDef<DocumentTypeItem>[] = useMemo(() => [
        { header: "Document Type Name", accessorKey: "name", enableSorting: true, size: 200 },
        { header: "Departments", accessorKey: "departments", size: 250, cell: (props) => { const departments = props.row.original.departments || []; return (<div className="flex flex-wrap gap-1">{departments.map(dept => <Tag key={dept.id} className="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 text-[11px] border-b border-emerald-300 dark:border-emerald-700">{dept.name}</Tag>)}</div>) } },
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

        { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => (<Tag className={classNames({ "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-b border-emerald-300 dark:border-emerald-700": props.row.original.status === 'Active', "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-b border-red-300 dark:border-red-700": props.row.original.status === 'Inactive' })}>{props.row.original.status}</Tag>) },
        { header: 'Action', id: 'action', size: 80, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<div className="flex items-center justify-center gap-2"><Tooltip title="Edit"><div className="text-lg p-1.5 cursor-pointer hover:text-blue-500" onClick={() => openEditDrawer(props.row.original)}><TbPencil /></div></Tooltip>
        {/* <Tooltip title="Delete"><div className="text-lg p-1.5 cursor-pointer hover:text-red-500" onClick={() => handleDeleteClick(props.row.original)}><TbTrash /></div></Tooltip> */}
        </div>) },
    ], [departmentOptionsForSelect, openEditDrawer, handleDeleteClick]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<DocumentTypeItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns); }, [columns]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData = DocumentTypeData || [];
        let processedData: DocumentTypeItem[] = cloneDeep(sourceData);
        if (activeFilters.names?.length) { const names = new Set(activeFilters.names.map(n => n.toLowerCase())); processedData = processedData.filter(item => names.has(item.name.toLowerCase())); }
        if (activeFilters.departmentIds?.length) { const deptIds = new Set(activeFilters.departmentIds.map(id => Number(id))); processedData = processedData.filter(item => (item.departments || []).some(dept => deptIds.has(dept.id))); }
        if (activeFilters.status?.length) { const statuses = new Set(activeFilters.status); processedData = processedData.filter(item => statuses.has(item.status)); }
        
        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                (item.departments || []).some(d => d.name.toLowerCase().includes(query)) ||
                item.status?.toLowerCase().includes(query) ||
                item.updated_by_user?.name?.toLowerCase().includes(query)
            );
        }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) { processedData.sort((a, b) => { const aValue = a[key as keyof DocumentTypeItem] ?? ""; const bValue = b[key as keyof DocumentTypeItem] ?? ""; if (key === 'updated_at') { const dateA = aValue ? new Date(aValue as string).getTime() : 0; const dateB = bValue ? new Date(bValue as string).getTime() : 0; return order === 'asc' ? dateA - dateB : dateB - dateA; } return order === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue)); }); }

        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [DocumentTypeData, tableData, activeFilters]);

    const activeFilterCount = useMemo(() => {
        let count = 0; if (activeFilters.names?.length) count++; if (activeFilters.departmentIds?.length) count++; if (activeFilters.status?.length) count++; return count;
    }, [activeFilters]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectPageSizeChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { setTableData((prev) => ({ ...prev, query: query, pageIndex: 1 })); }, []);
    const handleApplyFilters = useCallback((filters: Partial<DocumentTypeFilterSchema>) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof DocumentTypeFilterSchema, value: string) => {
        setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = prev[key] as string[] | undefined; if (!currentValues) return prev; const newValues = currentValues.filter(item => item !== value); if (newValues.length > 0) { (newFilters as any)[key] = newValues; } else { delete newFilters[key]; } return newFilters; });
        handleSetTableData({ pageIndex: 1 });
    }, [handleSetTableData]);
    const onClearFiltersAndReload = useCallback(() => { setActiveFilters({}); setTableData({ ...tableData, query: '', pageIndex: 1 }); refreshData(); }, [tableData, refreshData]);
    const handleClearAllFilters = useCallback(() => onClearFiltersAndReload(), [onClearFiltersAndReload]);
    const handleCardClick = (status: 'Active' | 'Inactive' | 'All') => { handleSetTableData({ query: '', pageIndex: 1 }); if (status === 'All') { setActiveFilters({}); } else { setActiveFilters({ status: [status] }); } };

    const openAddDrawer = () => { formMethods.reset({ name: "", department_id: [], status: 'Active' }); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => { setIsAddDrawerOpen(false); };
    const onAddDocumentTypeSubmit = async (data: DocumentTypeFormData) => { 
        setIsSubmitting(true); 
        try { 
            await dispatch(addDocumentTypeAction(data)).unwrap(); 
            toast.push(<Notification title="Document Type Added" type="success">{`Type "${data.name}" was successfully added.`}</Notification>); 
            closeAddDrawer(); 
            refreshData(); 
        } catch (error: any) { 
            toast.push(<Notification title="Failed to Add Type" type="danger">{error.message || "An unexpected error occurred."}</Notification>); 
        } finally { 
            setIsSubmitting(false); 
        } 
    };
    
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingDocType(null); };
    const onEditDocumentTypeSubmit = async (data: DocumentTypeFormData) => { 
        if (!editingDocType?.id) return; 
        setIsSubmitting(true); 
        try { 
            await dispatch(editDocumentTypeAction({ id: editingDocType.id, ...data })).unwrap(); 
            toast.push(<Notification title="Document Type Updated" type="success">{`"${data.name}" was successfully updated.`}</Notification>); 
            closeEditDrawer(); 
            refreshData(); 
        } catch (error: any) { 
            toast.push(<Notification title="Failed to Update Type" type="danger">{error.message || "An unexpected error occurred."}</Notification>); 
        } finally { 
            setIsSubmitting(false); 
        } 
    };
    
    const onConfirmSingleDelete = async () => { 
        if (!typeToDelete?.id) return; 
        setIsDeleting(true); 
        try { 
            await dispatch(deleteDocumentTypeAction({ id: typeToDelete.id })).unwrap(); 
            toast.push(<Notification title="Document Type Deleted" type="success">{`"${typeToDelete.name}" was successfully deleted.`}</Notification>); 
            refreshData(); 
        } catch (error: any) { 
            toast.push(<Notification title="Failed to Delete Type" type="danger">{error.message || "An unexpected error occurred."}</Notification>); 
        } finally { 
            setIsDeleting(false); 
            setSingleDeleteConfirmOpen(false); 
            setTypeToDelete(null); 
        } 
    };

    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `document_types_export_${new Date().toISOString().split('T')[0]}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: "Document Type", file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportToCsvDocType(fileName, allFilteredAndSortedData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>); } finally { setIsSubmittingExportReason(false); }
    };

    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex items-center gap-2 p-2";

    const renderCardContent = (count: number) => {
        if (initialLoading) {
            return <Skeleton width={40} height={20} />;
        }
        return <h6 className="text-sm">{count}</h6>;
    };

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h3 className="mb-4 lg:mb-0">Document Types</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} className="w-full sm:w-auto mt-2 sm:mt-0">Add Document Type</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto mb-4 gap-4">
                        <Tooltip title="Click to show all document types"><div onClick={() => handleCardClick('All')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"><TbFile size={20} /></div><div>{renderCardContent(DocumentTypeData.length)}<span className="text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show active document types"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"><TbFileCheck size={20} /></div><div>{renderCardContent(DocumentTypeData.filter(d => d.status === 'Active').length)}<span className="text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show inactive document types"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100"><TbFileX size={20} /></div><div>{renderCardContent(DocumentTypeData.filter(d => d.status === 'Inactive').length)}<span className="text-xs">Inactive</span></div></Card></div></Tooltip>
                    </div>
                    <div className="mb-4">
                        <DocumentTypeTableTools onSearchChange={handleSearchChange} onApplyFilters={handleApplyFilters} onClearFilters={onClearFiltersAndReload} onExport={handleOpenExportReasonModal} activeFilters={activeFilters} activeFilterCount={activeFilterCount} typeNameOptions={typeNameOptionsForFilter} departmentOptions={departmentOptionsForSelect} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} searchInputValue={tableData?.query} isDataReady={isDataReady} />
                    </div>
                    <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} departmentOptions={departmentOptionsForSelect} />
                    {(activeFilterCount > 0 || tableData.query) && <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching document type(s).</div>}
                    <div className="flex-grow overflow-auto">
                        <DataTable columns={filteredColumns} data={pageData} noData={pageData.length <= 0} loading={initialLoading || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} />
                    </div>
                </AdaptiveCard>
            </Container>

            <Drawer title={isEditDrawerOpen ? "Edit Document Type" : "Add Document Type"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} onRequestClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} width={480} bodyClass="relative" footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form={isEditDrawerOpen ? "editDocTypeForm" : "addDocTypeForm"} type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (isEditDrawerOpen ? "Saving..." : "Adding...") : "Save"}</Button></div>}>
                <Form id={isEditDrawerOpen ? "editDocTypeForm" : "addDocTypeForm"} onSubmit={formMethods.handleSubmit(isEditDrawerOpen ? onEditDocumentTypeSubmit : onAddDocumentTypeSubmit)} className="flex flex-col gap-4">
                    <FormItem label={<div>Document Type Name <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Document Type Name" />)} /></FormItem>
                    <FormItem label={<div>Departments <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.department_id} errorMessage={formMethods.formState.errors.department_id?.message as string}><Controller name="department_id" control={formMethods.control} render={({ field }) => (<Select isMulti placeholder="Select departments..." options={departmentOptionsForSelect} value={departmentOptionsForSelect.filter(o => (field.value || []).includes(o.value as number))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                    <FormItem label={<div>Status <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value) || null} onChange={(o) => field.onChange(o ? o.value : "")} />)} /></FormItem>
                </Form>
                {isEditDrawerOpen && editingDocType && (
                    <div className=" grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div>
              <b className="mt-3 mb-3 font-semibold text-primary">
                Latest Update:
              </b>
              <br />
              <p className="text-sm font-semibold">
                {editingDocType.updated_by_user?.name || "N/A"}
              </p>
              <p>
                {editingDocType.updated_by_user?.roles[0]?.display_name ||
                  "N/A"}
              </p>
            </div>
            <div className="text-right">
              <br />
              <span className="font-semibold">Created At:</span>{" "}
              <span>
                {editingDocType.created_at
                  ? `${new Date(
                      editingDocType.created_at
                    ).getDate()} ${new Date(
                      editingDocType.created_at
                    ).toLocaleString("en-US", {
                      month: "short",
                    })} ${new Date(
                      editingDocType.created_at
                    ).getFullYear()}, ${new Date(
                      editingDocType.created_at
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
                {editingDocType.updated_at
                  ? `${new Date(
                      editingDocType.updated_at
                    ).getDate()} ${new Date(
                      editingDocType.updated_at
                    ).toLocaleString("en-US", {
                      month: "short",
                    })} ${new Date(
                      editingDocType.updated_at
                    ).getFullYear()}, ${new Date(
                      editingDocType.updated_at
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
            
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem>
                </Form>
            </ConfirmDialog>

            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Document Type" onClose={() => { setSingleDeleteConfirmOpen(false); setTypeToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setTypeToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setTypeToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete the document type "<strong>{typeToDelete?.name}</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>
            
            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={imageToView} alt="User Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
        </>
    );
};

export default Documentmaster;