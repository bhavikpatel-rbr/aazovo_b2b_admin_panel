// src/views/your-path/AddLeadPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink } from "react-router-dom";
import dayjs from "dayjs";
import { z } from "zod";

// UI Components
import Input from "@/components/ui/Input";
import { FormItem, FormContainer } from "@/components/ui/Form";
import {
  Select as UiSelect,
  DatePicker,
  Button,
  Tooltip,
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
import { TbRefresh } from "react-icons/tb";

// Types and Schema
import {
  leadStatusOptions,
  enquiryTypeOptions,
  leadIntentOptions,
  deviceConditionOptions as baseDeviceConditionOptions,
} from "../types";

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

// --- Form Validation Schema using Zod ---
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
  lead_date: z.date().nullable(),
  assigned_sales_person_id: z.number().nullable(),
  source_qty: z.number().nullable(),
  source_price: z.number().nullable(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

type ApiLookupItem = {
  id: string | number;
  name: string;
  term_name?: string;
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
  ...baseDeviceConditionOptions,
  { value: "Old", label: "Old" },
];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <div>
    {children}
    <span className="text-red-500"> *</span>
  </div>
);

const AddLeadPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false);

  const {
    productsMasterData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    memberData = [],
    salesPerson = [],
    suppliers = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const defaultFormValues: LeadFormData = {
    member_id: null,
    enquiry_type: "Manual", // Default value for hidden field
    lead_intent: null,
    product_id: null,
    product_spec_id: null,
    qty: null,
    target_price: null,
    lead_status: "New", // Default value for hidden field
    lead_date: null,
    assigned_sales_person_id: null,
    source_supplier_id: null,
    source_qty: null,
    source_price: null,
    source_product_status: null,
    source_device_condition: null,
    source_device_type: null,
    source_color: null,
    source_cartoon_type_id: null,
    source_dispatch_status: null,
    source_payment_term_id: null,
    source_eta: null,
    source_location: null,
    source_internal_remarks: null,
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const leadIntentValue = watch("lead_intent");

  const leadMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy")
      return <RequiredLabel>Lead Member (Buyer)</RequiredLabel>;
    if (leadIntentValue === "Sell")
      return <RequiredLabel>Lead Member (Supplier)</RequiredLabel>;
    return <RequiredLabel>Lead Member (Supplier/Buyer)</RequiredLabel>;
  }, [leadIntentValue]);

  const sourceMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy")
      return <RequiredLabel>Source Member (Supplier)</RequiredLabel>;
    if (leadIntentValue === "Sell")
      return <RequiredLabel>Source Member (Buyer)</RequiredLabel>;
    return <RequiredLabel>Source Member (Supplier)</RequiredLabel>;
  }, [leadIntentValue]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form Validation Errors: ", errors);
    }
  }, [errors]);

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
        console.error("Failed to fetch dropdown data:", error);
        toast.push(
          <Notification title="Data Load Error" type="danger">
            Could not load selection options.
          </Notification>
        );
      } finally {
        setInitialDataFetched(true);
      }
    };
    fetchDropdownData();
  }, [dispatch]);

  const productOptions = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: ApiLookupItem) => ({
      value: product.id,
      label: product.name,
    }));
  }, [productsMasterData]);

  const productSpecOptions = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((spec: ApiLookupItem) => ({
      value: spec.id,
      label: spec.name,
    }));
  }, [ProductSpecificationsData]);

  const paymentTermOptions = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((pt: ApiLookupItem) => ({
      value: pt.id,
      label: pt.term_name || pt.name,
    }));
  }, [PaymentTermsData]);

  const leadMemberOptions = useMemo(() => {
    if (!Array.isArray(memberData)) return [];
    return memberData.map((member: ApiLookupItem) => ({
      value: member.id,
      label: `(${member.member_code}) - ${member.name || "N/A"}`,
    }));
  }, [memberData]);

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    const apiPayload = {
      lead_intent: data.lead_intent,
      member_id: data.member_id,
      enquiry_type: data.enquiry_type,
      product_id: data.product_id,
      qty: data.qty,
      target_price: data.target_price,
      lead_status: data.lead_status,
      lead_date: data.lead_date ? dayjs(data.lead_date).format("YYYY-MM-DD") : null,
      assigned_sales_person_id: data.assigned_sales_person_id,
      product_spec_id: data.product_spec_id,
      source_supplier_id: data.source_supplier_id,
      source_qty: data.source_qty,
      source_price: data.source_price,
      source_product_status: data.source_product_status,
      source_device_condition: data.source_device_condition,
      source_device_type: data.source_device_type,
      source_color: data.source_color,
      source_cartoon_type_id: data.source_cartoon_type_id,
      source_dispatch_status: data.source_dispatch_status,
      source_payment_term_id: data.source_payment_term_id,
      source_eta: data.source_eta ? dayjs(data.source_eta).format("YYYY-MM-DD") : null,
      source_location: data.source_location,
      source_internal_remarks: data.source_internal_remarks,
    };

    try {
      await dispatch(addLeadAction(apiPayload)).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          Lead created successfully.
        </Notification>
      );
      reset();
      navigate("/sales-leads/lead");
    } catch (error: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {error.message || "Failed to create lead."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) setCancelConfirmOpen(true);
    else navigate("/sales/leads");
  };

  const handleReset = () => {
    setResetConfirmOpen(true);
  };

  const onResetConfirm = () => {
    reset(defaultFormValues);
    setResetConfirmOpen(false);
  };

  const isLoadingInitialData = masterLoadingStatus === "loading" && !initialDataFetched;

  if (isLoadingInitialData) {
    return (
      <Container className="flex justify-center items-center h-full">
        <Spinner size="xl" />
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales/leads">
          <h6 className="font-semibold hover:text-primary">Leads</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Add New Lead</h6>
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
            <Button type="button" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Tooltip title="Reset all fields to default">
              <Button type="button" icon={<TbRefresh />} onClick={handleReset} disabled={isSubmitting}>
                Clear All
              </Button>
            </Tooltip>
            <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoadingInitialData}>
              Save
            </Button>
          </div>
        </form>
      </FormContainer>
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        type="warning"
        title="Discard Changes?"
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => { setCancelConfirmOpen(false); navigate("/sales-leads/lead"); }}
        onCancel={() => setCancelConfirmOpen(false)}
      >
        <p>Unsaved changes will be lost.</p>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        type="warning"
        title="Clear Form?"
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={onResetConfirm}
        onCancel={() => setResetConfirmOpen(false)}
      >
        <p>Are you sure you want to clear all fields in the form?</p>
      </ConfirmDialog>
    </Container>
  );
};

export default AddLeadPage;