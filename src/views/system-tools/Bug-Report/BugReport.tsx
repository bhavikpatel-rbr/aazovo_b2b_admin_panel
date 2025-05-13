// src/views/your-path/BugReportListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar' // For user icon
import Tag from '@/components/ui/Tag'
import Textarea from '@/views/ui-components/forms/Input/Textarea'
import { Drawer, Form, FormItem, Input } from '@/components/ui' // Added Textarea

// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbFilter, TbPlus, TbCloudUpload,
    TbUserCircle, TbBug, TbFileDescription, TbCalendar, TbPaperclip, // Attachment
    TbMail,
    TbPhone
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import classNames from '@/components/ui/utils/classNames'
// Redux (Optional)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getBugReportsAction, addBugReportAction, ... } from '@/reduxtool/bugReport/middleware';
// import { bugReportSelector } from '@/reduxtool/bugReport/bugReportSlice';

// --- Define BugReportItem Type ---
export type BugStatusType = 'new' | 'investigating' | 'confirmed' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
export type BugReportItem = {
    id: string | number
    name: string // Name of the person reporting
    email: string
    phone?: string
    reportedBy?: string // User ID or name of internal logger
    date: string // Store as YYYY-MM-DD string
    status: BugStatusType
    reportDescription: string // Main description of the bug
    attachmentUrl?: string // URL to the uploaded attachment
}

// --- Constants for Status ---
const BUG_STATUS_OPTIONS: { value: BugStatusType, label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'wont_fix', label: "Won't Fix" },
];
const bugStatusValues = BUG_STATUS_OPTIONS.map(s => s.value) as [BugStatusType, ...BugStatusType[]];

const BUG_STATUS_COLORS: Record<BugStatusType, string> = {
    new: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    investigating: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100',
    confirmed: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-100',
    in_progress: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
    resolved: 'bg-lime-100 text-lime-600 dark:bg-lime-500/20 dark:text-lime-100',
    closed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    wont_fix: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
};

// --- Zod Schema for Add/Edit Bug Report Form ---
const bugReportFormSchema = z.object({
    name: z.string().min(1, 'Reporter name is required.').max(100),
    email: z.string().email('Invalid email format.').min(1, "Email is required."),
    phone: z.string().max(30).optional().or(z.literal('')),
    reportedBy: z.string().max(100).optional().or(z.literal('')), // Could be a select if you have users list
    date: z.string().min(1, 'Date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    status: z.enum(bugStatusValues, { errorMap: () => ({ message: 'Please select a status.'})}),
    reportDescription: z.string().min(10, 'Report description must be at least 10 characters.').max(5000),
    attachmentUrl: z.string().url('Invalid URL for attachment.').optional().or(z.literal('')),
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;

// --- Initial Dummy Data ---
const initialDummyBugReports: BugReportItem[] = [
    { id: 'BUG001', name: 'Alice C.', email: 'alice@example.com', phone: '555-1234', reportedBy: 'SupportTeam', date: '2024-07-29', status: 'new', reportDescription: 'Login button not working on Safari.', attachmentUrl: 'https://example.com/screenshot1.png' },
    { id: 'BUG002', name: 'Bob U.', email: 'bob@example.net', date: '2024-07-28', status: 'investigating', reportDescription: 'Dashboard calculation error for specific user group.' },
    { id: 'BUG003', name: 'Charlie D.', email: 'charlie.dev@internal.co', reportedBy: 'Charlie D.', date: '2024-07-27', status: 'confirmed', reportDescription: 'API endpoint /data returns 500 internal server error.' },
];

// --- CSV Exporter ---
const CSV_HEADERS_BUG = ['ID', 'Name', 'Email', 'Phone', 'Reported By', 'Date', 'Status', 'Description', 'Attachment URL'];
const CSV_KEYS_BUG: (keyof BugReportItem)[] = ['id', 'name', 'email', 'phone', 'reportedBy', 'date', 'status', 'reportDescription', 'attachmentUrl'];

function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) {
    // ... (Standard exportToCsv logic)
     if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
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
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}

// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
    // ... (Same as Units ActionColumn)
     const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit Report"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-500')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete Report"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-500')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- Search and TableTools (Generic) ---
// ... (Can reuse ItemSearch and ItemTableTools or adapt for Bug Reports)
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Search reports (name, email, ID, description)..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
ItemSearch.displayName = 'ItemSearch';

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }
const ItemTableTools = ({ onSearchChange, onFilter, onExport }: ItemTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow">
            <ItemSearch onInputChange={onSearchChange} />
        </div>
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
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<{ filterStatus?: any[], filterReportedBy?: string }>({});

    const formMethods = useForm<BugReportFormData>({
        resolver: zodResolver(bugReportFormSchema),
        defaultValues: {
            name: '', email: '', phone: '', reportedBy: '', date: new Date().toISOString().split('T')[0],
            status: 'new', reportDescription: '', attachmentUrl: '',
        },
        mode: 'onChange',
    });

    const filterForm = useForm<typeof filterCriteria>({ defaultValues: {} });

    // --- CRUD Handlers (Similar to Units) ---
    const openAddDrawer = () => { formMethods.reset(); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => setIsAddDrawerOpen(false);

    const openEditDrawer = (item: BugReportItem) => { setEditingItem(item); formMethods.reset(item); setIsEditDrawerOpen(true); };
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); };

    const onSubmit = async (data: BugReportFormData, addAnother?: boolean) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            if (editingItem) {
                const updatedItem: BugReportItem = { ...editingItem, ...data };
                setBugReportsData(prev => prev.map(br => br.id === updatedItem.id ? updatedItem : br));
                toast.push(<Notification title="Bug Report Updated" type="success" />);
                closeEditDrawer();
            } else {
                const newItem: BugReportItem = { ...data, id: `BUG${Date.now()}` };
                setBugReportsData(prev => [newItem, ...prev]);
                toast.push(<Notification title="Bug Report Added" type="success" />);
                if (addAnother) {
                    formMethods.reset(); // Keep drawer open, reset form fields to defaults
                } else {
                    closeAddDrawer();
                }
            }
        } catch (e: any) { toast.push(<Notification title={editingItem ? "Update" : "Add" + " Failed"} type="danger">{e.message}</Notification>); }
        finally { setIsSubmitting(false); setMasterLoadingStatus('idle'); }
    };

    const handleDeleteClick = (item: BugReportItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            setBugReportsData(prev => prev.filter(br => br.id !== itemToDelete!.id));
            toast.push(<Notification title="Bug Report Deleted" type="success">{`Report by "${itemToDelete.name}" deleted.`}</Notification>);
            setSelectedItems(prev => prev.filter(br => br.id !== itemToDelete!.id));
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null); }
    };
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setBugReportsData(prev => prev.filter(br => !idsToDelete.includes(br.id)));
            toast.push(<Notification title="Reports Deleted" type="success">{selectedItems.length} report(s) deleted.</Notification>);
            setSelectedItems([]);
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); }
    };

    // --- Filter Handlers ---
    const openFilterDrawer = () => { filterForm.reset(filterCriteria); setIsFilterDrawerOpen(true); };
    const onApplyFiltersSubmit = (data: typeof filterCriteria) => {
        setFilterCriteria(data);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        setIsFilterDrawerOpen(false);
    };
    const onClearFilters = () => { filterForm.reset({}); setFilterCriteria({}); setTableData(prev => ({ ...prev, pageIndex: 1 })); };

    // --- Data Processing (Memoized) ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: BugReportItem[] = cloneDeep(bugReportsData);
        // Apply Filters
        if (filterCriteria.filterStatus?.length) processedData = processedData.filter(item => filterCriteria.filterStatus!.some((fs: any) => fs.value === item.status));
        if (filterCriteria.filterReportedBy && filterCriteria.filterReportedBy.trim() !== '') {
             processedData = processedData.filter(item => item.reportedBy?.toLowerCase().includes(filterCriteria.filterReportedBy!.toLowerCase() || ''));
        }
        // Apply Search Query
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                String(item.id).toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query) ||
                (item.phone && item.phone.toLowerCase().includes(query)) ||
                (item.reportedBy && item.reportedBy.toLowerCase().includes(query)) ||
                item.status.toLowerCase().includes(query) ||
                item.reportDescription.toLowerCase().includes(query)
            );
        }
        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
             processedData.sort((a, b) => {
                const aVal = a[key as keyof BugReportItem];
                const bVal = b[key as keyof BugReportItem];
                if (key === 'date') {
                    return order === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
                }
                const aStr = String(aVal ?? '').toLowerCase();
                const bStr = String(bVal ?? '').toLowerCase();
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }

        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [bugReportsData, tableData, filterCriteria]);


    const handleExportData = () => {
        const success = exportBugReportsToCsv('bug_reports.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    // ... (handlePaginationChange, handleSelectChange, handleSort, handleSearchChange, handleRowSelect, handleAllRowSelect are standard)

    // --- Column Definitions ---
    const columns: ColumnDef<BugReportItem>[] = useMemo(
        () => [
            { header: 'Status', accessorKey: 'status', size: 130, cell: props => <Tag className={classNames('capitalize', BUG_STATUS_COLORS[props.getValue<BugStatusType>()])}>{BUG_STATUS_OPTIONS.find(o => o.value === props.getValue())?.label}</Tag> },
            {
                header: 'Reporter Info', id: 'reporter', size: 220,
                cell: props => (
                    <div className="flex items-center">
                        <Avatar size={32} shape="circle" icon={<TbUserCircle />} />
                        <div className="ml-2">
                            <span className="font-semibold block">{props.row.original.name}</span>
                            <span className="text-xs text-gray-500">{props.row.original.email}</span>
                        </div>
                    </div>
                )
            },
            { header: 'Phone', accessorKey: 'phone', size: 140, cell: props => props.getValue() || '-' },
            { header: 'Logged By', accessorKey: 'reportedBy', size: 120, cell: props => props.getValue() || '-' },
            { header: 'Date', accessorKey: 'date', size: 120, cell: props => new Date(props.getValue() as string).toLocaleDateString() },
            {
                header: 'Actions', id: 'actions', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100,
                cell: props => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
            },
        ],
        [],
    );

    // --- Render Form for Drawer ---
    const renderDrawerForm = (formInstance: typeof formMethods) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormItem label="Reporter Name" invalid={!!formInstance.formState.errors.name} errorMessage={formInstance.formState.errors.name?.message}>
                <Controller name="name" control={formInstance.control} render={({ field }) => <Input {...field} prefix={<TbUserCircle/>} placeholder="Full Name" />} />
            </FormItem>
            <FormItem label="Reporter Email" invalid={!!formInstance.formState.errors.email} errorMessage={formInstance.formState.errors.email?.message}>
                <Controller name="email" control={formInstance.control} render={({ field }) => <Input {...field} type="email" prefix={<TbMail/>} placeholder="name@example.com" />} />
            </FormItem>
            <FormItem label="Mobile No. (Optional)" invalid={!!formInstance.formState.errors.phone} errorMessage={formInstance.formState.errors.phone?.message}>
                <Controller name="phone" control={formInstance.control} render={({ field }) => <Input {...field} type="tel" prefix={<TbPhone/>} placeholder="+XX-XXXXXXXXXX" />} />
            </FormItem>
            <FormItem label="Logged By (Internal User, Optional)" invalid={!!formInstance.formState.errors.reportedBy} errorMessage={formInstance.formState.errors.reportedBy?.message}>
                <Controller name="reportedBy" control={formInstance.control} render={({ field }) => <Input {...field} placeholder="Your Username / ID" />} />
            </FormItem>
            <FormItem label="Date Reported" invalid={!!formInstance.formState.errors.date} errorMessage={formInstance.formState.errors.date?.message}>
                <Controller name="date" control={formInstance.control} render={({ field }) => <Input {...field} type="date" />} />
            </FormItem>
            <FormItem label="Status" invalid={!!formInstance.formState.errors.status} errorMessage={formInstance.formState.errors.status?.message}>
                <Controller name="status" control={formInstance.control} render={({ field }) => (
                    <Select placeholder="Select status" options={BUG_STATUS_OPTIONS} value={BUG_STATUS_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="Report / Description" className="md:col-span-2" invalid={!!formInstance.formState.errors.reportDescription} errorMessage={formInstance.formState.errors.reportDescription?.message}>
                <Controller name="reportDescription" control={formInstance.control} render={({ field }) => <Textarea {...field} rows={5} placeholder="Please describe the bug in detail, including steps to reproduce..." />} />
            </FormItem>
            <FormItem label="Attachment URL (Optional)" className="md:col-span-2" invalid={!!formInstance.formState.errors.attachmentUrl} errorMessage={formInstance.formState.errors.attachmentUrl?.message}>
                <Controller name="attachmentUrl" control={formInstance.control} render={({ field }) => <Input {...field} type="url" prefix={<TbPaperclip/>} placeholder="https://example.com/path/to/attachment.png" />} />
                {/* For actual file upload, this would be a FileUpload component */}
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
                    <ItemTableTools  onFilter={openFilterDrawer} onExport={handleExportData} onSearchChange={function (query: string): void {
                        throw new Error('Function not implemented.')
                    } } />
                    <div className="mt-4">
                        <DataTable /* Props similar to Units */
                            columns={columns}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            selectable
                            checkboxChecked={(row: BugReportItem) => selectedItems.some(selected => selected.id === row.id)}
                            // onPaginationChange={handlePaginationChange}
                            // onSelectChange={handleSelectChange}
                            // onSort={handleSort}
                            // onCheckBoxChange={handleRowSelect}
                            // onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <StickyFooter /* Similar to Units */
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                hidden={selectedItems.length === 0}
            >
                {/* ... content similar to UnitsSelectedFooter ... */}
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

            {/* Add/Edit Drawer */}
            <Drawer
                title={editingItem ? "Edit Bug Report" : "Report New Bug"}
                isOpen={isAddDrawerOpen || isEditDrawerOpen}
                onClose={editingItem ? closeEditDrawer : closeAddDrawer}
                onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
                width={700} // Adjust width
                footer={
                    <div className="flex justify-between w-full">
                        {!editingItem && (
                            <Button size="sm" variant="outline" type="button" onClick={() => formMethods.handleSubmit((data) => onSubmit(data, true))()} loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                                Save & Report Another
                            </Button>
                        )}
                        <div className={editingItem ? "w-full text-right" : ""}>
                            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="bugReportForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                                {isSubmitting ? (editingItem ? 'Saving...' : 'Submitting...') : (editingItem ? 'Save Changes' : 'Submit Report')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <Form id="bugReportForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {renderDrawerForm(formMethods)}
                </Form>
            </Drawer>

            <Drawer /* Filter Drawer */
                title="Filter Bug Reports"
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onRequestClose={() => setIsFilterDrawerOpen(false)}
                footer={ /* ... similar to previous filter drawer footers ... */
                     <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={() => setIsFilterDrawerOpen(false)} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="filterBugForm" type="submit">Apply Filters</Button>
                        </div>
                    </div>
                }
            >
                <Form id="filterBugForm" onSubmit={filterForm.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Status">
                        <Controller name="filterStatus" control={filterForm.control} render={({ field }) => (
                            <Select isMulti placeholder="Select status(es)..." options={BUG_STATUS_OPTIONS}
                                    value={field.value || []} onChange={val => field.onChange(val || [])} />
                        )} />
                    </FormItem>
                    <FormItem label="Filter by Logged By (Internal User)">
                        <Controller name="filterReportedBy" control={filterForm.control} render={({ field }) => (
                            <Input {...field} placeholder="Enter username or ID" />
                            // Consider a Select if you have a predefined list of internal users
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog /* Single Delete */
                isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Bug Report"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
                // ... (rest of ConfirmDialog props same as before)
            >
                <p>Are you sure you want to delete the bug report by "<strong>{itemToDelete?.name}</strong>"?</p>
            </ConfirmDialog>
        </>
    );
};

export default BugReportListing;

// Helper function (if not globally available)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }