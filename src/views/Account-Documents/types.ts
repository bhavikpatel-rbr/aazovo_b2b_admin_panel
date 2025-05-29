// src/views/sales-AccountDocuments/types.ts
import { z } from 'zod';
import dayjs from 'dayjs';

export type AccountDocumentStatus =
  | "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Negotiation"
  | "Follow Up" | "Lost" | "Won" | string;

export type EnquiryType =
  | "Product Info" | "Quote Request" | "Demo Request" | "Support"
  | "Partnership" | "Sourcing" | "Other" | string;

export type AccountDocumentIntent = "Buy" | "Sell" | "Inquire" | "Partner" | string;
export type ProductCondition = "New" | "Used" | "Refurbished" | string;

export type AccountDocumentSourcingDetails = {
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

export interface AccountDocumentListItem {
  status: string;
  leadNumber: string;
  enquiryType: string;
  memberName: string;
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  companyDocumentType: string;
  documentType: string;
  documentNumber: string;
  invoiceNumber: string;
  formType: string;
  createdAt: string;
}


// Zod Schema for Add/Edit AccountDocument Form
export const AccountDocumentFormSchemaObject = {
    memberId: z.string().min(1, "Member is required"),
    enquiryType: z.string().min(1, "Enquiry type is required"),
    AccountDocumentIntent: z.string().optional().nullable(),
    productName: z.string().optional().nullable(),
    qty: z.number().nullable().optional(),
    targetPrice: z.number().nullable().optional(),
    AccountDocumentStatus: z.string().min(1, "AccountDocument status is required"),
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

export const AccountDocumentFormSchema = z.object(AccountDocumentFormSchemaObject);
export type AccountDocumentFormData = z.infer<typeof AccountDocumentFormSchema>;


// --- UI Constants for Selects (can be defined here or fetched) ---
export const AccountDocumentStatusOptions: {value: AccountDocumentStatus, label: string}[] = [
  { value: "New", label: "New" }, { value: "Contacted", label: "Contacted" },
  { value: "Qualified", label: "Qualified" }, { value: "Proposal Sent", label: "Proposal Sent" },
  { value: "Negotiation", label: "Negotiation" }, { value: "Follow Up", label: "Follow Up" },
  { value: "Lost", label: "Lost" }, { value: "Won", label: "Won" },
];

export const enquiryTypeOptions: {value: EnquiryType, label: string}[] = [
  { value: "Wall Listing", label: "Wall Listing" },
  { value: "Manual AccountDocument", label: "Manual AccountDocument" },
  { value: "From Inquiry", label: "From Inquiry" },
  { value: "Other", label: "Other" },
  // { value: "Product Info", label: "Product Info" }, { value: "Quote Request", label: "Quote Request" },
  // { value: "Demo Request", label: "Demo Request" }, { value: "Support", label: "Support" },
  // { value: "Partnership", label: "Partnership" }, { value: "Sourcing", label: "Sourcing" },
];

export const AccountDocumentIntentOptions: {value: AccountDocumentIntent, label: string}[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" },
  { value: "Both", label: "Both" },
];

export const deviceConditionOptions: {value: ProductCondition, label: string}[] = [
    { value: "New", label: "New" },
    { value: "Used", label: "Used" },
    { value: "Refurbished", label: "Refurbished" },
];
// Add other select options (suppliers, products, salespersons, etc.) here or fetch them.