// src/views/your-path/OffersDemands.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import { Dropdown } from "@/components/ui";
import Spinner from "@/components/ui/Spinner"; // Import Spinner

// Icons
import {
  TbPencil,
  TbEye,
  TbShare,
  TbDotsVertical,
  TbChecks,
  TbSearch,
  TbPlus,
  TbFilter,
  TbUserCircle,
  TbRefresh, // For a potential refresh button
} from "react-icons/tb";

// Redux (VERIFY PATHS)
import { useAppDispatch } from '@/reduxtool/store'; // Assuming useAppDispatch is correctly typed
import {
    getOffersAction,
    getDemandsAction,
} from '@/reduxtool/master/middleware'; // VERIFY PATH
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH
import { useSelector } from 'react-redux';

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- API Item Types (Assumed Structure - Place this in a types file if shared) ---
export type ApiCreatorInfo = {
  userId?: string;
  userName: string;
};

export type ApiGroupItem = {
  groupName: string;
  items: string[];
};

export type ApiOfferItem = {
  id: string;
  offerName: string;
  createdBy: ApiCreatorInfo;
  assignedTo?: ApiCreatorInfo;
  createdAt: string; // ISO date string
  updatedAt?: string;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
};

export type ApiDemandItem = {
  id: string;
  demandName: string;
  requestedBy: ApiCreatorInfo; // Potentially different field name for creator
  assignedTo?: ApiCreatorInfo;
  createdAt: string; // ISO date string
  updatedAt?: string;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
};
// --- End API Item Types ---

// --- Unified Table Row Data (OfferDemandItem) ---
export type OfferDemandItem = {
  id: string;
  type: "Offer" | "Demand";
  name: string;
  createdByInfo: ApiCreatorInfo;
  assignedToInfo?: ApiCreatorInfo;
  createdDate: Date;
  updatedDate?: Date;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
  originalOffer?: ApiOfferItem; // Store original for detailed views or actions
  originalDemand?: ApiDemandItem;
};
// --- End Unified Table Row Data ---


// --- Constants ---
const TABS = {
  ALL: "all",
  OFFER: "offer",
  DEMAND: "demand",
};
// --- End Constants ---

// Helper to transform API Offer to OfferDemandItem
const transformApiOffer = (apiOffer: ApiOfferItem): OfferDemandItem => ({
  id: apiOffer.id,
  type: "Offer",
  name: apiOffer.offerName,
  createdByInfo: apiOffer.createdBy,
  assignedToInfo: apiOffer.assignedTo,
  createdDate: new Date(apiOffer.createdAt),
  updatedDate: apiOffer.updatedAt ? new Date(apiOffer.updatedAt) : undefined,
  numberOfBuyers: apiOffer.numberOfBuyers,
  numberOfSellers: apiOffer.numberOfSellers,
  groups: apiOffer.groups,
  originalOffer: apiOffer,
});

// Helper to transform API Demand to OfferDemandItem
const transformApiDemand = (apiDemand: ApiDemandItem): OfferDemandItem => ({
  id: apiDemand.id,
  type: "Demand",
  name: apiDemand.demandName,
  createdByInfo: apiDemand.requestedBy, // Use appropriate field
  assignedToInfo: apiDemand.assignedTo,
  createdDate: new Date(apiDemand.createdAt),
  updatedDate: apiDemand.updatedAt ? new Date(apiDemand.updatedAt) : undefined,
  numberOfBuyers: apiDemand.numberOfBuyers,
  numberOfSellers: apiDemand.numberOfSellers,
  groups: apiDemand.groups,
  originalDemand: apiDemand,
});


// --- Reusable ActionColumn Component (No changes needed here) ---
const ActionColumn = ({
  onEdit,
  onClone,
  onDelete,
  // onViewDetail, // Can be handled by onEdit or a dedicated view page
}: {
  onEdit: () => void;
  onClone?: () => void;
  onDelete: () => void;
  // onViewDetail: () => void; // If you have a separate read-only view
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit / View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit} // Combined Edit/View for simplicity, or use onViewDetail
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip> */}
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
          onClick={() => toast.push(<Notification title="Share Clicked" type="info">Feature coming soon!</Notification>)}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <Dropdown renderTitle={<TbDotsVertical />} >
            <Dropdown.Item eventKey="active" style={{height: "auto"}} className="py-2 text-xs">Add in Active</Dropdown.Item>
            <Dropdown.Item eventKey="schedule" style={{height: "auto"}} className="py-2 text-xs">Add Schedule</Dropdown.Item>
            <Dropdown.Item eventKey="task" style={{height: "auto"}} className="py-2 text-xs">Add Task</Dropdown.Item>
            <Dropdown.Item eventKey="alert" style={{height: "auto"}} className="py-2 text-xs">View Alert</Dropdown.Item>
          </Dropdown>
        </div>
      </Tooltip>
    </div>
  );
};

// --- ItemTable Component (No changes needed here) ---
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
}: {
  columns: ColumnDef<OfferDemandItem>[];
  data: OfferDemandItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: OfferDemandItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: OfferDemandItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<OfferDemandItem>[]) => void;
}) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedItems.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  );
};

// --- ItemSearch Component (No changes needed here) ---
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        placeholder="Quick Search (ID, Name, Creator)..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
ItemSearch.displayName = "ItemSearch";

// --- ItemTableTools Component (No changes needed here) ---
const ItemTableTools = ({
  onSearchChange,
}: {
  onSearchChange: (query: string) => void;
}) => {
  return (
    <div className="flex items-center w-full">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
    </div>
  );
};

// --- ItemActionTools Component ---
const ItemActionTools = ({
  onRefresh, // Add refresh handler
}: {
  onRefresh: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <Button icon={<TbRefresh />} onClick={onRefresh} title="Refresh Data">
        Refresh
      </Button>
      <Button icon={<TbFilter />} block>
        Filter
      </Button>
      <Button variant="solid" icon={<TbPlus />} onClick={()=>navigate("/sales-leads/offers/create")} block>
        Add Offer
      </Button>
      <Button icon={<TbPlus />} variant="solid" onClick={()=>navigate("/sales-leads/demands/create")} block>
        Add Demand
      </Button>
    </div>
  );
};

// --- ItemSelected Component (No changes needed here, uses activeTab for itemType) ---
const ItemSelected = ({
  selectedItems,
  onDeleteSelected,
  activeTab,
}: {
  selectedItems: OfferDemandItem[];
  onDeleteSelected: () => void;
  activeTab: string;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };

  if (selectedItems.length === 0) return null;

  const itemType = activeTab === TABS.OFFER ? "Offer" : (activeTab === TABS.DEMAND ? "Demand" : "Item");


  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              {" "}
              <TbChecks />{" "}
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>
                {itemType}
                {selectedItems.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              {" "}
              Delete{" "}
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} ${itemType}${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmButtonColor="red-600"
      >
        <p>
          Are you sure you want to delete the selected {itemType.toLowerCase()}
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main OffersDemands Component ---
const OffersDemands = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // --- Redux State ---
  const {
    Offers = [], // Default to empty array
    Demands = [], // Default to empty array
    offersStatus,
    demandsStatus,
    offersError,
    demandsError,
  } = useSelector(masterSelector);

  // --- Local State for UI & Table Config ---
  const [transformedOffersData, setTransformedOffersData] = useState<OfferDemandItem[]>([]);
  const [transformedDemandsData, setTransformedDemandsData] = useState<OfferDemandItem[]>([]);

  const [offerTableData, setOfferTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [demandTableData, setDemandTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
    const [allTableData, setAllTableData] = useState<TableQueries>({ // For 'All' tab
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [selectedAll, setSelectedAll] = useState<OfferDemandItem[]>([]); // For 'All' tab

  const [currentTab, setCurrentTab] = useState<string>(TABS.OFFER);
  // --- End State ---

  // Fetch data on mount and when refresh is triggered
  const fetchData = useCallback(() => {
    dispatch(getOffersAction());
    dispatch(getDemandsAction());
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process and set transformed data when API data or status changes
  useEffect(() => {
    if (offersStatus === 'succeeded' && Array.isArray(Offers)) {
      setTransformedOffersData(Offers.map(transformApiOffer));
    }
    if (offersStatus === 'failed' && offersError) {
      toast.push(<Notification title="Error Fetching Offers" type="danger">{offersError}</Notification>);
    }
  }, [Offers, offersStatus, offersError]);

  useEffect(() => {
    if (demandsStatus === 'succeeded' && Array.isArray(Demands)) {
      setTransformedDemandsData(Demands.map(transformApiDemand));
    }
    if (demandsStatus === 'failed' && demandsError) {
      toast.push(<Notification title="Error Fetching Demands" type="danger">{demandsError}</Notification>);
    }
  }, [Demands, demandsStatus, demandsError]);

  const allTransformedData = useMemo(() => {
    return [...transformedOffersData, ...transformedDemandsData];
  }, [transformedOffersData, transformedDemandsData]);


  // --- Derived State for Current Tab ---
  const currentItems = useMemo(() => {
    if (currentTab === TABS.ALL) return allTransformedData;
    if (currentTab === TABS.OFFER) return transformedOffersData;
    if (currentTab === TABS.DEMAND) return transformedDemandsData;
    return [];
  }, [currentTab, allTransformedData, transformedOffersData, transformedDemandsData]);

  const currentTableData = useMemo(() => {
    if (currentTab === TABS.ALL) return allTableData;
    if (currentTab === TABS.OFFER) return offerTableData;
    if (currentTab === TABS.DEMAND) return demandTableData;
    return offerTableData; // Default
  }, [currentTab, allTableData, offerTableData, demandTableData]);

  const currentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return selectedAll;
    if (currentTab === TABS.OFFER) return selectedOffers;
    if (currentTab === TABS.DEMAND) return selectedDemands;
    return [];
  }, [currentTab, selectedAll, selectedOffers, selectedDemands]);

  const setCurrentTableData = useMemo(() => {
    if (currentTab === TABS.ALL) return setAllTableData;
    if (currentTab === TABS.OFFER) return setOfferTableData;
    if (currentTab === TABS.DEMAND) return setDemandTableData;
    return setOfferTableData; // Default
  }, [currentTab]);

  const setCurrentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return setSelectedAll;
    if (currentTab === TABS.OFFER) return setSelectedOffers;
    if (currentTab === TABS.DEMAND) return setSelectedDemands;
    return setSelectedOffers; // Default
  }, [currentTab]);
  // --- End Derived State ---


  // --- Memoized Data Processing (Search, Sort, Paginate) ---
  const { pageData, total } = useMemo(() => {
    let processedData = [...currentItems]; // Use a copy for manipulation

    // Apply Search
    if (currentTableData.query) {
      const query = currentTableData.query.toLowerCase();
      processedData = processedData.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.createdByInfo.userName.toLowerCase().includes(query)
      );
    }

    // Apply Sorting
    const { order, key } = currentTableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aValue, bValue;
        if (key === "createdDate") {
          aValue = a.createdDate.getTime();
          bValue = b.createdDate.getTime();
        } else if (key === "name" || key === "id") {
            aValue = a[key as keyof Pick<OfferDemandItem, 'name' | 'id'>];
            bValue = b[key as keyof Pick<OfferDemandItem, 'name' | 'id'>];
        } else if (key === "createdBy") { // Sort by creator's user name
            aValue = a.createdByInfo.userName;
            bValue = b.createdByInfo.userName;
        } else {
            aValue = (a as any)[key];
            bValue = (b as any)[key];
        }


        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
            return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    // Apply Pagination
    const pageIndex = currentTableData.pageIndex as number;
    const pageSize = currentTableData.pageSize as number;
    const dataTotal = processedData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [currentItems, currentTableData]);
  // --- End Memoized Data Processing ---

  // --- Handlers ---
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) => { // Allow partial updates
      setCurrentTableData(prev => ({ ...prev, ...data }));
    },
    [setCurrentTableData]
  );

  const handlePaginationChange = useCallback(
    (page: number) => {
      handleSetTableData({ pageIndex: page });
    },
    [handleSetTableData]
  );

  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1, // Reset to first page
      });
      setCurrentSelectedItems([]); // Clear selection on page size change
    },
    [handleSetTableData, setCurrentSelectedItems]
  );

  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({
        sort: sort,
        pageIndex: 1, // Reset to first page
      });
    },
    [handleSetTableData]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      handleSetTableData({
        query: query,
        pageIndex: 1, // Reset to first page
      });
    },
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: OfferDemandItem) => {
      setCurrentSelectedItems((prev) => {
        if (checked) {
          return prev.some((i) => i.id === row.id) ? prev : [...prev, row];
        } else {
          return prev.filter((i) => i.id !== row.id);
        }
      });
    },
    [setCurrentSelectedItems]
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<OfferDemandItem>[]) => {
      // Filter out rows that are not part of the current pageData to avoid deselecting items on other pages
      const currentPageRowIds = new Set(pageData.map(item => item.id));
      const relevantRows = rows.filter(row => currentPageRowIds.has(row.original.id));
      const relevantRowIds = new Set(relevantRows.map((r) => r.original.id));

      setCurrentSelectedItems((prev) => {
        if (checked) {
          const originalRows = relevantRows.map((row) => row.original);
          const existingIds = new Set(prev.map((i) => i.id));
          const newSelection = originalRows.filter(
            (i) => !existingIds.has(i.id)
          );
          return [...prev, ...newSelection];
        } else {
          return prev.filter((i) => !relevantRowIds.has(i.id));
        }
      });
    },
    [setCurrentSelectedItems, pageData] // Add pageData dependency
  );

  const handleEdit = useCallback(
    (item: OfferDemandItem) => {
      // Determine the base path based on item type for navigation
      const basePath = item.type === "Offer" ? "offers" : "demands";
      console.log(`Edit/View ${item.type} item:`, item.id);
      // Navigate to a generic edit page or specific offer/demand edit page
      navigate(`/sales-leads/${basePath}/edit/${item.id}`); // Adjust route as needed
    },
    [navigate]
  );

  // Simulated CUD operations - these would typically involve API calls and Redux updates
  const handleClone = useCallback(
    (itemToClone: OfferDemandItem) => {
      console.log(`Cloning ${itemToClone.type} item:`, itemToClone.id);
      // This is a local simulation. In a real app, dispatch an action to clone on backend.
      const newId = `${itemToClone.type.substring(0,3).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`;
      const clonedItem: OfferDemandItem = {
        ...cloneDeep(itemToClone), // Deep clone
        id: newId,
        createdDate: new Date(),
        // Reset original references if they exist
        originalOffer: itemToClone.originalOffer ? { ...itemToClone.originalOffer, id: newId, createdAt: new Date().toISOString() } : undefined,
        originalDemand: itemToClone.originalDemand ? { ...itemToClone.originalDemand, id: newId, createdAt: new Date().toISOString() } : undefined,
      };

      if (itemToClone.type === "Offer") {
        setTransformedOffersData(prev => [clonedItem, ...prev]);
      } else {
        setTransformedDemandsData(prev => [clonedItem, ...prev]);
      }
      toast.push(<Notification title="Record Copied (Simulated)" type="success" duration={2000} />);
    },
    [] // Dependencies might be needed if it interacts with more complex state
  );

  const handleDelete = useCallback(
    (itemToDelete: OfferDemandItem) => {
      console.log(`Deleting ${itemToDelete.type} item (Simulated):`, itemToDelete.id);
      // Local simulation. Real app: dispatch delete action.
      if (itemToDelete.type === "Offer") {
        setTransformedOffersData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setSelectedOffers(prev => prev.filter(item => item.id !== itemToDelete.id));
      } else {
        setTransformedDemandsData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setSelectedDemands(prev => prev.filter(item => item.id !== itemToDelete.id));
      }
      // Also remove from 'All' selections if present
      setSelectedAll(prev => prev.filter(item => item.id !== itemToDelete.id));

      toast.push(<Notification title="Record Deleted (Simulated)" type="success" duration={2000}>{`${itemToDelete.type} ${itemToDelete.name} deleted.`}</Notification>);
    },
    []
  );

  const handleDeleteSelected = useCallback(() => {
    const itemsToDelete = currentSelectedItems;
    console.log(`Deleting selected ${currentTab} items (Simulated):`, itemsToDelete.map(i => i.id));

    const selectedIds = new Set(itemsToDelete.map(i => i.id));

    if (currentTab === TABS.OFFER || currentTab === TABS.ALL) {
        setTransformedOffersData(prev => prev.filter(i => !selectedIds.has(i.id)));
    }
    if (currentTab === TABS.DEMAND || currentTab === TABS.ALL) {
        setTransformedDemandsData(prev => prev.filter(i => !selectedIds.has(i.id)));
    }
    
    setCurrentSelectedItems([]); // Clears selection for the current tab

    toast.push(<Notification title="Records Deleted (Simulated)" type="success" duration={2000}>{`${selectedIds.size} record(s) deleted.`}</Notification>);
  }, [currentSelectedItems, currentTab, setCurrentSelectedItems]);


  const handleTabChange = (tabKey: string) => {
    if (tabKey === currentTab) return;
    setCurrentTab(tabKey);
    // Reset query for the new tab if needed, or keep it global
    // For simplicity, we'll let the currentTableData handle its own query.
    // No need to reset other tab's table config if they are distinct states.
    // Clear selection for the newly active tab:
    if (tabKey === TABS.ALL) setSelectedAll([]);
    else if (tabKey === TABS.OFFER) setSelectedOffers([]);
    else if (tabKey === TABS.DEMAND) setSelectedDemands([]);
  };
  // --- End Handlers ---

  // --- Define Columns ---
  const columns: ColumnDef<OfferDemandItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        size: 70,
        cell: props => <span className="font-mono text-xs">{props.getValue<string>()}</span>
      },
      { header: "Name", accessorKey: "name", enableSorting: true, size: 200,
        cell : (props)=>(
          <div>
            <div className="font-semibold">
              {props.row.original.name}
            </div>
            { (props.row.original.numberOfBuyers !== undefined || props.row.original.numberOfSellers !== undefined) &&
              <>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Buyers: {props.row.original.numberOfBuyers ?? 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Sellers: {props.row.original.numberOfSellers ?? 'N/A'}
                </div>
              </>
            }
          </div>
        )
      },
      {
        header: "Section Details",
        id: "sectionDetails", // Important to have a unique id if not using accessorKey
        size: 250,
        cell : ({row})=>{
          const { groups } = row.original;
          if (!groups || groups.length === 0) return <span className="text-xs text-gray-500">No group details</span>;
          return (
            <div className="space-y-1">
              {groups.map((group, index) => (
                <div key={index} className="text-xs">
                  <b className="text-gray-700 dark:text-gray-200">{group.groupName}: </b>
                  <div className="pl-2 flex flex-col gap-0.5 text-gray-600 dark:text-gray-400">
                    {group.items.slice(0,3).map((item, itemIdx) => <span key={itemIdx}>{item}</span>)}
                    {group.items.length > 3 && <span className="italic">...and {group.items.length - 3} more</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      },
      {
        header: "Created By / Assigned",
        accessorKey: "createdByInfo", // Sort by this object if needed, or by userName
        id: "createdBy", // explicit id for sorting key in tableData
        enableSorting: true, // Enable sorting by creator's name
        size: 200,
        cell: (props) => {
            const item = props.row.original;
            return (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Avatar size={28} shape="circle" icon={<TbUserCircle />} />{" "}
                  <span className="font-semibold">{item.createdByInfo.userName}</span>
                </div>
                {item.assignedToInfo && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        <b>Assigned: </b> {item.assignedToInfo.userName}
                    </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {item.createdDate.toLocaleDateString()}{" "}
                    {item.createdDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
                </div>
              </div>
            )
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 120,
        cell: (props) => (
          <ActionColumn
            onClone={() => handleClone(props.row.original)}
            onEdit={() => handleEdit(props.row.original)}
            onDelete={() => handleDelete(props.row.original)}
          />
        ),
      },
    ],
    [handleClone, handleEdit, handleDelete] // Dependencies for action handlers
  );
  // --- End Define Columns ---

  const isLoading = offersStatus === 'idle' || demandsStatus === 'idle';

  // --- Render Main Component ---
  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        {/* Header Section */}
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Offers & Demands</h5>
          <ItemActionTools onRefresh={fetchData} />
        </div>

        {/* Tabs Section */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[TABS.ALL, TABS.OFFER, TABS.DEMAND].map(tabKey => (
                 <button
                    key={tabKey}
                    onClick={() => handleTabChange(tabKey)}
                    className={classNames(
                        "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize",
                        currentTab === tabKey
                        ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                    )}
                    >
                    {tabKey === TABS.ALL ? "All" : `${tabKey} Listing`}
                 </button>
            ))}
          </nav>
        </div>

        {/* Tools Section (Search) */}
        <div className="mb-4">
          <ItemTableTools onSearchChange={handleSearchChange} />
        </div>

        {/* Table Section */}
        {isLoading && !pageData.length ? ( // Show spinner if loading and no data yet
            <div className="flex-grow flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        ) : (
            <div className="flex-grow overflow-auto">
            <ItemTable
                columns={columns}
                data={pageData}
                loading={isLoading && pageData.length > 0} // Show loading overlay on table if data exists but refreshing
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
        )}

      </AdaptiveCard>

      {/* Selected Actions Footer */}
      <ItemSelected
        selectedItems={currentSelectedItems}
        // setSelectedItems={setCurrentSelectedItems} // Not directly needed by ItemSelected if only deleting
        onDeleteSelected={handleDeleteSelected}
        activeTab={currentTab}
      />
    </Container>
  );
};
// --- End Main Component ---

export default OffersDemands;