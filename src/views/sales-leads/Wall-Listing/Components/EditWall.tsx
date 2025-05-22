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
  // contact_person_name removed for consistency with Add form
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
  product_id_from_api?: number | null; // Optional, if linked
  customer_id_from_api?: number | null; // Optional, if linked
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
const intentOptions: { value: WallIntent; label: string }[] = [];
const productStatusOptions: { value: string; label: string }[] = [];
const dummyCartoonTypes: { id: number; name: string }[] = [];
const dummyProductSpecsForSelect: { id: number; name: string }[] = [];
const dummyPaymentTerms: { id: number; name: string }[] = [];
const deviceConditionRadioOptions: { value: string; label: string }[] = [];
const visibilityOptions: { value: string; label: string }[] = [];
const priorityOptions: { value: string; label: string }[] = [];
const assignedTeamOptions: { value: number; label: string }[] = [];
const listingTypeOptions: { value: string; label: string }[] = [];
const dispatchModeOptions: { value: string; label: string }[] = [];
const adminStatusOptions: { value: string; label: string }[] = [];

// Populate options (copied from Add form for brevity)
intentOptions.push({ value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Exchange", label: "Exchange" });
productStatusOptions.push({ value: "In Stock", label: "In Stock" }, { value: "Low Stock", label: "Low Stock" }, { value: "Out of Stock", label: "Out of Stock" });
dummyCartoonTypes.push({ id: 1, name: "Master Carton" }, { id: 2, name: "Inner Carton" }, { id: 3, name: "Pallet" });
dummyProductSpecsForSelect.push({ id: 1, name: "iPhone 15 Pro Max - 256GB - Natural Titanium - US Spec" }, { id: 2, name: "Samsung S24 Ultra - 512GB - Phantom Black - EU Spec" }, { id: 3, name: "Google Pixel 8 Pro - 128GB - Obsidian - UK Spec" });
dummyPaymentTerms.push({ id: 1, name: "Net 30 Days" }, { id: 2, name: "Net 60 Days" }, { id: 3, name: "Due on Receipt" }, { id: 4, name: "Prepaid" });
deviceConditionRadioOptions.push({ value: "New", label: "New" }, { value: "Old", label: "Old" });
visibilityOptions.push({ value: 'public', label: 'Public' }, { value: 'internal', label: 'Internal' });
priorityOptions.push({ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' });
assignedTeamOptions.push({ value: 1, label: 'Sales Team Alpha' }, { value: 2, label: 'Sales Team Beta' }, { value: 3, label: 'Support Team' });
listingTypeOptions.push({ value: 'Featured', label: 'Featured' }, { value: 'Regular', label: 'Regular' });
dispatchModeOptions.push({ value: 'Courier', label: 'Courier' }, { value: 'Pickup', label: 'Pickup' }, { value: 'Transport', label: 'Transport (Freight)' }, { value: 'Digital', label: 'Digital Delivery' });
adminStatusOptions.push({ value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' });


// Dummy data source - Updated to include new fields
const initialDummyApiItems: ApiFetchedWallItem[] = [
  {
    id: 1,
    product_name: "Electric Drill XT5000 (Existing)",
    company_name: "ToolMaster Inc. (Existing)",
    quantity: 30,
    price: 159.99,
    intent: "Buy",
    product_status_from_api: "low_stock",
    cartoon_type_id: 2,
    internal_remarks: "Edited remarks: Check stock levels for Drill.",
    active_hours: "8 AM - 7 PM Weekdays",
    product_spec_id: 2, // Samsung S24 Ultra Spec
    color: "Red",
    dispatch_status: "Awaiting shipment",
    dispatch_mode_from_api: "Courier",
    payment_term_id: 2, // Net 60
    eta_from_api: "2024-10-20",
    device_condition_from_api: "Old",
    location: "Main Warehouse, Section B",
    listing_type_from_api: "Featured",
    visibility: "internal",
    priority_from_api: "High",
    admin_status_from_api: "Approved",
    assigned_team_id_from_api: 1, // Sales Team Alpha
    product_url_from_api: "https://example.com/drill-xt5000",
    warranty_info_from_api: "2-year limited warranty by manufacturer.",
    return_policy_from_api: "30-day returns, buyer pays shipping.",
    product_id_from_api: 101,
    customer_id_from_api: 201,
  },
  {
    id: 2,
    product_name: "Industrial Sander G2 (Existing)",
    company_name: "BuildRight Supplies (Existing)",
    quantity: 8,
    price: 95.50,
    intent: "Sell",
    product_status_from_api: "in_stock",
    cartoon_type_id: 1,
    internal_remarks: "Bulk order discount applied.",
    active_hours: "24/7 Online Support",
    product_spec_id: 1, // iPhone 15 Pro Max spec
    color: "Yellow",
    dispatch_status: "Ready for Dispatch",
    dispatch_mode_from_api: "Pickup",
    payment_term_id: 3, // Due on Receipt
    eta_from_api: "2024-09-15",
    device_condition_from_api: "New",
    location: "Retail Store A",
    listing_type_from_api: "Regular",
    visibility: "public",
    priority_from_api: "Medium",
    admin_status_from_api: "Pending",
    assigned_team_id_from_api: 2, // Sales Team Beta
    product_url_from_api: "https://example.com/sander-g2",
    warranty_info_from_api: "6-month standard warranty.",
    return_policy_from_api: "No returns on discounted items.",
    product_id_from_api: 102,
    customer_id_from_api: 202,
  },
];

const WallItemEdit = () => {
  const navigate = useNavigate();
  const { id: itemIdFromParams } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [itemToEditApiData, setItemToEditApiData] = useState<ApiFetchedWallItem | null>(null);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
  });

  useEffect(() => {
    if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Invalid item ID.</Notification>);
        navigate(-1);
        return;
    }
    setIsLoading(true);
    const itemId = parseInt(itemIdFromParams, 10);
    
    const fetchedApiItem = initialDummyApiItems.find(item => item.id === itemId);

    if (fetchedApiItem) {
      setItemToEditApiData(fetchedApiItem);

      const formValues: WallItemFormData = {
        product_name: fetchedApiItem.product_name,
        company_name: fetchedApiItem.company_name,
        qty: fetchedApiItem.quantity,
        price: fetchedApiItem.price,
        intent: fetchedApiItem.intent,
        productStatus: productStatusOptions.find(opt => 
            opt.label.toLowerCase().includes(fetchedApiItem.product_status_from_api.toLowerCase().replace("_", " "))
        )?.value || '', 
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
    async (data: WallItemFormData) => {
      if (!itemIdFromParams) return;
      setIsSubmitting(true);
      const submissionData = {
        ...data,
        id: parseInt(itemIdFromParams, 10),
        eta: data.eta ? dayjs(data.eta).format("YYYY-MM-DD") : null,
      };
      console.log("Form data to submit (Edit):", submissionData);

      await new Promise(res => setTimeout(res, 1000));

      toast.push(<Notification title="Success" type="success">Wall item updated. (Simulated)</Notification>);
      setIsSubmitting(false);
      navigate("/sales-leads/wall-listing");
    },
    [navigate, itemIdFromParams]
  );

  const handleCancel = () => {
    navigate("/sales-leads/wall-listing");
  };
  
  const handleSaveAsDraft = () => {
    const currentValues = formMethods.getValues();
    const draftData = {
        ...currentValues,
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
        <h6 className="font-semibold text-primary-600 dark:text-primary-400">Edit Wall Item</h6>
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
                                value: spec.name,
                                label: spec.name,
                            }))}
                            {...field}
                            value={
                                dummyProductSpecsForSelect
                                    .map(spec => ({
                                        value: spec.name,
                                        label: spec.name,
                                    }))
                                    .find(opt => opt.value === field.value) || null
                            }
                            onChange={option => field.onChange(option ? option.value : "")}
                            placeholder="Select Product Name"
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
                    render={({ field }) => (
                        <UiSelect
                            options={[
                                { value: "ToolMaster Inc. (Existing)", label: "ToolMaster Inc. (Existing)" },
                                { value: "BuildRight Supplies (Existing)", label: "BuildRight Supplies (Existing)" },
                            ]}
                            {...field}
                            value={
                                [
                                    { value: "ToolMaster Inc. (Existing)", label: "ToolMaster Inc. (Existing)" },
                                    { value: "BuildRight Supplies (Existing)", label: "BuildRight Supplies (Existing)" },
                                ].find(opt => opt.value === field.value) || null
                            }
                            onChange={option => field.onChange(option ? option.value : "")}
                            placeholder="Select Company Name"
                        />
                    )}
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
              <Controller name="intent" control={formMethods.control} render={({ field }) => ( <UiSelect options={intentOptions} {...field} placeholder="Select Intent" /> )} />
            </FormItem>
            <FormItem
              label="Product Status (Stock)"
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller name="productStatus" control={formMethods.control} render={({ field }) => ( <UiSelect options={productStatusOptions} {...field} placeholder="Select Product Stock Status" /> )} />
            </FormItem>

            {/* Row 3 */}
            <FormItem
              label="Product Specification"
              invalid={!!formMethods.formState.errors.productSpecId}
              errorMessage={formMethods.formState.errors.productSpecId?.message}
            >
              <Controller name="productSpecId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyProductSpecsForSelect.map(spec => ({ value: spec.id, label: spec.name }))} {...field} value={dummyProductSpecsForSelect.map(spec => ({ value: spec.id, label: spec.name })).find(opt => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : null)} placeholder="Select Product Specification (Optional)" />
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
            
            {/* Row 4 */}
            <FormItem
              label="Cartoon Type"
              invalid={!!formMethods.formState.errors.cartoonTypeId}
              errorMessage={formMethods.formState.errors.cartoonTypeId?.message}
            >
              <Controller name="cartoonTypeId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name, }))} {...field} value={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name })).find((opt) => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : null)} placeholder="Select Cartoon Type (Optional)" />
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
              <Controller name="dispatchMode" control={formMethods.control} render={({ field }) => ( <UiSelect options={dispatchModeOptions} {...field} placeholder="Select Dispatch Mode (Optional)" /> )} />
            </FormItem>

            {/* Row 5 */}
            <FormItem
              label="Payment Term"
              invalid={!!formMethods.formState.errors.paymentTermId}
              errorMessage={formMethods.formState.errors.paymentTermId?.message}
            >
              <Controller name="paymentTermId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyPaymentTerms.map(term => ({ value: term.id, label: term.name }))} {...field} value={dummyPaymentTerms.map(term => ({ value: term.id, label: term.name })).find(opt => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : null)} placeholder="Select Payment Term (Optional)" />
                )} />
            </FormItem>
            <FormItem
              label="ETA"
              invalid={!!formMethods.formState.errors.eta}
              errorMessage={formMethods.formState.errors.eta?.message}
            >
              <Controller name="eta" control={formMethods.control} render={({ field }) => ( <DatePicker {...field} value={field.value} placeholder="Select ETA (Optional)" inputFormat="YYYY-MM-DD" /> )} />
            </FormItem>
            <FormItem
              label="Location"
              invalid={!!formMethods.formState.errors.location}
              errorMessage={formMethods.formState.errors.location?.message}
            >
              <Controller name="location" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value || ''} placeholder="Enter Location (Optional)" /> )} />
            </FormItem>

            {/* Row 6: Listing Configuration */}
            <FormItem
              label="Listing Type"
              invalid={!!formMethods.formState.errors.listingType}
              errorMessage={formMethods.formState.errors.listingType?.message}
            >
              <Controller name="listingType" control={formMethods.control} render={({ field }) => ( <UiSelect options={listingTypeOptions} {...field} placeholder="Select Listing Type" /> )} />
            </FormItem>
            <FormItem
              label="Visibility"
              invalid={!!formMethods.formState.errors.visibility}
              errorMessage={formMethods.formState.errors.visibility?.message}
            >
              <Controller name="visibility" control={formMethods.control} render={({ field }) => ( <UiSelect options={visibilityOptions} {...field} placeholder="Select Visibility" /> )} />
            </FormItem>
             <FormItem
              label="Priority"
              invalid={!!formMethods.formState.errors.priority}
              errorMessage={formMethods.formState.errors.priority?.message}
            >
              <Controller name="priority" control={formMethods.control} render={({ field }) => ( <UiSelect options={priorityOptions} {...field} placeholder="Select Priority" /> )} />
            </FormItem>

            {/* Row 7: Admin & Active Hours */}
            <FormItem
              label="Admin Status"
              invalid={!!formMethods.formState.errors.adminStatus}
              errorMessage={formMethods.formState.errors.adminStatus?.message}
            >
              <Controller name="adminStatus" control={formMethods.control} render={({ field }) => ( <UiSelect options={adminStatusOptions} {...field} placeholder="Select Admin Status" /> )} />
            </FormItem>
            <FormItem
              label="Assigned Team"
              invalid={!!formMethods.formState.errors.assignedTeamId}
              errorMessage={formMethods.formState.errors.assignedTeamId?.message}
            >
              <Controller name="assignedTeamId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={assignedTeamOptions.map(team => ({ value: team.value, label: team.label }))} {...field} value={assignedTeamOptions.map(team => ({value: team.value, label: team.label})).find(opt => opt.value === field.value) || null} onChange={opt => field.onChange(opt ? opt.value : null)} placeholder="Select Assigned Team (Optional)" />
                )} />
            </FormItem>
             <FormItem
              label="Active Hours"
              invalid={!!formMethods.formState.errors.activeHours}
              errorMessage={formMethods.formState.errors.activeHours?.message}
            >
              <Controller name="activeHours" control={formMethods.control} render={({ field }) => ( <Input {...field} value={field.value || ''} placeholder="e.g., 9 AM - 5 PM, 24/7" /> )} />
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
        <Button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting} > Draft </Button>
        <Button type="submit" form="wallItemEditForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid} >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemEdit;