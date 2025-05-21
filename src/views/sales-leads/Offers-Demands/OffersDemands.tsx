// src/views/your-path/OffersDemands.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from "react";
import { Link, useNavigate } from "react-router-dom"; // Ensure react-router-dom is installed
import cloneDeep from "lodash/cloneDeep"; // Ensure lodash is installed
import classNames from "classnames"; // Ensure classnames is installed

// UI Components (Ensure these paths are correct for your project)
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
// import Tag from '@/components/ui/Tag'; // Not needed for these fields
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog"; // Keep for potential edit/view modals
import Avatar from "@/components/ui/Avatar"; // Keep if 'Created By' has an avatar
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast"; // Ensure toast setup exists
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import { TbUserCircle } from "react-icons/tb"; // Placeholder icon for createdBy
// Icons
import {
  TbPencil,
  TbEye,
  TbShare,
  TbDotsVertical,
  TbChecks,
  TbSearch,
  TbPlus,
} from "react-icons/tb"; // Ensure react-icons is installed

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common"; // Ensure this type path is correct
import CreateOfferPage from "./OfferCreate/CreateOffer";

// --- Define Item Type (Table Row Data) ---
// Generic type for both Offers and Demands
export type OfferDemandItem = {
  id: string; // Unique ID for the offer/demand
  type: "Offer" | "Demand"; // To differentiate data source
  name: string; // Name of the offer/demand item
  createdBy: string; // Name or ID of the user who created it
  createdDate: Date;
};
// --- End Item Type Definition ---

// --- Constants ---
const initialDummyOffers: OfferDemandItem[] = [
  {
    id: "OFF001",
    type: "Offer",
    name: "Discount on Laptops",
    createdBy: "AdminUser",
    createdDate: new Date(2023, 10, 1, 10, 0),
  },
  {
    id: "OFF002",
    type: "Offer",
    name: "Free Shipping Weekend",
    createdBy: "MarketingTeam",
    createdDate: new Date(2023, 9, 28, 15, 30),
  },
  {
    id: "OFF003",
    type: "Offer",
    name: "BOGO on T-Shirts",
    createdBy: "SalesDept",
    createdDate: new Date(2023, 9, 25, 9, 0),
  },
  {
    id: "OFF004",
    type: "Offer",
    name: "Clearance Sale - Home Goods",
    createdBy: "AdminUser",
    createdDate: new Date(2023, 9, 20, 12, 0),
  },
  {
    id: "OFF005",
    type: "Offer",
    name: "New User Welcome Credit",
    createdBy: "MarketingTeam",
    createdDate: new Date(2023, 10, 3, 8, 0),
  },
];

const initialDummyDemands: OfferDemandItem[] = [
  {
    id: "DEM001",
    type: "Demand",
    name: "Request for Bulk Purchase - Chairs",
    createdBy: "BuyerX",
    createdDate: new Date(2023, 10, 2, 11, 15),
  },
  {
    id: "DEM002",
    type: "Demand",
    name: "Inquiry for Custom Software Dev",
    createdBy: "CompanyY",
    createdDate: new Date(2023, 10, 1, 16, 45),
  },
  {
    id: "DEM003",
    type: "Demand",
    name: "Need Suppliers for Organic Coffee",
    createdBy: "RetailerZ",
    createdDate: new Date(2023, 9, 29, 10, 30),
  },
  {
    id: "DEM004",
    type: "Demand",
    name: "Sourcing Vintage Camera Parts",
    createdBy: "CollectorB",
    createdDate: new Date(2023, 9, 27, 14, 0),
  },
  {
    id: "DEM005",
    type: "Demand",
    name: "Partnership Opportunity - Logistics",
    createdBy: "PartnerA",
    createdDate: new Date(2023, 10, 3, 9, 20),
  },
];

// Tab Definitions
const TABS = {
  OFFER: "offer",
  DEMAND: "demand",
};
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onClone,
  onDelete,
  onViewDetail,
}: {
  onEdit: () => void;
  onClone?: () => void; // Keep clone optional
  onDelete: () => void;
  onViewDetail: () => void;
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

// --- ItemTable Component ---
// (Implementation remains the same, using generic 'Item' names)
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
  columns: ColumnDef<OfferDemandItem>[]; // Use correct type
  data: OfferDemandItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: OfferDemandItem[]; // Use correct type
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: OfferDemandItem) => void; // Use correct type
  onAllRowSelect: (checked: boolean, rows: Row<OfferDemandItem>[]) => void; // Use correct type
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
// --- End ItemTable ---

// --- ItemSearch Component ---
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
ItemSearch.displayName = "ItemSearch";
// --- End ItemSearch ---

// --- ItemTableTools Component ---
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
// --- End ItemTableTools ---

// --- ItemActionTools Component ---
const ItemActionTools = ({
  allItems,
  activeTab,
}: {
  allItems: OfferDemandItem[];
  activeTab: string;
}) => {
  const navigate = useNavigate();
  // CSV Prep
  const csvData = useMemo(() => {
    /* ... prep logic ... */
  }, [allItems]);
  const csvHeaders = [
    /* ... headers ... */
  ];

  const handleAddItem = () => {
    const targetRoute =
      activeTab === TABS.OFFER
        ? "/sales-leads/offers/create"
        : "/sales-leads/demands/create";
    console.log(
      `Navigate to Add New ${
        activeTab === TABS.OFFER ? "Offer" : "Demand"
      } page: ${targetRoute}`
    );
    navigate(targetRoute);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* <CSVLink ... > Download </Button> </CSVLink> */}
      <Button variant="solid" icon={<TbPlus />} onClick={handleAddItem} block>
        Add New
      </Button>
    </div>
  );
};
// --- End ItemActionTools ---

// --- ItemSelected Component ---
const ItemSelected = ({
  selectedItems,
  setSelectedItems,
  onDeleteSelected,
  activeTab,
}: {
  selectedItems: OfferDemandItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<OfferDemandItem[]>>;
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

  const itemType = activeTab === TABS.OFFER ? "Offer" : "Demand";

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
// --- End ItemSelected ---

// --- Main OffersDemands Component ---
const OffersDemands = () => {
  const navigate = useNavigate();

  // --- Lifted State ---
  const [isLoading, setIsLoading] = useState(false);
  const [offersData, setOffersData] =
    useState<OfferDemandItem[]>(initialDummyOffers);
  const [demandsData, setDemandsData] =
    useState<OfferDemandItem[]>(initialDummyDemands);
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
  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [currentTab, setCurrentTab] = useState<string>(TABS.OFFER);
  // --- End Lifted State ---

  // --- Derived State ---
  const currentItems = useMemo(
    () => (currentTab === TABS.OFFER ? offersData : demandsData),
    [currentTab, offersData, demandsData]
  );
  const currentTableData = useMemo(
    () => (currentTab === TABS.OFFER ? offerTableData : demandTableData),
    [currentTab, offerTableData, demandTableData]
  );
  const currentSelectedItems = useMemo(
    () => (currentTab === TABS.OFFER ? selectedOffers : selectedDemands),
    [currentTab, selectedOffers, selectedDemands]
  );
  const setCurrentItems = useMemo(
    () => (currentTab === TABS.OFFER ? setOffersData : setDemandsData),
    [currentTab]
  );
  const setCurrentTableData = useMemo(
    () => (currentTab === TABS.OFFER ? setOfferTableData : setDemandTableData),
    [currentTab]
  );
  const setCurrentSelectedItems = useMemo(
    () => (currentTab === TABS.OFFER ? setSelectedOffers : setSelectedDemands),
    [currentTab]
  );
  // --- End Derived State ---

  // --- Memoized Data Processing ---
  const { pageData, total } = useMemo(() => {
    let processedData = [...currentItems];

    // Apply Search
    if (currentTableData.query) {
      const query = currentTableData.query.toLowerCase();
      processedData = processedData.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.createdBy.toLowerCase().includes(query)
      );
    }

    // Apply Sorting
    const { order, key } = currentTableData.sort as OnSortParam;
    if (order && key) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        if (key === "createdDate") {
          const timeA = a.createdDate.getTime();
          const timeB = b.createdDate.getTime();
          return order === "asc" ? timeA - timeB : timeB - timeA;
        }
        const aValue = a[key as keyof OfferDemandItem] ?? "";
        const bValue = b[key as keyof OfferDemandItem] ?? "";
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
      processedData = sortedData;
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

  // --- Lifted Handlers ---
  const handleSetTableData = useCallback(
    (data: TableQueries) => {
      setCurrentTableData(data);
    },
    [setCurrentTableData]
  );
  const handlePaginationChange = useCallback(
    (page: number) => {
      handleSetTableData({ ...currentTableData, pageIndex: page });
    },
    [currentTableData, handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        ...currentTableData,
        pageSize: Number(value),
        pageIndex: 1,
      });
      setCurrentSelectedItems([]);
    },
    [currentTableData, handleSetTableData, setCurrentSelectedItems]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({
        ...currentTableData,
        sort: sort,
        pageIndex: 1,
      });
    },
    [currentTableData, handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => {
      handleSetTableData({
        ...currentTableData,
        query: query,
        pageIndex: 1,
      });
    },
    [currentTableData, handleSetTableData]
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
      const rowIds = new Set(rows.map((r) => r.original.id));
      setCurrentSelectedItems((prev) => {
        if (checked) {
          const originalRows = rows.map((row) => row.original);
          const existingIds = new Set(prev.map((i) => i.id));
          const newSelection = originalRows.filter(
            (i) => !existingIds.has(i.id)
          );
          return [...prev, ...newSelection];
        } else {
          return prev.filter((i) => !rowIds.has(i.id));
        }
      });
    },
    [setCurrentSelectedItems]
  );

  const handleEdit = useCallback(
    (item: OfferDemandItem) => {
      console.log(`Edit ${item.type} item:`, item.id);
      const editRoute = `/${currentTab}s/edit/${item.id}`; // Dynamic route
      navigate(editRoute);
    },
    [navigate, currentTab]
  );

  const handleClone = useCallback(
    (itemToClone: OfferDemandItem) => {
      console.log(`Cloning ${itemToClone.type} item:`, itemToClone.id);
      const newId = `${itemToClone.type === "Offer" ? "OFF" : "DEM"}${
        Math.floor(Math.random() * 9000) + 1000
      }`;
      const clonedItem: OfferDemandItem = {
        ...itemToClone,
        id: newId,
        createdDate: new Date(),
      };
      setCurrentItems((prev: OfferDemandItem[]) => [clonedItem, ...prev]);
      toast.push(
        <Notification title="Record Copied" type="success" duration={2000} />
      );
    },
    [setCurrentItems, currentTab]
  );

  const handleDelete = useCallback(
    (itemToDelete: OfferDemandItem) => {
      console.log(`Deleting ${itemToDelete.type} item:`, itemToDelete.id);
      setCurrentItems((currentItems: OfferDemandItem[]) =>
        currentItems.filter((item) => item.id !== itemToDelete.id)
      );
      setCurrentSelectedItems((prevSelected: OfferDemandItem[]) =>
        prevSelected.filter((item) => item.id !== itemToDelete.id)
      );
      toast.push(
        <Notification
          title="Record Deleted"
          type="success"
          duration={2000}
        >{`${itemToDelete.type} ${itemToDelete.id} deleted.`}</Notification>
      );
    },
    [setCurrentItems, setCurrentSelectedItems]
  );

  const handleDeleteSelected = useCallback(() => {
    console.log(
      `Deleting selected ${currentTab} items:`,
      currentSelectedItems.map((i) => i.id)
    );
    const selectedIds = new Set(currentSelectedItems.map((i) => i.id));
    setCurrentItems((currentItems: OfferDemandItem[]) =>
      currentItems.filter((i) => !selectedIds.has(i.id))
    );
    setCurrentSelectedItems([]);
    toast.push(
      <Notification
        title="Records Deleted"
        type="success"
        duration={2000}
      >{`${selectedIds.size} record(s) deleted.`}</Notification>
    );
  }, [
    currentSelectedItems,
    setCurrentItems,
    setCurrentSelectedItems,
    currentTab,
  ]);

  const handleTabChange = (tabKey: string) => {
    if (tabKey === currentTab) return;
    setCurrentTab(tabKey);
    // Reset the other tab's table config
    if (tabKey === TABS.OFFER) {
      setDemandTableData({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: "", key: "" },
        query: "",
      });
    } else {
      setOfferTableData({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: "", key: "" },
        query: "",
      });
    }
    // Clear selection for the newly active tab - Use the direct setter
    if (tabKey === TABS.OFFER) setSelectedOffers([]);
    else setSelectedDemands([]);
  };
  // --- End Lifted Handlers ---

  // --- Define Columns in Parent ---
  const columns: ColumnDef<OfferDemandItem>[] = useMemo(
    () => [
      {
        header: "No", // Sequence Number Column
        // We need access to the row model to get the index
        cell: (props) => {
          const { pageIndex, pageSize } = currentTableData; // Get pagination from state
          // `row.index` is the index within the *current page's* data
          return (
            <span>{(pageIndex - 1) * pageSize + props.row.index + 1}</span>
          );
        },
        width: 60, // Adjust width as needed
        enableSorting: false,
      },
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        width: 120,
      },
      { header: "Name", accessorKey: "name", enableSorting: true },
      {
        header: "Created By",
        accessorKey: "createdBy",
        enableSorting: true,
        cell: (props) => (
          <div className="flex items-center gap-2">
            <Avatar size={28} shape="circle" icon={<TbUserCircle />} />{" "}
            {/* Simple avatar */}
            <span>{props.row.original.createdBy}</span>
          </div>
        ),
      },
      {
        header: "Created Date",
        accessorKey: "createdDate",
        enableSorting: true,
        width: 180,
        cell: (props) => {
          const date = props.row.original.createdDate;
          return (
            <span>
              {date.toLocaleDateString()}{" "}
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      },
      // In columns definition
      {
        header: "Actions",
        id: "action",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <div className="flex items-center justify-center gap-2">
            <ActionColumn
              onClone={() => handleClone(props.row.original)}
              onEdit={() => handleEdit(props.row.original)}
              onDelete={() => handleDelete(props.row.original)}
            />
          </div>
        ),
      },
    ],
    [
      handleClone,
      handleEdit,
      handleDelete,
      currentTableData.pageIndex,
      currentTableData.pageSize,
    ] // Add pagination state to dependencies for "No" column
  );
  // --- End Define Columns ---

  // --- Render Main Component ---
  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        {/* Header Section */}
        <div className="lg:flex items-center justify-between mb-4">
          <h3 className="mb-4 lg:mb-0">Offers & Demands</h3>
          <ItemActionTools allItems={currentItems} activeTab={currentTab} />
        </div>

        {/* Tabs Section */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              key={TABS.OFFER}
              onClick={() => handleTabChange(TABS.OFFER)}
              className={classNames(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                currentTab === TABS.OFFER
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
              )}
            >
              Offer Listing
            </button>
            <button
              key={TABS.DEMAND}
              onClick={() => handleTabChange(TABS.DEMAND)}
              className={classNames(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                currentTab === TABS.DEMAND
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
              )}
            >
              Demand Listing
            </button>
          </nav>
        </div>

        {/* Tools Section (Search) */}
        <div className="mb-4">
          <ItemTableTools onSearchChange={handleSearchChange} />
        </div>

        {/* Table Section */}
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

      {/* Selected Actions Footer */}
      <ItemSelected
        selectedItems={currentSelectedItems}
        setSelectedItems={setCurrentSelectedItems}
        onDeleteSelected={handleDeleteSelected}
        activeTab={currentTab}
      />
    </Container>
  );
};
// --- End Main Component ---

export default OffersDemands;

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
