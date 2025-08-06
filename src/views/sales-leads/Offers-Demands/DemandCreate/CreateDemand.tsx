// src/views/your-path/business-entities/CreateDemand.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import { Button, DatePicker, Input, Select as UiSelect } from "@/components/ui";
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
  addDemandAction,
  editDemandAction,
  getAllProductAction,
  getDemandById,
  getMembersAction,
  getPaymentTermAction,
  getProductPriceAction,
  getProductsAction,
  getProductSpecificationsAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- Zod Schema Definitions ---
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
  location: z.string().nullable().optional(),
  paymentTermId: z.number().nullable().optional(),
  eta: z.any().nullable().optional(),
  dispatchStatus: z.string().nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  cartoonTypeId: z.string().nullable().optional(),
});

const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  product_data: z.array(productDataSchema).min(1, "Add at least one product group."),
  groupA: z.string().min(1, "Note is required."),
  groupB: z.string().min(1, "Note is required."),
});

// --- Type Definitions & Defaults ---
type DemandFormData = z.infer<typeof demandFormSchema>;
type OptionType<T = string | number> = { value: T; label: string };

const defaultProductGroup = {
    product_id: null, seller_ids: [], buyer_ids: [], product_status: 'active' as const, spec_id: null, items: [],
    location: null, paymentTermId: null, eta: null, dispatchStatus: null, deviceCondition: null, cartoonTypeId: null,
};

const CreateDemand = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const id = location.state?.originalApiItem?.id;
  const isEdit = !!id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        await Promise.all([
            dispatch(getAllProductAction()),
            dispatch(getMembersAction()),
            dispatch(getProductsAction()),
            dispatch(getProductSpecificationsAction()),
            dispatch(getPaymentTermAction()),
        ]);
        if (isEdit) {
            await dispatch(getDemandById(id));
        }
        setInitialDataLoaded(true);
    };
    fetchData();
  }, [dispatch, id, isEdit]);

  const {
    productsMasterData = [], memberData = [], ProductsData = [], ProductSpecificationsData = [], PaymentTermsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);
  
  const productOptions: OptionType[] = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: any) => ({ value: p.id, label: p.name })) : [], [productsMasterData]);
  const memberOptions: OptionType[] = useMemo(() => Array.isArray(memberData) ? memberData.map((m: any) => ({ value: m.id, label: `(${m.customer_code}) - ${m.name || 'N/A'}` })) : [], [memberData]);
  const statusOptions: OptionType[] = [{ value: "active", label: "Active" }, { value: "non-active", label: "Non-Active" }];
  const productSpecOptions: OptionType[] = useMemo(() => Array.isArray(ProductSpecificationsData) ? ProductSpecificationsData.map((spec: any) => ({ value: spec.id, label: spec.name })) : [], [ProductSpecificationsData]);
  const paymentTermsOption: OptionType<number>[] = useMemo(() => Array.isArray(PaymentTermsData) ? PaymentTermsData.map((p: any) => ({ value: p.id, label: p.term_name || 'Unnamed' })) : [], [PaymentTermsData]);
  const dispatchStatusOptions: OptionType[] = [ { value: "Pending", label: "Pending" }, { value: "Ready to Ship", label: "Ready to Ship" }, { value: "Shipped", label: "Shipped" }, { value: "Delivered", label: "Delivered" } ];
  const dummyCartoonTypes: OptionType[] = [{ value: "Master Cartoon", label: "Master Cartoon" }, { value: "Non Masster Cartoon", label: "Non Masster Cartoon" }];
  const deviceConditionOptions: OptionType[] = [{ value: "New", label: "New" }, { value: "Old", label: "Old" }];

  const {control, handleSubmit, reset, watch, setValue, getValues,  formState: { errors },} = useForm<DemandFormData>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: { name: "", product_data: [defaultProductGroup], groupA: "", groupB: "" },
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: "product_data" });
  const watchedProductGroups = watch("product_data");

  const handleProductChange = useCallback(async (groupIndex: number, productId: number | null) => {
    setValue(`product_data.${groupIndex}.product_id`, productId);
    if (!productId) { setValue(`product_data.${groupIndex}.items`, []); return; }

    const productDetails = ProductsData.find((p: any) => parseInt(p.id) === productId);
    const colors = productDetails?.color?.split(',').map((c: string) => c.trim()).filter(Boolean) || [];
    let productPrice: number | undefined;
    try {
      const result = await dispatch(getProductPriceAction(productId)).unwrap();
      if (result.status && result.sales_price) productPrice = parseFloat(result.sales_price);
    } catch (error) { console.error("Failed to fetch product price:", error); }

    const newItems = colors.length > 0
        ? colors.map(color => ({ color, qty: undefined, price: productPrice }))
        : [{ color: '', qty: undefined, price: productPrice }];
    setValue(`product_data.${groupIndex}.items`, newItems, { shouldValidate: true });
  }, [dispatch, setValue, ProductsData]);

  // --- Robust Pre-filling logic ---
  useEffect(() => {
    const prefillData = location.state;
    // Only run if we have prefill data, the master data is loaded, and it's not edit mode
    if (prefillData && prefillData.productId && initialDataLoaded && !isEdit) {
        const prefillForm = async () => {
            // Set simple values
            setValue('name', `Demand for ${prefillData.product_name || 'Product'}`);
            if (prefillData.buyerId) {
                setValue('product_data.0.buyer_ids', [Number(prefillData.buyerId)]);
            }
            setValue('product_data.0.spec_id', prefillData.product_spec_id || null);
            setValue('product_data.0.product_status', prefillData.product_status?.toLowerCase() === 'non-active' ? 'non-active' : 'active');

            // Set product and await item generation
            await handleProductChange(0, Number(prefillData.productId));

            // Now that items are set, update the specific item's qty and price
            const currentItems = getValues('product_data.0.items');
            if (currentItems && currentItems.length > 0) {
                const itemIndex = currentItems.findIndex(item => item.color.toLowerCase() === (prefillData.color?.toLowerCase() || ''));
                const targetIndex = itemIndex !== -1 ? itemIndex : 0; // Default to first item if color doesn't match
                
                if (prefillData.qty) {
                    setValue(`product_data.0.items.${targetIndex}.qty`, Number(prefillData.qty));
                }
                if (prefillData.price) {
                    setValue(`product_data.0.items.${targetIndex}.price`, Number(prefillData.price));
                }
            }
        };
        prefillForm();
    }
  }, [location.state, initialDataLoaded, isEdit, setValue, getValues, handleProductChange]);

  useEffect(() => {
    const demandDataFromState = location.state?.originalApiItem;
    if (isEdit && demandDataFromState && initialDataLoaded) {
        const reconstructedProductData = (demandDataFromState.demand_products || []).map((productInfo: any) => ({
            ...defaultProductGroup,
            product_id: productInfo.product_id,
            seller_ids: productInfo.seller_ids || [],
            buyer_ids: productInfo.buyer_ids || [],
            product_status: productInfo.product_status?.toLowerCase() === 'non-active' ? 'non-active' : 'active',
            spec_id: productInfo.product_spec || null,
            items: productInfo.items || [], 
        }));
        reset({
            name: demandDataFromState.name || "",
            groupA: demandDataFromState.groupA || "",
            groupB: demandDataFromState.groupB || "",
            product_data: reconstructedProductData.length > 0 ? reconstructedProductData : [defaultProductGroup],
        });
    }
  }, [isEdit, location.state, reset, initialDataLoaded]);

  const handleGenerateAndCopyNotes = () => {
    const relevantGroups = watchedProductGroups.filter(g => g.product_id && g.items.some(i => i.qty && i.qty > 0));
    let messageA = "", messageB = "";
    relevantGroups.forEach(group => {
        const productName = productOptions.find(p => p.value === group.product_id)?.label || "Unknown Product";
        const productStatus = group.product_status === 'active' ? 'Active' : 'Non-Active';
        const itemsWithQty = group.items.filter(item => item.qty && item.qty > 0);
        const specLabel = productSpecOptions.find(s => s.value === group.spec_id)?.label;
        const eta = group.eta ? dayjs(group.eta).format("DD-MMM-YYYY") : null;
        
        let baseNote = `WTB\n${productName}\n`;
        let noteA_Items = '', noteB_Items = '';
        itemsWithQty.forEach(item => {
            let line = `${item.qty}${item.color ? ` ${item.color}`: ''}`;
            noteA_Items += line + '\n';
            if (item.price !== undefined) line += ` @$${item.price.toFixed(2)}`;
            noteB_Items += line + '\n';
        });
        
        let additionalInfo = '';
        if (specLabel) additionalInfo += `${specLabel}\n`;
        additionalInfo += `Status: ${productStatus}\n`;
        if (group.deviceCondition) additionalInfo += `Condition: ${group.deviceCondition}\n`;
        if (group.cartoonTypeId) additionalInfo += `Cartoon: ${group.cartoonTypeId}\n`;
        if (group.location) additionalInfo += `Location: ${group.location}\n`;
        if (group.paymentTermId) additionalInfo += `Payment: ${paymentTermsOption.find(o => o.value === group.paymentTermId)?.label}\n`;
        if (group.dispatchStatus) additionalInfo += `Dispatch: ${group.dispatchStatus}\n`;
        if (eta) additionalInfo += `ETA: ${eta}\n`;

        messageA += `${baseNote}${noteA_Items}${additionalInfo}\n`;
        messageB += `${baseNote}${noteB_Items}${additionalInfo}\n`;
    });
    setValue("groupA", messageA.trim(), { shouldDirty: true });
    setValue("groupB", messageB.trim(), { shouldDirty: true });
    toast.push(<Notification title="Success" type="info">Notes generated and populated below.</Notification>);
  };

  const onFormSubmit = useCallback(async (data: DemandFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      id: isEdit ? id : undefined,
      name: data.name,
      groupA: data.groupA,
      groupB: data.groupB,
      product_data: data.product_data.filter(p => p.product_id).map(group => {
          const { spec_id, location, paymentTermId, eta, dispatchStatus, deviceCondition, cartoonTypeId, ...restOfGroup } = group;
          return { ...restOfGroup, product_spec: spec_id, items: group.items.filter(item => item.qty && item.qty > 0) }
      }),
    };
    try {
      const action = isEdit ? editDemandAction(apiPayload) : addDemandAction(apiPayload);
      await dispatch(action).unwrap();
      const actionType = isEdit ? 'Updated' : 'Created';
      toast.push(<Notification title={`Demand ${actionType}`} type="success">Demand has been successfully {actionType.toLowerCase()}.</Notification>);
      navigate("/sales-leads/offers-demands");
    } catch (error: any) {
      toast.push(<Notification title="Save Failed" type="danger">{error.message || "An error occurred."}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, navigate, isEdit, id]);

  const handleCancel = () => navigate("/sales-leads/offers-demands");
  const isLoading = masterLoadingStatus === "loading" && !initialDataLoaded;

  return (
    <Form id="demandForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
       <Card>
        {isLoading ? ( <div className="flex justify-center p-10"><Spinner size="lg" /></div> ) : (
          <div className="p-4">
            <h4 className="mb-6">{isEdit ? 'Edit Demand' : 'Create Demand'}</h4>
            <FormItem label="Demand Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
                <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Q4 Gadget Demand" />} />
            </FormItem>
          </div>
        )}
      </Card>
      
      {fields.map((field, index) => (
        <Card key={field.id} bodyClass="p-4">
            <div className="flex justify-end mb-2">
              <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append(defaultProductGroup)}>Add Product Group</Button>
            </div>
            <div className="flex justify-between items-center mb-4">
                <h5 className="mb-0">Product Group #{index + 1}</h5>
                {fields.length > 1 && ( <Button shape="circle" size="sm" type="button" color="red-600" icon={<TbTrash />} onClick={() => remove(index)} /> )}
            </div>

            <div className="p-4 border rounded-md dark:border-gray-600 grid lg:grid-cols-3 gap-4 items-start mb-6">
                <FormItem label="Product" invalid={!!errors.product_data?.[index]?.product_id} errorMessage={errors.product_data?.[index]?.product_id?.message}>
                    <Controller name={`product_data.${index}.product_id`} control={control} render={({ field: { value }}) =>  <UiSelect placeholder="Select Product..." options={productOptions} value={productOptions.find(opt => opt.value === value)} onChange={(option) => handleProductChange(index, option ? option.value as number : null)} isLoading={isLoading} /> } />
                </FormItem>
                <FormItem label="Sellers">
                    <Controller name={`product_data.${index}.seller_ids`} control={control} render={({ field: { onChange, value }}) =>  <UiSelect isMulti placeholder="Select Sellers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} /> } />
                </FormItem>
                <FormItem label="Buyers">
                    <Controller name={`product_data.${index}.buyer_ids`} control={control} render={({ field: { onChange, value }}) =>  <UiSelect isMulti placeholder="Select Buyers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} /> } />
                </FormItem>
            </div>

            {watchedProductGroups[index]?.product_id && (
                <>
                    <div className="grid lg:grid-cols-2 gap-4 mb-4">
                        <FormItem label="Product Status">
                            <Controller name={`product_data.${index}.product_status`} control={control} render={({ field }) => <UiSelect options={statusOptions} value={statusOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} />} />
                        </FormItem>
                        <FormItem label="Product Spec">
                            <Controller name={`product_data.${index}.spec_id`} control={control} render={({ field }) => <UiSelect placeholder="Select a Spec" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} />
                        </FormItem>
                    </div>

                    <h6 className="font-semibold text-sm mb-2 mt-6">Additional Details (for Note Generation)</h6>
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-md dark:border-gray-600">
                        <FormItem label="Location"><Controller name={`product_data.${index}.location`} control={control} render={({ field }) => <Input {...field} value={field.value || ''} placeholder="e.g., Warehouse A" />} /></FormItem>
                        <FormItem label="Payment Term"><Controller name={`product_data.${index}.paymentTermId`} control={control} render={({ field }) => <UiSelect placeholder="Select Term..." options={paymentTermsOption} value={paymentTermsOption.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isLoading={isLoading} isClearable />} /></FormItem>
                        <FormItem label="ETA"><Controller name={`product_data.${index}.eta`} control={control} render={({ field }) => <DatePicker {...field} value={field.value} onChange={date => field.onChange(date)} inputFormat="YYYY-MM-DD" placeholder="Select ETA date" />} /></FormItem>
                        <FormItem label="Dispatch Status"><Controller name={`product_data.${index}.dispatchStatus`} control={control} render={({ field }) => <UiSelect placeholder="Select Status..." options={dispatchStatusOptions} value={dispatchStatusOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} /></FormItem>
                        <FormItem label="Device Condition"><Controller name={`product_data.${index}.deviceCondition`} control={control} render={({ field }) => <UiSelect placeholder="Select Condition..." options={deviceConditionOptions} value={deviceConditionOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} /></FormItem>
                        <FormItem label="Cartoon Type"><Controller name={`product_data.${index}.cartoonTypeId`} control={control} render={({ field }) => <UiSelect placeholder="Select Type..." options={dummyCartoonTypes} value={dummyCartoonTypes.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} /></FormItem>
                    </div>

                    <div className="overflow-x-auto mt-6">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">Price</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Qty</th></tr></thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {watchedProductGroups[index].items.map((item, itemIndex) => (
                                <tr key={`${field.id}-item-${itemIndex}`}>
                                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.color || '-'}</td>
                                    <td className="px-2 py-1 whitespace-nowrap"><Controller name={`product_data.${index}.items.${itemIndex}.price`} control={control} render={({ field }) => ( <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0.00" /> )} /></td>
                                    <td className="px-2 py-1 whitespace-nowrap"><Controller name={`product_data.${index}.items.${itemIndex}.qty`} control={control} render={({ field }) => ( <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0" /> )} /></td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Card>
      ))}

      <Card bodyClass="p-4">
        <Button type="button" variant="outline" icon={<TbFileText />} onClick={handleGenerateAndCopyNotes}>Generate Notes</Button>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card bodyClass="p-4"><h5 className="mb-4">Group A Notes</h5><FormItem invalid={!!errors.groupA} errorMessage={errors.groupA?.message}><Controller name="groupA" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate Notes' to populate..." rows={12} />} /></FormItem></Card>
        <Card bodyClass="p-4"><h5 className="mb-4">Group B Notes</h5><FormItem invalid={!!errors.groupB} errorMessage={errors.groupB?.message}><Controller name="groupB" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate Notes' to populate..." rows={12} />} /></FormItem></Card>
      </div>

      <Card bodyClass="flex justify-end gap-2 p-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="demandForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoading}>{isSubmitting ? "Saving..." : (isEdit ? 'Update Demand' : 'Save Demand')}</Button>
      </Card>
    </Form>
  );
};

export default CreateDemand;