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
import { addOfferAction } from "@/reduxtool/master/middleware"; // Added - VERIFY PATH

// --- Zod Schema for Create Offer Form ---
// This schema should reflect the data you want to collect in the form.
// The transformation to the API payload will happen in onFormSubmit.
const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  // Assuming assignedUserId in the form will hold the ID (string or number)
  assignedUserId: z.string().min(1, "Assigned User is required.").nullable(), 

  // Seller Section
  // If you allow multiple sellers, this would be z.array(z.object(...))
  // For a single seller concept on the form:
  sellerSection: z.object({
    sellerId: z.string().optional().nullable(), 
    // Add other seller-specific fields the form collects
  }).optional(),

  groupA_notes: z.string().optional().nullable(),

  // Buyer Section
  buyerSection: z.object({
    buyerId: z.string().optional().nullable(),
    // Add other buyer-specific fields
  }).optional(),

  groupB_notes: z.string().optional().nullable(),
});

type OfferFormData = z.infer<typeof offerFormSchema>;

// --- Dummy Options (Replace with API data if needed) ---
// These options should provide the ID that the backend expects for 'assignedUserId'
const employeeOptions = [
  { label: "Rahul (ID: 1)", value: "1" }, // Assuming value is the user's ID
  { label: "Ishan (ID: 2)", value: "2" },
  { label: "Priya (ID: 3)", value: "3" },
];


const CreateOffer = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // Added
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      sellerSection: { // Initialize even if optional, if fields inside are always present
        sellerId: "",
      },
      groupA_notes: "",
      buyerSection: {
        buyerId: "",
      },
      groupB_notes: "",
    },
  });

  const { control, handleSubmit, reset, getValues, setValue, formState: { errors, isDirty, isValid } } = formMethods;

  const onFormSubmit = useCallback(
    async (data: OfferFormData) => {
      setIsSubmitting(true);

      // --- Construct the payload for the API ---
      // This is CRITICAL and must match what your backend 'addOfferAction' expects.
      // Adjust field names and structure as needed.
      const apiPayload: {
        name: string;
        assign_user?: string | null; // Or number, match API
        seller_section?: string | null;     // Example of flattened structure
        // seller_section?: { seller_section: string | null }; // Example of nested
        groupA?: string | null;       // Assuming API uses 'groupA' not 'groupA_notes'
        buyer_section?: string | null;
        groupB?: string | null;
        // Add any other fields your API expects for creating an offer
      } = {
        name: data.name,
        assign_user: data.assignedUserId, // Ensure this is the ID
        groupA: data.groupA_notes,          // Renaming example
        groupB: data.groupB_notes,          // Renaming example
      };

      // Handle optional sections:
      if (data.sellerSection && data.sellerSection.sellerId) {
        apiPayload.seller_section = data.sellerSection.sellerId;
        // If API expects a nested object:
        // apiPayload.seller_section = { seller_section: data.sellerSection.sellerId };
      }

      if (data.buyerSection && data.buyerSection.buyerId) {
        apiPayload.buyer_section = data.buyerSection.buyerId;
      }
      
      console.log("--- CreateOffer API Payload ---", apiPayload);

      try {
        // Dispatch the action
        await dispatch(addOfferAction(apiPayload)).unwrap(); // .unwrap() handles promise

        toast.push(
          <Notification title="Offer Created" type="success" duration={2500}>
            Offer "{data.name}" has been successfully created.
          </Notification>
        );
        reset(); // Reset form after successful submission
        navigate("/sales-leads/offers-demands"); // Navigate to offers list

      } catch (error: any) {
        console.error("Failed to create offer:", error);
        // error might contain response data from API if thunk is set up for it
        const errorMessage = error?.message || error?.data?.message || "Could not create offer. Please try again.";
        toast.push(
          <Notification title="Creation Failed" type="danger" duration={4000}>
            {errorMessage}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, reset] // Added dependencies
  );

  const handleCancel = () => {
    reset();
    navigate("/sales-leads/offers-demands");
    toast.push(<Notification title="Cancelled" type="info">Offer creation cancelled.</Notification>);
  };

  // Placeholder for dynamic add/remove seller/buyer logic
  const handleAddSeller = () => {
    toast.push(<Notification title="Action" type="info">Add Seller functionality (useFieldArray) to be implemented.</Notification>);
  };
  const handleAddBuyer = () => {
    toast.push(<Notification title="Action" type="info">Add Buyer functionality (useFieldArray) to be implemented.</Notification>);
  };


  return (
    <>
      <div className='flex gap-1 items-end mb-3 '>
        <NavLink to="/sales-leads/offers-demands">
          <h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Offers & Demands</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className='font-semibold text-primary'>Add New Offer</h6>
      </div>
      <Form
        id="createOfferForm"
        onSubmit={handleSubmit(onFormSubmit)} // Use handleSubmit from RHF
      >
        <Card>
          <h4 className="mb-6">Add Offer</h4>
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
                render={({ field }) => <Input {...field} placeholder="Enter Offer Name" />}
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
                    // {...field} // Spreading field might cause issues with how value is handled by some UiSelect components
                    placeholder="Select Employee"
                    options={employeeOptions}
                    value={employeeOptions.find(opt => opt.value === field.value)}
                    onChange={option => field.onChange(option ? option.value : null)}
                    isClearable
                  />
                )}
              />
            </FormItem>

            {/* Seller Column */}
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
                <h5>Group A Notes</h5>
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
                            toast.push(<Notification title="Copied" type="info">Group A notes copied to clipboard.</Notification>)
                        }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Buyer Column */}
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
                <h5>Group B Notes</h5>
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
                            toast.push(<Notification title="Copied" type="info">Group B notes copied to clipboard.</Notification>)
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
          <Button
            type="submit"
            form="createOfferForm"
            variant="solid"
            loading={isSubmitting}
            disabled={isSubmitting || !isDirty || !isValid} // Use RHF formState
          >
            {isSubmitting ? "Saving..." : "Save Offer"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default CreateOffer;