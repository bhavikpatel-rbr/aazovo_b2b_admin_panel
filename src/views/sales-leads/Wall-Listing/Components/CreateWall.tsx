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
    getCompanyAction, // VERIFY: Assumes this fetches a LIST of companies
    getProductSpecificationsAction,
    getPaymentTermAction,
    getAllProductAction,
    addWallItemAction,
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
type PaymentTermType = { value: string; label: string; id: number };
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
  // e.g., CompanyData: [{id: 1, company_name: "Company X"}, ...]
  // e.g., ProductSpecificationsData: [{id: 1, name: "Spec Y"}, ...]
  const {
    productsMasterData = [],
    CompanyData = [], // VERIFY name if getCompanyAction fetches a list
    ProductSpecificationsData = [],
    PaymentTermsData = [],
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
          dispatch(getCompanyAction()), // Ensure this fetches a LIST
          dispatch(getProductSpecificationsAction()),
          dispatch(getPaymentTermAction()),
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
    if (!CompanyData || !Array.isArray(CompanyData.data)) return [];
    return CompanyData.data.map((company: any) => ({
      value: company.company_name || company.name,
      label: company.company_name || company.name,
      id: company.id,
    }));
  }, [CompanyData]);


  const paymentTermsOption: PaymentTermType[] = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((payment: any) => ({
      value: payment.id || payment.id, // Adjust if payment name field is different
      label: payment.term_name || payment.term_name,
      id: payment.id,
    }));
  }, [PaymentTermsData]);

  const productSpecOptionsForSelect: ProductSpecOptionType[] = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((spec: any) => ({
      value: spec.id,
      label: spec.name,
    }));
  }, [ProductSpecificationsData]);

  const onFormSubmit = async (formData: WallItemFormData) => {
    setIsSubmitting(true);

    try {
      const productSpecDetails = formData.productSpecId
        ? productSpecOptionsForSelect.find(spec => spec.value === formData.productSpecId)
        : null;

      const cartoonTypeDetails = formData.cartoonTypeId
        ? dummyCartoonTypes.find(ct => ct.id === formData.cartoonTypeId)
        : null;

      const payload = {
        id: null,
        opportunity_id: null,
        opportunity_status: null,
        match_score: null,
        buy_listing_id: null,
        sell_listing_id: null,
        spb_role: null,
        product_category: null,
        product_subcategory: null,
        brand: formData.brand ?? null,
        product_specs: productSpecDetails?.label ?? null,
        product_status_listing: null,
        price_match_type: null,
        quantity_match_listing: String(formData.qty),
        location_match: null,
        matches_found_count: null,
        last_updated: null,
        notes: formData.internalRemarks,
        priority: formData.priority,
        visibility: formData.visibility,
        warranty: formData.warrantyInfo,
        listing_url: formData.productUrl,
        shipping_options: formData.dispatchMode,
        payment_method: null,
        interaction_type: null,
        product_id: formData.productId ? String(formData.productId) : null,
        customer_id: formData.companyId ? String(formData.companyId) : null,
        status: formData.adminStatus,
        created_from: "FormUI-Add",
        want_to: formData.intent,
        qty: String(formData.qty),
        product_status: formData.productStatus,
        source: "in",
        delivery_at: formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null,
        delivery_details: null,
        created_by: "1",
        active_hrs: String(formData.activeHours),
        expired_date: null,
        internal_remarks: formData.internalRemarks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product_spec_id: formData.productSpecId ? String(formData.productSpecId) : null,
        device_type: null,
        price: formData.price ? String(formData.price) : "0",
        color: formData.color,
        master_cartoon: null,
        dispatch_status: formData.dispatchStatus,
        payment_term: formData.paymentTermId ? String(formData.paymentTermId) : "0",
        device_condition: formData.deviceCondition,
        eta_details: null,
        location: formData.location,
        is_wall_manual: "0",
        wall_link_token: null,
        wall_link_datetime: null,
        cartoon_type: cartoonTypeDetails?.name ?? String(formData.cartoonTypeId),
        inquiries: "0",
        share: "0",
        bookmark: "0",
        assigned_to: formData.assignedTeamId ? String(formData.assignedTeamId) : null,
        company_id: formData.companyId ?? null,
        member_type: null,
        brands_id: formData.brands_id ?? null,
        dispatch_mode: formData.dispatchMode,
        listing_type: formData.listingType,
        admin_status: formData.adminStatus,
        assigned_team: formData.assignedTeamId ?? null,
      };

      await dispatch(addWallItemAction(payload)).unwrap();

      toast.push(
        <Notification title="Wall Item Added" type="success" duration={2000}>
          Wall item for "{formData.product_name}" added.
        </Notification>
      );

      navigate("/sales-leads/wall-listing");
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add Wall Item."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCancel = () => {
    navigate("/sales-leads/wall-listing");
  };
  
  const isLoadingOptions = isLoadingDropdownData || masterDataAccessStatus === "idle";

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
                name="company_name" // This will store the company's name (label)
                control={formMethods.control}
                render={({ field }) => (
                    <UiSelect
                        options={companyOptions} // { value: "Company X Name", label: "Company X Name", id: 1 }
                        value={companyOptions.find(opt => opt.value === field.value) || null}
                        onChange={option => {
                            if (option) {
                                field.onChange(option.value); // Sets formData.company_name to option.value (the name)
                                formMethods.setValue('customerId', option.id, { shouldValidate: true, shouldDirty: true }); // Sets formData.customerId to option.id
                            } else {
                                field.onChange("");
                                formMethods.setValue('customerId', null, { shouldValidate: true, shouldDirty: true });
                            }
                        }}
                        // ...
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
                  <UiSelect options={paymentTermsOption} {...field} 
                  value={paymentTermsOption.find(opt => opt.value === field.value) || null}
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