// src/views/your-path/EditDemand.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect, Button } from "@/components/ui";
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
    getAllProductAction, // Import new action
    getMembersAction,   // Import new action
} from "@/reduxtool/master/middleware";
import { masterSelector } from '@/reduxtool/master/masterSlice';

// --- Type Definitions ---
export type ApiUserObject = {
    id: number;
    name: string;
};

// Updated to reflect a cleaner API response with arrays of numbers
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

// Updated Zod schema for multi-select dropdowns
const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(),
  productIds: z.array(z.number()).min(1, "At least one product is required."),
  buyers: z.array(z.number()).min(1, "At least one buyer is required."),
  groupA_notes: z.string().optional().nullable(), // For Buyer section
  sellers: z.array(z.number()).min(1, "At least one seller is required."),
  groupB_notes: z.string().optional().nullable(), // For Seller section
});

type DemandEditFormData = z.infer<typeof demandFormSchema>;
type OptionType = { value: number; label: string };

const EditDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: demandIdFromParams } = useParams<{ id: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <NavLink to="/sales-leads/offers-demands"><h6 className='font-semibold hover:text-primary-600'>Offers & Demands</h6></NavLink>
        <BiChevronRight size={22} />
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
                    value={userOptions.find((opt: OptionType) => opt.value === field.value)}
                    onChange={(option: OptionType | null) => field.onChange(option ? option.value : null)}
                    isClearable />
                )} />
            </FormItem>

            <FormItem label="Products" invalid={!!errors.productIds} errorMessage={errors.productIds?.message} className="md:col-span-2">
                <Controller name="productIds" control={control} render={({ field }) => (
                    <UiSelect isMulti placeholder="Select Products" options={productOptions}
                        value={productOptions.filter((opt: OptionType) => field.value?.includes(opt.value))}
                        onChange={(options: OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])}
                        isLoading={isLoading} />
                )} />
            </FormItem>

            {/* Buyer Column */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Buyer Section</h5>
                <div className="mt-4">
                  <FormItem label="Buyers" invalid={!!errors.buyers} errorMessage={errors.buyers?.message}>
                    <Controller name="buyers" control={control} render={({ field }) => (
                      <UiSelect isMulti placeholder="Select Buyers" options={memberOptions}
                        value={memberOptions.filter((opt: OptionType) => field.value?.includes(opt.value))}
                        onChange={(options: OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])}
                        isLoading={isLoading} />
                    )} />
                  </FormItem>
                </div>
              </Card>
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
            </div>

            {/* Seller Column */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Seller Section</h5>
                <div className="mt-4">
                  <FormItem label="Sellers" invalid={!!errors.sellers} errorMessage={errors.sellers?.message}>
                    <Controller name="sellers" control={control} render={({ field }) => (
                      <UiSelect isMulti placeholder="Select Sellers" options={memberOptions}
                        value={memberOptions.filter((opt: OptionType) => field.value?.includes(opt.value))}
                        onChange={(options: OptionType[]) => field.onChange(options ? options.map(opt => opt.value) : [])}
                        isLoading={isLoading} />
                    )} />
                  </FormItem>
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
          </div>
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