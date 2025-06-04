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
    getDemandById,         // Action to fetch a single demand
    editDemandAction,      // Action to update a demand
    getUsersAction,        // Assuming this fetches users for dropdown
} from "@/reduxtool/master/middleware"; // VERIFY PATH
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH

// --- Type Definitions ---
// (Assuming ApiUserObject is the same as in EditOffer.tsx)
export type ApiUserObject = {
    id: number;
    name: string;
};

// Structure of a Demand as fetched from API (for editing)
// THIS MUST MATCH YOUR "GET DEMAND BY ID" API RESPONSE
export type ApiFetchedDemand = {
  id: number;
  generate_id: string;
  name: string;
  // For Demands, Buyer section is often primary
  buyer_section: string | null;  // API sends string "null" or potentially JSON string/ID
  seller_section: string | null; // API sends string "null"
  groupA: string | null;         // Notes for Buyer section (conventionally)
  groupB: string | null;         // Notes for Seller section (conventionally)
  assign_user: ApiUserObject | null;
  created_by: ApiUserObject;
  created_at: string;
  updated_at: string;
  // Add any other fields your API returns for a single demand
};

// Zod Schema for Edit Demand Form
const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assignedUserId: z.string().min(1, "Assigned User is required.").nullable(),
  // For Demands, Buyer section might be listed first in UI
  buyerSection: z.object({
    buyerId: z.string().optional().nullable(),
  }).optional(),
  groupA_notes: z.string().optional().nullable(), // Notes associated with Buyer section
  sellerSection: z.object({
    sellerId: z.string().optional().nullable(),
  }).optional(),
  groupB_notes: z.string().optional().nullable(), // Notes associated with Seller section
});
type DemandEditFormData = z.infer<typeof demandFormSchema>;

type UserOptionType = { value: string; label: string; id: string | number };

const EditDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id: demandIdFromParams } = useParams<{ id: string }>(); // Changed param name to 'id' to match route

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(true);

  const {
    currentDemand,
    currentDemandStatus = 'idle',
    rawProfileArrayFromState = [],
  } = useSelector(masterSelector);

  const formMethods = useForm<DemandEditFormData>({
    resolver: zodResolver(demandFormSchema),
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

  useEffect(() => {
    const fetchUIData = async () => {
        setIsLoadingDropdownData(true);
        try {
            // await dispatch(getUsersAction()).unwrap(); // If needed
        } catch (error) {
            console.error("Failed to fetch dropdown data for EditDemand:", error);
        } finally {
            setIsLoadingDropdownData(false);
        }
    };
    fetchUIData();
  }, [dispatch]);

  useEffect(() => {
    if (!demandIdFromParams) {
      toast.push(<Notification title="Error" type="danger">Demand ID is missing from URL.</Notification>);
      navigate("/sales-leads/offers-demands");
      return;
    }
    dispatch(getDemandById(demandIdFromParams)); // Action to fetch specific demand

    // return () => {
    //   dispatch(clearCurrentDemand()); // Clear demand from state on unmount
    // };
  }, [dispatch, demandIdFromParams, navigate]);

  useEffect(() => {
    if (currentDemandStatus === 'idle' && currentDemand && !isLoadingDropdownData) {
      console.log("Populating EditDemand form with:", currentDemand);

      const parseSectionId = (sectionData: string | null): string | null => {
        if (!sectionData || sectionData.toLowerCase() === "null" || sectionData.trim() === "") return null;
        return sectionData; // Assumes it's a direct ID string if not "null"
      };

      reset({
        name: currentDemand.name || "",
        assignedUserId: currentDemand.assign_user ? String(currentDemand.assign_user.id) : null,
        buyerSection: { // For Demand, Buyer is often primary (Group A notes)
          buyerId: parseSectionId(currentDemand.buyer_section) || "",
        },
        groupA_notes: currentDemand.groupA || "", // Notes for Buyer
        sellerSection: {
          sellerId: parseSectionId(currentDemand.seller_section) || "",
        },
        groupB_notes: currentDemand.groupB || "", // Notes for Seller
      });
    } else if (currentDemandStatus === 'failed' && currentDemandStatus !== 'loading') {
        toast.push(<Notification title="Load Error" type="danger">Failed to load demand details for editing.</Notification>);
    }
  }, [currentDemand, currentDemandStatus, isLoadingDropdownData, reset, navigate]);

  const onFormSubmit = useCallback(
    async (formData: DemandEditFormData) => {
      if (!demandIdFromParams || !currentDemand) {
          toast.push(<Notification title="Error" type="danger">Cannot submit: Demand data not loaded.</Notification>);
          return;
      }
      setIsSubmitting(true);

      const apiPayload: {
        id: number; // Numeric ID of the demand item
        name: string;
        assign_user_id?: string | null;
        buyer_section?: string | null; // Or `buyer_id` depending on API for edit
        groupA?: string | null;
        seller_section?: string | null; // Or `seller_id`
        groupB?: string | null;
      } = {
        id: currentDemand.id,
        name: formData.name,
        assign_user_id: formData.assignedUserId,
        groupA: formData.groupA_notes, // Notes for Buyer section
        groupB: formData.groupB_notes, // Notes for Seller section
        buyer_section: formData.buyerSection?.buyerId || null,
        seller_section: formData.sellerSection?.sellerId || null,
      };

      console.log("--- EditDemand API Payload for Update ---", apiPayload);

      try {
        await dispatch(editDemandAction(apiPayload)).unwrap();
        toast.push(
          <Notification title="Demand Updated" type="success" duration={2500}>
            Demand "{formData.name}" updated.
          </Notification>
        );
        navigate("/sales-leads/offers-demands");
      } catch (error: any) {
        console.error("Failed to update demand:", error);
        const errorMessage = error?.message || error?.data?.message || "Could not update demand.";
        toast.push(
          <Notification title="Update Failed" type="danger" duration={4000}>
            {errorMessage}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, demandIdFromParams, currentDemand]
  );

  const handleCancel = () => {
    navigate("/sales-leads/offers-demands");
  };

  const handleSaveAsDraft = () => {
    if (!currentDemand) return;
    const currentValues = getValues();
    const draftPayload = {
        id: currentDemand.id,
        ...currentValues,
        status: "Draft"
    };
    console.log("Saving as draft (Edit Demand):", draftPayload);
    toast.push(<Notification title="Draft Saved" type="info">Demand changes saved as draft. (Simulated)</Notification>);
  };

  const isLoadingPage = currentDemandStatus === 'loading' || currentDemandStatus === 'idle' || isLoadingDropdownData;

//   if (isLoadingPage && currentDemandStatus !== 'failed') {
//     return (
//       <Container><div className="flex justify-center items-center h-screen"><Spinner size={40} /><span className="ml-2">Loading Demand Details...</span></div></Container>
//     );
//   }
  if (currentDemandStatus === 'failed') {
     return (
      <Container><div className="text-center p-8"><h4 className="text-lg font-semibold mb-2">Error Loading Demand</h4><p>Could not fetch demand details.</p><Button className="mt-4" variant="solid" onClick={() => navigate("/sales-leads/offers-demands")}>Back</Button></div></Container>
    );
  }
  if (currentDemandStatus === 'succeeded' && !currentDemand) {
    return (
      <Container><div className="text-center p-8"><h4 className="text-lg font-semibold mb-2">Demand Not Found</h4><p>ID: "{demandIdFromParams}"</p><Button className="mt-4" variant="solid" onClick={() => navigate("/sales-leads/offers-demands")}>Back</Button></div></Container>
    );
  }
  if (currentDemand && !getValues("name") && !isDirty && currentDemandStatus === 'succeeded') {
     return (
      <Container><div className="flex justify-center items-center h-screen"><Spinner size={40} /><span className="ml-2">Finalizing Form...</span></div></Container>
    );
  }

  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands">
          <h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Offers & Demands</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
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
                  <UiSelect placeholder="Select Employee" options={employeeOptions}
                    value={employeeOptions.find(opt => opt.value === field.value)}
                    onChange={option => field.onChange(option ? option.value : null)}
                    isClearable isLoading={isLoadingDropdownData} />
                )} />
            </FormItem>

            {/* Buyer Column (Primary for Demand) */}
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
                <h5>Group A Notes (Buyer Notes)</h5>
                <div className="mt-4">
                  <FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}>
                    <Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Buyer Section (Optional)" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                    <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues('groupA_notes') || ''); toast.push(<Notification title="Copied" type="info">Group A notes copied.</Notification>) }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Seller Column (Secondary for Demand) */}
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
                <h5>Group B Notes (Seller Notes)</h5>
                <div className="mt-4">
                  <FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}>
                    <Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Notes for Seller Section (Optional)" rows={3}/>} />
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
          <Button type="submit" form="editDemandForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoadingPage || !isDirty || !isValid}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default EditDemand;