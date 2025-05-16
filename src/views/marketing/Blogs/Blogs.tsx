import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Textarea from '@/views/ui-components/forms/Input/Textarea'; // YOUR TEXTAREA COMPONENT
import { Drawer, Form, FormItem, Input } from '@/components/ui';
import Dialog from '@/components/ui/Dialog';

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbFileText,
    TbX,
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Redux Imports ---
import { useAppDispatch } from '@/reduxtool/store';
import {
    getBlogsAction,
    addBlogAction,
    editBlogAction,
    deleteBlogAction,
    deleteAllBlogsAction,
} from '@/reduxtool/master/middleware';
import { useSelector } from 'react-redux';
import { masterSelector } from '@/reduxtool/master/masterSlice';

// --- Define Blog Type (Matches API Listing Response) ---
export type BlogItem = {
    id: number;
    title: string;
    slug: string;
    blog_descr: string | null;
    icon: string | null;
    status: 'Published' | 'Unpublished' | 'Draft';
    meta_title: string | null;
    meta_descr: string | null;
    meta_keyword: string | null;
    created_at: string;
    updated_at: string;
    icon_full_path: string | null;
};

// --- Zod Schema for Add/Edit Blog Form (ONLY TITLE IS COMPULSORY) ---
const blogStatusEnum = z.enum(['Published', 'Unpublished', 'Draft']);
const blogFormSchema = z.object({
    title: z.string().min(1, 'Title is required.').max(200, "Title cannot exceed 200 characters."),
    slug: z.string()
        .max(255, "Slug cannot exceed 255 characters.")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format (e.g., my-blog-post)')
        .optional()
        .nullable(),
    blog_descr: z.string().optional().nullable(),
    icon: z.preprocess( // Preprocess to handle empty string from file input when cleared, or just ensure it's null if not a file
        (arg) => (arg === "" || arg === undefined ? null : arg),
        z.instanceof(File, { message: "Icon must be a file." }).optional().nullable()
    ),
    status: blogStatusEnum.default('Draft'),
    meta_title: z.string().max(70, 'Meta Title too long').optional().nullable(),
    meta_descr: z.string().max(160, 'Meta Description too long').optional().nullable(),
    meta_keyword: z.string().max(255, 'Meta Keywords too long').optional().nullable(),
});
export type BlogFormData = z.infer<typeof blogFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Constants ---
const blogStatusOptions = [
    { value: 'Published', label: 'Published' },
    { value: 'Unpublished', label: 'Unpublished' },
    { value: 'Draft', label: 'Draft' },
];

const blogStatusColor: Record<BlogItem['status'], string> = {
    Published: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    Unpublished: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    Draft: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
};

// --- CSV Exporter Utility ---
const CSV_HEADERS = ['ID', 'Title', 'Slug', 'Status', 'Meta Title', 'Meta Description', 'Meta Keywords', 'Created Date'];
const CSV_KEYS: (keyof BlogItem)[] = ['id', 'title', 'slug', 'status', 'meta_title', 'meta_descr', 'meta_keyword', 'created_at'];
function exportToCsv(filename: string, rows: BlogItem[]) {
    if (!rows || !rows.length) { toast.push( <Notification title="No Data" type="info"> Nothing to export. </Notification>, ); return false; }
    const separator = ',';
    const csvContent = CSV_HEADERS.join(separator) + '\n' + rows .map((row) => { return CSV_KEYS.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) { cell = ''; } else if (k === 'created_at' || k === 'updated_at') { cell = new Date(cell).toLocaleDateString(); } else { cell = String(cell).replace(/"/g, '""'); } if (String(cell).search(/("|,|\n)/g) >= 0) { cell = `"${cell}"`; } return cell; }).join(separator); }) .join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;', });
    const link = document.createElement('a');
    if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
    toast.push( <Notification title="Export Failed" type="danger"> Browser does not support this feature. </Notification>, );
    return false;
}

// --- ActionColumn ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400', )} role="button" onClick={onEdit} > <TbPencil /> </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400', )} role="button" onClick={onDelete} > <TbTrash /> </div>
            </Tooltip>
        </div>
    );
};

// --- BlogsSearch ---
type BlogsSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const BlogsSearch = React.forwardRef<HTMLInputElement, BlogsSearchProps>( ({ onInputChange }, ref) => {
    return ( <DebouceInput ref={ref} className="w-full" placeholder="Quick search blogs (title, id, slug)..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> );
});
BlogsSearch.displayName = 'BlogsSearch';

// --- BlogsTableTools ---
const BlogsTableTools = ({ onSearchChange, onFilter, onExport, }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex-grow"> <BlogsSearch onInputChange={onSearchChange} /> </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" > Filter </Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" > Export </Button>
            </div>
        </div>
    );
};

// --- BlogsTable ---
type BlogsTableProps = { columns: ColumnDef<BlogItem>[]; data: BlogItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: BlogItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: BlogItem) => void; onAllRowSelect: (checked: boolean, rows: Row<BlogItem>[]) => void; };
const BlogsTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect, }: BlogsTableProps) => {
    return (
        <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id) } onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} />
    );
};

// --- BlogsSelectedFooter ---
type BlogsSelectedFooterProps = { selectedItems: BlogItem[]; onDeleteSelected: () => void; };
const BlogsSelectedFooter = ({ selectedItems, onDeleteSelected, }: BlogsSelectedFooterProps) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"> <TbChecks /> </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text"> {selectedItems.length} </span>
                            <span> Blog{selectedItems.length > 1 ? 's' : ''}{' '} selected </span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} > Delete Selected </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Blog${selectedItems.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} >
                <p> Are you sure you want to delete the selected blog {selectedItems.length > 1 ? 's' : ''}? This action cannot be undone. </p>
            </ConfirmDialog>
        </>
    );
};

// --- Main Blogs Component ---
const Blogs = () => {
    const dispatch = useAppDispatch();

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState<BlogItem | null>(null);

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatus: [] });
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

    const [isFormSubmitting, setIsFormSubmitting] = useState(false);
    const [isItemDeleting, setIsItemDeleting] = useState(false);

    const { BlogsData = [], loading: masterLoadingStatus, error, itemBeingDeleted } = useSelector(masterSelector) as {
        BlogsData?: BlogItem[],
        loading?: boolean,
        error?: any,
        itemBeingDeleted?: number | null
    };

    useEffect(() => {
        dispatch(getBlogsAction());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            const message = typeof error === 'string' ? error : (error as any)?.message || 'An unknown error occurred';
            toast.push(<Notification title="Error" type="danger">{message}</Notification>);
        }
    }, [error]);

  const defaultFormValues: BlogFormData = {
    title: '',
    slug: null,
    blog_descr: null,
    icon: null, // RHF expects null for an empty file input or an unselected optional file
    status: 'Draft',
    meta_title: null,
    meta_descr: null,
    meta_keyword: null,
};

    const addFormMethods = useForm<BlogFormData>({ resolver: zodResolver(blogFormSchema), defaultValues: defaultFormValues, mode: 'onChange' });
    const editFormMethods = useForm<BlogFormData>({ resolver: zodResolver(blogFormSchema), defaultValues: defaultFormValues, mode: 'onChange' });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

    // --- DEBUGGING useEffect for formState ---
    useEffect(() => {
        if (isAddDrawerOpen) {
            const subscription = addFormMethods.watch((value, { name, type }) => {
                console.log("--- ADD FORM WATCH ---");
                console.log("Field triggered update:", name, "Type:", type);
                console.log("Full Form Value:", value);
                console.log("Icon Value in Form:", value.icon);
                console.log("Is Icon a File object?:", value.icon instanceof File);
                console.log("Is Icon null?:", value.icon === null);
                console.log("Current Errors:", addFormMethods.formState.errors);
                console.log("Is Form Valid:", addFormMethods.formState.isValid);
                console.log("----------------------");
            });
            return () => subscription.unsubscribe();
        }
    }, [addFormMethods, isAddDrawerOpen]);

    useEffect(() => {
        if (isEditDrawerOpen) {
             const subscription = editFormMethods.watch((value, { name, type }) => {
                console.log("--- EDIT FORM WATCH ---");
                console.log("Field triggered update:", name, "Type:", type);
                console.log("Full Form Value:", value);
                console.log("Icon Value in Form:", value.icon);
                console.log("Is Icon a File object?:", value.icon instanceof File);
                console.log("Is Icon null?:", value.icon === null);
                console.log("Current Errors:", editFormMethods.formState.errors);
                console.log("Is Form Valid:", editFormMethods.formState.isValid);
                console.log("-----------------------");
            });
            return () => subscription.unsubscribe();
        }
    }, [editFormMethods, isEditDrawerOpen]);

    const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>, formMethods: typeof addFormMethods | typeof editFormMethods) => {
        const file = event.target.files?.[0];
        if (file) {
            formMethods.setValue('icon', file, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setIconPreview(URL.createObjectURL(file));
        } else {
            // If no file is selected (e.g., user cancels file dialog or clears input if browser supports it),
            // set to null to satisfy Zod's .nullable() and .optional()
            formMethods.setValue('icon', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setIconPreview(null);
        }
    };

    const openAddDrawer = () => { addFormMethods.reset(defaultFormValues); setIconPreview(null); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => { addFormMethods.reset(defaultFormValues); setIconPreview(null); setIsAddDrawerOpen(false); };

    const onAddBlogSubmit: SubmitHandler<BlogFormData> = async (data) => {
        console.log("ADD BLOG SUBMIT - Called. Data:", data, "isValid:", addFormMethods.formState.isValid, "Errors:", addFormMethods.formState.errors);

        // This check is crucial. If isValid is false, the API call won't be made.
        if (!addFormMethods.formState.isValid) {
            toast.push(<Notification title="Validation Error" type="danger">Please correct the form errors. Check console for details.</Notification>);
            Object.entries(addFormMethods.formState.errors).forEach(([fieldName, error]) => {
                console.error(`ADD FORM - Field: ${fieldName}, Error: ${error?.message}`, error);
                if (fieldName === 'icon') {
                    console.error("ADD FORM - Icon field value at submission attempt:", data.icon);
                }
            });
            return; // Exit if form is invalid
        }

        setIsFormSubmitting(true);
        const formDataToSend = new FormData();
        formDataToSend.append('title', data.title);
        if (data.slug) formDataToSend.append('slug', data.slug);
        if (data.blog_descr) formDataToSend.append('blog_descr', data.blog_descr);
        if (data.status) formDataToSend.append('status', data.status);
        if (data.icon instanceof File) { // Ensure it's a File before appending
             formDataToSend.append('icon', data.icon);
        }
        if (data.meta_title) formDataToSend.append('meta_title', data.meta_title);
        if (data.meta_descr) formDataToSend.append('meta_descr', data.meta_descr);
        if (data.meta_keyword) formDataToSend.append('meta_keyword', data.meta_keyword);

        console.log("ADD BLOG SUBMIT - FormData to send (inspect entries):");
        for (let pair of formDataToSend.entries()) {
            console.log(pair[0]+ ', ' + pair[1]);
        }

        try {
            const resultAction = await dispatch(addBlogAction(formDataToSend));
            if (addBlogAction.fulfilled.match(resultAction)) {
                toast.push(<Notification title="Blog Added" type="success">New blog created successfully.</Notification>)
                closeAddDrawer();
                dispatch(getBlogsAction()); // Re-fetch data
            } else if (addBlogAction.rejected.match(resultAction)) {
                // This is often handled by the global error useEffect, but you can add specific logic here
                console.error("Add blog rejected:", resultAction.payload || resultAction.error);
                const errorMessage = (resultAction.payload as any)?.message || resultAction.error.message || "Failed to add blog.";
                toast.push(<Notification title="Add Failed" type="danger">{errorMessage}</Notification>);
            }
        } catch (e) {
            console.error("Add blog submission error caught in component:", e);
            const errorMessage = (e as any)?.message || "An unexpected error occurred while adding the blog.";
            toast.push(<Notification title="Submission Error" type="danger">{errorMessage}</Notification>);
        } finally {
            setIsFormSubmitting(false);
        }
    };

    const openEditDrawer = (blog: BlogItem) => {
        setEditingBlog(blog);
        editFormMethods.reset({ // Reset with existing values
            title: blog.title,
            slug: blog.slug || null,
            blog_descr: blog.blog_descr || null,
            icon: null, // Icon is handled separately for edit: don't pre-fill with old file path
            status: blog.status,
            meta_title: blog.meta_title || null,
            meta_descr: blog.meta_descr || null,
            meta_keyword: blog.meta_keyword || null,
        });
        setIconPreview(blog.icon_full_path); // Show current icon preview
        setIsEditDrawerOpen(true);
    };
    const closeEditDrawer = () => { setEditingBlog(null); editFormMethods.reset(defaultFormValues); setIconPreview(null); setIsEditDrawerOpen(false); };

    const onEditBlogSubmit: SubmitHandler<BlogFormData> = async (data) => {
        console.log("EDIT BLOG SUBMIT - Called. Data:", data, "isValid:", editFormMethods.formState.isValid, "Errors:", editFormMethods.formState.errors);

        if (!editingBlog?.id) {
            toast.push(<Notification title="Error" type="danger">No blog selected for editing.</Notification>);
            return;
        }

        if (!editFormMethods.formState.isValid) {
            toast.push(<Notification title="Validation Error" type="danger">Please correct the form errors. Check console for details.</Notification>);
             Object.entries(editFormMethods.formState.errors).forEach(([fieldName, error]) => {
                console.error(`EDIT FORM - Field: ${fieldName}, Error: ${error?.message}`, error);
                if (fieldName === 'icon') {
                    console.error("EDIT FORM - Icon field value at submission attempt:", data.icon);
                }
            });
            return;
        }

        setIsFormSubmitting(true);
        const formDataToSend = new FormData();
        formDataToSend.append('_method', 'PUT');
        formDataToSend.append('title', data.title);

        // Handle nullable fields: send empty string if user clears it, otherwise send value or omit if unchanged and not provided
        data.slug === null ? formDataToSend.append('slug', '') : data.slug && formDataToSend.append('slug', data.slug);
        data.blog_descr === null ? formDataToSend.append('blog_descr', '') : data.blog_descr && formDataToSend.append('blog_descr', data.blog_descr);

        if (data.status) formDataToSend.append('status', data.status);

        if (data.icon instanceof File) {
            formDataToSend.append('icon', data.icon);
        } else if (data.icon === null && iconPreview === null && editingBlog.icon_full_path) {
            // If icon field is explicitly set to null (e.g. by clicking "Remove") and there was an old icon
            formDataToSend.append('icon', ''); // Send empty string to signify removal
        }
        // If data.icon is null and iconPreview is still set (meaning user didn't touch file input), no 'icon' is appended, backend keeps old one.

        data.meta_title === null ? formDataToSend.append('meta_title', '') : data.meta_title && formDataToSend.append('meta_title', data.meta_title);
        data.meta_descr === null ? formDataToSend.append('meta_descr', '') : data.meta_descr && formDataToSend.append('meta_descr', data.meta_descr);
        data.meta_keyword === null ? formDataToSend.append('meta_keyword', '') : data.meta_keyword && formDataToSend.append('meta_keyword', data.meta_keyword);

        console.log("EDIT BLOG SUBMIT - FormData to send (inspect entries):");
        for (let pair of formDataToSend.entries()) {
            console.log(pair[0]+ ', ' + pair[1]);
        }

        try {
            const resultAction = await dispatch(editBlogAction({ id: editingBlog.id, payload: formDataToSend }));
            if (editBlogAction.fulfilled.match(resultAction)) {
                toast.push(<Notification title="Blog Updated" type="success">Blog updated successfully.</Notification>)
                closeEditDrawer();
                dispatch(getBlogsAction()); // Re-fetch data
            } else if (editBlogAction.rejected.match(resultAction)) {
                console.error("Edit blog rejected:", resultAction.payload || resultAction.error);
                const errorMessage = (resultAction.payload as any)?.message || resultAction.error.message || "Failed to update blog.";
                toast.push(<Notification title="Update Failed" type="danger">{errorMessage}</Notification>);
            }
        } catch(e) {
             console.error("Edit blog submission error caught in component:", e);
             const errorMessage = (e as any)?.message || "An unexpected error occurred while updating the blog.";
             toast.push(<Notification title="Submission Error" type="danger">{errorMessage}</Notification>);
        } finally {
            setIsFormSubmitting(false);
        }
    };

    const handleDeleteClick = (blog: BlogItem) => { setBlogToDelete(blog); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => {
        if (!blogToDelete?.id) return;
        setIsItemDeleting(true); // Use a separate loading state for delete if needed, or rely on masterLoadingStatus
        setSingleDeleteConfirmOpen(false);
        try {
            const result = await dispatch(deleteBlogAction({ id: blogToDelete.id }));
            if(deleteBlogAction.fulfilled.match(result)){
                toast.push(<Notification title="Blog Deleted" type="success">Blog "{blogToDelete.title}" deleted.</Notification>)
                dispatch(getBlogsAction()); // Re-fetch
                setBlogToDelete(null);
            } else {
                 const errorMessage = (result.payload as any)?.message || "Failed to delete blog.";
                 toast.push(<Notification title="Delete Failed" type="danger">{errorMessage}</Notification>);
            }
        } catch(e) {
            console.error("Delete blog error caught in component:", e);
            const errorMessage = (e as any)?.message || "An unexpected error occurred during deletion.";
            toast.push(<Notification title="Delete Error" type="danger">{errorMessage}</Notification>);
        } finally {
            setIsItemDeleting(false); // Reset specific delete loading state
            // setBlogToDelete(null); // Already done in success, good to have in finally if not
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {  toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>); return; }
        setIsItemDeleting(true);
        const idsToDelete = selectedItems.map((item) => item.id).join(',');
        try {
            const result = await dispatch(deleteAllBlogsAction({ ids: idsToDelete }));
            if(deleteAllBlogsAction.fulfilled.match(result)){
                toast.push(<Notification title="Blogs Deleted" type="success">{selectedItems.length} blog(s) deleted.</Notification>)
                setSelectedItems([]);
                dispatch(getBlogsAction()); // Re-fetch
            } else {
                const errorMessage = (result.payload as any)?.message || "Failed to delete selected blogs.";
                toast.push(<Notification title="Deletion Failed" type="danger">{errorMessage}</Notification>);
            }
        } catch(e) {
             console.error("Delete selected blogs error caught in component:", e);
             const errorMessage = (e as any)?.message || "An unexpected error occurred during bulk deletion.";
             toast.push(<Notification title="Deletion Error" type="danger">{errorMessage}</Notification>);
        } finally {
            setIsItemDeleting(false);
        }
    };

    const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
    const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };
    const onClearFilters = () => { const defaultFilters = { filterStatus: [] }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); handleSetTableData({ pageIndex: 1 }); };

    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '', });
    const [selectedItems, setSelectedItems] = useState<BlogItem[]>([]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: BlogItem[] = cloneDeep(BlogsData || []);
        if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
            const selectedStatuses = filterCriteria.filterStatus.map((opt) => opt.value);
            processedData = processedData.filter((item) => selectedStatuses.includes(item.status));
        }
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter((item) =>
                item.title?.toLowerCase().includes(query) ||
                String(item.id).toLowerCase().includes(query) ||
                item.slug?.toLowerCase().includes(query)
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            const sortedData = [...processedData].sort((a, b) => {
                let aValue: any, bValue: any;
                if (key === 'created_at' || key === 'updated_at') {
                    aValue = new Date(a[key as 'created_at' | 'updated_at']).getTime();
                    bValue = new Date(b[key as 'created_at' | 'updated_at']).getTime();
                } else {
                    aValue = String(a[key as keyof BlogItem] ?? '').toLowerCase();
                    bValue = String(b[key as keyof BlogItem] ?? '').toLowerCase();
                }
                if (isNaN(aValue) && !isNaN(bValue)) return order === 'asc' ? 1 : -1;
                if (!isNaN(aValue) && isNaN(bValue)) return order === 'asc' ? -1 : 1;
                if (isNaN(aValue) && isNaN(bValue)) return 0; // Should ideally not happen if data is consistent
                return order === 'asc' ? (aValue < bValue ? -1 : (aValue > bValue ? 1 : 0)) : (bValue < aValue ? -1 : (bValue > aValue ? 1 : 0));
            });
            processedData = sortedData;
        }
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: processedData, };
    }, [BlogsData, tableData, filterCriteria]);

    const handleExportData = () => { const success = exportToCsv( 'blogs_export.csv', allFilteredAndSortedData, ); if (success) { toast.push( <Notification title="Export Successful" type="success"> Data exported. </Notification>, ); } };
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); setSelectedItems([]); }, []);
    const handlePaginationChange = useCallback( (page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData], );
    const handleSelectChange = useCallback( (value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); }, [handleSetTableData], );
    const handleSort = useCallback( (sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData], );
    const handleSearchChange = useCallback( (query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData], );
    const handleRowSelect = useCallback((checked: boolean, row: BlogItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
    const handleAllRowSelect = useCallback( (checked: boolean, currentRows: Row<BlogItem>[]) => { const currentPageRowOriginals = currentRows.map((r) => r.original); if (checked) { setSelectedItems((prevSelected) => { const prevSelectedIds = new Set( prevSelected.map((item) => item.id), ); const newRowsToAdd = currentPageRowOriginals.filter( (r) => !prevSelectedIds.has(r.id), ); return [...prevSelected, ...newRowsToAdd]; }); } else { const currentPageRowIds = new Set( currentPageRowOriginals.map((r) => r.id), ); setSelectedItems((prevSelected) => prevSelected.filter( (item) => !currentPageRowIds.has(item.id), ), ); } }, [], );
    const handleImageClick = (src: string | null) => { if (src) { setImageModalSrc(src); setImageModalOpen(true); }};

    const columns: ColumnDef<BlogItem>[] = useMemo( () => [
            { header: 'Icon', accessorKey: 'icon_full_path', enableSorting: false, size: 80, meta: { headerClass: 'text-center', cellClass: 'text-center' },
                cell: (props) => { const iconPath = props.row.original.icon_full_path; const titleInitial = props.row.original.title?.charAt(0).toUpperCase(); return ( <Avatar size={40} shape="rounded" src={iconPath || undefined} icon={!iconPath ? <TbFileText /> : undefined} onClick={() => handleImageClick(iconPath)} className={iconPath ? "cursor-pointer" : ""} > {!iconPath ? titleInitial : null} </Avatar> ); },
            },
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 },
            { header: 'Title', accessorKey: 'title', enableSorting: true, cell: props => <span className='font-semibold'>{props.getValue<string>()}</span> },
            { header: 'Slug', accessorKey: 'slug', enableSorting: true, size: 200 },
            { header: 'Status', accessorKey: 'status', enableSorting: true, size: 120,
                cell: (props) => { const status = props.row.original.status; return (<Tag className={classNames('capitalize', blogStatusColor[status] || blogStatusColor.Draft)}>{status}</Tag>); },
            },
            { header: 'Created At', accessorKey: 'created_at', enableSorting: true, size: 180, cell: props => new Date(props.getValue<string>()).toLocaleDateString() },
            { header: 'Actions', id: 'action', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100, cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)}/>),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [blogStatusColor], // openEditDrawer and handleDeleteClick are stable due to useCallback or being class methods
    );

    type FormFieldConfig = { name: keyof BlogFormData; label: string; controlType: 'input' | 'textarea' | 'select'; props?: Record<string, any>; options?: { value: string; label: string }[]; optional?: boolean; };
    const formFieldsConfig: FormFieldConfig[] = [
        { name: 'title', label: 'Title', controlType: 'input', props: { placeholder: "Enter Blog Title" } },
        { name: 'slug', label: 'Slug / URL', controlType: 'input', props: { placeholder: "e.g., my-awesome-blog-post" }, optional: true },
        { name: 'blog_descr', label: 'Description', controlType: 'textarea', props: { placeholder: "Enter main blog content...", rows: 5 }, optional: true },
        { name: 'status', label: 'Status', controlType: 'select', options: blogStatusOptions, optional: false }, // Status is not optional in schema default
        { name: 'meta_title', label: 'Meta Title', controlType: 'input', props: { placeholder: "SEO Title (max 70 chars)" }, optional: true },
        { name: 'meta_descr', label: 'Meta Description', controlType: 'textarea', props: { placeholder: "SEO Description (max 160 chars)", rows: 3 }, optional: true },
        { name: 'meta_keyword', label: 'Meta Keywords', controlType: 'input', props: { placeholder: "Comma-separated keywords" }, optional: true },
    ];

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"> <h3 className="mb-2 sm:mb-0">Manage Blogs</h3> <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Blog</Button> </div>
                    <BlogsTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4"> <BlogsTable columns={columns} data={pageData} loading={!!masterLoadingStatus && masterLoadingStatus !== 'succeeded' && masterLoadingStatus !== 'failed'} pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /> </div>
                </AdaptiveCard>
            </Container>
            <BlogsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            {[ { type: 'add', title: 'Add New Blog', isOpen: isAddDrawerOpen, closeFn: closeAddDrawer, formId: 'addBlogForm', methods: addFormMethods, onSubmit: onAddBlogSubmit, submitButtonText: 'Add Blog', submittingText: 'Adding...' }, { type: 'edit', title: 'Edit Blog', isOpen: isEditDrawerOpen, closeFn: closeEditDrawer, formId: 'editBlogForm', methods: editFormMethods, onSubmit: onEditBlogSubmit, submitButtonText: 'Save Changes', submittingText: 'Saving...' } ].map(drawer => (
                <Drawer key={drawer.formId} title={drawer.title} isOpen={drawer.isOpen} onClose={drawer.closeFn} onRequestClose={drawer.closeFn}
                    footer={ <div className="text-right w-full">
                                 <Button size="sm" className="mr-2" onClick={drawer.closeFn} disabled={isFormSubmitting} type="button">Cancel</Button>
                                 <Button
                                    size="sm"
                                    variant="solid"
                                    form={drawer.formId}
                                    type="submit"
                                    loading={isFormSubmitting}
                                    disabled={!drawer.methods.formState.isValid || isFormSubmitting}
                                >
                                    {isFormSubmitting ? drawer.submittingText : drawer.submitButtonText}
                                 </Button>
                             </div> } >
                    <Form id={drawer.formId} onSubmit={drawer.methods.handleSubmit(drawer.onSubmit as any)} className="flex flex-col gap-4">
                        {formFieldsConfig.map(fConfig => (
                            <FormItem key={fConfig.name} label={`${fConfig.label}${fConfig.optional ? ' (Optional)' : ''}`} invalid={!!drawer.methods.formState.errors[fConfig.name]} errorMessage={drawer.methods.formState.errors[fConfig.name]?.message as string | undefined} >
                                <Controller name={fConfig.name} control={drawer.methods.control}
                                    render={({ field }) => {
                                        const fieldValue = field.value === null || field.value === undefined ? '' : field.value; // Ensure input fields get '' for null/undefined
                                        if (fConfig.controlType === 'select') { return <Select placeholder={`Select ${fConfig.label.toLowerCase()}`} options={fConfig.options} value={fConfig.options?.find(opt => opt.value === field.value) || null} onChange={(opt) => field.onChange(opt?.value)} />; }
                                        else if (fConfig.controlType === 'textarea') { return <Textarea {...field} {...fConfig.props} value={fieldValue} />; }
                                        return <Input {...field} {...fConfig.props} value={fieldValue} />;
                                    }}
                                />
                            </FormItem>
                        ))}
                        <FormItem label={`Icon${drawer.type === 'edit' && editingBlog?.icon_full_path ? ' (Current icon below. Select new to change)' : ' (Optional)'}`} invalid={!!drawer.methods.formState.errors.icon} errorMessage={drawer.methods.formState.errors.icon?.message as string | undefined}>
                            {/* Display current icon in EDIT mode if no new one is staged for preview */}
                            {drawer.type === 'edit' && iconPreview && !drawer.methods.watch('icon') && (
                                <div className="mb-2 flex items-center gap-2">
                                    <img src={iconPreview} alt="Current Icon" className="h-20 w-20 object-contain border rounded" />
                                    <Button icon={<TbX/>} variant='twoTone' size="xs" color="red" type="button" onClick={() => {
                                        setIconPreview(null); // Clear preview
                                        drawer.methods.setValue('icon', null, {shouldValidate: true}); // Explicitly set form value to null for removal
                                    }}>Remove Current Icon</Button>
                                </div>
                            )}
                            {/* Display new icon PREVIEW if a new file is selected (for both ADD and EDIT) */}
                            {iconPreview && drawer.methods.watch('icon') instanceof File && (
                                 <img src={iconPreview} alt="New Icon Preview" className="mt-2 mb-2 h-24 w-auto object-contain border rounded" />
                            )}
                            {/* Message about removing icon in EDIT mode */}
                             {!iconPreview && drawer.type === 'edit' && editingBlog?.icon_full_path && !drawer.methods.watch('icon') && (
                                 <p className='text-xs text-gray-500 mb-1'>Current icon will be removed if "Remove Current Icon" was clicked or if form submits with icon field as null.</p>
                             )}
                            <Input
                                type="file"
                                accept="image/*"
                                // We don't use register here because we want full control with setValue for File objects
                                // {...drawer.methods.register('icon')}
                                onChange={(e) => handleIconChange(e, drawer.methods)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                            {/* Zod error message will appear here if 'icon' field is invalid */}
                        </FormItem>
                    </Form>
                </Drawer>
            ))}

            <Drawer title="Filter Blogs" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={ <div className="flex justify-between w-full"> <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button> <div> <Button size="sm" className="mr-2" onClick={closeFilterDrawer} type="button">Cancel</Button> <Button size="sm" variant="solid" form="filterBlogForm" type="submit">Apply Filters</Button> </div> </div> } > <Form id="filterBlogForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4" > <FormItem label="Filter by Status"> <Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => ( <Select isMulti placeholder="Select status(es)..." options={blogStatusOptions} value={field.value || []} onChange={(selectedVal) => field.onChange(selectedVal || []) } /> )} /> </FormItem> </Form> </Drawer>
            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Blog" onClose={() => { setSingleDeleteConfirmOpen(false); setBlogToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setBlogToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setBlogToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isItemDeleting || (!!masterLoadingStatus && masterLoadingStatus !== 'succeeded' && masterLoadingStatus !== 'failed' && !!itemBeingDeleted && blogToDelete?.id === itemBeingDeleted)} > <p> Are you sure you want to delete the blog "<strong>{blogToDelete?.title}</strong>"? This action cannot be undone. </p> </ConfirmDialog>
            <Dialog isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} onRequestClose={() => setImageModalOpen(false)} bodyOpenClassName="overflow-hidden" title="Blog Icon" footer={ <Button onClick={() => setImageModalOpen(false)}>Close</Button> } > {imageModalSrc ? ( <img src={imageModalSrc} alt="Blog Icon Full" className="max-w-full max-h-[80vh] mx-auto" /> ) : ( <p>No image to display.</p> )} </Dialog>
        </>
    );
};

export default Blogs;

// Helper for classNames, assuming it's not globally available or in a utils file.
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}