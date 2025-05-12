// src/views/your-path/WallListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Keep useNavigate if used for cloning/navigation
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs'; // For date handling

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog'; // For Import dialog
import Avatar from '@/components/ui/Avatar'; // For Product image/icon placeholder
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast'; // Ensure toast is configured
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
// Corrected import: Ensure InputNumber is imported from the correct path
import InputNumber from '@/components/ui/Input/InputNumber';
import { Drawer, Form, FormItem, Input, Select as UiSelect, DatePicker } from '@/components/ui'; // Renamed Select, added InputNumber, DatePicker

// Icons
import {
    TbPencil,
    TbCopy, // Keep clone if needed
    TbSwitchHorizontal, // For status change
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbCloudUpload, // For Export button
    TbFilter,
    TbPlus, // Generic add icon
    TbBox, // Icon for Product
    TbClipboardList, // Icon for Wall Listing
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
// CSVLink is not used with custom export function
// import { CSVLink } from 'react-csv';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
// Assuming these actions exist or you will create them for Wall Items
import {
    getWallItemsAction,
    addWallItemAction,
    editWallItemAction,
    deleteWallItemAction,
    deleteAllWallItemsAction,
    // You might need a changeWallItemStatusAction if status change is separate
} from '@/reduxtool/master/middleware'; // **Adjust path and action names as needed**
import { masterSelector } from '@/reduxtool/master/masterSlice'; // **Adjust path and selector name as needed**
import { useSelector } from 'react-redux';
// Assuming you have actions/selectors for related entities like Products, Customers, Companies, Product Specs
// import { getProductsAction, getCustomersAction, getCompaniesAction, getProductSpecsAction } from '@/reduxtool/master/middleware';
// import { masterSelector as relatedDataSelector } from '@/reduxtool/master/masterSlice';


// Type for data coming directly from API before mapping
// Based on your provided sample data structure
type ApiWallItem = {
    id: number;
    product_id: number;
    customer_id: number; // Assuming customer is also a foreign key
    company_id?: string; // From sample data, might be a string ID? Or number?
    status: "Active" | "Inactive"; // API status - Need to map this to the UI's pending/approved/etc status? Or is this a different status? Let's assume API 'status' maps to record's overall status.
    want_to: "Sell" | "Buy" | string; // Assuming this maps to UI 'intent'
    qty: number;
    product_status: "Active" | "Non-active" | string; // API product status - Need to map this to the UI's in_stock/low_stock/etc? Let's assume this maps to UI 'productStatus'.
    source: "in" | "out" | string; // What this maps to in UI 'intent' is unclear. Let's keep it separate for now or map it if meaning is clear.
    delivery_at: string | null; // Date string
    delivery_details: string | null;
    created_by: number; // User ID
    active_hrs: number;
    expired_date: string | null; // Date string
    internal_remarks: string | null;
    created_at: string; // Date string
    updated_at: string; // Date string
    product_spec_id: number;
    device_type: string | null;
    price: number;
    color: string | null;
    master_cartoon: number | null; // Assuming number for quantity of master cartons
    dispatch_status: string | null;
    payment_term: number; // Assuming number of days?
    device_condition: string | null;
    eta_details: string | null;
    location: string | null;
    is_wall_manual: 0 | 1; // Boolean like
    wall_link_token: string | null; // Maybe not needed in UI?
    wall_link_datetime: string | null; // Date string
    // Related entities included in the API response for display
    product?: { // Assuming nested product object
        id: number;
        name: string; // Product Name
        icon_full_path?: string; // Product Image/Icon URL
         // Add other product fields if needed for display/mapping
    }
    customer?: { // Assuming nested customer object if needed for display/mapping customer_id
        id: number;
        name: string;
        // Add other customer fields if needed
    }
    // Add other nested relationships (e.g., Company, User for created_by, ProductSpec) if needed for display/mapping
};

// --- Define WallItem Type (Mapped for UI) ---
// Mapping from API data structure to a UI-friendly format
export type WallRecordStatus = 'active' | 'inactive'; // Mapping API 'status'
export type WallIntent = 'Sell' | 'Buy' | string; // Mapping API 'want_to'. Using API values directly in UI type for simplicity.
export type WallProductStatus = 'Active' | 'Non-active' | string; // Mapping API 'product_status'. Using API values directly.
export type WallSource = 'in' | 'out' | string; // Mapping API 'source'. Using API values directly.
export type WallDispatchStatus = string | null; // Mapping API 'dispatch_status'


export type WallItem = {
    id: number; // Use number based on sample data
    productId: number; // Mapped from product_id
    customerId: number; // Mapped from customer_id
    companyId?: string; // Mapped from company_id
    recordStatus: WallRecordStatus; // Mapped from API 'status' ('Active'/'Inactive' -> 'active'/'inactive')
    intent: WallIntent; // Mapped from 'want_to'
    qty: number;
    productStatus: WallProductStatus; // Mapped from 'product_status'
    source: WallSource; // Mapped from 'source'
    deliveryAt: string | null; // Mapped from delivery_at (date string)
    deliveryDetails: string | null; // Mapped from delivery_details
    createdByUserId: number; // Mapped from created_by
    activeHrs: number; // Mapped from active_hrs
    expiredDate: string | null; // Mapped from expired_date (date string)
    internalRemarks: string | null; // Mapped from internal_remarks
    createdAt: string; // Mapped from created_at (date string)
    updatedAt: string; // Mapped from updated_at (date string)
    productSpecId: number; // Mapped from product_spec_id
    deviceType: string | null; // Mapped from device_type
    price: number; // Mapped from price
    color: string | null; // Mapped from color
    masterCartoonQty: number | null; // Mapped from master_cartoon (assuming number)
    dispatchStatus: WallDispatchStatus; // Mapped from dispatch_status
    paymentTermDays: number; // Mapped from payment_term (assuming days)
    deviceCondition: string | null; // Mapped from device_condition
    etaDetails: string | null; // Mapped from eta_details
    location: string | null; // Mapped from location
    isWallManual: boolean; // Mapped from is_wall_manual (0/1 to boolean)
    // wallLinkToken: string | null; // Probably not needed in UI
    // wallLinkDatetime: string | null; // Probably not needed in UI
    productName: string | null; // Mapped from product.name
    productIconUrl: string | null; // Mapped from product.icon_full_path
    customerName?: string | null; // Mapped from customer.name (if available)
    createdByName?: string | null; // Mapped from created_by user's name (if available)
};
// --- End Item Type Definition ---


// --- Zod Schema for Add/Edit Wall Item Form ---
// Based on the fields provided for the form
const wallItemFormSchema = z.object({
    product_id: z.number({ invalid_type_error: "Product is required" }).min(1, "Product is required"), // Assuming Select provides number
    customer_id: z.number({ invalid_type_error: "Customer is required" }).min(1, "Customer is required"), // Assuming Select provides number
    company_id: z.string().min(1, "Company is required"), // Assuming Input/Select provides string
    status: z.enum(["Active", "Inactive"], { invalid_type_error: "Invalid Status" }), // API status field type
    want_to: z.enum(["Sell", "Buy", "Exchange", "Transfer"], { invalid_type_error: "Invalid Intent" }), // Example intent options matching API/common values
    qty: z.number({ invalid_type_error: "Quantity is required" }).min(1, "Quantity must be at least 1"),
    product_status: z.enum(["Active", "Non-active"], { invalid_type_error: "Invalid Product Status" }), // API product_status field type
    source: z.enum(["in", "out", "internal"], { invalid_type_error: "Invalid Source" }), // Example source options
    created_by: z.number({ invalid_type_error: "Created By user is required" }).min(1, "Created By user is required"), // User ID who created this entry
    active_hrs: z.number().nullable().optional(), // Optional/nullable number
    expired_date: z.string().nullable().optional(), // ISO date string or null
    internal_remarks: z.string().nullable().optional(),
    product_spec_id: z.number({ invalid_type_error: "Product Specification is required" }).min(1, "Product Specification is required"),
    price: z.number().nullable().optional(),
    color: z.string().nullable().optional(),
    master_cartoon: z.number().nullable().optional(), // Assuming number for master cartons
    dispatch_status: z.string().nullable().optional(),
    payment_term: z.number().nullable().optional(), // Assuming number of days
    eta_details: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    is_wall_manual: z.boolean().optional(), // Assuming checkbox/switch provides boolean
})
type WallFormData = z.infer<typeof wallItemFormSchema>

// --- Zod Schema for Filter Form ---
const filterFormWallSchema = z.object({
    filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Filter by record status (active/inactive)
    filterProductStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Filter by product status (active/non-active)
    filterIntents: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Filter by intent (sell/buy)
    filterProductIds: z.array(z.object({ value: z.number(), label: z.string() })).optional(), // Filter by product
    filterCustomerIds: z.array(z.object({ value: z.number(), label: z.string() })).optional(), // Filter by customer
    filterCompanyIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Filter by company
    // filterCreatedBy: z.array(z.object({ value: z.number(), label: z.string() })).optional(), // Filter by user who created
    // filterDateRange: z.array(z.date().nullable()).length(2).nullable().optional(), // Filter by created date range
})
type FilterFormData = z.infer<typeof filterFormWallSchema>


// --- CSV Exporter Utility ---
const CSV_HEADERS_WALL = [
    'ID', 'Record Status', 'Intent', 'Qty', 'Product Status', 'Source', 'Price',
    'Product Name', 'Product Specs ID', 'Color', 'Master Cartoon Qty', 'Dispatch Status',
    'Payment Term (Days)', 'Device Type', 'Device Condition', 'ETA Details', 'Location',
    'Company ID', 'Customer ID', 'Created By User ID', 'Created At', 'Updated At',
    'Delivery At', 'Expired Date', 'Active Hrs', 'Internal Remarks', 'Is Manual Entry',
];
type WallCsvItem = {
    id: number;
    recordStatus: WallRecordStatus; // UI status
    intent: WallIntent; // UI intent
    qty: number;
    productStatus: WallProductStatus; // UI product status
    source: WallSource; // UI source
    price: number;
    productName: string | null;
    productSpecId: number;
    color: string | null;
    masterCartoonQty: number | null;
    dispatchStatus: WallDispatchStatus; // UI dispatch status
    paymentTermDays: number;
    deviceType: string | null;
    deviceCondition: string | null;
    etaDetails: string | null;
    location: string | null;
    companyId?: string;
    customerId: number;
    createdByUserId: number;
    createdAt: string; // Formatted date string
    updatedAt: string; // Formatted date string
    deliveryAt: string | null; // Formatted date string or null
    expiredDate: string | null; // Formatted date string or null
    activeHrs: number;
    internalRemarks: string | null;
    isWallManual: boolean;
};


function exportToCsvWall(filename: string, rows: WallItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    // Transform data for CSV output format
    const transformedRows: WallCsvItem[] = rows.map(item => ({
        id: item.id,
        recordStatus: item.recordStatus, // Use UI status
        intent: item.intent, // Use UI intent
        qty: item.qty,
        productStatus: item.productStatus, // Use UI product status
        source: item.source, // Use UI source
        price: item.price,
        productName: item.productName,
        productSpecId: item.productSpecId,
        color: item.color,
        masterCartoonQty: item.masterCartoonQty,
        dispatchStatus: item.dispatchStatus,
        paymentTermDays: item.paymentTermDays,
        deviceType: item.deviceType,
        deviceCondition: item.deviceCondition,
        etaDetails: item.etaDetails,
        location: item.location,
        companyId: item.companyId,
        customerId: item.customerId,
        createdByUserId: item.createdByUserId,
        createdAt: item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
        updatedAt: item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '',
        deliveryAt: item.deliveryAt ? dayjs(item.deliveryAt).format('YYYY-MM-DD HH:mm:ss') : '',
        expiredDate: item.expiredDate ? dayjs(item.expiredDate).format('YYYY-MM-DD HH:mm:ss') : '',
        activeHrs: item.activeHrs,
        internalRemarks: item.internalRemarks,
        isWallManual: item.isWallManual,
    }));

    const csvKeys: (keyof WallCsvItem)[] = [
        'id', 'recordStatus', 'intent', 'qty', 'productStatus', 'source', 'price',
        'productName', 'productSpecId', 'color', 'masterCartoonQty', 'dispatchStatus',
        'paymentTermDays', 'deviceType', 'deviceCondition', 'etaDetails', 'location',
        'companyId', 'customerId', 'createdByUserId', 'createdAt', 'updatedAt',
        'deliveryAt', 'expiredDate', 'activeHrs', 'internalRemarks', 'isWallManual',
    ];

    const separator = ',';
    const csvContent =
        CSV_HEADERS_WALL.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return csvKeys.map((k) => {
                    let cell = row[k];
                    if (cell === null || cell === undefined) cell = '';
                    else cell = String(cell).replace(/"/g, '""'); // Escape double quotes
                    if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; // Wrap cell if needed
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for UTF-8
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Your browser does not support this feature.</Notification>);
    return false;
}


// --- Constants for Options and Colors ---
// **Assume these options are fetched dynamically or defined based on API allowable values**

// Options for API 'status' field (used in forms)
const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
];

// Options for mapped UI 'recordStatus' field (used in filters and tags)
const uiRecordStatusOptions: { value: WallRecordStatus; label: string }[] = [
     { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

// Options for API 'product_status' field (used in forms and filters)
const apiProductStatusOptions: { value: "Active" | "Non-active"; label: string }[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Non-active', label: 'Non-active' },
];

// Options for API 'want_to' field (used in forms and filters)
const apiIntentOptions: { value: WallIntent; label: string }[] = [
    { value: 'Sell', label: 'Sell' },
    { value: 'Buy', label: 'Buy' },
    { value: 'Exchange', label: 'Exchange' },
    { value: 'Transfer', label: 'Transfer' },
];

// Options for API 'source' field (used in forms)
const apiSourceOptions: { value: WallSource; label: string }[] = [
     { value: 'in', label: 'In' },
     { value: 'out', label: 'Out' },
     { value: 'internal', label: 'Internal' },
];

// Dummy options for related entities (Replace with data from Redux)
const dummyProductOptions: { value: number; label: string }[] = [{ value: 1, label: 'Product A' }, { value: 2, label: 'Product B' }];
const dummyCustomerOptions: { value: number; label: string }[] = [{ value: 1, label: 'Customer 1' }, { value: 2, label: 'Customer 2' }];
const dummyCompanyOptions: { value: string; label: string }[] = [{ value: 'C001', label: 'Company X' }, { value: 'C002', label: 'Company Y' }];
const dummyUserOptions: { value: number; label: string }[] = [{ value: 1, label: 'Admin User' }, { value: 2, label: 'Standard User' }];
const dummyProductSpecOptions: { value: number; label: string }[] = [{ value: 1, label: 'Spec 1' }, { value: 2, label: 'Spec 2' }];

// Color mappings for Tags (UI statuses)
const recordStatusColorMapping: Record<WallRecordStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
};
const productStatusColorMapping: Record<WallProductStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    'Non-active': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
};


// --- Reusable ActionColumn Component ---
const ActionColumn = ({ onEdit, onClone, onChangeStatus, onDelete }: {
    onEdit: () => void;
    onClone: () => void; // Always include clone if the button is always there
    onChangeStatus: () => void;
    onDelete: () => void;
}) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip title="Clone Record">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400' )} role="button" onClick={onClone} > <TbCopy /> </div>
            </Tooltip>
            <Tooltip title="Change Status">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400' )} role="button" onClick={onChangeStatus} > <TbSwitchHorizontal /> </div>
            </Tooltip>
            <Tooltip title="Edit Record">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400' )} role="button" onClick={onEdit} > <TbPencil /> </div>
            </Tooltip>
            <Tooltip title="Delete Record">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400' )} role="button" onClick={onDelete} > <TbTrash /> </div>
            </Tooltip>
        </div>
    );
};


// --- WallItemSearch Component ---
type WallItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement> }
const WallItemSearch = React.forwardRef<HTMLInputElement, WallItemSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Search Wall Items (ID, Product, Company, Status, Intent)..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
WallItemSearch.displayName = 'WallItemSearch';

// --- WallItemTableTools Component ---
const WallItemTableTools = ({ onSearchChange, onFilter, onExport, onImport }: {
    onSearchChange: (query: string) => void;
    onFilter: () => void;
    onExport: () => void;
    onImport: () => void;
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex-grow"><WallItemSearch onInputChange={onSearchChange} /></div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
                <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    );
};

// --- WallItemTable Component ---
type WallItemTableProps = {
    columns: ColumnDef<WallItem>[]; data: WallItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: WallItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: WallItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void;
}
const WallItemTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: WallItemTableProps) => (
    <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData}
        checkboxChecked={(row) => selectedItems.some(selected => selected.id === row.id)}
        onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
        onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
    />
);

// --- WallItemSelectedFooter Component ---
type WallItemSelectedFooterProps = { selectedItems: WallItem[]; onDeleteSelected: () => void; }
const WallItemSelectedFooter = ({ selectedItems, onDeleteSelected }: WallItemSelectedFooterProps) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span>Item{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Item${selectedItems.length > 1 ? 's' : ''}`}
                onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}>
                <p>Are you sure you want to delete the selected item{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};


// --- Main WallListing Component ---
const WallListing = () => { // Renamed Component
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Redux State: Assuming wallItemsData is in your masterSlice
    // **Adjust wallItemsData and masterSelector paths/names as needed**
    const { wallItemsData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector);
    // **Assume you also fetch related data like products, customers, etc. if needed for forms/filters**
    // const { products = [], customers = [], companies = [], productSpecs = [], users = [] } = useSelector(relatedDataSelector);


    // --- Local Component State ---

    // State for DataTable: pagination, sort, and quick search query
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    // State for selected rows (for bulk actions)
    const [selectedItems, setSelectedItems] = useState<WallItem[]>([]);

    // State for Drawer UI: controls whether drawers are open
    const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
    // State for Delete Confirmation Dialogs
    const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false); // State for import dialog

    // State for the Wall Item being edited or deleted (single action)
    const [editingWallItem, setEditingWallItem] = useState<WallItem | null>(null);
    const [wallItemToDelete, setWallItemToDelete] = useState<WallItem | null>(null);

    // State for Loading/Submitting/Deleting states (for UI feedback)
    const [isSubmitting, setSubmitting] = useState(false); // For Add/Edit operations
    const [isDeleting, setDeleting] = useState(false); // For Delete operations (single or bulk)


    // State for Filters: holds the currently applied filters from the drawer form
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatuses: [], filterProductStatuses: [], filterIntents: [], filterProductIds: [], filterCustomerIds: [], filterCompanyIds: [] }); // Updated filter criteria default

    // --- Table State Update Handlers ---
    // IMPORTANT: Declare these early so they can be called by other handlers.
    // Memoized using useCallback to ensure stable function references for DataTable props
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }));
    }, []); // No dependencies needed as it only updates local state (`setTableData` is stable)


    // --- Effects ---

    // Effect to fetch Wall Item data from Redux middleware when the component mounts
    useEffect(() => {
        dispatch(getWallItemsAction()); // Dispatch the action to fetch wall items
        // **Also dispatch actions to fetch related data needed for forms/filters**
        // dispatch(getProductsAction());
        // dispatch(getCustomersAction());
        // dispatch(getCompaniesAction());
        // dispatch(getProductSpecsAction());
        // dispatch(getUsersAction()); // If filtering by created_by user
    }, [dispatch]);


    // --- Data Mapping ---
    // Memoized mapping from API data structure to UI-friendly WallItem structure
    const mappedWallItems = useMemo(() => {
        if (!Array.isArray(wallItemsData)) return []; // Ensure source data is an array

        return wallItemsData.map((apiItem: ApiWallItem) => {
            // Map API data to UI structure
            return {
                id: apiItem.id,
                productId: apiItem.product_id,
                customerId: apiItem.customer_id,
                companyId: apiItem.company_id,
                recordStatus: apiItem.status === 'Active' ? 'active' : 'inactive', // Map API status
                intent: apiItem.want_to, // Use API value directly or map if needed ('Sell' -> 'sell')
                qty: apiItem.qty,
                productStatus: apiItem.product_status, // Use API value directly or map
                source: apiItem.source, // Use API value directly or map
                deliveryAt: apiItem.delivery_at,
                deliveryDetails: apiItem.delivery_details,
                createdByUserId: apiItem.created_by,
                activeHrs: apiItem.active_hrs,
                expiredDate: apiItem.expired_date,
                internalRemarks: apiItem.internal_remarks,
                createdAt: apiItem.created_at,
                updatedAt: apiItem.updated_at,
                productSpecId: apiItem.product_spec_id,
                deviceType: apiItem.device_type,
                price: apiItem.price,
                color: apiItem.color,
                masterCartoonQty: apiItem.master_cartoon,
                dispatchStatus: apiItem.dispatch_status,
                paymentTermDays: apiItem.payment_term,
                deviceCondition: apiItem.device_condition,
                etaDetails: apiItem.eta_details,
                location: apiItem.location,
                isWallManual: apiItem.is_wall_manual === 1, // Map 0/1 to boolean
                // wallLinkToken: apiItem.wall_link_token,
                // wallLinkDatetime: apiItem.wall_link_datetime,
                productName: apiItem.product?.name ?? null, // Get product name from nested object
                productIconUrl: apiItem.product?.icon_full_path ?? null, // Get product icon URL
                // customerName: apiItem.customer?.name ?? null, // Get customer name if nested
                // createdByName: apiItem.user?.name ?? null, // Get created by user name if nested
            };
        });
    }, [wallItemsData /* Add dependencies for any related data needed for mapping */]);


    // --- Table State Update Handlers ---
    // Handler for pagination changes (page number)
    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData], // Depend on handleSetTableData (which is stable)
    );

    // Handler for page size changes
    const handleSelectChange = useCallback(
        (value: number) => {
            // When page size changes, reset to the first page
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
            // Also clear any selections, as the page content has changed
            setSelectedItems([]);
        },
        [handleSetTableData], // Depend on handleSetTableData (which is stable)
    );

    // Handler for sorting changes
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            // When sort changes, reset to the first page
            handleSetTableData({ sort: sort, pageIndex: 1 });
        },
        [handleSetTableData], // Depend on handleSetTableData (which is stable)
    );

    // Handler for quick search input changes (debounced by DebouceInput)
    const handleSearchChange = useCallback(
        (query: string) => {
             // When search query changes, reset to the first page
             handleSetTableData({ query: query, pageIndex: 1 })
            },
        [handleSetTableData], // Depend on handleSetTableData (which is stable)
    );


    // React Hook Form methods for forms (declared after state they might reset)
    const addFormMethods = useForm<WallFormData>({
        resolver: zodResolver(wallItemFormSchema),
        defaultValues: { // Set initial default values for form fields
            product_id: undefined, customer_id: undefined, company_id: '',
            status: 'Active', want_to: 'Sell', qty: 1, product_status: 'Active', source: 'in',
            created_by: undefined, active_hrs: null, expired_date: null, internal_remarks: null,
            product_spec_id: undefined, price: null, color: null, master_cartoon: null,
            dispatch_status: null, payment_term: null, eta_details: null, location: null,
            is_wall_manual: false,
        },
        mode: 'onChange'
    });
    const editFormMethods = useForm<WallFormData>({
         resolver: zodResolver(wallItemFormSchema),
        defaultValues: { // Set initial default values
            product_id: undefined, customer_id: undefined, company_id: '',
            status: 'Active', want_to: 'Sell', qty: 1, product_status: 'Active', source: 'in',
            created_by: undefined, active_hrs: null, expired_date: null, internal_remarks: null,
            product_spec_id: undefined, price: null, color: null, master_cartoon: null,
            dispatch_status: null, payment_term: null, eta_details: null, location: null,
            is_wall_manual: false,
        },
        mode: 'onChange'
    });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormWallSchema), defaultValues: filterCriteria });


    // --- Drawer Handlers (Add/Edit) ---
    // Handlers to open/close drawers and manage form state
    const openAddWallItemDrawer = useCallback(() => {
        // Reset form to default values before opening
        addFormMethods.reset({
            product_id: undefined, customer_id: undefined, company_id: '',
            status: 'Active', want_to: 'Sell', qty: 1, product_status: 'Active', source: 'in',
            created_by: undefined, active_hrs: null, expired_date: null, internal_remarks: null,
            product_spec_id: undefined, price: null, color: null, master_cartoon: null,
            dispatch_status: null, payment_term: null, eta_details: null, location: null,
            is_wall_manual: false,
        });
        setAddDrawerOpen(true); // Open the add drawer
    }, [addFormMethods]); // Depend on addFormMethods

    const closeAddWallItemDrawer = useCallback(() => {
        addFormMethods.reset(); // Reset form when closing
        setAddDrawerOpen(false); // Close the add drawer
    }, [addFormMethods]); // Depend on addFormMethods

    // Handles submission of the add Wall Item form
    const onAddWallItemSubmit = useCallback(async (data: WallFormData) => {
        setSubmitting(true); // Show submitting state

        // Prepare data for API - usually, this would be a simple object or FormData
        // based on your API's requirements. Let's assume a simple object for now.
        const apiData = {
             ...data,
             // Convert date fields if needed (e.g., Date object to ISO string)
             // expired_date: data.expired_date instanceof Date ? dayjs(data.expired_date).toISOString() : data.expired_date,
             // delivery_at: data.delivery_at instanceof Date ? dayjs(data.delivery_at).toISOString() : data.delivery_at,
             // Handle boolean to 0/1 if API expects that
             is_wall_manual: data.is_wall_manual ? 1 : 0,
             // Ensure nullable fields are sent as null or omitted if API allows
        };

        console.log("Submitting Add Wall Item Data:", apiData); // Log data

        try {
            // Dispatch add action for Wall Item
            await dispatch(addWallItemAction(apiData)).unwrap(); // **Adjust action name**
            toast.push(<Notification title="Wall Item Added" type="success" duration={2000}>Wall Item added successfully.</Notification>); // Updated success toast
            closeAddWallItemDrawer(); // Close drawer on success
            dispatch(getWallItemsAction()); // Refresh data list after successful add
        } catch (error: any) {
             console.error('Add Wall Item Error:', error); // Log error
            toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error.message || error.data?.message || 'Could not add wall item.'}</Notification>); // Improved error toast
        } finally { setSubmitting(false); } // Hide submitting state
    }, [dispatch, addWallItemAction, closeAddWallItemDrawer, getWallItemsAction]); // Dependencies


    // Opens the edit Wall Item drawer and populates the form with data
    const openEditWallItemDrawer = useCallback((item: WallItem) => { // Use WallItem type
        setEditingWallItem(item); // Set the item being edited
        // Reset form with current item data
        editFormMethods.reset({
            product_id: item.productId, customer_id: item.customerId, company_id: item.companyId ?? '',
            status: item.recordStatus === 'active' ? 'Active' : 'Inactive', // Map UI status back to API
            want_to: item.intent, // Use UI intent value directly or map back to API value
            qty: item.qty, product_status: item.productStatus, source: item.source,
            created_by: item.createdByUserId, active_hrs: item.activeHrs,
            expired_date: item.expiredDate, // Use ISO string from mapped data
            internal_remarks: item.internalRemarks, product_spec_id: item.productSpecId,
            price: item.price, color: item.color, master_cartoon: item.masterCartoonQty,
            dispatch_status: item.dispatchStatus, payment_term: item.paymentTermDays,
            eta_details: item.etaDetails, location: item.location,
            is_wall_manual: item.isWallManual, // Use boolean
            // other fields...
        });
        setEditDrawerOpen(true); // Open the edit drawer
    }, [editFormMethods]); // Depend on editFormMethods

    const closeEditWallItemDrawer = useCallback(() => {
        setEditingWallItem(null); // Clear the item being edited
        editFormMethods.reset(); // Reset the edit form
        setEditDrawerOpen(false); // Close the edit drawer
    }, [editFormMethods]); // Depend on editFormMethods

    // Handles submission of the edit Wall Item form
    const onEditWallItemSubmit = useCallback(async (data: WallFormData) => {
        if (!editingWallItem) return; // Ensure an item is being edited
        setSubmitting(true); // Show submitting state

        // Prepare data for API submission
        const apiData = {
            ...data,
             // Convert date fields if needed
             // expired_date: data.expired_date instanceof Date ? dayjs(data.expired_date).toISOString() : data.expired_date,
             // delivery_at: data.delivery_at instanceof Date ? dayjs(data.delivery_at).toISOString() : data.delivery_at,
             is_wall_manual: data.is_wall_manual ? 1 : 0, // Handle boolean back to 0/1
             // Ensure nullable fields are handled correctly for API
        };

         console.log("Submitting Edit Wall Item Data for ID", editingWallItem.id, ":", apiData); // Log data

        try {
            // Dispatch edit action for Wall Item with ID and data
            await dispatch(editWallItemAction({ id: editingWallItem.id, data: apiData })).unwrap(); // **Adjust action name**
            toast.push(<Notification title="Wall Item Updated" type="success" duration={2000}>Wall Item updated successfully.</Notification>); // Updated success toast
            closeEditWallItemDrawer(); // Close drawer on success
            dispatch(getWallItemsAction()); // Refresh data list after successful update
        } catch (error: any) {
             console.error('Edit Wall Item Error:', error); // Log error
            toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error.message || error.data?.message || 'Could not update wall item.'}</Notification>); // Improved error toast
        } finally { setSubmitting(false); } // Hide submitting state
    }, [dispatch, editWallItemAction, editingWallItem, closeEditWallItemDrawer, getWallItemsAction]); // Dependencies


    // --- Delete Handlers ---
    const handleDeleteWallItemClick = useCallback((item: WallItem) => { setWallItemToDelete(item); setSingleDeleteOpen(true); }, []);
    const onConfirmSingleWallItemDelete = useCallback(async () => {
        if (!wallItemToDelete) return;
        setDeleting(true); setSingleDeleteOpen(false);
        try {
            await dispatch(deleteWallItemAction(wallItemToDelete.id)).unwrap(); // **Adjust action name** (assuming it takes ID)
            toast.push(<Notification title="Wall Item Deleted" type="success" duration={2000}>Wall Item deleted successfully.</Notification>);
            setSelectedItems(prev => prev.filter(item => item.id !== wallItemToDelete!.id));
            dispatch(getWallItemsAction());
        } catch (error: any) {
             console.error('Delete Wall Item Error:', error);
            toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || error.data?.message || `Could not delete wall item.`}</Notification>);
        } finally { setDeleting(false); setWallItemToDelete(null); }
    }, [dispatch, deleteWallItemAction, wallItemToDelete, setSelectedItems, getWallItemsAction]);

    const handleDeleteSelectedWallItems = useCallback(async () => {
        if (selectedItems.length === 0) {
             toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
             return;
        }
        setDeleting(true);
        const idsToDelete = selectedItems.map(item => item.id);
         const commaSeparatedIds = idsToDelete.join(','); // Format IDs as needed by API

        try {
            await dispatch(deleteAllWallItemsAction({ ids: commaSeparatedIds })).unwrap(); // **Adjust action name**
            toast.push(<Notification title="Wall Items Deleted" type="success" duration={2000}>{selectedItems.length} item(s) deleted.</Notification>);
        } catch (error: any) {
             console.error('Delete selected Wall Items error:', error);
            toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || error.data?.message || 'Failed to delete selected wall items.'}</Notification>);
        } finally {
             setSelectedItems([]);
             dispatch(getWallItemsAction());
             setDeleting(false);
        }
    }, [dispatch, deleteAllWallItemsAction, selectedItems, setSelectedItems, getWallItemsAction]);

    // --- Other Action Column Handlers ---
    const handleChangeWallItemStatus = useCallback(async (item: WallItem) => {
        // **Implement actual Redux action dispatch for status change**
        // Example: Cycle between UI statuses or map to API status values
        toast.push(<Notification title="Status Change" type="info">Attempting to change status for item {item.id}... (Implement backend update)</Notification>);
        console.log(`Simulating status change for Wall Item ID ${item.id}`);

        // *** For now, just refresh data to reflect potential change if API supports it or you have a polling mechanism ***
        dispatch(getWallItemsAction());
    }, [dispatch, getWallItemsAction]);

    const handleCloneWallItem = useCallback((itemToClone: WallItem) => {
        // **Implement actual clone logic/navigation**
        toast.push(<Notification title="Clone Wall Item" type="info">Cloning "{itemToClone.id}"... (Implement clone logic/navigation)</Notification>);
        console.log(`Simulating cloning Wall Item ID ${itemToClone.id}`);
        // Example navigation: navigate('/wall/create', { state: { cloneData: itemToClone } });
    }, []);


    // --- Filter Handlers ---
    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = useCallback(() => setFilterDrawerOpen(false), []);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
         setFilterCriteria(data);
         handleSetTableData({ pageIndex: 1 });
         closeFilterDrawer();
     }, [handleSetTableData, closeFilterDrawer]);
    const onClearFilters = useCallback(() => {
         const defaultFilters = { filterStatuses: [], filterProductStatuses: [], filterIntents: [], filterProductIds: [], filterCustomerIds: [], filterCompanyIds: [] };
         filterFormMethods.reset(defaultFilters);
         setFilterCriteria(defaultFilters);
         handleSetTableData({ pageIndex: 1 });
     }, [filterFormMethods, handleSetTableData]);


    // --- Data Processing: Filtering, Searching, Sorting, Pagination ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: WallItem[] = cloneDeep(mappedWallItems);

        // --- Apply Filters ---
        if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) {
            const selectedStatuses = filterCriteria.filterStatuses.map(opt => opt.value); // UI record status (active/inactive)
            processedData = processedData.filter(item => selectedStatuses.includes(item.recordStatus));
        }
         if (filterCriteria.filterProductStatuses && filterCriteria.filterProductStatuses.length > 0) {
            const selectedStatuses = filterCriteria.filterProductStatuses.map(opt => opt.value); // API product status (Active/Non-active)
            processedData = processedData.filter(item => selectedStatuses.includes(item.productStatus));
         }
         if (filterCriteria.filterIntents && filterCriteria.filterIntents.length > 0) {
             const selectedIntents = filterCriteria.filterIntents.map(opt => opt.value); // API intent (Sell/Buy)
             processedData = processedData.filter(item => selectedIntents.includes(item.intent));
         }
         if (filterCriteria.filterProductIds && filterCriteria.filterProductIds.length > 0) {
             const selectedIds = filterCriteria.filterProductIds.map(opt => opt.value); // Product IDs
             processedData = processedData.filter(item => selectedIds.includes(item.productId));
         }
         if (filterCriteria.filterCustomerIds && filterCriteria.filterCustomerIds.length > 0) {
             const selectedIds = filterCriteria.filterCustomerIds.map(opt => opt.value); // Customer IDs
             processedData = processedData.filter(item => selectedIds.includes(item.customerId));
         }
         if (filterCriteria.filterCompanyIds && filterCriteria.filterCompanyIds.length > 0) {
             const selectedIds = filterCriteria.filterCompanyIds.map(opt => opt.value); // Company IDs
             processedData = processedData.filter(item => item.companyId !== undefined && item.companyId !== null && selectedIds.includes(item.companyId)); // Added null check for companyId
         }
         // Add date range filter here if needed


        // --- Apply Quick Search ---
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                String(item.id ?? '').toLowerCase().includes(query) ||
                (item.productName?.toLowerCase().includes(query) ?? false) ||
                (item.productSpecs?.toLowerCase().includes(query) ?? false) || // Assuming productSpecs is a mapped field or available somehow
                (item.companyId?.toLowerCase().includes(query) ?? false) ||
                (item.customerName?.toLowerCase().includes(query) ?? false) || // Assuming customer name is mapped
                (item.createdByName?.toLowerCase().includes(query) ?? false) || // Assuming created by name is mapped
                String(item.qty ?? '').toLowerCase().includes(query) ||
                item.recordStatus.toLowerCase().includes(query) || // UI status
                item.productStatus.toLowerCase().includes(query) || // UI product status
                item.intent.toLowerCase().includes(query) // UI intent
            );
        }

        // --- Apply Sorting ---
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                let aValue: any = (a as any)[key]; // Use any for flexible access
                let bValue: any = (b as any)[key];


                 // Handle Date sorting (using dayjs)
                 if (key === 'createdAt' || key === 'updatedAt' || key === 'deliveryAt' || key === 'expiredDate') {
                     const dateA = aValue ? dayjs(aValue).valueOf() : (order === 'asc' ? -Infinity : Infinity); // Treat null/invalid dates consistently
                     const dateB = bValue ? dayjs(bValue).valueOf() : (order === 'asc' ? -Infinity : Infinity);

                     // Handle cases where dayjs parsing results in NaN
                     if (isNaN(dateA) && isNaN(dateB)) return 0;
                     if (isNaN(dateA)) return order === 'asc' ? -1 : 1;
                     if (isNaN(dateB)) return order === 'asc' ? 1 : -1;

                     return order === 'asc' ? dateA - dateB : dateB - dateA;
                 }

                 // Handle Numerical sorting (id, qty, price, etc.)
                 if (key === 'id' || key === 'qty' || key === 'price' || key === 'activeHrs' || key === 'masterCartoonQty' || key === 'paymentTermDays' || key === 'productId' || key === 'customerId' || key === 'createdByUserId' || key === 'productSpecId') {
                    const numA = typeof aValue === 'number' ? aValue : (aValue ? Number(aValue) : (order === 'asc' ? -Infinity : Infinity)); // Convert to number, handle null/invalid
                    const numB = typeof bValue === 'number' ? bValue : (bValue ? Number(bValue) : (order === 'asc' ? -Infinity : Infinity));

                    // Handle cases where conversion results in NaN
                     if (isNaN(numA) && isNaN(numB)) return 0;
                     if (isNaN(numA)) return order === 'asc' ? -1 : 1;
                     if (isNaN(numB)) return order === 'asc' ? 1 : -1;

                    return order === 'asc' ? numA - numB : numB - numA;
                 }

                 // Handle Boolean sorting
                 if (key === 'isWallManual') {
                      const boolA = Boolean(aValue); // Ensure boolean comparison
                      const boolB = Boolean(bValue);
                      if (boolA === boolB) return 0;
                      if (boolA === false && boolB === true) return order === 'asc' ? -1 : 1;
                      if (boolA === true && boolB === false) return order === 'asc' ? 1 : -1;
                      return 0; // Should not reach here for booleans
                 }


                // Default string comparison for other keys
                const stringA = String(aValue ?? '').toLowerCase();
                const stringB = String(bValue ?? '').toLowerCase();
                if (stringA < stringB) return order === 'asc' ? -1 : 1;
                if (stringA > stringB) return order === 'asc' ? 1 : -1;
                return 0;
            });
            processedData = sortedData;
        }

        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [mappedWallItems, tableData.query, tableData.sort, filterCriteria, tableData.pageIndex, tableData.pageSize]);


    // --- Row Selection Callbacks ---
    const handleRowSelect = useCallback((checked: boolean, row: WallItem) => {
        setSelectedItems(prev => {
            if (checked) { return prev.some(item => item.id === row.id) ? prev : [...prev, row]; }
            else { return prev.filter(item => item.id !== row.id); }
        });
    }, []);

    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<WallItem>[]) => {
        const currentPageOriginals = currentRows.map(r => r.original);
        if (checked) {
             setSelectedItems(prev => {
                const prevIds = new Set(prev.map(item => item.id));
                const newSelection = currentPageOriginals.filter(item => !prevIds.has(item.id));
                return [...prev, ...newSelection];
             });
        } else {
             const currentIds = new Set(currentPageOriginals.map(r => r.id));
             setSelectedItems(prev => prev.filter(item => !currentIds.has(item.id)));
        }
    }, []);


    // --- Export/Import Handlers ---
    const handleExportData = useCallback(() => {
        const success = exportToCsvWall('wall_items_export.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    }, [allFilteredAndSortedData]);

     const handleImportData = useCallback(() => {
        setImportDialogOpen(true);
        console.log("Import functionality triggered.");
    }, []);

    const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            console.log("File selected for Wall Item import:", file.name);
            // **Implement actual file processing and dispatching import action**
            // dispatch(importWallItemsAction(file));
            setImportDialogOpen(false); // Close dialog
            toast.push(<Notification title="Import Initiated" type="info">Wall Item import process started. Check notifications for status.</Notification>);
        }
        event.target.value = ''; // Clear input value
    }, [dispatch /* Add import action if needed */]);


    // --- Generate Dynamic Filter/Form Options ---
    // **Replace these dummy options with data fetched from Redux for related entities**
    const productOptions = useMemo(() => dummyProductOptions, []); // Replace dummy data
    const customerOptions = useMemo(() => dummyCustomerOptions, []); // Replace dummy data
    const companyOptions = useMemo(() => dummyCompanyOptions, []); // Replace dummy data
    const userOptions = useMemo(() => dummyUserOptions, []); // Replace dummy data (for created_by)
    const productSpecOptions = useMemo(() => dummyProductSpecOptions, []); // Replace dummy data

    // Options for the 'status' filter (using UI mapped status)
    const filterRecordStatusOptions = useMemo(() => uiRecordStatusOptions, []); // Use UI mapped status options

    // Options for the 'product_status' filter (using API values)
    const filterProductStatusOptions = useMemo(() => apiProductStatusOptions, []); // Use API product status options

    // Options for the 'want_to' filter (using API values)
    const filterIntentOptions = useMemo(() => apiIntentOptions, []); // Use API intent options


    // --- Define DataTable Columns ---
    const columns: ColumnDef<WallItem>[] = useMemo(() => [
        { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 },
        {
            header: 'Status', accessorKey: 'recordStatus', enableSorting: true, size: 120,
            cell: props => {
                const { recordStatus } = props.row.original;
                // Map UI status to color class (ensure recordStatusColorMapping is defined)
                const colorClass = recordStatusColorMapping[recordStatus] || 'bg-gray-500'; // Fallback color
                return <Tag className={`${colorClass} text-white capitalize`}>{recordStatus}</Tag>;
            }
        },
         {
            header: 'Product', accessorKey: 'productName', enableSorting: true, size: 200,
            cell: props => {
                 const { productName, productIconUrl } = props.row.original;
                 return (
                     <div className="flex items-center gap-2">
                         {/* Display Avatar with icon or initial */}
                         <Avatar size={30} shape="circle" src={productIconUrl || undefined} icon={<TbBox />}>
                            {!productIconUrl && productName ? productName.charAt(0).toUpperCase() : ''}
                         </Avatar>
                         <span className="font-semibold">{productName || '-'}</span>
                     </div>
                 )
             }
        },
        { header: 'Qty', accessorKey: 'qty', enableSorting: true, size: 80 },
         {
            header: 'Product Status', accessorKey: 'productStatus', enableSorting: true, size: 140,
            cell: props => {
                const { productStatus } = props.row.original;
                // Map UI product status to color class (ensure productStatusColorMapping is defined)
                const colorClass = productStatusColorMapping[productStatus] || 'bg-gray-500'; // Fallback color
                // Optional: Format product status text for display
                const displayStatus = productStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Example: 'Non-active' -> 'Non-Active'
                return <Tag className={`${colorClass} font-semibold`}>{displayStatus}</Tag>;
            }
        },
         {
            header: 'Intent', accessorKey: 'intent', enableSorting: true, size: 100,
             cell: props => {
                 const { intent } = props.row.original;
                 // Optional: Format intent text for display
                 const displayIntent = intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Example: 'Sell' -> 'Sell'
                 return <span>{displayIntent || '-'}</span>;
             }
         },
         // Add other columns based on WallItem type and UI requirements
        { header: 'Price', accessorKey: 'price', enableSorting: true, size: 100, cell: props => props.row.original.price ?? '-' },
        { header: 'Company ID', accessorKey: 'companyId', enableSorting: true, size: 120, cell: props => props.row.original.companyId ?? '-' },
        { header: 'Customer ID', accessorKey: 'customerId', enableSorting: true, size: 120, cell: props => props.row.original.customerId ?? '-' },
        // { header: 'Created By', accessorKey: 'createdByName', enableSorting: true, size: 150, cell: props => props.row.original.createdByName ?? '-' }, // If mapping user name
        {
            header: 'Created At', accessorKey: 'createdAt', enableSorting: true, size: 180,
            cell: props => {
                const date = props.row.original.createdAt;
                return <span>{date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'}</span>; // Format date
            }
        },
        {
            header: 'Action', id: 'action', width: 130,
            meta : {HeaderClass : "text-center"},
            cell: (props) => (
                <ActionColumn
                    onClone={() => handleCloneWallItem(props.row.original)}
                    onChangeStatus={() => handleChangeWallItemStatus(props.row.original)}
                    onEdit={() => openEditWallItemDrawer(props.row.original)} // Open edit drawer
                    onDelete={() => handleDeleteWallItemClick(props.row.original)} // Open delete dialog
                />
            ),
        },
    ], [handleCloneWallItem, handleChangeWallItemStatus, openEditWallItemDrawer, handleDeleteWallItemClick]); // Dependencies


    // Determine overall loading status for the table (Redux status OR local submitting/deleting)
    const tableLoading = masterLoadingStatus === 'loading' || isSubmitting || isDeleting;

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    {/* Header Section */}
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Wall Listing</h5> {/* Updated title */}
                         <Button variant="solid" icon={<TbPlus />} onClick={openAddWallItemDrawer}>Add New Item</Button> {/* Button to add new item */}
                    </div>

                    {/* Tools Section (Search, Filter, Import, Export) */}
                    <div className="mb-4">
                         <WallItemTableTools
                            onSearchChange={handleSearchChange} // Pass search handler
                            onFilter={openFilterDrawer} // Pass handler to open filter drawer
                            onExport={handleExportData} // Pass handler to trigger export
                            onImport={handleImportData} // Pass handler to trigger import dialog
                        />
                    </div>

                    {/* Table Section */}
                    <div className="mt-4 flex-grow overflow-auto"> {/* Allows the table body to scroll */}
                        <WallItemTable
                            columns={columns} // Pass column definitions
                            data={pageData} // Pass paginated data for the current page
                            loading={tableLoading} // Pass combined loading status
                            pagingData={{ // Pass pagination metadata
                                total, // Total count after filtering/searching
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectedItems={selectedItems} // Pass selected items for checkboxes
                            onPaginationChange={handlePaginationChange} // Pass pagination handler
                            onSelectChange={handleSelectChange} // Pass page size change handler
                            onSort={handleSort} // Pass sort handler
                            onRowSelect={handleRowSelect} // Pass single row selection handler
                            onAllRowSelect={handleAllRowSelect} // Pass all row selection handler
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            {/* Selected Actions Footer (Bulk Delete) */}
            <WallItemSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelectedWallItems} />

            {/* Add Wall Item Drawer */}
            <Drawer title="Add Wall Item" isOpen={isAddDrawerOpen} onClose={closeAddWallItemDrawer} onRequestClose={closeAddWallItemDrawer}
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={closeAddWallItemDrawer} disabled={isSubmitting}>Cancel</Button>
                    <Button size="sm" variant="solid" form="addWallItemForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Save'}
                    </Button>
                </div>}>
                {/* Add Wall Item Form */}
                <Form id="addWallItemForm" onSubmit={addFormMethods.handleSubmit(onAddWallItemSubmit)} className="flex flex-col gap-4 h-full">
                     <div className="flex-grow overflow-y-auto"> {/* Allow form content to scroll */}
                        <FormItem label="Product" invalid={!!addFormMethods.formState.errors.product_id} errorMessage={addFormMethods.formState.errors.product_id?.message}>
                            <Controller name="product_id" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={productOptions} value={productOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product" isClearable/>
                            )} />
                        </FormItem>
                         <FormItem label="Customer" invalid={!!addFormMethods.formState.errors.customer_id} errorMessage={addFormMethods.formState.errors.customer_id?.message}>
                            <Controller name="customer_id" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={customerOptions} value={customerOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Customer" isClearable/>
                            )} />
                        </FormItem>
                         <FormItem label="Company ID" invalid={!!addFormMethods.formState.errors.company_id} errorMessage={addFormMethods.formState.errors.company_id?.message}>
                            <Controller name="company_id" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Company ID" />} />
                        </FormItem>
                         <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message}>
                            <Controller name="status" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiStatusOptions} value={apiStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Status"/>
                            )} />
                        </FormItem>
                         <FormItem label="Intent" invalid={!!addFormMethods.formState.errors.want_to} errorMessage={addFormMethods.formState.errors.want_to?.message}>
                            <Controller name="want_to" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiIntentOptions} value={apiIntentOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Intent"/>
                            )} />
                        </FormItem>
                         <FormItem label="Quantity" invalid={!!addFormMethods.formState.errors.qty} errorMessage={addFormMethods.formState.errors.qty?.message}>
                            <Controller name="qty" control={addFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                 <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Quantity" min={1} /> 
                            )} />
                        </FormItem>
                         <FormItem label="Product Status" invalid={!!addFormMethods.formState.errors.product_status} errorMessage={addFormMethods.formState.errors.product_status?.message}>
                            <Controller name="product_status" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiProductStatusOptions} value={apiProductStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product Status"/>
                            )} />
                        </FormItem>
                         <FormItem label="Source" invalid={!!addFormMethods.formState.errors.source} errorMessage={addFormMethods.formState.errors.source?.message}>
                            <Controller name="source" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiSourceOptions} value={apiSourceOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Source"/>
                            )} />
                        </FormItem>
                         <FormItem label="Created By User" invalid={!!addFormMethods.formState.errors.created_by} errorMessage={addFormMethods.formState.errors.created_by?.message}>
                            <Controller name="created_by" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={userOptions} value={userOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select User"/>
                            )} />
                        </FormItem>
                         <FormItem label="Active Hrs" invalid={!!addFormMethods.formState.errors.active_hrs} errorMessage={addFormMethods.formState.errors.active_hrs?.message}>
                            <Controller name="active_hrs" control={addFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Active Hours" isClearable min={0}/>
                            )} />
                        </FormItem>
                         <FormItem label="Expired Date" invalid={!!addFormMethods.formState.errors.expired_date} errorMessage={addFormMethods.formState.errors.expired_date?.message}>
                            <Controller name="expired_date" control={addFormMethods.control} render={({ field }) => (
                                <DatePicker value={field.value ? dayjs(field.value).toDate() : null} onChange={(date) => field.onChange(date ? dayjs(date).toISOString() : null)} placeholder="Select Date"/>
                            )} />
                        </FormItem>
                         <FormItem label="Internal Remarks" invalid={!!addFormMethods.formState.errors.internal_remarks} errorMessage={addFormMethods.formState.errors.internal_remarks?.message}>
                            <Controller name="internal_remarks" control={addFormMethods.control} render={({ field }) => <Input {...field} textArea placeholder="Enter Internal Remarks"/>} />
                        </FormItem>
                         <FormItem label="Product Spec" invalid={!!addFormMethods.formState.errors.product_spec_id} errorMessage={addFormMethods.formState.errors.product_spec_id?.message}>
                            <Controller name="product_spec_id" control={addFormMethods.control} render={({ field }) => (
                                <UiSelect options={productSpecOptions} value={productSpecOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product Spec"/>
                            )} />
                        </FormItem>
                         <FormItem label="Price" invalid={!!addFormMethods.formState.errors.price} errorMessage={addFormMethods.formState.errors.price?.message}>
                            <Controller name="price" control={addFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                <InputNumber {...rest} value={value} onChange={onChange} prefix="$" placeholder="Enter Price" isClearable min={0} precision={2}/>
                            )} />
                        </FormItem>
                         <FormItem label="Color" invalid={!!addFormMethods.formState.errors.color} errorMessage={addFormMethods.formState.errors.color?.message}>
                            <Controller name="color" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Color"/>} />
                        </FormItem>
                         <FormItem label="Master Cartoon Qty" invalid={!!addFormMethods.formState.errors.master_cartoon} errorMessage={addFormMethods.formState.errors.master_cartoon?.message}>
                            <Controller name="master_cartoon" control={addFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Master Cartoon Qty" isClearable min={0}/>
                            )} />
                        </FormItem>
                         <FormItem label="Dispatch Status" invalid={!!addFormMethods.formState.errors.dispatch_status} errorMessage={addFormMethods.formState.errors.dispatch_status?.message}>
                            <Controller name="dispatch_status" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Dispatch Status"/>} />
                        </FormItem>
                         <FormItem label="Payment Term (Days)" invalid={!!addFormMethods.formState.errors.payment_term} errorMessage={addFormMethods.formState.errors.payment_term?.message}>
                            <Controller name="payment_term" control={addFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                 <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Payment Term" isClearable min={0}/>
                            )} />
                        </FormItem>
                         <FormItem label="ETA Details" invalid={!!addFormMethods.formState.errors.eta_details} errorMessage={addFormMethods.formState.errors.eta_details?.message}>
                            <Controller name="eta_details" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter ETA Details"/>} />
                        </FormItem>
                         <FormItem label="Location" invalid={!!addFormMethods.formState.errors.location} errorMessage={addFormMethods.formState.errors.location?.message}>
                            <Controller name="location" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Location"/>} />
                        </FormItem>
                        {/* is_wall_manual - assuming a checkbox or switch */}
                         {/* <FormItem label="Is Manual Entry" invalid={!!addFormMethods.formState.errors.is_wall_manual} errorMessage={addFormMethods.formState.errors.is_wall_manual?.message}>
                            <Controller name="is_wall_manual" control={addFormMethods.control} render={({ field: { value, onChange, ...rest } }) => (
                                // Use your Switch or Checkbox component here
                                <Switch checked={value} onChange={onChange} {...rest} />
                            )} />
                        </FormItem> */}
                         {/* wall_link_token, wall_link_datetime - probably not form inputs */}
                     </div>
                </Form>
            </Drawer>

            {/* Edit Wall Item Drawer */}
             <Drawer title="Edit Wall Item" isOpen={isEditDrawerOpen} onClose={closeEditWallItemDrawer} onRequestClose={closeEditWallItemDrawer}
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={closeEditWallItemDrawer} disabled={isSubmitting}>Cancel</Button>
                    <Button size="sm" variant="solid" form="editWallItemForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>}>
                {/* Edit Wall Item Form */}
                <Form id="editWallItemForm" onSubmit={editFormMethods.handleSubmit(onEditWallItemSubmit)} className="flex flex-col gap-4 h-full">
                     <div className="flex-grow overflow-y-auto"> {/* Allow form content to scroll */}
                        {/* Display current product image/name if available */}
                         {editingWallItem?.productIconUrl && (
                             <FormItem label="Current Product">
                                 <div className="flex items-center gap-2">
                                     <Avatar size={80} shape="rounded" src={editingWallItem.productIconUrl} icon={<TbBox />} />
                                     <span className="font-semibold text-gray-900 dark:text-gray-100">{editingWallItem.productName || '-'}</span>
                                 </div>
                             </FormItem>
                         )}
                         {/* Most fields will be the same as the add form */}
                         <FormItem label="Product" invalid={!!editFormMethods.formState.errors.product_id} errorMessage={editFormMethods.formState.errors.product_id?.message}>
                            <Controller name="product_id" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={productOptions} value={productOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product" isClearable/>
                            )} />
                        </FormItem>
                         <FormItem label="Customer" invalid={!!editFormMethods.formState.errors.customer_id} errorMessage={editFormMethods.formState.errors.customer_id?.message}>
                            <Controller name="customer_id" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={customerOptions} value={customerOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Customer" isClearable/>
                            )} />
                        </FormItem>
                         <FormItem label="Company ID" invalid={!!editFormMethods.formState.errors.company_id} errorMessage={editFormMethods.formState.errors.company_id?.message}>
                            <Controller name="company_id" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Company ID" />} />
                        </FormItem>
                         <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message}>
                            <Controller name="status" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiStatusOptions} value={apiStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Status"/>
                            )} />
                        </FormItem>
                         <FormItem label="Intent" invalid={!!editFormMethods.formState.errors.want_to} errorMessage={editFormMethods.formState.errors.want_to?.message}>
                            <Controller name="want_to" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiIntentOptions} value={apiIntentOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Intent"/>
                            )} />
                        </FormItem>
                         <FormItem label="Quantity" invalid={!!editFormMethods.formState.errors.qty} errorMessage={editFormMethods.formState.errors.qty?.message}>
                            <Controller name="qty" control={editFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                 <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Quantity" min={1}/>
                            )} />
                        </FormItem>
                         <FormItem label="Product Status" invalid={!!editFormMethods.formState.errors.product_status} errorMessage={editFormMethods.formState.errors.product_status?.message}>
                            <Controller name="product_status" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiProductStatusOptions} value={apiProductStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product Status"/>
                            )} />
                        </FormItem>
                         <FormItem label="Source" invalid={!!editFormMethods.formState.errors.source} errorMessage={editFormMethods.formState.errors.source?.message}>
                            <Controller name="source" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={apiSourceOptions} value={apiSourceOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Source"/>
                            )} />
                        </FormItem>
                         <FormItem label="Created By User" invalid={!!editFormMethods.formState.errors.created_by} errorMessage={editFormMethods.formState.errors.created_by?.message}>
                            <Controller name="created_by" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={userOptions} value={userOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select User"/>
                            )} />
                        </FormItem>
                         <FormItem label="Active Hrs" invalid={!!editFormMethods.formState.errors.active_hrs} errorMessage={editFormMethods.formState.errors.active_hrs?.message}>
                            <Controller name="active_hrs" control={editFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Active Hours" isClearable min={0}/>
                            )} />
                        </FormItem>
                         <FormItem label="Expired Date" invalid={!!editFormMethods.formState.errors.expired_date} errorMessage={editFormMethods.formState.errors.expired_date?.message}>
                            <Controller name="expired_date" control={editFormMethods.control} render={({ field }) => (
                                 <DatePicker value={field.value ? dayjs(field.value).toDate() : null} onChange={(date) => field.onChange(date ? dayjs(date).toISOString() : null)} placeholder="Select Date"/>
                            )} />
                        </FormItem>
                         <FormItem label="Internal Remarks" invalid={!!editFormMethods.formState.errors.internal_remarks} errorMessage={editFormMethods.formState.errors.internal_remarks?.message}>
                            <Controller name="internal_remarks" control={editFormMethods.control} render={({ field }) => <Input {...field} textArea placeholder="Enter Internal Remarks"/>} />
                        </FormItem>
                         <FormItem label="Product Spec" invalid={!!editFormMethods.formState.errors.product_spec_id} errorMessage={editFormMethods.formState.errors.product_spec_id?.message}>
                            <Controller name="product_spec_id" control={editFormMethods.control} render={({ field }) => (
                                <UiSelect options={productSpecOptions} value={productSpecOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Product Spec"/>
                            )} />
                        </FormItem>
                         <FormItem label="Price" invalid={!!editFormMethods.formState.errors.price} errorMessage={editFormMethods.formState.errors.price?.message}>
                            <Controller name="price" control={editFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                <InputNumber {...rest} value={value} onChange={onChange} prefix="$" placeholder="Enter Price" isClearable min={0} precision={2}/>
                            )} />
                        </FormItem>
                         <FormItem label="Color" invalid={!!editFormMethods.formState.errors.color} errorMessage={editFormMethods.formState.errors.color?.message}>
                            <Controller name="color" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Color"/>} />
                        </FormItem>
                         <FormItem label="Master Cartoon Qty" invalid={!!editFormMethods.formState.errors.master_cartoon} errorMessage={editFormMethods.formState.errors.master_cartoon?.message}>
                            <Controller name="master_cartoon" control={editFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Master Cartoon Qty" isClearable min={0}/>
                            )} />
                        </FormItem>
                         <FormItem label="Dispatch Status" invalid={!!editFormMethods.formState.errors.dispatch_status} errorMessage={editFormMethods.formState.errors.dispatch_status?.message}>
                            <Controller name="dispatch_status" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Dispatch Status"/>} />
                        </FormItem>
                         <FormItem label="Payment Term (Days)" invalid={!!editFormMethods.formState.errors.payment_term} errorMessage={editFormMethods.formState.errors.payment_term?.message}>
                            <Controller name="payment_term" control={editFormMethods.control} render={({ field: { onChange, value, ...rest } }) => (
                                 <InputNumber {...rest} value={value} onChange={onChange} placeholder="Enter Payment Term" isClearable min={0}/>
                            )} />
                        </FormItem>
                         <FormItem label="ETA Details" invalid={!!editFormMethods.formState.errors.eta_details} errorMessage={editFormMethods.formState.errors.eta_details?.message}>
                            <Controller name="eta_details" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter ETA Details"/>} />
                        </FormItem>
                         <FormItem label="Location" invalid={!!editFormMethods.formState.errors.location} errorMessage={editFormMethods.formState.errors.location?.message}>
                            <Controller name="location" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Location"/>} />
                        </FormItem>
                         {/* is_wall_manual checkbox/switch */}
                          {/* <FormItem label="Is Manual Entry" invalid={!!editFormMethods.formState.errors.is_wall_manual} errorMessage={editFormMethods.formState.errors.is_wall_manual?.message}>
                            <Controller name="is_wall_manual" control={editFormMethods.control} render={({ field: { value, onChange, ...rest } }) => (
                                <Switch checked={value} onChange={onChange} {...rest} />
                            )} />
                        </FormItem> */}
                     </div>
                </Form>
            </Drawer>

            {/* Filter Wall Items Drawer */}
            <Drawer title="Filter Wall Items" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button>
                    <Button size="sm" variant="solid" form="filterWallItemForm" type="submit">Apply</Button>
                </div>}>
                {/* Filter Wall Items Form */}
                <Form id="filterWallItemForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 h-full">
                    <div className="flex-grow overflow-y-auto"> {/* Allow form content to scroll */}
                         <FormItem label="Record Status">
                            <Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (
                                 <UiSelect isMulti placeholder="Select statuses..." options={filterRecordStatusOptions} value={field.value} onChange={val => field.onChange(val)} />
                            )} />
                        </FormItem>
                         <FormItem label="Product Status">
                            <Controller name="filterProductStatuses" control={filterFormMethods.control} render={({ field }) => (
                                 <UiSelect isMulti placeholder="Select product statuses..." options={filterProductStatusOptions} value={field.value} onChange={val => field.onChange(val)} />
                            )} />
                        </FormItem>
                         <FormItem label="Intent">
                            <Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => (
                                 <UiSelect isMulti placeholder="Select intents..." options={filterIntentOptions} value={field.value} onChange={val => field.onChange(val)} />
                            )} />
                        </FormItem>
                         <FormItem label="Product">
                            <Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => (
                                 <UiSelect isMulti placeholder="Select products..." options={productOptions} value={field.value} onChange={val => field.onChange(val)} />
                            )} />
                        </FormItem>
                         <FormItem label="Customer">
                            <Controller name="filterCustomerIds" control={filterFormMethods.control} render={({ field }) => (
                                 <UiSelect isMulti placeholder="Select customers..." options={customerOptions} value={field.value} onChange={val => field.onChange(val)} />
                            )} />
                        </FormItem>
                         <FormItem label="Company">
                            <Controller name="filterCompanyIds" control={filterFormMethods.control} render={({ field }) => (
                                 <UiSelect isMulti placeholder="Select companies..." options={companyOptions} value={field.value} onChange={val => field.onChange(val)} />
                            )} />
                        </FormItem>
                         {/* Add date range filter for Created At if needed */}
                         {/* <FormItem label="Created Date Range">
                            <Controller name="filterDateRange" control={filterFormMethods.control} render={({ field }) => (
                                <DatePicker.DatePickerRange value={field.value as DatePickerRangeProps} onChange={field.onChange} placeholder="Select dates range"/>
                            )} />
                        </FormItem> */}
                    </div>
                </Form>
            </Drawer>

            {/* Single Delete Confirmation Dialog */}
            <ConfirmDialog isOpen={singleDeleteOpen} type="danger" title="Delete Wall Item"
                onClose={() => { setSingleDeleteOpen(false); setWallItemToDelete(null); }} onRequestClose={() => { setSingleDeleteOpen(false); setWallItemToDelete(null); }} onCancel={() => { setSingleDeleteOpen(false); setWallItemToDelete(null); }}
                onConfirm={onConfirmSingleWallItemDelete} loading={isDeleting}>
                <p>Are you sure you want to delete the Wall Item with ID "<strong>{wallItemToDelete?.id}</strong>"?</p>
            </ConfirmDialog>

             {/* Basic Import Dialog Placeholder */}
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

export default WallListing; // Export the component

// Helper function for classNames (kept as it's used in ActionColumn)
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' '); }