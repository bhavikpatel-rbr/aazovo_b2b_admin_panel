import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui";
import { Form, FormItem } from "@/components/ui/Form";
import { DatePicker } from "@/components/ui";
import { Button } from "@/components/ui";
import { BiChevronRight } from "react-icons/bi";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Spinner from "@/components/ui/Spinner";
import Container from "@/components/shared/Container"; // Assuming you have this for layout

// --- Zod Schema for Seller Form (Same as Create) ---
const sellerFormSchema = z.object({
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
  createdDate: z.date().nullable().optional(), // Will be populated from API's created_at
  lastUpdated: z.date().nullable().optional(), // Will be populated from API's updated_at
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required."),
});

type SellerFormData = z.infer<typeof sellerFormSchema>;

// Type for API fetched seller data (adjust if your API structure differs)
export type ApiFetchedSellerItem = {
  id: number;
  opportunity_id: string | null;
  buy_listing_id: string | null;
  sell_listing_id: string | null;
  product_name: string;
  product_category: string | null;
  product_subcategory: string | null;
  brand: string | null;
  price_match_type: string | null;
  quantity_match_listing: string | null; // Corresponds to quantityMatch in form
  location_match: string | null;
  match_score: number | null;
  opportunity_status: string | null;
  created_at: string | null; // ISO string from API
  updated_at: string | null; // ISO string from API
  assigned_to: string | null;
  notes: string | null;
  status: string;
  // Add any other fields your API returns for a seller opportunity
};

// Dummy data source for seller opportunities
const initialDummyApiSellerItems: ApiFetchedSellerItem[] = [
  {
    id: 1,
    opportunity_id: "OPP-001",
    buy_listing_id: "BUY-LST-101",
    sell_listing_id: "SELL-LST-201",
    product_name: "Existing Laptop Model X",
    product_category: "Electronics",
    product_subcategory: "Laptops",
    brand: "TechBrand",
    price_match_type: "Exact",
    quantity_match_listing: "Sufficient",
    location_match: "Local",
    match_score: 85,
    opportunity_status: "Shortlisted",
    created_at: "2023-01-15T10:00:00Z",
    updated_at: "2023-01-20T14:30:00Z",
    assigned_to: "John Doe",
    notes: "Customer is very interested. Follow up next week.",
    status: "active",
  },
  {
    id: 2,
    opportunity_id: "OPP-002",
    buy_listing_id: null,
    sell_listing_id: "SELL-LST-202",
    product_name: "Industrial Drill Set",
    product_category: "Tools",
    product_subcategory: "Power Tools",
    brand: "WorkPro",
    price_match_type: "Range",
    quantity_match_listing: "Partial",
    location_match: "National",
    match_score: 70,
    opportunity_status: "New",
    created_at: "2023-02-01T09:00:00Z",
    updated_at: "2023-02-05T11:15:00Z",
    assigned_to: "Jane Smith",
    notes: "Needs pricing confirmation.",
    status: "pending",
  },
];


const EditSellerForm = () => {
  const navigate = useNavigate();
  const { id: itemIdFromParams } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToEditApiData, setItemToEditApiData] = useState<ApiFetchedSellerItem | null>(null);

  const formMethods = useForm<SellerFormData>({
    resolver: zodResolver(sellerFormSchema),
    // Default values will be set by reset in useEffect
  });

  useEffect(() => {
    if (!itemIdFromParams) {
      toast.push(<Notification title="Error" type="danger">Invalid item ID.</Notification>);
      navigate("/sales-leads/opportunities"); // Or your seller list path
      return;
    }
    setIsLoading(true);
    const itemId = parseInt(itemIdFromParams, 10);

    // Simulate API fetch
    setTimeout(() => { // Simulate network delay
      const fetchedApiItem = initialDummyApiSellerItems.find(item => item.id === itemId);

      if (fetchedApiItem) {
        setItemToEditApiData(fetchedApiItem);

        // Map API data to form data structure
        formMethods.reset({
          opportunityId: fetchedApiItem.opportunity_id,
          buyListingId: fetchedApiItem.buy_listing_id,
          sellListingId: fetchedApiItem.sell_listing_id,
          productName: fetchedApiItem.product_name,
          productCategory: fetchedApiItem.product_category,
          productSubcategory: fetchedApiItem.product_subcategory,
          brand: fetchedApiItem.brand,
          priceMatchType: fetchedApiItem.price_match_type,
          quantityMatch: fetchedApiItem.quantity_match_listing,
          locationMatch: fetchedApiItem.location_match,
          matchScore: fetchedApiItem.match_score,
          opportunityStatus: fetchedApiItem.opportunity_status,
          createdDate: fetchedApiItem.created_at ? dayjs(fetchedApiItem.created_at).toDate() : null,
          lastUpdated: fetchedApiItem.updated_at ? dayjs(fetchedApiItem.updated_at).toDate() : null,
          assignedTo: fetchedApiItem.assigned_to,
          notes: fetchedApiItem.notes,
          status: fetchedApiItem.status,
        });
      } else {
        toast.push(<Notification title="Error" type="danger">Seller opportunity not found.</Notification>);
        navigate("/sales-leads/opportunities"); // Or your seller list path
      }
      setIsLoading(false);
    }, 500);
  }, [itemIdFromParams, navigate, formMethods]);

  const onFormSubmit = useCallback(
    async (data: SellerFormData) => {
      if (!itemIdFromParams || !itemToEditApiData) {
        toast.push(<Notification title="Error" type="danger">Cannot submit. Item data missing.</Notification>);
        return;
      }
      setIsSubmitting(true);

      const loggedPayload: any = { 
        ...data, // Start with all current form data
        id: parseInt(itemIdFromParams, 10), // Add the ID
      };

      // Map and transform fields for the API payload
      loggedPayload.opportunity_id = data.opportunityId;
      loggedPayload.buy_listing_id = data.buyListingId;
      loggedPayload.sell_listing_id = data.sellListingId;
      // productName, productCategory, productSubcategory, brand are already in data with correct names from form

      loggedPayload.price_match_type = data.priceMatchType;
      loggedPayload.quantity_match_listing = data.quantityMatch; // Ensure API key name
      loggedPayload.location_match = data.locationMatch;
      loggedPayload.match_score = data.matchScore;
      loggedPayload.opportunity_status = data.opportunityStatus;
      loggedPayload.notes = data.notes;
      loggedPayload.status = data.status;
      loggedPayload.assigned_to = data.assignedTo;

      // Preserve original created_at from API, format lastUpdated (which is now updated_at for API)
      loggedPayload.created_at = itemToEditApiData.created_at; // Preserve original
      loggedPayload.updated_at = data.lastUpdated // This is effectively the new updated_at
        ? dayjs(data.lastUpdated).toISOString() 
        : new Date().toISOString(); // Or use server time

      // Remove form-specific date fields if they differ from API keys
      delete loggedPayload.createdDate;
      delete loggedPayload.lastUpdated;


      console.log("--- EditSellerForm Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", data);
      console.log("2. Item being edited (original API data):", itemToEditApiData);
      console.log("3. Constructed Payload (for API/logging):", loggedPayload);
      console.log("--- End EditSellerForm Submission Log ---");

      await new Promise((res) => setTimeout(res, 1000)); // Simulate API call

      toast.push(
        <Notification title="Success" type="success">
          Seller information updated. (Simulated)
        </Notification>
      );
      setIsSubmitting(false);
      // navigate("/sales-leads/opportunities"); // Or wherever you want to redirect
    },
    [itemIdFromParams, itemToEditApiData] // Added itemToEditApiData
  );

  const handleCancel = () => {
    navigate("/sales-leads/opportunities"); // Or your seller list path
  };

  const handleSaveAsDraft = () => {
    if (!itemIdFromParams) return;
    const currentValues = formMethods.getValues();
    const draftData = {
        ...currentValues,
        id: parseInt(itemIdFromParams, 10),
        createdDate: currentValues.createdDate ? dayjs(currentValues.createdDate).toISOString() : null,
        lastUpdated: currentValues.lastUpdated ? dayjs(currentValues.lastUpdated).toISOString() : null,
    };
    console.log("Saving as draft (Edit Seller):", draftData);
    toast.push(
        <Notification title="Draft Saved" type="info">
            Seller info saved as draft. (Simulated)
        </Notification>
    );
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-60"> {/* Adjust height as needed */}
          <Spinner size={40} />
          <p className="ml-2">Loading seller details...</p>
        </div>
      </Container>
    );
  }
  
  if (!itemToEditApiData && !isLoading) { // Should be caught by useEffect navigation, but as a safeguard
    return (
        <Container>
            <p>Seller opportunity not found.</p>
            <Button onClick={() => navigate("/sales-leads/opportunities")}>Go Back</Button>
        </Container>
    )
  }

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/opportunities">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Opportunities</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className="font-semibold text-primary">Edit Seller (ID: {itemIdFromParams})</h6>
      </div>
      <Card>
        <h4 className="mb-6">Edit Seller Information</h4>
        <Form
          id="editSellerForm"
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
                    disabled // Usually created date is not editable
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
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSaveAsDraft} variant="twoTone" disabled={isSubmitting}>
          Draft
        </Button>
        <Button
          type="submit"
          form="editSellerForm"
          variant="solid"
          loading={isSubmitting}
          disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </>
  );
};

export default EditSellerForm;