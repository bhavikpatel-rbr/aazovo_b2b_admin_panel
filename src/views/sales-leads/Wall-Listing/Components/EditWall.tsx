// src/views/your-path/business-entities/WallItemEdit.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react"; // Added useMemo
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

// Redux
import { useAppDispatch } from '@/reduxtool/store'; // VERIFY PATH
import { useSelector } from 'react-redux';
import {
    // getProductsAction, // Assuming getAllProductAction is the correct one from WallItemAdd
    getCompanyProfileAction, // VERIFY: Assumes this fetches a LIST of companies
    getProductSpecificationsAction,
    getAllProductAction, // Used in WallItemAdd, assuming it's for product names
} from '@/reduxtool/master/middleware'; // VERIFY PATH
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH


// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// API data structure for fetching an item (remains the same)
export type ApiFetchedWallItem = {
  id: number;
  product_name: string; // This will be the string name to match with productOptions
  company_name: string; // This will be the string name to match with companyOptions
  quantity: number;
  price: number | null;
  intent: WallIntent;
  product_status_from_api: string;
  cartoon_type_id: number | null;
  internal_remarks: string | null;
  active_hours: string | null;
  product_spec_id: number | null; // This will be the ID to match with productSpecOptions
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
  // Add other fields your API might return
  source?: string; // Example from WallItemAdd logging
  created_by?: string; // Example
  is_wall_manual?: string; // Example
  created_at_from_api?: string | null; // If your API provides created_at
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
  productId: z.number().nullable().optional(), // Will be set by UiSelect's onChange for product_name
  customerId: z.number().nullable().optional(), // Will be set by UiSelect's onChange for company_name
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// Define option types (same as WallItemAdd)
type ProductOptionType = { value: string; label: string; id: number };
type CompanyOptionType = { value: string; label: string; id: number };
type ProductSpecOptionType = { value: number; label: string };


// --- Form Options (Static options remain) ---
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Exchange", label: "Exchange" }
];
const productStatusOptions: { value: string; label: string }[] = [
    { value: "In Stock", label: "In Stock" }, 
    { value: "Low Stock", label: "Low Stock" }, 
    { value: "Out of Stock", label: "Out of Stock" },
    { value: "Active", label: "Active" },
    { value: "In-Active", label: "In-Active" },
];
const dummyCartoonTypes: { id: number; name: string }[] = [
  { id: 1, name: "Master Carton" }, { id: 2, name: "Inner Carton" }, { id: 3, name: "Pallet" }
];
// dummyProductSpecsForSelect will be replaced by Redux fetched data
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
const adminStatusOptions: { value: string; label: string }[] = [
  { value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }, { value: 'Active', label: 'Active' }
];

// Dummy data source (remains for initial item fetch simulation)
const initialDummyApiItems: ApiFetchedWallItem[] = [
  {
    id: 1,
    product_name: "Electric Drill XT5000 (Existing)", // This name should match a value in your productOptions
    company_name: "ToolMaster Inc. (Existing)", // This name should match a value in your companyOptions
    product_id_from_api: 101, // This ID should match an ID in your productOptions
    customer_id_from_api: 201, // This ID should match an ID in your companyOptions
    quantity: 30, price: 159.99, intent: "Buy", product_status_from_api: "low_stock",
    cartoon_type_id: 2, internal_remarks: "Edited remarks: Check stock levels for Drill.",
    active_hours: "8 AM - 7 PM Weekdays", product_spec_id: 2, // This ID should match a value in productSpecOptions
    color: "Red", dispatch_status: "Awaiting shipment", dispatch_mode_from_api: "Courier",
    payment_term_id: 2, eta_from_api: "2024-10-20", device_condition_from_api: "Old",
    location: "Main Warehouse, Section B", listing_type_from_api: "Featured",
    visibility: "internal", priority_from_api: "High", admin_status_from_api: "Approved",
    assigned_team_id_from_api: 1, product_url_from_api: "https://example.com/drill-xt5000",
    warranty_info_from_api: "2-year limited warranty by manufacturer.",
    return_policy_from_api: "30-day returns, buyer pays shipping.",
  },
];

const WallItemEdit = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: itemIdFromParams } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // For fetching the item to edit
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(true); // For fetching dropdown options

  const [itemToEditApiData, setItemToEditApiData] = useState<ApiFetchedWallItem | null>(null);

  // --- Selectors for Redux state (same as WallItemAdd) ---
  const {
    productsMasterData = [],
    rawProfileArrayFromState = [],
    ProductSpecificationsData = [],
    status: masterDataAccessStatus = 'idle',
  } = useSelector(masterSelector);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
  });

  // --- Prepare options for Select components (same as WallItemAdd) ---
   const productOptions: ProductOptionType[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: any) => ({
      value: product.name, // Assuming product_name form field expects the name
      label: `${product.name}${product.sku_code ? ` (${product.sku_code})` : ''}`.trim(),
      id: product.id,
    }));
  }, [productsMasterData]);
  

  const companyOptions: CompanyOptionType[] = useMemo(() => {
    if (!Array.isArray(rawProfileArrayFromState)) return [];
    return rawProfileArrayFromState.map((company: any) => ({
      value: company.company_name || company.name, // Assuming company_name form field expects the name
      label: company.company_name || company.name,
      id: company.id,
    }));
  }, [rawProfileArrayFromState]);

  const productSpecOptionsForSelect: ProductSpecOptionType[] = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((spec: any) => ({
      value: spec.id, // productSpecId form field expects the ID
      label: spec.name,
    }));
  }, [ProductSpecificationsData]);


  // --- Fetch dropdown data and initial item data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Invalid item ID.</Notification>);
        navigate(-1);
        return;
      }
      
      setIsLoadingInitialData(true);
      setIsLoadingDropdownData(true);

      try {
        // Dispatch actions to get dropdown options
        await Promise.all([
          dispatch(getAllProductAction()),
          dispatch(getCompanyProfileAction()),
          dispatch(getProductSpecificationsAction()),
        ]);
        setIsLoadingDropdownData(false); // Dropdown data loaded or failed

        // Simulate fetching the specific item to edit
        // In a real app, this would be an API call: dispatch(getWallItemByIdAction(itemId))
        await new Promise(res => setTimeout(res, 300)); // Simulate delay for item fetch
        const itemId = parseInt(itemIdFromParams, 10);
        const fetchedApiItem = initialDummyApiItems.find(item => item.id === itemId);

        if (fetchedApiItem) {
          setItemToEditApiData(fetchedApiItem);
        } else {
          toast.push(<Notification title="Error" type="danger">Wall item not found.</Notification>);
          navigate("/sales-leads/wall-listing");
        }
      } catch (error) {
        console.error("Failed to fetch data for edit form:", error);
        toast.push(<Notification title="Data Load Error" type="danger">Could not load data for editing.</Notification>);
        if (isLoadingDropdownData) setIsLoadingDropdownData(false); // Ensure it's set if Promise.all fails early
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchData();
  }, [dispatch, itemIdFromParams, navigate]);


  // --- Populate form once all data is available ---
  useEffect(() => {
    // Only reset form if item data is fetched AND dropdown options are ready (or master status is not loading/idle)
    if (itemToEditApiData && (!isLoadingDropdownData || masterDataAccessStatus === 'succeeded' || masterDataAccessStatus === 'failed')) {
      const matchedProductStatusOption = productStatusOptions.find(opt =>
        opt.label.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        itemToEditApiData.product_status_from_api.toLowerCase().replace(/[^a-z0-9]/gi, '') ||
        opt.value.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        itemToEditApiData.product_status_from_api.toLowerCase().replace(/[^a-z0-9]/gi, '')
      );

      formMethods.reset({
        product_name: itemToEditApiData.product_name, // The string name from API
        company_name: itemToEditApiData.company_name, // The string name from API
        qty: itemToEditApiData.quantity,
        price: itemToEditApiData.price,
        intent: itemToEditApiData.intent,
        productStatus: matchedProductStatusOption?.value || productStatusOptions[0]?.value || '',
        productSpecId: itemToEditApiData.product_spec_id, // The ID from API
        deviceCondition: itemToEditApiData.device_condition_from_api,
        color: itemToEditApiData.color,
        cartoonTypeId: itemToEditApiData.cartoon_type_id,
        dispatchStatus: itemToEditApiData.dispatch_status,
        dispatchMode: itemToEditApiData.dispatch_mode_from_api,
        paymentTermId: itemToEditApiData.payment_term_id,
        eta: itemToEditApiData.eta_from_api ? dayjs(itemToEditApiData.eta_from_api).toDate() : null,
        location: itemToEditApiData.location,
        listingType: itemToEditApiData.listing_type_from_api,
        visibility: itemToEditApiData.visibility,
        priority: itemToEditApiData.priority_from_api,
        adminStatus: itemToEditApiData.admin_status_from_api,
        assignedTeamId: itemToEditApiData.assigned_team_id_from_api,
        activeHours: itemToEditApiData.active_hours,
        productUrl: itemToEditApiData.product_url_from_api,
        warrantyInfo: itemToEditApiData.warranty_info_from_api,
        returnPolicy: itemToEditApiData.return_policy_from_api,
        internalRemarks: itemToEditApiData.internal_remarks,
        productId: itemToEditApiData.product_id_from_api, // Set from API if available
        customerId: itemToEditApiData.customer_id_from_api, // Set from API if available
      });
    }
  }, [itemToEditApiData, formMethods, isLoadingDropdownData, masterDataAccessStatus, productOptions, companyOptions, productSpecOptionsForSelect]); // Added options as dependencies to ensure reset happens after they are populated


  const onFormSubmit = useCallback(
    async (formData: WallItemFormData) => {
      if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Item ID is missing.</Notification>);
        return;
      }
      setIsSubmitting(true);

      // Use the prepared productSpecOptionsForSelect for finding details
      const productSpecDetails = formData.productSpecId
        ? productSpecOptionsForSelect.find(spec => spec.value === formData.productSpecId)
        : null;
      
      const cartoonTypeDetails = formData.cartoonTypeId
        ? dummyCartoonTypes.find(ct => ct.id === formData.cartoonTypeId)
        : null;

      const loggedPayload: any = { ...formData }; 

      loggedPayload.id = parseInt(itemIdFromParams, 10);
      loggedPayload.product_id = String(formData.productId); // Ensure productId is set
      loggedPayload.customer_id = String(formData.customerId); // Ensure customerId is set
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
      loggedPayload.product_specs = productSpecDetails ? productSpecDetails.label : null; // Use label from selected spec

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

      loggedPayload.created_from = "FormUI-Edit"; 
      loggedPayload.source = itemToEditApiData?.source || "in";
      loggedPayload.delivery_details = null;
      loggedPayload.created_by = itemToEditApiData?.created_by || "1"; 
      loggedPayload.expired_date = null;
      
      loggedPayload.created_at = itemToEditApiData?.created_at_from_api || new Date().toISOString(); // Prefer original creation date
      loggedPayload.updated_at = new Date().toISOString(); 
      
      loggedPayload.is_wall_manual = itemToEditApiData?.is_wall_manual || "0";

      loggedPayload.product = {
          id: formData.productId, // This should be correctly set
          name: formData.product_name,
          description: null, 
          status: formData.productStatus, 
      };
      loggedPayload.product_spec = productSpecDetails ? { id: productSpecDetails.value, name: productSpecDetails.label } : null;
      loggedPayload.customer = {
          id: formData.customerId, // This should be correctly set
          name: formData.company_name,
      };
      loggedPayload.company = null;

      console.log("--- WallItemEdit Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", formData);
      console.log("2. Item to Edit (API data used for form population):", itemToEditApiData);
      console.log("3. Constructed Payload (for API/logging - matches target structure, includes all form data):", loggedPayload);
      console.log("--- End WallItemEdit Form Submission Log ---");
      
      await new Promise(res => setTimeout(res, 1000));

      toast.push(<Notification title="Success" type="success">Wall item updated. (Simulated)</Notification>);
      setIsSubmitting(false);
      navigate("/sales-leads/wall-listing");
    },
    [navigate, itemIdFromParams, itemToEditApiData, productSpecOptionsForSelect] // Added productSpecOptionsForSelect
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

  const isLoadingCombined = isLoadingInitialData || isLoadingDropdownData || masterDataAccessStatus === "idle";

  if (isLoadingCombined) {
    return (
      <Container> 
        <div className="flex justify-center items-center h-screen">
          <Spinner size={40} /> <span className="ml-2">Loading data...</span>
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
                            isLoading={isLoadingDropdownData || masterDataAccessStatus === "idle"}
                            options={productOptions}
                            value={productOptions.find(opt => opt.value === field.value) || null }
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
                            isLoading={isLoadingDropdownData || masterDataAccessStatus === "idle"}
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
                  <UiSelect 
                    isLoading={isLoadingDropdownData || masterDataAccessStatus === "idle"}
                    options={productSpecOptionsForSelect} 
                    value={productSpecOptionsForSelect.find(opt => opt.value === field.value) || null} 
                    onChange={(option) => field.onChange(option ? option.value : null)} 
                    placeholder="Select Product Specification (Optional)" 
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
            
            {/* Other rows remain the same as previous version */}
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
        <Button type="button" onClick={handleCancel} disabled={isSubmitting || isLoadingCombined} > Cancel </Button>
        <Button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting || isLoadingCombined} variant="twoTone"> Draft </Button>
        <Button 
            type="submit" 
            form="wallItemEditForm" 
            variant="solid" 
            loading={isSubmitting} 
            disabled={isSubmitting || isLoadingCombined || !formMethods.formState.isDirty || !formMethods.formState.isValid} >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemEdit;