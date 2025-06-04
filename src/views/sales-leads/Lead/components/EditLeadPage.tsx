// src/views/sales-leads/EditLeadPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
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
import Spinner from '@/components/ui/Spinner'; // Added

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbInfoCircle } from 'react-icons/tb';

// Types and Schema
import type { LeadFormData, LeadListItem } from '../types'; // Ensure LeadListItem is comprehensive
import { leadFormSchema, leadStatusOptions, enquiryTypeOptions, leadIntentOptions, deviceConditionOptions } from '../types';

// Redux
import { useAppDispatch } from '@/reduxtool/store'; // VERIFY PATH
import { shallowEqual } from 'react-redux';
import { useSelector } from 'react-redux';

import {
    getAllProductAction,
    getProductSpecificationsAction,
    // Assuming these actions exist based on AddLeadPage
    // getCartoonTypesAction, 
    // getPaymentTermsAction,
    // editLeadAction, // Placeholder for actual lead update
    // getLeadByIdAction, // Placeholder for fetching lead by ID
    // getMembersForFormAction, 
    // getSalesPersonsForFormAction,
    // getSuppliersForFormAction, 
} from '@/reduxtool/master/middleware'; // VERIFY PATH & ACTION NAMES
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH

// --- Define Option Types for Selects ---
type SelectOption = { value: string | number; label: string; id?: number | string };
type ApiLookupItem = { id: string | number; name: string; [key: string]: any };

// Mock Options (Keep for fields not yet dynamic)
const dummyMembers = [{ value: '1', label: 'John Doe (1)' }, { value: 'MEM002', label: 'Jane Smith (MEM002)' }];
const dummySalesPersons = [{ value: "63", label: "Alice Wonder" }, { value: "SP002", label: "Bob Builder" }];
const dummySuppliers = [{ value: "3", label: "Supplier Alpha" }, { value: "SUP002", label: "Supplier Beta" }];
const dummyProductStatuses = ["In Stock", "Available on Order", "Low Stock", "Discontinued"].map(s => ({ value: s, label: s }));


const EditLeadPage = () => {
    const navigate = useNavigate();
    const { leadId } = useParams<{ leadId: string }>();
    const dispatch = useAppDispatch();

    const [isLoadingLeadDetails, setIsLoadingLeadDetails] = useState(true);
    const [initialDataFetched, setInitialDataFetched] = useState(false); // For dropdown options
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [leadData, setLeadData] = useState<LeadListItem | null>(null);

    const {
        productsMasterData = [],
        ProductSpecificationsData = [], // Matching case from AddLeadPage
        cartoonTypesData = [],
        paymentTermsData = [],
        status: masterLoadingStatus = "idle",
    } = useSelector(masterSelector, shallowEqual);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (!leadId) {
            toast.push(<Notification title="Error" type="danger">Lead ID missing.</Notification>);
            navigate('/sales/leads');
            return;
        }

        const loadAllData = async () => {
            setIsLoadingLeadDetails(true);
            setInitialDataFetched(false); // Reset for each load attempt

            try {
                // Fetch dropdown data in parallel
                const dropdownPromises = [
                    dispatch(getAllProductAction({})),
                    dispatch(getProductSpecificationsAction()),
                    dispatch(getCartoonTypesAction()),
                    dispatch(getPaymentTermsAction()),
                    // Add other dropdown fetches if needed (members, salespersons, suppliers)
                ];

                // Fetch lead details (simulated)
                // In real app: const fetchedLeadData = await dispatch(getLeadByIdAction(leadId)).unwrap();
                const leadDetailPromise = new Promise<LeadListItem | null>((resolve) => {
                    console.log("Fetching lead data for ID:", leadId);
                    setTimeout(() => {
                        const mockLeads: LeadListItem[] = [
                            { id: "LD001", leadNumber: "LD001", status: "Qualified", enquiryType: "Quote Request", productName: "iPhone 15 Pro Max", memberId: "1", memberName: "John Doe", intent: "Buy", qty: 10, targetPrice: 950, salesPersonId: "63", createdAt: new Date(), sourcingDetails: { supplierId: "3", productId: 1, productSpecId: 1, qty: 10, productStatus: "In Stock", price: 940, deviceCondition: "New", eta: dayjs().add(7, 'day').toDate(), location: "Warehouse A", cartoonTypeId: 1, paymentTermId: 2 }},
                            { id: "LD002", leadNumber: "LD002", status: "New", enquiryType: "Product Info", productName: "Galaxy S24", memberId: "MEM002", memberName: "Jane Smith", intent: "Inquire", qty: 1, targetPrice: null, salesPersonId: null, createdAt: new Date() },
                        ];
                        const foundLead = mockLeads.find(lead => String(lead.id) === leadId);
                        resolve(foundLead || null);
                    }, 500);
                });

                const [_, __, ___, ____, fetchedLeadData] = await Promise.all([...dropdownPromises, leadDetailPromise]);
                setInitialDataFetched(true);


                if (fetchedLeadData) {
                    setLeadData(fetchedLeadData);
                    reset({
                        memberId: fetchedLeadData.memberId,
                        enquiryType: fetchedLeadData.enquiryType,
                        leadIntent: fetchedLeadData.intent || null,
                        productName: fetchedLeadData.productName || null, // This is the free-text product name
                        qty: fetchedLeadData.qty,
                        targetPrice: fetchedLeadData.targetPrice,
                        leadStatus: fetchedLeadData.status,
                        assignedSalesPersonId: fetchedLeadData.salesPersonId ? String(fetchedLeadData.salesPersonId) : null,
                        
                        sourcing_supplierId: fetchedLeadData.sourcingDetails?.supplierId ? String(fetchedLeadData.sourcingDetails.supplierId) : null,
                        sourcing_productId: fetchedLeadData.sourcingDetails?.productId, // Should be ID
                        sourcing_productSpecId: fetchedLeadData.sourcingDetails?.productSpecId, // Should be ID
                        sourcing_qty: fetchedLeadData.sourcingDetails?.qty,
                        sourcing_price: fetchedLeadData.sourcingDetails?.price,
                        sourcing_productStatus: fetchedLeadData.sourcingDetails?.productStatus,
                        sourcing_deviceCondition: fetchedLeadData.sourcingDetails?.deviceCondition,
                        sourcing_deviceType: fetchedLeadData.sourcingDetails?.deviceType,
                        sourcing_color: fetchedLeadData.sourcingDetails?.color,
                        sourcing_cartoonTypeId: fetchedLeadData.sourcingDetails?.cartoonTypeId, // Should be ID
                        sourcing_dispatchStatus: fetchedLeadData.sourcingDetails?.dispatchStatus,
                        sourcing_paymentTermId: fetchedLeadData.sourcingDetails?.paymentTermId, // Should be ID
                        sourcing_eta: fetchedLeadData.sourcingDetails?.eta ? (dayjs(fetchedLeadData.sourcingDetails.eta).isValid() ? dayjs(fetchedLeadData.sourcingDetails.eta).toDate() : null) : null,
                        sourcing_location: fetchedLeadData.sourcingDetails?.location,
                        sourcing_internalRemarks: fetchedLeadData.sourcingDetails?.internalRemarks,
                    });
                } else {
                    toast.push(<Notification title="Not Found" type="warning">Lead not found.</Notification>);
                    navigate('/sales/leads');
                }
            } catch (err) {
                toast.push(<Notification title="Error" type="danger">Failed to load lead data.</Notification>);
                console.error("Error loading data for edit lead:", err);
                navigate('/sales/leads');
            } finally {
                setIsLoadingLeadDetails(false);
            }
        };

        loadAllData();
    }, [leadId, navigate, reset, dispatch]);

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
        if (!Array.isArray(paymentTermsData)) return [];
        return paymentTermsData.map((pt: ApiLookupItem) => ({ value: pt.id, label: pt.name }));
    }, [paymentTermsData]);


    const onSubmit = async (data: LeadFormData) => {
        if (!leadId || !leadData) return;
        setIsSubmitting(true);
        const payload = {
            ...data,
            id: leadId, 
            sourcing_eta: data.sourcing_eta ? dayjs(data.sourcing_eta).toISOString() : null,
            // Include original created_at if your API expects it or handles it
            // created_at: leadData.createdAt ? dayjs(leadData.createdAt).toISOString() : undefined, 
        };
        console.log("Updating Lead:", payload);
        try {
            // await dispatch(editLeadAction(payload)).unwrap();
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.push(<Notification title="Success" type="success">Lead updated successfully.</Notification>);
            navigate('/sales/leads');
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Update failed."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/sales/leads');
    };

    const isLoadingPage = isLoadingLeadDetails || (masterLoadingStatus === "loading" && !initialDataFetched);

    if (isLoadingPage) {
        return (
            <Container className="h-full flex justify-center items-center">
                <Spinner size="xl" /><p className="ml-2">Loading lead details...</p>
            </Container>
        );
    }
    if (!leadData && !isLoadingLeadDetails) { // Check after loading attempt
        return (
            <Container className="h-full flex flex-col justify-center items-center">
                <TbInfoCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-lg">Lead not found.</p>
                <Button className="mt-6" onClick={()=>navigate('/sales/leads')}>Back to List</Button>
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
                        <h5 className="font-semibold text-primary-600 dark:text-primary-400">Edit Lead: {leadData?.leadNumber}</h5>
                    </div>

                    <AdaptableCard className="mb-4">
                        <h5 className="mb-6 font-semibold">Lead Information</h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Member*" error={errors.memberId?.message}><Controller name="memberId" control={control} render={({ field }) => <UiSelect placeholder="Select Member" options={dummyMembers} value={dummyMembers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false /* Update if members are dynamic */} />}/></FormItem>
                            <FormItem label="Enquiry Type*" error={errors.enquiryType?.message}><Controller name="enquiryType" control={control} render={({ field }) => <UiSelect placeholder="Select Enquiry Type" options={enquiryTypeOptions} value={enquiryTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
                            <FormItem label="Lead Intent" error={errors.leadIntent?.message}><Controller name="leadIntent" control={control} render={({ field }) => <UiSelect placeholder="Select Intent" options={leadIntentOptions} value={leadIntentOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Product Name (Interest)" error={errors.productName?.message}><Controller name="productName" control={control} render={({ field }) => <Input placeholder="e.g., Specific model or general category" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Quantity" error={errors.qty?.message}><Controller name="qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Target Price ($)" error={errors.targetPrice?.message}><Controller name="targetPrice" control={control} render={({ field }) => <InputNumber placeholder="Enter target price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Lead Status*" error={errors.leadStatus?.message}><Controller name="leadStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Status" options={leadStatusOptions} value={leadStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
                            <FormItem label="Assigned Sales Person" error={errors.assignedSalesPersonId?.message}><Controller name="assignedSalesPersonId" control={control} render={({ field }) => <UiSelect placeholder="Select Sales Person" options={dummySalesPersons} value={dummySalesPersons.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false /* Update if salespersons are dynamic */} isClearable />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <AdaptableCard>
                        <h5 className="mb-6 font-semibold">Sourcing Details (Optional)</h5>
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Supplier" error={errors.sourcing_supplierId?.message}><Controller name="sourcing_supplierId" control={control} render={({ field }) => <UiSelect placeholder="Select Supplier" options={dummySuppliers} value={dummySuppliers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={false /* Update if suppliers are dynamic */} isClearable />}/></FormItem>
                            
                            <FormItem label="Product (Sourced)" error={errors.sourcing_productId?.message}><Controller name="sourcing_productId" control={control} render={({ field }) => <UiSelect placeholder="Select Product" options={productOptions} value={productOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && !initialDataFetched} isClearable />}/></FormItem>
                            <FormItem label="Product Specification" error={errors.sourcing_productSpecId?.message}><Controller name="sourcing_productSpecId" control={control} render={({ field }) => <UiSelect placeholder="Select Specification" options={productSpecOptions} value={productSpecOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && !initialDataFetched} isClearable />}/></FormItem>
                            
                            <FormItem label="Sourced Quantity" error={errors.sourcing_qty?.message}><Controller name="sourcing_qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Sourced Price ($)" error={errors.sourcing_price?.message}><Controller name="sourcing_price" control={control} render={({ field }) => <InputNumber placeholder="Enter price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Product Status (Sourcing)" error={errors.sourcing_productStatus?.message}><Controller name="sourcing_productStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Product Status" options={dummyProductStatuses} value={dummyProductStatuses.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Device Condition" error={errors.sourcing_deviceCondition?.message}><Controller name="sourcing_deviceCondition" control={control} render={({ field }) => <UiSelect placeholder="Select Condition" options={deviceConditionOptions} value={deviceConditionOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                            <FormItem label="Device Type" error={errors.sourcing_deviceType?.message}><Controller name="sourcing_deviceType" control={control} render={({ field }) => <Input placeholder="e.g., Mobile Phone, Laptop" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Color" error={errors.sourcing_color?.message}><Controller name="sourcing_color" control={control} render={({ field }) => <Input placeholder="e.g., Space Gray" {...field} value={field.value ?? ""} />}/></FormItem>
                            
                            <FormItem label="Cartoon Type" error={errors.sourcing_cartoonTypeId?.message}><Controller name="sourcing_cartoonTypeId" control={control} render={({ field }) => <UiSelect placeholder="Select Cartoon Type" options={cartoonTypeOptions} value={cartoonTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && !initialDataFetched} isClearable />}/></FormItem>
                            <FormItem label="Dispatch Status" error={errors.sourcing_dispatchStatus?.message}><Controller name="sourcing_dispatchStatus" control={control} render={({ field }) => <Input placeholder="e.g., Ready to Ship" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Payment Term" error={errors.sourcing_paymentTermId?.message}><Controller name="sourcing_paymentTermId" control={control} render={({ field }) => <UiSelect placeholder="Select Payment Term" options={paymentTermOptions} value={paymentTermOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isLoading={masterLoadingStatus === "loading" && !initialDataFetched} isClearable />}/></FormItem>
                            
                            <FormItem label="ETA" error={errors.sourcing_eta?.message as string}><Controller name="sourcing_eta" control={control} render={({ field }) => <DatePicker placeholder="Select ETA" value={field.value ? (dayjs(field.value).isValid() ? dayjs(field.value).toDate() : null) : null} onChange={date => field.onChange(date)} />}/></FormItem>
                            <FormItem label="Location (Sourcing)" error={errors.sourcing_location?.message}><Controller name="sourcing_location" control={control} render={({ field }) => <Input placeholder="e.g., Warehouse A" {...field} value={field.value ?? ""} />}/></FormItem>
                            <FormItem label="Internal Remarks (Sourcing)" error={errors.sourcing_internalRemarks?.message} className="md:col-span-2 lg:col-span-3"><Controller name="sourcing_internalRemarks" control={control} render={({ field }) => <Input textArea rows={3} placeholder="Internal notes..." {...field} value={field.value ?? ""} />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={(!isDirty && !isValid) || isSubmitting || isLoadingPage}>Save</Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate('/sales/leads'); }} onCancel={() => setCancelConfirmOpen(false)}><p>Unsaved changes will be lost.</p></ConfirmDialog>
        </Container>
    );
};
export default EditLeadPage;