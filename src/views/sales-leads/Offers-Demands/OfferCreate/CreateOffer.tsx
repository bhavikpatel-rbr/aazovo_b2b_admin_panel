import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { TbAlertTriangle, TbBrandWhatsapp, TbCopy, TbMail } from "react-icons/tb";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addOfferAction,
  editOfferAction, // <-- IMPORT THE UPDATE ACTION
  getAllProductAction,
  getMembersAction,
  getOfferById,
  getProductsAction,
  getProductSpecificationsAction,
  getUsersAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- Zod Schema for Create Offer Form ---
const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(),
  product_id: z.array(z.number()).min(1, "At least one product is required."),
  sellers: z.array(z.number()).min(1, "At least one seller is required."),
  groupA_notes: z.string().optional().nullable(),
  buyers: z.array(z.number()).min(1, "At least one buyer is required."),
  groupB_notes: z.string().optional().nullable(),
  productStatus: z.enum(["active", "non-active"]).default("active"),
  productSpec: z.number().optional().nullable(),
});

type OfferFormData = z.infer<typeof offerFormSchema>;
type OptionType = { value: number | string; label: string };

type PriceListItem = {
  id: string; // A unique ID like "productID-color"
  productId: number;
  productName: string;
  color: string;
  qty?: number;
  price?: number;
};

// --- Helper to parse stringified JSON from API ---
const parseJsonArray = (jsonString: string | null | undefined): number[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    // Ensure it's an array and convert items to numbers
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => !isNaN(n)) : [];
  } catch (e) {
    console.error("Failed to parse JSON string:", jsonString, e);
    return [];
  }
};


const CreateOffer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- LOGIC CHANGE: Safely get ID and determine if it's an edit operation ---
  const id = location.state?.originalApiItem?.id;
  const isEdit = !!id;

  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceListData, setPriceListData] = useState<PriceListItem[]>([]);

  // State to hold price items loaded for an existing offer
  const [loadedPriceItems, setLoadedPriceItems] = useState<any[] | null>(null);

  useEffect(() => {
    // Master data needed for both create and edit
    dispatch(getUsersAction());
    dispatch(getAllProductAction());
    dispatch(getMembersAction());
    dispatch(getProductsAction());
    dispatch(getProductSpecificationsAction());
    // Fetch specific offer data only when in edit mode
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
    currentOffer: offerData, // <-- Get the single offer data for editing
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);
  console.log(offerData, "isEdit");

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
    getValues,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      product_id: [],
      sellers: [],
      groupA_notes: "",
      buyers: [],
      groupB_notes: "",
      productStatus: "active",
      productSpec: null,
      modified: false, // This field is not in the schema but can be used for tracking changes
    },
  });

  // --- LOGIC CHANGE: Populate form when editing ---
  useEffect(() => {
    if (isEdit && offerData) {
      const defaultValues = {
        name: offerData.name || "",
        assignedUserId: offerData.assign_user ? Number(offerData.assign_user) : null,
        product_id: parseJsonArray(offerData.product_id),
        sellers: parseJsonArray(offerData.seller_section),
        buyers: parseJsonArray(offerData.buyer_section),
        groupA_notes: offerData.groupA || "",
        groupB_notes: offerData.groupB || "",
        // **ASSUMPTION**: The API response for a single offer includes 'price_list_details'
        productStatus: offerData.price_list_details?.status || "active",
        productSpec: offerData.price_list_details?.spec_id || null,
      };  

      reset(defaultValues);

      setValue("groupA_notes", defaultValues.groupA_notes, { shouldDirty: true });

      // Store loaded price items to be processed by the price list generation effect
      if (offerData.price_list_details?.items) {
        setLoadedPriceItems(offerData.price_list_details.items);
      }
    }
  }, [isEdit, offerData, reset]);

  const { product_id: watchedProductIds, productSpec: watchedSpec, productStatus: watchedStatus, modified: watchmodified } = watch();

  // --- LOGIC CHANGE: Enhanced effect to build price list for both new and edited offers ---
  useEffect(() => {
    if (!ProductsData?.data || !productOptions.length) return;

    const newPriceList: PriceListItem[] = [];
    const existingDataMap = new Map(priceListData.map(item => [item.id, item]));

    // If we have data from an edited offer, map it for easy lookup
    const loadedDataMap = new Map();
    if (loadedPriceItems) {
      loadedPriceItems.forEach(item => {
        const uniqueId = `${item.product_id}-${item.color}`;
        loadedDataMap.set(uniqueId, item);
      });
    }

    const selectedProductsData = ProductsData.data.filter((p: any) =>
      watchedProductIds.includes(parseInt(p.id))
    );

    selectedProductsData.forEach((product: any) => {
      const productName = productOptions.find(opt => opt.value === parseInt(product.id))?.label || "Unknown Product";
      const colors = product?.color?.split(',') || [];

      colors.forEach((color: string) => {
        const trimmedColor = color.trim();
        if (trimmedColor) {
          const uniqueId = `${product.id}-${trimmedColor}`;
          const existingItem = existingDataMap.get(uniqueId);
          const loadedItem = loadedDataMap.get(uniqueId);

          newPriceList.push({
            id: uniqueId,
            productId: parseInt(product.id),
            productName: productName,
            color: trimmedColor,
            // Prioritize loaded data, then existing (user-changed) data, then default to undefined
            qty: loadedItem?.qty ?? existingItem?.qty,
            price: loadedItem?.price ?? existingItem?.price,
          });
        }
      });
    });

    setPriceListData(newPriceList);

    // Clear loaded items after they've been used to prevent interference
    if (loadedPriceItems) {
      setLoadedPriceItems(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedProductIds, ProductsData, productOptions, loadedPriceItems]);


  const handlePriceListChange = (index: number, field: "qty" | "price", value: string, type = 'number') => {
    setValue("modified", true, { shouldDirty: true });
    // ... (This function remains unchanged)
    if (type === 'string') {
      const updatedList = [...priceListData];
      const currentItem = { ...updatedList[index] };
      if (value == "") return;
      // @ts-ignore
      currentItem[field] = value;
      updatedList[index] = currentItem;
      setPriceListData(updatedList);
    } else {
      const updatedList = [...priceListData];
      const currentItem = { ...updatedList[index] };
      const numericValue = value === "" ? undefined : parseFloat(value);
      if (value !== "" && isNaN(numericValue as number)) return;
      // @ts-ignore
      currentItem[field] = numericValue;
      updatedList[index] = currentItem;
      setPriceListData(updatedList);
    }
  };

  const totals = useMemo(() => {
    const totalQty = priceListData.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const totalPrice = priceListData.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
    return { totalQty, totalPrice };
  }, [priceListData]);


  // --- Auto-generate notes effect (remains unchanged, works for both modes) ---
  useEffect(() => {
    // This effect now correctly rebuilds notes based on the populated price list in both add/edit modes.
    if (watchmodified) {

      const selectedSpec = productSpecOptions.find(s => s.value === watchedSpec);
      const relevantItems = priceListData.filter(item => item.qty && Number(item.qty) > 0);

      if (relevantItems.length === 0) {
        setValue("groupA_notes", "");
        setValue("groupB_notes", "");
        return;
      }

      const itemsByProduct = relevantItems.reduce((acc, item) => {
        if (!acc[item.productName]) acc[item.productName] = [];
        acc[item.productName].push(item);
        return acc;
      }, {} as Record<string, PriceListItem[]>);

      let message = "";
      let message2 = "";
      if (selectedSpec) {
        message += `Specification: ${selectedSpec.label}\n\n`;
        message2 += `Specification: ${selectedSpec.label}\n\n`;
      }

      for (const productName in itemsByProduct) {
        message += `Product: ${productName}\n`;
        message2 += `Product: ${productName}\n`;
        itemsByProduct[productName].forEach(item => {
          const price = Number(item.price || 0);
          message += `  - Color: ${item.color}, Qty: ${item.qty}, Price: $${price.toFixed(2)}\n`;
          message2 += `  - Color: ${item.color}, Qty: ${item.qty}\n`;
        });
        message += "\n";
        message2 += "\n";
      }

      message += `Total Qty: ${totals.totalQty}\n`;
      message += `Total Price: $${totals.totalPrice.toFixed(2)}\n`;
      message += `Status: ${watchedStatus.toUpperCase()}`;
      message2 += `Total Qty: ${totals.totalQty}\n`;
      message2 += `Status: ${watchedStatus.toUpperCase()}`;

      setValue("groupA_notes", message, { shouldDirty: true });
      setValue("groupB_notes", message2, { shouldDirty: true });
    }

  }, [watchedSpec, watchedStatus, priceListData, totals, productSpecOptions, setValue]);


  // --- LOGIC CHANGE: Unified form submission for both Create and Update ---
  const onFormSubmit = useCallback(async (data: OfferFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      name: data.name,
      assign_user: data.assignedUserId,
      product_id: data.product_id,
      groupA: data.groupA_notes,
      groupB: data.groupB_notes,
      seller_section: data.sellers,
      buyer_section: data.buyers,
      price_list_details: {
        spec_id: data.productSpec,
        status: data.productStatus,
        items: priceListData
          .filter(item => item.qty && item.qty > 0)
          .map(({ productId, color, qty, price }) => ({
            product_id: productId,
            color,
            qty,
            price,
          })),
      }
    };

    try {
      const actionType = isEdit ? 'Updated' : 'Created';
      if (isEdit) {
        await dispatch(editOfferAction({ id, ...apiPayload })).unwrap();
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
  }, [dispatch, navigate, reset, priceListData, isEdit, id]);

  const handleCancel = () => {
    reset();
    navigate("/sales-leads/offers-demands");
  };

  const isLoading = masterLoadingStatus === "loading";

  return (
    <>
      <div className="flex gap-1 items-end mb-3">
        {/* Breadcrumb Navigation */}
      </div>

      <Form id="offerForm" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Card>
          {isLoading && !productsMasterData.length ? (
            <div className="flex justify-center p-10"><Spinner size="lg" /></div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                {/* --- DYNAMIC TITLE --- */}
                <h4>{isEdit ? 'Edit Offer' : 'Add Offer'}</h4>
              </div>

              {/* --- Initial Details (structure unchanged) --- */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormItem label="Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
                  <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Enter Offer Name" />} />
                </FormItem>
                <FormItem label="Assign User" invalid={!!errors.assignedUserId} errorMessage={errors.assignedUserId?.message}>
                  <Controller name="assignedUserId" control={control} render={({ field }) => <UiSelect placeholder="Select Employee" options={userOptions} value={userOptions.find(opt => opt.value === field.value)} onChange={(option: OptionType | null) => field.onChange(option ? option.value : null)} isClearable />} />
                </FormItem>
                <FormItem label="Products" invalid={!!errors.product_id} errorMessage={errors.product_id?.message} className="md:col-span-2" labelClass="font-semibold" description="Selected products will automatically populate the price list table below.">
                  <Controller name="product_id" control={control} render={({ field }) => <UiSelect isMulti placeholder="Select one or more products..." options={productOptions} value={productOptions.filter(opt => field.value?.includes(opt.value as number))} onChange={(options: readonly OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />} />
                </FormItem>
              </div>

              {/* --- Seller and Buyer Selection (structure unchanged) --- */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <h5>Seller Section</h5>
                  <div className="mt-4">
                    <FormItem label="Sellers" invalid={!!errors.sellers} errorMessage={errors.sellers?.message}>
                      <Controller name="sellers" control={control} render={({ field }) => <UiSelect isMulti placeholder="Select Sellers" options={memberOptions} value={memberOptions.filter(opt => field.value?.includes(opt.value as number))} onChange={(options: readonly OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />} />
                    </FormItem>
                  </div>
                </Card>
                <Card>
                  <h5>Buyer Section</h5>
                  <div className="mt-4">
                    <FormItem label="Buyers" invalid={!!errors.buyers} errorMessage={errors.buyers?.message}>
                      <Controller name="buyers" control={control} render={({ field }) => <UiSelect isMulti placeholder="Select Buyers" options={memberOptions} value={memberOptions.filter(opt => field.value?.includes(opt.value as number))} onChange={(options: readonly OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])} isLoading={isLoading} />} />
                    </FormItem>
                  </div>
                </Card>
              </div>

              {/* --- Price List Table View (structure unchanged) --- */}
              <Card className="mt-4">
                <div className="grid lg:grid-cols-2 gap-4 mb-4">
                  <FormItem label="Status">
                    <Controller name="productStatus" control={control} render={({ field }) => <Radio.Group value={field.value} onChange={field.onChange} className="flex items-center gap-x-6 h-full">{statusOptions.map(option => <Radio key={option.value} value={option.value}>{option.label}</Radio>)}</Radio.Group>} />
                  </FormItem>
                  <FormItem label="Product Spec Options" invalid={!!errors.productSpec} errorMessage={errors.productSpec?.message}>
                    <Controller name="productSpec" control={control} render={({ field }) => <UiSelect placeholder="Select a Spec" options={productSpecOptions} value={productSpecOptions.find(o => o.value === field.value)} onChange={(option: OptionType | null) => field.onChange(option ? option.value : null)} />} />
                  </FormItem>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {priceListData?.length > 0 ? (
                        priceListData.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Input type="text" size="sm" value={item.productName} readOnly className="bg-gray-100 dark:bg-gray-700" />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Input type="text" size="sm" value={item.color} onChange={(e) => handlePriceListChange(index, 'color', e.target.value, 'string')} className="bg-gray-100 dark:bg-gray-700" />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">
                              <Input type="number" size="sm" value={item.qty ?? ""} onChange={(e) => handlePriceListChange(index, 'qty', e.target.value)} placeholder="0" />
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">
                              <Input type="number" size="sm" step="0.01" value={item.price ?? ""} onChange={(e) => handlePriceListChange(index, 'price', e.target.value)} prefix="$" placeholder="0.00" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="text-center py-4">Select a product above to see its colors here.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end items-center gap-4 mt-4">
                  <Input readOnly value={totals.totalQty} prefix="Total Qty:" className="w-48" />
                  <Input readOnly value={`$${totals.totalPrice.toFixed(2)}`} prefix="Total Price:" className="w-56" />
                </div>
              </Card>

              {/* --- Group Notes (structure unchanged) --- */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <h5>Group A Notes</h5>
                  <div className="mt-4">
                    <FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}>
                      <Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Notes will be auto-generated after selecting products and entering quantities..." rows={12} />} />
                    </FormItem>
                    <div className="text-right mt-1">
                      <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues("groupA_notes") || ""); toast.push(<Notification title="Copied" type="info">Group A notes copied to clipboard.</Notification>); }} />
                      <Button type="button" shape="circle" icon={<TbMail />} onClick={() => toast.push(<Notification title="Action" type="info">Send Email action triggered.</Notification>)} />
                      <Button type="button" shape="circle" icon={<TbBrandWhatsapp />} onClick={() => toast.push(<Notification title="Action" type="info">Send WhatsApp action triggered.</Notification>)} />
                    </div> </div>
                </Card>
                <Card>
                  <h5>Group B Notes</h5>
                  <div className="mt-4">
                    <FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}>
                      <Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Notes will be auto-generated after selecting products and entering quantities..." rows={12} />} />
                    </FormItem>
                    <div className="text-right mt-1">
                  <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues("groupB_notes") || ""); toast.push(<Notification title="Copied" type="info">Group B notes copied to clipboard.</Notification>); }} />
                  <Button type="button" shape="circle" icon={<TbMail />} onClick={() => toast.push(<Notification title="Action" type="info">Send Email action triggered.</Notification>)} />
                  <Button type="button" shape="circle" icon={<TbBrandWhatsapp />} onClick={() => toast.push(<Notification title="Action" type="info">Send WhatsApp action triggered.</Notification>)} />
                </div>   </div>
                </Card>
              </div>
               <div className="p-4 mb-4 rounded-md bg-yellow-100 dark:bg-yellow-500/20 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
                          <TbAlertTriangle className="h-5 w-5" />
                          <div>
                            <span className="font-semibold">Note:</span> The UI for the product table data  is not saving to the backend.
                          </div>
                        </div>
            </>
          )}
        </Card>

        <Card bodyClass="flex justify-end gap-2" className="mt-4">
          <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
          {/* --- DYNAMIC BUTTON TEXT --- */}
          <Button type="submit" form="offerForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoading}>{isSubmitting ? "Saving..." : (isEdit ? 'Update Offer' : 'Save Offer')}</Button>
        </Card>
      </Form>
    </>
  );
};

export default CreateOffer;