import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { z } from "zod";

// UI Components
import Input from "@/components/ui/Input";
import { FormItem, FormContainer } from "@/components/ui/Form";
import { Select as UiSelect, DatePicker, Button } from "@/components/ui";
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Container from "@/components/shared/Container";
import AdaptableCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { TbInfoCircle } from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getAllProductAction,
  getProductSpecificationsAction,
  getPaymentTermAction,
  getMembersAction,
  editLeadAction,
  getLeadById,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Form Validation Schema ---
export const editLeadFormSchema = z.object({
  supplier_id: z.number({ required_error: "Supplier Name is required." }).nullable().refine((val) => val !== null, "Supplier Name is required."),
  buyer_id: z.number({ required_error: "Buyer Name is required." }).nullable().refine((val) => val !== null, "Buyer Name is required."),
  product_id: z.number({ required_error: "Product Name is required." }).nullable().refine((val) => val !== null, "Product Name is required."),
  qty: z.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1.").nullable().refine((val) => val !== null, "Quantity is required."),
  product_status: z.string({ required_error: "Product Status is required." }).min(1, "Product Status is required."),

  product_spec_id: z.number().nullable(),
  internal_remarks: z.string().nullable(),
  price: z.number().nullable(),
  color: z.string().nullable(),
  dispatch_status: z.string().nullable(),
  cartoon_type_id: z.number().nullable(),
  device_condition: z.string().nullable(),
  payment_term_id: z.number().nullable(),
  location: z.string().nullable(),
  eta: z.date().nullable(),
  
  // Keep fields needed for payload that are not in the UI
  lead_intent: z.string(),
  lead_status: z.string(),
});
export type EditLeadFormData = z.infer<typeof editLeadFormSchema>;

type ApiLookupItem = {
  id: string | number;
  name: string;
  term_name?: string;
  customer_code?: string;
  [key: string]: any;
};

// Consistent options across forms
const productStatusOptions = [
  { value: "Non-active", label: "Non-active" },
  { value: "Active", label: "Active" },
];

const cartoonTypeOptions = [
  { value: 1, label: "Master Carton" },
  { value: 2, label: "Non - Master Carton" },
];

const deviceConditionOptions = [
  { value: "Old", label: "Old" },
  { value: "New", label: "New" },
];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <div>{children}<span className="text-red-500"> *</span></div>
);

const EditLeadPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const {
    productsMasterData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    memberData = [],
    currentLead,
    currentLeadStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditLeadFormData>({
    resolver: zodResolver(editLeadFormSchema),
    mode: "onChange",
  });

  const leadIntentValue = watch("lead_intent");

  // Dynamic labels to correctly identify Buyer/Supplier based on lead intent
  const supplierLabel = useMemo(() => {
    const label = leadIntentValue === 'Sell' ? 'Buyer Name' : 'Supplier Name';
    return <RequiredLabel>{label}</RequiredLabel>;
  }, [leadIntentValue]);

  const buyerLabel = useMemo(() => {
    const label = leadIntentValue === 'Sell' ? 'Supplier Name' : 'Buyer Name';
    return <RequiredLabel>{label}</RequiredLabel>;
  }, [leadIntentValue]);

  useEffect(() => {
    if (!id) {
      toast.push(<Notification title="Error" type="danger">Lead ID missing.</Notification>);
      navigate("/sales-leads/lead");
      return;
    }
    dispatch(getAllProductAction());
    dispatch(getProductSpecificationsAction());
    dispatch(getPaymentTermAction());
    dispatch(getMembersAction());
    dispatch(getLeadById(id));
  }, [dispatch, id, navigate]);

  // EFFECT TO POPULATE FORM: This is the corrected data mapping logic.
  useEffect(() => {
    if (currentLead) {
      const toNumber = (val: any): number | null => {
        if (val === null || val === undefined || val === "") return null;
        const num = parseFloat(String(val));
        return isNaN(num) ? null : num;
      };
      
      const cartoonTypeId = cartoonTypeOptions.find(o => o.label === currentLead.cartoon_type)?.value ?? null;

      const formDataToSet: EditLeadFormData = {
        supplier_id: currentLead.lead_intent === 'Sell' ? toNumber(currentLead.lead_member) : toNumber(currentLead.source_member_id),
        buyer_id: currentLead.lead_intent === 'Sell' ? toNumber(currentLead.source_member_id) : toNumber(currentLead.lead_member),
        product_id: toNumber(currentLead.product_id),
        qty: toNumber(currentLead.qty),
        product_status: currentLead.product_status,
        product_spec_id: toNumber(currentLead.product_spec_id),
        internal_remarks: currentLead.internal_remark,
        price: toNumber(currentLead.target_price),
        color: currentLead.color,
        dispatch_status: currentLead.dispatch_status,
        cartoon_type_id: cartoonTypeId,
        device_condition: currentLead.device_condition,
        payment_term_id: toNumber(currentLead.payment_term_id),
        location: currentLead.location,
        eta: currentLead.eta ? new Date(currentLead.eta) : null,
        lead_intent: currentLead.lead_intent,
        lead_status: currentLead.lead_status,
      };
      reset(formDataToSet);
    }
  }, [currentLead, reset]);

  // Dropdown options
  const memberOptions = useMemo(() => memberData.map((m: ApiLookupItem) => ({ value: m.id, label: `(${m.customer_code}) - ${m.name || "N/A"}` })), [memberData]);
  const productOptions = useMemo(() => productsMasterData.map((p: ApiLookupItem) => ({ value: p.id, label: p.name })), [productsMasterData]);
  const productSpecOptions = useMemo(() => ProductSpecificationsData.map((s: ApiLookupItem) => ({ value: s.id, label: s.name })), [ProductSpecificationsData]);
  const paymentTermOptions = useMemo(() => PaymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.term_name || pt.name })), [PaymentTermsData]);
  
  const onSubmit = async (data: EditLeadFormData) => {
    if (!id) return;
    setIsSubmitting(true);

    const cartoonTypeLabel = cartoonTypeOptions.find(o => o.value === data.cartoon_type_id)?.label || null;

    const apiPayload = {
      id: parseInt(id, 10),
      lead_intent: data.lead_intent,
      source_member_id: data.lead_intent === 'Sell' ? data.buyer_id : data.supplier_id,
      lead_member: data.lead_intent === 'Sell' ? data.supplier_id : data.buyer_id,
      product_id: data.product_id,
      qty: data.qty,
      target_price: data.price,
      product_status: data.product_status,
      product_spec_id: data.product_spec_id,
      internal_remark: data.internal_remarks,
      color: data.color,
      dispatch_status: data.dispatch_status,
      cartoon_type: cartoonTypeLabel,
      device_condition: data.device_condition,
      payment_term_id: data.payment_term_id,
      location: data.location,
      eta: data.eta ? dayjs(data.eta).format("YYYY-MM-DD") : null,
      lead_status: data.lead_status,
    };
    
    try {
      await dispatch(editLeadAction(apiPayload)).unwrap();
      toast.push(<Notification title="Success" type="success">Lead updated successfully.</Notification>);
      navigate("/sales-leads/lead");
    } catch (error: any) {
      toast.push(<Notification title="Error" type="danger">{error.message || "Failed to update lead."}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) setCancelConfirmOpen(true);
    else navigate("/sales-leads/lead");
  };

  if (currentLeadStatus === 'loading') {
    return <Container className="h-full flex justify-center items-center"><Spinner size="xl" /></Container>;
  }

  if (currentLeadStatus === "failed") {
    return (
      <Container className="h-full flex flex-col justify-center items-center">
        <TbInfoCircle size={48} className="text-red-500 mb-4" />
        <p className="text-lg font-semibold">Error Loading Lead</p>
        <Button className="mt-6" onClick={() => navigate("/sales/leads")}>Back to List</Button>
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/sales-leads/lead"><h6 className="font-semibold hover:text-primary">Leads</h6></NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Edit Lead (ID: {id})</h6>
      </div>
      <FormContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AdaptableCard>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <FormItem label={supplierLabel} invalid={!!errors.supplier_id} errorMessage={errors.supplier_id?.message}>
                <Controller name="supplier_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Name" options={memberOptions} value={memberOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              <FormItem label={buyerLabel} invalid={!!errors.buyer_id} errorMessage={errors.buyer_id?.message}>
                <Controller name="buyer_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Name" options={memberOptions} value={memberOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>

               {/* Row 2 */}
              <FormItem label={<RequiredLabel>Product Name</RequiredLabel>} invalid={!!errors.product_id} errorMessage={errors.product_id?.message}>
                <Controller name="product_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Product Name" options={productOptions} value={productOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              <FormItem label={<RequiredLabel>Qty</RequiredLabel>} invalid={!!errors.qty} errorMessage={errors.qty?.message}>
                <Controller name="qty" control={control} render={({ field }) => (
                    <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={(val) => field.onChange(val)} />
                )} />
              </FormItem>

              {/* Row 3 */}
              <FormItem label={<RequiredLabel>Product Status</RequiredLabel>} invalid={!!errors.product_status} errorMessage={errors.product_status?.message}>
                <Controller name="product_status" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Product Status" options={productStatusOptions} value={productStatusOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              <FormItem label="Product spec" invalid={!!errors.product_spec_id} errorMessage={errors.product_spec_id?.message}>
                <Controller name="product_spec_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Product spec" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>

               {/* Row 4 */}
              <FormItem label="Internal Remarks" invalid={!!errors.internal_remarks} errorMessage={errors.internal_remarks?.message}>
                <Controller name="internal_remarks" control={control} render={({ field }) => (
                    <Input textArea rows={3} placeholder="Internal notes..." {...field} value={field.value ?? ""} />
                )} />
              </FormItem>
               <FormItem label="Color" invalid={!!errors.color} errorMessage={errors.color?.message}>
                <Controller name="color" control={control} render={({ field }) => (
                    <Input placeholder="e.g., Space Gray" {...field} value={field.value ?? ""} />
                )} />
              </FormItem>
              
              {/* Row 5 */}
               <FormItem label="Price" invalid={!!errors.price} errorMessage={errors.price?.message}>
                <Controller name="price" control={control} render={({ field }) => (
                    <InputNumber placeholder="Enter price" {...field} value={field.value ?? undefined} onChange={(val) => field.onChange(val)} step={0.01} />
                )} />
              </FormItem>
              <FormItem label="Dispatch Status" invalid={!!errors.dispatch_status} errorMessage={errors.dispatch_status?.message}>
                <Controller name="dispatch_status" control={control} render={({ field }) => (
                    <Input placeholder="e.g., Ready to Ship" {...field} value={field.value ?? ""} />
                )} />
              </FormItem>
              
              {/* Row 6 */}
              <FormItem label="Cartoon Type" invalid={!!errors.cartoon_type_id} errorMessage={errors.cartoon_type_id?.message}>
                <Controller name="cartoon_type_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select an option" options={cartoonTypeOptions} value={cartoonTypeOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              <FormItem label="Device Condition" invalid={!!errors.device_condition} errorMessage={errors.device_condition?.message}>
                <Controller name="device_condition" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Condition" options={deviceConditionOptions} value={deviceConditionOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              
              {/* Row 7 */}
              <FormItem label="Payment Term" invalid={!!errors.payment_term_id} errorMessage={errors.payment_term_id?.message}>
                <Controller name="payment_term_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Payment Term" options={paymentTermOptions} value={paymentTermOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              <FormItem label="Location" invalid={!!errors.location} errorMessage={errors.location?.message}>
                <Controller name="location" control={control} render={({ field }) => (
                    <Input placeholder="e.g., Warehouse A" {...field} value={field.value ?? ""} />
                )} />
              </FormItem>

              {/* Row 8 */}
              <FormItem label="ETA" invalid={!!errors.eta} errorMessage={errors.eta?.message as string}>
                <Controller name="eta" control={control} render={({ field }) => (
                    <DatePicker placeholder="Select a date" value={field.value} onChange={(date) => field.onChange(date)} />
                )} />
              </FormItem>
            </div>
          </AdaptableCard>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </FormContainer>
      <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate("/sales-leads/lead");}} onCancel={() => setCancelConfirmOpen(false)}>
        <p>You have unsaved changes. Are you sure you want to discard them?</p>
      </ConfirmDialog>
    </Container>
  );
};
export default EditLeadPage;