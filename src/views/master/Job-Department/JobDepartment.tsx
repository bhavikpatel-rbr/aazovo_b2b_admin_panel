// src/views/your-path/Departments.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // Not used by Units
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import classNames from 'classnames'; // Ensure this is installed or replace

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
import { Drawer, Form, FormItem, Input } from '@/components/ui';

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbBuildingCommunity, // Icon for Departments
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
// import JobDepartment from '.';

// Redux (Assuming you might have specific actions for Departments)
// import { useAppDispatch } from '@/reduxtool/store';
// import {
//     getDepartmentsAction,
//     addDepartmentAction,
//     editDepartmentAction,
//     deleteDepartmentAction, // Corrected: delet -> delete
//     deleteAllDepartmentsAction, // Corrected: deletAll -> deleteAll
// } from '@/reduxtool/master/departmentMiddleware'; // Example path
// import { useSelector } from 'react-redux';
// import { masterSelector } from '@/reduxtool/master/masterSlice'; // Or a specific departmentSlice


// --- Define Department Type ---
export type DepartmentItem = {
    id: string | number;
    name: string; // Department Name
};

// --- Zod Schema for Add/Edit Department Form ---
const departmentFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Department name is required.')
        .max(100, 'Department name cannot exceed 100 characters.'),
});
type DepartmentFormData = z.infer<typeof departmentFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterNames: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DEPT = ['ID', 'Department Name'];
const CSV_KEYS_DEPT: (keyof DepartmentItem)[] = ['id', 'name'];

function exportDepartmentsToCsv(filename: string, rows: DepartmentItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>);
        return false;
    }
    const separator = ',';
    const csvContent =
        CSV_HEADERS_DEPT.join(separator) + '\n' +
        rows.map((row) => CSV_KEYS_DEPT.map((k) => {
            let cell = row[k];
            if (cell === null || cell === undefined) cell = '';
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
        }).join(separator)).join('\n');
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
    toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>);
    return false;
}

// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit Department"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete Department"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- DepartmentsSearch Component ---
type DepartmentsSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const DepartmentsSearch = React.forwardRef<HTMLInputElement, DepartmentsSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Quick search departments..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
DepartmentsSearch.displayName = 'DepartmentsSearch';

// --- DepartmentsTableTools Component ---
const DepartmentsTableTools = ({ onSearchChange, onFilter, onExport }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><DepartmentsSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- DepartmentsTable Component ---
type DepartmentsTableProps = {
    columns: ColumnDef<DepartmentItem>[]; data: DepartmentItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: DepartmentItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: DepartmentItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<DepartmentItem>[]) => void;
};
const DepartmentsTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: DepartmentsTableProps) => (
    <DataTable
        selectable columns={columns} data={data} loading={loading} pagingData={pagingData}
        checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
        onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
        onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
        noData={!loading && data.length === 0}
    />
);

// --- DepartmentsSelectedFooter Component ---
type DepartmentsSelectedFooterProps = { selectedItems: DepartmentItem[]; onDeleteSelected: () => void; };
const DepartmentsSelectedFooter = ({ selectedItems, onDeleteSelected }: DepartmentsSelectedFooterProps) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span>Department{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Department${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}
            >
                <p>Are you sure you want to delete the selected department{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

// --- Initial Dummy Data (for local state example) ---
const initialDummyDepartments: DepartmentItem[] = [
    { id: 'DEPT001', name: 'Engineering' }, { id: 'DEPT002', name: 'Marketing' },
    { id: 'DEPT003', name: 'Sales' }, { id: 'DEPT004', name: 'Human Resources' },
    { id: 'DEPT005', name: 'Finance' },
];

// --- Main Departments Component ---
const JobDepartment = () => {
    // const dispatch = useAppDispatch();
    // const { data: departmentsData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector); // Adjust for actual slice

    // Using local state for this example
    const [departmentsData, setDepartmentsData] = useState<DepartmentItem[]>(initialDummyDepartments);
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DepartmentItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DepartmentItem | null>(null);

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterNames: [] });
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '',
    });
    const [selectedItems, setSelectedItems] = useState<DepartmentItem[]>([]);

    // useEffect(() => { dispatch(getDepartmentsAction()); }, [dispatch]); // For Redux

    const addFormMethods = useForm<DepartmentFormData>({ resolver: zodResolver(departmentFormSchema), defaultValues: { name: '' }, mode: 'onChange' });
    const editFormMethods = useForm<DepartmentFormData>({ resolver: zodResolver(departmentFormSchema), defaultValues: { name: '' }, mode: 'onChange' });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

    const openAddDrawer = useCallback(() => { addFormMethods.reset({ name: '' }); setIsAddDrawerOpen(true); }, [addFormMethods]);
    const closeAddDrawer = useCallback(() => { addFormMethods.reset({ name: '' }); setIsAddDrawerOpen(false); }, [addFormMethods]);

    const onAddDepartmentSubmit = useCallback(async (data: DepartmentFormData) => {
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API
        try {
            // await dispatch(addDepartmentAction({ name: data.name })).unwrap(); // Redux
            const newDepartment: DepartmentItem = { id: `DEPT${Date.now()}`, name: data.name };
            setDepartmentsData(prev => [newDepartment, ...prev]);

            toast.push(<Notification title="Department Added" type="success" duration={2000}>{`Department "${data.name}" added.`}</Notification>);
            closeAddDrawer();
            // dispatch(getDepartmentsAction()); // Redux
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error.message || 'Could not add department.'}</Notification>);
        } finally { setIsSubmitting(false); setMasterLoadingStatus('idle'); }
    }, [closeAddDrawer /*, dispatch*/]);

    const openEditDrawer = useCallback((item: DepartmentItem) => {
        setEditingItem(item);
        editFormMethods.reset({ name: item.name });
        setIsEditDrawerOpen(true);
    }, [editFormMethods]);
    const closeEditDrawer = useCallback(() => { setEditingItem(null); editFormMethods.reset({ name: '' }); setIsEditDrawerOpen(false); }, [editFormMethods]);

    const onEditDepartmentSubmit = useCallback(async (data: DepartmentFormData) => {
        if (!editingItem?.id) { toast.push(<Notification title="Error" type="danger">Cannot edit: Department ID is missing.</Notification>); return; }
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API
        try {
            // await dispatch(editDepartmentAction({ id: editingItem.id, name: data.name })).unwrap(); // Redux
            const updatedDepartment: DepartmentItem = { id: editingItem.id, name: data.name };
            setDepartmentsData(prev => prev.map(d => d.id === updatedDepartment.id ? updatedDepartment : d));

            toast.push(<Notification title="Department Updated" type="success" duration={2000}>{`Department "${data.name}" updated.`}</Notification>);
            closeEditDrawer();
            // dispatch(getDepartmentsAction()); // Redux
        } catch (error: any) {
            toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error.message || 'Could not update department.'}</Notification>);
        } finally { setIsSubmitting(false); setMasterLoadingStatus('idle'); }
    }, [editingItem, closeEditDrawer /*, dispatch*/]);

    const handleDeleteClick = useCallback((item: DepartmentItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete?.id) { toast.push(<Notification title="Error" type="danger">Cannot delete: Department ID is missing.</Notification>); return; }
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API
        try {
            // await dispatch(deleteDepartmentAction({ id: itemToDelete.id })).unwrap(); // Redux
            setDepartmentsData(prev => prev.filter(d => d.id !== itemToDelete.id));

            toast.push(<Notification title="Department Deleted" type="success" duration={2000}>{`Department "${itemToDelete.name}" deleted.`}</Notification>);
            setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
            // dispatch(getDepartmentsAction()); // Redux
        } catch (error: any) {
            toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || `Could not delete department.`}</Notification>);
        } finally { setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null); }
    }, [itemToDelete /*, dispatch*/]);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) { toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>); return; }
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
        try {
            const idsToDelete = selectedItems.map((item) => item.id);
            // await dispatch(deleteAllDepartmentsAction({ ids: idsToDelete.join(',') })).unwrap(); // Redux
            setDepartmentsData(prev => prev.filter(d => !idsToDelete.includes(d.id)));

            toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${selectedItems.length} department(s) deleted.`}</Notification>);
            setSelectedItems([]);
            // dispatch(getDepartmentsAction()); // Redux
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || 'Failed to delete selected departments.'}</Notification>);
        } finally { setIsDeleting(false); setMasterLoadingStatus('idle'); }
    }, [selectedItems /*, dispatch*/]);

    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
        setFilterCriteria({ filterNames: data.filterNames || [] });
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        closeFilterDrawer();
    }, [closeFilterDrawer]);
    const onClearFilters = useCallback(() => {
        const defaultFilters = { filterNames: [] };
        filterFormMethods.reset(defaultFilters);
        setFilterCriteria(defaultFilters);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
    }, [filterFormMethods]);

    const departmentNameOptions = useMemo(() => {
        if (!Array.isArray(departmentsData)) return [];
        const uniqueNames = new Set(departmentsData.map((item) => item.name));
        return Array.from(uniqueNames).map((name) => ({ value: name, label: name }));
    }, [departmentsData]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: DepartmentItem[] = Array.isArray(departmentsData) ? departmentsData : [];
        let processedData: DepartmentItem[] = cloneDeep(sourceData);
        if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
            const selectedFilterNames = filterCriteria.filterNames.map((opt) => opt.value.toLowerCase());
            processedData = processedData.filter((item) => selectedFilterNames.includes(item.name?.trim().toLowerCase() ?? ''));
        }
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter((item) =>
                (item.name?.trim().toLowerCase() ?? '').includes(query) ||
                String(item.id ?? '').trim().toLowerCase().includes(query)
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && (key === 'id' || key === 'name') && processedData.length > 0) {
            processedData.sort((a, b) => {
                const aValue = String(a[key as keyof DepartmentItem] ?? '');
                const bValue = String(b[key as keyof DepartmentItem] ?? '');
                return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            });
        }
        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [departmentsData, tableData, filterCriteria]);

    const handleExportData = useCallback(() => {
        const success = exportDepartmentsToCsv('departments_export.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported.</Notification>);
    }, [allFilteredAndSortedData]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: DepartmentItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<DepartmentItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

    const columns: ColumnDef<DepartmentItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
            { header: 'Department Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Actions', id: 'action', meta:{ headerClass: "text-center", cellClass: "text-center" }, size: 100,
                cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
            },
        ],
        [openEditDrawer, handleDeleteClick],
    );

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-2 sm:mb-0 flex items-center gap-2"><TbBuildingCommunity /> Departments</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
                    </div>
                    <DepartmentsTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4">
                        <DepartmentsTable
                            columns={columns} data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            selectedItems={selectedItems}
                            onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
                            onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <DepartmentsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            <Drawer title="Add Department" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="addDepartmentForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <Form id="addDepartmentForm" onSubmit={addFormMethods.handleSubmit(onAddDepartmentSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Department Name" invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message}>
                        <Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Department Name" />} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Edit Department" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="editDepartmentForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <Form id="editDepartmentForm" onSubmit={editFormMethods.handleSubmit(onEditDepartmentSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Department Name" invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message}>
                        <Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Department Name" />} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Filter Departments" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button>
                        <Button size="sm" variant="solid" form="filterDepartmentForm" type="submit">Apply</Button>
                    </div>
                }
            >
                <Form id="filterDepartmentForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Department Name(s)">
                        <Controller name="filterNames" control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select isMulti placeholder="Select department names..." options={departmentNameOptions}
                                        value={field.value || []} onChange={(selectedVal) => field.onChange(selectedVal || [])} />
                            )} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Department"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
            >
                <p>Are you sure you want to delete the department "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

export default JobDepartment;