// src/views/your-path/BugReportListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // Uncomment if navigation is used
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import classNames from 'classnames'; // Changed from '@/components/ui/utils/classNames' - ensure this is correct

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
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
// Corrected Textarea import if it's from @/components/ui
// If Textarea is from a different path, adjust accordingly.
// For example, if it's a custom component:
// import Textarea from '@/components/ui/Textarea'; // Assuming it's here
// Or if it's the one you used previously:
 import Textarea from '@/views/ui-components/forms/Input/Textarea'; // This path seems unusual for a core UI component
// For this example, I'll assume Textarea is part of '@/components/ui' like Input
import { Drawer, Form, FormItem, Input } from '@/components/ui';


// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbFilter, TbPlus, TbCloudUpload,
    TbUserCircle, TbBug, TbFileDescription, TbCalendar, TbPaperclip,
    TbMail, TbPhone
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Define BugReportItem Type ---
export type BugStatusType = 'new' | 'investigating' | 'confirmed' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
export type BugReportItem = {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    reportedBy?: string;
    date: string; // YYYY-MM-DD
    status: BugStatusType;
    reportDescription: string;
    attachmentUrl?: string;
};

// --- Constants for Status ---
const BUG_STATUS_OPTIONS: { value: BugStatusType, label: string }[] = [
    { value: 'new', label: 'New' }, { value: 'investigating', label: 'Investigating' },
    { value: 'confirmed', label: 'Confirmed' }, { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' },
    { value: 'wont_fix', label: "Won't Fix" },
];
const bugStatusValues = BUG_STATUS_OPTIONS.map(s => s.value) as [BugStatusType, ...BugStatusType[]];
const BUG_STATUS_COLORS: Record<BugStatusType, string> = { /* ... colors from previous example ... */
    new: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    investigating: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100',
    confirmed: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100',
    in_progress: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
    resolved: 'bg-lime-100 text-lime-600 dark:bg-lime-500/20 dark:text-lime-100',
    closed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    wont_fix: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
};

// --- Zod Schema ---
const bugReportFormSchema = z.object({ /* ... schema from previous example ... */
    name: z.string().min(1, 'Reporter name is required.').max(100),
    email: z.string().email('Invalid email format.').min(1, "Email is required."),
    phone: z.string().max(30).optional().or(z.literal('')),
    reportedBy: z.string().max(100).optional().or(z.literal('')),
    date: z.string().min(1, 'Date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    status: z.enum(bugStatusValues, { errorMap: () => ({ message: 'Please select a status.'})}),
    reportDescription: z.string().min(10, 'Report description must be at least 10 characters.').max(5000),
    attachmentUrl: z.string().url('Invalid URL for attachment.').optional().or(z.literal('')),
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;

const filterFormSchema = z.object({ // Zod schema for filter form
    filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterReportedBy: z.string().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- Initial Dummy Data ---
const initialDummyBugReports: BugReportItem[] = [ /* ... data from previous example ... */
    { id: 'BUG001', name: 'Alice C.', email: 'alice@example.com', phone: '555-1234', reportedBy: 'SupportTeam', date: '2024-07-29', status: 'new', reportDescription: 'Login button not working on Safari.', attachmentUrl: 'https://example.com/screenshot1.png' },
    { id: 'BUG002', name: 'Bob U.', email: 'bob@example.net', date: '2024-07-28', status: 'investigating', reportDescription: 'Dashboard calculation error for specific user group.' },
    { id: 'BUG003', name: 'Charlie D.', email: 'charlie.dev@internal.co', reportedBy: 'Charlie D.', date: '2024-07-27', status: 'confirmed', reportDescription: 'API endpoint /data returns 500 internal server error.' },
];

// --- CSV Exporter ---
const CSV_HEADERS_BUG = ['ID', 'Name', 'Email', 'Phone', 'Reported By', 'Date', 'Status', 'Description', 'Attachment URL'];
const CSV_KEYS_BUG: (keyof BugReportItem)[] = ['id', 'name', 'email', 'phone', 'reportedBy', 'date', 'status', 'reportDescription', 'attachmentUrl'];
function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) { /* ... from previous example ... */
     if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>);
        return false;
    }
    const separator = ',';
    const csvContent =
        CSV_HEADERS_BUG.join(separator) + '\n' +
        rows.map(row => CSV_KEYS_BUG.map(k => {
            let cell: any = row[k];
            if (cell === null || cell === undefined) cell = '';
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
        }).join(separator)).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>);
    return false;
}

// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit Report"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-300')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete Report"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-300')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- Search and TableTools ---
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Search reports..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
ItemSearch.displayName = 'ItemSearch';

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }
const ItemTableTools = ({ onSearchChange, onFilter, onExport }: ItemTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- Main Component: BugReportListing ---
const BugReportListing = () => {
    const [bugReportsData, setBugReportsData] = useState<BugReportItem[]>(initialDummyBugReports);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);

    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '',
    });
    const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

    const formMethods = useForm<BugReportFormData>({
        resolver: zodResolver(bugReportFormSchema),
        defaultValues: {
            name: '', email: '', phone: '', reportedBy: '', date: new Date().toISOString().split('T')[0],
            status: 'new', reportDescription: '', attachmentUrl: '',
        },
        mode: 'onChange',
    });

    const filterFormMethods = useForm<FilterFormData>({ // For the filter drawer form
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    });

    // --- CRUD Handlers ---
    const openAddDrawer = useCallback(() => { formMethods.reset(); setIsAddDrawerOpen(true); }, [formMethods]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
    const openEditDrawer = useCallback((item: BugReportItem) => { setEditingItem(item); formMethods.reset(item); setIsEditDrawerOpen(true); }, [formMethods]);
    const closeEditDrawer = useCallback(() => { setIsEditDrawerOpen(false); setEditingItem(null); }, []);

    const onSubmit = useCallback(async (data: BugReportFormData, addAnother?: boolean) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            if (editingItem) {
                const updatedItem: BugReportItem = { ...data, id: editingItem.id };
                setBugReportsData(prev => prev.map(br => br.id === updatedItem.id ? updatedItem : br));
                toast.push(<Notification title="Bug Report Updated" type="success" duration={2000} />);
                closeEditDrawer();
            } else {
                const newItem: BugReportItem = { ...data, id: `BUG${Date.now()}` };
                setBugReportsData(prev => [newItem, ...prev]);
                toast.push(<Notification title="Bug Report Added" type="success" duration={2000} />);
                if (addAnother) {
                    formMethods.reset({
                        name: '', email: '', phone: '', reportedBy: '', date: new Date().toISOString().split('T')[0],
                        status: 'new', reportDescription: '', attachmentUrl: '',
                    });
                } else {
                    closeAddDrawer();
                }
            }
        } catch (e: any) { toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" duration={3000}>{e.message}</Notification>); }
        finally { setIsSubmitting(false); setMasterLoadingStatus('idle'); }
    }, [editingItem, formMethods, closeAddDrawer, closeEditDrawer]);

    const handleDeleteClick = useCallback((item: BugReportItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            setBugReportsData(prev => prev.filter(br => br.id !== itemToDelete!.id));
            toast.push(<Notification title="Bug Report Deleted" type="success" duration={2000}>{`Report by "${itemToDelete.name}" deleted.`}</Notification>);
            setSelectedItems(prev => prev.filter(br => br.id !== itemToDelete!.id));
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null); }
    }, [itemToDelete]);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) {
             toast.push(<Notification title="No Selection" type="info" duration={2000}>Please select reports to delete.</Notification>);
            return;
        }
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setBugReportsData(prev => prev.filter(br => !idsToDelete.includes(br.id)));
            toast.push(<Notification title="Reports Deleted" type="success" duration={2000}>{selectedItems.length} report(s) deleted.</Notification>);
            setSelectedItems([]);
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); }
    }, [selectedItems]);

    // --- Filter Handlers ---
    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
        setFilterCriteria(data);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        setIsFilterDrawerOpen(false);
    }, []);
    const onClearFilters = useCallback(() => {
        const defaultFilters = filterFormSchema.parse({});
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
    }, [filterFormMethods]);

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }));
    }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => {
        handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
        setSelectedItems([]);
    }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => {
        handleSetTableData({ sort: sort, pageIndex: 1 });
    }, [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: BugReportItem) => {
        setSelectedItems((prev) => {
            if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
            return prev.filter((item) => item.id !== row.id);
        });
    }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<BugReportItem>[]) => {
        const currentPageRowOriginals = currentRows.map((r) => r.original);
        if (checked) {
            setSelectedItems((prevSelected) => {
                const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
                const newRowsToAdd = currentPageRowOriginals.filter(r => !prevSelectedIds.has(r.id));
                return [...prevSelected, ...newRowsToAdd];
            });
        } else {
            const currentPageRowIds = new Set(currentPageRowOriginals.map((r) => r.id));
            setSelectedItems((prevSelected) => prevSelected.filter((item) => !currentPageRowIds.has(item.id)));
        }
    }, []);

    // --- Data Processing (Memoized) ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: BugReportItem[] = cloneDeep(bugReportsData);
        if (filterCriteria.filterStatus?.length) {
            const statusValues = filterCriteria.filterStatus.map(s => s.value);
            processedData = processedData.filter(item => statusValues.includes(item.status));
        }
        if (filterCriteria.filterReportedBy && filterCriteria.filterReportedBy.trim() !== '') {
             processedData = processedData.filter(item => item.reportedBy?.toLowerCase().includes(filterCriteria.filterReportedBy!.toLowerCase() || ''));
        }
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                String(item.id).toLowerCase().includes(query) || item.name.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query) || (item.phone && item.phone.toLowerCase().includes(query)) ||
                (item.reportedBy && item.reportedBy.toLowerCase().includes(query)) ||
                item.status.toLowerCase().includes(query) || item.reportDescription.toLowerCase().includes(query)
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
             processedData.sort((a, b) => {
                const aVal = a[key as keyof BugReportItem]; const bVal = b[key as keyof BugReportItem];
                if (key === 'date') { return order === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); }
                const aStr = String(aVal ?? '').toLowerCase(); const bStr = String(bVal ?? '').toLowerCase();
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }
        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [bugReportsData, tableData, filterCriteria]);

    const handleExportData = useCallback(() => {
        const success = exportBugReportsToCsv('bug_reports_export.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported.</Notification>);
    }, [allFilteredAndSortedData]);

    // --- Table Column Definitions ---
    const columns: ColumnDef<BugReportItem>[] = useMemo(
        () => [
            { header: 'Status', accessorKey: 'status', size: 130, enableSorting: true, cell: props => <Tag className={classNames('capitalize whitespace-nowrap', BUG_STATUS_COLORS[props.getValue<BugStatusType>()])}>{BUG_STATUS_OPTIONS.find(o => o.value === props.getValue())?.label}</Tag> },
            {
                header: 'Reporter Info', id: 'reporter', size: 220, enableSorting: true, // Sort by name
                accessorFn: row => row.name, // For sorting by name
                cell: props => (
                    <div className="flex items-center">
                        <Avatar size={32} shape="circle" icon={<TbUserCircle />} />
                        <div className="ml-2 rtl:mr-2">
                            <span className="font-semibold block">{props.row.original.name}</span>
                            <span className="text-xs text-gray-500">{props.row.original.email}</span>
                        </div>
                    </div>
                )
            },
            { header: 'Phone', accessorKey: 'phone', size: 140, enableSorting: false, cell: props => props.getValue() || '-' },
            { header: 'Logged By', accessorKey: 'reportedBy', size: 120, enableSorting: true, cell: props => props.getValue() || '-' },
            { header: 'Date', accessorKey: 'date', size: 120, enableSorting: true, cell: props => new Date(props.getValue() as string).toLocaleDateString() },
            {
                header: 'Actions', id: 'actions', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100,
                cell: props => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
            },
        ],
        [openEditDrawer, handleDeleteClick],
    );

    // --- Render Form for Drawer ---
    const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormItem label="Reporter Name" invalid={!!currentFormMethods.formState.errors.name} errorMessage={currentFormMethods.formState.errors.name?.message}>
                <Controller name="name" control={currentFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbUserCircle/>} placeholder="Full Name" />} />
            </FormItem>
            <FormItem label="Reporter Email" invalid={!!currentFormMethods.formState.errors.email} errorMessage={currentFormMethods.formState.errors.email?.message}>
                <Controller name="email" control={currentFormMethods.control} render={({ field }) => <Input {...field} type="email" prefix={<TbMail/>} placeholder="name@example.com" />} />
            </FormItem>
            <FormItem label="Mobile No. (Optional)" invalid={!!currentFormMethods.formState.errors.phone} errorMessage={currentFormMethods.formState.errors.phone?.message}>
                <Controller name="phone" control={currentFormMethods.control} render={({ field }) => <Input {...field} type="tel" prefix={<TbPhone/>} placeholder="+XX-XXXXXXXXXX" />} />
            </FormItem>
            <FormItem label="Logged By (Internal User, Optional)" invalid={!!currentFormMethods.formState.errors.reportedBy} errorMessage={currentFormMethods.formState.errors.reportedBy?.message}>
                <Controller name="reportedBy" control={currentFormMethods.control} render={({ field }) => <Input {...field} placeholder="Your Username / ID" />} />
            </FormItem>
            <FormItem label="Date Reported" invalid={!!currentFormMethods.formState.errors.date} errorMessage={currentFormMethods.formState.errors.date?.message}>
                <Controller name="date" control={currentFormMethods.control} render={({ field }) => <Input {...field} type="date" prefix={<TbCalendar />} />} />
            </FormItem>
            <FormItem label="Status" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}>
                <Controller name="status" control={currentFormMethods.control} render={({ field }) => (
                    <Select placeholder="Select status" options={BUG_STATUS_OPTIONS} value={BUG_STATUS_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="Report / Description" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.reportDescription} errorMessage={currentFormMethods.formState.errors.reportDescription?.message}>
                <Controller name="reportDescription" control={currentFormMethods.control} render={({ field }) => <Textarea {...field} rows={5} placeholder="Please describe the bug in detail, including steps to reproduce..." />} />
            </FormItem>
            <FormItem label="Attachment URL (Optional)" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.attachmentUrl} errorMessage={currentFormMethods.formState.errors.attachmentUrl?.message}>
                <Controller name="attachmentUrl" control={currentFormMethods.control} render={({ field }) => <Input {...field} type="url" prefix={<TbPaperclip/>} placeholder="https://example.com/path/to/attachment.png" />} />
                {/* For actual file upload, replace Input with a FileUpload component */}
            </FormItem>
        </div>
    );

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-4 sm:mb-0 flex items-center gap-2"><TbBug /> Bug Report System</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Report New Bug</Button>
                    </div>
                    <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4">
                        <DataTable
                            columns={columns}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            selectable
                            checkboxChecked={(row: BugReportItem) => selectedItems.some(selected => selected.id === row.id)}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onCheckBoxChange={handleRowSelect}
                            onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                hidden={selectedItems.length === 0}
            >
                 <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span>Report{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>

            <Drawer
                title={editingItem ? "Edit Bug Report" : "Report New Bug"}
                isOpen={isAddDrawerOpen || isEditDrawerOpen}
                onClose={editingItem ? closeEditDrawer : closeAddDrawer}
                onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
                width={700}
                footer={
                    <div className="flex justify-between w-full">
                        {!editingItem && (
                            <Button size="sm" variant="outline" type="button" onClick={() => formMethods.handleSubmit((data) => onSubmit(data, true))()} loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                                Save & Report Another
                            </Button>
                        )}
                        <div className={editingItem || !isAddDrawerOpen ? "w-full text-right" : ""}>
                            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="bugReportForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                                {isSubmitting ? (editingItem ? 'Saving...' : 'Submitting...') : (editingItem ? 'Save Changes' : 'Submit Report')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <Form id="bugReportForm" onSubmit={formMethods.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col gap-4"> {/* Added second arg for addAnother flag */}
                    {renderDrawerForm(formMethods)}
                </Form>
            </Drawer>

            <Drawer
                title="Filter Bug Reports"
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onRequestClose={() => setIsFilterDrawerOpen(false)}
                footer={
                     <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={() => setIsFilterDrawerOpen(false)} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="filterBugForm" type="submit">Apply Filters</Button>
                        </div>
                    </div>
                }
            >
                <Form id="filterBugForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Status">
                        <Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (
                            <Select isMulti placeholder="Select status(es)..." options={BUG_STATUS_OPTIONS}
                                    value={field.value || []} onChange={val => field.onChange(val || [])} />
                        )} />
                    </FormItem>
                    <FormItem label="Filter by Logged By (Internal User)">
                        <Controller name="filterReportedBy" control={filterFormMethods.control} render={({ field }) => (
                            <Input {...field} placeholder="Enter username or ID" />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Bug Report"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} // Added for consistency
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}    // Added for consistency
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
            >
                <p>Are you sure you want to delete the bug report by "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

export default BugReportListing;