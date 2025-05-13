// src/views/your-path/DesignationListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom'; // Not used if all actions are in-component
import cloneDeep from 'lodash/cloneDeep';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import classNames from 'classnames'; // Make sure this is installed or replace with your utility

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
    TbPencil, TbTrash, TbChecks, TbSearch, TbFilter, TbPlus, TbCloudUpload,
    TbBriefcase // Icon for Designation
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
// Redux (Optional - replace with local state if not using Redux for designations)
// import { useAppDispatch } from '@/reduxtool/store';
// import {
//     getDesignationsAction, addDesignationAction, editDesignationAction,
//     deleteDesignationAction, deleteAllDesignationsAction
// } from '@/reduxtool/master_or_designation/middleware'; // Adjust path
// import { useSelector } from 'react-redux';
// import { masterSelector } from '@/reduxtool/master_or_designation/designationSlice'; // Adjust path


// --- Define Designation Type ---
export type DesignationItem = {
    id: string | number;
    name: string; // Designation Name
};

// --- Zod Schema for Add/Edit Designation Form ---
const designationFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Designation name is required.')
        .max(150, 'Designation name cannot exceed 150 characters.'),
});
type DesignationFormData = z.infer<typeof designationFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterNames: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DES = ['ID', 'Designation Name'];
const CSV_KEYS_DES: (keyof DesignationItem)[] = ['id', 'name'];

function exportDesignationsToCsv(filename: string, rows: DesignationItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>);
        return false;
    }
    const separator = ',';
    const csvContent =
        CSV_HEADERS_DES.join(separator) + '\n' +
        rows.map((row) => CSV_KEYS_DES.map((k) => {
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
            <Tooltip title="Edit Designation"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
            <Tooltip title="Delete Designation"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400')} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
        </div>
    );
};

// --- DesignationsSearch Component ---
type DesignationsSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const DesignationsSearch = React.forwardRef<HTMLInputElement, DesignationsSearchProps>(
    ({ onInputChange }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder="Quick search designations..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
DesignationsSearch.displayName = 'DesignationsSearch';

// --- DesignationsTableTools Component ---
const DesignationsTableTools = ({ onSearchChange, onFilter, onExport }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><DesignationsSearch onInputChange={onSearchChange} /></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- DesignationsTable Component ---
type DesignationsTableProps = {
    columns: ColumnDef<DesignationItem>[]; data: DesignationItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: DesignationItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: DesignationItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<DesignationItem>[]) => void;
};
const DesignationsTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: DesignationsTableProps) => (
    <DataTable
        selectable columns={columns} data={data} loading={loading} pagingData={pagingData}
        checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
        onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
        onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
        noData={!loading && data.length === 0}
    />
);

// --- DesignationsSelectedFooter Component ---
type DesignationsSelectedFooterProps = { selectedItems: DesignationItem[]; onDeleteSelected: () => void; };
const DesignationsSelectedFooter = ({ selectedItems, onDeleteSelected }: DesignationsSelectedFooterProps) => {
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
                            <span>Designation{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}>Delete Selected</Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Designation${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}
            >
                <p>Are you sure you want to delete the selected designation{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

// --- Initial Dummy Data (for local state example) ---
const initialDummyDesignations: DesignationItem[] = [
    { id: 'DES001', name: 'Software Engineer II' }, { id: 'DES002', name: 'Marketing Manager' },
    { id: 'DES003', name: 'Sales Representative' }, { id: 'DES004', name: 'HR Specialist' },
    { id: 'DES005', name: 'Senior Product Manager' },
];


// --- Main DesignationListing Component ---
const DesignationListing = () => {
    // const dispatch = useAppDispatch(); // Uncomment if using Redux
    // const { data: designationsData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector); // Adjust selector

    // Using local state for data for this example, similar to how Units was initially
    const [designationsData, setDesignationsData] = useState<DesignationItem[]>(initialDummyDesignations);
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');


    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DesignationItem | null>(null); // Changed from editingUnit
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DesignationItem | null>(null); // Changed from unitToDelete

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterNames: [] });

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '',
    });
    const [selectedItems, setSelectedItems] = useState<DesignationItem[]>([]);

    // useEffect(() => { // If using Redux
    //     dispatch(getDesignationsAction());
    // }, [dispatch]);

    const addFormMethods = useForm<DesignationFormData>({
        resolver: zodResolver(designationFormSchema), defaultValues: { name: '' }, mode: 'onChange',
    });
    const editFormMethods = useForm<DesignationFormData>({
        resolver: zodResolver(designationFormSchema), defaultValues: { name: '' }, mode: 'onChange',
    });
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria,
    });

    const openAddDrawer = useCallback(() => { addFormMethods.reset({ name: '' }); setIsAddDrawerOpen(true); }, [addFormMethods]);
    const closeAddDrawer = useCallback(() => { addFormMethods.reset({ name: '' }); setIsAddDrawerOpen(false); }, [addFormMethods]);

    const onAddDesignationSubmit = useCallback(async (data: DesignationFormData) => {
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            // await dispatch(addDesignationAction({ name: data.name })).unwrap(); // Redux
            const newDesignation: DesignationItem = { id: `DES${Date.now()}`, name: data.name };
            setDesignationsData(prev => [newDesignation, ...prev]); // Local state update

            toast.push(<Notification title="Designation Added" type="success" duration={2000}>{`Designation "${data.name}" added.`}</Notification>);
            closeAddDrawer();
            // dispatch(getDesignationsAction()); // Redux: Refresh list
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{error.message || 'Could not add designation.'}</Notification>);
        } finally {
            setIsSubmitting(false); setMasterLoadingStatus('idle');
        }
    }, [closeAddDrawer /*, dispatch */]);

    const openEditDrawer = useCallback((item: DesignationItem) => {
        setEditingItem(item);
        editFormMethods.reset({ name: item.name }); // Use reset for better form state handling
        setIsEditDrawerOpen(true);
    }, [editFormMethods]);
    const closeEditDrawer = useCallback(() => { setEditingItem(null); editFormMethods.reset({ name: '' }); setIsEditDrawerOpen(false); }, [editFormMethods]);

    const onEditDesignationSubmit = useCallback(async (data: DesignationFormData) => {
        if (!editingItem?.id) { /* ... error toast ... */ return; }
        setIsSubmitting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API
        try {
            // await dispatch(editDesignationAction({ id: editingItem.id, name: data.name })).unwrap(); // Redux
            const updatedDesignation: DesignationItem = { id: editingItem.id, name: data.name };
            setDesignationsData(prev => prev.map(d => d.id === updatedDesignation.id ? updatedDesignation : d)); // Local state update

            toast.push(<Notification title="Designation Updated" type="success" duration={2000}>{`Designation "${data.name}" updated.`}</Notification>);
            closeEditDrawer();
            // dispatch(getDesignationsAction()); // Redux: Refresh list
        } catch (error: any) {
            toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{error.message || 'Could not update designation.'}</Notification>);
        } finally {
            setIsSubmitting(false); setMasterLoadingStatus('idle');
        }
    }, [editingItem, closeEditDrawer /*, dispatch */]);

    const handleDeleteClick = useCallback((item: DesignationItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
    const onConfirmSingleDelete = useCallback(async () => {
        if (!itemToDelete?.id) { /* ... error toast ... */ return; }
        setIsDeleting(true); setMasterLoadingStatus('loading'); setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API
        try {
            // await dispatch(deleteDesignationAction({ id: itemToDelete.id })).unwrap(); // Redux
            setDesignationsData(prev => prev.filter(d => d.id !== itemToDelete.id)); // Local state update

            toast.push(<Notification title="Designation Deleted" type="success" duration={2000}>{`Designation "${itemToDelete.name}" deleted.`}</Notification>);
            setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
            // dispatch(getDesignationsAction()); // Redux: Refresh list
        } catch (error: any) {
            toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || 'Could not delete designation.'}</Notification>);
        } finally {
            setIsDeleting(false); setMasterLoadingStatus('idle'); setItemToDelete(null);
        }
    }, [itemToDelete /*, dispatch */]);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) { /* ... info toast ... */ return; }
        setIsDeleting(true); setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
        try {
            const idsToDelete = selectedItems.map((item) => item.id);
            // await dispatch(deleteAllDesignationsAction({ ids: idsToDelete.join(',') })).unwrap(); // Redux
            setDesignationsData(prev => prev.filter(d => !idsToDelete.includes(d.id))); // Local state update

            toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${selectedItems.length} designation(s) deleted.`}</Notification>);
            setSelectedItems([]);
            // dispatch(getDesignationsAction()); // Redux: Refresh list
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || 'Failed to delete selected designations.'}</Notification>);
        } finally {
            setIsDeleting(false); setMasterLoadingStatus('idle');
        }
    }, [selectedItems /*, dispatch */]);

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

    const designationNameOptions = useMemo(() => {
        if (!Array.isArray(designationsData)) return [];
        const uniqueNames = new Set(designationsData.map((item) => item.name));
        return Array.from(uniqueNames).map((name) => ({ value: name, label: name, }));
    }, [designationsData]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: DesignationItem[] = Array.isArray(designationsData) ? designationsData : [];
        let processedData: DesignationItem[] = cloneDeep(sourceData);
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
                const aValue = String(a[key as keyof DesignationItem] ?? '');
                const bValue = String(b[key as keyof DesignationItem] ?? '');
                return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            });
        }
        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [designationsData, tableData, filterCriteria]);

    const handleExportData = useCallback(() => {
        const success = exportDesignationsToCsv('designations_export.csv', allFilteredAndSortedData);
        if (success) toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported.</Notification>);
    }, [allFilteredAndSortedData]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: DesignationItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<DesignationItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

    const columns: ColumnDef<DesignationItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
            { header: 'Designation Name', accessorKey: 'name', enableSorting: true },
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
                        <h3 className="mb-2 sm:mb-0 flex items-center gap-2"><TbBriefcase /> Designations</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
                    </div>
                    <DesignationsTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <div className="mt-4">
                        <DesignationsTable
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

            <DesignationsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

            <Drawer title="Add Designation" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="addDesignationForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <Form id="addDesignationForm" onSubmit={addFormMethods.handleSubmit(onAddDesignationSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Designation Name" invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message}>
                        <Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Designation Name" />} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Edit Designation" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="editDesignationForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <Form id="editDesignationForm" onSubmit={editFormMethods.handleSubmit(onEditDesignationSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Designation Name" invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message}>
                        <Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Designation Name" />} />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer title="Filter Designations" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button>
                        <Button size="sm" variant="solid" form="filterDesignationForm" type="submit">Apply</Button>
                    </div>
                }
            >
                <Form id="filterDesignationForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Designation Name(s)">
                        <Controller name="filterNames" control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select isMulti placeholder="Select designation names..." options={designationNameOptions}
                                        value={field.value || []} onChange={(selectedVal) => field.onChange(selectedVal || [])} />
                            )} />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Designation"
                onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
                onConfirm={onConfirmSingleDelete} loading={isDeleting}
            >
                <p>Are you sure you want to delete the designation "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};

export default DesignationListing;