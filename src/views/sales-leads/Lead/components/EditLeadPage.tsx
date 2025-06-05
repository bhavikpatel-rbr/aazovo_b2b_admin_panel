import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer } from '@/components/ui/Form';
import { Form } from "@/components/ui/Form";
import Card from "@/components/ui/Card";

import { Select as UiSelect, DatePicker, Button } from '@/components/ui';
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import AdaptableCard from '@/components/shared/AdaptiveCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbInfoCircle } from 'react-icons/tb';

// Types and Schema (using updated snake_case schema)
import type { LeadFormData, LeadListItem } from '../types';
import { leadFormSchema, leadStatusOptions, enquiryTypeOptions, leadIntentOptions, deviceConditionOptions } from '../types';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { shallowEqual } from 'react-redux';
import { useSelector } from 'react-redux';

import {
    getAllProductAction,
    getProductSpecificationsAction,
    getPaymentTermAction, // Assuming this is still needed, and you have getCartoonTypesAction if used
    // getCartoonTypesAction, // Uncomment if used
    editLeadAction,     // Action to update a lead
    getLeadById,  // Action to fetch lead by ID
    // clearCurrentLead, // Optional: Action to clear lead details from store
} from '@/reduxtool/master/middleware'; // VERIFY PATH & ACTION NAMES
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH

type SelectOption = { value: string | number; label: string; id?: number | string };
type ApiLookupItem = { id: string | number; name: string; term_name?: string; [key: string]: any };

// Mock Options (Keep for fields not yet dynamic, but aim to replace)
const dummyMembers = [{ value: '1', label: 'John Doe (1)' }, { value: 'MEM002', label: 'Jane Smith (MEM002)' }];
const dummySalesPersons = [{ value: "63", label: "Alice Wonder" }, { value: "SP002", label: "Bob Builder" }];
const dummySuppliers = [{ value: "3", label: "Supplier Alpha" }, { value: "SUP002", label: "Supplier Beta" }];
const dummyProductStatuses = ["In Stock", "Available on Order", "Low Stock", "Discontinued"].map(s => ({ value: s, label: s }));

const EditLeadPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [dropdownsLoaded, setDropdownsLoaded] = useState(false);


    const {
        productsMasterData = [],
        ProductSpecificationsData = [],
        cartoonTypesData = [],
        PaymentTermsData = [], // Corrected from paymentTermsData
        currentLead, // Fetched lead data from Redux
        currentLeadStatus = 'idle', // Status for fetching lead data
        status: masterDataLoadingStatus = "idle", // General status for dropdowns from masterSelector
    } = useSelector(masterSelector, shallowEqual);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid }, getValues } = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema),
        mode: 'onChange',
        // Default values are not strictly needed here as reset will populate them
    });

    // --- 1. Fetch Dropdown Data ---
    useEffect(() => {
        const fetchDropdowns = async () => {
            setDropdownsLoaded(false);
            try {
                await Promise.all([
                    dispatch(getAllProductAction()),
                    dispatch(getProductSpecificationsAction()),
                    dispatch(getPaymentTermAction()),
                    // dispatch(getCartoonTypesAction()), // Uncomment if used
                    // Add other dropdown fetches if needed
                ]);
            } catch (error) {
                console.error("Failed to fetch dropdown data for Edit Lead:", error);
                toast.push(<Notification title="Dropdown Load Error" type="danger">Could not load selection options.</Notification>);
            } finally {
                setDropdownsLoaded(true);
            }
        };
        fetchDropdowns();
    }, [dispatch]);

    // --- 2. Fetch The Specific Lead to Edit ---
    useEffect(() => {
        if (!id) {
            toast.push(<Notification title="Error" type="danger">Lead ID missing.</Notification>);
            navigate('/sales-leads/lead');
            return;
        }
        // Assuming getLeadById handles string ID and fetches the correct lead
        dispatch(getLeadById(id));

        // Optional: Cleanup function to clear lead from store on unmount
        // return () => {
        //     dispatch(clearCurrentLead());
        // };
    }, [dispatch, id, navigate]);

    // --- 3. Populate Form When Data is Ready ---
    useEffect(() => {
        // Populate form if lead data is successfully loaded AND dropdowns are ready
if (currentLeadStatus === 'idle' && currentLead) {
    console.log("Populating EditLead form with:", currentLead);

    reset({
        // Top-level lead info
        member_id: currentLead.memberId ?? null,
        enquiry_type: currentLead.enquiryType ?? null,
        lead_intent: currentLead.intent ?? null,

        product_id: currentLead.productId ?? currentLead.product_id ?? null,
        product_spec_id: currentLead.productSpecId ?? currentLead.product_spec_id ?? null,

        qty: currentLead.qty ?? null,
        target_price: currentLead.targetPrice ?? currentLead.target_price ?? null,
        lead_status: currentLead.status ?? currentLead.lead_status ?? null,
        assigned_sales_person_id: currentLead.salesPersonId 
            ? String(currentLead.salesPersonId) 
            : currentLead.assigned_sales_person_id 
                ? String(currentLead.assigned_sales_person_id) 
                : null,

        // Sourcing details
        source_supplier_id: currentLead.sourcingDetails?.supplierId 
            ?? currentLead.source_supplier_id 
            ?? null,

        source_qty: currentLead.sourcingDetails?.qty 
            ?? currentLead.source_qty 
            ?? currentLead.qty 
            ?? null,

        source_price: currentLead.sourcingDetails?.price 
            ?? currentLead.source_price 
            ?? currentLead.price 
            ?? null,

        source_product_status: currentLead.sourcingDetails?.productStatus 
            ?? currentLead.source_product_status 
            ?? null,

        source_device_condition: currentLead.sourcingDetails?.deviceCondition 
            ?? currentLead.source_device_condition 
            ?? null,

        source_device_type: currentLead.sourcingDetails?.deviceType 
            ?? currentLead.source_device_type 
            ?? null,

        source_color: currentLead.sourcingDetails?.color 
            ?? currentLead.source_color 
            ?? currentLead.color 
            ?? null,

        source_cartoon_type_id: currentLead.sourcingDetails?.cartoonTypeId 
            ?? currentLead.source_cartoon_type_id 
            ?? null,

        source_dispatch_status: currentLead.sourcingDetails?.dispatchStatus 
            ?? currentLead.source_dispatch_status 
            ?? null,

        source_payment_term_id: currentLead.sourcingDetails?.paymentTermId 
            ?? currentLead.source_payment_term_id 
            ?? null,

        source_eta: currentLead.sourcingDetails?.eta
            ? (dayjs(currentLead.sourcingDetails.eta).isValid() 
                ? dayjs(currentLead.sourcingDetails.eta).toDate() 
                : null)
            : currentLead.source_eta 
                ? (dayjs(currentLead.source_eta).isValid() 
                    ? dayjs(currentLead.source_eta).toDate() 
                    : null)
                : null,

        source_location: currentLead.sourcingDetails?.location 
            ?? currentLead.source_location 
            ?? currentLead.location 
            ?? null,

        source_internal_remarks: currentLead.sourcingDetails?.internalRemarks 
            ?? currentLead.source_internal_remarks 
            ?? currentLead.internalRemarks 
            ?? null,
    });
}
else if (currentLeadStatus === 'failed' && dropdownsLoaded) { // Ensure dropdowns attempt is done
            toast.push(<Notification title="Load Error" type="danger">Failed to load lead details for editing.</Notification>);
            // Potentially navigate away or show inline error
        }
    }, [currentLead, currentLeadStatus, dropdownsLoaded, reset]);


    const productOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(productsMasterData)) return [];
        return productsMasterData.map((p: ApiLookupItem) => ({ value: p.id, label: p.name }));
    }, [productsMasterData]);

    const productSpecOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(ProductSpecificationsData)) return [];
        return ProductSpecificationsData.map((s: ApiLookupItem) => ({ value: s.id, label: s.name }));
    }, [ProductSpecificationsData]);

    const cartoonTypeOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(cartoonTypesData)) return [];
        return cartoonTypesData.map((ct: ApiLookupItem) => ({ value: ct.id, label: ct.name }));
    }, [cartoonTypesData]);

    const paymentTermOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(PaymentTermsData)) return [];
        return PaymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.term_name || pt.name }));
    }, [PaymentTermsData]);


const onSubmit = async (data: LeadFormData) => {
  console.log("Raw Form Data:", data);

  if (!id || !currentLead) {
    toast.push(<Notification title="Error" type="danger">Cannot submit: Lead data not fully loaded.</Notification>);
    return;
  }

  setIsSubmitting(true);

  console.log("Raw Form Data:", data);

  const payload = {
    ...data,
    id: currentLead.id,
    source_eta: data.source_eta ? dayjs(data.source_eta).format('YYYY-MM-DD HH:mm:ss') : null,
  };

  console.log("Final Payload to Submit:", payload);

  try {
    await dispatch(editLeadAction(payload)).unwrap();
    toast.push(<Notification title="Success" type="success">Lead updated successfully.</Notification>);
    navigate('/sales/leads');
  } catch (error: any) {
    console.error("Update lead failed:", error);
    toast.push(
      <Notification title="Error" type="danger">
        {error?.message || error?.data?.message || "Update failed."}
      </Notification>
    );
  } finally {
    setIsSubmitting(false);
  }
};


    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/sales/leads');
    };

    // Combined loading state for the page
    const isLoadingPage = currentLeadStatus === 'loading' || currentLeadStatus === 'loading' || !dropdownsLoaded;
    const isDropdownLoading = masterDataLoadingStatus === "loading" && !dropdownsLoaded;

    if (isLoadingPage && currentLeadStatus !== 'failed') {
        return (
            <Container className="h-full flex justify-center items-center">
                <Spinner size="xl" /><p className="ml-2">Loading lead details...</p>
            </Container>
        );
    }

    if (currentLeadStatus === 'failed') {
        return (
            <Container className="h-full flex flex-col justify-center items-center">
                <TbInfoCircle size={48} className="text-red-500 mb-4" />
                <p className="text-lg font-semibold">Error Loading Lead</p>
                <p className="text-gray-600">There was an issue fetching the lead details.</p>
                <Button className="mt-6" onClick={() => navigate('/sales/leads')}>Back to List</Button>
            </Container>
        );
    }
    
    if (currentLeadStatus === 'succeeded' && !currentLead && dropdownsLoaded) {
        return (
            <Container className="h-full flex flex-col justify-center items-center">
                <TbInfoCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-lg">Lead not found (ID: {id}).</p>
                <Button className="mt-6" onClick={() => navigate('/sales/leads')}>Back to List</Button>
            </Container>
        );
    }
     // Fallback if form hasn't populated due to timing, but data is technically there.
    if (currentLead && !getValues("member_id") && !isDirty && currentLeadStatus === 'succeeded' && dropdownsLoaded) {
        return (
         <Container>
           <div className="flex justify-center items-center h-screen">
             <Spinner size={40} /> <span className="ml-2">Finalizing Form...</span>
           </div>
         </Container>
       );
     }
    
return (
  <>
    <div className="flex gap-1 items-end mb-3">
      <NavLink to="/sales/leads">
        <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Leads</h6>
      </NavLink>
      <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
      <h6 className="font-semibold text-primary">Edit Lead (ID: {currentLead?.leadNumber || id})</h6>
    </div>

    <Form id="editLeadForm" onSubmit={handleSubmit(onSubmit)}>
      {/* Basic Lead Info */}
      <Card>
        <h4 className="mb-6">Lead Details</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormItem label="Lead Member *" invalid={!!errors.member_id} errorMessage={errors.member_id?.message}>
            <Controller name="member_id" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Member" options={dummyMembers}
                value={dummyMembers.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
            )} />
          </FormItem>
          
          <FormItem label="Enquiry Type *" invalid={!!errors.enquiry_type} errorMessage={errors.enquiry_type?.message}>
            <Controller name="enquiry_type" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Type" options={enquiryTypeOptions}
                value={enquiryTypeOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
            )} />
          </FormItem>

          <FormItem label="Intent" invalid={!!errors.lead_intent} errorMessage={errors.lead_intent?.message}>
            <Controller name="lead_intent" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Intent" options={leadIntentOptions}
                value={leadIntentOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />
            )} />
          </FormItem>

          <FormItem label="Product *" invalid={!!errors.product_id} errorMessage={errors.product_id?.message}>
            <Controller name="product_id" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Product" options={productOptions}
                value={productOptions.find(o => String(o.value) === String(field.value))}
                onChange={opt => field.onChange(opt?.value)} isLoading={isDropdownLoading && !productOptions.length} isClearable />
            )} />
          </FormItem>

          <FormItem label="Quantity" invalid={!!errors.qty} errorMessage={errors.qty?.message}>
            <Controller name="qty" control={control} render={({ field }) => (
              <InputNumber {...field} placeholder="Enter quantity" value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />
            )} />
          </FormItem>

          <FormItem label="Target Price ($)" invalid={!!errors.target_price} errorMessage={errors.target_price?.message}>
            <Controller name="target_price" control={control} render={({ field }) => (
              <InputNumber {...field} placeholder="Enter price" value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />
            )} />
          </FormItem>

          <FormItem label="Lead Status *" invalid={!!errors.lead_status} errorMessage={errors.lead_status?.message}>
            <Controller name="lead_status" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Status" options={leadStatusOptions}
                value={leadStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
            )} />
          </FormItem>

          <FormItem label="Sales Person" invalid={!!errors.assigned_sales_person_id} errorMessage={errors.assigned_sales_person_id?.message}>
            <Controller name="assigned_sales_person_id" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Person" options={dummySalesPersons}
                value={dummySalesPersons.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />
            )} />
          </FormItem>
        </div>
      </Card>

      {/* Seller Section */}
      <Card className="mt-4">
        <h5 className="mb-4">Seller Section</h5>
        <div className="grid md:grid-cols-2 gap-4">
          <FormItem label="Supplier" invalid={!!errors.source_supplier_id} errorMessage={errors.source_supplier_id?.message}>
            <Controller name="source_supplier_id" control={control} render={({ field }) => (
              <UiSelect {...field} placeholder="Select Supplier" options={dummySuppliers}
                value={dummySuppliers.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />
            )} />
          </FormItem>

          <FormItem label="Sourced Qty" invalid={!!errors.source_qty} errorMessage={errors.source_qty?.message}>
            <Controller name="source_qty" control={control} render={({ field }) => (
              <InputNumber {...field} placeholder="Quantity" value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />
            )} />
          </FormItem>

          <FormItem label="Sourced Price" invalid={!!errors.source_price} errorMessage={errors.source_price?.message}>
            <Controller name="source_price" control={control} render={({ field }) => (
              <InputNumber {...field} placeholder="Price" value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />
            )} />
          </FormItem>

          {/* Add other sourcing fields here (cartoon type, condition, payment, etc.) */}
        </div>
      </Card>

      {/* Notes Section */}
      <Card className="mt-4">
        <h5 className="mb-4">Internal Notes</h5>
        <FormItem invalid={!!errors.source_internal_remarks} errorMessage={errors.source_internal_remarks?.message}>
          <Controller name="source_internal_remarks" control={control} render={({ field }) => (
            <Input {...field} textArea rows={3} placeholder="Internal remarks..." value={field.value ?? ""} />
          )} />
        </FormItem>
      </Card>

      {/* Action Buttons */}
      <Card className="mt-4" bodyClass="flex justify-end gap-2">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="solid" loading={isSubmitting} disabled={isLoadingPage}>
          Save
        </Button>
      </Card>
    </Form>
  </>
);

};
export default EditLeadPage;