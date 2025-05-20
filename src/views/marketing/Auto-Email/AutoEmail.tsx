// src/views/your-path/AutoEmailListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import classNames from 'classnames';

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import Select from '@/components/ui/Select';
import Tag from '@/components/ui/Tag';
import { Drawer, Form, FormItem, Input } from '@/components/ui';

// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbFilter, TbPlus, TbCloudUpload,
    TbMailForward, TbUserCircle, TbSwitchHorizontal // Icons for Auto Email
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
// Redux (Optional)
// import { useAppDispatch, useAppSelector } from '@/reduxtool/store';
// import { getAutoEmailsAction, addAutoEmailAction, ... } from '@/reduxtool/autoEmail/middleware';
// import { autoEmailSelector } from '@/reduxtool/autoEmail/autoEmailSlice';


// --- Define Item Type & Constants ---
export type AutoEmailStatus = 'active' | 'inactive' | 'draft';
export type AutoEmailItem = {
    id: string | number;
    emailType: string; // e.g., "Welcome Email", "Password Reset", "Weekly Digest"
    userName: string;  // User this email is configured for or by (can be a system user name too)
    status: AutoEmailStatus;
    // templateId?: string; // Optional, if you link to specific templates
    // templateName?: string; // Optional
    // recipient?: string; // Optional, e.g., "New Users", "Subscribers Group A"
    // createdDate?: string; // ISO String
};

const AUTO_EMAIL_STATUS_OPTIONS: { value: AutoEmailStatus, label: string }[] = [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' },
];
const autoEmailStatusValues = AUTO_EMAIL_STATUS_OPTIONS.map(s => s.value) as [AutoEmailStatus, ...AutoEmailStatus[]];

const autoEmailStatusColor: Record<AutoEmailStatus, string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    draft: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
};

// Example options for Email Type dropdown in filter/add/edit (can be fetched or predefined)
const EMAIL_TYPE_FILTER_OPTIONS = [
    { value: 'Welcome Email', label: 'Welcome Email' },
    { value: 'Password Reset', label: 'Password Reset' },
    { value: 'Weekly Digest', label: 'Weekly Digest' },
    { value: 'Order Confirmation', label: 'Order Confirmation' },
];


// --- Zod Schema for Add/Edit Form ---
const autoEmailFormSchema = z.object({
    emailType: z.string().min(1, 'Email Type is required.').max(100, "Email Type too long."),
    userName: z.string().min(1, 'User Name is required.').max(100, "User Name too long."),
    status: z.enum(autoEmailStatusValues, { errorMap: () => ({ message: 'Please select a status.'})}),
});
type AutoEmailFormData = z.infer<typeof autoEmailFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterEmailTypes: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterUserNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // For multi-select filter
    filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Initial Dummy Data ---
const initialDummyAutoEmails: AutoEmailItem[] = [
    { id: 'AE001', emailType: 'Welcome Email', userName: 'New Users Automation', status: 'active' },
    { id: 'AE002', emailType: 'Password Reset', userName: 'System Security', status: 'active' },
    { id: 'AE003', emailType: 'Weekly Digest', userName: 'Marketing Team', status: 'draft' },
    { id: 'AE004', emailType: 'Order Confirmation', userName: 'E-commerce System', status: 'inactive' },
];

// --- CSV Exporter ---
const CSV_HEADERS_AE = ['ID', 'Email Type', 'User Name', 'Status'];
const CSV_KEYS_AE: (keyof AutoEmailItem)[] = ['id', 'emailType', 'userName', 'status'];

function exportAutoEmailsToCsv(filename: string, rows: AutoEmailItem[]) {
    if (!rows || !rows.length) { /* ... no data toast ... */ return false; }
    const preparedRows = rows.map(row => ({
        ...row,
        status: AUTO_EMAIL_STATUS_OPTIONS.find(s => s.value === row.status)?.label || row.status,
    }));
    // ... (Standard exportToCsv logic using preparedRows, CSV_HEADERS_AE, CSV_KEYS_AE for relevant keys)
    const separator = ',';
    const csvContent =
        CSV_HEADERS_AE.join(separator) + '\n' +
        preparedRows.map((row: any) => CSV_KEYS_AE.map(k => {
            let cell: any = row[k];
             if (k === 'status') cell = AUTO_EMAIL_STATUS_OPTIONS.find(s=>s.value === row.status)?.label || row.status; // Ensure label is used

            if (cell === null || cell === undefined) cell = '';
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
        }).join(separator)).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { /* ... download logic ... */
        const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}


// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onDelete, onChangeStatus }: { onEdit: () => void; onDelete: () => void; onChangeStatus: () => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip title="Edit Auto Email"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Change Status"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400')} role="button" onClick={onChangeStatus}><TbSwitchHorizontal /></div></Tooltip>
            <Tooltip title="Delete Auto Email"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- AutoEmailsSearch & AutoEmailsTableTools (Similar to Units) ---
type AutoEmailsSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; }
const AutoEmailsSearch = React.forwardRef<HTMLInputElement, AutoEmailsSearchProps>(
    ({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Search auto emails..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />)
);
AutoEmailsSearch.displayName = 'AutoEmailsSearch';

type AutoEmailsTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }
const AutoEmailsTableTools = ({ onSearchChange, onFilter, onExport }: AutoEmailsTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><AutoEmailsSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- AutoEmailsTable (Similar to UnitsTable) ---
type AutoEmailsTableProps = { /* ... Same props as UnitsTable, but with AutoEmailItem type ... */
    columns: ColumnDef<AutoEmailItem>[]; data: AutoEmailItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: AutoEmailItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: AutoEmailItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<AutoEmailItem>[]) => void;
};
const AutoEmailsTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: AutoEmailsTableProps) => ( /* ... DataTable setup ... */
    <DataTable
        selectable columns={columns} data={data} loading={loading} pagingData={pagingData}
        checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
        onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
        onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
        noData={!loading && data.length === 0}
    />
);


// --- AutoEmailsSelectedFooter (Similar to UnitsSelectedFooter) ---
type AutoEmailsSelectedFooterProps = { selectedItems: AutoEmailItem[]; onDeleteSelected: () => void; };
const AutoEmailsSelectedFooter = ({ selectedItems, onDeleteSelected }: AutoEmailsSelectedFooterProps) => { /* ... Same as UnitsSelectedFooter, text changed to "Auto Email(s)" ... */
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
        <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
            <div className="flex items-center justify-between w-full px-4 sm:px-8">
                <span className="flex items-center gap-2">
                    <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                    <span className="font-semibold"> {selectedItems.length} Auto Email{selectedItems.length > 1 ? 's' : ''} selected </span>
                </span>
                <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={()=>setDeleteConfirmOpen(true)}>Delete Selected</Button>
            </div>
        </StickyFooter>
        <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Auto Email(s)`}
            onClose={()=>setDeleteConfirmOpen(false)} onRequestClose={()=>setDeleteConfirmOpen(false)}
            onCancel={()=>setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false);}}
        >
            <p>Are you sure you want to delete the selected auto email(s)?</p>
        </ConfirmDialog>
        </>
    );
};


// --- Main AutoEmailListing Component ---
const AutoEmailListing = () => {
    const [autoEmailsData, setAutoEmailsData] = useState<AutoEmailItem[]>(initialDummyAutoEmails);
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AutoEmailItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<AutoEmailItem | null>(null);

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: 'asc', key: 'emailType' }, query: '',
    });
    const [selectedItems, setSelectedItems] = useState<AutoEmailItem[]>([]);

    const formMethods = useForm<AutoEmailFormData>({
        resolver: zodResolver(autoEmailFormSchema),
        defaultValues: { emailType: '', userName: '', status: 'draft' },
        mode: 'onChange',
    });

    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria,
    });

    // --- CRUD Handlers ---
    const openAddDrawer = useCallback(() => { formMethods.reset(); setIsAddDrawerOpen(true); }, [formMethods]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
    const openEditDrawer = useCallback((item: AutoEmailItem) => { setEditingItem(item); formMethods.reset(item); setIsEditDrawerOpen(true); }, [formMethods]);
    const closeEditDrawer = useCallback(() => { setIsEditDrawerOpen(false); setEditingItem(null); }, []);

    const onAutoEmailFormSubmit = useCallback(async (data: AutoEmailFormData) => {
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            if (editingItem) {
                const updatedItem: AutoEmailItem = { ...editingItem, ...data };
                setAutoEmailsData(prev => prev.map(ae => ae.id === updatedItem.id ? updatedItem : ae));
                toast.push(<Notification title="Auto Email Updated" type="success" />);
                closeEditDrawer();
            } else {
                const newItem: AutoEmailItem = { ...data, id: `AE${Date.now()}` };
                setAutoEmailsData(prev => [newItem, ...prev]);
                toast.push(<Notification title="Auto Email Added" type="success" />);
                closeAddDrawer();
            }
        } catch (e: any) { toast.push(<Notification title="Operation Failed" type="danger">{e.message}</Notification>); }
        finally { setIsSubmitting(false); setMasterLoadingStatus('idle'); }
    }, [editingItem, closeAddDrawer, closeEditDrawer]);

    const handleDeleteClick = useCallback((item: AutoEmailItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            setAutoEmailsData(prev => prev.filter(ae => ae.id !== itemToDelete!.id));
            toast.push(<Notification title="Auto Email Deleted" type="success">{`"${itemToDelete.emailType}" for ${itemToDelete.userName} deleted.`}</Notification>);
            setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null); }
    }, [itemToDelete]);

    const handleDeleteSelected = useCallback(async () => { /* ... */
        if (selectedItems.length === 0) { toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>); return; }
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setAutoEmailsData(prev => prev.filter(ae => !idsToDelete.includes(ae.id)));
            toast.push(<Notification title="Deletion Successful" type="success">{`${selectedItems.length} auto email(s) deleted.`}</Notification>);
            setSelectedItems([]);
        } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e.message || 'Failed to delete selected items.'}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); }
    }, [selectedItems]);

    const handleChangeStatus = useCallback(async (item: AutoEmailItem) => {
        setIsChangingStatus(true);
        const currentIdx = AUTO_EMAIL_STATUS_OPTIONS.findIndex(s => s.value === item.status);
        const nextStatus = AUTO_EMAIL_STATUS_OPTIONS[(currentIdx + 1) % AUTO_EMAIL_STATUS_OPTIONS.length].value;
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            setAutoEmailsData(prev => prev.map(ae => ae.id === item.id ? { ...ae, status: nextStatus } : ae));
            toast.push(<Notification title="Status Changed" type="success">{`Status changed to ${AUTO_EMAIL_STATUS_OPTIONS.find(s=>s.value === nextStatus)?.label}.`}</Notification>);
        } catch (e: any) { toast.push(<Notification title="Status Change Failed" type="danger">{e.message}</Notification>); }
        finally { setIsChangingStatus(false); }
    }, []);

    // --- Filter Handlers ---
    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData(prev => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
    const onClearFilters = useCallback(() => { const df = filterFormSchema.parse({}); filterFormMethods.reset(df); setFilterCriteria(df); setTableData(prev => ({ ...prev, pageIndex: 1 })); }, [filterFormMethods]);

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: AutoEmailItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<AutoEmailItem>[]) => { const cPOR = currentRows.map((r)=>r.original); if(checked){setSelectedItems(pS=>{const pSIds=new Set(pS.map(i=>i.id)); const nRTA=cPOR.filter(r=>!pSIds.has(r.id)); return [...pS, ...nRTA];})} else {const cPRIds=new Set(cPOR.map(r=>r.id)); setSelectedItems(pS=>pS.filter(i=>!cPRIds.has(i.id)));}}, []);

    // --- Data Processing (Memoized) ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: AutoEmailItem[] = cloneDeep(autoEmailsData);
        if (filterCriteria.filterEmailTypes?.length) { const v = filterCriteria.filterEmailTypes.map(et=>et.value); processedData = processedData.filter(item => v.includes(item.emailType));}
        if (filterCriteria.filterUserNames?.length) { const v = filterCriteria.filterUserNames.map(un=>un.value); processedData = processedData.filter(item => v.includes(item.userName));}
        if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map(s=>s.value); processedData = processedData.filter(item => v.includes(item.status));}

        if (tableData.query && tableData.query.trim() !== '') { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || item.emailType.toLowerCase().includes(q) || item.userName.toLowerCase().includes(q) || item.status.toLowerCase().includes(q) );}
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { processedData.sort((a,b) => { const aVal = a[key as keyof AutoEmailItem]; const bVal = b[key as keyof AutoEmailItem]; const aStr = String(aVal ?? '').toLowerCase(); const bStr = String(bVal ?? '').toLowerCase(); return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr); });}

        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [autoEmailsData, tableData, filterCriteria]);

    const handleExportData = useCallback(() => { exportAutoEmailsToCsv('auto_emails_export.csv', allFilteredAndSortedData); }, [allFilteredAndSortedData]);

    // --- Table Column Definitions ---
    const columns: ColumnDef<AutoEmailItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', size: 100, enableSorting: true },
            { header: 'Email Type', accessorKey: 'emailType', size: 250, enableSorting: true },
            { header: 'User Name', accessorKey: 'userName', size: 200, enableSorting: true, cell: props => <div className="flex items-center gap-2"><TbUserCircle className="text-xl"/> {props.getValue<string>()}</div> },
            { header: 'Status', accessorKey: 'status', size: 120, enableSorting: true, cell: props => <Tag className={classNames('capitalize whitespace-nowrap', autoEmailStatusColor[props.getValue<AutoEmailStatus>()])}>{AUTO_EMAIL_STATUS_OPTIONS.find(o=>o.value === props.getValue())?.label}</Tag> },
            {
                header: 'Actions', id: 'actions', size: 200, meta: { HeaderClass: 'text-center' },
                cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onChangeStatus={() => handleChangeStatus(props.row.original)} />,
            },
        ],
        [openEditDrawer, handleDeleteClick, handleChangeStatus],
    );

    // --- Options for Filter Dropdowns (derived from data) ---
    const emailTypeOptions = useMemo(() => {
        if (!Array.isArray(autoEmailsData)) return [];
        const uniqueTypes = new Set(autoEmailsData.map(item => item.emailType));
        return Array.from(uniqueTypes).map(type => ({ value: type, label: type }));
    }, [autoEmailsData]);

    const userNameOptions = useMemo(() => {
        if (!Array.isArray(autoEmailsData)) return [];
        const uniqueUsers = new Set(autoEmailsData.map(item => item.userName));
        return Array.from(uniqueUsers).map(user => ({ value: user, label: user }));
    }, [autoEmailsData]);


    // --- Render Form for Add/Edit Drawer ---
    const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormItem label="Email Type" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.emailType} errorMessage={currentFormMethods.formState.errors.emailType?.message}>
                <Controller name="emailType" control={currentFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbMailForward/>} placeholder="e.g., Welcome Email Series" />} />
            </FormItem>
            <FormItem label="User Name / Group" invalid={!!currentFormMethods.formState.errors.userName} errorMessage={currentFormMethods.formState.errors.userName?.message}>
                <Controller name="userName" control={currentFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbUserCircle/>} placeholder="e.g., New Customers, Marketing Team" />} />
            </FormItem>
             <FormItem label="Status" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}>
                <Controller name="status" control={currentFormMethods.control} render={({ field }) => (
                    <Select placeholder="Select Status" options={AUTO_EMAIL_STATUS_OPTIONS} value={AUTO_EMAIL_STATUS_OPTIONS.find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            {/* Add other fields like Template ID, Recipient Group selection if needed */}
        </div>
    );


    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-4 sm:mb-0 flex items-center gap-2"><TbMailForward /> Auto Email Management</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Auto Email</Button>
                    </div>
                    <AutoEmailsTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4">
                        <AutoEmailsTable
                            columns={columns} data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting || isChangingStatus}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            selectedItems={selectedItems}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
                            onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <AutoEmailsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            <Drawer
                title={editingItem ? "Edit Auto Email" : "Add New Auto Email"}
                isOpen={isAddDrawerOpen || isEditDrawerOpen}
                onClose={editingItem ? closeEditDrawer : closeAddDrawer}
                onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
                width={700}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="autoEmailForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add Auto Email')}
                        </Button>
                    </div>
                }
            >
                <Form id="autoEmailForm" onSubmit={formMethods.handleSubmit(onAutoEmailFormSubmit)} className="flex flex-col gap-4">
                    {renderDrawerForm(formMethods)}
                </Form>
            </Drawer>

            <Drawer
                title="Filter Auto Emails"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                     <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={closeFilterDrawer} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="filterAutoEmailForm" type="submit">Apply Filters</Button>
                        </div>
                    </div>
                }
            >
                <Form id="filterAutoEmailForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Email Type(s)">
                        <Controller name="filterEmailTypes" control={filterFormMethods.control} render={({ field }) => (
                            <Select isMulti placeholder="Any Email Type" options={emailTypeOptions} // Use dynamic options
                                    value={field.value || []} onChange={val => field.onChange(val || [])} />
                        )} />
                    </FormItem>
                    <FormItem label="Filter by User Name(s)">
                        <Controller name="filterUserNames" control={filterFormMethods.control} render={({ field }) => (
                            <Select isMulti placeholder="Any User Name" options={userNameOptions} // Use dynamic options
                                    value={field.value || []} onChange={val => field.onChange(val || [])} />
                        )} />
                    </FormItem>
                     <FormItem label="Filter by Status">
                        <Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (
                            <Select isMulti placeholder="Any Status" options={AUTO_EMAIL_STATUS_OPTIONS}
                                    value={field.value || []} onChange={val => field.onChange(val || [])} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Auto Email"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
            >
                <p>Are you sure you want to delete the auto email "<strong>{itemToDelete?.emailType}</strong>" for user "<strong>{itemToDelete?.userName}</strong>"?</p>
            </ConfirmDialog>
        </>
    );
};

export default AutoEmailListing;