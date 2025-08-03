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
  formId: any
} & LeadSourcingDetails; // Merging sourcing details for a flatter structure if needed

// --- Zod Schema for Add/Edit Lead Form (UPDATED to match JSON keys and types) ---
export const leadFormSchemaObject = {
  // Top-level lead details
  id: z.union([z.string(), z.number()]).optional(),
  member_id: z.coerce.number().min(1, "Lead Member is required"), // Corresponds to customer/member

  lead_intent: z.string().optional().nullable(),
  lead_status: z.string().min(1, "Lead status is required"),

  // Customer's product interest
  product_id: z.coerce.number().min(1, "Product is required"),
  product_spec_id: z.coerce.number().nullable().optional(),
  qty: z.coerce.number().min(1, "Quantity is required"),
  target_price: z.coerce.number().nullable().optional(),

  // Sourced product details
  source_supplier_id: z.coerce.number().min(1, "Source Member is required"),
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
  { value: "New", label: "New" },
  { value: "Assigned", label: "Assigned" },
  { value: "Accepted", label: "Accepted" },
  { value: "Approval Waiting", label: "Approval Waiting" },
  { value: "Approved", label: "Approved" },
  { value: "Deal done", label: "Deal done" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Completed", label: "Completed" },
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

];





// Add the edit-specific schema here.
// Note the simplification: .number({ required_error: ... }) is used for non-nullable required fields.
export const editLeadFormSchema = z.object({
  // Required fields
  supplier_id: z.number({ required_error: "Supplier Name is required." }),
  buyer_id: z.number({ required_error: "Buyer Name is required." }),
  product_id: z.number({ required_error: "Product Name is required." }),
  qty: z.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1."),
  product_status: z.string({ required_error: "Product Status is required." }).min(1, "Product Status is required."),

  // Optional fields (using .nullish() allows null/undefined and .optional() makes the key itself optional)
  product_spec_id: z.number().nullish().optional(),
  internal_remarks: z.string().nullish().optional(),
  price: z.number().nullish().optional(),
  color: z.string().nullish().optional(),
  dispatch_status: z.string().nullish().optional(),
  cartoon_type_id: z.number().nullish().optional(),
  device_condition: z.string().nullish().optional(),
  payment_term_id: z.number().nullish().optional(),
  location: z.string().nullish().optional(),
  eta: z.date().nullish().optional(),
  
  // Hidden fields required for the payload
  lead_intent: z.string(),
  lead_status: z.string(),
});

export type EditLeadFormData = z.infer<typeof editLeadFormSchema>;