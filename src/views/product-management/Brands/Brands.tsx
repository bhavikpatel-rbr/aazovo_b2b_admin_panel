import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect,
} from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Avatar from '@/components/ui/Avatar'

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
import { Drawer, Form, FormItem, Input, Select as UiSelect, Tag } from '@/components/ui'

// Icons
import {
    TbPencil,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbCloudDownload,
    TbBuildingStore,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getBrandAction,
    addBrandAction,
    editBrandAction,
    deleteBrandAction,
    deleteAllBrandsAction,
    // changeBrandStatusAction,
} from '@/reduxtool/master/middleware'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { useSelector } from 'react-redux'

type ApiBrandItem = {
    id: number
    name: string
    slug: string
    icon: string | null
    show_header: string | number
    status: "Active" | "Inactive"
    meta_title: string | null
    meta_descr: string | null
    meta_keyword: string | null
    created_at: string
    updated_at: string
    mobile_no: string | null
    icon_full_path?: string
}

export type BrandStatus = 'active' | 'inactive';
export type BrandItem = {
    id: number
    name: string
    slug: string
    icon: string | null
    icon_full_path: string | null;
    showHeader: number // 0 or 1 (after transform)
    status: BrandStatus
    metaTitle: string | null
    metaDescription: string | null
    metaKeyword: string | null
    createdAt: string
    updatedAt: string
    mobileNo: string | null
}

const brandFormSchema = z.object({
    name: z.string().min(1, 'Brand name is required.').max(255, 'Name cannot exceed 255 chars.'),
    slug: z.string().min(1, 'Slug is required.').max(255, 'Slug cannot exceed 255 chars.'),
    mobile_no: z.string().optional().nullable(),
    icon: z.any().optional().nullable(),
    show_header: z.enum(['0', '1'], { errorMap: () => ({ message: "Please select if shown in header."}) })
                  .transform(val => Number(val)), // Input is '0' or '1', output is 0 or 1
    status: z.enum(['Active', 'Inactive'], { errorMap: () => ({ message: "Please select a status."}) }),
    meta_title: z.string().optional().nullable(),
    meta_descr: z.string().optional().nullable(),
    meta_keyword: z.string().optional().nullable(),
})
type BrandFormData = z.infer<typeof brandFormSchema> // show_header will be number here

const filterFormSchema = z.object({
    filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
})
type FilterFormData = z.infer<typeof filterFormSchema>

const CSV_HEADERS_BRAND = ['ID', 'Name', 'Slug', 'Icon URL', 'Show Header (1=Yes, 0=No)', 'Status', 'Meta Title', 'Mobile No.', 'Created At']
type BrandCsvItem = {
    id: number; name: string; slug: string; icon_full_path: string | null; showHeader: number;
    status: BrandStatus; metaTitle: string | null; mobileNo: string | null; createdAt: string;
};

function exportToCsvBrand(filename: string, rows: BrandItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    const transformedRows: BrandCsvItem[] = rows.map(item => ({
        id: item.id, name: item.name, slug: item.slug, icon_full_path: item.icon_full_path,
        showHeader: item.showHeader, status: item.status, metaTitle: item.metaTitle,
        mobileNo: item.mobileNo, createdAt: new Date(item.createdAt).toLocaleString(),
    }));
    const csvKeys: (keyof BrandCsvItem)[] = ['id', 'name', 'slug', 'icon_full_path', 'showHeader', 'status', 'metaTitle', 'mobileNo', 'createdAt'];
    const separator = ',';
    const csvContent = CSV_HEADERS_BRAND.join(separator) + '\n' + transformedRows.map(row => 
        csvKeys.map(k => {
            let cell = row[k];
            if (cell === null || cell === undefined) cell = '';
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
        }).join(separator)
    ).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url); link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}

const BRAND_ICON_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || 'https://your-api-domain.com/storage/';
const statusColor: Record<BrandStatus, string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
};
const uiStatusOptions: { value: BrandStatus; label: string }[] = [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
];
const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
    { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' },
];
const showHeaderOptions: { value: '1' | '0'; label: string }[] = [
    { value: '1', label: 'Yes' }, { value: '0', label: 'No' },
];

const ActionColumn = ({ onEdit, onClone, onChangeStatus, onDelete }: {
    onEdit: () => void; onClone: () => void; onChangeStatus: () => void; onDelete: () => void;
}) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip title="Clone Brand"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400')} role="button" onClick={onClone}><TbCopy /></div></Tooltip>
            <Tooltip title="Change Status"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400')} role="button" onClick={onChangeStatus}><TbSwitchHorizontal /></div></Tooltip>
            <Tooltip title="Edit Brand"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete Brand"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

type BrandSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement> }
const BrandSearch = React.forwardRef<HTMLInputElement, BrandSearchProps>(
    ({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Search brands..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />)
);
BrandSearch.displayName = 'BrandSearch';

const BrandTableTools = ({ onSearchChange, onFilter, onExport, onImport }: {
    onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onImport: () => void;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><BrandSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

type BrandTableProps = {
    columns: ColumnDef<BrandItem>[]; data: BrandItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: BrandItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: BrandItem) => void; onAllRowSelect: (checked: boolean, rows: Row<BrandItem>[]) => void;
}
const BrandTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: BrandTableProps) => (
    <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData}
        checkboxChecked={(row) => selectedItems.some(selected => selected.id === row.id)}
        onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
        onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} />
);

type BrandSelectedFooterProps = { selectedItems: BrandItem[]; onDeleteSelected: () => void; }
const BrandSelectedFooter = ({ selectedItems, onDeleteSelected }: BrandSelectedFooterProps) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <><StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
            <div className="flex items-center justify-between w-full px-4 sm:px-8">
                <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Brand{selectedItems.length > 1 ? 's' : ''} selected</span></span></span>
                <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)}>Delete Selected</Button></div>
            </div>
        </StickyFooter>
        <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Brand${selectedItems.length > 1 ? 's' : ''}`}
            onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}>
            <p>Are you sure you want to delete the selected brand{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
        </ConfirmDialog></>
    );
};

const Brands = () => {
    const dispatch = useAppDispatch();
    const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [isSubmitting, setSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<BrandItem | null>(null);
    const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
    const [brandForStatusChange, setBrandForStatusChange] = useState<BrandItem | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterNames: [], filterStatuses: [] });
    const { BrandData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector);

    useEffect(() => { dispatch(getBrandAction()) }, [dispatch]);

    // Default values for the form, matching Zod schema's pre-transform expectations
    const defaultBrandFormValues = {
        name: '', slug: '', mobile_no: '', icon: null,
        show_header: '1' as '0' | '1', // String '0' or '1' for z.enum
        status: 'Active' as 'Active' | 'Inactive', // String for z.enum
        meta_title: '', meta_descr: '', meta_keyword: '',
    };

    const addFormMethods = useForm<BrandFormData>({ resolver: zodResolver(brandFormSchema), defaultValues: defaultBrandFormValues, mode: 'onChange' });
    const editFormMethods = useForm<BrandFormData>({ resolver: zodResolver(brandFormSchema), defaultValues: defaultBrandFormValues, mode: 'onChange' });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

    const mappedBrands: BrandItem[] = useMemo(() => {
        if (!Array.isArray(BrandData)) return [];
        return BrandData.map((apiItem: ApiBrandItem) => {
            let fullPath: string | null = null;
            if (apiItem.icon_full_path) fullPath = apiItem.icon_full_path;
            else if (apiItem.icon) {
                if (apiItem.icon.startsWith('http://') || apiItem.icon.startsWith('https://')) fullPath = apiItem.icon;
                else fullPath = `${BRAND_ICON_BASE_URL}${apiItem.icon}`;
            }
            return {
                id: apiItem.id, name: apiItem.name, slug: apiItem.slug, icon: apiItem.icon, icon_full_path: fullPath,
                showHeader: Number(apiItem.show_header), status: apiItem.status === 'Active' ? 'active' : 'inactive',
                metaTitle: apiItem.meta_title, metaDescription: apiItem.meta_descr, metaKeyword: apiItem.meta_keyword,
                createdAt: apiItem.created_at, updatedAt: apiItem.updated_at, mobileNo: apiItem.mobile_no,
            };
        });
    }, [BrandData]);

    const openAddDrawer = () => { addFormMethods.reset(defaultBrandFormValues); setAddDrawerOpen(true); };
    const closeAddDrawer = () => { addFormMethods.reset(defaultBrandFormValues); setAddDrawerOpen(false); };
   
const onAddBrandSubmit = async (data: BrandFormData) => {
    console.log("Data from RHF (before FormData creation):", data);
    
    setSubmitting(true);
    const formData = new FormData(); // Create a new FormData object

    // Iterate over the validated data from react-hook-form
    (Object.keys(data) as Array<keyof BrandFormData>).forEach((key) => {
        const value = data[key];
        
        if (key === 'icon') {
            // Fix: Only append if value is a File object AND not null
            if (value instanceof File) {
                // Ensure we append as-is without wrapping in another object
                formData.append(key, value);
                console.log(`Appended File to FormData: key=${key}, name=${(value as File).name}`);
            }
            // Skip if value is null or not a File object
        } else if (value !== null && value !== undefined) {
            // For other fields, convert to string and append
            formData.append(key, String(value));
            console.log(`Appended to FormData: key=${key}, value=${String(value)}`);
        }
    });

    // For debugging: Log the FormData entries
    console.log("--- FormData Content for Submission (after appending) ---");
    for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
            console.log(pair[0] + ': ', `File(name: ${pair[1].name}, size: ${pair[1].size}, type: ${pair[1].type})`);
        } else {
            console.log(pair[0] + ': ', pair[1]); 
        }
    }
    console.log("------------------------------------");
    
    try {
        // Dispatch the action with the populated formData object
        await dispatch(addBrandAction(formData)).unwrap(); 
        toast.push(<Notification title="Brand Added" type="success" duration={2000}>Brand "{data.name}" added.</Notification>);
        closeAddDrawer(); 
        dispatch(getBrandAction());
    } catch (error: any) { 
        toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error.message || 'Could not add brand.'}</Notification>); 
        console.error('Add Brand Error:', error.response?.data || error.message || error);
    } 
    finally { setSubmitting(false); }
};

    const openEditDrawer = (brand: BrandItem) => {
        setEditingBrand(brand);
        editFormMethods.reset({
            name: brand.name, slug: brand.slug, mobile_no: brand.mobileNo || '', icon: null,
            show_header: String(brand.showHeader) as '0' | '1', // Ensure string for z.enum
            status: brand.status === 'active' ? 'Active' : 'Inactive',
            meta_title: brand.metaTitle || '', meta_descr: brand.metaDescription || '', meta_keyword: brand.metaKeyword || '',
        });
        setEditDrawerOpen(true);
    };
    const closeEditDrawer = () => { setEditingBrand(null); editFormMethods.reset(defaultBrandFormValues); setEditDrawerOpen(false); };
    const onEditBrandSubmit = async (data: BrandFormData) => {
        if (!editingBrand) return;
        setSubmitting(true);
        const formData = new FormData(); formData.append('_method', 'PUT');
        (Object.keys(data) as Array<keyof BrandFormData>).forEach((key) => {
            const value = data[key];
            if (key === 'icon' && value instanceof File) formData.append(key, value);
            else if (key !== 'icon' && value !== null && value !== undefined) formData.append(key, String(value));
        });
        try {
            await dispatch(editBrandAction({ id: editingBrand.id, data: formData })).unwrap();
            toast.push(<Notification title="Brand Updated" type="success" duration={2000}>Brand "{data.name}" updated.</Notification>);
            closeEditDrawer(); dispatch(getBrandAction());
        } catch (error: any) { toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error.message || 'Could not update brand.'}</Notification>); } 
        finally { setSubmitting(false); }
    };

    const handleDeleteClick = (brand: BrandItem) => { setBrandToDelete(brand); setSingleDeleteOpen(true); };
    const onConfirmSingleDelete = async () => {
        if (!brandToDelete) return;
        setIsProcessing(true); setSingleDeleteOpen(false);
        try {
            await dispatch(deleteBrandAction(brandToDelete.id)).unwrap();
            toast.push(<Notification title="Brand Deleted" type="success" duration={2000}>Brand "{brandToDelete.name}" deleted.</Notification>);
            setSelectedItems(prev => prev.filter(item => item.id !== brandToDelete!.id));
            dispatch(getBrandAction());
        } catch (error: any) { toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || `Could not delete brand.`}</Notification>); } 
        finally { setIsProcessing(false); setBrandToDelete(null); }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        setIsProcessing(true); const idsToDelete = selectedItems.map(item => item.id);
        try {
            await dispatch(deleteAllBrandsAction({ ids: idsToDelete.join(',') })).unwrap();
            toast.push(<Notification title="Brands Deleted" type="success" duration={2000}>{selectedItems.length} brand(s) deleted.</Notification>);
        } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || 'Failed to delete selected brands.'}</Notification>); } 
        finally { setSelectedItems([]); dispatch(getBrandAction()); setIsProcessing(false); }
    };

    const openChangeStatusDialog = (brand: BrandItem) => { setBrandForStatusChange(brand); setStatusChangeConfirmOpen(true); };
    const onConfirmChangeStatus = async () => {
        if (!brandForStatusChange) return;
        setIsProcessing(true); setStatusChangeConfirmOpen(false);
        const newApiStatus = brandForStatusChange.status === 'active' ? 'Inactive' : 'Active';
        try {
            // await dispatch(changeBrandStatusAction({ id: brandForStatusChange.id, status: newApiStatus })).unwrap();
            toast.push(<Notification title="Status Updated" type="success" duration={2000}>Brand "{brandForStatusChange.name}" status updated.</Notification>);
            dispatch(getBrandAction());
        } catch (error: any) { toast.push(<Notification title="Status Update Failed" type="danger" duration={3000}>{error.message || 'Could not update status.'}</Notification>); } 
        finally { setIsProcessing(false); setBrandForStatusChange(null); }
    };

    const handleClone = (brand: BrandItem) => { toast.push(<Notification title="Clone Brand" type="info">Cloning "{brand.name}"... (Clone logic to be implemented)</Notification>); };
    const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); };
    const closeFilterDrawer = () => setFilterDrawerOpen(false);
    const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria({ filterNames: data.filterNames || [], filterStatuses: data.filterStatuses || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };
    const onClearFilters = () => { const defaultFilters = { filterNames: [], filterStatuses: [] }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); handleSetTableData({ pageIndex: 1 }); };

    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<BrandItem[]>([]);
    const brandNameOptions = useMemo(() => {
        if (!Array.isArray(mappedBrands)) return [];
        const uniqueNames = new Set(mappedBrands.map(brand => brand.name));
        return Array.from(uniqueNames).map(name => ({ value: name, label: name }));
    }, [mappedBrands]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: BrandItem[] = cloneDeep(mappedBrands);
        if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) { const selectedNames = filterCriteria.filterNames.map(opt => opt.value.toLowerCase()); processedData = processedData.filter(item => selectedNames.includes(item.name.toLowerCase())); }
        if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) { const selectedStatuses = filterCriteria.filterStatuses.map(opt => opt.value); processedData = processedData.filter(item => selectedStatuses.includes(item.status)); }
        if (tableData.query && tableData.query.trim() !== '') { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => item.name?.toLowerCase().includes(query) || item.slug?.toLowerCase().includes(query) || String(item.id).toLowerCase().includes(query) || item.mobileNo?.toLowerCase().includes(query) || item.status.toLowerCase().includes(query)); }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                let aValue = a[key as keyof BrandItem]; let bValue = b[key as keyof BrandItem];
                if (key === 'createdAt' || key === 'updatedAt') { aValue = new Date(aValue as string).getTime(); bValue = new Date(bValue as string).getTime(); } 
                else if (key === 'id' || key === 'showHeader') { aValue = Number(aValue); bValue = Number(bValue); }
                if (aValue === null || aValue === undefined) aValue = '' as any; if (bValue === null || bValue === undefined) bValue = '' as any;
                if (typeof aValue === 'string' && typeof bValue === 'string') return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                else if (typeof aValue === 'number' && typeof bValue === 'number') return order === 'asc' ? aValue - bValue : bValue - aValue;
                return 0;
            });
            processedData = sortedData;
        }
        const dataToExport = [...processedData]; const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [mappedBrands, tableData, filterCriteria]);

    const handleExportData = () => { const success = exportToCsvBrand('brands_export.csv', allFilteredAndSortedData); if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>); };
    const handleImportData = () => { setImportDialogOpen(true); };
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: BrandItem) => setSelectedItems(prev => checked ? (prev.some(item => item.id === row.id) ? prev : [...prev, row]) : prev.filter(item => item.id !== row.id)), []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<BrandItem>[]) => {
        const originals = currentRows.map(r => r.original);
        if (checked) setSelectedItems(prev => { const prevIds = new Set(prev.map(item => item.id)); return [...prev, ...originals.filter(r => !prevIds.has(r.id))]; });
        else { const currentIds = new Set(originals.map(r => r.id)); setSelectedItems(prev => prev.filter(item => !currentIds.has(item.id))); }
    }, []);

    const columns: ColumnDef<BrandItem>[] = useMemo(() => [
        { header: 'ID', accessorKey: 'id', enableSorting: true, size: 60 },
        { header: 'Brand', accessorKey: 'name', enableSorting: true, cell: props => { const { icon_full_path, name } = props.row.original; return (<div className="flex items-center gap-2 min-w-[200px]"><Avatar size={30} shape="circle" src={icon_full_path || undefined} icon={<TbBuildingStore />}>{!icon_full_path && name ? name.charAt(0).toUpperCase() : ''}</Avatar><span>{name}</span></div>); }},
        { header: 'Mobile No', accessorKey: 'mobileNo', enableSorting: true, cell: props => props.row.original.mobileNo ?? '-' },
        { header: 'Status', accessorKey: 'status', enableSorting: true, cell: props => { const status = props.row.original.status; return <Tag className={`${statusColor[status]} capitalize font-semibold border-0`}>{status}</Tag>; }},
        { header: 'Actions', id: 'action', meta: { HeaderClass: 'text-center' }, cell: props => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onClone={() => handleClone(props.row.original)} onChangeStatus={() => openChangeStatusDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />},
    ], [mappedBrands]); // Dependencies ensure columns refresh if these functions change identity

    const tableLoading = masterLoadingStatus === 'loading' || isSubmitting || isProcessing;

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Brands</h5>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Brand</Button>
                    </div>
                    <BrandTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onImport={handleImportData} />
                    <div className="mt-4 flex-grow overflow-y-auto">
                        <BrandTable columns={columns} data={pageData} loading={tableLoading}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            selectedItems={selectedItems}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort}
                            onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
                    </div>
                </AdaptiveCard>
            </Container>
            <BrandSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            <Drawer title="Add Brand" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button>
                        <Button size="sm" variant="solid" form="addBrandForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Save'}
                        </Button>
                    </div>
                }>
                {/* DEBUG: Log errors to see why form might be invalid */}
                {/* {console.log("Add Form Errors:", addFormMethods.formState.errors)} */}
                {/* {console.log("Add Form Values:", addFormMethods.watch())} */}
                <Form id="addBrandForm" onSubmit={addFormMethods.handleSubmit(onAddBrandSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Brand Name" invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message}><Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Brand Name" />} /></FormItem>
                    <FormItem label="Slug/URL" invalid={!!addFormMethods.formState.errors.slug} errorMessage={addFormMethods.formState.errors.slug?.message}><Controller name="slug" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter brand-slug" />} /></FormItem>
                    <FormItem label="Mobile No." invalid={!!addFormMethods.formState.errors.mobile_no} errorMessage={addFormMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Mobile Number" />} /></FormItem>
                   <FormItem 
    label="Icon" 
    invalid={!!addFormMethods.formState.errors.icon} 
    errorMessage={addFormMethods.formState.errors.icon?.message as string}
>
    <Controller 
        name="icon" 
        control={addFormMethods.control} 
        render={({ field }) => ( // Destructure field directly
            <Input 
                type="file" 
                name={field.name} // Pass RHF's name
                onBlur={field.onBlur} // Pass RHF's onBlur
                ref={field.ref} // Pass RHF's ref for focus management etc.
                // CRITICAL: The onChange handler
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
                    console.log("file",file);
                    
                    field.onChange(file); // This updates react-hook-form's state for 'icon'
                }}
                // DO NOT pass 'value' from 'field' to a file input.
                // It's uncontrolled in terms of its value property.
            />
        )} 
    />
</FormItem>
                    <FormItem label="Show in Header?" invalid={!!addFormMethods.formState.errors.show_header} errorMessage={addFormMethods.formState.errors.show_header?.message}>
                        <Controller name="show_header" control={addFormMethods.control} render={({ field }) => (
                            <UiSelect options={showHeaderOptions} 
                                      value={showHeaderOptions.find(opt => opt.value === field.value)} // field.value should be '0' or '1' here
                                      onChange={opt => field.onChange(opt ? opt.value : undefined)} /> // Pass string '0' or '1'
                        )} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message}>
                        <Controller name="status" control={addFormMethods.control} render={({ field }) => (
                            <UiSelect options={apiStatusOptions} 
                                      value={apiStatusOptions.find(opt => opt.value === field.value)} 
                                      onChange={opt => field.onChange(opt ? opt.value : undefined)} />
                        )} />
                    </FormItem>
                    <h6 className="text-sm font-medium mt-2">Meta Options</h6>
                    <FormItem label="Meta Title" invalid={!!addFormMethods.formState.errors.meta_title} errorMessage={addFormMethods.formState.errors.meta_title?.message}><Controller name="meta_title" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Meta Title" />} /></FormItem>
                    <FormItem label="Meta Description" invalid={!!addFormMethods.formState.errors.meta_descr} errorMessage={addFormMethods.formState.errors.meta_descr?.message}><Controller name="meta_descr" control={addFormMethods.control} render={({ field }) => <Input {...field} textArea placeholder="Meta Description" />} /></FormItem>
                    <FormItem label="Meta Keywords" invalid={!!addFormMethods.formState.errors.meta_keyword} errorMessage={addFormMethods.formState.errors.meta_keyword?.message}><Controller name="meta_keyword" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Meta Keywords (comma-separated)" />} /></FormItem>
                </Form>
            </Drawer>

            <Drawer title="Edit Brand" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button>
                        <Button size="sm" variant="solid" form="editBrandForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }>
                {/* DEBUG: Log errors to see why form might be invalid */}
                {/* {console.log("Edit Form Errors:", editFormMethods.formState.errors)} */}
                {/* {console.log("Edit Form Values:", editFormMethods.watch())} */}
                <Form id="editBrandForm" onSubmit={editFormMethods.handleSubmit(onEditBrandSubmit)} className="flex flex-col gap-4">
                    {editingBrand?.icon_full_path && <FormItem label="Current Icon"><Avatar size={80} src={editingBrand.icon_full_path} shape="rounded" icon={<TbBuildingStore />} /></FormItem>}
                    <FormItem label="Brand Name" invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message}><Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
                    <FormItem label="Slug/URL" invalid={!!editFormMethods.formState.errors.slug} errorMessage={editFormMethods.formState.errors.slug?.message}><Controller name="slug" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
                    <FormItem label="Mobile No." invalid={!!editFormMethods.formState.errors.mobile_no} errorMessage={editFormMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
                    <FormItem label="New Icon (Optional)" invalid={!!editFormMethods.formState.errors.icon} errorMessage={editFormMethods.formState.errors.icon?.message as string}><Controller name="icon" control={editFormMethods.control} render={({ field: { onChange, value, ...rest } }) => <Input type="file" {...rest} onChange={e => onChange(e.target.files ? e.target.files[0] : null)} />} /><p className="text-xs text-gray-500 mt-1">Leave blank to keep current icon.</p></FormItem>
                    <FormItem label="Show in Header?" invalid={!!editFormMethods.formState.errors.show_header} errorMessage={editFormMethods.formState.errors.show_header?.message}>
                        <Controller name="show_header" control={editFormMethods.control} render={({ field }) => (
                             <UiSelect options={showHeaderOptions} 
                                       value={showHeaderOptions.find(opt => opt.value === field.value )} // field.value should be '0' or '1'
                                       onChange={opt => field.onChange(opt ? opt.value : undefined)} />
                        )} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message}>
                        <Controller name="status" control={editFormMethods.control} render={({ field }) => (
                            <UiSelect options={apiStatusOptions} 
                                      value={apiStatusOptions.find(opt => opt.value === field.value)} 
                                      onChange={opt => field.onChange(opt ? opt.value : undefined)} />
                        )} />
                    </FormItem>
                    <h6 className="text-sm font-medium mt-2">Meta Options</h6>
                    <FormItem label="Meta Title" invalid={!!editFormMethods.formState.errors.meta_title} errorMessage={editFormMethods.formState.errors.meta_title?.message}><Controller name="meta_title" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
                    <FormItem label="Meta Description" invalid={!!editFormMethods.formState.errors.meta_descr} errorMessage={editFormMethods.formState.errors.meta_descr?.message}><Controller name="meta_descr" control={editFormMethods.control} render={({ field }) => <Input {...field} textArea />} /></FormItem>
                    <FormItem label="Meta Keywords" invalid={!!editFormMethods.formState.errors.meta_keyword} errorMessage={editFormMethods.formState.errors.meta_keyword?.message}><Controller name="meta_keyword" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
                </Form>
            </Drawer>

            <Drawer title="Filter Brands" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterBrandForm" type="submit">Apply</Button></div>}>
                <Form id="filterBrandForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Name(s)"><Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select names..." options={brandNameOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                    <FormItem label="Filter by Status(es)"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select statuses..." options={uiStatusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={singleDeleteOpen} type="danger" title="Delete Brand" onClose={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }} onRequestClose={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }} onCancel={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isProcessing}><p>Are you sure you want to delete the brand "<strong>{brandToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>
            <ConfirmDialog isOpen={statusChangeConfirmOpen} type="warning" title="Change Brand Status" onClose={() => { setStatusChangeConfirmOpen(false); setBrandForStatusChange(null); }} onRequestClose={() => { setStatusChangeConfirmOpen(false); setBrandForStatusChange(null); }} onCancel={() => { setStatusChangeConfirmOpen(false); setBrandForStatusChange(null); }} confirmButtonColor="amber-600" onConfirm={onConfirmChangeStatus} loading={isProcessing}><p>Are you sure you want to change the status for "<strong>{brandForStatusChange?.name}</strong>" to <strong>{brandForStatusChange?.status === 'active' ? 'Inactive' : 'Active'}</strong>?</p></ConfirmDialog>
            <Drawer title="Import Brands" isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} onRequestClose={() => setImportDialogOpen(false)}>
                 <div className="p-4"><p className="mb-4">Upload a CSV file to import brands. Ensure the CSV format matches the export structure.</p><Input type="file" accept=".csv" className="mt-2" onChange={(e) => { if (e.target.files && e.target.files[0]) { console.log("File selected for import:", e.target.files[0].name); toast.push(<Notification title="Import" type="info">File selected. Import processing to be implemented.</Notification>)}}} /><div className="text-right mt-6"><Button size="sm" variant="plain" onClick={() => setImportDialogOpen(false)} className="mr-2">Cancel</Button><Button size="sm" variant="solid" onClick={() => { toast.push(<Notification title="Import" type="info">Import submission to be implemented.</Notification>)}}>Start Import</Button></div></div>
            </Drawer>
        </>
    );
};
export default Brands;
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' '); }