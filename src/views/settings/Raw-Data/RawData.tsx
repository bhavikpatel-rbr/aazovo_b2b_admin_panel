// src/views/your-path/LeadManagement.tsx

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
import Textarea from '@/views/ui-components/forms/Input/Textarea'
import { Drawer, Form, FormItem, Input, Tag, Dialog } from '@/components/ui' // Added Dialog for View

// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbEye, TbBan, // View, Blacklist
    TbUser, TbBuilding, TbMail, TbPhone, TbCategory, TbTag, TbStar, TbMapPin, TbFileText, TbCalendar, TbMoodCrazyHappy, // Section icons
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import classNames from '@/utils/classNames'
// Redux (Optional)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getLeadsAction, addLeadAction, ... } from '@/reduxtool/lead/middleware';
// import { leadSelector } from '@/reduxtool/lead/leadSlice';


// --- Constants for Dropdowns (Replace with actual data sources) ---
const ALL_AVAILABLE_COUNTRIES = [
    { value: 'IN', label: 'India' }, { value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' },
    { value: 'DE', label: 'Germany' }, { value: 'GB', label: 'United Kingdom' }, /* ...more */
];
const countryValues = ALL_AVAILABLE_COUNTRIES.map(c => c.value) as [string, ...string[]];

const CATEGORIES_LIST = [
    { value: 'tech', label: 'Technology' }, { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' }, { value: 'retail', label: 'Retail' }, /* ...more */
];
const categoryValues = CATEGORIES_LIST.map(c => c.value) as [string, ...string[]];

const BRANDS_LIST = [
    { value: 'brand_x', label: 'Brand X' }, { value: 'brand_y', label: 'Brand Y' },
    { value: 'brand_z', label: 'Brand Z' }, /* ...more */
];
const brandValues = BRANDS_LIST.map(b => b.value) as [string, ...string[]];

const QUALITY_LEVELS = [
    { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' },
];
const qualityValues = QUALITY_LEVELS.map(q => q.value) as [string, ...string[]];

const STATUS_OPTIONS = [
    { value: 'raw', label: 'Raw' }, { value: 'identified', label: 'Identified' },
    { value: 'verified', label: 'Verified' }, { value: 'hold', label: 'Hold' },
    { value: 'blacklist', label: 'Blacklisted' }, // Can be a status or a separate flag
];
const statusValues = STATUS_OPTIONS.map(s => s.value) as [string, ...string[]];

const statusColors: Record<string, string> = {
    raw: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    identified: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    verified: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    hold: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    blacklist: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
};


// --- Define LeadItem Type ---
export type LeadItem = {
    id: string | number
    country: string // Country code
    categoryName: string // Category key
    brandName: string // Brand key
    mobileNo: string
    email?: string
    contactName?: string
    companyName?: string
    quality: string // Quality key
    city?: string
    status: 'raw' | 'identified' | 'verified' | 'hold' | 'blacklist'
    remarks?: string
    date: string // YYYY-MM-DD
}

// --- Zod Schema for Add/Edit Form ---
const leadFormSchema = z.object({
    country: z.enum(countryValues, { errorMap: () => ({ message: 'Country is required.' })}),
    categoryName: z.enum(categoryValues, { errorMap: () => ({ message: 'Category is required.' })}),
    brandName: z.enum(brandValues, { errorMap: () => ({ message: 'Brand is required.' })}),
    mobileNo: z.string().min(1, 'Mobile No. is required.').max(20, 'Mobile No. too long.'), // Add regex for specific formats if needed
    email: z.string().email('Invalid email format.').optional().or(z.literal('')),
    contactName: z.string().max(100).optional().or(z.literal('')),
    companyName: z.string().max(150).optional().or(z.literal('')),
    quality: z.enum(qualityValues, { errorMap: () => ({ message: 'Quality is required.' })}),
    city: z.string().max(100).optional().or(z.literal('')),
    status: z.enum(statusValues, { errorMap: () => ({ message: 'Status is required.' })}),
    remarks: z.string().max(500, "Remarks too long.").optional().or(z.literal('')),
    date: z.string().min(1, 'Date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});
type LeadFormData = z.infer<typeof leadFormSchema>;

// --- Initial Dummy Data ---
const initialDummyLeads: LeadItem[] = [
    { id: 'LEAD001', country: 'IN', categoryName: 'tech', brandName: 'brand_x', mobileNo: '+919876543210', email: 'john.doe@example.com', contactName: 'John Doe', companyName: 'Tech Solutions', quality: 'high', city: 'Bangalore', status: 'verified', remarks: 'Followed up, interested.', date: '2024-07-29' },
    { id: 'LEAD002', country: 'US', categoryName: 'finance', brandName: 'brand_y', mobileNo: '+12345678901', email: 'jane.smith@example.com', contactName: 'Jane Smith', quality: 'medium', city: 'New York', status: 'identified', date: '2024-07-28' },
    { id: 'LEAD003', country: 'CA', categoryName: 'healthcare', brandName: 'brand_z', mobileNo: '+19876543210', quality: 'low', status: 'raw', date: '2024-07-27', remarks: 'Initial contact' },
];

// --- CSV Exporter ---
const CSV_HEADERS_LEAD = ['ID', 'Country', 'Category', 'Brand', 'Mobile', 'Email', 'Contact Name', 'Company', 'Quality', 'City', 'Status', 'Remarks', 'Date'];
const CSV_KEYS_LEAD: (keyof LeadItem)[] = [
    'id', 'country', 'categoryName', 'brandName', 'mobileNo', 'email', 'contactName', 'companyName',
    'quality', 'city', 'status', 'remarks', 'date'
];

function exportLeadsToCsv(filename: string, rows: LeadItem[]) {
    // ... (Standard exportToCsv logic, adjust for LeadItem if needed for display values)
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    // Optional: Map codes to labels for export if desired
    const preparedRows = rows.map(row => ({
        ...row,
        country: ALL_AVAILABLE_COUNTRIES.find(c=>c.value === row.country)?.label || row.country,
        categoryName: CATEGORIES_LIST.find(c=>c.value === row.categoryName)?.label || row.categoryName,
        brandName: BRANDS_LIST.find(b=>b.value === row.brandName)?.label || row.brandName,
        quality: QUALITY_LEVELS.find(q=>q.value === row.quality)?.label || row.quality,
        status: STATUS_OPTIONS.find(s=>s.value === row.status)?.label || row.status,
    }));

    const separator = ',';
    const csvContent =
        CSV_HEADERS_LEAD.join(separator) + '\n' +
        preparedRows.map((row: any) => CSV_KEYS_LEAD.map(k => {
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

// --- ActionColumn ---
const ActionColumn = ({ item, onEdit, onView, onDelete, onBlacklist }: {
    item: LeadItem; // Pass the whole item to decide on blacklist action
    onEdit: () => void;
    onView: () => void;
    onDelete: () => void;
    onBlacklist: () => void;
}) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip title="View Details"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-500')} role="button" onClick={onView}><TbEye /></div></Tooltip>
            <Tooltip title="Edit Lead"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-500')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            {item.status !== 'blacklist' && (
                 <Tooltip title="Blacklist Lead"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-orange-500')} role="button" onClick={onBlacklist}><TbBan /></div></Tooltip>
            )}
            <Tooltip title="Delete Lead"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-500')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- Search and TableTools (Generic) ---
// ... (ItemSearch and ItemTableTools can be reused or adapted)

// --- Main Component: LeadManagement ---
const LeadManagement = () => {
    const [leadsData, setLeadsData] = useState<LeadItem[]>(initialDummyLeads);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LeadItem | null>(null);
    const [viewingItem, setViewingItem] = useState<LeadItem | null>(null); // For View Dialog
    const [itemToDelete, setItemToDelete] = useState<LeadItem | null>(null);
    const [itemToBlacklist, setItemToBlacklist] = useState<LeadItem | null>(null);

    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBlacklisting, setIsBlacklisting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [blacklistConfirmOpen, setBlacklistConfirmOpen] = useState(false);

    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<LeadItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<{
        filterCountry?: any[], filterCategory?: any[], filterBrand?: any[], filterStatus?: any[], filterQuality?: any[]
    }>({});

    const formMethods = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: { // Sensible defaults
            country: countryValues[0] || '', categoryName: categoryValues[0] || '', brandName: brandValues[0] || '',
            mobileNo: '', quality: qualityValues[0] || '', status: statusValues[0] || '', date: new Date().toISOString().split('T')[0],
            email: '', contactName: '', companyName: '', city: '', remarks: '',
        },
        mode: 'onChange',
    });

    const filterForm = useForm<typeof filterCriteria>({ defaultValues: {} });

    // --- CRUD Handlers ---
    const openAddDrawer = () => { formMethods.reset(); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => setIsAddDrawerOpen(false);

    const openEditDrawer = (item: LeadItem) => { setEditingItem(item); formMethods.reset(item); setIsEditDrawerOpen(true); };
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); };

    const openViewDialog = (item: LeadItem) => setViewingItem(item);
    const closeViewDialog = () => setViewingItem(null);

    const onSubmit = async (data: LeadFormData, addAnother?: boolean) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            if (editingItem) {
                const updatedItem: LeadItem = { ...editingItem, ...data };
                setLeadsData(prev => prev.map(d => d.id === updatedItem.id ? updatedItem : d));
                toast.push(<Notification title="Lead Updated" type="success" />);
                closeEditDrawer();
            } else {
                const newItem: LeadItem = { ...data, id: `LEAD${Date.now()}` };
                setLeadsData(prev => [newItem, ...prev]); // Add to top for visibility
                toast.push(<Notification title="Lead Added" type="success" />);
                if (addAnother) {
                    formMethods.reset(); // Keep drawer open, reset form
                } else {
                    closeAddDrawer();
                }
            }
        } catch (e: any) { toast.push(<Notification title={editingItem ? "Update" : "Add" + " Failed"} type="danger">{e.message}</Notification>); }
        finally { setIsSubmitting(false); setMasterLoadingStatus('idle'); }
    };

    const handleDeleteClick = (item: LeadItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => { /* ... adapted for leadsData */
        if (!itemToDelete) return;
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            setLeadsData(prev => prev.filter(d => d.id !== itemToDelete!.id));
            toast.push(<Notification title="Lead Deleted" type="success">{`Lead "${itemToDelete.contactName || itemToDelete.mobileNo}" deleted.`}</Notification>);
            setSelectedItems(prev => prev.filter(d => d.id !== itemToDelete!.id));
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null); }
    };
    const handleDeleteSelected = async () => { /* ... adapted for leadsData */
        if (selectedItems.length === 0) return;
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setLeadsData(prev => prev.filter(d => !idsToDelete.includes(d.id)));
            toast.push(<Notification title="Leads Deleted" type="success">{selectedItems.length} lead(s) deleted.</Notification>);
            setSelectedItems([]);
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); }
    };

    const handleBlacklistClick = (item: LeadItem) => { setItemToBlacklist(item); setBlacklistConfirmOpen(true); };
    const onConfirmBlacklist = async () => {
        if (!itemToBlacklist) return;
        setIsBlacklisting(true); setMasterLoadingStatus('loading'); setBlacklistConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            const updatedItem = { ...itemToBlacklist, status: 'blacklist' as const };
            setLeadsData(prev => prev.map(d => d.id === updatedItem.id ? updatedItem : d));
            toast.push(<Notification title="Lead Blacklisted" type="warning">{`Lead "${itemToBlacklist.contactName || itemToBlacklist.mobileNo}" has been blacklisted.`}</Notification>);
        } catch (e: any) { toast.push(<Notification title="Blacklist Failed" type="danger">{e.message}</Notification>); }
        finally { setIsBlacklisting(false); setMasterLoadingStatus('idle'); setItemToBlacklist(null); }
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
        let processedData: LeadItem[] = cloneDeep(leadsData);
        // Apply Filters
        if (filterCriteria.filterCountry?.length) processedData = processedData.filter(item => filterCriteria.filterCountry!.some((fc: any) => fc.value === item.country));
        if (filterCriteria.filterCategory?.length) processedData = processedData.filter(item => filterCriteria.filterCategory!.some((fc: any) => fc.value === item.categoryName));
        if (filterCriteria.filterBrand?.length) processedData = processedData.filter(item => filterCriteria.filterBrand!.some((fb: any) => fb.value === item.brandName));
        if (filterCriteria.filterStatus?.length) processedData = processedData.filter(item => filterCriteria.filterStatus!.some((fs: any) => fs.value === item.status));
        if (filterCriteria.filterQuality?.length) processedData = processedData.filter(item => filterCriteria.filterQuality!.some((fq: any) => fq.value === item.quality));

        // Apply Search Query
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                String(item.id).toLowerCase().includes(query) ||
                item.mobileNo.toLowerCase().includes(query) ||
                (item.email && item.email.toLowerCase().includes(query)) ||
                (item.contactName && item.contactName.toLowerCase().includes(query)) ||
                (item.companyName && item.companyName.toLowerCase().includes(query)) ||
                (item.city && item.city.toLowerCase().includes(query)) ||
                (item.remarks && item.remarks.toLowerCase().includes(query))
            );
        }
        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { /* ... standard sort ... */
             processedData.sort((a, b) => {
                const aVal = a[key as keyof LeadItem];
                const bVal = b[key as keyof LeadItem];
                if (key === 'date') { // Date sort
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
    }, [leadsData, tableData, filterCriteria]);


    const handleExportData = () => {
        const success = exportLeadsToCsv('leads_data.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };

    // --- Table Interaction Handlers (Generic) ---
    // ... (handleSetTableData, handlePaginationChange, handleSelectChange, handleSort, handleSearchChange, handleRowSelect, handleAllRowSelect are standard)


    // --- Column Definitions ---
    const columns: ColumnDef<LeadItem>[] = useMemo(
        () => [
            // { header: 'ID', accessorKey: 'id', size: 80, enableSorting: true }, // Optional
            { header: 'Country', accessorKey: 'country', size: 100, cell: props => ALL_AVAILABLE_COUNTRIES.find(c=>c.value === props.getValue())?.label || props.getValue() },
            { header: 'Category', accessorKey: 'categoryName', size: 120, cell: props => CATEGORIES_LIST.find(c=>c.value === props.getValue())?.label || props.getValue() },
            { header: 'Brand', accessorKey: 'brandName', size: 100, cell: props => BRANDS_LIST.find(b=>b.value === props.getValue())?.label || props.getValue() },
            { header: 'Mobile No', accessorKey: 'mobileNo', size: 130 },
            // { header: 'Email', accessorKey: 'email', size: 180 },
            // { header: 'Name', accessorKey: 'contactName', size: 150 },
            // { header: 'Company', accessorKey: 'companyName', size: 150 },
            { header: 'Quality', accessorKey: 'quality', size: 100, cell: props => <Tag className={classNames(
                props.getValue() === 'high' && 'bg-green-100 text-green-600',
                props.getValue() === 'medium' && 'bg-yellow-100 text-yellow-600',
                props.getValue() === 'low' && 'bg-red-100 text-red-600',
                'capitalize'
            )}>{QUALITY_LEVELS.find(q=>q.value === props.getValue())?.label || props.getValue()}</Tag> },
            // { header: 'City', accessorKey: 'city', size: 100 },
            { header: 'Status', accessorKey: 'status', size: 110, cell: props => <Tag className={classNames('capitalize', statusColors[props.getValue<string>()])}>{STATUS_OPTIONS.find(s=>s.value === props.getValue())?.label || props.getValue()}</Tag> },
            { header: 'Remarks', accessorKey: 'remarks', size: 150, cell: props => <div className="truncate w-36" title={props.getValue() as string}>{props.getValue()}</div> },
            { header: 'Date', accessorKey: 'date', size: 100, cell: props => new Date(props.getValue() as string).toLocaleDateString() },
            {
                header: 'Actions', id: 'actions', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 120,
                cell: props => <ActionColumn item={props.row.original} onEdit={() => openEditDrawer(props.row.original)} onView={() => openViewDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onBlacklist={() => handleBlacklistClick(props.row.original)} />,
            },
        ],
        [], // Dependencies for memoization
    );


    // --- Render Form for Drawer ---
    const renderDrawerForm = (formInstance: typeof formMethods) => ( // Pass formInstance
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <FormItem label="Country" invalid={!!formInstance.formState.errors.country} errorMessage={formInstance.formState.errors.country?.message}>
                <Controller name="country" control={formInstance.control} render={({ field }) => (
                    <Select placeholder="Select country" options={ALL_AVAILABLE_COUNTRIES} value={ALL_AVAILABLE_COUNTRIES.find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="Category" invalid={!!formInstance.formState.errors.categoryName} errorMessage={formInstance.formState.errors.categoryName?.message}>
                <Controller name="categoryName" control={formInstance.control} render={({ field }) => (
                    <Select placeholder="Select category" options={CATEGORIES_LIST} value={CATEGORIES_LIST.find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="Brand" invalid={!!formInstance.formState.errors.brandName} errorMessage={formInstance.formState.errors.brandName?.message}>
                <Controller name="brandName" control={formInstance.control} render={({ field }) => (
                    <Select placeholder="Select brand" options={BRANDS_LIST} value={BRANDS_LIST.find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="Mobile No." invalid={!!formInstance.formState.errors.mobileNo} errorMessage={formInstance.formState.errors.mobileNo?.message}>
                <Controller name="mobileNo" control={formInstance.control} render={({ field }) => <Input {...field} prefix={<TbPhone/>} placeholder="+XX-XXXXXXXXXX" />} />
            </FormItem>
            <FormItem label="Email (Optional)" invalid={!!formInstance.formState.errors.email} errorMessage={formInstance.formState.errors.email?.message}>
                <Controller name="email" control={formInstance.control} render={({ field }) => <Input {...field} type="email" prefix={<TbMail/>} placeholder="name@example.com" />} />
            </FormItem>
            <FormItem label="Contact Name (Optional)" invalid={!!formInstance.formState.errors.contactName} errorMessage={formInstance.formState.errors.contactName?.message}>
                <Controller name="contactName" control={formInstance.control} render={({ field }) => <Input {...field} prefix={<TbUser/>} placeholder="John Doe" />} />
            </FormItem>
            <FormItem label="Company Name (Optional)" invalid={!!formInstance.formState.errors.companyName} errorMessage={formInstance.formState.errors.companyName?.message}>
                <Controller name="companyName" control={formInstance.control} render={({ field }) => <Input {...field} prefix={<TbBuilding/>} placeholder="ABC Corp" />} />
            </FormItem>
            <FormItem label="Quality" invalid={!!formInstance.formState.errors.quality} errorMessage={formInstance.formState.errors.quality?.message}>
                <Controller name="quality" control={formInstance.control} render={({ field }) => (
                    <Select placeholder="Select quality" options={QUALITY_LEVELS} value={QUALITY_LEVELS.find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="City (Optional)" invalid={!!formInstance.formState.errors.city} errorMessage={formInstance.formState.errors.city?.message}>
                <Controller name="city" control={formInstance.control} render={({ field }) => <Input {...field} prefix={<TbMapPin/>} placeholder="City Name" />} />
            </FormItem>
            <FormItem label="Status" invalid={!!formInstance.formState.errors.status} errorMessage={formInstance.formState.errors.status?.message}>
                <Controller name="status" control={formInstance.control} render={({ field }) => (
                    <Select placeholder="Select status" options={STATUS_OPTIONS.filter(s => s.value !== 'blacklist')} /* Don't allow setting blacklist via form */
                            value={STATUS_OPTIONS.find(o=>o.value === field.value)} onChange={opt=>field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <FormItem label="Date" invalid={!!formMethods.formState.errors.date} errorMessage={formMethods.formState.errors.date?.message}>
                <Controller name="date" control={formMethods.control} render={({ field }) => <Input {...field} type="date" />} />
            </FormItem>
            <FormItem label="Remarks (Optional)" className="md:col-span-2 lg:col-span-3" invalid={!!formInstance.formState.errors.remarks} errorMessage={formInstance.formState.errors.remarks?.message}>
                <Controller name="remarks" control={formInstance.control} render={({ field }) => <Textarea {...field} rows={3} placeholder="Add any relevant notes or comments..." />} />
            </FormItem>
        </div>
    );


    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-4 sm:mb-0 flex items-center gap-2"><TbMoodCrazyHappy /> Lead Management</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Lead</Button>
                    </div>
                    {/* <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} searchPlaceholder="Search leads..." /> */}
                    <div className="mt-4">
                        <DataTable
                            columns={columns as ColumnDef<any>[]}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting || isBlacklisting}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            selectable
                            checkboxChecked={(row: LeadItem) => selectedItems.some(selected => selected.id === row.id)}
                            // onPaginationChange={handlePaginationChange}
                            // onSelectChange={handleSelectChange}
                            // onSort={handleSort}
                            // onCheckBoxChange={handleRowSelect}
                            // onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <StickyFooter /* For Selected Items Actions */
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                hidden={selectedItems.length === 0}
            >
                 <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span>Lead{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>

            {/* Add/Edit Drawer */}
            <Drawer
                title={editingItem ? "Edit Lead" : "Add New Lead"}
                isOpen={isAddDrawerOpen || isEditDrawerOpen}
                onClose={editingItem ? closeEditDrawer : closeAddDrawer}
                onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
                width={900} // Wider drawer for more fields
                footer={
                    <div className="flex justify-between w-full">
                         {!editingItem && ( // "Save & Add Another" only for Add mode
                            <Button size="sm" variant="outline" type="button" onClick={() => formMethods.handleSubmit((data) => onSubmit(data, true))()} loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                                Save & Add Another
                            </Button>
                        )}
                        <div className={editingItem ? "w-full text-right" : ""}> {/* Adjust spacing if "Save & Add Another" is present */}
                            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="leadForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                                {isSubmitting ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add Lead')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <Form id="leadForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {renderDrawerForm(formMethods)}
                </Form>
            </Drawer>

            {/* View Lead Details Dialog */}
            <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={700}>
                <h5 className="mb-4">Lead Details - {viewingItem?.contactName || viewingItem?.mobileNo}</h5>
                {viewingItem && (
                    <div className="space-y-3">
                        {(Object.keys(viewingItem) as Array<keyof LeadItem>).map(key => {
                            let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Format key to label
                            let value: any = viewingItem[key];
                            if (key === 'country') value = ALL_AVAILABLE_COUNTRIES.find(c=>c.value === value)?.label || value;
                            else if (key === 'categoryName') value = CATEGORIES_LIST.find(c=>c.value === value)?.label || value;
                            else if (key === 'brandName') value = BRANDS_LIST.find(b=>b.value === value)?.label || value;
                            else if (key === 'quality') value = QUALITY_LEVELS.find(q=>q.value === value)?.label || value;
                            else if (key === 'status') value = STATUS_OPTIONS.find(s=>s.value === value)?.label || value;
                            else if (key === 'date' && value) value = new Date(value).toLocaleDateString();

                            return (
                                <div key={key} className="flex">
                                    <span className="font-semibold w-1/3">{label}:</span>
                                    <span className="w-2/3">{value || '-'}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                 <div className="text-right mt-6">
                    <Button variant="plain" onClick={closeViewDialog}>Close</Button>
                </div>
            </Dialog>

            {/* Filter Drawer */}
            {/* ... (Filter drawer similar to previous examples, include filters for country, category, brand, status, quality) ... */}

            <ConfirmDialog /* Single Delete */
                isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Lead"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                // ... (rest of props same as before)
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
            >
                <p>Are you sure you want to delete lead for "<strong>{itemToDelete?.contactName || itemToDelete?.mobileNo}</strong>"?</p>
            </ConfirmDialog>

            <ConfirmDialog /* Blacklist Confirmation */
                isOpen={blacklistConfirmOpen} type="warning" title="Blacklist Lead"
                onClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }}
                confirmText="Yes, Blacklist" cancelText="No, Cancel"
                onConfirm={onConfirmBlacklist} loading={isBlacklisting}
            >
                 <p>Are you sure you want to blacklist lead for "<strong>{itemToBlacklist?.contactName || itemToBlacklist?.mobileNo}</strong>"? This will change their status to 'Blacklisted'.</p>
            </ConfirmDialog>
        </>
    );
};

export default LeadManagement;

// Helper function (if not globally available)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }