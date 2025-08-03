import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink } from "react-router-dom";
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

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import {
  getAllProductAction,
  getProductSpecificationsAction,
  getPaymentTermAction,
  addLeadAction,
  getMembersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";


// --- Form Validation Schema ---
// Defined locally to incorporate changes like removing device_type and adjusting mandatory fields.
const addLeadFormSchema = z.object({
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
});
type AddLeadFormData = z.infer<typeof addLeadFormSchema>;


type ApiLookupItem = {
  id: string | number;
  name: string;
  term_name?: string;
  [key: string]: any;
};

// Simplified options to match the UI image
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

const AddLeadPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false);

  const {
    productsMasterData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    memberData = [], // Using one list for both buyers and suppliers
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AddLeadFormData>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: {
        supplier_id: null,
        buyer_id: null,
        product_id: null,
        qty: null,
        product_status: 'Non-active',
        product_spec_id: null,
        internal_remarks: '',
        price: null,
        color: '',
        dispatch_status: '',
        cartoon_type_id: null,
        device_condition: null,
        payment_term_id: null,
        location: '',
        eta: null,
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        await Promise.all([
          dispatch(getAllProductAction()),
          dispatch(getProductSpecificationsAction()),
          dispatch(getMembersAction()),
          dispatch(getPaymentTermAction()),
        ]);
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
        toast.push(<Notification title="Data Load Error" type="danger" />);
      } finally {
        setInitialDataFetched(true);
      }
    };
    fetchDropdownData();
  }, [dispatch]);

  // Options for dropdowns
  const memberOptions = useMemo(() => {
    if (!Array.isArray(memberData)) return [];
    return memberData.map((m: ApiLookupItem) => ({ value: m.id, label: `(${m.customer_code}) - ${m.name || 'N/A'}` }));
  }, [memberData]);

  const productOptions = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((p: ApiLookupItem) => ({ value: p.id, label: p.name }));
  }, [productsMasterData]);
  
  const productSpecOptions = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((s: ApiLookupItem) => ({ value: s.id, label: s.name }));
  }, [ProductSpecificationsData]);

  const paymentTermOptions = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.term_name || pt.name }));
  }, [PaymentTermsData]);


  const onSubmit = async (data: AddLeadFormData) => {
    setIsSubmitting(true);
    
    const cartoonTypeLabel = cartoonTypeOptions.find(o => o.value === data.cartoon_type_id)?.label || null;

    const apiPayload = {
      lead_intent:  data.lead_intent,
      source_member_id: data.supplier_id,
      lead_member: data.buyer_id,
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
      
      // Fields not in UI but potentially required by API, setting defaults
      lead_status: 'New',
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
    return <Container className="flex justify-center items-center h-full"><Spinner size="xl" /></Container>;
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/sales/leads"><h6 className="font-semibold hover:text-primary">Leads</h6></NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Add New Lead</h6>
      </div>
      <FormContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AdaptableCard>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <FormItem label={<RequiredLabel>Supplier Name</RequiredLabel>} invalid={!!errors.supplier_id} errorMessage={errors.supplier_id?.message}>
                <Controller name="supplier_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Supplier Name" options={memberOptions} value={memberOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                )} />
              </FormItem>
              <FormItem label={<RequiredLabel>Buyer Name</RequiredLabel>} invalid={!!errors.buyer_id} errorMessage={errors.buyer_id?.message}>
                <Controller name="buyer_id" control={control} render={({ field }) => (
                    <UiSelect placeholder="Select Buyer Name" options={memberOptions} value={memberOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
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
            <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoadingInitialData}>Save</Button>
          </div>
        </form>
      </FormContainer>
      <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate("/sales-leads/lead"); }} onCancel={() => setCancelConfirmOpen(false)}>
        <p>Unsaved changes will be lost.</p>
      </ConfirmDialog>
    </Container>
  );
};
export default AddLeadPage;