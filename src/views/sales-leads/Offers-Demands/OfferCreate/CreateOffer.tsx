// src/views/your-path/business-entities/CreateOffer.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import { Button, DatePicker, Input, Radio, Select as UiSelect } from "@/components/ui";
import Card from "@/components/ui/Card";
import { Form, FormItem } from "@/components/ui/Form";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import toast from "@/components/ui/toast";

// Icons
import { TbFileText, TbPlus, TbTrash } from "react-icons/tb";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
    addOfferAction,
    editOfferAction,
    getAllProductAction,
    getMembersAction,
    getOfferById,
    getPaymentTermAction, // Added
    getProductPriceAction,
    getProductsAction,
    getProductSpecificationsAction,
    getUsersAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- Zod Schema Definitions (Updated) ---
const priceListItemSchema = z.object({
    color: z.string(),
    qty: z.number().optional(),
    price: z.number().optional(),
});

const productDataSchema = z.object({
    product_id: z.number({ required_error: "Product is required." }).nullable(),
    seller_ids: z.array(z.number()).optional(),
    buyer_ids: z.array(z.number()).optional(),
    product_status: z.enum(["active", "non-active"]).default("active"),
    spec_id: z.number().nullable().default(null),
    items: z.array(priceListItemSchema).default([]),
    // New fields for note generation only
    location: z.string().nullable().optional(),
    paymentTermId: z.number().nullable().optional(),
    eta: z.any().nullable().optional(), // Use `any` for DatePicker compatibility
    dispatchStatus: z.string().nullable().optional(),
    deviceCondition: z.string().nullable().optional(),
    cartoonTypeId: z.string().nullable().optional(),
});

const offerFormSchema = z.object({
    name: z.string().min(1, "Offer Name is required."),
    assign_user: z.number({ required_error: "Assigned User is required."}).nullable(),
    product_data: z.array(productDataSchema).min(1, "Add at least one product group."),
    groupA: z.string().min(1, "Note is required."),
    groupB: z.string().min(1, "Note is required."),
});

// --- Type Definitions ---
type OfferFormData = z.infer<typeof offerFormSchema>;
type OptionType<T = string | number> = { value: T; label: string };

// --- Default Values (Updated) ---
const defaultProductGroup = {
    product_id: null,
    seller_ids: [],
    buyer_ids: [],
    product_status: 'active' as const,
    spec_id: null,
    items: [],
    location: null,
    paymentTermId: null,
    eta: null,
    dispatchStatus: null,
    deviceCondition: null,
    cartoonTypeId: null,
};

const CreateOffer = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const id = location.state?.originalApiItem?.id;
    const isEdit = !!id;

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data Fetching for Create and Edit
    useEffect(() => {
        dispatch(getUsersAction());
        dispatch(getAllProductAction());
        dispatch(getMembersAction());
        dispatch(getProductsAction());
        dispatch(getProductSpecificationsAction());
        dispatch(getPaymentTermAction()); // Added
        if (isEdit) {
            dispatch(getOfferById(id));
        }
    }, [dispatch, id, isEdit]);

    const {
        usersData = [],
        productsMasterData = [],
        memberData = [],
        ProductsData = [],
        ProductSpecificationsData = [],
        PaymentTermsData = [], // Added
        status: masterLoadingStatus = "idle",
    } = useSelector(masterSelector);

    // Memoized Select Options
    const userOptions: OptionType[] = useMemo(() => Array.isArray(usersData) ? usersData.map((u: any) => ({ value: u.id, label: `(${u.employee_id}) - ${u.name || 'N/A'}` })) : [], [usersData]);
    const productOptions: OptionType[] = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: any) => ({ value: p.id, label: p.name })) : [], [productsMasterData]);
    const memberOptions: OptionType[] = useMemo(() => Array.isArray(memberData) ? memberData.map((m: any) => ({ value: m.id, label:`(${m.customer_code}) - ${m.name || 'N/A'}` })) : [], [memberData]);
    const statusOptions: OptionType[] = [{ value: "active", label: "Active" }, { value: "non-active", label: "Non-Active" }];
    const productSpecOptions: OptionType[] = useMemo(() => Array.isArray(ProductSpecificationsData) ? ProductSpecificationsData.map((spec: any) => ({ value: spec.id, label: spec.name })) : [], [ProductSpecificationsData]);

    // New Options from WallItemForm
    const paymentTermsOption: OptionType<number>[] = useMemo(() => Array.isArray(PaymentTermsData) ? PaymentTermsData.map((p: any) => ({ value: p.id, label: p.term_name || 'Unnamed' })) : [], [PaymentTermsData]);
    const dispatchStatusOptions: OptionType[] = [ { value: "Pending", label: "Pending" }, { value: "Ready to Ship", label: "Ready to Ship" }, { value: "Shipped", label: "Shipped" }, { value: "Delivered", label: "Delivered" } ];
    const dummyCartoonTypes: OptionType[] = [{ value: "Master Cartoon", label: "Master Cartoon" }, { value: "Non Masster Cartoon", label: "Non Masster Cartoon" }];
    const deviceConditionOptions: OptionType[] = [{ value: "New", label: "New" }, { value: "Old", label: "Old" }];

    // Form Initialization
    const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<OfferFormData>({
        resolver: zodResolver(offerFormSchema),
        defaultValues: {
            name: "",
            assign_user: null,
            product_data: [defaultProductGroup],
            groupA: "",
            groupB: "",
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "product_data" });
    const watchedProductGroups = watch("product_data");

    // Populate Form When Editing
    useEffect(() => {
        const offerDataFromState = location.state?.originalApiItem;
        if (isEdit && offerDataFromState) {
            const reconstructedProductData = (offerDataFromState.offer_products || []).map((productInfo: any) => ({
                product_id: productInfo.product_id,
                seller_ids: productInfo.seller_ids || [],
                buyer_ids: productInfo.buyer_ids || [],
                product_status: productInfo.product_status?.toLowerCase() === 'non-active' ? 'non-active' : 'active',
                spec_id: productInfo.product_spec || null,
                items: productInfo.items || [], // Assuming items might be part of the response now
                // Add defaults for new fields, as they won't be in the API response
                location: null,
                paymentTermId: null,
                eta: null,
                dispatchStatus: null,
                deviceCondition: null,
                cartoonTypeId: null,
            }));

            reset({
                name: offerDataFromState.name || "",
                assign_user: offerDataFromState.assign_user ? Number(offerDataFromState.assign_user) : null,
                groupA: offerDataFromState.groupA || "",
                groupB: offerDataFromState.groupB || "",
                product_data: reconstructedProductData.length > 0 ? reconstructedProductData : [defaultProductGroup],
            });
        }
    }, [isEdit, location.state, reset]);

    // Handle product change, fetch price, and update form state for products with/without color
    const handleProductChange = useCallback(async (groupIndex: number, productId: number | null) => {
        setValue(`product_data.${groupIndex}.product_id`, productId);
        if (!productId) {
            setValue(`product_data.${groupIndex}.items`, []);
            return;
        }

        const productDetails = ProductsData.find((p: any) => parseInt(p.id) === productId);
        const colors = productDetails?.color?.split(',').map((c: string) => c.trim()).filter(Boolean) || [];
        let productPrice: number | undefined = undefined;

        try {
            const result = await dispatch(getProductPriceAction(productId)).unwrap();
            if (result.status && result.sales_price) {
                productPrice = parseFloat(result.sales_price);
            } else {
                toast.push(<Notification title="Warning" type="warning">Could not fetch price. You can enter it manually.</Notification>);
            }
        } catch (error) {
           toast.push(<Notification title="Price Error" type="danger">Failed to fetch product price. You can enter it manually.</Notification>);
        }

        const newItems = colors.length > 0
            ? colors.map((color: string) => ({ color, qty: undefined, price: productPrice }))
            : [{ color: '', qty: undefined, price: productPrice }];

        setValue(`product_data.${groupIndex}.items`, newItems, { shouldValidate: true });
    }, [dispatch, setValue, ProductsData]);

    // Reworked note generation to include all new fields
    const handleGenerateAndCopyNotes = () => {
        const relevantGroups = watchedProductGroups.filter(
            g => g.product_id && g.items.some(i => i.qty && i.qty > 0)
        );

        let messageA = "";
        let messageB = "";

        relevantGroups.forEach(group => {
            const productName = productOptions.find(p => p.value === group.product_id)?.label || "Unknown Product";
            const productStatus = group.product_status === 'active' ? 'Active' : 'Non-Active';
            const itemsWithQty = group.items.filter(item => item.qty && item.qty > 0);

            // Get new field values and their corresponding labels
            const specLabel = productSpecOptions.find(s => s.value === group.spec_id)?.label;
            const location = group.location;
            const paymentTerm = paymentTermsOption.find(o => o.value === group.paymentTermId)?.label;
            const eta = group.eta ? dayjs(group.eta).format("DD-MMM-YYYY") : null;
            const dispatchStatus = group.dispatchStatus;
            const deviceCondition = group.deviceCondition;
            const cartoonType = group.cartoonTypeId;

            // Build note parts
            let baseNote = `WTS\n${productName}\n`;
            let noteA_Items = '';
            let noteB_Items = '';

            itemsWithQty.forEach(item => {
                let line = `${item.qty}`;
                if (item.color) line += ` ${item.color}`;
                noteA_Items += line + '\n';
                if (item.price !== undefined) line += ` @$${item.price.toFixed(2)}`;
                noteB_Items += line + '\n';
            });
            
            let additionalInfo = '';
            if (specLabel) additionalInfo += `${specLabel}\n`;
            additionalInfo += `Status: ${productStatus}\n`;
            if (deviceCondition) additionalInfo += `Condition: ${deviceCondition}\n`;
            if (cartoonType) additionalInfo += `Cartoon: ${cartoonType}\n`;
            if (location) additionalInfo += `Location: ${location}\n`;
            if (paymentTerm) additionalInfo += `Payment: ${paymentTerm}\n`;
            if (dispatchStatus) additionalInfo += `Dispatch: ${dispatchStatus}\n`;
            if (eta) additionalInfo += `ETA: ${eta}\n`;

            messageA += `${baseNote}${noteA_Items}${additionalInfo}\n`;
            messageB += `${baseNote}${noteB_Items}${additionalInfo}\n`;
        });

        setValue("groupA", messageA.trim(), { shouldDirty: true });
        setValue("groupB", messageB.trim(), { shouldDirty: true });
        toast.push(<Notification title="Success" type="info">Notes generated and populated below.</Notification>);
    };

    // Updated form submission logic to exclude new fields
    const onFormSubmit = useCallback(async (data: OfferFormData) => {
        setIsSubmitting(true);
        const apiPayload = {
            id: isEdit ? id : undefined,
            name: data.name,
            groupA: data.groupA,
            groupB: data.groupB,
            assign_user: data.assign_user,
            product_data: data.product_data
                .filter(p => p.product_id)
                .map(group => {
                    const {
                        spec_id,
                        // Destructure and ignore new fields not meant for DB
                        location,
                        paymentTermId,
                        eta,
                        dispatchStatus,
                        deviceCondition,
                        cartoonTypeId,
                        ...restOfGroup
                    } = group;
                    return {
                        ...restOfGroup,
                        product_spec: spec_id,
                        items: group.items.filter(item => item.qty && item.qty > 0)
                    };
                }),
        };

        try {
            const actionType = isEdit ? 'Updated' : 'Created';
            if (isEdit) {
                await dispatch(editOfferAction(apiPayload)).unwrap();
            } else {
                await dispatch(addOfferAction(apiPayload)).unwrap();
            }
          
            toast.push(<Notification title={`Offer ${actionType}`} type="success">Offer "{data.name}" has been successfully {actionType.toLowerCase()}.</Notification>);
            reset();
            navigate("/sales-leads/offers-demands");
        } catch (error: any) {
            const actionType = isEdit ? 'Update' : 'Creation';
            const errorMessage = error?.message || `Could not ${actionType.toLowerCase()} offer. Please try again.`;
            toast.push(<Notification title={`${actionType} Failed`} type="danger">{errorMessage}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, navigate, reset, isEdit, id]);

    const handleCancel = () => {
        reset();
        navigate("/sales-leads/offers-demands");
    };

    const isLoading = masterLoadingStatus === "loading";

    console.log(watchedProductGroups, 'watchedProductGroups');
    
    return (
        <Form id="offerForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <Card className="mb-2">
                {isLoading && !isEdit ? (
                    <div className="flex justify-center p-10"><Spinner size="lg" /></div>
                ) : (
                    <>
                        <h4 className="mb-6">{isEdit ? 'Edit Offer' : 'Create Offer'}</h4>
                        <div className="grid md:grid-cols-1 gap-2">
                            <FormItem label="Offer Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
                                <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Q4 Gadget Offer" />} />
                            </FormItem>
                        </div>
                    </>
                )}
            </Card>

            {fields.map((field, index) => (
                <Card key={field.id}>
                    <div className="flex justify-end mb-1">
                        <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append(defaultProductGroup)}>
                            Add Product Group
                        </Button>
                    </div>
                    <div className="flex justify-between items-center">
                        <h5 className="mb-0">Product Group #{index + 1}</h5>
                        {fields.length > 1 && (
                            <Button shape="circle" size="sm" type="button" color="red-600" icon={<TbTrash />} onClick={() => remove(index)} />
                        )}
                    </div>
                    
                    <div className="p-4 border rounded-md dark:border-gray-600 grid lg:grid-cols-3 gap-4 items-start">
                        <FormItem label="Product" invalid={!!errors.product_data?.[index]?.product_id} errorMessage={errors.product_data?.[index]?.product_id?.message}>
                            <Controller name={`product_data.${index}.product_id`} control={control} render={({ field: { value }}) => 
                                <UiSelect placeholder="Select Product..." options={productOptions} value={productOptions.find(opt => opt.value === value)} onChange={(option) => handleProductChange(index, option ? option.value as number : null)} isLoading={isLoading} />
                            } />
                        </FormItem>
                        <FormItem label="Sellers">
                            <Controller name={`product_data.${index}.seller_ids`} control={control} render={({ field: { onChange, value }}) => 
                                <UiSelect isMulti placeholder="Select Sellers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />
                            } />
                        </FormItem>
                        <FormItem label="Buyers">
                            <Controller name={`product_data.${index}.buyer_ids`} control={control} render={({ field: { onChange, value }}) => 
                                <UiSelect isMulti placeholder="Select Buyers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />
                            } />
                        </FormItem>
                    </div>

                    {watchedProductGroups[index]?.product_id && (
                        <>
                            <div className="grid lg:grid-cols-2 gap-4 mb-4">
                                <FormItem label="Product Status">
                                    <Controller name={`product_data.${index}.product_status`} control={control} render={({ field }) => (
                                        <UiSelect options={statusOptions} value={statusOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} />
                                    )} />
                                </FormItem>
                                <FormItem label="Product Spec">
                                    <Controller name={`product_data.${index}.spec_id`} control={control} render={({ field }) => <UiSelect placeholder="Select a Spec" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} />
                                </FormItem>
                            </div>
                            
                            <h6 className="font-semibold text-sm mb-2 mt-4">Additional Details (for Note Generation)</h6>
                            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-md dark:border-gray-600">
                                <FormItem label="Location">
                                    <Controller name={`product_data.${index}.location`} control={control} render={({ field }) => <Input {...field} value={field.value || ''} placeholder="e.g., Warehouse A" />} />
                                </FormItem>
                                <FormItem label="Payment Term">
                                    <Controller name={`product_data.${index}.paymentTermId`} control={control} render={({ field }) => (
                                        <UiSelect placeholder="Select Term..." options={paymentTermsOption} value={paymentTermsOption.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isLoading={isLoading} isClearable />
                                    )} />
                                </FormItem>
                                <FormItem label="ETA">
                                    <Controller name={`product_data.${index}.eta`} control={control} render={({ field }) => (
                                        <DatePicker {...field} value={field.value} onChange={date => field.onChange(date)} inputFormat="YYYY-MM-DD" placeholder="Select ETA date" />
                                    )} />
                                </FormItem>
                                <FormItem label="Dispatch Status">
                                    <Controller name={`product_data.${index}.dispatchStatus`} control={control} render={({ field }) => (
                                        <UiSelect placeholder="Select Status..." options={dispatchStatusOptions} value={dispatchStatusOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />
                                    )} />
                                </FormItem>
                                <FormItem label="Device Condition">
                                    <Controller name={`product_data.${index}.deviceCondition`} control={control} render={({ field }) => (
                                        <UiSelect placeholder="Select Condition..." options={deviceConditionOptions} value={deviceConditionOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />
                                    )} />
                                </FormItem>
                                <FormItem label="Cartoon Type">
                                    <Controller name={`product_data.${index}.cartoonTypeId`} control={control} render={({ field }) => (
                                        <UiSelect placeholder="Select Type..." options={dummyCartoonTypes} value={dummyCartoonTypes.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />
                                    )} />
                                </FormItem>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Price</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {watchedProductGroups[index].items.map((item, itemIndex) => (
                                        <tr key={`${field.id}-item-${itemIndex}`}>
                                            <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.color || '-'}</td>
                                            <td className="px-2 py-1 whitespace-nowrap">
                                                <Controller name={`product_data.${index}.items.${itemIndex}.price`} control={control} render={({ field }) => (
                                                    <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0.00" step="0.01" />
                                                )} />
                                            </td>
                                            <td className="px-2 py-1 whitespace-nowrap">
                                                <Controller name={`product_data.${index}.items.${itemIndex}.qty`} control={control} render={({ field }) => (
                                                    <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0" />
                                                )} />
                                            </td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Card>
            ))}

            <Card className="mb-2">
                <div className="flex justify-between items-center gap-4">
                    <Button type="button" variant="outline" icon={<TbFileText />} onClick={handleGenerateAndCopyNotes}>
                        Generate Notes
                    </Button>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-4">
                <Card>
                    <h5 className="mb-4">Group A Notes</h5>
                    <FormItem invalid={!!errors.groupA} errorMessage={errors.groupA?.message}>
                        <Controller name="groupA" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate Notes' to populate..." rows={12} />} />
                    </FormItem>
                </Card>
                <Card>
                    <h5 className="mb-4">Group B Notes</h5>
                    <FormItem invalid={!!errors.groupB} errorMessage={errors.groupB?.message}>
                        <Controller name="groupB" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate Notes' to populate..." rows={12} />} />
                    </FormItem>
                </Card>
            </div>

            <Card bodyClass="flex justify-end gap-2">
                <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" form="offerForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoading}>
                    {isSubmitting ? "Saving..." : (isEdit ? 'Update Offer' : 'Save Offer')}
                </Button>
            </Card>
        </Form>
    );
};

export default CreateOffer;