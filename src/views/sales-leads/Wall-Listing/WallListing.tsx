import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added
import cloneDeep from "lodash/cloneDeep";
// useForm, Controller removed as Add/Edit form is separated
// zodResolver, z removed as Add/Edit form schema is separated
import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
// InputNumber removed
import {
  Drawer,
  Form, // Retained for Filter form
  FormItem, // Retained for Filter form
  Input, // Retained for Filter form
  Select as UiSelect, // Retained for Filter form
  DatePicker, // Retained for Filter form
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
  TbPhoto, // For generic image icon
  TbCurrencyDollar,
  TbStack2,
  TbStar,
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
// Textarea removed
import { z } from "zod"; // Retained for Filter form schema

// --- Define Types (retained as they are used by WallListing and table) ---
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
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  product_category: string;
  product_subcategory: string;
  product_description: string;
  product_specs: string;
  product_status: string; // API representation of product availability
  quantity: number;
  price: number;
  want_to: string; // API representation of intent
  listing_type: string;
  shipping_options: string;
  payment_method: string;
  warranty: string;
  return_policy: string;
  listing_url: string;
  brand: string;
  product_images: string[];
  rating: number;
  reviews_count: number;
  created_date: string;
  last_updated: string;
  visibility: string;
  priority: string;
  assigned_to: string;
  inquiry_count: number;
  view_count: number;
  interaction_type: string;
  action: string;
  status: string; // API representation of record status (e.g., "Pending", "Approved")

  // Added fields
  company_id_from_api?: string;
  cartoon_type_id?: number | null;
  device_condition?: string | null;
};

export type WallItem = {
  id: number;
  listing_id: string;
  product_name: string;
  company_name: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
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
  rating: number;
  reviews_count: number;
  created_date: Date;
  last_updated: Date;
  visibility: string;
  priority: string;
  assigned_to: string;
  inquiry_count: number;
  view_count: number;
  interaction_type: string;
  action: string;
  recordStatus?: WallRecordStatus;

  productId?: number;
  productSpecId?: number;
  companyId?: string;
  customerId?: number;

  cartoonTypeId?: number | null;
  deviceCondition?: WallProductCondition | null;

  color?: string | null;
  dispatchStatus?: string | null;
  paymentTermId?: number | null;
  eta?: string | null;
  location?: string | null;
  internalRemarks?: string | null;
};

// --- Zod Schema for Add/Edit Wall Item Form ---
// This schema (wallItemFormSchema) and its type (WallItemFormData)
// will be moved to the Add/Edit components.

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

// --- Status Colors and Options (retained for table display and filter options) ---
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
})); // Used by filter

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
]; // Used by filter

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

// productStatusOptions and deviceConditionOptions will be moved to Add/Edit components.

const dummyProducts = [
  { id: 1, name: "iPhone 15 Pro" },
  { id: 2, name: "Samsung Galaxy S24 Ultra" },
]; // Used by filter
const dummyProductSpecs = [
  { id: 1, name: "256GB, Blue Titanium", productId: 1 },
  { id: 2, name: "512GB, Natural Titanium", productId: 1 },
  { id: 3, name: "256GB, Phantom Black", productId: 2 },
]; // Potentially for filter, kept for now
const dummyCompanies = [
  { id: "COMP001", name: "TechDistributors Inc." },
  { id: "COMP002", name: "Global Gadgets LLC" },
]; // Used by filter
const dummyCustomers = [
  /* ... */
]; // Potentially for filter
export const dummyCartoonTypes = [
  // Exported if Add/Edit components need it from a central place, or copy it. Copied for now.
  { id: 1, name: "Master Carton" },
  { id: 2, name: "Inner Carton" },
];
const dummyPaymentTerms = [
  /* ... */
]; // Potentially for filter or Add/Edit

const initialDummyWallItems: ApiWallItem[] = [
  // ... (data remains the same)
  {
    id: 1,
    listing_id: "LIST-001",
    product_name: "Electric Drill XT5000",
    company_name: "ToolMaster Inc.",
    contact_person_name: "John Doe",
    contact_person_email: "john@toolmaster.com",
    contact_person_phone: "+1 234 567 890",
    product_category: "Tools",
    product_subcategory: "Power Tools",
    product_description:
      "A high-performance electric drill suitable for heavy-duty tasks. Comes with multiple attachments and a durable case.",
    product_specs: "500W, 220V, 13mm chuck, Variable Speed, Reverse Function",
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
    rating: 4.5,
    reviews_count: 87,
    created_date: "2024-01-01T10:00:00Z",
    last_updated: "2024-01-15T12:30:00Z",
    visibility: "public",
    priority: "high",
    assigned_to: "Sales Team A",
    inquiry_count: 42,
    view_count: 580,
    interaction_type: "call",
    action: "follow_up",
    status: "Approved", // Record Status
    company_id_from_api: "COMP001",
    cartoon_type_id: 1,
    device_condition: "New",
  },
  {
    id: 2,
    listing_id: "LIST-002",
    product_name: "Industrial Grade Sander G2",
    company_name: "BuildRight Supplies",
    contact_person_name: "Alice Smith",
    contact_person_email: "alice@buildright.com",
    contact_person_phone: "+1 987 654 321",
    product_category: "Tools",
    product_subcategory: "Sanding Tools",
    product_description:
      "Robust sander for industrial applications. Smooth finish guaranteed.",
    product_specs: "300W, 110V, Orbital Action, Dust Collection Bag",
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
    rating: 4.2,
    reviews_count: 34,
    created_date: "2023-11-10T09:00:00Z",
    last_updated: "2024-01-20T14:00:00Z",
    visibility: "public",
    priority: "medium",
    assigned_to: "Sales Team B",
    inquiry_count: 15,
    view_count: 210,
    interaction_type: "email",
    action: "quote_sent",
    status: "Pending", // Record Status
    company_id_from_api: "COMP002",
    cartoon_type_id: null,
    device_condition: "Used",
  },
];

const CSV_WALL_HEADERS = [
  /* ... as before ... */
];
const CSV_WALL_KEYS: (keyof WallItem)[] = [
  /* ... as before ... */
];
function exportWallItemsToCsv(filename: string, rows: WallItem[]) {
  /* ... as before ... */
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
          let cell = row[k];
          if (cell === null || cell === undefined) cell = "";
          else if (k === "product_images" && Array.isArray(cell))
            cell = cell.join(";");
          else if (cell instanceof Date)
            cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
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

// StyledActionColumn remains largely the same, its onEdit prop will trigger navigation
const StyledActionColumn = ({
  onView,
  onEdit,
  onChangeStatus,
  onWallLink,
  onDelete,
  onViewDetail, // This is used for TbEye
}: {
  onView: () => void; // This prop seems unused in the component's body
  onEdit: () => void;
  onChangeStatus: () => void;
  onWallLink: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}) => {
  /* ... as before ... */
  const iconClass =
    "text-xl cursor-pointer select-none text-gray-500 dark:text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit} // This will call the navigate function
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail} // Correctly uses onViewDetail for the eye icon
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
          // onClick={onWallLink} // Assuming onWallLink is for this or similar action
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
  );
};

// WallSearch, WallTableTools, WallTable, WallSelectedFooter remain the same
// WallSearch.tsx
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

// WallTableTools.tsx
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
  onAddNew, // This will now trigger navigation via openAddDrawer
  onImport,
}: WallTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    {" "}
    <div className="flex-grow">
      {" "}
      <WallSearch onInputChange={onSearchChange} />{" "}
    </div>{" "}
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {" "}
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>{" "}
      <Button
        icon={<TbCloudDownload />}
        onClick={onImport}
        className="w-full sm:w-auto"
      >
        Import
      </Button>{" "}
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>{" "}
    </div>{" "}
  </div>
);

// WallTable.tsx
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
  checkboxChecked: (row: WallItem) => boolean; // Added for completeness
  onCheckBoxChange: (checked: boolean, row: Row<WallItem>) => void; // Added for completeness
  onIndeterminateCheckBoxChange: (
    checked: boolean,
    rows: Row<WallItem>[]
  ) => void; // Added for completeness
  noData: boolean; // Added for completeness
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
    } // Adapted
    onIndeterminateCheckBoxChange={(checked, rows) =>
      props.onAllRowSelect(checked, rows)
    } // Adapted
    noData={!props.loading && props.data.length === 0}
  />
);

// WallSelectedFooter.tsx
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
            {" "}
            <TbChecks className="text-xl text-primary-500" />{" "}
            <span className="font-semibold">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </span>{" "}
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-500 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            {" "}
            Delete Selected{" "}
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
  const navigate = useNavigate(); // Added
  const [allWallItems, setAllWallItems] = useState<WallItem[]>([]);
  const [apiRawData, setApiRawData] = useState<ApiWallItem[]>(
    initialDummyWallItems
  );
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");

  // dispatchSimulated remains for operations within WallListing (delete, status change)
  const dispatchSimulated = useCallback(
    async (action: { type: string; payload?: any }) => {
      setLoadingStatus("loading");
      await new Promise((res) => setTimeout(res, 300)); // Simulate API delay
      try {
        let updatedApiRawData = [...apiRawData]; // Create a mutable copy
        switch (action.type) {
          case "wall/get": // This case might be less used if data is init and then mutated
            // Re-fetch or set initial data if needed.
            // For this example, we can assume initialDummyWallItems is the source.
            updatedApiRawData = initialDummyWallItems;
            break;
          // Add and Edit cases are removed from here as they will be handled in separate pages
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
          default:
            console.warn(
              "Unknown action type in dispatchSimulated:",
              action.type
            );
        }
        setApiRawData(updatedApiRawData); // Update state
        setLoadingStatus("succeeded");
        return { unwrap: () => Promise.resolve() };
      } catch (e) {
        setLoadingStatus("failed");
        console.error("Simulated dispatch error:", e);
        return { unwrap: () => Promise.reject(e) };
      }
    },
    [apiRawData] // Added apiRawData dependency
  );

  useEffect(() => {
    // This mapping logic remains the same
    const mapped = apiRawData.map(
      (apiItem): WallItem => ({
        id: apiItem.id,
        listing_id: apiItem.listing_id,
        product_name: apiItem.product_name,
        company_name: apiItem.company_name,
        contact_person_name: apiItem.contact_person_name,
        contact_person_email: apiItem.contact_person_email,
        contact_person_phone: apiItem.contact_person_phone,
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
        rating: apiItem.rating,
        reviews_count: apiItem.reviews_count,
        created_date: new Date(apiItem.created_date),
        last_updated: new Date(apiItem.last_updated),
        visibility: apiItem.visibility,
        priority: apiItem.priority,
        assigned_to: apiItem.assigned_to,
        inquiry_count: apiItem.inquiry_count,
        view_count: apiItem.view_count,
        interaction_type: apiItem.interaction_type,
        action: apiItem.action,
        recordStatus: apiItem.status as WallRecordStatus,
        companyId: apiItem.company_id_from_api,
        cartoonTypeId: apiItem.cartoon_type_id,
        deviceCondition:
          apiItem.device_condition as WallProductCondition | null,
      })
    );
    setAllWallItems(mapped);
  }, [apiRawData]);

  // isAddEditDrawerOpen removed
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WallItem | null>(null); // Retained for View Drawer
  const [isSubmitting, setIsSubmitting] = useState(false); // Retained for status change etc.
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
  // formMethods for Add/Edit removed
  const filterFormMethods = useForm<FilterFormData>({
    // Retained for Filter form
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

  // closeAddEditDrawer removed
  // onFormSubmit removed

  const openViewDrawer = useCallback((item: WallItem) => {
    setEditingItem(item); // Used for View Drawer
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
      setIsSubmitting(true); // This is for the status change operation
      try {
        await dispatchSimulated({
          type: "wall/changeStatus",
          payload: { id: item.id, newStatus },
        }).unwrap();
        toast.push(
          <Notification
            title="Status Updated"
            type="success"
          >{`Status changed to ${newStatus}.`}</Notification>
        );
        // apiRawData update is handled by dispatchSimulated now
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

  const handleWallLink = useCallback((item: WallItem) => {
    const wallLink =
      item.listing_url || `https://yourplatform.com/wall/${item.listing_id}`;
    navigator.clipboard
      .writeText(wallLink)
      .then(() =>
        toast.push(
          <Notification title="Link Copied" type="success">
            Wall link copied!
          </Notification>
        )
      )
      .catch(() =>
        toast.push(
          <Notification title="Copy Failed" type="danger">
            Could not copy link.
          </Notification>
        )
      );
  }, []);

  // Filter logic remains
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

  // Data processing logic (useMemo) remains the same
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
        processedData = processedData.filter(
          (item) =>
            companySearchTerms.some((term) =>
              item.company_name.toLowerCase().includes(term)
            ) ||
            (item.companyId &&
              companySearchTerms.some((term) =>
                item.companyId?.toLowerCase().includes(term)
              ))
        );
      }
      if (tableData.query && tableData.query.trim() !== "") {
        const query = tableData.query.toLowerCase().trim();
        processedData = processedData.filter((item) =>
          Object.values(item).some((val) =>
            String(val).toLowerCase().includes(query)
          )
        );
      }
      const { order, key } = tableData.sort as OnSortParam;
      if (order && key && processedData.length > 0) {
        processedData.sort((a, b) => {
          let aVal = a[key as keyof WallItem];
          let bVal = b[key as keyof WallItem];
          if (aVal === null || aVal === undefined) aVal = "" as any;
          if (bVal === null || bVal === undefined) bVal = "" as any;
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

  // Table interaction handlers remain
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
          const {
            product_images,
            product_name,
            listing_id,
            brand,
            listing_type,
            want_to,
          } = row.original;
          const intent = want_to as WallIntent;
          return (
            <>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {product_images && (
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
                  )}
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
                          intentTagColor[intent] ||
                          productApiStatusColor.default
                        }`}
                      >
                        {want_to}
                      </Tag>
                    </span>
                  )}
                </span>
              </div>
            </>
          );
        },
      },
      {
        header: "Contact & Company",
        accessorKey: "company_name",
        size: 250,
        cell: ({ row }) => {
          const {
            companyId,
            company_name,
            contact_person_name,
            contact_person_email,
            contact_person_phone,
            listing_url,
          } = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              {companyId && (
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  {companyId}
                </span>
              )}
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {company_name}
              </span>
              {contact_person_name && (
                <span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Contact:
                  </span>{" "}
                  {contact_person_name}
                </span>
              )}
              {contact_person_email && (
                <a
                  href={`mailto:${contact_person_email}`}
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {contact_person_email}
                </a>
              )}
              {contact_person_phone && (
                <span className="text-gray-600 dark:text-gray-300">
                  {contact_person_phone}
                </span>
              )}
              {listing_url && (
                <a
                  href={listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[200px]"
                >
                  Listing URL
                </a>
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
            warranty,
            return_policy,
            cartoonTypeId,
            deviceCondition,
          } = row.original;
          const currentProductStatus =
            product_status?.toLowerCase() || "default";
          const cartoonTypeName = dummyCartoonTypes.find(
            // Referencing exported or locally defined dummyCartoonTypes
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
                      Product Specs:
                    </span>{" "}
                    {product_specs.split(" ").slice(0, 3).join(" ") +
                      (product_specs.split(" ").length > 3 ? "..." : "")}
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
              {!cartoonTypeName && cartoonTypeId && (
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Cartoon Type ID:
                  </span>{" "}
                  {cartoonTypeId}
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
        header: "Pricing & Metrics",
        accessorKey: "price",
        size: 200,
        cell: ({ row }) => {
          const {
            price,
            quantity,
            rating,
            reviews_count,
            view_count,
            inquiry_count,
            created_date,
          } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-1">
                {" "}
                <TbCurrencyDollar className="text-base text-emerald-500 dark:text-emerald-400" />
                <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                  {price?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) ?? "N/A"}
                </span>
                <TbStack2 className="text-base text-blue-500 dark:text-blue-400" />{" "}
                <span
                  className="text-gray-700 dark:text-gray-300"
                  style={{ minWidth: 33 }}
                >
                  Qty: {quantity ?? "N/A"}
                </span>{" "}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                {" "}
                {typeof rating === "number" && (
                  <span className="flex items-center gap-0.5">
                    <TbStar className="text-yellow-500 dark:text-yellow-400" />{" "}
                    {rating.toFixed(1)} ({reviews_count} reviews)
                  </span>
                )}{" "}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                {" "}
                {typeof view_count === "number" && (
                  <span className="flex items-center gap-0.5">
                    <TbEye className="text-gray-500 dark:text-gray-400" />{" "}
                    {view_count} views
                  </span>
                )}{" "}
                {typeof inquiry_count === "number" && (
                  <span className="flex items-center gap-0.5">
                    <TbMessageCircle className="text-gray-500 dark:text-gray-400" />{" "}
                    {inquiry_count} inquiries
                  </span>
                )}{" "}
              </div>
              {created_date && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <TbCalendarEvent />{" "}
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
        size: 150,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<WallItem, any>) => (
          <StyledActionColumn
            onView={() => {}} // This prop is unused by StyledActionColumn's current rendering
            onViewDetail={() => openViewDrawer(props.row.original)} // Correctly passed for TbEye
            onEdit={() => openEditDrawer(props.row.original)} // Will navigate
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            onWallLink={() => handleWallLink(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [
      openViewDrawer,
      openEditDrawer, // Now triggers navigation
      handleChangeStatus,
      handleWallLink,
      handleDeleteClick,
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
              {" "}
              {/* Navigates */}
              Add New
            </Button>
          </div>
          <WallTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onAddNew={openAddDrawer} // Navigates
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
              checkboxChecked={(row) =>
                selectedItems.some((s) => s.id === row.id)
              }
              onCheckBoxChange={(checked, row) =>
                handleRowSelect(checked, row.original)
              }
              onIndeterminateCheckBoxChange={(checked, rows) =>
                handleAllRowSelect(
                  checked,
                  rows.map((r) => r)
                )
              }
              noData={!loadingStatus && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <WallSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={onDeleteSelected}
      />

      {/* Add/Edit Drawer removed */}

      <Drawer // View Drawer remains
        title="View Wall Item Details"
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        onRequestClose={closeViewDrawer}
        width={700}
      >
        {editingItem && (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-4 mb-4">
              {" "}
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
                )}{" "}
              <div>
                {" "}
                <h5 className="font-semibold text-xl text-gray-800 dark:text-gray-100">
                  {editingItem.product_name}
                </h5>{" "}
                <p className="text-gray-500 dark:text-gray-400">
                  ID: {editingItem.listing_id}
                </p>{" "}
              </div>{" "}
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
                    ].includes(key)
                )
                .map(([key, value]) => {
                  let displayValue = value;
                  if (key === "cartoonTypeId" && typeof value === "number") {
                    displayValue =
                      dummyCartoonTypes.find((ct) => ct.id === value)?.name ||
                      value.toString();
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
                        {" "}
                        {displayValue instanceof Date ? (
                          dayjs(displayValue).format("MMM D, YYYY h:mm A")
                        ) : Array.isArray(displayValue) ? (
                          displayValue.join(", ")
                        ) : displayValue !== null &&
                          displayValue !== undefined &&
                          displayValue !== "" ? (
                          displayValue.toString()
                        ) : (
                          <span className="italic text-gray-400 dark:text-gray-500">
                            N/A
                          </span>
                        )}{" "}
                      </span>
                    </div>
                  );
                })}
            </div>
            {editingItem.product_images &&
              editingItem.product_images.length > 1 && (
                <div className="mt-4">
                  {" "}
                  <strong className="text-gray-700 dark:text-gray-200 text-sm">
                    Additional Images:
                  </strong>{" "}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {" "}
                    {editingItem.product_images.slice(1).map((img, idx) => (
                      <Avatar key={idx} src={img} shape="rounded" size={60} />
                    ))}{" "}
                  </div>{" "}
                </div>
              )}
          </div>
        )}
      </Drawer>

      <Drawer // Filter Drawer remains
        title="Filter Wall Listings"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="filterWallForm"
              type="submit"
            >
              Apply Filters
            </Button>{" "}
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
              {" "}
              <Controller
                name="filterRecordStatuses"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select record statuses..."
                    options={recordStatusOptions} // From WallListing scope
                    {...field}
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Product (Name/ID)">
              {" "}
              <Controller
                name="filterProductIds"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select products..."
                    options={dummyProducts.map((p) => ({
                      // From WallListing scope
                      value: p.id,
                      label: p.name,
                    }))}
                    {...field}
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Company (Name/ID)">
              {" "}
              <Controller
                name="filterCompanyIds"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select companies..."
                    options={dummyCompanies.map((p) => ({
                      // From WallListing scope
                      value: p.id,
                      label: p.name,
                    }))}
                    {...field}
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Intent (Want to)">
              {" "}
              <Controller
                name="filterIntents"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select intents..."
                    options={intentOptions} // From WallListing scope
                    {...field}
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Created Date Range">
              {" "}
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
              />{" "}
            </FormItem>
          </div>
        </Form>
      </Drawer>

      <ConfirmDialog // Delete confirmation dialog remains
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

      <Dialog // Import dialog remains
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        title="Import Wall Items"
      >
        <div className="p-4">
          {" "}
          <p>
            Upload a CSV file to import Wall Items. (This is a dummy import)
          </p>{" "}
          <FormItem label="CSV File">
            {" "}
            <Input
              type="file"
              accept=".csv"
              onChange={handleImportFileSelect}
            />{" "}
          </FormItem>{" "}
          <div className="text-right mt-4">
            {" "}
            <Button size="sm" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>{" "}
          </div>{" "}
        </div>
      </Dialog>
    </>
  );
};

export default WallListing;
