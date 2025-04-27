// src/views/your-path/LeadsListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';
import classNames from 'classnames'; // Ensure classnames is imported or helper is defined

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Avatar from '@/components/ui/Avatar'; // For Product image placeholder
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast'; // Ensure toast is configured
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StickyFooter from '@/components/shared/StickyFooter';
import DebouceInput from '@/components/shared/DebouceInput';
import { TbBox, TbFileText, TbCurrencyDollar } from 'react-icons/tb'; // Placeholder icons

// Icons
import {
    TbPencil,
    // TbCopy, // Clone might not be typical for leads
    // TbSwitchHorizontal, // Status change might be complex, handled differently
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
export type LeadItem = {
    id: string; // Unique Lead ID / Lead Number
    status: 'new' | 'contacted' | 'qualified' | 'lost' | 'won' | 'follow_up'; // Lead lifecycle statuses
    enquiryType: 'product_info' | 'quote_request' | 'demo_request' | 'support' | 'partnership' | 'other';
    leadNumber: string; // Explicit lead number field
    productName: string | null; // Product of interest
    productImage?: string | null; // Optional product image
    memberId: string; // ID of the lead/member
    intent: 'buy' | 'sell' | 'inquire' | 'partner'; // Lead's primary goal
    qty: number | null;
    targetPrice: number | null; // Target price if applicable
    salesPerson: string | null; // Assigned sales representative
    createdDate: Date;
};
// --- End Item Type Definition ---


// --- Constants ---
const leadStatusColor: Record<LeadItem['status'], string> = {
    new: 'bg-blue-500',
    contacted: 'bg-cyan-500',
    qualified: 'bg-indigo-500',
    follow_up: 'bg-amber-500',
    won: 'bg-emerald-500',
    lost: 'bg-red-500',
};

// Optional: Colors for enquiry types or intents
const enquiryTypeTagColor: Record<LeadItem['enquiryType'], string> = {
    product_info: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100',
    quote_request: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100',
    demo_request: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100',
    support: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
    partnership: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100',
};


const initialDummyLeads: LeadItem[] = [
    { id: 'LEAD-001', status: 'new', enquiryType: 'quote_request', leadNumber: 'L20231101', productName: 'Gaming Laptop RTX 4070', productImage: '/img/products/laptop_gaming.jpg', memberId: 'BuyerA', intent: 'buy', qty: 1, targetPrice: 1800, salesPerson: null, createdDate: new Date(2023, 10, 1, 9, 30) },
    { id: 'LEAD-002', status: 'contacted', enquiryType: 'product_info', leadNumber: 'L20231101-2', productName: 'Wireless Mouse MX', productImage: '/img/products/mouse_mx.jpg', memberId: 'BuyerB', intent: 'inquire', qty: 2, targetPrice: null, salesPerson: 'John Doe', createdDate: new Date(2023, 10, 1, 11, 0) },
    { id: 'LEAD-003', status: 'qualified', enquiryType: 'demo_request', leadNumber: 'L20231030', productName: 'CRM Software Suite', productImage: null, memberId: 'CompanyC', intent: 'buy', qty: 1, targetPrice: 5000, salesPerson: 'Jane Smith', createdDate: new Date(2023, 9, 30, 14, 15) },
    { id: 'LEAD-004', status: 'follow_up', enquiryType: 'quote_request', leadNumber: 'L20231029', productName: 'Office Chair Ergonomic', productImage: null, memberId: 'BuyerD', intent: 'buy', qty: 10, targetPrice: 150, salesPerson: 'John Doe', createdDate: new Date(2023, 9, 29, 10, 0) },
    { id: 'LEAD-005', status: 'won', enquiryType: 'product_info', leadNumber: 'L20230915', productName: 'Bulk USB Cables', productImage: null, memberId: 'CompanyE', intent: 'buy', qty: 500, targetPrice: 0.8, salesPerson: 'Jane Smith', createdDate: new Date(2023, 8, 15, 16, 45) },
    { id: 'LEAD-006', status: 'lost', enquiryType: 'quote_request', leadNumber: 'L20230910', productName: 'Custom Server Rack', productImage: null, memberId: 'CompanyF', intent: 'buy', qty: 1, targetPrice: 2500, salesPerson: 'Peter Jones', createdDate: new Date(2023, 8, 10, 13, 20) },
    { id: 'LEAD-007', status: 'new', enquiryType: 'partnership', leadNumber: 'L20231102', productName: null, productImage: null, memberId: 'PartnerG', intent: 'partner', qty: null, targetPrice: null, salesPerson: null, createdDate: new Date(2023, 10, 2, 15, 0) },
    { id: 'LEAD-008', status: 'contacted', enquiryType: 'support', leadNumber: 'L20231028', productName: 'Laptop Pro 15"', productImage: '/img/products/laptop_pro.jpg', memberId: 'BuyerH', intent: 'inquire', qty: null, targetPrice: null, salesPerson: 'Support Team', createdDate: new Date(2023, 9, 28, 9, 55) },
];
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    // onClone removed for leads
    // onChangeStatus removed for leads (handled differently)
    onDelete,
}: {
    onEdit: () => void;
    // onClone?: () => void;
    // onChangeStatus?: () => void;
    onDelete: () => void;
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';

    return (
        <div className="flex items-center justify-end gap-2">
            {/* Edit Button */}
            <Tooltip title="Edit Lead">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400' )} role="button" onClick={onEdit} > <TbPencil /> </div>
            </Tooltip>
             {/* Delete Button */}
            <Tooltip title="Delete Lead">
                <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400' )} role="button" onClick={onDelete} > <TbTrash /> </div>
            </Tooltip>
             {/* Add other relevant lead actions here e.g., Assign, Convert */}
        </div>
    );
};
// --- End ActionColumn ---


// --- LeadTable Component ---
const LeadTable = ({ // Renamed component
    columns,
    data,
    loading,
    pagingData,
    selectedLeads, // Renamed prop
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<LeadItem>[];
    data: LeadItem[];
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedLeads: LeadItem[]; // Use new type
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: LeadItem) => void; // Use new type
    onAllRowSelect: (checked: boolean, rows: Row<LeadItem>[]) => void; // Use new type
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
                selectedLeads.some((selected) => selected.id === row.id) // Use selectedLeads
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    );
};
// --- End LeadTable ---


// --- LeadSearch Component ---
type LeadSearchProps = { // Renamed component
    onInputChange: (value: string) => void;
    ref?: Ref<HTMLInputElement>;
};
const LeadSearch = React.forwardRef<HTMLInputElement, LeadSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Leads (Number, Product, Member, Sales...)" // Updated placeholder
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        );
    }
);
LeadSearch.displayName = 'LeadSearch';
// --- End LeadSearch ---


// --- LeadTableTools Component ---
const LeadTableTools = ({ // Renamed component
    onSearchChange,
}: {
    onSearchChange: (query: string) => void;
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <LeadSearch onInputChange={onSearchChange} />
            </div>
            {/* Add Filter button here if needed */}
        </div>
    );
};
// --- End LeadTableTools ---


// --- LeadActionTools Component ---
const LeadActionTools = ({ allLeads }: { allLeads: LeadItem[] }) => { // Renamed prop and component
    const navigate = useNavigate();

    // Prepare data for CSV
    const csvData = useMemo(() => {
        return allLeads.map(item => ({
             id: item.id, status: item.status, enquiryType: item.enquiryType, leadNumber: item.leadNumber,
             productName: item.productName ?? 'N/A', memberId: item.memberId, intent: item.intent,
             qty: item.qty ?? '', targetPrice: item.targetPrice ?? '', // Handle null numbers for CSV
             salesPerson: item.salesPerson ?? 'Unassigned', createdDate: item.createdDate.toISOString(),
        }));
    }, [allLeads]);

    const csvHeaders = [
        { label: "Lead ID", key: "id" }, { label: "Status", key: "status" },
        { label: "Enquiry Type", key: "enquiryType" }, { label: "Lead Number", key: "leadNumber" },
        { label: "Product", key: "productName" }, { label: "Member ID", key: "memberId" },
        { label: "Intent", key: "intent" }, { label: "Qty", key: "qty" },
        { label: "Target Price", key: "targetPrice" }, { label: "Sales Person", key: "salesPerson" },
        { label: "Created Date", key: "createdDate" },
      ];

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="leads.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus className="text-xl" />}
                onClick={() => console.log('Navigate to Add New Lead page')}
                // onClick={() => navigate('/leads/create')}
                block
            >
                Add new Lead {/* Updated Text */}
            </Button>
        </div>
    );
};
// --- End LeadActionTools ---


// --- LeadSelected Component ---
const LeadSelected = ({ // Renamed component
    selectedLeads, // Renamed prop
    setSelectedLeads, // Renamed prop
    onDeleteSelected,
}: {
    selectedLeads: LeadItem[]; // Use new type
    setSelectedLeads: React.Dispatch<React.SetStateAction<LeadItem[]>>; // Use new type
    onDeleteSelected: () => void;
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const handleDeleteClick = () => setDeleteConfirmationOpen(true);
    const handleCancelDelete = () => setDeleteConfirmationOpen(false);
    const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };

    if (selectedLeads.length === 0) return null;

    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                     <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"> <TbChecks /> </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">{selectedLeads.length}</span> {/* Use selectedLeads */}
                            <span>Lead{selectedLeads.length > 1 ? 's' : ''} selected</span> {/* Updated text */}
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}> Delete </Button>
                         {/* Add other bulk lead actions: Assign, Change Status, etc. */}
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} confirmButtonColor="red-600">
                <p>Are you sure you want to delete the selected lead{selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    );
};
// --- End LeadSelected ---


// --- Main Leads Component ---
const Leads = () => { // Renamed Component
    const navigate = useNavigate();

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false);
    const [leads, setLeads] = useState<LeadItem[]>(initialDummyLeads); // Renamed state
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedLeads, setSelectedLeads] = useState<LeadItem[]>([]); // Renamed state
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...leads]; // Use leads state

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase();
            processedData = processedData.filter(
                (lead) =>
                    lead.id.toLowerCase().includes(query) ||
                    lead.status.toLowerCase().includes(query) ||
                    lead.enquiryType.toLowerCase().includes(query) ||
                    lead.leadNumber.toLowerCase().includes(query) ||
                    (lead.productName?.toLowerCase().includes(query) ?? false) ||
                    lead.memberId.toLowerCase().includes(query) ||
                    lead.intent.toLowerCase().includes(query) ||
                    (lead.salesPerson?.toLowerCase().includes(query) ?? false)
            );
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            const sortedData = [...processedData];
            sortedData.sort((a, b) => {
                 if (key === 'createdDate') {
                    const timeA = a.createdDate.getTime(); const timeB = b.createdDate.getTime();
                    return order === 'asc' ? timeA - timeB : timeB - timeA;
                }
                if (key === 'qty' || key === 'targetPrice') { // Handle number sorting
                    const numA = a[key] ?? (order === 'asc' ? Infinity : -Infinity); // Handle nulls based on sort order
                    const numB = b[key] ?? (order === 'asc' ? Infinity : -Infinity);
                     return order === 'asc' ? numA - numB : numB - numA;
                }
                 // Handle nulls for productName, salesPerson
                 if (key === 'productName' || key === 'salesPerson') {
                     const aValue = a[key] ?? ''; const bValue = b[key] ?? '';
                     if (aValue === null && bValue === null) return 0;
                     if (aValue === null) return order === 'asc' ? -1 : 1;
                     if (bValue === null) return order === 'asc' ? 1 : -1;
                     return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                 }

                // Default string sort
                const aValue = a[key as keyof LeadItem] ?? '';
                const bValue = b[key as keyof LeadItem] ?? '';
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                return 0;
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
    }, [leads, tableData]); // Use leads state
    // --- End Memoized Data Processing ---


    // --- Lifted Handlers (Update parameter types and state setters) ---
    const handleSetTableData = useCallback((data: TableQueries) => { setTableData(data); }, []);
    const handlePaginationChange = useCallback((page: number) => { handleSetTableData({ ...tableData, pageIndex: page }); }, [tableData, handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ ...tableData, pageSize: Number(value), pageIndex: 1 }); setSelectedLeads([]); }, [tableData, handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 }); }, [tableData, handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { handleSetTableData({ ...tableData, query: query, pageIndex: 1 }); }, [tableData, handleSetTableData]);

    const handleRowSelect = useCallback((checked: boolean, row: LeadItem) => {
        setSelectedLeads((prev) => {
            if (checked) { return prev.some((i) => i.id === row.id) ? prev : [...prev, row]; }
            else { return prev.filter((i) => i.id !== row.id); }
        });
    }, [setSelectedLeads]);

    const handleAllRowSelect = useCallback((checked: boolean, rows: Row<LeadItem>[]) => {
        const rowIds = new Set(rows.map(r => r.original.id));
         setSelectedLeads(prev => {
             if (checked) {
                 const originalRows = rows.map((row) => row.original);
                 const existingIds = new Set(prev.map(i => i.id));
                 const newSelection = originalRows.filter(i => !existingIds.has(i.id));
                 return [...prev, ...newSelection];
             } else {
                 return prev.filter(i => !rowIds.has(i.id));
             }
         });
    }, [setSelectedLeads]);

    const handleEdit = useCallback((lead: LeadItem) => {
        console.log('Edit lead:', lead.id);
        navigate(`/leads/edit/${lead.id}`); // Adjust route
    }, [navigate]);

    // Removed handleClone for leads

    // Removed handleChangeStatus for leads (would likely involve a modal/dropdown)

    const handleDelete = useCallback((leadToDelete: LeadItem) => {
        console.log('Deleting lead:', leadToDelete.id);
        setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== leadToDelete.id));
        setSelectedLeads((prevSelected) => prevSelected.filter((lead) => lead.id !== leadToDelete.id));
        toast.push(<Notification title="Lead Deleted" type="success" duration={2000}>{`Lead ${leadToDelete.leadNumber} deleted.`}</Notification>);
    }, [setLeads, setSelectedLeads]);

     const handleDeleteSelected = useCallback(() => {
        console.log('Deleting selected leads:', selectedLeads.map(i => i.id));
        const selectedIds = new Set(selectedLeads.map(i => i.id));
        setLeads(currentLeads => currentLeads.filter(i => !selectedIds.has(i.id)));
        setSelectedLeads([]);
        toast.push(<Notification title="Leads Deleted" type="success" duration={2000}>{`${selectedIds.size} lead(s) deleted.`}</Notification>);
    }, [selectedLeads, setLeads, setSelectedLeads]);
    // --- End Lifted Handlers ---


    // --- Define Columns in Parent ---
    const columns: ColumnDef<LeadItem>[] = useMemo(
        () => [
            {
                header: 'Status', accessorKey: 'status', enableSorting: true, width: 120,
                cell: props => { const { status } = props.row.original; return ( <Tag className={`${leadStatusColor[status]} text-white capitalize`}>{status}</Tag> ); }
            },
            {
                header: 'Enquiry Type', accessorKey: 'enquiryType', enableSorting: true, width: 150,
                cell: props => {
                     const { enquiryType } = props.row.original;
                     const displayType = enquiryType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                     return ( <Tag className={`${enquiryTypeTagColor[enquiryType]} font-semibold border ${enquiryTypeTagColor[enquiryType].replace('bg-', 'border-').replace('/20', '')}`}>{displayType}</Tag> );
                }
            },
            { header: 'Lead Number', accessorKey: 'leadNumber', enableSorting: true, width: 150 },
             {
                header: 'Product', accessorKey: 'productName', enableSorting: true,
                cell: props => {
                     const { productName, productImage } = props.row.original;
                     return productName ? (
                         <div className="flex items-center gap-2">
                             <Avatar size={30} shape="square" src={productImage} icon={<TbBox />} />
                             <span className="font-semibold">{productName}</span>
                         </div>
                     ) : (<span>-</span>)
                 }
            },
            { header: 'Member ID', accessorKey: 'memberId', enableSorting: true, width: 120 },
            {
                header: 'Intent', accessorKey: 'intent', enableSorting: true, width: 100,
                 cell: props => {
                     const displayIntent = props.row.original.intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                     return <span>{displayIntent}</span>;
                 }
             },
            { header: 'Qty', accessorKey: 'qty', enableSorting: true, width: 80, cell: props => <span>{props.row.original.qty ?? '-'}</span> },
            {
                header: 'Target Price', accessorKey: 'targetPrice', enableSorting: true, width: 120,
                cell: props => {
                    const price = props.row.original.targetPrice;
                    // Basic currency formatting (adapt as needed)
                    return <span>{price !== null ? `$${price.toFixed(2)}` : '-'}</span>;
                 }
             },
             {
                 header: 'Sales Person', accessorKey: 'salesPerson', enableSorting: true, width: 150,
                 cell: props => <span>{props.row.original.salesPerson ?? 'Unassigned'}</span>
            },
            {
                header: 'Created Date', accessorKey: 'createdDate', enableSorting: true, width: 180,
                cell: props => { const date = props.row.original.createdDate; return <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>; }
            },
            {
                header: '', id: 'action', width: 100, // Adjusted width for fewer actions
                cell: (props) => (
                    <ActionColumn
                        // Pass only relevant actions
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        // Update dependencies
        [handleEdit, handleDelete] // Removed clone/status change handlers
    );
    // --- End Define Columns ---


    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Leads Listing</h3> {/* Updated title */}
                    <LeadActionTools allLeads={leads} />
                </div>

                {/* Tools Section */}
                <div className="mb-4">
                    <LeadTableTools onSearchChange={handleSearchChange} />
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <LeadTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                        selectedLeads={selectedLeads} // Use updated prop
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <LeadSelected
                selectedLeads={selectedLeads} // Use updated prop
                setSelectedLeads={setSelectedLeads} // Use updated prop
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    );
};
// --- End Main Component ---

export default Leads; // Updated export name

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }