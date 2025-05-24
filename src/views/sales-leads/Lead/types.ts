// src/views/sales-leads/types.ts
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

export type LeadSourcingDetails = {
  supplierId?: string | number | null;
  productId?: number | null;
  qty?: number | null;
  productStatus?: string | null;
  productSpecId?: number | null;
  internalRemarks?: string | null;
  deviceType?: string | null;
  price?: number | null;
  color?: string | null;
  cartoonTypeId?: number | null;
  dispatchStatus?: string | null;
  paymentTermId?: number | null;
  deviceCondition?: ProductCondition | null;
  eta?: string | Date | null;
  location?: string | null;
};

export type LeadListItem = {
  id: string | number;
  leadNumber: string;
  status: LeadStatus;
  enquiryType: EnquiryType;
  productName?: string | null;
  memberId: string;
  memberName?: string;
  intent?: LeadIntent;
  qty?: number | null;
  targetPrice?: number | null;
  salesPersonId?: string | number | null;
  salesPersonName?: string | null;
  createdAt: Date; // Store as Date object in client state
  updatedAt?: Date;
  sourcingDetails?: LeadSourcingDetails;
};

// Zod Schema for Add/Edit Lead Form
export const leadFormSchemaObject = {
    memberId: z.string().min(1, "Member is required"),
    enquiryType: z.string().min(1, "Enquiry type is required"),
    leadIntent: z.string().optional().nullable(),
    productName: z.string().optional().nullable(),
    qty: z.number().nullable().optional(),
    targetPrice: z.number().nullable().optional(),
    leadStatus: z.string().min(1, "Lead status is required"),
    assignedSalesPersonId: z.string().nullable().optional(),

    sourcing_supplierId: z.string().nullable().optional(),
    sourcing_productId: z.number().nullable().optional(),
    sourcing_productSpecId: z.number().nullable().optional(),
    sourcing_qty: z.number().nullable().optional(),
    sourcing_price: z.number().nullable().optional(),
    sourcing_productStatus: z.string().nullable().optional(),
    sourcing_deviceCondition: z.string().nullable().optional(),
    sourcing_deviceType: z.string().nullable().optional(),
    sourcing_color: z.string().nullable().optional(),
    sourcing_cartoonTypeId: z.number().nullable().optional(),
    sourcing_dispatchStatus: z.string().nullable().optional(),
    sourcing_paymentTermId: z.number().nullable().optional(),
    sourcing_eta: z.union([z.date(), z.string()]).nullable().optional()
      .transform(val => val ? (dayjs(val).isValid() ? dayjs(val).toDate() : val) : null), // Ensure it's Date for DatePicker
    sourcing_location: z.string().nullable().optional(),
    sourcing_internalRemarks: z.string().nullable().optional(),
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
  { value: "Product Info", label: "Product Info" }, { value: "Quote Request", label: "Quote Request" },
  { value: "Demo Request", label: "Demo Request" }, { value: "Support", label: "Support" },
  { value: "Partnership", label: "Partnership" }, { value: "Sourcing", label: "Sourcing" },
  { value: "Other", label: "Other" },
];

export const leadIntentOptions: {value: LeadIntent, label: string}[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" },
  { value: "Inquire", label: "Inquire" }, { value: "Partner", label: "Partner" },
];

export const deviceConditionOptions: {value: ProductCondition, label: string}[] = [
    { value: "New", label: "New" },
    { value: "Used", label: "Used" },
    { value: "Refurbished", label: "Refurbished" },
];
// Add other select options (suppliers, products, salespersons, etc.) here or fetch them.