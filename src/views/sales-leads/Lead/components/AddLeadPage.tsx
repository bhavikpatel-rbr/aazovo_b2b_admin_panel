import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer } from '@/components/ui/Form';
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

// Types and Schema
import type { LeadFormData } from '../types'; // Ensure this path is correct
import { leadFormSchema, leadStatusOptions, enquiryTypeOptions, leadIntentOptions, deviceConditionOptions } from '../types'; // Ensure this path is correct

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { shallowEqual } from 'react-redux';
import { useSelector } from 'react-redux';

import {
    getAllProductAction,
    getProductSpecificationsAction,
    getPaymentTermAction,
    addLeadAction,
} from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';

type SelectOption = { value: string | number; label: string; id?: number | string };
type ApiLookupItem = { id: string | number; name: string; term_name?: string; [key: string]: any };


const dummyMembers = [{ value: 'MEM001', label: 'John Doe (MEM001)' }, { value: 'MEM002', label: 'Jane Smith (MEM002)' }];
const dummySalesPersons = [{ value: "SP001", label: "Alice Wonder" }, { value: "SP002", label: "Bob Builder" }];
const dummySuppliers = [{ value: "SUP001", label: "Supplier Alpha" }, { value: "SUP002", label: "Supplier Beta" }];
const dummyProductStatuses = ["In Stock", "Available on Order", "Low Stock", "Discontinued"].map(s => ({ value: s, label: s }));


const AddLeadPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [initialDataFetched, setInitialDataFetched] = useState(false);

    const {
        productsMasterData = [],
        ProductSpecificationsData = [],
        cartoonTypesData = [], // Assuming this will be populated by a getCartoonTypesAction if used
        PaymentTermsData = [],
        status: masterLoadingStatus = "idle",
    } = useSelector(masterSelector, shallowEqual);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: { // UPDATED defaultValues
            member_id: "", 
            enquiry_type: "", 
            lead_intent: null, 
            product_id: null, // Was sourcing_productId
            product_spec_id: null, // Was sourcing_productSpecId
            qty: null,
            target_price: null, 
            lead_status: "New", 
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
        },
        mode: 'onChange',
    });

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                await Promise.all([
                    dispatch(getAllProductAction()),
                    dispatch(getProductSpecificationsAction()),
                    // dispatch(getCartoonTypesAction()), // Uncomment if you add this action
                    dispatch(getPaymentTermAction()),
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

    const productOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(productsMasterData)) return [];
        return productsMasterData.map((product: ApiLookupItem) => ({
            value: product.id,
            label: product.name,
        }));
    }, [productsMasterData]);

    const productSpecOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(ProductSpecificationsData)) return [];
        return ProductSpecificationsData.map((spec: ApiLookupItem) => ({
            value: spec.id,
            label: spec.name,
        }));
    }, [ProductSpecificationsData]);

    const cartoonTypeOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(cartoonTypesData)) return [];
        return cartoonTypesData.map((ct: ApiLookupItem) => ({
            value: ct.id,
            label: ct.name,
        }));
    }, [cartoonTypesData]);

    const paymentTermOptions: SelectOption[] = useMemo(() => {
        if (!Array.isArray(PaymentTermsData)) return [];
        return PaymentTermsData.map((pt: ApiLookupItem) => ({
            value: pt.id,
            label: pt.term_name || pt.name, // Use term_name if available, fallback to name
        }));
    }, [PaymentTermsData]);

    const onSubmit = async (data: LeadFormData) => {
        setIsSubmitting(true);
        const payload = {
            ...data,
            // Use new field name for ETA
            source_eta: data.source_eta ? dayjs(data.source_eta).toISOString() : null,
        };
        console.log("Submitting New Lead:", payload);
        try {
            await dispatch(addLeadAction(payload)).unwrap(); 
            toast.push(<Notification title="Success" type="success">Lead created successfully.</Notification>);
            reset(); // Resets to defaultValues, which are now updated
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
            <FormContainer>
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
                            {/* UPDATED Controller names and error access */}
                            <FormItem label="Lead Member (Supplier/Buyer) *" error={errors.member_id?.message}><Controller name="member_id" control={control} render={({ field }) => <UiSelect placeholder="Select Member" options={dummyMembers} value={dummyMembers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false} />}/></FormItem>
                            <FormItem label="Enquiry Type*" error={errors.enquiry_type?.message}><Controller name="enquiry_type" control={control} render={({ field }) => <UiSelect placeholder="Select Enquiry Type" options={enquiryTypeOptions} value={enquiryTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
                            <FormItem label="Lead Intent" error={errors.lead_intent?.message}><Controller name="lead_intent" control={control} render={({ field }) => <UiSelect placeholder="Select Intent" options={leadIntentOptions} value={leadIntentOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            
                            <FormItem label="Product Name (Interest)*" error={errors.product_id?.message}><Controller name="product_id" control={control} render={({ field }) => <UiSelect placeholder="Select Product" options={productOptions} value={productOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && productOptions.length === 0} isClearable />}/></FormItem>

                            <FormItem label="Quantity" error={errors.qty?.message}><Controller name="qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Target Price ($)" error={errors.target_price?.message}><Controller name="target_price" control={control} render={({ field }) => <InputNumber placeholder="Enter target price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Lead Status*" error={errors.lead_status?.message}><Controller name="lead_status" control={control} render={({ field }) => <UiSelect placeholder="Select Status" options={leadStatusOptions} value={leadStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
                            <FormItem label="Assigned Sales Person" error={errors.assigned_sales_person_id?.message}><Controller name="assigned_sales_person_id" control={control} render={({ field }) => <UiSelect placeholder="Select Sales Person" options={dummySalesPersons} value={dummySalesPersons.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false} isClearable />}/></FormItem>
                            
                            <FormItem label="Product Spec" error={errors.product_spec_id?.message}><Controller name="product_spec_id" control={control} render={({ field }) => <UiSelect placeholder="Select Specification" options={productSpecOptions} value={productSpecOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && productSpecOptions.length === 0} isClearable />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <AdaptableCard>
                        <h5 className="mb-6 font-semibold">Sourcing Details (Optional)</h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                             {/* UPDATED Controller names and error access */}
                            <FormItem label="Source Member (Supplier)" error={errors.source_supplier_id?.message}><Controller name="source_supplier_id" control={control} render={({ field }) => <UiSelect placeholder="Select Supplier" options={dummySuppliers} value={dummySuppliers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false} isClearable />}/></FormItem>
                            <FormItem label="Sourced Quantity" error={errors.source_qty?.message}><Controller name="source_qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Sourced Price ($)" error={errors.source_price?.message}><Controller name="source_price" control={control} render={({ field }) => <InputNumber placeholder="Enter price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Product Status " error={errors.source_product_status?.message}><Controller name="source_product_status" control={control} render={({ field }) => <UiSelect placeholder="Select Product Status" options={dummyProductStatuses} value={dummyProductStatuses.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Device Condition" error={errors.source_device_condition?.message}><Controller name="source_device_condition" control={control} render={({ field }) => <UiSelect placeholder="Select Condition" options={deviceConditionOptions} value={deviceConditionOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Device Type" error={errors.source_device_type?.message}><Controller name="source_device_type" control={control} render={({ field }) => <Input placeholder="e.g., Mobile Phone, Laptop" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Color" error={errors.source_color?.message}><Controller name="source_color" control={control} render={({ field }) => <Input placeholder="e.g., Space Gray" {...field} value={field.value ?? ""} />}/></FormItem>
                            
                            <FormItem label="Cartoon Type" error={errors.source_cartoon_type_id?.message}><Controller name="source_cartoon_type_id" control={control} render={({ field }) => <UiSelect placeholder="Select Cartoon Type" options={cartoonTypeOptions} value={cartoonTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && cartoonTypeOptions.length === 0} isClearable />}/></FormItem>
                            
                            <FormItem label="Dispatch Status" error={errors.source_dispatch_status?.message}><Controller name="source_dispatch_status" control={control} render={({ field }) => <Input placeholder="e.g., Ready to Ship" {...field} value={field.value ?? ""} />}/></FormItem>
                            
                            <FormItem label="Payment Term" error={errors.source_payment_term_id?.message}><Controller name="source_payment_term_id" control={control} render={({ field }) => <UiSelect placeholder="Select Payment Term" options={paymentTermOptions} value={paymentTermOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && paymentTermOptions.length === 0} isClearable />}/></FormItem>
                            
                            <FormItem label="ETA" error={errors.source_eta?.message as string}><Controller name="source_eta" control={control} render={({ field }) => <DatePicker placeholder="Select ETA" value={field.value ? (dayjs(field.value).isValid() ? dayjs(field.value).toDate() : null) : null} onChange={date => field.onChange(date)} />}/></FormItem>
                            <FormItem label="Location" error={errors.source_location?.message}><Controller name="source_location" control={control} render={({ field }) => <Input placeholder="e.g., Warehouse A" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Internal Remarks" error={errors.source_internal_remarks?.message} className="md:col-span-2 lg:col-span-3"><Controller name="source_internal_remarks" control={control} render={({ field }) => <Input textArea rows={3} placeholder="Internal notes..." {...field} value={field.value ?? ""} />}/></FormItem>
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