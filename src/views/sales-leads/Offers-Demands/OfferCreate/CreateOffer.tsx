import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
  getAllProductAction,
  getMembersAction,
  getProductsAction,
  getProductSpecificationsAction,
  getUsersAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- MODIFICATION: New nested Zod Schema structure ---
const priceListItemSchema = z.object({
  color: z.string(),
  qty: z.number().optional(),
  price: z.number().optional(),
});

const productDataSchema = z.object({
  product_id: z.number({ required_error: "Product is required." }).nullable(), // Allow null for initial state
  seller_ids: z.array(z.number()).min(1, "At least one seller is required."),
  buyer_ids: z.array(z.number()).min(1, "At least one buyer is required."),
  status: z.enum(["active", "non-active"]).default("active"),
  spec_id: z.number().nullable().default(null),
  items: z.array(priceListItemSchema).default([]),
});

const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  assign_user: z.number({ required_error: "Assigned User is required."}).nullable(),
  product_data: z.array(productDataSchema).min(1, "Add at least one product group."),
  groupA: z.string().optional().nullable(),
  groupB: z.string().optional().nullable(),
});

type OfferFormData = z.infer<typeof offerFormSchema>;
type OptionType = { value: number | string; label: string };

const CreateOffer = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // No more local state for price list - RHF handles everything
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getUsersAction());
    dispatch(getAllProductAction());
    dispatch(getMembersAction());
    dispatch(getProductsAction());
    dispatch(getProductSpecificationsAction());
  }, [dispatch]);

  const {
    usersData = [],
    productsMasterData = [],
    memberData = [],
    ProductsData = [],
    ProductSpecificationsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  // Memoized options for select dropdowns
  const userOptions: OptionType[] = useMemo(() => Array.isArray(usersData) ? usersData.map((u: any) => ({ value: u.id, label: u.name })) : [], [usersData]);
  const productOptions: OptionType[] = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: any) => ({ value: p.id, label: p.name })) : [], [productsMasterData]);
  const memberOptions: OptionType[] = useMemo(() => Array.isArray(memberData) ? memberData.map((m: any) => ({ value: m.id, label: m.name })) : [], [memberData]);
  const statusOptions: OptionType[] = [{ value: "active", label: "Active" }, { value: "non-active", label: "Non-Active" }];
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
    // --- MODIFICATION: Default values match the new nested schema
    defaultValues: {
      name: "",
      assign_user: null,
      product_data: [
        { product_id: null, seller_ids: [], buyer_ids: [], status: 'active', spec_id: null, items: [] }
      ],
      groupA: "",
      groupB: "",
    },
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: "product_data" });
  
  const watchedProductGroups = watch("product_data");

  // --- MODIFICATION: Logic to populate a group's table when its product changes
  const handleProductChange = (groupIndex: number, productId: number | null) => {
    setValue(`product_data.${groupIndex}.product_id`, productId);
    
    if (!productId) {
      setValue(`product_data.${groupIndex}.items`, []); // Clear table if product is deselected
      return;
    }

    const productDetails = ProductsData.find((p: any) => parseInt(p.id) === productId);
    const colors = productDetails?.color?.split(',') || [];
    
    const newItems = colors
      .map((c: string) => c.trim())
      .filter(Boolean)
      .map((color: string) => ({ color })); // Default qty/price are handled by schema

    setValue(`product_data.${groupIndex}.items`, newItems, { shouldValidate: true });
  };

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalPrice = 0;
    watchedProductGroups.forEach(group => {
      group.items.forEach(item => {
        totalQty += item.qty || 0;
        totalPrice += (item.qty || 0) * (item.price || 0);
      });
    });
    return { totalQty, totalPrice };
  }, [watchedProductGroups]);


  // --- MODIFICATION: Reworked note generation to use the nested data structure
  const handleGenerateAndCopyNotes = () => {
    const relevantGroups = watchedProductGroups.filter(
        g => g.product_id && g.items.some(i => i.qty && i.qty > 0)
    );

    if (relevantGroups.length === 0) {
      toast.push(<Notification title="No Data" type="warning">Enter a quantity for at least one item.</Notification>);
      return;
    }

    let messageA = ""; // With prices
    let messageB = ""; // Without prices

    relevantGroups.forEach(group => {
        const productName = productOptions.find(p => p.value === group.product_id)?.label || "Unknown Product";
        const selectedSpec = productSpecOptions.find(s => s.value === group.spec_id);

        messageA += `Product: ${productName}\n`;
        messageB += `Product: ${productName}\n`;
        
        if (selectedSpec) {
          messageA += `Specification: ${selectedSpec.label}\n`;
          messageB += `Specification: ${selectedSpec.label}\n`;
        }
        messageA += `Status: ${group.status.toUpperCase()}\n\n`;
        messageB += `Status: ${group.status.toUpperCase()}\n\n`;
        
        group.items.forEach(item => {
            if (item.qty && item.qty > 0) {
                const price = item.price || 0;
                messageA += `  - Color: ${item.color}, Qty: ${item.qty}, Price: $${price.toFixed(2)}\n`;
                messageB += `  - Color: ${item.color}, Qty: ${item.qty}\n`;
            }
        });
        messageA += "--------------------------------\n\n";
        messageB += "--------------------------------\n\n";
    });

    messageA += `\nGrand Total Qty: ${totals.totalQty}\n`;
    messageA += `Grand Total Price: $${totals.totalPrice.toFixed(2)}`;
    
    messageB += `\nTotal Qty: ${totals.totalQty}`;

    setValue("groupA", messageA, { shouldDirty: true });
    setValue("groupB", messageB, { shouldDirty: true });
    toast.push(<Notification title="Success" type="info">Notes generated and copied below.</Notification>);
  };

  const onFormSubmit = useCallback(async (data: OfferFormData) => {
    setIsSubmitting(true);
    // Transform payload to only include complete groups
    const apiPayload = {
      name: data.name,
      groupA: data.groupA,
      groupB: data.groupB,
      assign_user: data.assign_user,
      product_data: data.product_data.filter(p => p.product_id), // RHF data is already in the right shape
    };

    try {
      // NOTE: Ensure your `addOfferAction` and backend API can handle the nested `product_data` structure.
      await dispatch(addOfferAction(apiPayload)).unwrap();
      toast.push(<Notification title="Offer Created" type="success">Offer "{data.name}" has been successfully created.</Notification>);
      reset();
      navigate("/sales-leads/offers-demands");
    } catch (error: any) {
      const errorMessage = error?.message || "Could not create offer. Please try again.";
      toast.push(<Notification title="Creation Failed" type="danger">{errorMessage}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, navigate, reset]);

  const handleCancel = () => {
    reset();
    navigate("/sales-leads/offers-demands");
  };

  const isLoading = masterLoadingStatus === "loading";

  return (
    // Set a key on the form to force re-render on reset, helping clear field array state
    <Form id="offerForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card className="mb-2">
        {isLoading && !productsMasterData.length ? (
          <div className="flex justify-center p-10"><Spinner size="lg" /></div>
        ) : (
          <>
            <h4 className="mb-6">Create Offer</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <FormItem label="Offer Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
                <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Q4 Gadget Offer" />} />
              </FormItem>
              <FormItem label="Assign To User" invalid={!!errors.assign_user} errorMessage={errors.assign_user?.message}>
                <Controller name="assign_user" control={control} render={({ field }) => <UiSelect placeholder="Select Employee" options={userOptions} value={userOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} />
              </FormItem>
            </div>
          </>
        )}
      </Card>
      
      {/* --- MODIFICATION: Loop to render each Product Group. The redundant button that appeared before each card has been removed for a cleaner look. --- */}
      {fields.map((field, index) => (
        <Card key={field.id} className="mb-2">
            <div className="flex justify-end mb-2">
              <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ product_id: null, seller_ids: [], buyer_ids: [], status: 'active', spec_id: null, items: [] })}>
                  Add Product Group
              </Button>
            </div>
            <div className="flex justify-between items-center mb-4">
                <h5 className="mb-0">Product Group #{index + 1}</h5>
                {fields.length > 1 && (
                  <Button shape="circle" size="sm" type="button" color="red-600" icon={<TbTrash />} onClick={() => remove(index)} />
                )}
            </div>
            
            {/* Top section for selectors */}
            <div className="p-4 border rounded-md dark:border-gray-600 grid lg:grid-cols-3 gap-4 items-start mb-6">
                <div>
                    <FormItem label="Product" invalid={!!errors.product_data?.[index]?.product_id} errorMessage={errors.product_data?.[index]?.product_id?.message}>
                        <Controller name={`product_data.${index}.product_id`} control={control} render={({ field: { value }}) => 
                            <UiSelect placeholder="Select Product..." options={productOptions} value={productOptions.find(opt => opt.value === value)} onChange={(option) => handleProductChange(index, option ? option.value as number : null)} isLoading={isLoading} />
                        } />
                    </FormItem>
                </div>
                <div>
                    <FormItem label="Sellers" invalid={!!errors.product_data?.[index]?.seller_ids} errorMessage={errors.product_data?.[index]?.seller_ids?.message}>
                        <Controller name={`product_data.${index}.seller_ids`} control={control} render={({ field: { onChange, value }}) => 
                            <UiSelect isMulti placeholder="Select Sellers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />
                        } />
                    </FormItem>
                </div>
                <div>
                    <FormItem label="Buyers" invalid={!!errors.product_data?.[index]?.buyer_ids} errorMessage={errors.product_data?.[index]?.buyer_ids?.message}>
                        <Controller name={`product_data.${index}.buyer_ids`} control={control} render={({ field: { onChange, value }}) => 
                            <UiSelect isMulti placeholder="Select Buyers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />
                        } />
                    </FormItem>
                </div>
            </div>

            {/* Table section, only shows if a product is selected */}
            {watchedProductGroups[index]?.product_id && (
                <>
                    <div className="grid lg:grid-cols-2 gap-4 mb-4">
                        <FormItem label="Status">
                            <Controller name={`product_data.${index}.status`} control={control} render={({ field }) => <Radio.Group value={field.value} onChange={field.onChange}>{statusOptions.map(option => <Radio key={option.value} value={option.value}>{option.label}</Radio>)}</Radio.Group>} />
                        </FormItem>
                        <FormItem label="Product Spec Options">
                            <Controller name={`product_data.${index}.spec_id`} control={control} render={({ field }) => <UiSelect placeholder="Select a Spec" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} />} />
                        </FormItem>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Price</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {watchedProductGroups[index].items.map((item, itemIndex) => (
                                <tr key={`${field.id}-item-${itemIndex}`}>
                                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.color}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">
                                      <Controller name={`product_data.${index}.items.${itemIndex}.qty`} control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0" />} />
                                    </td>
                                    <td className="px-2 py-1 whitespace-nowrap">
                                      <Controller name={`product_data.${index}.items.${itemIndex}.price`} control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" step="0.01" prefix="$" placeholder="0.00" />} />
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
                Generate & Copy Notes
            </Button>
            <div className="flex items-center gap-4">
                <Input readOnly value={totals.totalQty} prefix="Total Qty:" className="w-48" />
                <Input readOnly value={`$${totals.totalPrice.toFixed(2)}`} prefix="Total Price:" className="w-56" />
            </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-4">
        <Card>
          {/* MODIFICATION: Added margin-bottom to the heading for better spacing */}
          <h5 className="mb-4">Group A Notes</h5>
          <FormItem invalid={!!errors.groupA} errorMessage={errors.groupA?.message}>
            <Controller name="groupA" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate & Copy Notes' to populate..." rows={12} />} />
          </FormItem>
        </Card>
        <Card>
          {/* MODIFICATION: Added margin-bottom to the heading for better spacing */}
          <h5 className="mb-4">Group B Notes</h5>
          <FormItem invalid={!!errors.groupB} errorMessage={errors.groupB?.message}>
            <Controller name="groupB" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate & Copy Notes' to populate..." rows={12} />} />
          </FormItem>
        </Card>
      </div>

      <Card bodyClass="flex justify-end gap-2">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="offerForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : 'Save Offer'}
        </Button>
      </Card>
    </Form>
  );
};

export default CreateOffer;