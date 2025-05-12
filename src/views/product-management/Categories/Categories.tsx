// src/views/your-path/Categories.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect,
} from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // Keep useNavigate if used for cloning/navigation
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Avatar from '@/components/ui/Avatar';
// Assuming you have a Dialog component import
import Dialog from '@/components/ui/Dialog';


// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import { Drawer, Form, FormItem, Input, Select as UiSelect, Tag } from '@/components/ui'; // Renamed Select

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
    TbCloudDownload, // For Import button
    TbCategory, // Icon for Category
} from 'react-icons/tb'; // Updated icon

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import { useAppDispatch } from '@/reduxtool/store';
import {
    // Assuming these actions exist or you will create them for categories
    getCategoriesAction,
    addCategoryAction,
    editCategoryAction,
    deleteCategoryAction,
    deleteAllCategoriesAction,
    // You might need a changeCategoryStatusAction
} from '@/reduxtool/master/middleware'; // **Adjust path and action names as needed**
import { masterSelector } from '@/reduxtool/master/masterSlice'; // **Adjust path and selector name as needed**
import { useSelector } from 'react-redux';

// Type for data coming directly from API before mapping
// Assuming structure is similar to Brands, adjust if necessary
type ApiCategoryItem = {
    id: number;
    name: string;
    slug: string;
    icon: string | null; // Assuming categories have icons
    parent_id: number | null; // Categories often have parents
    show_header: number; // Assuming this applies to categories too
    status: "Active" | "Inactive"; // API status
    meta_title: string | null;
    meta_descr: string | null;
    meta_keyword: string | null;
    created_at: string;
    updated_at: string;
    mobile_no?: string | null; // Keeping for structural similarity, less common for categories
}

// --- Define CategoryItem Type (Mapped for UI) ---
export type CategoryStatus = 'active' | 'inactive';

export type CategoryItem = {
    id: number;
    name: string;
    slug: string;
    icon: string | null; // Filename or null
    icon_full_path?: string; // Optional full path if constructed from base URL + filename
    parentId: number | null; // Mapped from parent_id
    showHeader: number; // 0 or 1
    status: CategoryStatus; // Mapped status for UI
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeyword: string | null;
    createdAt: string;
    updatedAt: string;
    mobileNo: string | null; // Keeping for structural similarity
}


// --- Zod Schema for Add/Edit Category Form ---
const categoryFormSchema = z.object({
    name: z.string().min(1, 'Category name is required.').max(255),
    // slug: z.string().optional(), // Often auto-generated on backend
    parent_id: z.union([z.number().nullable(), z.literal('')]).transform(val => val === '' ? null : val).optional(), // Handle parent category selection (value '' from select clear)
    icon: z.any().optional(), // For file upload (can be File or null/undefined)
    show_header: z.enum(['0', '1']).transform(val => Number(val)), // Assuming '0' or '1' from form select
    status: z.enum(['Active', 'Inactive']), // Match API expected values for submission
    meta_title: z.string().nullable().optional(), // Allow null or undefined
    meta_descr: z.string().nullable().optional(),
    meta_keyword: z.string().nullable().optional(),
    mobile_no: z.string().nullable().optional(),
})
type CategoryFormData = z.infer<typeof categoryFormSchema>

// --- Zod Schema for Filter Form ---
const filterFormCategorySchema = z.object({
    filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Mapped UI status
    filterParents: z.array(z.object({ value: z.number(), label: z.string() })).optional(), // Filter by parent category IDs
})
type FilterFormData = z.infer<typeof filterFormCategorySchema>

// --- CSV Exporter Utility ---
const CSV_HEADERS_CATEGORY = ['ID', 'Name', 'Slug', 'Parent ID', 'Icon URL', 'Show Header', 'Status', 'Meta Title', 'Mobile No.', 'Created At'] // Added Parent ID
type CategoryCsvItem = {
    id: number;
    name: string;
    slug: string;
    parentId: number | null; // Added parentId
    icon_full_path?: string | null; // Full URL for export
    showHeader: number;
    status: CategoryStatus; // UI status for export
    metaTitle?: string | null;
    mobileNo?: string | null;
    createdAt: string; // Formatted date string for export
};

function exportToCsvCategory(filename: string, rows: CategoryItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    // Transform data for CSV output format
    const transformedRows: CategoryCsvItem[] = rows.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        parentId: item.parentId, // Include parentId
        icon_full_path: item.icon_full_path, // Use the full path
        showHeader: item.showHeader,
        status: item.status, // Use the UI status
        metaTitle: item.metaTitle,
        mobileNo: item.mobileNo,
        createdAt: new Date(item.createdAt).toLocaleString(), // Format date for readability
    }));

    const csvKeys: (keyof CategoryCsvItem)[] = ['id', 'name', 'slug', 'parentId', 'icon_full_path', 'showHeader', 'status', 'metaTitle', 'mobileNo', 'createdAt']; // Keys matching transformed object

    const separator = ',';
    const csvContent =
        CSV_HEADERS_CATEGORY.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return csvKeys.map((k) => {
                    let cell = row[k];
                    if (cell === null || cell === undefined) cell = ''; // Replace null/undefined with empty string
                    else cell = String(cell).replace(/"/g, '""'); // Ensure string, escape double quotes
                    if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; // Wrap cells containing special characters
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for UTF-8 encoding
    const link = document.createElement('a');
    if (link.download !== undefined) { // Check for download attribute support (most modern browsers)
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; // Hide link
        document.body.appendChild(link); // Temporarily add to DOM
        link.click(); // Trigger download
        document.body.removeChild(link); // Clean up
        URL.revokeObjectURL(url); // Release object URL
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Your browser does not support this feature.</Notification>); // Fallback toast
    return false;
}

// --- Constants ---
// **Adjust base URL for category icons**
const CATEGORY_ICON_BASE_URL = import.meta.env.VITE_API_URL + '/storage/'; // Use VITE_API_URL from env

const statusColor: Record<CategoryStatus, string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
};
// Options for UI Select (mapped status)
const uiStatusOptions: { value: CategoryStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];
// Options for Form Select (API status values)
const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
];
// Options for Show in Header Select
const showHeaderOptions: { value: '0' | '1'; label: string }[] = [
    { value: '1', label: 'Yes' },
    { value: '0', label: 'No' },
];


// --- Reusable ActionColumn Component ---
// Actions for each category row: Clone, Change Status, Edit, Delete
const ActionColumn = ({ onEdit, onClone, onChangeStatus, onDelete }: {
    onEdit: () => void;
    onClone: () => void;
    onChangeStatus: () => void;
    onDelete: () => void;
}) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-2"> {/* Reduced gap for more icons */}
            <Tooltip title="Clone Category"> {/* Updated title */}
                <div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400')} role="button" onClick={onClone}>
                    <TbCopy />
                </div>
            </Tooltip>
            <Tooltip title="Change Category Status"> {/* Updated title */}
                <div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400')} role="button" onClick={onChangeStatus}>
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Edit Category"> {/* Updated title */}
                <div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400')} role="button" onClick={onEdit}>
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete Category"> {/* Updated title */}
                <div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400')} role="button" onClick={onDelete}>
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    );
};


// --- CategorySearch Component ---
// Search input with debounce functionality
type CategorySearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement> }
const CategorySearch = React.forwardRef<HTMLInputElement, CategorySearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Search categories..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
CategorySearch.displayName = 'CategorySearch';

// --- CategoryTableTools Component ---
// Contains Search input, Filter button, Import button, and Export button
const CategoryTableTools = ({ onSearchChange, onFilter, onExport, onImport }: {
    onSearchChange: (query: string) => void;
    onFilter: () => void; // Handler to open filter drawer
    onExport: () => void; // Handler to trigger export
    onImport: () => void; // Handler to open import dialog
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex-grow"><CategorySearch onInputChange={onSearchChange} /></div> {/* Use CategorySearch */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
                <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button> {/* Import Button */}
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    );
};

// --- CategoryTable Component ---
// Wrapper for DataTable, configured for Categories data and features
type CategoryTableProps = {
    columns: ColumnDef<CategoryItem>[]; // Use CategoryItem
    data: CategoryItem[]; // Use CategoryItem
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: CategoryItem[]; // Use CategoryItem for selected items
    onPaginationChange: (page: number) => void; // Handler for page number changes
    onSelectChange: (value: number) => void; // Handler for page size changes
    onSort: (sort: OnSortParam) => void; // Handler for sorting changes
    onRowSelect: (checked: boolean, row: CategoryItem) => void; // Handler for single row checkbox change
    onAllRowSelect: (checked: boolean, rows: Row<CategoryItem>[]) => void; // Handler for select all checkbox change
}
const CategoryTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: CategoryTableProps) => (
    <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData}
        checkboxChecked={(row) => selectedItems.some(selected => selected.id === row.id)} // Function to check if a row is selected
        onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
        onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} // Pass selection handlers
    />
);

// --- CategorySelectedFooter Component ---
// Sticky footer displayed when items are selected, provides bulk delete action
type CategorySelectedFooterProps = { selectedItems: CategoryItem[]; onDeleteSelected: () => void; } // Use CategoryItem
const CategorySelectedFooter = ({ selectedItems, onDeleteSelected }: CategorySelectedFooterProps) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null; // Don't render if no items are selected
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span>Category{selectedItems.length > 1 ? 's' : ''} selected</span> {/* Updated text */}
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Category${selectedItems.length > 1 ? 's' : ''}`} 
                onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}>
                <p>Are you sure you want to delete the selected category{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p> {/* Updated text */}
            </ConfirmDialog>
        </>
    );
};

// --- Main Categories Component ---
// The main component orchestrating state, data fetching, filtering, sorting, and rendering
const Categories = () => { // Renamed component
    const dispatch = useAppDispatch();

    // Redux State: Fetched category data and loading status
    // **Ensure these match your actual Redux state shape and selector names**
    const { CategoriesData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector);

    // --- Local Component State ---

    // State for DataTable: pagination, sort, and quick search query
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    // State for selected rows (for bulk actions)
    const [selectedItems, setSelectedItems] = useState<CategoryItem[]>([]); // Use CategoryItem

    // State for Drawer UI: controls whether drawers are open
    const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
    // State for Delete Confirmation Dialogs
    const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false); // State for import dialog

    // State for the Category item being edited or deleted (single action)
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null); // Use CategoryItem
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null); // Use CategoryItem

    // State for Loading/Submitting/Deleting states (for UI feedback)
    const [isSubmitting, setSubmitting] = useState(false); // For Add/Edit operations
    const [isDeleting, setDeleting] = useState(false); // For Delete operations (single or bulk)


    // State for Filters: holds the currently applied filters from the drawer form
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterNames: [], filterStatuses: [], filterParents: [] }); // Updated filter criteria default


    // --- Effects ---

    // Effect to fetch data from Redux middleware when the component mounts
    useEffect(() => {
        // Dispatch the action to fetch category data
        dispatch(getCategoriesAction());
        // The effect runs once on mount because the dependency array `[dispatch]` is stable.
    }, [dispatch]);

    // --- Data Mapping ---
    // Memoized mapping from API data structure to UI-friendly BrandItem structure
    const mappedCategories = useMemo(() => {
        if (!Array.isArray(CategoriesData)) return []; // Ensure source data is an array
        return CategoriesData.map((apiItem: ApiCategoryItem) => {
            // Construct the full path for the icon, handling cases where icon is null or already a full URL
            let fullPath = apiItem.icon ? `${CATEGORY_ICON_BASE_URL}${apiItem.icon}` : undefined;
             // Check if icon is already a full URL
            if (apiItem.icon && (apiItem.icon.startsWith('http://') || apiItem.icon.startsWith('https://'))) {
                fullPath = apiItem.icon; // Use the icon value directly if it's a URL
            }

            return {
                id: apiItem.id,
                name: apiItem.name,
                slug: apiItem.slug,
                icon: apiItem.icon, // Store original filename/url from API
                icon_full_path: fullPath, // Store constructed/verified full path for display
                parentId: apiItem.parent_id, // Map parent_id to parentId
                showHeader: apiItem.show_header,
                status: apiItem.status === 'Active' ? 'active' : 'inactive', // Map 'Active'/'Inactive' to 'active'/'inactive'
                metaTitle: apiItem.meta_title,
                metaDescription: apiItem.meta_descr,
                metaKeyword: apiItem.meta_keyword,
                createdAt: apiItem.created_at,
                updatedAt: apiItem.updated_at,
                mobileNo: apiItem.mobile_no ?? null, // Use ?? null to handle potential undefined
            };
        });
    }, [CategoriesData]); // Remap whenever the raw Redux data changes


    // --- Table State Update Handlers ---
    // These handlers update the `tableData` state, which in turn triggers the `useMemo` calculation
    // Memoized using useCallback to ensure stable function references for DataTable props
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }));
    }, []); // No dependencies needed as it only updates local state (`setTableData` is stable)

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
    const addFormMethods = useForm<CategoryFormData>({ resolver: zodResolver(categoryFormSchema), defaultValues: { name: '', parent_id: null, icon: undefined, show_header: '1', status: 'Active', meta_title: null, meta_descr: null, meta_keyword: null, mobile_no: null }, mode: 'onChange' }); // Use category schema and defaults
    const editFormMethods = useForm<CategoryFormData>({ resolver: zodResolver(categoryFormSchema), defaultValues: { name: '', parent_id: null, icon: undefined, show_header: '1', status: 'Active', meta_title: null, meta_descr: null, meta_keyword: null, mobile_no: null }, mode: 'onChange' }); // Use category schema and defaults
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormCategorySchema), defaultValues: filterCriteria }); // Use filter category schema and defaults


    // --- Drawer Handlers (Add/Edit) ---
    // Handlers to open/close drawers and manage form state
    const openAddCategoryDrawer = useCallback(() => {
        addFormMethods.reset({ name: '', parent_id: null, icon: undefined, show_header: '1', status: 'Active', meta_title: null, meta_descr: null, meta_keyword: null, mobile_no: null }); // Reset form to default values
        setAddDrawerOpen(true); // Open the add drawer
    }, [addFormMethods]); // Depend on addFormMethods

    const closeAddCategoryDrawer = useCallback(() => {
        addFormMethods.reset(); // Reset form when closing
        setAddDrawerOpen(false); // Close the add drawer
    }, [addFormMethods]); // Depend on addFormMethods

    // Handles submission of the add category form
    const onAddCategorySubmit = useCallback(async (data: CategoryFormData) => {
        setSubmitting(true); // Show submitting state
        const formData = new FormData();
        // Append form data to FormData object for API submission (handles files and other types)
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'icon' && value instanceof File) {
                 formData.append(key, value); // Append file if selected
            } else if (value !== null && value !== undefined && value !== '') {
                 formData.append(key, String(value)); // Append non-empty, non-null, non-undefined as string
            } else if (value === null && (key === 'parent_id' || key.startsWith('meta_') || key === 'mobile_no')) {
                // Optionally append null for specific nullable fields if API requires explicit 'null' string
                // Example: if (key === 'parent_id' && value === null) formData.append(key, '0');
                // By default, FormData skips null/undefined.
            }
        });
        console.log("Submitting Category Form Data:", Object.fromEntries(formData.entries())); // Log form data entries for debugging

        try {
            // Dispatch add action for category using FormData
            await dispatch(addCategoryAction(formData)).unwrap(); // **Adjust action name**
            toast.push(<Notification title="Category Added" type="success" duration={2000}>Category "{data.name}" added.</Notification>); // Updated success toast
            closeAddCategoryDrawer(); // Close drawer on success
            dispatch(getCategoriesAction()); // Refresh data list after successful add
        } catch (error: any) {
             console.error('Add Category Error:', error); // Log error
            toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error.message || error.data?.message || 'Could not add category.'}</Notification>); // Improved error toast
        } finally { setSubmitting(false); } // Hide submitting state
    }, [dispatch, addCategoryAction, closeAddCategoryDrawer, getCategoriesAction]); // Dependencies include Redux dispatch, actions, drawer closer


    // Opens the edit category drawer and populates the form with category data
    const openEditCategoryDrawer = useCallback((category: CategoryItem) => { // Renamed, Use CategoryItem type
        setEditingCategory(category); // Set the category being edited
        // Reset the edit form with the current category data
        editFormMethods.reset({
            name: category.name,
            parent_id: category.parentId ?? null, // Use parentId, handle null/undefined
            icon: undefined, // Icon field is for new upload, don't pre-fill with File object
            show_header: String(category.showHeader) as '0' | '1', // Map number to string enum for select
            status: category.status === 'active' ? 'Active' : 'Inactive', // Map UI status back to API format
            meta_title: category.metaTitle || null, // Use metaTitle, handle null/undefined
            meta_descr: category.metaDescription || null,
            meta_keyword: category.metaKeyword || null,
            mobile_no: category.mobileNo || null,
        });
        setEditDrawerOpen(true); // Open the edit drawer
    }, [editFormMethods]); // Depend on editFormMethods

    // Closes the edit category drawer and resets the form and editing state
    const closeEditCategoryDrawer = useCallback(() => {
        setEditingCategory(null); // Clear the category being edited
        editFormMethods.reset(); // Reset the edit form
        setEditDrawerOpen(false); // Close the edit drawer
    }, [editFormMethods]); // Depend on editFormMethods

    // Handles submission of the edit category form
    const onEditCategorySubmit = useCallback(async (data: CategoryFormData) => { // Renamed, Use CategoryFormData type
        if (!editingCategory) return; // Ensure a category is being edited
        setSubmitting(true); // Show submitting state
        const formData = new FormData();
        formData.append('_method', 'PUT'); // Important for Laravel or similar backends for PUT requests with FormData
        // Append fields from form data
        Object.entries(data).forEach(([key, value]) => {
             if (key === 'icon') {
                 if (value instanceof File) formData.append(key, value); // Append new file if selected
                 // else do nothing, don't send 'icon' key if no new file is selected
             }
             else if (value !== null && value !== undefined && value !== '') {
                formData.append(key, String(value)); // Append non-empty, non-null, non-undefined as string
             }
             // Do NOT explicitly append null/undefined/empty string for optional fields here
             // unless your API specifically requires them to be sent as 'null' string or similar
        });
         console.log("Submitting Edit Category Form Data for ID", editingCategory.id, ":", Object.fromEntries(formData.entries())); // Log form data entries

        try {
            // Dispatch edit action for category using FormData and category ID
            await dispatch(editCategoryAction({ id: editingCategory.id, data: formData })).unwrap(); // **Adjust action name**
            toast.push(<Notification title="Category Updated" type="success" duration={2000}>Category "{data.name}" updated.</Notification>); // Updated success toast
            closeEditCategoryDrawer(); // Close drawer on success
            dispatch(getCategoriesAction()); // Refresh data list after successful update
        } catch (error: any) {
             console.error('Edit Category Error:', error); // Log error
            toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error.message || error.data?.message || 'Could not update category.'}</Notification>); // Improved error toast
        } finally { setSubmitting(false); } // Hide submitting state
    }, [dispatch, editCategoryAction, editingCategory, closeEditCategoryDrawer, getCategoriesAction]); // Dependencies include Redux dispatch, actions, category being edited, drawer closer, get action


    // --- Delete Handlers ---
    // Handles click on the single delete button for a row
    const handleDeleteClick = useCallback((category: CategoryItem) => { // Renamed, Use CategoryItem type
        setCategoryToDelete(category); // Set the category to be deleted
        setSingleDeleteOpen(true); // Open the single delete confirmation dialog
    }, []); // No dependencies

    // Handles confirmation of the single delete action
    const onConfirmSingleDelete = useCallback(async () => {
        if (!categoryToDelete) return; // Ensure a category is set to delete
        setDeleting(true); // Show deleting state
        setSingleDeleteOpen(false); // Close the confirmation dialog
        try {
            // Dispatch delete action for category (assuming it takes ID)
            await dispatch(deleteCategoryAction(categoryToDelete.id)).unwrap(); // **Adjust action name**
            toast.push(<Notification title="Category Deleted" type="success" duration={2000}>Category "{categoryToDelete.name}" deleted.</Notification>); // Updated success toast
            // Remove deleted item from selected items if it was selected
            setSelectedItems(prev => prev.filter(item => item.id !== categoryToDelete!.id));
            dispatch(getCategoriesAction()); // Refresh data list
        } catch (error: any) {
             console.error('Delete Category Error:', error); // Log error
            toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || error.data?.message || `Could not delete category.`}</Notification>); // Improved error toast
        } finally { setDeleting(false); setCategoryToDelete(null); } // Hide deleting state, clear item to delete
    }, [dispatch, deleteCategoryAction, categoryToDelete, setSelectedItems, getCategoriesAction]); // Dependencies include Redux dispatch, action, item to delete, selection setter, get action

    // Handles the bulk delete action for selected items
    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) {
             toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
             return;
        }
        setDeleting(true); // Show deleting state for bulk action
        // Get IDs of selected items and format as needed by API (comma-separated string)
        const idsToDelete = selectedItems.map(item => item.id);
        const commaSeparatedIds = idsToDelete.join(',');

        try {
            // Dispatch bulk delete action for categories (assuming it takes { ids: string })
            await dispatch(deleteAllCategoriesAction({ ids: commaSeparatedIds })).unwrap(); // **Adjust action name and payload structure**
            toast.push(<Notification title="Categories Deleted" type="success" duration={2000}>{selectedItems.length} category(s) deleted.</Notification>); // Updated success toast
        } catch (error: any) {
             console.error('Delete selected categories error:', error); // Log error
            toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || error.data?.message || 'Failed to delete selected categories.'}</Notification>); // Improved error toast
        } finally {
             setSelectedItems([]); // Clear selection regardless of success/failure
             dispatch(getCategoriesAction()); // Refresh data list
             setDeleting(false); // Hide deleting state
        }
    }, [dispatch, deleteAllCategoriesAction, selectedItems, setSelectedItems, getCategoriesAction]); // Dependencies include Redux dispatch, action, selected items, selection setter, get action


    // --- Other Action Column Handlers ---
    // Handles status change for a single category
    const handleChangeStatus = useCallback(async (category: CategoryItem) => { // Renamed, Use CategoryItem type
        // **Implement actual Redux action dispatch for status change**
        // Determine the new API status based on current UI status
        const newStatusApi = category.status === 'active' ? 'Inactive' : 'Active';
        toast.push(<Notification title="Status Change" type="info">Attempting to change status for "{category.name}" to {newStatusApi}... (Implement backend update)</Notification>); // Updated info toast
        console.log(`Simulating status change for Category ID ${category.id} to ${newStatusApi}`);

        // Example dispatch (assuming you have a changeCategoryStatusAction)
        /*
        try {
             await dispatch(changeCategoryStatusAction({ id: category.id, status: newStatusApi })).unwrap();
             toast.push(<Notification title="Status Updated" type="success" duration={2000}>Status for "{category.name}" changed to {newStatusApi}.</Notification>);
             dispatch(getCategoryAction()); // Refresh data after successful update
        } catch (error: any) {
             console.error('Change Status Error:', error);
             toast.push(<Notification title="Failed to Update Status" type="danger" duration={3000}>{error.message || error.data?.message || 'Could not change status.'}</Notification>);
        }
        */

         // *** For now, just refresh data to reflect potential change if API supports it or you have a polling mechanism ***
         // Or you might optimistically update the UI before dispatching if your action structure allows it.
         // The current setup relies on refetching data after successful CRUD operations.
        dispatch(getCategoriesAction()); // Refresh data (might show old status until backend updates and refetches)
    }, [dispatch, getCategoriesAction]); // Dependencies include Redux dispatch and get action

    // Handles cloning a category
    const handleClone = useCallback((category: CategoryItem) => { // Renamed, Use CategoryItem type
        // **Implement actual clone logic/navigation**
        toast.push(<Notification title="Clone Category" type="info">Cloning "{category.name}"... (Implement clone logic/navigation)</Notification>); // Updated toast
        console.log(`Simulating cloning Category ID ${category.id}`);
        // Example navigation to an add/edit form prefilled with cloned data:
        // import { useNavigate } from 'react-router-dom'; const navigate = useNavigate();
        // navigate('/app/categories/add', { state: { cloneData: category } });
    }, []); // No dependencies


    // --- Filter Handlers ---
    // Handlers to open/close filter drawer and apply/clear filters
    const openFilterDrawer = useCallback(() => {
        filterFormMethods.reset(filterCriteria); // Sync filter form with current applied criteria
        setFilterDrawerOpen(true); // Open the filter drawer
    }, [filterFormMethods, filterCriteria]); // Depend on filterFormMethods and filterCriteria

    const closeFilterDrawer = useCallback(() => setFilterDrawerOpen(false), []); // No dependencies

    // Handles applying filters from the filter form submission
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { // Use FilterFormData type
         setFilterCriteria(data); // Update the filter criteria state with the form data
         handleSetTableData({ pageIndex: 1 }); // Reset table to the first page after applying filters
         closeFilterDrawer(); // Close the drawer after applying
     }, [handleSetTableData, closeFilterDrawer]); // Dependencies include table handler and drawer closer

    // Handles clearing all filters
    const onClearFilters = useCallback(() => {
         // Define the default (empty) filter state
         const defaultFilters = { filterNames: [], filterStatuses: [], filterParents: [] }; // Updated defaults for categories
         filterFormMethods.reset(defaultFilters); // Reset the filter form to default values
         setFilterCriteria(defaultFilters); // Clear the filter state
         handleSetTableData({ pageIndex: 1 }); // Reset table to the first page
         // Note: Drawer is typically closed by user manually or via 'Apply'/'Cancel'
     }, [filterFormMethods, handleSetTableData]); // Dependencies include filterFormMethods and table handler


    // --- Data Processing: Filtering, Searching, Sorting, Pagination ---
    // Memoized computation of the data displayed in the table (`pageData`)
    // and the data used for export (`allFilteredAndSortedData`)
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        // Start with the raw mapped data, ensuring it's an array and creating a mutable copy
        let processedData: CategoryItem[] = cloneDeep(mappedCategories); // Use mappedCategories

        // --- Apply Filters (using the `filterCriteria` state) ---

        // Filter by Name(s)
        if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
            const selectedNames = filterCriteria.filterNames.map(opt => opt.value.toLowerCase());
            processedData = processedData.filter(item => item.name && selectedNames.includes(item.name.toLowerCase())); // Check item.name exists and matches selected names
        }
        // Filter by Status(es)
        if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) {
            const selectedStatuses = filterCriteria.filterStatuses.map(opt => opt.value); // 'active' or 'inactive' (UI status)
            processedData = processedData.filter(item => selectedStatuses.includes(item.status)); // Check if item's status is in selected list
        }
         // Filter by Parent Category
         if (filterCriteria.filterParents && filterCriteria.filterParents.length > 0) {
            const selectedParentIds = filterCriteria.filterParents.map(opt => opt.value); // Number IDs of parent categories
            processedData = processedData.filter(item =>
                 item.parentId !== null && selectedParentIds.includes(item.parentId) // Check if item has a parentId and it's in the selected list
            );
         }


        // --- Apply Quick Search (using the `tableData.query` state) ---
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            // Filter data rows that match the query in any of the relevant string fields
            processedData = processedData.filter(item =>
                String(item.id ?? '').toLowerCase().includes(query) || // Search ID (converted to string, handle null/undefined)
                (item.name?.toLowerCase().includes(query) ?? false) || // Search name (handle null/undefined)
                (item.slug?.toLowerCase().includes(query) ?? false) || // Search slug (handle null/undefined)
                (item.mobileNo?.toLowerCase().includes(query) ?? false) || // Search mobileNo (handle null/undefined)
                item.status.toLowerCase().includes(query) // Search status (already lowercase)
            );
        }

        // --- Apply Sorting (using the `tableData.sort` state) ---
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            const sortedData = [...processedData]; // Create a copy to sort
            sortedData.sort((a, b) => {
                let aValue: any = a[key as keyof CategoryItem]; // Get value for sorting
                let bValue: any = b[key as keyof CategoryItem];

                // Handle special sorting keys
                if (key === 'createdAt' || key === 'updatedAt') { // Sorting by date strings
                    const dateA = aValue ? new Date(aValue as string).getTime() : 0; // Convert date strings to timestamps (milliseconds)
                    const dateB = bValue ? new Date(bValue as string).getTime() : 0;
                    // Handle invalid dates resulting in NaN
                    if (isNaN(dateA) || isNaN(dateB)) return 0; // Treat invalid dates as equal for sorting purposes, or define different logic
                    return order === 'asc' ? dateA - dateB : dateB - dateA; // Numeric comparison for dates
                }

                 // Handle numerical keys like id, parentId, showHeader
                 if (key === 'id' || key === 'parentId' || key === 'showHeader') {
                      const numA = typeof aValue === 'number' ? aValue : (aValue ? Number(aValue) : 0); // Convert to number, default to 0 for null/invalid
                      const numB = typeof bValue === 'number' ? bValue : (bValue ? Number(bValue) : 0);
                       if (isNaN(numA) || isNaN(numB)) return 0; // Handle cases where conversion fails

                      return order === 'asc' ? numA - numB : numB - numA; // Numeric comparison
                 }


                // Default string comparison for other keys (name, slug, status, mobileNo, meta fields)
                const stringA = String(aValue ?? '').toLowerCase(); // Treat null/undefined as empty string for comparison
                const stringB = String(bValue ?? '').toLowerCase();

                if (stringA < stringB) return order === 'asc' ? -1 : 1;
                if (stringA > stringB) return order === 'asc' ? 1 : -1;
                return 0; // Values are equal
            });
            processedData = sortedData; // Use the sorted data
        }

        // --- Data for Export (Filtered & Sorted, before Pagination) ---
        // This slice of data includes all rows that passed filtering and sorting, regardless of current page
        const dataToExport = [...processedData];


        // --- Apply Pagination ---
        // Determine the total number of rows after filtering and searching
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        // Calculate the start index for the current page
        const startIndex = (pageIndex - 1) * pageSize;
        // Slice the processed data to get only the rows for the current page
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        );

        // Return the data for the current page, the total count (after filtering/searching), and the full filtered/sorted data for export
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport }
    }, [mappedCategories, tableData.query, tableData.sort, filterCriteria, tableData.pageIndex, tableData.pageSize]); // Dependencies: Recalculate when raw mapped data, table state (query, sort, page/size), or filter criteria change


    // --- Row Selection Callbacks ---
    // Handlers for managing selected rows state
    const handleRowSelect = useCallback((checked: boolean, row: CategoryItem) => { // Use CategoryItem type
        setSelectedItems(prev => {
            if (checked) {
                // Add item if it's not already selected
                return prev.some(item => item.id === row.id) ? prev : [...prev, row];
            } else {
                // Remove item if it's unselected
                return prev.filter(item => item.id !== row.id);
            }
        });
    }, []); // No dependencies needed as setSelectedItems is stable

    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<CategoryItem>[]) => { // Use CategoryItem type
        const currentPageOriginals = currentRows.map(r => r.original); // Get original data for rows on current page
        if (checked) {
            setSelectedItems(prev => {
                const prevIds = new Set(prev.map(item => item.id)); // Get IDs of previously selected items
                // Add rows from current page that were not previously selected
                const newSelection = currentPageOriginals.filter(item => !prevIds.has(item.id));
                return [...prev, ...newSelection]; // Combine previous selection with new rows
            });
        } else {
            // Remove rows from current page from the selection
            const currentIds = new Set(currentPageOriginals.map(r => r.id));
            setSelectedItems(prev => prev.filter(item => !currentIds.has(item.id)));
        }
    }, []); // No dependencies needed as setSelectedItems is stable


    // --- Export/Import Handlers ---
    // Callback to trigger the CSV export
    const handleExportData = useCallback(() => {
        // Call the exportToCsvCategory helper function with the full filtered and sorted data
        const success = exportToCsvCategory('categories_export.csv', allFilteredAndSortedData); // Use category export function and filename

        // The exportToCsvCategory function already handles success/failure toasts,
        // so no explicit toast is needed here unless you want additional logic.
    }, [allFilteredAndSortedData]); // Dependency on the memoized filtered/sorted data for export


    // Handles opening the import dialog
    const handleImportData = useCallback(() => {
        // **Implement actual import logic**
        setImportDialogOpen(true); // Open import dialog
        console.log("Import functionality triggered."); // Log action
    }, []); // No dependencies

    // Handler for file selection in the import dialog
    const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            console.log("File selected for category import:", file.name);
            // **Here you would typically dispatch a Redux action to handle the file upload and import process**
            // Example dispatch:
            // dispatch(importCategoriesAction(file));

            // Depending on your import process (e.g., takes time, requires confirmation, async upload),
            // you might keep the dialog open, show a progress indicator, or close it immediately.
            // For this placeholder, we just close it and show a toast.
            setImportDialogOpen(false); // Close dialog after selection (or on success)
            toast.push(<Notification title="Import Initiated" type="info">Category import process started. Check logs/notifications for status.</Notification>); // Inform the user
        }
        // Clear the file input value so selecting the same file again triggers the change event
        event.target.value = ''; // This is important for subsequent imports of the same file name
    }, [dispatch, getCategoriesAction /* Add import action if needed */]); // Dependencies may include dispatch and actions


    // --- Generate Dynamic Filter/Form Options ---
    // Memoized generation of options for the Select components in the filter/form drawers
    // Options are derived from the unique values present in the fetched data (`mappedCategories`)

    // Options for filtering/adding/editing Category Name
    const categoryNameOptions = useMemo(() => {
        if (!Array.isArray(mappedCategories)) return [];
        // Use a Set to get unique category names, filtering out potential null/empty names
        const uniqueNames = new Set(mappedCategories.map(cat => cat.name).filter(Boolean));
        // Map unique name strings to { value, label } objects
        return Array.from(uniqueNames).map(name => ({ value: name, label: name }));
    }, [mappedCategories]); // Regenerate options if mapped data changes

     // Options for filtering/adding/editing Parent Category
     const parentCategoryOptions = useMemo(() => {
         if (!Array.isArray(mappedCategories)) return [];
         // Options are categories themselves. We filter out the category currently being edited
         // to prevent a category from being set as its own parent or creating a simple cycle.
         const options = mappedCategories
             .filter(cat => !editingCategory || cat.id !== editingCategory.id) // Exclude self if editing
             .map(cat => ({ value: cat.id, label: cat.name })); // Map category to { value: id, label: name }
         // Add a special option for "No Parent" or root category
         return [{ value: null, label: 'No Parent' }, ...options];
     }, [mappedCategories, editingCategory]); // Regenerate if mapped data or the category being edited changes


    // --- Define DataTable Columns ---
    // Memoized column definitions to prevent unnecessary re-renders of DataTable
    const columns: ColumnDef<CategoryItem>[] = useMemo(() => [ // Use CategoryItem type
        { header: 'ID', accessorKey: 'id', enableSorting: true, size: 60 },
        {
            header: 'Category', accessorKey: 'name', enableSorting: true, // Use 'name' for default sort/accessor
            cell: props => {
                // Custom cell rendering to display category icon and name
                const { icon_full_path, name } = props.row.original;
                return (
                    <div className="flex items-center gap-2 min-w-[200px]">
                        {/* Display Avatar with icon or initial */}
                        <Avatar size={30} shape="circle" src={icon_full_path || undefined} icon={<TbCategory />}> {/* Use Category icon */}
                            {!icon_full_path && name ? name.charAt(0).toUpperCase() : ''} {/* Fallback initial if no icon */}
                        </Avatar>
                        <span>{name || '-'}</span> {/* Display name or dash */}
                    </div>
                );
            },
        },
        { header: 'Slug', accessorKey: 'slug', enableSorting: true, cell: props => props.row.original.slug ?? '-' }, // Display slug or dash
        { header: 'Parent ID', accessorKey: 'parentId', enableSorting: true, cell: props => props.row.original.parentId ?? '-' }, // Display parentId or dash
        {
            header: 'Status', accessorKey: 'status', enableSorting: true, // Use 'status' for sort/accessor
            cell: props => {
                const status = props.row.original.status; // Use mapped UI status ('active' | 'inactive')
                // Use Tag component with dynamic color based on status
                return <Tag className={`${statusColor[status]} capitalize font-semibold border-0`}>{status}</Tag>;
            },
        },
         // Keeping Mobile No column for structural similarity from Brands, remove if not applicable to categories
        { header: 'Mobile No', accessorKey: 'mobileNo', enableSorting: true, cell: props => props.row.original.mobileNo ?? '-' },
        {
            header: 'Actions', id: 'action', meta: { HeaderClass: 'text-center' }, // Action column configuration
            cell: props => (
                // Render ActionColumn component, passing category-specific handlers
                <ActionColumn
                    onEdit={() => openEditCategoryDrawer(props.row.original)}
                    onClone={() => handleClone(props.row.original)}
                    onChangeStatus={() => handleChangeStatus(props.row.original)}
                    onDelete={() => handleDeleteClick(props.row.original)}
                />
            ),
        },
        // Add other columns like meta fields if needed, configure visibility/sorting as appropriate
    ], [handleChangeStatus, handleClone, openEditCategoryDrawer, handleDeleteClick]); // Dependencies: Recreate columns if action handlers change (they are stable via useCallback)


    // Determine overall loading status for the table (Redux status OR local submitting/deleting)
    const tableLoading = masterLoadingStatus === 'loading' || isSubmitting || isDeleting;

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Categories</h5> {/* Updated title */}
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddCategoryDrawer}>Add New Category</Button> {/* Updated button label and handler */}
                    </div>

                    {/* Tools Section (Search, Filter, Import, Export) */}
                    <div className="mb-4">
                         <CategoryTableTools // Use CategoryTableTools component
                            onSearchChange={handleSearchChange} // Pass search handler
                            onFilter={openFilterDrawer} // Pass handler to open filter drawer
                            onExport={handleExportData} // Pass handler to trigger export
                            onImport={handleImportData} // Pass handler to trigger import dialog
                        />
                    </div>

                    {/* Table Section */}
                    <div className="mt-4 flex-grow overflow-auto"> {/* Allows the table body to scroll */}
                        <CategoryTable // Use CategoryTable component
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
            <CategorySelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} /> {/* Use CategorySelectedFooter */}

            {/* Add Category Drawer */}
            <Drawer title="Add Category" isOpen={isAddDrawerOpen} onClose={closeAddCategoryDrawer} onRequestClose={closeAddCategoryDrawer} // Updated title and handlers
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={closeAddCategoryDrawer} disabled={isSubmitting}>Cancel</Button>
                    <Button size="sm" variant="solid" form="addCategoryForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Save'}
                    </Button>
                </div>}>
                {/* Add Category Form */}
                <Form id="addCategoryForm" onSubmit={addFormMethods.handleSubmit(onAddCategorySubmit)} className="flex flex-col gap-4"> {/* Updated form ID and handler */}
                    <FormItem label="Category Name" invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message}> {/* Updated label */}
                        <Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Category Name" />} /> {/* Updated placeholder */}
                    </FormItem>
                     <FormItem label="Parent Category" invalid={!!addFormMethods.formState.errors.parent_id} errorMessage={addFormMethods.formState.errors.parent_id?.message}> {/* Added Parent Category field */}
                        <Controller name="parent_id" control={addFormMethods.control} render={({ field }) => (
                             <UiSelect
                                 options={parentCategoryOptions} // Use generated parent options
                                 value={parentCategoryOptions.find(option => option.value === field.value)} // Find selected option by value
                                 onChange={option => field.onChange(option ? option.value : null)} // Update form value to selected value (number or null)
                                 placeholder="Select parent category"
                                 isClearable // Allow clearing selection (sets value to null)
                             />
                         )} />
                     </FormItem>
                    {/* Keeping Mobile No field for structural similarity */}
                    <FormItem label="Mobile No." invalid={!!addFormMethods.formState.errors.mobile_no} errorMessage={addFormMethods.formState.errors.mobile_no?.message}>
                        <Controller name="mobile_no" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Mobile Number" />} />
                    </FormItem>
                    <FormItem label="Icon" invalid={!!addFormMethods.formState.errors.icon} errorMessage={addFormMethods.formState.errors.icon?.message as string}> {/* Updated label */}
                        <Controller name="icon" control={addFormMethods.control} render={({ field: { onChange, ...rest } }) => <Input type="file" accept="image/*" {...rest} onChange={e => onChange(e.target.files ? e.target.files[0] : null)} />} /> {/* Accept images */}
                    </FormItem>
                    <FormItem label="Show in Header" invalid={!!addFormMethods.formState.errors.show_header} errorMessage={addFormMethods.formState.errors.show_header?.message}>
                        <Controller name="show_header" control={addFormMethods.control} render={({ field }) => <UiSelect options={showHeaderOptions} value={showHeaderOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message}>
                        <Controller name="status" control={addFormMethods.control} render={({ field }) => <UiSelect options={apiStatusOptions} value={apiStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} />
                    </FormItem>
                    {/* Meta Fields */}
                    <FormItem label="Meta Title" invalid={!!addFormMethods.formState.errors.meta_title} errorMessage={addFormMethods.formState.errors.meta_title?.message}>
                        <Controller name="meta_title" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Meta Title" />} />
                    </FormItem>
                    <FormItem label="Meta Description" invalid={!!addFormMethods.formState.errors.meta_descr} errorMessage={addFormMethods.formState.errors.meta_descr?.message}>
                        <Controller name="meta_descr" control={addFormMethods.control} render={({ field }) => <Input {...field} textArea placeholder="Meta Description" />} />
                    </FormItem>
                    <FormItem label="Meta Keywords" invalid={!!addFormMethods.formState.errors.meta_keyword} errorMessage={addFormMethods.formState.errors.meta_keyword?.message}>
                        <Controller name="meta_keyword" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Meta Keywords (comma-separated)" />} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Edit Category Drawer */}
            <Drawer title="Edit Category" isOpen={isEditDrawerOpen} onClose={closeEditCategoryDrawer} onRequestClose={closeEditCategoryDrawer} // Updated title and handlers
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={closeEditCategoryDrawer} disabled={isSubmitting}>Cancel</Button>
                    <Button size="sm" variant="solid" form="editCategoryForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>}>
                 {/* Edit Category Form */}
                <Form id="editCategoryForm" onSubmit={editFormMethods.handleSubmit(onEditCategorySubmit)} className="flex flex-col gap-4"> {/* Updated form ID and handler */}
                    {/* Display current icon if exists */}
                    {editingCategory?.icon_full_path && <FormItem label="Current Icon"><Avatar size={80} src={editingCategory.icon_full_path} shape="rounded" icon={<TbCategory />} /></FormItem>}
                    <FormItem label="Category Name" invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message}> {/* Updated label */}
                        <Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                     <FormItem label="Parent Category" invalid={!!editFormMethods.formState.errors.parent_id} errorMessage={editFormMethods.formState.errors.parent_id?.message}> {/* Added Parent Category field */}
                         <Controller name="parent_id" control={editFormMethods.control} render={({ field }) => (
                             <UiSelect
                                 options={parentCategoryOptions} // Use generated parent options
                                 value={parentCategoryOptions.find(option => option.value === field.value)} // Find selected option by value
                                 onChange={option => field.onChange(option ? option.value : null)} // Update form value to selected value (number or null)
                                 placeholder="Select parent category"
                                 isClearable // Allow clearing selection
                             />
                         )} />
                     </FormItem>
                      {/* Keeping Mobile No field for structural similarity */}
                     <FormItem label="Mobile No." invalid={!!editFormMethods.formState.errors.mobile_no} errorMessage={editFormMethods.formState.errors.mobile_no?.message}>
                        <Controller name="mobile_no" control={editFormMethods.control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                    <FormItem label="New Icon (Optional)" invalid={!!editFormMethods.formState.errors.icon} errorMessage={editFormMethods.formState.errors.icon?.message as string}> {/* Updated label */}
                        <Controller name="icon" control={editFormMethods.control} render={({ field: { onChange, ...rest } }) => <Input type="file" accept="image/*" {...rest} onChange={e => onChange(e.target.files ? e.target.files[0] : null)} />} /> {/* Accept images */}
                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep current icon.</p>
                    </FormItem>
                    <FormItem label="Show in Header" invalid={!!editFormMethods.formState.errors.show_header} errorMessage={editFormMethods.formState.errors.show_header?.message}>
                        <Controller name="show_header" control={editFormMethods.control} render={({ field }) => <UiSelect options={showHeaderOptions} value={showHeaderOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message}>
                        <Controller name="status" control={editFormMethods.control} render={({ field }) => <UiSelect options={apiStatusOptions} value={apiStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} />
                    </FormItem>
                     {/* Meta Fields */}
                    <FormItem label="Meta Title" invalid={!!editFormMethods.formState.errors.meta_title} errorMessage={editFormMethods.formState.errors.meta_title?.message}>
                        <Controller name="meta_title" control={editFormMethods.control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                    <FormItem label="Meta Description" invalid={!!editFormMethods.formState.errors.meta_descr} errorMessage={editFormMethods.formState.errors.meta_descr?.message}>
                        <Controller name="meta_descr" control={editFormMethods.control} render={({ field }) => <Input {...field} textArea />} />
                    </FormItem>
                    <FormItem label="Meta Keywords" invalid={!!editFormMethods.formState.errors.meta_keyword} errorMessage={editFormMethods.formState.errors.meta_keyword?.message}>
                        <Controller name="meta_keyword" control={editFormMethods.control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Filter Categories Drawer */}
            <Drawer title="Filter Categories" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} // Updated title and handlers
                footer={<div className="text-right w-full">
                    <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> {/* Type="button" to prevent form submission */}
                    <Button size="sm" variant="solid" form="filterCategoryForm" type="submit">Apply</Button> {/* Type="submit" and form ID */}
                </div>}>
                {/* Filter Categories Form */}
                <Form id="filterCategoryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4"> {/* Updated form ID and handler */}
                    <FormItem label="Filter by Name(s)">
                        <Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => (
                            <UiSelect isMulti placeholder="Select names..." options={categoryNameOptions} value={field.value} onChange={val => field.onChange(val)} />
                        )} />
                    </FormItem>
                     <FormItem label="Filter by Parent Category(s)">
                        <Controller name="filterParents" control={filterFormMethods.control} render={({ field }) => (
                            // Exclude "No Parent" (value: null) option for the multi-select filter
                             <UiSelect isMulti placeholder="Select parents..." options={parentCategoryOptions.filter(opt => opt.value !== null)} value={field.value} onChange={val => field.onChange(val)} />
                        )} />
                    </FormItem>
                    <FormItem label="Filter by Status(es)">
                        <Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (
                             <UiSelect isMulti placeholder="Select statuses..." options={uiStatusOptions} value={field.value} onChange={val => field.onChange(val)} />
                        )} />
                    </FormItem>
                    {/* Add other filter items here if needed */}
                </Form>
            </Drawer>

            {/* Single Delete Confirmation Dialog */}
            <ConfirmDialog isOpen={singleDeleteOpen} type="danger" title="Delete Category" // Updated title
                onClose={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }} onRequestClose={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }} onCancel={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"?</p> {/* Updated text */}
            </ConfirmDialog>

             {/* Basic Import Dialog Placeholder */}
            <Dialog isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} title="Import Categories"> {/* Updated title */}
                <div className="p-4">
                    <p>Upload a CSV file to import categories.</p> {/* Updated text */}
                    <FormItem label="CSV File"> {/* Wrap file input in FormItem */}
                        <Input type="file" accept=".csv" onChange={handleImportFileSelect} /> {/* Use the dedicated handler */}
                    </FormItem>
                    <div className="text-right mt-4">
                        <Button size="sm" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                        {/* Add an "Upload" or "Submit" button if you don't want to trigger import on file selection */}
                        {/* <Button size="sm" variant="solid" className="ml-2" onClick={handleImportUploadClick}>Upload</Button> */}
                    </div>
                </div>
            </Dialog>

        </>
    );
};

export default Categories; // Export the Categories component

// Helper function for classNames (kept as it's used in ActionColumn)
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' '); }