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
import Select from '@/components/ui/Select' // Assuming your Select supports multi-select
import { Drawer, Form, FormItem, Input, Tag } from '@/components/ui'

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbSettingsCog, // Icon for Number System
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
// Redux (Keep commented if using local state first)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getNumberSystemsAction, addNumberSystemAction, ... } from '@/reduxtool/numberSystem/middleware';
// import { numberSystemSelector } from '@/reduxtool/numberSystem/numberSystemSlice';


// --- Constants ---
// Example list of countries for multi-select. In a real app, this would come from an API or a larger constant file.
const ALL_AVAILABLE_COUNTRIES = [
    { value: 'USA', label: 'United States' }, { value: 'CAN', label: 'Canada' }, { value: 'MEX', label: 'Mexico' },
    { value: 'GBR', label: 'United Kingdom' }, { value: 'DEU', label: 'Germany' }, { value: 'FRA', label: 'France' },
    { value: 'JPN', label: 'Japan' }, { value: 'AUS', label: 'Australia' }, { value: 'IND', label: 'India' },
    { value: 'BRA', label: 'Brazil' }, { value: 'ZAF', label: 'South Africa' },
    // ...add more countries as needed
];
const countryValues = ALL_AVAILABLE_COUNTRIES.map(c => c.value) as [string, ...string[]];


// --- Define NumberSystemItem Type ---
export type NumberSystemItem = {
    id: string | number
    name: string
    // KYC Member Numbering
    kycPrefix?: string
    kycStartNumber: number
    kycCurrentNumber: number
    // Temporary Member Numbering
    tempStartNumber: number
    tempCurrentNumber: number
    countries: string[] // Array of country codes (e.g., ['USA', 'CAN'])
    // status?: 'active' | 'inactive' // Optional: if you need a status
}

// --- Zod Schema for Add/Edit Form ---
const numberSystemFormSchema = z.object({
    name: z.string().min(1, 'Name is required.').max(100, 'Name too long.'),
    kycPrefix: z.string().max(10, 'KYC Prefix too long.').optional().or(z.literal('')),
    kycStartNumber: z.coerce.number().int().min(0, 'KYC Start Number must be non-negative.'),
    kycCurrentNumber: z.coerce.number().int().min(0, 'KYC Current Number must be non-negative.'),
    tempStartNumber: z.coerce.number().int().min(0, 'Temp Start Number must be non-negative.'),
    tempCurrentNumber: z.coerce.number().int().min(0, 'Temp Current Number must be non-negative.'),
    countries: z.array(z.string()) // Or z.array(z.enum(countryValues)) if using enum for validation
                 .min(1, 'At least one country must be selected.'),
}).superRefine((data, ctx) => {
    if (data.kycCurrentNumber < data.kycStartNumber) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'KYC Current Number cannot be less than KYC Start Number.',
            path: ['kycCurrentNumber'],
        });
    }
    if (data.tempCurrentNumber < data.tempStartNumber) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Temp Current Number cannot be less than Temp Start Number.',
            path: ['tempCurrentNumber'],
        });
    }
});
type NumberSystemFormData = z.infer<typeof numberSystemFormSchema>

// --- Initial Dummy Data ---
const initialDummyNumberSystems: NumberSystemItem[] = [
    {
        id: 'NS001', name: 'North America Region',
        kycPrefix: 'NA-K', kycStartNumber: 1000, kycCurrentNumber: 1050,
        tempStartNumber: 500, tempCurrentNumber: 520,
        countries: ['USA', 'CAN', 'MEX'],
    },
    {
        id: 'NS002', name: 'European Union System',
        kycPrefix: 'EU-K', kycStartNumber: 20000, kycCurrentNumber: 20345,
        tempStartNumber: 1000, tempCurrentNumber: 1100,
        countries: ['DEU', 'FRA'], // Using codes now
    },
];

// --- CSV Exporter ---
const CSV_HEADERS_NS = ['ID', 'Name', 'KYC Prefix', 'KYC Start No.', 'KYC Current No.', 'Temp Start No.', 'Temp Current No.', 'Countries (Codes)'];
const CSV_KEYS_NS: (keyof NumberSystemItem | 'countriesString')[] = ['id', 'name', 'kycPrefix', 'kycStartNumber', 'kycCurrentNumber', 'tempStartNumber', 'tempCurrentNumber', 'countriesString'];

function exportNumberSystemsToCsv(filename: string, rows: NumberSystemItem[]) {
    // ... (Similar exportToCsv logic, prepare rows by joining country codes)
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
        CSV_HEADERS_NS.join(separator) + '\n' +
        preparedRows.map((row: any) => CSV_KEYS_NS.map(k => {
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
    // ... (ActionColumn component remains the same)
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
};

// --- Search and TableTools ---
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Search by name or ID..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
ItemSearch.displayName = 'ItemSearch';

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }
const ItemTableTools = ({ onSearchChange, onFilter, onExport }: ItemTableToolsProps) => (
    // ... (ItemTableTools remains largely the same, filter button can be adapted)
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

// --- Main Component: NumberSystems ---
const NumberSystems = () => {
    const [numberSystemsData, setNumberSystemsData] = useState<NumberSystemItem[]>(initialDummyNumberSystems);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NumberSystemItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<NumberSystemItem | null>(null);

    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<NumberSystemItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<{ filterCountries?: any[] }>({}); // Example filter

    const formMethods = useForm<NumberSystemFormData>({
        resolver: zodResolver(numberSystemFormSchema),
        defaultValues: {
            name: '',
            kycPrefix: '',
            kycStartNumber: 0,
            kycCurrentNumber: 0,
            tempStartNumber: 0,
            tempCurrentNumber: 0,
            countries: [],
        },
        mode: 'onChange',
    });

    const filterForm = useForm<{ filterCountries?: any[] }>({ defaultValues: {} });


    // --- CRUD Handlers ---
    const openAddDrawer = () => {
        formMethods.reset({ // Reset with default or empty values
            name: '', kycPrefix: '', kycStartNumber: 0, kycCurrentNumber: 0,
            tempStartNumber: 0, tempCurrentNumber: 0, countries: [],
        });
        setIsAddDrawerOpen(true);
    };
    const closeAddDrawer = () => setIsAddDrawerOpen(false);

    const openEditDrawer = (item: NumberSystemItem) => {
        setEditingItem(item);
        formMethods.reset({
            name: item.name,
            kycPrefix: item.kycPrefix || '',
            kycStartNumber: item.kycStartNumber,
            kycCurrentNumber: item.kycCurrentNumber,
            tempStartNumber: item.tempStartNumber,
            tempCurrentNumber: item.tempCurrentNumber,
            countries: item.countries,
        });
        setIsEditDrawerOpen(true);
    };
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); };

    const onSubmit = async (data: NumberSystemFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Map selected country objects back to string array if Select returns objects
            const countriesData = data.countries.map((country: any) => typeof country === 'object' ? country.value : country);

            const payload = { ...data, countries: countriesData };

            if (editingItem) {
                const updatedItem: NumberSystemItem = { ...editingItem, ...payload };
                setNumberSystemsData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
                toast.push(<Notification title="Number System Updated" type="success">System updated.</Notification>);
                closeEditDrawer();
            } else {
                const newItem: NumberSystemItem = { ...payload, id: `NS${Date.now()}` };
                setNumberSystemsData(prev => [...prev, newItem]);
                toast.push(<Notification title="Number System Added" type="success">New system added.</Notification>);
                closeAddDrawer();
            }
        } catch (error: any) {
            toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{error?.message || 'Operation failed.'}</Notification>);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const handleDeleteClick = (item: NumberSystemItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => {
        // ... (delete logic similar to previous components, adapt for numberSystemsData)
        if (!itemToDelete) return;
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            setNumberSystemsData(prev => prev.filter(item => item.id !== itemToDelete!.id));
            toast.push(<Notification title="Number System Deleted" type="success">{`System "${itemToDelete.name}" deleted.`}</Notification>);
            setSelectedItems(prev => prev.filter(item => item.id !== itemToDelete!.id));
        } catch (error: any) {
            toast.push(<Notification title="Delete Failed" type="danger">{error?.message || 'Could not delete item.'}</Notification>);
        } finally {
            setIsDeleting(false);
            setMasterLoadingStatus('idle');
            setItemToDelete(null);
        }
    };
    const handleDeleteSelected = async () => {
        // ... (delete selected logic, adapt for numberSystemsData)
        if (selectedItems.length === 0) return;
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setNumberSystemsData(prev => prev.filter(item => !idsToDelete.includes(item.id)));
            toast.push(<Notification title="Deletion Successful" type="success">{selectedItems.length} system(s) deleted.</Notification>);
            setSelectedItems([]);
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger">{error?.message || 'Failed to delete selected items.'}</Notification>);
        } finally {
            setIsDeleting(false);
            setMasterLoadingStatus('idle');
        }
    };

    // --- Filter Handlers ---
    const openFilterDrawer = () => { filterForm.reset(filterCriteria); setIsFilterDrawerOpen(true); };
    const onApplyFiltersSubmit = (data: { filterCountries?: any[] }) => {
        setFilterCriteria(data);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        setIsFilterDrawerOpen(false);
    };
    const onClearFilters = () => { filterForm.reset({}); setFilterCriteria({}); setTableData(prev => ({ ...prev, pageIndex: 1 })); };

    // --- Data Processing (Memoized) ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: NumberSystemItem[] = cloneDeep(numberSystemsData);
        // Apply Filters (example for countries)
        if (filterCriteria.filterCountries && filterCriteria.filterCountries.length > 0) {
            const selectedCountryCodes = filterCriteria.filterCountries.map((opt: any) => opt.value);
            processedData = processedData.filter(item =>
                item.countries.some(countryCode => selectedCountryCodes.includes(countryCode))
            );
        }
        // Apply Search Query
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.name.toLowerCase().includes(query) ||
                String(item.id).toLowerCase().includes(query) ||
                (item.kycPrefix && item.kycPrefix.toLowerCase().includes(query))
            );
        }
        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && ['id', 'name', 'kycPrefix', 'countriesCount'].includes(key)) { // Added countriesCount for sorting
            processedData.sort((a, b) => {
                let aVal, bVal;
                if (key === 'countriesCount') {
                    aVal = a.countries.length;
                    bVal = b.countries.length;
                } else {
                    aVal = a[key as keyof Omit<NumberSystemItem, 'countries'>]; // Exclude 'countries' array itself from direct sort
                    bVal = b[key as keyof Omit<NumberSystemItem, 'countries'>];
                }

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return order === 'asc' ? aVal - bVal : bVal - aVal;
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
    }, [numberSystemsData, tableData, filterCriteria]);

    const handleExportData = () => {
        const success = exportNumberSystemsToCsv('number_systems.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: NumberSystemItem) => {
        // ... (standard row select)
        setSelectedItems(prev => {
            if (checked) return prev.some(item => item.id === row.id) ? prev : [...prev, row];
            return prev.filter(item => item.id !== row.id);
        });
    }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<NumberSystemItem>[]) => {
        // ... (standard all row select)
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
    const columns: ColumnDef<NumberSystemItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 },
            { header: 'Name', accessorKey: 'name', enableSorting: true, size: 200,
              cell: props => <span className="font-semibold">{props.row.original.name}</span>
            },
            { header: 'KYC Prefix', accessorKey: 'kycPrefix', enableSorting: true, size: 120 },
            {
                header: 'Countries',
                accessorKey: 'countries', // Keep this to allow access in cell
                id: 'countriesCount', // Use a different id for sorting if sorting by count
                enableSorting: true, // Enable sorting by count
                size: 150,
                cell: (props) => {
                    const count = props.row.original.countries.length;
                    const countryLabels = props.row.original.countries
                        .map(code => ALL_AVAILABLE_COUNTRIES.find(c => c.value === code)?.label || code)
                        .join(', ');
                    return (
                        <Tooltip title={count > 0 ? countryLabels : 'No countries'}>
                            <span className="cursor-default">{count} {count === 1 ? 'Country' : 'Countries'}</span>
                        </Tooltip>
                    );
                },
            },
            // Optional: Add Status column if needed
            {
                header: 'Actions', id: 'action', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100,
                cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
            },
        ],
        [], // openEditDrawer, handleDeleteClick are stable
    );

    // --- Render Form for Drawer ---
    const renderDrawerForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="Name" className="md:col-span-2" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}>
                <Controller name="name" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., European KYC System" />} />
            </FormItem>

            <div className="md:col-span-2 border-t pt-4 mt-2">
                <h6 className="text-sm font-medium mb-2">Numbering System For KYC Member</h6>
            </div>
            <FormItem label="Prefix For KYC" invalid={!!formMethods.formState.errors.kycPrefix} errorMessage={formMethods.formState.errors.kycPrefix?.message}>
                <Controller name="kycPrefix" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., EU-K-" />} />
            </FormItem>
            <div /> {/* Spacer for grid */}
            <FormItem label="Member ID Starting Number" invalid={!!formMethods.formState.errors.kycStartNumber} errorMessage={formMethods.formState.errors.kycStartNumber?.message}>
                <Controller name="kycStartNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 10001" />} />
            </FormItem>
            <FormItem label="Member ID Current Number" invalid={!!formMethods.formState.errors.kycCurrentNumber} errorMessage={formMethods.formState.errors.kycCurrentNumber?.message}>
                <Controller name="kycCurrentNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 10500" />} />
            </FormItem>

            <div className="md:col-span-2 border-t pt-4 mt-2">
                <h6 className="text-sm font-medium mb-2">Numbering System For Temporary Member</h6>
            </div>
            <FormItem label="Member ID Starting Number" invalid={!!formMethods.formState.errors.tempStartNumber} errorMessage={formMethods.formState.errors.tempStartNumber?.message}>
                <Controller name="tempStartNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 5001" />} />
            </FormItem>
            <FormItem label="Member ID Current Number" invalid={!!formMethods.formState.errors.tempCurrentNumber} errorMessage={formMethods.formState.errors.tempCurrentNumber?.message}>
                <Controller name="tempCurrentNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 5250" />} />
            </FormItem>

            <FormItem label="Countries (Multi-select)" className="md:col-span-2" invalid={!!formMethods.formState.errors.countries} errorMessage={formMethods.formState.errors.countries?.message as string}>
                <Controller
                    name="countries"
                    control={formMethods.control}
                    render={({ field }) => (
                        <Select
                            isMulti
                            placeholder="Select countries..."
                            options={ALL_AVAILABLE_COUNTRIES}
                            // The value for react-select (if it's your Select component) needs to be an array of option objects
                            value={ALL_AVAILABLE_COUNTRIES.filter(opt => field.value?.includes(opt.value))}
                            onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [])}
                        />
                    )}
                />
            </FormItem>
        </div>
    );


    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-4 sm:mb-0 flex items-center gap-2"><TbSettingsCog /> Number System Configuration</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New System</Button>
                    </div>
                    <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4">
                        <DataTable
                            columns={columns}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number}}
                            selectable
                            checkboxChecked={(row: NumberSystemItem) => selectedItems.some(selected => selected.id === row.id)}
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
                            <span>System{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected}>
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </StickyFooter>

            {/* Add/Edit Drawer */}
            <Drawer
                title={editingItem ? "Edit Number System" : "Add New Number System"}
                isOpen={isAddDrawerOpen || isEditDrawerOpen}
                onClose={editingItem ? closeEditDrawer : closeAddDrawer}
                onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
                width={700} // Increased width for more fields
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="numberSystemForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add System')}
                        </Button>
                    </div>
                }
            >
                <Form id="numberSystemForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {renderDrawerForm()}
                </Form>
            </Drawer>

            {/* Filter Drawer */}
            <Drawer
                title="Filter Number Systems"
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onRequestClose={() => setIsFilterDrawerOpen(false)}
                footer={
                     <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={() => setIsFilterDrawerOpen(false)} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="filterForm" type="submit">Apply Filters</Button>
                        </div>
                    </div>
                }
            >
                <Form id="filterForm" onSubmit={filterForm.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Countries">
                        <Controller name="filterCountries" control={filterForm.control} render={({ field }) => (
                            <Select
                                isMulti
                                placeholder="Select countries to filter by..."
                                options={ALL_AVAILABLE_COUNTRIES}
                                value={ALL_AVAILABLE_COUNTRIES.filter(opt => field.value?.includes(opt.value))}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [])}
                            />
                        )} />
                    </FormItem>
                    {/* Add other filters if needed, e.g., by KYC Prefix */}
                </Form>
            </Drawer>

            {/* Single Delete Confirmation */}
            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Number System"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                confirmButtonColor="red-600"
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>
                    Are you sure you want to delete the number system "<strong>{itemToDelete?.name}</strong>"?
                    This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    );
};

export default NumberSystems;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}