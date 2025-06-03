import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
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
import { Drawer, Form, FormItem, Input, Tag } from '@/components/ui' // Added Tag

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbReload,
    TbUser,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux
import { useAppDispatch } from '@/reduxtool/store'
import { useSelector } from 'react-redux'
import {
    getTrendingImagesAction,
    addTrendingImageAction,
    editTrendingImageAction,
    deleteTrendingImageAction,
    deleteMultipleTrendingImagesAction,
    getProductsAction,
    submitExportReasonAction, // Placeholder for actual action
} from '@/reduxtool/master/middleware'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { Link } from 'react-router-dom'


// --- Constants ---
const pageNameOptionsConst = [
    { value: 'Home Page', label: 'Home Page' },
    { value: 'Engineering Page', label: 'Engineering Page' },
    { value: 'Plastic Page', label: 'Plastic Page' },
];
const pageNameValues = pageNameOptionsConst.map(opt => opt.value) as [string, ...string[]];

// --- Product Options Type (for dropdown) ---
export type ProductOption = { value: string; label: string };

// --- Trending Page Images Type ---
export type TrendingPageImageItem = {
    id: string | number;
    page_name: string;
    img_1?: string;
    img_2?: string;
    img_3?: string;
    summary_text?: string;
    multimedia_content?: string;
    deleted_at?: string | null;
    created_at: string;
    updated_at?: string;
    product_ids?: string; // Keep as string from backend, parse on client
    trendingProducts?: string[]; // For form/client-side use
    updated_by_name?: string; // Added
    updated_by_role?: string; // Added
    [key: string]: any;
};

// --- Zod Schema for Add/Edit Form ---
const trendingPageImageFormSchema = z.object({
    page_name: z.enum(pageNameValues, {
        errorMap: () => ({ message: 'Please select a page name.' }),
    }),
    trendingProducts: z.array(z.string()).optional().default([]),
});
type TrendingPageImageFormData = z.infer<typeof trendingPageImageFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterPageNames: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter Utility ---
const CSV_HEADERS = [
    'ID',
    'Page Name',
    'Trending Product IDs',
    'Created At',
    'Updated By',
    'Updated Role',
    'Updated At',
];
type TrendingImageExportItem = Omit<TrendingPageImageItem, 'created_at' | 'updated_at' | 'trendingProducts'> & {
    created_at_formatted?: string;
    updated_at_formatted?: string;
    // product_ids is directly from TrendingPageImageItem
};

const CSV_KEYS_EXPORT: (keyof TrendingImageExportItem)[] = [
    'id',
    'page_name',
    'product_ids', // This will export the raw comma-separated string of IDs
    'created_at_formatted',
    'updated_by_name',
    'updated_by_role',
    'updated_at_formatted',
];

function exportTrendingImagesToCsv(filename: string, rows: TrendingPageImageItem[]) {
    if (!rows || !rows.length) {
        // Toast handled by caller or handleOpenExportReasonModal
        return false;
    }
     const transformedRows: TrendingImageExportItem[] = rows.map((row) => ({
        ...row, // Spread existing properties
        product_ids: row.product_ids || "N/A", // Use existing or default
        created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
        updated_by_name: row.updated_by_name || "N/A",
        updated_by_role: row.updated_by_role || "N/A",
        updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
    }));

    const separator = ',';
    const csvContent =
        CSV_HEADERS.join(separator) + '\n' +
        transformedRows.map(row => CSV_KEYS_EXPORT.map(k => {
            let cell = row[k as keyof TrendingImageExportItem];
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
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center">
            <Tooltip title="Edit"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- Search Component ---
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; placeholder: string }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange, placeholder }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder={placeholder} suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
ItemSearch.displayName = 'ItemSearch';

// --- TableTools Component ---
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; searchPlaceholder: string }
const ItemTableTools = ({ onSearchChange, onFilter, onExport, searchPlaceholder, onClearFilters }: ItemTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
        <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} placeholder={searchPlaceholder} /></div>
        <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
            <Button title="Clear Filters" icon={<TbReload />} onClick={() => onClearFilters()}></Button>
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- SelectedFooter Component ---
type TrendingImagesSelectedFooterProps = { selectedItems: TrendingPageImageItem[]; onDeleteSelected: () => void; isDeleting: boolean; } // Added isDeleting
const TrendingImagesSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: TrendingImagesSelectedFooterProps) => { // Added isDeleting
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span> Item{selectedItems.length > 1 ? 's' : ''} selected </span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button> {/* Added loading */}
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Image Group${selectedItems.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}> {/* Added loading */}
                <p>Are you sure you want to delete the selected image group{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

// --- Main Component: Trending Images ---
const TrendingImages = () => {
    const dispatch = useAppDispatch();

    const {
        trendingImagesData = [],
        productsMasterData = [],
        status: masterLoadingStatus = 'idle'
    } = useSelector(masterSelector);

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TrendingPageImageItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<TrendingPageImageItem | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'created_at' }, query: '' }); // Default sort
    const [selectedItems, setSelectedItems] = useState<TrendingPageImageItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterPageNames: [] });

    // --- Export Reason Modal State ---
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

    useEffect(() => {
        dispatch(getTrendingImagesAction());
        dispatch(getProductsAction());
    }, [dispatch]);

    const productSelectOptions = useMemo(() => {
        if (!Array.isArray(productsMasterData)) return [];
        // Assuming productsMasterData is an array of objects with id and name
        return productsMasterData.map((p: { id: string | number; name: string; sku_code?: string }) => ({
            value: String(p.id),
            label: `${p.name} ${p.sku_code ? `(${p.sku_code})` : ''}`.trim(),
        }));
    }, [productsMasterData]);

    const addFormMethods = useForm<TrendingPageImageFormData>({
        resolver: zodResolver(trendingPageImageFormSchema),
        defaultValues: { page_name: pageNameValues[0], trendingProducts: [] },
        mode: 'onChange',
    });
    const editFormMethods = useForm<TrendingPageImageFormData>({
        resolver: zodResolver(trendingPageImageFormSchema),
        defaultValues: { page_name: pageNameValues[0], trendingProducts: [] },
        mode: 'onChange',
    });
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ // For export reason modal
        resolver: zodResolver(exportReasonSchema),
        defaultValues: { reason: "" },
        mode: "onChange",
    });

    const openAddDrawer = useCallback(() => {
        addFormMethods.reset({ page_name: pageNameValues[0], trendingProducts: [] });
        setIsAddDrawerOpen(true);
    }, [addFormMethods]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

    const openEditDrawer = useCallback((item: TrendingPageImageItem) => {
        setEditingItem(item);
        const selectedProductIds = item.product_ids
            ? item.product_ids.split(',').map(id => id.trim()).filter(id => id)
            : [];
        editFormMethods.reset({
            page_name: item.page_name,
            trendingProducts: selectedProductIds,
        });
        setIsEditDrawerOpen(true);
    }, [editFormMethods]);
    const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

    const onAddItemSubmit = async (data: TrendingPageImageFormData) => {
        setIsSubmitting(true);
        try {
            // Backend expects product_ids as a comma-separated string
            const payload = {
                ...data,
                product_ids: data.trendingProducts ? data.trendingProducts.join(',') : '',
                // Default empty structures for complex fields if not handled by backend on create
                img_1: JSON.stringify({ image: "", link: "" }),
                img_2: JSON.stringify({ image: "", link: "" }),
                img_3: JSON.stringify({ image: "", link: "" }),
                summary_text: JSON.stringify({ image: "", link: "", short_desc: "" }),
                multimedia_content: JSON.stringify({ images: [], long_desc: "", btn_name: "", btn_link: "" }),
            };
            delete (payload as any).trendingProducts; // Remove the array form before sending

            await dispatch(addTrendingImageAction(payload)).unwrap();
            toast.push(<Notification title="Image Group Added" type="success" duration={2000}>Item added successfully.</Notification>);
            closeAddDrawer();
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error?.data?.message || 'Could not add item.'}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onEditItemSubmit = async (data: TrendingPageImageFormData) => {
        if (!editingItem) return;
        setIsSubmitting(true);
        try {
            const payload = {
                ...editingItem, // Preserve existing complex fields like img_1, img_2 etc.
                ...data,        // Apply form changes (page_name, trendingProducts as array)
                product_ids: data.trendingProducts ? data.trendingProducts.join(',') : '', // Convert array to string for backend
                // updated_at: new Date().toISOString(), // Backend should handle this
            };
            delete (payload as any).trendingProducts; // Remove the array form before sending

            await dispatch(editTrendingImageAction(payload)).unwrap();
            toast.push(<Notification title="Image Group Updated" type="success" duration={2000}>Item updated successfully.</Notification>);
            closeEditDrawer();
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error?.data?.message || 'Could not update item.'}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = useCallback((item: TrendingPageImageItem) => {
        if (item.id === undefined || item.id === null) return;
        setItemToDelete(item);
        setSingleDeleteConfirmOpen(true);
    }, []);

    const onConfirmSingleDelete = async () => {
        if (!itemToDelete || itemToDelete.id === undefined || itemToDelete.id === null) return;
        setIsDeleting(true);
        setSingleDeleteConfirmOpen(false);
        try {
            await dispatch(deleteTrendingImageAction({ id: itemToDelete.id })).unwrap();
            toast.push(<Notification title="Item Deleted" type="success" duration={2000}>{`Group for "${itemToDelete.page_name}" deleted.`}</Notification>);
            setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error?.message || 'Could not delete item.'}</Notification>);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        setIsDeleting(true);
        const idsToDelete = selectedItems.map(item => String(item.id));
        try {
            await dispatch(deleteMultipleTrendingImagesAction({ ids: idsToDelete.join(',') })).unwrap();
            toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{selectedItems.length} item(s) deleted.</Notification>);
            setSelectedItems([]);
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error?.message || 'Failed to delete selected items.'}</Notification>);
        } finally {
            setIsDeleting(false);
        }
    };

    const openFilterDrawer = useCallback(() => {
        filterFormMethods.reset(filterCriteria);
        setIsFilterDrawerOpen(true);
    }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false);

    const onApplyFiltersSubmit = (data: FilterFormData) => {
        setFilterCriteria({ filterPageNames: data.filterPageNames || [] });
        handleSetTableData({ pageIndex: 1 });
        closeFilterDrawer();
    };
    const onClearFilters = () => {
        const defaultFilters = { filterPageNames: [] };
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        handleSetTableData({ pageIndex: 1 });
    };

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: TrendingPageImageItem[] = Array.isArray(trendingImagesData) ? trendingImagesData : [];
        let processedData: TrendingPageImageItem[] = cloneDeep(sourceData);

        if (filterCriteria.filterPageNames && filterCriteria.filterPageNames.length > 0) {
            const selectedPageFilterValues = filterCriteria.filterPageNames.map(opt => opt.value.toLowerCase());
            processedData = processedData.filter(item => selectedPageFilterValues.includes(item.page_name.toLowerCase()));
        }
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                String(item.page_name).toLowerCase().includes(query) ||
                String(item.id).toLowerCase().includes(query) ||
                (item.updated_by_name?.toLowerCase() ?? "").includes(query) // Search by updated_by_name
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && ["id", "page_name", "created_at", "updated_at", "updated_by_name"].includes(key)) { // Added new sort keys
            processedData.sort((a, b) => {
                let aValue: any, bValue: any;
                if (key === 'created_at' || key === 'updated_at') {
                    const dateA = a[key as 'created_at' | 'updated_at'] ? new Date(a[key as 'created_at' | 'updated_at']!).getTime() : 0;
                    const dateB = b[key as 'created_at' | 'updated_at'] ? new Date(b[key as 'created_at' | 'updated_at']!).getTime() : 0;
                    return order === "asc" ? dateA - dateB : dateB - dateA;
                } else {
                    aValue = a[key as keyof TrendingPageImageItem] ?? "";
                    bValue = b[key as keyof TrendingPageImageItem] ?? "";
                }
                 return order === "asc"
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [trendingImagesData, tableData, filterCriteria]);


    const handleOpenExportReasonModal = () => { // For export reason modal
        if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
            toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
            return;
        }
        exportReasonFormMethods.reset({ reason: "" });
        setIsExportReasonModalOpen(true);
    };

    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { // For export reason modal
        setIsSubmittingExportReason(true);
        const moduleName = "Trending Page Images";
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportTrendingImagesToCsv('trending_page_images.csv', allFilteredAndSortedData);
            // Optional success message, if needed beyond "Reason Submitted"
            toast.push(<Notification title="Data Exported" type="success">Trending images data has been exported.</Notification>);
            
            setIsExportReasonModalOpen(false);
        } catch (error: any) {
            toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete the export process."} />);
        } finally {
            setIsSubmittingExportReason(false);
        }
    };


    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: TrendingPageImageItem) => {
        setSelectedItems(prev => {
            if (checked) return prev.some(item => item.id === row.id) ? prev : [...prev, row];
            return prev.filter(item => item.id !== row.id);
        });
    }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<TrendingPageImageItem>[]) => {
        const originals = currentRows.map(r => r.original);
        if (checked) {
            setSelectedItems(prev => {
                const prevIds = new Set(prev.map(item => item.id));
                const newToAdd = originals.filter(r => r.id && !prevIds.has(r.id));
                return [...prev, ...newToAdd];
            });
        } else {
            const currentIds = new Set(originals.map(r => r.id).filter(id => id !== undefined));
            setSelectedItems(prev => prev.filter(item => item.id && !currentIds.has(item.id)));
        }
    }, []);

    const columns: ColumnDef<TrendingPageImageItem>[] = useMemo(() => [
        // { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80, meta: { tdClass: "text-center", thClass: "text-center" }  },
        { header: 'Page Name', accessorKey: 'page_name', enableSorting: true, size: 320, cell: (props) => <span className="font-semibold">{props.row.original.page_name}</span> },
        {
            header: 'Date Created',
            accessorKey: 'created_at',
            enableSorting: true,
            size: 160,
            cell: (props) => {
                const dateVal = props.getValue<string>();
                if (!dateVal) return 'N/A';
                try {
                    return (
                        `${new Date(dateVal).getDate()} ${new Date(dateVal).toLocaleString("en-US", { month: "long" })}, ${new Date(dateVal).getFullYear()}, ${new Date(dateVal).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                    )
                } catch (e) { return 'Invalid Date'; }
            }
        },
        { header: "Status",  accessorKey: "status", meta: { HeaderClass: "text-red-500" }, enableSorting: true, size: 80,
                      cell: (props) => (<Tag className={`bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 capitalize font-semibold border-0`}>{'Active'}</Tag>),
        },
        {
            header: "Updated Info",
            accessorKey: "updated_at", // Sort by updated_at
            enableSorting: true,
            meta: { HeaderClass: "text-red-500" }, // Optional: if you want red header like reference
            size: 160,
            cell: (props) => {
                const { updated_at, updated_by_name, updated_by_role } = props.row.original;
                const formattedDate = updated_at
                ? `${new Date(updated_at).getDate()} ${new Date(updated_at).toLocaleString("en-US", { month: "long" })} ${new Date(updated_at).getFullYear()}, ${new Date(updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : "N/A";
                return (
                    <div className="text-xs">
                        <span>
                        {updated_by_name || "N/A"}
                        {updated_by_role && (<><br /><b>{updated_by_role}</b></>)}
                        </span>
                        <br />
                        <span>{formattedDate}</span>
                    </div>
                );
            },
        },
        { header: 'Actions', id: 'action', meta: { HeaderClass: 'text-center', cellClass: 'text-center' }, size: 80, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [openEditDrawer, handleDeleteClick]);

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Trending Images</h5>
                        <div>
                            <Link to='/task/task-list/create'>
                                <Button className="mr-2" icon={<TbUser />} clickFeedback={false} customColorClass={({ active, unclickable }) => classNames('hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0', active ? 'bg-gray-200' : 'bg-gray-100', unclickable && 'opacity-50 cursor-not-allowed', !active && !unclickable && 'hover:bg-gray-200')}>
                                    Assigned to Task
                                </Button>
                            </Link>
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={masterLoadingStatus === "idle" || isSubmitting}>Add New</Button>
                        </div>
                    </div>
                    <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} searchPlaceholder="Quick Search..." />
                    <div className="mt-4">
                        <DataTable
                            columns={columns} data={pageData}
                            loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting}
                            pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            selectable checkboxChecked={(row) => selectedItems.some(selected => selected.id === row.id)}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
                            onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <TrendingImagesSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

            <Drawer title="Add Trending Image" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} width={600} // Matched width
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="addPageImageForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Adding...' : 'Save'}</Button></div>}>
                <Form id="addPageImageForm" onSubmit={addFormMethods.handleSubmit(onAddItemSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name" invalid={!!addFormMethods.formState.errors.page_name} errorMessage={addFormMethods.formState.errors.page_name?.message}>
                        <Controller name="page_name" control={addFormMethods.control} render={({ field }) => (<Select placeholder="Select page" options={pageNameOptionsConst} value={pageNameOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
                    </FormItem>
                    <FormItem label="Trending Products" invalid={!!addFormMethods.formState.errors.trendingProducts} errorMessage={addFormMethods.formState.errors.trendingProducts?.message as string | undefined}>
                        <Controller name="trendingProducts" control={addFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select trending products..." options={productSelectOptions} value={productSelectOptions.filter(opt => field.value?.includes(opt.value))} onChange={(selectedVal) => field.onChange(selectedVal ? selectedVal.map(opt => opt.value) : [])} />)} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Edit Trending Image" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer} width={600} // Matched width
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="editPageImageForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></div>}>
                <Form id="editPageImageForm" onSubmit={editFormMethods.handleSubmit(onEditItemSubmit)} className="flex flex-col gap-4 relative pb-28"> {/* Added relative pb-28 */}
                    <FormItem label="Page Name" invalid={!!editFormMethods.formState.errors.page_name} errorMessage={editFormMethods.formState.errors.page_name?.message}>
                        <Controller name="page_name" control={editFormMethods.control} render={({ field }) => (<Select placeholder="Select page" options={pageNameOptionsConst} value={pageNameOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
                    </FormItem>
                    <FormItem label="Trending Products" invalid={!!editFormMethods.formState.errors.trendingProducts} errorMessage={editFormMethods.formState.errors.trendingProducts?.message  as string | undefined}>
                        <Controller name="trendingProducts" control={editFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select trending products..." options={productSelectOptions} value={productSelectOptions.filter(opt => field.value?.includes(opt.value))} onChange={(selectedVal) => field.onChange(selectedVal ? selectedVal.map(opt => opt.value) : [])} />)} />
                    </FormItem>
                
                    {editingItem && (
                        <div className="absolute bottom-0 w-full"> {/* Positioned audit info */}
                            <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                                <div>
                                <b className="mt-3 mb-3 font-semibold text-primary">
                                    Latest Update:
                                </b>
                                <br />
                                <p className="text-sm font-semibold">
                                    {editingItem.updated_by_name || "N/A"}
                                </p>
                                <p>{editingItem.updated_by_role || "N/A"}</p>
                                </div>
                                <div>
                                <br />
                                <span className="font-semibold">Created At:</span>{" "}
                                <span>
                                    {editingItem.created_at
                                    ? new Date(editingItem.created_at).toLocaleString("en-US", {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "numeric", minute: "2-digit", hour12: true,
                                        })
                                    : "N/A"}
                                </span>
                                <br />
                                <span className="font-semibold">Updated At:</span>{" "}
                                <span>
                                    {editingItem.updated_at
                                    ? new Date(editingItem.updated_at).toLocaleString("en-US", {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "numeric", minute: "2-digit", hour12: true,
                                        })
                                    : "N/A"}
                                </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </Drawer>

            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400} // Matched width
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterItemsForm" type="submit">Apply</Button></div>}> {/* Applied onClearFilters to Clear button */}
                <Form id="filterItemsForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name">
                        <Controller name="filterPageNames" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select page names..." options={pageNameOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />)} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Item Group" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete this item group? {itemToDelete && ` (Page: ${itemToDelete.page_name})`} This action cannot be undone.</p>
            </ConfirmDialog>

            {/* --- Export Reason Modal --- */}
            <ConfirmDialog
                isOpen={isExportReasonModalOpen}
                type="info"
                title="Reason for Export"
                onClose={() => setIsExportReasonModalOpen(false)}
                onRequestClose={() => setIsExportReasonModalOpen(false)}
                onCancel={() => setIsExportReasonModalOpen(false)}
                onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
                loading={isSubmittingExportReason}
                confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
                cancelText="Cancel"
                confirmButtonProps={{
                disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason,
                }}
            >
                <Form
                id="exportTrendingImagesReasonForm"
                onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
                className="flex flex-col gap-4 mt-2"
                >
                <FormItem
                    label="Please provide a reason for exporting this data:"
                    invalid={!!exportReasonFormMethods.formState.errors.reason}
                    errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
                >
                    <Controller
                    name="reason"
                    control={exportReasonFormMethods.control}
                    render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)}
                    />
                </FormItem>
                </Form>
            </ConfirmDialog>
        </>
    );
};

export default TrendingImages;

function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}