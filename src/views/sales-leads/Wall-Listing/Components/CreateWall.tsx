// src/views/your-path/business-entities/WallItemForm.tsx
// MODIFIED: This file is now fully equipped to handle both Add and Edit operations.

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import {
  DatePicker,
  Form,
  FormItem,
  Input,
  Radio,
  Select as UiSelect,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import toast from "@/components/ui/toast";
import { BiChevronRight } from "react-icons/bi";

// Redux
import { masterSelector } from '@/reduxtool/master/masterSlice';
import {
  addWallItemAction,
  editWallItemAction,
  getAllProductAction,
  getMembersAction,
  getPaymentTermAction,
  getProductSpecificationsAction,
  getSalesPersonAction,
  getWallItemById
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';

// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// --- MODIFIED & CORRECTED ZOD SCHEMA ---
// Validates the actual IDs (productId, member_id) for better reliability.
const wallItemFormSchema = z.object({
  productId: z.number().min(1, "Product is required."),
  member_id: z.number().min(1, "Member is required."),
  qty: z.coerce.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1."),
  price: z.coerce.number().min(0, "Price cannot be negative.").nullable().optional(),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, { required_error: "Intent (Want to) is required." }),
  productStatus: z.string().min(1, "Product Status is required."),
  productSpecId: z.coerce.number().nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  color: z.string().max(50, "Color too long.").nullable().optional(),
  cartoonTypeId: z.string().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  dispatchMode: z.string().nullable().optional(),
  paymentTermId: z.coerce.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  listingType: z.string().nullable().optional(),
  visibility: z.string().min(1, "Visibility is required."),
  priority: z.string().nullable().optional(),
  adminStatus: z.string().nullable().optional(),
  status: z.string().min(1, "Status is required."),
  assignedTeamId: z.coerce.number().nullable().optional(),
  activeHours: z.string().nullable().optional(),
  productUrl: z.string().url("Invalid URL format.").or(z.literal("")).optional().nullable(),
  warrantyInfo: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  internalRemarks: z.string().nullable().optional(),
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// Define option types for clarity
type ProductOptionType = { value: number; label: string };
type MemberOptionType = { value: number; label: string };
type PaymentTermType = { value: number; label: string };
type ProductSpecOptionType = { value: number; label: string };
type SalesPersonOptionType = { value: number; label: string };

// --- Form Options (Static data remains the same) ---
const intentOptions: { value: WallIntent; label: string }[] = [{ value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Exchange", label: "Exchange" }];
const productStatusOptions = [{ value: "Active", label: "Active" }, { value: "Non-active", label: "Non-active" }];
const statusOptions = [{ value: "Pending", label: "Pending" }, { value: "Active", label: "Active" }, { value: "Rejected", label: "Rejected" }, { value: "inactive", label: "Inactive" }];
const dummyCartoonTypes = [{ id: "Master Cartoon", name: "Master Cartoon" }, { id: "Non Masster Cartoon", name: "Non Masster Cartoon" }];
const deviceConditionRadioOptions = [{ value: "New", label: "New" }, { value: "Old", label: "Old" }];
const visibilityOptions = [{ value: 'Public', label: 'Public' }, { value: 'Internal', label: 'Internal' }];
const priorityOptions = [{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }];
const listingTypeOptions = [{ value: 'Featured', label: 'Featured' }, { value: 'Regular', label: 'Regular' }];
const dispatchModeOptions = [{ value: 'courier', label: 'Courier' }, { value: 'pickup', label: 'Pickup' }];
const adminStatusOptions = [{ value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }];

// --- REFINED ---
// Helper function to transform API data TO form data structure (for setting/resetting the form)
const transformApiDataToFormData = (apiData: any): WallItemFormData => {
  return {
    productId: Number(apiData?.product_id),
    member_id: Number(apiData?.customer_id),
    qty: Number(apiData?.qty) || 1,
    price: apiData?.price ? Number(apiData.price) : null,
    intent: apiData?.want_to || "Sell",
    productStatus: apiData?.product_status || "Active",
    productSpecId: apiData?.product_spec_id ? Number(apiData.product_spec_id) : null,
    deviceCondition: apiData?.device_condition || null,
    color: apiData?.color || null,
    cartoonTypeId: apiData?.cartoon_type || null,
    dispatchStatus: apiData?.dispatch_status || null,
    dispatchMode: apiData?.dispatch_mode || null,
    paymentTermId: apiData?.payment_term ? Number(apiData.payment_term) : null,
    eta: apiData?.eta_details ? dayjs(apiData.eta_details).toDate() : null,
    location: apiData?.location || null,
    listingType: apiData?.listing_type || "Regular",
    visibility: apiData?.visibility || "Public",
    priority: apiData?.priority || "Medium",
    adminStatus: apiData?.admin_status || null,
    status: apiData?.status || "Pending",
    assignedTeamId: apiData?.assigned_team_id ? Number(apiData.assigned_team_id) : null,
    activeHours: apiData?.active_hrs || null,
    productUrl: apiData?.product_url || null,
    warrantyInfo: apiData?.warranty_info || null,
    returnPolicy: apiData?.return_policy || null,
    internalRemarks: apiData?.internal_remarks || null,
  };
};

// --- REFINED ---
// Helper function to transform form data BACK TO API payload structure (for submitting the form)
const transformFormDataToApiPayload = (formData: WallItemFormData, initialData: any) => {
  return {
    // These keys might not be editable but are often required by PUT/PATCH APIs
    id: initialData?.id,
    
    // Map form state to API keys
    product_id: String(formData.productId),
    customer_id: String(formData.member_id),
    want_to: formData.intent,
    qty: String(formData.qty),
    price: formData.price !== null && formData.price !== undefined ? String(formData.price) : null,
    product_status: formData.productStatus,
    product_spec_id: formData.productSpecId ? String(formData.productSpecId) : null,
    device_condition: formData.deviceCondition,
    color: formData.color,
    cartoon_type: formData.cartoonTypeId,
    dispatch_status: formData.dispatchStatus,
    dispatch_mode: formData.dispatchMode,
    payment_term: formData.paymentTermId ? String(formData.paymentTermId) : null,
    eta_details: formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null,
    location: formData.location,
    listing_type: formData.listingType,
    visibility: formData.visibility,
    priority: formData.priority,
    admin_status: formData.adminStatus,
    status: formData.status,
    assigned_team_id: formData.assignedTeamId ? String(formData.assignedTeamId) : null,
    active_hrs: formData.activeHours,
    product_url: formData.productUrl,
    warranty_info: formData.warrantyInfo,
    return_policy: formData.returnPolicy,
    internal_remarks: formData.internalRemarks,
  };
};

const WallItemForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const itemId = location.state; // Assuming the ID is passed in state as { id: ... }
  const isEditMode = !!itemId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);

  const {
    productsMasterData = [],
    memberData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    salesPerson = [],
    getwallItemsData, // This will hold the single item data for editing
    status: masterDataAccessStatus = 'idle',
  } = useSelector(masterSelector);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    mode: 'onTouched',
    defaultValues: {
      productId: 0,
      member_id: 0,
      qty: 1,
      price: null,
      intent: "Sell",
      productStatus: "Active",
      status: "Pending",
      visibility: 'Public',
      priority: 'Medium',
      listingType: 'Regular',
      adminStatus: 'Pending',
      productSpecId: null,
      deviceCondition: null,
      color: "",
      cartoonTypeId: null,
      dispatchStatus: "",
      dispatchMode: null,
      paymentTermId: null,
      eta: null,
      location: "",
      assignedTeamId: null,
      activeHours: "",
      productUrl: "",
      warrantyInfo: "",
      returnPolicy: "",
      internalRemarks: "",
    },
  });

  // This useEffect fetches all necessary data on component mount.
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPageData(true);
      try {
        const promises = [
          dispatch(getAllProductAction()),
          dispatch(getMembersAction()),
          dispatch(getProductSpecificationsAction()),
          dispatch(getPaymentTermAction()),
          dispatch(getSalesPersonAction()),
        ];

        if (isEditMode) {
          promises.push(dispatch(getWallItemById(itemId)));
        }

        await Promise.all(promises);

      } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast.push(<Notification title="Data Load Error" type="danger">Could not load required data.</Notification>);
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchData();
  }, [dispatch, itemId, isEditMode]);

  // This useEffect populates the form once data for the item is available for editing.
  useEffect(() => {
    // Only populate if we are in EDIT mode and the specific item data has been fetched.
    // The `getwallItemsData?.id` check ensures we have the data before calling reset.
    if (isEditMode && getwallItemsData?.id === itemId) {
      const formDataForEdit = transformApiDataToFormData(getwallItemsData);
      formMethods.reset(formDataForEdit);
    }
  }, [isEditMode, itemId, getwallItemsData, formMethods]);

  // --- Dropdown options (useMemo hooks are more efficient) ---
  const productOptions: ProductOptionType[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: any) => ({ value: product.id, label: product.name }));
  }, [productsMasterData]);

  const memberOptions: MemberOptionType[] = useMemo(() => {
    const companies = memberData?.data || memberData || [];
    if (!Array.isArray(companies)) return [];
    return companies.map((company: any) => ({ value: company.id, label: company.name }));
  }, [memberData]);

  const paymentTermsOption: PaymentTermType[] = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((payment: any) => ({ value: payment.id, label: payment.term_name || 'Unnamed Term' }));
  }, [PaymentTermsData]);

  const productSpecOptionsForSelect: ProductSpecOptionType[] = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((spec: any) => ({ value: spec.id, label: spec.name }));
  }, [ProductSpecificationsData]);

  const salesPersonOptions: SalesPersonOptionType[] = useMemo(() => {
    if (!Array.isArray(salesPerson)) return [];
    return salesPerson.map((person: any) => ({ value: person.id, label: person.name }));
  }, [salesPerson]);


  // Form submission handler
  const onFormSubmit = async (formData: WallItemFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // --- EDIT LOGIC ---
        const payload = transformFormDataToApiPayload(formData, getwallItemsData);
        await dispatch(editWallItemAction(payload)).unwrap();
        toast.push(
          <Notification title="Update Successful" type="success">
            Wall item has been updated.
          </Notification>
        );
      } else {
        // --- ADD LOGIC ---
        const payload = transformFormDataToApiPayload(formData, null);
        const addPayload = {
          ...payload,
          created_from: "FormUI-Add",
          source: "in",
          is_wall_manual: "0",
        };
        await dispatch(addWallItemAction(addPayload)).unwrap();
        toast.push(
          <Notification title="Item Added" type="success">
            New wall item has been created.
          </Notification>
        );
      }
      navigate("/sales-leads/wall-listing");

    } catch (error: any) {
      toast.push(
        <Notification title={isEditMode ? "Update Failed" : "Add Failed"} type="danger">
          {error.message || "An unexpected error occurred."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/sales-leads/wall-listing");
  };

  if (isEditMode && isLoadingPageData) {
    return (
      <div className="flex justify-center items-center h-60">
        <Spinner size="40px" />
      </div>
    );
  }
  
  // Get product name for display in toast/title
  const getProductName = (productId: number) => productOptions.find(p => p.value === productId)?.label || 'the';

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/wall-listing">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className="font-semibold text-primary">{isEditMode ? 'Edit Wall Item' : 'Add New Wall Item'}</h6>
      </div>
      <Card>
        <Form
          id="wallItemAddForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            toast.push(<Notification title="Validation Error" type="warning">Please fix the errors before submitting.</Notification>);
          })}
          className="flex flex-col gap-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4 p-4">
            {/* --- MODIFIED CONTROLLERS --- */}
            <FormItem
              label={<div>Product Name<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.productId}
              errorMessage={formMethods.formState.errors.productId?.message}
            >
              <Controller
                name="productId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isLoading={isLoadingPageData}
                    options={productOptions}
                    value={productOptions.find(opt => opt.value === field.value) || null}
                    onChange={option => field.onChange(option ? option.value : 0)}
                    placeholder="Select Product Name"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label={<div>Member Name<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.member_id}
              errorMessage={formMethods.formState.errors.member_id?.message}
            >
              <Controller
                name="member_id"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isLoading={isLoadingPageData}
                    options={memberOptions}
                    value={memberOptions.find(opt => opt.value === field.value) || null}
                    onChange={option => field.onChange(option ? option.value : 0)}
                    placeholder="Select Member Name"
                    isClearable
                  />
                )}
              />
            </FormItem>
            {/* --- REMAINDER OF THE FORM IS LARGELY UNCHANGED, JUST BENEFITS FROM CLEANER STATE --- */}
            <FormItem
              label={<div>Quantity<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.qty}
              errorMessage={formMethods.formState.errors.qty?.message}
            >
              <Controller name="qty" control={formMethods.control} render={({ field }) => (<InputNumber {...field} placeholder="Enter Quantity" />)} />
            </FormItem>

            {/* Row 2 */}
            <FormItem
              label="Price"
              invalid={!!formMethods.formState.errors.price}
              errorMessage={formMethods.formState.errors.price?.message}
            >
              <Controller name="price" control={formMethods.control} render={({ field }) => (<InputNumber {...field} value={field.value ?? undefined} placeholder="Enter Price (Optional)" />)} />
            </FormItem>
            <FormItem
              label={<div>Intent (Want to)<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.intent}
              errorMessage={formMethods.formState.errors.intent?.message}
            >
              <Controller name="intent" control={formMethods.control} render={({ field }) => (<UiSelect options={intentOptions} {...field}
                value={intentOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Intent" />)} />
            </FormItem>
            <FormItem
              label={<div>Product Status<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller name="productStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={productStatusOptions} {...field}
                value={productStatusOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Product Status" />)} />
            </FormItem>

            {/* Row 3 */}
            <FormItem
              label="Product Spec"
              invalid={!!formMethods.formState.errors.productSpecId}
              errorMessage={formMethods.formState.errors.productSpecId?.message}
            >
              <Controller name="productSpecId" control={formMethods.control} render={({ field }) => (
                <UiSelect
                  isLoading={isLoadingPageData}
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
              <Controller name="color" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="Enter Color (Optional)" />)} />
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
              <Controller name="dispatchStatus" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="e.g., Ready to Ship (Optional)" />)} />
            </FormItem>
            <FormItem
              label="Dispatch Mode"
              invalid={!!formMethods.formState.errors.dispatchMode}
              errorMessage={formMethods.formState.errors.dispatchMode?.message}
            >
              <Controller name="dispatchMode" control={formMethods.control} render={({ field }) => (<UiSelect options={dispatchModeOptions} {...field}
                value={dispatchModeOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Dispatch Mode (Optional)"
                isClearable
              />)} />
            </FormItem>

            {/* Row 5 */}
            <FormItem
              label="Payment Term"
              invalid={!!formMethods.formState.errors.paymentTermId}
              errorMessage={formMethods.formState.errors.paymentTermId?.message}
            >
              <Controller name="paymentTermId" control={formMethods.control} render={({ field }) => (
                <UiSelect
                  isLoading={isLoadingPageData}
                  options={paymentTermsOption}
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
              <Controller name="eta" control={formMethods.control} render={({ field }) => (<DatePicker {...field} value={field.value} onChange={(date) => field.onChange(date)} placeholder="Select ETA (Optional)" inputFormat="YYYY-MM-DD" />)} />
            </FormItem>
            <FormItem
              label="Location"
              invalid={!!formMethods.formState.errors.location}
              errorMessage={formMethods.formState.errors.location?.message}
            >
              <Controller name="location" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="Enter Location (Optional)" />)} />
            </FormItem>

            {/* Row 6: Listing Configuration */}
            <FormItem
              label="Listing Type"
              invalid={!!formMethods.formState.errors.listingType}
              errorMessage={formMethods.formState.errors.listingType?.message}
            >
              <Controller name="listingType" control={formMethods.control} render={({ field }) => (<UiSelect options={listingTypeOptions} {...field}
                value={listingTypeOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Listing Type"
                isClearable />)} />
            </FormItem>
            <FormItem
              label={<div>Visibility<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.visibility}
              errorMessage={formMethods.formState.errors.visibility?.message}
            >
              <Controller name="visibility" control={formMethods.control} render={({ field }) => (<UiSelect options={visibilityOptions} {...field}
                value={visibilityOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Visibility" />)} />
            </FormItem>
            <FormItem
              label="Priority"
              invalid={!!formMethods.formState.errors.priority}
              errorMessage={formMethods.formState.errors.priority?.message}
            >
              <Controller name="priority" control={formMethods.control} render={({ field }) => (<UiSelect options={priorityOptions} {...field}
                value={priorityOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Priority (Optional)"
                isClearable
              />)} />
            </FormItem>

            {/* Row 7: Admin & Active Hours */}
            <FormItem
              label="Admin Status"
              invalid={!!formMethods.formState.errors.adminStatus}
              errorMessage={formMethods.formState.errors.adminStatus?.message}
            >
              <Controller name="adminStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={adminStatusOptions} {...field}
                value={adminStatusOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Admin Status"
                isClearable />)} />
            </FormItem>
            <FormItem
              label={<div>Status<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.status}
              errorMessage={formMethods.formState.errors.status?.message}
            >
              <Controller
                name="status"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Status"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Assigned Team"
              invalid={!!formMethods.formState.errors.assignedTeamId}
              errorMessage={formMethods.formState.errors.assignedTeamId?.message}
            >
              <Controller name="assignedTeamId" control={formMethods.control} render={({ field }) => (
                <UiSelect
                  isLoading={isLoadingPageData}
                  options={salesPersonOptions} {...field}
                  value={salesPersonOptions.find(opt => opt.value === field.value) || null}
                  onChange={opt => field.onChange(opt ? opt.value : null)}
                  placeholder="Select Assigned Team (Optional)"
                  isClearable
                />
              )} />
            </FormItem>

            {/* Row 8 */}
            <FormItem
              label="Active Hours"
              invalid={!!formMethods.formState.errors.activeHours}
              errorMessage={formMethods.formState.errors.activeHours?.message}
            >
              <Controller name="activeHours" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="e.g., 9 AM - 5 PM, 24/7 (Optional)" />)} />
            </FormItem>
            <FormItem
              label="Product URL"
              className="md:col-span-1"
              invalid={!!formMethods.formState.errors.productUrl}
              errorMessage={formMethods.formState.errors.productUrl?.message}
            >
              <Controller name="productUrl" control={formMethods.control} render={({ field }) => (<Input type="url" {...field} value={field.value || ''} placeholder="https://example.com/product (Optional)" />)} />
            </FormItem>
            <FormItem
              label="Warranty Info"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.warrantyInfo}
              errorMessage={formMethods.formState.errors.warrantyInfo?.message}
            >
              <Controller name="warrantyInfo" control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={2} placeholder="Enter warranty details (Optional)" />)} />
            </FormItem>

            <FormItem
              label="Return Policy"
              className="md:col-span-3"
              invalid={!!formMethods.formState.errors.returnPolicy}
              errorMessage={formMethods.formState.errors.returnPolicy?.message}
            >
              <Controller name="returnPolicy" control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={3} placeholder="Enter return policy (Optional)" />)} />
            </FormItem>

            <FormItem
              label="Internal Remarks"
              className="md:col-span-3"
              invalid={!!formMethods.formState.errors.internalRemarks}
              errorMessage={
                formMethods.formState.errors.internalRemarks?.message
              }
            >
              <Controller name="internalRemarks" control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={3} placeholder="Internal notes for this listing (Optional)" />)} />
            </FormItem>
          </div>
        </Form>
      </Card>

      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting} > Cancel </Button>
        <Button type="submit" form="wallItemAddForm" variant="solid" loading={isSubmitting} disabled={isSubmitting} >
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
        </Button>
      </Card>
    </>
  );
};

export default WallItemForm;