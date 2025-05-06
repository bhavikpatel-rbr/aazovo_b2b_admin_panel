import { useState, useMemo, useCallback, useEffect } from 'react';
// Removed Avatar import as it wasn't used in the table logic
// import Tag from '@/components/ui/Tag'; // Keep if status column is re-added
import Tooltip from '@/components/ui/Tooltip';
import DataTable from '@/components/shared/DataTable';
// Removed Link import as it wasn't used
// import { Link, useNavigate } from 'react-router-dom'; // Keep useNavigate if needed elsewhere
import cloneDeep from 'lodash/cloneDeep';
import { TbPencil, TbTrash } from 'react-icons/tb'; // Removed unused icons
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';
import { useAppDispatch, RootState } from '@/reduxtool/store'; // Import RootState if needed for useSelector typing
import { useSelector } from 'react-redux';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { deletUnitAction, getUnitAction } from '@/reduxtool/master/middleware';
import { Button, Dialog } from '@/components/ui';
import FormListActionTools from './FormBuilderActionTools'; // Keep this for the Add/Edit modal

// --- Define Form Type (MUST match your Redux unitData structure) ---
export type FormItem = {
    id: string;
    name: string; // *** IMPORTANT: Assumed 'name'. Change to 'unitName' if that's the actual property in Redux ***
    // status?: 'active' | 'inactive'; // Optional: Add if status exists in Redux data
    [key: string]: any; // Allow other properties if needed for sorting/filtering
};
// --- End Form Type Definition ---

// Optional: If you re-add the status column
// const statusColor: Record<string, string> = {
//     active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
//     inactive: 'bg-amber-200 dark:bg-amber-200 text-gray-900 dark:text-gray-900',
// }

// --- ActionColumn Component (Simplified - Remove unused props) ---
const ActionColumn = ({
    onEdit,
    onDelete, // Renamed for clarity
}: {
    onEdit: () => void;
    onDelete: () => void;
}) => {
    return (
        <div className="flex items-center justify-end gap-3">
            {' '}
            {/* Align actions to end */}
            {/* <Tooltip title="Clone Form">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
                    role="button"
                    onClick={onClone}
                >
                    <TbCopy />
                </div>
            </Tooltip> */}
            {/* <Tooltip title="Change Status">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
                    role="button"
                    onClick={onChangeStatus}
                >
                    <TbSwitchHorizontal />
                </div>
            </Tooltip> */}
            <Tooltip title="Edit">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
                    role="button"
                    onClick={onDelete}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    );
};

// --- REMOVED initialDummyForms ---

const FormListTable = () => {
    // const navigate = useNavigate(); // Keep if navigation is needed
    const dispatch = useAppDispatch();

    // --- Select Redux State ---
    // Adjust selector based on your slice structure (e.g., state.master.units, state.master.status)
    const { unitData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector);
    // const masterLoadingStatus = useSelector((state: RootState) => state.master.status); // Alternative if status is separate

    // Determine loading state from Redux status ('pending', 'loading', etc.)
    const isLoading = masterLoadingStatus === 'pending' || masterLoadingStatus === 'loading';

    // --- Local State ---
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isOpenEdit, setIsOpenEdit] = useState(false);
    const [editData, setEditData] = useState<FormItem | null>(null);

    // State for table controls ONLY (sorting, pagination, search query)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '', // Query managed here, updated by FormListTableTools
    });
    const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]); // Store only IDs

    // --- Fetch data on mount ---
    useEffect(() => {
        dispatch(getUnitAction());
    }, [dispatch]);

    

    // --- Memoized processing of REDUX data for filtering, sorting, pagination ---
    const { pageData, total } = useMemo(() => {

        
        console.log('[Memo] Running. Query:', tableData.query, 'UnitData length:', unitData.length);
    
        // Ensure unitData is an array before proceeding
        const dataToProcess = Array.isArray(unitData) ? unitData : [];
        let filteredData: FormItem[] = [...dataToProcess];
        console.log('[Memo] Checkpoint 1: Running useMemo. Query:', tableData.query, 'Data length:', dataToProcess.length);
        if (tableData.query && dataToProcess.length > 0) {
            const query = tableData.query.toLowerCase();
            console.log('[Memo] Filtering with query:', query);

            
    
            filteredData = dataToProcess.filter((item: FormItem) => {
                // --- ADD .trim() ---
                const itemNameLower = item.name?.trim().toLowerCase() ?? '';
                const itemIdString = String(item.id ?? '').trim(); // Trim ID string too
                // --- END ADD ---
            
                const itemIdLower = itemIdString.toLowerCase();
                const query = tableData.query.toLowerCase(); // Query likely doesn't need trim, but doesn't hurt
            
                const nameMatch = itemNameLower.includes(query);
                const idMatch = itemIdLower.includes(query);
            
                // (Keep the console.logs uncommented for now)
                console.log(`[Filter] Item ID: ${item.id}, Item Name: ${item.name}`);
                console.log(`         Query: ${query}`);
                console.log(`         ID Lower (trimmed): ${itemIdLower}, Name Lower (trimmed): ${itemNameLower}`);
                console.log(`         ID Match: ${idMatch}, Name Match: ${nameMatch}`);
            
            
                return idMatch || nameMatch;
            });
            console.log('[Memo] Filtered Data Length:', filteredData.length);
        } else {
            console.log('[Memo] Skipping filtering (no query or no data).');
        }
    
        // --- Sorting (Should be working, but keep it) ---
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && filteredData.length > 0) { // Check filteredData length
            const sortedData = [...filteredData]; // Sort the filtered data
            sortedData.sort((a, b) => {
                 // Safely access properties
                const aValue = a[key as keyof FormItem] ?? '';
                const bValue = b[key as keyof FormItem] ?? '';
    
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return order === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });
            filteredData = sortedData; // Update filteredData with sorted version
        }
    
        // --- Pagination (On the result of filtering and sorting) ---
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const dataTotal = filteredData.length; // Total is length of filtered (and potentially sorted) data
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = filteredData.slice(
            startIndex,
            startIndex + pageSize,
        );
    
        console.log('[Memo] Returning PageData Length:', dataForPage.length, 'Total:', dataTotal);
        return { pageData: dataForPage, total: dataTotal };
    }, [unitData, tableData]); // Dependencies are correct

    // --- Action Handlers ---
    const handleEdit = (form: FormItem) => {
        setEditData(form);
        setIsOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setIsOpenEdit(false);
        setEditData(null);
    };

    const openDeleteConfirmation = (id: string) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteConfirmation = () => {
        setDeleteId(null);
        setIsDeleteDialogOpen(false);
    };

    const handleDeleteConfirm = () => {
        if (deleteId) {
            // Consider adding loading state specifically for delete
            dispatch(deletUnitAction({ id: deleteId })).finally(() => {
                closeDeleteConfirmation(); // Close dialog regardless of outcome for now
            });
        }
    };
    // --- End Action Handlers ---

    // --- Columns Definition ---
    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
            },
            {
                header: 'Unit Name',
                // *** IMPORTANT: Ensure 'name' matches your Redux data property. If it's 'unitName', change here. ***
                accessorKey: 'name',
                enableSorting: true,
            },
            // { // Optional Status Column
            //     header: 'Status',
            //     accessorKey: 'status',
            //     enableSorting: true,
            //     cell: (props) => { ... } // Add cell renderer if needed
            // },
            {
                header: '', // Keep header empty for actions
                id: 'action',
                meta: { HeaderClass : "text-center" } ,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => openDeleteConfirmation(props.row.original.id)}
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // Dependencies for handlers (handleEdit, open...) are stable
    );
    // --- End Columns Definition ---

    // --- Table Interaction Handlers ---
    // Helper to update parts of tableData state
    const handleSetTableData = useCallback((update: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...update }));
    }, []); // No dependency needed

    const handlePaginationChange = useCallback(
        (page: number) => {
            handleSetTableData({ pageIndex: page });
        },
        [handleSetTableData],
    );

    const handleSelectChange = useCallback(
        (value: number) => {
            // Reset to page 1 when page size changes
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
        },
        [handleSetTableData],
    );

    const handleSort = useCallback(
        (sort: OnSortParam) => {
            // Reset to page 1 when sorting changes
            handleSetTableData({ sort: sort, pageIndex: 1 });
        },
        [handleSetTableData],
    );

    // --- Search Handler (to be called by FormListTableTools/FormListSearch) ---
    const handleSearch = useCallback(
        (query: string) => {
            // Reset to page 1 when search query changes
            handleSetTableData({ query: query, pageIndex: 1 });
        },
        [handleSetTableData],
    );
    // --- End Search Handler ---

    // --- Selection Handlers ---
    const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
        setSelectedFormIds((prev) => {
            if (checked) {
                return prev.includes(row.id) ? prev : [...prev, row.id];
            } else {
                return prev.filter((id) => id !== row.id);
            }
        });
    }, []);

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<FormItem>[]) => {
            if (checked) {
                const ids = rows.map((row) => row.original.id);
                setSelectedFormIds(ids);
            } else {
                setSelectedFormIds([]);
            }
        },
        [],
    );
    // --- End Selection Handlers ---

    // Note: We need to pass handleSearch down to FormListTableTools
    // This requires modifying Units.tsx and FormListTableTools.tsx

    return (
        <>
            {/* DataTable uses the calculated pageData and total */}
            <DataTable
                selectable
                columns={columns}
                data={pageData} // <-- USE MEMOIZED pageData
                loading={isLoading} // <-- USE REDUX loading state
                noData={!isLoading && total === 0} // <-- Check total AFTER filtering
                pagingData={{
                    total: total, // <-- USE MEMOIZED total (count AFTER filtering)
                    pageIndex: tableData.pageIndex as number,
                    pageSize: tableData.pageSize as number,
                }}
                checkboxChecked={(row) => selectedFormIds.includes(row.id)}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
                onCheckBoxChange={handleRowSelect}
                onIndeterminateCheckBoxChange={handleAllRowSelect}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={closeDeleteConfirmation}
                closable={false}
                width={400}
            >
                <h5 className="mb-4">Confirm Deletion</h5>
                <p className="mb-6">Are you sure you want to delete this unit?</p>
                <div className="text-right">
                    <Button size="sm" className="me-2" onClick={closeDeleteConfirmation}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        color="red"
                        onClick={handleDeleteConfirm}
                    >
                        Delete
                    </Button>
                </div>
            </Dialog>

            {/* Add/Edit Modal Component */}
            {/* This component receives edit data and callbacks */}
            <FormListActionTools
                isEdit={isOpenEdit}
                isOpenEdit={isOpenEdit} // Controls visibility based on state here
                editData={editData}
                handleCloseEdit={handleCloseEdit}
            />
        </>
    );
};

export default FormListTable;