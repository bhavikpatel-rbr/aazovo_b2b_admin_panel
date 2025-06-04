// src/views/your-path/business-entities/WallItemEdit.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
    getPaymentTermAction,
    getAllProductAction,
    getWallItemById, // Used in WallItemAdd, assuming it's for product names
    // getWallItemByIdAction, // << YOU WOULD ADD AN ACTION LIKE THIS FOR REAL API
} from '@/reduxtool/master/middleware'; // VERIFY PATH
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH


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
  source?: string;
  created_by?: string;
  is_wall_manual?: string;
  created_at_from_api?: string | null;
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

// Define option types
type ProductOptionType = { value: string; label: string; id: number };
type CompanyOptionType = { value: string; label: string; id: number };
type ProductSpecOptionType = { value: number; label: string };
type PaymentTermType = { value: string; label: string; id: number };


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

// Simulate API call to fetch a single item by ID
// In a real app, this logic would be replaced by a Redux thunk/action
// that makes an API request and stores the result in the Redux store.
// const fetchWallItemFromApi = async (id: number): Promise<ApiFetchedWallItem | null> => {
//     console.log(`Simulating API fetch for item ID: ${id}`);
//     await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

//     // Example: This item ID (1) has data. Other IDs might not.
//     if (id === 1) {
//         return {
//             id: 1,
//             // Ensure these names can be found in your dynamic product/company options for correct UiSelect pre-selection
//             product_name: "Electric Drill XT5000", // Assuming "Electric Drill XT5000" exists in productOptions
//             company_name: "ToolMaster Inc.",       // Assuming "ToolMaster Inc." exists in companyOptions
//             product_id_from_api: 101, // This ID should correspond to "Electric Drill XT5000"
//             customer_id_from_api: 201, // This ID should correspond to "ToolMaster Inc."
//             quantity: 55,
//             price: 179.99,
//             intent: "Sell",
//             product_status_from_api: "Active", // Matches a `value` in productStatusOptions
//             cartoon_type_id: 1,
//             internal_remarks: "Fetched from API: Special discount applied. Monitor stock.",
//             active_hours: "9 AM - 6 PM Mon-Fri",
//             product_spec_id: 2, // Assuming this ID exists in productSpecOptions
//             color: "Blue",
//             dispatch_status: "Ready for dispatch",
//             dispatch_mode_from_api: "Pickup", // Matches a `value` in dispatchModeOptions
//             payment_term_id: 1,
//             eta_from_api: dayjs().add(10, 'day').format("YYYY-MM-DD"), // e.g., 10 days from now
//             device_condition_from_api: "New", // Matches a `value` in deviceConditionRadioOptions
//             location: "Warehouse Alpha, Bay 3",
//             listing_type_from_api: "Regular", // Matches a `value` in listingTypeOptions
//             visibility: "public", // Matches a `value` in visibilityOptions
//             priority_from_api: "Medium", // Matches a `value` in priorityOptions
//             admin_status_from_api: "Pending", // Matches a `value` in adminStatusOptions
//             assigned_team_id_from_api: 2,
//             product_url_from_api: "https://example.com/drill-xt5000-pro",
//             warranty_info_from_api: "3-year extended warranty.",
//             return_policy_from_api: "60-day no-questions-asked returns.",
//             source: "api_database_live",
//             created_by: "user_abc_567",
//             is_wall_manual: "0",
//             created_at_from_api: dayjs().subtract(5, 'day').toISOString(), // e.g., 5 days ago
//         };
//     }
//     return null; // Item not found for other IDs
// };


const WallItemEdit = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: itemIdFromParams } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(true);

  const [itemToEditApiData, setItemToEditApiData] = useState<ApiFetchedWallItem | null>(null);

  const {
    productsMasterData = [],
    rawProfileArrayFromState = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    status: masterDataAccessStatus = 'idle',
    // currentWallItem, // << YOU WOULD USE A SELECTOR LIKE THIS
    // currentWallItemStatus, // << AND ITS STATUS
  } = useSelector(masterSelector);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
  });

  const paymentTermsOption: PaymentTermType[] = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((payment: any) => ({
      value: payment.term_name || payment.term_name, // Adjust if payment name field is different
      label: payment.term_name || payment.term_name,
      id: payment.id,
    }));
  }, [PaymentTermsData]);

   const productOptions: ProductOptionType[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    // For simulation to work, ensure the names used in `fetchWallItemFromApi`
    // can be generated by this mapping or exist in `productsMasterData`.
    // Example: if `fetchWallItemFromApi` returns `product_name: "Electric Drill XT5000"`,
    // one of the `productsMasterData` items should have `name: "Electric Drill XT5000"`.
    return productsMasterData.map((product: any) => ({
      value: product.name,
      label: `${product.name}${product.sku_code ? ` (${product.sku_code})` : ''}`.trim(),
      id: product.id,
    }));
  }, [productsMasterData]);
  

  const companyOptions: CompanyOptionType[] = useMemo(() => {
    if (!Array.isArray(rawProfileArrayFromState)) return [];
    // Similar to productOptions, ensure names match for pre-selection.
    return rawProfileArrayFromState.map((company: any) => ({
      value: company.company_name || company.name,
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


  // --- Fetch dropdown data and initial item data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Invalid item ID provided.</Notification>);
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
          dispatch(getPaymentTermAction()),
        ]);
        setIsLoadingDropdownData(false);

        // Fetch the specific item to edit
        const id = parseInt(itemIdFromParams, 10);
        if (isNaN(id)) {
          toast.push(<Notification title="Error" type="danger">Invalid item ID format.</Notification>);
          navigate("/sales-leads/wall-listing");
          setIsLoadingInitialData(false); // Clear loading state
          return;
        }

        // In a real app, this would be:
        // dispatch(getWallItemByIdAction(id));
        // And then you'd select the item from the Redux store using `useSelector`.
        // The result would then be set to `itemToEditApiData` or used directly.
        // For this simulation, we call our mocked fetch function:
        const fetchedApiItem = await dispatch(getWallItemById(id)).unwrap();


        if (fetchedApiItem) {
          setItemToEditApiData(fetchedApiItem);
        } else {
          toast.push(<Notification title="Error" type="danger">Wall item not found (ID: {id}).</Notification>);
          navigate("/sales-leads/wall-listing");
        }
      } catch (error) {
        console.error("Failed to fetch data for edit form:", error);
        toast.push(<Notification title="Data Load Error" type="danger">Could not load required data for editing.</Notification>);
        if (isLoadingDropdownData) setIsLoadingDropdownData(false);
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchData();
  }, [dispatch, itemIdFromParams, navigate]); // isLoadingDropdownData removed as it's managed inside

  // --- Populate form once all data is available ---
  useEffect(() => {
    if (itemToEditApiData && (!isLoadingDropdownData || ['succeeded', 'failed'].includes(masterDataAccessStatus))) {
      const matchedProductStatusOption = productStatusOptions.find(opt =>
        opt.label.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        itemToEditApiData?.product_status_from_api ||
        opt.value.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        itemToEditApiData?.product_status_from_api
      );

      formMethods.reset({
        product_name: itemToEditApiData.product_name,
        company_name: itemToEditApiData.company_name,
        qty: itemToEditApiData.quantity,
        price: itemToEditApiData.price,
        intent: itemToEditApiData.intent,
        productStatus: matchedProductStatusOption?.value || productStatusOptions[0]?.value || '',
        productSpecId: itemToEditApiData.product_spec_id,
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
        productId: itemToEditApiData.product_id_from_api,
        customerId: itemToEditApiData.customer_id_from_api,
      });
    }
  }, [itemToEditApiData, formMethods, isLoadingDropdownData, masterDataAccessStatus, productOptions, companyOptions, productSpecOptionsForSelect]);


  const onFormSubmit = useCallback(
    async (formData: WallItemFormData) => {
      if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Item ID is missing.</Notification>);
        return;
      }
      setIsSubmitting(true);

      const productSpecDetails = formData.productSpecId
        ? productSpecOptionsForSelect.find(spec => spec.value === formData.productSpecId)
        : null;
      
      const cartoonTypeDetails = formData.cartoonTypeId
        ? dummyCartoonTypes.find(ct => ct.id === formData.cartoonTypeId)
        : null;

      const loggedPayload: any = { ...formData }; 

      loggedPayload.id = parseInt(itemIdFromParams, 10);
      loggedPayload.product_id = String(formData.productId);
      loggedPayload.customer_id = String(formData.customerId);
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

      loggedPayload.created_from = "FormUI-Edit"; 
      loggedPayload.source = itemToEditApiData?.source || "in_edit"; // Use fetched source or a default for edit
      loggedPayload.delivery_details = null;
      loggedPayload.created_by = itemToEditApiData?.created_by || "1"; // Use fetched creator or default
      loggedPayload.expired_date = null;
      
      loggedPayload.created_at = itemToEditApiData?.created_at_from_api || new Date().toISOString();
      loggedPayload.updated_at = new Date().toISOString(); 
      
      loggedPayload.is_wall_manual = itemToEditApiData?.is_wall_manual || "0"; // Use fetched value or default

      loggedPayload.product = {
          id: formData.productId,
          name: formData.product_name,
          description: null, 
          status: formData.productStatus, 
      };
      loggedPayload.product_spec = productSpecDetails ? { id: productSpecDetails.value, name: productSpecDetails.label } : null;
      loggedPayload.customer = {
          id: formData.customerId,
          name: formData.company_name,
      };
      loggedPayload.company = null;

      console.log("--- WallItemEdit Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", formData);
      console.log("2. Item to Edit (API data used for form population):", itemToEditApiData);
      console.log("3. Constructed Payload (for API/logging - matches target structure, includes all form data):", loggedPayload);
      console.log("--- End WallItemEdit Form Submission Log ---");
      
      // Simulate API call for update
      // In a real app: await dispatch(updateWallItemAction(loggedPayload));
      await new Promise(res => setTimeout(res, 1000));

      toast.push(<Notification title="Success" type="success">Wall item updated. (Simulated)</Notification>);
      setIsSubmitting(false);
      navigate("/sales-leads/wall-listing");
    },
    [navigate, itemIdFromParams, itemToEditApiData, productSpecOptionsForSelect]
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
        // Retain original source/creator if available from itemToEditApiData for drafts
        source: itemToEditApiData?.source,
        created_by: itemToEditApiData?.created_by,
        is_wall_manual: itemToEditApiData?.is_wall_manual,
        created_at_from_api: itemToEditApiData?.created_at_from_api,

    };
    console.log("Saving as draft (Edit):", draftData);
    toast.push(<Notification title="Draft Saved" type="info">Changes saved as draft. (Simulated)</Notification>);
  };

  // Combined loading state: true if initial item data is loading OR dropdown data is loading (either via its own state or Redux status)
  const isLoadingCombined = isLoadingInitialData || isLoadingDropdownData || masterDataAccessStatus === "idle" || masterDataAccessStatus === "idle";


  if (isLoadingCombined) {
    return (
      <Container> 
        <div className="flex justify-center items-center h-screen">
          <Spinner size={40} /> <span className="ml-2">Loading data...</span>
        </div>
      </Container>
    );
  }
  
  if (!itemToEditApiData && !isLoadingInitialData) { // Handles case where item wasn't found but initial load finished
    return (
      <Container>
        <div className="text-center p-8">
          <h4 className="text-lg font-semibold mb-2">Item Not Found</h4>
          <p>The requested wall item could not be loaded. It might have been removed or the ID is incorrect.</p>
          <Button className="mt-4" variant="solid" onClick={() => navigate("/sales-leads/wall-listing")}>
            Back to Wall Listing
          </Button>
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
                            isLoading={isLoadingDropdownData || masterDataAccessStatus === "loading" || masterDataAccessStatus === "idle"}
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
                            isLoading={isLoadingDropdownData || masterDataAccessStatus === "loading" || masterDataAccessStatus === "idle"}
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
                    isLoading={isLoadingDropdownData || masterDataAccessStatus === "loading" || masterDataAccessStatus === "idle"}
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
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemEdit;