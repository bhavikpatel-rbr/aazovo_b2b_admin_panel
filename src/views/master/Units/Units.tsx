// src/views/your-path/Units.tsx

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
import { Drawer, Form, FormItem, Input, Tag, Dropdown, Checkbox, Card, Avatar, Dialog } from '@/components/ui'

// Icons
import { TbPencil, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbReload, TbX, TbColumns, TbFile, TbFileCheck, TbFileX, TbUserCircle } from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux Imports
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    getUnitAction,
    addUnitAction,
    editUnitAction,
    getParentCategoriesAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'

// --- FEATURE-SPECIFIC TYPES & SCHEMAS ---
type Category = { id: number; name: string };
export type UnitItem = { id: string | number; name: string; status: 'Active' | 'Inactive'; categories: Category[]; created_at?: string; updated_at?: string; updated_by_user?: { name: string; profile_pic_path?: string; roles: { display_name: string }[] }; };
export type SelectOption = { value: string | number; label: string };
type UnitFilterSchema = { names: string[]; categoryIds: string[]; status: ('Active' | 'Inactive')[]; };
const unitFormSchema = z.object({ name: z.string().min(1, "Unit name is required.").max(100, "Name cannot exceed 100 characters."), category_ids: z.array(z.number()).min(1, "Please select at least one category."), status: z.enum(['Active', 'Inactive'], { required_error: "Status is required." }), });
type UnitFormData = z.infer<typeof unitFormSchema>;
const exportReasonSchema = z.object({ reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const statusOptions: SelectOption[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' },];

// --- HELPERS ---
function exportToCsvUnit(filename: string, rows: UnitItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    const CSV_HEADERS = ["ID", "Unit Name", "Categories", "Status", "Updated By", "Updated Role", "Updated At"];
    const preparedRows = rows.map(row => ({ id: row.id, name: row.name, categories: row.categories.map(c => c.name).join('; '), status: row.status, updated_by_name: row.updated_by_user?.name || "N/A", updated_by_role: row.updated_by_user?.roles[0]?.display_name || "N/A", updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A", }));
    const csvContent = [CSV_HEADERS.join(','), ...preparedRows.map(row => [row.id, `"${String(row.name).replace(/"/g, '""')}"`, `"${String(row.categories).replace(/"/g, '""')}"`, row.status, `"${String(row.updated_by_name).replace(/"/g, '""')}"`, `"${String(row.updated_by_role).replace(/"/g, '""')}"`, `"${String(row.updated_at).replace(/"/g, '""')}"`].join(','))].join('\n');
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
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, categoryOptions }) => {
    const activeNames = filterData.names || []; const activeCategories = filterData.categoryIds || []; const activeStatuses = filterData.status || []; const hasActiveFilters = activeNames.length > 0 || activeCategories.length > 0 || activeStatuses.length > 0;
    if (!hasActiveFilters) return null;
    const getCategoryName = (id: string) => categoryOptions.find(opt => opt.value === id)?.label || id;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeNames.map(name => (<Tag key={`name-${name}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Name: {name}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('names', name)} /></Tag>))}
            {activeCategories.map(catId => (<Tag key={`cat-${catId}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Category: {getCategoryName(catId)}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('categoryIds', catId)} /></Tag>))}
            {activeStatuses.map(status => (<Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status', status)} /></Tag>))}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const UnitTableTools = React.forwardRef(({ onSearchChange, onApplyFilters, onClearFilters, onExport, activeFilters, activeFilterCount, unitNameOptions, categoryOptions, columns, filteredColumns, setFilteredColumns, searchInputValue }, ref) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { control, handleSubmit, setValue } = useForm<UnitFilterSchema>({ defaultValues: { names: [], categoryIds: [], status: [] }, });
    useEffect(() => { setValue('names', activeFilters.names || []); setValue('categoryIds', activeFilters.categoryIds || []); setValue('status', activeFilters.status || []); }, [activeFilters, setValue]);
    const onSubmit = (data: UnitFilterSchema) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
    const onDrawerClear = () => { onApplyFilters({}); setIsFilterDrawerOpen(false); };
    const toggleColumn = (checked: boolean, colHeader: string) => { if (checked) { setFilteredColumns((currentCols) => { const newVisibleHeaders = [...currentCols.map((c) => c.header as string), colHeader]; return columns.filter((c) => newVisibleHeaders.includes(c.header as string)); }); } else { setFilteredColumns((currentCols) => currentCols.filter((c) => c.header !== colHeader)); } };
    const isColumnVisible = (header: string) => filteredColumns.some((c) => c.header === header);
    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0"><DebounceInput value={searchInputValue} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => col.header && (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} />
                <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)}>Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
            </div>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button><Button size="sm" variant="solid" type="submit" form="filterUnitForm">Apply</Button></div>}>
                <Form id="filterUnitForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Unit Name"><Controller name="names" control={control} render={({ field }) => (<Select isMulti placeholder="Select names..." options={unitNameOptions} value={unitNameOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Category"><Controller name="categoryIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select categories..." options={categoryOptions} value={categoryOptions.filter(o => field.value?.includes(String(o.value)))} onChange={(val) => field.onChange(val.map(v => String(v.value)))} />)} /></FormItem>
                    <FormItem label="Status"><Controller name="status" control={control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={statusOptions} value={statusOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                </Form>
            </Drawer>
        </div>
    );
});
UnitTableTools.displayName = 'UnitTableTools';


// --- MAIN UNITS COMPONENT ---
const Units = () => {
    const dispatch = useAppDispatch();
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Partial<UnitFilterSchema>>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);

    const { unitData = [], ParentCategories = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);
    const categoryOptionsForSelect = useMemo(() => Array.isArray(ParentCategories) ? ParentCategories.map((cat: Category) => ({ value: cat.id, label: cat.name })) : [], [ParentCategories]);
    const unitNameOptionsForFilter = useMemo(() => Array.isArray(unitData) ? [...new Set(unitData.map(doc => doc.name))].sort().map(name => ({ value: name, label: name })) : [], [unitData]);

    useEffect(() => { dispatch(getUnitAction()); dispatch(getParentCategoriesAction()); }, [dispatch]);

    const formMethods = useForm<UnitFormData>({ resolver: zodResolver(unitFormSchema), defaultValues: { name: "", category_ids: [], status: 'Active' }, mode: "onChange" });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

    const openImageViewer = (imageUrl: string | null | undefined) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
    const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

    const columns: ColumnDef<UnitItem>[] = useMemo(() => [
        { header: "Unit Name", accessorKey: "name", enableSorting: true, size: 200 },
        { header: "Category", accessorKey: "categories", size: 250, cell: (props) => { const categories = props.row.original.categories || []; return (<div className="flex flex-wrap gap-1">{categories.map(cat => <Tag key={cat.id} className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100">{cat.name}</Tag>)}</div>) } },
        { header: 'Updated Info', accessorKey: 'updated_at', enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; const formattedDate = updated_at ? new Date(updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'; return (<div className="flex items-center gap-2"><Avatar src={updated_by_user?.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} /><div><span>{updated_by_user?.name || 'N/A'}</span><div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div><div className="text-xs text-gray-500">{formattedDate}</div></div></div>); } },
        { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => (<Tag className={classNames({ "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100": props.row.original.status === 'Active', "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100": props.row.original.status === 'Inactive' })}>{props.row.original.status}</Tag>) },
        { header: 'Action', id: 'action', size: 80, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<div className="flex items-center justify-center gap-2"><Tooltip title="Edit"><div className="text-lg p-1.5 cursor-pointer hover:text-blue-500" onClick={() => openEditDrawer(props.row.original)}><TbPencil /></div></Tooltip></div>) },
    ], [categoryOptionsForSelect]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<UnitItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns); }, [columns]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: UnitItem[] = cloneDeep(unitData || []);
        if (activeFilters.names?.length) { const names = new Set(activeFilters.names.map(n => n.toLowerCase())); processedData = processedData.filter(item => names.has(item.name.toLowerCase())); }
        if (activeFilters.categoryIds?.length) { const catIds = new Set(activeFilters.categoryIds.map(id => Number(id))); processedData = processedData.filter(item => item.categories?.some(cat => catIds.has(cat.id))); }
        if (activeFilters.status?.length) { const statuses = new Set(activeFilters.status); processedData = processedData.filter(item => statuses.has(item.status)); }
        
        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.categories?.some(cat => cat.name.toLowerCase().includes(query)) ||
                item.status?.toLowerCase().includes(query) ||
                item.updated_by_user?.name?.toLowerCase().includes(query)
            );
        }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) { processedData.sort((a, b) => { const aValue = a[key as keyof UnitItem] ?? ""; const bValue = b[key as keyof UnitItem] ?? ""; if (key === 'updated_at') { const dateA = aValue ? new Date(aValue as string).getTime() : 0; const dateB = bValue ? new Date(bValue as string).getTime() : 0; return order === 'asc' ? dateA - dateB : dateB - dateA; } return order === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue)); }); }

        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [unitData, tableData, activeFilters]);

    const activeFilterCount = useMemo(() => {
        let count = 0; if (activeFilters.names?.length) count++; if (activeFilters.categoryIds?.length) count++; if (activeFilters.status?.length) count++; return count;
    }, [activeFilters]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectPageSizeChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { setTableData((prev) => ({ ...prev, query: query, pageIndex: 1 })); }, []);
    const handleApplyFilters = useCallback((filters: Partial<UnitFilterSchema>) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof UnitFilterSchema, value: string) => {
        setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = prev[key] as string[] | undefined; if (!currentValues) return prev; const newValues = currentValues.filter(item => item !== value); if (newValues.length > 0) { (newFilters as any)[key] = newValues; } else { delete newFilters[key]; } return newFilters; });
        handleSetTableData({ pageIndex: 1 });
    }, [handleSetTableData]);
    const onClearFiltersAndReload = () => { setActiveFilters({}); setTableData({ ...tableData, query: '', pageIndex: 1 }); dispatch(getUnitAction()); };
    const handleClearAllFilters = useCallback(() => onClearFiltersAndReload(), [onClearFiltersAndReload]);

    const handleCardClick = (status: 'Active' | 'Inactive' | 'All') => {
        handleSetTableData({ query: '', pageIndex: 1 });
        if (status === 'All') { setActiveFilters({}); }
        else { setActiveFilters({ status: [status] }); }
    };

    const openAddDrawer = () => { formMethods.reset({ name: "", category_ids: [], status: 'Active' }); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => { setIsAddDrawerOpen(false); };
    const onAddUnitSubmit = async (data: UnitFormData) => { setIsSubmitting(true); try { await dispatch(addUnitAction({ name: data.name, category_id: data.category_ids, status: data.status })).unwrap(); toast.push(<Notification title="Unit Added" type="success">{`Unit "${data.name}" was successfully added.`}</Notification>); closeAddDrawer(); dispatch(getUnitAction()); } catch (error: any) { toast.push(<Notification title="Failed to Add Unit" type="danger">{error.message || "An unexpected error occurred."}</Notification>); } finally { setIsSubmitting(false); } };
    const openEditDrawer = (unit: UnitItem) => { setEditingUnit(unit); formMethods.reset({ name: unit.name, category_ids: unit.categories.map(c => c.id), status: unit.status || 'Active' }); setIsEditDrawerOpen(true); };
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingUnit(null); };
    const onEditUnitSubmit = async (data: UnitFormData) => { if (!editingUnit?.id) return; setIsSubmitting(true); try { await dispatch(editUnitAction({ id: editingUnit.id, name: data.name, category_id: data.category_ids, status: data.status })).unwrap(); toast.push(<Notification title="Unit Updated" type="success">{`"${data.name}" was successfully updated.`}</Notification>); closeEditDrawer(); dispatch(getUnitAction()); } catch (error: any) { toast.push(<Notification title="Failed to Update Unit" type="danger">{error.message || "An unexpected error occurred."}</Notification>); } finally { setIsSubmitting(false); } };
    
    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `units_export_${new Date().toISOString().split('T')[0]}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: "Units", file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportToCsvUnit(fileName, allFilteredAndSortedData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) {
            toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>);
        } finally { setIsSubmittingExportReason(false); }
    };

    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex items-center gap-2 p-2";

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h3 className="mb-4 lg:mb-0">Units</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} className="w-full sm:w-auto mt-2 sm:mt-0">Add Unit</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto mb-4 gap-4">
                        <Tooltip title="Click to show all units"><div onClick={() => handleCardClick('All')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"><TbFile size={20} /></div><div><h6 className="text-sm">{unitData.length}</h6><span className="text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show active units"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"><TbFileCheck size={20} /></div><div><h6 className="text-sm">{unitData.length > 0 && unitData.filter(d => d.status === 'Active').length}</h6><span className="text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show inactive units"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100"><TbFileX size={20} /></div><div><h6 className="text-sm">{unitData.length > 0 && unitData.filter(d => d.status === 'Inactive').length}</h6><span className="text-xs">Inactive</span></div></Card></div></Tooltip>
                    </div>
                    <div className="mb-4">
                        <UnitTableTools
                            onSearchChange={handleSearchChange}
                            onApplyFilters={handleApplyFilters}
                            onClearFilters={onClearFiltersAndReload}
                            onExport={handleOpenExportReasonModal}
                            activeFilters={activeFilters}
                            activeFilterCount={activeFilterCount}
                            unitNameOptions={unitNameOptionsForFilter}
                            categoryOptions={categoryOptionsForSelect}
                            columns={columns}
                            filteredColumns={filteredColumns}
                            setFilteredColumns={setFilteredColumns}
                            searchInputValue={tableData?.query}
                        />
                    </div>
                    <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} categoryOptions={categoryOptionsForSelect} />
                    {(activeFilterCount > 0 || tableData.query) && <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching unit(s).</div>}
                    <div className="flex-grow overflow-auto">
                        <DataTable
                            columns={filteredColumns}
                            data={pageData}
                            noData={pageData.length <= 0}
                            loading={masterLoadingStatus === "loading" || isSubmitting}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectPageSizeChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <Drawer title={isEditDrawerOpen ? "Edit Unit" : "Add Unit"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} onRequestClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} width={480} bodyClass="relative" footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form={isEditDrawerOpen ? "editUnitForm" : "addUnitForm"} type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (isEditDrawerOpen ? "Saving..." : "Adding...") : "Save"}</Button></div>}>
                <Form id={isEditDrawerOpen ? "editUnitForm" : "addUnitForm"} onSubmit={formMethods.handleSubmit(isEditDrawerOpen ? onEditUnitSubmit : onAddUnitSubmit)} className="flex flex-col gap-4">
                    <FormItem label={<div>Unit Name <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Unit Name" />)} /></FormItem>
                    <FormItem label={<div>Category <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.category_ids} errorMessage={formMethods.formState.errors.category_ids?.message}><Controller name="category_ids" control={formMethods.control} render={({ field }) => (<Select isMulti placeholder="Select categories..." options={categoryOptionsForSelect} value={categoryOptionsForSelect.filter(o => field.value?.includes(o.value as number))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label={<div>Status <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value) || null} onChange={(o) => field.onChange(o ? o.value : "")} />)} /></FormItem>
                </Form>
                {isEditDrawerOpen && editingUnit && (<div className="absolute bottom-4 right-4 left-4">
                    <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                        <div><b className="font-semibold text-gray-900 dark:text-gray-100">Latest Update:</b><br />
                            <p className="font-semibold">{editingUnit.updated_by_user?.name || "N/A"}</p>
                            <p>{editingUnit.updated_by_user?.roles[0]?.display_name || "N/A"}</p>
                        </div>
                        <div className="text-right">
                            <b className="font-semibold text-gray-900 dark:text-gray-100"></b><br />
                            <span className="font-semibold">Created:</span> <span>{editingUnit.created_at ? new Date(editingUnit.created_at).toLocaleString() : "N/A"}</span><br /><span className="font-semibold">Updated:</span> <span>{editingUnit.updated_at ? new Date(editingUnit.updated_at).toLocaleString() : "N/A"}</span></div></div></div>)}
            </Drawer>
            
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem>
                </Form>
            </ConfirmDialog>
            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={imageToView} alt="User Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
        </>
    );
};

export default Units;