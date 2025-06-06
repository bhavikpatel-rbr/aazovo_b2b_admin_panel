import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
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

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { addDemandAction, getUsersAction } from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Zod Schema for Create Demand Form (Updated for multiple fields) ---
const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(),

  // Use z.array for multiple buyers
  buyers: z.array(z.object({
    buyerId: z.string().optional().nullable(),
  })).min(1, "At least one buyer is required."),

  groupA_notes: z.string().optional().nullable(),

  // Use z.array for multiple sellers
  sellers: z.array(z.object({
    sellerId: z.string().optional().nullable(),
  })).min(1, "At least one seller is required."),

  groupB_notes: z.string().optional().nullable(),
});

type DemandFormData = z.infer<typeof demandFormSchema>;
export type UserOptionType = { value: string; label: string; id: number; name: string };

const CreateDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getUsersAction());
  }, [dispatch]);

  const { usersData = [] } = useSelector(masterSelector);

  const userOptions = useMemo(() => {
    if (!Array.isArray(usersData)) return [];
    return usersData.map((u: UserOptionType) => ({
      value: u.id,
      label: u.name,
    }));
  }, [usersData]);

  const formMethods = useForm<DemandFormData>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      // Initialize with one empty buyer and seller
      buyers: [{ buyerId: "" }],
      groupA_notes: "",
      sellers: [{ sellerId: "" }],
      groupB_notes: "",
    },
  });

  const { control, handleSubmit, reset, getValues, formState: { errors } } = formMethods;

  // --- Field Array Hooks ---
  const { fields: buyerFields, append: appendBuyer, remove: removeBuyer } = useFieldArray({
    control,
    name: "buyers",
  });

  const { fields: sellerFields, append: appendSeller, remove: removeSeller } = useFieldArray({
    control,
    name: "sellers",
  });

  const onFormSubmit = useCallback(
    async (data: DemandFormData) => {
      setIsSubmitting(true);

      // --- Construct the payload for the API ---
      // IMPORTANT: This now sends arrays of IDs. Ensure your addDemandAction and backend API
      // expect a format like `buyer_section: ["id1", "id2"]`.
      const apiPayload = {
        name: data.name,
        assign_user: data.assignedUserId,
        groupA: data.groupA_notes, // For Buyers
        groupB: data.groupB_notes, // For Sellers
        // Filter out any empty/null IDs before sending
        buyer_section: data.buyers
            .map(buyer => buyer.buyerId)
            .filter(id => id && id.trim() !== ''),
        seller_section: data.sellers
            .map(seller => seller.sellerId)
            .filter(id => id && id.trim() !== ''),
      };
      
      console.log("--- CreateDemand API Payload ---", apiPayload);

      try {
        await dispatch(addDemandAction(apiPayload)).unwrap();

        toast.push(
          <Notification title="Demand Created" type="success" duration={2500}>
            Demand "{data.name}" has been successfully created.
          </Notification>
        );
        reset();
        navigate("/sales-leads/offers-demands");

      } catch (error: any) {
        console.error("Failed to create demand:", error);
        const errorMessage = error?.message || "Could not create demand.";
        toast.push(
          <Notification title="Creation Failed" type="danger" duration={4000}>
            {errorMessage}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, reset]
  );

  const handleCancel = () => {
    reset();
    navigate("/sales-leads/offers-demands");
    toast.push(<Notification title="Cancelled" type="info">Demand creation cancelled.</Notification>);
  };

  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands">
          <h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Offers & Demands</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className='font-semibold text-primary'>Add New Demand</h6>
      </div>
      
      <Form
        id="createDemandForm"
        onSubmit={handleSubmit(onFormSubmit)}
      >
        <Card>
          <h4 className="mb-6">Add Demand</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Level Fields */}
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

            {/* Buyer Column (Primary for Demand) */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Buyer Section</h5>
                <div className="flex flex-col gap-4 mt-4">
                  {buyerFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormItem 
                        label={index === 0 ? "Buyer ID" : ""}
                        className="w-full"
                        invalid={!!errors.buyers?.[index]?.buyerId}
                        errorMessage={errors.buyers?.[index]?.buyerId?.message}
                      >
                        <Controller
                          name={`buyers.${index}.buyerId`}
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Buyer ID" />}
                        />
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
                <h5>Group A Notes (Buyer Notes)</h5>
                <div className="mt-4 ">
                  <FormItem invalid={!!errors.groupA_notes} errorMessage={errors.groupA_notes?.message}>
                    <Controller name="groupA_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Enter notes for Group A (Optional)" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                    <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues('groupA_notes') || ''); toast.push(<Notification title="Copied" type="info">Group A notes copied.</Notification>) }}/>
                  </div>
                </div>
              </Card>
            </div>

            {/* Seller Column (Secondary for Demand) */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Seller Section</h5>
                <div className="flex flex-col gap-4 mt-4">
                  {sellerFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormItem 
                        label={index === 0 ? "Seller ID" : ""}
                        className="w-full"
                        invalid={!!errors.sellers?.[index]?.sellerId}
                        errorMessage={errors.sellers?.[index]?.sellerId?.message}
                      >
                        <Controller
                          name={`sellers.${index}.sellerId`}
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Seller ID" />}
                        />
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
                <h5>Group B Notes (Seller Notes)</h5>
                <div className="mt-4 ">
                  <FormItem invalid={!!errors.groupB_notes} errorMessage={errors.groupB_notes?.message}>
                    <Controller name="groupB_notes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Enter notes for Group B (Optional)" rows={3}/>} />
                  </FormItem>
                  <div className="text-right mt-1">
                     <Button type="button" icon={<TbCopy />} onClick={() => { navigator.clipboard.writeText(getValues('groupB_notes') || ''); toast.push(<Notification title="Copied" type="info">Group B notes copied.</Notification>) }}/>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      
        <Card bodyClass="flex justify-end gap-2" className='mt-4'>
          <Button type="button" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="createDemandForm"
            variant="solid"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Demand"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default CreateDemand;