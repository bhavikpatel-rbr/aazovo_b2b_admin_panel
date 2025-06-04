import React, { useState, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
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

// Redux
import { useAppDispatch } from "@/reduxtool/store"; // Added
import { addDemandAction } from "@/reduxtool/master/middleware"; // Added - VERIFY PATH

// --- Zod Schema for Create Demand Form ---
const demandFormSchema = z.object({
  name: z.string().min(1, "Demand Name is required."),
  assignedUserId: z.string().min(1, "Assigned User is required.").nullable(),

  buyerSection: z.object({
    buyerId: z.string().optional().nullable(),
  }).optional(),
  groupA_notes: z.string().optional().nullable(),

  sellerSection: z.object({
    sellerId: z.string().optional().nullable(),
  }).optional(),
  groupB_notes: z.string().optional().nullable(),
});

type DemandFormData = z.infer<typeof demandFormSchema>;

// --- Dummy Options (Ensure values are the IDs your backend expects) ---
const employeeOptions = [
  { label: "Rahul (ID: 1)", value: "1" },
  { label: "Ishan (ID: 2)", value: "2" },
  { label: "Priya (ID: 3)", value: "3" },
];

const CreateDemand = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // Added
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<DemandFormData>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      buyerSection: { // Initialize even if optional
        buyerId: "",
      },
      groupA_notes: "",
      sellerSection: {
        sellerId: "",
      },
      groupB_notes: "",
    },
  });

  const { control, handleSubmit, reset, getValues, setValue, formState: { errors, isDirty, isValid } } = formMethods;

  const onFormSubmit = useCallback(
    async (data: DemandFormData) => {
      setIsSubmitting(true);

      // --- Construct the payload for the API ---
      // CRITICAL: This must match your backend 'addDemandAction' API requirements.
      const apiPayload: {
        name: string;
        assign_user?: string | null; // Or number, match API
        buyer_id?: string | null;       // Example: flattened structure
        // buyer_section?: { buyer_id: string | null }; // Example: nested
        groupA?: string | null;         // Assuming API expects 'groupA' for buyer notes
        seller_id?: string | null;
        groupB?: string | null;         // Assuming API expects 'groupB' for seller notes
        status?: string;                // Optional: if you set a default status
      } = {
        name: data.name,
        assign_user: data.assignedUserId,
        groupA: data.groupA_notes,
        groupB: data.groupB_notes,
        // status: "Pending", // Example: Set a default status if needed by API
      };

      if (data.buyerSection && data.buyerSection.buyerId) {
        apiPayload.buyer_id = data.buyerSection.buyerId;
      }
      if (data.sellerSection && data.sellerSection.sellerId) {
        apiPayload.seller_id = data.sellerSection.sellerId;
      }
      
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
        const errorMessage = error?.message || error?.data?.message || "Could not create demand. Please try again.";
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
  
  const handleSaveAsDraft = async () => { // Make async if you intend to call an API
    const currentValues = getValues();
    
    // --- Construct payload for DRAFT ---
    // This might be the same as apiPayload, or it might specifically include a "status": "Draft"
    const draftPayload: any = {
        name: currentValues.name,
        assign_user: currentValues.assignedUserId,
        groupA: currentValues.groupA_notes,
        groupB: currentValues.groupB_notes,
        status: "Draft", // Explicitly set status for draft
    };
     if (currentValues.buyerSection && currentValues.buyerSection.buyerId) {
        draftPayload.buyer_id = currentValues.buyerSection.buyerId;
      }
      if (currentValues.sellerSection && currentValues.sellerSection.sellerId) {
        draftPayload.seller_id = currentValues.sellerSection.sellerId;
      }

    console.log("Saving as draft (Create Demand):", draftPayload);
    setIsSubmitting(true); // Indicate activity
    try {
        // If you have a separate draft action or if addDemandAction handles status:
        // await dispatch(addDemandAction(draftPayload)).unwrap(); // Or a specific saveDraftDemandAction
        
        // Simulate API call for draft
        await new Promise(resolve => setTimeout(resolve, 700));

        toast.push(
            <Notification title="Draft Saved" type="info" duration={2000}>
                Demand saved as draft.
            </Notification>
        );
        // navigate("/sales-leads/offers-demands"); // Optional: Navigate or stay on page
    } catch (error: any) {
        const errorMessage = error?.message || "Could not save draft.";
        toast.push(<Notification title="Draft Save Failed" type="danger">{errorMessage}</Notification>);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddBuyer = () => {
    toast.push(<Notification title="Action" type="info">Add Buyer (useFieldArray) to be implemented.</Notification>);
  };
  const handleAddSeller = () => {
    toast.push(<Notification title="Action" type="info">Add Seller (useFieldArray) to be implemented.</Notification>);
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
            <FormItem
              label="Name"
              invalid={!!errors.name}
              errorMessage={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter Demand Name" />}
              />
            </FormItem>
            <FormItem
              label="Assign User"
              invalid={!!errors.assignedUserId}
              errorMessage={errors.assignedUserId?.message}
            >
              <Controller
                name="assignedUserId"
                control={control}
                render={({ field }) => (
                  <UiSelect
                    placeholder="Select Employee"
                    options={employeeOptions}
                    value={employeeOptions.find(opt => opt.value === field.value)}
                    onChange={option => field.onChange(option ? option.value : null)}
                    isClearable
                  />
                )}
              />
            </FormItem>

            {/* Buyer Column (Primary for Demand) */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Buyer Section</h5>
                <div className="mt-4 flex items-center gap-1">
                  <FormItem 
                    label="Buyer ID" 
                    className="w-full"
                    invalid={!!errors.buyerSection?.buyerId}
                    errorMessage={errors.buyerSection?.buyerId?.message}
                  >
                    <Controller
                      name="buyerSection.buyerId"
                      control={control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Buyer ID (Optional)" />}
                    />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10 self-end mb-1"
                    onClick={() => setValue('buyerSection.buyerId', '', { shouldValidate: true, shouldDirty: true })}
                  />
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={handleAddBuyer}>Add Another Buyer</Button>
                </div>
              </Card>

              <Card>
                <h5>Group A Notes</h5> {/* Or "Buyer Group Notes" */}
                <div className="mt-4 ">
                  <FormItem
                    invalid={!!errors.groupA_notes}
                    errorMessage={errors.groupA_notes?.message}
                  >
                    <Controller
                      name="groupA_notes"
                      control={control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Enter notes for Group A (Optional)" rows={3}/>}
                    />
                  </FormItem>
                  <div className="text-right mt-1">
                    <Button 
                        type="button" 
                        icon={<TbCopy />} 
                        onClick={() => {
                            navigator.clipboard.writeText(getValues('groupA_notes') || '');
                            toast.push(<Notification title="Copied" type="info">Group A notes copied.</Notification>)
                        }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Seller Column (Secondary for Demand) */}
            <div className="flex flex-col gap-4">
              <Card>
                <h5>Seller Section</h5>
                <div className="mt-4 flex items-center gap-1">
                  <FormItem 
                    label="Seller ID" 
                    className="w-full"
                    invalid={!!errors.sellerSection?.sellerId}
                    errorMessage={errors.sellerSection?.sellerId?.message}
                  >
                    <Controller
                      name="sellerSection.sellerId"
                      control={control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Seller ID (Optional)" />}
                    />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10 self-end mb-1"
                    onClick={() => setValue('sellerSection.sellerId', '', { shouldValidate: true, shouldDirty: true })} 
                  />
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={handleAddSeller}>Add Another Seller</Button>
                </div>
              </Card>

              <Card>
                <h5>Group B Notes</h5> {/* Or "Seller Group Notes" */}
                <div className="mt-4 ">
                  <FormItem
                    invalid={!!errors.groupB_notes}
                    errorMessage={errors.groupB_notes?.message}
                  >
                    <Controller
                      name="groupB_notes"
                      control={control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Enter notes for Group B (Optional)" rows={3}/>}
                    />
                  </FormItem>
                  <div className="text-right mt-1">
                     <Button 
                        type="button" 
                        icon={<TbCopy />} 
                        onClick={() => {
                            navigator.clipboard.writeText(getValues('groupB_notes') || '');
                            toast.push(<Notification title="Copied" type="info">Group B notes copied.</Notification>)
                        }}
                    />
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
          <Button type="button" onClick={handleSaveAsDraft} variant="twoTone" disabled={isSubmitting}>
            Draft
          </Button>
          <Button
            type="submit"
            form="createDemandForm"
            variant="solid"
            loading={isSubmitting}
            disabled={isSubmitting || !isDirty || !isValid}
          >
            {isSubmitting ? "Saving..." : "Save Demand"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default CreateDemand;