// src/views/your-path/SubscribersListing.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    lazy,
    Suspense,
    useEffect, // Added useEffect
} from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate potentially useful for cloning/navigation, but removed for view-only
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ZodType } from 'zod';
// Removed IoEyeOutline, SlOptionsVertical as ActionColumn is removed

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog'; // For Import dialog
// Removed Avatar, Badge, Checkbox (no icons, no specific badges, no selection checkboxes)
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast'; // Ensure toast is configured
// Removed ConfirmDialog, StickyFooter (no delete, no bulk actions)
import DebouceInput from '@/components/shared/DebouceInput';
import { Card, Drawer, Tag, Form, FormItem, Input, Select, DatePicker, Table, Dropdown } from '@/components/ui'; // Keep necessary components
// Removed HiOutlineCalendar (if date picker icon is handled internally)

// Icons
import {
    // Removed TbPencil, TbTrash, TbChecks, TbEdit, TbPlus (no Add/Edit/Delete/Bulk)
    TbSearch,
    TbFilter,
    TbCloudDownload, // For Import button
    TbCloudUpload, // For Export button
    TbMail,
    TbCalendar,
    TbX,
    TbUserCheck, // Example icon for email/subscriber
} from 'react-icons/tb';

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
);
// --- End Lazy Load ---

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
// Assuming you have an action to fetch subscribers
import { getSubscribersAction } from '@/reduxtool/master/middleware'; // **Adjust path and action name as needed**
import { masterSelector } from '@/reduxtool/master/masterSlice'; // **Adjust path and selector name as needed**
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';


// Type for data coming directly from API before mapping
// Based on your provided sample data structure
type ApiSubscriberItem = {
    id: number; // Assuming number based on sample, but 'string' in your type
    email: string;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
    // Assuming name, status, source might also come from API or be derived/added
    name?: string | null;
    status?: string | null; // API status, e.g., "Active", "Inactive", "Unsubscribed"
    source?: string | null;
}


// --- Define Item Type (Mapped for UI) ---
// Mapping from API data structure to a UI-friendly format
export type SubscriberStatus = 'Active' | 'Inactive' | 'Unsubscribed' | string; // Allow other statuses from API

export type SubscriberItem = {
    id: number; // Use number based on API sample, but adjust if your API sends string
    name?: string | null; // Optional, assuming might not always be present
    email: string;
    subscribedDate: Date; // Mapped from created_at string to Date object
    status: SubscriberStatus; // Mapped from API status, using the defined union/string
    source?: string | null; // Optional
    // Add other mapped fields if needed
};
// --- End Item Type Definition ---


// --- Updated Status Colors ---
// Use the mapped UI status values for keys
const statusColor: Record<SubscriberStatus, string> = {
    Active: 'bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-100',
    Inactive: 'bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    Unsubscribed: 'bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-100',
    // Add default or handle other statuses if needed
};

// --- Define Filter Schema ---
// Schema for the filter form data
const filterValidationSchema = z.object({
    // Date range filter for 'subscribedDate' (mapped from 'created_at')
    dateRange: z.array(z.date().nullable()).length(2).nullable().optional(), // [Date | null, Date | null] or null

    // Filter by status (using UI status values)
    filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),

    // Filter by source (using source values)
    filterSources: z.array(z.object({ value: z.string(), label: z.string() })).optional(),

    // Add other filter fields here if needed (e.g., by email domain, name)
})
type FilterFormSchema = z.infer<typeof filterValidationSchema>;
// --- End Filter Schema ---


// --- CSV Exporter Utility ---
// Define headers and keys for CSV export from SubscriberItem
const CSV_HEADERS_SUBSCRIBER = [
    'ID', 'Email', 'Name', 'Status', 'Source', 'Subscribed Date', 'Created At', 'Updated At',
];
type SubscriberCsvItem = {
    id: number;
    email: string;
    name?: string | null;
    status: SubscriberStatus;
    source?: string | null;
    subscribedDate: string; // Formatted date string
    createdAt: string; // Formatted date string
    updatedAt: string; // Formatted date string
};

function exportToCsvSubscriber(filename: string, rows: SubscriberItem[], rawApiData: ApiSubscriberItem[]) { // Also accept raw API data for fields not in mapped type
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }

    // Use mapped data for UI-derived fields (like status, subscribedDate) and raw data for others
    const transformedRows: SubscriberCsvItem[] = rows.map(mappedItem => {
        // Find the corresponding raw API item to include additional fields like raw created_at/updated_at
        const rawItem = rawApiData.find(apiItem => apiItem.id === mappedItem.id);

        return {
            id: mappedItem.id,
            email: mappedItem.email,
            name: mappedItem.name,
            status: mappedItem.status, // Use mapped status
            source: mappedItem.source, // Use mapped source
            subscribedDate: dayjs(mappedItem.subscribedDate).format('YYYY-MM-DD HH:mm:ss'), // Formatted mapped date
            createdAt: rawItem?.created_at ? dayjs(rawItem.created_at).format('YYYY-MM-DD HH:mm:ss') : '', // Use raw date, format
            updatedAt: rawItem?.updated_at ? dayjs(rawItem.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '', // Use raw date, format
        };
    });

    const csvKeys: (keyof SubscriberCsvItem)[] = [
        'id', 'email', 'name', 'status', 'source', 'subscribedDate', 'createdAt', 'updatedAt'
    ];

    const separator = ',';
    const csvContent =
        CSV_HEADERS_SUBSCRIBER.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return csvKeys.map((k) => {
                    let cell = row[k];
                    if (cell === null || cell === undefined) cell = ''; // Replace null/undefined with empty string
                    else cell = String(cell).replace(/"/g, '""'); // Escape double quotes
                    if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; // Wrap cells containing special characters
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for UTF-8
    const link = document.createElement('a');
    if (link.download !== undefined) { // Check for download attribute support
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Your browser does not support this feature.</Notification>);
    return false;
}


// --- SubscriberSearch Component ---
type SubscriberSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const SubscriberSearch = React.forwardRef<
    HTMLInputElement,
    SubscriberSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            className="w-full"
            placeholder="Search subscribers (Email, Name, Status, Source)..." // Updated placeholder
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
SubscriberSearch.displayName = 'SubscriberSearch'
// --- End SubscriberSearch ---

// --- SubscriberFilter Component (Manages Filter Drawer Logic) ---
const SubscriberFilter = ({
    filterData, // Current applied filters
    setFilterData, // Handler to update applied filters in parent
    availableStatuses, // Options for status filter (derived from data)
    availableSources, // Options for source filter (derived from data)
}: {
    filterData: FilterFormSchema;
    setFilterData: (data: FilterFormSchema) => void;
    availableStatuses: { value: string; label: string }[];
    availableSources: { value: string; label: string }[];
}) => {

    // State to control filter drawer visibility
    const [isFilterDrawerOpen , setIsFilterDrawerOpen] = useState<boolean>(false);

    // React Hook Form methods for the filter form
    const methods  = useForm<FilterFormSchema>({
        resolver: zodResolver(filterValidationSchema), // Use the filter schema
        defaultValues: filterData, // Initialize form with current filter data
    });
    const { control, handleSubmit, reset } = methods; // Destructure methods

    // Handlers for filter drawer
    const openFilterDrawer = useCallback(()=> {
        reset(filterData); // Reset form to current filter data when opening
        setIsFilterDrawerOpen(true);
    }, [reset, filterData]); // Depend on reset and filterData

    const closeFilterDrawer = useCallback(()=> setIsFilterDrawerOpen(false), []); // No dependencies

    // Handles form submission
    const onApplyFiltersSubmit = useCallback(async (data: FilterFormSchema)=>{
        console.log("Applying filters:", data);
        setFilterData(data); // Update the applied filters state in the parent
        closeFilterDrawer(); // Close the drawer
    }, [setFilterData, closeFilterDrawer]); // Depend on parent handler and close handler

    // Handles clearing the filters
     const onClearFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({}); // Get default empty filters from schema
        reset(defaultFilters); // Reset form to defaults
        setFilterData(defaultFilters); // Clear the applied filters state in the parent
        // Note: Drawer usually stays open, user clicks Apply or Cancel
     }, [reset, setFilterData]); // Depend on reset and parent handler


    return (
        <>
            {/* Button to open the filter drawer */}
            <Button icon={<TbFilter />} className="relative" onClick={openFilterDrawer}>
                <span>Filter</span>{' '}
            </Button>

            {/* Filter Drawer */}
            <Drawer
                title="Filter Subscribers" // Updated title
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" type='button' onClick={onClearFilters}> {/* Type="button" to prevent form submission */}
                            Clear
                        </Button>
                        <Button size="sm" variant="solid" type='submit' form="filterSubscriberForm"> {/* Link to the form below */}
                            Apply
                        </Button>
                    </div>
                }
            >
                {/* Filter Form */}
                <Form id="filterSubscriberForm" onSubmit={handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 h-full"> {/* Use methods.handleSubmit */}
                    <div className="flex-grow overflow-y-auto"> {/* Allow form content to scroll */}
                        <FormItem label="Status">
                            <Controller
                                name='filterStatuses' // Matches Zod schema field name
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Status"
                                            isMulti={true}
                                            options={availableStatuses} // Use options derived from data
                                            value={field.value} // Controlled value
                                            onChange={(options)=>{
                                                // Store the selected options directly (value and label)
                                                field.onChange(options || [])
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label="Source">
                            <Controller
                                name='filterSources' // Matches Zod schema field name
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Source"
                                            isMulti={true}
                                            options={availableSources} // Use options derived from data
                                            value={field.value} // Controlled value
                                            onChange={(options)=>{
                                                // Store the selected options directly (value and label)
                                                field.onChange(options || [])
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label='Subscribed Date Range'> {/* Updated label */}
                            <Controller
                                control={control}
                                name='dateRange' // Matches Zod schema field name
                                render={({field})=>(
                                    <DatePicker.DatePickerRange
                                        placeholder="Select date range"
                                        // Value should be [Date | null, Date | null] or null
                                        value={field.value as [Date | null, Date | null] | null | undefined} // Cast for type safety
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </FormItem>
                        {/* Add other filter items here if needed */}
                    </div>
                </Form>
            </Drawer>
        </>
    )
}
// --- End SubscriberFilter ---


// --- SubscriberTableTools Component ---
// Contains Search input, Filter button, Import button, and Export button
const SubscriberTableTools = ({
    onSearchChange, // Handler for search input changes
    filterData, // Current applied filters (for filter button to open with)
    setFilterData, // Handler to update applied filters (passed to SubscriberFilter)
    allSubscribers, // All currently filtered/sorted data (for export)
    rawApiSubscribers, // Raw API data (needed for CSV export of original dates)
    availableStatuses, // Options for filter (derived from data)
    availableSources, // Options for filter (derived from data)
    onImportClick, // Handler to open import dialog
}: {
    onSearchChange: (query: string) => void;
    filterData: FilterFormSchema;
    setFilterData: (data: FilterFormSchema) => void;
    allSubscribers: SubscriberItem[];
    rawApiSubscribers: ApiSubscriberItem[];
    availableStatuses: { value: string; label: string }[];
    availableSources: { value: string; label: string }[];
    onImportClick: () => void;
}) => {

    // Callback to trigger export using the helper function
    const handleExport = useCallback(() => {
        // Use allFilteredAndSortedData (passed as allSubscribers) for export
        const success = exportToCsvSubscriber('subscribers_export.csv', allSubscribers, rawApiSubscribers);
        if (success) {
            // Toast already handled by exportToCsvSubscriber
        }
    }, [allSubscribers, rawApiSubscribers]); // Depend on the data to export


    return (
        // Use flex row, align items vertically, add gap
        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
            {/* Search takes most space */}
            <div className="flex-grow">
                <SubscriberSearch onInputChange={onSearchChange} /> {/* Use SubscriberSearch */}
            </div>
            {/* Filter button and Export/Import buttons grouped */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
                {/* Filter Component */}
                <SubscriberFilter
                    filterData={filterData} // Pass current applied filters
                    setFilterData={setFilterData} // Pass handler to update filters
                    availableStatuses={availableStatuses} // Pass filter options
                    availableSources={availableSources} // Pass filter options
                />
                {/* Import Button */}
                 <Button icon={<TbCloudDownload />} onClick={onImportClick} className="w-full sm:w-auto">Import</Button>
                {/* Export Button (using custom function) */}
                <Button icon={<TbCloudUpload />} onClick={handleExport} className="w-full sm:w-auto"> Export </Button>
            </div>
        </div>
    )
}
// --- End SubscriberTableTools ---

// --- ActiveFiltersDisplay Component ---
// Displays currently applied filters as Tags
const ActiveFiltersDisplay = ({
    filterData, // Current applied filters
    onRemoveFilter, // Handler to remove a single filter
    onClearAll, // Handler to clear all filters
    availableStatuses, // Options needed to display status labels
    availableSources, // Options needed to display source labels
}: {
    filterData: FilterFormSchema;
    onRemoveFilter: (key: keyof FilterFormSchema, valueToRemove?: any) => void; // valueToRemove needed for array filters
    onClearAll: () => void;
    availableStatuses: { value: string; label: string }[];
    availableSources: { value: string; label: string }[];
}) => {
    // Check if any filters are active
    const hasDateRange = filterData.dateRange && (filterData.dateRange[0] || filterData.dateRange[1]);
    const hasStatuses = filterData.filterStatuses && filterData.filterStatuses.length > 0;
    const hasSources = filterData.filterSources && filterData.filterSources.length > 0;

    const hasActiveFilters = hasDateRange || hasStatuses || hasSources;

    if (!hasActiveFilters) return null; // Don't render if no filters active

    // Helper to format date for display
    const formatDate = (date: Date | null) => (date ? dayjs(date).format('YYYY-MM-DD') : 'Any Date');

    // Helper to get label from options
    const getLabel = (value: string, options: { value: string; label: string }[]) => {
        const option = options.find(opt => opt.value === value);
        return option ? option.label : value; // Fallback to value if label not found
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>

            {/* Display Date Range Filter */}
            {hasDateRange && (
                <Tag prefix={<TbCalendar />} className="..."> {/* Use calendar icon? */}
                    Date: {formatDate(filterData.dateRange![0])} to {formatDate(filterData.dateRange![1])}{' '}
                    <TbX
                        className="ml-1 cursor-pointer"
                        onClick={() => onRemoveFilter('dateRange')} // Removing the whole range
                    />{' '}
                </Tag>
            )}

            {/* Display Status Filters */}
            {filterData.filterStatuses?.map((statusFilter, index) => (
                <Tag key={`status-${index}`} prefix={<TbUserCheck />} className={`${statusColor[statusFilter.value]}`}> {/* Use user icon? */}
                     Status: {getLabel(statusFilter.value, availableStatuses)}{' '}
                    <TbX
                        className="ml-1 cursor-pointer"
                        onClick={() => onRemoveFilter('filterStatuses', statusFilter.value)} // Remove specific status value
                    />{' '}
                </Tag>
            ))}

            {/* Display Source Filters */}
             {filterData.filterSources?.map((sourceFilter, index) => (
                 <Tag key={`source-${index}`} prefix={<TbMail />} className="..."> {/* Use mail icon? */}
                      Source: {getLabel(sourceFilter.value, availableSources)}{' '}
                     <TbX
                         className="ml-1 cursor-pointer"
                         onClick={() => onRemoveFilter('filterSources', sourceFilter.value)} // Remove specific source value
                     />{' '}
                 </Tag>
             ))}


            {/* Clear All Button */}
            <Button
                size="xs"
                variant="plain"
                className="text-red-600 hover:text-red-500 hover:underline ml-auto"
                onClick={onClearAll} // Handler to clear all filters
            >
                Clear All
            </Button>
        </div>
    );
};
// --- End ActiveFiltersDisplay ---


// --- SubscriberTable Component ---
// Wrapper for DataTable, configured for Subscribers data (no selection)
type SubscriberTableProps = {
    columns: ColumnDef<SubscriberItem>[]; // Use SubscriberItem
    data: SubscriberItem[]; // Use SubscriberItem
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    // Removed selectedSubscribers prop as no selection
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    // Removed onRowSelect, onAllRowSelect handlers as no selection
}
const SubscriberTable = ({ columns, data, loading, pagingData, onPaginationChange, onSelectChange, onSort }: SubscriberTableProps) => (
    <DataTable
        // Selection is not needed for view-only
        selectable={false} // Explicitly disable selectable
        columns={columns}
        data={data}
        loading={loading}
        pagingData={pagingData}
        // Removed checkboxChecked prop
        onPaginationChange={onPaginationChange}
        onSelectChange={onSelectChange}
        onSort={onSort}
        noData={!loading && data.length === 0} // Display "No Data" when not loading and data is empty
        // Removed onCheckBoxChange, onIndeterminateCheckBoxChange handlers
    />
);
// --- End SubscriberTable ---

// --- Main SubscribersListing Component ---
const SubscribersListing = () => { // Renamed Component
    // Removed useNavigate as Add/Edit/Clone navigation is not implemented/needed

    const dispatch = useAppDispatch();

    // Redux State: Fetched subscriber data and loading status
    // **Ensure these match your actual Redux state shape and selector names**
    const { subscriberData = [], status: dataLoadingStatus = 'idle' } = useSelector(masterSelector);


    // --- Local Component State ---

    // State for DataTable: pagination, sort, and quick search query
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: 'subscribedDate' }, // Default sort by date
        query: '', // Quick search query
    });

    // State for Filter Drawer UI: controls whether the drawer is open
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false); // Keeping this state, managed by SubscriberFilter now

    // State for Filters: holds the currently applied filters from the drawer form
    // Initialize with default values from Zod schema
    const [filterCriteria, setFilterCriteria] = useState<FilterFormSchema>(
         filterValidationSchema.parse({}) // Use Zod's parse for defaults
    );

    // State for Import Dialog UI
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    // State for loading status (combining Redux loading and local submitting/deleting - but submitting/deleting are removed)
    const [isLoading, setIsLoading] = useState(false); // Can just rely on Redux status now


    // --- Effects ---

    // Effect to fetch Subscriber data from Redux middleware when the component mounts
    useEffect(() => {
        // Dispatch the action to fetch subscriber data
        dispatch(getSubscribersAction());
        // The effect runs once on mount because the dependency array `[dispatch]` is stable.
    }, [dispatch]);

    // Sync local isLoading with Redux data loading status
     useEffect(() => {
        setIsLoading(dataLoadingStatus === 'loading');
     }, [dataLoadingStatus]);


    // --- Data Mapping ---
    // Memoized mapping from API data structure to UI-friendly SubscriberItem structure
    const mappedSubscribers = useMemo(() => {
        if (!Array.isArray(subscriberData)) return []; // Ensure source data is an array

        return subscriberData.map((apiItem: ApiSubscriberItem) => {
            // Map API data to UI structure
            return {
                id: apiItem.id, // Use API ID
                email: apiItem.email,
                name: apiItem.name ?? null, // Use API name, handle null/undefined
                subscribedDate: apiItem.created_at ? new Date(apiItem.created_at) : new Date(0), // Map created_at to Date, handle null/invalid
                status: apiItem.status ?? 'Unknown', // Use API status, default to 'Unknown'
                source: apiItem.source ?? null, // Use API source, handle null/undefined
                 // Add other mapped fields if needed
            };
        });
    }, [subscriberData]); // Remap whenever the raw Redux data changes


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
            // No selected items state to clear
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


    // --- Filter Handlers ---
    // Handles applying filters from the filter form submission (called by SubscriberFilter)
    const handleApplyFilter = useCallback((data: FilterFormSchema) => { // Renamed from onApplyFiltersSubmit
         setFilterCriteria(data); // Update the filter criteria state with the data from the form
         handleSetTableData({ pageIndex: 1 }); // Reset table to the first page after applying filters
         // Note: Drawer closing is handled inside SubscriberFilter
     }, [handleSetTableData]); // Dependencies include table handler

    // Handles clearing all filters (called by ActiveFiltersDisplay)
    const handleClearAllFilters = useCallback(() => { // Renamed from onClearFilters
        const defaultFilters = filterValidationSchema.parse({}); // Get default empty filters from schema
        setFilterCriteria(defaultFilters); // Clear the filter state
        handleSetTableData({ pageIndex: 1 }); // Reset table to the first page
        // Note: This doesn't interact with the filter form/drawer methods directly,
        // relying on filterCriteria state change to update the filter UI.
     }, [handleSetTableData]); // Dependencies include table handler

    // Handles removing a single filter tag (called by ActiveFiltersDisplay)
    const handleRemoveFilter = useCallback(
        (key: keyof FilterFormSchema, valueToRemove?: any) => {
            setFilterCriteria((prev) => {
                let newValues: any; // Use any for flexibility with different filter types

                if (key === 'dateRange') {
                     newValues = null; // Removing date range sets it to null
                 } else {
                    // For array filters (statuses, sources)
                    const currentValues = Array.isArray(prev[key]) ? (prev[key] as { value: string; label: string }[]).map(opt => opt.value) : []; // Get current values as array of strings
                    const updatedValues = currentValues.filter((itemValue) => itemValue !== valueToRemove); // Filter out the specific value
                    // Need to reconstruct the { value, label } array based on updatedValues and original options
                    if (key === 'filterStatuses') {
                         newValues = availableStatuses.filter(opt => updatedValues.includes(opt.value));
                    } else if (key === 'filterSources') {
                         newValues = availableSources.filter(opt => updatedValues.includes(opt.value));
                    } else {
                         newValues = undefined; // Or handle other types
                    }
                }

                const updatedFilterData = { ...prev, [key]: newValues };
                console.log("Removing filter", key, valueToRemove, "New criteria:", updatedFilterData);
                handleSetTableData({ pageIndex: 1 }); // Reset table page after removing filter
                 // No selected items state to clear
                return updatedFilterData;
            });
        },
         [handleSetTableData, availableStatuses, availableSources], // Dependencies include table handler and options for reconstructing filter objects
    );


    // --- Data Processing: Filtering, Searching, Sorting, Pagination ---
    // Memoized computation of the data displayed in the table (`pageData`)
    // and the data used for export (`allFilteredAndSortedData`)
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        // Start with the raw mapped data, ensuring it's an array and creating a mutable copy
        let processedData: SubscriberItem[] = cloneDeep(mappedSubscribers); // Use mappedSubscribers

        // --- Apply Filters (using the `filterCriteria` state) ---

        // Filter by Date Range (using `subscribedDate`)
        if (filterCriteria.dateRange && Array.isArray(filterCriteria.dateRange) && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
            const [startDate, endDate] = filterCriteria.dateRange;
             // Create dayjs objects for comparison, setting time to start/end of day for range
            const start = startDate ? dayjs(startDate).startOf('day') : null;
            const end = endDate ? dayjs(endDate).endOf('day') : null;

            processedData = processedData.filter(item => {
                const itemDate = item.subscribedDate ? dayjs(item.subscribedDate) : null;
                if (!itemDate) return false; // Exclude items without a valid date

                if (start && end) {
                    // Check if itemDate is within the inclusive range [start, end]
                    return itemDate.isBetween(start, end, null, '[]');
                } else if (start) {
                     // If only start date selected, filter for that specific day
                     return itemDate.isSame(start, 'day');
                } else if (end) {
                     // If only end date selected, filter for that specific day
                     return itemDate.isSame(end, 'day');
                }
                // Should not reach here if startDate or endDate is non-null
                return true;
            });
        }

        // Filter by Statuses
         if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) {
            const selectedStatusValues = new Set(filterCriteria.filterStatuses.map(opt => opt.value.toLowerCase()));
            processedData = processedData.filter(item => item.status && selectedStatusValues.has(item.status.trim().toLowerCase()));
         }

        // Filter by Sources
         if (filterCriteria.filterSources && filterCriteria.filterSources.length > 0) {
             const selectedSourceValues = new Set(filterCriteria.filterSources.map(opt => opt.value.toLowerCase()));
             processedData = processedData.filter(item => item.source && selectedSourceValues.has(item.source.trim().toLowerCase()));
         }


        // --- Apply Quick Search (using the `tableData.query` state) ---
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            // Filter data rows that match the query in any of the relevant string fields
            processedData = processedData.filter(item =>
                String(item.id ?? '').toLowerCase().includes(query) || // Search ID (converted to string, handle null/undefined)
                item.email.toLowerCase().includes(query) || // Search email
                (item.name?.toLowerCase().includes(query) ?? false) || // Search name (handle null/undefined)
                (item.status?.toLowerCase().includes(query) ?? false) || // Search status (handle null/undefined)
                (item.source?.toLowerCase().includes(query) ?? false) // Search source (handle null/undefined)
            );
        }

        // --- Apply Sorting (using the `tableData.sort` state) ---
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            const sortedData = [...processedData]; // Create a copy to sort
            sortedData.sort((a, b) => {
                let aValue: any = (a as any)[key]; // Use any for flexible access
                let bValue: any = (b as any)[key];

                // Handle Date sorting ('subscribedDate')
                if (key === 'subscribedDate') {
                    const dateA = aValue ? aValue.getTime() : (order === 'asc' ? -Infinity : Infinity); // Use Date object's getTime(), handle null/invalid
                    const dateB = bValue ? bValue.getTime() : (order === 'asc' ? -Infinity : Infinity);

                     if (isNaN(dateA) && isNaN(dateB)) return 0;
                     if (isNaN(dateA)) return order === 'asc' ? -1 : 1;
                     if (isNaN(dateB)) return order === 'asc' ? 1 : -1;

                    return order === 'asc' ? dateA - dateB : dateB - dateA; // Numeric comparison
                }

                 // Handle Numerical sorting ('id')
                 if (key === 'id') {
                      const numA = typeof aValue === 'number' ? aValue : (aValue ? Number(aValue) : (order === 'asc' ? -Infinity : Infinity)); // Convert to number, handle null/invalid
                      const numB = typeof bValue === 'number' ? bValue : (bValue ? Number(bValue) : (order === 'asc' ? -Infinity : Infinity));

                       if (isNaN(numA) && isNaN(numB)) return 0;
                       if (isNaN(numA)) return order === 'asc' ? -1 : 1;
                       if (isNaN(numB)) return order === 'asc' ? 1 : -1;

                      return order === 'asc' ? numA - numB : numB - numA; // Numeric comparison
                 }

                // Default string comparison for other keys (email, name, status, source)
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
    }, [mappedSubscribers, tableData.query, tableData.sort, filterCriteria, tableData.pageIndex, tableData.pageSize]); // Dependencies: Recalculate when raw mapped data, table state (query, sort, page/size), or filter criteria change


    // --- Row Selection Handlers ---
    // Removed Row Selection State and Handlers as selection is not needed


    // --- Export/Import Handlers ---
    // Handles opening the import dialog
    const handleImportData = useCallback(() => {
        // **Implement actual import logic**
        setImportDialogOpen(true); // Open import dialog
        console.log("Subscriber import functionality triggered."); // Log action
    }, []); // No dependencies

    // Handler for file selection in the import dialog
    const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            console.log("File selected for Subscriber import:", file.name);
            // **Here you would typically dispatch a Redux action to handle the file upload and import process**
            // Example dispatch:
            // dispatch(importSubscribersAction(file));

            // Depending on your import process (e.g., takes time, requires confirmation, async upload),
            // you might keep the dialog open, show a progress indicator, or close it immediately.
            // For this placeholder, we just close it and show a toast.
            setImportDialogOpen(false); // Close dialog after selection (or on success)
            toast.push(<Notification title="Import Initiated" type="info">Subscriber import process started. Check notifications for status.</Notification>); // Inform the user
        }
        // Clear the file input value so selecting the same file again triggers the change event
        event.target.value = ''; // This is important for subsequent imports of the same file name
    }, [dispatch /* Add import action if needed */]); // Dependencies may include dispatch and actions


    // --- Generate Dynamic Filter Options ---
    // Memoized generation of options for the Select components in the filter drawer
    // Options are derived from the unique values present in the fetched data (`mappedSubscribers`)

    // Options for filtering Status
    const availableStatuses = useMemo(() => {
        if (!Array.isArray(mappedSubscribers)) return [];
        // Use a Set to get unique status values, filtering out null/undefined
        const uniqueStatuses = new Set(mappedSubscribers.map(sub => sub.status).filter(Boolean));
        // Map unique status strings to { value, label } objects
        return Array.from(uniqueStatuses).map(status => ({ value: status, label: status }));
    }, [mappedSubscribers]); // Regenerate options if mapped data changes

     // Options for filtering Source
     const availableSources = useMemo(() => {
        if (!Array.isArray(mappedSubscribers)) return [];
        // Use a Set to get unique source values, filtering out null/undefined
        const uniqueSources = new Set(mappedSubscribers.map(sub => sub.source).filter(Boolean));
        // Map unique source strings to { value, label } objects
        return Array.from(uniqueSources).map(source => ({ value: source, label: source }));
     }, [mappedSubscribers]); // Regenerate options if mapped data changes


    // --- Define DataTable Columns ---
    // Memoized column definitions
    const columns: ColumnDef<SubscriberItem>[] = useMemo(
        () => [ // Use SubscriberItem type
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 }, // Use number id from mapped data
            { header: 'Name', accessorKey: 'name', enableSorting: true, size:120, cell: props => props.row.original.name ?? '-' }, // Display name or dash
            { header: 'Email', accessorKey: 'email', enableSorting: true, size: 200, meta: {HeaderClass :'text-left'}, cell: props => props.row.original.email ?? '-' }, // Display email or dash
            { header: 'Source', accessorKey: 'source', enableSorting: true, size: 90, cell: props => props.row.original.source ?? '-' }, // Display source or dash
            {
                header: 'Status',
                accessorKey: 'status', // Use 'status' for sort/accessor
                enableSorting: true,
                size:120,
                cell: (props) => {
                    const { status } = props.row.original; // Use mapped UI status
                     // Use Tag component with dynamic color based on status
                    const colorClass = statusColor[status] || 'bg-gray-200 text-gray-800 dark:bg-gray-500/20 dark:text-gray-100'; // Fallback color
                    return (
                        <div className="flex items-center">
                            <Tag className={`${colorClass} capitalize font-semibold border-0`}>
                                <span className="capitalize">{status || '-'}</span> {/* Display status or dash */}
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Subscribed Date', // Updated label
                accessorKey: 'subscribedDate', // Use mapped Date object for sorting
                enableSorting: true,
                meta: {HeaderClass :'text-right'}, // Align header right
                cell: (props) => {
                    const date = props.row.original.subscribedDate; // Use Date object
                     return (
                         <span className='text-right block'> {/* Align cell content right */}
                             {date instanceof Date && !isNaN(date.getTime()) // Check if it's a valid Date object
                                 ? `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                 : '-'} {/* Display formatted date or dash */}
                         </span>
                     )
                },
            },
            // Removed the Action column entirely as requested (no Edit/Delete/View/Clone)
        ],
        [], // Dependencies: Columns structure is static, no need to re-create unless the rendering logic itself changes (like handleDelete, which is now removed from cell)
    )
    // --- End Define Columns ---


    // Determine overall loading status for the table (Redux status)
    const tableLoading = isLoading; // Directly use the local isLoading state synced with Redux status


    // Removed Add/Edit/Delete/Bulk Action Handlers and related states/dialogs/drawers


    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    {/* Header Section */}
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Subscribers</h5> {/* Updated title */}
                        {/* Removed Add New Button */}
                    </div>

                    {/* Tools Section (Search, Filter, Import, Export) */}
                    <div className="mb-2">
                         <SubscriberTableTools // Use SubscriberTableTools component
                            onSearchChange={handleSearchChange} // Pass search handler
                            filterData={filterCriteria} // Pass current filter state to Filter component
                            setFilterData={handleApplyFilter} // Pass handler to update filter state
                            allSubscribers={allFilteredAndSortedData} // Pass filtered/sorted data for export
                            rawApiSubscribers={subscriberData} // Pass raw data for export helper
                            availableStatuses={availableStatuses} // Pass filter options
                            availableSources={availableSources} // Pass filter options
                            onImportClick={handleImportData} // Pass handler to trigger import dialog
                        />
                    </div>

                    {/* Active Filters Display Area */}
                    {/* Render ActiveFiltersDisplay if needed */}
                     <ActiveFiltersDisplay
                        filterData={filterCriteria}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                         availableStatuses={availableStatuses} // Pass options for displaying labels
                         availableSources={availableSources} // Pass options for displaying labels
                    />

                    {/* Table */}
                    <div className="flex-grow overflow-auto"> {/* Allows the table body to scroll */}
                        <SubscriberTable // Use SubscriberTable component (no selection)
                            columns={columns} // Pass column definitions (no Action column)
                            data={pageData} // Pass paginated data for the current page
                            loading={tableLoading} // Pass Redux loading status
                            pagingData={{ // Pass pagination metadata
                                total, // Total count after filtering/searching
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            // Removed selectedItems prop
                            onPaginationChange={handlePaginationChange} // Pass pagination handler
                            onSelectChange={handleSelectChange} // Pass page size change handler
                            onSort={handleSort} // Pass sort handler
                             // Removed selection handlers
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            {/* Removed Selected Actions Footer */}
            {/* Removed Add Drawer */}
            {/* Removed Edit Drawer */}
            {/* Removed Filter Drawer (Logic moved inside SubscriberFilter) */}
            {/* Removed Single Delete Confirmation Dialog */}

             {/* Basic Import Dialog Placeholder */}
            <Dialog isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} title="Import Subscribers"> {/* Updated title */}
                <div className="p-4">
                    <p>Upload a CSV file to import Subscribers.</p> {/* Updated text */}
                    <FormItem label="CSV File">
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

export default SubscribersListing; // Export the component

// Helper function for classNames (kept as it's used in Tag component classNames)
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' '); }