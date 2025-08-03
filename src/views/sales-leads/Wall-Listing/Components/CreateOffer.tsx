import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import { Button, Input, Radio, Select as UiSelect } from "@/components/ui";
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
  getProductPriceAction,
  getProductsAction,
  getProductSpecificationsAction,
  getUsersAction,
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
type OptionType = { value: number | string; label: string };

const CreateOffer = () => {
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
            dispatch(getUsersAction()),
            dispatch(getAllProductAction()),
            dispatch(getMembersAction()),
            dispatch(getProductsAction()),
            dispatch(getProductSpecificationsAction()),
        ]);
        if (isEdit) {
            await dispatch(getOfferById(id));
        }
        setInitialDataLoaded(true);
    };
    fetchData();
  }, [dispatch, id, isEdit]);

  const {
    usersData = [],
    productsMasterData = [],
    memberData = [],
    ProductsData = [],
    ProductSpecificationsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const userOptions: OptionType[] = useMemo(() => Array.isArray(usersData) ? usersData.map((u: any) => ({ value: u.id, label: `(${u.employee_id}) - ${u.name || 'N/A'}` })) : [], [usersData]);
  const productOptions: OptionType[] = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: any) => ({ value: p.id, label: p.name })) : [], [productsMasterData]);
  const memberOptions: OptionType[] = useMemo(() => Array.isArray(memberData) ? memberData.map((m: any) => ({ value: m.id, label:`(${m.customer_code}) - ${m.name || 'N/A'}` })) : [], [memberData]);
  const statusOptions: OptionType[] = [{ value: "active", label: "active" }, { value: "non-active", label: "non-active" }];
  const productSpecOptions: OptionType[] = useMemo(() => Array.isArray(ProductSpecificationsData) ? ProductSpecificationsData.map((spec: any) => ({ value: spec.id, label: spec.name })) : [], [ProductSpecificationsData]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: "",
      assign_user: null,
      product_data: [
        { product_id: null, seller_ids: [], buyer_ids: [], product_status: 'active', spec_id: null, items: [] }
      ],
      groupA: "",
      groupB: "",
    },
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: "product_data" });
  const watchedProductGroups = watch("product_data");
  const watchedItems = watch('product_data.0.items');

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
    const newItems = colors.length > 0 ? colors.map(color => ({ color, qty: undefined, price: productPrice })) : [{ color: '', qty: undefined, price: productPrice }];
    setValue(`product_data.${groupIndex}.items`, newItems, { shouldValidate: true });
  }, [dispatch, setValue, ProductsData]);

  useEffect(() => {
    const prefillData = location.state;
    if (prefillData && prefillData.productId && initialDataLoaded && !isEdit) {
        setValue('name', `Offer for ${prefillData.product_name || 'Product'}`);
        setValue('product_data.0.seller_ids', [Number(prefillData.supplierId)]);
        setValue('product_data.0.spec_id', prefillData.product_spec_id || null);
        setValue('product_data.0.product_status', prefillData.product_status?.toLowerCase() === 'non-active' ? 'non-active' : 'active');
        handleProductChange(0, Number(prefillData.productId));
    }
  }, [location.state, setValue, handleProductChange, initialDataLoaded, isEdit]);
  
  useEffect(() => {
    const prefillData = location.state;
    if (prefillData && watchedItems && watchedItems.length > 0) {
        const itemIndex = watchedItems.findIndex(item => item.color.toLowerCase() === (prefillData.color?.toLowerCase() || ''));
        if (itemIndex !== -1) {
            setValue(`product_data.0.items.${itemIndex}.qty`, Number(prefillData.qty) || undefined);
            setValue(`product_data.0.items.${itemIndex}.price`, Number(prefillData.price) || undefined);
        } else if (watchedItems.length > 0) { // If no color match, fill the first one
            setValue(`product_data.0.items.0.qty`, Number(prefillData.qty) || undefined);
            setValue(`product_data.0.items.0.price`, Number(prefillData.price) || undefined);
        }
    }
  }, [watchedItems, location.state, setValue]);

  useEffect(() => {
    const offerDataFromState = location.state?.originalApiItem;
    if (isEdit && offerDataFromState) {
        const groupAText = offerDataFromState.groupA || "";
        const items = [];
        const itemRegex = /-\s*Color:\s*(.+?),\s*Qty:\s*([\d.]+),\s*Price:\s*\$([\d.]+)/g;
        let match;
        while ((match = itemRegex.exec(groupAText)) !== null) {
            items.push({ color: match[1].trim(), qty: parseFloat(match[2]), price: parseFloat(match[3]), });
        }
        const reconstructedProductData = (offerDataFromState.offer_products || []).map((productInfo: any) => ({
            product_id: productInfo.product_id,
            seller_ids: productInfo.seller_ids || [],
            buyer_ids: productInfo.buyer_ids || [],
            product_status: productInfo.product_status?.toLowerCase() === 'non-active' ? 'non-active' : 'active',
            spec_id: productInfo.product_spec || null,
            items: items,
        }));
        reset({
            name: offerDataFromState.name || "",
            assign_user: offerDataFromState.assign_user ? Number(offerDataFromState.assign_user) : null,
            groupA: offerDataFromState.groupA || "",
            groupB: offerDataFromState.groupB || "",
            product_data: reconstructedProductData.length > 0 ? reconstructedProductData : [{ product_id: null, seller_ids: [], buyer_ids: [], product_status: 'active', spec_id: null, items: [] }],
        });
    }
  }, [isEdit, location.state, reset]);

  const handleGenerateAndCopyNotes = () => {
    const relevantGroups = watchedProductGroups.filter(g => g.product_id && g.items.some(i => i.qty && i.qty > 0));
    let messageA = "";
    let messageB = "";
    relevantGroups.forEach(group => {
        const productName = productOptions.find(p => p.value === group.product_id)?.label || "Unknown Product";
        const selectedSpec = productSpecOptions.find(s => s.value === group.spec_id);
        const specLabel = selectedSpec ? selectedSpec.label : '';
        const productStatus = group.product_status === 'active' ? 'active' : 'non-active';
        const itemsWithQty = group.items.filter(item => item.qty && item.qty > 0);
        if (itemsWithQty.length > 0) {
            let groupAMessage = `WTS\n${productName}\n`;
            let groupBMessage = `WTS\n${productName}\n`;
            itemsWithQty.forEach(item => {
                let lineA = `${item.qty}`;
                if (item.color) { lineA += ` ${item.color}`; }
                groupAMessage += lineA + '\n';
                let lineB = `${item.qty}`;
                if (item.color) { lineB += ` ${item.color}`; }
                if (item.price !== undefined) { lineB += ` @$${item.price.toFixed(2)}`; }
                groupBMessage += lineB + '\n';
            });
            if (specLabel) { groupAMessage += `${specLabel}\n`; groupBMessage += `${specLabel}\n`; }
            groupAMessage += `${productStatus}\n`;
            groupBMessage += `${productStatus}\n`;
            messageA += groupAMessage + '\n';
            messageB += groupBMessage + '\n';
        }
    });
    setValue("groupA", messageA.trim(), { shouldDirty: true });
    setValue("groupB", messageB.trim(), { shouldDirty: true });
    toast.push(<Notification title="Success" type="info">Notes generated and copied below.</Notification>);
  };

  const onFormSubmit = useCallback(async (data: OfferFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      id: isEdit ? id : undefined,
      name: data.name,
      groupA: data.groupA,
      groupB: data.groupB,
      assign_user: data.assign_user,
      product_data: data.product_data.filter(p => p.product_id).map(group => {
          const { spec_id, ...restOfGroup } = group;
          return { ...restOfGroup, product_spec: spec_id, items: group.items.filter(item => item.qty && item.qty > 0) }
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
  
  const isLoading = masterLoadingStatus === "loading" && !initialDataLoaded;

  return (
    <Form id="offerForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card className="mb-2">
        {isLoading ? ( <div className="flex justify-center p-10"><Spinner size="lg" /></div> ) : (
          <>
            <h4 className="mb-6">{isEdit ? 'Edit Offer' : 'Create Offer'}</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <FormItem label="Offer Name" invalid={!!errors.name} errorMessage={errors.name?.message}><Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Q4 Gadget Offer" />} /></FormItem>
              <FormItem label="Assign To User" invalid={!!errors.assign_user} errorMessage={errors.assign_user?.message}><Controller name="assign_user" control={control} render={({ field }) => <UiSelect placeholder="Select Employee" options={userOptions} value={userOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} /></FormItem>
            </div>
          </>
        )}
      </Card>
      
      {fields.map((field, index) => (
        <Card key={field.id} className="mb-2">
            <div className="flex justify-end mb-2">
              <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ product_id: null, seller_ids: [], buyer_ids: [], product_status: 'active', spec_id: null, items: [] })}>Add Product Group</Button>
            </div>
            <div className="flex justify-between items-center mb-4">
                <h5 className="mb-0">Product Group #{index + 1}</h5>
                {fields.length > 1 && ( <Button shape="circle" size="sm" type="button" color="red-600" icon={<TbTrash />} onClick={() => remove(index)} /> )}
            </div>
            <div className="p-4 border rounded-md dark:border-gray-600 grid lg:grid-cols-3 gap-4 items-start mb-6">
                <div>
                    <FormItem label="Product" invalid={!!errors.product_data?.[index]?.product_id} errorMessage={errors.product_data?.[index]?.product_id?.message}>
                        <Controller name={`product_data.${index}.product_id`} control={control} render={({ field: { value }}) =>  <UiSelect placeholder="Select Product..." options={productOptions} value={productOptions.find(opt => opt.value === value)} onChange={(option) => handleProductChange(index, option ? option.value as number : null)} isLoading={isLoading} /> } />
                    </FormItem>
                </div>
                <div>
                    <FormItem label="Sellers" invalid={!!errors.product_data?.[index]?.seller_ids} errorMessage={errors.product_data?.[index]?.seller_ids?.message}>
                        <Controller name={`product_data.${index}.seller_ids`} control={control} render={({ field: { onChange, value }}) =>  <UiSelect isMulti placeholder="Select Sellers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} /> } />
                    </FormItem>
                </div>
                <div>
                    <FormItem label="Buyers" invalid={!!errors.product_data?.[index]?.buyer_ids} errorMessage={errors.product_data?.[index]?.buyer_ids?.message}>
                        <Controller name={`product_data.${index}.buyer_ids`} control={control} render={({ field: { onChange, value }}) =>  <UiSelect isMulti placeholder="Select Buyers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} /> } />
                    </FormItem>
                </div>
            </div>
            {watchedProductGroups[index]?.product_id && (
                <>
                    <div className="grid lg:grid-cols-2 gap-4 mb-4">
                        <FormItem label="Product Status"><Controller name={`product_data.${index}.product_status`} control={control} render={({ field }) => <Radio.Group value={field.value} onChange={field.onChange}>{statusOptions.map(option => <Radio key={String(option.value)} value={option.value}>{option.label}</Radio>)}</Radio.Group>} /></FormItem>
                        <FormItem label="Product Spec Options"><Controller name={`product_data.${index}.spec_id`} control={control} render={({ field }) => <UiSelect placeholder="Select a Spec" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} />} /></FormItem>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Price</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Qty</th></tr></thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {watchedProductGroups[index].items.map((item, itemIndex) => (
                                <tr key={`${field.id}-item-${itemIndex}`}>
                                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.color || '-'}</td>
                                    <td className="px-2 py-1 whitespace-nowrap"><Controller name={`product_data.${index}.items.${itemIndex}.price`} control={control} render={({ field }) => ( <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0.00" step="0.01" /> )} /></td>
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
      <Card className="mb-2">
        <div className="flex justify-between items-center gap-4"><Button type="button" variant="outline" icon={<TbFileText />} onClick={handleGenerateAndCopyNotes}>Generate Notes</Button></div>
      </Card>
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <Card><h5 className="mb-4">Group A Notes</h5><FormItem invalid={!!errors.groupA} errorMessage={errors.groupA?.message}><Controller name="groupA" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate Notes' to populate..." rows={12} />} /></FormItem></Card>
        <Card><h5 className="mb-4">Group B Notes</h5><FormItem invalid={!!errors.groupB} errorMessage={errors.groupB?.message}><Controller name="groupB" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate Notes' to populate..." rows={12} />} /></FormItem></Card>
      </div>
      <Card bodyClass="flex justify-end gap-2">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="offerForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoading}>{isSubmitting ? "Saving..." : (isEdit ? 'Update Offer' : 'Save Offer')}</Button>
      </Card>
    </Form>
  );
};

export default CreateOffer;