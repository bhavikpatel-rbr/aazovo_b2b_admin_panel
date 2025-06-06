// src/views/your-path/OffersDemands.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { Dropdown, Form, FormItem, Input } from "@/components/ui";
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
  TbCloudUpload,
} from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getOffersAction,
  getDemandsAction,
  submitExportReasonAction,
  deleteOfferAction,
  deleteAllOffersAction,
  deleteDemandAction, // Added
  deleteAllDemandsAction, // Added
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

// --- (All your existing schemas, types, and helper functions can remain here without changes) ---
// --- Form Schemas ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- API Item Types (Actual shapes from API response.data.data) ---
export type ActualApiCreatorShape = {
  id: number;
  name: string;
};

export type ActualApiOfferShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ActualApiCreatorShape;
  assign_user?: ActualApiCreatorShape | null;
  created_at: string;
  updated_at?: string;
  seller_section?: any | null;
  buyer_section?: any | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  updated_by_name?: string;
  updated_by_role?: string;
};

export type ActualApiDemandShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ActualApiCreatorShape;
  assign_user?: ActualApiCreatorShape | null;
  created_at: string;
  updated_at?: string;
  seller_section?: Record<string, { questions: Record<string, { question: string }> }> | null;
  buyer_section?: Record<string, { questions: Record<string, { question: string }> }> | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  updated_by_name?: string;
  updated_by_role?: string;
};

export type ApiGroupItem = {
  groupName: string;
  items: string[];
};

// --- Unified Table Row Data (OfferDemandItem) ---
export type OfferDemandItem = {
  id: string;
  type: "Offer" | "Demand";
  name: string;
  createdByInfo: {
    userId: string;
    userName: string;
  };
  assignedToInfo?: {
    userId: string;
    userName: string;
  };
  createdDate: Date;
  updated_at?: Date;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
  updated_by_name?: string;
  updated_by_role?: string;
  originalApiItem: ActualApiOfferShape | ActualApiDemandShape;
};

// --- Constants ---
const TABS = { ALL: "all", OFFER: "offer", DEMAND: "demand" };

// --- CSV Export Helpers ---
type OfferDemandExportItem = Omit<OfferDemandItem, 'createdDate' | 'updated_at' | 'createdByInfo' | 'assignedToInfo' | 'originalApiItem' | 'groups'> & {
    created_by_name: string;
    assigned_to_name: string;
    created_date_formatted: string;
    updated_date_formatted: string;
}
const CSV_HEADERS_OFFERS_DEMANDS = [
    "ID", "Type", "Name", "Number of Buyers", "Number of Sellers",
    "Created By", "Assigned To", "Created Date", "Last Updated", "Updated By", "Updated Role"
];
const CSV_KEYS_OFFERS_DEMANDS_EXPORT: (keyof OfferDemandExportItem)[] = [
    "id", "type", "name", "numberOfBuyers", "numberOfSellers",
    "created_by_name", "assigned_to_name", "created_date_formatted", "updated_date_formatted", "updated_by_name", "updated_by_role"
];

function exportToCsvOffersDemands(filename: string, rows: OfferDemandItem[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    const transformedRows: OfferDemandExportItem[] = rows.map((row) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        numberOfBuyers: row.numberOfBuyers,
        numberOfSellers: row.numberOfSellers,
        created_by_name: row.createdByInfo.userName,
        assigned_to_name: row.assignedToInfo?.userName || "N/A",
        created_date_formatted: row.createdDate.toLocaleString(),
        updated_date_formatted: row.updated_at ? row.updated_at.toLocaleString() : "N/A",
        updated_by_name: row.updated_by_name,
        updated_by_role: row.updated_by_role
    }));

    const separator = ",";
    const csvContent = CSV_HEADERS_OFFERS_DEMANDS.join(separator) + "\n" +
      transformedRows.map((row) => {
        return CSV_KEYS_OFFERS_DEMANDS_EXPORT.map((k) => {
          let cell = row[k as keyof OfferDemandExportItem] as any;
          if (cell === null || cell === undefined) {
            cell = "";
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}


// Helper to transform API Offer to OfferDemandItem
const transformApiOffer = (apiOffer: ActualApiOfferShape): OfferDemandItem => {
  const offerGroups: ApiGroupItem[] = [];
  if (apiOffer.groupA) offerGroups.push({ groupName: "Group A", items: [apiOffer.groupA] });
  if (apiOffer.groupB) offerGroups.push({ groupName: "Group B", items: [apiOffer.groupB] });

  return {
    id: apiOffer.generate_id,
    type: "Offer",
    name: apiOffer.name,
    createdByInfo: {
      userId: String(apiOffer.created_by.id),
      userName: apiOffer.created_by.name,
    },
    assignedToInfo: apiOffer.assign_user ? {
      userId: String(apiOffer.assign_user.id),
      userName: apiOffer.assign_user.name,
    } : undefined,
    createdDate: new Date(apiOffer.created_at),
    updated_at: apiOffer.updated_at ? new Date(apiOffer.updated_at) : undefined,
    numberOfBuyers: apiOffer.numberOfBuyers,
    numberOfSellers: apiOffer.numberOfSellers,
    groups: offerGroups.length > 0 ? offerGroups : undefined,
    updated_by_name: apiOffer.updated_by_name,
    updated_by_role: apiOffer.updated_by_role,
    originalApiItem: apiOffer,
  };
};

// Helper to transform API Demand to OfferDemandItem
const transformApiDemand = (apiDemand: ActualApiDemandShape): OfferDemandItem => {
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
    if (items.length > 0) demandGroups.push({ groupName: "Seller Section", items });
  }
  if (apiDemand.buyer_section) {
    const items: string[] = [];
    Object.values(apiDemand.buyer_section).forEach((sectionPart) => {
      if (sectionPart?.questions) {
        Object.values(sectionPart.questions).forEach((q) => {
          if (q?.question) items.push(q.question);
        });
      }
    });
    if (items.length > 0) demandGroups.push({ groupName: "Buyer Section", items });
  }
  if (apiDemand.groupA) demandGroups.push({ groupName: "Group A", items: [apiDemand.groupA] });
  if (apiDemand.groupB) demandGroups.push({ groupName: "Group B", items: [apiDemand.groupB] });

  return {
    id: apiDemand.generate_id,
    type: "Demand",
    name: apiDemand.name,
    createdByInfo: {
      userId: String(apiDemand.created_by.id),
      userName: apiDemand.created_by.name,
    },
    assignedToInfo: apiDemand.assign_user ? {
      userId: String(apiDemand.assign_user.id),
      userName: apiDemand.assign_user.name,
    } : undefined,
    createdDate: new Date(apiDemand.created_at),
    updated_at: apiDemand.updated_at ? new Date(apiDemand.updated_at) : undefined,
    numberOfBuyers: apiDemand.numberOfBuyers,
    numberOfSellers: apiDemand.numberOfSellers,
    groups: demandGroups.length > 0 ? demandGroups : undefined,
    updated_by_name: apiDemand.updated_by_name,
    updated_by_role: apiDemand.updated_by_role,
    originalApiItem: apiDemand,
  };
};
// --- Start of Component and Hooks ---
// ... (previous code)

// UPDATED ActionColumn to remove "(Simulated)"
const ActionColumn = React.memo(
  ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-center">
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
          onClick={() => toast.push(<Notification title="Share Clicked (Not Implemented)" type="info" />)}
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
          <TbTrash size={16} /> Delete
        </Dropdown.Item>
      </Dropdown>
    </div>
  )
);
ActionColumn.displayName = "ActionColumn";

const ItemTable = React.memo(
  ({
    columns, data, loading, pagingData, selectedItems,
    onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect,
  }: {
    columns: ColumnDef<OfferDemandItem>[]; data: OfferDemandItem[]; loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: OfferDemandItem[];
    onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: OfferDemandItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<OfferDemandItem>[]) => void;
  }) => (
    <DataTable
      selectable columns={columns} data={data} loading={loading} pagingData={pagingData}
      checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
      onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
      onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  )
);
ItemTable.displayName = "ItemTable";

const ItemSearch = React.memo(
  React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void }>(({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref} placeholder="Quick Search (ID, Name, Creator)..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  ))
);
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = React.memo(
  ({ onSearchChange, onExport }: { onSearchChange: (query: string) => void; onExport: () => void; }) => (
    <div className="flex items-center w-full gap-2">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
      <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
    </div>
  )
);
ItemTableTools.displayName = "ItemTableTools";

const ItemActionTools = React.memo(
  ({ onRefresh }: { onRefresh: () => void }) => {
    const navigate = useNavigate();
    return (
      <div className="flex flex-col md:flex-row gap-2">
        <Button icon={<TbRefresh />} onClick={onRefresh} title="Refresh Data">Refresh</Button>
        <Button icon={<TbFilter />} block>Filter (Not Implemented)</Button>
        <Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/sales-leads/offers/create")} block>Add Offer</Button>
        <Button icon={<TbPlus />} variant="solid" onClick={() => navigate("/sales-leads/demands/create")} block>Add Demand</Button>
      </div>
    );
  }
);
ItemActionTools.displayName = "ItemActionTools";

// UPDATED ItemSelected to remove "(Simulated)"
const ItemSelected = React.memo(
  ({
    selectedItems, onDeleteSelected, activeTab, isDeleting,
  }: {
    selectedItems: OfferDemandItem[]; onDeleteSelected: () => void; activeTab: string; isDeleting: boolean;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    const itemType = activeTab === TABS.OFFER ? "Offer" : activeTab === TABS.DEMAND ? "Demand" : "Item";
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
                <span>{itemType}{selectedItems.length > 1 ? "s" : ""} selected</span>
              </span>
            </span>
            <Button
              size="sm" variant="plain" className="text-red-600 hover:text-red-500"
              onClick={() => setDeleteOpen(true)} loading={isDeleting}
            >
              Delete Selected
            </Button>
          </div>
        </StickyFooter>
        <ConfirmDialog
          isOpen={deleteOpen} type="danger"
          title={`Delete ${selectedItems.length} ${itemType}${selectedItems.length > 1 ? "s" : ""}`}
          onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}
          loading={isDeleting}
        >
          <p>Are you sure you want to delete the selected {itemType.toLowerCase()}{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p>
        </ConfirmDialog>
      </>
    );
  }
);
ItemSelected.displayName = "ItemSelected";

const OffersDemands = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ... (state definitions remain the same)
  const {
    Offers: rawOffers = [], Demands: rawDemands = [],
    offersStatus, demandsStatus, offersError, demandsError,
  } = useSelector(masterSelector);

  const [offerTableConfig, setOfferTableConfig] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [demandTableConfig, setDemandTableConfig] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [allTableConfig, setAllTableConfig] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });

  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [selectedAll, setSelectedAll] = useState<OfferDemandItem[]>([]);

  const [currentTab, setCurrentTab] = useState<string>(TABS.OFFER);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDeleteConfirm, setItemToDeleteConfirm] = useState<OfferDemandItem | null>(null);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });
  // ... (all hooks and memoized calculations remain the same until the delete handlers)
  const currentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return allTableConfig;
    if (currentTab === TABS.OFFER) return offerTableConfig;
    if (currentTab === TABS.DEMAND) return demandTableConfig;
    return offerTableConfig;
  }, [currentTab, allTableConfig, offerTableConfig, demandTableConfig]);

  const setCurrentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return setAllTableConfig;
    if (currentTab === TABS.OFFER) return setOfferTableConfig;
    if (currentTab === TABS.DEMAND) return setDemandTableConfig;
    return setOfferTableConfig;
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
    return setSelectedOffers;
  }, [currentTab]);

  const fetchData = useCallback(() => {
    dispatch(getOffersAction());
    dispatch(getDemandsAction());
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (offersStatus === "failed" && offersError) toast.push(<Notification title="Error Fetching Offers" type="danger">{String(offersError)}</Notification>);
  }, [offersStatus, offersError]);
  useEffect(() => {
    if (demandsStatus === "failed" && demandsError) toast.push(<Notification title="Error Fetching Demands" type="danger">{String(demandsError)}</Notification>);
  }, [demandsStatus, demandsError]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let transformedData: OfferDemandItem[] = [];
    if (currentTab === TABS.OFFER) {
      transformedData = (Array.isArray(rawOffers) ? rawOffers : []).map(transformApiOffer);
    } else if (currentTab === TABS.DEMAND) {
      transformedData = (Array.isArray(rawDemands) ? rawDemands : []).map(transformApiDemand);
    } else {
      const transformedO = (Array.isArray(rawOffers) ? rawOffers : []).map(transformApiOffer);
      const transformedD = (Array.isArray(rawDemands) ? rawDemands : []).map(transformApiDemand);
      transformedData = [...transformedO, ...transformedD];
    }

    let processedData = [...transformedData];
    if (currentTableConfig.query) {
      const query = currentTableConfig.query.toLowerCase();
      processedData = processedData.filter((item) =>
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.createdByInfo.userName.toLowerCase().includes(query)
      );
    }

    const { order, key } = currentTableConfig.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "createdDate" || key === "updated_at") {
          const dateA = a[key] ? new Date(a[key]!).getTime() : (order === 'asc' ? Infinity : -Infinity);
          const dateB = b[key] ? new Date(b[key]!).getTime() : (order === 'asc' ? Infinity : -Infinity);
          return order === 'asc' ? dateA - dateB : dateB - dateA;
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

        if (typeof aValue === "string" && typeof bValue === "string") return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        if (typeof aValue === "number" && typeof bValue === "number") return order === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
      });
    }

    const allData = processedData;
    const dataTotal = allData.length;
    const pageIndex = currentTableConfig.pageIndex as number;
    const pageSize = currentTableConfig.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;

    return { pageData: allData.slice(startIndex, startIndex + pageSize), total: dataTotal, allFilteredAndSortedData: allData };
  }, [rawOffers, rawDemands, currentTab, currentTableConfig]);

  const handleSetTableConfig = useCallback((data: Partial<TableQueries>) => {
    setCurrentTableConfig((prev) => ({ ...prev, ...data, pageIndex: data.pageIndex !== undefined ? data.pageIndex : 1 }));
  }, [setCurrentTableConfig]);

  const handlePaginationChange = useCallback((page: number) => handleSetTableConfig({ pageIndex: page }), [handleSetTableConfig]);
  const handlePageSizeChange = useCallback((value: number) => {
    handleSetTableConfig({ pageSize: value, pageIndex: 1 });
    setCurrentSelectedItems([]);
  }, [handleSetTableConfig, setCurrentSelectedItems]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableConfig({ sort, pageIndex: 1 }), [handleSetTableConfig]);
  const handleSearchChange = useCallback((query: string) => handleSetTableConfig({ query, pageIndex: 1 }), [handleSetTableConfig]);
  const handleRowSelect = useCallback((checked: boolean, row: OfferDemandItem) => {
    setCurrentSelectedItems((prev) => checked ? (prev.some((i) => i.id === row.id) ? prev : [...prev, row]) : prev.filter((i) => i.id !== row.id));
  }, [setCurrentSelectedItems]);

  const handleAllRowSelect = useCallback((checked: boolean, currentTableRows: Row<OfferDemandItem>[]) => {
    const currentVisibleIds = new Set(currentTableRows.map((r) => r.original.id));
    if (checked) {
      setCurrentSelectedItems((prev) => {
        const newItemsToAdd = currentTableRows.map((r) => r.original).filter((item) => !prev.some((pItem) => pItem.id === item.id));
        return [...prev, ...newItemsToAdd];
      });
    } else {
      setCurrentSelectedItems((prev) => prev.filter((item) => !currentVisibleIds.has(item.id)));
    }
  }, [setCurrentSelectedItems]);

  const handleEdit = useCallback((item: OfferDemandItem) => {
    const basePath = item.type === "Offer" ? "offers" : "demands";
    navigate(`/sales-leads/${basePath}/edit/${item.id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((item: OfferDemandItem) => setItemToDeleteConfirm(item), []);

  // UPDATED onConfirmDelete to handle both Offers and Demands
  const onConfirmDelete = useCallback(async () => {
    if (!itemToDeleteConfirm) return;
    setIsDeleting(true);

    try {
        const { id, type, name } = itemToDeleteConfirm;
        if (type === 'Offer') {
            await dispatch(deleteOfferAction(id)).unwrap();
        } else if (type === 'Demand') {
            await dispatch(deleteDemandAction(id)).unwrap();
        }

        toast.push(<Notification title="Deleted" type="success">{`${name} has been deleted.`}</Notification>);
        fetchData();
        setCurrentSelectedItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error: any) {
        const errorMessage = error?.message || `Failed to delete ${itemToDeleteConfirm.type}.`;
        toast.push(<Notification title="Delete Failed" type="danger">{errorMessage}</Notification>);
    } finally {
        setIsDeleting(false);
        setItemToDeleteConfirm(null);
    }
  }, [dispatch, itemToDeleteConfirm, fetchData, setCurrentSelectedItems]);

  // UPDATED handleDeleteSelected to handle both Offers and Demands
  const handleDeleteSelected = useCallback(async () => {
      if (currentSelectedItems.length === 0) return;
      setIsDeleting(true);

      const offersToDelete = currentSelectedItems.filter(item => item.type === 'Offer');
      const demandsToDelete = currentSelectedItems.filter(item => item.type === 'Demand');
  
      const deletePromises: Promise<any>[] = [];
  
      if (offersToDelete.length > 0) {
          deletePromises.push(dispatch(deleteAllOffersAction(offersToDelete)).unwrap());
      }
  
      if (demandsToDelete.length > 0) {
          deletePromises.push(dispatch(deleteAllDemandsAction(demandsToDelete)).unwrap());
      }

      try {
          await Promise.all(deletePromises);
          toast.push(<Notification title="Bulk Delete Successful" type="success">{`${currentSelectedItems.length} items have been deleted.`}</Notification>);
          fetchData();
          setCurrentSelectedItems([]);
      } catch (error: any) {
          const errorMessage = error?.message || 'An error occurred during bulk deletion.';
          toast.push(<Notification title="Bulk Delete Failed" type="danger">{errorMessage}</Notification>);
      } finally {
          setIsDeleting(false);
      }
  }, [dispatch, currentSelectedItems, fetchData, setCurrentSelectedItems]);

  const handleTabChange = useCallback((tabKey: string) => {
    if (tabKey === currentTab) return;
    setCurrentTab(tabKey);
    if (tabKey === TABS.ALL) { setSelectedAll([]); setAllTableConfig((prev) => ({ ...prev, pageIndex: 1, query: "" })); } 
    else if (tabKey === TABS.OFFER) { setSelectedOffers([]); setOfferTableConfig((prev) => ({ ...prev, pageIndex: 1, query: "" })); } 
    else if (tabKey === TABS.DEMAND) { setSelectedDemands([]); setDemandTableConfig((prev) => ({ ...prev, pageIndex: 1, query: "" })); }
  }, [currentTab]);

  const handleOpenExportReasonModal = useCallback(() => {
    if (!allFilteredAndSortedData || allFilteredAndSortedData.length === 0) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);

  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Offers & Demands";
    try {
        await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })).unwrap();
    } catch (error) { /* Optional error handling */ }
    const success = exportToCsvOffersDemands("offers_demands_export.csv", allFilteredAndSortedData);
    if (success) {
        toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    }
    setIsSubmittingExportReason(false);
    setIsExportReasonModalOpen(false);
  }, [dispatch, allFilteredAndSortedData, exportReasonFormMethods]);

  const columns: ColumnDef<OfferDemandItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 70, cell: (props: CellContext<OfferDemandItem, any>) => (<span className="font-mono text-xs">{props.getValue<string>()}</span>) },
      { header: "Name", accessorKey: "name", enableSorting: true, size: 180, cell: (props: CellContext<OfferDemandItem, any>) => (
          <div>
            <div className="font-semibold">{props.row.original.name}</div>
            {(props.row.original.numberOfBuyers !== undefined || props.row.original.numberOfSellers !== undefined) && (
              <>
                <div className="text-xs text-gray-600 dark:text-gray-300">Buyers: {props.row.original.numberOfBuyers ?? "N/A"}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Sellers: {props.row.original.numberOfSellers ?? "N/A"}</div>
              </>
            )}
          </div>
        ),
      },
      { header: "Section Details", id: "sectionDetails", size: 220, cell: ({ row }: CellContext<OfferDemandItem, any>) => {
          const { groups } = row.original;
          if (!groups || groups.length === 0) return (<span className="text-xs text-gray-500">No group details</span>);
          return (
            <div className="space-y-1">
              {groups.map((group, index) => (
                <div key={index} className="text-xs">
                  <b className="text-gray-700 dark:text-gray-200">{group.groupName}: </b>
                  <div className="pl-2 flex flex-col gap-0.5 text-gray-600 dark:text-gray-400">
                    {group.items.slice(0, 3).map((item, itemIdx) => (<span key={itemIdx}>{item}</span>))}
                    {group.items.length > 3 && (<span className="italic">...and {group.items.length - 3} more</span>)}
                  </div>
                </div>
              ))}
            </div>
          );
        },
      },
      { header: "Created By / Assigned", accessorKey: "createdByInfo.userName", id: "createdBy", enableSorting: true, size: 180, cell: (props: CellContext<OfferDemandItem, any>) => {
          const item = props.row.original;
          const formattedCreatedDate = item.createdDate ? `${new Date(item.createdDate).getDate()} ${new Date(item.createdDate).toLocaleString("en-US", { month: "long" })} ${new Date(item.createdDate).getFullYear()}, ${new Date(item.createdDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "N/A";
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><Avatar size={28} shape="circle" icon={<TbUserCircle />} /><span className="font-semibold">{item.createdByInfo.userName}</span></div>
              {item.assignedToInfo && (<div className="text-xs text-gray-600 dark:text-gray-300"><b>Assigned: </b> {item.assignedToInfo.userName}</div>)}
              <div className="text-xs text-gray-500 dark:text-gray-400"><span>{formattedCreatedDate}</span></div>
            </div>
          );
        },
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        size: 180,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", {
                month: "short",
              })} ${new Date(updated_at).getFullYear()}, ${new Date(
                updated_at
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_name || "N/A"}
                {updated_by_role && (
                  <>
                    <br />
                    <b>{updated_by_role}</b>
                  </>
                )}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
      { header: "Actions", id: "action", meta : { HeaderClass : "text-center" }, size: 120, cell: (props: CellContext<OfferDemandItem, any>) => (<ActionColumn onEdit={() => handleEdit(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />),
      },
    ], [handleEdit, handleDeleteClick]
  );
  // ... (rest of the component JSX)
  const isOverallLoading = offersStatus === "loading" || demandsStatus === "loading" || offersStatus === "idle" || demandsStatus === "idle";

  if (isOverallLoading && !pageData.length) {
    return (
      <Container className="h-full"><div className="h-full flex flex-col items-center justify-center"><Spinner size="xl" /><p className="mt-2">Loading Data...</p></div></Container>
    );
  }

  return (
    <>
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
                >{tabKey === TABS.ALL ? "All Items" : `${tabKey} Listing`}</button>
              ))}
            </nav>
          </div>

          <div className="mb-4">
            <ItemTableTools onSearchChange={handleSearchChange} onExport={handleOpenExportReasonModal} />
          </div>

          <div className="flex-grow overflow-auto">
            <ItemTable
              columns={columns} data={pageData} loading={isOverallLoading && pageData.length > 0}
              pagingData={{ total, pageIndex: currentTableConfig.pageIndex as number, pageSize: currentTableConfig.pageSize as number }}
              selectedItems={currentSelectedItems} onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>

        <ItemSelected selectedItems={currentSelectedItems} onDeleteSelected={handleDeleteSelected} activeTab={currentTab} isDeleting={isDeleting} />
        <ConfirmDialog
          isOpen={!!itemToDeleteConfirm} type="danger" title={`Delete ${itemToDeleteConfirm?.type || "Item"}`}
          onClose={() => setItemToDeleteConfirm(null)} onRequestClose={() => setItemToDeleteConfirm(null)}
          onCancel={() => setItemToDeleteConfirm(null)} onConfirm={onConfirmDelete} loading={isDeleting}
        >
          <p>Are you sure you want to delete "<strong>{itemToDeleteConfirm?.name}</strong>"? This action cannot be undone.</p>
        </ConfirmDialog>
      </Container>
      
      <ConfirmDialog
        isOpen={isExportReasonModalOpen} type="info" title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2">
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller
              name="reason" control={exportReasonFormMethods.control}
              render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3}/>)}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default OffersDemands;