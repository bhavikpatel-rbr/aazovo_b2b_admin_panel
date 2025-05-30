// src/views/your-path/business-entities/WallItemEdit.tsx

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import Card from "@/components/ui/Card";
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
  DatePicker,
  Radio,
} from "@/components/ui";
import Spinner from "@/components/ui/Spinner";
import Container from "@/components/shared/Container";


// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// API data structure for fetching an item
export type ApiFetchedWallItem = {
  id: number;
  product_name: string;
  company_name: string;
  quantity: number;
  price: number | null;
  intent: WallIntent;
  product_status_from_api: string; 
  cartoon_type_id: number | null;
  internal_remarks: string | null;
  active_hours: string | null;
  product_spec_id: number | null;
  color: string | null;
  dispatch_status: string | null;
  dispatch_mode_from_api: string | null;
  payment_term_id: number | null;
  eta_from_api: string | null;
  device_condition_from_api: string | null;
  location: string | null;
  listing_type_from_api: string | null;
  visibility: string;
  priority_from_api: string | null;
  admin_status_from_api: string | null;
  assigned_team_id_from_api: number | null;
  product_url_from_api: string | null;
  warranty_info_from_api: string | null;
  return_policy_from_api: string | null;
  product_id_from_api?: number | null;
  customer_id_from_api?: number | null;
  // Add created_at if your API provides it, e.g., created_at_from_api: string | null;
};

// Zod Schema for Edit Wall Item Form (Identical to Add Form's schema)
const wallItemFormSchema = z.object({
  product_name: z.string().min(1, "Product Name is required."),
  company_name: z.string().min(1, "Company Name is required."),
  qty: z
    .number({ required_error: "Quantity is required." })
    .min(0, "Quantity cannot be negative."),
  price: z.number().min(0, "Price cannot be negative.").nullable().optional(),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, {
    required_error: "Intent (Want to) is required.",
  }),
  productStatus: z.string().min(1, "Product Status is required."),
  productSpecId: z.number().nullable().optional(),
  deviceCondition: z.string().min(1, "Device condition is required.").nullable(),
  color: z.string().max(50, "Color too long.").nullable().optional(),
  cartoonTypeId: z.number().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  dispatchMode: z.string().optional().nullable(),
  paymentTermId: z.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  listingType: z.string().min(1,"Listing Type is required.").optional().nullable(),
  visibility: z.string().min(1, "Visibility is required."),
  priority: z.string().min(1, "Priority is required.").optional().nullable(),
  adminStatus: z.string().min(1, "Admin Status is required.").optional().nullable(),
  assignedTeamId: z.number().nullable().optional(),
  activeHours: z.string().optional().nullable(),
  productUrl: z.string().url("Invalid URL format.").or(z.literal("")).optional().nullable(),
  warrantyInfo: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  internalRemarks: z.string().nullable().optional(),
  productId: z.number().nullable().optional(),
  customerId: z.number().nullable().optional(),
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// --- Form Options (Should be identical to Add form, ideally imported) ---
// In a real app, these would likely be imported from a shared constants file
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Exchange", label: "Exchange" }
];
const productStatusOptions: { value: string; label: string }[] = [
    // Values here should match what form expects/stores. Labels are for display.
    // The mapping from `product_status_from_api` (e.g., "in_stock") to these values is done in `useEffect`.
    { value: "In Stock", label: "In Stock" }, 
    { value: "Low Stock", label: "Low Stock" }, 
    { value: "Out of Stock", label: "Out of Stock" },
    { value: "Active", label: "Active" }, // Added for more generic product status
    { value: "In-Active", label: "In-Active" }, // Added for more generic product status
];
const dummyCartoonTypes: { id: number; name: string }[] = [
  { id: 1, name: "Master Carton" }, { id: 2, name: "Inner Carton" }, { id: 3, name: "Pallet" }
];
const dummyProductSpecsForSelect: { id: number; name: string }[] = [
  { id: 1, name: "iPhone 15 Pro Max - 256GB - Natural Titanium - US Spec" }, 
  { id: 2, name: "Samsung S24 Ultra - 512GB - Phantom Black - EU Spec" }, 
  { id: 3, name: "Google Pixel 8 Pro - 128GB - Obsidian - UK Spec" }
];
const dummyPaymentTerms: { id: number; name: string }[] = [
  { id: 1, name: "Net 30 Days" }, { id: 2, name: "Net 60 Days" }, { id: 3, name: "Due on Receipt" }, { id: 4, name: "Prepaid" }
];
const deviceConditionRadioOptions: { value: string; label: string }[] = [
  { value: "New", label: "New" }, { value: "Old", label: "Old" }
];
const visibilityOptions: { value: string; label: string }[] = [
  { value: 'public', label: 'Public' }, { value: 'internal', label: 'Internal' }
];
const priorityOptions: { value: string; label: string }[] = [
  { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }
];
const assignedTeamOptions: { value: number; label: string }[] = [
  { value: 1, label: 'Sales Team Alpha' }, { value: 2, label: 'Sales Team Beta' }, { value: 3, label: 'Support Team' }
];
const listingTypeOptions: { value: string; label: string }[] = [
  { value: 'Featured', label: 'Featured' }, { value: 'Regular', label: 'Regular' }
];
const dispatchModeOptions: { value: string; label: string }[] = [
  { value: 'Courier', label: 'Courier' }, { value: 'Pickup', label: 'Pickup' }, { value: 'Transport', label: 'Transport (Freight)' }, { value: 'Digital', label: 'Digital Delivery' }
];
const adminStatusOptions: { value: string; label: string }[] = [ // Maps to target `status`
  { value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }, { value: 'Active', label: 'Active' }
];


// Dummy data source
const initialDummyApiItems: ApiFetchedWallItem[] = [
  {
    id: 1,
    product_name: "Electric Drill XT5000 (Existing)",
    company_name: "ToolMaster Inc. (Existing)",
    quantity: 30,
    price: 159.99,
    intent: "Buy",
    product_status_from_api: "low_stock", // e.g. "low_stock" or "Low Stock"
    cartoon_type_id: 2,
    internal_remarks: "Edited remarks: Check stock levels for Drill.",
    active_hours: "8 AM - 7 PM Weekdays",
    product_spec_id: 2,
    color: "Red",
    dispatch_status: "Awaiting shipment",
    dispatch_mode_from_api: "Courier",
    payment_term_id: 2,
    eta_from_api: "2024-10-20",
    device_condition_from_api: "Old",
    location: "Main Warehouse, Section B",
    listing_type_from_api: "Featured",
    visibility: "internal",
    priority_from_api: "High",
    admin_status_from_api: "Approved",
    assigned_team_id_from_api: 1,
    product_url_from_api: "https://example.com/drill-xt5000",
    warranty_info_from_api: "2-year limited warranty by manufacturer.",
    return_policy_from_api: "30-day returns, buyer pays shipping.",
    product_id_from_api: 101,
    customer_id_from_api: 201,
  },
  // ... other items
];

const WallItemEdit = () => {
  const navigate = useNavigate();
  const { id: itemIdFromParams } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToEditApiData, setItemToEditApiData] = useState<ApiFetchedWallItem | null>(null);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    // Default values will be set by reset in useEffect
  });

  useEffect(() => {
    if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Invalid item ID.</Notification>);
        navigate(-1);
        return;
    }
    setIsLoading(true);
    const itemId = parseInt(itemIdFromParams, 10);
    
    // Simulate API fetch
    const fetchedApiItem = initialDummyApiItems.find(item => item.id === itemId);

    if (fetchedApiItem) {
      setItemToEditApiData(fetchedApiItem); // Store fetched data

      // Map API data to form data structure
      // For productStatus, find the option whose label loosely matches product_status_from_api
      const matchedProductStatusOption = productStatusOptions.find(opt => 
        opt.label.toLowerCase().replace(/[^a-z0-9]/gi, '') === 
        fetchedApiItem.product_status_from_api.toLowerCase().replace(/[^a-z0-9]/gi, '') ||
        opt.value.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        fetchedApiItem.product_status_from_api.toLowerCase().replace(/[^a-z0-9]/gi, '')
      );

      const formValues: WallItemFormData = {
        product_name: fetchedApiItem.product_name,
        company_name: fetchedApiItem.company_name,
        qty: fetchedApiItem.quantity,
        price: fetchedApiItem.price,
        intent: fetchedApiItem.intent,
        productStatus: matchedProductStatusOption?.value || productStatusOptions[0]?.value || '', // Fallback
        productSpecId: fetchedApiItem.product_spec_id,
        deviceCondition: fetchedApiItem.device_condition_from_api,
        color: fetchedApiItem.color,
        cartoonTypeId: fetchedApiItem.cartoon_type_id,
        dispatchStatus: fetchedApiItem.dispatch_status,
        dispatchMode: fetchedApiItem.dispatch_mode_from_api,
        paymentTermId: fetchedApiItem.payment_term_id,
        eta: fetchedApiItem.eta_from_api ? dayjs(fetchedApiItem.eta_from_api).toDate() : null,
        location: fetchedApiItem.location,
        listingType: fetchedApiItem.listing_type_from_api,
        visibility: fetchedApiItem.visibility,
        priority: fetchedApiItem.priority_from_api,
        adminStatus: fetchedApiItem.admin_status_from_api,
        assignedTeamId: fetchedApiItem.assigned_team_id_from_api,
        activeHours: fetchedApiItem.active_hours,
        productUrl: fetchedApiItem.product_url_from_api,
        warrantyInfo: fetchedApiItem.warranty_info_from_api,
        returnPolicy: fetchedApiItem.return_policy_from_api,
        internalRemarks: fetchedApiItem.internal_remarks,
        productId: fetchedApiItem.product_id_from_api,
        customerId: fetchedApiItem.customer_id_from_api,
      };
      formMethods.reset(formValues);
    } else {
      toast.push(<Notification title="Error" type="danger">Wall item not found.</Notification>);
      navigate("/sales-leads/wall-listing"); 
    }
    setIsLoading(false);
  }, [itemIdFromParams, navigate, formMethods]);

  const onFormSubmit = useCallback(
    async (formData: WallItemFormData) => {
      if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Item ID is missing.</Notification>);
        return;
      }
      setIsSubmitting(true);

      const productSpecDetails = formData.productSpecId
        ? dummyProductSpecsForSelect.find(spec => spec.id === formData.productSpecId)
        : null;
      
      const cartoonTypeDetails = formData.cartoonTypeId
        ? dummyCartoonTypes.find(ct => ct.id === formData.cartoonTypeId)
        : null;

      const loggedPayload: any = { ...formData }; // Start with all form data

      // Map and transform fields to match target JSON structure
      loggedPayload.id = parseInt(itemIdFromParams, 10);
      loggedPayload.product_id = formData.productId ? String(formData.productId) : null;
      loggedPayload.customer_id = formData.customerId ? String(formData.customerId) : null;
      loggedPayload.product_spec_id = formData.productSpecId ? String(formData.productSpecId) : null;
      loggedPayload.assigned_to = formData.assignedTeamId ? String(formData.assignedTeamId) : null;
      
      loggedPayload.want_to = formData.intent;
      loggedPayload.qty = String(formData.qty);
      loggedPayload.price = (formData.price !== null && formData.price !== undefined) ? String(formData.price) : "0";
      
      loggedPayload.status = formData.adminStatus; // Listing status (e.g. "Approved")
      loggedPayload.product_status = formData.productStatus; // Product's own stock status (e.g. "In Stock")
      loggedPayload.product_status_listing = null; // Or map if applicable
      loggedPayload.dispatch_status = formData.dispatchStatus;

      loggedPayload.color = formData.color;
      loggedPayload.device_condition = formData.deviceCondition;
      loggedPayload.product_specs = productSpecDetails ? productSpecDetails.name : null;

      loggedPayload.cartoon_type = cartoonTypeDetails ? cartoonTypeDetails.name : (formData.cartoonTypeId ? String(formData.cartoonTypeId) : null);
      loggedPayload.delivery_at = formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null;
      loggedPayload.location = formData.location;
      loggedPayload.shipping_options = formData.dispatchMode;

      loggedPayload.payment_term = formData.paymentTermId ? String(formData.paymentTermId) : "0";
      loggedPayload.visibility = formData.visibility;
      loggedPayload.priority = formData.priority;
      loggedPayload.active_hrs = formData.activeHours;
      loggedPayload.listing_url = formData.productUrl;
      
      loggedPayload.warranty = formData.warrantyInfo;
      // formData.returnPolicy is already in loggedPayload from the spread

      loggedPayload.internal_remarks = formData.internalRemarks;
      loggedPayload.notes = formData.internalRemarks; // Or map specifically if different

      // Default/Placeholder fields from target structure for an edit
      loggedPayload.opportunity_id = loggedPayload.opportunity_id ?? null;
      // ... (add other null-coalesced fields from target structure as in WallItemAdd if needed)
      loggedPayload.created_from = "FormUI-Edit"; 
      loggedPayload.source = itemToEditApiData?.source || "in"; // Preserve original source if available, else default
      loggedPayload.delivery_details = loggedPayload.delivery_details ?? null;
      loggedPayload.created_by = itemToEditApiData?.created_by || "1"; // Preserve original creator if available
      loggedPayload.expired_date = loggedPayload.expired_date ?? null;
      
      // For 'created_at', ideally, this would be the original creation timestamp.
      // Since dummy API doesn't provide it, we'll set it to null or a placeholder.
      // If itemToEditApiData had a 'created_at_from_api', you'd use that.
      loggedPayload.created_at = itemToEditApiData?.created_at_from_api || null; // Assuming 'created_at_from_api' might exist on ApiFetchedWallItem
      loggedPayload.updated_at = new Date().toISOString(); 
      
      loggedPayload.is_wall_manual = itemToEditApiData?.is_wall_manual || "0"; // Preserve original
      // ... (other preserved fields or defaults)

      // Nested Structures
      loggedPayload.product = {
          id: formData.productId,
          name: formData.product_name,
          description: null, 
          status: formData.productStatus, 
          // ... other product fields, possibly from itemToEditApiData.product if it existed
      };
      loggedPayload.product_spec = productSpecDetails ? { id: productSpecDetails.id, name: productSpecDetails.name } : null;
      loggedPayload.customer = {
          id: formData.customerId,
          name: formData.company_name,
          // ... other customer fields, possibly from itemToEditApiData.customer
      };
      loggedPayload.company = null; // Or populate if data exists

      console.log("--- WallItemEdit Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", formData);
      console.log("2. Item to Edit (API data used for form population):", itemToEditApiData);
      console.log("3. Constructed Payload (for API/logging - matches target structure, includes all form data):", loggedPayload);
      console.log("--- End WallItemEdit Form Submission Log ---");
      
      await new Promise(res => setTimeout(res, 1000)); // Simulate API call

      toast.push(<Notification title="Success" type="success">Wall item updated. (Simulated)</Notification>);
      setIsSubmitting(false);
      navigate("/sales-leads/wall-listing");
    },
    [navigate, itemIdFromParams, itemToEditApiData] // Added itemToEditApiData to dependencies
  );

  const handleCancel = () => {
    navigate("/sales-leads/wall-listing");
  };
  
  const handleSaveAsDraft = () => {
    if (!itemIdFromParams) return;
    const currentValues = formMethods.getValues();
    const draftData = {
        ...currentValues,
        id: parseInt(itemIdFromParams, 10),
        eta: currentValues.eta ? dayjs(currentValues.eta).format("YYYY-MM-DD") : null,
    };
    console.log("Saving as draft (Edit):", draftData);
    toast.push(<Notification title="Draft Saved" type="info">Changes saved as draft. (Simulated)</Notification>);
  };

  if (isLoading) {
    return (
      <Container> 
        <div className="flex justify-center items-center h-screen">
          <Spinner size={40} />
        </div>
      </Container>
    );
  }
  
  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/wall-listing">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className="font-semibold text-primary">Edit Wall Item (ID: {itemIdFromParams})</h6>
      </div>
      <Card>
        <Form
          id="wallItemEditForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit)}
          className="flex flex-col gap-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4 p-4">
            {/* Row 1 */}
            <FormItem
                label="Product Name"
                invalid={!!formMethods.formState.errors.product_name}
                errorMessage={formMethods.formState.errors.product_name?.message}
            >
                <Controller
                    name="product_name"
                    control={formMethods.control}
                    render={({ field }) => (
                        <UiSelect
                            options={dummyProductSpecsForSelect.map(spec => ({
                                value: spec.name, // Product name string as value
                                label: spec.name,
                            }))}
                            value={ // RHF value is a string, find the matching option object
                                dummyProductSpecsForSelect
                                    .map(spec => ({ value: spec.name, label: spec.name,}))
                                    .find(opt => opt.value === field.value) || null
                            }
                            onChange={option => field.onChange(option ? option.value : "")} // Send string value to RHF
                            placeholder="Select Product Name"
                            isClearable
                        />
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
                    render={({ field }) => {
                        // Options should ideally come from a dynamic source or include existing + dummy
                        const companyOptions = [
                            { value: "ToolMaster Inc. (Existing)", label: "ToolMaster Inc. (Existing)" },
                            { value: "BuildRight Supplies (Existing)", label: "BuildRight Supplies (Existing)" },
                            // Add other fetched company names or provide a way to add new ones
                            { value: "Acme Corp", label: "Acme Corp" },
                            { value: "Globex Inc", label: "Globex Inc" },
                        ];
                        return (
                            <UiSelect
                                options={companyOptions}
                                value={companyOptions.find(opt => opt.value === field.value) || null }
                                onChange={option => field.onChange(option ? option.value : "")}
                                placeholder="Select Company Name"
                                isClearable
                            />
                        );
                    }}
                />
            </FormItem>
            <FormItem
              label="Quantity"
              invalid={!!formMethods.formState.errors.qty}
              errorMessage={formMethods.formState.errors.qty?.message}
            >
              <Controller name="qty" control={formMethods.control} render={({ field }) => (<InputNumber {...field} placeholder="Enter Quantity" /> )} />
            </FormItem>

            {/* Row 2 */}
            <FormItem
              label="Price"
              invalid={!!formMethods.formState.errors.price}
              errorMessage={formMethods.formState.errors.price?.message}
            >
              <Controller name="price" control={formMethods.control} render={({ field }) => ( <InputNumber {...field} value={field.value ?? undefined} placeholder="Enter Price (Optional)" /> )} />
            </FormItem>
            <FormItem
              label="Intent (Want to)"
              invalid={!!formMethods.formState.errors.intent}
              errorMessage={formMethods.formState.errors.intent?.message}
            >
              <Controller name="intent" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={intentOptions} 
                    value={intentOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Intent" 
                /> 
              )}/>
            </FormItem>
            <FormItem
              label="Product Status (Stock)"
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller name="productStatus" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={productStatusOptions} 
                    value={productStatusOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Product Stock Status" 
                /> 
              )}/>
            </FormItem>

            {/* Row 3 - Product Spec, Device Condition, Color */}
            <FormItem
              label="Product Specification"
              invalid={!!formMethods.formState.errors.productSpecId}
              errorMessage={formMethods.formState.errors.productSpecId?.message}
            >
              <Controller name="productSpecId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyProductSpecsForSelect.map(spec => ({ value: spec.id, label: spec.name }))} 
                  value={dummyProductSpecsForSelect.map(spec => ({ value: spec.id, label: spec.name })).find(opt => opt.value === field.value) || null} 
                  onChange={(option) => field.onChange(option ? option.value : null)} 
                  placeholder="Select Product Specification (Optional)" 
                  isClearable/>
                )} />
            </FormItem>
            <FormItem
              label="Device Condition"
              invalid={!!formMethods.formState.errors.deviceCondition}
              errorMessage={formMethods.formState.errors.deviceCondition?.message}
            >
              <Controller name="deviceCondition" control={formMethods.control} render={({ field }) => (
                  <Radio.Group value={field.value} onChange={field.onChange}> {deviceConditionRadioOptions.map(opt => (<Radio key={opt.value} value={opt.value}>{opt.label}</Radio>))} </Radio.Group>
                )} />
            </FormItem>
            <FormItem
              label="Color"
              invalid={!!formMethods.formState.errors.color}
              errorMessage={formMethods.formState.errors.color?.message}
            >
              <Controller name="color" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value || ''} placeholder="Enter Color (Optional)" /> )} />
            </FormItem>
            
            {/* Row 4 - Cartoon Type, Dispatch Status, Dispatch Mode */}
            <FormItem
              label="Cartoon Type"
              invalid={!!formMethods.formState.errors.cartoonTypeId}
              errorMessage={formMethods.formState.errors.cartoonTypeId?.message}
            >
              <Controller name="cartoonTypeId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name, }))} 
                  value={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name })).find((opt) => opt.value === field.value) || null} 
                  onChange={(option) => field.onChange(option ? option.value : null)} 
                  placeholder="Select Cartoon Type (Optional)" 
                  isClearable/>
                )} />
            </FormItem>
            <FormItem
              label="Dispatch Status"
              invalid={!!formMethods.formState.errors.dispatchStatus}
              errorMessage={formMethods.formState.errors.dispatchStatus?.message}
            >
              <Controller name="dispatchStatus" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value || ''} placeholder="e.g., Ready to Ship (Optional)" /> )} />
            </FormItem>
            <FormItem
              label="Dispatch Mode"
              invalid={!!formMethods.formState.errors.dispatchMode}
              errorMessage={formMethods.formState.errors.dispatchMode?.message}
            >
              <Controller name="dispatchMode" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={dispatchModeOptions} 
                    value={dispatchModeOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Dispatch Mode (Optional)" 
                    isClearable/> 
              )}/>
            </FormItem>

            {/* Row 5 - Payment Term, ETA, Location */}
            <FormItem
              label="Payment Term"
              invalid={!!formMethods.formState.errors.paymentTermId}
              errorMessage={formMethods.formState.errors.paymentTermId?.message}
            >
              <Controller name="paymentTermId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyPaymentTerms.map(term => ({ value: term.id, label: term.name }))} 
                  value={dummyPaymentTerms.map(term => ({ value: term.id, label: term.name })).find(opt => opt.value === field.value) || null} 
                  onChange={(option) => field.onChange(option ? option.value : null)} 
                  placeholder="Select Payment Term (Optional)" 
                  isClearable/>
                )} />
            </FormItem>
            <FormItem
              label="ETA"
              invalid={!!formMethods.formState.errors.eta}
              errorMessage={formMethods.formState.errors.eta?.message}
            >
              <Controller name="eta" control={formMethods.control} render={({ field }) => ( <DatePicker {...field} value={field.value} onChange={(date) => field.onChange(date)} placeholder="Select ETA (Optional)" inputFormat="YYYY-MM-DD" /> )} />
            </FormItem>
            <FormItem
              label="Location"
              invalid={!!formMethods.formState.errors.location}
              errorMessage={formMethods.formState.errors.location?.message}
            >
              <Controller name="location" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value || ''} placeholder="Enter Location (Optional)" /> )} />
            </FormItem>

            {/* Row 6: Listing Type, Visibility, Priority */}
            <FormItem
              label="Listing Type"
              invalid={!!formMethods.formState.errors.listingType}
              errorMessage={formMethods.formState.errors.listingType?.message}
            >
              <Controller name="listingType" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={listingTypeOptions} 
                    value={listingTypeOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Listing Type" /> 
              )}/>
            </FormItem>
            <FormItem
              label="Visibility"
              invalid={!!formMethods.formState.errors.visibility}
              errorMessage={formMethods.formState.errors.visibility?.message}
            >
              <Controller name="visibility" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={visibilityOptions} 
                    value={visibilityOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Visibility" /> 
              )}/>
            </FormItem>
             <FormItem
              label="Priority"
              invalid={!!formMethods.formState.errors.priority}
              errorMessage={formMethods.formState.errors.priority?.message}
            >
              <Controller name="priority" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={priorityOptions} 
                    value={priorityOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Priority (Optional)" 
                    isClearable/> 
              )}/>
            </FormItem>

            {/* Row 7: Admin Status, Assigned Team, Active Hours */}
            <FormItem
              label="Admin Status"
              invalid={!!formMethods.formState.errors.adminStatus}
              errorMessage={formMethods.formState.errors.adminStatus?.message}
            >
              <Controller name="adminStatus" control={formMethods.control} render={({ field }) => ( 
                <UiSelect 
                    options={adminStatusOptions} 
                    value={adminStatusOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Admin Status" /> 
              )}/>
            </FormItem>
            <FormItem
              label="Assigned Team"
              invalid={!!formMethods.formState.errors.assignedTeamId}
              errorMessage={formMethods.formState.errors.assignedTeamId?.message}
            >
              <Controller name="assignedTeamId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={assignedTeamOptions.map(team => ({ value: team.value, label: team.label }))} 
                  value={assignedTeamOptions.map(team => ({value: team.value, label: team.label})).find(opt => opt.value === field.value) || null} 
                  onChange={opt => field.onChange(opt ? opt.value : null)} 
                  placeholder="Select Assigned Team (Optional)" 
                  isClearable/>
                )} />
            </FormItem>
             <FormItem
              label="Active Hours"
              invalid={!!formMethods.formState.errors.activeHours}
              errorMessage={formMethods.formState.errors.activeHours?.message}
            >
              <Controller name="activeHours" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value || ''} placeholder="e.g., 9 AM - 5 PM, 24/7 (Optional)" /> )} />
            </FormItem>
            
            {/* Row 8: URL and Policies */}
             <FormItem
              label="Product URL"
              className="md:col-span-1"
              invalid={!!formMethods.formState.errors.productUrl}
              errorMessage={formMethods.formState.errors.productUrl?.message}
            >
              <Controller name="productUrl" control={formMethods.control} render={({ field }) => ( <Input type="url" {...field} value={field.value || ''} placeholder="https://example.com/product (Optional)" /> )} />
            </FormItem>
            <FormItem
              label="Warranty Info"
              className="md:col-span-2" 
              invalid={!!formMethods.formState.errors.warrantyInfo}
              errorMessage={formMethods.formState.errors.warrantyInfo?.message}
            >
              <Controller name="warrantyInfo" control={formMethods.control} render={({ field }) => ( <Input textArea {...field} value={field.value || ""} rows={2} placeholder="Enter warranty details (Optional)" /> )} />
            </FormItem>
            
            <FormItem
              label="Return Policy"
              className="md:col-span-3" 
              invalid={!!formMethods.formState.errors.returnPolicy}
              errorMessage={formMethods.formState.errors.returnPolicy?.message}
            >
              <Controller name="returnPolicy" control={formMethods.control} render={({ field }) => ( <Input textArea {...field} value={field.value || ""} rows={3} placeholder="Enter return policy (Optional)" /> )} />
            </FormItem>


            <FormItem
              label="Internal Remarks"
              className="md:col-span-3"
              invalid={!!formMethods.formState.errors.internalRemarks}
              errorMessage={
                formMethods.formState.errors.internalRemarks?.message
              }
            >
              <Controller name="internalRemarks" control={formMethods.control} render={({ field }) => ( <Input textArea {...field} value={field.value || ""} rows={3} placeholder="Internal notes for this listing (Optional)" /> )} />
            </FormItem>
          </div>
        </Form>
      </Card>
      
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting} > Cancel </Button>
        <Button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting} variant="twoTone"> Draft </Button>
        <Button type="submit" form="wallItemEditForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid} >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemEdit;