// src/views/your-path/CategoryListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form' // Added for filter form
import { zodResolver } from '@hookform/resolvers/zod' // Added for filter form
import { z } from 'zod' // Added for filter form
import type { ZodType } from 'zod' // Added for filter form

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog'; // Keep for potential edit/view modals
import Avatar from '@/components/ui/Avatar'; // Use for Image column
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
// import RichTextEditor from '@/components/shared/RichTextEditor'; // Remove if not used
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import { HiOutlinePhotograph } from 'react-icons/hi'; // Placeholder icon for image
import Checkbox from '@/components/ui/Checkbox' // Added for filter form
import Input from '@/components/ui/Input' // Added for filter form
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // Added for filter form & renamed FormItem

// Icons
import {
    TbPencil,
    TbCopy, // Keep clone if needed
    TbSwitchHorizontal, // For status change
    TbTrash,
    TbChecks,
    TbSearch,
    TbCategoryPlus, // Example replacement icon
    TbCloudUpload ,
    TbCloudDownload, // Keep for potential future export
    TbFilter, // Added for filter button
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row, SortingFnOption } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)
// --- End Lazy Load ---

// --- Define FormItem Type (Table Row Data) ---
export type FormItem = {
    id: string
    name: string
    status: 'active' | 'inactive'
    // Add fields corresponding to filter schema
    purchasedProducts?: string // Optional product associated with form
    purchaseChannel?: string // Optional channel associated with form
}
// --- End FormItem Type Definition ---

// --- Define Filter Schema Type (Matches the provided filter component) ---
type CategoryFilterFormSchema = {
    purchasedProducts: string | any
    purchaseChannel: Array<string> | any
}
// --- End Filter Schema Type ---

// --- Define Item Type (Table Row Data) ---
export type CategoryItem = {
    id: string;
    status: 'active' | 'inactive';
    name: string;
    parentCategoryName: string | null; // Name of the parent, null if top-level
    image: string | null; // URL of the image, null if no image
};
// --- End Item Type Definition ---


// --- Constants ---
const statusColor: Record<CategoryItem['status'], string> = {
    active: 'text-green-600 bg-green-200', // Use solid colors for tags
    inactive: 'text-red-600 bg-red-200',
};

const initialDummyCategories: CategoryItem[] = [
    { id: 'CAT001', status: 'active', name: 'Electronics', parentCategoryName: null, image: '/img/categories/electronics.jpg' },
    { id: 'CAT002', status: 'active', name: 'Mobile Phones', parentCategoryName: 'Electronics', image: '/img/categories/mobiles.jpg' },
    { id: 'CAT003', status: 'inactive', name: 'Laptops', parentCategoryName: 'Electronics', image: '/img/categories/laptops.jpg' },
    { id: 'CAT004', status: 'active', name: 'Clothing', parentCategoryName: null, image: '/img/categories/clothing.jpg' },
    { id: 'CAT005', status: 'active', name: "Men's Wear", parentCategoryName: 'Clothing', image: '/img/categories/menswear.jpg' },
    { id: 'CAT006', status: 'active', name: "Women's Wear", parentCategoryName: 'Clothing', image: '/img/categories/womenswear.jpg' },
    { id: 'CAT007', status: 'active', name: 'Home Appliances', parentCategoryName: null, image: '/img/categories/appliances.jpg' },
    { id: 'CAT008', status: 'inactive', name: 'Televisions', parentCategoryName: 'Home Appliances', image: null }, // No image
    { id: 'CAT009', status: 'active', name: 'Books', parentCategoryName: null, image: '/img/categories/books.jpg' },
    { id: 'CAT010', status: 'active', name: 'Fiction', parentCategoryName: 'Books', image: null },
    { id: 'CAT011', status: 'active', name: 'Furniture', parentCategoryName: null, image: '/img/categories/furniture.jpg' },
    { id: 'CAT012', status: 'active', name: 'Chairs', parentCategoryName: 'Furniture', image: '/img/categories/chairs.jpg' },
    { id: 'CAT013', status: 'active', name: 'Accessories', parentCategoryName: 'Electronics', image: '/img/categories/accessories.jpg' },
    { id: 'CAT014', status: 'active', name: 'Shoes', parentCategoryName: 'Clothing', image: '/img/categories/shoes.jpg' },
    { id: 'CAT015', status: 'inactive', name: 'Audio Equipment', parentCategoryName: 'Electronics', image: null },
];

// Filter specific constant from the provided filter component
const channelList = [
    'Retail Stores',
    'Online Retailers',
    'Resellers',
    'Mobile Apps',
    'Direct Sales',
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onEdit: () => void;
    onClone?: () => void; // Keep clone optional
    onChangeStatus: () => void; // Status change seems relevant
    onDelete: () => void;
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';

    return (
        <div className="flex items-center justify-center">
            {/* Optional Clone Button */}
            {/* {onClone && (
                <Tooltip title="Clone Category">
                    <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400' )} role="button" onClick={onClone} > <TbCopy /> </div>
                </Tooltip>
             )} */}
            <Tooltip title="Change Status">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400' )} role="button" onClick={onChangeStatus} > <TbSwitchHorizontal /> </div>
            </Tooltip>
            <Tooltip title="Edit Category">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400' )} role="button" onClick={onEdit} > <TbPencil /> </div>
            </Tooltip>
            <Tooltip title="Delete Category">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400' )} role="button" onClick={onDelete} > <TbTrash /> </div>
            </Tooltip>
        </div>
    );
};
// --- End ActionColumn ---


// --- CategoryTable Component ---
const CategoryTable = ({ // Renamed component
    columns,
    data,
    loading,
    pagingData,
    selectedCategories, // Renamed prop
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<CategoryItem>[];
    data: CategoryItem[];
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedCategories: CategoryItem[]; // Use new type
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: CategoryItem) => void; // Use new type
    onAllRowSelect: (checked: boolean, rows: Row<CategoryItem>[]) => void; // Use new type
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedCategories.some((selected) => selected.id === row.id) // Use selectedCategories
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    );
};
// --- End CategoryTable ---


// --- CategorySearch Component ---
type CategorySearchProps = { // Renamed component
    onInputChange: (value: string) => void;
    ref?: Ref<HTMLInputElement>;
};
const CategorySearch = React.forwardRef<HTMLInputElement, CategorySearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick search..." // Updated placeholder
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        );
    }
);
CategorySearch.displayName = 'CategorySearch';
// --- End CategorySearch ---


// --- CategoryTableFilter Component (As provided by user, adapted for props) ---
const CategoryTableFilter = ({
    // Mimic the data structure the original hook would provide
    filterData,
    setFilterData,
}: {
    filterData: CategoryFilterFormSchema
    setFilterData: (data: CategoryFilterFormSchema) => void
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)

    // Zod validation schema from the provided code
    const validationSchema: ZodType<CategoryFilterFormSchema> = z.object({
        purchasedProducts: z.string().optional().default(''), // Made optional for better reset
        purchaseChannel: z.array(z.string()).optional().default([]), // Made optional for better reset
    })

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<CategoryFilterFormSchema>({
        // Use the filterData passed from the parent as default values
        defaultValues: filterData,
        resolver: zodResolver(validationSchema),
    })

    // Watch for prop changes to reset the form if external state changes
    React.useEffect(() => {
        reset(filterData)
    }, [filterData, reset])

    const onSubmit = (values: CategoryFilterFormSchema) => {
        setFilterData(values) // Call the setter function passed from parent
        setIsOpen(false)
    }

    const handleReset = () => {
        // Reset form using react-hook-form's reset
        const defaultVals = validationSchema.parse({}) // Get default values from schema
        reset(defaultVals)
        // Optionally also immediately apply the reset filter state to the parent
        // setFilterData(defaultVals);
        // onDialogClose(); // Close after resetting if desired
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={openDialog} className=''>
                Filter
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter Forms</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Input from the provided filter component */}
                    <UiFormItem label="Products">
                        <Controller
                            name="purchasedProducts"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Search by purchased product"
                                    {...field}
                                />
                            )}
                        />
                    </UiFormItem>
                    {/* Checkboxes from the provided filter component */}
                    <UiFormItem label="Purchase Channel">
                        <Controller
                            name="purchaseChannel"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []} // Ensure value is array
                                    onChange={field.onChange}
                                >
                                    {channelList.map((source, index) => (
                                        <Checkbox
                                            key={source + index}
                                            // name={field.name} // Not needed when using Controller value/onChange
                                            value={source}
                                            className="mb-1" // Use mb-1 for spacing
                                        >
                                            {source}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    <div className="flex justify-end items-center gap-2 mt-6">
                        <Button type="button" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button type="submit" variant="solid">
                            Apply
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}

// --- CategoryTableTools Component ---
const CategoryTableTools = ({ // Renamed component
    onSearchChange,
    filterData,
    setFilterData,
    allCategories
}: {
    onSearchChange: (query: string) => void;
    filterData: CategoryFilterFormSchema
    setFilterData: (data: CategoryFilterFormSchema) => void // Prop type for setter
    allCategories: CategoryItem[] // Pass all subscribers for export
}) => {

    // Prepare data for CSV
    const csvData = useMemo(
        () =>
            allCategories.map((s) => ({
                id: s.id,
                name: s.name,
                image: s.image,
                parentCategoryName: s.parentCategoryName,
                status: s.status,
            })),
        [allCategories],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Image', key: 'image' },
        { label: 'Parent Category', key: 'parentCategoryName' },
        { label: 'status', key: 'status' },
    ]

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            {/* <div className="flex-grow"> */}
            <CategorySearch onInputChange={onSearchChange} />
            <CategoryTableFilter
                filterData={filterData}
                setFilterData={setFilterData}
            />
            <Button icon={<TbCloudDownload/>}>Import</Button>
            <Suspense fallback={<Button loading>Loading Export...</Button>}>
                <CSVLink
                    filename="categories.csv"
                    data={csvData}
                    headers={csvHeaders}
                >
                    <Button icon={<TbCloudUpload/>}>Export</Button>
                </CSVLink>
            </Suspense>
            {/* </div> */}
            {/* No Filter button in this version */}
        </div>
    );
};

// --- End CategoryTableTools ---


// --- CategoryActionTools Component ---
const CategoryActionTools = ({ allCategories }: { allCategories: CategoryItem[] }) => { // Renamed prop and component
    const navigate = useNavigate();

    // Prepare data for CSV
    const csvData = useMemo(() => {
        return allCategories.map(item => ({
            id: item.id,
            name: item.name,
            status: item.status,
            parentCategoryName: item.parentCategoryName ?? 'N/A',
            image: item.image ?? 'No Image',
        }));
    }, [allCategories]);

    const csvHeaders = [
        { label: "ID", key: "id" },
        { label: "Name", key: "name" },
        { label: "Status", key: "status" },
        { label: "Parent Category", key: "parentCategoryName" },
        { label: "Image URL", key: "image" },
      ];

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="categories.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbCategoryPlus className="text-xl" />} // Changed icon
                onClick={() => console.log('Navigate to Add New Category page')}
                // onClick={() => navigate('/categories/create')}
                block
            >
                Add New {/* Updated Text */}
            </Button>
        </div>
    );
};
// --- End CategoryActionTools ---


// --- CategorySelected Component ---
const CategorySelected = ({ // Renamed component
    selectedCategories, // Renamed prop
    setSelectedCategories, // Renamed prop
    onDeleteSelected,
}: {
    selectedCategories: CategoryItem[]; // Use new type
    setSelectedCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>; // Use new type
    onDeleteSelected: () => void;
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };

    if (selectedCategories.length === 0) return null;

    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                     <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"> <TbChecks /> </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedCategories.length}</span> {/* Use selectedCategories */}
                            <span>Category{selectedCategories.length > 1 ? 's' : ''} selected</span> {/* Updated text */}
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}> Delete </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedCategories.length} Category${selectedCategories.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} confirmButtonColor="red-600">
                <p>Are you sure you want to delete the selected category{selectedCategories.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};
// --- End CategorySelected ---


// --- Main CategoryListing Component ---
const Categories = () => { // Renamed Component
    const navigate = useNavigate();

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryItem[]>(initialDummyCategories); // Renamed state
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedCategories, setSelectedCategories] = useState<CategoryItem[]>([]); // Renamed state
    
    const [selectedForms, setSelectedForms] = useState<FormItem[]>([])
    // State for Filters (matching the provided filter component schema)
    const [filterData, setFilterData] = useState<CategoryFilterFormSchema>({
        purchasedProducts: '',
        purchaseChannel: [],
    })
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...categories]; // Use categories state

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase();
            processedData = processedData.filter(
                (cat) =>
                    cat.id.toLowerCase().includes(query) ||
                    cat.name.toLowerCase().includes(query) ||
                    (cat.parentCategoryName?.toLowerCase().includes(query) ?? false) || // Search parent name safely
                    cat.status.toLowerCase().includes(query)
            );
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof CategoryItem] ?? '';
                const bValue = b[key as keyof CategoryItem] ?? '';

                // Handle nulls for parentCategoryName sorting (e.g., nulls first or last)
                 if (key === 'parentCategoryName') {
                     if (aValue === null && bValue === null) return 0;
                     if (aValue === null) return order === 'asc' ? -1 : 1; // Nulls first in asc
                     if (bValue === null) return order === 'asc' ? 1 : -1;  // Nulls first in asc
                 }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                // Add number comparison if any numeric fields exist
                return 0;
            });
            processedData = sortedData;
        }

        // Apply Pagination
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const dataTotal = processedData.length;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

        return { pageData: dataForPage, total: dataTotal };
    }, [categories, tableData]); // Use categories state
    // --- End Memoized Data Processing ---


    // --- Lifted Handlers (Update parameter types and state setters) ---
    // Handler to update filter state (passed to filter component)
    const handleApplyFilter = useCallback((newFilterData: CategoryFilterFormSchema) => {
        setFilterData(newFilterData)
        setTableData((prevTableData) => ({ ...prevTableData, pageIndex: 1 }))
        setSelectedForms([])
    }, []) // No dependencies needed as it only sets state
    const handleSetTableData = useCallback((data: TableQueries) => { setTableData(data); }, []);
    const handlePaginationChange = useCallback((page: number) => { handleSetTableData({ ...tableData, pageIndex: page }); }, [tableData, handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ ...tableData, pageSize: Number(value), pageIndex: 1 }); setSelectedCategories([]); }, [tableData, handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { handleSetTableData({ ...tableData, query: query, pageIndex: 1 }); }, [tableData, handleSetTableData]);

    const handleRowSelect = useCallback((checked: boolean, row: CategoryItem) => { // Use new type
        setSelectedCategories((prev) => { // Use new state setter
            if (checked) {
                return prev.some((cat) => cat.id === row.id) ? prev : [...prev, row];
            } else {
                return prev.filter((cat) => cat.id !== row.id);
            }
        });
    }, []); // Add setSelectedCategories if linting complains

    const handleAllRowSelect = useCallback((checked: boolean, rows: Row<CategoryItem>[]) => { // Use new type
        const rowIds = new Set(rows.map(r => r.original.id));
        if (checked) {
             const originalRows = rows.map((row) => row.original);
             setSelectedCategories(prev => { // Use new state setter
                const existingIds = new Set(prev.map(cat => cat.id));
                const newSelection = originalRows.filter(cat => !existingIds.has(cat.id));
                return [...prev, ...newSelection];
             });
        } else {
             setSelectedCategories(prev => prev.filter(cat => !rowIds.has(cat.id))); // Use new state setter
        }
    }, []); // Add setSelectedCategories if linting complains

    const handleEdit = useCallback((category: CategoryItem) => { // Use new type
        console.log('Edit category:', category.id);
        // navigate(`/categories/edit/${category.id}`);
    }, [navigate]);

    const handleClone = useCallback((categoryToClone: CategoryItem) => { // Use new type
        console.log('Cloning category:', categoryToClone.id, categoryToClone.name);
        const newId = `CAT${Math.floor(Math.random() * 9000) + 1000}`;
        const clonedCategory: CategoryItem = {
            ...categoryToClone,
            id: newId,
            name: `${categoryToClone.name} (Clone)`,
            status: 'inactive', // Cloned items often start inactive
        };
        setCategories((prev) => [clonedCategory, ...prev]); // Use new state setter
    }, []); // Add setCategories if linting complains

    const handleChangeStatus = useCallback((category: CategoryItem) => { // Use new type
        const newStatus = category.status === 'active' ? 'inactive' : 'active';
        console.log(`Changing status of category ${category.id} to ${newStatus}`);
        setCategories((currentCategories) => // Use new state setter
            currentCategories.map((cat) =>
                cat.id === category.id ? { ...cat, status: newStatus } : cat
            )
        );
    }, []); // Add setCategories if linting complains

    const handleDelete = useCallback((categoryToDelete: CategoryItem) => { // Use new type
        console.log('Deleting category:', categoryToDelete.id, categoryToDelete.name);
        setCategories((currentCategories) => // Use new state setter
            currentCategories.filter((cat) => cat.id !== categoryToDelete.id)
        );
        setSelectedCategories((prevSelected) => // Use new state setter
            prevSelected.filter((cat) => cat.id !== categoryToDelete.id)
        );
    }, []); // Add setCategories, setSelectedCategories if linting complains

     const handleDeleteSelected = useCallback(() => {
        console.log('Deleting selected categories:', selectedCategories.map(cat => cat.id)); // Use new state
        const selectedIds = new Set(selectedCategories.map(cat => cat.id));
        setCategories(currentCategories => currentCategories.filter(cat => !selectedIds.has(cat.id))); // Use new state setter
        setSelectedCategories([]); // Use new state setter
    }, [selectedCategories]); // Add setCategories, setSelectedCategories if linting complains
    // --- End Lifted Handlers ---


    // --- Define Columns in Parent ---
    const columns: ColumnDef<CategoryItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 70 }, // Example width
            {
                header : "Category",
                id: "category",
                size:200,
                enableSorting: true,
                cell: (props)=>{
                    const { image, name } = props.row.original
                    return (
                        <div className='flex gap-2 items-center'>
                            <Avatar
                                size={40}
                                shape="circle"
                                src={image}
                                icon={<HiOutlinePhotograph />} // Placeholder icon
                            >
                                {!image ? name.charAt(0).toUpperCase() : ''}
                            </Avatar>
                            <span>{name}</span>
                        </div>
                    )
                }
            },
            // {
            //     header: 'Image',
            //     accessorKey: 'image',
            //     enableSorting: false, // Usually don't sort by image
            //     cell: props => {
            //         const { image, name } = props.row.original;
            //         return (
            //             <Avatar
            //                 size={40} // Adjust size
            //                 shape="rounded" // Or 'square'
            //                 src={image}
            //                 icon={<HiOutlinePhotograph />} // Placeholder icon
            //             >
            //                 {!image ? name.charAt(0).toUpperCase() : ''} {/* Fallback letter avatar */}
            //             </Avatar>
            //         );
            //     }
            // },
            // { header: 'Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Parent Category',
                accessorKey: 'parentCategoryName',
                enableSorting: true,
                cell: props => <span>{props.row.original.parentCategoryName ?? '-'}</span> // Display '-' if null
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                cell: props => {
                    const { status } = props.row.original;
                    return (
                        <Tag
                            className={`${statusColor[status]} capitalize`} // Added text-white for contrast
                            prefix={false} // Show color as a dot prefix
                            // prefixClass={statusColor[status]}
                        >
                            {status}
                        </Tag>
                    );
                }
            },
            {
                header: 'Action', id: 'action', // Actions column
                meta : {HeaderClass : "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onClone={() => handleClone(props.row.original)}
                        onChangeStatus={() => handleChangeStatus(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        // Update dependencies
        [handleClone, handleChangeStatus, handleEdit, handleDelete]
    );
    // --- End Define Columns ---


    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Categories</h5> {/* Updated title */}
                    <CategoryActionTools allCategories={categories} /> {/* Use updated component/prop */}
                </div>

                {/* Tools Section */}
                <div className="mb-4">
                    <CategoryTableTools 
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter} // Pass the handler to update filter state
                        allCategories={categories} // Pass data for export
                    /> {/* Use updated component */}
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <CategoryTable // Use updated component
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                        selectedCategories={selectedCategories} // Use updated prop
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <CategorySelected // Use updated component
                selectedCategories={selectedCategories} // Use updated prop
                setSelectedCategories={setSelectedCategories} // Use updated prop
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    );
};
// --- End Main Component ---

export default Categories; // Updated export name

// Helper Function
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}