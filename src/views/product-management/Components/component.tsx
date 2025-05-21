// src/views/your-path/TaskComponents.tsx (Can be a separate file or part of each listing file)

import React, { useState, useMemo, useCallback, Ref } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import Checkbox from '@/components/ui/Checkbox';
import { Form, FormItem as UiFormItem } from '@/components/ui/Form';
import Badge from '@/components/ui/Badge';
import { TbClipboardText, TbFilter, TbX, TbUserCircle } from 'react-icons/tb';

// Icons
import {
    TbPencil,
    TbEye,
    TbShare,
    TbDotsVertical,
    TbChecks,
    TbSearch,
    TbCloudUpload,
    TbPlus,
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Define Task Item Type ---
export type TaskItemStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
export type TaskItem = {
    id: string;
    status: TaskItemStatus;
    note: string; // The main task description or note
    assignTo: string; // User name assigned to the task
    createdBy: string; // User name who created the task
    createdDate: Date;
};
// --- End Task Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    status: z.array(z.string()).default([]), // Filter by status
    assignTo: z.array(z.string()).default([]), // Filter by assignee
});
export type FilterFormSchema = z.infer<typeof filterValidationSchema>;
// --- End Filter Schema ---

// --- Constants ---
export const taskStatusColor: Record<TaskItemStatus, string> = {
    pending: 'bg-amber-500',
    in_progress: 'bg-blue-500',
    review: 'bg-purple-500',
    completed: 'bg-emerald-500',
    on_hold: 'bg-gray-500',
    cancelled: 'bg-red-500',
};

// --- Reusable ActionColumn Component ---
export const ActionColumn = ({ onEdit, onChangeStatus, onDelete, onClone, onViewDetail }: { onEdit: () => void; onChangeStatus: () => void; onDelete: () => void; onClone?: () => void; onViewDetail: () => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
      {/* <Tooltip title="Delete">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbTrash />
                </div>
            </Tooltip> */}
    </div>
    );
};
// --- End ActionColumn ---


// --- TaskTable Component ---
export const TaskTable = ({ columns, data, loading, pagingData, selectedTasks, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: { columns: ColumnDef<TaskItem>[]; data: TaskItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedTasks: TaskItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: TaskItem) => void; onAllRowSelect: (checked: boolean, rows: Row<TaskItem>[]) => void; }) => {
    return <DataTable selectable columns={columns} data={data} loading={loading} pagingData={pagingData}
                     checkboxChecked={(row) => selectedTasks.some((selected) => selected.id === row.id)}
                     onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
                     onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
                     noData={!loading && data.length === 0} />;
};
// --- End TaskTable ---


// --- TaskSearch Component ---
type TaskSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
export const TaskSearch = React.forwardRef<HTMLInputElement, TaskSearchProps>(({ onInputChange }, ref) => {
    return <DebouceInput ref={ref} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />;
});
TaskSearch.displayName = 'TaskSearch';
// --- End TaskSearch ---


// --- TaskFilter Component ---
export const TaskFilter = ({ filterData, setFilterData, uniqueAssignees, uniqueStatuses }: { filterData: FilterFormSchema; setFilterData: (data: FilterFormSchema) => void; uniqueAssignees: string[]; uniqueStatuses: TaskItemStatus[]; }) => {
    const [dialogIsOpen, setIsOpen] = useState(false);
    const openDialog = () => setIsOpen(true);
    const onDialogClose = () => setIsOpen(false);
    const { control, handleSubmit, reset } = useForm<FilterFormSchema>({ defaultValues: filterData, resolver: zodResolver(filterValidationSchema), });
    React.useEffect(() => { reset(filterData); }, [filterData, reset]);
    const onSubmit = (values: FilterFormSchema) => { setFilterData(values); onDialogClose(); };
    const handleReset = () => { const defaultVals = filterValidationSchema.parse({}); reset(defaultVals); setFilterData(defaultVals); onDialogClose(); };
    const activeFilterCount = (filterData.status?.length || 0) + (filterData.assignTo?.length || 0);

    return (
        <>
            <Button icon={<TbFilter />} onClick={openDialog} className="relative">
                <span>Filter</span> {activeFilterCount > 0 && ( <Badge content={activeFilterCount} className="absolute -top-2 -right-2" innerClass="text-xs"/> )}
            </Button>
            <Dialog isOpen={dialogIsOpen} onClose={onDialogClose} onRequestClose={onDialogClose}>
                <h4 className="mb-4">Filter Tasks</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem label="Status" className="mb-4">
                        <Controller name="status" control={control} render={({ field }) => ( <Checkbox.Group vertical value={field.value || []} onChange={field.onChange} > {uniqueStatuses.map((stat) => ( <Checkbox key={stat} value={stat} className="mb-1 capitalize">{stat.replace(/_/g, ' ')}</Checkbox> ))} </Checkbox.Group> )} />
                    </UiFormItem>
                    <UiFormItem label="Assigned To">
                        <Controller name="assignTo" control={control} render={({ field }) => ( <Checkbox.Group vertical value={field.value || []} onChange={field.onChange} > {uniqueAssignees.map((user) => ( <Checkbox key={user} value={user} className="mb-1">{user}</Checkbox>))} </Checkbox.Group> )} />
                    </UiFormItem>
                    <div className="flex justify-end items-center gap-2 mt-6"><Button type="button" onClick={handleReset}> Reset </Button><Button type="submit" variant="solid"> Apply Filters </Button></div>
                </Form>
            </Dialog>
        </>
    );
};
// --- End TaskFilter ---


// --- TaskTableTools Component ---
export const TaskTableTools = ({ onSearchChange, filterData, setFilterData, uniqueAssignees, uniqueStatuses }: { onSearchChange: (query: string) => void; filterData: FilterFormSchema; setFilterData: (data: FilterFormSchema) => void; uniqueAssignees: string[]; uniqueStatuses: TaskItemStatus[]; }) => {
    return ( 
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full"> 
        <div className="flex-grow">
            <TaskSearch onInputChange={onSearchChange} />
        </div> 
        <div className="flex-shrink-0">
            <TaskFilter filterData={filterData} setFilterData={setFilterData} uniqueAssignees={uniqueAssignees} uniqueStatuses={uniqueStatuses} />
        </div>
        <Button icon={<TbCloudUpload/>}>Export</Button>
    </div> );
};
// --- End TaskTableTools ---


// --- ActiveFiltersDisplay Component ---
export const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormSchema; onRemoveFilter: (key: keyof FilterFormSchema, value: string) => void; onClearAll: () => void; }) => {
    const activeStatuses = filterData.status || [];
    const activeAssignees = filterData.assignTo || [];
    const hasActiveFilters = activeStatuses.length > 0 || activeAssignees.length > 0;
    if (!hasActiveFilters) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeStatuses.map((stat) => ( <Tag key={`stat-${stat}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"> <span className="capitalize">{stat.replace(/_/g, ' ')}</span> <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status', stat)} /> </Tag> ))}
            {activeAssignees.map((user) => ( <Tag key={`user-${user}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"> {user} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('assignTo', user)} /> </Tag> ))}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}> Clear All </Button>
        </div>
    );
};
// --- End ActiveFiltersDisplay ---


// --- TaskActionTools Component ---
export const TaskActionTools = ({ allTasks, pageTitle }: { allTasks: TaskItem[], pageTitle: string }) => {
    const navigate = useNavigate();
    const csvData = useMemo(() => allTasks.map(t => ({ ...t, createdDate: t.createdDate.toISOString() })), [allTasks]);
    const csvHeaders = [ { label: "ID", key: "id" }, { label: "Status", key: "status" }, { label: "Note", key: "note" }, { label: "Assigned To", key: "assignTo" }, { label: "Created By", key: "createdBy" }, { label: "Created Date", key: "createdDate" } ];
    const handleAdd = () => console.log(`Navigate to Add New ${pageTitle} page`); // Adjust route as needed

    return ( <div className="flex flex-col md:flex-row gap-3"> {/* <CSVLink ... /> */} <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block> Add New </Button> </div> );
};
// --- End TaskActionTools ---


// --- TaskSelected Component ---
export const TaskSelected = ({ selectedTasks, setSelectedTasks, onDeleteSelected }: { selectedTasks: TaskItem[]; setSelectedTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>; onDeleteSelected: () => void; }) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
    if (selectedTasks.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedTasks.length}</span><span>Task{selectedTasks.length > 1 ? 's' : ''} selected</span></span></span> <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}>Delete</Button></div> </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedTasks.length} Task${selectedTasks.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} confirmButtonColor="red-600"> <p>Are you sure you want to delete the selected task{selectedTasks.length > 1 ? 's' : ''}? This action cannot be undone.</p> </ConfirmDialog>
        </>
    );
};
// --- End TaskSelected ---


// --- useTaskListingLogic Hook (Extract reusable logic) ---
export const useTaskListingLogic = (initialData: TaskItem[]) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [tasks, setTasks] = useState<TaskItem[]>(initialData);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedTasks, setSelectedTasks] = useState<TaskItem[]>([]);
    const [filterData, setFilterData] = useState<FilterFormSchema>(filterValidationSchema.parse({}));

    // Extract unique filter options from the *current* data
    const uniqueAssignees = useMemo(() => Array.from(new Set(tasks.map(t => t.assignTo))).sort(), [tasks]);
    const uniqueStatuses = useMemo(() => Array.from(new Set(tasks.map(t => t.status))), [tasks]); // Order might matter less here

    const { pageData, total } = useMemo(() => {
        let processedData = [...tasks];
        // Apply Filtering
        if (filterData.status && filterData.status.length > 0) { const statusSet = new Set(filterData.status); processedData = processedData.filter(t => statusSet.has(t.status)); }
        if (filterData.assignTo && filterData.assignTo.length > 0) { const assignToSet = new Set(filterData.assignTo); processedData = processedData.filter(t => assignToSet.has(t.assignTo)); }
        // Apply Search
        if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter(t => t.id.toLowerCase().includes(query) || t.note.toLowerCase().includes(query) || t.assignTo.toLowerCase().includes(query) || t.createdBy.toLowerCase().includes(query) || t.status.toLowerCase().includes(query)); }
        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { const sortedData = [...processedData]; sortedData.sort((a, b) => { /* ... sort logic ... */ }); processedData = sortedData; }
        // Apply Pagination
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const dataTotal = processedData.length; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: dataTotal };
    }, [tasks, tableData, filterData]);

    const handleSetTableData = useCallback((data: TableQueries) => { setTableData(data); }, []);
    const handleApplyFilter = useCallback((newFilterData: FilterFormSchema) => { setFilterData(newFilterData); handleSetTableData({ ...tableData, pageIndex: 1 }); setSelectedTasks([]); }, [tableData, handleSetTableData]);
    const handlePaginationChange = useCallback((page: number) => { handleSetTableData({ ...tableData, pageIndex: page }); }, [tableData, handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ ...tableData, pageSize: Number(value), pageIndex: 1 }); setSelectedTasks([]); }, [tableData, handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { handleSetTableData({ ...tableData, query: query, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof FilterFormSchema, value: string) => { setFilterData(prev => { const currentValues = prev[key] || []; const newValues = currentValues.filter(item => item !== value); const updatedFilterData = { ...prev, [key]: newValues }; handleSetTableData({ ...tableData, pageIndex: 1 }); setSelectedTasks([]); return updatedFilterData; }); }, [tableData, handleSetTableData]);
    const handleClearAllFilters = useCallback(() => { const defaultFilters = filterValidationSchema.parse({}); setFilterData(defaultFilters); handleSetTableData({ ...tableData, pageIndex: 1 }); setSelectedTasks([]); }, [tableData, handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: TaskItem) => { setSelectedTasks((prev) => { if (checked) { return prev.some((t) => t.id === row.id) ? prev : [...prev, row]; } else { return prev.filter((t) => t.id !== row.id); } }); }, [setSelectedTasks]);
    const handleAllRowSelect = useCallback((checked: boolean, rows: Row<TaskItem>[]) => { const rowIds = new Set(rows.map(r => r.original.id)); setSelectedTasks(prev => { if (checked) { const originalRows = rows.map((row) => row.original); const existingIds = new Set(prev.map(t => t.id)); const newSelection = originalRows.filter(t => !existingIds.has(t.id)); return [...prev, ...newSelection]; } else { return prev.filter(t => !rowIds.has(t.id)); } }); }, [setSelectedTasks]);
    const handleEdit = useCallback((task: TaskItem) => { console.log('Edit task:', task.id); /* navigate(`/tasks/edit/${task.id}`); */ }, [navigate]);
    const handleClone = useCallback((taskToClone: TaskItem) => { console.log('Cloning task:', taskToClone.id); const newId = `TSK${Math.floor(Math.random() * 9000) + 1000}`; const clonedTask: TaskItem = { ...taskToClone, id: newId, status: 'pending', createdDate: new Date() }; setTasks((prev) => [clonedTask, ...prev]); toast.push(<Notification title="Task Cloned" type="success" duration={2000} />); }, [setTasks]);
    const handleChangeStatus = useCallback((task: TaskItem) => { const statuses: TaskItemStatus[] = ['pending', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled']; const currentIndex = statuses.indexOf(task.status); const nextIndex = (currentIndex + 1) % statuses.length; const newStatus = statuses[nextIndex]; console.log(`Changing status of task ${task.id} to ${newStatus}`); setTasks((current) => current.map((t) => t.id === task.id ? { ...t, status: newStatus } : t)); toast.push(<Notification title="Status Changed" type="success" duration={2000}>{`Task ${task.id} status changed to ${newStatus}.`}</Notification>); }, [setTasks]);
    const handleDelete = useCallback((taskToDelete: TaskItem) => { console.log('Deleting task:', taskToDelete.id); setTasks((current) => current.filter((t) => t.id !== taskToDelete.id)); setSelectedTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id)); toast.push(<Notification title="Task Deleted" type="success" duration={2000}>{`Task ${taskToDelete.id} deleted.`}</Notification>); }, [setTasks, setSelectedTasks]);
    const handleDeleteSelected = useCallback(() => { console.log('Deleting selected tasks:', selectedTasks.map(t => t.id)); const selectedIds = new Set(selectedTasks.map(t => t.id)); setTasks(current => current.filter(t => !selectedIds.has(t.id))); setSelectedTasks([]); toast.push(<Notification title="Tasks Deleted" type="success" duration={2000}>{`${selectedIds.size} task(s) deleted.`}</Notification>); }, [selectedTasks, setTasks, setSelectedTasks]);

    const columns: ColumnDef<TaskItem>[] = useMemo(() => [
        { header: 'Status', accessorKey: 'status', enableSorting: true, width: 140, cell: props => { const { status } = props.row.original; const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); return ( <Tag className={`${taskStatusColor[status]} text-white capitalize`}>{displayStatus}</Tag> ); } },
        { header: 'Note', accessorKey: 'note', enableSorting: false, size: 250, cell: props => (<span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-sm">{props.row.original.note}</span>) }, // Truncate long notes
        { header: 'Assigned To', accessorKey: 'assignTo', enableSorting: true, size:200, cell: props => (<div className="flex items-center gap-2"><Avatar size={28} shape="circle" icon={<TbUserCircle />} /><span>{props.row.original.assignTo}</span></div>) },
        { header: 'Created By', accessorKey: 'createdBy', enableSorting: true,size:200, cell: props => (<div className="flex items-center gap-2"><Avatar size={28} shape="circle" icon={<TbUserCircle />} /><span>{props.row.original.createdBy}</span></div>) },
        { header: 'Created Date', accessorKey: 'createdDate', enableSorting: true, size: 180, cell: props => { const date = props.row.original.createdDate; return <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>; } },
        { header: 'Action', id: 'action', meta :{HeaderClass: "text-center"}, size: 130, cell: (props) => ( <ActionColumn onEdit={() => handleEdit(props.row.original)} onDelete={() => handleDelete(props.row.original)} onChangeStatus={() => handleChangeStatus(props.row.original)} onClone={() => handleClone(props.row.original)} /> ), },
    ], [handleEdit, handleDelete, handleChangeStatus, handleClone]); // Include handlers

    return {
        isLoading, tasks, tableData, selectedTasks, setSelectedTasks, filterData, setFilterData,
        pageData, total, columns, handlePaginationChange, handleSelectChange, handleSort,
        handleSearchChange, handleApplyFilter, handleRemoveFilter, handleClearAllFilters,
        handleRowSelect, handleAllRowSelect, handleDeleteSelected, uniqueAssignees, uniqueStatuses
    };
};