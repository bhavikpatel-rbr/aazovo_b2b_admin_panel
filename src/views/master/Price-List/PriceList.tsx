// src/views/your-path/PriceList.tsx

import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import cloneDeep from 'lodash/cloneDeep'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import * as XLSX from 'xlsx'
import { z } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import DebounceInput from '@/components/shared/DebouceInput'
import { Avatar, Card, Checkbox, Dialog, Drawer, Dropdown, Form, FormItem, Input, Table, Tag } from '@/components/ui'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import Select from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import Tooltip from '@/components/ui/Tooltip'

// Icons
import { BsFileExcelFill } from 'react-icons/bs'
import { FaRegFilePdf, FaWhatsapp } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { TbBell, TbBox, TbClipboardText, TbClockDollar, TbCloudUpload, TbColumns, TbDeviceWatchDollar, TbDiscount, TbDiscountOff, TbEyeDollar, TbFileDownload, TbFilter, TbPencil, TbPencilDollar, TbPlus, TbReceipt, TbReload, TbSearch, TbShare, TbUser, TbUserCircle, TbX } from 'react-icons/tb'

// Types
import type { TableQueries } from '@/@types/common'
import type { CellContext, ColumnDef, OnSortParam } from '@/components/shared/DataTable'

// Redux Imports
import { authSelector } from '@/reduxtool/auth/authSlice'; // Assuming this path for the logged-in user
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    addNotificationAction,
    addPriceListAction,
    editPriceListAction,
    getAllProductAction,
    getAllUsersAction,
    getBrandAction,
    getCategoriesAction,
    getPriceListAction,
    getSubcategoriesByCategoryIdAction,
    // addNotificationAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'


// --- FEATURE-SPECIFIC TYPES & SCHEMAS ---
export type ApiProduct = { id: number; name: string; thumb_image_full_path?: string; category?: { id: number; name: string } | null; sub_category?: { id: number; name: string } | null; brand?: { id: number; name: string } | null; }
export type PriceListItem = { id: number; product_id: string; price: string; base_price: string; gst_price: string; usd_rate: string; usd: string; expance: string; interest: string; nlc: string; margin: string; sales_price: string; status: 'Active' | 'Inactive'; created_at?: string; updated_at?: string; updated_by_user?: { name: string, profile_pic_path?: string, roles: { display_name: string }[] }; product: ApiProduct; }
export type ProductMasterItem = { id: string | number; name: string; }
export type SelectOption = { value: any; label: string };
export type PriceListModalType = 'notification';
export interface PriceListModalState { isOpen: boolean; type: PriceListModalType | null; data: PriceListItem | null; }
type PriceListFilterSchema = { productIds: string[]; categoryIds: number[]; subCategoryIds: number[]; brandIds: number[]; status: ('Active' | 'Inactive')[]; date: [Date | null, Date | null] | null; };
const priceListFormSchema = z.object({ product_id: z.string().min(1, 'Product is required.'), price: z.string().min(1, 'Price is required.').regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'), usd_rate: z.string().min(1, 'USD Rate is required.').regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'), expance: z.string().min(1, 'Expenses are required.').regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'), margin: z.string().min(1, 'Margin is required.').regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number'), status: z.enum(['Active', 'Inactive'], { required_error: 'Status is required.' }), });
type PriceListFormData = z.infer<typeof priceListFormSchema>;
const exportReasonSchema = z.object({ reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const statusOptions: SelectOption[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' },];

// --- HELPER FUNCTIONS ---
function exportToCsv(filename: string, rows: PriceListItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    const CSV_HEADERS = ["ID", "Product ID", "Product Name", "Price", "Base Price", "GST Price", "USD Rate", "USD Amount", "Expense", "Interest", "NLC", "Margin", "Sales Price", "Status", "Updated By", "Updated Role", "Updated At",];
    const preparedRows = rows.map(row => ({ id: row.id, product_id: row.product_id, productNameForCsv: row.product?.name || String(row.product_id), price: row.price, base_price: row.base_price, gst_price: row.gst_price, usd_rate: row.usd_rate, usd: row.usd, expance: row.expance, interest: row.interest, nlc: row.nlc, margin: row.margin, sales_price: row.sales_price, status: row.status, updated_by_name: row.updated_by_user?.name || 'N/A', updated_by_role: row.updated_by_user?.roles?.[0]?.display_name || 'N/A', updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A' }));
    const csvContent = [CSV_HEADERS.join(','), ...preparedRows.map(row => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
}

function exportToExcel(filename: string, data: PriceListItem[]) {
    if (!data || !data.length) { toast.push(<Notification title="No Data" type="info" children="Nothing to export." />); return; }
    const worksheetData = data.map(item => ({ 'Product Name': item.product?.name, 'Sales Price': item.sales_price, 'Base Price': item.base_price, Status: item.status, 'Last Updated': new Date(item.updated_at || '').toLocaleString(), }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Price List");
    XLSX.writeFile(workbook, filename);
    toast.push(<Notification title="Export Successful" type="success" children={`Data exported to ${filename}.`} />);
}

function exportToPdf(data: PriceListItem[]) {
    if (!data || !data.length) { toast.push(<Notification title="No Data" type="info" children="Nothing to export." />); return; }
    const doc = new jsPDF();
    doc.text("Today's Price List", 14, 16);
    (doc as any).autoTable({
        head: [['Product Name', 'Sales Price', 'Status']],
        body: data.map(item => [item.product?.name || 'N/A', `Rs. ${item.sales_price}`, item.status]),
        startY: 20,
    });
    doc.save('todays-prices.pdf');
    toast.push(<Notification title="Export Successful" type="success" children="PDF downloaded." />);
}

function getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// --- REUSABLE DISPLAY & TOOL COMPONENTS ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, productOptions, categoryOptions, subCategoryOptions, brandOptions }) => {
    const findLabel = (options: SelectOption[], value: any) => options.find(o => o.value === value)?.label || String(value);
    const activeProducts = filterData.productIds?.map(id => ({ value: id, label: findLabel(productOptions, id) })) || [];
    const activeCategories = filterData.categoryIds?.map(id => ({ value: id, label: findLabel(categoryOptions, id) })) || [];
    const activeSubCategories = filterData.subCategoryIds?.map(id => ({ value: id, label: findLabel(subCategoryOptions, id) })) || [];
    const activeBrands = filterData.brandIds?.map(id => ({ value: id, label: findLabel(brandOptions, id) })) || [];
    const activeStatuses = filterData.status || [];
    const activeDateRange = filterData.date;
    const hasActiveFilters = [activeProducts, activeCategories, activeSubCategories, activeBrands, activeStatuses].some(arr => arr.length > 0) || activeDateRange;
    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeProducts.map(item => (<Tag key={`prod-${item.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Prod: {item.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('productIds', item.value)} /></Tag>))}
            {activeCategories.map(item => (<Tag key={`cat-${item.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Cat: {item.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('categoryIds', item.value)} /></Tag>))}
            {activeSubCategories.map(item => (<Tag key={`subcat-${item.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">SubCat: {item.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('subCategoryIds', item.value)} /></Tag>))}
            {activeBrands.map(item => (<Tag key={`brand-${item.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Brand: {item.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('brandIds', item.value)} /></Tag>))}
            {activeStatuses.map(status => (<Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('status', status)} /></Tag>))}
            {activeDateRange && (<Tag key="date" prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Date: Today<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('date', '')} /></Tag>)}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const PriceListTableTools = React.forwardRef(({ onSearchChange, onApplyFilters, onClearFilters, onExport, activeFilters, activeFilterCount, productOptions, categoryOptions, subCategoryOptions, brandOptions, columns, filteredColumns, setFilteredColumns, searchInputValue, dispatch, isFilterDrawerOpen, setIsFilterDrawerOpen }, ref) => {
    const { control, handleSubmit, setValue, watch } = useForm<PriceListFilterSchema>({ defaultValues: { productIds: [], categoryIds: [], subCategoryIds: [], brandIds: [], status: [], date: null }, });
    useEffect(() => { Object.keys(activeFilters).forEach(key => setValue(key as keyof PriceListFilterSchema, activeFilters[key] || [])); }, [activeFilters, setValue]);
    const watchedCategoryIds = watch('categoryIds');
    useEffect(() => { if (isFilterDrawerOpen && watchedCategoryIds && watchedCategoryIds.length > 0) { dispatch(getSubcategoriesByCategoryIdAction(watchedCategoryIds[0])); } }, [watchedCategoryIds, isFilterDrawerOpen, dispatch]);
    const onSubmit = (data: PriceListFilterSchema) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
    const onDrawerClear = () => { onApplyFilters({}); setIsFilterDrawerOpen(false); };
    const toggleColumn = (checked: boolean, colHeader: string) => { const newCols = checked ? [...filteredColumns, columns.find(c => c.header === colHeader)!].sort((a, b) => columns.indexOf(a as any) - columns.indexOf(b as any)) : filteredColumns.filter(c => c.header !== colHeader); setFilteredColumns(newCols); };
    const isColumnVisible = (header: string) => filteredColumns.some(c => c.header === header);

    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0"><DebounceInput value={searchInputValue} placeholder="Search Product, ID, Status, User..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.map(col => col.header && (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}</div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} />
                <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)}>Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
            </div>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button><Button size="sm" variant="solid" type="submit" form="filterForm">Apply</Button></div>}>
                <Form id="filterForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Product"><Controller name="productIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select products..." options={productOptions} value={productOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Category"><Controller name="categoryIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select categories..." options={categoryOptions} value={categoryOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Sub Category"><Controller name="subCategoryIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select a category first..." options={subCategoryOptions} value={subCategoryOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} disabled={!watchedCategoryIds || watchedCategoryIds.length === 0} />)} /></FormItem>
                    <FormItem label="Brand"><Controller name="brandIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select brands..." options={brandOptions} value={brandOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Status"><Controller name="status" control={control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={statusOptions} value={statusOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                </Form>
            </Drawer>
        </div>
    );
});
PriceListTableTools.displayName = 'PriceListTableTools';

const ActionColumn = ({ rowData, onEdit, onOpenModal }: { rowData: PriceListItem; onEdit: () => void; onOpenModal: (type: PriceListModalType, data: PriceListItem) => void; }) => {
    const handleCopyDetails = (item: PriceListItem) => {
        const details = [`Product: ${item.product?.name}`, `Price: ${item.price}`, `Base Price: ${item.base_price}`, `Sales Price: ${item.sales_price}`, `Status: ${item.status}`].join('\n');
        navigator.clipboard.writeText(details).then(() => { toast.push(<Notification title="Copied to clipboard" type="success" duration={2000} />); }, () => { toast.push(<Notification title="Failed to copy" type="danger" duration={2000} />); });
    }
    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip title="Edit"><div className="text-lg p-1.5 cursor-pointer hover:text-blue-500" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Notify"><div className="text-lg p-1.5 cursor-pointer hover:text-amber-500" onClick={() => onOpenModal('notification', rowData)}><TbBell /></div></Tooltip>
            <Tooltip title="Copy Details"><div className="text-lg p-1.5 cursor-pointer hover:text-gray-600" onClick={() => handleCopyDetails(rowData)}><TbClipboardText /></div></Tooltip>
        </div>
    );
};

const AddNotificationDialog = ({ PriceList, onClose, getAllUserDataOptions }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    // --- Data Hooks ---
    // Get the current user's ID for the 'created_by' field
    const { user } = useSelector(authSelector);
    const createdById = user?.id;

    // --- Form Hooks & Schema ---
    const notificationSchema = z.object({
        notification_title: z.string().min(3, "Title must be at least 3 characters long."),
        send_users: z.array(z.number()).min(1, "Please select at least one user."),
        message: z.string().min(10, "Message must be at least 10 characters long."),
    });

    type NotificationFormData = z.infer<typeof notificationSchema>;

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            notification_title: `Price Update: ${PriceList.product.name}`,
            send_users: [],
            message: `The price for product "${PriceList.product.name}" has been updated. The new sales price is ₹${PriceList.sales_price}.`
        },
        mode: 'onChange'
    });

    // --- Event Handlers ---
    const onSend = async (formData: NotificationFormData) => {
        setIsLoading(true);
        // await dispatch(addNotificationAction(data)).unwrap();
        const payload = {
            // From form
            send_users: formData.send_users, // Key is `user_id`, value is an array of IDs
            notification_title: formData.notification_title,
            message: formData.message,

            // From context/props
            category_id: PriceList.product.category?.id || null,
            module_id: String(PriceList.id),
            module_name: 'PriceList',

            // Static/System values
            created_by: createdById,
            seen: 0,
        };

        try {
            await dispatch(addNotificationAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Notification Sent Successfully!" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Notify User about: {PriceList.product.name}</h5>
            <Form onSubmit={handleSubmit(onSend)}>
                <FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}>
                    <Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} />
                </FormItem>
                <FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}>
                    <Controller
                        name="send_users"
                        control={control}
                        render={({ field }) => (
                            <Select
                                isMulti
                                placeholder="Select User(s)"
                                options={getAllUserDataOptions}
                                value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))}
                                onChange={(options) => field.onChange(options?.map(o => o.value) || [])}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}>
                    <Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} />
                </FormItem>
                <div className="text-right mt-6">
                    <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button>
                </div>
            </Form>
        </Dialog>
    );
};


const PriceListModals: React.FC<{ modalState: PriceListModalState; onClose: () => void; }> = ({ modalState, onClose, getAllUserDataOptions }) => {
    const { type, data: PriceList, isOpen } = modalState;
    if (!isOpen || !PriceList) return null;
    switch (type) {
        case 'notification': return <AddNotificationDialog PriceList={PriceList} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
        default: return null;
    }
}

// --- MAIN PRICE LIST COMPONENT ---
const PriceList = () => {
    const dispatch = useAppDispatch();
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isTodayPriceDrawerOpen, setIsTodayPriceDrawerOpen] = useState(false);
    const [editingPriceListItem, setEditingPriceListItem] = useState<PriceListItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isTodayExportReasonModalOpen, setIsTodayExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [isTodaySubmittingExportReason, setIsTodaySubmittingExportReason] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Partial<PriceListFilterSchema>>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);
    const [modalState, setModalState] = useState<PriceListModalState>({ isOpen: false, type: null, data: null });

    const { priceListData = { data: [], counts: {} }, productsMasterData = [], status: masterLoadingStatus = "idle", CategoriesData: GlobalCategoriesData = [], subCategoriesForSelectedCategoryData = [], BrandData = [], getAllUserData = [] } = useSelector(masterSelector, shallowEqual);


    const productOptions = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map(p => ({ value: String(p.id), label: p.name })) : [], [productsMasterData]);
    const categoryOptions = useMemo(() => Array.isArray(GlobalCategoriesData) ? GlobalCategoriesData.map(c => ({ value: c.id, label: c.name })) : [], [GlobalCategoriesData]);
    const subCategoryOptions = useMemo(() => Array.isArray(subCategoriesForSelectedCategoryData) ? subCategoriesForSelectedCategoryData.map(sc => ({ value: sc.id, label: sc.name })) : [], [subCategoriesForSelectedCategoryData]);
    const brandOptions = useMemo(() => Array.isArray(BrandData) ? BrandData.map(b => ({ value: b.id, label: b.name })) : [], [BrandData]);
    const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map(b => ({ value: b.id, label: b.name })) : [], [getAllUserData]);

    useEffect(() => { dispatch(getPriceListAction()); dispatch(getAllProductAction()); dispatch(getCategoriesAction()); dispatch(getBrandAction()); dispatch(getAllUsersAction()) }, [dispatch]);

    const addFormMethods = useForm<PriceListFormData>({ resolver: zodResolver(priceListFormSchema), defaultValues: { product_id: '', price: '', usd_rate: '', expance: '', margin: '', status: 'Active' }, mode: "onChange" });
    const editFormMethods = useForm<PriceListFormData>({ resolver: zodResolver(priceListFormSchema), mode: 'onChange' });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

    const openImageViewer = useCallback((imageUrl: string | null | undefined) => {
        if (imageUrl) {
            setImageToView(imageUrl);
            setIsImageViewerOpen(true);
        }
    }, []);

    const closeImageViewer = useCallback(() => {
        setIsImageViewerOpen(false);
        setImageToView(null);
    }, []);

    const handleOpenModal = useCallback((type: PriceListModalType, itemData: PriceListItem) => {
        setModalState({ isOpen: true, type, data: itemData })
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalState({ isOpen: false, type: null, data: null })
    }, []);

    const onAddPriceListSubmit = async (data: PriceListFormData) => { setIsSubmitting(true); try { await dispatch(addPriceListAction(data)).unwrap(); toast.push(<Notification title="Price Item Added" type="success" />); closeAddDrawer(); dispatch(getPriceListAction()); } catch (error: any) { toast.push(<Notification title="Failed to Add" type="danger">{error.message}</Notification>); } finally { setIsSubmitting(false); } };
    
    const openAddDrawer = useCallback(() => { addFormMethods.reset(); setIsAddDrawerOpen(true); }, [addFormMethods]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

    const onEditPriceListSubmit = async (data: PriceListFormData) => { if (!editingPriceListItem) return; setIsSubmitting(true); try { await dispatch(editPriceListAction({ id: editingPriceListItem.id, ...data })).unwrap(); toast.push(<Notification title="Price Item Updated" type="success" />); closeEditDrawer(); dispatch(getPriceListAction()); } catch (error: any) { toast.push(<Notification title="Failed to Update" type="danger">{error.message}</Notification>); } finally { setIsSubmitting(false); } };

    const openEditDrawer = useCallback((item: PriceListItem) => {
        setEditingPriceListItem(item);
        editFormMethods.reset({ product_id: String(item.product_id), price: item.price, usd_rate: item.usd_rate, expance: item.expance, margin: item.margin, status: item.status });
        setIsEditDrawerOpen(true);
    }, [editFormMethods]);

    const closeEditDrawer = useCallback(() => {
        setIsEditDrawerOpen(false);
        setEditingPriceListItem(null);
    }, []);

    const columns: ColumnDef<PriceListItem>[] = useMemo(() => [
        { header: 'Product', accessorKey: 'product.name', enableSorting: true, size: 280, cell: (props: CellContext<PriceListItem, any>) => { const row = props.row.original; return (<div className="flex items-center gap-3"><Avatar size={40} shape="circle" src={row.product?.thumb_image_full_path} icon={<TbBox />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(row.product?.thumb_image_full_path)} /><div className="truncate"><span className="font-semibold">{row.product?.name || 'N/A'}</span></div></div>) } },
        { header: 'Price Breakup', accessorKey: 'price', enableSorting: true, size: 160, cell: ({ row }) => { const { price, base_price, gst_price, usd } = row.original; return (<div className="flex flex-col text-xs"><span>Price: {price}</span><span>Base: {base_price}</span><span>GST: {gst_price}</span><span>USD: {usd}</span></div>); }, },
        { header: 'Cost Split', accessorKey: 'nlc', enableSorting: true, size: 160, cell: ({ row }) => { const { expance, margin, interest, nlc } = row.original; return (<div className="flex flex-col text-xs"><span>Expense: {expance}</span><span>Margin: {margin}</span><span>Interest: {interest}</span><span>NLC: {nlc}</span></div>); }, },
        { header: 'Sales Price', accessorKey: 'sales_price', enableSorting: true, size: 140, },
        { header: 'Updated Info', accessorKey: 'updated_at', enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; const formattedDate = updated_at ? new Date(updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'; return (<div className="flex items-center gap-2"><Avatar src={updated_by_user?.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} /><div><span>{updated_by_user?.name || 'N/A'}</span><div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div><div className="text-xs text-gray-500">{formattedDate}</div></div></div>); } },
        { header: 'Status', accessorKey: 'status', enableSorting: true, size: 100, cell: (props) => (<Tag className={classNames('capitalize', { 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100': props.row.original.status === 'Active', 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100': props.row.original.status === 'Inactive' })}>{props.row.original.status}</Tag>) },
        { header: 'Actions', id: 'action', size: 120, meta: { cellClass: "text-center" }, cell: (props) => (<ActionColumn rowData={props.row.original} onEdit={() => openEditDrawer(props.row.original)} onOpenModal={handleOpenModal} />) },
    ], [handleOpenModal, openEditDrawer, openImageViewer]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<PriceListItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns) }, [columns]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData = Array.isArray(priceListData?.data) ? priceListData.data.map(item => ({ ...item, product: item.product || {} })) : [];
        let processedData: PriceListItem[] = cloneDeep(sourceData);
        if (activeFilters.productIds?.length) { const ids = new Set(activeFilters.productIds); processedData = processedData.filter(item => ids.has(String(item.product_id))); }
        if (activeFilters.categoryIds?.length) { const ids = new Set(activeFilters.categoryIds); processedData = processedData.filter(item => item.product?.category?.id && ids.has(item.product.category.id)); }
        if (activeFilters.subCategoryIds?.length) { const ids = new Set(activeFilters.subCategoryIds); processedData = processedData.filter(item => item.product?.sub_category?.id && ids.has(item.product.sub_category.id)); }
        if (activeFilters.brandIds?.length) { const ids = new Set(activeFilters.brandIds); processedData = processedData.filter(item => item.product?.brand?.id && ids.has(item.product.brand.id)); }
        if (activeFilters.status?.length) { const statuses = new Set(activeFilters.status); processedData = processedData.filter(item => statuses.has(item.status)); }
        if (activeFilters.date) { const [startDate] = activeFilters.date; const start = new Date(startDate!).setHours(0, 0, 0, 0); const end = new Date(startDate!).setHours(23, 59, 59, 999); processedData = processedData.filter(item => { if (!item.updated_at) return false; const itemDate = new Date(item.updated_at).getTime(); return itemDate >= start && itemDate <= end; }); }
        if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => item.product?.name?.toLowerCase().includes(query) || String(item.product_id).toLowerCase().includes(query) || item.status?.toLowerCase().includes(query) || item.updated_by_user?.name?.toLowerCase().includes(query)); }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { processedData.sort((a, b) => { let aValue = getNestedValue(a, key); let bValue = getNestedValue(b, key); if (typeof aValue === 'string') aValue = aValue.toLowerCase(); if (typeof bValue === 'string') bValue = bValue.toLowerCase(); if (aValue < bValue) return order === 'asc' ? -1 : 1; if (aValue > bValue) return order === 'asc' ? 1 : -1; return 0; }); }
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [priceListData?.data, tableData, activeFilters]);

    const activeFilterCount = useMemo(() => Object.values(activeFilters).filter(v => Array.isArray(v) ? v.length > 0 : v).length, [activeFilters]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), []);
    const handleSelectPageSizeChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), []);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), []);
    const handleSearchChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query, pageIndex: 1 })); }, []);
    const handleApplyFilters = useCallback((filters: Partial<PriceListFilterSchema>) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, []);
    const handleRemoveFilter = useCallback((key: keyof PriceListFilterSchema, value: string | number) => {
        setActiveFilters(prev => { const newFilters = { ...prev }; if (key === 'date') { delete newFilters.date; return newFilters; } const currentValues = prev[key] as any[]; if (!currentValues) return prev; const newValues = currentValues.filter(item => item !== value); if (newValues.length > 0) { (newFilters as any)[key] = newValues; } else { delete newFilters[key]; } return newFilters; });
        handleSetTableData({ pageIndex: 1 });
    }, []);
    const onClearFiltersAndReload = () => { setActiveFilters({}); setTableData({ ...tableData, query: '', pageIndex: 1 }); dispatch(getPriceListAction()); };
    const handleClearAllFilters = useCallback(() => onClearFiltersAndReload(), [dispatch, tableData]);

    const handleCardClick = (filterType: 'status' | 'date' | 'all', value?: any) => {
        setTableData(prev => ({ ...prev, query: '', pageIndex: 1 }));
        if (filterType === 'all') { setActiveFilters({}); }
        else if (filterType === 'status') { setActiveFilters({ status: [value] }); }
        else if (filterType === 'date') { setActiveFilters({ date: [new Date(), new Date()] }); }
    };

    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) return; exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `price_list_export_${new Date().toISOString().split('T')[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "PriceList", file_name: fileName })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportToCsv(fileName, allFilteredAndSortedData); setIsExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>); } finally { setIsSubmittingExportReason(false); } };
    const handleOpenTodayExportReasonModal = () => { if (!todayPriceListData.length) return; exportReasonFormMethods.reset(); setIsTodayExportReasonModalOpen(true); };
    const handleTodayConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsTodaySubmittingExportReason(true); const fileName = `todays_price_list_export_${new Date().toISOString().split('T')[0]}.xlsx`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Today's Price List", file_name: fileName })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportToExcel(fileName, todayPriceListData); setIsTodayExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>); } finally { setIsTodaySubmittingExportReason(false); } };

    const todayPriceListData = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (!Array.isArray(priceListData?.data)) return [];
        return priceListData.data.filter(item => { if (!item.updated_at) return false; const itemDate = new Date(item.updated_at); itemDate.setHours(0, 0, 0, 0); return itemDate.getTime() === today.getTime(); });
    }, [priceListData?.data]);

    const generateShareableText = () => { let message = `*Today's Price List (${new Date().toLocaleDateString()})*\n\n-----------------------------------\n`; todayPriceListData.forEach((item) => { message += `*Product:* ${item.product?.name}\n*Price:* ₹${item.sales_price}\n*Status:* ${item.status}\n-----------------------------------\n` }); return message; };
    const handleShareViaEmail = () => { const subject = `Today's Price List - ${new Date().toLocaleDateString()}`; const body = generateShareableText().replace(/\*/g, '').replace(/\n/g, '%0A'); window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; };
    const handleShareViaWhatsapp = () => { const message = generateShareableText(); const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`; window.open(whatsappUrl, '_blank'); };
    const handlePdfDownload = () => exportToPdf(todayPriceListData);
    const handleExcelDownload = () => handleOpenTodayExportReasonModal();

    const formFieldsConfig = useMemo(() => [{ name: 'product_id', label: 'Product Name', type: 'select', options: productOptions, isRequired: true }, { name: 'price', label: 'Price', type: 'text', isRequired: true }, { name: 'usd_rate', label: 'USD Rate', type: 'text', isRequired: true }, { name: 'expance', label: 'Expenses', type: 'text', isRequired: true }, { name: 'margin', label: 'Margin', type: 'text', isRequired: true }, { name: 'status', label: 'Status', type: 'select', options: statusOptions, isRequired: true }], [productOptions]);
    const renderFormField = (fieldConfig: any, formControl: any) => { const commonProps = { name: fieldConfig.name, control: formControl }; const placeholderText = `Enter ${fieldConfig.label}`; if (fieldConfig.type === 'select') { return (<Controller {...commonProps} render={({ field }) => (<Select placeholder={`Select ${fieldConfig.label}`} options={fieldConfig.options || []} value={fieldConfig.options?.find(o => o.value === field.value) || null} onChange={(o) => field.onChange(o ? o.value : '')} />)} />); } return (<Controller {...commonProps} render={({ field }) => (<Input {...field} type={fieldConfig.type || 'text'} placeholder={placeholderText} />)} />); };

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h3 className="mb-4 lg:mb-0">Price List</h3>
                        <div className="flex items-center gap-2">
                            <Link to="/task/task-list/create"><Button icon={<TbUser />}>Assign to Task</Button></Link>
                            <Button icon={<TbEyeDollar />} onClick={() => setIsTodayPriceDrawerOpen(true)}>View Today's Prices</Button>
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4 gap-2">
                        <div className="cursor-pointer" onClick={() => handleCardClick('all')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbReceipt size={24} /></div><div><h6 className="text-blue-500">{priceListData?.counts?.total}</h6><span className="font-semibold text-xs">Total Listed</span></div></Card></div>
                        <div className="cursor-pointer" onClick={() => handleCardClick('date')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbDeviceWatchDollar size={24} /></div><div><h6 className="text-violet-500">{priceListData?.counts?.today}</h6><span className="font-semibold text-xs">Today Listed</span></div></Card></div>
                        <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbClockDollar size={24} /></div><div><h6 className="text-orange-500">{parseFloat(priceListData?.counts?.avg_base || '0').toFixed(2)}</h6><span className="font-semibold text-xs">Avg Base (₹)</span></div></Card>
                        <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-gray-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100 text-gray-500"><TbPencilDollar size={24} /></div><div><h6 className="text-gray-500">{parseFloat(priceListData?.counts?.avg_nlc || '0').toFixed(2)}</h6><span className="font-semibold text-xs">Avg NLC ($)</span></div></Card>
                        <div className="cursor-pointer" onClick={() => handleCardClick('status', 'Active')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbDiscount size={24} /></div><div><h6 className="text-green-500">{priceListData?.counts?.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div>
                        <div className="cursor-pointer" onClick={() => handleCardClick('status', 'Inactive')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbDiscountOff size={24} /></div><div><h6 className="text-red-500">{priceListData?.counts?.inactive}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div>
                    </div>
                    <div className="mb-4">
                        <PriceListTableTools
                            onSearchChange={handleSearchChange} onApplyFilters={handleApplyFilters} onClearFilters={onClearFiltersAndReload} onExport={handleOpenExportReasonModal}
                            activeFilters={activeFilters} activeFilterCount={activeFilterCount}
                            productOptions={productOptions} categoryOptions={categoryOptions} subCategoryOptions={subCategoryOptions} brandOptions={brandOptions}
                            columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns}
                            searchInputValue={tableData.query} dispatch={dispatch}
                            isFilterDrawerOpen={isFilterDrawerOpen} setIsFilterDrawerOpen={setIsFilterDrawerOpen}
                        />
                    </div>
                    <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} productOptions={productOptions} categoryOptions={categoryOptions} subCategoryOptions={subCategoryOptions} brandOptions={brandOptions} />
                    {(activeFilterCount > 0 || tableData.query) && <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching item(s).</div>}
                    <div className="flex-grow overflow-auto">
                        <DataTable
                            columns={filteredColumns} data={pageData} noData={pageData.length <= 0}
                            loading={masterLoadingStatus === "loading" || isSubmitting}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            {/* --- All Drawers and Modals --- */}
            <Drawer title="Add Price" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="addPriceForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Adding..." : "Save"}</Button></div>}>
                <Form id="addPriceForm" onSubmit={addFormMethods.handleSubmit(onAddPriceListSubmit)} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        {formFieldsConfig.map(fConfig => (<FormItem key={fConfig.name} label={<div>{fConfig.label}{fConfig.isRequired && <span className="text-red-500">*</span>}</div>} invalid={!!addFormMethods.formState.errors[fConfig.name]} errorMessage={addFormMethods.formState.errors[fConfig.name]?.message as string} className={['product_id', 'status'].includes(fConfig.name) ? 'col-span-2' : 'col-span-1'}> {renderFormField(fConfig, addFormMethods.control)} </FormItem>))}
                    </div>
                </Form>
            </Drawer>
            <Drawer title="Edit Price" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={480} bodyClass="relative" footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="editPriceForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button></div>}>
                <Form id="editPriceForm" onSubmit={editFormMethods.handleSubmit(onEditPriceListSubmit)} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        {formFieldsConfig.map(fConfig => (<FormItem key={fConfig.name} label={<div>{fConfig.label}{fConfig.isRequired && <span className="text-red-500">*</span>}</div>} invalid={!!editFormMethods.formState.errors[fConfig.name]} errorMessage={editFormMethods.formState.errors[fConfig.name]?.message as string} className={['product_id', 'status'].includes(fConfig.name) ? 'col-span-2' : 'col-span-1'}> {renderFormField(fConfig, editFormMethods.control)} </FormItem>))}
                    </div>
                </Form>
                {editingPriceListItem && (<div className="absolute bottom-4 right-4 left-4"><div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3"><div><b className="font-semibold text-gray-900 dark:text-gray-100">Latest Update:</b><br /><p className="font-semibold">{editingPriceListItem.updated_by_user?.name || "N/A"}</p><p>{editingPriceListItem.updated_by_user?.roles[0]?.display_name || "N/A"}</p></div><div className="text-right"><span className="font-semibold">Created:</span> <span>{editingPriceListItem.created_at ? new Date(editingPriceListItem.created_at).toLocaleString() : "N/A"}</span><br /><span className="font-semibold">Updated:</span> <span>{editingPriceListItem.updated_at ? new Date(editingPriceListItem.updated_at).toLocaleString() : "N/A"}</span></div></div></div>)}
            </Drawer>
            <Drawer title="Today's Price List" isOpen={isTodayPriceDrawerOpen} onClose={() => setIsTodayPriceDrawerOpen(false)} width={700} footer={<div className="flex items-center justify-between w-full"><span className="text-xs text-gray-500">{todayPriceListData.length} item(s) updated today.</span><div className="flex gap-2"><Button size="sm" icon={<FaRegFilePdf />} onClick={handlePdfDownload} disabled={todayPriceListData.length === 0}>PDF</Button><Button size="sm" icon={<BsFileExcelFill />} onClick={handleExcelDownload} disabled={todayPriceListData.length === 0}>Excel</Button><Dropdown placement="top-end" renderTitle={<Button size="sm" variant="solid" icon={<TbShare />} disabled={todayPriceListData.length === 0}>Share</Button>}><Dropdown.Item icon={<HiOutlineMail />} onClick={handleShareViaEmail}>Share via Email</Dropdown.Item><Dropdown.Item icon={<FaWhatsapp />} onClick={handleShareViaWhatsapp}>Share on WhatsApp</Dropdown.Item></Dropdown></div></div>}>
                <div className="h-full">
                    {todayPriceListData.length > 0 ? (
                        <Table><Table.THead><Table.Tr><Table.Th>Product Name</Table.Th><Table.Th>Sales Price</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.THead>
                            <Table.TBody>{todayPriceListData.map((item) => (<Table.Tr key={item.id}><Table.Td>{item.product?.name}</Table.Td><Table.Td>₹{item.sales_price}</Table.Td><Table.Td><Tag className={classNames('capitalize', { 'bg-emerald-100 text-emerald-600': item.status === 'Active', 'bg-red-100 text-red-600': item.status === 'Inactive' })}>{item.status}</Tag></Table.Td></Table.Tr>))}</Table.TBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center"><div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4"><TbFileDownload className="text-4xl text-gray-500" /></div><h6 className="font-semibold">No Prices Updated Today</h6><p className="text-gray-500">Check back later or view the full price list.</p></div>
                    )}
                </div>
            </Drawer>
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }} >
                <Form onSubmit={(e) => e.preventDefault()}><FormItem label="Reason"><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => <Input textArea {...field} />} /></FormItem></Form>
            </ConfirmDialog>
            <ConfirmDialog isOpen={isTodayExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsTodayExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleTodayConfirmExportWithReason)} loading={isTodaySubmittingExportReason} confirmText={isTodaySubmittingExportReason ? "Submitting..." : "Submit & Export"} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isTodaySubmittingExportReason }} >
                <Form onSubmit={(e) => e.preventDefault()}><FormItem label="Reason"><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => <Input textArea {...field} />} /></FormItem></Form>
            </ConfirmDialog>
            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={imageToView} alt="View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
            <PriceListModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
        </>
    );
};

export default PriceList;