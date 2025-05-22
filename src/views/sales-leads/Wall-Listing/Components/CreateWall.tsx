// src/views/your-path/business-entities/WallItemAdd.tsx

import React, { useState, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs"; // Needed for formatting ETA on submit

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

// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// --- Zod Schema for Add Wall Item Form ---
const wallItemFormSchema = z.object({
  // Core Product & Company Info
  product_name: z.string().min(1, "Product Name is required."),
  company_name: z.string().min(1, "Company Name is required."),
  
  // Quantity, Price, Intent
  qty: z
    .number({ required_error: "Quantity is required." })
    .min(0, "Quantity cannot be negative."),
  price: z.number().min(0, "Price cannot be negative.").nullable().optional(),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, {
    required_error: "Intent (Want to) is required.",
  }),
  
  // Product & Stock Status
  productStatus: z.string().min(1, "Product Status is required."), // e.g. In Stock
  productSpecId: z.number().nullable().optional(), // Select: e.g., 256GB, Grade A
  deviceCondition: z.string().min(1, "Device condition is required.").nullable(), // Radio: New/Old
  color: z.string().max(50, "Color too long.").nullable().optional(),
  
  // Logistics & Terms
  cartoonTypeId: z.number().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  dispatchMode: z.string().optional().nullable(), // New: Select
  paymentTermId: z.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  
  // Listing Configuration
  listingType: z.string().min(1,"Listing Type is required.").optional().nullable(), // New: Select
  visibility: z.string().min(1, "Visibility is required."),
  priority: z.string().min(1, "Priority is required.").optional().nullable(), // New: Select
  adminStatus: z.string().min(1, "Admin Status is required.").optional().nullable(), // New: Select
  assignedTeamId: z.number().nullable().optional(), // New: Select
  activeHours: z.string().optional().nullable(),
  productUrl: z.string().url("Invalid URL format.").or(z.literal("")).optional().nullable(), // New
  
  // Policies
  warrantyInfo: z.string().optional().nullable(), // New: Textarea
  returnPolicy: z.string().optional().nullable(), // New: Textarea
  
  // Remarks
  internalRemarks: z.string().nullable().optional(),

  // Optional relationship IDs (if needed for backend)
  productId: z.number().nullable().optional(), // Usually linked when product_name is selected/created
  customerId: z.number().nullable().optional(), // Usually linked when company_name/contact_person_name is selected/created
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// --- Form Options ---
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
const dummyCartoonTypes = [
  { id: 1, name: "Master Carton" },
  { id: 2, name: "Inner Carton" },
  { id: 3, name: "Pallet" },
];
const dummyProductSpecsForSelect = [ // Example: In a real app, these would come from an API
  { id: 1, name: "iPhone 15 Pro Max - 256GB - Natural Titanium - US Spec" },
  { id: 2, name: "Samsung S24 Ultra - 512GB - Phantom Black - EU Spec" },
  { id: 3, name: "Google Pixel 8 Pro - 128GB - Obsidian - UK Spec" },
];
const dummyPaymentTerms = [
  { id: 1, name: "Net 30 Days" },
  { id: 2, name: "Net 60 Days" },
  { id: 3, name: "Due on Receipt" },
  { id: 4, name: "Prepaid" },
];
const deviceConditionRadioOptions = [
    { value: "New", label: "New" },
    { value: "Old", label: "Old" },
];
const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'internal', label: 'Internal' },
];
const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
];
const assignedTeamOptions = [ // Example teams
    { value: 1, label: 'Sales Team Alpha' },
    { value: 2, label: 'Sales Team Beta' },
    { value: 3, label: 'Support Team' },
];
const listingTypeOptions = [
    { value: 'Featured', label: 'Featured' },
    { value: 'Regular', label: 'Regular' },
];
const dispatchModeOptions = [
    { value: 'Courier', label: 'Courier' },
    { value: 'Pickup', label: 'Pickup' },
    { value: 'Transport', label: 'Transport (Freight)' },
    { value: 'Digital', label: 'Digital Delivery' },
];
const adminStatusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
];


const WallItemAdd = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    defaultValues: {
      product_name: "",
      company_name: "",
      qty: 1,
      price: null,
      intent: "Sell",
      productStatus: productStatusOptions[0]?.value,
      cartoonTypeId: null,
      internalRemarks: "",
      activeHours: "",
      productSpecId: null,
      color: "",
      dispatchStatus: "",
      paymentTermId: null,
      eta: null,
      deviceCondition: null,
      location: "",
      listingType: listingTypeOptions[1]?.value, // Default to Regular
      visibility: visibilityOptions[0]?.value, // Default to Public
      priority: priorityOptions[1]?.value, // Default to Medium
      adminStatus: adminStatusOptions[0]?.value, // Default to Pending
      assignedTeamId: null,
      productUrl: "",
      warrantyInfo: "",
      returnPolicy: "",
      productId: null,
      customerId: null,
    },
  });

  const onFormSubmit = useCallback(
    async (data: WallItemFormData) => {
      setIsSubmitting(true);
      const submissionData = {
        ...data,
        eta: data.eta ? dayjs(data.eta).format("YYYY-MM-DD") : null,
      };
      console.log("Form data to submit (Add):", submissionData);

      await new Promise((res) => setTimeout(res, 1000));

      toast.push(
        <Notification title="Success" type="success">
          Wall item added. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      navigate("/sales-leads/wall-listing");
    },
    [navigate]
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
    console.log("Saving as draft:", draftData);
    toast.push(
        <Notification title="Draft Saved" type="info">
            Item saved as draft. (Simulated)
        </Notification>
    );
  };


  return (
    <>
        <div className="flex gap-1 items-end mb-3 ">
            <NavLink to="/sales-leads/wall-listing">
                <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6>
            </NavLink>
            <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
            <h6 className="font-semibold text-primary-600 dark:text-primary-400">Add New Wall Item</h6>
        </div>
      <Card>
        <Form
          id="wallItemAddForm"
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
                                    .map(spec => ({ value: spec.name, label: spec.name }))
                                    .find(opt => opt.value === field.value) || null
                            }
                            onChange={option => field.onChange(option ? option.value : "")}
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
                    render={({ field }) => (
                        <UiSelect
                            options={[
                                { value: "Acme Corp", label: "Acme Corp" },
                                { value: "Globex Inc", label: "Globex Inc" },
                                { value: "Stark Industries", label: "Stark Industries" },
                                { value: "Wayne Enterprises", label: "Wayne Enterprises" },
                            ]}
                            {...field}
                            value={
                                [
                                    { value: "Acme Corp", label: "Acme Corp" },
                                    { value: "Globex Inc", label: "Globex Inc" },
                                    { value: "Stark Industries", label: "Stark Industries" },
                                    { value: "Wayne Enterprises", label: "Wayne Enterprises" },
                                ].find(opt => opt.value === field.value) || null
                            }
                            onChange={option => field.onChange(option ? option.value : "")}
                            placeholder="Select Company Name"
                            isClearable
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
              className="md:col-span-2" // Span 2 for textarea
              invalid={!!formMethods.formState.errors.warrantyInfo}
              errorMessage={formMethods.formState.errors.warrantyInfo?.message}
            >
              <Controller name="warrantyInfo" control={formMethods.control} render={({ field }) => ( <Input textArea {...field} value={field.value || ""} rows={2} placeholder="Enter warranty details (Optional)" /> )} />
            </FormItem>
            
            <FormItem
              label="Return Policy"
              className="md:col-span-3" // Span 3 for full width
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
        <Button type="submit" form="wallItemAddForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid} >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemAdd;