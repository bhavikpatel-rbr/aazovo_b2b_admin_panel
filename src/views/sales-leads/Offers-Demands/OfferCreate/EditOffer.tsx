// src/views/your-path/EditOffer.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
    getOfferById,    // Action to fetch a single offer
    editOfferAction,       // Action to update an offer
    getUsersAction,        // Assuming this fetches users for dropdown
} from "@/reduxtool/master/middleware";
import { masterSelector } from '@/reduxtool/master/masterSlice';

// --- Type Definitions ---
export type ApiUserObject = {
    id: number;
    name: string;
};

export type ApiFetchedOffer = {
  id: number;
  generate_id: string;
  name: string;
  seller_section: string | null;
  buyer_section: string | null;
  groupA: string | null;
  groupB: string | null;
  assign_user: ApiUserObject | null;
  created_by: ApiUserObject;
  created_at: string;
  updated_at: string;
  // Potential direct IDs if API sends them in addition to section strings
  // seller_id?: string | number | null;
  // buyer_id?: string | number | null;
};

const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  assignedUserId: z.string().min(1, "Assigned User is required.").nullable(),
  sellerSection: z.object({
    sellerId: z.string().optional().nullable(),
  }).optional(),
  groupA_notes: z.string().optional().nullable(),
  buyerSection: z.object({
    buyerId: z.string().optional().nullable(),
  }).optional(),
  groupB_notes: z.string().optional().nullable(),
});
type OfferEditFormData = z.infer<typeof offerFormSchema>;

type UserOptionType = { value: string; label: string; id: string | number };

const EditOffer = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: offerIdFromParams } = useParams<{ id: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // isLoadingOfferData is now effectively currentOfferStatus === 'loading' or 'idle'
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(true);

  const {
    currentOffer,
    currentOfferStatus = 'idle', // Default to 'idle'
    // Assuming users for dropdown are in rawProfileArrayFromState or fetched by getUsersAction
    rawProfileArrayFromState = [],
    // status: masterDataAccessStatus, // Use for other general master data if needed
  } = useSelector(masterSelector);

  const formMethods = useForm<OfferEditFormData>({
    resolver: zodResolver(offerFormSchema),
  });
  const { control, handleSubmit, reset, getValues, setValue, formState: { errors, isDirty, isValid } } = formMethods;

  const employeeOptions: UserOptionType[] = useMemo(() => {
    if (!Array.isArray(rawProfileArrayFromState)) return [];
    return rawProfileArrayFromState.map((user: any) => ({
      value: String(user.id),
      label: user.name || `User ${user.id}`,
      id: user.id,
    }));
  }, [rawProfileArrayFromState]);


  // --- Fetch Dropdown Data ---
  useEffect(() => {
    const fetchUIData = async () => {
        setIsLoadingDropdownData(true);
        try {
            // If users are not part of a global fetch or rawProfileArrayFromState isn't sufficient:
            // await dispatch(getUsersAction()).unwrap(); // Or your specific user fetching action
            // For now, assuming users are available or fetched by a broader mechanism.
        } catch (error) {
            console.error("Failed to fetch dropdown data for EditOffer:", error);
            toast.push(<Notification type="danger" title="Dropdown Error">Could not load options.</Notification>);
        } finally {
            setIsLoadingDropdownData(false);
        }
    };
    fetchUIData();
  }, [dispatch]);


  // --- Fetch The Specific Offer to Edit ---
  useEffect(() => {
    if (!offerIdFromParams) {
      toast.push(<Notification title="Error" type="danger">Offer ID is missing from URL.</Notification>);
      navigate("/sales-leads/offers-demands");
      return;
    }

    // The ID from params is likely the `generate_id` (string) or numeric `id`.
    // Your `getOfferById` should handle the ID type passed in the URL.
    // If `offerIdFromParams` is `generate_id` but API needs numeric `id`, your thunk must handle this.
    dispatch(getOfferById(offerIdFromParams));

    // return () => {
    //   dispatch(clearCurrentOffer()); // Clear the specific offer from Redux state on unmount
    // };
  }, [dispatch, offerIdFromParams, navigate]);


  // --- Populate Form When Data is Ready ---
  useEffect(() => {
    // Only populate if offer data is successfully loaded AND dropdowns are ready (or not in a loading state)
    if (currentOfferStatus === 'idle' && currentOffer && !isLoadingDropdownData) {
      console.log("Populating EditOffer form with:", currentOffer);

      const parseSectionId = (sectionData: string | null): string | null => {
        if (!sectionData || sectionData.toLowerCase() === "null" || sectionData.trim() === "") return null;
        // This assumes sectionData, if not "null", is the ID itself.
        // If it could be JSON like "{'id':'val'}", you'd need JSON.parse here.
        return sectionData;
      };

      reset({
        name: currentOffer.name || "", // Fallback to empty string
        assignedUserId: currentOffer.assign_user ? String(currentOffer.assign_user.id) : null,
        sellerSection: {
          // If your API response `currentOffer` has a direct `seller_id` field:
          // sellerId: currentOffer.seller_id ? String(currentOffer.seller_id) : "",
          // Based on your provided JSON which has `seller_section` as a string:
          sellerId: parseSectionId(currentOffer.seller_section) || "",
        },
        groupA_notes: currentOffer.groupA || "", // API uses 'groupA'
        buyerSection: {
          // buyerId: currentOffer.buyer_id ? String(currentOffer.buyer_id) : "",
          buyerId: parseSectionId(currentOffer.buyer_section) || "",
        },
        groupB_notes: currentOffer.groupB || "", // API uses 'groupB'
      });
    } else if (currentOfferStatus === 'failed' && currentOfferStatus !== 'loading') {
        toast.push(<Notification title="Load Error" type="danger">Failed to load offer details for editing.</Notification>);
        // Consider navigating back or showing an inline error message
        // navigate("/sales-leads/offers-demands");
    }
  }, [currentOffer, currentOfferStatus, isLoadingDropdownData, reset, navigate]);


  const onFormSubmit = useCallback(
    async (formData: OfferEditFormData) => {
      if (!offerIdFromParams || !currentOffer) { // currentOffer for its numeric ID
          toast.push(<Notification title="Error" type="danger">Cannot submit: Offer data not fully loaded.</Notification>);
          return;
      }
      setIsSubmitting(true);

      const apiPayload: {
        id: number; // API expects numeric ID for the offer item itself
        name: string;
        assign_user_id?: string | null; // String of numeric ID
        seller_section?: string | null; // Or `seller_id` depending on API
        groupA?: string | null;
        buyer_section?: string | null;  // Or `buyer_id`
        groupB?: string | null;
        // Include ALL other fields your API endpoint for editing an offer expects
      } = {
        id: currentOffer.id, // Use the numeric ID from the fetched offer
        name: formData.name,
        assign_user_id: formData.assignedUserId, // Already string ID
        groupA: formData.groupA_notes,
        groupB: formData.groupB_notes,
        // How to send back seller/buyer sections depends on your API for EDIT:
        seller_section: formData.sellerSection?.sellerId || null,
        buyer_section: formData.buyerSection?.buyerId || null,
      };

      console.log("--- EditOffer API Payload for Update ---", apiPayload);

      try {
        await dispatch(editOfferAction(apiPayload)).unwrap();
        toast.push(
          <Notification title="Offer Updated" type="success" duration={2500}>
            Offer "{formData.name}" has been successfully updated.
          </Notification>
        );
        navigate("/sales-leads/offers-demands");
      } catch (error: any) {
        console.error("Failed to update offer:", error);
        const errorMessage = error?.message || error?.data?.message || "Could not update offer.";
        toast.push(
          <Notification title="Update Failed" type="danger" duration={4000}>
            {errorMessage}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, offerIdFromParams, currentOffer]
  );

  const handleCancel = () => {
    navigate("/sales-leads/offers-demands");
  };

  const handleSaveAsDraft = () => {
    if (!currentOffer) return;
    const currentValues = getValues();
    const draftPayload = {
        id: currentOffer.id, // Use existing ID
        ...currentValues,    // Form values
        status: "Draft"      // Example: if your API supports a status field for drafts
    };
    console.log("Saving as draft (Edit Offer):", draftPayload);
    toast.push(<Notification title="Draft Saved" type="info">Changes saved as draft. (Simulated)</Notification>);
    // Potentially dispatch `editOfferAction` with the draft payload (including status: "Draft")
    // e.g., dispatch(editOfferAction({ ...apiPayloadFromForm, status: 'Draft' }))...
  };

  // Combined loading state
  const isLoadingPage = currentOfferStatus === 'loading' || currentOfferStatus === 'idle' || isLoadingDropdownData;

//   if (isLoadingPage && currentOfferStatus !== 'failed') {
//     return (
//       <Container>
//         <div className="flex justify-center items-center h-screen">
//           <Spinner size={40} /> <span className="ml-2">Loading Offer Details...</span>
//         </div>
//       </Container>
//     );
//   }

  if (currentOfferStatus === 'failed') {
     return (
      <Container>
        <div className="text-center p-8">
          <h4 className="text-lg font-semibold mb-2">Error Loading Offer</h4>
          <p>There was an issue fetching the offer details. Please check the console or try again.</p>
          <Button className="mt-4" variant="solid" onClick={() => navigate("/sales-leads/offers-demands")}>
            Back to Offers & Demands
          </Button>
        </div>
      </Container>
    );
  }
  
  // If successfully fetched but currentOffer is null (API returned no data for ID)
  if (currentOfferStatus === 'succeeded' && !currentOffer) {
    return (
      <Container>
        <div className="text-center p-8">
          <h4 className="text-lg font-semibold mb-2">Offer Not Found</h4>
          <p>The offer with ID "{offerIdFromParams}" could not be found.</p>
          <Button className="mt-4" variant="solid" onClick={() => navigate("/sales-leads/offers-demands")}>
            Back to Offers & Demands
          </Button>
        </div>
      </Container>
    );
  }
  
  // Fallback: If form fields aren't populated yet but data seems to be there.
  // This can happen if reset() hasn't finished due to timing.
  if (currentOffer && !getValues("name") && !isDirty && currentOfferStatus === 'succeeded') {
     return (
      <Container>
        <div className="flex justify-center items-center h-screen">
          <Spinner size={40} /> <span className="ml-2">Finalizing Form...</span>
        </div>
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
                  <UiSelect placeholder="Select Employee" options={employeeOptions}
                    value={employeeOptions.find(opt => opt.value === field.value)}
                    onChange={option => field.onChange(option ? option.value : null)}
                    isClearable isLoading={isLoadingDropdownData} />
                )} />
            </FormItem>

            <div className="flex flex-col gap-4">
              <Card>
                <h5>Seller Section</h5>
                <div className="mt-4 flex items-center gap-1">
                  <FormItem label="Seller ID/Details" className="w-full" invalid={!!errors.sellerSection?.sellerId} errorMessage={errors.sellerSection?.sellerId?.message}>
                    <Controller name="sellerSection.sellerId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Enter Seller ID or Details" />} />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10 self-end mb-1" onClick={() => setValue('sellerSection.sellerId', '', { shouldValidate: true, shouldDirty: true })} />
                </div>
              </Card>
              <Card>
                <h5>Group A Notes (Seller Notes)</h5>
                <div className="mt-4">
                  <FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}>
                    <Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Seller Section (Optional)" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                    <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues('groupA_notes') || ''); toast.push(<Notification title="Copied" type="info">Group A notes copied.</Notification>) }} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <h5>Buyer Section</h5>
                <div className="mt-4 flex items-center gap-1">
                  <FormItem label="Buyer ID/Details" className="w-full" invalid={!!errors.buyerSection?.buyerId} errorMessage={errors.buyerSection?.buyerId?.message}>
                    <Controller name="buyerSection.buyerId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Enter Buyer ID or Details" />} />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10 self-end mb-1" onClick={() => setValue('buyerSection.buyerId', '', { shouldValidate: true, shouldDirty: true })} />
                </div>
              </Card>
              <Card>
                <h5>Group B Notes (Buyer Notes)</h5>
                <div className="mt-4">
                  <FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}>
                    <Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Buyer Section (Optional)" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                     <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues('groupB_notes') || ''); toast.push(<Notification title="Copied" type="info">Group B notes copied.</Notification>) }} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
        
        <Card bodyClass="flex justify-end gap-2" className='mt-4'>
          <Button type="button" onClick={handleCancel} disabled={isSubmitting || isLoadingPage}>Cancel</Button>
          <Button type="button" onClick={handleSaveAsDraft} variant="twoTone" disabled={isSubmitting || isLoadingPage}>Draft</Button>
          <Button type="submit" form="editOfferForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoadingPage || !isDirty || !isValid}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default EditOffer;