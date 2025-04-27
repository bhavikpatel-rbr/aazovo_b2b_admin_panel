// src/views/your-path/ChangeLogListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';
import classNames from 'classnames';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ZodType } from 'zod';

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
import ConfirmDialog from '@/components/shared/ConfirmDialog'; // Keep if delete needed
import StickyFooter from '@/components/shared/StickyFooter'; // Keep if bulk delete needed
import DebouceInput from '@/components/shared/DebouceInput';
import Checkbox from '@/components/ui/Checkbox';
import { Form, FormItem as UiFormItem } from '@/components/ui/Form';
import Badge from '@/components/ui/Badge';
import DatePicker from '@/components/ui/DatePicker'; // For date range filter
import { HiOutlineCalendar } from 'react-icons/hi'; // For date picker
import { TbHistory, TbFilter, TbX, TbUserCircle, TbListDetails } from 'react-icons/tb'; // Icons

// Icons
import {
    // TbPencil, // Edit might not apply to logs
    // TbTrash, // Delete might be restricted
    TbEye,   // View Details
    TbChecks, // Selected Footer (if selectable)
    TbSearch,
    TbCloudDownload,
    // TbPlus, // Adding logs is usually automatic
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Define Item Type ---
type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SYSTEM' | 'OTHER';
type EntityType = 'User' | 'Product' | 'Order' | 'Setting' | 'Role' | 'Permission' | 'System' | 'Other';

export type ChangeLogItem = {
    id: string; // Unique Log ID
    timestamp: Date;
    userName: string; // User who performed the action (or 'System')
    userId: string | null; // ID of the user
    actionType: ChangeType;
    entityType: EntityType;
    entityId: string | null; // ID of the entity affected (e.g., product ID, user ID)
    description: string; // Summary of the change (e.g., "Updated product price", "User logged in")
    details?: Record<string, unknown> | string | null; // Optional structured details (e.g., old/new values) or raw string
};
// --- End Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    actionType: z.array(z.string()).default([]),
    entityType: z.array(z.string()).default([]),
    userName: z.array(z.string()).default([]), // Allow filtering by specific users
    dateRange: z.tuple([z.date().nullable(), z.date().nullable()]).default([null, null]), // Date range
});

type FilterFormSchema = z.infer<typeof filterValidationSchema>;
// --- End Filter Schema ---


// --- Constants ---
// Colors for change types
const changeTypeColor: Record<ChangeType, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
    LOGIN: 'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-100',
    LOGOUT: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
    SYSTEM: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100',
    OTHER: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
};

const initialDummyChangeLogs: ChangeLogItem[] = [
    { id: 'CL001', timestamp: new Date(2023, 10, 6, 14, 30, 15), userName: 'Alice Admin', userId: 'U001', actionType: 'UPDATE', entityType: 'Product', entityId: 'PROD002', description: 'Updated product name to "Laptop Pro 15" (2023 Edition)"' },
    { id: 'CL002', timestamp: new Date(2023, 10, 6, 11, 45, 2), userName: 'George Support', userId: 'U007', actionType: 'LOGIN', entityType: 'User', entityId: 'U007', description: 'User logged in successfully' },
    { id: 'CL003', timestamp: new Date(2023, 10, 5, 16, 15, 55), userName: 'Fiona Finance', userId: 'U006', actionType: 'LOGOUT', entityType: 'User', entityId: 'U006', description: 'User logged out' },
    { id: 'CL004', timestamp: new Date(2023, 10, 5, 10, 0, 0), userName: 'System', userId: null, actionType: 'SYSTEM', entityType: 'System', entityId: null, description: 'Nightly backup process completed successfully.' },
    { id: 'CL005', timestamp: new Date(2023, 10, 4, 9, 0, 10), userName: 'Bob Editor', userId: 'U002', actionType: 'CREATE', entityType: 'Blog', entityId: 'BLOG011', description: 'Created new blog post "Intro to V3 Features"' },
    { id: 'CL006', timestamp: new Date(2023, 10, 3, 10, 5, 30), userName: 'Admin User', userId: 'admin01', actionType: 'DELETE', entityType: 'User', entityId: 'U009-temp', description: 'Deleted temporary user account "temp-user".' },
    { id: 'CL007', timestamp: new Date(2023, 10, 2, 11, 0, 0), userName: 'Alice Admin', userId: 'U001', actionType: 'UPDATE', entityType: 'Role', entityId: 'editor', description: 'Updated permissions for role "Content Editor".', details: { added: ['publish:immediate'], removed: ['delete:any'] } },
    { id: 'CL008', timestamp: new Date(2023, 10, 1, 8, 0, 45), userName: 'System', userId: null, actionType: 'OTHER', entityType: 'System', entityId: 'CRON-JOB-1', description: 'Data synchronization job finished.' },
];

// Extract unique filter options
const uniqueActionTypes = Array.from(new Set(initialDummyChangeLogs.map(t => t.actionType))).sort();
const uniqueEntityTypes = Array.from(new Set(initialDummyChangeLogs.map(t => t.entityType))).sort();
const uniqueUserNames = Array.from(new Set(initialDummyChangeLogs.map(t => t.userName))).sort();
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({ onViewDetails }: { onViewDetails: () => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-end gap-2">
            <Tooltip title="View Details"><div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400' )} role="button" onClick={onViewDetails}><TbEye /></div></Tooltip>
            {/* Edit/Delete usually not applicable for logs */}
        </div>
    );
};
// --- End ActionColumn ---


// --- ChangeLogTable Component ---
const ChangeLogTable = ({ columns, data, loading, pagingData, onPaginationChange, onSelectChange, onSort}: { columns: ColumnDef<ChangeLogItem>[]; data: ChangeLogItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; }) => {
     // Note: Selectable might not be needed for logs
     return <DataTable columns={columns} data={data} loading={loading} pagingData={pagingData}
                      onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
                      noData={!loading && data.length === 0} />;
};
// --- End ChangeLogTable ---


// --- ChangeLogSearch Component ---
type ChangeLogSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ChangeLogSearch = React.forwardRef<HTMLInputElement, ChangeLogSearchProps>(({ onInputChange }, ref) => {
    return <DebouceInput ref={ref} placeholder="Search Logs (User, Action, Entity, Desc...)" suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />;
});
ChangeLogSearch.displayName = 'ChangeLogSearch';
// --- End ChangeLogSearch ---


// --- ChangeLogFilter Component ---
const ChangeLogFilter = ({ filterData, setFilterData }: { filterData: FilterFormSchema; setFilterData: (data: FilterFormSchema) => void; }) => {
    const [dialogIsOpen, setIsOpen] = useState(false);
    const openDialog = () => setIsOpen(true);
    const onDialogClose = () => setIsOpen(false);
    const { control, handleSubmit, reset, watch } = useForm<FilterFormSchema>({ defaultValues: filterData, resolver: zodResolver(filterValidationSchema), });
    const dateRange = watch('dateRange'); // Watch date range for DatePicker

    React.useEffect(() => { reset(filterData); }, [filterData, reset]);

    const onSubmit = (values: FilterFormSchema) => { setFilterData(values); onDialogClose(); };
    const handleReset = () => { const defaultVals = filterValidationSchema.parse({}); reset(defaultVals); setFilterData(defaultVals); onDialogClose(); };
    const activeFilterCount = (filterData.actionType?.length || 0) + (filterData.entityType?.length || 0) + (filterData.userName?.length || 0) + (filterData.dateRange?.[0] || filterData.dateRange?.[1] ? 1 : 0);

    return (
        <>
            <Button icon={<TbFilter />} onClick={openDialog} className="relative">
                <span>Filter</span> {activeFilterCount > 0 && ( <Badge content={activeFilterCount} className="absolute -top-2 -right-2" innerClass="text-xs"/> )}
            </Button>
            <Dialog isOpen={dialogIsOpen} onClose={onDialogClose} onRequestClose={onDialogClose} width={600}>
                <h4 className="mb-4">Filter Change Logs</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <UiFormItem label="Action Type" className="mb-4">
                            <Controller name="actionType" control={control} render={({ field }) => ( <Checkbox.Group vertical value={field.value || []} onChange={field.onChange} > {uniqueActionTypes.map((type) => ( <Checkbox key={type} value={type} className="mb-1 capitalize">{type}</Checkbox> ))} </Checkbox.Group> )} />
                        </UiFormItem>
                        <UiFormItem label="Entity Type" className="mb-4">
                             <Controller name="entityType" control={control} render={({ field }) => ( <Checkbox.Group vertical value={field.value || []} onChange={field.onChange} > {uniqueEntityTypes.map((type) => ( <Checkbox key={type} value={type} className="mb-1">{type}</Checkbox> ))} </Checkbox.Group> )} />
                        </UiFormItem>
                         <UiFormItem label="User Name" className="mb-4">
                             <Controller name="userName" control={control} render={({ field }) => ( <Checkbox.Group vertical value={field.value || []} onChange={field.onChange} > {uniqueUserNames.map((user) => ( <Checkbox key={user} value={user} className="mb-1">{user}</Checkbox> ))} </Checkbox.Group> )} />
                        </UiFormItem>
                         <UiFormItem label="Date Range" className="mb-4">
                            <Controller name="dateRange" control={control} render={({ field }) => (
                                 <DatePicker.RangePicker
                                     placeholder="Select date range"
                                     value={field.value}
                                     onChange={field.onChange} // DatePicker range usually provides [Date | null, Date | null]
                                     inputFormat="YYYY-MM-DD"
                                     inputPrefix={<HiOutlineCalendar className="text-lg"/>}
                                 />
                            )} />
                         </UiFormItem>
                    </div>
                    <div className="flex justify-end items-center gap-2 mt-6">
                        <Button type="button" onClick={handleReset}> Reset </Button>
                        <Button type="submit" variant="solid"> Apply Filters </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    );
};
// --- End ChangeLogFilter ---


// --- ChangeLogTableTools Component ---
const ChangeLogTableTools = ({ onSearchChange, filterData, setFilterData }: { onSearchChange: (query: string) => void; filterData: FilterFormSchema; setFilterData: (data: FilterFormSchema) => void; }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
            <div className="flex-grow"><ChangeLogSearch onInputChange={onSearchChange} /></div>
            <div className="flex-shrink-0"><ChangeLogFilter filterData={filterData} setFilterData={setFilterData} /></div>
        </div>
    );
};
// --- End ChangeLogTableTools ---


// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormSchema; onRemoveFilter: (key: keyof FilterFormSchema, value: string | [Date | null, Date | null]) => void; onClearAll: () => void; }) => {
    const activeActions = filterData.actionType || [];
    const activeEntities = filterData.entityType || [];
    const activeUsers = filterData.userName || [];
    const activeDateRange = filterData.dateRange || [null, null];
    const hasDateRange = activeDateRange[0] || activeDateRange[1];
    const hasActiveFilters = activeActions.length > 0 || activeEntities.length > 0 || activeUsers.length > 0 || hasDateRange;

    if (!hasActiveFilters) return null;

    const formatDate = (date: Date | null) => date ? date.toLocaleDateString() : '';

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeActions.map((action) => ( <Tag key={`action-${action}`} prefix className="bg-gray-100 ..."> <span className="capitalize">{action}</span> <TbX className="ml-1 ..." onClick={() => onRemoveFilter('actionType', action)} /> </Tag> ))}
            {activeEntities.map((entity) => ( <Tag key={`entity-${entity}`} prefix className="bg-gray-100 ..."> {entity} <TbX className="ml-1 ..." onClick={() => onRemoveFilter('entityType', entity)} /> </Tag> ))}
            {activeUsers.map((user) => ( <Tag key={`user-${user}`} prefix className="bg-gray-100 ..."> {user} <TbX className="ml-1 ..." onClick={() => onRemoveFilter('userName', user)} /> </Tag> ))}
             {hasDateRange && (
                 <Tag prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
                     Date: {formatDate(activeDateRange[0])} - {formatDate(activeDateRange[1])}
                     <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('dateRange', [null, null])} /> {/* Remove date range */}
                 </Tag>
             )}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}> Clear All </Button>
        </div>
    );
};
// --- End ActiveFiltersDisplay ---


// --- ChangeLogActionTools Component (No Add Button) ---
const ChangeLogActionTools = ({ allLogs }: { allLogs: ChangeLogItem[] }) => {
    const csvData = useMemo(() => allLogs.map(l => ({ ...l, timestamp: l.timestamp.toISOString(), details: JSON.stringify(l.details) })), [allLogs]);
    const csvHeaders = [ /* ... headers ... */ ];
    return ( <div className="flex flex-col md:flex-row gap-3"> {/* <CSVLink ...><Button>Download</Button></CSVLink> */} </div> ); // No Add button typically
};
// --- End ChangeLogActionTools ---


// --- ChangeLogSelected Component (Removed - selection usually not needed) ---


// --- Detail View Dialog ---
const DetailViewDialog = ({ isOpen, onClose, logItem }: { isOpen: boolean; onClose: () => void; logItem: ChangeLogItem | null }) => {
    if (!logItem) return null;
    const formatDate = (date: Date) => date.toLocaleString();
    const formatDetails = (details: any) => {
        if (!details) return 'N/A';
        if (typeof details === 'string') return details;
        // Pretty print JSON object
        try { return JSON.stringify(details, null, 2); } catch { return String(details); }
    };
     return (
         <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={700}>
             <h5 className="mb-4">Log Details (ID: {logItem.id})</h5>
             <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong>Timestamp:</strong> {formatDate(logItem.timestamp)}</p>
                <p><strong>User:</strong> {logItem.userName} {logItem.userId ? `(${logItem.userId})` : '(System)'}</p>
                <p><strong>Action Type:</strong> <Tag className={`${changeTypeColor[logItem.actionType]} font-semibold border ${changeTypeColor[logItem.actionType].replace('bg-','border-').replace('/20','')} capitalize`}>{logItem.actionType}</Tag></p>
                <p><strong>Entity Type:</strong> {logItem.entityType}</p>
                <p><strong>Entity ID:</strong> {logItem.entityId ?? 'N/A'}</p>
             </div>
              <div className='mt-4'>
                 <h6 className="mb-2 font-semibold">Description:</h6>
                 <p>{logItem.description}</p>
             </div>
             <div className='mt-4'>
                 <h6 className="mb-2 font-semibold">Details / Changes:</h6>
                 <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-md max-h-60 overflow-y-auto whitespace-pre-wrap">{formatDetails(logItem.details)}</pre>
             </div>
             <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
         </Dialog>
     );
}
// --- End Dialogs ---


// --- Main ChangeLogListing Component ---
const ChangeLogListing = () => {
    const navigate = useNavigate(); // Keep if edit/view actions navigate

    // --- State ---
    const [isLoading, setIsLoading] = useState(false);
    const [changeLogs, setChangeLogs] = useState<ChangeLogItem[]>(initialDummyChangeLogs);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'timestamp' }, query: '' }); // Default sort by time desc
    // const [selectedLogs, setSelectedLogs] = useState<ChangeLogItem[]>([]); // Selection unlikely needed
    const [filterData, setFilterData] = useState<FilterFormSchema>(filterValidationSchema.parse({}));
    const [detailViewOpen, setDetailViewOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ChangeLogItem | null>(null);
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...changeLogs];

        // Apply Filtering
        if (filterData.actionType && filterData.actionType.length > 0) { const set = new Set(filterData.actionType); processedData = processedData.filter(log => set.has(log.actionType)); }
        if (filterData.entityType && filterData.entityType.length > 0) { const set = new Set(filterData.entityType); processedData = processedData.filter(log => set.has(log.entityType)); }
        if (filterData.userName && filterData.userName.length > 0) { const set = new Set(filterData.userName); processedData = processedData.filter(log => set.has(log.userName)); }
        if (filterData.dateRange && (filterData.dateRange[0] || filterData.dateRange[1])) {
             const startDate = filterData.dateRange[0]?.getTime();
             const endDate = filterData.dateRange[1] ? new Date(filterData.dateRange[1].getTime() + 86399999).getTime() : null; // Include full end date
             processedData = processedData.filter(log => {
                 const logTime = log.timestamp.getTime();
                 const startMatch = startDate ? logTime >= startDate : true;
                 const endMatch = endDate ? logTime <= endDate : true;
                 return startMatch && endMatch;
             });
        }


        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase();
            processedData = processedData.filter(log =>
                log.id.toLowerCase().includes(query) ||
                log.userName.toLowerCase().includes(query) ||
                (log.userId?.toLowerCase().includes(query) ?? false) ||
                log.actionType.toLowerCase().includes(query) ||
                log.entityType.toLowerCase().includes(query) ||
                (log.entityId?.toLowerCase().includes(query) ?? false) ||
                log.description.toLowerCase().includes(query)
            );
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                 if (key === 'timestamp') { return order === 'asc' ? a.timestamp.getTime() - b.timestamp.getTime() : b.timestamp.getTime() - a.timestamp.getTime(); }
                 const aValue = a[key as keyof ChangeLogItem] ?? '';
                 const bValue = b[key as keyof ChangeLogItem] ?? '';
                 if (aValue === null && bValue === null) return 0; if (aValue === null) return order === 'asc' ? -1 : 1; if (bValue === null) return order === 'asc' ? 1 : -1;
                 if (typeof aValue === 'string' && typeof bValue === 'string') { return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue); }
                 return 0;
            });
            processedData = sortedData;
        }

        // Apply Pagination
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const dataTotal = processedData.length; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: dataTotal };
    }, [changeLogs, tableData, filterData]);
    // --- End Data Processing ---

    // --- Handlers ---
    const handleSetTableData = useCallback((data: TableQueries) => { setTableData(data); }, []);
    const handlePaginationChange = useCallback((page: number) => { handleSetTableData({ ...tableData, pageIndex: page }); }, [tableData, handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ ...tableData, pageSize: Number(value), pageIndex: 1 }); /* setSelectedLogs([]); */ }, [tableData, handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { handleSetTableData({ ...tableData, query: query, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleApplyFilter = useCallback((newFilterData: FilterFormSchema) => { setFilterData(newFilterData); handleSetTableData({ ...tableData, pageIndex: 1 }); /* setSelectedLogs([]); */ }, [tableData, handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof FilterFormSchema, value: any) => { // value can be string or tuple now
        setFilterData(prev => {
             let newValues: any;
             if (key === 'dateRange') {
                 newValues = [null, null]; // Clear date range
             } else {
                const currentValues = prev[key] || [];
                 newValues = currentValues.filter(item => item !== value);
             }
            const updatedFilterData = { ...prev, [key]: newValues };
            handleSetTableData({ ...tableData, pageIndex: 1 });
            // setSelectedLogs([]);
            return updatedFilterData;
        });
    }, [tableData, handleSetTableData]);
    const handleClearAllFilters = useCallback(() => { const defaultFilters = filterValidationSchema.parse({}); setFilterData(defaultFilters); handleSetTableData({ ...tableData, pageIndex: 1 }); /* setSelectedLogs([]); */ }, [tableData, handleSetTableData]);

    // Row/All Row Select handlers removed

    const handleViewDetails = useCallback((item: ChangeLogItem) => { setCurrentItem(item); setDetailViewOpen(true); }, [setCurrentItem, setDetailViewOpen]);
    const handleCloseDetailView = useCallback(() => { setDetailViewOpen(false); setCurrentItem(null); }, [setCurrentItem, setDetailViewOpen]);

    // Edit/Delete handlers removed
    // --- End Handlers ---


    // --- Define Columns ---
    const columns: ColumnDef<ChangeLogItem>[] = useMemo(
        () => [
            {
                header: 'Timestamp', accessorKey: 'timestamp', enableSorting: true, width: 180,
                cell: props => { const date = props.row.original.timestamp; return <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>; } // Show seconds
            },
             {
                 header: 'User', accessorKey: 'userName', enableSorting: true, width: 180,
                 cell: props => (
                     <div className="flex items-center gap-2">
                         <Avatar size={28} shape="circle" icon={<TbUserCircle />} />
                         <span>{props.row.original.userName}</span>
                         {/* Optionally show userId in tooltip or smaller text */}
                         {/* {props.row.original.userId && <span className="text-xs text-gray-500 ml-1">({props.row.original.userId})</span>} */}
                     </div>
                 )
             },
             {
                header: 'Action', accessorKey: 'actionType', enableSorting: true, width: 120,
                cell: props => { const type = props.row.original.actionType; return ( <Tag className={`${changeTypeColor[type]} font-semibold border ${changeTypeColor[type].replace('bg-','border-').replace('/20','')} capitalize`}>{type}</Tag> ); }
            },
            { header: 'Entity Type', accessorKey: 'entityType', enableSorting: true, width: 130 },
            { header: 'Entity ID', accessorKey: 'entityId', enableSorting: true, width: 150, cell: props => <span>{props.row.original.entityId ?? '-'}</span> },
            {
                 header: 'Description', accessorKey: 'description', enableSorting: false,
                 cell: props => ( <Tooltip title={props.row.original.description} wrapperClass="w-full"><span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-md">{props.row.original.description}</span></Tooltip> )
             },
            {
                header: '', id: 'action', width: 80,
                cell: (props) => ( <ActionColumn onViewDetails={() => handleViewDetails(props.row.original)} /> ), // Only View action
            },
        ],
        [handleViewDetails] // Update dependencies
    );
    // --- End Define Columns ---


    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Change Log</h3>
                    {/* <ChangeLogActionTools allLogs={changeLogs} /> */} {/* No Add button typically */}
                </div>

                {/* Tools */}
                <div className="mb-2">
                    <ChangeLogTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter} // Pass filter handler
                    />
                </div>

                 {/* Active Filters Display Area */}
                 <ActiveFiltersDisplay
                    filterData={filterData}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                />


                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <ChangeLogTable
                        columns={columns} data={pageData} loading={isLoading}
                        pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                        // selectedLogs={selectedLogs} // Selection removed
                        onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort}
                        // onRowSelect={handleRowSelect} // Selection removed
                        // onAllRowSelect={handleAllRowSelect} // Selection removed
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer Removed */}

             {/* Detail View Dialog */}
             <DetailViewDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                logItem={currentItem}
             />

        </Container>
    );
};
// --- End Main Component ---

export default ChangeLogListing;

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }