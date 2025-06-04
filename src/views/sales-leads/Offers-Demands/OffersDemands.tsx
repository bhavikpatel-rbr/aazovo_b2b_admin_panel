// src/views/your-path/OffersDemands.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// import cloneDeep from "lodash/cloneDeep"; // Generally avoid for performance if simple spreads suffice
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import { Dropdown } from "@/components/ui";
import Spinner from "@/components/ui/Spinner";

// Icons
import {
  TbPencil,
  TbShare,
  TbDotsVertical,
  TbChecks,
  TbSearch,
  TbPlus,
  TbFilter,
  TbUserCircle,
  TbRefresh,
  TbTrash,
} from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getOffersAction,
  getDemandsAction,
  // Placeholder for actual CUD actions if you implement them
  // deleteOfferAction, deleteDemandAction, deleteMultipleOffersAction, etc.
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- API Item Types (Actual shapes from API response.data.data) ---
export type ActualApiCreatorShape = {
  id: number; // API sends number
  name: string; // API sends name
};

export type ActualApiOfferShape = {
  id: number; // Numeric ID from API
  generate_id: string; // String ID from API, to be used as primary key for OfferDemandItem
  name: string; // API uses 'name' for the offer's name
  created_by: ActualApiCreatorShape;
  assign_user?: ActualApiCreatorShape | null;
  created_at: string; // ISO date string
  updated_at?: string; // ISO date string
  // Fields from API for constructing groups - from your API sample, these were mostly null for offers
  seller_section?: any | null; // Define more accurately if structure is known
  buyer_section?: any | null; // Define more accurately if structure is known
  groupA?: string | null; // Define more accurately if structure is known
  groupB?: string | null; // Define more accurately if structure is known
  // These are in your OfferDemandItem, ensure they come from API or are derived
  numberOfBuyers?: number;
  numberOfSellers?: number;
};

export type ActualApiDemandShape = {
  id: number; // Numeric ID from API
  generate_id: string; // String ID from API
  name: string; // API uses 'name' for the demand's name
  created_by: ActualApiCreatorShape;
  assign_user?: ActualApiCreatorShape | null;
  created_at: string; // ISO date string
  updated_at?: string;
  // Fields from API for constructing groups, as per your Demand API sample
  seller_section?: Record<
    string,
    { questions: Record<string, { question: string }> }
  > | null;
  buyer_section?: Record<
    string,
    { questions: Record<string, { question: string }> }
  > | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
};

// This is the structure your "Section Details" column expects
export type ApiGroupItem = {
  groupName: string;
  items: string[];
};
// --- End API Item Types ---

// --- Unified Table Row Data (OfferDemandItem) ---
// This is the data structure used by the DataTable
export type OfferDemandItem = {
  id: string; // This will be 'generate_id' from API
  type: "Offer" | "Demand";
  name: string;
  createdByInfo: {
    userId: string; // Ensure this is consistently string
    userName: string;
  };
  assignedToInfo?: {
    userId: string; // Ensure this is consistently string
    userName: string;
  };
  createdDate: Date;
  updatedDate?: Date;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
  originalApiItem: ActualApiOfferShape | ActualApiDemandShape; // Store original API shape for actions
};
// --- End Unified Table Row Data ---

// --- Constants ---
const TABS = { ALL: "all", OFFER: "offer", DEMAND: "demand" };
// --- End Constants ---

// Helper to transform API Offer (ActualApiOfferShape) to OfferDemandItem
const transformApiOffer = (apiOffer: ActualApiOfferShape): OfferDemandItem => {
  const offerGroups: ApiGroupItem[] = [];
  if (apiOffer.groupA)
    offerGroups.push({ groupName: "Group A", items: [apiOffer.groupA] });
  if (apiOffer.groupB)
    offerGroups.push({ groupName: "Group B", items: [apiOffer.groupB] });
  // Add more complex parsing for seller_section, buyer_section if needed, e.g.,
  // if (apiOffer.seller_section && typeof apiOffer.seller_section === 'object') { /* parse object */ }

  return {
    id: apiOffer.generate_id,
    type: "Offer",
    name: apiOffer.name,
    createdByInfo: {
      userId: String(apiOffer.created_by.id), // Ensure string
      userName: apiOffer.created_by.name,
    },
    assignedToInfo: apiOffer.assign_user
      ? {
          userId: String(apiOffer.assign_user.id), // Ensure string
          userName: apiOffer.assign_user.name,
        }
      : undefined,
    createdDate: new Date(apiOffer.created_at),
    updatedDate: apiOffer.updated_at
      ? new Date(apiOffer.updated_at)
      : undefined,
    numberOfBuyers: apiOffer.numberOfBuyers,
    numberOfSellers: apiOffer.numberOfSellers,
    groups: offerGroups.length > 0 ? offerGroups : undefined,
    originalApiItem: apiOffer,
  };
};

// Helper to transform API Demand (ActualApiDemandShape) to OfferDemandItem
const transformApiDemand = (
  apiDemand: ActualApiDemandShape
): OfferDemandItem => {
  const demandGroups: ApiGroupItem[] = [];

  if (apiDemand.seller_section) {
    const items: string[] = [];
    Object.values(apiDemand.seller_section).forEach((sectionPart) => {
      if (sectionPart?.questions) {
        Object.values(sectionPart.questions).forEach((q) => {
          if (q?.question) items.push(q.question);
        });
      }
    });
    if (items.length > 0)
      demandGroups.push({ groupName: "Seller Section", items });
  }
  // Similar parsing for buyer_section
  if (apiDemand.buyer_section) {
    const items: string[] = [];
    Object.values(apiDemand.buyer_section).forEach((sectionPart) => {
      if (sectionPart?.questions) {
        Object.values(sectionPart.questions).forEach((q) => {
          if (q?.question) items.push(q.question);
        });
      }
    });
    if (items.length > 0)
      demandGroups.push({ groupName: "Buyer Section", items });
  }
  if (apiDemand.groupA)
    demandGroups.push({ groupName: "Group A", items: [apiDemand.groupA] });
  if (apiDemand.groupB)
    demandGroups.push({ groupName: "Group B", items: [apiDemand.groupB] });

  return {
    id: apiDemand.generate_id,
    type: "Demand",
    name: apiDemand.name,
    createdByInfo: {
      userId: String(apiDemand.created_by.id), // Ensure string
      userName: apiDemand.created_by.name,
    },
    assignedToInfo: apiDemand.assign_user
      ? {
          userId: String(apiDemand.assign_user.id), // Ensure string
          userName: apiDemand.assign_user.name,
        }
      : undefined,
    createdDate: new Date(apiDemand.created_at),
    updatedDate: apiDemand.updated_at
      ? new Date(apiDemand.updated_at)
      : undefined,
    numberOfBuyers: apiDemand.numberOfBuyers,
    numberOfSellers: apiDemand.numberOfSellers,
    groups: demandGroups.length > 0 ? demandGroups : undefined,
    originalApiItem: apiDemand,
  };
};

// --- Reusable ActionColumn Component (Memoized for performance) ---
const ActionColumn = React.memo(
  ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit / View">
        <div
          role="button"
          onClick={onEdit}
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          role="button"
          onClick={() =>
            toast.push(
              <Notification
                title="Share Clicked (Not Implemented)"
                type="info"
              />
            )
          }
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Dropdown
        placement="bottom-end"
        renderTitle={
          <Tooltip title="More">
            <div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
              <TbDotsVertical />
            </div>
          </Tooltip>
        }
      >
        <Dropdown.Item
          eventKey="delete"
          onClick={onDelete}
          className="text-xs flex items-center gap-2 text-red-600 hover:text-red-700 dark:hover:text-red-500"
        >
          <TbTrash size={16} /> Delete (Simulated)
        </Dropdown.Item>
        {/* Add other actions here */}
      </Dropdown>
    </div>
  )
);
ActionColumn.displayName = "ActionColumn";

// --- ItemTable Component (Generally okay, ensure props are stable) ---
const ItemTable = React.memo(
  ({
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
  }) => (
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
  )
);
ItemTable.displayName = "ItemTable";

// --- ItemSearch (Memoized) ---
const ItemSearch = React.memo(
  React.forwardRef<
    HTMLInputElement,
    { onInputChange: (value: string) => void }
  >(({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      placeholder="Quick Search (ID, Name, Creator)..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  ))
);
ItemSearch.displayName = "ItemSearch";

// --- ItemTableTools (Memoized) ---
const ItemTableTools = React.memo(
  ({ onSearchChange }: { onSearchChange: (query: string) => void }) => (
    <div className="flex items-center w-full">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
    </div>
  )
);
ItemTableTools.displayName = "ItemTableTools";

// --- ItemActionTools (Memoized if navigate is stable) ---
const ItemActionTools = React.memo(
  ({ onRefresh }: { onRefresh: () => void }) => {
    const navigate = useNavigate();
    return (
      <div className="flex flex-col md:flex-row gap-2">
        <Button icon={<TbRefresh />} onClick={onRefresh} title="Refresh Data">
          Refresh
        </Button>
        <Button icon={<TbFilter />} block>
          Filter (Not Implemented)
        </Button>
        <Button
          variant="solid"
          icon={<TbPlus />}
          onClick={() => navigate("/sales-leads/offers/create")}
          block
        >
          Add Offer
        </Button>
        <Button
          icon={<TbPlus />}
          variant="solid"
          onClick={() => navigate("/sales-leads/demands/create")}
          block
        >
          Add Demand
        </Button>
      </div>
    );
  }
);
ItemActionTools.displayName = "ItemActionTools";

// --- ItemSelected (Memoized, ensure onDeleteSelected is stable) ---
const ItemSelected = React.memo(
  ({
    selectedItems,
    onDeleteSelected,
    activeTab,
    isDeleting,
  }: {
    selectedItems: OfferDemandItem[];
    onDeleteSelected: () => void;
    activeTab: string;
    isDeleting: boolean;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    const itemType =
      activeTab === TABS.OFFER
        ? "Offer"
        : activeTab === TABS.DEMAND
        ? "Demand"
        : "Item";
    return (
      <>
        <StickyFooter
          className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
          stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        >
          <div className="flex items-center justify-between w-full px-4 sm:px-8">
            <span className="flex items-center gap-2">
              <TbChecks className="text-lg text-primary-600 dark:text-primary-400" />
              <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                <span className="heading-text">{selectedItems.length}</span>
                <span>
                  {itemType}
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
              </span>
            </span>
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={() => setDeleteOpen(true)}
              loading={isDeleting}
            >
              Delete Selected (Simulated)
            </Button>
          </div>
        </StickyFooter>
        <ConfirmDialog
          isOpen={deleteOpen}
          type="danger"
          title={`Delete ${selectedItems.length} ${itemType}${
            selectedItems.length > 1 ? "s" : ""
          }`}
          onClose={() => setDeleteOpen(false)}
          onRequestClose={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            onDeleteSelected();
            setDeleteOpen(false);
          }}
          loading={isDeleting}
        >
          <p>
            Are you sure you want to delete the selected{" "}
            {itemType.toLowerCase()}
            {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
          </p>
        </ConfirmDialog>
      </>
    );
  }
);
ItemSelected.displayName = "ItemSelected";

// --- Main OffersDemands Component ---
const OffersDemands = () => {
  const navigate = useNavigate(); // Generally stable
  const dispatch = useAppDispatch(); // Stable

  // --- Redux State ---
  // CRITICAL: `rawOffers` and `rawDemands` MUST be the array from `response.data.data`.
  const {
    Offers: rawOffers = [], // Renamed for clarity that it's raw from API
    Demands: rawDemands = [], // Renamed
    offersStatus,
    demandsStatus,
    offersError,
    demandsError,
  } = useSelector(masterSelector);

  // --- Local State for UI & Table Config ---
  // One config per tab is fine if they have independent settings (sort, page, query)
  const [offerTableConfig, setOfferTableConfig] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [demandTableConfig, setDemandTableConfig] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [allTableConfig, setAllTableConfig] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [selectedAll, setSelectedAll] = useState<OfferDemandItem[]>([]);

  const [currentTab, setCurrentTab] = useState<string>(TABS.OFFER);
  const [isDeleting, setIsDeleting] = useState(false); // For CUD ops
  const [itemToDeleteConfirm, setItemToDeleteConfirm] =
    useState<OfferDemandItem | null>(null);

  // --- Derived State for Current Tab's Config & Selection ---
  const currentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return allTableConfig;
    if (currentTab === TABS.OFFER) return offerTableConfig;
    if (currentTab === TABS.DEMAND) return demandTableConfig;
    return offerTableConfig; // Default
  }, [currentTab, allTableConfig, offerTableConfig, demandTableConfig]);

  const setCurrentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return setAllTableConfig;
    if (currentTab === TABS.OFFER) return setOfferTableConfig;
    if (currentTab === TABS.DEMAND) return setDemandTableConfig;
    return setOfferTableConfig; // Default
  }, [currentTab]);

  const currentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return selectedAll;
    if (currentTab === TABS.OFFER) return selectedOffers;
    if (currentTab === TABS.DEMAND) return selectedDemands;
    return [];
  }, [currentTab, selectedAll, selectedOffers, selectedDemands]);

  const setCurrentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return setSelectedAll;
    if (currentTab === TABS.OFFER) return setSelectedOffers;
    if (currentTab === TABS.DEMAND) return setSelectedDemands;
    return setSelectedOffers; // Default
  }, [currentTab]);

  // Fetch data on mount and when refresh is triggered
  const fetchData = useCallback(() => {
    dispatch(getOffersAction());
    dispatch(getDemandsAction());
  }, [dispatch]); // dispatch is stable

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Runs once on mount

  // Show toast for API errors
  useEffect(() => {
    if (offersStatus === "failed" && offersError) {
      toast.push(
        <Notification title="Error Fetching Offers" type="danger">
          {String(offersError)}
        </Notification>
      );
    }
  }, [offersStatus, offersError]);
  useEffect(() => {
    if (demandsStatus === "failed" && demandsError) {
      toast.push(
        <Notification title="Error Fetching Demands" type="danger">
          {String(demandsError)}
        </Notification>
      );
    }
  }, [demandsStatus, demandsError]);

  // --- Memoized Data Processing (Transform, Search, Sort, Paginate) ---
  const { pageData, total } = useMemo(() => {
    // 1. Select and Transform Data based on Tab
    let transformedData: OfferDemandItem[] = [];
    if (currentTab === TABS.OFFER) {
      transformedData = (Array.isArray(rawOffers) ? rawOffers : []).map(
        transformApiOffer
      );
    } else if (currentTab === TABS.DEMAND) {
      transformedData = (Array.isArray(rawDemands) ? rawDemands : []).map(
        transformApiDemand
      );
    } else {
      // TABS.ALL
      const transformedO = (Array.isArray(rawOffers) ? rawOffers : []).map(
        transformApiOffer
      );
      const transformedD = (Array.isArray(rawDemands) ? rawDemands : []).map(
        transformApiDemand
      );
      transformedData = [...transformedO, ...transformedD];
    }

    // 2. Apply Search (using currentTableConfig.query)
    let processedData = [...transformedData]; // Operate on a copy
    if (currentTableConfig.query) {
      const query = currentTableConfig.query.toLowerCase();
      processedData = processedData.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.createdByInfo.userName.toLowerCase().includes(query)
      );
    }

    // 3. Apply Sorting (using currentTableConfig.sort)
    const { order, key } = currentTableConfig.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "createdDate") {
          aValue = a.createdDate.getTime();
          bValue = b.createdDate.getTime();
        } else if (key === "name" || key === "id") {
          aValue = a[key];
          bValue = b[key];
        } else if (key === "createdBy") {
          aValue = a.createdByInfo.userName;
          bValue = b.createdByInfo.userName;
        } else {
          aValue = (a as any)[key];
          bValue = (b as any)[key];
        }

        if (typeof aValue === "string" && typeof bValue === "string")
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        if (typeof aValue === "number" && typeof bValue === "number")
          return order === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
      });
    }

    // 4. Apply Pagination (using currentTableConfig.pageIndex, pageSize)
    const dataTotal = processedData.length;
    const pageIndex = currentTableConfig.pageIndex as number;
    const pageSize = currentTableConfig.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [rawOffers, rawDemands, currentTab, currentTableConfig]);
  // Dependencies: raw data, current tab (to select source), and current table config (for query, sort, page)

  // --- Handlers (Callbacks are memoized to prevent unnecessary re-renders of child components) ---
  const handleSetTableConfig = useCallback(
    (data: Partial<TableQueries>) => {
      setCurrentTableConfig((prev) => ({
        ...prev,
        ...data,
        pageIndex: data.pageIndex !== undefined ? data.pageIndex : 1,
      })); // Reset to page 1 if not page change
    },
    [setCurrentTableConfig]
  );

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableConfig({ pageIndex: page }),
    [handleSetTableConfig]
  );
  const handlePageSizeChange = useCallback(
    (value: number) => {
      handleSetTableConfig({ pageSize: value, pageIndex: 1 });
      setCurrentSelectedItems([]);
    },
    [handleSetTableConfig, setCurrentSelectedItems]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableConfig({ sort, pageIndex: 1 }),
    [handleSetTableConfig]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableConfig({ query, pageIndex: 1 }),
    [handleSetTableConfig]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: OfferDemandItem) => {
      setCurrentSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      );
    },
    [setCurrentSelectedItems]
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, currentTableRows: Row<OfferDemandItem>[]) => {
      const currentVisibleIds = new Set(
        currentTableRows.map((r) => r.original.id)
      );
      if (checked) {
        setCurrentSelectedItems((prev) => {
          const newItemsToAdd = currentTableRows
            .map((r) => r.original)
            .filter((item) => !prev.some((pItem) => pItem.id === item.id));
          return [...prev, ...newItemsToAdd];
        });
      } else {
        setCurrentSelectedItems((prev) =>
          prev.filter((item) => !currentVisibleIds.has(item.id))
        );
      }
    },
    [setCurrentSelectedItems]
  );

  const handleEdit = useCallback(
    (item: OfferDemandItem) => {
      const basePath = item.type === "Offer" ? "offers" : "demands";
      navigate(`/sales-leads/${basePath}/edit/${item.id}`);
    },
    [navigate]
  );

  // SIMULATED CUD Operations
  const handleDeleteClick = useCallback(
    (item: OfferDemandItem) => setItemToDeleteConfirm(item),
    []
  );
  const onConfirmDelete = useCallback(async () => {
    if (!itemToDeleteConfirm) return;
    setIsDeleting(true);
    // Actual dispatch:
    // await dispatch(itemToDeleteConfirm.type === 'Offer' ? deleteOfferAction(itemToDeleteConfirm.id) : deleteDemandAction(itemToDeleteConfirm.id)).unwrap();
    await new Promise((r) => setTimeout(r, 700)); // Simulate API
    toast.push(
      <Notification
        title="Deleted (Simulated)"
        type="success"
      >{`${itemToDeleteConfirm.name} deleted.`}</Notification>
    );
    fetchData(); // Re-fetch
    setCurrentSelectedItems((prev) =>
      prev.filter((i) => i.id !== itemToDeleteConfirm.id)
    );
    setIsDeleting(false);
    setItemToDeleteConfirm(null);
  }, [itemToDeleteConfirm, dispatch, fetchData, setCurrentSelectedItems]);

  const handleDeleteSelected = useCallback(async () => {
    if (currentSelectedItems.length === 0) return;
    setIsDeleting(true);
    const ids = currentSelectedItems.map((i) => i.id);
    // Actual dispatch for bulk delete (you'd need separate actions or one that handles type)
    // await dispatch(deleteMultipleItemsAction({ ids, type: currentTab })).unwrap();
    await new Promise((r) => setTimeout(r, 1000)); // Simulate API
    toast.push(
      <Notification
        title="Bulk Deleted (Simulated)"
        type="success"
      >{`${ids.length} items deleted.`}</Notification>
    );
    fetchData(); // Re-fetch
    setCurrentSelectedItems([]);
    setIsDeleting(false);
  }, [
    currentSelectedItems,
    dispatch,
    fetchData,
    setCurrentSelectedItems,
    currentTab,
  ]);

  const handleTabChange = useCallback(
    (tabKey: string) => {
      if (tabKey === currentTab) return;
      setCurrentTab(tabKey);
      // Clear selection for the newly active tab & reset its page index to 1 in its config
      if (tabKey === TABS.ALL) {
        setSelectedAll([]);
        setAllTableConfig((prev) => ({ ...prev, pageIndex: 1, query: "" }));
      } else if (tabKey === TABS.OFFER) {
        setSelectedOffers([]);
        setOfferTableConfig((prev) => ({ ...prev, pageIndex: 1, query: "" }));
      } else if (tabKey === TABS.DEMAND) {
        setSelectedDemands([]);
        setDemandTableConfig((prev) => ({ ...prev, pageIndex: 1, query: "" }));
      }
    },
    [currentTab]
  );

  // --- Define Columns (Memoized) ---
  const columns: ColumnDef<OfferDemandItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        size: 70,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <span className="font-mono text-xs">{props.getValue<string>()}</span>
        ),
      },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        size: 200,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <div>
            <div className="font-semibold">{props.row.original.name}</div>
            {(props.row.original.numberOfBuyers !== undefined ||
              props.row.original.numberOfSellers !== undefined) && (
              <>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Buyers: {props.row.original.numberOfBuyers ?? "N/A"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Sellers: {props.row.original.numberOfSellers ?? "N/A"}
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        header: "Section Details",
        id: "sectionDetails",
        size: 250,
        cell: ({ row }: CellContext<OfferDemandItem, any>) => {
          const { groups } = row.original;
          if (!groups || groups.length === 0)
            return (
              <span className="text-xs text-gray-500">No group details</span>
            );
          return (
            <div className="space-y-1">
              {groups.map((group, index) => (
                <div key={index} className="text-xs">
                  <b className="text-gray-700 dark:text-gray-200">
                    {group.groupName}:{" "}
                  </b>
                  <div className="pl-2 flex flex-col gap-0.5 text-gray-600 dark:text-gray-400">
                    {group.items.slice(0, 3).map((item, itemIdx) => (
                      <span key={itemIdx}>{item}</span>
                    ))}
                    {group.items.length > 3 && (
                      <span className="italic">
                        ...and {group.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        header: "Created By / Assigned",
        accessorKey: "createdByInfo.userName",
        id: "createdBy",
        enableSorting: true,
        size: 200,
        cell: (props: CellContext<OfferDemandItem, any>) => {
          const item = props.row.original;

          const formattedCreatedDate = item.createdDate
            ? `${new Date(item.createdDate).getDate()} ${new Date(
                item.createdDate
              ).toLocaleString("en-US", { month: "long" })} ${new Date(
                item.createdDate
              ).getFullYear()}, ${new Date(item.createdDate).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Avatar size={28} shape="circle" icon={<TbUserCircle />} />
                <span className="font-semibold">
                  {item.createdByInfo.userName}
                </span>
              </div>
              {item.assignedToInfo && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <b>Assigned: </b> {item.assignedToInfo.userName}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span>{formattedCreatedDate}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 120,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <ActionColumn
            onEdit={() => handleEdit(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [handleEdit, handleDeleteClick]
  ); // Dependencies should be stable if handlers are memoized

  // Overall loading state for the table view
  const isOverallLoading =
    offersStatus === "loading" ||
    demandsStatus === "loading" ||
    offersStatus === "idle" ||
    demandsStatus === "idle";

  // Spinner only if loading initially and no data to show yet
  if (isOverallLoading && !pageData.length) {
    return (
      <Container className="h-full">
        <div className="h-full flex flex-col items-center justify-center">
          <Spinner size="xl" />
          <p className="mt-2">Loading Data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Offers & Demands</h5>
          <ItemActionTools onRefresh={fetchData} />
        </div>

        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[TABS.ALL, TABS.OFFER, TABS.DEMAND].map((tabKey) => (
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
                {tabKey === TABS.ALL ? "All Items" : `${tabKey} Listing`}
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
            loading={isOverallLoading && pageData.length > 0} // Overlay loading
            pagingData={{
              total,
              pageIndex: currentTableConfig.pageIndex as number,
              pageSize: currentTableConfig.pageSize as number,
            }}
            selectedItems={currentSelectedItems}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handlePageSizeChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>

      <ItemSelected
        selectedItems={currentSelectedItems}
        onDeleteSelected={handleDeleteSelected}
        activeTab={currentTab}
        isDeleting={isDeleting}
      />
      <ConfirmDialog
        isOpen={!!itemToDeleteConfirm}
        type="danger"
        title={`Delete ${itemToDeleteConfirm?.type || "Item"}`}
        onClose={() => setItemToDeleteConfirm(null)}
        onRequestClose={() => setItemToDeleteConfirm(null)}
        onCancel={() => setItemToDeleteConfirm(null)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete "
          <strong>{itemToDeleteConfirm?.name}</strong>"? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </Container>
  );
};

export default OffersDemands;
