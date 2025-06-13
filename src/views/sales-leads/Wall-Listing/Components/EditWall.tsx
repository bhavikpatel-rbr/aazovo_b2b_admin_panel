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
    getWallItemById,
    editWallItemAction, // Used in WallItemAdd, assuming it's for product names
    // getWallItemByIdAction, // << YOU WOULD ADD AN ACTION LIKE THIS FOR REAL API
} from '@/reduxtool/master/middleware'; // VERIFY PATH
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH


// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// API data structure for fetching an item
export type ApiFetchedWallItem = {
  id: number;
  qty: number;
  price: number | null;
  want_to: WallIntent;
  product_status: string;
  cartoon_type: number | null;
  internal_remarks: string | null;
  active_hrs: string | null;
  product_spec_id: number | null;
  color: string | null;
  dispatch_status: string | null;
  dispatch_mode: string | null;
  payment_term: number | null;
  delivery_at: string | null;
  device_condition: string | null;
  location: string | null;
  listing_type : string | null;
  visibility: string;
  priority: string | null;
  admin_status: string | null;
  assigned_team: number | null;
  listing_url: string | null;
  warranty: string | null;
  return_policy_from_api: string | null;
  product_id?: number | null;
  company_id?: number | null;
  source?: string;
  created_by?: string;
  is_wall_manual?: string;
  created_at_from_api?: string | null;
};

// Zod Schema for Edit Wall Item Form (Identical to Add Form's schema)
const wallItemFormSchema = z.object({
  product_id: z.number().min(1, "Product Name is required."),
  company_id: z.number().min(1, "Company Name is required."),
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
  cartoonType: z.string().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  dispatchMode: z.string().optional().nullable(),
  paymentTermId: z.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  listingType: z.string().min(1,"Listing Type is required.").optional().nullable(),
  visibility: z.string().min(1, "Visibility is required."),
  priority: z.string().min(1, "Priority is required.").optional().nullable(),
  adminStatus: z.string().min(1, "Admin Status is required.").optional().nullable(),
  assignedTeamId: z.string().nullable().optional(),
  activeHours: z.string().optional().nullable(),
  productUrl: z.string().url("Invalid URL format.").or(z.literal("")).optional().nullable(),
  warrantyInfo: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  internalRemarks: z.string().nullable().optional(),
  productId: z.number().nullable().optional(),
  companyId: z.number().nullable().optional(),
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// Define option types
type ProductOptionType = { value: number; label: string; id: number };
type CompanyOptionType = { value: string; label: string; id: number };
type ProductSpecOptionType = { value: number; label: string };
type PaymentTermType = { value: number; label: string; id: number};


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
const dummyCartoonTypes: { value: string; label: string }[] = [
  { value: "Master Carton", label: "Master Carton" }, { value: "Inner Carton", label: "Inner Carton" }, { value: "Pallet", label: "Pallet" }
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
const assignedTeamOptions: { value: string; label: string }[] = [
  { value: 'Sales Team Alpha', label: 'Sales Team Alpha' }, { value: 'Sales Team Beta', label: 'Sales Team Beta' }, { value: 'Support Team', label: 'Support Team' }
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
    CompanyData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    status: masterDataAccessStatus = 'idle',
  } = useSelector(masterSelector);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
  });

  const paymentTermsOption: PaymentTermType[] = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((payment: any) => ({
      value: payment.id,
      label: payment.term_name || payment.term_name,
      id: payment.id,
    }));
  }, [PaymentTermsData]);

   const productOptions: ProductOptionType[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: any) => ({
      value: product.id,
      label: product.name,
      id: product.id,
    }));
  }, [productsMasterData]);
  

  const companyOptions: CompanyOptionType[] = useMemo(() => {
    if (!Array.isArray(CompanyData)) return [];
    return CompanyData.map((company: any) => ({
      value: company.id,
      label: company.company_id || company.name,
      id: company.id,
    }));
  }, [CompanyData]);

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
        itemToEditApiData?.product_status ||
        opt.value.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
        itemToEditApiData?.product_status
      );

      formMethods.reset({
        product_id: Number(itemToEditApiData.product_id),
        company_id: Number(itemToEditApiData.company_id),
        qty: Number(itemToEditApiData.qty),
        price: itemToEditApiData.price !== null ? Number(itemToEditApiData.price) : null,
        intent: itemToEditApiData.want_to,
        productStatus: itemToEditApiData.product_status,
        productSpecId: itemToEditApiData.product_spec_id !== null ? Number(itemToEditApiData.product_spec_id) : null,
        deviceCondition: itemToEditApiData.device_condition,
        color: itemToEditApiData.color,
        cartoonType: itemToEditApiData.cartoon_type !== null ? String(itemToEditApiData.cartoon_type) : null,
        dispatchStatus: itemToEditApiData.dispatch_status,
        dispatchMode: itemToEditApiData.dispatch_mode,
        paymentTermId: itemToEditApiData.payment_term !== null ? Number(itemToEditApiData.payment_term) : null,
        eta: itemToEditApiData.delivery_at ? dayjs(itemToEditApiData.delivery_at).toDate() : null,
        location: itemToEditApiData.location,
        listingType: itemToEditApiData.listing_type,
        visibility: itemToEditApiData.visibility,
        priority: itemToEditApiData.priority,
        adminStatus: itemToEditApiData.admin_status,
        assignedTeamId: itemToEditApiData.assigned_team !== null ? Number(itemToEditApiData.assigned_team) : null,
        activeHours: itemToEditApiData.active_hrs,
        productUrl: itemToEditApiData.listing_url,
        warrantyInfo: itemToEditApiData.warranty,
        returnPolicy: itemToEditApiData.return_policy_from_api,
        internalRemarks: itemToEditApiData.internal_remarks,
        productId: Number(itemToEditApiData.product_id),
        companyId: Number(itemToEditApiData.company_id),
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

    const cartoonTypeDetails = formData.cartoonType;
    const productSpecDetails = formData.productSpecId
      ? productSpecOptionsForSelect.find(spec => spec.value === formData.productSpecId)
      : null;

    const payload: any = {
      id: parseInt(itemIdFromParams, 10),
      product_id: formData.productId ? String(formData.productId) : null,
      company_id: formData.companyId ? String(formData.companyId) : null,
      qty: String(formData.qty),
      price: formData.price ? String(formData.price) : "0",
      want_to: formData.intent,
      product_status: formData.productStatus,
      product_spec_id: formData.productSpecId ? String(formData.productSpecId) : null,
      device_condition: formData.deviceCondition,
      color: formData.color,
      cartoon_type: formData.cartoonType ?? "",
      dispatch_status: formData.dispatchStatus,
      dispatch_mode: formData.dispatchMode,
      payment_term: formData.paymentTermId ? String(formData.paymentTermId) : "0",
      delivery_at: formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null,
      location: formData.location,
      listing_type: formData.listingType,
      visibility: formData.visibility,
      priority: formData.priority,
      admin_status: formData.adminStatus,
      assigned_to: formData.assignedTeamId ?? null,
      assigned_team: formData.assignedTeamId ?? null,
      active_hrs: String(formData.activeHours),
      product_url: formData.productUrl,
      warranty: formData.warrantyInfo,
      internal_remarks: formData.internalRemarks,
      return_policy: formData.returnPolicy,

      // Meta fields
      created_from: "FormUI-Edit",
      created_at: itemToEditApiData?.created_at_from_api || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: formData.adminStatus,
      source: itemToEditApiData?.source || "in_edit",
      is_wall_manual: itemToEditApiData?.is_wall_manual || "0",
    };

    // Optional structured fields for internal usage or relational joins
    payload.product = {
      id: formData.productId,
      name: formData.product_id,
      description: null,
      status: formData.productStatus,
    };

    payload.product_spec = productSpecDetails
      ? { id: productSpecDetails.value, name: productSpecDetails.label }
      : null;

    payload.customer = {
      id: formData.companyId,
      name: formData.company_id,
    };

    payload.company = null;

    // Simulated API call
    await dispatch(editWallItemAction(payload)).unwrap();

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
  const isLoadingCombined = isLoadingInitialData || isLoadingDropdownData || masterDataAccessStatus === "loading";


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
                label={<div>Product Name<span className="text-red-500"> * </span></div>}
                invalid={!!formMethods.formState.errors.product_id}
                errorMessage={formMethods.formState.errors.product_id?.message}
            >
                <Controller
                    name="product_id"
                    control={formMethods.control}
                    render={({ field }) => (
                        <UiSelect
                            isLoading={isLoadingDropdownData || masterDataAccessStatus === "loading"}
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
                label={<div>Company Name<span className="text-red-500"> * </span></div>}
                invalid={!!formMethods.formState.errors.company_id}
                errorMessage={formMethods.formState.errors.company_id?.message}
            >
                <Controller
                    name="company_id"
                    control={formMethods.control}
                    render={({ field }) => (
                        <UiSelect
                            isLoading={isLoadingDropdownData || masterDataAccessStatus === "loading"}
                            options={companyOptions}
                            value={companyOptions.find(opt => opt.value === field.value) || null}
                            onChange={option => {
                                 if (option) {
                                    field.onChange(option.value);
                                    formMethods.setValue('companyId', option.id, { shouldValidate: true, shouldDirty: true });
                                } else {
                                    field.onChange("");
                                    formMethods.setValue('companyId', null, { shouldValidate: true, shouldDirty: true });
                                }
                            }}
                            placeholder="Select Company Name"
                            isClearable
                        />
                    )}
                />
            </FormItem>
            <FormItem
              label={<div>Quantity<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.qty}
              errorMessage={formMethods.formState.errors.qty?.message}
            >
              <Controller name="qty" control={formMethods.control} render={({ field }) => (<InputNumber {...field} placeholder="Enter Quantity" /> )} />
            </FormItem>

            {/* Row 2 */}
            <FormItem
              label={<div>Price<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.price}
              errorMessage={formMethods.formState.errors.price?.message}
            >
              <Controller name="price" control={formMethods.control} render={({ field }) => ( <InputNumber {...field} value={field.value ?? undefined} placeholder="Enter Price (Optional)" /> )} />
            </FormItem>
            <FormItem
              label={<div>Intent (Want to)<span className="text-red-500"> * </span></div>}
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
              label={<div>Produt Status<span className="text-red-500"> * </span></div>}
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
                    isLoading={isLoadingDropdownData || masterDataAccessStatus === "loading"}
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
              invalid={!!formMethods.formState.errors.cartoonType}
              errorMessage={formMethods.formState.errors.cartoonType?.message}
            >
              <Controller name="cartoonType" control={formMethods.control} render={({ field }) => (
                  <UiSelect options={dummyCartoonTypes}
                  value={dummyCartoonTypes.find(opt => opt.value === field.value || null)} 
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
        <Button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting || isLoadingCombined}> Draft </Button>
        <Button 
            type="submit" 
            form="wallItemEditForm" 
            variant="solid" 
            loading={isSubmitting} 
            disabled={isSubmitting || isLoadingCombined} >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Card>
    </>
  );
};

export default WallItemEdit;