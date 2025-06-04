// src/views/your-path/Opportunities.tsx

import React, { useState, useMemo, useCallback, Fragment, useEffect, Ref, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
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
  TbBuilding, TbUser, TbMail, TbPhone, TbWorld,
  TbLink as TbLinkIcon, TbListDetails, TbChecklist, TbRadar2, TbIdBadge2,
  TbUsers,
  TbFilter,
  TbCloudUpload,
  TbBrandWhatsapp,
  TbLinkPlus,
  TbLock,
  TbClipboardCheck,
  TbSend2
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
import { DatePicker, Drawer, Dropdown, Form, FormItem, Input } from "@/components/ui";
import { Controller, useForm } from "react-hook-form";

// Redux
import { useAppDispatch } from "@/reduxtool/store"; // Assuming this exists
import { useSelector } from "react-redux"; // Assuming this exists
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Assuming this exists
import { getOpportunitiesAction } from "@/reduxtool/master/middleware"; // Assuming this action exists


// --- Define API Item Type (Matches API Response Structure) ---
export type ApiOpportunityItem = {
  id: string;
  opportunity_id: string | null;
  product_name: string;
  status: string; // e.g., "Pending", "Active" - from API
  opportunity_status: string | null; // e.g., "New", "Converted" - from API
  match_score: number | null;
  created_date: string | null; // ISO string
  buy_listing_id: string | null;
  sell_listing_id: string | null;
  spb_role: string | null; // "Seller" | "Buyer"
  product_category: string | null;
  product_subcategory: string | null;
  brand: string | null;
  product_specs: string | null;
  quantity: string | number | null; // API has null in example, could be string or number if present
  product_status_listing: string | null;
  want_to: string; // "Sell" | "Buy" | "Exchange"
  company_name: string | null;
  company_id: string | null;
  member_name: string | null;
  member_id: string | null;
  member_email: string | null;
  member_phone: string | null;
  member_type: string | null; // "Standard" | "Premium" | "INS-PREMIUM"
  price_match_type: string | null; // "Exact" | "Range" | "Not Matched"
  quantity_match_listing: string | null; // API example has "1", might need interpretation
  location_match: string | null; // "Local" | "National" | "Not Matched"
  matches_found_count: number | null;
  last_updated: string | null; // ISO string
  assigned_to: number | string | null; // API example shows number `1`
  notes: string | null;
  listing_url: string | null;
};


// --- Define UI Item Type (Table Row Data) ---
export type OpportunityItem = {
  id: string;
  opportunity_id: string; // Non-nullable in UI, default to "" or generated if API is null
  product_name: string;
  status: "pending" | "active" | "on_hold" | "closed" | string; // Allow string for unmapped API statuses
  opportunity_status: "New" | "Shortlisted" | "Converted" | "Rejected" | string; // Allow string
  match_score: number; // Default to 0 if API is null
  created_date: string; // Keep as string for FormattedDate, default to ""
  buy_listing_id?: string;
  sell_listing_id?: string;
  spb_role?: "Seller" | "Buyer" | string;
  product_category?: string;
  product_subcategory?: string;
  brand?: string;
  product_specs?: string;
  quantity?: number;
  product_status_listing?: "In Stock" | "Low Stock" | "Out of Stock" | string;
  want_to?: "Buy" | "Sell" | "Exchange" | string;
  company_name: string; // Default to "N/A"
  company_id?: string;
  member_name: string; // Default to "N/A"
  member_id?: string;
  member_email?: string;
  member_phone?: string;
  member_type: "Standard" | "Premium" | "INS-PREMIUM" | string; // Allow string
  price_match_type?: "Exact" | "Range" | "Not Matched" | string;
  quantity_match_listing?: "Sufficient" | "Partial" | "Not Matched" | string; // Mapped from API
  location_match?: "Local" | "National" | "Not Matched" | string;
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
  // Add other statuses if needed, and a default
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
};
const opportunityStatusTagColor: Record<OpportunityItem["opportunity_status"], string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  Shortlisted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  Converted: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  Rejected: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  // Add other statuses if needed, and a default
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
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


const TABS = {
  ALL: "all",
  SELLER: "seller_opportunities",
  BUYER: "buyer_opportunities",
  AUTO_MATCH: "auto_match",
};

// --- DataTable1 (Your Custom DataTable Component) ---
// ... (DataTableComponent remains unchanged from your provided code) ...
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
  getRowCanExpand?: (row: Row<T>) => boolean
  renderRowSubComponent?: (props: { row: Row<T> }) => React.ReactNode
  state?: { expanded?: ExpandedState } 
  onExpandedChange?: (updater: React.SetStateAction<ExpandedState>) => void 
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
    state: controlledState, 
    onExpandedChange: onControlledExpandedChange, 
    instanceId = 'data-table',
    ...rest
  } = props

  const { pageSize, pageIndex, total } = pagingData

  const [sorting, setSorting] = useState<ColumnSort[] | []>([]);
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
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={(e) => {
                table.getToggleAllRowsSelectedHandler()(e as any);
                handleIndeterminateCheckBoxChange(e.target.checked, table.getRowModel().rows);
              }}
            />
          ),
          cell: ({ row }) => (
            <IndeterminateCheckbox
              checked={checkboxChecked ? checkboxChecked(row.original) : row.getIsSelected()}
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
      expanded, 
    },
    onSortingChange: setSorting,
    onExpandedChange: onExpandedChange, 
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
                  <Th key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
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
                      <Td key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                  </Tr>
                  {row.getIsExpanded() && renderRowSubComponent && (
                    <>
                      <Tr className="expanded-row">
                        <Td colSpan={row.getVisibleCells().length} style={{ padding: "0px" }} className="hover:bg-transparent">
                          <div className="">
                            {renderRowSubComponent({ row })}
                            <div className="text-right">
                              <Button icon={<TbCopy />} className="mb-2 mr-1"></Button>
                              <Button icon={<TbBrandWhatsapp />} className="mb-2 mr-1"></Button>
                              <Dropdown title="Send Message">
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox /> Default Option</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox /> Master</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox /> WTB</div>
                                </Dropdown.Item>
                              </Dropdown>
                              <Dropdown title="Send Options" className="text-xs">
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox />Option 1</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox />Option 2</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox />Option 3</div>
                                </Dropdown.Item>
                              </Dropdown>
                            </div>
                          </div>
                        </Td>
                      </Tr>
                    </>
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

// --- Helper Components ---
const FormattedDate: React.FC<{ dateString?: string; label?: string }> = ({ dateString, label }) => {
  if (!dateString) return <span className="text-xs text-gray-500 dark:text-gray-400">{label ? `${label}: N/A` : "N/A"}</span>;
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return <span className="text-xs text-red-500">{label ? `${label}: Invalid Date` : "Invalid Date"}</span>;
    }
    return (
      <div className="text-xs">
        {label && <span className="font-semibold text-gray-700 dark:text-gray-300">{label}:<br /> </span>}
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
InfoLine.defaultProps = { icon: null, text: null, label: "", title: "", className: "", boldText: false };


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

const OpportunityFilterDrawer: React.FC<any> = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)
  const { control, handleSubmit } = useForm() // Use handleSubmit from RHF
  // Dummy options, replace with actual data source or props
  const allOpportunitiesForFilter = useSelector(masterSelector).opportunitiesData?.data || [];


  const onSubmitFilter = (data: any) => {
    console.log("Filter data:", data); // Handle filter submission
    // Here you would typically dispatch an action or set filter state
    closeDrawer();
  };


  return (
    <>
      <Button icon={<TbFilter />} onClick={() => openDrawer()}>Filter</Button>
      <Drawer
        title="Filters"
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onRequestClose={closeDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={() => { /* Clear logic */ closeDrawer(); }}>Clear</Button>
            <Button
              size="sm"
              variant="solid"
              form="filterOpportunityForm" // Ensure this ID matches the Form ID
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form id="filterOpportunityForm" onSubmit={handleSubmit(onSubmitFilter)}>
          <div className="md:grid grid-cols-2 gap-2">
            <FormItem label="Member Type">
              <Controller
                name="member-type"
                control={control}
                render={({ field }) => ( 
                  <Select
                    {...field} 
                    placeholder="Select Type"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "INS - Premium", value: "INS - Premium" },
                      { label: "INS - Super", value: "INS - Super" },
                      { label: "Premium", value: "Premium" },
                      { label: "Standard", value: "Standard" },
                    ]}
                  />
                )}
              />
            </FormItem>
            {/* ... other filter fields, similar to your existing code ... */}
             <FormItem label="Continent">
              <Controller
                name="continent"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Continent"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "Asia", value: "Asia" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Country">
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Country"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "India", value: "India" },
                      { label: "Nepal", value: "Nepal" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="State">
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select State"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "Gujarat", value: "Gujarat" },
                      { label: "Rajasthan", value: "Rajasthan" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="City">
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select City"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "Ahmedabad", value: "Ahmedabad" },
                      { label: "Dahod", value: "Dahod" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Pincode">
              <Controller
                name="pincode"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter Pincode"
                    className="text-nowrap text-ellipsis"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Favourite Brand">
              <Controller
                name="favourite-brand"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Favourite Brand"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "Apple", value: "Apple" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Kyc Verified">
              <Controller
                name="kyc-verified"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select KYC"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "Verified", value: "Verified" },
                      { label: "Pending", value: "Pending" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Product Spec">
              <Controller
                name="product-spec"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Product Spec"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={
                        [...new Set(allOpportunitiesForFilter.map((op: ApiOpportunityItem) => op.product_specs).filter(Boolean))]
                        .map(spec => ({label: spec, value: spec}))
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Status"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "Pending", value: "Pending" }, // API status
                      { label: "Active", value: "active" },   // UI status
                      { label: "On Hold", value: "on_hold" },
                      { label: "Closed", value: "closed" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Category">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Category"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={
                        [...new Set(allOpportunitiesForFilter.map((op: ApiOpportunityItem) => op.product_category).filter(Boolean))]
                        .map(cat => ({label: cat, value: cat}))
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Sub Category">
              <Controller
                name="subcategory"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Sub Category"
                    className="text-nowrap text-ellipsis"
                    isMulti
                     options={
                        [...new Set(allOpportunitiesForFilter.map((op: ApiOpportunityItem) => op.product_subcategory).filter(Boolean))]
                        .map(subcat => ({label: subcat, value: subcat}))
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Brand">
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Brand"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={
                        [...new Set(allOpportunitiesForFilter.map((op: ApiOpportunityItem) => op.brand).filter(Boolean))]
                        .map(brand => ({label: brand, value: brand}))
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Product">
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Product"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={
                        [...new Set(allOpportunitiesForFilter.map((op: ApiOpportunityItem) => op.product_name).filter(Boolean))]
                        .map(name => ({label: name, value: name}))
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Product Status">
              <Controller
                name="product-status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Product Status"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "In Stock", value: "In Stock"},
                      { label: "Low Stock", value: "Low Stock"},
                      // Add other known product statuses from API if different
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Seller">
              <Controller
                name="seller" 
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Seller"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={allOpportunitiesForFilter
                        .filter((op: ApiOpportunityItem) => op.spb_role === "Seller" || op.want_to === "Sell")
                        .map((op: ApiOpportunityItem) => ({label: op.company_name || op.member_name || `ID: ${op.id}`, value: op.company_id || op.member_id || op.id}))
                        .filter((v: any,i: number,a: any[])=>a.findIndex((t: any)=>(t.value === v.value))===i) 
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Buyer">
              <Controller
                name="buyer" 
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Buyer"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={allOpportunitiesForFilter
                        .filter((op: ApiOpportunityItem) => op.spb_role === "Buyer" || op.want_to === "Buy")
                        .map((op: ApiOpportunityItem) => ({label: op.company_name || op.member_name || `ID: ${op.id}`, value: op.company_id || op.member_id || op.id}))
                        .filter((v: any,i: number,a: any[])=>a.findIndex((t: any)=>(t.value === v.value))===i)
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Matched Found Count">
              <Controller
                name="matches"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter Matches Found"
                    className="text-nowrap text-ellipsis"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Match Score">
              <Controller
                name="score"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Score Range"
                    className="text-nowrap text-ellipsis"
                    isMulti
                    options={[
                      { label: "0% - 24%", value: "0-24" },
                      { label: "25% - 49%", value: "25-49" },
                      { label: "50% - 74%", value: "50-74" },
                      { label: "75% - 100%", value: "75-100" },
                    ]}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Created Date">
              <Controller
                name="created-date"
                control={control}
                render={({ field }) => (
                  <DatePicker.DatePickerRange
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick Date Range"
                    className="text-nowrap text-ellipsis"
                  />
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Drawer>
    </>
  )
}

const OpportunityTableTools = ({ onSearchChange }: { onSearchChange: (query: string) => void; }) => (
  <div className="flex-grow flex gap-2">
    <OpportunitySearch onInputChange={onSearchChange} />
    <OpportunityFilterDrawer />
    <Button icon={<TbCloudUpload />}>Export</Button>
  </div>
);

const OpportunityActionTools = ({ activeTab }: { activeTab: string; }) => {
  const navigate = useNavigate();
  const handleAddItem = () => {
    let path = '/sales-leads/opportunities/'; 
    if (activeTab === TABS.SELLER) {
      path += 'seller/create';
    } else if (activeTab === TABS.BUYER) {
      path += 'buyer/create';
    } else if (activeTab === TABS.AUTO_MATCH) {
      toast.push(<Notification title="Info" type="info">"Add New" is not specific for Auto Match. Select Buyer/Seller tab.</Notification>);
      return; 
    } else { 
      path += 'seller/create'; 
      toast.push(<Notification title="Info" type="info">Defaulting to Add New Seller. Select a specific tab for Buyer.</Notification>);
    }
    navigate(path);
  };

  const showAddButton = activeTab !== TABS.AUTO_MATCH; 

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {showAddButton && (
        <Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={handleAddItem}>
          Add New
        </Button>
      )}
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

const MainRowActionColumn = ({ onEdit, item, currentTab }: { onEdit: () => void; item: OpportunityItem, currentTab: string }) => {
  const navigate = useNavigate();
  const handleDelete = () => {
    toast.push(<Notification title="Delete" type="info">Simulating delete for {item.opportunity_id}</Notification>);
  };
  
  const handleViewDetails = () => {
     let path = `/sales-leads/opportunities/`;
     if (item.spb_role === "Seller" || (currentTab === TABS.SELLER && !item.spb_role) ) {
        path += `seller/detail/${item.id}`; 
     } else if (item.spb_role === "Buyer" || (currentTab === TABS.BUYER && !item.spb_role)) {
        path += `buyer/detail/${item.id}`;
     } else if (currentTab === TABS.AUTO_MATCH) {
        path += `match/detail/${item.id}`; 
     } else { 
        path += `detail/${item.id}`; 
     }
     navigate(path);
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <div className="flex items-center justify-center gap-1">
        <Tooltip title="Copy">
          <div
            className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
            role="button"
          >
            <TbCopy />
          </div>
        </Tooltip>
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
            onClick={handleViewDetails}
          >
            <TbEye />
          </div>
        </Tooltip>
        <Tooltip title="Share">
          <Dropdown renderTitle={
            <div
              className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
            >
              <TbShare />
            </div>
          }>
            <Dropdown.Item><div className="flex gap-2 items-center text-sm"><TbBrandWhatsapp size={20} /> Whatsapp</div></Dropdown.Item>
            <Dropdown.Item><div className="flex gap-2 items-center text-sm"><TbMail size={20} /> Email</div></Dropdown.Item>
          </Dropdown>
        </Tooltip>
        <Tooltip title="More">
          <Dropdown renderTitle={
            <div
              className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
              role="button"
            >
              <TbDotsVertical />
            </div>
          }>
            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
              <div className="flex gap-2 items-center text-xs"><TbPhone size={20} /> Contact Now</div>
            </Dropdown.Item>
            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
              <div className="flex gap-2 items-center text-xs"><TbLinkPlus size={20} /> Share Link</div>
            </Dropdown.Item>
            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
              <div className="flex gap-2 items-center text-xs"><TbClipboardCheck size={20} /> Copy SPB</div>
            </Dropdown.Item>
            <Dropdown.Item className="py-2" style={{ height: "auto" }}>
              <div className="flex gap-2 items-center text-xs"><TbLock size={20} /> Lock Match</div>
            </Dropdown.Item>
            <Dropdown.Item className="py-2" style={{ height: "auto" }} onClick={handleDelete}>
              <div className="flex gap-2 items-center text-xs"><TbTrash size={20} /> Delete</div>
            </Dropdown.Item>
          </Dropdown>

        </Tooltip>
      </div>
    </div>
  );
};

const ExpandedOpportunityDetails: React.FC<{ row: Row<OpportunityItem>; currentTab: string; }> = ({ row: { original: item }, currentTab }) => {
  const navigate = useNavigate();
  const handleExpandedAction = (action: string, id: string) => {
    toast.push(<Notification type="info" title={`${action} for ${id} (from expanded view)`} />);
    if (action === "Edit") {
       let path = '/sales-leads/opportunities/';
        if (item.spb_role === "Seller" || (currentTab === TABS.SELLER && !item.spb_role)) {
            path += `seller/edit/${id}`;
        } else if (item.spb_role === "Buyer" || (currentTab === TABS.BUYER && !item.spb_role)) {
            path += `buyer/edit/${id}`;
        } else if (currentTab === TABS.AUTO_MATCH) {
            path += `seller/edit/${id}`; 
            toast.push(<Notification title="Info" type="info">Editing Seller aspect of match.</Notification>)
        } else { 
            if(item.spb_role === "Seller" || item.want_to === "Sell") path += `seller/edit/${id}`;
            else if(item.spb_role === "Buyer" || item.want_to === "Buy") path += `buyer/edit/${id}`;
            else path += `detail/${id}`; 
        }
        if (path.includes("/edit/")) navigate(path);
        else toast.push(<Notification title="Info" type="warning">Cannot determine edit type for this item from current view.</Notification>)
    }
  };
  const opportunityType = item.spb_role ? `${item.spb_role} in SPB` : (item.want_to || "General");
  return (
    <>
      <Card bordered className="m-1 my-2 rounded-lg">
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Opportunity Snapshot</h6>
            <InfoLine icon={<TbIdBadge2 size={14} />} label="Opp. ID" text={item.opportunity_id} className="font-medium text-sm" />
            <InfoLine icon={<TbBox size={14} />} label="Product" text={item.product_name?.slice(0, 25) + (item.product_name && item.product_name.length > 25 ? "…" : "")} className="font-medium text-sm" title={item.product_name}/>
            <InfoLine icon={<TbTag size={14} />} label="Category" text={`${(item.product_category || 'N/A').toString().slice(0, 15) + ((item.product_category && item.product_category.length > 15) ? "…" : "")}${item.product_subcategory ? ` > ${item.product_subcategory.slice(0, 15) + (item.product_subcategory.length > 15 ? "…" : "")}` : ''}`} />
            <InfoLine icon={<TbTag size={14} />} label="Brand" text={item.brand ? item.brand.slice(0, 15) + (item.brand.length > 15 ? "…" : "") : 'N/A'} />
            {item.product_specs && <InfoLine icon={<TbInfoCircle size={14} />} label="Specs" text={item.product_specs} />}
            <InfoLine icon={<TbChecklist size={14} />} label="Quantity" text={item.quantity?.toString() || 'N/A'} />
            <InfoLine icon={<TbProgressCheck size={14} />} label="Product Status" text={item.product_status_listing || 'N/A'} />
            <InfoLine icon={<TbExchange size={14} />} label="Intent/Role" text={opportunityType} />
          </div>
          <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Company & Member</h6>
            <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm mb-2">
              <div className="flex items-center">
                {item.company_id && <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">{item.company_id} |</span>}
                <InfoLine icon={<TbBuilding size={14} />} text={item.company_name} className="font-semibold" />
              </div>
            </div>
            <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center">
                {item.member_id && <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px] mr-1">{item.member_id} |</span>}
                <InfoLine icon={<TbUser size={14} />} text={item.member_name} className="font-semibold" />
              </div>
              <InfoLine text={item.member_type} className="ml-5 text-indigo-600 dark:text-indigo-400 font-medium" />
              {item.member_email && <InfoLine icon={<TbMail size={14} />} text={<a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a>} />}
              {item.member_phone && <InfoLine icon={<TbPhone size={14} />} text={item.member_phone} />}
            </div>
            {item.listing_url && <InfoLine icon={<TbLinkIcon size={14} />} label="Listing" text={<a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[180px]" title={item.listing_url}>{item.listing_url}</a>} />}
          </div>
          <div className="space-y-1.5">
            <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Match & Lifecycle</h6>
            <InfoLine icon={<TbRadar2 size={14} />} label="Other Matched Found" text={'5, 6'} />
            <InfoLine icon={<TbTargetArrow size={14} />} label="Match Score" text={`${item.match_score}%`} />
            <div className="flex items-center gap-2">
              <InfoLine icon={<TbProgressCheck size={14} />} label="Opp. Status" />
              <Tag className={`${opportunityStatusTagColor[item.opportunity_status] || opportunityStatusTagColor.default} capitalize`}>{item.opportunity_status}</Tag>
            </div>
            <FormattedDate label="Created" dateString={item.created_date} />
            <div className="pt-2 mt-2 border-t dark:border-gray-600">
              <h6 className="text-sm font-semibold mb-1">Actions</h6>
              <div className="flex items-center gap-2">
                <Tooltip title="Edit">
                  <div
                    className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                    role="button"
                    onClick={() => handleExpandedAction('Edit', item.id)}
                  >
                    <TbPencil />
                  </div>
                </Tooltip>
                <Tooltip title="View">
                   <div
                    className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    role="button"
                  >
                    <TbEye />
                  </div>
                </Tooltip>
                <Tooltip title="Make Offer / Demand">
                  <div
                    className="text-xl cursor-pointer select-none text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                    role="button"
                  >
                    <TbSend2 />
                  </div>
                </Tooltip>
                <Tooltip title="Delete">
                  <div
                    className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    role="button"
                    onClick={() => handleExpandedAction('Delete', item.id)}
                  >
                    <TbTrash />
                  </div>
                </Tooltip>
                <div
                  className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  role="button"
                >
                  <Dropdown renderTitle={<TbDotsVertical/>}>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Accept</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Counter</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Reject</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Contact Now</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Add in Active</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Add Schedule</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">Add Task</div>
                    </Dropdown.Item>
                    <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                      <div className="flex gap-2 text-xs">View Alert</div>
                    </Dropdown.Item>
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

// --- Main Opportunities Component ---
const Opportunities = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { 
    Opportunities = [], // Expected: { data: ApiOpportunityItem[], total?: number }
    status: masterLoadingStatus = "idle", 
  } = useSelector(masterSelector);
  
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [tableQueries, setTableQueries] = useState<Record<string, TableQueries>>({});
  const [selectedItems, setSelectedItems] = useState<Record<string, OpportunityItem[]>>({});
  const [currentTab, setCurrentTab] = useState<string>(TABS.ALL);
  const [expanded, setExpanded] = useState<ExpandedState>({}) 

  useEffect(() => {
    dispatch(getOpportunitiesAction());
  }, [dispatch]);

  // const Opportunities = useMemo(() => reduxOpportunities?.data || [], [reduxOpportunities?.data]);

  useEffect(() => {
    if (Array.isArray(Opportunities)) {
        const mappedOpportunities = Opportunities.map((apiItem: ApiOpportunityItem): OpportunityItem => {
            let uiStatus: OpportunityItem["status"] = "pending"; // Default UI status
            if (apiItem.status?.toLowerCase() === "pending") uiStatus = "pending";
            else if (apiItem.status?.toLowerCase() === "active") uiStatus = "active";
            else if (apiItem.status?.toLowerCase() === "on hold" || apiItem.status?.toLowerCase() === "on_hold") uiStatus = "on_hold";
            else if (apiItem.status?.toLowerCase() === "closed") uiStatus = "closed";
            else if (apiItem.status) uiStatus = apiItem.status.toLowerCase();


            let uiOppStatus: OpportunityItem["opportunity_status"] = "New"; // Default
            if (apiItem.opportunity_status?.toLowerCase() === "new") uiOppStatus = "New";
            else if (apiItem.opportunity_status?.toLowerCase() === "shortlisted") uiOppStatus = "Shortlisted";
            else if (apiItem.opportunity_status?.toLowerCase() === "converted") uiOppStatus = "Converted";
            else if (apiItem.opportunity_status?.toLowerCase() === "rejected") uiOppStatus = "Rejected";
            else if (apiItem.opportunity_status) uiOppStatus = apiItem.opportunity_status;


            return {
                id: apiItem.id,
                opportunity_id: apiItem.opportunity_id || `OPP-${apiItem.id}`,
                product_name: apiItem.product_name || "N/A",
                status: uiStatus,
                opportunity_status: uiOppStatus,
                match_score: apiItem.match_score ?? 0,
                created_date: apiItem.created_date || new Date().toISOString(),
                buy_listing_id: apiItem.buy_listing_id || undefined,
                sell_listing_id: apiItem.sell_listing_id || undefined,
                spb_role: apiItem.spb_role || undefined,
                product_category: apiItem.product_category || undefined,
                product_subcategory: apiItem.product_subcategory || undefined,
                brand: apiItem.brand || undefined,
                product_specs: apiItem.product_specs || undefined,
                quantity: (typeof apiItem.quantity === 'string' ? parseInt(apiItem.quantity, 10) : apiItem.quantity) ?? undefined,
                product_status_listing: apiItem.product_status_listing || undefined,
                want_to: apiItem.want_to || undefined,
                company_name: apiItem.company_name || "N/A",
                company_id: apiItem.company_id || undefined,
                member_name: apiItem.member_name || "N/A",
                member_id: apiItem.member_id || undefined,
                member_email: apiItem.member_email || undefined,
                member_phone: apiItem.member_phone || undefined,
                member_type: apiItem.member_type || "Standard",
                price_match_type: apiItem.price_match_type || undefined,
                quantity_match_listing: apiItem.quantity_match_listing || undefined, // Use API's value, may need interpretation
                location_match: apiItem.location_match || undefined,
                matches_found_count: apiItem.matches_found_count ?? undefined,
                last_updated: apiItem.last_updated || undefined,
                assigned_to: String(apiItem.assigned_to || ""),
                notes: apiItem.notes || undefined,
                listing_url: apiItem.listing_url || undefined,
            };
        });
        setOpportunities(mappedOpportunities);
    } else {
        setOpportunities([]);
    }
  }, [Opportunities]);


  useEffect(() => {
    const initialTableQuery = { pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" } as ColumnSort, query: "" };
    setTableQueries({
      [TABS.ALL]: { ...initialTableQuery },
      [TABS.SELLER]: { ...initialTableQuery },
      [TABS.BUYER]: { ...initialTableQuery },
      [TABS.AUTO_MATCH]: { ...initialTableQuery },
    });
    setSelectedItems({ [TABS.ALL]: [], [TABS.SELLER]: [], [TABS.BUYER]: [], [TABS.AUTO_MATCH]: [] });
  }, []);

  useEffect(() => {
    const currentTableQuery = tableQueries[currentTab] || { pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" } as ColumnSort, query: "" };
    setTableQueries(prev => ({ ...prev, [currentTab]: { ...currentTableQuery, pageIndex: 1 } }));
    setSelectedItems(prev => ({ ...prev, [currentTab]: [] }));
    setExpanded({});
  }, [currentTab]);

  const currentTableData = tableQueries[currentTab] || { pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" } as ColumnSort, query: "" };
  const currentSelectedItems = selectedItems[currentTab] || [];

  const filteredOpportunities = useMemo(() => {
    let data = [...opportunities]; // Use Redux-driven and mapped opportunities
    if (currentTab === TABS.SELLER) {
      data = data.filter(op => op.spb_role === "Seller" || op.want_to === "Sell" || (op.sell_listing_id && !op.buy_listing_id));
    } else if (currentTab === TABS.BUYER) {
      data = data.filter(op => op.spb_role === "Buyer" || op.want_to === "Buy" || (op.buy_listing_id && !op.sell_listing_id));
    } else if (currentTab === TABS.AUTO_MATCH) {
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
    const { order, key } = currentTableData.sort as unknown as OnSortParamTanstack; 

    if (order && key && processedData.length > 0) {
      const sampleItem = processedData[0];
      if (sampleItem && key in sampleItem) {
        processedData.sort((a, b) => {
          const aVal = a[key as keyof OpportunityItem];
          const bVal = b[key as keyof OpportunityItem];
          if (key === "created_date" || key === "last_updated") {
            if (!aVal || !bVal) return 0; // Handle null/undefined dates
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
  const handlePaginationChange = useCallback((page: number) => handleSetCurrentTableData({ pageIndex: page }), [handleSetCurrentTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetCurrentTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems(prev => ({ ...prev, [currentTab]: [] })); }, [handleSetCurrentTableData, currentTab]);
  const handleSort = useCallback((sort: OnSortParamTanstack) => handleSetCurrentTableData({ sort: sort as any, pageIndex: 1 }), [handleSetCurrentTableData]); 
  const handleSearchChange = useCallback((query: string) => handleSetCurrentTableData({ query: query, pageIndex: 1 }), [handleSetCurrentTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: OpportunityItem) => { setSelectedItems(prev => ({ ...prev, [currentTab]: checked ? [...(prev[currentTab] || []), row] : (prev[currentTab] || []).filter((i) => i.id !== row.id) })); }, [currentTab]);
  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<OpportunityItem>[]) => { setSelectedItems(prev => ({ ...prev, [currentTab]: checked ? rows.map((r) => r.original) : [] })); }, [currentTab]);
  
  const handleEdit = useCallback((item: OpportunityItem) => {
    let path = '/sales-leads/opportunities/'; 
    if (item.spb_role === "Seller" || (currentTab === TABS.SELLER && !item.spb_role)) {
        path += `seller/edit/${item.id}`;
    } else if (item.spb_role === "Buyer" || (currentTab === TABS.BUYER && !item.spb_role)) {
        path += `buyer/edit/${item.id}`;
    } else if (currentTab === TABS.AUTO_MATCH) {
        path += `seller/edit/${item.id}`; 
        toast.push(<Notification title="Info" type="info">Editing Seller aspect of this match.</Notification>);
    } else { 
        if(item.spb_role === "Seller" || item.want_to === "Sell") path += `seller/edit/${item.id}`;
        else if(item.spb_role === "Buyer" || item.want_to === "Buy") path += `buyer/edit/${item.id}`;
        else {
            toast.push(<Notification title="Warning" type="warning">Cannot determine specific edit type for this item from 'All' tab. Please select Buyer/Seller tab or implement specific logic.</Notification>);
            path += `detail/${item.id}`; 
        }
    }
    if (path.includes("/edit/")) navigate(path);
    else if (path.includes("/detail/")) navigate(path); 
  }, [navigate, currentTab]);
  
  const handleDeleteSelected = useCallback(() => { 
    const selectedIds = new Set(currentSelectedItems.map((i) => i.id)); 
    // Here you would typically dispatch a Redux action to delete items from the backend
    // For now, just filtering local state
    setOpportunities((prevAll) => prevAll.filter((i) => !selectedIds.has(i.id))); 
    setSelectedItems(prev => ({ ...prev, [currentTab]: [] })); 
    toast.push(<Notification title="Records Deleted" type="success">{`${selectedIds.size} record(s) deleted.`}</Notification>); 
    // dispatch(deleteOpportunitiesAction({ids: Array.from(selectedIds)})).then(() => dispatch(getOpportunitiesAction())); // Example Redux flow
  }, [currentSelectedItems, currentTab, dispatch]); // Added dispatch

  const handleTabChange = (tabKey: string) => { if (tabKey === currentTab) return; setCurrentTab(tabKey); };

  const getColumnsForStandardView = useCallback((): ColumnDef<OpportunityItem>[] => [
    {
      header: "Products",
      accessorKey: "opportunity_id",
      size: 300,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-start gap-3">
            <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
              {item.product_name?.substring(0, 2).toUpperCase()}
            </Avatar>
            <div className="flex flex-col">
              <Link to={`/sales-leads/opportunities/${item.spb_role?.toLowerCase() || 'detail'}/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                {item.opportunity_id}
              </Link>
              <Tooltip title={item.product_name}>
                <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[240px]">
                  {item.product_name?.slice(0, 25) + (item.product_name && item.product_name.length > 25 ? "…" : "")}
                </span>
              </Tooltip>
              <Tag className={`${recordStatusTagColor[item.status] || recordStatusTagColor.default} capitalize text-[10px] px-1.5 py-0.5 mt-1 self-start`}>{item.status}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      header: "Company & Member",
      accessorKey: "company_name",
      size: 260,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs">
            <div className="mb-1.5 flex items-center">
              <TbBuilding size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={item.company_name}>{item.company_name}</span>
                {item.company_id && <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.company_id}</span>}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex items-center">
              <TbUser size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
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
      }
    },
    {
      header: "Key Details & Matching",
      accessorKey: "match_score",
      size: 260,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs space-y-1">
            <InfoLine icon={<TbPhone size={13} />} text={item.member_phone || 'N/A'} />
            <InfoLine icon={<TbMail size={13} />} text={item.member_email ? <a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a> : 'N/A'} />
            <div className="pt-1 mt-1 border-t dark:border-gray-600">
              <InfoLine icon={<TbChecklist size={13} />} label="Qty" text={item.quantity ?? 'N/A'} />
              <InfoLine icon={<TbProgressCheck size={13} />} label="Stock" text={item.product_status_listing ?? 'N/A'} />
              <InfoLine icon={<TbExchange size={13} />} label="Want To" text={item.want_to ?? 'N/A'} />
            </div>
            <div className="pt-1 mt-1 border-t dark:border-gray-600">
              <InfoLine icon={<TbWorld size={13} />} label="Specs" text={item.product_specs ? (item.product_specs.length > 20 ? item.product_specs.substring(0, 17) + "..." : item.product_specs) : 'N/A'} title={item.product_specs} />
              <InfoLine icon={<TbRadar2 size={13} />} label="Matches" text={item.matches_found_count ?? 'N/A'} />
              <InfoLine icon={<TbTargetArrow size={13} />} label="Score" text={`${item.match_score}%`} />
            </div>
          </div>
        )
      }
    },
    {
      header: "Timestamps",
      accessorKey: "created_date",
      size: 170,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs space-y-1.5">
            <FormattedDate label="Created" dateString={item.created_date} />
            <div className="flex items-center gap-1">
              <InfoLine icon={<TbProgressCheck size={14} />} label="Opp." />
              <Tag className={`${opportunityStatusTagColor[item.opportunity_status] || opportunityStatusTagColor.default} capitalize text-[10px] px-1.5 py-0.5 whitespace-nowrap`}>{item.opportunity_status}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      header: "Actions",
      id: "action_std",
      size: 90,
      cell: (props) => <MainRowActionColumn
        onEdit={() => handleEdit(props.row.original)}
        item={props.row.original}
        currentTab={currentTab}
      />
    },
  ], [handleEdit, currentTab]);

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
      )
    },
    {
      header: "Products",
      accessorKey: "opportunity_id",
      size: 300,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-start gap-3">
            <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
              {item.product_name?.substring(0, 2).toUpperCase()}
            </Avatar>
            <div className="flex flex-col">
              <Link to={`/sales-leads/opportunities/match/detail/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                {item.opportunity_id}
              </Link>
              <Tooltip title={item.product_name}>
                <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[240px]">
                  {item.product_name?.slice(0, 25)}
                  {item.product_name && item.product_name.length > 25 ? "…" : ""}
                </span>
              </Tooltip>
              <Tag className={`${recordStatusTagColor[item.status] || recordStatusTagColor.default} capitalize text-[10px] px-1.5 py-0.5 mt-1 self-start`}>{item.status}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      header: "Company, Member & Role",
      accessorKey: "company_name",
      size: 280,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs">
            <div className="mb-1.5 flex items-center">
              <TbBuilding size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={item.company_name}>{item.company_name}</span>
                {item.company_id && <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.company_id}</span>}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex items-center">
              <TbUser size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
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
              <Tag className={classNames("mt-1.5 capitalize text-xs px-2 py-0.5", item.spb_role === "Seller" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300")}>
                <TbUsers className="inline mr-1 text-sm align-middle" /> {item.spb_role}
              </Tag>
            )}
          </div>
        )
      }
    },
    {
      header: "Key Details & Matching",
      accessorKey: "match_score",
      size: 260,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs space-y-1">
            <InfoLine icon={<TbPhone size={13} />} text={item.member_phone || 'N/A'} />
            <InfoLine icon={<TbMail size={13} />} text={item.member_email ? <a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a> : 'N/A'} />
            <div className="pt-1 mt-1 border-t dark:border-gray-600">
              <InfoLine icon={<TbChecklist size={13} />} label="Qty" text={item.quantity ?? 'N/A'} />
              <InfoLine icon={<TbProgressCheck size={13} />} label="Stock" text={item.product_status_listing ?? 'N/A'} />
              <InfoLine icon={<TbExchange size={13} />} label="Want To" text={item.want_to ?? 'N/A'} />
            </div>
            <div className="pt-1 mt-1 border-t dark:border-gray-600">
              <InfoLine icon={<TbWorld size={13} />} label="Specs" text={item.product_specs ? (item.product_specs.length > 20 ? item.product_specs.substring(0, 17) + "..." : item.product_specs) : 'N/A'} title={item.product_specs} />
              <InfoLine icon={<TbRadar2 size={13} />} label="Matches" text={item.matches_found_count ?? 'N/A'} />
              <InfoLine icon={<TbTargetArrow size={13} />} label="Score" text={`${item.match_score}%`} />
            </div>
          </div>
        )
      }
    },
    {
      header: "Timestamps & Status",
      accessorKey: "created_date",
      size: 170,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs space-y-1.5">
            <FormattedDate label="Created" dateString={item.created_date} />
            <div className="flex items-center gap-1">
              <InfoLine icon={<TbProgressCheck size={14} />} label="Opp." />
              <Tag className={`${opportunityStatusTagColor[item.opportunity_status] || opportunityStatusTagColor.default} capitalize text-[10px] px-1.5 py-0.5 whitespace-nowrap`}>{item.opportunity_status}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      header: "Quick Actions",
      id: "action_spb",
      size: 90,
      cell: (props) => <MainRowActionColumn
        onEdit={() => handleEdit(props.row.original)}
        item={props.row.original}
        currentTab={currentTab}
      />
    },
  ], [expanded, handleEdit, currentTab]); 

  const columns = useMemo(() => {
    if (currentTab === TABS.AUTO_MATCH) {
      return getColumnsForExpandableView();
    }
    return getColumnsForStandardView();
  }, [currentTab, getColumnsForStandardView, getColumnsForExpandableView]);

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Opportunities</h5>
          <OpportunityActionTools activeTab={currentTab} />
        </div>

        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
            {[TABS.ALL, TABS.SELLER, TABS.BUYER, TABS.AUTO_MATCH].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={classNames(
                  "whitespace-nowrap pb-2 mt-2 px-1 border-b-2 font-medium text-sm capitalize",
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
            loading={masterLoadingStatus === 'idle'}
            pagingData={{ total, pageIndex: currentTableData.pageIndex as number, pageSize: currentTableData.pageSize as number }}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect}
            onIndeterminateCheckBoxChange={handleAllRowSelect}
            checkboxChecked={(row: OpportunityItem) => currentSelectedItems.some((selected: OpportunityItem) => selected.id === row.id)}
            state={currentTab === TABS.AUTO_MATCH ? { expanded } : undefined}
            onExpandedChange={currentTab === TABS.AUTO_MATCH ? setExpanded : undefined}
            getRowCanExpand={currentTab === TABS.AUTO_MATCH ? () => true : undefined}
            renderRowSubComponent={currentTab === TABS.AUTO_MATCH ? (({ row }: { row: Row<OpportunityItem> }) =>
              <ExpandedOpportunityDetails row={row} currentTab={currentTab} />
            ) : undefined}
            noData={masterLoadingStatus !== 'loading' && pageData.length === 0}
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