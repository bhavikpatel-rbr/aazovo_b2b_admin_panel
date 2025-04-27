// src/views/your-path/WallListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Avatar from '@/components/ui/Avatar'; // For Product image/icon placeholder
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast'; // Ensure toast is configured
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import { TbClipboardList, TbBox } from 'react-icons/tb'; // Placeholder icons

// Icons
import {
    TbPencil,
    TbCopy, // Keep clone if needed
    TbSwitchHorizontal, // For status change
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus, // Generic add icon
} from 'react-icons/tb';

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable';
import type { TableQueries } from '@/@types/common';

// --- Define Item Type (Table Row Data) ---
export type WallItem = {
    id: string; // Unique ID for the wall record
    status: 'pending' | 'approved' | 'rejected' | 'completed'; // Overall status of the request/entry
    productName: string;
    productImage: string | null; // Added for better visualization
    productSpecs: string; // Could be size, color, material etc.
    companyId: string;
    memberId: string;
    qty: number;
    productStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'ordered'; // Status of the product itself
    intent: 'purchase' | 'transfer_in' | 'transfer_out' | 'return' | 'adjustment'; // What the action is for
    createdDate: Date;
};
// --- End Item Type Definition ---


// --- Constants ---
const recordStatusColor: Record<WallItem['status'], string> = {
    pending: 'bg-amber-500',
    approved: 'bg-blue-500',
    rejected: 'bg-red-500',
    completed: 'bg-emerald-500',
};

const productStatusColor: Record<WallItem['productStatus'], string> = {
    in_stock: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    low_stock: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
    out_of_stock: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
    ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100',
};


const initialDummyWallItems: WallItem[] = [
    { id: 'WL001', status: 'pending', productName: 'Wireless Mouse MX', productImage: '/img/products/mouse_mx.jpg', productSpecs: 'Black, Ergonomic', companyId: 'C001', memberId: 'M101', qty: 5, productStatus: 'in_stock', intent: 'purchase', createdDate: new Date(2023, 10, 1, 9, 15) },
    { id: 'WL002', status: 'approved', productName: 'Laptop Stand', productImage: null, productSpecs: 'Aluminum, Silver', companyId: 'C002', memberId: 'M102', qty: 2, productStatus: 'in_stock', intent: 'transfer_in', createdDate: new Date(2023, 9, 30, 14, 0) },
    { id: 'WL003', status: 'completed', productName: 'Keyboard K380', productImage: '/img/products/keyboard_k380.jpg', productSpecs: 'White, Multi-Device', companyId: 'C001', memberId: 'M103', qty: 1, productStatus: 'low_stock', intent: 'purchase', createdDate: new Date(2023, 9, 28, 11, 30) },
    { id: 'WL004', status: 'rejected', productName: 'External HDD 2TB', productImage: null, productSpecs: 'USB 3.0, Black', companyId: 'C003', memberId: 'M104', qty: 10, productStatus: 'ordered', intent: 'purchase', createdDate: new Date(2023, 9, 29, 16, 45) },
    { id: 'WL005', status: 'pending', productName: 'Monitor 27" 4K', productImage: '/img/products/monitor_27.jpg', productSpecs: 'IPS, HDR', companyId: 'C002', memberId: 'M101', qty: 1, productStatus: 'out_of_stock', intent: 'purchase', createdDate: new Date(2023, 10, 2, 8, 0) },
    { id: 'WL006', status: 'approved', productName: 'Webcam C920', productImage: '/img/products/webcam_c920.jpg', productSpecs: '1080p, Autofocus', companyId: 'C001', memberId: 'M105', qty: 3, productStatus: 'in_stock', intent: 'transfer_out', createdDate: new Date(2023, 9, 25, 10, 20) },
    { id: 'WL007', status: 'completed', productName: 'Wireless Mouse MX', productImage: '/img/products/mouse_mx.jpg', productSpecs: 'Black, Ergonomic', companyId: 'C003', memberId: 'M102', qty: 1, productStatus: 'in_stock', intent: 'return', createdDate: new Date(2023, 9, 26, 13, 55) },
    { id: 'WL008', status: 'pending', productName: 'Docking Station', productImage: null, productSpecs: 'Thunderbolt 4, 10 ports', companyId: 'C002', memberId: 'M103', qty: 2, productStatus: 'ordered', intent: 'purchase', createdDate: new Date(2023, 10, 1, 15, 10) },
    { id: 'WL009', status: 'approved', productName: 'Laptop Stand', productImage: null, productSpecs: 'Aluminum, Silver', companyId: 'C001', memberId: 'M104', qty: 1, productStatus: 'in_stock', intent: 'adjustment', createdDate: new Date(2023, 9, 27, 17, 5) },
];
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onEdit: () => void;
    onClone?: () => void;
    onChangeStatus: () => void;
    onDelete: () => void;
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';

    return (
        <div className="flex items-center justify-end gap-2">
            {onClone && (
                <Tooltip title="Clone Record">
                    <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400' )} role="button" onClick={onClone} > <TbCopy /> </div>
                </Tooltip>
             )}
            <Tooltip title="Change Status">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400' )} role="button" onClick={onChangeStatus} > <TbSwitchHorizontal /> </div>
            </Tooltip>
            <Tooltip title="Edit Record">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400' )} role="button" onClick={onEdit} > <TbPencil /> </div>
            </Tooltip>
            <Tooltip title="Delete Record">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400' )} role="button" onClick={onDelete} > <TbTrash /> </div>
            </Tooltip>
        </div>
    );
};
// --- End ActionColumn ---


// --- ItemTable Component ---
const ItemTable = ({ // Renamed component
    columns,
    data,
    loading,
    pagingData,
    selectedItems, // Renamed prop
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<WallItem>[];
    data: WallItem[];
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: WallItem[]; // Use new type
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: WallItem) => void; // Use new type
    onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void; // Use new type
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
                selectedItems.some((selected) => selected.id === row.id) // Use selectedItems
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    );
};
// --- End ItemTable ---


// --- ItemSearch Component ---
type ItemSearchProps = { // Renamed component
    onInputChange: (value: string) => void;
    ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Wall Items (Product, ID, Company...)" // Updated placeholder
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        );
    }
);
ItemSearch.displayName = 'ItemSearch';
// --- End ItemSearch ---


// --- ItemTableTools Component ---
const ItemTableTools = ({ // Renamed component
    onSearchChange,
}: {
    onSearchChange: (query: string) => void;
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <ItemSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter button could be added here */}
        </div>
    );
};
// --- End ItemTableTools ---


// --- ItemActionTools Component ---
const ItemActionTools = ({ allItems }: { allItems: WallItem[] }) => { // Renamed prop and component
    const navigate = useNavigate();

    // Prepare data for CSV
    const csvData = useMemo(() => {
        return allItems.map(item => ({
            id: item.id, status: item.status, productName: item.productName,
            productSpecs: item.productSpecs, companyId: item.companyId, memberId: item.memberId,
            qty: item.qty, productStatus: item.productStatus, intent: item.intent,
            createdDate: item.createdDate.toISOString(), // Format date
        }));
    }, [allItems]);

    const csvHeaders = [
        { label: "ID", key: "id" }, { label: "Status", key: "status" }, { label: "Product", key: "productName" },
        { label: "Specs", key: "productSpecs" }, { label: "Company ID", key: "companyId" },
        { label: "Member ID", key: "memberId" }, { label: "Qty", key: "qty" },
        { label: "Product Status", key: "productStatus" }, { label: "Intent", key: "intent" },
        { label: "Created Date", key: "createdDate" },
      ];

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="wall_items.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus className="text-xl" />} // Generic Add
                onClick={() => console.log('Navigate to Add New Wall Item page')}
                // onClick={() => navigate('/wall/create')}
                block
            >
                Add new Item {/* Updated Text */}
            </Button>
        </div>
    );
};
// --- End ItemActionTools ---


// --- ItemSelected Component ---
const ItemSelected = ({ // Renamed component
    selectedItems, // Renamed prop
    setSelectedItems, // Renamed prop
    onDeleteSelected,
}: {
    selectedItems: WallItem[]; // Use new type
    setSelectedItems: React.Dispatch<React.SetStateAction<WallItem[]>>; // Use new type
    onDeleteSelected: () => void;
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };

    if (selectedItems.length === 0) return null;

    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                     <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"> <TbChecks /> </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedItems.length}</span>
                            <span>Item{selectedItems.length > 1 ? 's' : ''} selected</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}> Delete </Button>
                        {/* Add other bulk actions here e.g., Approve/Reject Selected */}
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Item${selectedItems.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} confirmButtonColor="red-600">
                <p>Are you sure you want to delete the selected item{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};
// --- End ItemSelected ---


// --- Main WallListing Component ---
const WallListing = () => { // Renamed Component
    const navigate = useNavigate();

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false);
    const [wallItems, setWallItems] = useState<WallItem[]>(initialDummyWallItems); // Renamed state
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<WallItem[]>([]); // Renamed state
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...wallItems]; // Use wallItems state

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase();
            processedData = processedData.filter(
                (item) =>
                    item.id.toLowerCase().includes(query) ||
                    item.status.toLowerCase().includes(query) ||
                    item.productName.toLowerCase().includes(query) ||
                    item.productSpecs.toLowerCase().includes(query) ||
                    item.companyId.toLowerCase().includes(query) ||
                    item.memberId.toLowerCase().includes(query) ||
                    item.qty.toString().includes(query) || // Search quantity as string
                    item.productStatus.toLowerCase().includes(query) ||
                    item.intent.toLowerCase().includes(query)
            );
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                // Sort by Date
                 if (key === 'createdDate') {
                    const timeA = a.createdDate.getTime();
                    const timeB = b.createdDate.getTime();
                    return order === 'asc' ? timeA - timeB : timeB - timeA;
                }
                // Sort by Quantity (Number)
                if (key === 'qty') {
                    const qtyA = a.qty ?? 0;
                    const qtyB = b.qty ?? 0;
                     return order === 'asc' ? qtyA - qtyB : qtyB - qtyA;
                }

                // Default string sort for other keys
                const aValue = a[key as keyof WallItem] ?? '';
                const bValue = b[key as keyof WallItem] ?? '';
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                return 0; // Fallback
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
    }, [wallItems, tableData]); // Use wallItems state
    // --- End Memoized Data Processing ---


    // --- Lifted Handlers (Update parameter types and state setters) ---
    const handleSetTableData = useCallback((data: TableQueries) => { setTableData(data); }, []);
    const handlePaginationChange = useCallback((page: number) => { handleSetTableData({ ...tableData, pageIndex: page }); }, [tableData, handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ ...tableData, pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [tableData, handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { handleSetTableData({ ...tableData, query: query, pageIndex: 1 }); }, [tableData, handleSetTableData]);

    const handleRowSelect = useCallback((checked: boolean, row: WallItem) => {
        setSelectedItems((prev) => {
            if (checked) { return prev.some((i) => i.id === row.id) ? prev : [...prev, row]; }
            else { return prev.filter((i) => i.id !== row.id); }
        });
    }, [setSelectedItems]);

    const handleAllRowSelect = useCallback((checked: boolean, rows: Row<WallItem>[]) => {
        const rowIds = new Set(rows.map(r => r.original.id));
        if (checked) {
             const originalRows = rows.map((row) => row.original);
             setSelectedItems(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const newSelection = originalRows.filter(i => !existingIds.has(i.id));
                return [...prev, ...newSelection];
             });
        } else {
             setSelectedItems(prev => prev.filter(i => !rowIds.has(i.id)));
        }
    }, [setSelectedItems]);

    const handleEdit = useCallback((item: WallItem) => {
        console.log('Edit item:', item.id);
        // navigate(`/wall/edit/${item.id}`);
    }, [navigate]);

    const handleClone = useCallback((itemToClone: WallItem) => {
        console.log('Cloning item:', itemToClone.id);
        const newId = `WL${Math.floor(Math.random() * 9000) + 1000}`;
        const clonedItem: WallItem = {
            ...itemToClone,
            id: newId,
            status: 'pending', // Cloned items might reset status
            createdDate: new Date(), // Reset date
        };
        setWallItems((prev) => [clonedItem, ...prev]);
        toast.push(<Notification title="Record Cloned" type="success" duration={2000} />);
    }, [setWallItems]);

    const handleChangeStatus = useCallback((item: WallItem) => {
        // Cycle through statuses: pending -> approved -> completed -> rejected -> pending
        const statuses: WallItem['status'][] = ['pending', 'approved', 'completed', 'rejected'];
        const currentStatusIndex = statuses.indexOf(item.status);
        const nextStatusIndex = (currentStatusIndex + 1) % statuses.length;
        const newStatus = statuses[nextStatusIndex];

        console.log(`Changing status of item ${item.id} from ${item.status} to ${newStatus}`);
        setWallItems((currentItems) =>
            currentItems.map((i) =>
                i.id === item.id ? { ...i, status: newStatus } : i
            )
        );
        toast.push(<Notification title="Status Changed" type="success" duration={2000}>{`Record ${item.id} status changed to ${newStatus}.`}</Notification>);
    }, [setWallItems]);

    const handleDelete = useCallback((itemToDelete: WallItem) => {
        console.log('Deleting item:', itemToDelete.id);
        setWallItems((currentItems) => currentItems.filter((item) => item.id !== itemToDelete.id));
        setSelectedItems((prevSelected) => prevSelected.filter((item) => item.id !== itemToDelete.id));
        toast.push(<Notification title="Record Deleted" type="success" duration={2000}>{`Record ${itemToDelete.id} deleted.`}</Notification>);
    }, [setWallItems, setSelectedItems]);

     const handleDeleteSelected = useCallback(() => {
        console.log('Deleting selected items:', selectedItems.map(i => i.id));
        const selectedIds = new Set(selectedItems.map(i => i.id));
        setWallItems(currentItems => currentItems.filter(i => !selectedIds.has(i.id)));
        setSelectedItems([]);
        toast.push(<Notification title="Records Deleted" type="success" duration={2000}>{`${selectedIds.size} record(s) deleted.`}</Notification>);
    }, [selectedItems, setWallItems, setSelectedItems]);
    // --- End Lifted Handlers ---


    // --- Define Columns in Parent ---
    const columns: ColumnDef<WallItem>[] = useMemo(
        () => [
            // { header: 'ID', accessorKey: 'id', enableSorting: true, width: 100 },
            {
                header: 'Status', accessorKey: 'status', enableSorting: true, width: 120,
                cell: props => {
                    const { status } = props.row.original;
                    return ( <Tag className={`${recordStatusColor[status]} text-white capitalize`}>{status}</Tag> );
                }
            },
             {
                header: 'Product', accessorKey: 'productName', enableSorting: true,
                cell: props => {
                     const { productName, productImage } = props.row.original;
                     return (
                         <div className="flex items-center gap-2">
                             <Avatar size={30} shape="square" src={productImage} icon={<TbBox />} />
                             <span className="font-semibold">{productName}</span>
                         </div>
                     )
                 }
            },
            { header: 'Specs', accessorKey: 'productSpecs', enableSorting: false, width: 150 }, // Might not need sorting
            { header: 'Company ID', accessorKey: 'companyId', enableSorting: true, width: 120 },
            { header: 'Member ID', accessorKey: 'memberId', enableSorting: true, width: 120 },
            { header: 'Qty', accessorKey: 'qty', enableSorting: true, width: 80 },
             {
                header: 'Product Status', accessorKey: 'productStatus', enableSorting: true, width: 140,
                cell: props => {
                    const { productStatus } = props.row.original;
                    // Replace underscores with spaces and capitalize for display
                    const displayStatus = productStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return ( <Tag className={`${productStatusColor[productStatus]} font-semibold`}>{displayStatus}</Tag> );
                }
            },
             {
                header: 'Intent', accessorKey: 'intent', enableSorting: true, width: 130,
                 cell: props => {
                     // Replace underscores with spaces and capitalize for display
                     const displayIntent = props.row.original.intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                     return <span>{displayIntent}</span>;
                 }
             },
            {
                header: 'Created Date', accessorKey: 'createdDate', enableSorting: true, width: 180,
                cell: props => {
                    const date = props.row.original.createdDate;
                    return <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>;
                }
            },
            {
                header: '', id: 'action', width: 130,
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
        [handleClone, handleChangeStatus, handleEdit, handleDelete] // Dependencies
    );
    // --- End Define Columns ---


    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Wall Listing</h3> {/* Updated title */}
                    <ItemActionTools allItems={wallItems} />
                </div>

                {/* Tools Section */}
                <div className="mb-4">
                    <ItemTableTools onSearchChange={handleSearchChange} />
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <ItemTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                        selectedItems={selectedItems}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <ItemSelected
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    );
};
// --- End Main Component ---

export default WallListing; // Updated export name

// Helper Function
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}