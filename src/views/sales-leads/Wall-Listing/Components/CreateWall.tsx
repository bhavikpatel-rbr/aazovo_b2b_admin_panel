import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import Card from "@/components/ui/Card";
import { NavLink } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import InputNumber from "@/components/ui/Input/InputNumber";
import {
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  // DatePicker, // Add if date pickers are needed in the form
} from "@/components/ui";
import Textarea from "@/views/ui-components/forms/Input/Textarea"; // Assuming path is correct

// Types (Copied from WallListing or a shared types file)
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
  // Simplified for this example, real app would use full type
  id: number;
  listing_id: string;
  product_name: string;
  company_name: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  product_category: string;
  product_subcategory?: string;
  product_description?: string;
  product_specs?: string;
  product_status: string;
  quantity: number;
  price: number;
  want_to: string;
  listing_type: string;
  shipping_options?: string;
  payment_method?: string;
  warranty?: string;
  return_policy?: string;
  listing_url?: string;
  brand: string;
  product_images: string[];
  rating?: number;
  reviews_count?: number;
  created_date: string;
  last_updated: string;
  visibility: string;
  priority: string;
  assigned_to?: string;
  inquiry_count: number;
  view_count: number;
  interaction_type?: string;
  action?: string;
  status: string;
  company_id_from_api?: string;
  cartoon_type_id?: number | null;
  device_condition?: string | null;
};

// --- Zod Schema for Add Wall Item Form ---
const wallItemFormSchema = z.object({
  productId: z.number().nullable().optional(),
  productSpecId: z.number().nullable().optional(),
  companyId: z.string().nullable().optional(),
  customerId: z.number().nullable().optional(),
  qty: z
    .number({ required_error: "Quantity is required." })
    .min(0, "Quantity cannot be negative."),
  productStatus: z
    .string()
    .min(1, "Product Status (e.g. In Stock) is required."),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, {
    required_error: "Intent (Want to) is required.",
  }),
  recordStatus: z.string().min(1, "Record Status (e.g. Pending) is required."),
  price: z.number().min(0, "Price cannot be negative.").nullable().optional(),
  color: z.string().max(50, "Color too long.").nullable().optional(),
  cartoonTypeId: z.number().nullable().optional(),
  dispatchStatus: z
    .string()
    .max(100, "Dispatch status too long.")
    .nullable()
    .optional(),
  paymentTermId: z.number().nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  eta: z.string().max(100, "ETA details too long.").nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  internalRemarks: z.string().nullable().optional(),
  listing_id: z.string().min(1, "Listing ID is required."),
  product_name: z.string().min(1, "Product Name is required."),
  company_name: z.string().min(1, "Company Name is required."),
  contact_person_name: z.string().min(1, "Contact Person Name is required."),
  contact_person_email: z
    .string()
    .email("Invalid email.")
    .min(1, "Email is required."),
  contact_person_phone: z.string().min(1, "Phone is required."),
  product_category: z.string().min(1, "Product Category is required."),
  product_subcategory: z.string().optional().nullable(),
  product_description: z.string().optional().nullable(),
  product_specs: z.string().optional().nullable(),
  listing_type: z.string().min(1, "Listing Type is required."),
  shipping_options: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  warranty: z.string().optional().nullable(),
  return_policy: z.string().optional().nullable(),
  listing_url: z
    .string()
    .url("Invalid URL.")
    .or(z.literal(""))
    .optional()
    .nullable(),
  brand: z.string().min(1, "Brand is required."),
  product_images: z
    .array(z.string().url("Invalid image URL.").or(z.literal("")))
    .optional()
    .default([]),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviews_count: z.number().min(0).optional().nullable(),
  visibility: z.string().min(1, "Visibility is required."),
  priority: z.string().min(1, "Priority is required."),
  assigned_to: z.string().optional().nullable(),
  interaction_type: z.string().optional().nullable(),
  action: z.string().optional().nullable(),
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// --- Form Options (Copied or imported) ---
const recordStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  // ... add other statuses
];
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Exchange", label: "Exchange" },
];
const productStatusOptions = [
  { value: "In Stock", label: "In Stock" },
  { value: "Low Stock", label: "Low Stock" },
  { value: "Out of Stock", label: "Out of Stock" },
];
const deviceConditionOptions = [
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Refurbished", label: "Refurbished" },
];
const dummyCartoonTypes = [
  { id: 1, name: "Master Carton" },
  { id: 2, name: "Inner Carton" },
];
// Add dummyProducts, dummyCompanies etc. if needed for Select dropdowns in the form

const WallItemAdd = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    defaultValues: {
      listing_id: `LIST-${Date.now().toString().slice(-6)}`,
      product_name: "",
      company_name: "",
      contact_person_name: "",
      contact_person_email: "",
      contact_person_phone: "",
      product_category: "",
      brand: "",
      listing_type: "standard",
      visibility: "public",
      priority: "medium",
      product_images: [],
      qty: 1,
      price: null,
      productStatus: productStatusOptions[0]?.value,
      intent: "Sell",
      recordStatus: recordStatusOptions[0]?.value,
      // Initialize other fields as needed
    },
  });

  const onFormSubmit = useCallback(
    async (data: WallItemFormData) => {
      setIsSubmitting(true);
      console.log("Form data to submit (Add):", data);

      // Simulate API call
      await new Promise((res) => setTimeout(res, 1000));

      // In a real app, you would dispatch an action to add the item to your backend/store
      // e.g., dispatch(addWallItem(data));
      // For now, we'll just show a success message and navigate.
      // The WallListing page will not reflect this change with the current dummy data setup.

      toast.push(
        <Notification title="Success" type="success">
          Wall item added. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      navigate(-1); // Go back to the listing page
    },
    [navigate]
  );

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/wall-listing">
          <h6 className="font-semibold hover:text-primary">Wall Listing</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Add New Wall</h6>
      </div>
      <Card>
        <Form
          id="wallItemAddForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {/* --- Basic Info --- */}
            <FormItem
              label="Listing ID"
              invalid={!!formMethods.formState.errors.listing_id}
              errorMessage={formMethods.formState.errors.listing_id?.message}
            >
              <Controller
                name="listing_id"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Listing ID" />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Name"
              invalid={!!formMethods.formState.errors.product_name}
              errorMessage={formMethods.formState.errors.product_name?.message}
            >
              <Controller
                name="product_name"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Product Name" />
                )}
              />
            </FormItem>
            <FormItem
              label="Company Name"
              invalid={!!formMethods.formState.errors.company_name}
              errorMessage={formMethods.formState.errors.company_name?.message}
            >
              <Controller
                name="company_name"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Company Name" />
                )}
              />
            </FormItem>
            <FormItem
              label="Company ID (Optional)"
              invalid={!!formMethods.formState.errors.companyId}
              errorMessage={formMethods.formState.errors.companyId?.message}
            >
              <Controller
                name="companyId"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Company ID"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Brand"
              invalid={!!formMethods.formState.errors.brand}
              errorMessage={formMethods.formState.errors.brand?.message}
            >
              <Controller
                name="brand"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Brand" />
                )}
              />
            </FormItem>

            {/* --- Contact Info --- */}
            <FormItem
              label="Contact Person"
              invalid={!!formMethods.formState.errors.contact_person_name}
              errorMessage={
                formMethods.formState.errors.contact_person_name?.message
              }
            >
              <Controller
                name="contact_person_name"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Contact Person Name" />
                )}
              />
            </FormItem>
            <FormItem
              label="Contact Email"
              invalid={!!formMethods.formState.errors.contact_person_email}
              errorMessage={
                formMethods.formState.errors.contact_person_email?.message
              }
            >
              <Controller
                name="contact_person_email"
                control={formMethods.control}
                render={({ field }) => (
                  <Input type="email" {...field} placeholder="Contact Email" />
                )}
              />
            </FormItem>
            <FormItem
              label="Contact Phone"
              invalid={!!formMethods.formState.errors.contact_person_phone}
              errorMessage={
                formMethods.formState.errors.contact_person_phone?.message
              }
            >
              <Controller
                name="contact_person_phone"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Contact Phone" />
                )}
              />
            </FormItem>

            {/* --- Product Details --- */}
            <FormItem
              label="Product Category"
              invalid={!!formMethods.formState.errors.product_category}
              errorMessage={
                formMethods.formState.errors.product_category?.message
              }
            >
              <Controller
                name="product_category"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Product Category" />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Subcategory"
              invalid={!!formMethods.formState.errors.product_subcategory}
              errorMessage={
                formMethods.formState.errors.product_subcategory?.message
              }
            >
              <Controller
                name="product_subcategory"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Product Subcategory (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Quantity"
              invalid={!!formMethods.formState.errors.qty}
              errorMessage={formMethods.formState.errors.qty?.message}
            >
              <Controller
                name="qty"
                control={formMethods.control}
                render={({ field }) => (
                  <InputNumber {...field} placeholder="Enter Quantity" />
                )}
              />
            </FormItem>
            <FormItem
              label="Price"
              invalid={!!formMethods.formState.errors.price}
              errorMessage={formMethods.formState.errors.price?.message}
            >
              <Controller
                name="price"
                control={formMethods.control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    placeholder="Enter Price (Optional)"
                  />
                )}
              />
            </FormItem>

            {/* --- Status & Intent --- */}
            <FormItem
              label="Intent (Want to)"
              invalid={!!formMethods.formState.errors.intent}
              errorMessage={formMethods.formState.errors.intent?.message}
            >
              <Controller
                name="intent"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={intentOptions}
                    {...field}
                    placeholder="Select Intent"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Record Status (Admin)"
              invalid={!!formMethods.formState.errors.recordStatus}
              errorMessage={formMethods.formState.errors.recordStatus?.message}
            >
              <Controller
                name="recordStatus"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={recordStatusOptions}
                    {...field}
                    placeholder="Select Record Status"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Status (Stock)"
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller
                name="productStatus"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={productStatusOptions}
                    {...field}
                    placeholder="Select Product Status"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Device Condition"
              invalid={!!formMethods.formState.errors.deviceCondition}
              errorMessage={
                formMethods.formState.errors.deviceCondition?.message
              }
            >
              <Controller
                name="deviceCondition"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={deviceConditionOptions}
                    {...field}
                    value={
                      deviceConditionOptions.find(
                        (opt) => opt.value === field.value
                      ) || null
                    }
                    onChange={(option) =>
                      field.onChange(option ? option.value : null)
                    }
                    placeholder="Select Device Condition (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Cartoon Type"
              invalid={!!formMethods.formState.errors.cartoonTypeId}
              errorMessage={formMethods.formState.errors.cartoonTypeId?.message}
            >
              <Controller
                name="cartoonTypeId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummyCartoonTypes.map((ct) => ({
                      value: ct.id,
                      label: ct.name,
                    }))}
                    {...field}
                    value={
                      dummyCartoonTypes
                        .map((ct) => ({ value: ct.id, label: ct.name }))
                        .find((opt) => opt.value === field.value) || null
                    }
                    onChange={(option) =>
                      field.onChange(option ? option.value : null)
                    }
                    placeholder="Select Cartoon Type (Optional)"
                  />
                )}
              />
            </FormItem>

            {/* --- Listing Config --- */}
            <FormItem
              label="Listing Type"
              invalid={!!formMethods.formState.errors.listing_type}
              errorMessage={formMethods.formState.errors.listing_type?.message}
            >
              <Controller
                name="listing_type"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., featured, standard" />
                )}
              />
            </FormItem>
            <FormItem
              label="Visibility"
              invalid={!!formMethods.formState.errors.visibility}
              errorMessage={formMethods.formState.errors.visibility?.message}
            >
              <Controller
                name="visibility"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., public, private" />
                )}
              />
            </FormItem>
            <FormItem
              label="Priority"
              invalid={!!formMethods.formState.errors.priority}
              errorMessage={formMethods.formState.errors.priority?.message}
            >
              <Controller
                name="priority"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., high, medium, low" />
                )}
              />
            </FormItem>
            <FormItem
              label="Assigned To"
              invalid={!!formMethods.formState.errors.assigned_to}
              errorMessage={formMethods.formState.errors.assigned_to?.message}
            >
              <Controller
                name="assigned_to"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Assigned team/person (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Listing URL"
              invalid={!!formMethods.formState.errors.listing_url}
              errorMessage={formMethods.formState.errors.listing_url?.message}
            >
              <Controller
                name="listing_url"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    type="url"
                    {...field}
                    value={field.value || ""}
                    placeholder="https://example.com/listing (Optional)"
                  />
                )}
              />
            </FormItem>

            {/* --- Metrics --- */}
            <FormItem
              label="Rating (0-5)"
              invalid={!!formMethods.formState.errors.rating}
              errorMessage={formMethods.formState.errors.rating?.message}
            >
              <Controller
                name="rating"
                control={formMethods.control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    min={0}
                    max={5}
                    step={0.1}
                    placeholder="Rating (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Reviews Count"
              invalid={!!formMethods.formState.errors.reviews_count}
              errorMessage={formMethods.formState.errors.reviews_count?.message}
            >
              <Controller
                name="reviews_count"
                control={formMethods.control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value ?? undefined}
                    min={0}
                    placeholder="Number of Reviews (Optional)"
                  />
                )}
              />
            </FormItem>

            {/* --- Descriptions & Policies (col-span-2) --- */}
            <FormItem
              label="Product Description"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.product_description}
              errorMessage={
                formMethods.formState.errors.product_description?.message
              }
            >
              <Controller
                name="product_description"
                control={formMethods.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    rows={3}
                    placeholder="Detailed product description (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Specifications"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.product_specs}
              errorMessage={formMethods.formState.errors.product_specs?.message}
            >
              <Controller
                name="product_specs"
                control={formMethods.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    rows={3}
                    placeholder="Technical specifications (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Images (comma-separated URLs)"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.product_images}
              errorMessage={formMethods.formState.errors.product_images?.message?.toString()}
            >
              <Controller
                name="product_images"
                control={formMethods.control}
                render={({ field }) => (
                  <Textarea
                    value={
                      Array.isArray(field.value) ? field.value.join(", ") : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s)
                      )
                    }
                    rows={2}
                    placeholder="https://img1.com/a.jpg, https://img2.com/b.png (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Shipping Options"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.shipping_options}
              errorMessage={
                formMethods.formState.errors.shipping_options?.message
              }
            >
              <Controller
                name="shipping_options"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="e.g., Courier, Local Pickup (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Payment Methods"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.payment_method}
              errorMessage={
                formMethods.formState.errors.payment_method?.message
              }
            >
              <Controller
                name="payment_method"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="e.g., Online, COD (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Warranty"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.warranty}
              errorMessage={formMethods.formState.errors.warranty?.message}
            >
              <Controller
                name="warranty"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="e.g., 1 Year Manufacturer Warranty (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Return Policy"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.return_policy}
              errorMessage={formMethods.formState.errors.return_policy?.message}
            >
              <Controller
                name="return_policy"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="e.g., 7 Days Return (Optional)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Internal Remarks"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.internalRemarks}
              errorMessage={
                formMethods.formState.errors.internalRemarks?.message
              }
            >
              <Controller
                name="internalRemarks"
                control={formMethods.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    rows={3}
                    placeholder="Internal notes for this listing (Optional)"
                  />
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Card>
      {/* Footer with Save and Cancel buttons */}
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" className="px-4 py-2">
          Cancel
        </Button>
        <Button type="button" className="px-4 py-2">
          Draft
        </Button>
        <Button type="submit" className="px-4 py-2" variant="solid">
          Save
        </Button>
      </Card>
    </>
  );
};

export default WallItemAdd;
