// src/views/members/MemberFormPage.tsx

import { useAppDispatch } from "@/reduxtool/store";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import cloneDeep from "lodash/cloneDeep";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { shallowEqual, useSelector } from "react-redux";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Card,
  Dialog,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Radio,
  Tag,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Notification from "@/components/ui/Notification";
import Select from "@/components/ui/Select";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { HiPlus } from "react-icons/hi";
import {
  TbBell,
  TbBrandWhatsapp,
  TbBuilding,
  TbCalendarClock,
  TbChecks,
  TbClipboardText,
  TbEye,
  TbMail,
  TbMailShare,
  TbMessageDots,
  TbPaperclip,
  TbPencil,
  TbPhone,
  TbSearch,
  TbStar,
  TbTagStarred,
  TbToggleRight,
  TbTrash,
  TbUser,
  TbUserCircle
} from "react-icons/tb";

// Redux Actions & Selectors
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addMemberAction,
  addRequestFeedbackAction,
  deleteAllRequestFeedbacksAction,
  deleteRequestFeedbackAction,
  editMemberAction,
  editRequestFeedbackAction,
  getAllProductsAction,
  getBrandAction,
  getCategoriesAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction,
  getEmployeesAction,
  getMemberByIdAction,
  getMemberTypeAction,
  // Actions for the listing component
  getRequestFeedbacksAction
} from "@/reduxtool/master/middleware";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";

// --- Type Definitions (Main Member Form) ---
export interface MemberFormSchema {
  id?: string | number;
  role_type?: string | { label: string; value: string };
  name?: string;
  email?: string;
  password?: string;
  contact_country_code?: string | { label: string; value: string };
  mobile_no?: string;
  interested_category_ids?: Array<{ label: string; value: string }>;
  interested_subcategory_ids?: Array<{ label: string; value: string }>;
  favourite_brands?: Array<{ label: string; value: string }>;
  kyc_verified?: "Yes" | "No" | string | { label: string; value: string };
  permanent_id?: string;
  city?: string;
  state?: string;
  country_id?: string | { label: string; value: string };
  continent_id?: string | { label: string; value: string };
  customer_ids?: string;
  pincode?: string;
  status?: string | { label: string; value: string };
  company_name?: string | { label: string; value: string };
  company_name_temp?: string | { label: string; value: string };
  address?: string;
  company_description?: string | null;
  company_address?: string;
  whatsapp_number?: string;
  alternate_contact_country_code?: string | { label: string; value: string };
  alternate_contact_number?: string;
  landline_number?: string;
  fax_number?: string;
  alternate_email?: string;
  botim_id?: string;
  skype_id?: string;
  we_chat?: string;
  website?: string;
  business_type?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
  swift_code?: string;
  fssai_license?: string;
  drug_license?: string;
  iec_code?: string;
  iso_certificate?: string;
  other_trading_license?: string;
  usfda_license?: string;
  other_trading_license_2?: string;
  wall_enquiry_permission?: boolean | string;
  enquiry_permission?: boolean | string;
  interested_for?: string;
  customer_code_permanent?: string;
  product_upload_permission?: boolean | string;
  trade_inquiry_allowed?: string | { label: string; value: string };
  membership_plan_text?: string;
  upgrade_plan?: string | { label: string; value: string };
  request_description?: string;
  favourite_product_id?: Array<{ label: string; value: string }>;
  business_opportunity?: string | { label: string; value: string };
  member_grade?: string | { label: string; value: string };
  relationship_manager?: string | { label: string; value: string };
  remarks?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_handle?: string;
  is_blacklisted?: boolean;
  dealing_in_bulk?: string | { label: string; value: string };
  member_profiles?: {
    db_id?: number; // Add this to store the database ID of the profile
    member_type?: { label: string; value: string | number };
    brands?: Array<{ label: string; value: string | number }>;
    sub_categories?: Array<{ label: string; value: string | number }>;
    categories?: Array<{ label:string; value: string | number }>;
  }[];
}
export interface FormSectionBaseProps {
  control: Control<MemberFormSchema>;
  errors: FieldErrors<MemberFormSchema>;
  formMethods: UseFormReturn<MemberFormSchema>;
}
interface ApiSingleCustomerItem {
  id: number;
  role_type?: string;
  name?: string;
  email?: string;
  contact_country_code?: string;
  mobile_no?: string;
  interested_category_ids?: string;
  interested_subcategory_ids?: string;
  favourite_brands?: string;
  kyc_verified?: "Yes" | "No" | string;
  permanent_id?: string;
  city?: string;
  state?: string;
  country_id?: string;
  continent_id?: string;
  customer_ids?: string;
  pincode?: string;
  status?: string;
  company_name?: string;
  company_name_tmp?: string;
  company_description?: string | null;
  address?: string;
  company_address?: string;
  whatsapp_no?: string;
  office_no?: string;
  alt_mobile?: string;
  alt_email?: string;
  alternate_contact_country_code?: string;
  botim?: string;
  skype?: string;
  we_chat?: string;
  website?: string;
  business_type?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
  swift_code?: string;
  fssai_license?: string;
  drug_license?: string;
  iec_code?: string;
  iso_certificate?: string;
  other_trading_license?: string;
  usfda_license?: string;
  other_trading_license_2?: string;
  wall_enquiry_permission?: "0" | "1" | string;
  enquiry_permission?: "0" | "1" | string;
  interested_for?: string;
  customer_code_permanent?: string;
  product_upload_permission?: "0" | "1" | string;
  trade_inquiry_allowed?: string;
  membership_plan?: string;
  upgrade_your_plan?: string;
  request_feedback?: string;
  favourite_products?: string;
  business_opportunity?: string;
  member_grade?: string;
  relationship_manager?: string;
  remarks?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_profile?: string;
  created_by?: string;
  password?: string;
  reset_count?: number;
  is_blacklisted?: "0" | "1";
  dealing_in_bulk?: string;
}

// --- Type Definitions (Request & Feedback Listing) ---
export type SelectOption = { value: string; label: string };
export type RequestFeedbackApiStatus =
  | "unread"
  | "read"
  | "in_progress"
  | "resolved"
  | "closed"
  | string;
export type RequestFeedbackFormStatus =
  | "unread"
  | "read"
  | "in_progress"
  | "resolved"
  | "closed";
export type RequestFeedbackType =
  | "Feedback"
  | "Request"
  | "Complaint"
  | "Query"
  | string;
export type RequestFeedbackItem = {
  id: string | number;
  customer_id: string;
  name: string;
  email: string;
  mobile_no: string;
  company_name?: string | null;
  feedback_details: string;
  attachment?: string | null;
  type: RequestFeedbackType;
  status: RequestFeedbackApiStatus;
  created_at: string;
  updated_at: string;
  subject?: string | null;
  rating?: number | string | null;
  deleted_at?: string | null;
  icon_full_path?: File | string;
};

// --- Constants & Schemas (Request & Feedback Listing) ---
const TYPE_OPTIONS: SelectOption[] = [
  { value: "Feedback", label: "Feedback" },
  { value: "Request", label: "Request" },
  { value: "Complaint", label: "Complaint" },
  { value: "Query", label: "General Query" },
];
const typeValues = TYPE_OPTIONS.map((t) => t.value) as [string, ...string[]];
const STATUS_OPTIONS_FORM: {
  value: RequestFeedbackFormStatus;
  label: string;
}[] = [
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];
const statusFormValues = STATUS_OPTIONS_FORM.map((s) => s.value) as [
  RequestFeedbackFormStatus,
  ...RequestFeedbackFormStatus[]
];
const statusColors: Record<RequestFeedbackApiStatus, string> = {
  unread:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  read: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  in_progress:
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100",
  resolved: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100",
  closed:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};
const RATING_OPTIONS: SelectOption[] = [
  { value: "1", label: "1 Star (Poor)" },
  { value: "2", label: "2 Stars (Fair)" },
  { value: "3", label: "3 Stars (Average)" },
  { value: "4", label: "4 Stars (Good)" },
  { value: "5", label: "5 Stars (Excellent)" },
];
const ratingValues = RATING_OPTIONS.map((r) => r.value) as [
  string,
  ...string[]
];

const requestFeedbackFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z
    .string()
    .email("Invalid email address.")
    .min(1, "Email is required."),
  mobile_no: z.string().min(1, "Mobile number is required.").max(20),
  company_name: z.string().max(150).optional().or(z.literal("")),
  feedback_details: z
    .string()
    .min(10, "Details must be at least 10 characters.")
    .max(5000),
  type: z.enum(typeValues, {
    errorMap: () => ({ message: "Please select a type." }),
  }),
  status: z.enum(statusFormValues, {
    errorMap: () => ({ message: "Please select a status." }),
  }),
  subject: z.string().max(255).optional().or(z.literal("")),
  rating: z.enum(ratingValues).optional().nullable(),
  attachment: z.any().optional(),
});
type RequestFeedbackFormData = z.infer<typeof requestFeedbackFormSchema>;

const filterFormSchema = z.object({
  filterType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterRating: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Helper Functions ---
// In src/views/members/MemberFormPage.tsx

const transformApiToFormSchema = (
  formData: any // Use a more specific type reflecting the API response
): Partial<MemberFormSchema> => {
  console.log(formData, "API data for form transformation");

  const toSelectOption = (value: string | undefined | null) =>
    value ? { value: value, label: value } : undefined;

  const normalizeCountryCode = (code: string | undefined | null) =>
    code ? code.replace(/^\+\+/, "+") : undefined;

  const createCountryCodeOption = (code: string | undefined | null) => {
    const normalized = normalizeCountryCode(code);
    return normalized ? { value: normalized, label: normalized } : undefined;
  };

  return {
    // ... (all other personal/contact/etc. fields remain the same as before) ...
    id: formData.id,
    name: formData.name || "",
    email: formData.email || "",
    mobile_no: formData.number || "",
    contact_country_code: createCountryCodeOption(formData.number_code),
    company_name_temp: formData.company_temp || "",
    company_name: formData.company_actual || "",
    status: toSelectOption(formData.status),
    continent_id: formData.continent ? { value: String(formData.continent.id), label: formData.continent.name } : undefined,
    country_id: formData.country ? { value: String(formData.country.id), label: formData.country.name } : undefined,
    state: formData.state || "",
    city: formData.city || "",
    pincode: formData.pincode || "",
    address: formData.address || "",
    whatsapp_number: formData.whatsApp_no || "",
    alternate_contact_number: formData.alternate_contact_number || "",
    alternate_contact_country_code: createCountryCodeOption(formData.alternate_contact_number_code),
    landline_number: formData.landline_number || "",
    fax_number: formData.fax_number || "",
    alternate_email: formData.alternate_email || "",
    botim_id: formData.botim_id || "",
    skype_id: formData.skype_id || "",
    we_chat: formData.wechat_id || "",
    linkedin_profile: formData.linkedIn_profile || "",
    facebook_profile: formData.facebook_profile || "",
    instagram_handle: formData.instagram_handle || "",
    website: formData.website || "",
    business_opportunity: toSelectOption(formData.business_opportunity),
    business_type: toSelectOption(formData.business_type),
    favourite_product_id: formData.favourite_products_list?.map((p: any) => ({ value: String(p.id), label: p.name })) || [],
    interested_in: toSelectOption(formData.interested_in),
    member_grade: toSelectOption(formData.member_grade),
    relationship_manager: formData.relationship_manager ? { value: String(formData.relationship_manager.id), label: formData.relationship_manager.name } : undefined,
    dealing_in_bulk: formData.dealing_in_bulk || "No",
    remarks: formData.remarks || "",

    // --- START: CORRECTED DYNAMIC MEMBER PROFILE TRANSFORMATION ---
    member_profiles: formData.dynamic_member_profiles?.map((apiProfile: any) => {
      // Helper to parse stringified JSON and zip with names
      const createSelectOptions = (idJsonString: string, names: string[]) => {
        try {
          // Check if the input is a valid stringified array before parsing
          if (typeof idJsonString !== 'string' || !idJsonString.startsWith('[')) {
            return [];
          }
          const ids: (string | number)[] = JSON.parse(idJsonString);
          const safeNames = Array.isArray(names) ? names : [];
          
          if (!Array.isArray(ids) || ids.length !== safeNames.length) {
            return [];
          }

          return ids.map((id, index) => ({
            value: id,
            label: safeNames[index],
          }));
        } catch (e) {
          console.error("Failed to parse ID JSON string:", idJsonString, e);
          return [];
        }
      };
      
console.log("apiProfile.member_type",apiProfile.member_type.id);

      return {
        db_id: apiProfile.id, // Store the database ID for updates
        member_type: {value: apiProfile.member_type.id,label:  apiProfile.member_type.name},
        brands: createSelectOptions(apiProfile.brand_id, apiProfile.brand_names),
        categories: createSelectOptions(apiProfile.category_id, apiProfile.category_names),
        sub_categories: createSelectOptions(apiProfile.sub_category_id, apiProfile.sub_category_names),
      };
      
      
    }) || [],
    // --- END: CORRECTED DYNAMIC MEMBER PROFILE TRANSFORMATION ---

    product_upload_permission: formData.product_upload_permission === "1" || formData.product_upload_permission === true,
    wall_enquiry_permission: formData.wall_enquiry_permission === "1" || formData.wall_enquiry_permission === true,
    enquiry_permission: formData.enquiry_permission === "1" || formData.enquiry_permission === true,
    trade_inquiry_allowed: formData.trade_inquiry_allowed === "1" || formData.trade_inquiry_allowed === true,
    membership_plan_text: formData.membership_plan_current || "",
    upgrade_plan: toSelectOption(formData.upgrade_your_plan),
    is_blacklisted: formData.is_blacklisted === "1" || formData.is_blacklisted === true,
  };
};

// In src/views/members/MemberFormPage.tsx

const preparePayloadForApi = (
  formData: Partial<MemberFormSchema>,
  isEditMode: boolean
): any => {
  const getValue = (field: any) => (typeof field === 'object' && field !== null && 'value' in field ? field.value : field);

  const payload: any = {
    // ... (all other personal/contact/etc. fields remain the same as before) ...
    id: formData.id,
    name: formData.name || "",
    number: formData.mobile_no || "",
    number_code: getValue(formData.contact_country_code) || null,
    email: formData.email || "",
    company_temp: formData.company_name_temp || "",
    company_actual: formData.company_name || "",
    status: getValue(formData.status) || null,
    continent_id: getValue(formData.continent_id) || null,
    country_id: getValue(formData.country_id) || null,
    state: formData.state || "",
    city: formData.city || "",
    pincode: formData.pincode || "",
    address: formData.address || "",
    whatsApp_no: formData.whatsapp_number || "",
    alternate_contact_number: formData.alternate_contact_number || "",
    alternate_contact_number_code: getValue(formData.alternate_contact_country_code) || null,
    landline_number: formData.landline_number || "",
    fax_number: formData.fax_number || "",
    alternate_email: formData.alternate_email || "",
    botim_id: formData.botim_id || "",
    skype_id: formData.skype_id || "",
    wechat_id: formData.we_chat || "",
    linkedIn_profile: formData.linkedin_profile || "",
    facebook_profile: formData.facebook_profile || "",
    instagram_handle: formData.instagram_handle || "",
    website: formData.website || "",
    business_opportunity: getValue(formData.business_opportunity) || null,
    business_type: getValue(formData.business_type) || null,
    favourite_product_id: formData.favourite_product_id?.map(p => getValue(p)) || [],
    interested_in: getValue(formData.interested_in) || null,
    member_grade: getValue(formData.member_grade) || null,
    relationship_manager_id: getValue(formData.relationship_manager) || null,
    dealing_in_bulk: formData.dealing_in_bulk || "No",
    remarks: formData.remarks || "",
    product_upload_permission: formData.product_upload_permission ? "1" : "0",
    wall_enquiry_permission: formData.wall_enquiry_permission ? "1" : "0",
    enquiry_permission: formData.enquiry_permission ? "1" : "0",
    trade_inquiry_allowed: formData.trade_inquiry_allowed ? "1" : "0",
    membership_plan_current: formData.membership_plan_text || "",
    upgrade_your_plan: getValue(formData.upgrade_plan) || null,
    is_blacklisted: formData.is_blacklisted ? "1" : "0",
  };

  // --- START: CORRECTED DYNAMIC MEMBER PROFILE PAYLOAD PREPARATION ---
  if (formData.member_profiles) {
    payload.dynamic_member_profiles = formData.member_profiles.map(formProfile => {
      const apiProfile: any = {
        // Include the database ID if it exists (for updates)
        id: formProfile.db_id, 
        member_type_id: getValue(formProfile.member_type),
        brand_id: formProfile.brands?.map(b => getValue(b)) || [],
        category_id: formProfile.categories?.map(c => getValue(c)) || [],
        sub_category_id: formProfile.sub_categories?.map(sc => getValue(sc)) || [],
      };
      
      // The backend should ignore the 'id' field if it's undefined (for new profiles)
      if (apiProfile.id === undefined) {
        delete apiProfile.id;
      }

      return apiProfile;
    });
  }
  // --- END: CORRECTED DYNAMIC MEMBER PROFILE PAYLOAD PREPARATION ---

  if (!isEditMode && formData.password) {
    payload.password = formData.password;
  } else if (isEditMode && formData.password) {
    payload.password = formData.password;
  }

  return payload;
};

const CSV_HEADERS_RF = [
  "ID",
  "Name",
  "Email",
  "Mobile No",
  "Company",
  "Type",
  "Subject",
  "Details",
  "Rating",
  "Status",
  "Attachment",
  "Date",
];
const CSV_KEYS_RF: (keyof Pick<
  RequestFeedbackItem,
  | "id"
  | "name"
  | "email"
  | "mobile_no"
  | "company_name"
  | "type"
  | "subject"
  | "feedback_details"
  | "rating"
  | "status"
  | "attachment"
  | "created_at"
>)[] = [
    "id",
    "name",
    "email",
    "mobile_no",
    "company_name",
    "type",
    "subject",
    "feedback_details",
    "rating",
    "status",
    "attachment",
    "created_at",
  ];
function exportRequestFeedbacksToCsv(
  filename: string,
  rows: RequestFeedbackItem[]
) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row,
    type: TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type,
    status:
      STATUS_OPTIONS_FORM.find((s) => s.value === row.status)?.label ||
      row.status,
    rating:
      RATING_OPTIONS.find((r) => r.value === String(row.rating || ""))?.label ||
      (row.rating ? String(row.rating) : "N/A"),
    created_at: new Date(row.created_at).toLocaleDateString(),
  }));
  const separator = ",";
  const csvContent =
    CSV_HEADERS_RF.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_RF.map((k) => {
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
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- Sub-Components (Request & Feedback Listing) ---
const ItemActionColumn = ({
  onEdit,
  onViewDetail,
  onDelete,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
}) => (
  <div className="flex items-center justify-center gap-1">
    {" "}
    <Tooltip title="Edit">
      <div
        className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600"
        role="button"
        onClick={onEdit}
      >
        <TbPencil />
      </div>
    </Tooltip>{" "}
    <Tooltip title="View">
      <div
        className="text-xl cursor-pointer text-gray-500 hover:text-blue-600"
        role="button"
        onClick={onViewDetail}
      >
        <TbEye />
      </div>
    </Tooltip>{" "}
    <Dropdown
      renderTitle={
        <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
      }
    >
      {" "}
      <Dropdown.Item className="flex items-center gap-2">
        <TbUser size={18} /> <span className="text-xs">Assign to Task</span>
      </Dropdown.Item>{" "}
      <Dropdown.Item className="flex items-center gap-2">
        <TbMailShare size={18} /> <span className="text-xs">Send Email</span>
      </Dropdown.Item>{" "}
      <Dropdown.Item className="flex items-center gap-2">
        <TbBrandWhatsapp size={18} />{" "}
        <span className="text-xs">Send Whatsapp</span>
      </Dropdown.Item>{" "}
      <Dropdown.Item className="flex items-center gap-2">
        <TbTagStarred size={18} />{" "}
        <span className="text-xs">Add to Active </span>
      </Dropdown.Item>{" "}
      <Dropdown.Item className="flex items-center gap-2">
        <TbCalendarClock size={18} />{" "}
        <span className="text-xs">Add Schedule </span>
      </Dropdown.Item>{" "}
      <Dropdown.Item className="flex items-center gap-2">
        <TbBell size={18} /> <span className="text-xs">Add Notification </span>
      </Dropdown.Item>{" "}
    </Dropdown>{" "}
  </div>
);
const ItemSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <Input
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
ItemSearch.displayName = "ItemSearch";
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    {" "}
    {/* <div className="flex-grow">
      {" "}
      <ItemSearch onInputChange={onSearchChange} />{" "}
    </div>{" "}
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      {" "}
      <Tooltip title="Clear Filters">
        <Button
          icon={<TbReload />}
          onClick={onClearFilters}
          title="Clear Filters"
        ></Button>
      </Tooltip>{" "}
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>{" "}
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>{" "}
    </div>{" "} */}
  </div>
);
const RequestFeedbacksTable = ({
  columns,
  data,
  loading,
  pagingData,
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
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
    onCheckBoxChange={onRowSelect}
    onIndeterminateCheckBoxChange={onAllRowSelect}
  />
);
const RequestFeedbacksSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: {
  selectedItems: RequestFeedbackItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      {" "}
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        {" "}
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          {" "}
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>{" "}
            <span className="font-semibold">
              {" "}
              {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""}{" "}
              selected{" "}
            </span>{" "}
          </span>{" "}
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={() => setDeleteConfirmOpen(true)}
            loading={isDeleting}
          >
            Delete Selected
          </Button>{" "}
        </div>{" "}
      </StickyFooter>{" "}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Item(s)`}
        onClose={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteConfirmOpen(false);
        }}
      >
        {" "}
        <p>Are you sure you want to delete the selected item(s)?</p>{" "}
      </ConfirmDialog>{" "}
    </>
  );
};

// --- Request & Feedback Listing Component ---
const RequestAndFeedbackListing = () => {
  const dispatch = useAppDispatch();
  const { requestFeedbacksData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector, shallowEqual);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestFeedbackItem | null>(
    null
  );
  const [viewingItem, setViewingItem] = useState<RequestFeedbackItem | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<RequestFeedbackItem | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<RequestFeedbackItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] =
    useState(false);

  useEffect(() => {
    dispatch(getRequestFeedbacksAction());
  }, [dispatch]);

  const formMethods = useForm<RequestFeedbackFormData>({
    resolver: zodResolver(requestFeedbackFormSchema),
    mode: "onChange",
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = formMethods;
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    reset({
      name: "",
      email: "",
      mobile_no: "",
      company_name: "",
      feedback_details: "",
      type: TYPE_OPTIONS[0]?.value,
      status: STATUS_OPTIONS_FORM[0]?.value,
      subject: "",
      rating: null,
      attachment: undefined,
    });
    setSelectedFile(null);
    setRemoveExistingAttachment(false);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [reset]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback(
    (item: RequestFeedbackItem) => {
      setEditingItem(item);
      setSelectedFile(null);
      setRemoveExistingAttachment(false);
      reset({
        name: item.name,
        email: item.email,
        mobile_no: item.mobile_no,
        company_name: item.company_name || "",
        feedback_details: item.feedback_details,
        type: item.type,
        status: item.status as RequestFeedbackFormStatus,
        subject: item.subject || "",
        rating: item.rating ? String(item.rating) : null,
        attachment: undefined,
      });
      setIsEditDrawerOpen(true);
    },
    [reset]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);
  const openViewDialog = useCallback(
    (item: RequestFeedbackItem) => setViewingItem(item),
    []
  );
  const closeViewDialog = useCallback(() => setViewingItem(null), []);
  const handleDeleteClick = useCallback((item: RequestFeedbackItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deleteRequestFeedbackAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Entry Deleted"
          type="success"
        >{`Entry from "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getRequestFeedbacksAction());
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
  }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(
        deleteAllRequestFeedbacksAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
        >{`${idsToDelete.length} item(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {(e as Error).message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    filterFormMethods.reset({});
    setFilterCriteria({});
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);
  const handlePaginationChange = useCallback(
    (page: number) => setTableData((prev) => ({ ...prev, pageIndex: page })),
    []
  );
  const handleSelectPageSizeChange = useCallback((value: number) => {
    setTableData((prev) => ({
      ...prev,
      pageSize: Number(value),
      pageIndex: 1,
    }));
    setSelectedItems([]);
  }, []);
  const handleSort = useCallback((sort: OnSortParam) => {
    setTableData((prev) => ({ ...prev, sort: sort, pageIndex: 1 }));
  }, []);
  const handleSearchInputChange = useCallback((query: string) => {
    setTableData((prev) => ({ ...prev, query: query, pageIndex: 1 }));
  }, []);
  const handleRowSelect = useCallback(
    (checked: boolean, row: RequestFeedbackItem) => {
      setSelectedItems((prev) => {
        if (checked)
          return prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row];
        return prev.filter((item) => item.id !== row.id);
      });
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<RequestFeedbackItem>[]) => {
      const cPOR = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((pS) => {
          const pSIds = new Set(pS.map((i) => i.id));
          const nRTA = cPOR.filter((r) => !pSIds.has(r.id));
          return [...pS, ...nRTA];
        });
      } else {
        const cPRIds = new Set(cPOR.map((r) => r.id));
        setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id)));
      }
    },
    []
  );
  const itemPath = (filename: any) => {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
    return filename ? `${baseUrl}/storage/${filename}` : "#";
  };

  const onSubmitHandler = async (data: RequestFeedbackFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("mobile_no", data.mobile_no);
    if (data.company_name) formData.append("company_name", data.company_name);
    formData.append("feedback_details", data.feedback_details);
    formData.append("type", data.type);
    formData.append("status", data.status);
    if (data.subject) formData.append("subject", data.subject);
    if (data.rating) formData.append("rating", data.rating);
    if (editingItem) {
      formData.append("_method", "PUT");
      formData.append("customer_id", String(editingItem.customer_id));
      if (selectedFile instanceof File) {
        formData.append("attachment", selectedFile);
      } else if (removeExistingAttachment) {
        formData.append("delete_attachment", "true");
      }
    } else {
      formData.append("customer_id", "0");
      if (selectedFile instanceof File) {
        formData.append("attachment", selectedFile);
      }
    }
    try {
      if (editingItem) {
        await dispatch(
          editRequestFeedbackAction({ id: editingItem.id, formData })
        ).unwrap();
        toast.push(<Notification title="Entry Updated" type="success" />);
        closeEditDrawer();
      } else {
        await dispatch(addRequestFeedbackAction(formData)).unwrap();
        toast.push(<Notification title="Entry Added" type="success" />);
        closeAddDrawer();
      }
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        (editingItem ? "Update Failed" : "Add Failed");
      toast.push(
        <Notification
          title={editingItem ? "Update Failed" : "Add Failed"}
          type="danger"
        >
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
      setRemoveExistingAttachment(false);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: RequestFeedbackItem[] = cloneDeep(
      Array.isArray(requestFeedbacksData) ? requestFeedbacksData : []
    );
    if (filterCriteria.filterType?.length) {
      const v = filterCriteria.filterType.map((o) => o.value);
      processedData = processedData.filter((item) => v.includes(item.type));
    }
    if (filterCriteria.filterStatus?.length) {
      const v = filterCriteria.filterStatus.map((o) => o.value);
      processedData = processedData.filter((item) => v.includes(item.status));
    }
    if (filterCriteria.filterRating?.length) {
      const v = filterCriteria.filterRating.map((o) => o.value);
      processedData = processedData.filter((item) =>
        v.includes(String(item.rating || ""))
      );
    }
    if (tableData.query) {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.mobile_no.toLowerCase().includes(q) ||
          (item.company_name && item.company_name.toLowerCase().includes(q)) ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          item.feedback_details.toLowerCase().includes(q)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof RequestFeedbackItem];
        const bVal = b[key as keyof RequestFeedbackItem];
        if (key === "created_at" || key === "updated_at") {
          return order === "asc"
            ? new Date(aVal as string).getTime() -
            new Date(bVal as string).getTime()
            : new Date(bVal as string).getTime() -
            new Date(aVal as string).getTime();
        }
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: dataToExport,
    };
  }, [requestFeedbacksData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    exportRequestFeedbacksToCsv(
      "request_feedbacks.csv",
      allFilteredAndSortedData
    );
  }, [allFilteredAndSortedData]);
  const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(
    () => [
      {
        header: "User Info",
        accessorKey: "name",
        size: 150,
        cell: (props) => (
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">
              {props.getValue<string>() || "N/A"}
            </span>
            <span className="">{props.row.original.email || "N/A"}</span>
            <span className="">{props.row.original.mobile_no || "N/A"}</span>
          </div>
        ),
      },
      {
        header: "From",
        accessorKey: "type",
        size: 100,
        cell: (props) => (
          <Tag className="capitalize">
            {TYPE_OPTIONS.find((t) => t.value === props.getValue())?.label ||
              props.getValue() ||
              "N/A"}
          </Tag>
        ),
      },
      {
        header: "Subject",
        accessorKey: "subject",
        size: 150,
        cell: (props) => (
          <div className="truncate w-36" title={props.getValue() as string}>
            {(props.getValue() as string) || "N/A"}
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 100,
        cell: (props) => {
          const s = props.getValue<RequestFeedbackApiStatus>();
          return (
            <Tag
              className={classNames(
                "capitalize",
                statusColors[s] || statusColors.default
              )}
            >
              {STATUS_OPTIONS_FORM.find((opt) => opt.value === s)?.label ||
                s ||
                "N/A"}
            </Tag>
          );
        },
      },
      {
        header: "Rating",
        accessorKey: "rating",
        size: 80,
        cell: (props) =>
          props.getValue() ? `${props.getValue()} Star(s)` : "N/A",
      },
      {
        header: "Date",
        accessorKey: "created_at",
        size: 100,
        cell: (props) =>
          props.getValue()
            ? new Date(props.getValue<string>()).toLocaleDateString()
            : "N/A",
      },
      {
        header: "Actions",
        id: "actions",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 120,
        cell: (props) => (
          <ItemActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => openViewDialog(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, openViewDialog, handleDeleteClick]
  );
  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {" "}
      <FormItem
        label="Name"
        invalid={!!errors.name}
        errorMessage={errors.name?.message}
      >
        {" "}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbUserCircle />}
              placeholder="Full Name"
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Email"
        invalid={!!errors.email}
        errorMessage={errors.email?.message}
      >
        {" "}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              prefix={<TbMail />}
              placeholder="example@domain.com"
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Mobile No."
        invalid={!!errors.mobile_no}
        errorMessage={errors.mobile_no?.message}
      >
        {" "}
        <Controller
          name="mobile_no"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="tel"
              prefix={<TbPhone />}
              placeholder="+XX XXXXXXXXXX"
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Company Name (Optional)"
        invalid={!!errors.company_name}
        errorMessage={errors.company_name?.message}
      >
        {" "}
        <Controller
          name="company_name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbBuilding />}
              placeholder="Your Company"
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Type"
        invalid={!!errors.type}
        errorMessage={errors.type?.message}
      >
        {" "}
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              placeholder="Select Type"
              options={TYPE_OPTIONS}
              value={TYPE_OPTIONS.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
              prefix={<TbMessageDots />}
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Status"
        invalid={!!errors.status}
        errorMessage={errors.status?.message}
      >
        {" "}
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              placeholder="Select Status"
              options={STATUS_OPTIONS_FORM}
              value={STATUS_OPTIONS_FORM.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
              prefix={<TbToggleRight />}
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Subject (Optional)"
        className="md:col-span-2"
        invalid={!!errors.subject}
        errorMessage={errors.subject?.message}
      >
        {" "}
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbClipboardText />}
              placeholder="Brief subject of your message"
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Rating (Optional, for Feedback)"
        className="md:col-span-2"
        invalid={!!errors.rating}
        errorMessage={errors.rating?.message}
      >
        {" "}
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <Select
              placeholder="Select Rating"
              options={RATING_OPTIONS}
              value={RATING_OPTIONS.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
              isClearable
              prefix={<TbStar />}
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Feedback / Request Details"
        className="md:col-span-2"
        invalid={!!errors.feedback_details}
        errorMessage={errors.feedback_details?.message}
      >
        {" "}
        <Controller
          name="feedback_details"
          control={control}
          render={({ field }) => (
            <Input
              textArea
              {...field}
              rows={5}
              placeholder="Describe your feedback or request in detail..."
            />
          )}
        />{" "}
      </FormItem>{" "}
      <FormItem
        label="Attachment (Optional)"
        className="md:col-span-2"
        invalid={!!errors.attachment}
        errorMessage={errors.attachment?.message as string}
      >
        {" "}
        <Controller
          name="attachment"
          control={control}
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <Input
              type="file"
              name={name}
              ref={ref}
              onBlur={onBlur}
              onChange={(e) => {
                const file = e.target.files?.[0];
                onChange(file);
                setSelectedFile(file || null);
                if (file) setRemoveExistingAttachment(false);
              }}
              prefix={<TbPaperclip />}
            />
          )}
        />{" "}
        {editingItem?.attachment && !selectedFile && (
          <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
            {" "}
            <span>
              {" "}
              Current:{" "}
              <a
                href={editingItem?.icon_full_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                view current image
              </a>{" "}
            </span>{" "}
            {!removeExistingAttachment && (
              <Button
                size="xs"
                variant="plain"
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  setRemoveExistingAttachment(true);
                  formMethods.setValue("attachment", undefined);
                  setSelectedFile(null);
                }}
              >
                {" "}
                Remove{" "}
              </Button>
            )}{" "}
            {removeExistingAttachment && (
              <span className="text-red-500 text-xs">Marked for removal</span>
            )}{" "}
          </div>
        )}{" "}
      </FormItem>{" "}
    </div>
  );

  return (
    <>
      {" "}
      <AdaptiveCard className="h-full" bodyClass="h-full">
        {" "}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          {" "}
          <h5 className="mb-2 sm:mb-0">Requests & Feedbacks</h5>{" "}
          {/* <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
            {" "}
            Add New{" "}
          </Button>{" "} */}
        </div>{" "}
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4 gap-2">
          {" "}
          <Card
            bodyClass="flex gap-2 p-2"
            className="rounded-md border border-blue-200"
          >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
              <TbUserQuestion size={24} />
            </div>
            <div>
              <h6 className="text-blue-500">879</h6>
              <span className="font-semibold text-xs">Total</span>
            </div>
          </Card>{" "}
          <Card
            bodyClass="flex gap-2 p-2"
            className="rounded-md border border-green-300"
          >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
              <TbEyeClosed size={24} />
            </div>
            <div>
              <h6 className="text-green-500">23</h6>
              <span className="font-semibold text-xs">Unread</span>
            </div>
          </Card>{" "}
          <Card
            bodyClass="flex gap-2 p-2"
            className="rounded-md border border-pink-200"
          >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
              <TbBellMinus size={24} />
            </div>
            <div>
              <h6 className="text-pink-500">34</h6>
              <span className="font-semibold text-xs">Resolved</span>
            </div>
          </Card>{" "}
          <Card
            bodyClass="flex gap-2 p-2"
            className="rounded-md border border-red-200"
          >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
              <TbPencilPin size={24} />
            </div>
            <div>
              <h6 className="text-red-500">3</h6>
              <span className="font-semibold text-xs">Pending</span>
            </div>
          </Card>{" "}
          <Card
            bodyClass="flex gap-2 p-2"
            className="rounded-md border border-violet-300"
          >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
              <TbFileTime size={24} />
            </div>
            <div>
              <h6 className="text-violet-500">9 Hrs</h6>
              <span className="font-semibold text-xs">Avg Time</span>
            </div>
          </Card>{" "}
          <Card
            bodyClass="flex gap-2 p-2"
            className="rounded-md border border-orange-200"
          >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
              <TbStars size={24} />
            </div>
            <div>
              <h6 className="text-orange-500">4.2</h6>
              <span className="font-semibold text-xs">Avg Rating </span>
            </div>
          </Card>{" "}
        </div>{" "} */}
        <ItemTableTools
          onClearFilters={onClearFilters}
          onSearchChange={handleSearchInputChange}
          onFilter={openFilterDrawer}
          onExport={handleExportData}
        />{" "}
        <div className="mt-4">
          {" "}
          <RequestFeedbacksTable
            columns={columns}
            data={pageData}
            loading={
              masterLoadingStatus === "loading" || isSubmitting || isDeleting
            }
            pagingData={{
              total,
              pageIndex: tableData.pageIndex as number,
              pageSize: tableData.pageSize as number,
            }}
            selectedItems={selectedItems}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectPageSizeChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />{" "}
        </div>{" "}
      </AdaptiveCard>{" "}
      <RequestFeedbacksSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />{" "}
      <Drawer
        title={editingItem ? "Edit Entry" : "Add New"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={520}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={editingItem ? closeEditDrawer : closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="requestFeedbackForm"
              type="submit"
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
            >
              {" "}
              {isSubmitting ? "Saving..." : "Save"}{" "}
            </Button>{" "}
          </div>
        }
      >
        {" "}
        <Form
          id="requestFeedbackForm"
          onSubmit={handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4"
        >
          {" "}
          {renderDrawerForm(formMethods)}{" "}
        </Form>{" "}
      </Drawer>{" "}
      <Dialog
        isOpen={!!viewingItem}
        onClose={closeViewDialog}
        onRequestClose={closeViewDialog}
        width={600}
      >
        {" "}
        <div className="p-1">
          {" "}
          <h5 className="mb-6 border-b pb-4 dark:border-gray-600">
            Details: {viewingItem?.subject || viewingItem?.name}
          </h5>{" "}
          {viewingItem && (
            <div className="space-y-3 text-sm"> {/* Details */} </div>
          )}{" "}
          <div className="text-right mt-6">
            {" "}
            <Button variant="solid" onClick={closeViewDialog}>
              {" "}
              Close{" "}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </Dialog>{" "}
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
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              {" "}
              Clear{" "}
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="filterReqFeedbackForm"
              type="submit"
            >
              {" "}
              Apply{" "}
            </Button>{" "}
          </div>
        }
      >
        {" "}
        <Form
          id="filterReqFeedbackForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          {" "}
          {/* Filter form items */}{" "}
        </Form>{" "}
      </Drawer>{" "}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Entry"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
      >
        {" "}
        <p>
          {" "}
          Are you sure you want to delete entry from "
          <strong>{itemToDelete?.name}</strong>"?{" "}
        </p>{" "}
      </ConfirmDialog>{" "}
    </>
  );
};

// --- Navigator Component ---
const memberNavigationList = [
  { label: "Personal Details", link: "personalDetails" },
  { label: "Contact Info", link: "socialContactInformation" },
  { label: "Member Profile", link: "memberProfile" },
  { label: "Accessibilities", link: "memberAccessibility" },
  { label: "Membership Details", link: "membershipPlanDetails" },
  // { label: "Feedback / Requests", link: "requestAndFeedbacks" },
];
const NavigatorComponent = (props: {
  activeSection: string;
  onNavigate: (sectionKey: string) => void;
}) => {
  const { activeSection, onNavigate } = props;
  return (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
      {" "}
      {memberNavigationList.map((nav) => (
        <button
          type="button"
          key={nav.link}
          className={classNames(
            "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max",
            "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
            {
              "bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold":
                activeSection === nav.link,
              "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200":
                activeSection !== nav.link,
            }
          )}
          onClick={() => onNavigate(nav.link)}
          title={nav.label}
        >
          {" "}
          <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">
            {nav.label}
          </span>{" "}
        </button>
      ))}{" "}
    </div>
  );
};

// --- Section Components (Updated) ---
const MemberProfileComponent = ({ control, errors }: FormSectionBaseProps) => {
  // Assuming these are fetched from Redux. You must implement the respective actions and reducers.
  const {
    BrandData = [],
    CategoriesData = [],
    subCategoriesData = [],
    ProductsData = [],
    Employees = [],
    AllProducts = [],
    MemberTypeData = []

  } = useSelector(masterSelector);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "member_profiles" as "member_profiles",
  });

  // Mock options if data not available, replace with real data from selectors
  const productOptions = ProductsData?.data?.map((p: any) => ({
    value: String(p.id),
    label: p.name,
  }));
  const brandOptions = BrandData.map((b: any) => ({
    value: b.id,
    label: b.name,
  }));
  const categoryOptions = CategoriesData.map((c: any) => ({
    value: c.id,
    label: c.name,
  }));
  const subCategoryOptions = CategoriesData.map((sc: any) => ({
    value: sc.id,
    label: sc.name,
  }));

  const allproductOptions = AllProducts.map((sc: any) => ({
    value: parseInt(sc.id),
    label: sc.name,
  }));


  const opportunityOptions = [
    { value: "Indian Buyer", label: "Indian Buyer" },
    { value: "Indian Supplier", label: "Indian Supplier" },
    { value: "Global Buyer", label: "Global Buyer" },
    { value: "Global Supplier", label: "Global Supplier" },
  ];
  const gradeOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ];
  const managerOptions = Employees.map((m: any) => ({
    value: String(m.id),
    label: m.name,
  }));
  const yesNoOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];
  const interestedinOption = [
    { value: "For Sell", label: "For Sell" },
    { value: "For Buy", label: "For Buy" },
    { value: "Both", label: "Both" },
  ];
  // const memberTypeOptions = [
  //   { value: 1, label: "INS - PREMIUM" },
  //   { value: 2, label: "INS - SUPER" },
  //   { value: 3, label: "INS - TOP" },
  //   { value: 4, label: "INS - SUPPLIER" },
  //   { value: 5, label: "GLB - PREMIUM" },
  //   { value: 6, label: "GLB - BUYER" },
  //   { value: 7, label: "INDIAN" },
  //   { value: 8, label: "GLOBAL SUPPLIER" },
  // ];
const memberTypeOptions = MemberTypeData.map((m: any) => ({
    value: m.id,
    label: m.name,
  }));
  return (
    <Card id="memberProfile">
      <h4 className="mb-6">Additional Member Profile</h4>
      <div className="grid md:grid-cols-3 gap-4">

        <FormItem
          label="Business Opportunity"
          invalid={!!errors.business_opportunity}
          errorMessage={errors.business_opportunity?.message as string}
        >
          <Controller
            name="business_opportunity"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select opportunity"
                options={opportunityOptions}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Business Type"
          invalid={!!errors.business_type}
          errorMessage={errors.business_type?.message as string}
        >
          <Controller
            name="business_type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select Business Type"
                options={[
                  { label: "Manufacturer", value: "Manufacturer" },
                  { label: "Distributor", value: "Distributor" },
                  { label: "Wholesaler", value: "Wholesaler" },
                  { label: "Retailer", value: "Retailer" },
                  { label: "Corporate", value: "Corporate" },
                ]}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Favourite Product(s)"
          invalid={!!errors.favourite_product_id}
          errorMessage={errors.favourite_product_id?.message as string}
        >
          <Controller
            name="favourite_product_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                placeholder="Select favourite products"
                options={allproductOptions}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label={<div>Interested For</div>}
          invalid={!!errors.interested_in}
          errorMessage={errors.interested_in?.message as string}
        >
          <Controller
            name="interested_in"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select interested categories"
                options={interestedinOption}
                isClearable
              />
            )}
          />
        </FormItem>
        {/* <FormItem
          label={<div>Interested Categories<span className="text-red-500"> * </span></div>}
          invalid={!!errors.interested_category_ids}
          errorMessage={errors.interested_category_ids?.message as string}
        >
          <Controller
            name="interested_category_ids"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select interested categories"
                options={categoryOptions}
                isClearable
              />
            )}
          />
        </FormItem> */}
        {/* <FormItem
          label="Interested Sub Categories"
          invalid={!!errors.interested_subcategory_ids}
          errorMessage={errors.interested_subcategory_ids?.message as string}
        >
          <Controller
            name="interested_subcategory_ids"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                placeholder="Select interested sub categories"
                options={subCategoryOptions}
                isClearable
              />
            )}
          />
        </FormItem> */}
        {/* <FormItem
          label="Favourite Brands"
          invalid={!!errors.favourite_brands}
          errorMessage={errors.favourite_brands?.message as string}
        >
          <Controller
            name="favourite_brands"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                placeholder="Select favourite brands"
                options={brandOptions}
                isClearable
              />
            )}
          />
        </FormItem> */}
        <FormItem
          label="Member Grade"
          invalid={!!errors.member_grade}
          errorMessage={errors.member_grade?.message as string}
        >
          <Controller
            name="member_grade"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select grade"
                options={gradeOptions}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Relationship Manager"
          invalid={!!errors.relationship_manager}
          errorMessage={errors.relationship_manager?.message as string}
        >
          <Controller
            name="relationship_manager"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select RM"
                options={managerOptions}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Dealing in Bulk"
          invalid={!!errors.dealing_in_bulk}
          errorMessage={errors.dealing_in_bulk?.message as string}
        >
          {/* <Controller
            name="dealing_in_bulk"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select option"
                options={yesNoOptions}
                isClearable
              />
            )}
          /> */}
          <Controller
            name="dealing_in_bulk"
            control={control}
            render={({ field }) => (
              <Radio.Group {...field} className="flex gap-4 mt-2">
                <Radio value="Yes">Yes</Radio>
                <Radio value="No">No</Radio>
              </Radio.Group>
            )}
          />
        </FormItem>
        <FormItem
          label="Remarks"
          className="md:col-span-3"
          invalid={!!errors.remarks}
          errorMessage={errors.remarks?.message}
        >
          <Controller
            name="remarks"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Enter internal remarks" />
            )}
          />
        </FormItem>
      </div>
      <hr className="my-6" />
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Dynamic Member Profiles </h4>
        <Button
          type="button"
          icon={<HiPlus />}
          size="sm"
          onClick={() =>
            append({ member_type: undefined, brands: [], sub_categories: [] })
          }
        >
          Add Profile Section
        </Button>
      </div>{" "}
      <div className="flex flex-col gap-y-6">
        {fields.map((item, index) => (
          <Card key={item.id} className="border-black rounded-md" bodyClass="relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                variant="plain"
                size="sm"
                className="text-xs"
                icon={<TbTrash size={16} />}
                onClick={() => remove(index)}
              >Remove
              </Button>
              {/* <Button size="sm" type="button" shape="circle" variant="plain" icon={<HiTrash className="text-red-500" />} onClick={() => remove(index)} /> */}
            </div>
            <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
              <FormItem
                label={`Member Type ${index + 1}`}
                invalid={!!errors.member_profiles?.[index]?.member_type}
                errorMessage={
                  errors.member_profiles?.[index]?.member_type
                    ?.message as string
                }
              >
                <Controller
                  name={`member_profiles.${index}.member_type`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select Member Type"
                      options={memberTypeOptions}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Select Brand(s)"
                invalid={!!errors.member_profiles?.[index]?.brands}
                errorMessage={
                  errors.member_profiles?.[index]?.brands?.message as string
                }
              >
                <Controller
                  name={`member_profiles.${index}.brands`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isMulti
                      placeholder="Select brands"
                      options={brandOptions}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              {/* Category */}
              <FormItem
                label="Select Category(s)"
                invalid={!!errors.member_profiles?.[index]?.categories}
                errorMessage={
                  errors.member_profiles?.[index]?.categories
                    ?.message as string
                }
              >
                <Controller
                  name={`member_profiles.${index}.categories`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isMulti
                      placeholder="Select categories"
                      options={categoryOptions}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Select Sub Category(s)"
                // className="md:col-span-2"
                invalid={!!errors.member_profiles?.[index]?.sub_categories}
                errorMessage={
                  errors.member_profiles?.[index]?.sub_categories
                    ?.message as string
                }
              >
                <Controller
                  name={`member_profiles.${index}.sub_categories`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isMulti
                      placeholder="Select sub categories"
                      options={subCategoryOptions}
                      isClearable
                    />
                  )}
                />
              </FormItem>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

const PersonalDetailsComponent = ({
  control,
  errors,
  isEditMode,
}: FormSectionBaseProps) => {
  // Assuming `CompanyData` is fetched and available in the master slice
  const {
    CountriesData = [],
    ContinentsData = [],
    CompanyData = [],
  } = useSelector(masterSelector);


  const countryOptions = CountriesData.map((country: any) => ({
    value: String(country.id),
    label: country.name,
  }));
  const countryCodeOptions = CountriesData
    .map((c: any) => ({
      value: `+${c.phone_code}`,
      label: `${c.iso_code} (${c.phone_code})`,
    })).filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i); // Unique phone codes

  const continentOptions = ContinentsData.map((continent: any) => ({
    value: String(continent.id),
    label: continent.name,
  }));

  const companyOptions = CompanyData?.data?.map((c: any) => ({
    value: String(c.id),
    label: c.company_name,
  })); // Assumes structure {id, name}
  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Unregistered", value: "Unregistered" },
    { label: "Disabled", value: "Disabled" },
  ];

  return (
    <Card id="personalDetails">
      <h4 className="mb-6">Personal Details</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <FormItem
          label={<div>Full Name<span className="text-red-500"> * </span></div>}
          invalid={!!errors.name}
          errorMessage={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input placeholder="Member’s full name" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label={<div>Mobile Number<span className="text-red-500"> * </span></div>}
          invalid={!!errors.mobile_no || !!errors.contact_country_code}
          errorMessage={
            errors.mobile_no?.message ||
            (errors.contact_country_code as any)?.message
          }
        >
          <div className="flex items-center gap-2">
            <Controller
              name="contact_country_code"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Code"
                  className="w-32"
                  options={countryCodeOptions}
                  {...field}
                />
              )}
            />
            <Controller
              name="mobile_no"
              control={control}
              render={({ field }) => (
                <Input placeholder="Primary contact number" {...field} />
              )}
            />
          </div>
        </FormItem>
        <FormItem
          label={<div>Email<span className="text-red-500"> * </span></div>}
          invalid={!!errors.email}
          errorMessage={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                placeholder="Primary email address"
                {...field}
              />
            )}
          />
        </FormItem>

        <FormItem
          label="Password (leave blank to keep current)"
          invalid={!!errors.password}
          errorMessage={errors.password?.message}
        //   className="md:col-span-3"
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                type="password"
                disabled={isEditMode ? true : false}
                placeholder="Enter new password"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Company Name (Temp)"
          invalid={!!errors.company_name_temp}
          errorMessage={(errors.company_name_temp as any)?.message}
        //   className="md:col-span-3"
        >
          <Controller
            name="company_name_temp"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Enter temporary company"
                // options={companyOptions}
                {...field}
              // isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Company Name (Actual)"
          invalid={!!errors.company_name}
          errorMessage={(errors.company_name as any)?.message}
        //   className="md:col-span-3"
        >
          <Controller
            name="company_name"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Enter company name"
                // options={companyOptions}
                {...field}
              // isClearable
              />
            )}
          />
        </FormItem>

        <FormItem
          label={<div>Status<span className="text-red-500"> * </span></div>}
          invalid={!!errors.status}
          errorMessage={errors.status?.message as string}
        >
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Please Select"
                options={statusOptions}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Continent"
          invalid={!!errors.continent_id}
          errorMessage={errors.continent_id?.message as string}
        >
          <Controller
            name="continent_id"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Continent"
                options={continentOptions}
                {...field}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label={<div>Country<span className="text-red-500"> * </span></div>}
          invalid={!!errors.country_id}
          errorMessage={errors.country_id?.message as string}
        >
          <Controller
            name="country_id"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Country"
                options={countryOptions}
                {...field}
                isClearable
              />
            )}
          />
        </FormItem>
        <FormItem
          label="State"
          invalid={!!errors.state}
          errorMessage={errors.state?.message}
        >
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Input placeholder="Enter state" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="City"
          invalid={!!errors.city}
          errorMessage={errors.city?.message}
        >
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input placeholder="Enter city" {...field} />
            )}
          />
        </FormItem>



        <FormItem
          label="Pincode"
          invalid={!!errors.pincode}
          errorMessage={errors.pincode?.message}
        >
          <Controller
            name="pincode"
            control={control}
            render={({ field }) => (
              <Input placeholder="Enter pincode" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Address"
          invalid={!!errors.address}
          errorMessage={errors.address?.message}
          className="md:col-span-3"
        >
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input placeholder="Full Address" {...field} />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );
};

const ContactDetailsComponent = ({ control, errors }: FormSectionBaseProps) => {
  const { CountriesData = [] } = useSelector(masterSelector);

  const countryOptions = CountriesData.map((country: any) => ({
    value: String(country.id),
    label: country.name,
  }));

  const countryCodeOptions = CountriesData
    .map((c: any) => ({
      value: `+${c.phone_code}`,
      label: `${c.iso_code} (${c.phone_code})`,
    })).filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i); // Unique phone codes

  return (
    <Card id="socialContactInformation">
      <h4 className="mb-6">Social & Contact Information</h4>
      <div className="grid md:grid-cols-3 gap-4" style={{ width: "22vh !important" }}>
        <FormItem
          label={<div>WhatsApp No.<span className="text-red-500"> * </span></div>}
          invalid={!!errors.whatsapp_number}
          errorMessage={errors.whatsapp_number?.message}
        >
          <div className="flex items-center gap-2" style={{ width: "22vh !important" }}>
            <Controller
              name="whatsapp_country_code"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Code"
                  className="w-28"
                  options={countryCodeOptions}
                  {...field}
                />
              )}
            />
            <Controller
              name="whatsapp_number"
              control={control}
              render={({ field }) => (
                <Input placeholder="Enter WhatsApp number" {...field} />
              )}
            />
          </div>
        </FormItem>
        <FormItem
          label="Alternate Contact Number"
          invalid={
            !!errors.alternate_contact_number ||
            !!errors.alternate_contact_country_code
          }
          errorMessage={
            errors.alternate_contact_number?.message ||
            (errors.alternate_contact_country_code as any)?.message
          }
        >
          <div className="flex items-center gap-2">
            <Controller
              name="alternate_contact_country_code"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Code"
                  className="w-28"
                  options={countryCodeOptions}
                />
              )}
            />
            <Controller
              name="alternate_contact_number"
              control={control}
              render={({ field }) => (
                <Input placeholder="Alternate contact" {...field} />
              )}
            />
          </div>
        </FormItem>
        <FormItem
          label="Landline Number"
          invalid={!!errors.landline_number}
          errorMessage={errors.landline_number?.message}
        >
          <Controller
            name="landline_number"
            control={control}
            render={({ field }) => (
              <Input type="tel" placeholder="Landline" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Fax Number"
          invalid={!!errors.fax_number}
          errorMessage={errors.fax_number?.message}
        >
          <Controller
            name="fax_number"
            control={control}
            render={({ field }) => (
              <Input type="tel" placeholder="Fax" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Alternate Email"
          invalid={!!errors.alternate_email}
          errorMessage={errors.alternate_email?.message}
        >
          <Controller
            name="alternate_email"
            control={control}
            render={({ field }) => (
              <Input type="email" placeholder="Alternate email" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Botim ID"
          invalid={!!errors.botim_id}
          errorMessage={errors.botim_id?.message}
        >
          <Controller
            name="botim_id"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Botim ID" />}
          />
        </FormItem>
        <FormItem
          label="Skype ID"
          invalid={!!errors.skype_id}
          errorMessage={errors.skype_id?.message}
        >
          <Controller
            name="skype_id"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Skype ID" />}
          />
        </FormItem>
        <FormItem
          label="WeChat ID"
          invalid={!!errors.we_chat}
          errorMessage={errors.we_chat?.message}
        >
          <Controller
            name="we_chat"
            control={control}
            render={({ field }) => <Input {...field} placeholder="WeChat ID" />}
          />
        </FormItem>
        <FormItem
          label="LinkedIn Profile"
          invalid={!!errors.linkedin_profile}
          errorMessage={errors.linkedin_profile?.message}
        >
          <Controller
            name="linkedin_profile"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="LinkedIn URL" />
            )}
          />
        </FormItem>
        <FormItem
          label="Facebook Profile"
          invalid={!!errors.facebook_profile}
          errorMessage={errors.facebook_profile?.message}
        >
          <Controller
            name="facebook_profile"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Facebook URL" />
            )}
          />
        </FormItem>
        <FormItem
          label="Instagram Handle"
          invalid={!!errors.instagram_handle}
          errorMessage={errors.instagram_handle?.message}
        >
          <Controller
            name="instagram_handle"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="@instagram" />
            )}
          />
        </FormItem>
        <FormItem
          label="Website"
          invalid={!!errors.website}
          errorMessage={errors.website?.message}
        >
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <Input type="url" placeholder="https://example.com" {...field} />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );
};

const MemberAccessibilityComponent = ({
  control,
  errors,
}: FormSectionBaseProps) => {
  const yesNoOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];
  return (
    <Card id="memberAccessibility">
      <h4 className="mb-6">Member Accessibility</h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <FormItem
          label="Product Upload Permission"
          invalid={!!errors.product_upload_permission}
          errorMessage={errors.product_upload_permission?.message as string}
        >
          <Controller
            name="product_upload_permission"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={!!field.value}
                onChange={(checked) => field.onChange(checked)}
              >
                Enabled
              </Checkbox>
            )}
          />
        </FormItem>
        <FormItem
          label="Wall Enquiry Permission"
          invalid={!!errors.wall_enquiry_permission}
          errorMessage={errors.wall_enquiry_permission?.message as string}
        >
          <Controller
            name="wall_enquiry_permission"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={!!field.value}
                onChange={(checked) => field.onChange(checked)}
              >
                Enabled
              </Checkbox>
            )}
          />
        </FormItem>
        <FormItem
          label="Enquiry Permission"
          invalid={!!errors.enquiry_permission}
          errorMessage={errors.enquiry_permission?.message as string}
        >
          <Controller
            name="enquiry_permission"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={!!field.value}
                onChange={(checked) => field.onChange(checked)}
              >
                Enabled
              </Checkbox>
            )}
          />
        </FormItem>
        <FormItem
          label="Trade Inquiry Allowed"
          invalid={!!errors.trade_inquiry_allowed}
          errorMessage={errors.trade_inquiry_allowed?.message as string}
        >
          <Controller
            name="trade_inquiry_allowed"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={!!field.value}
                onChange={(checked) => field.onChange(checked)}
              >
                Enabled
              </Checkbox>
            )}
          />
          {/* <Controller
            name="trade_inquiry_allowed"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={yesNoOptions}
                isClearable
              />
            )}
          /> */}
        </FormItem>
      </div>
    </Card>
  );
};

const MembershipPlanComponent = ({ control, errors }: FormSectionBaseProps) => {
  const planOptions = [
    { value: "Basic", label: "Basic" },
    { value: "Premium", label: "Premium" },
    { value: "Enterprise", label: "Enterprise" },
  ];
  return (
    <Card id="membershipPlanDetails">
      <h4 className="mb-6">Membership Plan Details</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <FormItem
          label="Membership Plan (Current)"
          invalid={!!errors.membership_plan_text}
          errorMessage={errors.membership_plan_text?.message}
        >
          <Controller
            name="membership_plan_text"
            control={control}
            render={({ field }) => (
              <Input placeholder="e.g., Premium Plan" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Upgrade Your Plan"
          invalid={!!errors.upgrade_plan}
          errorMessage={errors.upgrade_plan?.message as string}
        >
          <Controller
            name="upgrade_plan"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select New Plan"
                options={planOptions}
                {...field}
                isClearable
              />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );
};
const RequestAndFeedbacksComponent = ({
  control,
  errors,
}: FormSectionBaseProps) => {
  return (
    <div id="requestAndFeedbacks" className="flex flex-col gap-4">
      <RequestAndFeedbackListing />
      {/* <Card>
        <h4 className="mb-6">Add New Feedback / Request to this Member</h4>
        <FormItem
          label="Your Message"
          invalid={!!errors.request_description}
          errorMessage={errors.request_description?.message}
        >
          <Controller
            name="request_description"
            control={control}
            render={({ field }) => (
              <Input
                textArea
                rows={4}
                placeholder="Describe your request or feedback in detail..."
                {...field}
              />
            )}
          />
        </FormItem>
      </Card> */}
    </div>
  );
};

// --- MemberFormComponent ---
const MemberFormComponent = (props: {
  onFormSubmit: (
    values: MemberFormSchema,
    formMethods: UseFormReturn<MemberFormSchema>
  ) => void;
  defaultValues: Partial<MemberFormSchema>;
  isEditMode?: boolean;
  onDiscard?: () => void;
  isSubmitting?: boolean;
}) => {
  const { onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting } =
    props;
  const [activeSection, setActiveSection] = useState<string>(
    memberNavigationList[0].link
  );
  const memberSchema = z
    .object({
      name: z.string().trim().min(1, { message: "Name is Required!" }),
      email: z
        .string()
        .trim()
        .min(1, { message: "Email is Required!" })
        .email("Invalid email format"),
      password: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 6, {
          message: "Password must be at least 6 characters if provided",
        }),
      mobile_no: z.string().trim().min(1, "Mobile number is required"),
      whatsapp_number: z.string().trim().min(1, "Whatsapp is required"),
      // company_name: z
      //   .union([
      //     z.string(),
      //     z.object({ value: z.string().min(1), label: z.string() }),
      //   ])
      //   .refine(
      //     (val) =>
      //       (typeof val === "string" && val.trim() !== "") ||
      //       (typeof val === "object" && !!val?.value),
      //     { message: "Company Name is required" }
      //   ),
      country_id: z
        .union([
          z.string(),
          z.object({ value: z.string().min(1), label: z.string() }),
        ])
        .refine(
          (val) =>
            (typeof val === "string" && val.trim() !== "") ||
            (typeof val === "object" && !!val?.value),
          { message: "Country is required" }
        ),
      // address: z.string().trim().min(1, "Address is required"),
    })
    .passthrough();
  const formMethods = useForm<MemberFormSchema>({
    defaultValues,
    resolver: zodResolver(memberSchema),
  });
  const {
    handleSubmit,
    reset,
    formState: { errors },
    control,
    getValues,
  } = formMethods;

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);
  const internalFormSubmit = (values: MemberFormSchema) => {
    onFormSubmit?.(values, formMethods);
  };
  const navigationKeys = memberNavigationList.map((item) => item.link);
  const handleNext = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex < navigationKeys.length - 1)
      setActiveSection(navigationKeys[currentIndex + 1]);
  };
  const handlePrevious = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]);
  };

  const renderActiveSection = (isEditMode: isEditMode) => {
    const sectionProps = { errors, control, formMethods, isEditMode };
    switch (activeSection) {
      case "personalDetails":
        return <PersonalDetailsComponent {...sectionProps} />;
      case "socialContactInformation":
        return <ContactDetailsComponent {...sectionProps} />;
      case "memberAccessibility":
        return <MemberAccessibilityComponent {...sectionProps} />;
      case "membershipPlanDetails":
        return <MembershipPlanComponent {...sectionProps} />;
      // case "requestAndFeedbacks":
      //   return <RequestAndFeedbacksComponent {...sectionProps} />;
      case "memberProfile":
        return <MemberProfileComponent {...sectionProps} />;
      default:
        return <PersonalDetailsComponent {...sectionProps} />;
    }
  };

  return (
    <>
      <div className="flex gap-1 items-center mb-3">
        <NavLink to="/business-entities/member">
          <h6 className="font-semibold hover:text-primary-600">Member</h6>
        </NavLink>
        <BiChevronRight size={22} />
        <h6 className="font-semibold text-primary flex items-center gap-2">
          {isEditMode ? "Edit Member" : "Add New Member"}
          {isEditMode && getValues("is_blacklisted") && (
            <Tag prefix prefixClass="bg-red-500">
              Blacklisted
            </Tag>
          )}
        </h6>
      </div>
      <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
        <NavigatorComponent
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />
      </Card>
      <div className="flex flex-col gap-4 pb-20">{renderActiveSection(isEditMode)}</div>
      <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4">
          <div>
            {onDiscard && (
              <Button
                type="button"
                customColorClass={() =>
                  "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                }
                icon={<TbTrash />}
                onClick={onDiscard}
                disabled={isSubmitting}
              >
                Discard
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handlePrevious}
              disabled={
                isSubmitting || navigationKeys.indexOf(activeSection) === 0
              }
            >
              Previous
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                isSubmitting ||
                navigationKeys.indexOf(activeSection) ===
                navigationKeys.length - 1
              }
            >
              Next
            </Button>
            <Button
              variant="solid"
              type="button"
              loading={isSubmitting}
              onClick={handleSubmit(internalFormSubmit)}
              disabled={isSubmitting}
            >
              {isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

// --- MemberCreate Page ---
const MemberCreate = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  console.log(id, "ididididididididididid");

  const isEditMode = Boolean(id);

  const [initialData, setInitialData] =
    useState<Partial<MemberFormSchema> | null>(null);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEmptyFormValues = (): Partial<MemberFormSchema> => ({
    role_type: { label: "Member", value: "0" },
    name: "",
    email: "",
    password: "",
    contact_country_code: undefined,
    mobile_no: "",
    interested_category_ids: [],
    interested_subcategory_ids: [],
    favourite_brands: [],
    kyc_verified: undefined,
    permanent_id: "",
    city: "",
    state: "",
    country_id: undefined,
    continent_id: undefined,
    customer_ids: "",
    pincode: "",
    status: { label: "Active", value: "Active" },
    company_name: undefined,
    company_name_temp: undefined,
    address: "",
    company_description: "",
    company_address: "",
    whatsapp_number: "",
    alternate_contact_country_code: undefined,
    alternate_contact_number: "",
    landline_number: "",
    fax_number: "",
    alternate_email: "",
    botim_id: "",
    skype_id: "",
    we_chat: "",
    website: "",
    business_type: "",
    gst_number: "",
    pan_number: "",
    bank_account_no: "",
    ifsc_code: "",
    bank_name: "",
    branch_name: "",
    swift_code: "",
    fssai_license: "",
    drug_license: "",
    iec_code: "",
    iso_certificate: "",
    other_trading_license: "",
    usfda_license: "",
    other_trading_license_2: "",
    wall_enquiry_permission: false,
    enquiry_permission: false,
    interested_for: "",
    customer_code_permanent: "",
    product_upload_permission: false,
    trade_inquiry_allowed: undefined,
    membership_plan_text: "",
    upgrade_plan: undefined,
    request_description: "",
    favourite_product_id: [],
    business_opportunity: undefined,
    member_grade: undefined,
    relationship_manager: undefined,
    remarks: "",
    linkedin_profile: "",
    facebook_profile: "",
    instagram_handle: "",
    is_blacklisted: false,
    dealing_in_bulk: undefined,
    member_profiles: [],
  });

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getCompanyAction());
    dispatch(getBrandAction());
    dispatch(getCategoriesAction());
    // dispatch(getSubcategoriesByIdAction());
    dispatch(getEmployeesAction());
    dispatch(getAllProductsAction());
    dispatch(getMemberTypeAction());
  }, [dispatch]);

  useEffect(() => {
    const emptyForm = getEmptyFormValues();
    if (isEditMode && id) {
      const fetchMemberData = async () => {
        setPageLoading(true);
        try {
          const response = await dispatch(getMemberByIdAction(id)).unwrap();
          console.log(response, "Fetched Member Data");

          if (response) {
            const apiMemberData: ApiSingleCustomerItem = response;
            const transformed = transformApiToFormSchema(apiMemberData);
            setInitialData({ ...emptyForm, ...transformed });
          } else {
            toast.push(
              <Notification type="danger" title="Fetch Error">
                {response?.message || "Failed to load member data."}
              </Notification>
            );
            navigate("/business-entities/member");
          }
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Error fetching member details.";
          toast.push(
            <Notification type="danger" title="Fetch Error">
              {errorMessage}
            </Notification>
          );
          navigate("/business-entities/member");
        } finally {
          setPageLoading(false);
        }
      };
      fetchMemberData();
    } else {
      setInitialData(emptyForm);
      setPageLoading(false);
    }
  }, [id, isEditMode, navigate, dispatch]);

  const handleFormSubmit = async (
    formValues: MemberFormSchema,
    formMethods: UseFormReturn<MemberFormSchema>
  ) => {
    setIsSubmitting(true);
    const payload = preparePayloadForApi(
      formValues as Partial<MemberFormSchema>,
      isEditMode
    );

    console.log(payload, "Payload to be sent to API", formValues);

    try {
      if (isEditMode && id) {
        await dispatch(editMemberAction(payload)).unwrap();
        toast.push(
          <Notification type="success" title="Member Updated">
            Details updated successfully.
          </Notification>
        );
      } else {
        await dispatch(addMemberAction(payload)).unwrap();
        toast.push(
          <Notification type="success" title="Member Created">
            New member created successfully.
          </Notification>
        );
      }
      navigate("/business-entities/member");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        `Failed to ${isEditMode ? "update" : "create"} member.`;
      if (error?.errors && typeof error.errors === "object") {
        Object.entries(error.errors).forEach(([key, value]) => {
          formMethods.setError(key as keyof MemberFormSchema, {
            type: "server",
            message: Array.isArray(value) ? value.join(", ") : String(value),
          });
        });
        toast.push(
          <Notification type="danger" title="Validation Error">
            Please check the form fields.
          </Notification>
        );
      } else {
        toast.push(
          <Notification
            type="danger"
            title={`${isEditMode ? "Update" : "Creation"} Failed`}
          >
            {errorMessage}
          </Notification>
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDiscardDialog = () => setDiscardConfirmationOpen(true);
  const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
  const handleConfirmDiscard = () => {
    closeDiscardDialog();
    navigate("/business-entities/member");
  };

  if (pageLoading)
    return (
      <Container className="h-full flex justify-center items-center">
        <p>Loading member details...</p>
      </Container>
    );
  if (!initialData)
    return (
      <Container className="h-full flex justify-center items-center">
        <p>Initializing form...</p>
      </Container>
    );

  return (
    <Container className="h-full">
      <Form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col min-h-screen"
      >
        <div className="flex-grow">
          <MemberFormComponent
            onFormSubmit={handleFormSubmit}
            defaultValues={initialData}
            isEditMode={isEditMode}
            onDiscard={openDiscardDialog}
            isSubmitting={isSubmitting}
          />
        </div>
        <ConfirmDialog
          isOpen={discardConfirmationOpen}
          type="danger"
          title="Discard Changes"
          onClose={closeDiscardDialog}
          onRequestClose={closeDiscardDialog}
          onCancel={closeDiscardDialog}
          onConfirm={handleConfirmDiscard}
        >
          <p>
            Are you sure you want to discard changes? This cannot be undone.
          </p>
        </ConfirmDialog>
      </Form>
    </Container>
  );
};

export default MemberCreate;
