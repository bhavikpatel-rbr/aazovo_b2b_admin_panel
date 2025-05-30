// src/views/your-path/business-entities/WallItemAdd.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
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

// Redux
import { useAppDispatch } from '@/reduxtool/store'; // VERIFY PATH
import { useSelector } from 'react-redux'

import {
    getProductsAction,
    getCompanyProfileAction, // VERIFY: Assumes this fetches a LIST of companies
    getProductSpecificationsAction,
    getAllProductAction,
} from '@/reduxtool/master/middleware'; // VERIFY PATH
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH


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
  productId: z.number().nullable().optional(), // Linked when product_name is selected
  customerId: z.number().nullable().optional(), // Linked when company_name is selected
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// Define option types for clarity
type ProductOptionType = { value: string; label: string; id: number };
type CompanyOptionType = { value: string; label: string; id: number };
type ProductSpecOptionType = { value: number; label: string };


// --- Form Options (Retain non-API driven options) ---
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Exchange", label: "Exchange" },
];
const productStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "In-Active", label: "In-Active" },
  { value: "In Stock", label: "In Stock"},
  { value: "Out of Stock", label: "Out of Stock"},
];
const dummyCartoonTypes = [ // Keep if not from API, otherwise fetch similarly
  { id: 1, name: "Master Carton" },
  { id: 2, name: "Inner Carton" },
  { id: 3, name: "Pallet" },
];
const dummyPaymentTerms = [ // Keep if not from API, otherwise fetch similarly
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
const assignedTeamOptions = [ // Example teams - Fetch from API if dynamic
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
    { value: 'Active', label: 'Active' },
];


const WallItemAdd = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(true);

  // --- Selectors for Redux state ---
  // VERIFY: Ensure `masterSelector` provides these specific keys and that their data structure is an array.
  // e.g., productsMasterData: [{id: 1, name: "Product A", sku_code: "P001"}, ...]
  // e.g., rawProfileArrayFromState: [{id: 1, company_name: "Company X"}, ...]
  // e.g., ProductSpecificationsData: [{id: 1, name: "Spec Y"}, ...]
  const {
    productsMasterData = [],
    rawProfileArrayFromState = [], // VERIFY name if getCompanyProfileAction fetches a list
    ProductSpecificationsData = [],
    status: masterDataAccessStatus = 'idle', // General status from masterSlice
  } = useSelector(masterSelector);

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
      listingType: listingTypeOptions[1]?.value,
      visibility: visibilityOptions[0]?.value,
      priority: priorityOptions[1]?.value,
      adminStatus: adminStatusOptions[0]?.value,
      assignedTeamId: null,
      productUrl: "",
      warrantyInfo: "",
      returnPolicy: "",
      productId: null, // Will be set by UiSelect's onChange for product_name
      customerId: null, // Will be set by UiSelect's onChange for company_name
    },
  });

  // --- Fetch data for dropdowns ---
  useEffect(() => {
    const fetchDataForDropdowns = async () => {
      setIsLoadingDropdownData(true);
      try {
        // VERIFY: Pass necessary params if actions require them (e.g., for pagination)
        await Promise.all([
          dispatch(getAllProductAction()),
          dispatch(getCompanyProfileAction()), // Ensure this fetches a LIST
          dispatch(getProductSpecificationsAction()),
        ]);
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
        toast.push(<Notification title="Data Load Error" type="danger">Could not load selection options.</Notification>);
      } finally {
        setIsLoadingDropdownData(false);
      }
    };
    fetchDataForDropdowns();
  }, [dispatch]);

  // --- Prepare options for Select components ---
  const productOptions: ProductOptionType[] = useMemo(() => {
    console.log(productsMasterData);
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: any) => ({
      value: product.name,
      label: `${product.name}${product.name ? ` (${product.name})` : ''}`.trim(),
      id: product.id,
    }));
  }, [productsMasterData]);
  

  const companyOptions: CompanyOptionType[] = useMemo(() => {
    if (!Array.isArray(rawProfileArrayFromState)) return [];
    return rawProfileArrayFromState.map((company: any) => ({
      value: company.company_name || company.name, // Adjust if company name field is different
      label: company.company_name || company.name,
      id: company.id,
    }));
  }, [rawProfileArrayFromState]);

  const productSpecOptionsForSelect: ProductSpecOptionType[] = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((spec: any) => ({
      value: spec.id,
      label: spec.name,
    }));
  }, [ProductSpecificationsData]);

  const onFormSubmit = useCallback(
    async (formData: WallItemFormData) => {
      setIsSubmitting(true);

      const productSpecDetails = formData.productSpecId
        ? productSpecOptionsForSelect.find(spec => spec.value === formData.productSpecId)
        : null;
      
      const cartoonTypeDetails = formData.cartoonTypeId
        ? dummyCartoonTypes.find(ct => ct.id === formData.cartoonTypeId)
        : null;

      const loggedPayload: any = { ...formData };

      loggedPayload.id = null;
      loggedPayload.product_id = formData.productId ? String(formData.productId) : null;
      loggedPayload.customer_id = formData.customerId ? String(formData.customerId) : null;
      loggedPayload.product_spec_id = formData.productSpecId ? String(formData.productSpecId) : null;
      loggedPayload.assigned_to = formData.assignedTeamId ? String(formData.assignedTeamId) : null;
      
      loggedPayload.want_to = formData.intent;
      loggedPayload.qty = String(formData.qty);
      loggedPayload.price = (formData.price !== null && formData.price !== undefined) ? String(formData.price) : "0";
      
      loggedPayload.status = formData.adminStatus;
      loggedPayload.product_status = formData.productStatus;
      loggedPayload.product_status_listing = null;
      loggedPayload.dispatch_status = formData.dispatchStatus;

      loggedPayload.color = formData.color;
      loggedPayload.device_condition = formData.deviceCondition;
      loggedPayload.product_specs = productSpecDetails ? productSpecDetails.label : null;

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

      loggedPayload.internal_remarks = formData.internalRemarks;
      loggedPayload.notes = formData.internalRemarks;

      loggedPayload.opportunity_id = loggedPayload.opportunity_id ?? null;
      loggedPayload.opportunity_status = loggedPayload.opportunity_status ?? null;
      loggedPayload.match_score = loggedPayload.match_score ?? null;
      loggedPayload.buy_listing_id = loggedPayload.buy_listing_id ?? null;
      loggedPayload.sell_listing_id = loggedPayload.sell_listing_id ?? null;
      loggedPayload.spb_role = loggedPayload.spb_role ?? null;
      loggedPayload.product_category = loggedPayload.product_category ?? null;
      loggedPayload.product_subcategory = loggedPayload.product_subcategory ?? null;
      loggedPayload.brand = loggedPayload.brand ?? null;
      loggedPayload.price_match_type = loggedPayload.price_match_type ?? null;
      loggedPayload.quantity_match_listing = String(formData.qty);
      loggedPayload.location_match = loggedPayload.location_match ?? null;
      loggedPayload.matches_found_count = loggedPayload.matches_found_count ?? null;
      loggedPayload.last_updated = loggedPayload.last_updated ?? null;
      loggedPayload.payment_method = loggedPayload.payment_method ?? null;
      loggedPayload.interaction_type = loggedPayload.interaction_type ?? null;
      loggedPayload.created_from = "FormUI-Add";
      loggedPayload.source = "in";
      loggedPayload.delivery_details = loggedPayload.delivery_details ?? null;
      loggedPayload.created_by = "1";
      loggedPayload.expired_date = loggedPayload.expired_date ?? null;
      loggedPayload.created_at = new Date().toISOString();
      loggedPayload.updated_at = new Date().toISOString();
      loggedPayload.device_type = loggedPayload.device_type ?? null;
      loggedPayload.master_cartoon = loggedPayload.master_cartoon ?? null;
      loggedPayload.eta_details = loggedPayload.eta_details ?? null;
      loggedPayload.is_wall_manual = "0";
      loggedPayload.wall_link_token = loggedPayload.wall_link_token ?? null;
      loggedPayload.wall_link_datetime = loggedPayload.wall_link_datetime ?? null;
      loggedPayload.inquiries = "0";
      loggedPayload.share = "0";
      loggedPayload.bookmark = "0";
      loggedPayload.company_id = loggedPayload.company_id ?? null; // This might be formData.customerId if applicable for company context
      loggedPayload.member_type = loggedPayload.member_type ?? null;
      loggedPayload.brands_id = loggedPayload.brands_id ?? null;
      loggedPayload.leads_count = 0;

      loggedPayload.product = {
          id: formData.productId,
          name: formData.product_name, // Now correctly sourced from form
          description: null, 
          status: formData.productStatus, 
          minimum_order_quantity: null, category_id: null, sub_category_id: null, brand_id: null, icon_full_path: null, product_images_array: [],
          sub_category: null, brand: null, category: null 
      };
      loggedPayload.product_spec = productSpecDetails ? { id: productSpecDetails.value, name: productSpecDetails.label } : null;
      loggedPayload.customer = {
          id: formData.customerId,
          name: formData.company_name, // Now correctly sourced from form
          full_profile_pic: null, brand_name: null, category: null, subcategory: null
      };
      loggedPayload.company = null;

      console.log("--- WallItemAdd Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", formData);
      console.log("2. Constructed Payload (for API/logging - matches target structure, includes all form data):", loggedPayload);
      console.log("--- End WallItemAdd Form Submission Log ---");

      await new Promise((res) => setTimeout(res, 1000)); // Simulate API call

      toast.push(
        <Notification title="Success" type="success">
          Wall item added. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      navigate("/sales-leads/wall-listing");
    },
    [navigate, productSpecOptionsForSelect] // Added dependency
  );

  const handleCancel = () => {
    navigate("/sales-leads/wall-listing");
  };
  
  const isLoadingOptions = isLoadingDropdownData || masterDataAccessStatus === 'loading';

  return (
    <>
        <div className="flex gap-1 items-end mb-3 ">
            <NavLink to="/sales-leads/wall-listing">
                <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6>
            </NavLink>
            <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
            <h6 className="font-semibold text-primary">Add New Wall Item</h6>
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
                            // isLoading={isLoadingOptions}
                            options={productOptions}
                            value={productOptions.find(opt => opt.value === field.value) || null}
                            onChange={option => {
                                if (option) {
                                    field.onChange(option.value);
                                    formMethods.setValue('productId', option.id, { shouldValidate: true, shouldDirty: true });
                                } else {
                                    field.onChange("");
                                    formMethods.setValue('productId', null, { shouldValidate: true, shouldDirty: true });
                                }
                            }}
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
                            isLoading={isLoadingOptions}
                            options={companyOptions}
                            value={companyOptions.find(opt => opt.value === field.value) || null}
                            onChange={option => {
                                if (option) {
                                    field.onChange(option.value);
                                    formMethods.setValue('customerId', option.id, { shouldValidate: true, shouldDirty: true });
                                } else {
                                    field.onChange("");
                                    formMethods.setValue('customerId', null, { shouldValidate: true, shouldDirty: true });
                                }
                            }}
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
              <Controller name="intent" control={formMethods.control} render={({ field }) => ( <UiSelect options={intentOptions} {...field} 
                value={intentOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Intent" /> )} />
            </FormItem>
            <FormItem
              label="Product Status"
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller name="productStatus" control={formMethods.control} render={({ field }) => ( <UiSelect options={productStatusOptions} {...field} 
                value={productStatusOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Product Status" /> )} />
            </FormItem>

            {/* Row 3 */}
            <FormItem
              label="Product Spec"
              invalid={!!formMethods.formState.errors.productSpecId}
              errorMessage={formMethods.formState.errors.productSpecId?.message}
            >
              <Controller name="productSpecId" control={formMethods.control} render={({ field }) => (
                  <UiSelect
                    isLoading={isLoadingOptions}
                    options={productSpecOptionsForSelect}
                    value={productSpecOptionsForSelect.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                    placeholder="Select Product Spec (Optional)"
                    isClearable
                  />
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
                  <UiSelect options={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name, }))} {...field} 
                  value={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name })).find((opt) => opt.value === field.value) || null} 
                  onChange={(option) => field.onChange(option ? option.value : null)} 
                  placeholder="Select Cartoon Type (Optional)" 
                  isClearable
                  />
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
              <Controller name="dispatchMode" control={formMethods.control} render={({ field }) => ( <UiSelect options={dispatchModeOptions} {...field} 
                value={dispatchModeOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Dispatch Mode (Optional)" 
                isClearable
                /> )} />
            </FormItem>

            {/* Row 5 */}
            <FormItem
              label="Payment Term"
              invalid={!!formMethods.formState.errors.paymentTermId}
              errorMessage={formMethods.formState.errors.paymentTermId?.message}
            >
              <Controller name="paymentTermId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyPaymentTerms.map(term => ({ value: term.id, label: term.name }))} {...field} 
                  value={dummyPaymentTerms.map(term => ({ value: term.id, label: term.name })).find(opt => opt.value === field.value) || null} 
                  onChange={(option) => field.onChange(option ? option.value : null)} 
                  placeholder="Select Payment Term (Optional)" 
                  isClearable
                  />
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

            {/* Row 6: Listing Configuration */}
            <FormItem
              label="Listing Type"
              invalid={!!formMethods.formState.errors.listingType}
              errorMessage={formMethods.formState.errors.listingType?.message}
            >
              <Controller name="listingType" control={formMethods.control} render={({ field }) => ( <UiSelect options={listingTypeOptions} {...field} 
                value={listingTypeOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Listing Type" /> )} />
            </FormItem>
            <FormItem
              label="Visibility"
              invalid={!!formMethods.formState.errors.visibility}
              errorMessage={formMethods.formState.errors.visibility?.message}
            >
              <Controller name="visibility" control={formMethods.control} render={({ field }) => ( <UiSelect options={visibilityOptions} {...field} 
                value={visibilityOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Visibility" /> )} />
            </FormItem>
             <FormItem
              label="Priority"
              invalid={!!formMethods.formState.errors.priority}
              errorMessage={formMethods.formState.errors.priority?.message}
            >
              <Controller name="priority" control={formMethods.control} render={({ field }) => ( <UiSelect options={priorityOptions} {...field} 
                value={priorityOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Priority (Optional)" 
                isClearable
                /> )} />
            </FormItem>

            {/* Row 7: Admin & Active Hours */}
            <FormItem
              label="Admin Status"
              invalid={!!formMethods.formState.errors.adminStatus}
              errorMessage={formMethods.formState.errors.adminStatus?.message}
            >
              <Controller name="adminStatus" control={formMethods.control} render={({ field }) => ( <UiSelect options={adminStatusOptions} {...field} 
                value={adminStatusOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Admin Status" /> )} />
            </FormItem>
            <FormItem
              label="Assigned Team"
              invalid={!!formMethods.formState.errors.assignedTeamId}
              errorMessage={formMethods.formState.errors.assignedTeamId?.message}
            >
              <Controller name="assignedTeamId" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={assignedTeamOptions.map(team => ({ value: team.value, label: team.label }))} {...field} 
                  value={assignedTeamOptions.map(team => ({value: team.value, label: team.label})).find(opt => opt.value === field.value) || null} 
                  onChange={opt => field.onChange(opt ? opt.value : null)} 
                  placeholder="Select Assigned Team (Optional)" 
                  isClearable
                  />
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
        <Button type="submit" form="wallItemAddForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid} >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemAdd;