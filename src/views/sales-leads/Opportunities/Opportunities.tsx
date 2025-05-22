// src/views/your-path/Opportunities.tsx

import React, { useState, useMemo, useCallback, Fragment, useEffect, Ref, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
// import DataTable from "@/components/shared/DataTable"; // We will use the provided DataTable1
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import Card from "@/components/ui/Card"; 
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton';
import Loading from '@/components/shared/Loading';
import FileNotFound from '@/assets/svg/FileNotFound';


// Icons
import {
  TbPencil, TbCopy, TbSwitchHorizontal, TbTrash, TbChecks, TbSearch, TbPlus, TbMinus,
  TbExchange, TbBox, TbTag, TbTargetArrow, TbProgressCheck, TbCalendarTime,
  TbUserCircle, TbInfoCircle, TbMapPin, TbEye, TbShare, TbDotsVertical,
  TbBuilding, TbUser, TbMail, TbPhone,TbWorld,
  TbLink as TbLinkIcon, TbListDetails, TbChecklist, TbRadar2, TbIdBadge2,
  TbUsers 
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getExpandedRowModel,
    flexRender,
    ColumnDef,
    ColumnSort,
    Row,
    CellContext,
    ExpandedState,
} from '@tanstack/react-table';
import type { TableProps } from '@/components/ui/Table';
import type { SkeletonProps } from '@/components/ui/Skeleton';
import type { ChangeEvent, ReactNode } from 'react';
import type { CheckboxProps } from '@/components/ui/Checkbox';


// --- Define Item Type (Table Row Data) ---
export type OpportunityItem = {
  id: string; 
  opportunity_id: string;
  product_name: string;
  status: "pending" | "active" | "on_hold" | "closed";
  opportunity_status: "New" | "Shortlisted" | "Converted" | "Rejected";
  match_score: number;
  created_date: string;
  buy_listing_id?: string;
  sell_listing_id?: string;
  spb_role?: "Seller" | "Buyer"; 
  product_category?: string;
  product_subcategory?: string;
  brand?: string;
  product_specs?: string; 
  quantity?: number; 
  product_status_listing?: "In Stock" | "Low Stock" | "Out of Stock" | string;
  want_to?: "Buy" | "Sell" | "Exchange";
  company_name: string;
  company_id?: string;
  member_name: string;
  member_id?: string;
  member_email?: string;
  member_phone?: string;
  member_type: "Standard" | "Premium" | "INS-PREMIUM" | string;
  price_match_type?: "Exact" | "Range" | "Not Matched";
  quantity_match_listing?: "Sufficient" | "Partial" | "Not Matched";
  location_match?: "Local" | "National" | "Not Matched";
  matches_found_count?: number;
  last_updated?: string; 
  assigned_to?: string;
  notes?: string;
  listing_url?: string;
};

// --- Constants & Color Mappings ---
const recordStatusTagColor: Record<OpportunityItem["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  on_hold: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
  closed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
};
const opportunityStatusTagColor: Record<OpportunityItem["opportunity_status"], string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  Shortlisted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  Converted: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  Rejected: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
};
const matchTypeColors: Record<string, string> = {
  Exact: "text-green-600 dark:text-green-400",
  Range: "text-blue-600 dark:text-blue-400",
  "Not Matched": "text-red-600 dark:text-red-400",
  Sufficient: "text-green-600 dark:text-green-400",
  Partial: "text-yellow-600 dark:text-yellow-400",
  Local: "text-green-600 dark:text-green-400",
  National: "text-blue-600 dark:text-blue-400",
};

const allOpportunitiesData: OpportunityItem[] = [
  {
    id: "OPP001", opportunity_id: "SPB-001", product_name: "Eco-Friendly Water Bottles - 1L Capacity, Stainless Steel, Various Colors",
    status: "active", opportunity_status: "New", match_score: 75, created_date: "2024-03-01T10:00:00Z",
    buy_listing_id: "BUY-ECO-01", sell_listing_id: "SELL-ECO-02", spb_role: "Seller",
    product_category: "Lifestyle", product_subcategory: "Drinkware", brand: "EcoLife",
    product_specs: "India, USA", quantity: 150, product_status_listing: "In Stock", want_to: "Sell",
    company_name: "GreenSource Supplies Ltd.", company_id: "GS001", member_name: "Alice Green", member_id: "MEM001",
    member_email: "alice@greensource.com", member_phone: "555-1111", member_type: "Premium",
    price_match_type: "Range", quantity_match_listing: "Partial", location_match: "National", matches_found_count: 5,
    last_updated: "2024-03-02T11:00:00Z", assigned_to: "Team Eco", notes: "Seller has bulk stock. Prefers long-term partnership.", listing_url:"https://example.com/ecobottle"
  },
  {
    id: "OPP002", opportunity_id: "SPB-002", product_name: "Handcrafted Leather Wallets - Bi-fold & Tri-fold",
    status: "pending", opportunity_status: "Shortlisted", match_score: 92, created_date: "2024-03-05T14:30:00Z",
    buy_listing_id: "BUY-LTHR-03", sell_listing_id: "SELL-LTHR-04", spb_role: "Buyer",
    product_category: "Accessories", product_subcategory: "Wallets", brand: "Artisan Craft Co.",
    product_specs: "China, Canada", quantity: 50, product_status_listing: "Low Stock", want_to: "Buy",
    company_name: "Luxury Goods Incorporated", company_id: "LG002", member_name: "Robert 'Bob' Vance", member_id: "MEM002",
    member_email: "bob.v@luxurygoods.inc", member_phone: "555-2222", member_type: "INS-PREMIUM",
    price_match_type: "Exact", quantity_match_listing: "Sufficient", location_match: "Local", matches_found_count: 2,
    last_updated: "2024-03-06T09:15:00Z", assigned_to: "Team Luxe", notes: "Buyer interested in long-term supply. Requires sample.", listing_url:"https://example.com/leatherwallet"
  },
  {
    id: "OPP003", opportunity_id: "SPB-003", product_name: "Smart Home Security System - Pro Kit with 4 Cameras",
    status: "on_hold", opportunity_status: "Converted", match_score: 88, created_date: "2024-02-20T16:00:00Z",
    buy_listing_id: "BUY-SEC-05", sell_listing_id: "SELL-SEC-06", spb_role: "Seller",
    product_category: "Electronics", product_subcategory: "Home Security", brand: "SecureHome Plus",
    product_specs: "Europe", quantity: 5, product_status_listing: "In Stock", want_to: "Sell",
    company_name: "SafeTech Solutions Global", company_id: "STS003", member_name: "Carol Danvers (Captain)", member_id: "MEM003",
    member_email: "carol.d@safetechglobal.net", member_phone: "555-3333", member_type: "Standard",
    price_match_type: "Exact", quantity_match_listing: "Sufficient", location_match: "National", matches_found_count: 8,
    last_updated: "2024-03-01T10:00:00Z", assigned_to: "Team Secure", notes: "Deal closed, awaiting full payment and shipment coordination.", listing_url:"https://example.com/securitysystempro"
  },
   {
    id: "OPP004", opportunity_id: "OPP-S-004", product_name: "Refurbished iPhone 13 Pro - 256GB",
    status: "active", opportunity_status: "New", match_score: 85, created_date: "2024-03-10T12:00:00Z",
    sell_listing_id: "SELL-IPHONE-07", spb_role: "Seller",
    product_category: "Electronics", product_subcategory: "Mobile Phones", brand: "Apple",
    product_specs: "New Zealand", quantity: 20, product_status_listing: "In Stock", want_to: "Sell",
    company_name: "GadgetCycle Ltd.", company_id: "GC004", member_name: "Mike Wheeler", member_id: "MEM004",
    member_email: "mike@gadgetcycle.com", member_phone: "555-4444", member_type: "Premium",
    matches_found_count: 3,
    last_updated: "2024-03-11T10:00:00Z", assigned_to: "Team Mobile", notes: "Good condition, competitive price.", listing_url:"https://example.com/iphone13pro"
  },
  {
    id: "OPP005", opportunity_id: "OPP-B-005", product_name: "Bulk Order - Organic Coffee Beans",
    status: "pending", opportunity_status: "Shortlisted", match_score: 70, created_date: "2024-03-12T09:30:00Z",
    buy_listing_id: "BUY-COFFEE-08", spb_role: "Buyer",
    product_category: "Groceries", product_subcategory: "Coffee", brand: "Any (Organic)",
    product_specs: "Africa", quantity: 100, want_to: "Buy",
    company_name: "The Daily Grind Cafe", company_id: "DGC005", member_name: "Eleven Hopper", member_id: "MEM005",
    member_email: "el@dailygrind.coffee", member_phone: "555-5555", member_type: "INS-PREMIUM",
    matches_found_count: 4,
    last_updated: "2024-03-12T17:00:00Z", assigned_to: "Team Cafe", notes: "Urgent requirement for new blend.", listing_url:"https://example.com/organiccoffeebeans"
  }
];

const TABS = {
  ALL: "all",
  SELLER: "seller_opportunities",
  BUYER: "buyer_opportunities",
  AUTO_SPB: "auto_spb",
};

// --- DataTable1 (Your Custom DataTable Component) ---
export type OnSortParamTanstack = { order: 'asc' | 'desc' | ''; key: string | number }

type DataTable1Props<T> = {
    columns: ColumnDef<T>[]
    customNoDataIcon?: ReactNode
    data?: T[] 
    loading?: boolean
    noData?: boolean
    instanceId?: string
    onCheckBoxChange?: (checked: boolean, row: T) => void
    onIndeterminateCheckBoxChange?: (checked: boolean, rows: Row<T>[]) => void
    onPaginationChange?: (page: number) => void
    onSelectChange?: (num: number) => void
    onSort?: (sort: OnSortParamTanstack) => void
    pageSizes?: number[]
    selectable?: boolean
    skeletonAvatarColumns?: number[]
    skeletonAvatarProps?: SkeletonProps
    pagingData?: {
        total: number
        pageIndex: number
        pageSize: number
    }
    checkboxChecked?: (row: T) => boolean
    // indeterminateCheckboxChecked?: (rows: Row<T>[]) => boolean; 
    getRowCanExpand?: (row: Row<T>) => boolean 
    renderRowSubComponent?: (props: { row: Row<T> }) => React.ReactNode 
    state?: { expanded?: ExpandedState } // For externally controlled expansion
    onExpandedChange?: (updater: React.SetStateAction<ExpandedState>) => void // For externally controlled expansion
    ref?: Ref<DataTableResetHandle | HTMLTableElement>
} & TableProps

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
    onChange: (event: CheckBoxChangeEvent) => void
    indeterminate: boolean
    onCheckBoxChange?: (event: CheckBoxChangeEvent) => void
    onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table

const IndeterminateCheckbox = (props: IndeterminateCheckboxProps) => {
    const {
        indeterminate,
        onChange,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        ...rest
    } = props

    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (typeof indeterminate === 'boolean' && ref.current) {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
    }, [ref, indeterminate, rest.checked])

    const handleChange = (e: CheckBoxChangeEvent) => {
        onChange(e)
        onCheckBoxChange?.(e)
        onIndeterminateCheckBoxChange?.(e)
    }

    return (
        <Checkbox
            ref={ref}
            className="mb-0"
            onChange={(_, e) => handleChange(e)}
            {...rest}
        />
    )
}

export type DataTableResetHandle = {
    resetSorting: () => void
    resetSelected: () => void
}

const DataTableComponent = React.forwardRef(<T extends object>(props: DataTable1Props<T>, ref: Ref<DataTableResetHandle | HTMLTableElement>) => {
    const {
        skeletonAvatarColumns,
        columns: columnsProp = [],
        data = [],
        customNoDataIcon,
        loading,
        noData,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        onPaginationChange,
        onSelectChange,
        onSort,
        pageSizes = [10, 25, 50, 100],
        selectable = false,
        skeletonAvatarProps,
        pagingData = {
            total: 0,
            pageIndex: 1,
            pageSize: 10,
        },
        checkboxChecked,
        getRowCanExpand,
        renderRowSubComponent,
        state: controlledState, // Renamed to avoid conflict with internal state
        onExpandedChange: onControlledExpandedChange, // Renamed
        instanceId = 'data-table',
        ...rest
    } = props

    const { pageSize, pageIndex, total } = pagingData

    const [sorting, setSorting] = useState<ColumnSort[] | []>([]);
    // Use controlled expansion if `state.expanded` and `onExpandedChange` are provided
    const isManuallyExpanded = controlledState?.expanded !== undefined && onControlledExpandedChange !== undefined;
    const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({})
    
    const expanded = isManuallyExpanded ? controlledState.expanded! : internalExpanded;
    const onExpandedChange = isManuallyExpanded ? onControlledExpandedChange! : setInternalExpanded;


    const pageSizeOption = useMemo(
        () =>
            pageSizes.map((number) => ({
                value: number,
                label: `${number} / page`,
            })),
        [pageSizes],
    )

    useEffect(() => {
        if (Array.isArray(sorting)) {
            const sortOrder =
                sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : ''
            const id = sorting.length > 0 ? sorting[0].id : ''
            onSort?.({ order: sortOrder, key: id })
        }
    }, [sorting, onSort])

    const handleIndeterminateCheckBoxChange = (
        checked: boolean,
        rows: Row<T>[],
    ) => {
        if (!loading) {
            onIndeterminateCheckBoxChange?.(checked, rows)
        }
    }

    const handleCheckBoxChange = (checked: boolean, row: T) => {
        if (!loading) {
            onCheckBoxChange?.(checked, row)
        }
    }

    const finalColumns: ColumnDef<T>[] = useMemo(() => {
        const currentColumns = [...columnsProp]; 

        if (selectable) {
            return [
                {
                    id: 'select',
                     header: ({ table }) => (
                        <IndeterminateCheckbox
                            checked={ table.getIsAllRowsSelected() }
                            indeterminate={table.getIsSomeRowsSelected()}
                            onChange={(e) => { 
                                table.getToggleAllRowsSelectedHandler()(e as any); 
                                handleIndeterminateCheckBoxChange(e.target.checked, table.getRowModel().rows);
                            }}
                        />
                    ),
                    cell: ({ row }) => (
                        <IndeterminateCheckbox
                            checked={ checkboxChecked ? checkboxChecked(row.original) : row.getIsSelected() }
                            indeterminate={row.getIsSomeSelected()}
                            onChange={(e) => { 
                                row.getToggleSelectedHandler()(e as any);  
                                handleCheckBoxChange(e.target.checked, row.original);
                            }}
                        />
                    ),
                    size: 48,
                },
                ...currentColumns,
            ]
        }
        return currentColumns
    }, [columnsProp, selectable, loading, checkboxChecked, handleCheckBoxChange, handleIndeterminateCheckBoxChange])


    const table = useReactTable({
        data: data as T[],
        columns: finalColumns,
        state: {
            sorting: sorting as ColumnSort[],
            expanded, // Use the determined expanded state
        },
        onSortingChange: setSorting,
        onExpandedChange: onExpandedChange, // Use the determined handler
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand,
        manualPagination: true,
        manualSorting: true,
    })

    const resetSorting = () => table.resetSorting()
    const resetSelected = () => table.toggleAllRowsSelected(false)

    // useImperativeHandle(ref, () => ({
    //     resetSorting,
    //     resetSelected,
    // }))
    
    const handlePaginationChangeInternal = (page: number) => {
        if (!loading) {
            table.resetRowSelection(); 
            onPaginationChange?.(page)
        }
    }

    const handleSelectChangeInternal = (value?: number) => {
        if (!loading && value) {
            table.setPageSize(Number(value)) 
            onSelectChange?.(Number(value))
            onPaginationChange?.(1) 
            table.resetRowSelection();
        }
    }

    return (
        <Loading loading={Boolean(loading && data.length !== 0)} type="cover">
            <Table {...rest}>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <Th key={header.id} colSpan={header.colSpan} style={{width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={classNames(
                                                    header.column.getCanSort() &&
                                                    'cursor-pointer select-none point',
                                                    loading &&
                                                    'pointer-events-none',
                                                    (header.column.columnDef.meta as any)?.HeaderClass 
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {header.column.getCanSort() && (
                                                    <Sorter
                                                        sort={header.column.getIsSorted()}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </Th>
                                )
                            })}
                        </Tr>
                    ))}
                </THead>
                {loading && data.length === 0 ? (
                    <TableRowSkeleton
                        columns={finalColumns.length}
                        rows={pagingData.pageSize}
                        avatarInColumns={skeletonAvatarColumns}
                        avatarProps={skeletonAvatarProps}
                    />
                ) : (
                    <TBody>
                        {(noData || table.getRowModel().rows.length === 0) ? ( 
                            <Tr>
                                <Td className="hover:bg-transparent text-center" colSpan={finalColumns.length} >
                                    <div className="flex flex-col items-center justify-center gap-4 my-10">
                                        {customNoDataIcon ? customNoDataIcon : <FileNotFound className="grayscale" />}
                                        <span className="font-semibold"> No data found! </span>
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <Fragment key={row.id}>
                                    <Tr>
                                        {row.getVisibleCells().map((cell) => (
                                            <Td key={cell.id} style={{width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </Td>
                                        ))}
                                    </Tr>
                                    {row.getIsExpanded() && renderRowSubComponent && (
                                        <Tr className="expanded-row">
                                            <Td colSpan={row.getVisibleCells().length} className="p-0 bg-gray-50 dark:bg-gray-700/30">
                                                {renderRowSubComponent({ row })}
                                            </Td>
                                        </Tr>
                                    )}
                                </Fragment>
                            ))
                        )}
                    </TBody>
                )}
            </Table>
            {total > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <Pagination
                        pageSize={pageSize}
                        currentPage={pageIndex}
                        total={total}
                        onChange={handlePaginationChangeInternal}
                    />
                    <div style={{ minWidth: 130 }}>
                        <Select
                            instanceId={`${instanceId}-page-size-select`}
                            size="sm"
                            menuPlacement="top"
                            isSearchable={false}
                            value={pageSizeOption.find(
                                (option) => option.value === pageSize,
                            )}
                            options={pageSizeOption}
                            onChange={(option) => handleSelectChangeInternal(option?.value)}
                        />
                    </div>
                </div>
            )}
        </Loading>
    )
});
DataTableComponent.displayName = 'DataTableComponent';
// --- End DataTable1 ---


// --- Helper Components ---
// --- Helper Components ---
const FormattedDate: React.FC<{ dateString?: string; label?: string }> = ({ dateString, label }) => {
  if (!dateString) return <span className="text-xs text-gray-500 dark:text-gray-400">{label ? `${label}: N/A` : "N/A"}</span>;
  try {
    const date = new Date(dateString);
    return (
      <div className="text-xs">
        {label && <span className="font-semibold text-gray-700 dark:text-gray-300">{label}:<br/> </span>}
        {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
    );
  } catch (e) { return <span className="text-xs text-red-500">{label ? `${label}: Invalid Date` : "Invalid Date"}</span>; }
};
FormattedDate.defaultProps = { label: "" };

const InfoLine: React.FC<{ icon?: React.ReactNode; text?: string | number | React.ReactNode | null; label?: string; title?: string; className?: string; boldText?: boolean }> = ({ icon, text, label, title, className, boldText }) => {
  if (text === null || text === undefined || text === "") return null;
  return (
    <div className={classNames("flex items-center gap-1 text-xs", className)}>
      {icon && <span className="text-gray-400 dark:text-gray-500 mr-1">{icon}</span>}
      {label && <span className="font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}:</span>}
      <span
        className={classNames("text-gray-700 dark:text-gray-200 truncate", { "font-semibold": boldText })}
        title={title || (typeof text === 'string' || typeof text === 'number' ? String(text) : undefined)}
      >
        {text}
      </span>
    </div>
  );
};
InfoLine.defaultProps = { icon: null, text: null, label: "", title: "", className: "", boldText: false};


// --- Sub-Components for Opportunities Page ---
const OpportunitySearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void }>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
OpportunitySearch.displayName = "OpportunitySearch";

const OpportunityTableTools = ({ onSearchChange }: { onSearchChange: (query: string) => void; }) => (
  <div className="flex-grow">
    <OpportunitySearch onInputChange={onSearchChange} />
  </div>
);

const OpportunityActionTools = ({ activeTab }: { activeTab: string; }) => {
  const navigate = useNavigate();
  const handleAddItem = () => {
    navigate('/sales-leads/opportunity/create'); 
    toast.push(<Notification title="Navigation" type="info">Redirecting to create new opportunity...</Notification>);
  };
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={handleAddItem}>
        Add New
      </Button>
    </div>
  );
};

const OpportunitySelectedFooter = ({ selectedItems, onDeleteSelected, activeTab }: {
  selectedItems: OpportunityItem[];
  onDeleteSelected: () => void;
  activeTab: string;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  const itemType = "Opportunit" + (selectedItems.length > 1 ? "ies" : "y");
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <TbChecks className="text-lg text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span> {itemType} selected
            </span>
          </span>
          <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setConfirmOpen(true)}>
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={confirmOpen} type="danger" title={`Delete Selected ${itemType}`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { onDeleteSelected(); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>Are you sure you want to delete the selected {selectedItems.length} {itemType.toLowerCase()}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

const MainRowActionColumn = ({ onEdit, item }: { onEdit: () => void; item: OpportunityItem }) => {
  return (
    <div className="flex items-center justify-end gap-1">
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
          onClick={() => toast.push(<Notification title="View" type="info">View details for {item.opportunity_id}</Notification>)}
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
    </div>
    </div>
  );
};

const ExpandedOpportunityDetails: React.FC<{ row: Row<OpportunityItem>; currentTab: string; }> = ({ row: { original: item }, currentTab }) => {
    const navigate = useNavigate();
    const handleExpandedAction = (action: string, id: string) => {
        toast.push(<Notification type="info" title={`${action} for ${id} (from expanded view)`} />);
        if (action === "Edit") navigate(`/sales-leads/opportunity/edit/${id}?tab=${currentTab}`);
    };
    const opportunityType = item.spb_role ? `${item.spb_role} in SPB` : (item.want_to || "General");
    return (
        <Card bordered className="m-1 my-2 shadow-lg bg-gray-50 dark:bg-gray-750 rounded-lg">
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
                <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Opportunity Snapshot</h6>
                <InfoLine icon={<TbIdBadge2 size={14}/>} label="Opp. ID" text={item.opportunity_id} className="font-medium text-sm"/>
                <InfoLine icon={<TbBox size={14}/>} label="Product" text={item.product_name?.slice(0, 15) + (item.product_name && item.product_name.length > 1 ? "…" : "")} className="font-medium text-sm"/>
                <InfoLine icon={<TbTag size={14}/>} label="Category" text={`${(item.product_category || 'N/A').toString().slice(0, 15) + ((item.product_category && item.product_category.length > 15) ? "…" : "")}${item.product_subcategory ? ` > ${item.product_subcategory.slice(0, 15) + (item.product_subcategory.length > 15 ? "…" : "")}` : ''}`} />
                <InfoLine icon={<TbTag size={14}/>} label="Brand" text={item.brand ? item.brand.slice(0, 15) + (item.brand.length > 15 ? "…" : "") : 'N/A'} />
              {item.product_specs && <InfoLine icon={<TbInfoCircle size={14}/>} label="Specs" text={item.product_specs} />}
              <InfoLine icon={<TbChecklist size={14}/>} label="Quantity" text={item.quantity?.toString() || 'N/A'} />
              <InfoLine icon={<TbProgressCheck size={14}/>} label="Product Status" text={item.product_status_listing || 'N/A'} />
              <InfoLine icon={<TbExchange size={14}/>} label="Intent/Role" text={opportunityType} />
            </div>
            <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
              <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Company & Member</h6>
              <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm mb-2">
                <div className="flex items-center">
                    {item.company_id && <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">{item.company_id} |</span>}
                    <InfoLine icon={<TbBuilding size={14}/>} text={item.company_name} className="font-semibold"/>
                </div>
              </div>
              <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center">
                    {item.member_id && <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">{item.member_id} |</span>}
                    <InfoLine icon={<TbUser size={14}/>} text={item.member_name} className="font-semibold"/>
                </div>
                <InfoLine text={item.member_type} className="ml-5 text-indigo-600 dark:text-indigo-400 font-medium"/>
                {item.member_email && <InfoLine icon={<TbMail size={14}/>} text={<a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a>} />}
                {item.member_phone && <InfoLine icon={<TbPhone size={14}/>} text={item.member_phone} />}
              </div>
              {item.listing_url && <InfoLine icon={<TbLinkIcon size={14}/>} label="Listing" text={<a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[180px]" title={item.listing_url}>{item.listing_url}</a>} />}
            </div>
            <div className="space-y-1.5">
                <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Match & Lifecycle</h6>
                <InfoLine icon={<TbRadar2 size={14}/>} label="Matches Found" text={item.matches_found_count?.toString() || 'N/A'} />
                <InfoLine icon={<TbTargetArrow size={14}/>} label="Match Score" text={`${item.match_score}%`} />
                 <div className="flex items-center gap-2">
                    <InfoLine icon={<TbProgressCheck size={14}/>} label="Opp. Status"/>
                    <Tag className={`${opportunityStatusTagColor[item.opportunity_status]} capitalize`}>{item.opportunity_status}</Tag>
                 </div>
                <FormattedDate label="Created" dateString={item.created_date} />
            </div>
          </div>
        </Card>
      );
};


// --- Sub-Components for Opportunities Page ---
// OpportunitySearch, OpportunityTableTools, OpportunityActionTools, OpportunitySelectedFooter, MainRowActionColumn, ExpandedOpportunityDetails
// (implementations as provided in previous responses)


// --- Main Opportunities Component ---
const Opportunities = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(allOpportunitiesData);
  
  const [tableQueries, setTableQueries] = useState<Record<string, TableQueries>>({});
  const [selectedItems, setSelectedItems] = useState<Record<string, OpportunityItem[]>>({});
  const [currentTab, setCurrentTab] = useState<string>(TABS.ALL);
  const [expanded, setExpanded] = useState<ExpandedState>({}) // For DataTableComponent

  useEffect(() => {
    const initialTableQuery = { pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" } as ColumnSort, query: "" };
    setTableQueries({
      [TABS.ALL]: { ...initialTableQuery },
      [TABS.SELLER]: { ...initialTableQuery },
      [TABS.BUYER]: { ...initialTableQuery },
      [TABS.AUTO_SPB]: { ...initialTableQuery },
    });
    setSelectedItems({ [TABS.ALL]: [], [TABS.SELLER]: [], [TABS.BUYER]: [], [TABS.AUTO_SPB]: [] });
  }, []);

  useEffect(() => { 
    const currentTableQuery = tableQueries[currentTab] || { pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" } as ColumnSort, query: "" };
    setTableQueries(prev => ({ ...prev, [currentTab]: { ...currentTableQuery, pageIndex: 1 }}));
    setSelectedItems(prev => ({ ...prev, [currentTab]: []}));
    setExpanded({});
  }, [currentTab]);

  const currentTableData = tableQueries[currentTab] || { pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" } as ColumnSort, query: "" };
  const currentSelectedItems = selectedItems[currentTab] || [];

  const filteredOpportunities = useMemo(() => { 
    let data = [...opportunities]; 
    if (currentTab === TABS.SELLER) {
      data = data.filter(op => op.spb_role === "Seller" || op.want_to === "Sell" || (op.sell_listing_id && !op.buy_listing_id));
    } else if (currentTab === TABS.BUYER) {
      data = data.filter(op => op.spb_role === "Buyer" || op.want_to === "Buy" || (op.buy_listing_id && !op.sell_listing_id));
    } else if (currentTab === TABS.AUTO_SPB){
      data = data.filter(op => op.buy_listing_id && op.sell_listing_id); 
    }
    
    if (currentTableData.query) {
      const query = currentTableData.query.toLowerCase();
      data = data.filter((item) =>
        Object.values(item).some((value) => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(query);
        })
      );
    }
    return data;
  }, [currentTab, opportunities, currentTableData.query]);

  const { pageData, total } = useMemo(() => { 
    let processedData = [...filteredOpportunities];
    const { order, key } = currentTableData.sort as unknown as OnSortParamTanstack; // Use renamed type

    if (order && key && processedData.length > 0 ) {
        const sampleItem = processedData[0];
        if (sampleItem && key in sampleItem) {
            processedData.sort((a, b) => {
                const aVal = a[key as keyof OpportunityItem];
                const bVal = b[key as keyof OpportunityItem];
                if (key === "created_date" || key === "last_updated") {
                return order === "asc"
                    ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
                    : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
                }
                if (typeof aVal === "number" && typeof bVal === "number") {
                return order === "asc" ? aVal - bVal : bVal - aVal;
                }
                return order === "asc"
                ? String(aVal ?? '').localeCompare(String(bVal ?? ''))
                : String(bVal ?? '').localeCompare(String(aVal ?? ''));
            });
        } else {
            console.warn(`Sort key "${key}" not found in opportunity items. Available keys:`, sampleItem ? Object.keys(sampleItem) : 'No items to sample');
        }
    }
    const pageIndex = currentTableData.pageIndex as number;
    const pageSize = currentTableData.pageSize as number;
    const dataTotal = processedData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: dataTotal,
    };
  }, [filteredOpportunities, currentTableData]);
  
  const handleSetCurrentTableData = useCallback((data: Partial<TableQueries>) => { setTableQueries(prev => ({ ...prev, [currentTab]: { ...prev[currentTab], ...data } })); }, [currentTab]);
  const handlePaginationChange = useCallback((page: number) => handleSetCurrentTableData({ pageIndex: page }),[handleSetCurrentTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetCurrentTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems(prev => ({ ...prev, [currentTab]: [] })); }, [handleSetCurrentTableData, currentTab]);
  const handleSort = useCallback((sort: OnSortParamTanstack) => handleSetCurrentTableData({ sort: sort as any, pageIndex: 1 }), [handleSetCurrentTableData]); // Cast sort
  const handleSearchChange = useCallback((query: string) => handleSetCurrentTableData({ query: query, pageIndex: 1 }), [handleSetCurrentTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: OpportunityItem) => { setSelectedItems(prev => ({ ...prev, [currentTab]: checked ? [...(prev[currentTab] || []), row] : (prev[currentTab] || []).filter((i) => i.id !== row.id) })); }, [currentTab]);
  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<OpportunityItem>[]) => { setSelectedItems(prev => ({ ...prev, [currentTab]: checked ? rows.map((r) => r.original) : [] })); }, [currentTab]);
  const handleEdit = useCallback((item: OpportunityItem) => { navigate(`/sales-leads/opportunity/edit/${item.id}?type=${currentTab === TABS.AUTO_SPB ? 'match' : item.want_to?.toLowerCase() || 'general'}`); }, [navigate, currentTab]);
  const handleDeleteSelected = useCallback(() => { const selectedIds = new Set(currentSelectedItems.map((i) => i.id)); setOpportunities((prevAll) => prevAll.filter((i) => !selectedIds.has(i.id))); setSelectedItems(prev => ({...prev, [currentTab]: []})); toast.push(<Notification title="Records Deleted" type="success">{`${selectedIds.size} record(s) deleted.`}</Notification>); }, [currentSelectedItems, currentTab, setOpportunities]);
  const handleTabChange = (tabKey: string) => { if (tabKey === currentTab) return; setCurrentTab(tabKey); };
  
  // toggleRowExpansion is now handled by DataTableComponent's onExpandedChange via setExpanded

  const getColumnsForStandardView = useCallback((): ColumnDef<OpportunityItem>[] => [
    { 
        header: "Opportunity & Product", 
        accessorKey: "opportunity_id",
        size: 300, 
        cell: ({row}) => {
            const item = row.original;
            return (
                <div className="flex items-start gap-3">
                     <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
                        {item.product_name?.substring(0,2).toUpperCase()}
                    </Avatar>
                    <div className="flex flex-col">
                        <Link to={`/sales-leads/opportunity/detail/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                            {item.opportunity_id}
                        </Link>
                        <Tooltip title={item.product_name}>
                          <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[240px]">
                            {item.product_name?.slice(0, 15) + (item.product_name && item.product_name.length > 1 ? "…" : "")}
                          </span>
                        </Tooltip>
                        <Tag className={`${recordStatusTagColor[item.status]} capitalize text-[10px] px-1.5 py-0.5 mt-1 self-start`}>{item.status}</Tag>
                    </div>
                </div>
            )
    }},
    { 
        header: "Company & Member", 
        accessorKey: "company_name",
        size: 260, 
        cell: ({row}) => {
            const item = row.original;
            return (
                <div className="text-xs">
                    <div className="mb-1.5 flex items-center">
                        <TbBuilding size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={item.company_name}>{item.company_name}</span>
                            {item.company_id && <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.company_id}</span>}
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex items-center">
                         <TbUser size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700 dark:text-gray-200 truncate" title={item.member_name}>{item.member_name}</span>
                            <div className="flex items-center">
                                {item.member_id && <span className="text-gray-500 dark:text-gray-400 text-[11px] mr-1.5">{item.member_id}</span>}
                                <Tag className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300 text-[9px] px-1 py-0.5 align-middle whitespace-nowrap">
                                    {item.member_type}
                                </Tag>
                            </div>
                        </div>
                    </div>
                </div>
            )
    }},
    { 
        header: "Key Details & Matching", 
        accessorKey: "match_score",
        size: 260, 
        cell: ({row}) => { 
            const item = row.original;
            return (
                <div className="text-xs space-y-1">
                    <InfoLine icon={<TbPhone size={13}/>} text={item.member_phone || 'N/A'} />
                    <InfoLine icon={<TbMail size={13}/>} text={item.member_email ? <a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a> : 'N/A'} />
                    <div className="pt-1 mt-1 border-t dark:border-gray-600">
                        <InfoLine icon={<TbChecklist size={13}/>} label="Qty" text={item.quantity ?? 'N/A'} />
                        <InfoLine icon={<TbProgressCheck size={13}/>} label="Stock" text={item.product_status_listing ?? 'N/A'} />
                        <InfoLine icon={<TbExchange size={13}/>} label="Want To" text={item.want_to ?? 'N/A'} />
                    </div>
                     <div className="pt-1 mt-1 border-t dark:border-gray-600">
                        <InfoLine icon={<TbWorld size={13}/>} label="Specs" text={item.product_specs ? (item.product_specs.length > 20 ? item.product_specs.substring(0,17) + "..." : item.product_specs ): 'N/A'} title={item.product_specs}/>
                        <InfoLine icon={<TbRadar2 size={13}/>} label="Matches" text={item.matches_found_count ?? 'N/A'} />
                        <InfoLine icon={<TbTargetArrow size={13}/>} label="Score" text={`${item.match_score}%`} />
                    </div>
                </div>
            )
    }},
    { 
        header: "Timestamps & Status", 
        accessorKey: "created_date",
        size: 170, 
        cell: ({row}) => {
            const item = row.original;
            return (
                <div className="text-xs space-y-1.5">
                    <FormattedDate label="Created" dateString={item.created_date} />
                     <div className="flex items-center gap-1">
                        <InfoLine icon={<TbProgressCheck size={14}/>} label="Opp."/>
                        <Tag className={`${opportunityStatusTagColor[item.opportunity_status]} capitalize text-[10px] px-1.5 py-0.5 whitespace-nowrap`}>{item.opportunity_status}</Tag>
                     </div>
                </div>
            )
    }},
    { 
        header: "Actions", 
        id: "action_std", 
        size: 90, 
        cell: (props) => <MainRowActionColumn 
                                onEdit={() => handleEdit(props.row.original)} 
                                item={props.row.original}
                            />
    },
  ], [handleEdit]);

  const getColumnsForExpandableView = useCallback((): ColumnDef<OpportunityItem>[] => [
    { 
        id: 'expander', 
        header: () => null, 
        size: 40, 
        cell: ({ row }) => (
            <Tooltip title={row.getIsExpanded() ? "Collapse" : "Expand Details"}>
                <Button 
                    shape="circle" 
                    variant="subtle" 
                    size="xs" 
                    icon={row.getIsExpanded() ? <TbMinus /> : <TbPlus />} 
                    onClick={row.getToggleExpandedHandler()} 
                />
            </Tooltip>
    )},
   { 
        header: "Opportunity & Product", 
        accessorKey: "opportunity_id",
        size: 300, 
        cell: ({row}) => {
            const item = row.original;
            return (
                <div className="flex items-start gap-3">
                     <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
                        {item.product_name?.substring(0,2).toUpperCase()}
                    </Avatar>
                    <div className="flex flex-col">
                        <Link to={`/sales-leads/opportunity/detail/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                            {item.opportunity_id}
                        </Link>
                        <Tooltip title={item.product_name}>
                          <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[240px]">
                            {item.product_name?.slice(0, 15)}
                            {item.product_name && item.product_name.length > 1 ? "…" : ""}
                          </span>
                        </Tooltip>
                        <Tag className={`${recordStatusTagColor[item.status]} capitalize text-[10px] px-1.5 py-0.5 mt-1 self-start`}>{item.status}</Tag>
                    </div>
                </div>
            )
    }},
    { 
        header: "Company, Member & Role", 
        accessorKey: "company_name",
        size: 280, 
        cell: ({row}) => {
            const item = row.original;
            return (
                <div className="text-xs">
                    <div className="mb-1.5 flex items-center">
                        <TbBuilding size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={item.company_name}>{item.company_name}</span>
                            {item.company_id && <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.company_id}</span>}
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex items-center">
                         <TbUser size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700 dark:text-gray-200 truncate" title={item.member_name}>{item.member_name}</span>
                             <div className="flex items-center">
                                {item.member_id && <span className="text-gray-500 dark:text-gray-400 text-[11px] mr-1.5">{item.member_id}</span>}
                                <Tag className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300 text-[9px] px-1 py-0.5 align-middle whitespace-nowrap">
                                    {item.member_type}
                                </Tag>
                             </div>
                        </div>
                    </div>
                     {item.spb_role && (
                         <Tag className={classNames( "mt-1.5 capitalize text-xs px-2 py-0.5", item.spb_role === "Seller" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" )}>
                            <TbUsers className="inline mr-1 text-sm align-middle" /> {item.spb_role}
                        </Tag>
                     )}
                </div>
            )
    }},
     { 
        header: "Key Details & Matching", 
        accessorKey: "match_score",
        size: 260, 
        cell: ({row}) => { 
            const item = row.original;
            return (
                <div className="text-xs space-y-1">
                    <InfoLine icon={<TbPhone size={13}/>} text={item.member_phone || 'N/A'} />
                    <InfoLine icon={<TbMail size={13}/>} text={item.member_email ? <a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a> : 'N/A'} />
                    <div className="pt-1 mt-1 border-t dark:border-gray-600">
                        <InfoLine icon={<TbChecklist size={13}/>} label="Qty" text={item.quantity ?? 'N/A'} />
                        <InfoLine icon={<TbProgressCheck size={13}/>} label="Stock" text={item.product_status_listing ?? 'N/A'} />
                        <InfoLine icon={<TbExchange size={13}/>} label="Want To" text={item.want_to ?? 'N/A'} />
                    </div>
                     <div className="pt-1 mt-1 border-t dark:border-gray-600">
                         <InfoLine icon={<TbWorld size={13}/>} label="Specs" text={item.product_specs ? (item.product_specs.length > 20 ? item.product_specs.substring(0,17) + "..." : item.product_specs ): 'N/A'} title={item.product_specs}/>
                        <InfoLine icon={<TbRadar2 size={13}/>} label="Matches" text={item.matches_found_count ?? 'N/A'} />
                        <InfoLine icon={<TbTargetArrow size={13}/>} label="Score" text={`${item.match_score}%`} />
                    </div>
                </div>
            )
    }},
     { 
        header: "Timestamps & Status", 
        accessorKey: "created_date",
        size: 170, 
        cell: ({row}) => {
            const item = row.original;
            return (
                <div className="text-xs space-y-1.5">
                    <FormattedDate label="Created" dateString={item.created_date} />
                     <div className="flex items-center gap-1">
                        <InfoLine icon={<TbProgressCheck size={14}/>} label="Opp."/>
                        <Tag className={`${opportunityStatusTagColor[item.opportunity_status]} capitalize text-[10px] px-1.5 py-0.5 whitespace-nowrap`}>{item.opportunity_status}</Tag>
                     </div>
                </div>
            )
    }},
     { 
        header: "Quick Actions", 
        id: "action_spb", 
        size: 90, 
        cell: (props) => <MainRowActionColumn 
                                onEdit={() => handleEdit(props.row.original)} 
                                item={props.row.original}
                            />
    },
  ], [expanded, handleEdit]); // Use `expanded` from DataTable state for expander icon

  const columns = useMemo(() => {
    if (currentTab === TABS.AUTO_SPB) {
      return getColumnsForExpandableView();
    }
    return getColumnsForStandardView();
  }, [currentTab, getColumnsForStandardView, getColumnsForExpandableView]);

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Opportunities Management</h5>
          <OpportunityActionTools activeTab={currentTab} />
        </div>

        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
            {[TABS.ALL, TABS.SELLER, TABS.BUYER, TABS.AUTO_SPB].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={classNames(
                  "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize",
                  currentTab === tab
                    ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                )}
              >
                {tab.replace("_opportunities", "").replace("_", " ")}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mb-4">
          <OpportunityTableTools onSearchChange={handleSearchChange} />
        </div>

        <div className="flex-grow overflow-auto">
          <DataTableComponent
            selectable
            columns={columns}
            data={pageData}
            loading={isLoading}
            pagingData={{ total, pageIndex: currentTableData.pageIndex as number, pageSize: currentTableData.pageSize as number }}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect}
            onIndeterminateCheckBoxChange={handleAllRowSelect}
            checkboxChecked={(row: OpportunityItem) => currentSelectedItems.some((selected: OpportunityItem) => selected.id === row.id)}
            // DataTable1 internal state will manage expansion for AUTO_SPB tab
            state={currentTab === TABS.AUTO_SPB ? { expanded } : undefined}
            onExpandedChange={currentTab === TABS.AUTO_SPB ? setExpanded : undefined}
            getRowCanExpand={currentTab === TABS.AUTO_SPB ? () => true : undefined}
            renderRowSubComponent={currentTab === TABS.AUTO_SPB ? (({ row }: { row: Row<OpportunityItem> }) => 
                 <ExpandedOpportunityDetails row={row} currentTab={currentTab} />
            ) : undefined}
            noData={!isLoading && pageData.length === 0}
          />
        </div>
      </AdaptiveCard>
      <OpportunitySelectedFooter
        selectedItems={currentSelectedItems}
        onDeleteSelected={handleDeleteSelected}
        activeTab={currentTab}
      />
    </Container>
  );
};

export default Opportunities;