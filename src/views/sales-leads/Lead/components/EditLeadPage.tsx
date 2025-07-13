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

// Types and Schema
import { leadIntentOptions } from "../types";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual } from "react-redux";
import { useSelector } from "react-redux";
import {
  getAllProductAction,
  getProductSpecificationsAction,
  getPaymentTermAction,
  getMembersAction,
  getSalesPersonAction,
  editLeadAction,
  getLeadById,
  getSuppliersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Form Validation Schema ---
export const leadFormSchema = z.object({
  lead_intent: z.string({ required_error: "Lead Intent is required." }).min(1, "Lead Intent is required."),
  member_id: z.number({ required_error: "Lead Member is required." }).nullable().refine((val) => val !== null, "Lead Member is required."),
  source_supplier_id: z.number({ required_error: "Source Member is required." }).nullable().refine((val) => val !== null, "Source Member is required."),
  product_id: z.number({ required_error: "Product Name is required." }).nullable().refine((val) => val !== null, "Product Name is required."),
  qty: z.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1.").nullable().refine((val) => val !== null, "Quantity is required."),
  target_price: z.number().nullable(),
  product_spec_id: z.number().nullable(),
  source_product_status: z.string().nullable(),
  source_device_type: z.string().nullable(),
  source_device_condition: z.string().nullable(),
  source_color: z.string().nullable(),
  source_cartoon_type_id: z.number().nullable(),
  source_dispatch_status: z.string().nullable(),
  source_payment_term_id: z.number().nullable(),
  source_eta: z.date().nullable(),
  source_location: z.string().nullable(),
  source_internal_remarks: z.string().nullable(),

  // Fields not in the new UI but required for payload/logic
  lead_status: z.string(),
  enquiry_type: z.string().optional(),
  assigned_sales_person_id: z.number().nullable(),
  lead_date: z.date().nullable(), 
  source_qty: z.number().nullable(),
  source_price: z.number().nullable(),
});
export type LeadFormData = z.infer<typeof leadFormSchema>;

type ApiLookupItem = {
  id: string | number;
  name: string;
  term_name?: string;
  member_code?: string;
  [key: string]: any;
};

const productStatusOptions = [
  { value: "Non-active", label: "Non-active" },
  { value: "Active", label: "Active" },
];

const cartoonTypeOptions = [
  { value: 1, label: "Master Carton" },
  { value: 2, label: "Non - Master Carton" },
];

const deviceConditionOptions = [
    { value: 'New-Sealed', label: 'New-Sealed' },
    { value: 'New-Open-Box', label: 'New-Open-Box' },
    { value: 'Used', label: 'Used' },
    { value: 'Refurbished', label: 'Refurbished' },
    { value: "Old", label: "Old" },
];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <div>
    {children}
    <span className="text-red-500"> *</span>
  </div>
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
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: "onChange",
  });

  const leadIntentValue = watch("lead_intent");

  const leadMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy") return <RequiredLabel>Lead Member (Buyer)</RequiredLabel>;
    if (leadIntentValue === "Sell") return <RequiredLabel>Lead Member (Supplier)</RequiredLabel>;
    return <RequiredLabel>Lead Member (Supplier/Buyer)</RequiredLabel>;
  }, [leadIntentValue]);

  const sourceMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy") return <RequiredLabel>Source Member (Supplier)</RequiredLabel>;
    if (leadIntentValue === "Sell") return <RequiredLabel>Source Member (Buyer)</RequiredLabel>;
    return <RequiredLabel>Source Member (Supplier)</RequiredLabel>;
  }, [leadIntentValue]);

  useEffect(() => {
    if (!id) {
      toast.push(<Notification title="Error" type="danger">Lead ID missing.</Notification>);
      navigate("/sales-leads/lead");
      return;
    }
    // Dispatch all actions to fetch necessary data for the form dropdowns
    dispatch(getAllProductAction());
    dispatch(getProductSpecificationsAction());
    dispatch(getPaymentTermAction());
    dispatch(getMembersAction());
    dispatch(getSalesPersonAction());
    dispatch(getSuppliersAction());
    // Fetch the specific lead data to populate the form
    dispatch(getLeadById(id));
  }, [dispatch, id, navigate]);

  // =========================================================================
  // ====================== THIS IS THE CORRECTED SECTION ====================
  // This useEffect now correctly maps the API response to the form fields.
  // =========================================================================
  useEffect(() => {
    if (currentLeadStatus === "succeeded" && currentLead) {
      // Helper to safely convert API values (which can be string/null) to numbers.
      const toNumber = (val: any): number | null => {
        if (val === null || val === undefined || val === "") return null;
        const num = parseFloat(String(val));
        return isNaN(num) ? null : num;
      };

      // The API provides `cartoon_type` as a string label (e.g., "Master Carton").
      // We need to find the corresponding numeric ID from our options for the Select component.
      const cartoonTypeId =
        cartoonTypeOptions.find(
          (option) => option.label === currentLead.cartoon_type
        )?.value ?? null;
      
      // Create a complete data object that matches the `LeadFormData` schema
      const formDataToSet: LeadFormData = {
        // --- Mappings where API key is DIFFERENT from form field name ---
        member_id: toNumber(currentLead.lead_member),
        source_supplier_id: toNumber(currentLead.source_member_id),
        source_product_status: currentLead.product_status,
        source_device_type: currentLead.device_type,
        source_device_condition: currentLead.device_condition,
        source_color: currentLead.color,
        source_dispatch_status: currentLead.dispatch_status,
        source_payment_term_id: toNumber(currentLead.payment_term_id),
        source_location: currentLead.location,
        source_internal_remarks: currentLead.internal_remark,
        assigned_sales_person_id: toNumber(currentLead.assigned_saled_id),
        source_price: toNumber(currentLead.sourced_price),

        // --- Mappings with transformations ---
        source_cartoon_type_id: cartoonTypeId,
        source_eta: currentLead.eta ? new Date(currentLead.eta) : null, // Convert string to Date object

        // --- Direct mappings (API key and form field name are the same) ---
        lead_intent: currentLead.lead_intent,
        product_id: toNumber(currentLead.product_id),
        qty: toNumber(currentLead.qty),
        target_price: toNumber(currentLead.target_price),
        product_spec_id: toNumber(currentLead.product_spec_id),
        source_qty: toNumber(currentLead.source_qty),
        lead_status: currentLead.lead_status,
        enquiry_type: currentLead.enquiry_type,

        // --- Fields in schema but not in API response (set to default/null) ---
        lead_date: null,
      };

      // Use the correctly mapped data to reset the form, populating all fields.
      reset(formDataToSet);
    }
  }, [currentLead, currentLeadStatus, reset]);

  // Map master data to options for Select components
  const productOptions = useMemo(() => productsMasterData.map((p: ApiLookupItem) => ({ value: p.id, label: p.name })), [productsMasterData]);
  const productSpecOptions = useMemo(() => ProductSpecificationsData.map((s: ApiLookupItem) => ({ value: s.id, label: s.name })), [ProductSpecificationsData]);
  const paymentTermOptions = useMemo(() => PaymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.term_name || pt.name })), [PaymentTermsData]);
  const leadMemberOptions = useMemo(() => memberData.map((m: ApiLookupItem) => ({ value: m.id, label: `(${m.member_code}) - ${m.name || "N/A"}` })), [memberData]);
  
  const onSubmit = async (data: LeadFormData) => {
    if (!id) return;
    setIsSubmitting(true);

    // For submission, we need to convert the cartoon_type_id back to a string label for the API
    const cartoonTypeLabel =
      cartoonTypeOptions.find(
        (option) => option.value === data.source_cartoon_type_id
      )?.label || null;

    // Construct the payload with keys the API expects
    const apiPayload = {
      id: parseInt(id, 10),
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
    return (
      <Container className="h-full flex justify-center items-center">
        <Spinner size="xl" />
        <p className="ml-2">Loading Lead Details...</p>
      </Container>
    );
  }

  if (currentLeadStatus === "failed") {
    return (
      <Container className="h-full flex flex-col justify-center items-center">
        <TbInfoCircle size={48} className="text-red-500 mb-4" />
        <p className="text-lg font-semibold">Error Loading Lead</p>
        <Button className="mt-6" onClick={() => navigate("/sales/leads")}>
          Back to List
        </Button>
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/lead">
          <h6 className="font-semibold hover:text-primary">Leads</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">
          Edit Lead (ID: {id})
        </h6>
      </div>
      <FormContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AdaptableCard>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
              {/* Row 1 */}
              <FormItem
                label={<RequiredLabel>Lead Intent</RequiredLabel>}
                invalid={!!errors.lead_intent}
                errorMessage={errors.lead_intent?.message}
              >
                <Controller
                  name="lead_intent"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Intent"
                      options={leadIntentOptions}
                      value={leadIntentOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={leadMemberLabel}
                invalid={!!errors.member_id}
                errorMessage={errors.member_id?.message}
              >
                <Controller
                  name="member_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Member"
                      options={leadMemberOptions}
                      value={leadMemberOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={sourceMemberLabel}
                invalid={!!errors.source_supplier_id}
                errorMessage={errors.source_supplier_id?.message}
              >
                <Controller
                  name="source_supplier_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Supplier"
                      options={leadMemberOptions}
                      value={leadMemberOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={<RequiredLabel>Product Name</RequiredLabel>}
                invalid={!!errors.product_id}
                errorMessage={errors.product_id?.message}
              >
                <Controller
                  name="product_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Product"
                      options={productOptions}
                      value={productOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>

              {/* Row 2 */}
              <FormItem
                label={<RequiredLabel>Quantity</RequiredLabel>}
                invalid={!!errors.qty}
                errorMessage={errors.qty?.message}
              >
                <Controller
                  name="qty"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      placeholder="Enter quantity"
                      {...field}
                      value={field.value ?? undefined}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Target Price ($)"
                invalid={!!errors.target_price}
                errorMessage={errors.target_price?.message}
              >
                <Controller
                  name="target_price"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      placeholder="Enter target price"
                      {...field}
                      value={field.value ?? undefined}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Product Status">
                <Controller
                  name="source_product_status"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Product Status"
                      options={productStatusOptions}
                      value={productStatusOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Product Spec">
                <Controller
                  name="product_spec_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Specification"
                      options={productSpecOptions}
                      value={productSpecOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>

              {/* Row 3 */}
              <FormItem label="Device Type">
                <Controller
                  name="source_device_type"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g., Mobile Phone" value={field.value ?? ""} />}
                />
              </FormItem>
              <FormItem label="Device Condition">
                <Controller
                  name="source_device_condition"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Condition"
                      options={deviceConditionOptions}
                      value={deviceConditionOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Color">
                <Controller
                  name="source_color"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g., Space Gray" value={field.value ?? ""} />}
                />
              </FormItem>
              <FormItem label="Cartoon Type">
                <Controller
                  name="source_cartoon_type_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Cartoon Type"
                      options={cartoonTypeOptions}
                      value={cartoonTypeOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>

              {/* Row 4 */}
              <FormItem label="Dispatch Status">
                <Controller
                  name="source_dispatch_status"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g., Ready to Ship" value={field.value ?? ""} />}
                />
              </FormItem>
              <FormItem label="Payment Term">
                <Controller
                  name="source_payment_term_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Payment Term"
                      options={paymentTermOptions}
                      value={paymentTermOptions.find((o) => o.value === field.value)}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="ETA">
                <Controller
                  name="source_eta"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      placeholder="Select ETA"
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Location">
                <Controller
                  name="source_location"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="e.g., Warehouse A" value={field.value ?? ""} />}
                />
              </FormItem>

              {/* Row 5 */}
              <FormItem label="Internal Remarks" className="lg:col-span-4">
                <Controller
                  name="source_internal_remarks"
                  control={control}
                  render={({ field }) => (
                    <Input
                      textArea
                      rows={3}
                      placeholder="Internal notes..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormItem>
            </div>
          </AdaptableCard>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="solid"
              loading={isSubmitting}
              disabled={isSubmitting || currentLeadStatus !== 'succeeded'}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </FormContainer>
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        type="warning"
        title="Discard Changes?"
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          setCancelConfirmOpen(false);
          navigate("/sales-leads/lead");
        }}
        onCancel={() => setCancelConfirmOpen(false)}
      >
        <p>You have unsaved changes. Are you sure you want to discard them?</p>
      </ConfirmDialog>
    </Container>
  );
};
export default EditLeadPage;