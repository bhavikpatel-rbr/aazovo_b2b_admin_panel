// src/views/sales-leads/EditLeadPage.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer, Form } from '@/components/ui/Form';
import { Select as UiSelect, DatePicker, Button } from '@/components/ui';
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import AdaptableCard from '@/components/shared/AdaptiveCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';


// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbInfoCircle } from 'react-icons/tb';

// Types and Schema
import type { LeadFormData, LeadListItem } from '../types';
import { leadFormSchema, leadStatusOptions, enquiryTypeOptions, leadIntentOptions, deviceConditionOptions } from '../types';

// Redux
// import { useAppDispatch } from '@/reduxtool/store';
// import { editLeadAction, getLeadByIdAction, ... } from '@/reduxtool/master/middleware';

// Mock Options (Replace with fetched data if not already in types.ts)
const dummyMembers = [{ value: 'MEM001', label: 'John Doe (MEM001)' }, { value: 'MEM002', label: 'Jane Smith (MEM002)' }];
const dummySalesPersons = [{ value: "SP001", label: "Alice Wonder" }, { value: "SP002", label: "Bob Builder" }];
const dummySuppliers = [{ value: "SUP001", label: "Supplier Alpha" }, { value: "SUP002", label: "Supplier Beta" }];
const dummyProducts = [{ value: 1, label: "iPhone 15 Pro" }, { value: 2, label: "Galaxy S24 Ultra" }];
const dummyProductSpecs = [{ value: 1, label: "256GB, Blue (iPhone)" }, { value: 2, label: "512GB, Black (Galaxy)" }];
const dummyProductStatuses = ["In Stock", "Available on Order", "Low Stock", "Discontinued"].map(s => ({ value: s, label: s }));
const dummyCartoonTypes = [{ value: 1, label: "Master Carton" }, { value: 2, label: "Inner Box" }];
const dummyPaymentTerms = [{ value: 1, label: "Net 30" }, { value: 2, label: "COD" }];


const EditLeadPage = () => {
    const navigate = useNavigate();
    const { leadId } = useParams<{ leadId: string }>();
    // const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [leadData, setLeadData] = useState<LeadListItem | null>(null);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (!leadId) {
            toast.push(<Notification title="Error" type="danger">Lead ID missing.</Notification>);
            navigate('/sales/leads'); // Adjust path
            return;
        }
        setIsLoading(true);
        // TODO: Replace with actual API call to fetch lead by ID
        // dispatch(getLeadByIdAction(leadId)).unwrap().then(data => { ... })
        console.log("Fetching lead data for ID:", leadId);
        new Promise<LeadListItem | null>((resolve) => {
            setTimeout(() => {
                const mockLeads: LeadListItem[] = [ // Simulate finding the lead
                    { id: "LD001", leadNumber: "LD001", status: "Qualified", enquiryType: "Quote Request", productName: "iPhone 15 Pro Max", memberId: "MEM001", memberName: "John Doe", intent: "Buy", qty: 10, targetPrice: 950, salesPersonId: "SP001", createdAt: new Date(), sourcingDetails: { supplierId: "SUP001", productId: 1, qty: 10, productStatus: "In Stock", price: 940, deviceCondition: "New", eta: dayjs().add(7, 'day').toDate(), location: "Warehouse A" }},
                    { id: "LD002", leadNumber: "LD002", status: "New", enquiryType: "Product Info", productName: "Galaxy S24", memberId: "MEM002", memberName: "Jane Smith", intent: "Inquire", qty: 1, targetPrice: null, salesPersonId: null, createdAt: new Date() },
                ];
                const foundLead = mockLeads.find(lead => String(lead.id) === leadId);
                resolve(foundLead || null);
            }, 500);
        })
        .then(data => {
            if (data) {
                setLeadData(data);
                reset({ // Populate form with fetched data
                    memberId: data.memberId,
                    enquiryType: data.enquiryType,
                    leadIntent: data.intent || null,
                    productName: data.productName || null,
                    qty: data.qty,
                    targetPrice: data.targetPrice,
                    leadStatus: data.status,
                    assignedSalesPersonId: data.salesPersonId ? String(data.salesPersonId) : null,
                    sourcing_supplierId: data.sourcingDetails?.supplierId ? String(data.sourcingDetails.supplierId) : null,
                    sourcing_productId: data.sourcingDetails?.productId,
                    sourcing_productSpecId: data.sourcingDetails?.productSpecId,
                    sourcing_qty: data.sourcingDetails?.qty,
                    sourcing_price: data.sourcingDetails?.price,
                    sourcing_productStatus: data.sourcingDetails?.productStatus,
                    sourcing_deviceCondition: data.sourcingDetails?.deviceCondition,
                    sourcing_deviceType: data.sourcingDetails?.deviceType,
                    sourcing_color: data.sourcingDetails?.color,
                    sourcing_cartoonTypeId: data.sourcingDetails?.cartoonTypeId,
                    sourcing_dispatchStatus: data.sourcingDetails?.dispatchStatus,
                    sourcing_paymentTermId: data.sourcingDetails?.paymentTermId,
                    sourcing_eta: data.sourcingDetails?.eta ? (dayjs(data.sourcingDetails.eta).isValid() ? dayjs(data.sourcingDetails.eta).toDate() : data.sourcingDetails.eta) : null,
                    sourcing_location: data.sourcingDetails?.location,
                    sourcing_internalRemarks: data.sourcingDetails?.internalRemarks,
                });
            } else {
                toast.push(<Notification title="Not Found" type="warning">Lead not found.</Notification>);
                navigate('/sales/leads'); // Adjust path
            }
        })
        .catch(err => { toast.push(<Notification title="Error" type="danger">Failed to load lead.</Notification>); console.error(err); navigate('/sales/leads'); })
        .finally(() => setIsLoading(false));
    }, [leadId, navigate, reset]);

    const onSubmit = async (data: LeadFormData) => {
        if (!leadId) return;
        setIsSubmitting(true);
        const payload = {
            ...data,
            id: leadId, // Include ID for update
            sourcing_eta: data.sourcing_eta ? dayjs(data.sourcing_eta).toISOString() : null,
        };
        console.log("Updating Lead:", payload);
        try {
            // await dispatch(editLeadAction(payload)).unwrap(); // Example Redux
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
            toast.push(<Notification title="Success" type="success">Lead updated successfully.</Notification>);
            navigate('/sales/leads'); // Adjust path
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Update failed."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/sales/leads'); // Adjust path
    };

    if (isLoading) return <Container className="h-full flex justify-center items-center"><p className="ml-2">Loading lead...</p></Container>;
    if (!leadData) return <Container className="h-full flex flex-col justify-center items-center"><TbInfoCircle size={48} className="text-gray-400 mb-4" /><p className="text-lg">Lead not found.</p><Button className="mt-6" onClick={()=>navigate('/sales/leads')}>Back to List</Button></Container>;

    return (
        <Container className="h-full">
            <FormContainer>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex gap-1 items-center mb-4">
                        <NavLink to="/sales/leads"> {/* Adjust path */}
                            <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Leads</h6>
                        </NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h5 className="font-semibold text-primary-600 dark:text-primary-400">Edit Lead: {leadData.leadNumber}</h5>
                    </div>

                    <AdaptableCard className="mb-4">
                        <h5 className="mb-6 font-semibold">Lead Information</h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            {/* FormItems are identical to AddLeadPage, just pre-filled via reset */}
                            <FormItem label="Member*" error={errors.memberId?.message}><Controller name="memberId" control={control} render={({ field }) => <UiSelect placeholder="Select Member" options={dummyMembers} value={dummyMembers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} />}/></FormItem>
                            <FormItem label="Enquiry Type*" error={errors.enquiryType?.message}><Controller name="enquiryType" control={control} render={({ field }) => <UiSelect placeholder="Select Enquiry Type" options={enquiryTypeOptions} value={enquiryTypeOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} />}/></FormItem>
                            <FormItem label="Lead Intent" error={errors.leadIntent?.message}><Controller name="leadIntent" control={control} render={({ field }) => <UiSelect placeholder="Select Intent" options={leadIntentOptions} value={leadIntentOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Product Name (Interest)" error={errors.productName?.message}><Controller name="productName" control={control} render={({ field }) => <Input placeholder="e.g., Specific model or general category" {...field} />}/></FormItem>
                            <FormItem label="Quantity" error={errors.qty?.message}><Controller name="qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Target Price ($)" error={errors.targetPrice?.message}><Controller name="targetPrice" control={control} render={({ field }) => <InputNumber placeholder="Enter target price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Lead Status*" error={errors.leadStatus?.message}><Controller name="leadStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Status" options={leadStatusOptions} value={leadStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} />}/></FormItem>
                            <FormItem label="Assigned Sales Person" error={errors.assignedSalesPersonId?.message}><Controller name="assignedSalesPersonId" control={control} render={({ field }) => <UiSelect placeholder="Select Sales Person" options={dummySalesPersons} value={dummySalesPersons.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <AdaptableCard>
                        <h5 className="mb-6 font-semibold">Sourcing Details (Optional)</h5>
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Supplier" error={errors.sourcing_supplierId?.message}><Controller name="sourcing_supplierId" control={control} render={({ field }) => <UiSelect placeholder="Select Supplier" options={dummySuppliers} value={dummySuppliers.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Product (Sourced)" error={errors.sourcing_productId?.message}><Controller name="sourcing_productId" control={control} render={({ field }) => <UiSelect placeholder="Select Product" options={dummyProducts} value={dummyProducts.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Product Specification" error={errors.sourcing_productSpecId?.message}><Controller name="sourcing_productSpecId" control={control} render={({ field }) => <UiSelect placeholder="Select Specification" options={dummyProductSpecs} value={dummyProductSpecs.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Sourced Quantity" error={errors.sourcing_qty?.message}><Controller name="sourcing_qty" control={control} render={({ field }) => <InputNumber placeholder="Enter quantity" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} />}/></FormItem>
                            <FormItem label="Sourced Price ($)" error={errors.sourcing_price?.message}><Controller name="sourcing_price" control={control} render={({ field }) => <InputNumber placeholder="Enter price" {...field} value={field.value ?? undefined} onChange={val => field.onChange(val ?? null)} step={0.01} />}/></FormItem>
                            <FormItem label="Product Status (Sourcing)" error={errors.sourcing_productStatus?.message}><Controller name="sourcing_productStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Product Status" options={dummyProductStatuses} value={dummyProductStatuses.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Device Condition" error={errors.sourcing_deviceCondition?.message}><Controller name="sourcing_deviceCondition" control={control} render={({ field }) => <UiSelect placeholder="Select Condition" options={deviceConditionOptions} value={deviceConditionOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Device Type" error={errors.sourcing_deviceType?.message}><Controller name="sourcing_deviceType" control={control} render={({ field }) => <Input placeholder="e.g., Mobile Phone, Laptop" {...field} />}/></FormItem>
                            <FormItem label="Color" error={errors.sourcing_color?.message}><Controller name="sourcing_color" control={control} render={({ field }) => <Input placeholder="e.g., Space Gray" {...field} />}/></FormItem>
                            <FormItem label="Cartoon Type" error={errors.sourcing_cartoonTypeId?.message}><Controller name="sourcing_cartoonTypeId" control={control} render={({ field }) => <UiSelect placeholder="Select Cartoon Type" options={dummyCartoonTypes} value={dummyCartoonTypes.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="Dispatch Status" error={errors.sourcing_dispatchStatus?.message}><Controller name="sourcing_dispatchStatus" control={control} render={({ field }) => <Input placeholder="e.g., Ready to Ship" {...field} />}/></FormItem>
                            <FormItem label="Payment Term" error={errors.sourcing_paymentTermId?.message}><Controller name="sourcing_paymentTermId" control={control} render={({ field }) => <UiSelect placeholder="Select Payment Term" options={dummyPaymentTerms} value={dummyPaymentTerms.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field} isClearable />}/></FormItem>
                            <FormItem label="ETA" error={errors.sourcing_eta?.message as string}><Controller name="sourcing_eta" control={control} render={({ field }) => <DatePicker placeholder="Select ETA" value={field.value ? (dayjs(field.value).isValid() ? dayjs(field.value).toDate() : null) : null} onChange={date => field.onChange(date)} />}/></FormItem>
                            <FormItem label="Location (Sourcing)" error={errors.sourcing_location?.message}><Controller name="sourcing_location" control={control} render={({ field }) => <Input placeholder="e.g., Warehouse A" {...field} />}/></FormItem>
                            <FormItem label="Internal Remarks (Sourcing)" error={errors.sourcing_internalRemarks?.message} className="md:col-span-2 lg:col-span-3"><Controller name="sourcing_internalRemarks" control={control} render={({ field }) => <Input textArea rows={3} placeholder="Internal notes..." {...field} />}/></FormItem>
                        </div>
                    </AdaptableCard>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>Save Changes</Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate('/sales/leads'); }} onCancel={() => setCancelConfirmOpen(false)}><p>Unsaved changes will be lost.</p></ConfirmDialog>
        </Container>
    );
};
export default EditLeadPage;