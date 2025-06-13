import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import dayjs from "dayjs";
import classNames from "classnames";

// UI Components
import Input from "@/components/ui/Input";
import { FormItem, FormContainer } from "@/components/ui/Form";
import {
  Select as UiSelect,
  DatePicker,
  Button,
  Table,
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
import { TbInfoCircle, TbPencil, TbTrash } from "react-icons/tb";

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

type SelectOption = {
  value: string | number;
  label: string;
  id?: number | string;
};
type ApiLookupItem = {
  id: string | number;
  name: string;
  term_name?: string;
  [key: string]: any;
};

// --- Updated options, same as AddLeadPage ---
const productStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
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
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Dummy data for the new Matched Opportunity table
  const [matchedOpportunities] = useState([
    {
      id: 1,
      company: "TechSource Inc.",
      member: "John Doe",
      details: "Have 500 units, A-Grade, ready to ship.",
      timestamp: "2023-10-27 10:00 AM",
    },
    {
      id: 2,
      company: "Global Gadgets LLC",
      member: "Jane Smith",
      details: "Looking to buy 1000 units, flexible on price.",
      timestamp: "2023-10-27 09:45 AM",
    },
  ]);

  const {
    productsMasterData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    leadMember = [],
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
    watch, // Watch for dynamic field changes
    formState: { errors, isDirty },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: "onChange",
  });

  // Watch lead_intent to dynamically update labels
  const leadIntentValue = watch("lead_intent");

  // --- Dynamic labels based on lead_intent ---
  const leadMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy") return <div>Lead Member (Buyer)<span className="text-red-500"> * </span></div>;
    if (leadIntentValue === "Sell") return <div>Lead Member (Supplier)<span className="text-red-500"> * </span></div>;
    return <div>Lead Member (Supplier/Buyer)<span className="text-red-500"> * </span></div>;
  }, [leadIntentValue]);

  const sourceMemberLabel = useMemo(() => {
    if (leadIntentValue === "Buy") return <div>Soruce Member (Supplier)<span className="text-red-500"> * </span></div>;
    if (leadIntentValue === "Sell") return <div>Source Member (Buyer)<span className="text-red-500"> * </span></div>;
    return <div>Source Member (Supplier)<span className="text-red-500"> * </span></div>;
  }, [leadIntentValue]);

  // Fetch all dropdown and specific lead data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) {
        toast.push(
          <Notification title="Error" type="danger">
            Lead ID missing.
          </Notification>
        );
        navigate("/sales/leads");
        return;
      }
      try {
        await Promise.all([
          dispatch(getLeadById(id)),
          dispatch(getAllProductAction()),
          dispatch(getProductSpecificationsAction()),
          dispatch(getPaymentTermAction()),
          dispatch(getLeadMemberAction()),
          dispatch(getSalesPersonAction()),
          dispatch(getSuppliersAction()),
        ]);
      } catch (error) {
        console.error("Failed to fetch data for Edit Lead:", error);
        toast.push(
          <Notification title="Data Load Error" type="danger">
            Could not load required data.
          </Notification>
        );
      } finally {
        setInitialDataLoaded(true);
      }
    };
    fetchAllData();
  }, [dispatch, id, navigate]);

  // Populate form when data is ready
  useEffect(() => {
    if (currentLeadStatus === "succeeded" && currentLead && initialDataLoaded) {
      reset({
        member_id: currentLead.member_id ?? null,
        enquiry_type: currentLead.enquiry_type ?? "",
        lead_intent: currentLead.lead_intent ?? null,
        product_id: currentLead.product_id ?? null,
        product_spec_id: currentLead.product_spec_id ?? null,
        qty: currentLead.qty ?? null,
        target_price: currentLead.target_price ?? null,
        lead_status: currentLead.lead_status ?? "New",
        assigned_sales_person_id: currentLead.assigned_sales_person_id ?? null,
        source_supplier_id: currentLead.source_supplier_id ?? null,
        source_qty: currentLead.source_qty ?? null,
        source_price: currentLead.source_price ?? null,
        source_product_status: currentLead.source_product_status ?? null,
        source_device_condition: currentLead.source_device_condition ?? null,
        source_device_type: currentLead.source_device_type ?? null,
        source_color: currentLead.source_color ?? null,
        source_cartoon_type_id: currentLead.source_cartoon_type_id ?? null,
        source_dispatch_status: currentLead.source_dispatch_status ?? null,
        source_payment_term_id: currentLead.source_payment_term_id ?? null,
        source_location: currentLead.source_location ?? null,
        source_internal_remarks: currentLead.source_internal_remarks ?? null,
        source_eta:
          currentLead.source_eta && dayjs(currentLead.source_eta).isValid()
            ? dayjs(currentLead.source_eta).toDate()
            : null,
      });
    }
  }, [currentLead, currentLeadStatus, initialDataLoaded, reset]);

  // Memoized options from Redux store
  const productOptions = useMemo(
    () =>
      productsMasterData.map((p: ApiLookupItem) => ({
        value: p.id,
        label: p.name,
      })),
    [productsMasterData]
  );
  const productSpecOptions = useMemo(
    () =>
      ProductSpecificationsData.map((s: ApiLookupItem) => ({
        value: s.id,
        label: s.name,
      })),
    [ProductSpecificationsData]
  );
  const paymentTermOptions = useMemo(
    () =>
      PaymentTermsData.map((pt: ApiLookupItem) => ({
        value: pt.id,
        label: pt.term_name || pt.name,
      })),
    [PaymentTermsData]
  );
  const leadMemberOptions = useMemo(
    () =>
      leadMember.map((m: ApiLookupItem) => ({ value: m.id, label: m.name })),
    [leadMember]
  );
  const salesPersonOptions = useMemo(
    () =>
      salesPerson.map((sp: ApiLookupItem) => ({
        value: sp.id,
        label: sp.name,
      })),
    [salesPerson]
  );
  const suppliersOptions = useMemo(
    () => suppliers.map((s: ApiLookupItem) => ({ value: s.id, label: s.name })),
    [suppliers]
  );

  const onSubmit = async (data: LeadFormData) => {
    if (!id || !currentLead) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot submit: Lead data not loaded.
        </Notification>
      );
      return;
    }
    setIsSubmitting(true);
    const payload = {
      ...data,
      id: currentLead.id,
      source_eta: data.source_eta ? dayjs(data.source_eta).toISOString() : null,
    };
    try {
      await dispatch(editLeadAction(payload)).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          Lead updated successfully.
        </Notification>
      );
      navigate("/sales/leads");
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

  const isLoadingPage = !initialDataLoaded || currentLeadStatus === "loading";

  if (isLoadingPage) {
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
                        (o) => o.value === field.value
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
                        (o) => o.value === field.value
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
                        (o) => o.value === field.value
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
                        (o) => o.value === field.value
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
                      options={suppliersOptions}
                      value={suppliersOptions.find(
                        (o) => o.value === field.value
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
                        (o) => o.value === field.value
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

          <AdaptableCard>
            <h5 className="mb-6 font-semibold">Matched Opportunity</h5>
            <Table>
              <Table.THead>
                <Table.Tr>
                  <Table.Th>Company & Member</Table.Th>
                  <Table.Th>Key Details</Table.Th>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.THead>
              <Table.TBody>
                {matchedOpportunities.map((op) => {
                  const iconButtonClass =
                    "text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
                  const hoverBgClass =
                    "hover:bg-gray-100 dark:hover:bg-gray-700";
                  return (
                    <Table.Tr key={op.id}>
                      <Table.Td>
                        <div className="font-semibold">{op.company}</div>
                        <div className="text-xs text-gray-500">{op.member}</div>
                      </Table.Td>
                      <Table.Td>{op.details}</Table.Td>
                      <Table.Td>{op.timestamp}</Table.Td>
                      <Table.Td>
                        <div className="flex items-center justify-start gap-2">
                          <Tooltip title="Edit">
                            <div
                              className={classNames(
                                iconButtonClass,
                                hoverBgClass,
                                "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                              )}
                              role="button"
                              onClick={() => alert(`Editing item ${op.id}`)}
                            >
                              <TbPencil />
                            </div>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <div
                              className={classNames(
                                iconButtonClass,
                                hoverBgClass,
                                "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              )}
                              role="button"
                              onClick={() => alert(`Removing item ${op.id}`)}
                            >
                              <TbTrash />
                            </div>
                          </Tooltip>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.TBody>
            </Table>
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
