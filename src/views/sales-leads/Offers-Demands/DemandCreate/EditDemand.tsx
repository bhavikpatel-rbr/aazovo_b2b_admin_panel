// src/views/your-path/EditDemand.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect, Button, Radio } from "@/components/ui"; // MODIFICATION: Imported Radio
import { Form, FormItem } from "@/components/ui/Form";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Spinner from "@/components/ui/Spinner";
import Container from "@/components/shared/Container";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { TbCopy } from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from 'react-redux';
import {
    getDemandById,
    editDemandAction,
    getUsersAction,
    getAllProductAction,
    getMembersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from '@/reduxtool/master/masterSlice';

// --- Type Definitions ---
export type ApiUserObject = {
    id: number;
    name: string;
};

export type ApiFetchedDemand = {
  id: number;
  generate_id: string;
  name: string;
  product_ids: number[] | null;
  buyer_section: number[] | null;
  seller_section: number[] | null;
  groupA: string | null;
  groupB: string | null;
  assign_user: ApiUserObject | null;
  created_by: ApiUserObject;
  created_at: string;
  updated_at: string;
};

// --- MODIFICATION: Updated Zod schema for new fields ---
const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(),
  productIds: z.array(z.number()).min(1, "At least one product is required."),
  buyers: z.array(z.number()).min(1, "At least one buyer is required."),
  groupA_notes: z.string().optional().nullable(),
  sellers: z.array(z.number()).min(1, "At least one seller is required."),
  groupB_notes: z.string().optional().nullable(),
  
  // Fields for the price list section controls
  priceListProduct: z.number().nullable(),
  productStatus: z.enum(["active", "non-active"]).default("active"),
  productSpec: z.string().optional().nullable(),
});

type DemandEditFormData = z.infer<typeof demandFormSchema>;
type OptionType = { value: number | string; label: string };

// MODIFICATION: Static data for the price list table
const staticPriceListData = [
  { id: 1, color: "Red", qty: 15, price: 120.5 },
  { id: 2, color: "Blue", qty: 25, price: 115.0 },
  { id: 3, color: "Green", qty: 10, price: 125.75 },
  { id: 4, color: "Black", qty: 50, price: 110.0 },
];

const EditDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: demandIdFromParams } = useParams<{ id: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- MODIFICATION: State for editable price list table ---
  const [priceListData, setPriceListData] = useState(staticPriceListData);

  const {
    currentDemand,
    currentDemandStatus = 'idle',
    usersData = [],
    productsMasterData = [],
    memberData = [],
    status: masterLoadingStatus = 'idle',
  } = useSelector(masterSelector);

  const { control, handleSubmit, reset, getValues, formState: { errors, isDirty } } = useForm<DemandEditFormData>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      productIds: [],
      buyers: [],
      groupA_notes: "",
      sellers: [],
      groupB_notes: "",
      priceListProduct: null,
      productStatus: "active",
      productSpec: null,
    }
  });

  // --- Memoized Options for Dropdowns ---
  const userOptions = useMemo(() => {
    if (!Array.isArray(usersData)) return [];
    return usersData.map((u: ApiUserObject) => ({ value: u.id, label: u.name }));
  }, [usersData]);

  const productOptions = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((p: any) => ({ value: p.id, label: p.name }));
  }, [productsMasterData]);

  const memberOptions = useMemo(() => {
    if (!Array.isArray(memberData)) return [];
    return memberData.map((m: any) => ({ value: m.id, label: m.name }));
  }, [memberData]);

  const statusOptions: OptionType[] = [
    { value: "active", label: "Active" },
    { value: "non-active", label: "Non-Active" },
  ];

  const specOptions: OptionType[] = [
    { value: "spec-a", label: "Specification A" },
    { value: "spec-b", label: "Specification B" },
    { value: "spec-c", label: "Specification C" },
  ];

  // --- MODIFICATION: Handler for updating price list state ---
  const handlePriceListChange = (index: number, field: 'qty' | 'price', value: string) => {
    const updatedList = [...priceListData];
    const numericValue = parseFloat(value) || 0; // Ensure value is a number
    updatedList[index] = { ...updatedList[index], [field]: numericValue };
    setPriceListData(updatedList);
  };

  // --- MODIFICATION: Totals calculation now depends on the editable state ---
  const totals = useMemo(() => {
    const totalQty = priceListData.reduce((sum, item) => sum + Number(item.qty), 0);
    const totalPrice = priceListData.reduce((sum, item) => sum + Number(item.qty) * Number(item.price), 0);
    return { totalQty, totalPrice };
  }, [priceListData]);


  // --- Fetch Initial Data ---
  useEffect(() => {
    dispatch(getUsersAction());
    dispatch(getAllProductAction());
    dispatch(getMembersAction());
    if (demandIdFromParams) {
      dispatch(getDemandById(demandIdFromParams));
    } else {
        toast.push(<Notification title="Error" type="danger">Demand ID is missing.</Notification>);
        navigate("/sales-leads/offers-demands");
    }
  }, [dispatch, demandIdFromParams, navigate]);

  // --- Populate Form When Data Arrives ---
  useEffect(() => {
    if (currentDemandStatus === 'succeeded' && currentDemand) {
      reset({
        name: currentDemand.name || "",
        assignedUserId: currentDemand.assign_user?.id || null,
        productIds: currentDemand.product_ids || [],
        buyers: currentDemand.buyer_section || [],
        sellers: currentDemand.seller_section || [],
        groupA_notes: currentDemand.groupA || "",
        groupB_notes: currentDemand.groupB || "",
      });
      // You might also populate priceListData here if it comes from the API
    } else if (currentDemandStatus === 'failed') {
      toast.push(<Notification title="Load Error" type="danger">Failed to load demand details.</Notification>);
    }
  }, [currentDemand, currentDemandStatus, reset]);

  const onFormSubmit = useCallback(
    async (formData: DemandEditFormData) => {
      if (!currentDemand?.id) {
          toast.push(<Notification title="Error" type="danger">Cannot submit: Demand ID is missing.</Notification>);
          return;
      }
      setIsSubmitting(true);

      const apiPayload = {
        id: currentDemand.id,
        name: formData.name,
        assign_user: formData.assignedUserId,
        product_ids: formData.productIds,
        buyer_section: formData.buyers,
        seller_section: formData.sellers,
        groupA: formData.groupA_notes,
        groupB: formData.groupB_notes,
      };

      try {
        await dispatch(editDemandAction(apiPayload)).unwrap();
        toast.push(<Notification title="Demand Updated" type="success">Demand "{formData.name}" updated.</Notification>);
        navigate("/sales-leads/offers-demands");
      } catch (error: any) {
        const errorMessage = error?.message || "Could not update demand.";
        toast.push(<Notification title="Update Failed" type="danger">{errorMessage}</Notification>);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, currentDemand]
  );

  const handleCancel = () => {
    navigate("/sales-leads/offers-demands");
  };

  const isLoading = currentDemandStatus === 'loading' || masterLoadingStatus === 'loading';

  if (isLoading && !currentDemand) {
    return (
      <Container className="flex justify-center items-center h-full"><Spinner size={40} /><span className="ml-2">Loading Demand...</span></Container>
    );
  }

  if (currentDemandStatus === 'succeeded' && !currentDemand) {
    return (
      <Container className="text-center p-8"><h4 className="font-semibold mb-2">Demand Not Found</h4><p>ID "{demandIdFromParams}" not found.</p><Button className="mt-4" onClick={() => navigate(-1)}>Back</Button></Container>
    );
  }

  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands"><h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Offers & Demands</h6></NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className='font-semibold text-primary'>Edit Demand (ID: {currentDemand?.generate_id || demandIdFromParams})</h6>
      </div>
      <Form id="editDemandForm" onSubmit={handleSubmit(onFormSubmit)}>
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h4>Edit Demand Details</h4>
            <Button type="button" variant="solid" onClick={() => toast.push(<Notification title="Info" type="info">Price List feature coming soon!</Notification>)}>
              View Price List
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <FormItem label="Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Enter Demand Name" />} />
            </FormItem>
            <FormItem label="Assign User" invalid={!!errors.assignedUserId} errorMessage={errors.assignedUserId?.message}>
              <Controller name="assignedUserId" control={control} render={({ field }) => (
                  <UiSelect placeholder="Select Employee" options={userOptions}
                    value={userOptions.find((opt) => opt.value === field.value)}
                    onChange={(option: OptionType | null) => field.onChange(option ? option.value : null)}
                    isClearable />
                )} />
            </FormItem>

            <FormItem label="Products" invalid={!!errors.productIds} errorMessage={errors.productIds?.message} className="md:col-span-2">
                <Controller name="productIds" control={control} render={({ field }) => (
                    <UiSelect isMulti placeholder="Select Products" options={productOptions}
                        value={productOptions.filter((opt) => field.value?.includes(opt.value as number))}
                        onChange={(options: readonly OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])}
                        isLoading={isLoading} />
                )} />
            </FormItem>
          </div>

          {/* --- MODIFICATION START: Reordered Layout --- */}
          {/* --- Buyer and Seller Selection --- */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <h5>Buyer Section</h5>
              <div className="mt-4">
                <FormItem label="Buyers" invalid={!!errors.buyers} errorMessage={errors.buyers?.message}>
                  <Controller name="buyers" control={control} render={({ field }) => (
                    <UiSelect isMulti placeholder="Select Buyers" options={memberOptions}
                      value={memberOptions.filter((opt) => field.value?.includes(opt.value as number))}
                      onChange={(options: readonly OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])}
                      isLoading={isLoading} />
                  )} />
                </FormItem>
              </div>
            </Card>
            <Card>
              <h5>Seller Section</h5>
              <div className="mt-4">
                <FormItem label="Sellers" invalid={!!errors.sellers} errorMessage={errors.sellers?.message}>
                  <Controller name="sellers" control={control} render={({ field }) => (
                    <UiSelect isMulti placeholder="Select Sellers" options={memberOptions}
                      value={memberOptions.filter((opt) => field.value?.includes(opt.value as number))}
                      onChange={(options: readonly OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])}
                      isLoading={isLoading} />
                  )} />
                </FormItem>
              </div>
            </Card>
          </div>
          
          {/* --- Price List Table View (Moved) --- */}
          <Card className="mt-4">
              {/* <h5 className="mb-4">Price List Details</h5> */}

              <div className="grid lg:grid-cols-3 gap-4 mb-4">
                  <FormItem label="Add Product">
                      <Controller name="priceListProduct" control={control} render={({ field }) => (
                          <UiSelect placeholder="Select a Product" options={productOptions}
                              value={productOptions.find((o) => o.value === field.value)}
                              onChange={(option: OptionType | null) => field.onChange(option ? option.value : null)} />
                      )} />
                  </FormItem>
                  <FormItem label="Status">
                      <Controller name="productStatus" control={control} render={({ field }) => (
                          <Radio.Group value={field.value} onChange={field.onChange} className="flex items-center gap-x-6 h-full">
                              {statusOptions.map((option) => (
                                  <Radio key={option.value} value={option.value}>{option.label}</Radio>
                              ))}
                          </Radio.Group>
                      )} />
                  </FormItem>
                  <FormItem label="Product Spec Options">
                      <Controller name="productSpec" control={control} render={({ field }) => (
                          <UiSelect placeholder="Select a Spec" options={specOptions}
                              value={specOptions.find((o) => o.value === field.value)}
                              onChange={(option: OptionType | null) => field.onChange(option ? option.value : null)} />
                      )} />
                  </FormItem>
              </div>

              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {priceListData.map((item, index) => (
                              <tr key={item.id}>
                                  <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">{item.color}</td>
                                  <td className="px-2 py-1 whitespace-nowrap">
                                      <Input type="number" size="sm" value={item.qty} onChange={(e) => handlePriceListChange(index, 'qty', e.target.value)} />
                                  </td>
                                  <td className="px-2 py-1 whitespace-nowrap">
                                      <Input type="number" size="sm" step="0.01" value={item.price} onChange={(e) => handlePriceListChange(index, 'price', e.target.value)} prefix="$" />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="flex justify-end items-center gap-4 mt-4">
                  <Input readOnly value={totals.totalQty} prefix="Total Qty:" className="w-48" />
                  <Input readOnly value={`$${totals.totalPrice.toFixed(2)}`} prefix="Total Price:" className="w-56" />
              </div>
          </Card>

          {/* --- Group Notes --- */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <h5>Group A Notes (Buyer Notes)</h5>
              <div className="mt-4">
                  <FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}>
                      <Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Buyer Section" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                      <Button type="button" icon={<TbCopy />} onClick={() => navigator.clipboard.writeText(getValues('groupA_notes') || '')} />
                  </div>
              </div>
            </Card>
            <Card>
              <h5>Group B Notes (Seller Notes)</h5>
              <div className="mt-4">
                  <FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}>
                      <Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Seller Section" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                      <Button type="button" icon={<TbCopy />} onClick={() => navigator.clipboard.writeText(getValues('groupB_notes') || '')} />
                  </div>
              </div>
            </Card>
          </div>
          {/* --- MODIFICATION END --- */}
        </Card>
        
        <Card bodyClass="flex justify-end gap-2" className='mt-4'>
          <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="editDemandForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !isDirty || isLoading}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default EditDemand;