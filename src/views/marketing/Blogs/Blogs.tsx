import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // Keep if navigation needed
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
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
import Avatar from '@/components/ui/Avatar'; // Added
import Tag from '@/components/ui/Tag'; // Added
import { Drawer, Form, FormItem, Input } from '@/components/ui'; // Added Textarea

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbFileText, // Added for default icon
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import Textarea from '@/views/ui-components/forms/Input/Textarea';
// --- Removed Redux imports for now, using local state ---
// import { useAppDispatch } from '@/reduxtool/store';
// import {
//     getBlogsAction, // Placeholder
//     addBlogAction, // Placeholder
//     editBlogAction, // Placeholder
//     deleteBlogAction, // Placeholder
//     deleteAllBlogsAction, // Placeholder
// } from '@/reduxtool/blog/middleware'; // Placeholder path
// import { useSelector } from 'react-redux';
// import { blogSelector } from '@/reduxtool/blog/blogSlice'; // Placeholder path

// --- Define Blog Type ---
// Includes fields for both listing and add/edit
export type BlogItem = {
    id: string | number; // Use string if IDs are like 'BLOG001'
    title: string;
    slug: string;
    description?: string; // Optional
    metaTagTitle?: string; // Optional
    metaTagDescription?: string; // Optional
    metaTagKeywords?: string; // Optional
    icon?: string | null; // Optional URL for featured image
    status: 'published' | 'unpublished' | 'draft';
    createdDate?: Date; // Optional, useful for sorting/display
};

// --- Zod Schema for Add/Edit Blog Form ---
const blogFormSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required.')
        .max(200, 'Title cannot exceed 200 characters.'),
    slug: z
        .string()
        .min(1, 'Slug/URL is required.')
        .max(255, 'Slug cannot exceed 255 characters.')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format (e.g., my-blog-post)'), // Basic slug validation
    description: z.string().optional(),
    metaTagTitle: z.string().max(70, 'Meta Title too long').optional(),
    metaTagDescription: z.string().max(160, 'Meta Description too long').optional(),
    metaTagKeywords: z.string().max(255, 'Meta Keywords too long').optional(),
    status: z.enum(['published', 'unpublished', 'draft'], {
        errorMap: () => ({ message: 'Please select a valid status.' }),
    }),
    // icon is handled separately, maybe via an upload component later
});
type BlogFormData = z.infer<typeof blogFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterStatus: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    // Add other filter fields if needed, e.g., title search within filter
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Constants ---
const blogStatusOptions = [
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
    { value: 'draft', label: 'Draft' },
];

const blogStatusColor: Record<BlogItem['status'], string> = {
    published: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    unpublished: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
};

// --- CSV Exporter Utility ---
// Define specific headers and keys for export
const CSV_HEADERS = ['ID', 'Title', 'Slug', 'Status', 'Meta Title', 'Meta Description', 'Meta Keywords', 'Created Date'];
const CSV_KEYS: (keyof BlogItem)[] = ['id', 'title', 'slug', 'status', 'metaTagTitle', 'metaTagDescription', 'metaTagKeywords', 'createdDate'];

function exportToCsv(filename: string, rows: BlogItem[]) {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        );
        return false;
    }
    const separator = ',';

    const csvContent =
        CSV_HEADERS.join(separator) +
        '\n' +
        rows
            .map((row) => {
                return CSV_KEYS.map((k) => {
                    let cell: any = row[k];
                    if (cell === null || cell === undefined) {
                        cell = '';
                    } else if (cell instanceof Date) {
                        cell = cell.toISOString(); // Format date consistently
                    } else {
                        cell = String(cell).replace(/"/g, '""'); // Ensure string and escape double quotes
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
    });
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
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
        </Notification>,
    );
    return false;
}


// --- Initial Dummy Data ---
const initialDummyBlogs: BlogItem[] = [
    {
        id: 'BLOG001',
        title: 'Getting Started with Our Platform',
        slug: 'getting-started-with-our-platform',
        icon: null, // '/img/blogs/getting_started.jpg',
        status: 'published',
        createdDate: new Date(2023, 10, 1, 10, 0),
        description: 'A beginner\'s guide...',
        metaTagTitle: 'Get Started Guide',
        metaTagDescription: 'Learn the basics of our platform.',
        metaTagKeywords: 'guide, startup, beginner'
    },
    {
        id: 'BLOG002',
        title: 'Advanced Features Deep Dive',
        slug: 'advanced-features-deep-dive',
        icon: null,
        status: 'draft',
        createdDate: new Date(2023, 10, 3, 14, 30),
        description: 'Explore advanced functionalities...'
    },
    {
        id: 'BLOG003',
        title: 'Top 5 Security Tips for 2024',
        slug: 'top-5-security-tips-2024',
        icon: null, // '/img/blogs/security.png',
        status: 'published',
        createdDate: new Date(2023, 9, 28, 9, 15),
    },
    {
        id: 'BLOG004',
        title: 'Old Announcement: Summer Sale',
        slug: 'old-announcement-summer-sale',
        icon: null,
        status: 'unpublished', // Changed from archived
        createdDate: new Date(2023, 6, 15, 11, 0),
    },
    {
        id: 'BLOG005',
        title: 'Understanding Our New API',
        slug: 'understanding-our-new-api',
        icon: null, // '/img/blogs/api.svg',
        status: 'published',
        createdDate: new Date(2023, 9, 20, 16, 45),
    },
];
// --- End Dummy Data ---


// --- ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onDelete,
}: {
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
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
    );
};

// --- BlogsSearch Component ---
type BlogsSearchProps = {
    onInputChange: (value: string) => void;
    ref?: Ref<HTMLInputElement>;
};
const BlogsSearch = React.forwardRef<HTMLInputElement, BlogsSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full"
                placeholder="Quick search blogs (title, id)..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        );
    },
);
BlogsSearch.displayName = 'BlogsSearch';

// --- BlogsTableTools Component ---
const BlogsTableTools = ({
    onSearchChange,
    onFilter,
    onExport,
}: {
    onSearchChange: (query: string) => void;
    onFilter: () => void;
    onExport: () => void;
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex-grow">
                <BlogsSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                    icon={<TbFilter />}
                    onClick={onFilter}
                    className="w-full sm:w-auto"
                >
                    Filter
                </Button>
                <Button
                    icon={<TbCloudUpload />}
                    onClick={onExport}
                    className="w-full sm:w-auto"
                >
                    Export
                </Button>
            </div>
        </div>
    );
};

// --- BlogsTable Component ---
type BlogsTableProps = {
    columns: ColumnDef<BlogItem>[];
    data: BlogItem[];
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: BlogItem[];
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: BlogItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<BlogItem>[]) => void;
};
const BlogsTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedItems,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: BlogsTableProps) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedItems.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    );
};

// --- BlogsSelectedFooter Component ---
type BlogsSelectedFooterProps = {
    selectedItems: BlogItem[];
    onDeleteSelected: () => void;
};
const BlogsSelectedFooter = ({
    selectedItems,
    onDeleteSelected,
}: BlogsSelectedFooterProps) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => {
        onDeleteSelected();
        setDeleteConfirmationOpen(false);
    };
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
            >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            <TbChecks />
                        </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">
                                {selectedItems.length}
                            </span>
                            <span>
                                Blog{selectedItems.length > 1 ? 's' : ''}{' '}
                                selected
                            </span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteClick}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedItems.length} Blog${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected blog
                    {selectedItems.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    );
};

// --- Main Blogs Component ---
const Blogs = () => {
    // const dispatch = useAppDispatch(); // Uncomment if using Redux

    // Use local state for data management
    const [blogsData, setBlogsData] = useState<BlogItem[]>(initialDummyBlogs);
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle'); // Simulate loading

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] =
        useState(false);
    const [blogToDelete, setBlogToDelete] = useState<BlogItem | null>(null);

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
        filterStatus: [],
    });

    // --- Redux Data Fetching (Placeholder) ---
    // useEffect(() => {
    //     // dispatch(getBlogsAction()); // Example Redux fetch
    // }, [dispatch]);
    // const { blogsData = [], status: masterLoadingStatus = 'idle' } =
    //     useSelector(blogSelector); // Example Redux selector

    const addFormMethods = useForm<BlogFormData>({
        resolver: zodResolver(blogFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            metaTagTitle: '',
            metaTagDescription: '',
            metaTagKeywords: '',
            status: 'draft',
        },
        mode: 'onChange',
    });
    const editFormMethods = useForm<BlogFormData>({
        resolver: zodResolver(blogFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            metaTagTitle: '',
            metaTagDescription: '',
            metaTagKeywords: '',
            status: 'draft',
        },
        mode: 'onChange',
    });
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    });

    // --- CRUD Handlers (using local state) ---
    const openAddDrawer = () => {
        addFormMethods.reset(); // Reset to default values
        setIsAddDrawerOpen(true);
    };
    const closeAddDrawer = () => {
        addFormMethods.reset();
        setIsAddDrawerOpen(false);
    };
    const onAddBlogSubmit = async (data: BlogFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading'); // Simulate loading
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const newBlog: BlogItem = {
                ...data,
                id: `BLOG${Date.now()}`, // Simple unique ID generation
                createdDate: new Date(),
                // icon: handle icon upload/selection separately
            };
            // Update local state
            setBlogsData((prev) => [...prev, newBlog]);

            // Replace with Redux dispatch if needed:
            // await dispatch(addBlogAction(newBlog)).unwrap();

            toast.push(
                <Notification title="Blog Added" type="success" duration={2000}>
                    Blog "{data.title}" added.
                </Notification>,
            );
            closeAddDrawer();
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Add"
                    type="danger"
                    duration={3000}
                >
                    {error?.message || 'Could not add blog.'}
                </Notification>,
            );
            console.error('Add Blog Error:', error);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const openEditDrawer = (blog: BlogItem) => {
        setEditingBlog(blog);
        // Set form values from the blog item
        editFormMethods.reset({
            title: blog.title,
            slug: blog.slug,
            description: blog.description ?? '',
            metaTagTitle: blog.metaTagTitle ?? '',
            metaTagDescription: blog.metaTagDescription ?? '',
            metaTagKeywords: blog.metaTagKeywords ?? '',
            status: blog.status,
        });
        setIsEditDrawerOpen(true);
    };
    const closeEditDrawer = () => {
        setEditingBlog(null);
        editFormMethods.reset();
        setIsEditDrawerOpen(false);
    };
    const onEditBlogSubmit = async (data: BlogFormData) => {
        if (!editingBlog?.id) {
             toast.push(
                <Notification title="Error" type="danger">
                    Cannot edit: Blog ID is missing.
                </Notification>,
            );
            return;
        }
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

        try {
            const updatedBlog: BlogItem = {
                ...editingBlog, // Keep existing ID, createdDate, icon etc.
                ...data, // Overwrite with form data
            };

            // Update local state
            setBlogsData((prev) =>
                prev.map((b) => (b.id === updatedBlog.id ? updatedBlog : b))
            );

             // Replace with Redux dispatch if needed:
            // await dispatch(editBlogAction(updatedBlog)).unwrap();

            toast.push(
                <Notification
                    title="Blog Updated"
                    type="success"
                    duration={2000}
                >
                    Blog "{data.title}" updated.
                </Notification>,
            );
            closeEditDrawer();
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Update"
                    type="danger"
                    duration={3000}
                >
                    {error?.message || 'Could not update blog.'}
                </Notification>,
            );
            console.error('Edit Blog Error:', error);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const handleDeleteClick = (blog: BlogItem) => {
        if (blog.id === undefined || blog.id === null) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot delete: Blog ID is missing.
                </Notification>,
            );
            return;
        }
        setBlogToDelete(blog);
        setSingleDeleteConfirmOpen(true);
    };
    const onConfirmSingleDelete = async () => {
        if (!blogToDelete?.id) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot delete: Blog ID is missing.
                </Notification>,
            )
            setBlogToDelete(null)
            setSingleDeleteConfirmOpen(false)
            return;
        }
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

        try {
            const idToDelete = blogToDelete.id;
            // Update local state
            setBlogsData((prev) => prev.filter((b) => b.id !== idToDelete));

            // Replace with Redux dispatch if needed:
            // await dispatch(deleteBlogAction({ id: idToDelete })).unwrap();

            toast.push(
                <Notification
                    title="Blog Deleted"
                    type="success"
                    duration={2000}
                >
                    Blog "{blogToDelete.title}" deleted.
                </Notification>,
            );
            setSelectedItems((prev) =>
                prev.filter((item) => item.id !== idToDelete),
            );
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Delete"
                    type="danger"
                    duration={3000}
                >
                    {error?.message || `Could not delete blog.`}
                </Notification>,
            );
            console.error('Delete Blog Error:', error);
        } finally {
            setIsDeleting(false);
            setMasterLoadingStatus('idle');
            setBlogToDelete(null);
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
            return;
        }
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API

        try {
            const idsToDelete = selectedItems.map((item) => item.id);

            // Update local state
            setBlogsData((prev) => prev.filter((b) => !idsToDelete.includes(b.id)));

            // Replace with Redux dispatch if needed:
            // await dispatch(deleteAllBlogsAction({ ids: idsToDelete })).unwrap();

            toast.push(
                <Notification
                    title="Deletion Successful"
                    type="success"
                    duration={2000}
                >
                    {selectedItems.length} blog(s) deleted.
                </Notification>,
            );
            setSelectedItems([]); // Clear selection
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Deletion Failed"
                    type="danger"
                    duration={3000}
                >
                    {error?.message || 'Failed to delete selected blogs.'}
                </Notification>,
            );
            console.error('Delete selected blogs error:', error);
        } finally {
            setIsDeleting(false);
            setMasterLoadingStatus('idle');
        }
    };

    // --- Filter Handlers ---
    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria); // Load current filters into form
        setIsFilterDrawerOpen(true);
    };
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
    const onApplyFiltersSubmit = (data: FilterFormData) => {
        // Map selected options back if needed, depending on Select component behavior
        const appliedFilters = {
            filterStatus: data.filterStatus || []
        }
        setFilterCriteria(appliedFilters);
        handleSetTableData({ pageIndex: 1 }); // Reset to first page after filtering
        closeFilterDrawer();
    };
    const onClearFilters = () => {
        const defaultFilters = { filterStatus: [] };
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        handleSetTableData({ pageIndex: 1 }); // Reset to first page
        // Optionally close drawer: closeFilterDrawer();
    };


    // --- Table State and Data Processing ---
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    });
    const [selectedItems, setSelectedItems] = useState<BlogItem[]>([]);

    // Memoized calculation for filtering, sorting, searching, pagination
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: BlogItem[] = cloneDeep(blogsData); // Use local state data

        // 1. Apply Filters
        if (
            filterCriteria.filterStatus &&
            filterCriteria.filterStatus.length > 0
        ) {
            const selectedStatuses = filterCriteria.filterStatus.map((opt) => opt.value);
            processedData = processedData.filter((item: BlogItem) =>
                selectedStatuses.includes(item.status),
            );
        }

        // 2. Apply Search Query (on title and id)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter((item: BlogItem) => {
                const itemTitleLower = item.title?.trim().toLowerCase() ?? '';
                const itemIdString = String(item.id ?? '').trim().toLowerCase();
                return (
                    itemTitleLower.includes(query) || itemIdString.includes(query)
                );
            });
        }

        // 3. Apply Sorting (adapt keys as needed)
        const { order, key } = tableData.sort as OnSortParam;
        if (
            order &&
            key &&
            ['id', 'title', 'status', 'createdDate'].includes(key) && // Add sortable keys
            processedData.length > 0
        ) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof BlogItem];
                const bValue = b[key as keyof BlogItem];

                // Handle different types for comparison
                if (aValue instanceof Date && bValue instanceof Date) {
                    return order === 'asc'
                        ? aValue.getTime() - bValue.getTime()
                        : bValue.getTime() - aValue.getTime();
                } else {
                     // Default to string comparison
                     const aStr = String(aValue ?? '').toLowerCase();
                     const bStr = String(bValue ?? '').toLowerCase();
                     return order === 'asc'
                        ? aStr.localeCompare(bStr)
                        : bStr.localeCompare(aStr);
                }
            });
            processedData = sortedData;
        }

        const dataToExport = [...processedData]; // Data for export before pagination

        // 4. Apply Pagination
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        );

        return {
            pageData: dataForPage,
            total: currentTotal,
            allFilteredAndSortedData: dataToExport,
        };
    }, [blogsData, tableData, filterCriteria]); // Depend on local data and table/filter state

    // --- Export Handler ---
    const handleExportData = () => {
        const success = exportToCsv(
            'blogs_export.csv',
            allFilteredAndSortedData, // Use the memoized filtered/sorted data
        );
        if (success) {
            toast.push(
                <Notification title="Export Successful" type="success">
                    Data exported.
                </Notification>,
            );
        }
    };

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }));
    }, []);
    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    );
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
            setSelectedItems([]);
        },
        [handleSetTableData],
    );
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            handleSetTableData({ sort: sort, pageIndex: 1 });
        },
        [handleSetTableData],
    );
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    );
    const handleRowSelect = useCallback((checked: boolean, row: BlogItem) => {
        setSelectedItems((prev) => {
            if (checked)
                return prev.some((item) => item.id === row.id)
                    ? prev
                    : [...prev, row];
            return prev.filter((item) => item.id !== row.id);
        });
    }, []);
    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<BlogItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original);
            if (checked) {
                setSelectedItems((prevSelected) => {
                    const prevSelectedIds = new Set(
                        prevSelected.map((item) => item.id),
                    );
                    const newRowsToAdd = currentPageRowOriginals.filter(
                        (r) => !prevSelectedIds.has(r.id),
                    );
                    return [...prevSelected, ...newRowsToAdd];
                });
            } else {
                const currentPageRowIds = new Set(
                    currentPageRowOriginals.map((r) => r.id),
                );
                setSelectedItems((prevSelected) =>
                    prevSelected.filter(
                        (item) => !currentPageRowIds.has(item.id),
                    ),
                );
            }
        },
        [],
    );

    // --- Table Column Definitions ---
    const columns: ColumnDef<BlogItem>[] = useMemo(
        () => [
            {
                header: 'Icon',
                accessorKey: 'icon',
                enableSorting: false,
                size: 80,
                meta: { headerClass: 'text-center', cellClass: 'text-center' },
                cell: (props) => {
                    const { icon, title } = props.row.original;
                    return (
                         <Avatar
                            size={30}
                            shape="circle"
                            src={icon || undefined} // Use icon URL if available
                            icon={<TbFileText />} // Fallback icon
                         >
                            {!icon ? title?.charAt(0).toUpperCase() : ''} {/* Fallback initial */}
                         </Avatar>
                    );
                },
            },
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
            {
                header: 'Title',
                accessorKey: 'title',
                enableSorting: true,
                // Optional: Add cell rendering for truncation or linking
                 cell: (props) => (
                     <span className='font-semibold'>{props.row.original.title}</span>
                 )
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 120,
                cell: (props) => {
                    const { status } = props.row.original;
                    return (
                        <Tag
                            prefix
                            className={classNames(
                                'rounded-md capitalize font-semibold border-0',
                                blogStatusColor[status] ?? blogStatusColor.draft,
                             )}
                        >
                            {status}
                        </Tag>
                    );
                },
            },
            {
                header: 'Created Date', // Optional column
                accessorKey: 'createdDate',
                enableSorting: true,
                size: 180,
                cell: (props) => {
                    const date = props.row.original.createdDate;
                    return date ? (
                        <span>
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    ) : (
                        '-'
                    );
                },
            },
            {
                header: 'Actions',
                id: 'action',
                meta: { headerClass: 'text-center', cellClass: 'text-center' },
                size: 100,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
                        onDelete={() => handleDeleteClick(props.row.original)}
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [openEditDrawer, handleDeleteClick], // Add dependencies if they change
    );


    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-2 sm:mb-0">Manage Blogs</h3>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAddDrawer}
                        >
                            Add New Blog
                        </Button>
                    </div>

                    <BlogsTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                    />

                    <div className="mt-4">
                        <BlogsTable
                            columns={columns}
                            data={pageData}
                            loading={
                                masterLoadingStatus === 'loading' ||
                                isSubmitting ||
                                isDeleting
                            }
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectedItems={selectedItems}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onRowSelect={handleRowSelect}
                            onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <BlogsSelectedFooter
                selectedItems={selectedItems}
                onDeleteSelected={handleDeleteSelected}
            />

            {/* Add Blog Drawer */}
            <Drawer
                title="Add New Blog"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeAddDrawer}
                            disabled={isSubmitting}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="addBlogForm" // Link to form ID
                            type="submit" // Trigger form submission
                            loading={isSubmitting}
                            disabled={
                                !addFormMethods.formState.isValid ||
                                isSubmitting
                            }
                        >
                            {isSubmitting ? 'Adding...' : 'Add Blog'}
                        </Button>
                    </div>
                }
            >
                {/* Use React Hook Form */}
                <Form
                    id="addBlogForm"
                    onSubmit={addFormMethods.handleSubmit(onAddBlogSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem
                        label="Title"
                        invalid={!!addFormMethods.formState.errors.title}
                        errorMessage={
                            addFormMethods.formState.errors.title?.message
                        }
                    >
                        <Controller
                            name="title"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Enter Blog Title"
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Slug / URL"
                        invalid={!!addFormMethods.formState.errors.slug}
                        errorMessage={
                            addFormMethods.formState.errors.slug?.message
                        }
                    >
                        <Controller
                            name="slug"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="e.g., my-awesome-blog-post"
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="Description (Optional)">
                         <Controller
                            name="description"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="Enter main blog content..."
                                    rows={5}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="Meta Tag Title (Optional)">
                        <Controller
                            name="metaTagTitle"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="SEO Title (max 70 chars)"
                                />
                            )}
                        />
                         {addFormMethods.formState.errors.metaTagTitle && <span className="text-red-500 text-xs">{addFormMethods.formState.errors.metaTagTitle.message}</span>}
                    </FormItem>

                    <FormItem label="Meta Tag Description (Optional)">
                        <Controller
                            name="metaTagDescription"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="SEO Description (max 160 chars)"
                                    rows={3}
                                />
                            )}
                        />
                         {addFormMethods.formState.errors.metaTagDescription && <span className="text-red-500 text-xs">{addFormMethods.formState.errors.metaTagDescription.message}</span>}
                    </FormItem>

                    <FormItem label="Meta Tag Keywords (Optional)">
                        <Controller
                            name="metaTagKeywords"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Comma-separated keywords"
                                />
                            )}
                        />
                         {addFormMethods.formState.errors.metaTagKeywords && <span className="text-red-500 text-xs">{addFormMethods.formState.errors.metaTagKeywords.message}</span>}
                    </FormItem>

                    <FormItem
                        label="Status"
                        invalid={!!addFormMethods.formState.errors.status}
                        errorMessage={
                            addFormMethods.formState.errors.status?.message
                        }
                     >
                         <Controller
                            name="status"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Select // Using your UI Select component
                                     placeholder="Select status"
                                     options={blogStatusOptions}
                                     value={blogStatusOptions.find(opt => opt.value === field.value)} // Find the option object
                                     onChange={(option) => field.onChange(option?.value)} // Pass the value back
                                 />
                            )}
                        />
                    </FormItem>
                     {/* Add Icon Upload later if needed */}

                </Form>
            </Drawer>

            {/* Edit Blog Drawer */}
             <Drawer
                title="Edit Blog"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeEditDrawer}
                            disabled={isSubmitting}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="editBlogForm" // Link to form ID
                            type="submit" // Trigger form submission
                            loading={isSubmitting}
                            disabled={
                                !editFormMethods.formState.isValid ||
                                isSubmitting
                            }
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                {/* Use React Hook Form */}
                <Form
                    id="editBlogForm"
                    onSubmit={editFormMethods.handleSubmit(onEditBlogSubmit)}
                    className="flex flex-col gap-4"
                >
                    {/* Re-use the same form structure as Add, controlled by editFormMethods */}
                     <FormItem
                        label="Title"
                        invalid={!!editFormMethods.formState.errors.title}
                        errorMessage={
                            editFormMethods.formState.errors.title?.message
                        }
                    >
                        <Controller
                            name="title"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Enter Blog Title"
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Slug / URL"
                        invalid={!!editFormMethods.formState.errors.slug}
                        errorMessage={
                            editFormMethods.formState.errors.slug?.message
                        }
                    >
                        <Controller
                            name="slug"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="e.g., my-awesome-blog-post"
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="Description (Optional)">
                         <Controller
                            name="description"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="Enter main blog content..."
                                    rows={5}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="Meta Tag Title (Optional)">
                        <Controller
                            name="metaTagTitle"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="SEO Title (max 70 chars)"
                                />
                            )}
                        />
                         {editFormMethods.formState.errors.metaTagTitle && <span className="text-red-500 text-xs">{editFormMethods.formState.errors.metaTagTitle.message}</span>}
                    </FormItem>

                     <FormItem label="Meta Tag Description (Optional)">
                        <Controller
                            name="metaTagDescription"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    placeholder="SEO Description (max 160 chars)"
                                    rows={3}
                                />
                            )}
                        />
                         {editFormMethods.formState.errors.metaTagDescription && <span className="text-red-500 text-xs">{editFormMethods.formState.errors.metaTagDescription.message}</span>}
                    </FormItem>

                    <FormItem label="Meta Tag Keywords (Optional)">
                        <Controller
                            name="metaTagKeywords"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Comma-separated keywords"
                                />
                            )}
                        />
                         {editFormMethods.formState.errors.metaTagKeywords && <span className="text-red-500 text-xs">{editFormMethods.formState.errors.metaTagKeywords.message}</span>}
                    </FormItem>

                     <FormItem
                        label="Status"
                        invalid={!!editFormMethods.formState.errors.status}
                        errorMessage={
                            editFormMethods.formState.errors.status?.message
                        }
                     >
                         <Controller
                            name="status"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                 <Select // Using your UI Select component
                                     placeholder="Select status"
                                     options={blogStatusOptions}
                                     value={blogStatusOptions.find(opt => opt.value === field.value)} // Find the option object
                                     onChange={(option) => field.onChange(option?.value)} // Pass the value back
                                 />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Filter Drawer */}
            <Drawer
                title="Filter Blogs"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="flex justify-between w-full">
                         <Button
                            size="sm"
                            onClick={onClearFilters}
                            type="button" // Important: prevent form submission
                        >
                            Clear All
                        </Button>
                        <div>
                            <Button
                                size="sm"
                                className="mr-2"
                                onClick={closeFilterDrawer}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                form="filterBlogForm" // Link to form
                                type="submit"
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                }
            >
                <Form
                    id="filterBlogForm"
                    onSubmit={filterFormMethods.handleSubmit(
                        onApplyFiltersSubmit,
                    )}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Filter by Status">
                        <Controller
                            name="filterStatus"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select status(es)..."
                                    options={blogStatusOptions} // Use the defined options
                                    value={field.value || []} // Ensure value is always an array
                                    onChange={(selectedVal) =>
                                        field.onChange(selectedVal || []) // Ensure array on change
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    {/* Add more filter fields here if needed */}
                </Form>
            </Drawer>

            {/* Single Delete Confirmation */}
            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Blog"
                onClose={() => {
                    setSingleDeleteConfirmOpen(false);
                    setBlogToDelete(null);
                }}
                onRequestClose={() => {
                    setSingleDeleteConfirmOpen(false);
                    setBlogToDelete(null);
                }}
                onCancel={() => {
                    setSingleDeleteConfirmOpen(false);
                    setBlogToDelete(null);
                }}
                confirmButtonColor="red-600"
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting} // Pass loading state
            >
                <p>
                    Are you sure you want to delete the blog "
                    <strong>{blogToDelete?.title}</strong>"? This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    );
};

export default Blogs;

// Helper (keep if not globally available)
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}