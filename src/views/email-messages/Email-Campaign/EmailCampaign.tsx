// src/views/your-path/EmailCampaignListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import {
  useForm,
  Controller,
  FieldErrors,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected typo
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import Radio from "@/components/ui/Radio";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Card,
  Tag,
  Checkbox,
  Dropdown,
  Skeleton, // Skeleton Imported
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbTemplate,
  TbUsersGroup,
  TbPlayerTrackPrev,
  TbPlayerTrackNext,
  TbSend,
  TbCalendarStats,
  TbCircleCheck,
  TbClipboardText,
  TbEye,
  TbTrash,
  TbPhoto,
  TbPhone,
  TbToggleRight,
  TbForms,
  TbMail, // For email list
  TbFileImport,
  TbMailOpened,
  TbMailForward,
  TbMailCode,
  TbReload,
  TbAlignBoxCenterBottom,
  TbMailbox,
  TbBuildingCog,
  TbBuildingOff,
  TbCaravan,
  TbCalendarUser,
  TbPencilCheck,
  TbCalendarClock,
  TbCalendarCancel, // For file import
  TbShoppingCart, // For Products
  TbDatabaseSearch, // For DB Filter
  TbColumns,
  TbX,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getEmailCampaignsAction,
  addEmailCampaignAction,
  editEmailCampaignAction,
  deleteEmailCampaignAction,
  getMailTemplatesAction,
  getProductsAction,
  submitExportReasonAction,
  // --- Actions for Recipient Filter Dropdowns ---
  getContinentsAction,
  getCountriesAction,
  getCompanyAction,
  getBrandAction,
  getCategoriesAction,
  // Assuming these actions exist for the filter modal
  // getMemberTypesAction,
  // getProductSpecsAction,
  // getStatesAction,
  // getCitiesAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { ConfirmDialog } from "@/components/shared";
import dayjs from "dayjs";

// --- Define Item Types & Constants ---
export type ApiMailTemplate = {
  id: string | number;
  name: string;
  template_id?: string;
};
export type ApiProduct = {
  id: string | number;
  name: string;
  image_url: string;
}; // Type for product data
export type ProductOption = { value: string; label: string; imageUrl?: string }; // Type for product dropdown options
export type SelectOption = { value: string; label: string };

export type CampaignApiStatus = "Inactive" | "" | null | string;
export type CampaignFormStatus = "active" | "inactive";

export type EmailCampaignItem = {
  id: string | number;
  template_id: number | string;
  campaign_name?: string;
  status: CampaignApiStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  schedule_at?: string | null;
  header_text?: string;
  images?: string[]; // Kept for display, but now derived from products
  img_ids?: (string | number)[]; // New: For linking selected products
  text_final?: string;
  text_block_2?: string;
  text_with_whatsapp_link?: string;
  whatsapp_number_to_link?: string;
  recipient_source?: string[]; // Can be email strings or a marker for file import

  mail_template: {
    id: number;
    name: string;
    template_id?: string;
  };
  campaignNameDisplay?: string;
  dateTimeDisplay?: Date;
};

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Zod Schema for Recipient DB Filter Form ---
const recipientFilterSchema = z.object({
  // Member Filter
  member_status: z.string().optional(),
  customer_id: z.array(z.string()).optional(),
  kyc_verified: z.boolean().optional(),
  enable_billing: z.boolean().optional(),
  interested_category_ids: z.array(z.string()).optional(),
  continent_id: z.string().optional(),
  country_id: z.string().optional(),
  member_type_id: z.string().optional(),
  state_id: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  // Wall Filter
  favourite_brand: z.string().optional(),
  product_spec_id: z.string().optional(),
  wall_category_id: z.string().optional(),
  sub_category_id: z.string().optional(),
  wall_brand_id: z.string().optional(),
  product_id: z.string().optional(),
  product_status: z.string().optional(),
  want_to: z.string().optional(),
  wall_created_at: z.array(z.date().nullable()).optional(),
  // Row Data Filter
  status_row: z.string().optional(),
  row_category_id: z.string().optional(),
  row_country_id: z.string().optional(),
  row_brand_id: z.string().optional(),
  quality: z.string().optional(),
});
type RecipientFilterFormData = z.infer<typeof recipientFilterSchema>;

const CAMPAIGN_STATUS_OPTIONS_FORM: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const campaignStatusFormValues = CAMPAIGN_STATUS_OPTIONS_FORM.map(
  (s) => s.value
) as [CampaignFormStatus, ...CampaignFormStatus[]];

const CAMPAIGN_STATUS_OPTIONS_FILTER: SelectOption[] = [
  { value: "", label: "Active" },
  { value: "Inactive", label: "Inactive/Draft" },
];

const campaignDisplayStatusColor: Record<string, string> = {
  "": "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
  null: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  default: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
};

let getValuesCampaignForm: UseFormReturn<CampaignCreationFormData>["getValues"] =
  () => ({} as CampaignCreationFormData);

const campaignCreationFormSchema = z
  .object({
    template_id: z
      .string({ required_error: "Please select a template." })
      .min(1, "Template is required."),
    campaign_name: z
      .string()
      .min(1, "Campaign Name is required.")
      .max(150, "Campaign name too long."),
    text_block_1: z
      .string()
      .max(1000, "Header text is too long.")
      .optional()
      .or(z.literal("")),
    // Product selection fields replace image URL inputs
    img_1: z
      .object({ value: z.string(), label: z.string() })
      .optional()
      .nullable(),
    img_2: z
      .object({ value: z.string(), label: z.string() })
      .optional()
      .nullable(),
    img_3: z
      .object({ value: z.string(), label: z.string() })
      .optional()
      .nullable(),
    img_4: z
      .object({ value: z.string(), label: z.string() })
      .optional()
      .nullable(),
    img_5: z
      .object({ value: z.string(), label: z.string() })
      .optional()
      .nullable(),
    img_6: z
      .object({ value: z.string(), label: z.string() })
      .optional()
      .nullable(),
    text_final: z
      .string()
      .max(1000, "Final text is too long")
      .optional()
      .or(z.literal("")),
    text_block_2: z
      .string()
      .max(1000, "Text 2 is too long.")
      .optional()
      .or(z.literal("")),
    text_with_whatsapp_link: z
      .string()
      .max(500, "WhatsApp text too long.")
      .optional()
      .or(z.literal("")),
    whatsapp_number_to_link: z
      .string()
      .regex(/^\+?[0-9\s-()]{7,15}$/, "Invalid WhatsApp number format.")
      .optional()
      .or(z.literal("")),
    recipient_source_mode: z.enum(["select_from_db", "import_file"], {
      required_error: "Choose recipient mode.",
    }),
    recipient_db_filters: z.custom<RecipientFilterFormData>().optional(),
    recipient_imported_file: z.instanceof(File).optional().nullable(),
    status: z.enum(campaignStatusFormValues, {
      errorMap: () => ({ message: "Please select a status." }),
    }),
    sendOption: z.enum(["now", "schedule"], {
      required_error: "Please choose a send option.",
    }),
    scheduledAt: z.date({ coerce: true }).nullable().optional(),
    __editingItem: z.custom<EmailCampaignItem | null>().optional(),
  })
  .superRefine((data, ctx) => {
    // SuperRefine logic updated for new recipient source
    if (
      data.recipient_source_mode === "select_from_db" &&
      !data.recipient_db_filters
    ) {
      const isEditing = !!data.__editingItem;
      if (!isEditing) {
        // Only enforce for new campaigns
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select and apply filters for recipients.",
          path: ["recipient_source_mode"],
        });
      }
    }
    if (
      data.recipient_source_mode === "import_file" &&
      !data.recipient_imported_file
    ) {
      const isEditing = !!data.__editingItem;
      if (!isEditing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please upload a file for new campaign.",
          path: ["recipient_imported_file"],
        });
      }
    }
    if (data.sendOption === "schedule" && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a schedule date and time.",
        path: ["scheduledAt"],
      });
    }
    if (
      data.sendOption === "schedule" &&
      data.scheduledAt &&
      data.scheduledAt < new Date(new Date().setHours(0, 0, 0, 0))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheduled date cannot be in the past.",
        path: ["scheduledAt"],
      });
    }
  });
type CampaignCreationFormData = z.infer<typeof campaignCreationFormSchema>;
type ProductFieldName =
  | "img_1"
  | "img_2"
  | "img_3"
  | "img_4"
  | "img_5"
  | "img_6";

const campaignFilterFormSchema = z.object({
  status: z.string().optional(),
  date_range: z.array(z.date().nullable()).optional().default([null, null]),
});
type CampaignFilterFormData = z.infer<typeof campaignFilterFormSchema>;

const CSV_HEADERS_CAMPAIGN = ["ID", "Campaign Name", "Status", "Created At"];
const CSV_KEYS_CAMPAIGN_SIMPLE: (keyof Pick<
  EmailCampaignItem,
  "id" | "status" | "created_at" | "campaign_name"
>)[] = ["id", "campaign_name", "status", "created_at"];

function exportCampaignsToCsv(
  filename: string,
  rows: EmailCampaignItem[]
): boolean {
  if (!rows || !rows.length) {
    return false;
  }
  const preparedRows = rows.map((row) => ({
    id: row.id,
    campaign_name:
      row.campaign_name || row.mail_template?.name || String(row.template_id),
    status:
      CAMPAIGN_STATUS_OPTIONS_FILTER.find((s) => s.value === row.status)
        ?.label || String(row.status),
    created_at: row.created_at,
  }));
  const separator = ",";
  const csvContent =
    CSV_HEADERS_CAMPAIGN.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_CAMPAIGN_SIMPLE.map((k) => {
          let cell: any = row[k];
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator)
      )
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
  return false;
}

const ActionColumn = ({
  onViewDetails,
  onEdit,
  onDelete,
}: {
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="Edit Campaign">
        <div
          className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600"
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Send Test Email">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600"
          role="button"
        >
          <TbMailForward size={18} />
        </div>
      </Tooltip>
      <Tooltip title="View Template">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600"
          role="button"
        >
          <TbAlignBoxCenterBottom size={17} />
        </div>
      </Tooltip>
      <Tooltip title="Email Log">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600"
          role="button"
        >
          <TbMailbox size={18} />
        </div>
      </Tooltip>
      <Tooltip title="Send Now">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600"
          role="button"
        >
          <TbSend size={18} />
        </div>
      </Tooltip>
    </div>
  );
};
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => (
    <DebounceInput
      ref={ref}
      className="w-full"
      placeholder="Search by Template Name, ID..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
ItemSearch.displayName = "ItemSearch";

const EmailCampaignTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<EmailCampaignItem>[];
  filteredColumns: ColumnDef<EmailCampaignItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<EmailCampaignItem>[]>>;
  activeFilterCount: number;
  isDataReady: boolean;
}) => {
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
      if (originalColumn) {
        setFilteredColumns(prev => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
            const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2">
            <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.map((col) => {
              const id = col.id || col.accessorKey as string;
              return col.header && (
                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                  <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>
                    {col.header as string}
                  </Checkbox>
                </div>
              );
            })}
          </div>
        </Dropdown>
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload" disabled={!isDataReady}></Button>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled={!isDataReady}>
          Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
        </Button>
        <Button 
              menuName="email_campaign" isExport={true}

         icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" disabled={!isDataReady}>Export</Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, allStatusOptions }: {
  filterData: Partial<CampaignFilterFormData>,
  onRemoveFilter: (key: keyof CampaignFilterFormData, value?: any) => void;
  onClearAll: () => void;
  allStatusOptions: SelectOption[];
}) => {
  const { status, date_range } = filterData;
  const hasFilters = status || (date_range && (date_range[0] || date_range[1]));
  if (!hasFilters) return null;

  const statusLabel = allStatusOptions.find(opt => opt.value === status)?.label || status;
  const dateLabel = date_range && (date_range[0] || date_range[1])
    ? `${date_range[0] ? dayjs(date_range[0]).format('DD/MM/YY') : '...'} - ${date_range[1] ? dayjs(date_range[1]).format('DD/MM/YY') : '...'}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {status && <Tag prefix>Status: {statusLabel} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status')} /></Tag>}
      {dateLabel && <Tag prefix>Date: {dateLabel} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('date_range')} /></Tag>}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};


type EmailCampaignsTableProps = {
  columns: ColumnDef<EmailCampaignItem>[];
  data: EmailCampaignItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
};
const EmailCampaignsTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: EmailCampaignsTableProps) => (
  <DataTable
    menuName="email_campaign"
    columns={columns}
    data={data}
    loading={loading}
    pagingData={pagingData}
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
    noData={!loading && data.length === 0}
  />
);

// --- NEW: Recipient Filter Modal Component ---
const RecipientFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: RecipientFilterFormData) => void;
  initialFilters: RecipientFilterFormData | null;
}) => {
  const recipientFilterForm = useForm<RecipientFilterFormData>({
    resolver: zodResolver(recipientFilterSchema),
    defaultValues: initialFilters || {},
  });

  // --- Fetch data for dropdowns from Redux Store ---
  const {
    CompanyData = [],
    BrandData = [],
    CategoriesData = [],
    ProductsData = [],
    ContinentsData = [],
    CountriesData = [],
    // Add other data slices as needed from masterSelector
  } = useSelector(masterSelector, shallowEqual);

  // --- Transform fetched data into options for Select components ---
  const companyOptions = useMemo(
    () =>
      (Array.isArray(CompanyData) ? CompanyData : CompanyData?.data || []).map(
        (c: any) => ({ value: String(c?.id), label: c?.name })
      ),
    [CompanyData]
  );
  const brandOptions = useMemo(() =>
    BrandData?.map((b: any) => ({ value: String(b.id), label: b.name })),
    [BrandData]
  );

  console.log("BrandData", BrandData);

  const categoryOptions = useMemo(() =>
    (CategoriesData || []).map((c: any) => ({ value: String(c.id), label: c.name })),
    [CategoriesData]
  );
  const productOptions = useMemo(() =>
    (ProductsData?.data || []).map((p: any) => ({ value: String(p.id), label: p.name })),
    [ProductsData?.data]
  );
  const continentOptions = useMemo(() =>
    (ContinentsData || []).map((c: any) => ({ value: String(c.id), label: c.name })),
    [ContinentsData]
  );
  const countryOptions = useMemo(() =>
    (CountriesData || []).map((c: any) => ({ value: String(c.id), label: c.name })),
    [CountriesData]
  );
  // Assuming sub-categories are within CategoriesData for this example
  const subCategoryOptions = categoryOptions;
  // Assuming product specs need to be fetched, creating a placeholder
  const productSpecOptions = useMemo(() => [], []); // Replace with actual data

  // Static options (as they were, no API call needed for these)
  const MOCK_MEMBER_STATUS_OPTIONS: SelectOption[] = [
    { value: "Active", label: "Active" },
    { value: "Disabled", label: "Disabled" },
    { value: "Unverified", label: "Unverified" },
    { value: "Unregistered", label: "Unregistered" },
  ];
  const MOCK_MEMBER_TYPE_OPTIONS: SelectOption[] = [
    { value: "INS - PREMIUM", label: "INS - PREMIUM" },
    { value: "INS - SUPER", label: "INS - SUPER" },
    { value: "INS - TOP", label: "INS - TOP" },
    { value: "INS - SUPPLIER", label: "INS - SUPPLIER" },
    { value: "GLB - PREMIUM", label: "GLB - PREMIUM" },
    { value: "GLB - BUYER", label: "GLB - BUYER" },
    { value: "INDIAN", label: "INDIAN" },
    { value: "GLOBAL SUPPLIER", label: "GLOBAL SUPPLIER" },
  ];
  const MOCK_PRODUCT_STATUS_OPTIONS: SelectOption[] = [
    { value: "Active", label: "Active" },
    { value: "Non-active", label: "Non-active" },
  ];
  const MOCK_WANT_TO_OPTIONS: SelectOption[] = [
    { value: "Sell", label: "Sell" },
    { value: "buy", label: "Buy" },
  ];
  const MOCK_ROW_STATUS_OPTIONS: SelectOption[] = [
    { value: "Row", label: "Row" },
    { value: "Identified", label: "Identified" },
    { value: "Verified", label: "Verified" },
    { value: "Blacklist", label: "Blacklist" },
    { value: "Hold", label: "Hold" },
  ];
  const MOCK_QUALITY_OPTIONS: SelectOption[] = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ];

  const handleApply = (data: RecipientFilterFormData) => {
    onApply(data);
    onClose();
  };

  const handleReset = () => {
    recipientFilterForm.reset({});
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={1000}
      bodyOpenClassName="overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h5 className="mb-0">Filter Options for Recipients</h5>
      </div>
      <Form
        id="recipientFilterForm"
        onSubmit={recipientFilterForm.handleSubmit(handleApply)}
        className="max-h-[60vh] overflow-y-auto pr-4 -mr-4"
      >
        {/* Member Filter Section */}
        <Card>
          <h6 className="font-semibold">Member Filter</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <FormItem label="Status">
              <Controller
                name="member_status"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={MOCK_MEMBER_STATUS_OPTIONS.find(o => o.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : '')}
                    options={MOCK_MEMBER_STATUS_OPTIONS}
                    isClearable
                    placeholder="Select Status"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Company">
              <Controller
                name="customer_id"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={companyOptions.filter(o => (field.value || []).includes(o.value))}
                    onChange={(options) => field.onChange(options ? options.map(o => o.value) : [])}
                    options={companyOptions}
                    isMulti
                    placeholder="Select Company"
                  />
                )}
              />
            </FormItem>
            <FormItem label="KYC verified">
              <Controller
                name="kyc_verified"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Checkbox {...field} checked={!!field.value}>
                    Yes
                  </Checkbox>
                )}
              />
            </FormItem>
            <FormItem label="Enable Billing">
              <Controller
                name="enable_billing"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Checkbox {...field} checked={!!field.value}>
                    Yes
                  </Checkbox>
                )}
              />
            </FormItem>
            <FormItem label="Interested category">
              <Controller
                name="interested_category_ids"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={categoryOptions.filter(o => (field.value || []).includes(o.value))}
                    onChange={(options) => field.onChange(options ? options.map(o => o.value) : [])}
                    options={categoryOptions}
                    isMulti
                    isClearable
                    placeholder="Select Category"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Continent">
              <Controller
                name="continent_id"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={continentOptions.find(o => o.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : '')}
                    options={continentOptions}
                    isClearable
                    placeholder="Select Continent"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Country">
              <Controller
                name="country_id"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={countryOptions.find(o => o.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : '')}
                    options={countryOptions}
                    isClearable
                    placeholder="Select Country"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Member Type">
              <Controller
                name="member_type_id"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={MOCK_MEMBER_TYPE_OPTIONS.find(o => o.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : '')}
                    options={MOCK_MEMBER_TYPE_OPTIONS}
                    isClearable
                    placeholder="Select Member Type"
                  />
                )}
              />
            </FormItem>
            <FormItem label="State">
              <Controller
                name="state_id"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={null} // Placeholder
                    onChange={() => { }} // Placeholder
                    options={[]} // Placeholder: Requires a separate state API call, likely dependent on country
                    isClearable
                    placeholder="Select State"
                  />
                )}
              />
            </FormItem>
            <FormItem label="City">
              <Controller
                name="city"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={null} // Placeholder
                    onChange={() => { }} // Placeholder
                    options={[]} // Placeholder: Requires a separate city API call
                    isClearable
                    placeholder="Select City"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Pincode">
              <Controller
                name="pincode"
                control={recipientFilterForm.control}
                render={({ field }) => <Input {...field} placeholder="Pincode" />}
              />
            </FormItem>
          </div>
        </Card>

        {/* Wall Filter Section */}
        <Card className="mt-6">
          <h6 className="font-semibold">Wall Filter</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <FormItem label="Favourite Brand">
              <Controller name="favourite_brand" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={brandOptions?.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={brandOptions} isClearable placeholder="Select Brand" />} />
            </FormItem>
            <FormItem label="Product spec">
              <Controller name="product_spec_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={productSpecOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={productSpecOptions} isClearable placeholder="Select Spec" />} />
            </FormItem>
            <FormItem label="Category">
              <Controller name="wall_category_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={categoryOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={categoryOptions} isClearable placeholder="Select Category" />} />
            </FormItem>
            <FormItem label="Sub Category">
              <Controller name="sub_category_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={subCategoryOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={subCategoryOptions} isClearable placeholder="Select Sub Category" />} />
            </FormItem>
            <FormItem label="Brand">
              <Controller name="wall_brand_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={brandOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={brandOptions} isClearable placeholder="Select Brand" />} />
            </FormItem>
            <FormItem label="Product">
              <Controller name="product_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={productOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={productOptions} isClearable placeholder="Select Product" />} />
            </FormItem>
            <FormItem label="Product Status">
              <Controller name="product_status" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={MOCK_PRODUCT_STATUS_OPTIONS.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={MOCK_PRODUCT_STATUS_OPTIONS} isClearable placeholder="Select Status" />} />
            </FormItem>
            <FormItem label="Want To">
              <Controller name="want_to" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={MOCK_WANT_TO_OPTIONS.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={MOCK_WANT_TO_OPTIONS} isClearable placeholder="Select Option" />} />
            </FormItem>
            <FormItem label="Created date" className="md:col-span-2">
              <Controller
                name="wall_created_at"
                control={recipientFilterForm.control}
                render={({ field }) => (
                  <DatePicker
                    value={(field.value as [Date | null, Date | null]) ?? [null, null]}
                    onChange={(dates) => field.onChange(dates ?? [null, null])}
                    placeholder={["Start Date", "End Date"]}
                  />
                )}
              />
            </FormItem>
          </div>
        </Card>

        {/* Row Data Filter Section */}
        <Card className="mt-6">
          <h6 className="font-semibold">Row Data Filter</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <FormItem label="Status">
              <Controller name="status_row" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={MOCK_ROW_STATUS_OPTIONS.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={MOCK_ROW_STATUS_OPTIONS} isClearable placeholder="Select Status" />} />
            </FormItem>
            <FormItem label="Category">
              <Controller name="row_category_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={categoryOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={categoryOptions} isClearable placeholder="Select Category" />} />
            </FormItem>
            <FormItem label="Country">
              <Controller name="row_country_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={countryOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={countryOptions} isClearable placeholder="Select Country" />} />
            </FormItem>
            <FormItem label="Brand">
              <Controller name="row_brand_id" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={brandOptions.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={brandOptions} isClearable placeholder="Select Brand" />} />
            </FormItem>
            <FormItem label="Quality">
              <Controller name="quality" control={recipientFilterForm.control} render={({ field }) => <Select {...field} value={MOCK_QUALITY_OPTIONS.find(o => o.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : '')} options={MOCK_QUALITY_OPTIONS} isClearable placeholder="Select Quality" />} />
            </FormItem>
          </div>
        </Card>
      </Form>
      <div className="text-right mt-6">
        <Button size="sm" className="mr-2" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" variant="solid" form="recipientFilterForm" type="submit">
          Apply Filters
        </Button>
      </div>
    </Dialog>
  );
};

const EmailCampaignListing = () => {
  const dispatch = useAppDispatch();
  const {
    emailCampaignsData = { data: [], counts: {} },
    mailTemplatesData = [],
    ProductsData = [], // This is already in the selector, used by both the form and the filter modal
  } = useSelector(masterSelector, shallowEqual);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [currentWizardStep, setCurrentWizardStep] = useState(1);
  const [editingItem, setEditingItem] = useState<EmailCampaignItem | null>(
    null
  );
  const [viewingItem, setViewingItem] = useState<EmailCampaignItem | null>(
    null
  );
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [itemToDelete, setItemToDelete] = useState<EmailCampaignItem | null>(
    null
  );
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<
    Partial<CampaignFilterFormData>
  >({});
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [isRecipientFilterModalOpen, setIsRecipientFilterModalOpen] = useState(false);

  const isDataReady = !initialLoading;
  const tableLoading = initialLoading || isSubmittingCampaign || isDeleting;

  const mailTemplateOptions = useMemo(
    () =>
      Array.isArray(mailTemplatesData)
        ? mailTemplatesData.map((t: ApiMailTemplate) => ({
          value: String(t.id),
          label: t.name,
        }))
        : [],
    [mailTemplatesData]
  );
  const productOptions = useMemo(
    (): ProductOption[] =>
      Array.isArray(ProductsData?.data)
        ? ProductsData.data.map((p: ApiProduct) => ({
          value: String(p.id),
          label: p.name,
          imageUrl: p.image_url,
        }))
        : [],
    [ProductsData?.data]
  );

  const campaignFormMethods = useForm<CampaignCreationFormData>({
    resolver: zodResolver(campaignCreationFormSchema),
    mode: "onChange",
  });
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors, isValid: formIsValid },
  } = campaignFormMethods;

  useEffect(() => {
    getValuesCampaignForm = getValues;
  }, [getValues]);

  const filterFormMethods: UseFormReturn<CampaignFilterFormData> =
    useForm<CampaignFilterFormData>({
      resolver: zodResolver(campaignFilterFormSchema),
      defaultValues: { status: "", date_range: [null, null] },
    });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(getEmailCampaignsAction({ params: tableData })),
          dispatch(getMailTemplatesAction()),
          dispatch(getProductsAction()),
          dispatch(getContinentsAction()),
          dispatch(getCountriesAction()),
          dispatch(getCompanyAction()),
          dispatch(getBrandAction()),
          dispatch(getCategoriesAction())
        ]);
      } catch (error) {
        console.error("Failed to load initial data for email campaigns", error);
        toast.push(<Notification title="Error" type="danger">Failed to load essential data.</Notification>);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [dispatch, tableData]);

  const watchedTemplateId = watch("template_id");

  useEffect(() => {
    if (!isCreateDrawerOpen) return;
    const selectedTemplateOption = mailTemplateOptions.find(
      (opt) => opt.value === watchedTemplateId
    );
    let numberOfImagesExpected = 0;
    if (selectedTemplateOption?.label) {
      const match = selectedTemplateOption.label.match(/^img\s*(\d+)$/i);
      if (match?.[1]) {
        numberOfImagesExpected = Math.min(
          Math.max(0, parseInt(match[1], 10)),
          6
        );
      }
    }
    if (
      !editingItem ||
      (editingItem && String(editingItem.template_id) !== watchedTemplateId)
    ) {
      for (let i = 1; i <= 6; i++) {
        const fieldName = `img_${i}` as ProductFieldName;
        if (i > numberOfImagesExpected && getValues(fieldName)) {
          setValue(fieldName, null, {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      }
    }
  }, [
    watchedTemplateId,
    mailTemplateOptions,
    setValue,
    getValues,
    isCreateDrawerOpen,
    editingItem,
  ]);

  const nextStep = useCallback(async () => {
    let fieldsToValidate: (keyof CampaignCreationFormData)[] = [];
    if (currentWizardStep === 1)
      fieldsToValidate = ["template_id", "campaign_name"];
    else if (currentWizardStep === 3)
      fieldsToValidate = [
        "recipient_source_mode",
        "recipient_imported_file",
        "recipient_db_filters",
      ];

    if (fieldsToValidate.length > 0) {
      setValue("__editingItem", editingItem, {
        shouldValidate: false,
        shouldDirty: false,
      });
      const isValidStep = await trigger(fieldsToValidate);
      if (!isValidStep) {
        toast.push(
          <Notification title="Validation Error" type="danger">
            Please correct errors before proceeding.
          </Notification>
        );
        return;
      }
    }
    setCurrentWizardStep((prev) => Math.min(prev + 1, 4));
  }, [currentWizardStep, trigger, setValue, editingItem]);

  const prevStep = useCallback(
    () => setCurrentWizardStep((prev) => Math.max(prev - 1, 1)),
    []
  );

  const openCreateDrawer = useCallback(
    (itemToEdit?: EmailCampaignItem) => {
      setCurrentWizardStep(1);
      setEditingItem(itemToEdit || null);
      const isFileSource =
        itemToEdit?.recipient_source?.some((s) => s.startsWith("file:")) ||
        false;

      const initialValues: CampaignCreationFormData = {
        template_id: itemToEdit
          ? String(itemToEdit.template_id)
          : mailTemplateOptions[0]?.value || "",
        campaign_name: itemToEdit
          ? itemToEdit.campaign_name ||
          itemToEdit.mail_template?.name ||
          `Campaign ${itemToEdit.id}`
          : "",
        text_block_1: itemToEdit?.header_text || "",
        img_1:
          productOptions.find(
            (p) => p.value === String(itemToEdit?.img_ids?.[0])
          ) || null,
        img_2:
          productOptions.find(
            (p) => p.value === String(itemToEdit?.img_ids?.[1])
          ) || null,
        img_3:
          productOptions.find(
            (p) => p.value === String(itemToEdit?.img_ids?.[2])
          ) || null,
        img_4:
          productOptions.find(
            (p) => p.value === String(itemToEdit?.img_ids?.[3])
          ) || null,
        img_5:
          productOptions.find(
            (p) => p.value === String(itemToEdit?.img_ids?.[4])
          ) || null,
        img_6:
          productOptions.find(
            (p) => p.value === String(itemToEdit?.img_ids?.[5])
          ) || null,
        text_final: itemToEdit?.text_final || "",
        text_block_2: itemToEdit?.text_block_2 || "",
        text_with_whatsapp_link: itemToEdit?.text_with_whatsapp_link || "",
        whatsapp_number_to_link: itemToEdit?.whatsapp_number_to_link || "",
        recipient_source_mode: isFileSource ? "import_file" : "select_from_db",
        recipient_db_filters: undefined, // Will be populated from modal
        recipient_imported_file: null,
        status: itemToEdit
          ? itemToEdit.status === ""
            ? "active"
            : "inactive"
          : "active",
        sendOption: itemToEdit?.schedule_at ? "schedule" : "now",
        scheduledAt: itemToEdit?.schedule_at
          ? new Date(itemToEdit.schedule_at)
          : null,
        __editingItem: itemToEdit || null,
      };
      reset(initialValues);
      setIsCreateDrawerOpen(true);
    },
    [reset, mailTemplateOptions, productOptions]
  );

  const closeCreateDrawer = useCallback(() => {
    setIsCreateDrawerOpen(false);
    setEditingItem(null);
  }, []);

  const onCampaignFormSubmit = useCallback(
    async (data: CampaignCreationFormData) => {
      setIsSubmittingCampaign(true);

      let recipientFileForApi: File | null = null;
      let recipientDbFiltersForApi: RecipientFilterFormData | null = null;

      if (
        data.recipient_source_mode === "import_file" &&
        data.recipient_imported_file
      ) {
        recipientFileForApi = data.recipient_imported_file;
      } else if (
        data.recipient_source_mode === "select_from_db" &&
        data.recipient_db_filters
      ) {
        recipientDbFiltersForApi = data.recipient_db_filters;
      }

      const imagesForApi: string[] = [];
      const productIdsForApi: (string | number)[] = [];
      (
        [
          "img_1",
          "img_2",
          "img_3",
          "img_4",
          "img_5",
          "img_6",
        ] as ProductFieldName[]
      ).forEach((key) => {
        const selectedProduct = data[key];
        if (selectedProduct?.value) {
          productIdsForApi.push(selectedProduct.value);
          const fullProductOption = productOptions.find(
            (p) => p.value === selectedProduct.value
          );
          if (fullProductOption?.imageUrl) {
            imagesForApi.push(fullProductOption.imageUrl);
          }
        }
      });

      const apiPayload: any = {
        template_id: data.template_id,
        campaign_name: data.campaign_name,
        status: data.status === "active" ? "" : "Inactive",
        header_text: data.text_block_1 || null,
        images: imagesForApi.length > 0 ? imagesForApi : null,
        img_ids: productIdsForApi.length > 0 ? productIdsForApi : null, // Send product IDs
        text_final: data.text_final || null,
        text_block_2: data.text_block_2 || null,
        text_with_whatsapp_link: data.text_with_whatsapp_link || null,
        whatsapp_number_to_link: data.whatsapp_number_to_link || null,
        ...(data.sendOption === "schedule" &&
          data.scheduledAt && { schedule_at: data.scheduledAt.toISOString() }),
      };

      let finalPayloadToSend: any = apiPayload;
      if (recipientFileForApi) {
        const formData = new FormData();
        Object.entries(apiPayload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((item) =>
                formData.append(`${key}[]`, String(item))
              );
            } else {
              formData.append(key, String(value));
            }
          }
        });
        formData.append("recipient_file", recipientFileForApi);
        finalPayloadToSend = formData;
      } else if (recipientDbFiltersForApi) {
        // API should expect a JSON object for filters
        finalPayloadToSend.recipient_filters = recipientDbFiltersForApi;
      } else {
        // No recipients selected, might be a draft. API should handle this.
        finalPayloadToSend.recipient_source = null;
      }

      try {
        if (editingItem) {
          await dispatch(
            editEmailCampaignAction({
              id: editingItem.id,
              ...finalPayloadToSend,
            })
          ).unwrap();
          toast.push(<Notification title="Campaign Updated" type="success" />);
        } else {
          await dispatch(addEmailCampaignAction(finalPayloadToSend)).unwrap();
          toast.push(<Notification title="Campaign Created" type="success" />);
        }
        closeCreateDrawer();
        dispatch(getEmailCampaignsAction({ params: tableData }));
      } catch (e: any) {
        console.error("Campaign Submission Error:", e);
        const errorMessage =
          e?.response?.data?.message ||
          e?.message ||
          "Could not process campaign.";
        toast.push(
          <Notification title="Operation Failed" type="danger">
            {errorMessage}
          </Notification>
        );
      } finally {
        setIsSubmittingCampaign(false);
      }
    },
    [dispatch, editingItem, closeCreateDrawer, tableData, productOptions]
  );

  const openViewDialog = useCallback(
    (item: EmailCampaignItem) => setViewingItem(item),
    []
  );
  const closeViewDialog = useCallback(() => setViewingItem(null), []);
  const handleDeleteClick = useCallback((item: EmailCampaignItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deleteEmailCampaignAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification title="Campaign Deleted" type="success">{`Campaign "${itemToDelete.campaign_name ||
          itemToDelete.mail_template?.name ||
          itemToDelete.id
          }" deleted.`}</Notification>
      );
      dispatch(getEmailCampaignsAction({ params: tableData }));
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {(e as Error).message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete, tableData]);
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectPageSizeChange = useCallback((value: number) => {
    setTableData((prev) => ({
      ...prev,
      pageSize: Number(value),
      pageIndex: 1,
    }));
  }, []);
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onFilterFormSubmit = useCallback(
    (data: CampaignFilterFormData) => {
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [closeFilterDrawer, handleSetTableData]
  );
  const onClearFilters = useCallback(() => {
    setFilterCriteria({});
    filterFormMethods.reset({ status: "", date_range: [null, null] });
    handleSetTableData({ pageIndex: 1, query: "" });
    closeFilterDrawer();
  }, [filterFormMethods, handleSetTableData, closeFilterDrawer]);

  const handleCardClick = useCallback((status?: string) => {
    onClearFilters(); // Always clear previous filters
    if (status) {
      setFilterCriteria({ status });
    }
    // If no status is passed (for 'Total' card), filters are just cleared.
  }, [onClearFilters]);

  const handleRemoveFilter = useCallback((key: keyof CampaignFilterFormData) => {
    setFilterCriteria(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  }, []);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: EmailCampaignItem[] = Array.isArray(
      emailCampaignsData.data
    )
      ? emailCampaignsData.data.map((item) => ({
        ...item,
        campaignNameDisplay:
          item.campaign_name ||
          item.mail_template?.name ||
          `Campaign ${item.id}`,
        dateTimeDisplay: new Date(item.created_at),
      }))
      : [];
    let processedData = cloneDeep(sourceData);
    if (tableData.query) {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (c) =>
          String(c.id).toLowerCase().includes(q) ||
          (c.campaign_name && c.campaign_name.toLowerCase().includes(q)) ||
          (c.mail_template?.name &&
            c.mail_template.name.toLowerCase().includes(q)) ||
          String(c.status).toLowerCase().includes(q)
      );
    }
    if (filterCriteria.status) {
      processedData = processedData.filter(
        (c) => c.status === filterCriteria.status
      );
    }
    if (
      filterCriteria.date_range &&
      (filterCriteria.date_range[0] || filterCriteria.date_range[1])
    ) {
      const [startDate, endDate] = filterCriteria.date_range;
      processedData = processedData.filter((c) => {
        const itemDate = new Date(c.created_at);
        let passes = true;
        if (
          startDate &&
          itemDate < new Date(new Date(startDate).setHours(0, 0, 0, 0))
        )
          passes = false;
        if (
          endDate &&
          itemDate > new Date(new Date(endDate).setHours(23, 59, 59, 999))
        )
          passes = false;
        return passes;
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = a[key as keyof EmailCampaignItem];
        let bVal: any = b[key as keyof EmailCampaignItem];
        if (key === "campaignNameDisplay") {
          aVal = a.campaignNameDisplay;
          bVal = b.campaignNameDisplay;
        } else if (key === "dateTimeDisplay") {
          aVal = a.dateTimeDisplay?.getTime();
          bVal = b.dateTimeDisplay?.getTime();
          return order === "asc"
            ? (aVal || 0) - (bVal || 0)
            : (bVal || 0) - (aVal || 0);
        } else if (key === "campaign_name") {
          aVal = a.campaign_name || "";
          bVal = b.campaign_name || "";
        } else if (key === "mail_template.name") {
          aVal = a.mail_template?.name || "";
          bVal = b.mail_template?.name || "";
        }
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
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
  }, [emailCampaignsData.data, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.status) count++;
    if (filterCriteria.date_range && (filterCriteria.date_range[0] || filterCriteria.date_range[1])) count++;
    return count;
  }, [filterCriteria]);


  const handleOpenExportReasonModal = useCallback(() => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Email Campaigns";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `email_campaigns_export_${timestamp}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      const exportSuccess = exportCampaignsToCsv(
        fileName,
        allFilteredAndSortedData
      );
      if (exportSuccess) {
        toast.push(
          <Notification title="Export Successful" type="success">
            Data exported to {fileName}.
          </Notification>
        );
      } else if (allFilteredAndSortedData?.length > 0) {
        toast.push(
          <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
          </Notification>
        );
      }
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Submit Reason" type="danger">
          {error.message || "Could not submit export reason."}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const columns: ColumnDef<EmailCampaignItem>[] = useMemo(
    () => [
      {
        header: "Campaign Name",
        accessorKey: "campaign_name",
        size: 220,
        enableSorting: true,
        cell: (props) =>
          props.row.original.campaign_name || (
            <span className="italic text-gray-400">N/A</span>
          ),
      },
      {
        header: "Template",
        accessorKey: "mail_template.name",
        size: 200,
        enableSorting: true,
        cell: (props) =>
          props.row.original.mail_template?.name ||
          `ID: ${props.row.original.template_id}`,
      },
      {
        header: "Date & Time",
        accessorKey: "dateTimeDisplay",
        size: 180,
        enableSorting: true,
        cell: (props) => {
          const d = props.getValue<Date>();
          return d ? (
            <span className="text-xs">
              {dayjs(d).format("DD MMM YYYY, hh:mm A")}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        header: "Scheduled For",
        accessorKey: "schedule_at",
        size: 200,
        enableSorting: true,
        cell: (props) => {
          const d = props.getValue<string>();
          return d ? (
            <span className="text-xs">
              {dayjs(d).format("DD MMM YYYY, hh:mm A")}
            </span>
          ) : (
            <span className="italic text-gray-400">Not Scheduled</span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 100,
        cell: (props) => {
          const s = props.getValue<CampaignApiStatus>();
          const statusLabel =
            CAMPAIGN_STATUS_OPTIONS_FILTER.find((opt) => opt.value === s)
              ?.label || (s === null ? "Draft" : String(s || "N/A"));
          return (
            <Tag
              className={classNames(
                "capitalize whitespace-nowrap",
                campaignDisplayStatusColor[String(s)] ||
                campaignDisplayStatusColor.default
              )}
            >
              {statusLabel}
            </Tag>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        size: 120,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onViewDetails={() => openViewDialog(props.row.original)}
            onEdit={() => openCreateDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [openViewDialog, openCreateDrawer, handleDeleteClick]
  );

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<EmailCampaignItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const renderWizardStep = () => {
    switch (currentWizardStep) {
      case 1:
        return (
          <Card
            header={
              <div className="flex items-center gap-2 font-semibold">
                <TbTemplate /> Step 1: Template & Name
              </div>
            }
            bodyClass="p-4 md:p-6"
          >
            <FormItem
              label={
                <div>
                  Mail Template<span className="text-red-500"> * </span>
                </div>
              }
              invalid={!!errors.template_id}
              errorMessage={errors.template_id?.message}
            >
              <Controller
                name="template_id"
                control={control}
                render={({ field }) => (
                  <Select
                    placeholder="Select a template..."
                    options={mailTemplateOptions}
                    value={mailTemplateOptions.find(
                      (o) => o.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Campaign Name (Internal Tracking)"
              className="mt-4"
              invalid={!!errors.campaign_name}
              errorMessage={errors.campaign_name?.message}
            >
              <Controller
                name="campaign_name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<TbClipboardText />}
                    placeholder="e.g., Q4 Holiday Promo"
                  />
                )}
              />
            </FormItem>
          </Card>
        );
      case 2:
        const currentTemplateId = watch("template_id");
        const selectedTemplateOption = mailTemplateOptions.find(
          (opt) => opt.value === currentTemplateId
        );
        let numberOfImagesToRender = 0;
        if (selectedTemplateOption?.label) {
          const match = selectedTemplateOption.label.match(/^img\s*(\d+)$/i);
          if (match?.[1]) {
            numberOfImagesToRender = Math.min(
              Math.max(0, parseInt(match[1], 10)),
              6
            );
          }
        }

        return (
          <Card
            header={
              <div className="flex items-center gap-2 font-semibold">
                <TbForms /> Step 2: Customize Content
              </div>
            }
            bodyClass="p-4 md:p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormItem
                label="Header Text (text 1)"
                className="md:col-span-2"
                invalid={!!errors.text_block_1}
                errorMessage={errors.text_block_1?.message}
              >
                <Controller
                  name="text_block_1"
                  control={control}
                  render={({ field }) => (
                    <Input
                      textArea
                      {...field}
                      rows={3}
                      placeholder="Main heading or introductory text..."
                    />
                  )}
                />
              </FormItem>

              {numberOfImagesToRender > 0 &&
                Array.from({ length: numberOfImagesToRender }).map(
                  (_, index) => {
                    const productNumber = index + 1;
                    const fieldName =
                      `img_${productNumber}` as ProductFieldName;
                    return (
                      <FormItem
                        key={fieldName}
                        label={`Product for Image ${productNumber}`}
                        invalid={
                          !!(errors as FieldErrors<CampaignCreationFormData>)[
                          fieldName
                          ]
                        }
                        errorMessage={
                          (errors as FieldErrors<CampaignCreationFormData>)[
                            fieldName
                          ]?.message as string | undefined
                        }
                      >
                        <Controller
                          name={fieldName}
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              placeholder={`Select product...`}
                              options={productOptions}
                              isClearable
                              prefix={<TbShoppingCart />}
                            />
                          )}
                        />
                      </FormItem>
                    );
                  }
                )}

              <hr className="md:col-span-2 my-2" />
              <FormItem
                label="Text Block 2 (Optional)"
                className="md:col-span-2"
                invalid={!!errors.text_block_2}
                errorMessage={errors.text_block_2?.message}
              >
                <Controller
                  name="text_block_2"
                  control={control}
                  render={({ field }) => (
                    <Input
                      textArea
                      {...field}
                      rows={2}
                      placeholder="Additional text block..."
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="WhatsApp Number"
                className="md:col-span-1"
                invalid={!!errors.whatsapp_number_to_link}
                errorMessage={errors.whatsapp_number_to_link?.message}
              >
                <Controller
                  name="whatsapp_number_to_link"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="tel"
                      prefix={<TbPhone />}
                      placeholder="+1234567890"
                    />
                  )}
                />
              </FormItem>
            </div>
          </Card>
        );
      case 3:
        return (
          <Card
            header={
              <div className="flex items-center gap-2 font-semibold">
                <TbUsersGroup /> Step 3: Choose Recipients
              </div>
            }
            bodyClass="p-4 md:p-6"
          >
            <FormItem
              label="Recipient Source"
              className="mb-6"
              invalid={!!errors.recipient_source_mode}
              errorMessage={errors.recipient_source_mode?.message}
            >
              <Controller
                name="recipient_source_mode"
                control={control}
                render={({ field }) => (
                  <Radio.Group
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      if (val === "select_from_db") {
                        setValue("recipient_imported_file", null);
                      }
                      if (val === "import_file") {
                        setValue("recipient_db_filters", undefined);
                      }
                      trigger("recipient_source_mode");
                    }}
                  >
                    <Radio value="select_from_db">Select From Database</Radio>
                    <Radio value="import_file">Import from File</Radio>
                  </Radio.Group>
                )}
              />
            </FormItem>

            {watch("recipient_source_mode") === "select_from_db" && (
              <FormItem
                label="Database Filters"
                invalid={!!errors.recipient_db_filters}
                errorMessage={errors.recipient_db_filters?.message as string}
              >
                <div className="flex flex-col items-start gap-3">
                  <Button
                    variant="solid"
                    type="button"
                    icon={<TbDatabaseSearch />}
                    onClick={() => setIsRecipientFilterModalOpen(true)}
                  >
                    Open Member Filters
                  </Button>
                  {watch("recipient_db_filters") && (
                    <div className="p-3 text-xs w-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-100 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                      <div className="flex justify-between items-center">
                        <span>
                          Database filters have been applied. The backend will
                          generate the recipient list upon sending.
                        </span>
                        <Button
                          size="xs"
                          variant="plain"
                          className="text-gray-600 hover:text-red-500"
                          onClick={() => {
                            setValue("recipient_db_filters", undefined, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </FormItem>
            )}

            {watch("recipient_source_mode") === "import_file" && (
              <FormItem
                label="Upload File"
                invalid={!!errors.recipient_imported_file}
                errorMessage={errors.recipient_imported_file?.message as string}
              >
                <Controller
                  name="recipient_imported_file"
                  control={control}
                  render={({ field: { onChange, ...rest } }) => (
                    <Input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      {...rest}
                      onChange={(e) => onChange(e.target.files?.[0] || null)}
                      prefix={<TbFileImport />}
                    />
                  )}
                />
                {editingItem && !watch("recipient_imported_file") && (
                  <p className="text-xs text-gray-500 mt-1">
                    To change recipients, upload a new file.
                  </p>
                )}
              </FormItem>
            )}
          </Card>
        );
      case 4:
        const formData = getValues();
        return (
          <Card
            header={
              <div className="flex items-center gap-2 font-semibold">
                <TbCircleCheck /> Step 4: Review & Schedule/Send
              </div>
            }
            bodyClass="p-4 md:p-6"
          >
            <FormItem
              label="Set Status for this Campaign"
              invalid={!!errors.status}
              errorMessage={errors.status?.message}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    placeholder="Select campaign status"
                    options={CAMPAIGN_STATUS_OPTIONS_FORM}
                    value={CAMPAIGN_STATUS_OPTIONS_FORM.find(
                      (o) => o.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    prefix={<TbToggleRight />}
                  />
                )}
              />
            </FormItem>
            <div className="space-y-2 my-6 text-sm border-t border-b py-4 dark:border-gray-600">
              <h6 className="font-semibold text-base mb-2">
                Campaign Summary:
              </h6>
              <p>
                <strong>Campaign Name:</strong>{" "}
                {formData.campaign_name || (
                  <span className="italic text-gray-500">Not Set</span>
                )}
              </p>
              <p>
                <strong>Template:</strong>{" "}
                {mailTemplateOptions.find(
                  (t) => t.value === formData.template_id
                )?.label || (
                    <span className="italic text-gray-500">Not Set</span>
                  )}
              </p>
              <p>
                <strong>Recipients:</strong>{" "}
                {formData.recipient_source_mode === "select_from_db" ? (
                  <span className="text-emerald-700 font-semibold">
                    Selected from Database via Filters
                  </span>
                ) : formData.recipient_imported_file ? (
                  `File: ${formData.recipient_imported_file.name}`
                ) : editingItem &&
                  formData.recipient_source_mode === "import_file" ? (
                  <span className="italic text-gray-500">
                    Using previously associated file
                  </span>
                ) : (
                  <span className="italic text-gray-500">No file selected</span>
                )}
              </p>
            </div>
            <FormItem
              label="Send Options"
              className="mb-4"
              invalid={!!errors.sendOption}
              errorMessage={errors.sendOption?.message}
            >
              <Controller
                name="sendOption"
                control={control}
                render={({ field }) => (
                  <Radio.Group
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      if (val === "now")
                        setValue("scheduledAt", null, { shouldValidate: true });
                    }}
                  >
                    <Radio value="now">Send Now</Radio>
                    <Radio value="schedule">Schedule for Later</Radio>
                  </Radio.Group>
                )}
              />
            </FormItem>
            {watch("sendOption") === "schedule" && (
              <FormItem
                label="Schedule Date & Time"
                invalid={!!errors.scheduledAt}
                errorMessage={errors.scheduledAt?.message as string}
              >
                <Controller
                  name="scheduledAt"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      placeholder="Select date and time"
                      showTimeSelect
                      inputPrefix={<TbCalendarStats />}
                      minDate={new Date()}
                    />
                  )}
                />
              </FormItem>
            )}
          </Card>
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  const cardClass = "rounded-md transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-3";

  const renderCardContent = (content: number | undefined) => {
    if (initialLoading) {
      return <Skeleton width={40} height={20} />;
    }
    return <h6 className="font-bold">{content ?? 0}</h6>;
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Email Campaigns</h5>
            <Button
              menuName="email_campaign" isAdd={true}
              variant="solid"
              icon={<TbPlus />}
              onClick={() => openCreateDrawer()}
              disabled={!isDataReady}
            >
              Create New Campaign
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-4">
            <Tooltip title="Click to show all campaigns">
              <div onClick={() => handleCardClick()} className={cardClass}>
                <Card bodyClass={cardBodyClass} className="border-blue-200 w-full">
                  <div className="h-12 w-12  flex items-center justify-center bg-blue-100 text-blue-500">
                    <TbCaravan size={24} />
                  </div>
                  <div>
                    <div className="text-blue-500">{renderCardContent(emailCampaignsData?.counts?.total)}</div>
                    <span className="font-semibold text-xs">Total</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Total subscribers (not filterable)">
              <div className={classNames(cardClass, "cursor-default")}>
                <Card bodyClass={cardBodyClass} className="border-orange-200 w-full">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                    <TbCalendarUser size={24} />
                  </div>
                  <div>
                    <div className="text-orange-500">{renderCardContent(emailCampaignsData?.counts?.subscriber)}</div>
                    <span className="font-semibold text-xs">Subscribers</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show draft campaigns">
              <div onClick={() => handleCardClick('draft')} className={cardClass}>
                <Card bodyClass={cardBodyClass} className="border-violet-200 w-full">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                    <TbPencilCheck size={24} />
                  </div>
                  <div>
                    <div className="text-violet-500">{renderCardContent(emailCampaignsData?.counts?.draft)}</div>
                    <span className="font-semibold text-xs">Draft</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show scheduled campaigns">
              <div onClick={() => handleCardClick('scheduled')} className={cardClass}>
                <Card bodyClass={cardBodyClass} className="border-pink-200 w-full">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                    <TbCalendarClock size={24} />
                  </div>
                  <div>
                    <div className="text-pink-500">{renderCardContent(emailCampaignsData?.counts?.scheduled)}</div>
                    <span className="font-semibold text-xs">Scheduled</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show sent campaigns">
              <div onClick={() => handleCardClick('sent')} className={cardClass}>
                <Card bodyClass={cardBodyClass} className="border-green-200 w-full">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                    <TbMailForward size={24} />
                  </div>
                  <div>
                    <div className="text-green-500">{renderCardContent(emailCampaignsData?.counts?.sent)}</div>
                    <span className="font-semibold text-xs">Sent</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show cancelled campaigns">
              <div onClick={() => handleCardClick('cancelled')} className={cardClass}>
                <Card bodyClass={cardBodyClass} className="border-red-200 w-full">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                    <TbCalendarCancel size={24} />
                  </div>
                  <div>
                    <div className="text-red-500">{renderCardContent(emailCampaignsData?.counts?.cancelled)}</div>
                    <span className="font-semibold text-xs">Cancelled</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
          </div>
          <div className="mb-4">
            <EmailCampaignTableTools
              onClearFilters={onClearFilters}
              onSearchChange={handleSearchChange}
              onFilter={openFilterDrawer}
              onExport={handleOpenExportReasonModal}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
              isDataReady={isDataReady}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} allStatusOptions={CAMPAIGN_STATUS_OPTIONS_FILTER} />
          <div className="mt-4">
            <EmailCampaignsTable
              columns={filteredColumns}
              data={pageData}
              loading={tableLoading}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectPageSizeChange}
              onSort={handleSort}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <Drawer
        title={`${editingItem ? "Edit" : "Create"
          } Email Campaign - Step ${currentWizardStep} of 4`}
        isOpen={isCreateDrawerOpen}
        onClose={closeCreateDrawer}
        onRequestClose={closeCreateDrawer}
        width={800}
        footer={
          <div className="flex justify-between w-full dark:border-gray-700 border-t pt-4 mt-4">
            <div>
              {" "}
              {currentWizardStep > 1 && (
                <Button
                  onClick={prevStep}
                  disabled={isSubmittingCampaign}
                  icon={<TbPlayerTrackPrev />}
                >
                  Back
                </Button>
              )}{" "}
            </div>{" "}
            <div className="flex gap-2">
              {" "}
              {currentWizardStep < 4 && (
                <Button
                  variant="solid"
                  onClick={nextStep}
                  disabled={isSubmittingCampaign}
                  icon={<TbPlayerTrackNext />}
                >
                  Next
                </Button>
              )}{" "}
              {currentWizardStep === 4 && (
                <>
                  {" "}
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeCreateDrawer();
                      toast.push(
                        <Notification title="Info">
                          Campaign Saved as Draft (Simulated).
                        </Notification>
                      );
                    }}
                    disabled={isSubmittingCampaign}
                  >
                    Save as Draft
                  </Button>{" "}
                  <Button
                    variant="solid"
                    color={
                      watch("sendOption") === "schedule" ? "blue" : "emerald"
                    }
                    form="campaignCreationForm"
                    type="submit"
                    loading={isSubmittingCampaign}
                    disabled={!formIsValid || isSubmittingCampaign}
                    icon={<TbSend />}
                  >
                    {watch("sendOption") === "schedule"
                      ? "Schedule Campaign"
                      : "Send Campaign Now"}
                  </Button>{" "}
                </>
              )}{" "}
            </div>{" "}
          </div>
        }
      >
        <Form
          id="campaignCreationForm"
          onSubmit={handleSubmit(onCampaignFormSubmit)}
          className="flex flex-col"
        >
          {renderWizardStep()}
        </Form>
      </Drawer>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={400}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-1"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="campaignFilterForm"
              type="submit"
            >
              Apply
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="campaignFilterForm"
          onSubmit={filterFormMethods.handleSubmit(onFilterFormSubmit)}
          className="flex flex-col gap-y-6 p-1"
        >
          <FormItem
            label="Status"
            invalid={!!filterFormMethods.formState.errors.status}
            errorMessage={filterFormMethods.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select status..."
                  options={CAMPAIGN_STATUS_OPTIONS_FILTER}
                  value={
                    CAMPAIGN_STATUS_OPTIONS_FILTER.find(
                      (o) => o.value === field.value
                    ) || null
                  }
                  onChange={(opt) => field.onChange(opt?.value ?? "")}
                  isClearable
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Creation Date Range"
            invalid={!!filterFormMethods.formState.errors.date_range}
            errorMessage={
              filterFormMethods.formState.errors.date_range?.message as
              | string
              | undefined
            }
          >
            <Controller
              name="date_range"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker
                  value={
                    (field.value as [Date | null, Date | null]) ?? [null, null]
                  }
                  onChange={(dates) => field.onChange(dates ?? [null, null])}
                  placeholder={["Start Date", "End Date"]}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <Dialog
        isOpen={!!viewingItem}
        onClose={closeViewDialog}
        onRequestClose={closeViewDialog}
        width={700}
        bodyOpenClassName="overflow-hidden"
      >
        <h5 className="mb-4">Campaign Details: {viewingItem?.campaign_name}</h5>
        {viewingItem && (
          <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-2">
            <p>
              <strong>ID:</strong> {viewingItem.id}
            </p>
            <p>
              <strong>Campaign Name:</strong>{" "}
              {viewingItem.campaign_name || (
                <span className="italic">Not set</span>
              )}
            </p>
            <p>
              <strong>Template Used:</strong> {viewingItem.mail_template?.name}{" "}
              (ID: {viewingItem.template_id})
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {CAMPAIGN_STATUS_OPTIONS_FILTER.find(
                (opt) => opt.value === viewingItem.status
              )?.label ||
                (viewingItem.status === null
                  ? "Draft"
                  : String(viewingItem.status || "N/A"))}
            </p>
            {viewingItem.schedule_at && (
              <p>
                <strong>Scheduled At:</strong>{" "}
                {new Date(viewingItem.schedule_at).toLocaleString()}
              </p>
            )}
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(viewingItem.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Updated At:</strong>{" "}
              {new Date(viewingItem.updated_at).toLocaleString()}
            </p>
            {viewingItem.header_text && (
              <p>
                <strong>Header Text:</strong> {viewingItem.header_text}
              </p>
            )}
            {viewingItem.images && viewingItem.images.length > 0 && (
              <div>
                <strong>Images:</strong>
                {viewingItem.images.map((imgUrl, idx) => (
                  <p key={idx} className="ml-2">
                    Image {idx + 1} URL:{" "}
                    <span className="break-all">{imgUrl}</span>
                  </p>
                ))}
              </div>
            )}
            {viewingItem.recipient_source &&
              viewingItem.recipient_source.length > 0 && (
                <div>
                  <strong>Recipients:</strong>{" "}
                  <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap break-all">
                    {viewingItem.recipient_source.join(", ")}
                  </pre>
                </div>
              )}
          </div>
        )}
        <div className="text-right mt-6">
          <Button variant="solid" onClick={closeViewDialog}>
            Close
          </Button>
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Email Campaign"
        onClose={() => setSingleDeleteConfirmOpen(false)}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
        onCancel={() => setSingleDeleteConfirmOpen(false)}
        onRequestClose={() => setSingleDeleteConfirmOpen(false)}
      >
        <p>
          Are you sure you want to delete the campaign "
          <strong>{itemToDelete?.campaign_name || itemToDelete?.id}</strong>"?
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  placeholder="Enter reason..."
                  rows={3}
                />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
      <RecipientFilterModal
        isOpen={isRecipientFilterModalOpen}
        onClose={() => setIsRecipientFilterModalOpen(false)}
        initialFilters={
          getValues("recipient_db_filters") || null
        }
        onApply={(data) => {
          setValue("recipient_db_filters", data, { shouldValidate: true });
        }}
      />
    </>
  );
};

export default EmailCampaignListing;