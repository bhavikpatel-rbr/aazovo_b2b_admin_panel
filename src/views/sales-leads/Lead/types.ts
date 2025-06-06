import { z } from 'zod';
import dayjs from 'dayjs';

export type LeadStatus =
  | "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Negotiation"
  | "Follow Up" | "Lost" | "Won" | string;

export type EnquiryType =
  | "Product Info" | "Quote Request" | "Demo Request" | "Support"
  | "Partnership" | "Sourcing" | "Other" | string;

export type LeadIntent = "Buy" | "Sell" | "Inquire" | "Partner" | string;
export type ProductCondition = "New" | "Used" | "Refurbished" | string;

// This type might also need updating if your API response for LeadListItem changes.
// For now, focusing on LeadFormData as per the request.
export type LeadSourcingDetails = {
  supplierId?: string | number | null; // Potential rename to supplier_id if API changes
  productId?: number | null;           // Potential rename to product_id
  qty?: number | null;
  productStatus?: string | null;       // Potential rename to product_status
  productSpecId?: number | null;       // Potential rename to product_spec_id
  internalRemarks?: string | null;     // Potential rename to internal_remarks
  deviceType?: string | null;          // Potential rename to device_type
  price?: number | null;
  color?: string | null;
  cartoonTypeId?: number | null;       // Potential rename to cartoon_type_id
  dispatchStatus?: string | null;      // Potential rename to dispatch_status
  paymentTermId?: number | null;       // Potential rename to payment_term_id
  deviceCondition?: ProductCondition | null; // Potential rename to device_condition
  eta?: string | Date | null;
  location?: string | null;
};

export type LeadListItem = {
  id: string | number;
  leadNumber: string;                // Potential rename to lead_number
  status: LeadStatus;
  enquiryType: EnquiryType;          // Potential rename to enquiry_type
  productName?: string | null;       // Potential rename to product_name
  memberId: string;                  // Potential rename to member_id
  memberName?: string;               // Potential rename to member_name
  intent?: LeadIntent;
  qty?: number | null;
  targetPrice?: number | null;       // Potential rename to target_price
  salesPersonId?: string | number | null; // Potential rename to sales_person_id
  salesPersonName?: string | null;   // Potential rename to sales_person_name
  createdAt: Date;                   // Potential rename to created_at
  updatedAt?: Date;                  // Potential rename to updated_at
  sourcingDetails?: LeadSourcingDetails; // Renaming internal fields depends on LeadSourcingDetails changes
};

// Zod Schema for Add/Edit Lead Form (UPDATED)
export const leadFormSchemaObject = {
    member_id: z.string().nullable(),
    enquiry_type: z.string().min(1, "Enquiry type is required"),
    lead_intent: z.string().optional().nullable(),
    
    // This field was sourcing_productId and controlled "Product Name (Interest)*"
    product_id: z.number().nullable().optional(), 
    // This field was sourcing_productSpecId and controlled "Product Spec"
    product_spec_id: z.number().nullable().optional(), 

    qty: z.number().nullable().optional(),
    target_price: z.number().nullable().optional(),
    lead_status: z.string().min(1, "Lead status is required"),
    assigned_sales_person_id: z.string().nullable().optional(),

    // Sourcing Details fields (prefix "sourcing_" removed, "source_" used for distinction where needed)
    source_supplier_id: z.string().nullable().optional(), 
    source_qty: z.number().nullable().optional(), 
    source_price: z.number().nullable().optional(), 
    source_product_status: z.string().nullable().optional(), 
    source_device_condition: z.string().nullable().optional(), 
    source_device_type: z.string().nullable().optional(), 
    source_color: z.string().nullable().optional(), 
    source_cartoon_type_id: z.number().nullable().optional(), 
    source_dispatch_status: z.string().nullable().optional(), 
    source_payment_term_id: z.number().nullable().optional(), 
    source_eta: z.union([z.date(), z.string()]).nullable().optional()
      .transform(val => val ? (dayjs(val).isValid() ? dayjs(val).toDate() : val) : null),
    source_location: z.string().nullable().optional(), 
    source_internal_remarks: z.string().nullable().optional(), 
};

export const leadFormSchema = z.object(leadFormSchemaObject);
export type LeadFormData = z.infer<typeof leadFormSchema>;


// --- UI Constants for Selects (can be defined here or fetched) ---
export const leadStatusOptions: {value: LeadStatus, label: string}[] = [
  { value: "New", label: "New" }, { value: "Contacted", label: "Contacted" },
  { value: "Qualified", label: "Qualified" }, { value: "Proposal Sent", label: "Proposal Sent" },
  { value: "Negotiation", label: "Negotiation" }, { value: "Follow Up", label: "Follow Up" },
  { value: "Lost", label: "Lost" }, { value: "Won", label: "Won" },
];

export const enquiryTypeOptions: {value: EnquiryType, label: string}[] = [
  { value: "Wall Listing", label: "Wall Listing" },
  { value: "Manual Lead", label: "Manual Lead" },
  { value: "From Inquiry", label: "From Inquiry" },
  { value: "Other", label: "Other" },
];

export const leadIntentOptions: {value: LeadIntent, label: string}[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" },
  { value: "Both", label: "Both" },
];

export const deviceConditionOptions: {value: ProductCondition, label: string}[] = [
    { value: "New", label: "New" },
    { value: "Used", label: "Used" },
    { value: "Refurbished", label: "Refurbished" },
];