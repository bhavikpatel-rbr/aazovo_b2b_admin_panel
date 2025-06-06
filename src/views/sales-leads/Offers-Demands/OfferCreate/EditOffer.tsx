// src/views/your-path/EditOffer.tsx

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
    getOfferById,
    editOfferAction,
    getUsersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from '@/reduxtool/master/masterSlice';

// --- Type Definitions ---
export type ApiUserObject = {
    id: number;
    name: string;
};

// **IMPORTANT**: Updated to reflect the new data structure with arrays of IDs
export type ApiFetchedOffer = {
  id: number;
  generate_id: string;
  name: string;
  seller_section: string[] | null; // Assuming API now returns an array of string IDs
  buyer_ids: string[] | null;  // Assuming API now returns an array of string IDs
  groupA: string | null;
  groupB: string | null;
  assign_user: ApiUserObject | null;
  created_by: ApiUserObject;
  created_at: string;
  updated_at: string;
};

// **IMPORTANT**: Updated Zod schema to handle arrays
const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(), // Use number for consistency
  sellers: z.array(z.object({
    sellerId: z.string().optional().nullable(),
  })).min(1, "At least one seller is required."),
  groupA_notes: z.string().optional().nullable(),
  buyers: z.array(z.object({
    buyerId: z.string().optional().nullable(),
  })).min(1, "At least one buyer is required."),
  groupB_notes: z.string().optional().nullable(),
});
type OfferEditFormData = z.infer<typeof offerFormSchema>;

type UserOptionType = { value: string; label: string; id: number; name: string };


const EditOffer = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: offerIdFromParams } = useParams<{ id: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentOffer,
    currentOfferStatus = 'idle',
    usersData = [],
  } = useSelector(masterSelector);

  const formMethods = useForm<OfferEditFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      sellers: [{ sellerId: "" }], // Default to one empty field
      groupA_notes: "",
      buyers: [{ buyerId: "" }], // Default to one empty field
      groupB_notes: "",
    }
  });
  const { control, handleSubmit, reset, getValues, formState: { errors, isDirty } } = formMethods;
  
  // --- Field Array Hooks ---
  const { fields: sellerFields, append: appendSeller, remove: removeSeller } = useFieldArray({
    control,
    name: "sellers",
  });

  const { fields: buyerFields, append: appendBuyer, remove: removeBuyer } = useFieldArray({
    control,
    name: "buyers",
  });

  const userOptions = useMemo(() => {
    if (!Array.isArray(usersData)) return [];
    return usersData.map((u: UserOptionType) => ({
      value: u.id,
      label: u.name,
    }));
  }, [usersData]);

  // --- Fetch Initial Data (Users and Offer) ---
  useEffect(() => {
    dispatch(getUsersAction());
    if (offerIdFromParams) {
      dispatch(getOfferById(offerIdFromParams));
    } else {
        toast.push(<Notification title="Error" type="danger">Offer ID is missing.</Notification>);
        navigate("/sales-leads/offers-demands");
    }
  }, [dispatch, offerIdFromParams, navigate]);

  useEffect(() => {
    if (currentOfferStatus === 'idle' && currentOffer) {
      // Parse seller_section and buyer_section from JSON strings
      let sellerIds: string[] = [];
      let buyerIds: string[] = [];

      try {
        sellerIds = currentOffer.seller_section ? JSON.parse(currentOffer.seller_section) : [];
      } catch (e) {
        console.warn("Failed to parse seller_section:", e);
      }

      try {
        buyerIds = currentOffer.buyer_section ? JSON.parse(currentOffer.buyer_section) : [];
      } catch (e) {
        console.warn("Failed to parse buyer_section:", e);
      }

      // Transform IDs into field array objects
      const sellersToSet = sellerIds.length > 0
        ? sellerIds.map((id: string) => ({ sellerId: id }))
        : [{ sellerId: "" }];

      const buyersToSet = buyerIds.length > 0
        ? buyerIds.map((id: string) => ({ buyerId: id }))
        : [{ buyerId: "" }];

      reset({
        name: currentOffer.name || "",
        assignedUserId: Number(currentOffer.assign_user || null), // Directly a string
        sellers: sellersToSet,
        buyers: buyersToSet,
        groupA_notes: currentOffer.groupA || "",
        groupB_notes: currentOffer.groupB || "",
      });
    } else if (currentOfferStatus === 'failed') {
      toast.push(
        <Notification title="Load Error" type="danger">
          Failed to load offer details.
        </Notification>
      );
    }
  }, [currentOffer, currentOfferStatus, reset]);


  const onFormSubmit = useCallback(
    async (formData: OfferEditFormData) => {
      if (!currentOffer?.id) {
          toast.push(<Notification title="Error" type="danger">Cannot submit: Offer ID is missing.</Notification>);
          return;
      }
      setIsSubmitting(true);

      const apiPayload = {
        id: currentOffer.id, // The numeric ID of the offer to update
        name: formData.name,
        assign_user: formData.assignedUserId,
        groupA: formData.groupA_notes,
        groupB: formData.groupB_notes,
        // Filter out empty IDs before sending
        seller_section: formData.sellers
            .map(seller => seller.sellerId)
            .filter(id => id && id.trim() !== ''),
        buyer_ids: formData.buyers
            .map(buyer => buyer.buyerId)
            .filter(id => id && id.trim() !== ''),
      };

      console.log("--- EditOffer API Payload for Update ---", apiPayload);

      try {
        await dispatch(editOfferAction(apiPayload)).unwrap();
        toast.push(<Notification title="Offer Updated" type="success">Offer "{formData.name}" updated.</Notification>);
        navigate("/sales-leads/offers-demands");
      } catch (error: any) {
        const errorMessage = error?.message || "Could not update offer.";
        toast.push(<Notification title="Update Failed" type="danger">{errorMessage}</Notification>);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, currentOffer]
  );

  const handleCancel = () => {
    navigate("/sales-leads/offers-demands");
  };

  const isLoadingPage = currentOfferStatus === 'loading';

  if (isLoadingPage) {
    return (
      <Container className="flex justify-center items-center h-full">
        <Spinner size={40} />
        <span className="ml-2">Loading Offer Details...</span>
      </Container>
    );
  }

  if (currentOfferStatus === 'succeeded' && !currentOffer) {
    return (
      <Container className="text-center p-8">
        <h4 className="text-lg font-semibold mb-2">Offer Not Found</h4>
        <p>The offer with ID "{offerIdFromParams}" could not be found.</p>
        <Button className="mt-4" variant="solid" onClick={() => navigate("/sales-leads/offers-demands")}>
            Back to Offers & Demands
        </Button>
      </Container>
    );
  }
  
  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands">
          <h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Offers & Demands</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className='font-semibold text-primary'>Edit Offer (ID: {currentOffer?.generate_id || offerIdFromParams})</h6>
      </div>
      <Form
        id="editOfferForm"
        onSubmit={handleSubmit(onFormSubmit)}
      >
        <Card>
          <h4 className="mb-6">Edit Offer Details</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <FormItem label="Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Enter Offer Name" />} />
            </FormItem>
            <FormItem label="Assign User" invalid={!!errors.assignedUserId} errorMessage={errors.assignedUserId?.message}>
              <Controller name="assignedUserId" control={control} render={({ field }) => (
                  <UiSelect placeholder="Select Employee" options={userOptions}
                    value={userOptions.find(opt => opt.value === field.value)}
                    onChange={option => field.onChange(option ? option.value : null)}
                    isClearable />
                )} />
            </FormItem>

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
                      {sellerFields.length > 1 && (
                        <Button type="button" shape="circle" size="sm" icon={<TbTrash size={18} />} className="self-end mb-1" onClick={() => removeSeller(index)} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={() => appendSeller({ sellerId: '' })}>
                    Add Another Seller
                  </Button>
                </div>
              </Card>
              <Card>
                <h5>Group A Notes</h5>
                <div className="mt-4">
                  <FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}>
                    <Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Seller Section" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                    <Button type="button" icon={<TbCopy />} onClick={() => navigator.clipboard.writeText(getValues('groupA_notes') || '')} />
                  </div>
                </div>
              </Card>
            </div>

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
                      {buyerFields.length > 1 && (
                        <Button type="button" shape="circle" size="sm" icon={<TbTrash size={18} />} className="self-end mb-1" onClick={() => removeBuyer(index)} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={() => appendBuyer({ buyerId: '' })}>
                    Add Another Buyer
                  </Button>
                </div>
              </Card>
              <Card>
                <h5>Group B Notes</h5>
                <div className="mt-4">
                  <FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}>
                    <Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Buyer Section" rows={3}/>} />
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
          <Button type="submit" form="editOfferForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default EditOffer;