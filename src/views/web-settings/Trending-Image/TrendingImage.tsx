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
import ConfirmDialog from '@/components/shared/ConfirmDialog' // Import Props
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { Drawer, Form, FormItem, Input } from '@/components/ui'

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
    // Assuming these actions are also in your master/middleware or a similar place
    addTrendingImageAction,
    editTrendingImageAction,
    deleteTrendingImageAction,
    deleteMultipleTrendingImagesAction,
    getProductsAction
} from '@/reduxtool/master/middleware' // Adjust path if these are elsewhere
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
    trendingProducts?: string[];
    [key: string]: any; // For dynamic access in sorting/filtering
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

// --- CSV Exporter Utility ---
const CSV_HEADERS = ['Page Name', 'Date Created', 'Trending Product IDs'];
const CSV_KEYS: (keyof TrendingPageImageItem | string)[] = ['page_name', 'created_at', 'trendingProducts'];

function exportTrendingImagesToCsv(filename: string, rows: TrendingPageImageItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    const separator = ',';
    const csvContent =
        CSV_HEADERS.join(separator) + '\n' +
        rows.map(row => CSV_KEYS.map(k => {
            let cell: any = row[k as keyof TrendingPageImageItem];
            if (k === 'trendingProducts' && Array.isArray(cell)) {
                cell = cell.join(';');
            } else if (k === 'created_at' && typeof cell === 'string') {
                try {
                    cell = new Date(cell).toLocaleDateString();
                } catch (e) { /* keep original if invalid date */ }
            }
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
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters : ()=> void; searchPlaceholder: string }
const ItemTableTools = ({ onSearchChange, onFilter, onExport, searchPlaceholder, onClearFilters }: ItemTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
        <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} placeholder={searchPlaceholder} /></div>
        <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
            <Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button>
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- SelectedFooter Component ---
type TrendingImagesSelectedFooterProps = { selectedItems: TrendingPageImageItem[]; onDeleteSelected: () => void }
const TrendingImagesSelectedFooter = ({ selectedItems, onDeleteSelected }: TrendingImagesSelectedFooterProps) => {
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
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Image Group${selectedItems.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}>
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
    productsMasterData = [], // <<< --- ADDED: Fetched products for dropdowns
    status: masterLoadingStatus = 'idle'
} = useSelector(masterSelector);

    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TrendingPageImageItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<TrendingPageImageItem | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<TrendingPageImageItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterPageNames: [] });

  useEffect(() => {
    dispatch(getTrendingImagesAction());
    dispatch(getProductsAction()); // Fetch products
}, [dispatch]);

  const productSelectOptions = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((p: TrendingPageImageItem) => ({
      value: String(p.id), // Use product ID as value
      label: p.name,
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

    const openAddDrawer = useCallback(() => {
        addFormMethods.reset({ page_name: pageNameValues[0], trendingProducts: [] });
        setIsAddDrawerOpen(true);
    }, [addFormMethods]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: TrendingPageImageItem) => {
    setEditingItem(item);
    console.log('Editing Item:', item);
    // Parse product_ids string to array for the form's trendingProducts field
    const selectedProductIds = item.product_ids
        ? item.product_ids.split(',').map((id :any) => id.trim()).filter(id => id) // Ensure IDs are trimmed and non-empty
        : [];
    editFormMethods.reset({
        page_name: item.page_name,
        trendingProducts: selectedProductIds, // Use the parsed array of string IDs
    });
    setIsEditDrawerOpen(true);
}, [editFormMethods]);
    const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

    const onAddItemSubmit = async (data: TrendingPageImageFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                // Default empty structures for fields not in the form
                img_1: JSON.stringify({ image: "", link: "" }),
                img_2: JSON.stringify({ image: "", link: "" }),
                img_3: JSON.stringify({ image: "", link: "" }),
                product_ids: data.trendingProducts ? data.trendingProducts.join(',') : '',
                summary_text: JSON.stringify({ image: "", link: "", short_desc: "" }),
                multimedia_content: JSON.stringify({ images: [], long_desc: "", btn_name: "", btn_link: "" }),
            };
            await dispatch(addTrendingImageAction(payload)).unwrap();
            toast.push(<Notification title="Image Group Added" type="success" duration={2000}>Item added successfully.</Notification>);
            closeAddDrawer();
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error?.data?.message || 'Could not add item.'}</Notification>);
            console.error('Save Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
    if (productsMasterData && Array.isArray(productsMasterData)) { // Access the nested 'data' array
        const options = productsMasterData.map((product: any) => ({
            value: String(product.id), // Using product ID as the value
            label: `${product.name} ${product.sku_code ? `(${product.sku_code})` : ''}`.trim(),
        }));
        setProductOptions(options);
    } else {
        setProductOptions([]);
    }
}, [productsMasterData]); // This effect runs when productsMasterData from Redux changes

    const onEditItemSubmit = async (data: TrendingPageImageFormData) => {
        if (!editingItem) return;
        setIsSubmitting(true);
        try {
            const payload = {
                id: editingItem.id,
                ...editingItem, // Preserve existing complex fields
                ...data,        // Apply form changes
                updated_at: new Date().toISOString(),
                product_ids: data.trendingProducts ? data.trendingProducts.join(',') : '',
            };
            await dispatch(editTrendingImageAction(payload)).unwrap();
            toast.push(<Notification title="Image Group Updated" type="success" duration={2000}>Item updated successfully.</Notification>);
            closeEditDrawer();
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error?.data?.message || 'Could not update item.'}</Notification>);
            console.error('Edit Item Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = useCallback((item: TrendingPageImageItem) => {
        if (item.id === undefined || item.id === null) {
            toast.push(<Notification title="Error" type="danger">Cannot delete: Item ID is missing.</Notification>);
            return;
        }
        setItemToDelete(item);
        setSingleDeleteConfirmOpen(true);
    }, []);

    const onConfirmSingleDelete = async () => {
        if (!itemToDelete || itemToDelete.id === undefined || itemToDelete.id === null) {
            toast.push(<Notification title="Error" type="danger">Cannot delete: Item ID is missing.</Notification>);
            setIsDeleting(false); setItemToDelete(null); setSingleDeleteConfirmOpen(false);
            return;
        }
        setIsDeleting(true);
        setSingleDeleteConfirmOpen(false);
        try {
            await dispatch(deleteTrendingImageAction({ id: itemToDelete.id })).unwrap(); // Pass ID or full item as per action's need
            toast.push(<Notification title="Item Deleted" type="success" duration={2000}>{`Group for "${itemToDelete.page_name}" deleted.`}</Notification>);
            setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error?.message || 'Could not delete item.'}</Notification>);
            console.error('Delete Item Error:', error);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
            return;
        }
        setIsDeleting(true);
        const validItemsToDelete = selectedItems.filter(item => item.id !== undefined && item.id !== null);
        if (validItemsToDelete.length !== selectedItems.length) {
            toast.push(<Notification title="Deletion Warning" type="warning" duration={3000}>Some items could not be processed.</Notification>);
        }
        if (validItemsToDelete.length === 0) {
            toast.push(<Notification title="No Valid Items" type="info">No valid items to delete.</Notification>);
            setIsDeleting(false);
            return;
        }
        const idsToDelete = validItemsToDelete.map(item => String(item.id));
        try {
            await dispatch(deleteMultipleTrendingImagesAction({ ids: idsToDelete.join(',') })).unwrap(); // Or { ids: idsToDelete }
            toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{validItemsToDelete.length} item(s) deleted.</Notification>);
            setSelectedItems([]);
            dispatch(getTrendingImagesAction());
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error?.message || 'Failed to delete selected items.'}</Notification>);
            console.error('Delete Selected Error:', error);
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
                String(item.id).toLowerCase().includes(query)
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                const aValue = a[key as keyof TrendingPageImageItem];
                const bValue = b[key as keyof TrendingPageImageItem];
                if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
                if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;
                if (key === 'created_at') {
                    const dateA = new Date(aValue as string).getTime();
                    const dateB = new Date(bValue as string).getTime();
                    return order === 'asc' ? dateA - dateB : dateB - dateA;
                }
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
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
    }, [trendingImagesData, tableData, filterCriteria]);

    const handleExportData = () => {
        const success = exportTrendingImagesToCsv('trending_page_images.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
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
                const newToAdd = originals.filter(r => !prevIds.has(r.id));
                return [...prev, ...newToAdd];
            });
        } else {
            const currentIds = new Set(originals.map(r => r.id));
            setSelectedItems(prev => prev.filter(item => !currentIds.has(item.id)));
        }
    }, []);

    const columns: ColumnDef<TrendingPageImageItem>[] = useMemo(() => [
        { header: 'Page Name', accessorKey: 'page_name', enableSorting: true, size: 250, cell: (props) => <span className="font-semibold">{props.row.original.page_name}</span> },
        { 
            header: 'Date Created', 
            accessorKey: 'created_at', 
            enableSorting: true, 
            size: 180, 
            cell: (props) => { 
                return (
                    `${new Date(props.getValue<string>()).getDate()} ${new Date(props.getValue<string>()).toLocaleString("en-US", { month: "long" })}, 
                    ${new Date(props.getValue<string>()).getFullYear()},
                    ${new Date(props.getValue<string>()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
                )
            } },
        { header: 'Actions', id: 'action', meta: { HeaderClass: 'text-center', cellClass: 'text-center' }, size: 120, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], [openEditDrawer, handleDeleteClick]);

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Trending Images</h5>
                    <div>
                            <Link to='/task/task-list/create'>
                                <Button
                                className="mr-2"
                                icon={<TbUser />}
                                clickFeedback={false}
                                customColorClass={({ active, unclickable }) =>
                                    classNames(
                                        'hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0',
                                        active ? 'bg-gray-200' : 'bg-gray-100',
                                        unclickable && 'opacity-50 cursor-not-allowed',
                                        !active && !unclickable && 'hover:bg-gray-200',
                                    )
                                }
                                >Assigned to Task</Button>
                            </Link>
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
                        </div>
                    </div>
                    <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onClearFilters={onClearFilters} searchPlaceholder="Quick Search..." />
                    <div className="mt-4">
                        <DataTable
                            columns={columns} data={pageData}
                            loading={masterLoadingStatus === 'idle' || isSubmitting || isDeleting}
                            pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            selectable checkboxChecked={(row) => selectedItems.some(selected => selected.id === row.id)}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
                            onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <TrendingImagesSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            <Drawer title="Add Trending Image Group" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer}
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="addPageImageForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Adding...' : 'Save'}</Button></div>}>
                <Form id="addPageImageForm" onSubmit={addFormMethods.handleSubmit(onAddItemSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name" invalid={!!addFormMethods.formState.errors.page_name} errorMessage={addFormMethods.formState.errors.page_name?.message}>
                        <Controller name="page_name" control={addFormMethods.control} render={({ field }) => (<Select placeholder="Select page" options={pageNameOptionsConst} value={pageNameOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
                    </FormItem>
                    <FormItem label="Trending Products" invalid={!!addFormMethods.formState.errors.trendingProducts} errorMessage={addFormMethods.formState.errors.trendingProducts?.message}>
                        <Controller name="trendingProducts" control={addFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select trending products..." options={productSelectOptions} value={productSelectOptions.filter(opt => field.value?.includes(opt.value))} onChange={(selectedVal) => field.onChange(selectedVal ? selectedVal.map(opt => opt.value) : [])} />)} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Edit Trending Image Group" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer}
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="editPageImageForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button></div>}>
                <Form id="editPageImageForm" onSubmit={editFormMethods.handleSubmit(onEditItemSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name" invalid={!!editFormMethods.formState.errors.page_name} errorMessage={editFormMethods.formState.errors.page_name?.message}>
                        <Controller name="page_name" control={editFormMethods.control} render={({ field }) => (<Select placeholder="Select page" options={pageNameOptionsConst} value={pageNameOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
                    </FormItem>
                    <FormItem label="Trending Products" invalid={!!editFormMethods.formState.errors.trendingProducts} errorMessage={editFormMethods.formState.errors.trendingProducts?.message}>
                        <Controller name="trendingProducts" control={editFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select trending products..." options={productOptions} value={productOptions.filter(opt => field.value?.includes(opt.value))} onChange={(selectedVal) => field.onChange(selectedVal ? selectedVal.map(opt => opt.value) : [])} />)} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={<div className="text-right w-full"><div><Button size="sm" className="mr-2" onClick={closeFilterDrawer} type="button">Clear</Button><Button size="sm" variant="solid" form="filterItemsForm" type="submit">Apply</Button></div></div>}>
                <Form id="filterItemsForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name">
                        <Controller name="filterPageNames" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select page name(s)..." options={pageNameOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />)} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Item Group" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete this item group? {itemToDelete && ` (Page: ${itemToDelete.page_name})`} This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

export default TrendingImages;

function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}