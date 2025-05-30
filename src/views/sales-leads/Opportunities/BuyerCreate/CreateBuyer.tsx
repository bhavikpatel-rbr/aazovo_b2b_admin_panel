import React, { useState, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui"; // Assuming Input is exported directly
import { Form, FormItem } from "@/components/ui/Form";
import { DatePicker } from "@/components/ui"; // Assuming DatePicker is exported directly
import { Button } from "@/components/ui";
import { BiChevronRight } from "react-icons/bi";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";

// --- Zod Schema for Create Buyer Form ---
// This schema is identical to the seller form, adjust if there are differences
const buyerFormSchema = z.object({
  opportunityId: z.string().optional().nullable(),
  buyListingId: z.string().optional().nullable(),
  sellListingId: z.string().optional().nullable(),
  productName: z.string().min(1, "Product Name is required."),
  productCategory: z.string().optional().nullable(),
  productSubcategory: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  priceMatchType: z.string().optional().nullable(),
  quantityMatch: z.string().optional().nullable(),
  locationMatch: z.string().optional().nullable(),
  matchScore: z
    .number({ invalid_type_error: "Match score must be a number." })
    .min(0, "Match score cannot be less than 0.")
    .max(100, "Match score cannot be greater than 100.")
    .nullable()
    .optional(),
  opportunityStatus: z.string().optional().nullable(),
  createdDate: z.date().nullable().optional(),
  lastUpdated: z.date().nullable().optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required."),
});

type BuyerFormData = z.infer<typeof buyerFormSchema>;

const CreateBuyer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<BuyerFormData>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      opportunityId: "",
      buyListingId: "",
      sellListingId: "",
      productName: "",
      productCategory: "",
      productSubcategory: "",
      brand: "",
      priceMatchType: "",
      quantityMatch: "",
      locationMatch: "",
      matchScore: null,
      opportunityStatus: "",
      createdDate: new Date(),
      lastUpdated: new Date(),
      assignedTo: "",
      notes: "",
      status: "pending", // Default status
    },
  });

  const onFormSubmit = useCallback(
    async (data: BuyerFormData) => {
      setIsSubmitting(true);

      const loggedPayload: any = { ...data };

      // Map and transform fields
      loggedPayload.opportunity_id = data.opportunityId;
      loggedPayload.buy_listing_id = data.buyListingId;
      loggedPayload.sell_listing_id = data.sellListingId;
      loggedPayload.product_category = data.productCategory;
      loggedPayload.product_subcategory = data.productSubcategory;
      loggedPayload.price_match_type = data.priceMatchType;
      loggedPayload.quantity_match_listing = data.quantityMatch;
      loggedPayload.location_match = data.locationMatch;
      loggedPayload.match_score = data.matchScore;
      loggedPayload.opportunity_status = data.opportunityStatus;
      // notes is already data.notes
      // status is already data.status
      loggedPayload.assigned_to = data.assignedTo;

      loggedPayload.created_at = data.createdDate
        ? dayjs(data.createdDate).toISOString()
        : null;
      loggedPayload.updated_at = data.lastUpdated
        ? dayjs(data.lastUpdated).toISOString()
        : null;
        
      loggedPayload.id = null; // Typically backend generated
      // Add other common fields from your target JSON if applicable
      // loggedPayload.spb_role = "Buyer"; // Example if you distinguish role

      console.log("--- CreateBuyer Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", data);
      console.log("2. Constructed Payload (for API/logging):", loggedPayload);
      console.log("--- End CreateBuyer Form Submission Log ---");

      await new Promise((res) => setTimeout(res, 1000));

      toast.push(
        <Notification title="Success" type="success">
          Buyer information saved. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      // navigate("/sales-leads/opportunities");
    },
    []
  );

  const handleCancel = () => {
    formMethods.reset();
    navigate("/sales-leads/opportunities");
    toast.push(<Notification title="Cancelled" type="info">Form cancelled.</Notification>);
  };

  const handleSaveAsDraft = () => {
    const currentValues = formMethods.getValues();
    const draftData = {
        ...currentValues,
        createdDate: currentValues.createdDate ? dayjs(currentValues.createdDate).toISOString() : null,
        lastUpdated: currentValues.lastUpdated ? dayjs(currentValues.lastUpdated).toISOString() : null,
    };
    console.log("Saving as draft (Create Buyer):", draftData);
    toast.push(
        <Notification title="Draft Saved" type="info">
            Buyer info saved as draft. (Simulated)
        </Notification>
    );
  };

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/opportunities">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Opportunities</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className="font-semibold text-primary">Add New Buyer</h6>
      </div>
      <Card>
        <h4 className="mb-6">Create Buyer</h4>
        <Form
          id="createBuyerForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit)}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <FormItem
              label="Opportunity ID"
              invalid={!!formMethods.formState.errors.opportunityId}
              errorMessage={formMethods.formState.errors.opportunityId?.message}
            >
              <Controller
                name="opportunityId"
                control={formMethods.control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Opportunity ID (Optional)" />}
              />
            </FormItem>

            <FormItem
              label="Buy Listing ID"
              invalid={!!formMethods.formState.errors.buyListingId}
              errorMessage={formMethods.formState.errors.buyListingId?.message}
            >
              <Controller
                name="buyListingId"
                control={formMethods.control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Buy Listing ID (Optional)" />}
              />
            </FormItem>

            <FormItem
              label="Sell Listing ID"
              invalid={!!formMethods.formState.errors.sellListingId}
              errorMessage={formMethods.formState.errors.sellListingId?.message}
            >
              <Controller
                name="sellListingId"
                control={formMethods.control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Sell Listing ID (Optional)" />}
              />
            </FormItem>

            <FormItem
              label="Product Name"
              invalid={!!formMethods.formState.errors.productName}
              errorMessage={formMethods.formState.errors.productName?.message}
            >
              <Controller
                name="productName"
                control={formMethods.control}
                render={({ field }) => <Input {...field} placeholder="Product Name" />}
              />
            </FormItem>

            <FormItem
              label="Product Category"
              invalid={!!formMethods.formState.errors.productCategory}
              errorMessage={formMethods.formState.errors.productCategory?.message}
            >
              <Controller
                name="productCategory"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ''} placeholder="Product Category (Optional)" />
                )}
              />
            </FormItem>

            <FormItem
              label="Product Subcategory"
              invalid={!!formMethods.formState.errors.productSubcategory}
              errorMessage={formMethods.formState.errors.productSubcategory?.message}
            >
              <Controller
                name="productSubcategory"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ''} placeholder="Product Subcategory (Optional)" />
                )}
              />
            </FormItem>

            <FormItem
              label="Brand"
              invalid={!!formMethods.formState.errors.brand}
              errorMessage={formMethods.formState.errors.brand?.message}
            >
              <Controller
                name="brand"
                control={formMethods.control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Brand (Optional)" />}
              />
            </FormItem>

            <FormItem
              label="Price Match Type"
              invalid={!!formMethods.formState.errors.priceMatchType}
              errorMessage={formMethods.formState.errors.priceMatchType?.message}
            >
              <Controller
                name="priceMatchType"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ''} placeholder="Exact / Range / Not Matched (Optional)" />
                )}
              />
            </FormItem>

            <FormItem
              label="Quantity Match"
              invalid={!!formMethods.formState.errors.quantityMatch}
              errorMessage={formMethods.formState.errors.quantityMatch?.message}
            >
              <Controller
                name="quantityMatch"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ''} placeholder="Sufficient / Partial / Not Matched (Optional)" />
                )}
              />
            </FormItem>

            <FormItem
              label="Location Match"
              invalid={!!formMethods.formState.errors.locationMatch}
              errorMessage={formMethods.formState.errors.locationMatch?.message}
            >
              <Controller
                name="locationMatch"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ''} placeholder="Local / National / Not Matched (Optional)" />
                )}
              />
            </FormItem>

            <FormItem
              label="Match Score (%)"
              invalid={!!formMethods.formState.errors.matchScore}
              errorMessage={formMethods.formState.errors.matchScore?.message}
            >
              <Controller
                name="matchScore"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    placeholder="0-100 (Optional)"
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Opportunity Status"
              invalid={!!formMethods.formState.errors.opportunityStatus}
              errorMessage={formMethods.formState.errors.opportunityStatus?.message}
            >
              <Controller
                name="opportunityStatus"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ''} placeholder="New / Shortlisted / Converted / Rejected (Optional)" />
                )}
              />
            </FormItem>

            <FormItem
              label="Created Date"
              invalid={!!formMethods.formState.errors.createdDate}
              errorMessage={formMethods.formState.errors.createdDate?.message}
            >
              <Controller
                name="createdDate"
                control={formMethods.control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    value={field.value}
                    inputFormat="YYYY-MM-DD"
                    placeholder="Select Created Date (Optional)"
                    onChange={(date) => field.onChange(date)}
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Last Updated"
              invalid={!!formMethods.formState.errors.lastUpdated}
              errorMessage={formMethods.formState.errors.lastUpdated?.message}
            >
              <Controller
                name="lastUpdated"
                control={formMethods.control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    value={field.value}
                    inputFormat="YYYY-MM-DD"
                    placeholder="Select Last Updated Date (Optional)"
                    onChange={(date) => field.onChange(date)}
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Assigned To"
              invalid={!!formMethods.formState.errors.assignedTo}
              errorMessage={formMethods.formState.errors.assignedTo?.message}
            >
              <Controller
                name="assignedTo"
                control={formMethods.control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Assigned To (Optional)" />}
              />
            </FormItem>

            <FormItem
              label="Notes"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.notes}
              errorMessage={formMethods.formState.errors.notes?.message}
            >
              <Controller
                name="notes"
                control={formMethods.control}
                render={({ field }) => (
                  <Input textArea {...field} value={field.value ?? ''} placeholder="Additional Notes (Optional)" rows={3} />
                )}
              />
            </FormItem>

            <FormItem
              label="Status"
              invalid={!!formMethods.formState.errors.status}
              errorMessage={formMethods.formState.errors.status?.message}
            >
              <Controller
                name="status"
                control={formMethods.control}
                render={({ field }) => <Input {...field} placeholder="pending / active / on_hold / closed" />}
              />
            </FormItem>
          </div>
        </Form>
      </Card>
      {/* Footer with Save and Cancel buttons */}
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSaveAsDraft} variant="twoTone" disabled={isSubmitting}>
          Draft
        </Button>
        <Button
          type="submit"
          form="createBuyerForm"
          variant="solid"
          loading={isSubmitting}
          disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Card>
    </>
  );
};

export default CreateBuyer;