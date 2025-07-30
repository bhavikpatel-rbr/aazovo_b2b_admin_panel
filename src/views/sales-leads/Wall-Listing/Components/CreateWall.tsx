// src/views/your-path/business-entities/WallItemForm.tsx
// FINAL VERSION:
// - "Status" field is hidden and defaults to "Active".
// - "Assigned Team" field has been removed entirely.
// - The form UI is restructured into "Common Information" and "Product Information" sections.
// - All other functionality, including the split UI for Add mode and the full form for Edit mode, is preserved.
// - Validation messages now appear correctly for all required fields.

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
  getWallItemById
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';

// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// --- ZOD SCHEMA (Updated) ---
const singleWallItemSchema = z.object({
  status: z.string().min(1, "Status is required."),
  productId: z.number().min(1, "Product is required."),
  member_id: z.number().min(1, "Member is required."),
  qty: z.coerce.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1."),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, { required_error: "Intent (Want to) is required." }),
  productStatus: z.string().min(1, "Product Status is required."),
  activeHours: z.string({ required_error: "Active Hours is required." }).min(1, "Active Hours are required."),
  productSpecId: z.coerce.number().nullable().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative.").nullable().optional(),
  color: z.string().max(50, "Color too long.").nullable().optional(),
  cartoonTypeId: z.string().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  paymentTermId: z.coerce.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  // assignedTeamId is removed
});
const wallItemFormSchema = z.object({
  wallItems: z.array(singleWallItemSchema).min(1, "At least one item is required."),
});

// Types & Defaults (Updated)
type SingleWallItemFormData = z.infer<typeof singleWallItemSchema>;
type WallItemFormData = z.infer<typeof wallItemFormSchema>;
type OptionType<T = string | number> = { value: T; label: string };
const intentOptions: OptionType<WallIntent>[] = [{ value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }];
const productStatusOptions: OptionType[] = [{ value: "Active", label: "Active" }, { value: "Non-active", label: "Non-active" }];
const dummyCartoonTypes: OptionType[] = [{ value: "Master Cartoon", label: "Master Cartoon" }, { value: "Non Masster Cartoon", label: "Non Masster Cartoon" }];
const deviceConditionRadioOptions: OptionType[] = [{ value: "New", label: "New" }, { value: "Old", label: "Old" }];
const dispatchStatusOptions: OptionType[] = [ { value: "Pending", label: "Pending" }, { value: "Ready to Ship", label: "Ready to Ship" }, { value: "Shipped", label: "Shipped" }, { value: "Delivered", label: "Delivered" }, ];

const defaultItem: SingleWallItemFormData = { status: "Active", productId: 0, member_id: 0, qty: 1, intent: "Sell", productStatus: "Active", activeHours: "", productSpecId: null, price: null, color: "", cartoonTypeId: null, dispatchStatus: "Pending", paymentTermId: null, eta: null, location: "", deviceCondition: null, remarks: "" };

// Helper Functions (Updated)
const transformApiDataToSingleFormItem = (apiData: any): SingleWallItemFormData => ({ status: apiData?.status || "Active", productId: Number(apiData?.product_id), member_id: Number(apiData?.customer_id), qty: Number(apiData?.qty) || 1, intent: apiData?.want_to || "Sell", productStatus: apiData?.product_status || "Active", activeHours: String(apiData?.active_hrs) || "", productSpecId: apiData?.product_spec_id ? Number(apiData.product_spec_id) : null, price: apiData?.price ? Number(apiData.price) : null, color: apiData?.color || null, cartoonTypeId: apiData?.cartoon_type || null, dispatchStatus: apiData?.dispatch_status || "Pending", paymentTermId: apiData?.payment_term ? Number(apiData.payment_term) : null, eta: apiData?.eta_details ? dayjs(apiData.eta_details).toDate() : null, location: apiData?.location || null, deviceCondition: apiData?.device_condition || null, remarks: apiData?.warranty_info || apiData?.internal_remarks || null });
const transformSingleItemToApiPayload = (formData: SingleWallItemFormData, initialData: any | null) => { const payload = { status: formData.status, product_id: String(formData.productId), customer_id: String(formData.member_id), qty: String(formData.qty), want_to: formData.intent, product_status: formData.productStatus, active_hrs: formData.activeHours, product_spec_id: formData.productSpecId ? String(formData.productSpecId) : null, price: formData.price != null ? String(formData.price) : null, color: formData.color || null, cartoon_type: formData.cartoonTypeId || null, dispatch_status: formData.dispatchStatus || null, payment_term: formData.paymentTermId ? String(formData.paymentTermId) : null, eta_details: formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null, location: formData.location || null, device_condition: formData.deviceCondition || null, warranty_info: formData.remarks || null, }; if (initialData) { return { ...payload, id: initialData.id, }; } return payload; };


const WallItemForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { state: itemId } = useLocation();
  const isEditMode = !!itemId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);

  const {
    productsMasterData = [], memberData = [], ProductSpecificationsData = [],
    PaymentTermsData = [], getwallItemsData,
  } = useSelector(masterSelector);

  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    mode: 'onTouched',
    defaultValues: { wallItems: [defaultItem] },
  });

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: "wallItems",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPageData(true);
      try {
        const promises = [ dispatch(getAllProductAction()), dispatch(getMembersAction()), dispatch(getProductSpecificationsAction()), dispatch(getPaymentTermAction()), ];
        if (isEditMode) {
          promises.push(dispatch(getWallItemById(itemId)));
        }
        await Promise.all(promises);
      } catch (error) { toast.push(<Notification title="Data Load Error" type="danger">Could not load required data.</Notification>); } finally { setIsLoadingPageData(false); }
    };
    fetchData();
  }, [dispatch, itemId, isEditMode]);

  useEffect(() => {
    if (isEditMode && getwallItemsData?.id === itemId) {
      formMethods.reset({ wallItems: [transformApiDataToSingleFormItem(getwallItemsData)] });
    }
  }, [isEditMode, itemId, getwallItemsData, formMethods]);

  const productOptions: OptionType<number>[] = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: any) => ({ value: p.id, label: p.name })) : [], [productsMasterData]);
  const memberOptions: OptionType<number>[] = useMemo(() => Array.isArray(memberData) ? memberData.map((c: any) => ({ value: c.id, label: `(${c.customer_code}) - ${c.name || 'N/A'}`, })) : [], [memberData]);
  const paymentTermsOption: OptionType<number>[] = useMemo(() => Array.isArray(PaymentTermsData) ? PaymentTermsData.map((p: any) => ({ value: p.id, label: p.term_name || 'Unnamed' })) : [], [PaymentTermsData]);
  const productSpecOptionsForSelect: OptionType<number>[] = useMemo(() => Array.isArray(ProductSpecificationsData) ? ProductSpecificationsData.map((s: any) => ({ value: s.id, label: s.name })) : [], [ProductSpecificationsData]);
  
  const onFormSubmit = async (formData: WallItemFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const payload = transformSingleItemToApiPayload(formData.wallItems[0], getwallItemsData);
        await dispatch(editWallItemAction(payload)).unwrap();
        toast.push(<Notification title="Update Successful" type="success">Wall item updated.</Notification>);
      } else {
        const addPromises = formData.wallItems.map(item => dispatch(addWallItemAction(transformSingleItemToApiPayload(item, null))).unwrap());
        await Promise.all(addPromises);
        toast.push(<Notification title="Items Added" type="success">{`${formData.wallItems.length} new item(s) created.`}</Notification>);
      }
      navigate("/sales-leads/wall-listing");
    } catch (error: any) {
      toast.push(<Notification title={isEditMode ? "Update Failed" : "Add Failed"} type="danger">{error.message || "An error occurred."}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const syncCommonField = (fieldName: keyof SingleWallItemFormData, value: any) => {
    fields.forEach((_, index) => {
      formMethods.setValue(`wallItems.${index}.${fieldName}`, value, { shouldValidate: true, shouldDirty: true });
    });
  };

  const handleAddNewProduct = () => {
    const commonData = formMethods.getValues("wallItems.0");
    append({
        ...defaultItem, // Start with all pristine defaults (e.g., status: 'Active', productStatus: 'Active')
        
        // Overwrite with the common values from the first item
        member_id: commonData.member_id,
        intent: commonData.intent,
        location: commonData.location,
        paymentTermId: commonData.paymentTermId,
        eta: commonData.eta,
        dispatchStatus: commonData.dispatchStatus,
        deviceCondition: commonData.deviceCondition,

        // The rest of the fields (productId, qty, price, productStatus, etc.) will
        // retain their default values from `defaultItem`, which is what we want.
      });
  };

  const handleCancel = () => navigate("/sales-leads/wall-listing");
  
  if (isEditMode && isLoadingPageData) {
    return <div className="flex justify-center items-center h-60"><Spinner size="40px" /></div>;
  }
  
  return (
    <>
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/sales-leads/wall-listing"><h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6></NavLink>
        <BiChevronRight size={22} />
        <h6 className="font-semibold text-primary">{isEditMode ? 'Edit Wall Item' : 'Add New Wall Items'}</h6>
      </div>

      <Form id="wallItemAddForm" onSubmit={formMethods.handleSubmit(onFormSubmit)}>
        <Card>
            {isEditMode ? (
                // --- RENDER PATH 1: EDIT MODE (Restructured UI) ---
                <div className="p-4">
                  <div className="mb-6">
                      <h5 className="font-semibold mb-4">Common Information</h5>
                      <div className="grid md:grid-cols-4 gap-4">
                          <FormItem label={<div>Member Name<span className="text-red-500"> *</span></div>}>
                            <Controller name="wallItems.0.member_id" control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={memberOptions} value={memberOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value || 0)} isClearable />)} />
                            {formMethods.formState.errors.wallItems?.[0]?.member_id && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].member_id.message}</p>}
                          </FormItem>
                          <FormItem label={<div>Intent<span className="text-red-500"> *</span></div>}>
                            <Controller name="wallItems.0.intent" control={formMethods.control} render={({ field }) => (<UiSelect options={intentOptions} value={intentOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
                            {formMethods.formState.errors.wallItems?.[0]?.intent && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].intent.message}</p>}
                          </FormItem>
                          <FormItem label="Location"><Controller name="wallItems.0.location" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value || ''} /> } /></FormItem>
                          <FormItem label="Payment Term"><Controller name="wallItems.0.paymentTermId" control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={paymentTermsOption} value={paymentTermsOption.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} /></FormItem>
                          <FormItem label="ETA"><Controller name="wallItems.0.eta" control={formMethods.control} render={({ field }) => <DatePicker {...field} value={field.value} onChange={date => field.onChange(date)} inputFormat="YYYY-MM-DD" /> } /></FormItem>
                          <FormItem label="Dispatch Status"><Controller name="wallItems.0.dispatchStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={dispatchStatusOptions} value={dispatchStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} /></FormItem>
                          <FormItem label="Device Condition" className="md:col-span-2"><Controller name="wallItems.0.deviceCondition" control={formMethods.control} render={({ field }) => (<Radio.Group value={field.value} onChange={field.onChange}> {deviceConditionRadioOptions.map(opt => <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>)} </Radio.Group>)} /></FormItem>
                      </div>
                  </div>
                  <div>
                      <h5 className="font-semibold mb-4">Product Information</h5>
                      <div className="grid md:grid-cols-4 gap-4">
                          <FormItem label={<div>Product Name<span className="text-red-500"> *</span></div>}>
                            <Controller name="wallItems.0.productId" control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={productOptions} value={productOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value || 0)} isClearable />)} />
                            {formMethods.formState.errors.wallItems?.[0]?.productId && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].productId.message}</p>}
                          </FormItem>
                          <FormItem label={<div>Product Status<span className="text-red-500"> *</span></div>}>
                            <Controller name="wallItems.0.productStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={productStatusOptions} value={productStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
                            {formMethods.formState.errors.wallItems?.[0]?.productStatus && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].productStatus.message}</p>}
                          </FormItem>
                          <FormItem label={<div>Active Hours<span className="text-red-500"> *</span></div>}>
                            <Controller name="wallItems.0.activeHours" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value || ''} /> } />
                            {formMethods.formState.errors.wallItems?.[0]?.activeHours && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].activeHours.message}</p>}
                          </FormItem>
                          <FormItem label={<div>Quantity<span className="text-red-500"> *</span></div>}>
                            <Controller name="wallItems.0.qty" control={formMethods.control} render={({ field }) => <InputNumber {...field} /> } />
                            {formMethods.formState.errors.wallItems?.[0]?.qty && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].qty.message}</p>}
                          </FormItem>
                          <FormItem label="Price"><Controller name="wallItems.0.price" control={formMethods.control} render={({ field }) => <InputNumber {...field} value={field.value ?? undefined} /> } /></FormItem>
                          <FormItem label="Color"><Controller name="wallItems.0.color" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value || ''} /> } /></FormItem>
                          <FormItem label="Cartoon Type"><Controller name="wallItems.0.cartoonTypeId" control={formMethods.control} render={({ field }) => (<UiSelect options={dummyCartoonTypes} value={dummyCartoonTypes.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} /></FormItem>
                          <FormItem label="Product Spec"><Controller name="wallItems.0.productSpecId" control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={productSpecOptionsForSelect} value={productSpecOptionsForSelect.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} /></FormItem>
                          <FormItem label="Remarks" className="md:col-span-4"><Controller name="wallItems.0.remarks" control={formMethods.control} render={({ field }) => <Input textArea {...field} value={field.value || ''} rows={3} /> } /></FormItem>
                      </div>
                  </div>
                </div>
            ) : (
                // --- RENDER PATH 2: ADD MODE (Restructured UI) ---
                <>
                    <div className="p-4 border-b dark:border-gray-600">
                        <h5 className="font-semibold">1. Common Information</h5>
                        <div className="grid md:grid-cols-4 gap-4 mt-4">
                            <FormItem label={<div>Member Name<span className="text-red-500"> *</span></div>}>
                                <Controller name="wallItems.0.member_id" control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={memberOptions} value={memberOptions.find(opt => opt.value === field.value)} onChange={opt => syncCommonField('member_id', opt?.value || 0)} isClearable />)}/>
                                {formMethods.formState.errors.wallItems?.[0]?.member_id && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].member_id.message}</p>}
                            </FormItem>
                            <FormItem label={<div>Intent<span className="text-red-500"> *</span></div>}>
                                <Controller name="wallItems.0.intent" control={formMethods.control} render={({ field }) => (<UiSelect options={intentOptions} value={intentOptions.find(opt => opt.value === field.value)} onChange={opt => syncCommonField('intent', opt?.value)} />)}/>
                                {formMethods.formState.errors.wallItems?.[0]?.intent && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[0].intent.message}</p>}
                            </FormItem>
                             <FormItem label="Location"><Controller name="wallItems.0.location" control={formMethods.control} render={({ field }) => <Input {...field} onChange={e => syncCommonField('location', e.target.value)} />}/></FormItem>
                            <FormItem label="Payment Term"><Controller name="wallItems.0.paymentTermId" control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={paymentTermsOption} value={paymentTermsOption.find(opt => opt.value === field.value)} onChange={opt => syncCommonField('paymentTermId', opt?.value)} isClearable />)}/></FormItem>
                            <FormItem label="ETA"><Controller name="wallItems.0.eta" control={formMethods.control} render={({ field }) => <DatePicker {...field} value={field.value} onChange={date => syncCommonField('eta', date)} inputFormat="YYYY-MM-DD" /> }/></FormItem>
                            <FormItem label="Dispatch Status"><Controller name="wallItems.0.dispatchStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={dispatchStatusOptions} value={dispatchStatusOptions.find(opt => opt.value === field.value)} onChange={opt => syncCommonField('dispatchStatus', opt?.value)} isClearable />)}/></FormItem>
                            <FormItem label="Device Condition" className="md:col-span-2"><Controller name="wallItems.0.deviceCondition" control={formMethods.control} render={({ field }) => (<Radio.Group value={field.value} onChange={val => syncCommonField('deviceCondition', val)}> {deviceConditionRadioOptions.map(opt => <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>)} </Radio.Group>)}/></FormItem>
                        </div>
                    </div>

                    <div className="p-4">
                        <h5 className="font-semibold">2. Product Information</h5>
                        <div className="flex flex-col gap-y-6 mt-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 rounded-md border border-gray-200 dark:border-gray-600 relative">
                                    <div className="flex justify-between items-start">
                                        <h6 className="font-semibold mb-4">Product {index + 1}</h6>
                                        {fields.length > 1 && (<Button type="button" size="xs" variant="plain" onClick={() => remove(index)}>Remove</Button>)}
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <FormItem label={<div>Product Name<span className="text-red-500"> *</span></div>}>
                                          <Controller name={`wallItems.${index}.productId`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={productOptions} value={productOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value || 0)} isClearable />)} />
                                          {formMethods.formState.errors.wallItems?.[index]?.productId && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[index]?.productId?.message}</p>}
                                        </FormItem>
                                        <FormItem label={<div>Product Status<span className="text-red-500"> *</span></div>}>
                                            <Controller name={`wallItems.${index}.productStatus`} control={formMethods.control} render={({ field }) => (<UiSelect options={productStatusOptions} value={productStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} /> )}/>
                                            {formMethods.formState.errors.wallItems?.[index]?.productStatus && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[index]?.productStatus?.message}</p>}
                                        </FormItem>
                                        <FormItem label={<div>Active Hours<span className="text-red-500"> *</span></div>}>
                                            <Controller name={`wallItems.${index}.activeHours`} control={formMethods.control} render={({ field }) => <Input {...field} />}/>
                                            {formMethods.formState.errors.wallItems?.[index]?.activeHours && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[index]?.activeHours?.message}</p>}
                                        </FormItem>
                                        <FormItem label={<div>Quantity<span className="text-red-500"> *</span></div>}>
                                          <Controller name={`wallItems.${index}.qty`} control={formMethods.control} render={({ field }) => <InputNumber {...field} /> } />
                                          {formMethods.formState.errors.wallItems?.[index]?.qty && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.wallItems[index]?.qty?.message}</p>}
                                        </FormItem>
                                        <FormItem label="Price"><Controller name={`wallItems.${index}.price`} control={formMethods.control} render={({ field }) => <InputNumber {...field} value={field.value ?? undefined} /> } /></FormItem>
                                        <FormItem label="Color"><Controller name={`wallItems.${index}.color`} control={formMethods.control} render={({ field }) => <Input {...field} value={field.value || ''} /> } /></FormItem>
                                        <FormItem label="Cartoon Type"><Controller name={`wallItems.${index}.cartoonTypeId`} control={formMethods.control} render={({ field }) => (<UiSelect options={dummyCartoonTypes} value={dummyCartoonTypes.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} /></FormItem>
                                        <FormItem label="Product Spec"><Controller name={`wallItems.${index}.productSpecId`} control={formMethods.control} render={({ field }) => (<UiSelect isLoading={isLoadingPageData} options={productSpecOptionsForSelect} value={productSpecOptionsForSelect.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} /></FormItem>
                                        <FormItem label="Remarks" className="lg:col-span-full"><Controller name={`wallItems.${index}.remarks`} control={formMethods.control} render={({ field }) => <Input textArea {...field} value={field.value || ''} /> } /></FormItem>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button type="button" variant="solid" onClick={handleAddNewProduct}>Add Another Product</Button>
                        </div>
                    </div>
                </>
            )}
        </Card>
      </Form>
      
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="wallItemAddForm" variant="solid" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
        </Button>
      </Card>
    </>
  );
};

export default WallItemForm;