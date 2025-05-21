// src/views/your-path/Opportunities.tsx

import React, { useState, useMemo, useCallback, Ref } from "react";
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
// Dialog not used in this version for brevity, but can be added for a detailed view modal
import Avatar from "@/components/ui/Avatar"; // Can be used for product initials or generic icon
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";

// Icons
import {
  TbPencil,
  TbCopy,
  TbSwitchHorizontal,
  TbTrash,
  TbChecks,
  TbSearch,
  TbPlus,
  TbExchange, // For Buy/Sell Listing IDs
  TbBox, // For Product
  TbTag, // For Brand/Category
  TbTargetArrow, // For Match Score
  TbProgressCheck, // For Opportunity Status
  TbCalendarTime, // For Dates
  TbUserCircle, // For Assigned To
  TbInfoCircle, // For Notes or general info
  TbMapPin, // For Location Match
  TbEye,
  TbShare,
  TbDotsVertical,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Define Item Type (Table Row Data) ---
export type OpportunityItem = {
  id: string; // Internal record ID
  status: "pending" | "active" | "on_hold" | "closed"; // Overall record status

  opportunity_id: string;
  buy_listing_id: string;
  sell_listing_id: string;
  product_name: string;
  product_category: string;
  product_subcategory: string;
  brand: string;
  price_match_type: "Exact" | "Range" | "Not Matched";
  quantity_match: "Sufficient" | "Partial" | "Not Matched";
  location_match?: "Local" | "National" | "Not Matched";
  match_score: number; // Percentage
  opportunity_status: "New" | "Shortlisted" | "Converted" | "Rejected";
  created_date: string; // ISO date string
  last_updated: string; // ISO date string
  assigned_to: string;
  notes?: string;
};
// --- End Item Type Definition ---

// --- Constants & Color Mappings ---
const recordStatusTagColor: Record<OpportunityItem["status"], string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  on_hold: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
  closed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
};

const opportunityStatusTagColor: Record<
  OpportunityItem["opportunity_status"],
  string
> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  Shortlisted:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  Converted:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  Rejected:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
};

const matchTypeColors = {
  Exact: "text-green-600 dark:text-green-400",
  Range: "text-blue-600 dark:text-blue-400",
  "Not Matched": "text-red-600 dark:text-red-400",
  Sufficient: "text-green-600 dark:text-green-400",
  Partial: "text-yellow-600 dark:text-yellow-400",
  Local: "text-green-600 dark:text-green-400",
  National: "text-blue-600 dark:text-blue-400",
};
// --- End Constants ---

const initialDummySellerData: OpportunityItem[] = [
  {
    id: "OPPS001",
    status: "active",
    opportunity_id: "OPP-S-001",
    buy_listing_id: "BUY123",
    sell_listing_id: "SELL456",
    product_name: "Gaming Laptop RTX 4080 Super",
    product_category: "Electronics",
    product_subcategory: "Laptops",
    brand: "Alienware",
    price_match_type: "Exact",
    quantity_match: "Sufficient",
    location_match: "Local",
    match_score: 96,
    opportunity_status: "Shortlisted",
    created_date: "2024-01-10T10:00:00Z",
    last_updated: "2024-01-12T15:30:00Z",
    assigned_to: "Sales Team Alpha",
    notes:
      "High potential seller, actively looking for buyers. Match score indicates strong alignment.",
  },
  {
    id: "OPPS002",
    status: "pending",
    opportunity_id: "OPP-S-002",
    buy_listing_id: "BUY124",
    sell_listing_id: "SELL457",
    product_name: "Professional DSLR Camera Kit",
    product_category: "Photography",
    product_subcategory: "Cameras",
    brand: "Canon",
    price_match_type: "Range",
    quantity_match: "Partial",
    location_match: "National",
    match_score: 82,
    opportunity_status: "New",
    created_date: "2024-02-01T09:00:00Z",
    last_updated: "2024-02-01T10:00:00Z",
    assigned_to: "Sales Team Bravo",
    notes:
      "Seller has multiple units, price negotiable within range. Good for bulk buyers.",
  },
];

const initialDummyBuyerData: OpportunityItem[] = [
  {
    id: "OPPB001",
    status: "active",
    opportunity_id: "OPP-B-001",
    buy_listing_id: "BUY789",
    sell_listing_id: "SELL321",
    product_name: "Vintage Leather Sofa Set",
    product_category: "Furniture",
    product_subcategory: "Living Room",
    brand: "Chesterfield",
    price_match_type: "Range",
    quantity_match: "Sufficient",
    location_match: "National",
    match_score: 89,
    opportunity_status: "New",
    created_date: "2024-01-15T11:00:00Z",
    last_updated: "2024-01-17T09:45:00Z",
    assigned_to: "Procurement Team X",
    notes:
      "Buyer looking for specific vintage style, flexible on price for quality.",
  },
  {
    id: "OPPB002",
    status: "pending",
    opportunity_id: "OPP-B-002",
    buy_listing_id: "BUY890",
    sell_listing_id: "SELL432",
    product_name: "Industrial Coffee Grinder",
    product_category: "Appliances",
    product_subcategory: "Kitchen",
    brand: "Mahlkönig",
    price_match_type: "Exact",
    quantity_match: "Sufficient",
    location_match: "Local",
    match_score: 93,
    opportunity_status: "Shortlisted",
    created_date: "2024-02-05T14:30:00Z",
    last_updated: "2024-02-05T16:15:00Z",
    assigned_to: "Procurement Team Y",
    notes:
      "Buyer needs immediate delivery for a new cafe opening. High priority.",
  },
  {
    id: "OPPB003",
    status: "on_hold",
    opportunity_id: "OPP-B-003",
    buy_listing_id: "BUY901",
    sell_listing_id: "SELL543",
    product_name: "Bulk Organic Cotton T-Shirts",
    product_category: "Apparel",
    product_subcategory: "Basics",
    brand: "Generic Eco",
    price_match_type: "Not Matched",
    quantity_match: "Partial",
    location_match: "Not Matched",
    match_score: 60,
    opportunity_status: "Rejected",
    created_date: "2024-02-10T10:15:00Z",
    last_updated: "2024-02-11T08:00:00Z",
    assigned_to: "Procurement Team Z",
    notes:
      "Significant price difference and buyer requires international shipping not offered by seller.",
  },
];

// Tab Definitions
const TABS = {
  SELLER: "seller",
  BUYER: "buyer",
};
// --- End Constants ---

// --- Helper Components ---
const FormattedDate = ({
  dateString,
  label,
}: {
  dateString?: string;
  label?: string;
}) => {
  if (!dateString)
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label ? `${label}: N/A` : "N/A"}
      </span>
    );
  try {
    return (
      <div className="text-xs">
        {label && (
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {label}:{" "}
          </span>
        )}
        {new Date(dateString).toLocaleDateString()}
      </div>
    );
  } catch (e) {
    return (
      <span className="text-xs text-red-500">
        {label ? `${label}: Invalid Date` : "Invalid Date"}
      </span>
    );
  }
};

const InfoLine: React.FC<{
  icon?: React.ReactNode;
  text?: string | number | null;
  label?: string;
  title?: string;
  className?: string;
}> = ({ icon, text, label, title, className }) => {
  if (text === null || text === undefined || text === "") return null;
  return (
    <div className={classNames("flex items-center gap-1.5 text-xs", className)}>
      {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
      {label && (
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {label}:
        </span>
      )}
      <span
        className="text-gray-700 dark:text-gray-200 truncate"
        title={title || String(text)}
      >
        {String(text)}
      </span>
    </div>
  );
};
// --- End Helper Components ---

// --- Reusable ActionColumn Component (Simplified for this context) ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onChangeStatus,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onChangeStatus: () => void;
}) => {
  return (
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
          onClick={onViewDetail}
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
      {/* <Tooltip title="Delete">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbTrash />
                </div>
            </Tooltip> */}
    </div>
  );
};
// --- End ActionColumn ---

// --- ItemTable, ItemSearch, ItemTableTools, ItemActionTools, ItemSelected (Mostly Unchanged, ensure props match) ---
// For brevity, I'll assume these are similar to your provided example,
// just ensure OpportunityItem is used for types and props.
// The ItemActionTools will be slightly adjusted for Opportunity context.

const ItemTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedItems,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: any) => (
  <DataTable
    selectable
    columns={columns}
    data={data}
    noData={!loading && data.length === 0}
    loading={loading}
    pagingData={pagingData}
    checkboxChecked={(row: OpportunityItem) =>
      selectedItems.some((selected: OpportunityItem) => selected.id === row.id)
    }
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
    onCheckBoxChange={onRowSelect}
    onIndeterminateCheckBoxChange={onAllRowSelect}
  />
);

const ItemSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    placeholder="Search opportunities (ID, Product, Brand...)"
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = ({
  onSearchChange,
}: {
  onSearchChange: (query: string) => void;
}) => (
  <div className="flex-grow">
    <ItemSearch onInputChange={onSearchChange} />
  </div>
);

const ItemActionTools = ({
  activeTab,
}: {
  allItems: OpportunityItem[];
  activeTab: string;
}) => {
  const navigate = useNavigate();
  const handleAddItem = () => {
    // Example navigation, adjust as needed

    const path =
      activeTab === TABS.SELLER
        ? "/sales-leads/seller/create"
        : "/sales-leads/buyer/create";
    navigate(path);
    // toast.push(<Notification title="Navigation" type="info">Redirecting to create page...</Notification>)
  };
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={handleAddItem}
      >
        Add New Opportunity
      </Button>
    </div>
  );
};

const ItemSelected = ({
  selectedItems,
  onDeleteSelected,
  activeTab,
}: {
  selectedItems: OpportunityItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<OpportunityItem[]>>;
  onDeleteSelected: () => void;
  activeTab: string;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  const type = activeTab === TABS.SELLER ? "Seller" : "Buyer";
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
              {" "}
              <span className="heading-text">{selectedItems.length}</span>{" "}
              {type} Opportunit{selectedItems.length > 1 ? "ies" : "y"} selected
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={confirmOpen}
        type="danger"
        title={`Delete Selected ${type} Opportunities`}
        onClose={() => setConfirmOpen(false)}
        onRequestClose={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setConfirmOpen(false);
        }}
      >
        <p>
          Are you sure you want to delete the selected {selectedItems.length}{" "}
          {type.toLowerCase()} opportunit
          {selectedItems.length > 1 ? "ies" : "y"}? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
// --- End Reused Components ---

// --- Main Opportunities Component ---
const Opportunities = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [sellerData, setSellerData] = useState<OpportunityItem[]>(
    initialDummySellerData
  );
  const [buyerData, setBuyerData] = useState<OpportunityItem[]>(
    initialDummyBuyerData
  );
  const [sellerTableData, setSellerTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [buyerTableData, setBuyerTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedSellerItems, setSelectedSellerItems] = useState<
    OpportunityItem[]
  >([]);
  const [selectedBuyerItems, setSelectedBuyerItems] = useState<
    OpportunityItem[]
  >([]);
  const [currentTab, setCurrentTab] = useState<string>(TABS.SELLER);

  const currentItems = useMemo(
    () => (currentTab === TABS.SELLER ? sellerData : buyerData),
    [currentTab, sellerData, buyerData]
  );
  const currentTableData = useMemo(
    () => (currentTab === TABS.SELLER ? sellerTableData : buyerTableData),
    [currentTab, sellerTableData, buyerTableData]
  );
  const currentSelectedItems = useMemo(
    () =>
      currentTab === TABS.SELLER ? selectedSellerItems : selectedBuyerItems,
    [currentTab, selectedSellerItems, selectedBuyerItems]
  );
  const setCurrentItems = useMemo(
    () => (currentTab === TABS.SELLER ? setSellerData : setBuyerData),
    [currentTab]
  );
  const setCurrentTableData = useMemo(
    () => (currentTab === TABS.SELLER ? setSellerTableData : setBuyerTableData),
    [currentTab]
  );
  const setCurrentSelectedItems = useMemo(
    () =>
      currentTab === TABS.SELLER
        ? setSelectedSellerItems
        : setSelectedBuyerItems,
    [currentTab]
  );

  const { pageData, total } = useMemo(() => {
    let processedData = [...currentItems];
    if (currentTableData.query) {
      const query = currentTableData.query.toLowerCase();
      processedData = processedData.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }
    const { order, key } = currentTableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof OpportunityItem];
        const bVal = b[key as keyof OpportunityItem];
        if (key === "created_date" || key === "last_updated") {
          return order === "asc"
            ? new Date(aVal as string).getTime() -
                new Date(bVal as string).getTime()
            : new Date(bVal as string).getTime() -
                new Date(aVal as string).getTime();
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    const pageIndex = currentTableData.pageIndex as number;
    const pageSize = currentTableData.pageSize as number;
    const dataTotal = processedData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: dataTotal,
    };
  }, [currentItems, currentTableData]);

  const handleSetCurrentTableData = useCallback(
    (data: Partial<TableQueries>) => {
      setCurrentTableData((prev) => ({ ...prev, ...data }));
    },
    [setCurrentTableData]
  );

  const handlePaginationChange = useCallback(
    (page: number) => handleSetCurrentTableData({ pageIndex: page }),
    [handleSetCurrentTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetCurrentTableData({ pageSize: Number(value), pageIndex: 1 });
      setCurrentSelectedItems([]);
    },
    [handleSetCurrentTableData, setCurrentSelectedItems]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) =>
      handleSetCurrentTableData({ sort: sort, pageIndex: 1 }),
    [handleSetCurrentTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) =>
      handleSetCurrentTableData({ query: query, pageIndex: 1 }),
    [handleSetCurrentTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: OpportunityItem) => {
      setCurrentSelectedItems((prev) =>
        checked ? [...prev, row] : prev.filter((i) => i.id !== row.id)
      );
    },
    [setCurrentSelectedItems]
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<OpportunityItem>[]) => {
      setCurrentSelectedItems(checked ? rows.map((r) => r.original) : []);
    },
    [setCurrentSelectedItems]
  );

  const handleEdit = useCallback(
    (item: OpportunityItem) => {
      console.log(`Edit item:`, item.id);
      // navigate(`/app/opportunities/${currentTab}/edit/${item.id}`); // Example route
      toast.push(
        <Notification
          title="Edit Clicked"
          type="info"
        >{`Editing opportunity ${item.opportunity_id}`}</Notification>
      );
    },
    [navigate, currentTab]
  );

  const handleClone = useCallback(
    (itemToClone: OpportunityItem) => {
      const newId = `OPPCLONE${Math.floor(Math.random() * 9000) + 1000}`;
      const clonedItem: OpportunityItem = {
        ...itemToClone,
        id: newId,
        opportunity_id: `${itemToClone.opportunity_id}-CLONE`,
        status: "pending",
        opportunity_status: "New",
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        assigned_to: "",
      };
      setCurrentItems((prev) => [clonedItem, ...prev]);
      toast.push(
        <Notification title="Record Copied" type="success" duration={2000} />
      );
    },
    [setCurrentItems]
  );

  const handleChangeStatus = useCallback(
    (item: OpportunityItem) => {
      const statuses: OpportunityItem["status"][] = [
        "pending",
        "active",
        "on_hold",
        "closed",
      ];
      const newStatus =
        statuses[(statuses.indexOf(item.status) + 1) % statuses.length];
      setCurrentItems((current) =>
        current.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );
      toast.push(
        <Notification
          title="Status Changed"
          type="success"
        >{`Status of ${item.opportunity_id} to ${newStatus}.`}</Notification>
      );
    },
    [setCurrentItems]
  );

  const handleDelete = useCallback(
    (itemToDelete: OpportunityItem) => {
      setCurrentItems((current) =>
        current.filter((item) => item.id !== itemToDelete.id)
      );
      setCurrentSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete.id)
      );
      toast.push(
        <Notification
          title="Record Deleted"
          type="success"
        >{`Opportunity ${itemToDelete.opportunity_id} deleted.`}</Notification>
      );
    },
    [setCurrentItems, setCurrentSelectedItems]
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedIds = new Set(currentSelectedItems.map((i) => i.id));
    setCurrentItems((current) => current.filter((i) => !selectedIds.has(i.id)));
    setCurrentSelectedItems([]);
    toast.push(
      <Notification
        title="Records Deleted"
        type="success"
      >{`${selectedIds.size} record(s) deleted.`}</Notification>
    );
  }, [currentSelectedItems, setCurrentItems, setCurrentSelectedItems]);

  const handleTabChange = (tabKey: string) => {
    if (tabKey === currentTab) return;
    setCurrentTab(tabKey);
    // Reset table state for the tab being switched away from
    if (tabKey === TABS.SELLER) {
      setBuyerTableData({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: "", key: "" },
        query: "",
      });
      setSelectedBuyerItems([]);
    } else {
      setSellerTableData({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: "", key: "" },
        query: "",
      });
      setSelectedSellerItems([]);
    }
  };

  const columns: ColumnDef<OpportunityItem>[] = useMemo(
    () => [
      {
        header: "Opportunity Info",
        accessorKey: "opportunity_id",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                {item.opportunity_id}
              </span>
              <InfoLine
                icon={<TbBox size={14} />}
                text={item.product_name}
                title={item.product_name}
              />
              <InfoLine
                icon={<TbTag size={14} />}
                text={`${item.product_category} > ${item.product_subcategory}`}
              />
              <InfoLine
                icon={<TbTag size={14} />}
                label="Brand"
                text={item.brand}
              />
              <div className="mt-1">
                <Tag
                  className={`${
                    recordStatusTagColor[item.status]
                  } capitalize text-[10px] px-1.5 py-0.5`}
                >
                  {item.status}
                </Tag>
              </div>
            </div>
          );
        },
      },
      {
        header: "Listing IDs",
        accessorKey: "buy_listing_id", // Sort by buy_listing_id primarily
        size: 180,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <InfoLine
                icon={<TbExchange size={14} />}
                label="Buy"
                text={item.buy_listing_id}
              />
              <InfoLine
                icon={<TbExchange size={14} />}
                label="Sell"
                text={item.sell_listing_id}
              />
            </div>
          );
        },
      },
      {
        header: "Match Details",
        accessorKey: "match_score",
        enableSorting: true,
        size: 200,
        cell: ({ row }) => {
          const item = row.original;
          const scoreColor =
            item.match_score >= 90
              ? "bg-emerald-500"
              : item.match_score >= 75
              ? "bg-blue-500"
              : "bg-amber-500";
          return (
            <div className="flex flex-col gap-1 text-xs">
              <Tooltip title={`Match Score: ${item.match_score}%`}>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`${scoreColor} h-2.5 rounded-full text-center text-[10px] text-white leading-[10px]`}
                    style={{ width: `${item.match_score}%` }}
                  >
                    {item.match_score}%
                  </div>
                </div>
              </Tooltip>
              <InfoLine
                label="Price"
                text={item.price_match_type}
                className={matchTypeColors[item.price_match_type]}
              />
              <InfoLine
                label="Qty"
                text={item.quantity_match}
                className={matchTypeColors[item.quantity_match]}
              />
              {item.location_match && (
                <InfoLine
                  icon={<TbMapPin size={14} />}
                  label="Location"
                  text={item.location_match}
                  className={
                    matchTypeColors[item.location_match || "Not Matched"]
                  }
                />
              )}
            </div>
          );
        },
      },
      {
        header: "Status & Assignment",
        accessorKey: "opportunity_status",
        enableSorting: true,
        size: 200,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <Tag
                className={`${
                  opportunityStatusTagColor[item.opportunity_status]
                } capitalize px-2 py-1 text-[11px]`}
              >
                {item.opportunity_status}
              </Tag>
              <InfoLine
                icon={<TbUserCircle size={14} />}
                label="Assigned"
                text={item.assigned_to}
              />
              <FormattedDate label="Created" dateString={item.created_date} />
              <FormattedDate label="Updated" dateString={item.last_updated} />
            </div>
          );
        },
      },
      // Notes could be a separate column if short, or viewed in a detail modal
      // {
      //     header: 'Notes',
      //     accessorKey: 'notes',
      //     size: 200,
      //     cell: ({row}) => <Tooltip title={row.original.notes}><p className="truncate max-w-[180px] text-xs">{row.original.notes || 'N/A'}</p></Tooltip>
      // },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            onEdit={() => handleEdit(props.row.original)}
            onViewDetail={() => handleDelete(props.row.original)}
          />
        ),
      },
    ],
    [handleEdit, handleClone, handleChangeStatus, handleDelete, currentTab]
  ); // Added currentTab dependency

  return (
    <Container className="h-full">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Opportunities Management</h5>
          <ItemActionTools allItems={currentItems} activeTab={currentTab} />
        </div>

        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[TABS.SELLER, TABS.BUYER].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={classNames(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize",
                  currentTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                )}
              >
                {tab} Opportunities
              </button>
            ))}
          </nav>
        </div>

        <div className="mb-4">
          <ItemTableTools onSearchChange={handleSearchChange} />
        </div>

        <div className="flex-grow overflow-auto">
          <ItemTable
            columns={columns}
            data={pageData}
            loading={isLoading}
            pagingData={{
              total,
              pageIndex: currentTableData.pageIndex as number,
              pageSize: currentTableData.pageSize as number,
            }}
            selectedItems={currentSelectedItems}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>
      <ItemSelected
        selectedItems={currentSelectedItems}
        setSelectedItems={setCurrentSelectedItems}
        onDeleteSelected={handleDeleteSelected}
        activeTab={currentTab}
      />
    </Container>
  );
};

export default Opportunities;
