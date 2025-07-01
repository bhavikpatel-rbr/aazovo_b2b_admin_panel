// src/views/your-path/ActivityLog.tsx

import React, { useState, useMemo, useCallback, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DebouceInput from "@/components/shared/DebouceInput";
import Avatar from "@/components/ui/Avatar";
import DatePicker from "@/components/ui/DatePicker";
import { Card, Dialog, Drawer, Form, FormItem, Input, Select, Tag, Dropdown, Checkbox } from "@/components/ui";

// Icons
import { TbEye, TbSearch, TbFilter, TbCloudUpload, TbUserCircle, TbReload, TbActivity, TbCalendarWeek, TbLogin, TbCloudPin, TbCloudExclamation, TbCloudCog, TbCancel, TbColumns, TbX, TbShieldOff } from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { getActivityLogAction, submitExportReasonAction, blockUserAction } from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Type Definitions & Constants ---
const CHANGE_TYPE_OPTIONS = [ { value: "CREATE", label: "Create" }, { value: "UPDATE", label: "Update" }, { value: "DELETE", label: "Delete" }, { value: "LOGIN", label: "Login" }, { value: "LOGOUT", label: "Logout" }, { value: "SYSTEM", label: "System" }, { value: "OTHER", label: "Other" }, ];
const ENTITY_TYPE_OPTIONS = [ { value: "User", label: "User" }, { value: "Product", label: "Product" }, { value: "Order", label: "Order" }, { value: "Setting", label: "Setting" }, { value: "Role", label: "Role" }, { value: "Permission", label: "Permission" }, { value: "System", label: "System" }, { value: "Other", label: "Other" }, ];
const BLOCK_STATUS_OPTIONS = [ { value: '1', label: 'Blocked' }, { value: '0', label: 'Not Blocked' } ];

export type User = { id: number; name: string; email: string; profile_pic_path: string | null; roles: { display_name: string }[] };
export type ChangeLogItem = { id: string | number; timestamp: string; userName: string; userId: string | null; action: string; entity: string; entityId: string | null; description: string; ip_address: string | null; is_blocked: 0 | 1 | null; details?: string; updated_at?: string; user: User | null; };

const changeTypeColor: Record<string, string> = { CREATE: "bg-emerald-100 text-emerald-700", UPDATE: "bg-blue-100 text-blue-700", DELETE: "bg-red-100 text-red-700", LOGIN: "bg-lime-100 text-lime-700", LOGOUT: "bg-gray-100 text-gray-600", SYSTEM: "bg-purple-100 text-purple-700", OTHER: "bg-slate-100 text-slate-600" };

const filterFormSchema = z.object({
  filterAction: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterEntity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterUserName: z.string().optional(),
  filterDateRange: z.tuple([z.date().nullable(), z.date().nullable()]).optional(),
  filterBlockStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason is required.").max(255, "Reason too long.") });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Utility & Child Components ---
function exportChangeLogsToCsv(filename: string, rows: ChangeLogItem[]) { /* ... (Your implementation is correct and remains unchanged) ... */ }

const ActionColumn = ({ onViewDetail, onBlock }: { onViewDetail: () => void; onBlock: () => void; }) => (
    <div className="flex items-center justify-center gap-1">
        <Tooltip title="View"><button className="text-xl p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onViewDetail}><TbEye /></button></Tooltip>
        <Tooltip title="Block User/IP"><button className="text-xl p-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onBlock}><TbCancel /></button></Tooltip>
    </div>
);

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: Partial<FilterFormData>; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; }) => {
    const filters = Object.entries(filterData).flatMap(([key, values]) => {
        if (key === 'filterDateRange' && values && (values[0] || values[1])) { const start = values[0] ? new Date(values[0]).toLocaleDateString() : '...'; const end = values[1] ? new Date(values[1]).toLocaleDateString() : '...'; return [{ key, value: 'date-range', label: `${start} to ${end}` }]; }
        if (key === 'filterUserName' && typeof values === 'string' && values) return [{ key, value: values, label: values }];
        if (Array.isArray(values)) return values.map(v => ({ key: key as keyof FilterFormData, ...v }));
        return [];
    });

    if (filters.length === 0) return null;
    const keyToLabelMap = { filterAction: 'Action', filterEntity: 'Entity', filterUserName: 'User', filterDateRange: 'Date', filterBlockStatus: 'Status' };
    
    return (<div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 pb-4"><span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>{filters.map((filter, i) => (<Tag key={`${filter.key}-${i}`} prefix className="bg-gray-100 text-gray-600 border border-gray-300">{(keyToLabelMap as any)[filter.key]}: {filter.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(filter.key, filter.value)} /></Tag>))}<Button size="xs" variant="plain" className="text-red-600 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button></div>);
};

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearAll, columns, filteredColumns, setFilteredColumns, activeFilterCount }: { onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; onClearAll: () => void; columns: ColumnDef<ChangeLogItem>[]; filteredColumns: ColumnDef<ChangeLogItem>[]; setFilteredColumns: (cols: ColumnDef<ChangeLogItem>[]) => void; activeFilterCount: number; }) => {
    const toggleColumn = (checked: boolean, colHeader: string) => setFilteredColumns(checked ? [...filteredColumns, columns.find(c => c.header === colHeader)!].sort((a,b) => columns.indexOf(a) - columns.indexOf(b)) : filteredColumns.filter(c => c.header !== colHeader));
    const isColumnVisible = (header: string) => filteredColumns.some(c => c.header === header);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"><div className="flex-grow"><DebouceInput className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div><div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"><Dropdown renderTitle={<Button title="Toggle Columns" icon={<TbColumns />} />} placement="bottom-end"><div className="flex flex-col p-2"><div className="font-semibold mb-1 border-b pb-1">Toggle Columns</div>{columns.filter(c => c.id !== 'action' && c.header).map(col => (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(c) => toggleColumn(c, col.header as string)} />{col.header}</div>))}</div></Dropdown><Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearAll} /><Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button><Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button></div></div>
    )
};


// --- Main ActivityLog Component ---
const ActivityLog = () => {
    const dispatch = useAppDispatch();
    const { activityLogsData, status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState<ChangeLogItem | null>(null);
    const [blockItem, setBlockItem] = useState<ChangeLogItem | null>(null);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [blockConfirmationOpen, setBlockConfirmationOpen] = useState(false);
    const [isProcessingBlock, setIsProcessingBlock] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "timestamp" }, query: "" });
    const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});

    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: activeFilters });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" } });

    useEffect(() => { dispatch(getActivityLogAction({ params: {} })); }, [dispatch]);

    const mappedData: ChangeLogItem[] = useMemo(() => Array.isArray(activityLogsData?.data) ? activityLogsData.data : [], [activityLogsData?.data]);
    const dynamicFilterOptions = useMemo(() => ({
        actions: Array.from(new Set(mappedData.map(log => log.action))).map(action => ({ value: action, label: CHANGE_TYPE_OPTIONS.find(o => o.value === action)?.label || action })),
        entities: Array.from(new Set(mappedData.map(log => log.entity))).map(entity => ({ value: entity, label: ENTITY_TYPE_OPTIONS.find(o => o.value === entity)?.label || entity }))
    }), [mappedData]);

    const { pageData, total, allFilteredAndSortedDataForExport, counts } = useMemo(() => {
        let processedData: ChangeLogItem[] = cloneDeep(mappedData);
        const initialCounts = activityLogsData?.counts || { total: '...', today: '...', failed_login: '...', unique_ip: '...', distinact_ip: '...', suspicious_ip: '...' };

        if (activeFilters.filterAction?.length) { const s = new Set(activeFilters.filterAction.map(o=>o.value)); processedData = processedData.filter(i=>s.has(i.action)); }
        if (activeFilters.filterEntity?.length) { const s = new Set(activeFilters.filterEntity.map(o=>o.value)); processedData = processedData.filter(i=>s.has(i.entity)); }
        if (activeFilters.filterBlockStatus?.length) { const s = new Set(activeFilters.filterBlockStatus.map(o => parseInt(o.value, 10))); processedData = processedData.filter(i => s.has(i.is_blocked ?? 0)); }
        if (activeFilters.filterUserName) { const q = activeFilters.filterUserName.toLowerCase(); processedData = processedData.filter(i => (i.user?.name || i.userName || "").toLowerCase().includes(q)); }
        if (activeFilters.filterDateRange && (activeFilters.filterDateRange[0] || activeFilters.filterDateRange[1])) { const [start, end] = activeFilters.filterDateRange; const s = start ? start.getTime() : null; const e = end ? new Date(end.setHours(23,59,59,999)).getTime() : null; processedData = processedData.filter(i => { const t = new Date(i.timestamp).getTime(); if (s && e) return t >= s && t <= e; if (s) return t >= s; if (e) return t <= e; return true; }); }
        if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(q))); }

        const { order, key } = tableData.sort;
        if (order && key) {
            processedData.sort((a, b) => {
                let aVal: any = key === 'user' ? a.user?.name || a.userName : a[key as keyof ChangeLogItem];
                let bVal: any = key === 'user' ? b.user?.name || b.userName : b[key as keyof ChangeLogItem];
                if (key === 'timestamp') { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
                if(aVal < bVal) return order === 'asc' ? -1 : 1;
                if(aVal > bVal) return order === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return { pageData: processedData.slice((tableData.pageIndex-1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedDataForExport: processedData, counts: initialCounts };
    }, [mappedData, tableData, activeFilters, activityLogsData?.counts]);

    const activeFilterCount = useMemo(() => Object.entries(activeFilters).filter(([k,v]) => k === 'filterUserName' ? !!v : Array.isArray(v) && v.length > 0).length, [activeFilters]);
    const tableLoading = masterLoadingStatus === "loading" || masterLoadingStatus === "pending";

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const onClearAllFilters = () => { setActiveFilters({}); filterFormMethods.reset(); handleSetTableData({ query: '', pageIndex: 1 }); dispatch(getActivityLogAction({ params: {} })); };
    const handleCardClick = (filterType: 'action' | 'date' | 'all', value?: string) => { handleSetTableData({ pageIndex: 1, query: '' }); if (filterType === 'all') { setActiveFilters({}); } else if (filterType === 'action') { const option = CHANGE_TYPE_OPTIONS.find(o => o.value === value); setActiveFilters(option ? { filterAction: [option] } : {}); } else if (filterType === 'date' && value === 'today') { const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999); setActiveFilters({ filterDateRange: [start, end] }); } };
    const handleRemoveFilter = useCallback((key: keyof FilterFormData, valueToRemove: string) => { setActiveFilters(prev => { const newFilters = { ...prev }; if (key === 'filterDateRange' || key === 'filterUserName') { delete newFilters[key]; } else { const currentValues = (prev[key] || []) as { value: string }[]; const newValues = currentValues.filter(item => item.value !== valueToRemove); if (newValues.length > 0) (newFilters as any)[key] = newValues; else delete (newFilters as any)[key]; } return newFilters; }); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const openViewDialog = useCallback((item: ChangeLogItem) => setViewingItem(item), []);
    const openBlockDialog = useCallback((item: ChangeLogItem) => { setBlockItem(item); setBlockConfirmationOpen(true); }, []);
    const handleConfirmBlock = async () => { if (!blockItem?.id || !blockItem?.ip) { toast.push(<Notification title="Error" type="danger">ID or IP Address is missing.</Notification>); setBlockConfirmationOpen(false); return; } setIsProcessingBlock(true); try { await dispatch(blockUserAction({ id: blockItem.id, ip: blockItem.ip })).unwrap(); toast.push(<Notification title="Success" type="success">User/IP block request sent.</Notification>); dispatch(getActivityLogAction({ params: {} })); } catch (error: any) { toast.push(<Notification title="Block Failed" type="danger">{error.message || "Could not block the user/IP."}</Notification>); } finally { setIsProcessingBlock(false); setBlockConfirmationOpen(false); setBlockItem(null); } };
    const onApplyFiltersSubmit = (data: FilterFormData) => { setActiveFilters(data); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); };
    const handleOpenExportModal = useCallback(() => { if (!allFilteredAndSortedDataForExport?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); }, [allFilteredAndSortedDataForExport, exportReasonFormMethods]);
    const handleConfirmExport = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Activity Log", file_name: fileName })).unwrap(); exportChangeLogsToCsv(fileName, allFilteredAndSortedDataForExport); toast.push(<Notification title="Export Successful" type="success" />); setIsExportReasonModalOpen(false); } catch (e: any) { toast.push(<Notification title="Export Failed" type="danger">{e.message || 'Error'}</Notification>); } finally { setIsSubmittingExportReason(false); } };

    const baseColumns: ColumnDef<ChangeLogItem>[] = useMemo(() => [
       {
        header: "Timestamp",
        size: 180,
        enableSorting: true,
        cell: (props) => {
          const { updated_at } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", {
                month: "short"
              })} ${new Date(updated_at).getFullYear()}, ${new Date(
                updated_at
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}`
            : "N/A";
          return (
            <div className="text-xs">
              <span className="text-gray-700">{formattedDate}</span>
            </div>
          );
        },
      },
        { header: "User", accessorKey: "user", enableSorting: true, size: 200, cell: props => { const { user, userName, is_blocked } = props.row.original; return (<div className="flex items-center gap-2"><Avatar size={28} shape="circle" src={user?.profile_pic_path || undefined} icon={<TbUserCircle />} /><div className="text-xs leading-tight"><b>{user?.name || userName}</b><p className="text-gray-500">{user?.roles?.[0]?.display_name || 'System'}</p></div>{is_blocked === 1 && (<Tooltip title="This IP is blocked for this user"><TbShieldOff className="text-red-500 ml-auto" /></Tooltip>)}</div>)} },
        { header: "Action", accessorKey: "action", size: 110, enableSorting: true, cell: props => { const action = props.row.original.action; return (<Tag className={classNames("capitalize whitespace-nowrap font-semibold min-w-[70px] text-start dark:bg-opacity-20", changeTypeColor[action])}>{CHANGE_TYPE_OPTIONS.find(o => o.value === action)?.label || action}</Tag>); }},
        { header: "Entity", accessorKey: "entity", size: 120, enableSorting: true },
       
        { header: "Description", accessorKey: "description", size: 400, enableSorting: false },
        { header: "Actions", id: "action", size: 100, meta: { cellClass: "text-center" }, cell: props => (<ActionColumn onViewDetail={() => openViewDialog(props.row.original)} onBlock={() => openBlockDialog(props.row.original)} />) },
    ], [openViewDialog, openBlockDialog]);
    const [filteredColumns, setFilteredColumns] = useState(baseColumns);
    useEffect(() => { setFilteredColumns(baseColumns) }, [baseColumns]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4"><h5 className="mb-4 lg:mb-0">Activity Log</h5></div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Tooltip title="Click to clear all filters"><div className="cursor-pointer" onClick={() => handleCardClick('all')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbActivity size={24} /></div><div><h6 className="text-blue-500">{counts.total ?? "..."}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by today's logs"><div className="cursor-pointer" onClick={() => handleCardClick('date', 'today')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCalendarWeek size={24} /></div><div><h6 className="text-green-500">{counts.today ?? "..."}</h6><span className="font-semibold text-xs">Today</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by LOGIN action"><div className="cursor-pointer" onClick={() => handleCardClick('action', 'LOGIN')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbLogin size={24} /></div><div><h6 className="text-pink-500">{counts.failed_login ?? "..."}</h6><span className="font-semibold text-xs">Failed Login</span></div></Card></div></Tooltip>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-300"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbCloudPin size={24} /></div><div><h6 className="text-violet-500">{counts.unique_ip ?? "..."}</h6><span className="font-semibold text-xs">Unique IP</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbCloudCog size={24} /></div><div><h6 className="text-orange-500">{counts.distinact_ip ?? "..."}</h6><span className="font-semibold text-xs">Distinct IP</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCloudExclamation size={24} /></div><div><h6 className="text-red-500">{counts.suspicious_ip ?? "..."}</h6><span className="font-semibold text-xs">Suspicious</span></div></Card>
          </div>

          <ItemTableTools onSearchChange={(q) => handleSetTableData({ query: q, pageIndex: 1 })} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportModal} onClearAll={onClearAllFilters} columns={baseColumns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          
          <div className="mt-4"><ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} /></div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {total < mappedData.length && (
              <span>Showing <strong>{total}</strong> matching results of <strong>{mappedData.length}</strong></span>
            ) }
          </div>
          
          <div className="mt-1 flex-grow overflow-y-auto">
            <DataTable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }} onPaginationChange={(p) => handleSetTableData({ pageIndex: p })} onSelectChange={(s) => handleSetTableData({ pageSize: s, pageIndex: 1 })} onSort={(s) => handleSetTableData({ sort: s })} noData={!tableLoading && pageData.length === 0} />
          </div>
        </AdaptiveCard>
      </Container>
      
      {/* --- Dialogs and Drawers --- */}
      <Dialog isOpen={!!viewingItem} onClose={() => setViewingItem(null)} width={700}>
        <h5 className="mb-4">Log Details (ID: {viewingItem?.id})</h5>
        {viewingItem && <div className="space-y-3 text-sm">{(Object.keys(viewingItem) as Array<keyof ChangeLogItem>).map(key => { let label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); let value: any = viewingItem[key]; if ((key === 'timestamp' || key === 'updated_at') && value) value = new Date(value).toLocaleString(); else if (key === "user" && value) value = `${(value as User).name} (${(value as User).roles?.[0]?.display_name || ''})`; else if (key === "action") value = CHANGE_TYPE_OPTIONS.find(o => o.value === value)?.label || value; else if (key === "entity") value = ENTITY_TYPE_OPTIONS.find(o => o.value === value)?.label || value; else if (key === 'details' && value && typeof value === 'string') { try { const p = JSON.parse(value); if (typeof p === 'object' && p !== null) return (<div key={key} className="flex flex-col"><span className="font-semibold">{label}:</span><pre className="text-xs bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap max-h-40 overflow-auto">{JSON.stringify(p, null, 2) || '-'}</pre></div>) } catch {}} return (<div key={key} className="flex"><span className="font-semibold w-1/3 md:w-1/4">{label}:</span><span className="w-2/3 md:w-3/4 break-words">{value === null || value === undefined || value === '' ? '-' : String(value)}</span></div>) })}</div>}
        <div className="text-right mt-6"><Button variant="solid" onClick={() => setViewingItem(null)}>Close</Button></div>
      </Dialog>

      <ConfirmDialog isOpen={blockConfirmationOpen} type="danger" title={`Block User/IP`} onClose={() => setBlockConfirmationOpen(false)} onConfirm={handleConfirmBlock} loading={isProcessingBlock}><p>Are you sure you want to block this user (ID: {blockItem?.userId}) at IP: {blockItem?.ip_address}? This action cannot be undone.</p></ConfirmDialog>
      
      <Drawer title="Filter Activity Logs" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearAllFilters}>Clear</Button><Button size="sm" variant="solid" form="filterLogForm" type="submit">Apply</Button></div>}>
          <Form id="filterLogForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
              <FormItem label="Action Types"><Controller name="filterAction" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Select actions..." options={dynamicFilterOptions.actions} value={field.value || []} onChange={opts => field.onChange(opts || [])} />} /></FormItem>
              <FormItem label="Entity Types"><Controller name="filterEntity" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Select entities..." options={dynamicFilterOptions.entities} value={field.value || []} onChange={opts => field.onChange(opts || [])} />} /></FormItem>
              <FormItem label="Block Status"><Controller name="filterBlockStatus" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Filter by block status..." options={BLOCK_STATUS_OPTIONS} value={field.value || []} onChange={opts => field.onChange(opts || [])} />} /></FormItem>
              <FormItem label="User Name"><Controller name="filterUserName" control={filterFormMethods.control} render={({ field }) => <Input {...field} value={field.value || ''} placeholder="Enter user name..." />} /></FormItem>
              <FormItem label="Date Range"><Controller name="filterDateRange" control={filterFormMethods.control} render={({ field }) => <DatePicker.DatePickerRange value={field.value as [Date | null, Date | null] | undefined} onChange={dates => field.onChange(dates || [null, null])} placeholder="Start - End" inputFormat="YYYY-MM-DD" />} /></FormItem>
          </Form>
      </Drawer>

      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExport)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <Form id="exportLogsReasonForm" onSubmit={e => e.preventDefault()} className="mt-2"><FormItem label="Reason:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form>
      </ConfirmDialog>
    </>
  );
};

export default ActivityLog;