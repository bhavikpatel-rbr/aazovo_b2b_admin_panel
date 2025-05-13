// src/views/your-path/Products.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect, Suspense, lazy } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate for add/edit navigation if not using drawers
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs'; // For any date handling if needed in future

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Avatar from '@/components/ui/Avatar';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import { Drawer, Form, FormItem, Input, Select as UiSelect } from '@/components/ui'; // Added Textarea

// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbCloudUpload, TbFilter, TbPlus, TbBox,
    TbSwitchHorizontal, TbCopy, TbCloudDownload
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row, CellContext } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import Textarea from '@/views/ui-components/forms/Input/Textarea';
import InputNumber from '@/components/ui/Input/InputNumber';

// --- Define Product Types ---
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived' | string; // Allow other strings for flexibility

export type ProductItem = {
    id: string;
    status: ProductStatus;
    name: string;
    sku: string;
    categoryName: string;
    subcategoryName: string | null;
    brandName: string;
    image: string | null;
    description?: string | null; // Added for form
    price?: number | null;      // Added for form
    stock?: number | null;       // Added for form
    // Add other relevant product fields
};

// --- Zod Schema for Add/Edit Product Form ---
const productFormSchema = z.object({
    name: z.string().min(1, 'Product name is required.').max(100, 'Name too long.'),
    sku: z.string().min(1, 'SKU is required.').max(50, 'SKU too long.'),
    status: z.string().min(1, 'Status is required.'), // Will be a select
    categoryName: z.string().min(1, 'Category is required.').max(50, 'Category name too long.'),
    subcategoryName: z.string().max(50, 'Subcategory name too long.').nullable().optional(),
    brandName: z.string().min(1, 'Brand is required.').max(50, 'Brand name too long.'),
    image: z.string().url("Must be a valid URL for image.").nullable().optional(),
    description: z.string().nullable().optional(),
    price: z.number().min(0, "Price must be positive.").nullable().optional(),
    stock: z.number().int("Stock must be an integer.").min(0, "Stock must be positive.").nullable().optional(),
});
type ProductFormData = z.infer<typeof productFormSchema>;

// --- Zod Schema for Filter Form ---
const selectOptionSchema = z.object({ value: z.string(), label: z.string() });
const filterFormSchema = z.object({
    filterNameOrSku: z.string().optional().default(''),
    filterCategories: z.array(selectOptionSchema).optional().default([]),
    filterBrands: z.array(selectOptionSchema).optional().default([]),
    filterStatuses: z.array(selectOptionSchema).optional().default([]), // For general status filtering
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Constants ---
const statusColor: Record<ProductStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
    draft: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-100',
};
const productStatusOptions = Object.keys(statusColor).map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

const TABS = {
    ALL: 'all',
    DRAFT: 'draft', // Renamed from PENDING to match 'draft' status
};

// --- Initial Dummy Products ---
const initialDummyProducts: ProductItem[] = [
    { id: 'PROD001', status: 'active', name: 'Smartphone X', sku: 'SPX-1000', categoryName: 'Electronics', subcategoryName: 'Mobile Phones', brandName: 'Alpha Gadgets', image: '/img/products/phone_x.jpg', price: 799, stock: 150, description: 'Latest model with AI camera.' },
    { id: 'PROD002', status: 'active', name: 'Laptop Pro 15"', sku: 'LPP-15-G2', categoryName: 'Electronics', subcategoryName: 'Laptops', brandName: 'Beta Solutions', image: '/img/products/laptop_pro.jpg', price: 1499, stock: 75 },
    { id: 'PROD003', status: 'draft', name: 'Wireless Earbuds V2', sku: 'WEB-002', categoryName: 'Electronics', subcategoryName: 'Accessories', brandName: 'Alpha Gadgets', image: null, price: 99, stock: 0, description: 'New version with improved battery.' },
    { id: 'PROD004', status: 'active', name: "Men's Casual T-Shirt", sku: 'MCT-BL-L', categoryName: 'Clothing', subcategoryName: "Men's Wear", brandName: 'Gamma Apparel', image: '/img/products/tshirt_men.jpg', price: 25, stock: 300 },
    { id: 'PROD005', status: 'inactive', name: "Women's Running Shoes", sku: 'WRS-PNK-8', categoryName: 'Clothing', subcategoryName: 'Shoes', brandName: 'Eta Fitness', image: '/img/products/shoes_women.jpg', price: 89, stock: 0 },
    { id: 'PROD006', status: 'active', name: 'Organic Coffee Beans 1kg', sku: 'OCB-1KG', categoryName: 'Groceries', subcategoryName: 'Beverages', brandName: 'Delta Foods', image: null, price: 15, stock: 200 },
    { id: 'PROD007', status: 'archived', name: 'Old Model TV 42"', sku: 'TV-OLD-42', categoryName: 'Home Appliances', subcategoryName: 'Televisions', brandName: 'Epsilon Home', image: '/img/products/tv_old.jpg', price: 250, stock: 0 },
];


// --- CSV Exporter Utility ---
const CSV_PRODUCT_HEADERS = ['ID', 'Name', 'SKU', 'Status', 'Category', 'Subcategory', 'Brand', 'Price', 'Stock', 'Image URL', 'Description'];
const CSV_PRODUCT_KEYS: (keyof ProductItem)[] = ['id', 'name', 'sku', 'status', 'categoryName', 'subcategoryName', 'brandName', 'price', 'stock', 'image', 'description'];

function exportProductsToCsv(filename: string, rows: ProductItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
    const separator = ',';
    const csvContent = CSV_PRODUCT_HEADERS.join(separator) + '\n' + rows.map(row => {
        return CSV_PRODUCT_KEYS.map(k => {
            let cell = row[k];
            if (cell === null || cell === undefined) cell = '';
            else if (typeof cell === 'number') cell = cell.toString();
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
        }).join(separator);
    }).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}


// --- ActionColumn, Search, TableTools, DataTable, SelectedFooter (Adapted for Products) ---
const ActionColumn = ({ onEdit, onDelete, onChangeStatus, onClone }: {
    onEdit: () => void; onDelete: () => void; onChangeStatus: () => void; onClone: () => void;
}) => {
    const iconBtnClass = "text-lg p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";
    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip title="Edit"><Button shape="circle" variant="plain" size="sm" icon={<TbPencil />} onClick={onEdit} className={`${iconBtnClass} hover:text-blue-500`}/></Tooltip>
            <Tooltip title="Change Status"><Button shape="circle" variant="plain" size="sm" icon={<TbSwitchHorizontal />} onClick={onChangeStatus} className={`${iconBtnClass} hover:text-amber-500`}/></Tooltip>
            <Tooltip title="Clone"><Button shape="circle" variant="plain" size="sm" icon={<TbCopy />} onClick={onClone} className={`${iconBtnClass} hover:text-purple-500`}/></Tooltip>
            <Tooltip title="Delete"><Button shape="circle" variant="plain" size="sm" icon={<TbTrash />} onClick={onDelete} className={`${iconBtnClass} hover:text-red-500`}/></Tooltip>
        </div>
    );
};

type ProductSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement> };
const ProductSearch = React.forwardRef<HTMLInputElement, ProductSearchProps>(
    ({ onInputChange }, ref) => <DebouceInput ref={ref} className="w-full" placeholder="Search products (Name, SKU, Category)..." suffix={<TbSearch />} onChange={e => onInputChange(e.target.value)} />
);
ProductSearch.displayName = 'ProductSearch';

const ProductTableTools = ({ onSearchChange, onFilter, onExport, onAddNew }: {
    onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; onAddNew: () => void;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><ProductSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Add New Button moved to header */}
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

type ProductTableProps = {
    columns: ColumnDef<ProductItem>[]; data: ProductItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: ProductItem[]; // Changed from selectedProducts
    onPaginationChange: (p: number) => void; onSelectChange: (v: number) => void;
    onSort: (s: OnSortParam) => void;
    onRowSelect: (c: boolean, r: ProductItem) => void; onAllRowSelect: (c: boolean, rs: Row<ProductItem>[]) => void;
};
const ProductTable = (props: ProductTableProps) => (
    <DataTable selectable columns={props.columns} data={props.data} loading={props.loading} pagingData={props.pagingData}
        checkboxChecked={(row) => props.selectedItems.some(s => s.id === row.id)}
        onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange}
        onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect}
        noData={!props.loading && props.data.length === 0}
    />
);

type ProductSelectedFooterProps = { selectedItems: ProductItem[]; onDeleteSelected: () => void; };
const ProductSelectedFooter = ({ selectedItems, onDeleteSelected }: ProductSelectedFooterProps) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t px-8">
                <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedItems.length} product{selectedItems.length > 1 ? 's' : ''} selected</span></span>
                    <Button size="sm" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => setDeleteOpen(true)}>Delete Selected</Button>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} products?`}
                onClose={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}
                onCancel={() => setDeleteOpen(false)}>
                <p>This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};


// --- Main Products Component ---
const Products = () => {
    const [allProducts, setAllProducts] = useState<ProductItem[]>(initialDummyProducts);
    const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');

    const dispatchSimulated = useCallback(async (action: { type: string; payload?: any }) => {
        setLoadingStatus('loading');
        await new Promise(res => setTimeout(res, 300));
        try {
            switch (action.type) {
                case 'products/get': setAllProducts(initialDummyProducts); break;
                case 'products/add':
                    const newProduct: ProductItem = { ...action.payload, id: `PROD${Date.now()}` };
                    setAllProducts(prev => [newProduct, ...prev]);
                    break;
                case 'products/edit':
                    setAllProducts(prev => prev.map(p => p.id === action.payload.id ? { ...p, ...action.payload.data } : p));
                    break;
                case 'products/delete':
                    setAllProducts(prev => prev.filter(p => p.id !== action.payload.id));
                    break;
                case 'products/deleteAll':
                    const idsToDelete = new Set((action.payload.ids as string).split(','));
                    setAllProducts(prev => prev.filter(p => !idsToDelete.has(p.id)));
                    break;
                case 'products/changeStatus':
                     setAllProducts(prev => prev.map(p => p.id === action.payload.id ? { ...p, status: action.payload.newStatus } : p));
                    break;
                default: console.warn('Unknown action');
            }
            setLoadingStatus('succeeded');
            return { unwrap: () => Promise.resolve() };
        } catch (e) { setLoadingStatus('failed'); return { unwrap: () => Promise.reject(e) }; }
    }, []);

    useEffect(() => { dispatchSimulated({ type: 'products/get' }); }, [dispatchSimulated]);

    const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);

    const [currentTab, setCurrentTab] = useState<string>(TABS.ALL);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: 'asc', key: 'name' }, query: '',
    });
    const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]); // Renamed from selectedProducts

    const formMethods = useForm<ProductFormData>({ resolver: zodResolver(productFormSchema) });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

    const openAddDrawer = useCallback(() => {
        setEditingProduct(null);
        formMethods.reset({ // Default values for ProductFormData
            name: '', sku: '', status: productStatusOptions[0]?.value || 'draft', categoryName: '',
            subcategoryName: null, brandName: '', image: null, description: null, price: null, stock: null,
        });
        setIsAddEditDrawerOpen(true);
    }, [formMethods]);

    const openEditDrawer = useCallback((product: ProductItem) => {
        setEditingProduct(product);
        formMethods.reset(product); // ProductItem fields match ProductFormData for simplicity here
        setIsAddEditDrawerOpen(true);
    }, [formMethods]);

    const closeAddEditDrawer = useCallback(() => { setIsAddEditDrawerOpen(false); setEditingProduct(null); }, []);

    const onFormSubmit = useCallback(async (data: ProductFormData) => {
        setIsSubmitting(true);
        try {
            if (editingProduct) {
                await dispatchSimulated({ type: 'products/edit', payload: { id: editingProduct.id, data } }).unwrap();
                toast.push(<Notification title="Success" type="success">Product updated.</Notification>);
            } else {
                await dispatchSimulated({ type: 'products/add', payload: data }).unwrap();
                toast.push(<Notification title="Success" type="success">Product added.</Notification>);
            }
            closeAddEditDrawer();
        } catch (error: any) { toast.push(<Notification title="Error" type="danger">{error.message || "Operation failed."}</Notification>); }
        finally { setIsSubmitting(false); }
    }, [dispatchSimulated, editingProduct, closeAddEditDrawer]);

    const handleDeleteClick = useCallback((item: ProductItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false);
        try {
            await dispatchSimulated({ type: 'products/delete', payload: { id: itemToDelete.id } }).unwrap();
            toast.push(<Notification title="Deleted" type="success">Product deleted.</Notification>);
            setSelectedItems((prev) => prev.filter(i => i.id !== itemToDelete.id));
        } catch (e:any) { toast.push(<Notification title="Error" type="danger">{e.message || "Delete failed."}</Notification>); }
        finally { setIsDeleting(false); setItemToDelete(null); }
    }, [dispatchSimulated, itemToDelete]);

    const onDeleteSelected = useCallback(async () => {
        if(selectedItems.length === 0) return; setIsDeleting(true);
        const ids = selectedItems.map(item => item.id).join(',');
        try {
            await dispatchSimulated({ type: 'products/deleteAll', payload: { ids } }).unwrap();
            toast.push(<Notification title="Success" type="success">{selectedItems.length} products deleted.</Notification>);
            setSelectedItems([]);
        } catch (e:any) { toast.push(<Notification title="Error" type="danger">{e.message || "Bulk delete failed."}</Notification>); }
        finally { setIsDeleting(false); }
    }, [dispatchSimulated, selectedItems]);

    const handleChangeStatus = useCallback(async (product: ProductItem) => {
        const statusesCycle: ProductStatus[] = ['active', 'inactive', 'draft', 'archived'];
        const currentIndex = statusesCycle.indexOf(product.status);
        const newStatus = statusesCycle[(currentIndex + 1) % statusesCycle.length];
        setIsSubmitting(true);
        try {
            await dispatchSimulated({ type: 'products/changeStatus', payload: { id: product.id, newStatus } }).unwrap();
            toast.push(<Notification title="Status Updated" type="success">{`Product status changed to ${newStatus}.`}</Notification>);
        } catch (e:any) { toast.push(<Notification title="Error" type="danger">Status update failed.</Notification>); }
        finally { setIsSubmitting(false); }
    }, [dispatchSimulated]);

    const handleClone = useCallback((productToClone: ProductItem) => {
        const newProduct: ProductItem = {
            ...cloneDeep(productToClone),
            id: `PROD-CLONE-${Date.now()}`,
            sku: `${productToClone.sku}-CLONE`,
            name: `${productToClone.name} (Copy)`,
            status: 'draft',
        };
        dispatchSimulated({ type: 'products/add', payload: newProduct }); // Simulate adding cloned product
        toast.push(<Notification title="Cloned" type="info">Product cloned as a new draft.</Notification>);
    }, [dispatchSimulated]);

    const handleTabChange = useCallback((tabKey: string) => {
        setCurrentTab(tabKey);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        setSelectedItems([]);
    }, []);

    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
    const onClearFilters = useCallback(() => { const defaults = filterFormSchema.parse({}); filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

    // Filter options
    const categoryOptions = useMemo(() => [...new Set(allProducts.map(p => p.categoryName))].sort().map(c => ({value: c, label: c})), [allProducts]);
    const brandOptions = useMemo(() => [...new Set(allProducts.map(p => p.brandName))].sort().map(b => ({value: b, label: b})), [allProducts]);


    type ProcessedDataType = { pageData: ProductItem[]; total: number; allFilteredAndSortedData: ProductItem[]; };
    const { pageData, total, allFilteredAndSortedData } = useMemo((): ProcessedDataType => {
        let processedData: ProductItem[] = cloneDeep(allProducts);

        if (currentTab === TABS.DRAFT) {
            processedData = processedData.filter(p => p.status === 'draft');
        }

        if (filterCriteria.filterNameOrSku && filterCriteria.filterNameOrSku.trim() !== '') {
            const query = filterCriteria.filterNameOrSku.toLowerCase().trim();
            processedData = processedData.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
        }
        if (filterCriteria.filterCategories && filterCriteria.filterCategories.length > 0) {
            const cats = new Set(filterCriteria.filterCategories.map(opt => opt.value));
            processedData = processedData.filter(p => cats.has(p.categoryName));
        }
        if (filterCriteria.filterBrands && filterCriteria.filterBrands.length > 0) {
            const brands = new Set(filterCriteria.filterBrands.map(opt => opt.value));
            processedData = processedData.filter(p => brands.has(p.brandName));
        }
        if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) {
            const statuses = new Set(filterCriteria.filterStatuses.map(opt => opt.value));
            processedData = processedData.filter(p => statuses.has(p.status));
        }


        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.id.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query) ||
                item.sku.toLowerCase().includes(query) ||
                item.categoryName.toLowerCase().includes(query) ||
                (item.subcategoryName && item.subcategoryName.toLowerCase().includes(query)) ||
                item.brandName.toLowerCase().includes(query) ||
                item.status.toLowerCase().includes(query)
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                let aVal = a[key as keyof ProductItem];
                let bVal = b[key as keyof ProductItem];
                if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal;
                return order === 'asc' ? String(aVal ?? '').localeCompare(String(bVal ?? '')) : String(bVal ?? '').localeCompare(String(aVal ?? ''));
            });
        }
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [allProducts, tableData, filterCriteria, currentTab]);

    const handleExportData = useCallback(() => exportProductsToCsv('products_export.csv', allFilteredAndSortedData), [allFilteredAndSortedData]);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: ProductItem) => setSelectedItems(prev => checked ? (prev.some(i => i.id === row.id) ? prev : [...prev, row]) : prev.filter(i => i.id !== row.id)), []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<ProductItem>[]) => {
        const originals = currentRows.map(r => r.original);
        if (checked) setSelectedItems(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))]; });
        else { const currentIds = new Set(originals.map(o => o.id)); setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id))); }
    }, []);


    const columns: ColumnDef<ProductItem>[] = useMemo(() => [
        { header: 'Product', id:'product', size: 300, cell: (props: CellContext<ProductItem, any>) => (
            <div className="flex items-center gap-2">
                <Avatar size="lg" shape="rounded" src={props.row.original.image || undefined} icon={<TbBox/>} />
                <div>
                    <span className="font-semibold">{props.row.original.name}</span>
                    <div className="text-xs text-gray-500">SKU: {props.row.original.sku}</div>
                </div>
            </div>
        )},
        { header: 'Category', accessorKey: 'categoryName', size: 150 },
        { header: 'Brand', accessorKey: 'brandName', size: 150 },
        { header: 'Stock', accessorKey: 'stock', size: 100, cell: (props: CellContext<ProductItem, any>) => props.row.original.stock ?? '-' },
        { header: 'Price', accessorKey: 'price', size: 100, cell: (props: CellContext<ProductItem, any>) => props.row.original.price !== null ? `$${props.row.original.price?.toFixed(2)}` : '-' },
        { header: 'Status', accessorKey: 'status', size: 120, cell: (props: CellContext<ProductItem, any>) => <Tag className={`${statusColor[props.row.original.status] || 'bg-gray-200'} capitalize`}>{props.row.original.status}</Tag> },
        { header: 'Actions', id: 'actions', size: 150, meta: {HeaderClass: 'text-center'}, cell: (props: CellContext<ProductItem, any>) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onChangeStatus={() => handleChangeStatus(props.row.original)} onClone={() => handleClone(props.row.original)} /> },
    ], [openEditDrawer, handleDeleteClick, handleChangeStatus, handleClone]);

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Products</h5>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Product</Button>
                    </div>
                     <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => handleTabChange(TABS.ALL)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${currentTab === TABS.ALL ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>All Products</button>
                            <button onClick={() => handleTabChange(TABS.DRAFT)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${currentTab === TABS.DRAFT ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Draft Products</button>
                        </nav>
                    </div>
                    <ProductTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onAddNew={openAddDrawer} />
                    <div className="mt-4">
                        <ProductTable columns={columns} data={pageData} loading={loadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange}
                            onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>
            <ProductSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelected} />

            <Drawer
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                isOpen={isAddEditDrawerOpen}
                onClose={closeAddEditDrawer}
                onRequestClose={closeAddEditDrawer}
                width={600}
                
            >
                <Form id="productForm" onSubmit={formMethods.handleSubmit(onFormSubmit)} className="flex flex-col gap-y-3 h-full">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 overflow-y-auto p-1">
                        <FormItem label="Product Name" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}>
                            <Controller name="name" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Enter product name" />} />
                        </FormItem>
                        <FormItem label="SKU" invalid={!!formMethods.formState.errors.sku} errorMessage={formMethods.formState.errors.sku?.message}>
                            <Controller name="sku" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Enter SKU" />} />
                        </FormItem>
                        <FormItem label="Status" invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}>
                            <Controller name="status" control={formMethods.control} render={({ field }) => (<UiSelect options={productStatusOptions} value={productStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select status" /> )} />
                        </FormItem>
                        <FormItem label="Category" invalid={!!formMethods.formState.errors.categoryName} errorMessage={formMethods.formState.errors.categoryName?.message}>
                            <Controller name="categoryName" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Enter category" />} />
                        </FormItem>
                        <FormItem label="Subcategory (Optional)" invalid={!!formMethods.formState.errors.subcategoryName} errorMessage={formMethods.formState.errors.subcategoryName?.message}>
                            <Controller name="subcategoryName" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Enter subcategory" />} />
                        </FormItem>
                        <FormItem label="Brand" invalid={!!formMethods.formState.errors.brandName} errorMessage={formMethods.formState.errors.brandName?.message}>
                            <Controller name="brandName" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Enter brand name" />} />
                        </FormItem>
                         <FormItem label="Image URL (Optional)" invalid={!!formMethods.formState.errors.image} errorMessage={formMethods.formState.errors.image?.message}>
                            <Controller name="image" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="https://example.com/image.jpg" />} />
                        </FormItem>
                        <FormItem label="Price (Optional)" invalid={!!formMethods.formState.errors.price} errorMessage={formMethods.formState.errors.price?.message}>
                            <Controller name="price" control={formMethods.control} render={({ field }) => <InputNumber {...field} placeholder="0.00" prefix="$" min={0} precision={2} />} />
                        </FormItem>
                        <FormItem label="Stock Quantity (Optional)" invalid={!!formMethods.formState.errors.stock} errorMessage={formMethods.formState.errors.stock?.message}>
                            <Controller name="stock" control={formMethods.control} render={({ field }) => <InputNumber {...field} placeholder="0" min={0} />} />
                        </FormItem>
                        <FormItem label="Description (Optional)" className="md:col-span-2" invalid={!!formMethods.formState.errors.description} errorMessage={formMethods.formState.errors.description?.message}>
                            <Controller name="description" control={formMethods.control} render={({ field }) => <Textarea {...field} rows={4} placeholder="Enter product description..." />} />
                        </FormItem>
                    </div>
                     <div className="text-right mt-auto pt-3 border-t"> {/* Footer within drawer body */}
                        <Button size="sm" className="mr-2" type="button" onClick={closeAddEditDrawer} disabled={isSubmitting}>Cancel</Button>
                        <Button size="sm" variant="solid" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? (editingProduct ? 'Saving...' : 'Adding...') : (editingProduct ? 'Save Changes' : 'Add Product')}
                        </Button>
                    </div>
                </Form>
            </Drawer>

            <Drawer title="Filter Products" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer}
                footer={<div className="text-right"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterProductForm" type="submit">Apply</Button></div>}>
                <Form id="filterProductForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 h-full">
                    <div className="flex-grow overflow-y-auto p-1">
                        <FormItem label="Name or SKU">
                            <Controller name="filterNameOrSku" control={filterFormMethods.control} render={({ field }) => <Input {...field} placeholder="Search by name or SKU" />} />
                        </FormItem>
                        <FormItem label="Category">
                            <Controller name="filterCategories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select categories..." options={categoryOptions} {...field} />)} />
                        </FormItem>
                         <FormItem label="Brand">
                            <Controller name="filterBrands" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select brands..." options={brandOptions} {...field} />)} />
                        </FormItem>
                        <FormItem label="Status">
                            <Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select statuses..." options={productStatusOptions} {...field} />)} />
                        </FormItem>
                    </div>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Product"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}>
                <p>Are you sure you want to delete product <strong>{itemToDelete?.name}</strong> (SKU: {itemToDelete?.sku})?</p>
            </ConfirmDialog>
        </>
    );
};

export default Products;