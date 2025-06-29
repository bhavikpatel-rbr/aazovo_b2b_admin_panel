import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink, useParams } from "react-router-dom";
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
import { TbInfoCircle } from "react-icons/tb";

// Types and Schema
import type { LeadFormData } from "../types";
import {
  leadFormSchema,
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
  getLeadMemberAction,
  getSalesPersonAction,
  getSuppliersAction,
  editLeadAction,
  getLeadById,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

type ApiLookupItem = {
  id: string | number;
  name: string;
  term_name?: string;
  [key: string]: any;
};

// --- Updated options, same as AddLeadPage ---
const productStatusOptions = [
  { value: "Non-active", label: "Non-active" },
  { value: "Active", label: "Active" },
];

const cartoonTypeOptions = [
  { value: 1, label: "Master Carton" },
  { value: 2, label: "Inner Carton" },
  { value: 3, label: "Pallet" },
  { value: 4, label: "Box" },
  { value: 5, label: "Unit" },
];

const deviceConditionOptions = [
  ...baseDeviceConditionOptions,
  { value: "Old", label: "Old" },
];

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
    salesPerson = [],
    suppliers = [],
    currentLead,
    currentLeadStatus = "idle",
    status: masterDataLoadingStatus = "idle",
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
    defaultValues: {
      member_id: null,
      enquiry_type: '',
      lead_intent: null,
      product_id: null,
      qty: null,
    }
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
    if (!id) {
      toast.push(<Notification title="Error" type="danger">Lead ID missing.</Notification>);
      navigate("/sales/leads");
      return;
    }
    dispatch(getAllProductAction());
    dispatch(getProductSpecificationsAction());
    dispatch(getPaymentTermAction());
    dispatch(getLeadMemberAction());
    dispatch(getSalesPersonAction());
    dispatch(getSuppliersAction());
    dispatch(getLeadById(id));
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (currentLeadStatus === "idle" && currentLead) {
      const toNumber = (val: any) => {
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      // Reverse lookup for cartoon type: API gives label ("Box"), form needs value (4)
      const cartoonTypeId =
        cartoonTypeOptions.find(
          (option) => option.label === currentLead.cartoon_type
        )?.value ?? null;
      
      reset({
        // Lead Info
        member_id: toNumber(currentLead.lead_member), // Map from API name
        enquiry_type: currentLead.enquiry_type ?? "",
        lead_intent: currentLead.lead_intent ?? null,
        product_id: toNumber(currentLead.product_id),
        product_spec_id: toNumber(currentLead.product_spec_id),
        qty: toNumber(currentLead.qty),
        target_price: toNumber(currentLead.target_price),
        lead_status: currentLead.lead_status ?? "New",
        assigned_sales_person_id: toNumber(currentLead.assigned_saled_id), // Map from API name

        // Sourcing Details
        source_supplier_id: toNumber(currentLead.source_member_id), // Map from API name
        source_qty: toNumber(currentLead.source_qty),
        source_price: toNumber(currentLead.sourced_price), // Map from API name
        source_product_status: currentLead.product_status ?? null, // Map from API name
        source_device_condition: currentLead.device_condition ?? null, // Map from API name
        source_device_type: currentLead.device_type ?? null, // Map from API name
        source_color: currentLead.color ?? null, // Map from API name
        source_cartoon_type_id: cartoonTypeId, // Use the reverse-looked-up ID
        source_dispatch_status: currentLead.dispatch_status ?? null, // Map from API name
        source_payment_term_id: toNumber(currentLead.payment_term_id),
        source_location: currentLead.location ?? null, // Map from API name
        source_internal_remarks: currentLead.internal_remark ?? null, // Map from API name
        
        source_eta:
          currentLead.eta && dayjs(currentLead.eta).isValid()
            ? dayjs(currentLead.eta).toDate()
            : null,
      });
    }
  }, [currentLead, currentLeadStatus, reset]);

  // Memoized options from Redux store
  const productOptions = useMemo(() => productsMasterData.map((p: ApiLookupItem) => ({ value: p.id, label: p.name })), [productsMasterData]);
  const productSpecOptions = useMemo(() => ProductSpecificationsData.map((s: ApiLookupItem) => ({ value: s.id, label: s.name })), [ProductSpecificationsData]);
  const paymentTermOptions = useMemo(() => PaymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.term_name || pt.name })), [PaymentTermsData]);
  const leadMemberOptions = useMemo(() => memberData.map((m: ApiLookupItem) => ({ value: m.id, label: m.name })), [memberData]);
  const salesPersonOptions = useMemo(() => salesPerson.map((sp: ApiLookupItem) => ({ value: sp.id, label: sp.name })), [salesPerson]);

  const onSubmit = async (data: LeadFormData) => {
    if (!id) return;
    setIsSubmitting(true);

    // Find the label for the cartoon type ID
    const cartoonTypeLabel =
      cartoonTypeOptions.find(
        (option) => option.value === data.source_cartoon_type_id
      )?.label || null;

    // --- START: PAYLOAD TRANSFORMATION ---
    // Transform the form data to match the required API payload structure for editing
    const apiPayload = {
      id: parseInt(id, 10), // Ensure ID is a number
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
    // --- END: PAYLOAD TRANSFORMATION ---
    
    try {
      await dispatch(editLeadAction(apiPayload)).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          Lead updated successfully.
        </Notification>
      );
      navigate("/sales-leads/lead");
    } catch (error: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {error.message || "Failed to update lead."}
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

  const isLoadingPage = masterDataLoadingStatus === 'loading' || currentLeadStatus === 'loading';

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
        <NavLink to="/sales/leads">
          <h6 className="font-semibold hover:text-primary">Leads</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">
          Edit Lead (ID: {currentLead?.lead_number || id})
        </h6>
      </div>
      <FormContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AdaptableCard className="mb-4">
            <h5 className="mb-6 font-semibold">Lead Information</h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
            <FormItem
                label="Lead Intent"
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
                      value={leadIntentOptions.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isClearable
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
                      value={leadMemberOptions.find(
                        (o: any) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isLoading={masterDataLoadingStatus === "loading"}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={<div>Enquiry Type<span className="text-red-500"> * </span></div>}
                invalid={!!errors.enquiry_type}
                errorMessage={errors.enquiry_type?.message}
              >
                <Controller
                  name="enquiry_type"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Type"
                      options={enquiryTypeOptions}
                      value={enquiryTypeOptions.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={<div>Product Name (Interest)<span className="text-red-500"> * </span></div>}
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
                      value={productOptions.find(
                        (o: any) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isLoading={masterDataLoadingStatus === "loading"}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={<div>Quantity<span className="text-red-500"> * </span></div>}
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
                      onChange={(val) => field.onChange(val ?? null)}
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
                      placeholder="Enter price"
                      {...field}
                      value={field.value ?? undefined}
                      onChange={(val) => field.onChange(val ?? null)}
                      step={0.01}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={<div>Lead Status<span className="text-red-500"> * </span></div>}
                invalid={!!errors.lead_status}
                errorMessage={errors.lead_status?.message}
              >
                <Controller
                  name="lead_status"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Status"
                      options={leadStatusOptions}
                      value={leadStatusOptions.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Assigned Sales Person"
                invalid={!!errors.assigned_sales_person_id}
                errorMessage={errors.assigned_sales_person_id?.message}
              >
                <Controller
                  name="assigned_sales_person_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Sales Person"
                      options={salesPersonOptions}
                      value={salesPersonOptions.find(
                        (o: any) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isLoading={masterDataLoadingStatus === "loading"}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Product Spec"
                invalid={!!errors.product_spec_id}
                errorMessage={errors.product_spec_id?.message}
              >
                <Controller
                  name="product_spec_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Specification"
                      options={productSpecOptions}
                      value={productSpecOptions.find(
                        (o: any) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isLoading={masterDataLoadingStatus === "loading"}
                      isClearable
                    />
                  )}
                />
              </FormItem>
            </div>
          </AdaptableCard>

          <AdaptableCard className="mt-4 mb-4">
            <h5 className="mb-6 font-semibold">Sourcing Details</h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
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
                      value={leadMemberOptions.find(
                        (o: any) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isLoading={masterDataLoadingStatus === "loading"}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Sourced Quantity"
                invalid={!!errors.source_qty}
                errorMessage={errors.source_qty?.message}
              >
                <Controller
                  name="source_qty"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      placeholder="Enter quantity"
                      {...field}
                      value={field.value ?? undefined}
                      onChange={(val) => field.onChange(val ?? null)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Sourced Price ($)"
                invalid={!!errors.source_price}
                errorMessage={errors.source_price?.message}
              >
                <Controller
                  name="source_price"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      placeholder="Enter price"
                      {...field}
                      value={field.value ?? undefined}
                      onChange={(val) => field.onChange(val ?? null)}
                      step={0.01}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Product Status"
                invalid={!!errors.source_product_status}
                errorMessage={errors.source_product_status?.message}
              >
                <Controller
                  name="source_product_status"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Product Status"
                      options={productStatusOptions}
                      value={productStatusOptions.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Device Condition"
                invalid={!!errors.source_device_condition}
                errorMessage={errors.source_device_condition?.message}
              >
                <Controller
                  name="source_device_condition"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Condition"
                      options={deviceConditionOptions}
                      value={deviceConditionOptions.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Device Type"
                invalid={!!errors.source_device_type}
                errorMessage={errors.source_device_type?.message}
              >
                <Controller
                  name="source_device_type"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g., Mobile Phone"
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Color"
                invalid={!!errors.source_color}
                errorMessage={errors.source_color?.message}
              >
                <Controller
                  name="source_color"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g., Space Gray"
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Cartoon Type"
                invalid={!!errors.source_cartoon_type_id}
                errorMessage={errors.source_cartoon_type_id?.message}
              >
                <Controller
                  name="source_cartoon_type_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Cartoon Type"
                      options={cartoonTypeOptions}
                      value={cartoonTypeOptions.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Dispatch Status"
                invalid={!!errors.source_dispatch_status}
                errorMessage={errors.source_dispatch_status?.message}
              >
                <Controller
                  name="source_dispatch_status"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g., Ready to Ship"
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Payment Term"
                invalid={!!errors.source_payment_term_id}
                errorMessage={errors.source_payment_term_id?.message}
              >
                <Controller
                  name="source_payment_term_id"
                  control={control}
                  render={({ field }) => (
                    <UiSelect
                      placeholder="Select Payment Term"
                      options={paymentTermOptions}
                      value={paymentTermOptions.find(
                        (o: any) => o.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                      isLoading={masterDataLoadingStatus === "loading"}
                      isClearable
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="ETA"
                invalid={!!errors.source_eta}
                errorMessage={errors.source_eta?.message as string}
              >
                <Controller
                  name="source_eta"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      placeholder="Select ETA"
                      value={
                        field.value
                          ? dayjs(field.value).isValid()
                            ? dayjs(field.value).toDate()
                            : null
                          : null
                      }
                      onChange={(date) => field.onChange(date)}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Location"
                invalid={!!errors.source_location}
                errorMessage={errors.source_location?.message}
              >
                <Controller
                  name="source_location"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g., Warehouse A"
                      {...field}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Internal Remarks"
                invalid={!!errors.source_internal_remarks}
                errorMessage={errors.source_internal_remarks?.message}
                className="md:col-span-2 lg:col-span-3"
              >
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
              disabled={isSubmitting || isLoadingPage}
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
          navigate("/sales/leads");
        }}
        onCancel={() => setCancelConfirmOpen(false)}
      >
        <p>You have unsaved changes. Are you sure you want to discard them?</p>
      </ConfirmDialog>
    </Container>
  );
};
export default EditLeadPage;