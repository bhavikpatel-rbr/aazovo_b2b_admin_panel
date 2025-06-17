import { z } from 'zod';
import dayjs from 'dayjs';

// --- Core Enums/Types (Unchanged) ---
export type LeadStatus =
  | "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Negotiation"
  | "Follow Up" | "Lost" | "Won" | string;

export type EnquiryType =
  | "Product Info" | "Quote Request" | "Demo Request" | "Support"
  | "Partnership" | "Sourcing" | "Wall Listing" | "Manual Lead" | "From Inquiry" | "Other" | string;

export type LeadIntent = "Buy" | "Sell" | "Both" | "Inquire" | "Partner" | string;
export type ProductCondition = "New" | "Used" | "Refurbished" | "Active" | string;

// --- Updated Type Definitions (Reflecting JSON structure) ---

export type LeadSourcingDetails = {
  source_supplier_id?: string | number | null;
  source_qty?: number | null;
  source_price?: number | null;
  source_product_status?: string | null;
  source_device_condition?: ProductCondition | null;
  source_device_type?: string | null;
  source_color?: string | null;
  source_cartoon_type_id?: number | null;
  source_dispatch_status?: string | null;
  source_payment_term_id?: number | null;
  source_eta?: string | Date | null;
  source_location?: string | null;
  source_internal_remarks?: string | null;
};

export type LeadListItem = {
  id: string | number;
  lead_number?: string | null;
  status: LeadStatus;
  lead_status: LeadStatus;
  enquiry_type: EnquiryType;
  product?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null; // Based on customer object in JSON
  member_id?: string | number | null;
  want_to: LeadIntent;
  lead_intent: LeadIntent;
  qty?: number | null;
  target_price?: number | null;
  assigned_sales_person_id?: string | number | null;
  created_at: Date | string;
  updated_at?: Date | string;
} & LeadSourcingDetails; // Merging sourcing details for a flatter structure if needed

// --- Zod Schema for Add/Edit Lead Form (UPDATED to match JSON keys and types) ---
export const leadFormSchemaObject = {
  // Top-level lead details
  id: z.union([z.string(), z.number()]).optional(),
  member_id: z.coerce.number().nullable().optional(), // Corresponds to customer/member
  enquiry_type: z.string().min(1, "Enquiry type is required"),
  lead_intent: z.string().optional().nullable(),
  lead_status: z.string().min(1, "Lead status is required"),
  assigned_sales_person_id: z.coerce.number().nullable().optional(),

  // Customer's product interest
  product_id: z.coerce.number().nullable().optional(),
  product_spec_id: z.coerce.number().nullable().optional(),
  qty: z.coerce.number().min(1, "Quantity is required"),
  target_price: z.coerce.number().nullable().optional(),

  // Sourced product details
  source_supplier_id: z.coerce.number().nullable().optional(),
  source_qty: z.coerce.number().nullable().optional(),
  source_price: z.coerce.number().nullable().optional(),
  source_product_status: z.string().nullable().optional(),
  source_device_condition: z.string().nullable().optional(),
  source_device_type: z.string().nullable().optional(),
  source_color: z.string().nullable().optional(),
  source_cartoon_type_id: z.coerce.number().nullable().optional(),
  source_dispatch_status: z.string().nullable().optional(),
  source_payment_term_id: z.coerce.number().nullable().optional(),
  source_eta: z.union([z.date(), z.string()]).nullable().optional()
    .transform(val => val ? (dayjs(val).isValid() ? dayjs(val).toDate() : val) : null),
  source_location: z.string().nullable().optional(),
  source_internal_remarks: z.string().nullable().optional(),
};

export const leadFormSchema = z.object(leadFormSchemaObject);
export type LeadFormData = z.infer<typeof leadFormSchema>;


// --- UI Constants for Selects (Unchanged) ---
export const leadStatusOptions: { value: LeadStatus, label: string }[] = [
  { value: "New", label: "New" }, { value: "Contacted", label: "Contacted" },
  { value: "Qualified", label: "Qualified" }, { value: "Proposal Sent", label: "Proposal Sent" },
  { value: "Negotiation", label: "Negotiation" }, { value: "Follow Up", label: "Follow Up" },
  { value: "Lost", label: "Lost" }, { value: "Won", label: "Won" },
];

export const enquiryTypeOptions: { value: EnquiryType, label: string }[] = [
  { value: "Wall Listing", label: "Wall Listing" },
  { value: "Manual Lead", label: "Manual Lead" },
  { value: "From Inquiry", label: "From Inquiry" },
  { value: "Other", label: "Other" },
];

export const leadIntentOptions: { value: LeadIntent, label: string }[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" },
];

export const deviceConditionOptions: { value: ProductCondition, label: string }[] = [
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Refurbished", label: "Refurbished" },
];