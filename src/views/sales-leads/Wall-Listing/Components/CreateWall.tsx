// src/views/your-path/business-entities/WallItemForm.tsx
// MODIFIED: This file is now fully equipped to handle both Add and Edit operations.
// It also supports adding multiple items at once in "Add" mode.

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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

// --- NEW ZOD SCHEMA for a single item ---
// Validates fields for a single wall item form, with new mandatory fields.
const singleWallItemSchema = z.object({
  // New order & required fields
  status: z.string().min(1, "Status is required."),
  productId: z.number().min(1, "Product is required."),
  member_id: z.number().min(1, "Member is required."),
  qty: z.coerce.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1."),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, { required_error: "Intent (Want to) is required." }),
  productStatus: z.string().min(1, "Product Status is required."),
  activeHours: z.string({ required_error: "Active Hours is required." }).min(1, "Active Hours are required."),
  
  // Optional fields
  productSpecId: z.coerce.number().nullable().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative.").nullable().optional(),
  color: z.string().max(50, "Color too long.").nullable().optional(),
  cartoonTypeId: z.string().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  paymentTermId: z.coerce.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  assignedTeamId: z.coerce.number().nullable().optional(),
  remarks: z.string().nullable().optional(), // New remarks field
});

// Main form schema using an array of items.
const wallItemFormSchema = z.object({
  wallItems: z.array(singleWallItemSchema).min(1, "At least one item is required."),
});

// Type for a single item's form data
type SingleWallItemFormData = z.infer<typeof singleWallItemSchema>;
// Type for the entire form data (the array of items)
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

// Default values for a single item form
const defaultItem: SingleWallItemFormData = {
  status: "Pending",
  productId: 0,
  member_id: 0,
  qty: 1,
  intent: "Sell",
  productStatus: "Active",
  activeHours: "",
  productSpecId: null,
  price: null,
  color: "",
  cartoonTypeId: null,
  dispatchStatus: "",
  paymentTermId: null,
  eta: null,
  location: "",
  deviceCondition: null,
  assignedTeamId: null,
  remarks: "",
};


// --- REFINED ---
// Helper function to transform API data TO a single form item structure (for setting/resetting the form)
const transformApiDataToSingleFormItem = (apiData: any): SingleWallItemFormData => {
  return {
    status: apiData?.status || "Pending",
    productId: Number(apiData?.product_id),
    member_id: Number(apiData?.customer_id),
    qty: Number(apiData?.qty) || 1,
    intent: apiData?.want_to || "Sell",
    productStatus: apiData?.product_status || "Active",
    activeHours: apiData?.active_hrs || "",
    productSpecId: apiData?.product_spec_id ? Number(apiData.product_spec_id) : null,
    price: apiData?.price ? Number(apiData.price) : null,
    color: apiData?.color || null,
    cartoonTypeId: apiData?.cartoon_type || null,
    dispatchStatus: apiData?.dispatch_status || null,
    paymentTermId: apiData?.payment_term ? Number(apiData.payment_term) : null,
    eta: apiData?.eta_details ? dayjs(apiData.eta_details).toDate() : null,
    location: apiData?.location || null,
    deviceCondition: apiData?.device_condition || null,
    assignedTeamId: apiData?.assigned_team_id ? Number(apiData.assigned_team_id) : null,
    remarks: apiData?.warranty_info || apiData?.internal_remarks || null,
  };
};

// --- MODIFIED as per request ---
// Helper function to transform a single form item BACK TO API payload structure
const transformSingleItemToApiPayload = (formData: SingleWallItemFormData, initialData: any | null) => {
  // This is the base payload containing all fields from the form, mapped to API keys.
  const payloadFromForm = {
    status: formData.status,
    product_id: String(formData.productId),
    customer_id: String(formData.member_id),
    qty: String(formData.qty),
    want_to: formData.intent,
    product_status: formData.productStatus,
    active_hrs: formData.activeHours,
    product_spec_id: formData.productSpecId ? String(formData.productSpecId) : null,
    price: formData.price !== null && formData.price !== undefined ? String(formData.price) : null,
    color: formData.color || null,
    cartoon_type: formData.cartoonTypeId || null,
    dispatch_status: formData.dispatchStatus || null,
    payment_term: formData.paymentTermId ? String(formData.paymentTermId) : null,
    eta_details: formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null,
    location: formData.location || null,
    device_condition: formData.deviceCondition || null,
    assigned_team_id: formData.assignedTeamId ? String(formData.assignedTeamId) : null,
    warranty_info: formData.remarks || null,
  };

  // For "Edit" mode, we add the item's ID. The Redux action will handle adding `_method: "PUT"`.
  if (initialData) {
    return {
      ...payloadFromForm,
      id: initialData.id,
    };
  }

  // For "Add" mode, we send only the fields from the form, as requested.
  return payloadFromForm;
};

const WallItemForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const itemId = location.state; 
  const isEditMode = !!itemId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);

  const {
    productsMasterData = [],
    memberData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    salesPerson = [],
    getwallItemsData, 
  } = useSelector(masterSelector);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    mode: 'onTouched',
    defaultValues: {
      wallItems: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: "wallItems",
  });

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

  useEffect(() => {
    if (isEditMode && getwallItemsData?.id === itemId) {
      const formItemForEdit = transformApiDataToSingleFormItem(getwallItemsData);
      formMethods.reset({ wallItems: [formItemForEdit] });
    }
  }, [isEditMode, itemId, getwallItemsData, formMethods]);

  // --- Dropdown options (memoized for efficiency) ---
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

  const onFormSubmit = async (formData: WallItemFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const singleItemData = formData.wallItems[0];
        const payload = transformSingleItemToApiPayload(singleItemData, getwallItemsData);
        await dispatch(editWallItemAction(payload)).unwrap();
        toast.push(<Notification title="Update Successful" type="success">Wall item has been updated.</Notification>);
      } else {
        const addPromises = formData.wallItems.map(item => {
          const payload = transformSingleItemToApiPayload(item, null);
          return dispatch(addWallItemAction(payload)).unwrap();
        });
        await Promise.all(addPromises);
        toast.push(<Notification title="Items Added" type="success">{formData.wallItems.length} new wall item(s) have been created.</Notification>);
      }
      navigate("/sales-leads/wall-listing");
    } catch (error: any) {
      toast.push(<Notification title={isEditMode ? "Update Failed" : "Add Failed"} type="danger">{error.message || "An unexpected error occurred."}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/sales-leads/wall-listing");

  if (isEditMode && isLoadingPageData) {
    return <div className="flex justify-center items-center h-60"><Spinner size="40px" /></div>;
  }

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/wall-listing"><h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6></NavLink>
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
          className="flex flex-col"
        >
          <div className="flex flex-col gap-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md relative flex flex-col gap-4">
                {index > 0 && <hr className="absolute -top-3 left-0 w-full" />}
                <div className="flex justify-between items-center">
                  <h5 className="font-semibold">Item {index + 1}</h5>
                  {index > 0 && ( <Button type="button" size="sm" variant="plain" onClick={() => remove(index)}> Remove </Button> )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* --- NEW FIELD ORDER --- */}
                  <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.status} errorMessage={formMethods.formState.errors.wallItems?.[index]?.status?.message}>
                    <Controller name={`wallItems.${index}.status`} control={formMethods.control} render={({ field }) => (<UiSelect options={statusOptions} value={statusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : null)} placeholder="Select Status" />)} />
                  </FormItem>
                  <FormItem label={<div>Product Name<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.productId} errorMessage={formMethods.formState.errors.wallItems?.[index]?.productId?.message}>
                    <Controller name={`wallItems.${index}.productId`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={productOptions} value={productOptions.find(opt => opt.value === field.value) || null} onChange={option => field.onChange(option ? option.value : 0)} placeholder="Select Product Name" isClearable />)} />
                  </FormItem>
                  <FormItem label={<div>Member Name<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.member_id} errorMessage={formMethods.formState.errors.wallItems?.[index]?.member_id?.message}>
                    <Controller name={`wallItems.${index}.member_id`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={memberOptions} value={memberOptions.find(opt => opt.value === field.value) || null} onChange={option => field.onChange(option ? option.value : 0)} placeholder="Select Member Name" isClearable />)} />
                  </FormItem>
                  <FormItem label={<div>Quantity<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.qty} errorMessage={formMethods.formState.errors.wallItems?.[index]?.qty?.message}>
                    <Controller name={`wallItems.${index}.qty`} control={formMethods.control} render={({ field }) => (<InputNumber {...field} placeholder="Enter Quantity" />)} />
                  </FormItem>
                  <FormItem label={<div>Intent (Want to)<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.intent} errorMessage={formMethods.formState.errors.wallItems?.[index]?.intent?.message}>
                    <Controller name={`wallItems.${index}.intent`} control={formMethods.control} render={({ field }) => (<UiSelect options={intentOptions} value={intentOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : null)} placeholder="Select Intent" />)} />
                  </FormItem>
                  <FormItem label={<div>Product Status<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.productStatus} errorMessage={formMethods.formState.errors.wallItems?.[index]?.productStatus?.message}>
                    <Controller name={`wallItems.${index}.productStatus`} control={formMethods.control} render={({ field }) => (<UiSelect options={productStatusOptions} value={productStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : null)} placeholder="Select Product Status" />)} />
                  </FormItem>
                  <FormItem label="Product Spec" invalid={!!formMethods.formState.errors.wallItems?.[index]?.productSpecId} errorMessage={formMethods.formState.errors.wallItems?.[index]?.productSpecId?.message}>
                    <Controller name={`wallItems.${index}.productSpecId`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={productSpecOptionsForSelect} value={productSpecOptionsForSelect.find(opt => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : null)} placeholder="Select Product Spec" isClearable />)} />
                  </FormItem>
                  <FormItem label="Price" invalid={!!formMethods.formState.errors.wallItems?.[index]?.price} errorMessage={formMethods.formState.errors.wallItems?.[index]?.price?.message}>
                    <Controller name={`wallItems.${index}.price`} control={formMethods.control} render={({ field }) => (<InputNumber {...field} value={field.value ?? undefined} placeholder="Enter Price (Optional)" />)} />
                  </FormItem>
                  <FormItem label="Color" invalid={!!formMethods.formState.errors.wallItems?.[index]?.color} errorMessage={formMethods.formState.errors.wallItems?.[index]?.color?.message}>
                    <Controller name={`wallItems.${index}.color`} control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="Enter Color (Optional)" />)} />
                  </FormItem>
                  <FormItem label={<div>Active Hours<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.wallItems?.[index]?.activeHours} errorMessage={formMethods.formState.errors.wallItems?.[index]?.activeHours?.message}>
                    <Controller name={`wallItems.${index}.activeHours`} control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="e.g., 9 AM - 5 PM" />)} />
                  </FormItem>
                  <FormItem label="Cartoon Type" invalid={!!formMethods.formState.errors.wallItems?.[index]?.cartoonTypeId} errorMessage={formMethods.formState.errors.wallItems?.[index]?.cartoonTypeId?.message}>
                    <Controller name={`wallItems.${index}.cartoonTypeId`} control={formMethods.control} render={({ field }) => (<UiSelect options={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name, }))} value={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name })).find((opt) => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : null)} placeholder="Select Cartoon Type" isClearable />)} />
                  </FormItem>
                  <FormItem label="Dispatch Status" invalid={!!formMethods.formState.errors.wallItems?.[index]?.dispatchStatus} errorMessage={formMethods.formState.errors.wallItems?.[index]?.dispatchStatus?.message}>
                    <Controller name={`wallItems.${index}.dispatchStatus`} control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="e.g., Ready to Ship" />)} />
                  </FormItem>
                  <FormItem label="Payment Term" invalid={!!formMethods.formState.errors.wallItems?.[index]?.paymentTermId} errorMessage={formMethods.formState.errors.wallItems?.[index]?.paymentTermId?.message}>
                    <Controller name={`wallItems.${index}.paymentTermId`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={paymentTermsOption} value={paymentTermsOption.find(opt => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : null)} placeholder="Select Payment Term" isClearable />)} />
                  </FormItem>
                  <FormItem label="ETA" invalid={!!formMethods.formState.errors.wallItems?.[index]?.eta} errorMessage={formMethods.formState.errors.wallItems?.[index]?.eta?.message}>
                    <Controller name={`wallItems.${index}.eta`} control={formMethods.control} render={({ field }) => (<DatePicker {...field} value={field.value} onChange={(date) => field.onChange(date)} placeholder="Select ETA" inputFormat="YYYY-MM-DD" />)} />
                  </FormItem>
                  <FormItem label="Location" invalid={!!formMethods.formState.errors.wallItems?.[index]?.location} errorMessage={formMethods.formState.errors.wallItems?.[index]?.location?.message}>
                    <Controller name={`wallItems.${index}.location`} control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="Enter Location" />)} />
                  </FormItem>
                  <FormItem label="Device Condition" invalid={!!formMethods.formState.errors.wallItems?.[index]?.deviceCondition} errorMessage={formMethods.formState.errors.wallItems?.[index]?.deviceCondition?.message}>
                    <Controller name={`wallItems.${index}.deviceCondition`} control={formMethods.control} render={({ field }) => (<Radio.Group value={field.value} onChange={field.onChange}> {deviceConditionRadioOptions.map(opt => (<Radio key={opt.value} value={opt.value}>{opt.label}</Radio>))} </Radio.Group>)} />
                  </FormItem>
                  <FormItem label="Assigned Team" invalid={!!formMethods.formState.errors.wallItems?.[index]?.assignedTeamId} errorMessage={formMethods.formState.errors.wallItems?.[index]?.assignedTeamId?.message}>
                    <Controller name={`wallItems.${index}.assignedTeamId`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={salesPersonOptions} value={salesPersonOptions.find(opt => opt.value === field.value) || null} onChange={opt => field.onChange(opt ? opt.value : null)} placeholder="Select Assigned Team" isClearable />)} />
                  </FormItem>
                  <FormItem label="Remarks" className="md:col-span-3" invalid={!!formMethods.formState.errors.wallItems?.[index]?.remarks} errorMessage={formMethods.formState.errors.wallItems?.[index]?.remarks?.message}>
                    <Controller name={`wallItems.${index}.remarks`} control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={3} placeholder="Enter remarks, warranty info, or other notes" />)} />
                  </FormItem>
                </div>
              </div>
            ))}
          </div>

          {!isEditMode && (
            <div className="p-4 mt-4 flex justify-end">
              <Button type="button" onClick={() => append(defaultItem)}> Add New Form </Button>
            </div>
          )}
        </Form>
      </Card>

      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}> Cancel </Button>
        <Button type="submit" form="wallItemAddForm" variant="solid" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
        </Button>
      </Card>
    </>
  );
};

export default WallItemForm;