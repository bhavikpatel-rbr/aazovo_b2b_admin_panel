import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

// UI Components
import { Button, Input, Radio, Select as UiSelect } from "@/components/ui";
import Card from "@/components/ui/Card";
import { Form, FormItem } from "@/components/ui/Form";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import toast from "@/components/ui/toast";
import Container from "@/components/shared/Container";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { TbFileText, TbPlus, TbTrash } from "react-icons/tb";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  editDemandAction,
  getAllProductAction,
  getDemandById,
  getMembersAction,
  getProductsAction,
  getProductSpecificationsAction,
  getUsersAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- New nested Zod Schema structure (same as Create/Offer) ---
const priceListItemSchema = z.object({
  color: z.string(),
  qty: z.number().optional(),
  price: z.number().optional(),
});

const productDataSchema = z.object({
  product_id: z.number({ required_error: "Product is required." }).nullable(),
  seller_ids: z.array(z.number()).min(1, "At least one seller is required."),
  buyer_ids: z.array(z.number()).min(1, "At least one buyer is required."),
  status: z.enum(["active", "non-active"]).default("active"),
  spec_id: z.number().nullable().default(null),
  items: z.array(priceListItemSchema).default([]),
});

const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assign_user: z.number({ required_error: "Assigned User is required." }).nullable(),
  product_data: z.array(productDataSchema).min(1, "Add at least one product group."),
  groupA: z.string().min(1, "Note is required."),
  groupB: z.string().min(1, "Note is required."),
});

type DemandFormData = z.infer<typeof demandFormSchema>;
type OptionType = { value: number | string; label: string };

// Helper to parse stringified JSON from the old API structure
const parseJsonArray = (jsonString: string | null | undefined): number[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => !isNaN(n)) : [];
  } catch (e) {
    return [];
  }
};

const EditDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>(); // Use useParams for route params

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch all necessary master data
    dispatch(getUsersAction());
    dispatch(getAllProductAction());
    dispatch(getMembersAction());
    dispatch(getProductsAction());
    dispatch(getProductSpecificationsAction());

    // Fetch the specific demand to edit
    if (id) {
      dispatch(getDemandById(id));
    } else {
      toast.push(<Notification title="Error" type="danger">Demand ID is missing.</Notification>);
      navigate("/sales-leads/offers-demands");
    }
  }, [dispatch, id, navigate]);

  const {
    usersData = [],
    productsMasterData = [],
    memberData = [],
    ProductsData = [],
    ProductSpecificationsData = [],
    currentDemand: demandData,
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
    formState: { errors, isDirty },
  } = useForm<DemandFormData>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: "",
      assign_user: null,
      product_data: [], // Start empty, will be populated by useEffect
      groupA: "",
      groupB: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "product_data" });

  const watchedProductGroups = watch("product_data");

  // --- Populate form when editing data is loaded ---
  useEffect(() => {
    if (demandData && ProductsData.length) {
      const sellerIds = parseJsonArray(demandData.seller_section);
      const buyerIds = parseJsonArray(demandData.buyer_section);

      const itemsByProduct = (demandData.price_list_details?.items || []).reduce((acc: any, item: any) => {
        const productId = parseInt(item.product_id);
        if (!acc[productId]) acc[productId] = [];
        acc[productId].push({ color: item.color, qty: item.qty, price: item.price });
        return acc;
      }, {});

      const reconstructedProductData = Object.keys(itemsByProduct).length > 0
        ? Object.keys(itemsByProduct).map(productIdStr => {
          const productId = parseInt(productIdStr);
          return {
            product_id: productId,
            seller_ids: sellerIds,
            buyer_ids: buyerIds,
            status: demandData.price_list_details?.status || 'active',
            spec_id: demandData.price_list_details?.spec_id || null,
            items: itemsByProduct[productId],
          };
        })
        : [{ product_id: null, seller_ids: [], buyer_ids: [], status: 'active', spec_id: null, items: [] }];

      reset({
        name: demandData.name || "",
        assign_user: demandData.assign_user ? Number(demandData.assign_user) : null,
        groupA: demandData.groupA || "",
        groupB: demandData.groupB || "",
        product_data: reconstructedProductData,
      });
    }
  }, [demandData, ProductsData, reset]);

  const handleProductChange = (groupIndex: number, productId: number | null) => {
    setValue(`product_data.${groupIndex}.product_id`, productId);

    if (!productId) {
      setValue(`product_data.${groupIndex}.items`, []);
      return;
    }

    const productDetails = ProductsData.find((p: any) => parseInt(p.id) === productId);
    const colors = productDetails?.color?.split(',') || [];

    const newItems = colors.map((c: string) => c.trim()).filter(Boolean).map((color: string) => ({ color }));

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

  const handleGenerateAndCopyNotes = () => {
    // This function is identical to the one in CreateDemand and works perfectly here.
    const relevantGroups = watchedProductGroups.filter(g => g.product_id && g.items.some(i => i.qty && i.qty > 0));
    if (relevantGroups.length === 0) {
      toast.push(<Notification title="No Data" type="warning">Enter a quantity for at least one item.</Notification>);
      return;
    }
    let messageA = "", messageB = "";
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
          messageA += `  - Color: ${item.color}, Qty: ${item.qty}, Price: $${(item.price || 0).toFixed(2)}\n`;
          messageB += `  - Color: ${item.color}, Qty: ${item.qty}\n`;
        }
      });
      messageA += "--------------------------------\n\n";
      messageB += "--------------------------------\n\n";
    });
    messageA += `\nGrand Total Qty: ${totals.totalQty}\nGrand Total Price: $${totals.totalPrice.toFixed(2)}`;
    messageB += `\nTotal Qty: ${totals.totalQty}`;
    setValue("groupA", messageA, { shouldDirty: true });
    setValue("groupB", messageB, { shouldDirty: true });
    toast.push(<Notification title="Success" type="info">Notes generated and copied below.</Notification>);
  };

  const onFormSubmit = useCallback(async (data: DemandFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    const apiPayload = {
      id,
      name: data.name,
      groupA: data.groupA,
      groupB: data.groupB,
      assign_user: data.assign_user,
      product_data: data.product_data.filter(p => p.product_id).map(group => ({
        ...group,
        items: group.items.filter(item => item.qty && item.qty > 0)
      })),
    };

    try {
      await dispatch(editDemandAction(apiPayload)).unwrap();
      toast.push(<Notification title="Demand Updated" type="success">Demand "{data.name}" has been successfully updated.</Notification>);
      navigate("/sales-leads/offers-demands");
    } catch (error: any) {
      const errorMessage = error?.message || "Could not update demand. Please try again.";
      toast.push(<Notification title="Update Failed" type="danger">{errorMessage}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, navigate, id]);

  const handleCancel = () => {
    navigate("/sales-leads/offers-demands");
  };

  const isLoading = masterLoadingStatus === "loading" && !demandData;

  if (isLoading) {
    return <Container className="flex justify-center items-center h-full"><Spinner size={40} /><span className="ml-2">Loading Demand...</span></Container>;
  }

  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands"><h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Offers & Demands</h6></NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className='font-semibold text-primary'>Edit Demand (ID: {demandData?.generate_id || id})</h6>
      </div>
      <Form id="editDemandForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <Card>
          <h4 className="mb-6">Edit Demand</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <FormItem label="Demand Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Q4 Gadget Demand" />} />
            </FormItem>
            <FormItem label="Assign To User" invalid={!!errors.assign_user} errorMessage={errors.assign_user?.message}>
              <Controller name="assign_user" control={control} render={({ field }) => <UiSelect placeholder="Select Employee" options={userOptions} value={userOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option ? option.value : null)} isClearable />} />
            </FormItem>
          </div>
        </Card>

        {fields.map((field, index) => (
          <Card key={field.id}>
            <div className="flex justify-between items-center mb-4">
              <h5 className="mb-0">Product Group #{index + 1}</h5>
              <div className="flex items-center gap-2">
                {fields.length > 1 && <Button shape="circle" size="sm" type="button" color="red-600" icon={<TbTrash />} onClick={() => remove(index)} />}
                <Button size="xs" type="button" icon={<TbPlus />} onClick={() => append({ product_id: null, seller_ids: [], buyer_ids: [], status: 'active', spec_id: null, items: [] })}>Add Group</Button>
              </div>
            </div>
            <div className="p-4 border rounded-md dark:border-gray-600 grid lg:grid-cols-3 gap-4 items-start mb-6">
              <FormItem label="Product" invalid={!!errors.product_data?.[index]?.product_id} errorMessage={errors.product_data?.[index]?.product_id?.message}>
                <Controller name={`product_data.${index}.product_id`} control={control} render={({ field: { value } }) =>
                  <UiSelect placeholder="Select Product..." options={productOptions} value={productOptions.find(opt => opt.value === value)} onChange={(option) => handleProductChange(index, option ? option.value as number : null)} />
                } />
              </FormItem>
              <FormItem label="Sellers" invalid={!!errors.product_data?.[index]?.seller_ids} errorMessage={errors.product_data?.[index]?.seller_ids?.message}>
                <Controller name={`product_data.${index}.seller_ids`} control={control} render={({ field: { onChange, value } }) =>
                  <UiSelect isMulti placeholder="Select Sellers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} />
                } />
              </FormItem>
              <FormItem label="Buyers" invalid={!!errors.product_data?.[index]?.buyer_ids} errorMessage={errors.product_data?.[index]?.buyer_ids?.message}>
                <Controller name={`product_data.${index}.buyer_ids`} control={control} render={({ field: { onChange, value } }) =>
                  <UiSelect isMulti placeholder="Select Buyers..." options={memberOptions} value={memberOptions.filter(opt => value?.includes(opt.value as number))} onChange={(options) => onChange(options ? options.map(opt => opt.value) : [])} />
                } />
              </FormItem>
            </div>

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
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase">Color</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase w-32">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase w-40">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {watchedProductGroups[index].items.map((item, itemIndex) => (
                        <tr key={`${field.id}-item-${itemIndex}`}>
                          <td className="px-4 py-3 font-semibold">{item.color}</td>
                          <td className="px-2 py-1"><Controller name={`product_data.${index}.items.${itemIndex}.qty`} control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" placeholder="0" />} /></td>
                          <td className="px-2 py-1"><Controller name={`product_data.${index}.items.${itemIndex}.price`} control={control} render={({ field }) => <Input {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} type="number" size="sm" step="0.01" prefix="$" placeholder="0.00" />} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        ))}

        <Card>
          <div className="flex justify-between items-center gap-4">
            <Button type="button" variant="outline" icon={<TbFileText />} onClick={handleGenerateAndCopyNotes}>Generate & Copy Notes</Button>
            <div className="flex items-center gap-4">
              <Input readOnly value={totals.totalQty} prefix="Total Qty:" className="w-48" />
              <Input readOnly value={`$${totals.totalPrice.toFixed(2)}`} prefix="Total Price:" className="w-56" />
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h5 className="mb-4">Group A Notes</h5>
            <FormItem invalid={!!errors.groupA} errorMessage={errors.groupA?.message}><Controller name="groupA" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate & Copy Notes' to populate..." rows={12} />} /></FormItem>
          </Card>
          <Card>
            <h5 className="mb-4">Group B Notes</h5>
            <FormItem invalid={!!errors.groupB} errorMessage={errors.groupB?.message}><Controller name="groupB" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Click 'Generate & Copy Notes' to populate..." rows={12} />} /></FormItem>
          </Card>
        </div>

        <Card bodyClass="flex justify-end gap-2">
          <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="editDemandForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default EditDemand;