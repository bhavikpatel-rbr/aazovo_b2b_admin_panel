// src/views/your-path/EditDemand.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form"; // Import useFieldArray
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect, Button } from "@/components/ui";
import { Form, FormItem } from "@/components/ui/Form";
import { BiChevronRight } from "react-icons/bi";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import { TbCopy, TbPlus, TbTrash } from "react-icons/tb";
import Spinner from "@/components/ui/Spinner";
import Container from "@/components/shared/Container";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from 'react-redux';
import {
    getDemandById,
    editDemandAction,
    getUsersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from '@/reduxtool/master/masterSlice';

// --- Type Definitions ---
export type ApiUserObject = {
    id: number;
    name: string;
};

// **IMPORTANT**: Updated to reflect new data structure with arrays of IDs
// Assumes API sends arrays or a JSON string that can be parsed into an array.
export type ApiFetchedDemand = {
  id: number;
  generate_id: string;
  name: string;
  buyer_section: string[] | string | null; // Can be array or JSON string
  seller_section: string[] | string | null; // Can be array or JSON string
  groupA: string | null;
  groupB: string | null;
  assign_user: ApiUserObject | null;
  created_by: ApiUserObject;
  created_at: string;
  updated_at: string;
};

// **IMPORTANT**: Updated Zod schema to handle arrays
const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(),
  buyers: z.array(z.object({
    buyerId: z.string().optional().nullable(),
  })).min(1, "At least one buyer is required."),
  groupA_notes: z.string().optional().nullable(), // For Buyer section
  sellers: z.array(z.object({
    sellerId: z.string().optional().nullable(),
  })).min(1, "At least one seller is required."),
  groupB_notes: z.string().optional().nullable(), // For Seller section
});
type DemandEditFormData = z.infer<typeof demandFormSchema>;
type UserOptionType = { value: string; label: string; id: number; name: string };

const EditDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: demandIdFromParams } = useParams<{ id: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentDemand,
    currentDemandStatus = 'idle',
    usersData = [],
  } = useSelector(masterSelector);

  const formMethods = useForm<DemandEditFormData>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      buyers: [{ buyerId: "" }], // Default to one empty field
      groupA_notes: "",
      sellers: [{ sellerId: "" }], // Default to one empty field
      groupB_notes: "",
    }
  });
  const { control, handleSubmit, reset, getValues, formState: { errors, isDirty } } = formMethods;
  
  // --- Field Array Hooks ---
  const { fields: buyerFields, append: appendBuyer, remove: removeBuyer } = useFieldArray({
    control, name: "buyers",
  });
  const { fields: sellerFields, append: appendSeller, remove: removeSeller } = useFieldArray({
    control, name: "sellers",
  });

  const userOptions = useMemo(() => {
    if (!Array.isArray(usersData)) return [];
    return usersData.map((u: UserOptionType) => ({
      value: u.id,
      label: u.name,
    }));
  }, [usersData]);

  // --- Fetch Initial Data ---
  useEffect(() => {
    dispatch(getUsersAction());
    if (demandIdFromParams) {
      dispatch(getDemandById(demandIdFromParams));
    } else {
        toast.push(<Notification title="Error" type="danger">Demand ID is missing.</Notification>);
        navigate("/sales-leads/offers-demands");
    }
  }, [dispatch, demandIdFromParams, navigate]);

  // --- Populate Form When Data Arrives ---
  useEffect(() => {
    if (currentDemandStatus === 'idle' && currentDemand) {
      // Helper to safely parse section data which might be an array or a JSON string
      const parseSectionData = (data: string[] | string | null): string[] => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (typeof data === 'string') {
              try { return JSON.parse(data); } catch (e) { return []; }
          }
          return [];
      }
      
      const buyerIds = parseSectionData(currentDemand.buyer_section);
      const sellerIds = parseSectionData(currentDemand.seller_section);

      const buyersToSet = buyerIds.length > 0 ? buyerIds.map(id => ({ buyerId: id })) : [{ buyerId: "" }];
      const sellersToSet = sellerIds.length > 0 ? sellerIds.map(id => ({ sellerId: id })) : [{ sellerId: "" }];

      reset({
        name: currentDemand.name || "",
        assignedUserId: currentDemand.assign_user ? currentDemand.assign_user.id : null,
        buyers: buyersToSet,
        sellers: sellersToSet,
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
        groupA: formData.groupA_notes,
        groupB: formData.groupB_notes,
        buyer_section: formData.buyers
            .map(buyer => buyer.buyerId)
            .filter(id => id && id.trim() !== ''),
        seller_section: formData.sellers
            .map(seller => seller.sellerId)
            .filter(id => id && id.trim() !== ''),
      };

      console.log("--- EditDemand API Payload for Update ---", apiPayload);

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

  const isLoadingPage = currentDemandStatus === 'loading';

  if (isLoadingPage) {
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
          <h4 className="mb-6">Edit Demand Details</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <FormItem label="Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Enter Demand Name" />} />
            </FormItem>
            <FormItem label="Assign User" invalid={!!errors.assignedUserId} errorMessage={errors.assignedUserId?.message}>
              <Controller name="assignedUserId" control={control} render={({ field }) => (
                  <UiSelect placeholder="Select Employee" options={userOptions}
                    value={userOptions.find(opt => opt.value === field.value)}
                    onChange={option => field.onChange(option ? option.value : null)}
                    isClearable />
                )} />
            </FormItem>

            {/* Buyer Column */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Buyer Section</h5>
                <div className="flex flex-col gap-4 mt-4">
                  {buyerFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormItem label={index === 0 ? "Buyer ID" : ""} className="w-full" invalid={!!errors.buyers?.[index]?.buyerId} errorMessage={errors.buyers?.[index]?.buyerId?.message}>
                        <Controller name={`buyers.${index}.buyerId`} control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Buyer ID" />} />
                      </FormItem>
                      {buyerFields.length > 1 && (<Button type="button" shape="circle" size="sm" icon={<TbTrash size={18} />} className="self-end mb-1" onClick={() => removeBuyer(index)} />)}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={() => appendBuyer({ buyerId: '' })}>Add Another Buyer</Button>
                </div>
              </Card>
              <Card>
                <h5>Group A Notes (Buyer Notes)</h5>
                <div className="mt-4"><FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}><Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Buyer Section" rows={3}/>} /></FormItem><div className="text-right mt-1"><Button type="button" icon={<TbCopy />} onClick={() => navigator.clipboard.writeText(getValues('groupA_notes') || '')} /></div></div>
              </Card>
            </div>

            {/* Seller Column */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Seller Section</h5>
                <div className="flex flex-col gap-4 mt-4">
                  {sellerFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormItem label={index === 0 ? "Seller ID" : ""} className="w-full" invalid={!!errors.sellers?.[index]?.sellerId} errorMessage={errors.sellers?.[index]?.sellerId?.message}>
                        <Controller name={`sellers.${index}.sellerId`} control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Seller ID" />} />
                      </FormItem>
                      {sellerFields.length > 1 && (<Button type="button" shape="circle" size="sm" icon={<TbTrash size={18} />} className="self-end mb-1" onClick={() => removeSeller(index)} />)}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={() => appendSeller({ sellerId: '' })}>Add Another Seller</Button>
                </div>
              </Card>
              <Card>
                <h5>Group B Notes (Seller Notes)</h5>
                <div className="mt-4"><FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}><Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Seller Section" rows={3}/>} /></FormItem><div className="text-right mt-1"><Button type="button" icon={<TbCopy />} onClick={() => navigator.clipboard.writeText(getValues('groupB_notes') || '')} /></div></div>
              </Card>
            </div>
          </div>
        </Card>
        
        <Card bodyClass="flex justify-end gap-2" className='mt-4'>
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