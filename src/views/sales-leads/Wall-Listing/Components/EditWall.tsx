import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
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
import Spinner from "@/components/ui/Spinner"; // For loading state

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

// Re-using ApiWallItem and WallItem from WallListing for consistency in dummy data
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
  product_status: string;
  quantity: number;
  price: number;
  want_to: string;
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
  status: string;
  company_id_from_api?: string;
  cartoon_type_id?: number | null;
  device_condition?: string | null;
};
export type WallItem = {
  // This is the WallItem type used for form population after mapping
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
  product_status: string; // This is the API product_status (e.g. "available")
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
  created_date: Date; // Already Date object
  last_updated: Date; // Already Date object
  visibility: string;
  priority: string;
  assigned_to: string;
  inquiry_count: number;
  view_count: number;
  interaction_type: string;
  action: string;
  recordStatus?: WallRecordStatus;
  companyId?: string;
  cartoonTypeId?: number | null;
  deviceCondition?: WallProductCondition | null;
  // Form specific fields (potentially not in API item directly but derived or for UI)
  color?: string | null;
  eta?: string | null;
  location?: string | null;
  internalRemarks?: string | null;
  productId?: number | null;
  productSpecId?: number | null;
  customerId?: number | null;
  dispatchStatus?: string | null;
  paymentTermId?: number | null;
};

// --- Zod Schema for Edit Wall Item Form (Same as Add) ---
const wallItemFormSchema = z.object({
  // ... (same schema as in WallItemAdd.tsx)
  productId: z.number().nullable().optional(),
  productSpecId: z.number().nullable().optional(),
  companyId: z.string().nullable().optional(),
  customerId: z.number().nullable().optional(),
  qty: z
    .number({ required_error: "Quantity is required." })
    .min(0, "Quantity cannot be negative."),
  productStatus: z // This is the form's representation of product availability, e.g., "In Stock"
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
  // These are for the form's "Product Status (Stock)" field
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

// Dummy data source (replace with actual API call)
const initialDummyApiItems: ApiWallItem[] = [
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
    product_status: "available", // API field
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
    // ... other data for item 2
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
    status: "Pending",
    company_id_from_api: "COMP002",
    cartoon_type_id: null,
    device_condition: "Used",
  },
];

const WallItemEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToEdit, setItemToEdit] = useState<WallItem | null>(null);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
  });

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching data
    const itemId = parseInt(id || "", 10);
    const apiItem = initialDummyApiItems.find((item) => item.id === itemId);

    if (apiItem) {
      // Map ApiWallItem to WallItem (form data structure)
      const mappedItem: WallItem = {
        id: apiItem.id,
        listing_id: apiItem.listing_id,
        product_name: apiItem.product_name,
        company_name: apiItem.company_name,
        contact_person_name: apiItem.contact_person_name,
        contact_person_email: apiItem.contact_person_email,
        contact_person_phone: apiItem.contact_person_phone,
        product_category: apiItem.product_category,
        product_subcategory: apiItem.product_subcategory || "",
        product_description: apiItem.product_description || "",
        product_specs: apiItem.product_specs || "",
        product_status: apiItem.product_status, // This is the API's raw status like "available"
        quantity: apiItem.quantity,
        price: apiItem.price,
        want_to: apiItem.want_to as WallIntent,
        listing_type: apiItem.listing_type,
        shipping_options: apiItem.shipping_options || "",
        payment_method: apiItem.payment_method || "",
        warranty: apiItem.warranty || "",
        return_policy: apiItem.return_policy || "",
        listing_url: apiItem.listing_url || "",
        brand: apiItem.brand,
        product_images: apiItem.product_images || [],
        rating: apiItem.rating || 0,
        reviews_count: apiItem.reviews_count || 0,
        created_date: new Date(apiItem.created_date),
        last_updated: new Date(apiItem.last_updated),
        visibility: apiItem.visibility,
        priority: apiItem.priority,
        assigned_to: apiItem.assigned_to || "",
        inquiry_count: apiItem.inquiry_count,
        view_count: apiItem.view_count,
        interaction_type: apiItem.interaction_type || "",
        action: apiItem.action || "",
        recordStatus: apiItem.status as WallRecordStatus,
        companyId: apiItem.company_id_from_api,
        cartoonTypeId: apiItem.cartoon_type_id,
        deviceCondition:
          apiItem.device_condition as WallProductCondition | null,
        // Initialize other WallItem fields that might be in form but not directly in ApiItem
        // For example, if 'color' was a form field but not in ApiWallItem:
        // color: previouslySavedColor || null,
      };
      setItemToEdit(mappedItem);

      // Map to form values
      formMethods.reset({
        listing_id: mappedItem.listing_id,
        product_name: mappedItem.product_name,
        company_name: mappedItem.company_name,
        contact_person_name: mappedItem.contact_person_name,
        contact_person_email: mappedItem.contact_person_email,
        contact_person_phone: mappedItem.contact_person_phone,
        product_category: mappedItem.product_category,
        product_subcategory: mappedItem.product_subcategory,
        product_description: mappedItem.product_description,
        product_specs: mappedItem.product_specs,
        listing_type: mappedItem.listing_type,
        shipping_options: mappedItem.shipping_options,
        payment_method: mappedItem.payment_method,
        warranty: mappedItem.warranty,
        return_policy: mappedItem.return_policy,
        listing_url: mappedItem.listing_url,
        brand: mappedItem.brand,
        product_images: mappedItem.product_images || [],
        rating: mappedItem.rating,
        reviews_count: mappedItem.reviews_count,
        visibility: mappedItem.visibility,
        priority: mappedItem.priority,
        assigned_to: mappedItem.assigned_to,
        interaction_type: mappedItem.interaction_type,
        action: mappedItem.action,
        qty: mappedItem.quantity,
        price: mappedItem.price,
        intent: mappedItem.want_to as WallIntent, // Ensure this matches enum
        recordStatus: mappedItem.recordStatus || recordStatusOptions[0]?.value,
        // Map product_status (API's availability) to the form's productStatus field
        productStatus:
          productStatusOptions.find((opt) =>
            opt.label
              .toLowerCase()
              .includes(mappedItem.product_status?.toLowerCase() || "")
          )?.value || productStatusOptions[0]?.value,
        deviceCondition: mappedItem.deviceCondition,
        color: mappedItem.color,
        eta: mappedItem.eta,
        location: mappedItem.location,
        internalRemarks: mappedItem.internalRemarks,
        productId: mappedItem.productId || null,
        productSpecId: mappedItem.productSpecId || null,
        companyId: mappedItem.companyId || null,
        customerId: mappedItem.customerId || null,
        cartoonTypeId: mappedItem.cartoonTypeId,
        dispatchStatus: mappedItem.dispatchStatus || null,
        paymentTermId: mappedItem.paymentTermId || null,
      });
    } else {
      toast.push(
        <Notification title="Error" type="danger">
          Wall item not found.
        </Notification>
      );
      navigate(-1); // Or to a 404 page
    }
    setIsLoading(false);
  }, [id, navigate, formMethods]);

  const onFormSubmit = useCallback(
    async (data: WallItemFormData) => {
      if (!itemToEdit) return;
      setIsSubmitting(true);
      console.log("Form data to submit (Edit):", data);

      // Simulate API call
      await new Promise((res) => setTimeout(res, 1000));

      // In a real app, you would dispatch an action to update the item
      // e.g., dispatch(updateWallItem({ id: itemToEdit.id, ...data }));
      // For now, we'll just show a success message and navigate.
      // The WallListing page will not reflect this change with the current dummy data setup.

      toast.push(
        <Notification title="Success" type="success">
          Wall item updated. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      navigate(-1); // Go back to the listing page
    },
    [navigate, itemToEdit]
  );

  if (isLoading) {
    return (
      <Container className="h-full">
        <AdaptiveCard className="h-full flex justify-center items-center">
          <Spinner size={40} />
        </AdaptiveCard>
      </Container>
    );
  }

  if (!itemToEdit) {
    return (
      <Container className="h-full">
        <AdaptiveCard className="h-full flex justify-center items-center">
          <p>Item not found or failed to load.</p>
        </AdaptiveCard>
      </Container>
    );
  }

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/wall-listing">
          <h6 className="font-semibold hover:text-primary">Wall Listing</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Edit This Wall</h6>
      </div>
      <Card>
        <Form
          id="wallItemEditForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4">
            {/* Form fields are identical to WallItemAdd.tsx, pre-filled by formMethods.reset */}
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
          Save Changes
        </Button>
      </Card>
    </>
  );
};

export default WallItemEdit;
