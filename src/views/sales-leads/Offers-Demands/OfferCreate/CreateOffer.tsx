import React, { useState, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import dayjs from "dayjs"; // Not used in this form directly, but good to have if dates are added

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect, Button } from "@/components/ui"; // Assuming Select is UiSelect
import { Form, FormItem } from "@/components/ui/Form";
// import DatePicker from "@/components/ui/DatePicker"; // Not used in current form fields
import { BiChevronRight } from "react-icons/bi";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import { TbCopy, TbPlus, TbTrash } from "react-icons/tb";

// --- Zod Schema for Create Offer Form ---
const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  assignedUserId: z.string().min(1, "Assigned User is required.").nullable(), // Assuming value is string like "Rahul"

  // Seller Section - For simplicity, starting with one seller. 
  // You might use z.array() if you allow multiple sellers.
  sellerSection: z.object({
    sellerId: z.string().optional().nullable(),
    // Add more seller-specific fields here if needed later
  }).optional(), // Make the whole section optional if it can be empty

  groupA_notes: z.string().optional().nullable(),

  // Buyer Section - Similar to seller
  buyerSection: z.object({
    buyerId: z.string().optional().nullable(),
    // Add more buyer-specific fields here
  }).optional(),

  groupB_notes: z.string().optional().nullable(),

  // You might add more top-level fields like offer_status, expiry_date etc.
});

type OfferFormData = z.infer<typeof offerFormSchema>;

// --- Dummy Options (Replace with API data if needed) ---
const employeeOptions = [
  { label: "Rahul", value: "Rahul" },
  { label: "Ishan", value: "Ishan" },
  { label: "Priya", value: "Priya" },
];


const CreateOffer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      sellerSection: {
        sellerId: "",
      },
      groupA_notes: "",
      buyerSection: {
        buyerId: "",
      },
      groupB_notes: "",
    },
  });

  const onFormSubmit = useCallback(
    async (data: OfferFormData) => {
      setIsSubmitting(true);

      const loggedPayload: any = { ...data };

      // You can further transform or structure loggedPayload here if needed
      // For example, if your API expects seller_id instead of sellerSection.sellerId:
      // if (data.sellerSection) {
      //   loggedPayload.seller_id = data.sellerSection.sellerId;
      //   delete loggedPayload.sellerSection; // Remove the nested object if transformed
      // }
      // Similar for buyerSection

      console.log("--- CreateOffer Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", data);
      console.log("2. Constructed Payload (for API/logging):", loggedPayload);
      console.log("--- End CreateOffer Form Submission Log ---");

      await new Promise((res) => setTimeout(res, 1000)); // Simulate API call

      toast.push(
        <Notification title="Success" type="success">
          Offer created. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      // navigate("/sales-leads/offers-demands");
    },
    []
  );

  const handleCancel = () => {
    formMethods.reset();
    navigate("/sales-leads/offers-demands");
    toast.push(<Notification title="Cancelled" type="info">Offer creation cancelled.</Notification>);
  };

  // Placeholder for dynamic add/remove seller/buyer logic if you implement it
  const handleAddSeller = () => {
    toast.push(<Notification title="Action" type="info">Add Seller functionality to be implemented.</Notification>);
    // Here you would modify form state, possibly using useFieldArray from react-hook-form
  };
  const handleAddBuyer = () => {
    toast.push(<Notification title="Action" type="info">Add Buyer functionality to be implemented.</Notification>);
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
        onSubmit={formMethods.handleSubmit(onFormSubmit)}
      >
        <Card>
          <h4 className="mb-6">Add Offer</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Level Fields */}
            <FormItem
              label="Name"
              invalid={!!formMethods.formState.errors.name}
              errorMessage={formMethods.formState.errors.name?.message}
            >
              <Controller
                name="name"
                control={formMethods.control}
                render={({ field }) => <Input {...field} placeholder="Enter Offer Name" />}
              />
            </FormItem>
            <FormItem
              label="Assign User"
              invalid={!!formMethods.formState.errors.assignedUserId}
              errorMessage={formMethods.formState.errors.assignedUserId?.message}
            >
              <Controller
                name="assignedUserId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
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
                {/* If using useFieldArray for multiple sellers, map through them here */}
                <div className="mt-4 flex items-center gap-1">
                  <FormItem 
                    label="Seller ID" 
                    className="w-full"
                    invalid={!!formMethods.formState.errors.sellerSection?.sellerId}
                    errorMessage={formMethods.formState.errors.sellerSection?.sellerId?.message}
                  >
                    <Controller
                      name="sellerSection.sellerId" // Nested field name
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Seller ID (Optional)" />}
                    />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10 self-end mb-1" 
                    onClick={() => formMethods.setValue('sellerSection.sellerId', '')} // Example clear
                  />
                  {/* Plus button for adding another seller would use useFieldArray.append */}
                  {/* <Button type="button" icon={<TbPlus size={20} />} className="min-h-10 min-w-10 self-end mb-1" /> */}
                </div>
                <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={handleAddSeller}>Add Another Seller</Button>
                </div>
              </Card>

              <Card>
                <h5>Group A Notes</h5>
                <div className="mt-4 ">
                  <FormItem
                    invalid={!!formMethods.formState.errors.groupA_notes}
                    errorMessage={formMethods.formState.errors.groupA_notes?.message}
                  >
                    <Controller
                      name="groupA_notes"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Enter notes for Group A (Optional)" rows={3}/>}
                    />
                  </FormItem>
                  <div className="text-right mt-1">
                    <Button 
                        type="button" 
                        icon={<TbCopy />} 
                        onClick={() => {
                            navigator.clipboard.writeText(formMethods.getValues('groupA_notes') || '');
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
                    invalid={!!formMethods.formState.errors.buyerSection?.buyerId}
                    errorMessage={formMethods.formState.errors.buyerSection?.buyerId?.message}
                  >
                    <Controller
                      name="buyerSection.buyerId"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Search Buyer ID (Optional)" />}
                    />
                  </FormItem>
                  <Button type="button" icon={<TbTrash size={20} />} className="min-h-10 min-w-10 self-end mb-1" 
                    onClick={() => formMethods.setValue('buyerSection.buyerId', '')}
                  />
                  {/* <Button type="button" icon={<TbPlus size={20} />} className="min-h-10 min-w-10 self-end mb-1" /> */}
                </div>
                 <div className="text-right mt-2">
                  <Button type="button" icon={<TbPlus />} onClick={handleAddBuyer}>Add Another Buyer</Button>
                </div>
              </Card>

              <Card>
                <h5>Group B Notes</h5>
                <div className="mt-4 ">
                  <FormItem
                    invalid={!!formMethods.formState.errors.groupB_notes}
                    errorMessage={formMethods.formState.errors.groupB_notes?.message}
                  >
                    <Controller
                      name="groupB_notes"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} value={field.value ?? ''} textArea placeholder="Enter notes for Group B (Optional)" rows={3}/>}
                    />
                  </FormItem>
                  <div className="text-right mt-1">
                     <Button 
                        type="button" 
                        icon={<TbCopy />} 
                        onClick={() => {
                            navigator.clipboard.writeText(formMethods.getValues('groupB_notes') || '');
                            toast.push(<Notification title="Copied" type="info">Group B notes copied to clipboard.</Notification>)
                        }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
        
        {/* Footer with Save and Cancel buttons */}
        <Card bodyClass="flex justify-end gap-2" className='mt-4'>
          <Button type="button" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {/* No explicit "Draft" button in original, can be added if needed */}
          {/* <Button type="button" variant="twoTone" disabled={isSubmitting}>Draft</Button> */}
          <Button
            type="submit"
            form="createOfferForm"
            variant="solid"
            loading={isSubmitting}
            disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid}
          >
            {isSubmitting ? "Saving..." : "Save Offer"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default CreateOffer;