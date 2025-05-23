// src/views/your-path/WallListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form"; // Retained for Filter Form
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  DatePicker,
  Dropdown,
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbPlus,
  TbShare,
  TbEye,
  TbDotsVertical,
  TbLink,
  TbCloudDownload,
  TbPhoto,
  TbCurrencyDollar,
  TbStack2,
  TbBookmark, // For outline bookmark
  TbBookmarkFilled, // For filled bookmark
  TbMessageCircle,
  TbCalendarEvent,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { z } from "zod";

// --- Define Types ---
export type WallRecordStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Fulfilled"
  | string;
export type WallIntent = "Buy" | "Sell" | "Exchange";
export type WallProductCondition = "New" | "Used" | "Refurbished" | string;

export type ApiWallItem = {
  id: number;
  listing_id: string;
  product_name: string;
  company_name: string;
  company_id_from_api?: string;
  member_name: string;
  member_id_from_api?: string;
  member_email: string;
  member_phone: string;
  product_category: string;
  product_subcategory: string;
  product_description: string;
  product_specs: string;
  product_status: string;
  quantity: number;
  price: number;
  want_to: string;
  listing_type: string;
  shipping_options: string;
  payment_method: string;
  warranty: string;
  return_policy: string;
  listing_url: string;
  brand: string;
  product_images: string[];
  created_date: string;
  last_updated: string;
  visibility: string;
  priority: string;
  assigned_to: string;
  interaction_type: string;
  action: string;
  status: string;
  cartoon_type_id?: number | null;
  device_condition?: string | null;
  inquiry_count: number;
  share_count: number; // Re-added
  is_bookmarked: boolean;
};

export type WallItem = {
  id: number;
  listing_id: string;
  product_name: string;
  company_name: string;
  companyId?: string;
  member_name: string;
  memberId?: string;
  member_email: string;
  member_phone: string;
  product_category: string;
  product_subcategory: string;
  product_description: string;
  product_specs: string;
  product_status: string;
  quantity: number;
  price: number;
  want_to: WallIntent | string;
  listing_type: string;
  shipping_options: string;
  payment_method: string;
  warranty: string;
  return_policy: string;
  listing_url: string;
  brand: string;
  product_images: string[];
  created_date: Date;
  last_updated: Date;
  visibility: string;
  priority: string;
  assigned_to: string;
  interaction_type: string;
  action: string;
  recordStatus?: WallRecordStatus;
  cartoonTypeId?: number | null;
  deviceCondition?: WallProductCondition | null;
  inquiry_count: number;
  share_count: number; // Re-added
  is_bookmarked: boolean;

  productId?: number;
  productSpecId?: number;
  customerId?: number;
  color?: string | null;
  dispatchStatus?: string | null;
  paymentTermId?: number | null;
  eta?: string | null;
  location?: string | null;
  internalRemarks?: string | null;
};

// --- Zod Schema for Filter Form (Remains here) ---
const selectOptionSchema = z.object({ value: z.any(), label: z.string() });
const filterFormSchema = z.object({
  filterRecordStatuses: z.array(selectOptionSchema).optional().default([]),
  filterProductIds: z.array(selectOptionSchema).optional().default([]),
  filterProductSpecIds: z.array(selectOptionSchema).optional().default([]),
  filterCompanyIds: z.array(selectOptionSchema).optional().default([]),
  filterCustomerIds: z.array(selectOptionSchema).optional().default([]),
  filterIntents: z.array(selectOptionSchema).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Status Colors and Options ---
const recordStatusColor: Record<WallRecordStatus, string> = {
  Pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  Expired: "bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-100",
  Fulfilled: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
};
const recordStatusOptions = Object.keys(recordStatusColor).map((s) => ({
  value: s,
  label: s,
}));

const intentTagColor: Record<WallIntent, string> = {
  Sell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Buy: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Exchange:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
};
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Exchange", label: "Exchange" },
];

const productApiStatusColor: Record<string, string> = {
  available:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-100",
  "low stock":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  "out of stock":
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  discontinued: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
};

const dummyProducts = [
  { id: 1, name: "iPhone 15 Pro" },
  { id: 2, name: "Samsung Galaxy S24 Ultra" },
];
const dummyCompanies = [
  { id: "COMP001", name: "TechDistributors Inc." },
  { id: "COMP002", name: "Global Gadgets LLC" },
];
export const dummyCartoonTypes = [
  { id: 1, name: "Master Carton" },
  { id: 2, name: "Inner Carton" },
];

const initialDummyWallItems: ApiWallItem[] = [
  {
    id: 1,
    listing_id: "LIST-001",
    product_name: "Electric Drill XT5000",
    company_name: "ToolMaster Inc.",
    company_id_from_api: "COMP001",
    member_name: "John Doe",
    member_id_from_api: "MEMBER001",
    member_email: "john.doe@example.com",
    member_phone: "+1 555 123 4567",
    product_category: "Tools",
    product_subcategory: "Power Tools",
    product_description:
      "A high-performance electric drill suitable for heavy-duty tasks.",
    product_specs: "500W, 220V, 13mm chuck",
    product_status: "available",
    quantity: 25,
    price: 149.99,
    want_to: "Sell",
    listing_type: "featured",
    shipping_options: "Courier, Pickup",
    payment_method: "Online, COD",
    warranty: "1 Year Manufacturer Warranty",
    return_policy: "7 Days Return",
    listing_url: "https://example.com/product/electric-drill",
    brand: "ToolMaster",
    product_images: [
      "https://picsum.photos/id/10/200/200",
      "https://picsum.photos/id/11/200/200",
    ],
    created_date: "2024-01-01T10:00:00Z",
    last_updated: "2024-01-15T12:30:00Z",
    visibility: "public",
    priority: "high",
    assigned_to: "Sales Team A",
    interaction_type: "call",
    action: "follow_up",
    status: "Approved",
    cartoon_type_id: 1,
    device_condition: "New",
    inquiry_count: 42,
    share_count: 150, // Re-added
    is_bookmarked: false,
  },
  {
    id: 2,
    listing_id: "LIST-002",
    product_name: "Industrial Grade Sander G2",
    company_name: "BuildRight Supplies",
    company_id_from_api: "COMP002",
    member_name: "Alice Smith",
    member_id_from_api: "MEMBER002",
    member_email: "alice.smith@example.com",
    member_phone: "+1 555 987 6543",
    product_category: "Tools",
    product_subcategory: "Sanding Tools",
    product_description: "Robust sander for industrial applications.",
    product_specs: "300W, 110V, Orbital Action",
    product_status: "low stock",
    quantity: 5,
    price: 89.5,
    want_to: "Sell",
    listing_type: "standard",
    shipping_options: "Courier",
    payment_method: "Online",
    warranty: "6 Months Warranty",
    return_policy: "No Returns",
    listing_url: "https://example.com/product/sander-g2",
    brand: "BuildRight",
    product_images: ["https://picsum.photos/id/12/200/200"],
    created_date: "2023-11-10T09:00:00Z",
    last_updated: "2024-01-20T14:00:00Z",
    visibility: "public",
    priority: "medium",
    assigned_to: "Sales Team B",
    interaction_type: "email",
    action: "quote_sent",
    status: "Pending",
    cartoon_type_id: null,
    device_condition: "Used",
    inquiry_count: 15,
    share_count: 75, // Re-added
    is_bookmarked: true,
  },
];

const CSV_WALL_HEADERS = [
  "ID",
  "Listing ID",
  "Product Name",
  "Company Name",
  "Company ID",
  "Member Name",
  "Member ID",
  "Member Email",
  "Member Phone",
  "Category",
  "Subcategory",
  "Description",
  "Specs",
  "Product Status",
  "Quantity",
  "Price",
  "Intent",
  "Listing Type",
  "Shipping",
  "Payment",
  "Warranty",
  "Return Policy",
  "URL",
  "Brand",
  "Images",
  "Created Date",
  "Last Updated",
  "Visibility",
  "Priority",
  "Assigned To",
  "Interaction Type",
  "Action",
  "Record Status",
  "Cartoon Type ID",
  "Device Condition",
  "Inquiry Count",
  "Share Count",
  "Bookmarked", // Share Count added
];
const CSV_WALL_KEYS: (keyof WallItem)[] = [
  "id",
  "listing_id",
  "product_name",
  "company_name",
  "companyId",
  "member_name",
  "memberId",
  "member_email",
  "member_phone",
  "product_category",
  "product_subcategory",
  "product_description",
  "product_specs",
  "product_status",
  "quantity",
  "price",
  "want_to",
  "listing_type",
  "shipping_options",
  "payment_method",
  "warranty",
  "return_policy",
  "listing_url",
  "brand",
  "product_images",
  "created_date",
  "last_updated",
  "visibility",
  "priority",
  "assigned_to",
  "interaction_type",
  "action",
  "recordStatus",
  "cartoonTypeId",
  "deviceCondition",
  "inquiry_count",
  "share_count",
  "is_bookmarked", // Share Count added
];

function exportWallItemsToCsv(filename: string, rows: WallItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_WALL_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_WALL_KEYS.map((k) => {
          let cell = row[k] as any;
          if (cell === null || cell === undefined) cell = "";
          else if (k === "product_images" && Array.isArray(cell))
            cell = cell.join(";");
          else if (cell instanceof Date)
            cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
          else if (typeof cell === "boolean") cell = cell ? "Yes" : "No";
          else cell = String(cell).replace(/"/g, '""');

          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator);
      })
      .join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
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
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

const StyledActionColumn = ({
  onEdit,
  onViewDetail,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md`}
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
          <Dropdown renderTitle={<TbDotsVertical />} >
            <Dropdown.Item style={{height: "auto"}} className="py-2 text-xs">Request For</Dropdown.Item>
            <Dropdown.Item style={{height: "auto"}} className="py-2 text-xs">Add in Active</Dropdown.Item>
            <Dropdown.Item style={{height: "auto"}} className="py-2 text-xs">Add Schedule</Dropdown.Item>
            <Dropdown.Item style={{height: "auto"}} className="py-2 text-xs">Add Task</Dropdown.Item>
            <Dropdown.Item style={{height: "auto"}} className="py-2 text-xs">View Documents</Dropdown.Item>
            <Dropdown.Item style={{height: "auto"}} className="py-2 text-xs">View Alert</Dropdown.Item>
          </Dropdown>
        </div>
      </Tooltip>
    </div>
  );
};

interface WallSearchProps {
  onInputChange: (value: string) => void;
}
const WallSearch = React.forwardRef<HTMLInputElement, WallSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
WallSearch.displayName = "WallSearch";

interface WallTableToolsProps {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onAddNew: () => void;
  onImport: () => void;
}
const WallTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onAddNew,
  onImport,
}: WallTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <WallSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      <Button
        icon={<TbCloudDownload />}
        onClick={onImport}
        className="w-full sm:w-auto"
      >
        Import
      </Button>
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>
    </div>
  </div>
);

interface WallTableProps {
  columns: ColumnDef<WallItem>[];
  data: WallItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: WallItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (size: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: WallItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void;
}
const WallTable = (props: WallTableProps) => (
  <DataTable
    selectable
    columns={props.columns}
    data={props.data}
    loading={props.loading}
    pagingData={props.pagingData}
    checkboxChecked={(row) => props.selectedItems.some((s) => s.id === row.id)}
    onPaginationChange={props.onPaginationChange}
    onSelectChange={props.onSelectChange}
    onSort={props.onSort}
    onCheckBoxChange={(checked, row) =>
      props.onRowSelect(checked, row.original)
    }
    onIndeterminateCheckBoxChange={(checked, rows) =>
      props.onAllRowSelect(checked, rows)
    }
    noData={!props.loading && props.data.length === 0}
  />
);

interface WallSelectedFooterProps {
  selectedItems: WallItem[];
  onDeleteSelected: () => void;
}
const WallSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: WallSelectedFooterProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4"
        stickyClass="-mx-4 sm:-mx-8 border-t px-8"
      >
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            <TbChecks className="text-xl text-primary-500" />
            <span className="font-semibold">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-500 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteOpen}
        type="danger"
        title={`Delete ${selectedItems.length} items?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
      >
        <p>This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

const WallListing = () => {
  const navigate = useNavigate();
  const [allWallItems, setAllWallItems] = useState<WallItem[]>([]);
  const [apiRawData, setApiRawData] = useState<ApiWallItem[]>(
    initialDummyWallItems
  );
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");

  const dispatchSimulated = useCallback(
    async (action: { type: string; payload?: any }) => {
      setLoadingStatus("loading");
      await new Promise((res) => setTimeout(res, 300));
      try {
        let updatedApiRawData = [...apiRawData];
        switch (action.type) {
          case "wall/get":
            updatedApiRawData = initialDummyWallItems;
            break;
          case "wall/delete":
            updatedApiRawData = apiRawData.filter(
              (item) => item.id !== action.payload.id
            );
            break;
          case "wall/deleteAll":
            const idsToDelete = new Set(
              (action.payload.ids as string).split(",").map(Number)
            );
            updatedApiRawData = apiRawData.filter(
              (item) => !idsToDelete.has(item.id)
            );
            break;
          case "wall/changeStatus":
            updatedApiRawData = apiRawData.map((item) =>
              item.id === action.payload.id
                ? {
                    ...item,
                    status: action.payload.newStatus,
                    last_updated: new Date().toISOString(),
                  }
                : item
            );
            break;
          case "wall/toggleBookmark":
            updatedApiRawData = apiRawData.map((item) =>
              item.id === action.payload.id
                ? {
                    ...item,
                    is_bookmarked: !item.is_bookmarked,
                    last_updated: new Date().toISOString(),
                  }
                : item
            );
            break;
          default:
            console.warn(
              "Unknown action type in dispatchSimulated:",
              action.type
            );
        }
        setApiRawData(updatedApiRawData);
        setLoadingStatus("succeeded");
        return { unwrap: () => Promise.resolve() };
      } catch (e) {
        setLoadingStatus("failed");
        console.error("Simulated dispatch error:", e);
        return { unwrap: () => Promise.reject(e) };
      }
    },
    [apiRawData]
  );

  useEffect(() => {
    const mapped = apiRawData.map(
      (apiItem): WallItem => ({
        id: apiItem.id,
        listing_id: apiItem.listing_id,
        product_name: apiItem.product_name,
        company_name: apiItem.company_name,
        companyId: apiItem.company_id_from_api,
        member_name: apiItem.member_name,
        memberId: apiItem.member_id_from_api,
        member_email: apiItem.member_email,
        member_phone: apiItem.member_phone,
        product_category: apiItem.product_category,
        product_subcategory: apiItem.product_subcategory,
        product_description: apiItem.product_description,
        product_specs: apiItem.product_specs,
        product_status: apiItem.product_status,
        quantity: apiItem.quantity,
        price: apiItem.price,
        want_to: apiItem.want_to as WallIntent | string,
        listing_type: apiItem.listing_type,
        shipping_options: apiItem.shipping_options,
        payment_method: apiItem.payment_method,
        warranty: apiItem.warranty,
        return_policy: apiItem.return_policy,
        listing_url: apiItem.listing_url,
        brand: apiItem.brand,
        product_images: apiItem.product_images || [],
        created_date: new Date(apiItem.created_date),
        last_updated: new Date(apiItem.last_updated),
        visibility: apiItem.visibility,
        priority: apiItem.priority,
        assigned_to: apiItem.assigned_to,
        interaction_type: apiItem.interaction_type,
        action: apiItem.action,
        recordStatus: apiItem.status as WallRecordStatus,
        cartoonTypeId: apiItem.cartoon_type_id,
        deviceCondition:
          apiItem.device_condition as WallProductCondition | null,
        inquiry_count: apiItem.inquiry_count,
        share_count: apiItem.share_count, // Mapped
        is_bookmarked: apiItem.is_bookmarked,
      })
    );
    setAllWallItems(mapped);
  }, [apiRawData]);

  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WallItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WallItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_date" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<WallItem[]>([]);
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    navigate("/sales-leads/wall-item/add");
  }, [navigate]);

  const openEditDrawer = useCallback(
    (item: WallItem) => {
      navigate(`/sales-leads/wall-item/edit/${item.id}`);
    },
    [navigate]
  );

  const openViewDrawer = useCallback((item: WallItem) => {
    setEditingItem(item);
    setIsViewDrawerOpen(true);
  }, []);
  const closeViewDrawer = useCallback(() => {
    setIsViewDrawerOpen(false);
    setEditingItem(null);
  }, []);

  const handleDeleteClick = useCallback((item: WallItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatchSimulated({
        type: "wall/delete",
        payload: { id: itemToDelete.id },
      }).unwrap();
      toast.push(
        <Notification title="Deleted" type="success">
          Item deleted.
        </Notification>
      );
      setSelectedItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    } catch (error: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {error.message || "Delete failed."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatchSimulated, itemToDelete]);

  const onDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const ids = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatchSimulated({
        type: "wall/deleteAll",
        payload: { ids },
      }).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          {selectedItems.length} items deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (error: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {error.message || "Bulk delete failed."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatchSimulated, selectedItems]);

  const handleChangeStatus = useCallback(
    async (item: WallItem) => {
      const statusesCycle: WallRecordStatus[] = [
        "Pending",
        "Approved",
        "Rejected",
        "Expired",
        "Fulfilled",
      ];
      const currentRecordStatus = item.recordStatus || "Pending";
      const currentIndex = statusesCycle.indexOf(currentRecordStatus);
      const newStatus =
        statusesCycle[(currentIndex + 1) % statusesCycle.length];
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "wall/changeStatus",
          payload: { id: item.id, newStatus },
        }).unwrap();
        toast.push(
          <Notification title="Status Updated" type="success">
            {`Status changed to ${newStatus}.`}
          </Notification>
        );
      } catch (error: any) {
        toast.push(
          <Notification title="Error" type="danger">
            Failed to update status.
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated]
  );

  const handleToggleBookmark = useCallback(
    async (item: WallItem) => {
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "wall/toggleBookmark",
          payload: { id: item.id },
        }).unwrap();
        toast.push(
          <Notification title="Bookmark Updated" type="success">
            {`Item ${!item.is_bookmarked ? "bookmarked" : "unbookmarked"}.`}
          </Notification>
        );
      } catch (error: any) {
        toast.push(
          <Notification title="Error" type="danger">
            Failed to update bookmark.
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated]
  );

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [handleSetTableData, closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaults = filterFormSchema.parse({});
    filterFormMethods.reset(defaults);
    setFilterCriteria(defaults);
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);

  interface ProcessedDataType {
    pageData: WallItem[];
    total: number;
    allFilteredAndSortedData: WallItem[];
  }
  const { pageData, total, allFilteredAndSortedData } =
    useMemo((): ProcessedDataType => {
      let processedData: WallItem[] = cloneDeep(allWallItems);
      if (
        filterCriteria.dateRange &&
        (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])
      ) {
        const [startDate, endDate] = filterCriteria.dateRange;
        const start = startDate ? dayjs(startDate).startOf("day") : null;
        const end = endDate ? dayjs(endDate).endOf("day") : null;
        processedData = processedData.filter((item) => {
          const itemDate = dayjs(item.created_date);
          if (start && end) return itemDate.isBetween(start, end, null, "[]");
          if (start) return itemDate.isSameOrAfter(start, "day");
          if (end) return itemDate.isSameOrBefore(end, "day");
          return true;
        });
      }
      if (
        filterCriteria.filterRecordStatuses &&
        filterCriteria.filterRecordStatuses.length > 0
      ) {
        const statuses = new Set(
          filterCriteria.filterRecordStatuses.map((opt) => opt.value)
        );
        processedData = processedData.filter((item) =>
          statuses.has(item.recordStatus)
        );
      }
      if (
        filterCriteria.filterIntents &&
        filterCriteria.filterIntents.length > 0
      ) {
        const intents = new Set(
          filterCriteria.filterIntents.map((opt) => opt.value)
        );
        processedData = processedData.filter((item) =>
          intents.has(item.want_to)
        );
      }
      if (
        filterCriteria.filterProductIds &&
        filterCriteria.filterProductIds.length > 0
      ) {
        const productIds = new Set(
          filterCriteria.filterProductIds.map((opt) => opt.value as number)
        );
        processedData = processedData.filter(
          (item) =>
            productIds.has(item.productId) ||
            filterCriteria.filterProductIds.some((fpi) =>
              item.product_name
                .toLowerCase()
                .includes(String(fpi.label).toLowerCase())
            )
        );
      }
      if (
        filterCriteria.filterCompanyIds &&
        filterCriteria.filterCompanyIds.length > 0
      ) {
        const companySearchTerms = filterCriteria.filterCompanyIds.map((opt) =>
          String(opt.label).toLowerCase()
        );
        const companyIdTerms = filterCriteria.filterCompanyIds.map((opt) =>
          String(opt.value).toLowerCase()
        );

        processedData = processedData.filter(
          (item) =>
            companySearchTerms.some((term) =>
              item.company_name.toLowerCase().includes(term)
            ) ||
            (item.companyId &&
              companyIdTerms.some((term) =>
                item.companyId?.toLowerCase().includes(term)
              ))
        );
      }

      if (tableData.query && tableData.query.trim() !== "") {
        const query = tableData.query.toLowerCase().trim();
        processedData = processedData.filter((item) =>
          Object.values(item).some((val) => {
            if (val === null || val === undefined) return false;
            if (typeof val === "boolean")
              return (val ? "yes" : "no").includes(query);
            return String(val).toLowerCase().includes(query);
          })
        );
      }
      const { order, key } = tableData.sort as OnSortParam;
      if (order && key && processedData.length > 0) {
        processedData.sort((a, b) => {
          let aVal = a[key as keyof WallItem] as any;
          let bVal = b[key as keyof WallItem] as any;
          if (aVal === null || aVal === undefined) aVal = "";
          if (bVal === null || bVal === undefined) bVal = "";

          if (typeof aVal === "boolean" && typeof bVal === "boolean") {
            return order === "asc"
              ? aVal === bVal
                ? 0
                : aVal
                ? -1
                : 1
              : aVal === bVal
              ? 0
              : aVal
              ? 1
              : -1;
          }
          if (aVal instanceof Date && bVal instanceof Date) {
            return order === "asc"
              ? aVal.getTime() - bVal.getTime()
              : bVal.getTime() - aVal.getTime();
          }
          if (typeof aVal === "number" && typeof bVal === "number") {
            return order === "asc" ? aVal - bVal : bVal - aVal;
          }
          return order === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });
      }
      const currentTotal = processedData.length;
      const pageIndex = tableData.pageIndex as number;
      const pageSize = tableData.pageSize as number;
      const startIndex = (pageIndex - 1) * pageSize;
      return {
        pageData: processedData.slice(startIndex, startIndex + pageSize),
        total: currentTotal,
        allFilteredAndSortedData: processedData,
      };
    }, [allWallItems, tableData, filterCriteria]);

  const handleExportData = useCallback(
    () =>
      exportWallItemsToCsv("wall_listing_export.csv", allFilteredAndSortedData),
    [allFilteredAndSortedData]
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handlePageSizeChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: value, pageIndex: 1 });
      setSelectedItems([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: WallItem) =>
      setSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      ),
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<WallItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedItems((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id)));
      }
    },
    []
  );
  const handleImportData = useCallback(() => {
    setImportDialogOpen(true);
  }, []);
  const handleImportFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        console.log("Selected file for import:", file.name);
        toast.push(
          <Notification title="Import Started" type="info">
            File processing initiated. (Dummy)
          </Notification>
        );
        setImportDialogOpen(false);
      }
      event.target.value = "";
    },
    []
  );

  const columns: ColumnDef<WallItem>[] = useMemo(
    () => [
      {
        header: "Listing Overview",
        accessorKey: "product_name",
        size: 280,
        cell: ({ row }) => {
          const { product_images, product_name, listing_id, want_to } =
            row.original;
          const intent = want_to as WallIntent;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Avatar
                  size={33}
                  shape="circle"
                  src={product_images?.[0]}
                  icon={
                    !product_images?.[0] && (
                      <TbPhoto className="text-gray-400" />
                    )
                  }
                />
                <div>
                  <span className="font-semibold text-xs text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    {product_name}
                  </span>
                </div>
              </div>
              <span className="text-xs">
                <span className="font-semibold">ID :</span> {listing_id}
              </span>
              <span className="text-xs">
                {want_to && (
                  <span>
                    <b>Want To: </b>
                    <Tag
                      className={`capitalize text-xs px-1 py-0.5 ${
                        intentTagColor[intent] || productApiStatusColor.default
                      }`}
                    >
                      {want_to}
                    </Tag>
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        header: "Company & Member",
        accessorKey: "company_name",
        size: 260,
        cell: ({ row }) => {
          const {
            companyId,
            company_name,
            member_name,
            memberId,
            member_email,
            member_phone,
            listing_url,
          } = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div className="mb-1 w-full">
                {" "}
                {/* Company details container */}
                {companyId && (
                  <span className="font-semibold text-gray-500 dark:text-gray-400">
                    {companyId} |&nbsp;
                  </span>
                )}
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {company_name}
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 w-full">
                {" "}
                {/* Member details container */}
                {memberId && (
                  <span className="font-semibold text-gray-500 dark:text-gray-400">
                    {memberId} |&nbsp;
                  </span>
                )}
                {member_name && (
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {member_name}
                  </span>
                )}
                {member_email && (
                  <a
                    href={`mailto:${member_email}`}
                    className="block text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {member_email}
                  </a>
                )}
                {member_phone && (
                  <span className="block text-gray-600 dark:text-gray-300">
                    {member_phone}
                  </span>
                )}
              </div>
              {listing_url && (
                <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[200px]"
                  >
                    Listing URL
                  </a>
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Product Details",
        accessorKey: "product_category",
        size: 280,
        cell: ({ row }) => {
          const {
            product_category,
            product_subcategory,
            product_specs,
            product_status,
            cartoonTypeId,
            deviceCondition,
          } = row.original;
          const currentProductStatus =
            product_status?.toLowerCase() || "default";
          const cartoonTypeName = dummyCartoonTypes.find(
            (ct) => ct.id === cartoonTypeId
          )?.name;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Category:
                </span>{" "}
                {product_category}
                {product_subcategory ? ` / ${product_subcategory}` : ""}
              </span>
              {product_specs && (
                <Tooltip title={product_specs}>
                  <span className="truncate max-w-[250px]">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Prodcut Specs:
                    </span>{" "}
                    {product_specs.length > 0
                      ? product_specs.substring(0, 9) + "..."
                      : product_specs}
                  </span>
                </Tooltip>
              )}
              {product_status && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Product Status:
                  </span>{" "}
                  <Tag
                    className={`capitalize text-xs px-1 py-0.5 ${
                      productApiStatusColor[currentProductStatus] ||
                      productApiStatusColor.default
                    }`}
                  >
                    {product_status}
                  </Tag>
                </span>
              )}
              {cartoonTypeName && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Cartoon Type:
                  </span>{" "}
                  {cartoonTypeName}
                </span>
              )}
              {deviceCondition && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Condition:
                  </span>{" "}
                  {deviceCondition}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Pricing & Engagement",
        accessorKey: "price",
        size: 220, // Adjusted size for new share_count
        cell: ({ row }) => {
          const {
            price,
            quantity,
            inquiry_count,
            share_count,
            is_bookmarked,
            created_date,
          } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center">
                <TbCurrencyDollar className="text-base text-emerald-500 dark:text-emerald-400" />
                <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                  {price?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) ?? "N/A"}
                </span>
                <TbStack2 className="text-base text-blue-500 dark:text-blue-400 ml-2" />
                <span
                  className="text-gray-700 dark:text-gray-300"
                  style={{ minWidth: 35 }}
                >
                  Qty: {quantity ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 mt-1">
                <Tooltip title="Inquiries">
                  <span className="flex items-center gap-0.5">
                    <TbMessageCircle className="text-gray-500 dark:text-gray-400" />
                    {inquiry_count}
                  </span>
                </Tooltip>
                <Tooltip title="Shares">
                  <span className="flex items-center gap-0.5">
                    <TbShare className="text-gray-500 dark:text-gray-400" />
                    {share_count}
                  </span>
                </Tooltip>
                <Tooltip title={is_bookmarked ? "Unbookmark" : "Bookmark"}>
                  <button
                    onClick={() => handleToggleBookmark(row.original)}
                    className="p-1 bg-transparent border-none cursor-pointer"
                    aria-label={
                      is_bookmarked ? "Unbookmark item" : "Bookmark item"
                    }
                  >
                    {is_bookmarked ? (
                      <TbBookmarkFilled className="text-lg text-blue-500 dark:text-blue-400" />
                    ) : (
                      <TbBookmark className="text-lg text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" />
                    )}
                  </button>
                </Tooltip>
              </div>
              {created_date && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                  <TbCalendarEvent />
                  {dayjs(created_date).format("MMM D, YYYY")}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Admin Status",
        accessorKey: "recordStatus",
        size: 180,
        cell: ({ row }) => {
          const { recordStatus, visibility, priority, assigned_to } =
            row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              {recordStatus && (
                <Tag
                  className={`${
                    recordStatusColor[recordStatus] || recordStatusColor.Pending
                  } font-semibold capitalize`}
                >
                  {recordStatus}
                </Tag>
              )}
              {visibility && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Visibility:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {visibility}
                  </span>
                </span>
              )}
              {priority && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Priority:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {priority}
                  </span>
                </span>
              )}
              {assigned_to && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Assigned:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {assigned_to}
                  </span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<WallItem, any>) => (
          <StyledActionColumn
            onViewDetail={() => openViewDrawer(props.row.original)}
            onEdit={() => openEditDrawer(props.row.original)}
          />
        ),
      },
    ],
    [
      openViewDrawer,
      openEditDrawer,
      handleToggleBookmark,
      recordStatusColor,
      intentTagColor,
      productApiStatusColor,
    ]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Wall Listing</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <WallTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onAddNew={openAddDrawer}
            onImport={handleImportData}
          />
          <div className="mt-4">
            <WallTable
              columns={columns}
              data={pageData}
              loading={
                loadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <WallSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={onDeleteSelected}
      />

      <Drawer
        title="View Wall Item Details"
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        onRequestClose={closeViewDrawer}
        width={700}
      >
        {editingItem && (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-4 mb-4">
              {editingItem.product_images &&
                editingItem.product_images.length > 0 && (
                  <Avatar
                    size={100}
                    shape="rounded"
                    src={editingItem.product_images?.[0]}
                    icon={
                      !editingItem.product_images?.[0] && (
                        <TbPhoto className="text-gray-400" />
                      )
                    }
                  />
                )}
              <div>
                <h5 className="font-semibold text-xl text-gray-800 dark:text-gray-100">
                  {editingItem.product_name}
                </h5>
                <p className="text-gray-500 dark:text-gray-400">
                  ID: {editingItem.listing_id}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {Object.entries(editingItem)
                .filter(
                  ([key]) =>
                    ![
                      "product_images",
                      "product_name",
                      "listing_id",
                      "id",
                      "productId",
                      "productSpecId",
                      "customerId",
                      "contact_person_name",
                      "contact_person_email",
                      "contact_person_phone",
                    ].includes(key)
                )
                .map(([key, value]) => {
                  let displayValue = value;
                  if (key === "cartoonTypeId" && typeof value === "number") {
                    displayValue =
                      dummyCartoonTypes.find((ct) => ct.id === value)?.name ||
                      value.toString();
                  } else if (
                    key === "is_bookmarked" &&
                    typeof value === "boolean"
                  ) {
                    displayValue = value ? "Yes" : "No";
                  }
                  return (
                    <div
                      key={key}
                      className="border-b border-gray-200 dark:border-gray-700 pb-2"
                    >
                      <strong className="capitalize text-gray-700 dark:text-gray-200">
                        {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:
                      </strong>{" "}
                      <span className="text-gray-600 dark:text-gray-400">
                        {displayValue instanceof Date ? (
                          dayjs(displayValue).format("MMM D, YYYY h:mm A")
                        ) : Array.isArray(displayValue) ? (
                          displayValue.join(", ")
                        ) : displayValue !== null &&
                          displayValue !== undefined &&
                          displayValue !== "" ? (
                          String(displayValue)
                        ) : (
                          <span className="italic text-gray-400 dark:text-gray-500">
                            N/A
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>
            {editingItem.product_images &&
              editingItem.product_images.length > 1 && (
                <div className="mt-4">
                  <strong className="text-gray-700 dark:text-gray-200 text-sm">
                    Additional Images:
                  </strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingItem.product_images.slice(1).map((img, idx) => (
                      <Avatar key={idx} src={img} shape="rounded" size={60} />
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </Drawer>

      <Drawer
        title="Filter Wall Listings"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterWallForm"
              type="submit"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <Form
          id="filterWallForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4 h-full"
        >
          <div className="flex-grow overflow-y-auto p-1">
            <FormItem label="Record Status">
              <Controller
                name="filterRecordStatuses"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select record statuses..."
                    options={recordStatusOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Product (Name/ID)">
              <Controller
                name="filterProductIds"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select products..."
                    options={dummyProducts.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Company (Name/ID)">
              <Controller
                name="filterCompanyIds"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select companies..."
                    options={dummyCompanies.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Intent (Want to)">
              <Controller
                name="filterIntents"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select intents..."
                    options={intentOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Created Date Range">
              <Controller
                name="dateRange"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <DatePicker.DatePickerRange
                    value={
                      field.value as
                        | [Date | null, Date | null]
                        | null
                        | undefined
                    }
                    onChange={field.onChange}
                    placeholder="Select date range"
                  />
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Wall Item"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete item{" "}
          <strong>ID: {itemToDelete?.listing_id}</strong> (
          {itemToDelete?.product_name})?
        </p>
      </ConfirmDialog>

      <Dialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        title="Import Wall Items"
      >
        <div className="p-4">
          <p>
            Upload a CSV file to import Wall Items. (This is a dummy import)
          </p>
          <FormItem label="CSV File">
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportFileSelect}
            />
          </FormItem>
          <div className="text-right mt-4">
            <Button size="sm" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default WallListing;
