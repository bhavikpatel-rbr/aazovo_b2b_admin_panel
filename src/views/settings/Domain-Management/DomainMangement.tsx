// src/views/your-path/DomainManagementListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate is used if edit navigates to a new page
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
import Select from '@/components/ui/Select' // Assuming your Select supports multi-select and single
import { Drawer, Form, FormItem, Input, Tag } from '@/components/ui' // Added Textarea

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbWorldWww, // Domain icon
    TbCurrencyDollar, // Currency icon
    TbSettingsCog, // Numbering System icon
    TbCode, // Analytics Script icon
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import Textarea from '@/views/ui-components/forms/Input/Textarea'
// Redux (Keep commented if using local state first)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getDomainsAction, addDomainAction, ... } from '@/reduxtool/domain/middleware';
// import { domainSelector } from '@/reduxtool/domain/domainSlice';


// --- Constants ---
const ALL_AVAILABLE_COUNTRIES = [ // Example, replace with your actual data source
    { value: 'USA', label: 'United States' }, { value: 'CAN', label: 'Canada' }, { value: 'GBR', label: 'United Kingdom' },
    { value: 'DEU', label: 'Germany' }, { value: 'FRA', label: 'France' }, { value: 'IND', label: 'India' },
    { value: 'AUS', label: 'Australia' }, { value: 'JPN', label: 'Japan' }, { value: 'GLOBAL', label: 'Global (All)'}
];
const countryValues = ALL_AVAILABLE_COUNTRIES.map(c => c.value) as [string, ...string[]];

const SUPPORTED_CURRENCIES = [ // Example, replace with your actual data source
    { value: 'USD', label: 'USD - United States Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound Sterling' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
];
const currencyValues = SUPPORTED_CURRENCIES.map(c => c.value) as [string, ...string[]];


// --- Define DomainItem Type ---
export type DomainItem = {
    id: string | number
    domain: string
    currency: string // Currency code (e.g., 'USD')
    // KYC Member Numbering
    kycPrefix?: string
    kycStartNumber: number
    kycCurrentNumber: number
    // Temporary Member Numbering
    tempStartNumber: number
    tempCurrentNumber: number
    analyticsScript?: string
    countries: string[] // Array of country codes
}

// --- Zod Schema for Add/Edit Form ---
const domainFormSchema = z.object({
    domain: z.string()
        .min(1, 'Domain name is required.')
        .regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/, 'Invalid domain format.'),
    currency: z.enum(currencyValues, { errorMap: () => ({ message: 'Please select a currency.' })}),
    kycPrefix: z.string().max(10, 'KYC Prefix too long (max 10 chars).').optional().or(z.literal('')),
    kycStartNumber: z.coerce.number().int().min(0, 'KYC Start Number must be non-negative.'),
    kycCurrentNumber: z.coerce.number().int().min(0, 'KYC Current Number must be non-negative.'),
    tempStartNumber: z.coerce.number().int().min(0, 'Temp Start Number must be non-negative.'),
    tempCurrentNumber: z.coerce.number().int().min(0, 'Temp Current Number must be non-negative.'),
    analyticsScript: z.string().optional().or(z.literal('')),
    countries: z.array(z.string()).min(1, 'At least one country must be selected.'),
}).superRefine((data, ctx) => {
    if (data.kycCurrentNumber < data.kycStartNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'KYC Current # must be ≥ Start #.', path: ['kycCurrentNumber'] });
    }
    if (data.tempCurrentNumber < data.tempStartNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Temp Current # must be ≥ Start #.', path: ['tempCurrentNumber'] });
    }
});
type DomainFormData = z.infer<typeof domainFormSchema>

// --- Initial Dummy Data ---
const initialDummyDomains: DomainItem[] = [
    {
        id: 'DOM001', domain: 'aazovo-global.com', currency: 'USD',
        kycPrefix: 'GL-K', kycStartNumber: 1000, kycCurrentNumber: 1000,
        tempStartNumber: 500, tempCurrentNumber: 500,
        countries: ['GLOBAL'], analyticsScript: '<!-- Global Site Tag (gtag.js) - Google Analytics -->',
    },
    {
        id: 'DOM002', domain: 'aazovo.co.uk', currency: 'GBP',
        kycPrefix: 'UK-K', kycStartNumber: 100, kycCurrentNumber: 120,
        tempStartNumber: 50, tempCurrentNumber: 60,
        countries: ['GBR'],
    },
];

// --- CSV Exporter ---
const CSV_HEADERS_DOM = ['ID', 'Domain', 'Currency', 'KYC Prefix', 'KYC Start', 'KYC Current', 'Temp Start', 'Temp Current', 'Countries', 'Analytics Script'];
const CSV_KEYS_DOM: (keyof DomainItem | 'countriesString')[] = [
    'id', 'domain', 'currency', 'kycPrefix', 'kycStartNumber', 'kycCurrentNumber',
    'tempStartNumber', 'tempCurrentNumber', 'countriesString', 'analyticsScript'
];

function exportDomainsToCsv(filename: string, rows: DomainItem[]) {
    // ... (Similar exportToCsv logic, prepare countriesString)
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
     const preparedRows = rows.map(row => ({
        ...row,
        countriesString: row.countries.join('; ')
    }));

    const separator = ',';
    const csvContent =
        CSV_HEADERS_DOM.join(separator) + '\n' +
        preparedRows.map((row: any) => CSV_KEYS_DOM.map(k => {
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

// --- ActionColumn (Reusable) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
     const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit Domain">
                <div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400')} role="button" onClick={onEdit}>
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete Domain">
                <div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400')} role="button" onClick={onDelete}>
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    );
};


// --- Search and TableTools ---
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Search by domain, ID, currency..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
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

// --- Main Component: DomainManagementListing ---
const DomainManagementListing = () => {
    const [domainsData, setDomainsData] = useState<DomainItem[]>(initialDummyDomains);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DomainItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<DomainItem | null>(null);

    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<DomainItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<{ filterCountries?: any[], filterCurrency?: any[] }>({});

    const formMethods = useForm<DomainFormData>({
        resolver: zodResolver(domainFormSchema),
        defaultValues: {
            domain: '', currency: currencyValues[0], // Default to first currency
            kycPrefix: '', kycStartNumber: 0, kycCurrentNumber: 0,
            tempStartNumber: 0, tempCurrentNumber: 0,
            analyticsScript: '', countries: [],
        },
        mode: 'onChange',
    });

    const filterForm = useForm<{ filterCountries?: any[], filterCurrency?: any[] }>({ defaultValues: {} });

    // --- CRUD Handlers ---
    const openAddDrawer = () => {
        formMethods.reset(); // Reset to defaultValues in useForm
        setIsAddDrawerOpen(true);
    };
    const closeAddDrawer = () => setIsAddDrawerOpen(false);

    const openEditDrawer = (item: DomainItem) => {
        setEditingItem(item);
        formMethods.reset({
            domain: item.domain, currency: item.currency,
            kycPrefix: item.kycPrefix || '', kycStartNumber: item.kycStartNumber, kycCurrentNumber: item.kycCurrentNumber,
            tempStartNumber: item.tempStartNumber, tempCurrentNumber: item.tempCurrentNumber,
            analyticsScript: item.analyticsScript || '', countries: item.countries,
        });
        setIsEditDrawerOpen(true);
    };
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); };

    const onSubmit = async (data: DomainFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const countriesData = data.countries.map((country: any) => typeof country === 'object' ? country.value : country);
            const payload = { ...data, countries: countriesData };

            if (editingItem) {
                const updatedItem: DomainItem = { ...editingItem, ...payload };
                setDomainsData(prev => prev.map(d => d.id === updatedItem.id ? updatedItem : d));
                toast.push(<Notification title="Domain Updated" type="success">Domain configuration saved.</Notification>);
                closeEditDrawer();
            } else {
                const newItem: DomainItem = { ...payload, id: `DOM${Date.now()}` };
                setDomainsData(prev => [...prev, newItem]);
                toast.push(<Notification title="Domain Added" type="success">New domain added.</Notification>);
                closeAddDrawer();
            }
        } catch (error: any) {
            toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{error?.message || 'Operation failed.'}</Notification>);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const handleDeleteClick = (item: DomainItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => {
        // ... (delete logic adapted for domainsData)
        if (!itemToDelete) return;
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            setDomainsData(prev => prev.filter(d => d.id !== itemToDelete!.id));
            toast.push(<Notification title="Domain Deleted" type="success">{`Domain "${itemToDelete.domain}" deleted.`}</Notification>);
            setSelectedItems(prev => prev.filter(d => d.id !== itemToDelete!.id));
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null); }
    };
    const handleDeleteSelected = async () => {
        // ... (delete selected logic adapted for domainsData)
         if (selectedItems.length === 0) return;
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setDomainsData(prev => prev.filter(d => !idsToDelete.includes(d.id)));
            toast.push(<Notification title="Domains Deleted" type="success">{selectedItems.length} domain(s) deleted.</Notification>);
            setSelectedItems([]);
        } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e.message}</Notification>); }
        finally { setIsDeleting(false); setMasterLoadingStatus('idle'); }
    };

    // --- Filter Handlers ---
    const openFilterDrawer = () => { filterForm.reset(filterCriteria); setIsFilterDrawerOpen(true); };
    const onApplyFiltersSubmit = (data: { filterCountries?: any[], filterCurrency?: any[] }) => {
        setFilterCriteria(data);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        setIsFilterDrawerOpen(false);
    };
    const onClearFilters = () => { filterForm.reset({}); setFilterCriteria({}); setTableData(prev => ({ ...prev, pageIndex: 1 })); };


    // --- Data Processing (Memoized) ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: DomainItem[] = cloneDeep(domainsData);

        if (filterCriteria.filterCountries && filterCriteria.filterCountries.length > 0) {
            const selectedCountryCodes = filterCriteria.filterCountries.map((opt: any) => opt.value);
            processedData = processedData.filter(item => item.countries.some(cc => selectedCountryCodes.includes(cc)));
        }
        if (filterCriteria.filterCurrency && filterCriteria.filterCurrency.length > 0) {
            const selectedCurrencies = filterCriteria.filterCurrency.map((opt: any) => opt.value);
            processedData = processedData.filter(item => selectedCurrencies.includes(item.currency));
        }

        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.domain.toLowerCase().includes(query) ||
                String(item.id).toLowerCase().includes(query) ||
                item.currency.toLowerCase().includes(query) ||
                (item.kycPrefix && item.kycPrefix.toLowerCase().includes(query)) ||
                item.countries.some(c => c.toLowerCase().includes(query))
            );
        }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && ['id', 'domain', 'currency', 'kycPrefix', 'countriesCount'].includes(key)) {
             processedData.sort((a, b) => {
                let aVal, bVal;
                if (key === 'countriesCount') { aVal = a.countries.length; bVal = b.countries.length; }
                else { aVal = a[key as keyof Omit<DomainItem, 'countries' | 'analyticsScript'>]; bVal = b[key as keyof Omit<DomainItem, 'countries' | 'analyticsScript'>]; }

                if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal;
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
    }, [domainsData, tableData, filterCriteria]);


    const handleExportData = () => {
        const success = exportDomainsToCsv('domains_management.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: DomainItem) => { /* ...standard */
         setSelectedItems(prev => {
            if (checked) return prev.some(item => item.id === row.id) ? prev : [...prev, row];
            return prev.filter(item => item.id !== row.id);
        });
    }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<DomainItem>[]) => { /* ...standard */
        const originals = currentRows.map(r => r.original);
        if (checked) {
            setSelectedItems(prev => {
                const prevIds = new Set(prev.map(item => item.id));
                const newToAdd = originals.filter(r => !prevIds.has(r.id));
                return [...prev, ...newToAdd];
            });
        } else {
            const currentIds = new Set(originals.map(r => r.id));
            setSelectedItems(prev => prev.filter(item => !currentIds.has(item.id)));
        }
    }, []);

    // --- Column Definitions ---
    const columns: ColumnDef<DomainItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 },
            { header: 'Domain', accessorKey: 'domain', enableSorting: true, size: 220,
              cell: props => <span className="font-semibold text-blue-600 dark:text-blue-400">{props.row.original.domain}</span>
            },
            { header: 'Currency', accessorKey: 'currency', enableSorting: true, size: 100 },
            { header: 'KYC Prefix', accessorKey: 'kycPrefix', enableSorting: true, size: 120 },
            {
                header: 'Countries', id: 'countriesCount', enableSorting: true, size: 150,
                cell: (props) => {
                    const count = props.row.original.countries.length;
                    const countryLabels = props.row.original.countries
                        .map(code => ALL_AVAILABLE_COUNTRIES.find(c => c.value === code)?.label || code)
                        .slice(0, 2).join(', '); // Show first 2
                    return (
                        <Tooltip title={count > 0 ? props.row.original.countries.map(code => ALL_AVAILABLE_COUNTRIES.find(c => c.value === code)?.label || code).join(', ') : 'No countries'}>
                            <span className="cursor-default">
                                {count > 2 ? `${countryLabels}, +${count-2}` : (count > 0 ? countryLabels : `${count} Countries`)}
                            </span>
                        </Tooltip>
                    );
                },
            },
            {
                header: 'Actions', id: 'action', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100,
                cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
            },
        ],
        [],
    );

    // --- Render Form for Drawer ---
    const renderDrawerForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormItem label="Domain Name" className="md:col-span-2" invalid={!!formMethods.formState.errors.domain} errorMessage={formMethods.formState.errors.domain?.message}>
                <Controller name="domain" control={formMethods.control} render={({ field }) => <Input {...field} prefix={<TbWorldWww className="text-lg" />} placeholder="e.g., example.com" />} />
            </FormItem>

            <FormItem label="Currency" invalid={!!formMethods.formState.errors.currency} errorMessage={formMethods.formState.errors.currency?.message}>
                <Controller name="currency" control={formMethods.control} render={({ field }) => (
                    <Select placeholder="Select currency" options={SUPPORTED_CURRENCIES} value={SUPPORTED_CURRENCIES.find(c => c.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                )} />
            </FormItem>
            <div /> {/* Spacer */}

            <div className="md:col-span-2 border-t pt-4 mt-2">
                <h6 className="text-sm font-semibold mb-2 flex items-center gap-2"><TbSettingsCog /> Numbering System For KYC Member</h6>
            </div>
            <FormItem label="Prefix For KYC" invalid={!!formMethods.formState.errors.kycPrefix} errorMessage={formMethods.formState.errors.kycPrefix?.message}>
                <Controller name="kycPrefix" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., EU-K-" />} />
            </FormItem>
             <div /> {/* Spacer */}
            <FormItem label="Member ID Starting Number" invalid={!!formMethods.formState.errors.kycStartNumber} errorMessage={formMethods.formState.errors.kycStartNumber?.message}>
                <Controller name="kycStartNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 10001" />} />
            </FormItem>
            <FormItem label="Member ID Current Number" invalid={!!formMethods.formState.errors.kycCurrentNumber} errorMessage={formMethods.formState.errors.kycCurrentNumber?.message}>
                <Controller name="kycCurrentNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 10500" />} />
            </FormItem>

            <div className="md:col-span-2 border-t pt-4 mt-2">
                <h6 className="text-sm font-semibold mb-2 flex items-center gap-2"><TbSettingsCog /> Numbering System For Temporary Member</h6>
            </div>
            <FormItem label="Member ID Starting Number" invalid={!!formMethods.formState.errors.tempStartNumber} errorMessage={formMethods.formState.errors.tempStartNumber?.message}>
                <Controller name="tempStartNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 5001" />} />
            </FormItem>
            <FormItem label="Member ID Current Number" invalid={!!formMethods.formState.errors.tempCurrentNumber} errorMessage={formMethods.formState.errors.tempCurrentNumber?.message}>
                <Controller name="tempCurrentNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 5250" />} />
            </FormItem>

            <FormItem label="Countries (Multi-select)" className="md:col-span-2" invalid={!!formMethods.formState.errors.countries} errorMessage={formMethods.formState.errors.countries?.message as string}>
                <Controller name="countries" control={formMethods.control} render={({ field }) => (
                    <Select isMulti placeholder="Select countries..." options={ALL_AVAILABLE_COUNTRIES}
                            value={ALL_AVAILABLE_COUNTRIES.filter(opt => field.value?.includes(opt.value))}
                            onChange={opts => field.onChange(opts ? opts.map((o:any) => o.value) : [])} />
                )} />
            </FormItem>

            <FormItem label="Analytics Script (Optional)" className="md:col-span-2" invalid={!!formMethods.formState.errors.analyticsScript} errorMessage={formMethods.formState.errors.analyticsScript?.message}>
                <Controller name="analyticsScript" control={formMethods.control} render={({ field }) => (
                    <Textarea {...field} rows={4} placeholder="Paste your analytics script here (e.g., Google Analytics, Hotjar)" />
                )} />
            </FormItem>
        </div>
    );

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-4 sm:mb-0 flex items-center gap-2"><TbWorldWww className="text-xl" /> Domain Management</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Domain</Button>
                    </div>
                    <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4">
                        <DataTable
                            columns={columns}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            selectable
                            checkboxChecked={(row: DomainItem) => selectedItems.some(selected => selected.id === row.id)}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onCheckBoxChange={handleRowSelect}
                            onIndeterminateCheckBoxChange={handleAllRowSelect}
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
                            <span>Domain{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>

            <Drawer
                title={editingItem ? "Edit Domain Configuration" : "Add New Domain"}
                isOpen={isAddDrawerOpen || isEditDrawerOpen}
                onClose={editingItem ? closeEditDrawer : closeAddDrawer}
                onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
                width={700} // Or 'xl' if your Drawer supports size presets
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="domainForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add Domain')}
                        </Button>
                    </div>
                }
            >
                <Form id="domainForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {renderDrawerForm()}
                </Form>
            </Drawer>

            <Drawer /* Filter Drawer */
                title="Filter Domains"
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onRequestClose={() => setIsFilterDrawerOpen(false)}
                footer={
                    <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={() => setIsFilterDrawerOpen(false)} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="filterDomainsForm" type="submit">Apply Filters</Button>
                        </div>
                    </div>
                }
            >
                <Form id="filterDomainsForm" onSubmit={filterForm.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Countries">
                        <Controller name="filterCountries" control={filterForm.control} render={({ field }) => (
                            <Select isMulti placeholder="Select countries..." options={ALL_AVAILABLE_COUNTRIES}
                                    value={ALL_AVAILABLE_COUNTRIES.filter(opt => field.value?.includes(opt.value))}
                                    onChange={opts => field.onChange(opts ? opts.map((o: any) => o.value) : [])} />
                        )} />
                    </FormItem>
                    <FormItem label="Filter by Currency">
                         <Controller name="filterCurrency" control={filterForm.control} render={({ field }) => (
                            <Select isMulti placeholder="Select currencies..." options={SUPPORTED_CURRENCIES}
                                    value={SUPPORTED_CURRENCIES.filter(opt => field.value?.includes(opt.value))}
                                    onChange={opts => field.onChange(opts ? opts.map((o: any) => o.value) : [])} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog /* Single Delete */
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Domain"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                confirmButtonColor="red-600"
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>Are you sure you want to delete the domain "<strong>{itemToDelete?.domain}</strong>"? This cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

export default DomainManagementListing;

// Helper (already defined in previous examples, ensure it's available or copy it)
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}