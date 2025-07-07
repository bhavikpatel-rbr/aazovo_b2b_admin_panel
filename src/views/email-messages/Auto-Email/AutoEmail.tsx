import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";
import dayjs from "dayjs";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebounceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Tag, Checkbox, Dropdown, Avatar, Dialog } from "@/components/ui";

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbMailForward,
    TbUsers,
    TbToggleRight,
    TbReload,
    TbMailOpened,
    TbSend,
    TbMailbox,
    TbAlignBoxCenterBottom,
    TbMailOff,
    TbColumns,
    TbX,
    TbUserCircle,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
    getAutoEmailsAction,
    addAutoEmailAction,
    editAutoEmailAction,
    submitExportReasonAction,
    getUsersAction,
    deleteAutoEmailAction,
    deleteAllAutoEmailsAction,
    getAutoEmailTemplatesAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Utils
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";


// --- TYPE DEFINITIONS ---
export type ApiUser = { id: string | number; name: string; email?: string, profile_pic_path?: string; roles?: { display_name: string }[] };
export type SelectOption = { value: string | number; label: string };
export type AutoEmailApiStatus = "Active" | "Inactive" | string;

export type AutoEmailItem = {
    id: string | number;
    email_type: string;
    user_ids: string[];
    created_at: string;
    updated_at: string;
    status: AutoEmailApiStatus;
    created_by_user?: ApiUser;
    updated_by_user?: ApiUser;
    // For display purposes, derived in useMemo
    emailTypeDisplay?: string;
    usersDisplay?: ApiUser[];
};

// --- CONSTANTS ---
const AUTO_EMAIL_STATUS_OPTIONS: SelectOption[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];
const autoEmailStatusValues = AUTO_EMAIL_STATUS_OPTIONS.map((s) => s.value) as ['Active' | 'Inactive', ...Array<'Active' | 'Inactive'>];

const autoEmailStatusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    Inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

// --- ZOD SCHEMAS ---
const autoEmailFormSchema = z.object({
    email_type: z.string().min(1, 'Email Type is required.'),
    user_ids: z.array(z.string().min(1)).min(1, 'At least one User must be selected.'),
    status: z.enum(autoEmailStatusValues, { errorMap: () => ({ message: 'Please select a status.' }) }),
});
type AutoEmailFormData = z.infer<typeof autoEmailFormSchema>;

const filterFormSchema = z.object({
    filterEmailTypes: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterUserIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
    reason: z.string().min(10, 'Reason is required (min 10 characters).').max(255, 'Reason cannot exceed 255 characters.'),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- HELPER FUNCTIONS & COMPONENTS ---
const parseUserIds = (userIds: string | null | undefined | string[]): string[] => {
    if (!userIds) return [];
    if (Array.isArray(userIds)) return userIds.map(String);
    try {
        const parsed = JSON.parse(userIds);
        if (Array.isArray(parsed)) {
            return parsed.map(String);
        }
    } catch (e) {
        if (typeof userIds === 'string') {
            return userIds.split(',').map(id => id.trim()).filter(Boolean);
        }
    }
    return [];
};


function exportAutoEmailsToCsv(filename: string, rows: AutoEmailItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }

    const separator = ',';
    const headers = ["ID", "Email Type", "Users", "Status", "Updated By", "Updated At"];
    const csvContent = [
        headers.join(separator),
        ...rows.map(row => {
            const cells = [
                row.id,
                row.emailTypeDisplay,
                row.usersDisplay?.map(u => u.name).join('; '),
                row.status,
                row.updated_by_user?.name || 'N/A',
                row.updated_at ? formatCustomDateTime(row.updated_at) : 'N/A'
            ];
            return cells.map(cell => {
                let strCell = String(cell ?? '').replace(/"/g, '""');
                return `"${strCell}"`;
            }).join(separator);
        })
    ].join('\n');

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
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => (
    <div className="flex items-center justify-center gap-1.5">
        <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600" role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
        <Tooltip title="Delete"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600" role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        <Tooltip title="Send Test Email"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600" role="button"><TbMailForward size={18} /></div></Tooltip>
        <Tooltip title="View Template"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button"><TbAlignBoxCenterBottom size={17} /></div></Tooltip>
        <Tooltip title="Email Log"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-gray-700" role="button"><TbMailbox size={18} /></div></Tooltip>
        <Tooltip title="Send Now"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600" role="button"><TbSend size={18} /></div></Tooltip>
    </div>
);

const AutoEmailSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void; }>(({ onInputChange }, ref) => (
    <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
));
AutoEmailSearch.displayName = 'AutoEmailSearch';

const AutoEmailTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
    onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void;
    columns: ColumnDef<AutoEmailItem>[]; filteredColumns: ColumnDef<AutoEmailItem>[]; setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<AutoEmailItem>[]>>; activeFilterCount: number;
}) => {
    const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
    const toggleColumn = (checked: boolean, colId: string) => {
        if (checked) {
            const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
            if (originalColumn) {
                setFilteredColumns(prev => {
                    const newCols = [...prev, originalColumn];
                    newCols.sort((a, b) => {
                        const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
                        const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
                        return indexA - indexB;
                    });
                    return newCols;
                });
            }
        } else {
            setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow"><AutoEmailSearch onInputChange={onSearchChange} /></div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2">
                        <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => {
                            const id = col.id || col.accessorKey as string;
                            return col.header && (
                                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 rounded-md py-1.5 px-2">
                                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox>
                                </div>
                            );
                        })}
                    </div>
                </Dropdown>
                <Button title="Clear Filters" icon={<TbReload />} onClick={onClearFilters} />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
    filterData: FilterFormData; onRemoveFilter: (key: keyof FilterFormData, value: string | number) => void; onClearAll: () => void;
}) => {
    const { filterEmailTypes, filterUserIds, filterStatus } = filterData;
    if (!filterEmailTypes?.length && !filterUserIds?.length && !filterStatus?.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b pb-4">
            <span className="font-semibold text-sm text-gray-600 mr-2">Active Filters:</span>
            {filterEmailTypes?.map(item => <Tag key={`type-${item.value}`} prefix>Type: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterEmailTypes', String(item.value))} /></Tag>)}
            {filterUserIds?.map(item => <Tag key={`user-${item.value}`} prefix>User: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterUserIds', item.value)} /></Tag>)}
            {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterStatus', String(item.value))} /></Tag>)}
            <Button size="xs" variant="plain" className="text-red-600 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
};

const AutoEmailsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: { selectedItems: AutoEmailItem[]; onDeleteSelected: () => void; isDeleting: boolean; }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="p-4 border-t" stickyClass="bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                        <TbChecks className="text-lg text-emerald-500" />
                        {selectedItems.length} selected
                    </span>
                    <Button size="sm" color="red" variant="plain" onClick={() => setConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button>
                </div>
            </StickyFooter>
            <ConfirmDialog type="danger" isOpen={confirmOpen} onConfirm={() => { onDeleteSelected(); setConfirmOpen(false); }} onCancel={() => setConfirmOpen(false)} title={`Delete ${selectedItems.length} items?`}>
                <p>Are you sure you want to delete the {selectedItems.length} selected items? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};


// --- MAIN COMPONENT ---
const AutoEmailListing = () => {
    const dispatch = useAppDispatch();
    const { 
        autoEmailsData = { data: [], counts: {} }, 
        usersData = [], 
        autoEmailTemplatesData = { data: [] },
        status: masterLoadingStatus = 'idle' 
    } = useSelector(masterSelector, shallowEqual);

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AutoEmailItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [viewerImageSrc, setViewerImageSrc] = useState<string | null>(null);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'updated_at' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<AutoEmailItem[]>([]);
    const [itemToDelete, setItemToDelete] = useState<AutoEmailItem | null>(null);

    const userOptions = useMemo(() => Array.isArray(usersData) ? usersData.map((u: ApiUser) => ({ value: String(u.id), label: u.name })) : [], [usersData]);
    
    const EMAIL_TYPE_OPTIONS = useMemo(() => 
        autoEmailTemplatesData?.data && Array.isArray(autoEmailTemplatesData.data) 
            ? autoEmailTemplatesData.data.map((template: any) => ({ value: template.email_type, label: template.email_type })) 
            : [],
    [autoEmailTemplatesData]);

    useEffect(() => { 
        dispatch(getAutoEmailsAction()); 
        dispatch(getUsersAction()); 
        dispatch(getAutoEmailTemplatesAction());
    }, [dispatch]);

    const addFormMethods = useForm<AutoEmailFormData>({ resolver: zodResolver(autoEmailFormSchema), mode: 'onChange' });
    const editFormMethods = useForm<AutoEmailFormData>({ resolver: zodResolver(autoEmailFormSchema), mode: 'onChange' });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' }, mode: 'onChange' });

    const openImageViewer = useCallback((src?: string) => { if (src) { setViewerImageSrc(src); setIsImageViewerOpen(true); } }, []);
    const closeImageViewer = useCallback(() => { setIsImageViewerOpen(false); setViewerImageSrc(null); }, []);

    const openAddDrawer = useCallback(() => {
        setEditingItem(null);
        addFormMethods.reset({ email_type: undefined, user_ids: [], status: 'Active' });
        setIsAddDrawerOpen(true);
    }, [addFormMethods]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

    const openEditDrawer = useCallback((item: AutoEmailItem) => {
        setEditingItem(item);
        editFormMethods.reset({
            email_type: String(item.email_type),
            user_ids: parseUserIds(item.user_ids),
            status: (item.status === 'Active' || item.status === 'Inactive') ? item.status : 'Inactive'
        });
        setIsEditDrawerOpen(true);
    }, [editFormMethods]);
    const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

    const onSubmitHandler = async (data: AutoEmailFormData) => {
        setIsSubmitting(true);
        const apiPayload = { email_type: data.email_type, user_ids: data.user_ids, status: data.status };
        try {
            if (editingItem) {
                await dispatch(editAutoEmailAction({ id: editingItem.id, ...apiPayload })).unwrap();
                toast.push(<Notification title="Updated" type="success" />);
                closeEditDrawer();
            } else {
                await dispatch(addAutoEmailAction(apiPayload)).unwrap();
                toast.push(<Notification title="Added" type="success" />);
                closeAddDrawer();
            }
            dispatch(getAutoEmailsAction());
        } catch (e: any) {
            toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{(e as Error).message}</Notification>);
        } finally { setIsSubmitting(false); }
    };

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData = Array.isArray(autoEmailsData?.data) ? autoEmailsData.data : [];
        const sourceDataWithDisplayNames: AutoEmailItem[] = sourceData.map((item: any) => ({
            ...item,
            user_ids: parseUserIds(item.user_ids),
            emailTypeDisplay: EMAIL_TYPE_OPTIONS.find(et => et.value === String(item.email_type))?.label || String(item.email_type),
            usersDisplay: parseUserIds(item.user_ids).map(uid => usersData.find((u: ApiUser) => String(u.id) === uid)).filter(Boolean) as ApiUser[],
        }));

        let processedData = cloneDeep(sourceDataWithDisplayNames);
        if (filterCriteria.filterEmailTypes?.length) { const v = filterCriteria.filterEmailTypes.map(et => et.value); processedData = processedData.filter(item => v.includes(String(item.email_type))); }
        if (filterCriteria.filterUserIds?.length) { const v = new Set(filterCriteria.filterUserIds.map(u => u.value)); processedData = processedData.filter(item => item.user_ids.some(uid => v.has(uid))); }
        if (filterCriteria.filterStatus?.length) { const v = new Set(filterCriteria.filterStatus.map(s => s.value)); processedData = processedData.filter(item => v.has(String(item.status))); }
        if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || item.emailTypeDisplay?.toLowerCase().includes(q) || item.usersDisplay?.some(u => u.name.toLowerCase().includes(q)) || String(item.status).toLowerCase().includes(q)); }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            processedData.sort((a, b) => {
                let aVal: any = a[key as keyof AutoEmailItem], bVal: any = b[key as keyof AutoEmailItem];
                if (key === 'updated_at' || key === 'created_at') { return order === 'asc' ? new Date(aVal).getTime() - new Date(bVal).getTime() : new Date(bVal).getTime() - new Date(aVal).getTime(); }
                return order === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
            });
        }

        return { pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedData: processedData };
    }, [autoEmailsData.data, tableData, filterCriteria, usersData, EMAIL_TYPE_OPTIONS]);

    const activeFilterCount = useMemo(() => Object.values(filterCriteria).filter(v => Array.isArray(v) && v.length > 0).length, [filterCriteria]);
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectPageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]) }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);

    const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); handleSetTableData({ pageIndex: 1, query: '' }); }, [filterFormMethods, handleSetTableData]);

    const handleCardClick = (status: 'Active' | 'Inactive' | 'all') => {
        const newFilters: FilterFormData = {};
        if (status !== 'all') {
            const statusOption = AUTO_EMAIL_STATUS_OPTIONS.find(opt => opt.value === status);
            if (statusOption) newFilters.filterStatus = [statusOption];
        }
        setFilterCriteria(newFilters);
        filterFormMethods.reset(newFilters); // FIX: Sync filter drawer state
        handleSetTableData({ pageIndex: 1, query: '' });
    };

    const handleRemoveFilter = (key: keyof FilterFormData, valueToRemove: string | number) => {
        setFilterCriteria(prev => {
            const newCriteria = { ...prev };
            const currentFilterArray = newCriteria[key] as { value: string | number }[] | undefined;
            if (currentFilterArray) (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove);
            filterFormMethods.reset(newCriteria); // Sync filter drawer state
            return newCriteria;
        });
        handleSetTableData({ pageIndex: 1 });
    };

    const handleOpenExportReasonModal = () => {
        if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
        exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true);
    };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `auto_emails_export_${dayjs().format('YYYY-MM-DD')}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Auto Emails', file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportAutoEmailsToCsv(fileName, allFilteredAndSortedData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) {
            toast.push(<Notification title="Failed" type="danger">{error.message}</Notification>);
        } finally { setIsSubmittingExportReason(false); }
    };

    const handleDeleteClick = useCallback((item: AutoEmailItem) => { setItemToDelete(item); }, []);
    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteAutoEmailAction({ id: itemToDelete.id })).unwrap();
            toast.push(<Notification title="Deleted" type="success" />);
            dispatch(getAutoEmailsAction());
            setItemToDelete(null);
        } catch (e: any) {
            toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>);
        } finally { setIsDeleting(false); }
    }, [dispatch, itemToDelete]);

    const onDeleteSelected = useCallback(async () => {
        setIsDeleting(true);
        const ids = selectedItems.map(item => item.id);
        try {
            await dispatch(deleteAllAutoEmailsAction({ ids: ids.join(',') })).unwrap();
            toast.push(<Notification title="Bulk Delete Successful" type="success" />);
            setSelectedItems([]);
            dispatch(getAutoEmailsAction());
        } catch (e: any) {
            toast.push(<Notification title="Bulk Delete Failed" type="danger">{(e as Error).message}</Notification>);
        } finally { setIsDeleting(false); }
    }, [dispatch, selectedItems]);

    const handleRowSelect = useCallback((checked: boolean, row: AutoEmailItem) => {
        setSelectedItems(prev => checked ? [...prev, row] : prev.filter(item => item.id !== row.id));
    }, []);
    const handleAllRowSelect = useCallback((checked: boolean, rows: Row<AutoEmailItem>[]) => {
        const originals = rows.map(r => r.original);
        if (checked) {
            const newItems = originals.filter(o => !selectedItems.some(s => s.id === o.id));
            setSelectedItems(prev => [...prev, ...newItems]);
        } else {
            const originalIds = new Set(originals.map(o => o.id));
            setSelectedItems(prev => prev.filter(s => !originalIds.has(s.id)));
        }
    }, [selectedItems]);

    const columns: ColumnDef<AutoEmailItem>[] = useMemo(() => [
        { header: "Email Type", accessorKey: "emailTypeDisplay", enableSorting: true, size: 250 },
        {
            header: "User(s)", accessorKey: "usersDisplay", enableSorting: false, size: 250, cell: props => (
                <div className="flex -space-x-2 rtl:space-x-reverse">
                    {props.row.original.usersDisplay?.slice(0, 3).map(user => (
                        <Tooltip key={user.id} title={user.name}><Avatar src={user.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} /></Tooltip>
                    ))}
                    {props.row.original.usersDisplay && props.row.original.usersDisplay.length > 3 && (
                        <Tooltip title={`${props.row.original.usersDisplay.length - 3} more`}>
                            <Avatar shape="circle" size="sm" className="bg-blue-100 text-blue-600">+{props.row.original.usersDisplay.length - 3}</Avatar>
                        </Tooltip>
                    )}
                </div>
            )
        },
        { header: "Status", accessorKey: "status", enableSorting: true, size: 120, cell: props => (<Tag className={classNames('capitalize', autoEmailStatusColor[String(props.getValue())] || autoEmailStatusColor.default)}>{props.getValue()}</Tag>) },
        {
            header: 'Updated Info', accessorKey: 'updated_at', enableSorting: true, size: 220, cell: props => {
                const { updated_at, updated_by_user } = props.row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar src={updated_by_user?.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} />
                        <div>
                            <span className='font-semibold'>{updated_by_user?.name || 'N/A'}</span>
                            <div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div>
                            <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
                        </div>
                    </div>
                );
            }
        },
        { header: "Actions", id: "actions", size: 120, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], [openEditDrawer, openImageViewer, handleDeleteClick]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<AutoEmailItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns) }, [columns]);

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Automation Email</h5>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 mb-4 gap-4">
                        <Tooltip title="Click to show all configurations"><div onClick={() => handleCardClick('all')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-3"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMailbox size={24} /></div><div><h6 className="text-blue-500">{autoEmailsData?.counts?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Active configurations"><div onClick={() => handleCardClick('Active')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-3"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbMailOpened size={24} /></div><div><h6 className="text-emerald-500">{autoEmailsData?.counts?.Active || 0}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Inactive configurations"><div onClick={() => handleCardClick('Inactive')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-3"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMailOff size={24} /></div><div><h6 className="text-red-500">{autoEmailsData?.counts?.Inactive || 0}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
                        <Card bodyClass="flex gap-2 p-3" className="cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUsers size={24} /></div><div><h6 className="text-orange-500">{autoEmailsData?.counts?.total_users || 0}</h6><span className="font-semibold text-xs">Total Users</span></div></Card>
                    </div>
                    <div className="mb-4"><AutoEmailTableTools onSearchChange={handleSearchChange} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} /></div>
                    <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
                    <div className="mt-4"><DataTable columns={filteredColumns} data={pageData} loading={masterLoadingStatus === 'loading'} selectable onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} /></div>
                </AdaptiveCard>
            </Container>

            <AutoEmailsSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelected} isDeleting={isDeleting} />

            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} width={600}>
                <div className="flex justify-center items-center p-4">{viewerImageSrc ? <img src={viewerImageSrc} alt="User" className="max-w-full max-h-[80vh]" /> : <p>No image.</p>}</div>
            </Dialog>

            <Drawer title={editingItem ? 'Edit Automation Email' : 'Add New Automation Email'} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700}
                footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} type="button">Cancel</Button><Button size="sm" variant="solid" form="autoEmailForm" type="submit" loading={isSubmitting} disabled={!(editingItem ? editFormMethods.formState.isValid : addFormMethods.formState.isValid) || isSubmitting}>Save</Button></div>}>
                <Form id="autoEmailForm" onSubmit={(editingItem ? editFormMethods : addFormMethods).handleSubmit(onSubmitHandler)}>
                    <FormItem label="Email Type *" invalid={!!(editingItem ? editFormMethods : addFormMethods).formState.errors.email_type} errorMessage={(editingItem ? editFormMethods : addFormMethods).formState.errors.email_type?.message}>
                        <Controller name="email_type" control={(editingItem ? editFormMethods : addFormMethods).control} render={({ field }) => <Select placeholder="Select Email Type" options={EMAIL_TYPE_OPTIONS} value={EMAIL_TYPE_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} prefix={<TbMailForward />} />} />
                    </FormItem>
                    <FormItem label="Users *" invalid={!!(editingItem ? editFormMethods : addFormMethods).formState.errors.user_ids} errorMessage={(editingItem ? editFormMethods : addFormMethods).formState.errors.user_ids?.message}>
                        <Controller name="user_ids" control={(editingItem ? editFormMethods : addFormMethods).control} render={({ field }) => <Select isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(String(o.value)))} onChange={opts => field.onChange(opts?.map(o => String(o.value)) || [])} prefix={<TbUsers />} />} />
                    </FormItem>
                    <FormItem label="Status *" invalid={!!(editingItem ? editFormMethods : addFormMethods).formState.errors.status} errorMessage={(editingItem ? editFormMethods : addFormMethods).formState.errors.status?.message}>
                        <Controller name="status" control={(editingItem ? editFormMethods : addFormMethods).control} render={({ field }) => <Select placeholder="Select Status" options={AUTO_EMAIL_STATUS_OPTIONS} value={AUTO_EMAIL_STATUS_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} prefix={<TbToggleRight />} />} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterForm" type="submit">Apply</Button></div>}>
                <Form id="filterForm" onSubmit={filterFormMethods.handleSubmit((data) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); })} className="flex flex-col gap-4">
                    <FormItem label="Email Type"><Controller name="filterEmailTypes" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Email Type" options={EMAIL_TYPE_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                    <FormItem label="User"><Controller name="filterUserIds" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any User" options={userOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                    <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Status" options={AUTO_EMAIL_STATUS_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={!!itemToDelete} type="danger" title="Delete Configuration" onConfirm={onConfirmSingleDelete} onCancel={() => setItemToDelete(null)} onRequestClose={() => setItemToDelete(null)}>
                <p>Are you sure you want to delete this auto email configuration?</p>
            </ConfirmDialog>

            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText="Submit & Export" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={e => e.preventDefault()} className="mt-2">
                    <FormItem label="Please provide a reason for this export:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
                        <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => <Input textArea {...field} placeholder="e.g., Monthly audit..." rows={3} />} />
                    </FormItem>
                </Form>
            </ConfirmDialog>
        </>
    );
};

export default AutoEmailListing;