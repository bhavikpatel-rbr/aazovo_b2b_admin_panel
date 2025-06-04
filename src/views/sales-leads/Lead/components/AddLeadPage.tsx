// src/views/sales-leads/AddLeadPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer } from '@/components/ui/Form'; // Removed Form as it's handled by RHF's form tag
import { Select as UiSelect, DatePicker, Button } from '@/components/ui';
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import AdaptableCard from '@/components/shared/AdaptiveCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Spinner from '@/components/ui/Spinner'; // Added for loading state

// Icons
import { BiChevronRight } from 'react-icons/bi';

// Types and Schema (from shared types.ts)
// Assuming these are correctly defined in your types.ts
import type { LeadFormData } from '../types';
import { leadFormSchema, leadStatusOptions, enquiryTypeOptions, leadIntentOptions, deviceConditionOptions } from '../types';

// Redux
import { useAppDispatch } from '@/reduxtool/store'; // VERIFY PATH
import { shallowEqual } from 'react-redux';
import { useSelector } from 'react-redux';

import {
    getAllProductAction, // For sourcing_productId
    getProductSpecificationsAction, // For sourcing_productSpecId
    // Assuming actions for these exist:
    // getCartoonTypesAction,
    getPaymentTermAction,
    // getMembersForFormAction, // If you make these dynamic
    // getSalesPersonsForFormAction,
    // getSuppliersForFormAction, 
    // addLeadAction, // Placeholder for actual lead submission
} from '@/reduxtool/master/middleware'; // VERIFY PATH & ACTION NAMES
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH

// --- Define Option Types for Selects (if not already in types.ts) ---
type SelectOption = { value: string | number; label: string; id?: number | string }; // value can be string or number based on what UiSelect expects
type ApiLookupItem = { id: string | number; name: string; [key: string]: any };


// Mock Options (Replace with fetched data or remove if fully dynamic)
const dummyMembers = [{ value: 'MEM001', label: 'John Doe (MEM001)' }, { value: 'MEM002', label: 'Jane Smith (MEM002)' }];
const dummySalesPersons = [{ value: "SP001", label: "Alice Wonder" }, { value: "SP002", label: "Bob Builder" }];
const dummySuppliers = [{ value: "SUP001", label: "Supplier Alpha" }, { value: "SUP002", label: "Supplier Beta" }];
// dummyProducts will be replaced by productOptions from Redux
// dummyProductSpecs will be replaced by productSpecOptions from Redux
const dummyProductStatuses = ["In Stock", "Available on Order", "Low Stock", "Discontinued"].map(s => ({ value: s, label: s }));
// dummyCartoonTypes will be replaced by cartoonTypeOptions from Redux
// dummyPaymentTerms will be replaced by paymentTermOptions from Redux


const AddLeadPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [initialDataFetched, setInitialDataFetched] = useState(false);

    const {
        productsMasterData = [],
        ProductSpecificationsData = [], // Assumed from masterSelector
        cartoonTypesData = [],          // Assumed from masterSelector
        PaymentTermsData = [],          // Assumed from masterSelector
        // membersData = [], // If you fetch members via Redux
        // salesPersonsData = [], // If you fetch sales persons via Redux
        // suppliersData = [], // If you fetch suppliers via Redux
        status: masterLoadingStatus = "idle",
    } = useSelector(masterSelector, shallowEqual);


    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: { // Ensure these align with LeadFormData types
            memberId: "", enquiryType: "", leadIntent: null, 
            // productName: null, // This field was commented out, if it's free text, add it. If it's from sourcing_productId, that's handled.
            qty: null,
            targetPrice: null, leadStatus: "New", assignedSalesPersonId: null,
            
            sourcing_supplierId: null, 
            sourcing_productId: null, // Will store the ID (number or string based on schema)
            sourcing_productSpecId: null, // Will store the ID (number or string based on schema)
            sourcing_qty: null, sourcing_price: null, sourcing_productStatus: null,
            sourcing_deviceCondition: null, sourcing_deviceType: null, sourcing_color: null,
            sourcing_cartoonTypeId: null, // Will store the ID (number or string based on schema)
            sourcing_dispatchStatus: null, 
            sourcing_paymentTermId: null, // Will store the ID (number or string based on schema)
            sourcing_eta: null, sourcing_location: null, sourcing_internalRemarks: null,
        },
        mode: 'onChange',
    });

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                await Promise.all([
                    dispatch(getAllProductAction()),
                    dispatch(getProductSpecificationsAction()),
                    // dispatch(getCartoonTypesAction()),
                    dispatch(getPaymentTermAction()),
                    // dispatch(getMembersForFormAction()), // Uncomment if dynamic
                    // dispatch(getSalesPersonsForFormAction()), // Uncomment if dynamic
                    // dispatch(getSuppliersForFormAction()), // Uncomment if dynamic
                ]);
            } catch (error) {
                console.error("Failed to fetch dropdown data for Add Lead page:", error);
                toast.push(<Notification title="Data Load Error" type="danger">Could not load selection options.</Notification>);
            } finally {
                setInitialDataFetched(true);
            }
        };
        fetchDropdownData();
    }, [dispatch]);

    // --- Prepare options for Select components ---
    const productOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(productsMasterData)) return [];
        return productsMasterData.map((product: ApiLookupItem) => ({
            value: product.id, // Using original ID as value
            label: product.name,
        }));
    }, [productsMasterData]);

    const productSpecOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(ProductSpecificationsData)) return [];
        return ProductSpecificationsData.map((spec: ApiLookupItem) => ({
            value: spec.id, // Using original ID as value
            label: spec.name,
        }));
    }, [ProductSpecificationsData]);

    const cartoonTypeOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(cartoonTypesData)) return [];
        return cartoonTypesData.map((ct: ApiLookupItem) => ({
            value: ct.id, // Using original ID as value
            label: ct.name,
        }));
    }, [cartoonTypesData]);

    const paymentTermOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(PaymentTermsData)) return [];
        return PaymentTermsData.map((pt: ApiLookupItem) => ({
            value: pt.id, // Using original ID as value
            label: pt.term_name,
        }));
    }, [PaymentTermsData]);


    const onSubmit = async (data: LeadFormData) => {
        setIsSubmitting(true);
        // Ensure IDs are numbers if your API/schema expects numbers for ID fields
        // The UiSelect component's `value` prop usually handles strings, so conversion might be needed here.
        // If schema expects number for ID fields like sourcing_productId, then `opt?.value` in onChange might need parseInt.
        // Assuming for now the schema `LeadFormData` has these as `number | null` or `string | null` correctly.
        const payload = {
            ...data,
            sourcing_eta: data.sourcing_eta ? dayjs(data.sourcing_eta).toISOString() : null,
            // Example: if sourcing_productId needs to be a number for API
            // sourcing_productId: data.sourcing_productId ? Number(data.sourcing_productId) : null, 
        };
        console.log("Submitting New Lead:", payload);
        try {
            // await dispatch(addLeadAction(payload)).unwrap(); 
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.push(<Notification title="Success" type="success">Lead created successfully.</Notification>);
            reset();
            navigate('/sales/leads');
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Failed to create lead."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/sales/leads');
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
            <FormContainer> {/* Not strictly needed if <form> is used directly */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex gap-1 items-center mb-4">
                        <NavLink to="/sales/leads">
                            <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Leads</h6>
                        </NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h5 className="font-semibold text-primary-600 dark:text-primary-400">Add New Lead</h5>
                    </div>

                    <AdaptableCard className="mb-4">
                        <h5 className="mb-6 font-semibold">Lead Information</h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Lead Member (Supplier/Buyer) *" error={errors.memberId?.message}><Controller name="memberId" control={control} render={({ field }) => <UiSelect placeholder="Select Member" options={dummyMembers} value={dummyMembers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false /* Replace with Redux loading for members */} />}/></FormItem>
                            <FormItem label="Enquiry Type*" error={errors.enquiryType?.message}><Controller name="enquiryType" control={control} render={({ field }) => <UiSelect placeholder="Select Enquiry Type" options={enquiryTypeOptions} value={enquiryTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
                            <FormItem label="Lead Intent" error={errors.leadIntent?.message}><Controller name="leadIntent" control={control} render={({ field }) => <UiSelect placeholder="Select Intent" options={leadIntentOptions} value={leadIntentOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            
                            <FormItem label="Product Name (Interest)*" error={errors.sourcing_productId?.message}><Controller name="sourcing_productId" control={control} render={({ field }) => <UiSelect placeholder="Select Product" options={productOptions} value={productOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && productOptions.length === 0} isClearable />}/></FormItem>

                            <FormItem label="Quantity" error={errors.qty?.message}><Controller name="qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Target Price ($)" error={errors.targetPrice?.message}><Controller name="targetPrice" control={control} render={({ field }) => <InputNumber placeholder="Enter target price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Lead Status*" error={errors.leadStatus?.message}><Controller name="leadStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Status" options={leadStatusOptions} value={leadStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
                            <FormItem label="Assigned Sales Person" error={errors.assignedSalesPersonId?.message}><Controller name="assignedSalesPersonId" control={control} render={({ field }) => <UiSelect placeholder="Select Sales Person" options={dummySalesPersons} value={dummySalesPersons.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false /* Replace with Redux loading for sales persons */} isClearable />}/></FormItem>
                            
                            <FormItem label="Product Spec" error={errors.sourcing_productSpecId?.message}><Controller name="sourcing_productSpecId" control={control} render={({ field }) => <UiSelect placeholder="Select Specification" options={productSpecOptions} value={productSpecOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && productSpecOptions.length === 0} isClearable />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <AdaptableCard>
                        <h5 className="mb-6 font-semibold">Sourcing Details (Optional)</h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Source Member (Supplier)" error={errors.sourcing_supplierId?.message}><Controller name="sourcing_supplierId" control={control} render={({ field }) => <UiSelect placeholder="Select Supplier" options={dummySuppliers} value={dummySuppliers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false /* Replace with Redux loading for suppliers */} isClearable />}/></FormItem>
                            <FormItem label="Sourced Quantity" error={errors.sourcing_qty?.message}><Controller name="sourcing_qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Sourced Price ($)" error={errors.sourcing_price?.message}><Controller name="sourcing_price" control={control} render={({ field }) => <InputNumber placeholder="Enter price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Product Status " error={errors.sourcing_productStatus?.message}><Controller name="sourcing_productStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Product Status" options={dummyProductStatuses} value={dummyProductStatuses.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Device Condition" error={errors.sourcing_deviceCondition?.message}><Controller name="sourcing_deviceCondition" control={control} render={({ field }) => <UiSelect placeholder="Select Condition" options={deviceConditionOptions} value={deviceConditionOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Device Type" error={errors.sourcing_deviceType?.message}><Controller name="sourcing_deviceType" control={control} render={({ field }) => <Input placeholder="e.g., Mobile Phone, Laptop" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Color" error={errors.sourcing_color?.message}><Controller name="sourcing_color" control={control} render={({ field }) => <Input placeholder="e.g., Space Gray" {...field} value={field.value ?? ""} />}/></FormItem>
                            
                            <FormItem label="Cartoon Type" error={errors.sourcing_cartoonTypeId?.message}><Controller name="sourcing_cartoonTypeId" control={control} render={({ field }) => <UiSelect placeholder="Select Cartoon Type" options={cartoonTypeOptions} value={cartoonTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && cartoonTypeOptions.length === 0} isClearable />}/></FormItem>
                            
                            <FormItem label="Dispatch Status" error={errors.sourcing_dispatchStatus?.message}><Controller name="sourcing_dispatchStatus" control={control} render={({ field }) => <Input placeholder="e.g., Ready to Ship" {...field} value={field.value ?? ""} />}/></FormItem>
                            
                            <FormItem label="Payment Term" error={errors.sourcing_paymentTermId?.message}><Controller name="sourcing_paymentTermId" control={control} render={({ field }) => <UiSelect placeholder="Select Payment Term" options={paymentTermOptions} value={paymentTermOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && paymentTermOptions.length === 0} isClearable />}/></FormItem>
                            
                            <FormItem label="ETA" error={errors.sourcing_eta?.message as string}><Controller name="sourcing_eta" control={control} render={({ field }) => <DatePicker placeholder="Select ETA" value={field.value ? (dayjs(field.value).isValid() ? dayjs(field.value).toDate() : null) : null} onChange={date => field.onChange(date)} />}/></FormItem>
                            <FormItem label="Location" error={errors.sourcing_location?.message}><Controller name="sourcing_location" control={control} render={({ field }) => <Input placeholder="e.g., Warehouse A" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Internal Remarks" error={errors.sourcing_internalRemarks?.message} className="md:col-span-2 lg:col-span-3"><Controller name="sourcing_internalRemarks" control={control} render={({ field }) => <Input textArea rows={3} placeholder="Internal notes..." {...field} value={field.value ?? ""} />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={(!isValid && !isSubmitting) || isLoadingInitialData}>Create Lead</Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate('/sales/leads'); }} onCancel={() => setCancelConfirmOpen(false)}><p>Unsaved changes will be lost.</p></ConfirmDialog>
        </Container>
    );
};
export default AddLeadPage;