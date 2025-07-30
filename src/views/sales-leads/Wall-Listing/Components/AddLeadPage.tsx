import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import dayjs from "dayjs";

// UI Components
import Input from "@/components/ui/Input";
import { FormItem, FormContainer } from "@/components/ui/Form";
import {
  Select as UiSelect,
  DatePicker,
  Button,
} from "@/components/ui";
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Container from "@/components/shared/Container";
import AdaptableCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";

// Icons
import { BiChevronRight } from "react-icons/bi";

// Types and Schema (Assuming you have a types file)
import { z } from "zod";

export const leadStatusOptions = [ { value: "New", label: "New" }, { value: "Contacted", label: "Contacted" }, { value: "Qualified", label: "Qualified" }, { value: "Unqualified", label: "Unqualified" }, { value: "Converted", label: "Converted" }, { value: "Lost", label: "Lost" }, ];
export const enquiryTypeOptions = [ { value: "Phone Call", label: "Phone Call" }, { value: "Email", label: "Email" }, { value: "Website Form", label: "Website Form" }, { value: "Referral", label: "Referral" }, { value: "Social Media", label: "Social Media" }, { value: "Other", label: "Other" }, ];
export const leadIntentOptions = [ { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, ];
export const baseDeviceConditionOptions = [ { value: "New", label: "New" }, { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }, ];
export const leadFormSchema = z.object({
    member_id: z.number({ required_error: "Lead Member is required." }).nullable(),
    enquiry_type: z.string().optional(),
    lead_intent: z.enum(["Buy", "Sell"], { required_error: "Lead Intent is required." }).nullable(),
    product_id: z.number({ required_error: "Product is required." }).nullable(),
    product_spec_id: z.number().nullable().optional(),
    qty: z.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1").nullable(),
    target_price: z.number().nullable().optional(),
    lead_status: z.string({ required_error: "Lead Status is required." }),
    assigned_sales_person_id: z.number().nullable().optional(),
    source_supplier_id: z.number({ required_error: "Source Member is required." }).nullable(),
    source_qty: z.number().nullable().optional(),
    source_price: z.number().nullable().optional(),
    source_product_status: z.string().nullable().optional(),
    source_device_condition: z.string().nullable().optional(),
    source_device_type: z.string().nullable().optional(),
    source_color: z.string().nullable().optional(),
    source_cartoon_type_id: z.number().nullable().optional(),
    source_dispatch_status: z.string().nullable().optional(),
    source_payment_term_id: z.number().nullable().optional(),
    source_eta: z.date().nullable().optional(),
    source_location: z.string().nullable().optional(),
    source_internal_remarks: z.string().nullable().optional(),
});
type LeadFormData = z.infer<typeof leadFormSchema>;

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual } from "react-redux";
import { useSelector } from "react-redux";

import {
  getAllProductAction,
  getProductSpecificationsAction,
  getPaymentTermAction,
  addLeadAction,
  getMembersAction,
  getSalesPersonAction,
  getSuppliersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

type ApiLookupItem = { id: string | number; name: string; term_name?: string; [key: string]: any; };

const productStatusOptions = [ { value: "Non-active", label: "Non-active" }, { value: "Active", label: "Active" }, ];
const cartoonTypeOptions = [ { value: 1, label: "Master Carton" }, { value: 2, label: "Non - Master Carton" }, ];
const deviceConditionOptions = [ ...baseDeviceConditionOptions, { value: "Old", label: "Old" }, ];

const AddLeadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false);

  const {
    productsMasterData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    memberData = [],
    salesPerson = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
    setValue,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { lead_status: "New" },
    mode: "onChange",
  });

  const leadIntentValue = watch("lead_intent");

  const leadMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy") return <div>Lead Member (Buyer)<span className="text-red-500"> * </span></div>;
    if (leadIntentValue === "Sell") return <div>Lead Member (Supplier)<span className="text-red-500"> * </span></div>;
    return <div>Lead Member (Supplier/Buyer)<span className="text-red-500"> * </span></div>;
  }, [leadIntentValue]);

  const sourceMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy") return <div>Source Member (Supplier)<span className="text-red-500"> * </span></div>;
    if (leadIntentValue === "Sell") return <div>Source Member (Buyer)<span className="text-red-500"> * </span></div>;
    return <div>Source Member (Supplier)<span className="text-red-500"> * </span></div>;
  }, [leadIntentValue]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        await Promise.all([
          dispatch(getAllProductAction()),
          dispatch(getProductSpecificationsAction()),
          dispatch(getSalesPersonAction()),
          dispatch(getMembersAction()),
          dispatch(getSuppliersAction()),
          dispatch(getPaymentTermAction()),
        ]);
      } catch (error) {
        toast.push(<Notification title="Data Load Error" type="danger">Could not load selection options.</Notification>);
      } finally {
        setInitialDataFetched(true);
      }
    };
    fetchDropdownData();
  }, [dispatch]);

  // --- MODIFIED: Handle incoming data from navigation ---
  useEffect(() => {
    const prefillData = location.state;
    if (prefillData && initialDataFetched) {
        setValue('member_id', Number(prefillData.buyerId) || null);
        setValue('source_supplier_id', Number(prefillData.supplierId) || null);
        setValue('product_id', Number(prefillData.productId) || null);
        setValue('lead_intent', prefillData.want_to === 'Sell' ? 'Sell' : 'Buy');
        setValue('qty', Number(prefillData.qty) || null);
        setValue('target_price', Number(prefillData.price) || null);
        setValue('source_qty', Number(prefillData.qty) || null);
        setValue('source_price', Number(prefillData.price) || null);
        setValue('source_product_status', prefillData.product_status);
        setValue('source_device_condition', prefillData.device_condition);
        setValue('source_color', prefillData.color);
        setValue('source_location', prefillData.location);
        setValue('product_spec_id', prefillData.product_spec_id || null);
        setValue('source_payment_term_id', prefillData.payment_term || null);
    }
  }, [location.state, setValue, initialDataFetched]);


  const productOptions = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: ApiLookupItem) => ({ value: p.id, label: p.name })) : [], [productsMasterData]);
  const productSpecOptions = useMemo(() => Array.isArray(ProductSpecificationsData) ? ProductSpecificationsData.map((spec: ApiLookupItem) => ({ value: spec.id, label: spec.name })) : [], [ProductSpecificationsData]);
  const paymentTermOptions = useMemo(() => Array.isArray(PaymentTermsData) ? PaymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.term_name || pt.name })) : [], [PaymentTermsData]);
  const leadMemberOptions = useMemo(() => Array.isArray(memberData) ? memberData.map((m: ApiLookupItem) => ({ value: m.id, label: `(${m.customer_code}) - ${m.name || 'N/A'}` })) : [], [memberData]);
  const salesPersonOption = useMemo(() => Array.isArray(salesPerson) ? salesPerson.map((p: ApiLookupItem) => ({ value: p.id, label: `(${p.customer_code}) - ${p.name || 'N/A'}` })) : [], [salesPerson]);

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    const cartoonTypeLabel = cartoonTypeOptions.find(option => option.value === data.source_cartoon_type_id)?.label || null;
    const apiPayload = {
      lead_intent: data.lead_intent,
      lead_member: data.member_id,
      enquiry_type: data.enquiry_type,
      product_id: data.product_id,
      qty: data.qty,
      target_price: data.target_price,
      lead_status: data.lead_status,
      assigned_saled_id: data.assigned_sales_person_id,
      product_spec_id: data.product_spec_id,
      source_member_id: data.source_supplier_id,
      source_qty: data.source_qty,
      sourced_price: data.source_price,
      product_status: data.source_product_status,
      device_condition: data.source_device_condition,
      device_type: data.source_device_type,
      color: data.source_color,
      cartoon_type: cartoonTypeLabel,
      dispatch_status: data.source_dispatch_status,
      payment_term_id: data.source_payment_term_id,
      eta: data.source_eta ? dayjs(data.source_eta).format("YYYY-MM-DD") : null,
      location: data.source_location,
      internal_remark: data.source_internal_remarks,
    };
    try {
      await dispatch(addLeadAction(apiPayload)).unwrap();
      toast.push(<Notification title="Success" type="success">Lead created successfully.</Notification>);
      reset();
      navigate("/sales-leads/lead");
    } catch (error: any) {
      toast.push(<Notification title="Error" type="danger">{error.message || "Failed to create lead."}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) setCancelConfirmOpen(true);
    else navigate("/sales-leads/lead");
  };

  const isLoadingInitialData = masterLoadingStatus === "loading" && !initialDataFetched;

  if (isLoadingInitialData) {
    return ( <Container className="flex justify-center items-center h-full"><Spinner size="xl" /></Container> );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3 "><NavLink to="/sales-leads/lead"><h6 className="font-semibold hover:text-primary">Leads</h6></NavLink><BiChevronRight size={22} /><h6 className="font-semibold text-primary">Add New Lead</h6></div>
      <FormContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AdaptableCard className="mb-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
              <FormItem label="Lead Intent" invalid={!!errors.lead_intent} errorMessage={errors.lead_intent?.message}><Controller name="lead_intent" control={control} render={({ field }) => ( <UiSelect placeholder="Select Intent" options={leadIntentOptions} value={leadIntentOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable /> )} /></FormItem>
              <FormItem label={leadMemberLabel} invalid={!!errors.member_id} errorMessage={errors.member_id?.message}><Controller name="member_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select Member" options={leadMemberOptions} value={leadMemberOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isLoading={false} /> )} /></FormItem>
              <FormItem label={sourceMemberLabel} invalid={!!errors.source_supplier_id} errorMessage={errors.source_supplier_id?.message}><Controller name="source_supplier_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select Supplier" options={leadMemberOptions} value={leadMemberOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isLoading={false} isClearable /> )} /></FormItem>
              <FormItem label={<div>Product Name<span className="text-red-500"> * </span></div>} invalid={!!errors.product_id} errorMessage={errors.product_id?.message}><Controller name="product_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select Product" options={productOptions} value={productOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && productOptions.length === 0} isClearable /> )} /></FormItem>
              <FormItem label={<div>Quantity<span className="text-red-500"> * </span></div>} invalid={!!errors.qty} errorMessage={errors.qty?.message}><Controller name="qty" control={control} render={({ field }) => ( <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={(val) => field.onChange(val ?? null)} /> )} /></FormItem>
              <FormItem label="Target Price ($)" invalid={!!errors.target_price} errorMessage={errors.target_price?.message}><Controller name="target_price" control={control} render={({ field }) => ( <InputNumber placeholder="Enter target price" {...field} value={field.value ?? undefined} onChange={(val) => field.onChange(val ?? null)} step={0.01} /> )} /></FormItem>
              <FormItem label="Product Status " invalid={!!errors.source_product_status} errorMessage={errors.source_product_status?.message}><Controller name="source_product_status" control={control} render={({ field }) => ( <UiSelect placeholder="Select Product Status" options={productStatusOptions} value={productStatusOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable /> )} /></FormItem>
              <FormItem label="Product Spec" invalid={!!errors.product_spec_id} errorMessage={errors.product_spec_id?.message}><Controller name="product_spec_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select Specification" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && productSpecOptions.length === 0} isClearable /> )} /></FormItem>
              <FormItem label="Device Type" invalid={!!errors.source_device_type} errorMessage={errors.source_device_type?.message}><Controller name="source_device_type" control={control} render={({ field }) => ( <Input placeholder="e.g., Mobile Phone, Laptop" {...field} value={field.value ?? ""} /> )} /></FormItem>
              <FormItem label="Device Condition" invalid={!!errors.source_device_condition} errorMessage={errors.source_device_condition?.message}><Controller name="source_device_condition" control={control} render={({ field }) => ( <UiSelect placeholder="Select Condition" options={deviceConditionOptions} value={deviceConditionOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable /> )} /></FormItem>
              <FormItem label="Color" invalid={!!errors.source_color} errorMessage={errors.source_color?.message}><Controller name="source_color" control={control} render={({ field }) => ( <Input placeholder="e.g., Space Gray" {...field} value={field.value ?? ""} /> )} /></FormItem>
              <FormItem label="Cartoon Type" invalid={!!errors.source_cartoon_type_id} errorMessage={errors.source_cartoon_type_id?.message}><Controller name="source_cartoon_type_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select Cartoon Type" options={cartoonTypeOptions} value={cartoonTypeOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isLoading={false} isClearable /> )} /></FormItem>
              <FormItem label="Dispatch Status" invalid={!!errors.source_dispatch_status} errorMessage={errors.source_dispatch_status?.message}><Controller name="source_dispatch_status" control={control} render={({ field }) => ( <Input placeholder="e.g., Ready to Ship" {...field} value={field.value ?? ""} /> )} /></FormItem>
              <FormItem label="Payment Term" invalid={!!errors.source_payment_term_id} errorMessage={errors.source_payment_term_id?.message}><Controller name="source_payment_term_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select Payment Term" options={paymentTermOptions} value={paymentTermOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && paymentTermOptions.length === 0} isClearable /> )} /></FormItem>
              <FormItem label="ETA" invalid={!!errors.source_eta} errorMessage={errors.source_eta?.message as string}><Controller name="source_eta" control={control} render={({ field }) => ( <DatePicker placeholder="Select ETA" value={ field.value ? dayjs(field.value).isValid() ? dayjs(field.value).toDate() : null : null } onChange={(date) => field.onChange(date)} /> )} /></FormItem>
              <FormItem label="Location" invalid={!!errors.source_location} errorMessage={errors.source_location?.message}><Controller name="source_location" control={control} render={({ field }) => ( <Input placeholder="e.g., Warehouse A" {...field} value={field.value ?? ""} /> )} /></FormItem>
              <FormItem label="Internal Remarks" invalid={!!errors.source_internal_remarks} errorMessage={errors.source_internal_remarks?.message} className="md:col-span-2 lg:col-span-4"><Controller name="source_internal_remarks" control={control} render={({ field }) => ( <Input textArea rows={3} placeholder="Internal notes..." {...field} value={field.value ?? ""} /> )} /></FormItem>
            </div>
          </AdaptableCard>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoadingInitialData}>Save</Button>
          </div>
        </form>
      </FormContainer>
      <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate("/sales-leads/lead"); }} onCancel={() => setCancelConfirmOpen(false)}><p>Unsaved changes will be lost.</p></ConfirmDialog>
    </Container>
  );
};
export default AddLeadPage;