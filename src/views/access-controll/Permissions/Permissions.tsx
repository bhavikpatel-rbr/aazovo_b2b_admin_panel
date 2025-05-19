// src/views/your-path/PermissionsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate replaced by drawer logic
import cloneDeep from 'lodash/cloneDeep';
import classNames from 'classnames';
import { useForm, Controller } from 'react-hook-form'; // Added
import { zodResolver } from '@hookform/resolvers/zod';   // Added
import { z } from 'zod';                                 // Added

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
// import Dialog from '@/components/ui/Dialog'; // Not actively used, can remove if not planned
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import { Drawer, Form, FormItem, Input, Select as UiSelect } from '@/components/ui'; // Added Drawer, Form, FormItem, UiSelect, Textarea

// Icons
import {
    TbPencil, TbTrash, TbChecks, TbSearch, TbFilter, TbPlus, TbCloudUpload,
    TbKey, TbShieldLock, TbFileDescription // Additional icons
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Define Item Type ---
export type PermissionItem = {
    id: string; // Unique Permission ID (e.g., 'users:create', 'products:edit:all')
    name: string; // User-friendly name (e.g., "Create Users", "Edit All Products")
    description: string; // Explanation of what the permission allows
    module?: string; // Optional: Group permission by module (e.g., "Users", "Products")
    // createdDate?: Date; // Can be added if needed
};
// --- End Item Type ---

// --- Zod Schema for Add/Edit Permission Form ---
const permissionFormSchema = z.object({
    id: z.string().min(1, 'Permission ID (system key) is required.').max(100)
        .regex(/^[a-z0-9_:-]+$/, "ID can only contain lowercase letters, numbers, underscores, colons, and hyphens."),
    name: z.string().min(1, 'Display Name is required.').max(150),
    description: z.string().min(1, 'Description is required.').max(500),
    module: z.string().max(50).optional().nullable(), // Optional module/group
});
type PermissionFormData = z.infer<typeof permissionFormSchema>;

// --- Zod Schema for Filter Form ---
const permissionFilterFormSchema = z.object({
    filterName: z.string().optional(),
    filterModule: z.array(z.object({value: z.string(), label: z.string()})).optional(),
});
type PermissionFilterFormData = z.infer<typeof permissionFilterFormSchema>;


// --- Constants ---
const initialDummyPermissions: PermissionItem[] = [
    { id: 'users:create', name: 'Create Users', description: 'Allows creating new user accounts in the system.', module: 'Users' },
    { id: 'users:read:all', name: 'View All Users', description: 'Allows viewing profiles and details of all users.', module: 'Users' },
    { id: 'products:edit:all', name: 'Edit Products', description: 'Allows modifying details of any existing product.', module: 'Products' },
    { id: 'orders:read:all', name: 'View Orders', description: 'Allows viewing all customer orders.', module: 'Orders' },
    { id: 'settings:manage', name: 'Manage Settings', description: 'Allows access to and modification of system-wide settings.', module: 'System' },
    // ... (add more from your original list if needed)
];
// --- End Constants ---

// --- Reusable ActionColumn Component (from your example) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-2"> {/* Centered actions */}
            <Tooltip title="Edit Permission"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete Permission"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- PermissionSearch Component (from your example) ---
type PermissionSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const PermissionSearch = React.forwardRef<HTMLInputElement, PermissionSearchProps>(({ onInputChange }, ref) => (
    <DebouceInput ref={ref} placeholder="Search Permissions (ID, Name, Description...)" suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
));
PermissionSearch.displayName = 'PermissionSearch';

// --- PermissionTableTools Component (Adapted) ---
const PermissionTableTools = ({ onSearchChange, onFilter, onExport }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><PermissionSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- PermissionSelectedFooter Component (Adapted) ---
type PermissionSelectedFooterProps = { selectedItems: PermissionItem[]; onDeleteSelected: () => void; };
const PermissionSelectedFooter = ({ selectedItems, onDeleteSelected }: PermissionSelectedFooterProps) => {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Permission{selectedItems.length > 1 ? 's' : ''} selected</span></span></span>
                    <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)}>Delete Selected</Button>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Permission${selectedItems.length > 1 ? 's' : ''}`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}>
                <p>Are you sure you want to delete the selected permission{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

// CSV Export for Permissions
const CSV_HEADERS_PERMISSION = ['ID', 'Name', 'Description', 'Module'];
type PermissionExportItem = PermissionItem; // Assuming module is already string or handled

function exportToCsvPermissions(filename: string, rows: PermissionItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
    const transformedRows: PermissionExportItem[] = rows.map(row => ({
        ...row,
        module: row.module || 'General',
    }));
    const csvKeysPermissionExport: (keyof PermissionExportItem)[] = ['id', 'name', 'description', 'module'];
    // ... (CSV export logic from previous examples) ...
    const separator = ',';
    const csvContent =
        CSV_HEADERS_PERMISSION.join(separator) + '\n' +
        transformedRows.map((row) => {
            return csvKeysPermissionExport.map((k) => {
                let cell = row[k];
                if (cell === null || cell === undefined) cell = '';
                else cell = String(cell).replace(/"/g, '""');
                if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                return cell;
            }).join(separator);
        }).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url); return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}

// --- Main PermissionsListing Component ---
const PermissionsListing = () => {
    const pageTitle = "System Permissions";

    const [permissions, setPermissions] = useState<PermissionItem[]>(initialDummyPermissions);
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<PermissionItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<PermissionItem | null>(null);

    const [filterCriteria, setFilterCriteria] = useState<PermissionFilterFormData>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<PermissionItem[]>([]);

    const addFormMethods = useForm<PermissionFormData>({ resolver: zodResolver(permissionFormSchema), mode: 'onChange' });
    const editFormMethods = useForm<PermissionFormData>({ resolver: zodResolver(permissionFormSchema), mode: 'onChange' });
    const filterFormMethods = useForm<PermissionFilterFormData>({ resolver: zodResolver(permissionFilterFormSchema), defaultValues: filterCriteria });

    // --- CRUD Handlers ---
    const openAddDrawer = () => { addFormMethods.reset({ id: '', name: '', description: '', module: '' }); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => { addFormMethods.reset(); setIsAddDrawerOpen(false); };
    const onAddPermissionSubmit = async (data: PermissionFormData) => {
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (permissions.some(p => p.id === data.id)) {
            addFormMethods.setError("id", { type: "manual", message: "This Permission ID already exists." });
            setIsSubmitting(false); setMasterLoadingStatus('idle');
            return;
        }
        const newPermission: PermissionItem = { ...data, module: data.module || undefined };
        setPermissions(prev => [newPermission, ...prev]);
        toast.push(<Notification title="Permission Added" type="success">{`Permission "${data.name}" added.`}</Notification>);
        closeAddDrawer();
        setIsSubmitting(false); setMasterLoadingStatus('idle');
    };

    const openEditDrawer = (permission: PermissionItem) => {
        setEditingPermission(permission);
        editFormMethods.reset({ id: permission.id, name: permission.name, description: permission.description, module: permission.module || '' });
        setIsEditDrawerOpen(true);
    };
    const closeEditDrawer = () => { setEditingPermission(null); editFormMethods.reset(); setIsEditDrawerOpen(false); };
    const onEditPermissionSubmit = async (data: PermissionFormData) => {
        if (!editingPermission) return;
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        // ID is part of the form but usually not editable for existing items if it's a key
        const updatedPermission: PermissionItem = { ...editingPermission, ...data, id: editingPermission.id, module: data.module || undefined }; // Keep original ID
        setPermissions(prev => prev.map(p => (p.id === editingPermission.id ? updatedPermission : p)));
        toast.push(<Notification title="Permission Updated" type="success">{`Permission "${data.name}" updated.`}</Notification>);
        closeEditDrawer();
        setIsSubmitting(false); setMasterLoadingStatus('idle');
    };

    const handleDeleteClick = (permission: PermissionItem) => { setItemToDelete(permission); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        setPermissions(prev => prev.filter(p => p.id !== itemToDelete!.id));
        setSelectedItems(prev => prev.filter(item => item.id !== itemToDelete!.id));
        toast.push(<Notification title="Permission Deleted" type="success">{`Permission "${itemToDelete.name}" deleted.`}</Notification>);
        setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null);
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) { toast.push(<Notification title="No Selection" type="info">Please select permissions.</Notification>); return; }
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const idsToDelete = selectedItems.map(item => item.id);
        setPermissions(prev => prev.filter(p => !idsToDelete.includes(p.id)));
        toast.push(<Notification title="Deletion Successful" type="success">{`${selectedItems.length} permission(s) deleted.`}</Notification>);
        setSelectedItems([]);
        setIsDeleting(false); setMasterLoadingStatus('idle');
    };

    // --- Filter Drawer Handlers ---
    const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
    const onApplyFiltersSubmit = (data: PermissionFilterFormData) => {
        setFilterCriteria(data);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        closeFilterDrawer();
    };
    const onClearFilters = () => {
        const defaultFilters = { filterName: '', filterModule: [] };
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
    };

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: PermissionItem) => { setSelectedItems(prev => checked ? (prev.some(item => item.id === row.id) ? prev : [...prev, row]) : prev.filter(item => item.id !== row.id)); }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<PermissionItem>[]) => {
        const originals = currentRows.map(r => r.original);
        if (checked) setSelectedItems(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))]; });
        else { const currentIds = new Set(originals.map(o => o.id)); setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id))); }
    }, []);

    // --- Data Processing ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: PermissionItem[] = cloneDeep(permissions);
        if (filterCriteria.filterName && filterCriteria.filterName.trim() !== '') { const q = filterCriteria.filterName.toLowerCase().trim(); processedData = processedData.filter(item => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)); }
        if (filterCriteria.filterModule?.length) { const v = filterCriteria.filterModule.map(o => o.value.toLowerCase()); processedData = processedData.filter(item => item.module && v.includes(item.module.toLowerCase())); }

        if (tableData.query && tableData.query.trim() !== '') { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || (item.module && item.module.toLowerCase().includes(q))); }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                const aVal = a[key as keyof PermissionItem] as any; const bVal = b[key as keyof PermissionItem] as any;
                const aStr = String(aVal ?? '').toLowerCase(); const bStr = String(bVal ?? '').toLowerCase();
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }
        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [permissions, tableData, filterCriteria]);

    const handleExportData = () => {
        const success = exportToCsvPermissions('system_permissions_export.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };
    
    const moduleOptionsForFilter = useMemo(() => { const unique = new Set(permissions.map(item => item.module).filter(Boolean as any as (value: string | undefined) => value is string)); return Array.from(unique).map(m => ({ value: m, label: m })); }, [permissions]);

    const columns: ColumnDef<PermissionItem>[] = useMemo(() => [
        { header: 'ID (System Key)', accessorKey: 'id', enableSorting: true, size: 250 },
        { header: 'Display Name', accessorKey: 'name', enableSorting: true },
        { header: 'Module/Group', accessorKey: 'module', enableSorting: true, cell: props => props.getValue<string>() || 'General' },
        { header: 'Description', accessorKey: 'description', enableSorting: false, cell: props => <Tooltip title={props.row.original.description} wrapperClass="w-full"><span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-md">{props.row.original.description}</span></Tooltip> },
        { header: 'Actions', id: 'action', size: 200, meta: { headerClass: 'text-center', cellClass: 'text-center' }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], []); // openEditDrawer, handleDeleteClick are stable

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-4 sm:mb-0">{pageTitle}</h5>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Permission</Button>
                    </div>
                    <PermissionTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4 flex-grow overflow-auto">
                        <DataTable
                            selectable columns={columns} data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            checkboxChecked={(row) => selectedItems.some(item => item.id === row.id)}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
                            onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
                            noData={!masterLoadingStatus && pageData.length === 0}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <PermissionSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            {/* Add Permission Drawer */}
            <Drawer title="Add New Permission" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} width={600}
                footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button> <Button size="sm" variant="solid" form="addPermissionForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Permission'}</Button> </div> }>
                <Form id="addPermissionForm" onSubmit={addFormMethods.handleSubmit(onAddPermissionSubmit)} className="flex flex-col gap-4 p-1">
                    <FormItem label="Permission ID (System Key)" invalid={!!addFormMethods.formState.errors.id} errorMessage={addFormMethods.formState.errors.id?.message}><Controller name="id" control={addFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbKey />} placeholder="e.g., users:create_new" />} /></FormItem>
                    <FormItem label="Display Name" invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message}><Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbShieldLock />} placeholder="e.g., Create New Users" />} /></FormItem>
                    <FormItem label="Module/Group (Optional)" invalid={!!addFormMethods.formState.errors.module} errorMessage={addFormMethods.formState.errors.module?.message}><Controller name="module" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., Users, Products" />} /></FormItem>
                    <FormItem label="Description" invalid={!!addFormMethods.formState.errors.description} errorMessage={addFormMethods.formState.errors.description?.message}><Controller name="description" control={addFormMethods.control} render={({ field }) => <Input textArea {...field} rows={3} prefix={<TbFileDescription />} placeholder="What this permission allows..." />} /></FormItem>
                </Form>
            </Drawer>

            {/* Edit Permission Drawer */}
            <Drawer title="Edit Permission" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer} width={600}
                footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button> <Button size="sm" variant="solid" form="editPermissionForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button> </div> }>
                <Form id="editPermissionForm" onSubmit={editFormMethods.handleSubmit(onEditPermissionSubmit)} className="flex flex-col gap-4 p-1">
                    <FormItem label="Permission ID (System Key)" invalid={!!editFormMethods.formState.errors.id} errorMessage={editFormMethods.formState.errors.id?.message}><Controller name="id" control={editFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbKey />} disabled={true /* ID is usually not editable */} />} /></FormItem>
                    <FormItem label="Display Name" invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message}><Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} prefix={<TbShieldLock />} />} /></FormItem>
                    <FormItem label="Module/Group (Optional)" invalid={!!editFormMethods.formState.errors.module} errorMessage={editFormMethods.formState.errors.module?.message}><Controller name="module" control={editFormMethods.control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
                    <FormItem label="Description" invalid={!!editFormMethods.formState.errors.description} errorMessage={editFormMethods.formState.errors.description?.message}><Controller name="description" control={editFormMethods.control} render={({ field }) => <Input textArea {...field} rows={3} prefix={<TbFileDescription />} />} /></FormItem>
                </Form>
            </Drawer>

            {/* Filter Drawer */}
            <Drawer title="Filter Permissions" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={ <div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterPermissionForm" type="submit">Apply</Button></div> }>
                <Form id="filterPermissionForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Name / ID"><Controller name="filterName" control={filterFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter name or ID to filter..." />} /></FormItem>
                    <FormItem label="Filter by Module/Group"><Controller name="filterModule" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Any Module" options={moduleOptionsForFilter} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                </Form>
            </Drawer>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Permission" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete permission "<strong>{itemToDelete?.name}</strong>" (ID: {itemToDelete?.id})?</p>
            </ConfirmDialog>
        </>
    );
};

export default PermissionsListing;