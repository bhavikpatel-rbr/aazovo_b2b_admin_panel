// src/views/your-path/WallListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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
import InputNumber from '@/components/ui/Input/InputNumber';
import { Drawer, Form, FormItem, Input, Select as UiSelect, DatePicker } from '@/components/ui';

// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbCloudUpload, TbFilter, TbPlus, TbBox,
    TbSwitchHorizontal, TbEye, TbLink, TbCloudDownload, // Added TbCloudDownload for import
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row, CellContext } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import Textarea from '@/views/ui-components/forms/Input/Textarea';

// --- Define Types ---
export type WallRecordStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'Fulfilled' | string;
export type WallIntent = 'Buy' | 'Sell' | 'Exchange'; // Made specific to match Zod enum
export type WallProductCondition = 'New' | 'Used' | 'Refurbished' | string;

export type ApiWallItem = {
    id: number;
    listing_id: string;
    product_name: string;
    company_name: string;
    contact_person_name: string;
    contact_person_email: string;
    contact_person_phone: string;
    product_category: string;
    product_subcategory: string;
    product_description: string;
    product_specs: string;
    product_status: string;
    quantity: number;
    price: number;
    want_to: string;
    listing_type: string;
    shipping_options: string;
    payment_method: string;
    warranty: string;
    return_policy: string;
    listing_url: string;
    brand: string;
    product_images: string[]; // Array of image URLs
    rating: number;
    reviews_count: number;
    created_date: string; // ISO date format recommended
    last_updated: string; // ISO date format recommended
    visibility: string;
    priority: string;
    assigned_to: string;
    inquiry_count: number;
    view_count: number;
    interaction_type: string;
    action: string;

};

export type WallItem = {
    id: number;
    listing_id: string;
    product_name: string;
    company_name: string;
    contact_person_name: string;
    contact_person_email: string;
    contact_person_phone: string;
    product_category: string;
    product_subcategory: string;
    product_description: string;
    product_specs: string;
    product_status: string;
    quantity: number;
    price: number;
    want_to: string;
    listing_type: string;
    shipping_options: string;
    payment_method: string;
    warranty: string;
    return_policy: string;
    listing_url: string;
    brand: string;
    product_images: string[]; // Array of image URLs
    rating: number;
    reviews_count: number;
    created_date: string; // ISO date format recommended
    last_updated: string; // ISO date format recommended
    visibility: string;
    priority: string;
    assigned_to: string;
    inquiry_count: number;
    view_count: number;
    interaction_type: string;
    action: string;
};


// --- Zod Schema for Add/Edit Wall Item Form ---
const wallItemFormSchema = z.object({
    productId: z.number({ required_error: "Product is required." }).min(1, "Product is required."),
    productSpecId: z.number({ required_error: "Product Specification is required." }).min(1, "Product Spec is required."),
    companyId: z.string({ required_error: "Company is required." }).min(1, "Company is required."),
    customerId: z.number({ required_error: "Member/Customer is required." }).min(1, "Member is required."),
    qty: z.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1."),
    productStatus: z.string().min(1, "Product Status is required."),
    intent: z.enum(['Buy', 'Sell', 'Exchange'] as const, // Use as const for stricter typing
        { required_error: "Intent (Want to) is required." }
    ),
    recordStatus: z.string().min(1, "Record Status is required."),
    price: z.number().nullable().optional(),
    color: z.string().max(50, "Color too long.").nullable().optional(),
    cartoonTypeId: z.number().nullable().optional(),
    dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
    paymentTermId: z.number().nullable().optional(),
    deviceCondition: z.string().nullable().optional(),
    eta: z.string().max(100, "ETA details too long.").nullable().optional(),
    location: z.string().max(100, "Location too long.").nullable().optional(),
    internalRemarks: z.string().nullable().optional(),
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// --- Zod Schema for Filter Form ---
const selectOptionSchema = z.object({ value: z.any(), label: z.string() });
const filterFormSchema = z.object({
    filterRecordStatuses: z.array(selectOptionSchema).optional().default([]),
    filterProductIds: z.array(selectOptionSchema).optional().default([]),
    filterProductSpecIds: z.array(selectOptionSchema).optional().default([]),
    filterCompanyIds: z.array(selectOptionSchema).optional().default([]),
    filterCustomerIds: z.array(selectOptionSchema).optional().default([]),
    filterIntents: z.array(selectOptionSchema).optional().default([]),
    dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Status Colors and Options ---
const recordStatusColor: Record<WallRecordStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100',
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
    Expired: 'bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-100',
    Fulfilled: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
};
const recordStatusOptions = Object.keys(recordStatusColor).map(s => ({ value: s, label: s }));
const intentOptions: {value: WallIntent, label: string}[] = [{value: 'Buy', label: 'Buy'}, {value: 'Sell', label: 'Sell'}, {value: 'Exchange', label: 'Exchange'}];
const productStatusOptions = [{value: 'In Stock', label: 'In Stock'}, {value: 'Low Stock', label: 'Low Stock'}, {value: 'Out of Stock', label: 'Out of Stock'}];
const deviceConditionOptions = [{value: 'New', label: 'New'}, {value: 'Used', label: 'Used'}, {value: 'Refurbished', label: 'Refurbished'}];

const dummyProducts = [{ id: 1, name: "iPhone 15 Pro" }, { id: 2, name: "Samsung Galaxy S24 Ultra" }];
const dummyProductSpecs = [{ id: 1, name: "256GB, Blue Titanium", productId: 1 }, { id: 2, name: "512GB, Natural Titanium", productId: 1 }, {id: 3, name: "256GB, Phantom Black", productId: 2}];
const dummyCompanies = [{ id: "COMP001", name: "TechDistributors Inc." }, { id: "COMP002", name: "Global Gadgets LLC" }];
const dummyCustomers = [{ id: 101, name: "John Retailer", email: "john@retail.com", phone: "111-222-3333" }, { id: 102, name: "Sarah Wholesaler", email: "sarah@ws.com", phone: "444-555-6666" }];
const dummyCartoonTypes = [{id: 1, name: 'Master Cartoon'}, {id: 2, name: 'Inner Carton'}];
const dummyPaymentTerms = [{id: 1, name: 'Net 30'}, {id: 2, name: 'COD'}, {id: 3, name: 'Prepaid'}];

const initialDummyWallItems: ApiWallItem[] = [
    {
      id: 1,
      listing_id: 'LIST-001',
      product_name: 'Electric Drill',
      company_name: 'ToolMaster Inc.',
      contact_person_name: 'John Doe',
      contact_person_email: 'john@toolmaster.com',
      contact_person_phone: '+1 234 567 890',
      product_category: 'Tools',
      product_subcategory: 'Power Tools',
      product_description: 'A high-performance electric drill suitable for heavy-duty tasks.',
      product_specs: '500W, 220V, 13mm chuck',
      product_status: 'available',
      quantity: 25,
      price: 149.99,
      want_to: 'sell',
      listing_type: 'featured',
      shipping_options: 'Courier, Pickup',
      payment_method: 'Online, COD',
      warranty: '1 Year Manufacturer Warranty',
      return_policy: '7 Days Return',
      listing_url: 'https://example.com/product/electric-drill',
      brand: 'ToolMaster',
      product_images: [
        'https://example.com/images/drill1.jpg',
        'https://example.com/images/drill2.jpg'
      ],
      rating: 4.5,
      reviews_count: 87,
      created_date: '2024-11-01T10:00:00Z',
      last_updated: '2024-12-01T12:30:00Z',
      visibility: 'public',
      priority: 'high',
      assigned_to: 'Sales Team A',
      inquiry_count: 42,
      view_count: 580,
      interaction_type: 'call',
      action: 'follow_up'
    }
  ];
  

const CSV_WALL_HEADERS = ['ID', 'Product Name', 'Product Spec', 'Company Name', 'Customer Name', 'Qty', 'Product Status', 'Intent', 'Record Status', 'Price', 'Color', 'Cartoon Type', 'Dispatch Status', 'Payment Term', 'Device Condition', 'ETA', 'Location', 'Internal Remarks', 'Created At'];
const CSV_WALL_KEYS: (keyof WallItem)[] = [
    'id',
    'listing_id',
    'product_name',
    'company_name',
    'contact_person_name',
    'contact_person_email',
    'contact_person_phone',
    'product_category',
    'product_subcategory',
    'product_description',
    'product_specs',
    'product_status',
    'quantity',
    'price',
    'want_to',
    'listing_type',
    'shipping_options',
    'payment_method',
    'warranty',
    'return_policy',
    'listing_url',
    'brand',
    'product_images',
    'rating',
    'reviews_count',
    'created_date',
    'last_updated',
    'visibility',
    'priority',
    'assigned_to',
    'inquiry_count',
    'view_count',
    'interaction_type',
    'action'
];

function exportWallItemsToCsv(filename: string, rows: WallItem[]) {
     if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
    const separator = ',';
    const csvContent = CSV_WALL_HEADERS.join(separator) + '\n' + rows.map(row => {
        return CSV_WALL_KEYS.map(k => {
            let cell = row[k];
            if (cell === null || cell === undefined) cell = '';
            else if (cell instanceof Date) cell = dayjs(cell).format('YYYY-MM-DD HH:mm:ss');
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

const ActionColumn = ({ onEdit, onDelete, onView, onChangeStatus, onWallLink }: {
    onEdit: () => void; onDelete: () => void; onView: () => void; onChangeStatus: () => void; onWallLink: () => void;
}) => {
    const iconBtnClass = "text-lg p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";
    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip title="View Details"><Button shape="circle" variant="plain" size="sm" icon={<TbEye />} onClick={onView} className={iconBtnClass} /></Tooltip>
            <Tooltip title="Edit"><Button shape="circle" variant="plain" size="sm" icon={<TbPencil />} onClick={onEdit} className={`${iconBtnClass} hover:text-blue-500`} /></Tooltip>
            <Tooltip title="Change Status"><Button shape="circle" variant="plain" size="sm" icon={<TbSwitchHorizontal />} onClick={onChangeStatus} className={`${iconBtnClass} hover:text-amber-500`} /></Tooltip>
            <Tooltip title="Wall Link"><Button shape="circle" variant="plain" size="sm" icon={<TbLink />} onClick={onWallLink} className={`${iconBtnClass} hover:text-green-500`} /></Tooltip>
            <Tooltip title="Delete"><Button shape="circle" variant="plain" size="sm" icon={<TbTrash />} onClick={onDelete} className={`${iconBtnClass} hover:text-red-500`} /></Tooltip>
        </div>
    );
};

type WallSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement> };
const WallSearch = React.forwardRef<HTMLInputElement, WallSearchProps>(
    ({ onInputChange }, ref) => <DebouceInput ref={ref} className="w-full" placeholder="Search wall listings..." suffix={<TbSearch />} onChange={e => onInputChange(e.target.value)} />
);
WallSearch.displayName = 'WallSearch';

const WallTableTools = ({ onSearchChange, onFilter, onExport, onAddNew, onImport }: { // Added onImport
    onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onAddNew: () => void; onImport: () => void; // Added onImport
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><WallSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button> {/* Import Button */}
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

type WallTableProps = {
    columns: ColumnDef<WallItem>[]; data: WallItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: WallItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: WallItem) => void; onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void;
};
const WallTable = (props: WallTableProps) => (
    <DataTable selectable columns={props.columns} data={props.data} loading={props.loading} pagingData={props.pagingData}
        checkboxChecked={(row) => props.selectedItems.some(s => s.id === row.id)}
        onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange}
        onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect}
        noData={!props.loading && props.data.length === 0}
    />
);

type WallSelectedFooterProps = { selectedItems: WallItem[]; onDeleteSelected: () => void; };
const WallSelectedFooter = ({ selectedItems, onDeleteSelected }: WallSelectedFooterProps) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t px-8">
                <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                        <TbChecks className="text-xl text-primary-500" />
                        <span className="font-semibold">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</span>
                    </span>
                    <Button size="sm" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => setDeleteOpen(true)}>Delete Selected</Button>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} items?`}
                onClose={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}
                onCancel={() => setDeleteOpen(false)}>
                <p>This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

const WallListing = () => {
    const [allWallItems, setAllWallItems] = useState<WallItem[]>([]);
    const [apiRawData, setApiRawData] = useState<ApiWallItem[]>(initialDummyWallItems);
    const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');

    const dispatchSimulated = useCallback(async (action: { type: string; payload?: any }) => {
        setLoadingStatus('loading');
        await new Promise(res => setTimeout(res, 300));
        try {
            switch (action.type) {
                case 'wall/get': setApiRawData(initialDummyWallItems); break;
                case 'wall/add':
                    const newItemApi: ApiWallItem = {
                        ...action.payload,
                        id: Date.now(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        status: action.payload.recordStatus, // Map back from form to API
                        want_to: action.payload.intent, // Map back from form to API
                    };
                    setApiRawData(prev => [newItemApi, ...prev]);
                    break;
                case 'wall/edit':
                    setApiRawData(prev => prev.map(item => item.id === action.payload.id ? { ...item, ...action.payload.data, status: action.payload.data.recordStatus, want_to: action.payload.data.intent, updated_at: new Date().toISOString() } : item));
                    break;
                case 'wall/delete':
                    setApiRawData(prev => prev.filter(item => item.id !== action.payload.id));
                    break;
                case 'wall/deleteAll':
                    const idsToDelete = new Set((action.payload.ids as string).split(',').map(Number));
                    setApiRawData(prev => prev.filter(item => !idsToDelete.has(item.id)));
                    break;
                case 'wall/changeStatus':
                     setApiRawData(prev => prev.map(item => item.id === action.payload.id ? { ...item, status: action.payload.newStatus, updated_at: new Date().toISOString() } : item));
                    break;
                default: console.warn('Unknown action');
            }
            setLoadingStatus('succeeded');
            return { unwrap: () => Promise.resolve() };
        } catch (e) { setLoadingStatus('failed'); return { unwrap: () => Promise.reject(e) }; }
    }, []);


    useEffect(() => {
        const mapped = apiRawData.map((apiItem): WallItem => ({
            id: apiItem.id,
            listing_id: apiItem.listing_id,
            product_name: apiItem.product_name,
            company_name: apiItem.company_name,
            contact_person_name: apiItem.contact_person_name,
            contact_person_email: apiItem.contact_person_email,
            contact_person_phone: apiItem.contact_person_phone,
            product_category: apiItem.product_category,
            product_subcategory: apiItem.product_subcategory,
            product_description: apiItem.product_description,
            product_specs: apiItem.product_specs,
            product_status: apiItem.product_status,
            quantity: apiItem.quantity,
            price: apiItem.price,
            want_to: apiItem.want_to,
            listing_type: apiItem.listing_type,
            shipping_options: apiItem.shipping_options,
            payment_method: apiItem.payment_method,
            warranty: apiItem.warranty,
            return_policy: apiItem.return_policy,
            listing_url: apiItem.listing_url,
            brand: apiItem.brand,
            product_images: apiItem.product_images || [],
            rating: apiItem.rating,
            reviews_count: apiItem.reviews_count,
            created_date: new Date(apiItem.created_date),
            last_updated: new Date(apiItem.last_updated),
            visibility: apiItem.visibility,
            priority: apiItem.priority,
            assigned_to: apiItem.assigned_to,
            inquiry_count: apiItem.inquiry_count,
            view_count: apiItem.view_count,
            interaction_type: apiItem.interaction_type,
            action: apiItem.action,
        }));
    
        setAllWallItems(mapped);
    }, [apiRawData]);
    


    const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WallItem | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<WallItem | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false); // Added state for import dialog


    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'createdAt' }, query: '',
    });
    const [selectedItems, setSelectedItems] = useState<WallItem[]>([]);

    const formMethods = useForm<WallItemFormData>({ resolver: zodResolver(wallItemFormSchema) });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

    const openAddDrawer = useCallback(() => {
        setEditingItem(null);
        formMethods.reset({
            productId: undefined, productSpecId: undefined, companyId: '', customerId: undefined, // Ensure companyId is string
            qty: 1, productStatus: productStatusOptions[0]?.value,
            intent: 'Sell', // Default to a valid enum value
            recordStatus: recordStatusOptions[0]?.value,
            price: null, color: null, cartoonTypeId: null, dispatchStatus: null, paymentTermId: null,
            deviceCondition: deviceConditionOptions[0]?.value, eta: null, location: null, internalRemarks: null,
        });
        setIsAddEditDrawerOpen(true);
    }, [formMethods]);

    const openEditDrawer = useCallback((item: WallItem) => {
        setEditingItem(item);
        formMethods.reset({
            productId: item.productId,
            productSpecId: item.productSpecId,
            companyId: item.companyId,
            customerId: item.customerId,
            qty: item.qty,
            productStatus: item.productStatus,
            intent: item.intent, // This should be 'Buy' | 'Sell' | 'Exchange'
            recordStatus: item.recordStatus,
            price: item.price,
            color: item.color,
            cartoonTypeId: item.cartoonTypeId,
            dispatchStatus: item.dispatchStatus,
            paymentTermId: item.paymentTermId,
            deviceCondition: item.deviceCondition,
            eta: item.eta,
            location: item.location,
            internalRemarks: item.internalRemarks,
        });
        setIsAddEditDrawerOpen(true);
    }, [formMethods]);

    const closeAddEditDrawer = useCallback(() => {
        setIsAddEditDrawerOpen(false);
        setEditingItem(null);
    }, []);

    const openViewDrawer = useCallback((item: WallItem) => {
        setEditingItem(item);
        setIsViewDrawerOpen(true);
    }, []);
    const closeViewDrawer = useCallback(() => {
        setIsViewDrawerOpen(false);
        setEditingItem(null);
    }, []);


    const onFormSubmit = useCallback(async (data: WallItemFormData) => {
        setIsSubmitting(true);
        const apiPayload = {
            product_id: data.productId,
            product_spec_id: data.productSpecId,
            company_id: data.companyId,
            customer_id: data.customerId,
            qty: data.qty,
            product_status: data.productStatus,
            want_to: data.intent,       // Already correct type from form
            status: data.recordStatus, // Map from form to API if necessary
            price: data.price,
            color: data.color,
            cartoon_type_id: data.cartoonTypeId,
            dispatch_status: data.dispatchStatus,
            payment_term_id: data.paymentTermId,
            device_condition: data.deviceCondition,
            eta: data.eta,
            location: data.location,
            internal_remarks: data.internalRemarks,
        };

        try {
            if (editingItem) {
                await dispatchSimulated({ type: 'wall/edit', payload: { id: editingItem.id, data: apiPayload } }).unwrap();
                toast.push(<Notification title="Success" type="success">Wall item updated.</Notification>);
            } else {
                await dispatchSimulated({ type: 'wall/add', payload: apiPayload }).unwrap();
                toast.push(<Notification title="Success" type="success">Wall item added.</Notification>);
            }
            closeAddEditDrawer();
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Operation failed."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatchSimulated, editingItem, closeAddEditDrawer]);


    const handleDeleteClick = useCallback((item: WallItem) => {
        setItemToDelete(item);
        setSingleDeleteConfirmOpen(true);
    }, []);

    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        setSingleDeleteConfirmOpen(false);
        try {
            await dispatchSimulated({ type: 'wall/delete', payload: { id: itemToDelete.id } }).unwrap();
            toast.push(<Notification title="Deleted" type="success">Item deleted.</Notification>);
            setSelectedItems((prev) => prev.filter(i => i.id !== itemToDelete.id));
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Delete failed."}</Notification>);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    }, [dispatchSimulated, itemToDelete]);

    const onDeleteSelected = useCallback(async () => {
        if(selectedItems.length === 0) return;
        setIsDeleting(true);
        const ids = selectedItems.map(item => item.id).join(',');
        try {
            await dispatchSimulated({ type: 'wall/deleteAll', payload: { ids } }).unwrap();
            toast.push(<Notification title="Success" type="success">{selectedItems.length} items deleted.</Notification>);
            setSelectedItems([]);
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Bulk delete failed."}</Notification>);
        } finally {
            setIsDeleting(false);
        }
    }, [dispatchSimulated, selectedItems]);


    const handleChangeStatus = useCallback(async (item: WallItem) => {
        const statusesCycle: WallRecordStatus[] = ['Pending', 'Approved', 'Rejected', 'Expired', 'Fulfilled'];
        const currentIndex = statusesCycle.indexOf(item.recordStatus);
        const newStatus = statusesCycle[(currentIndex + 1) % statusesCycle.length];
        setIsSubmitting(true);
        try {
            await dispatchSimulated({ type: 'wall/changeStatus', payload: { id: item.id, newStatus } }).unwrap();
            toast.push(<Notification title="Status Updated" type="success">{`Status changed to ${newStatus}.`}</Notification>);
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">Failed to update status.</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatchSimulated]);

    const handleWallLink = useCallback((item: WallItem) => {
        const wallLink = `https://yourplatform.com/wall/${item.id}`;
        navigator.clipboard.writeText(wallLink).then(() => {
            toast.push(<Notification title="Link Copied" type="success">Wall link copied!</Notification>);
        }).catch(err => {
            toast.push(<Notification title="Copy Failed" type="danger">Could not copy.</Notification>);
        });
    }, []);

    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
    const onClearFilters = useCallback(() => { const defaults = filterFormSchema.parse({}); filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

    type ProcessedDataType = { pageData: WallItem[]; total: number; allFilteredAndSortedData: WallItem[]; };
    const { pageData, total, allFilteredAndSortedData } = useMemo((): ProcessedDataType => {
        let processedData: WallItem[] = cloneDeep(allWallItems);
        if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
            const [startDate, endDate] = filterCriteria.dateRange;
            const start = startDate ? dayjs(startDate).startOf('day') : null;
            const end = endDate ? dayjs(endDate).endOf('day') : null;
            processedData = processedData.filter(item => {
                const itemDate = dayjs(item.createdAt);
                if (start && end) return itemDate.isBetween(start, end, null, '[]');
                if (start) return itemDate.isSameOrAfter(start, 'day');
                if (end) return itemDate.isSameOrBefore(end, 'day');
                return true;
            });
        }
        if (filterCriteria.filterRecordStatuses && filterCriteria.filterRecordStatuses.length > 0) {
            const statuses = new Set(filterCriteria.filterRecordStatuses.map(opt => opt.value));
            processedData = processedData.filter(item => statuses.has(item.recordStatus));
        }
        if (filterCriteria.filterIntents && filterCriteria.filterIntents.length > 0) {
            const intents = new Set(filterCriteria.filterIntents.map(opt => opt.value));
            processedData = processedData.filter(item => intents.has(item.intent));
        }
        if (filterCriteria.filterProductIds && filterCriteria.filterProductIds.length > 0) {
            const productIds = new Set(filterCriteria.filterProductIds.map(opt => opt.value as number));
            processedData = processedData.filter(item => productIds.has(item.productId));
        }
         if (filterCriteria.filterProductSpecIds && filterCriteria.filterProductSpecIds.length > 0) {
            const specIds = new Set(filterCriteria.filterProductSpecIds.map(opt => opt.value as number));
            processedData = processedData.filter(item => specIds.has(item.productSpecId));
        }
        if (filterCriteria.filterCompanyIds && filterCriteria.filterCompanyIds.length > 0) {
            const companyIds = new Set(filterCriteria.filterCompanyIds.map(opt => opt.value as string));
            processedData = processedData.filter(item => companyIds.has(item.companyId));
        }
        if (filterCriteria.filterCustomerIds && filterCriteria.filterCustomerIds.length > 0) {
            const customerIds = new Set(filterCriteria.filterCustomerIds.map(opt => opt.value as number));
            processedData = processedData.filter(item => customerIds.has(item.customerId));
        }

        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                String(item.id).toLowerCase().includes(query) ||
                (item.product_name && item.product_name.toLowerCase().includes(query))
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                let aVal = a[key as keyof WallItem];
                let bVal = b[key as keyof WallItem];
                if (aVal instanceof Date && bVal instanceof Date) return order === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
                if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal;
                return order === 'asc' ? String(aVal ?? '').localeCompare(String(bVal ?? '')) : String(bVal ?? '').localeCompare(String(aVal ?? ''));
            });
        }
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [allWallItems, tableData, filterCriteria]);

    const handleExportData = useCallback(() => exportWallItemsToCsv('wall_listing_export.csv', allFilteredAndSortedData), [allFilteredAndSortedData]);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: WallItem) => setSelectedItems(prev => checked ? (prev.some(i => i.id === row.id) ? prev : [...prev, row]) : prev.filter(i => i.id !== row.id)), []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<WallItem>[]) => {
        const originals = currentRows.map(r => r.original);
        if (checked) setSelectedItems(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))]; });
        else { const currentIds = new Set(originals.map(o => o.id)); setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id))); }
    }, []);

    const handleImportData = useCallback(() => { // Define handleImportData
        setImportDialogOpen(true);
    }, []);

    const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { // Define handleImportFileSelect
        const file = event.target.files?.[0];
        if (file) {
            // Process file (e.g., dispatch an action)
            console.log('Selected file for import:', file.name);
            toast.push(<Notification title="Import Started" type="info">File processing initiated.</Notification>);
            setImportDialogOpen(false); // Close dialog after selection
        }
        event.target.value = ''; // Reset file input
    }, []);


    const columns: ColumnDef<WallItem>[] = useMemo(() => [
        {
            header: 'ID',
            accessorKey: 'id',
            size: 100,
            enableSorting: true,
            cell: (props) => <span>{props.row.original.id}</span>,
        },
        {
          header: 'Listing ID',
          accessorKey: 'listing_id',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.listing_id ?? '-'}</span>,
        },
        {
          header: 'Product Name',
          accessorKey: 'product_name',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_name ?? '-'}</span>,
        },
        {
          header: 'Company Name',
          accessorKey: 'company_name',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.company_name ?? '-'}</span>,
        },
        {
          header: 'Contact Person Name',
          accessorKey: 'contact_person_name',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.contact_person_name ?? '-'}</span>,
        },
        {
          header: 'Contact Person Email',
          accessorKey: 'contact_person_email',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.contact_person_email ?? '-'}</span>,
        },
        {
          header: 'Contact Person Phone',
          accessorKey: 'contact_person_phone',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.contact_person_phone ?? '-'}</span>,
        },
        {
          header: 'Product Category',
          accessorKey: 'product_category',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_category ?? '-'}</span>,
        },
        {
          header: 'Product Subcategory',
          accessorKey: 'product_subcategory',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_subcategory ?? '-'}</span>,
        },
        {
          header: 'Product Description',
          accessorKey: 'product_description',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_description ?? '-'}</span>,
        },
        {
          header: 'Product Specifications',
          accessorKey: 'product_specs',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_specs ?? '-'}</span>,
        },
        {
          header: 'Product Status',
          accessorKey: 'product_status',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_status ?? '-'}</span>,
        },
        {
          header: 'Quantity Available',
          accessorKey: 'quantity',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.quantity ?? '-'}</span>,
        },
        {
          header: 'Price',
          accessorKey: 'price',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.price ?? '-'}</span>,
        },
        {
          header: 'Want to (Buy/Sell)',
          accessorKey: 'want_to',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.want_to ?? '-'}</span>,
        },
        {
          header: 'Listing Type',
          accessorKey: 'listing_type',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.listing_type ?? '-'}</span>,
        },
        {
          header: 'Shipping Options',
          accessorKey: 'shipping_options',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.shipping_options ?? '-'}</span>,
        },
        {
          header: 'Payment Method',
          accessorKey: 'payment_method',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.payment_method ?? '-'}</span>,
        },
        {
          header: 'Warranty',
          accessorKey: 'warranty',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.warranty ?? '-'}</span>,
        },
        {
          header: 'Return Policy',
          accessorKey: 'return_policy',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.return_policy ?? '-'}</span>,
        },
        {
          header: 'Listing URL',
          accessorKey: 'listing_url',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.listing_url ?? '-'}</span>,
        },
        {
          header: 'Brand',
          accessorKey: 'brand',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.brand ?? '-'}</span>,
        },
        {
          header: 'Product Images',
          accessorKey: 'product_images',
          enableSorting: false,
          cell: (props) => (
            <div className="flex gap-1 flex-wrap">
              {props.row.original.product_images?.map((img, index) => (
                <img key={index} src={img} alt="Product" className="w-8 h-8 rounded object-cover" />
              )) ?? <span>-</span>}
            </div>
          ),
        },
        {
          header: 'Rating',
          accessorKey: 'rating',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.rating ?? '-'}</span>,
        },
        {
          header: 'Reviews Count',
          accessorKey: 'reviews_count',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.reviews_count ?? '-'}</span>,
        },
        {
          header: 'Created Date',
          accessorKey: 'created_date',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.created_date ? new Date(props.row.original.created_date).toLocaleDateString() : '-'}</span>,
        },
        {
          header: 'Last Updated',
          accessorKey: 'last_updated',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.last_updated ? new Date(props.row.original.last_updated).toLocaleDateString() : '-'}</span>,
        },
        {
          header: 'Visibility',
          accessorKey: 'visibility',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.visibility ?? '-'}</span>,
        },
        {
          header: 'Priority',
          accessorKey: 'priority',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.priority ?? '-'}</span>,
        },
        {
          header: 'Assigned To',
          accessorKey: 'assigned_to',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.assigned_to ?? '-'}</span>,
        },
        {
          header: 'Inquiry Count',
          accessorKey: 'inquiry_count',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.inquiry_count ?? '-'}</span>,
        },
        {
          header: 'View Count',
          accessorKey: 'view_count',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.view_count ?? '-'}</span>,
        },
        {
          header: 'Interaction Type',
          accessorKey: 'interaction_type',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.interaction_type ?? '-'}</span>,
        },
        // Existing Actions column
        {
            header: 'Actions',
            id: 'actions',
            size: 180,
            meta: { HeaderClass: 'text-center' },
            cell: (props: CellContext<WallItem, any>) => (
                <ActionColumn
                    onView={() => openViewDrawer(props.row.original)}
                    onEdit={() => openEditDrawer(props.row.original)}
                    onChangeStatus={() => handleChangeStatus(props.row.original)}
                    onWallLink={() => handleWallLink(props.row.original)}
                    onDelete={() => handleDeleteClick(props.row.original)}
                />
            )
        },
    ], [openViewDrawer, openEditDrawer, handleChangeStatus, handleWallLink, handleDeleteClick]);
      

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Wall Listing</h5>
                        <Button
                                                    variant="solid"
                                                    icon={<TbPlus />}
                                                    onClick={openAddDrawer}
                                                >
                                                    {' '}
                                                    Add New{' '}
                                                </Button>
                    </div>
                    <WallTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onAddNew={openAddDrawer} onImport={handleImportData} /> {/* Added onImport */}
                    <div className="mt-4">
                        <WallTable columns={columns} data={pageData} loading={loadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange}
                            onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>
            <WallSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelected} />

            <Drawer
                title={editingItem ? 'Edit Wall Item' : 'Add Wall Item'}
                isOpen={isAddEditDrawerOpen}
                onClose={closeAddEditDrawer}
                onRequestClose={closeAddEditDrawer}
                width={700}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddEditDrawer} disabled={isSubmitting}>Cancel</Button>
                        <Button size="sm" variant="solid" form="wallItemForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? (editingItem ? 'Saving...' : 'Adding...') : (editingItem ? 'Save Changes' : 'Add Item')}
                        </Button>
                    </div>
                }
            >
            <Form id="wallItemForm" onSubmit={formMethods.handleSubmit(onFormSubmit)} className="flex flex-col gap-y-4 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto p-1">
                {[
                { name: 'listing_id', label: 'Listing ID' },
                { name: 'product_name', label: 'Product Name' },
                { name: 'company_name', label: 'Company Name' },
                { name: 'contact_person_name', label: 'Contact Person' },
                { name: 'contact_person_email', label: 'Email', type: 'email' },
                { name: 'contact_person_phone', label: 'Phone' },
                { name: 'product_category', label: 'Product Category' },
                { name: 'product_subcategory', label: 'Product Subcategory' },
                { name: 'product_description', label: 'Description', textarea: true },
                { name: 'product_specs', label: 'Specifications', textarea: true },
                { name: 'product_status', label: 'Status' },
                { name: 'quantity', label: 'Quantity', number: true },
                { name: 'price', label: 'Price', number: true },
                { name: 'want_to', label: 'Intent' },
                { name: 'listing_type', label: 'Listing Type' },
                { name: 'shipping_options', label: 'Shipping Options' },
                { name: 'payment_method', label: 'Payment Method' },
                { name: 'warranty', label: 'Warranty' },
                { name: 'return_policy', label: 'Return Policy' },
                { name: 'listing_url', label: 'Listing URL' },
                { name: 'brand', label: 'Brand' },
                { name: 'rating', label: 'Rating', number: true },
                { name: 'reviews_count', label: 'Reviews Count', number: true },
                { name: 'created_date', label: 'Created Date' },
                { name: 'last_updated', label: 'Last Updated' },
                { name: 'visibility', label: 'Visibility' },
                { name: 'priority', label: 'Priority' },
                { name: 'assigned_to', label: 'Assigned To' },
                { name: 'inquiry_count', label: 'Inquiry Count', number: true },
                { name: 'view_count', label: 'View Count', number: true },
                { name: 'interaction_type', label: 'Interaction Type' },
                { name: 'action', label: 'Action' },
                ].map(({ name, label, number, textarea, type }) => (
                <FormItem
                    key={name}
                    label={label}
                    invalid={!!formMethods.formState.errors[name]}
                    errorMessage={formMethods.formState.errors[name]?.message}
                    className={textarea ? 'md:col-span-2' : ''}
                >
                    <Controller
                    name={name}
                    control={formMethods.control}
                    render={({ field }) =>
                        textarea ? (
                        <Textarea {...field} rows={3} placeholder={`Enter ${label}`} />
                        ) : number ? (
                        <InputNumber {...field} placeholder={`Enter ${label}`} />
                        ) : (
                        <Input {...field} type={type || 'text'} placeholder={`Enter ${label}`} />
                        )
                    }
                    />
                </FormItem>
                ))}

                <FormItem
                label="Product Images (comma-separated URLs)"
                className="md:col-span-2"
                invalid={!!formMethods.formState.errors.product_images}
                errorMessage={formMethods.formState.errors.product_images?.message}
                >
                <Controller
                    name="product_images"
                    control={formMethods.control}
                    render={({ field }) => (
                    <Textarea
                        {...field}
                        rows={3}
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                        onChange={(e) =>
                        field.onChange(
                            e.target.value.split(',').map((s) => s.trim())
                        )
                        }
                        value={field.value?.join(', ') || ''}
                    />
                    )}
                />
                </FormItem>
            </div>
            </Form>

            </Drawer>

            <Drawer title="View Wall Item Details" isOpen={isViewDrawerOpen} onClose={closeViewDrawer} onRequestClose={closeViewDrawer} width={700}>
                {editingItem && (
                    <div className="p-4 space-y-3">
                    <h6 className="text-lg font-semibold border-b pb-2 mb-3">Item ID: {editingItem.id}</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(editingItem).map(([key, value]) => (
                        <div key={key}>
                            <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong>{' '}
                            {typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : value != null && value !== ''
                            ? value.toString()
                            : '-'}
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </Drawer>


            <Drawer title="Filter Wall Listings" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button>
                    <Button size="sm" variant="solid" form="filterWallForm" type="submit">Apply Filters</Button>
                </div>}>
                <Form id="filterWallForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 h-full">
                    <div className="flex-grow overflow-y-auto p-1">
                        <FormItem label="Record Status">
                            <Controller name="filterRecordStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select record statuses..." options={recordStatusOptions} {...field} />)} />
                        </FormItem>
                         <FormItem label="Product">
                            <Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select products..." options={dummyProducts.map(p=>({value: p.id, label:p.name}))} {...field} />)} />
                        </FormItem>
                        <FormItem label="Product Specification">
                            <Controller name="filterProductSpecIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select specifications..." options={dummyProductSpecs.map(p=>({value: p.id, label:p.name}))} {...field} />)} />
                        </FormItem>
                         <FormItem label="Company">
                            <Controller name="filterCompanyIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select companies..." options={dummyCompanies.map(p=>({value: p.id, label:p.name}))} {...field} />)} />
                        </FormItem>
                        <FormItem label="Member/Customer">
                            <Controller name="filterCustomerIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select members..." options={dummyCustomers.map(p=>({value: p.id, label:p.name}))} {...field} />)} />
                        </FormItem>
                        <FormItem label="Intent (Want to)">
                            <Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select intents..." options={intentOptions} {...field} />)} />
                        </FormItem>
                        <FormItem label="Created Date Range">
                            <Controller name="dateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as [Date|null,Date|null]|null|undefined} onChange={field.onChange} placeholder="Select date range"/>)} />
                        </FormItem>
                    </div>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Wall Item"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete item <strong>ID: {itemToDelete?.id}</strong> ({itemToDelete?.product_name})?</p>
            </ConfirmDialog>

             <Dialog isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} title="Import Wall Items">
                <div className="p-4">
                    <p>Upload a CSV file to import Wall Items.</p>
                    <FormItem label="CSV File">
                        <Input type="file" accept=".csv" onChange={handleImportFileSelect} />
                    </FormItem>
                    <div className="text-right mt-4">
                        <Button size="sm" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default WallListing;