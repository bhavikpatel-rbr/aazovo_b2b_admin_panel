import { z } from "zod";

// Shared options
export const leadIntentOptions = [ { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, ];
export const baseDeviceConditionOptions = [ { value: "New", label: "New" }, { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }, ];

// Main schema for the lead form
export const leadFormSchema = z.object({
    member_id: z.number({ required_error: "Lead Member is required." }).nullable(),
    lead_intent: z.enum(["Buy", "Sell"], { required_error: "Lead Intent is required." }).nullable(),
    product_id: z.number({ required_error: "Product is required." }).nullable(),
    product_spec_id: z.number().nullable().optional(),
    qty: z.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1").nullable(),
    target_price: z.number().nullable().optional(),
    lead_status: z.string({ required_error: "Lead Status is required." }),
    source_supplier_id: z.number({ required_error: "Source Member is required." }).nullable(),
    source_qty: z.number().nullable().optional(),
    source_price: z.number().nullable().optional(),
    source_product_status: z.string().nullable().optional(),
    source_device_condition: z.string().nullable().optional(),
    source_device_type: z.string().nullable().optional(),
    source_color: z.string().nullable().optional(),
    source_cartoon_type_id: z.number().nullable().optional(),
    source_dispatch_status: z.string().nullable().optional(),
    source_payment_term_id: z.number().nullable().optional(),
    source_eta: z.date().nullable().optional(),
    source_location: z.string().nullable().optional(),
    source_internal_remarks: z.string().nullable().optional(),
});

// Infer the type from the schema
export type LeadFormData = z.infer<typeof leadFormSchema>;