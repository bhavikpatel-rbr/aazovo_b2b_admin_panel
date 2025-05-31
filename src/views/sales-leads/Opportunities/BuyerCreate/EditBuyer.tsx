import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect } from "@/components/ui"; // Ensure UiSelect is imported
import { Form, FormItem } from "@/components/ui/Form";
import { DatePicker } from "@/components/ui";
import { Button } from "@/components/ui";
import { BiChevronRight } from "react-icons/bi";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Spinner from "@/components/ui/Spinner";
import Container from "@/components/shared/Container";

// Redux
import { useAppDispatch } from '@/reduxtool/store'; // VERIFY PATH
import { shallowEqual } from 'react-redux';
import { useSelector } from 'react-redux';

import {
    getAllProductAction,
    getCategoriesAction,
    getSubcategoriesByCategoryIdAction,
    getBrandAction,
    // Placeholder for actual buyer update action
    // updateBuyerOpportunityAction, 
} from '@/reduxtool/master/middleware'; // VERIFY PATH & ACTION NAMES
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH

// --- Define Option Types for Selects ---
type SelectOption = { value: string; label: string; id?: number | string };
type ApiLookupItem = { id: string | number; name: string; [key: string]: any };

// --- Zod Schema for Buyer Form ---
const buyerFormSchema = z.object({
  opportunityId: z.string().optional().nullable(),
  buyListingId: z.string().optional().nullable(),
  sellListingId: z.string().optional().nullable(),
  
  // Changed to store IDs
  productId: z.string().min(1, "Product is required."),
  productCategoryId: z.string().min(1, "Product Category is required.").optional().nullable(),
  productSubcategoryId: z.string().optional().nullable(),
  brandId: z.string().min(1, "Brand is required.").optional().nullable(),

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
  createdDate: z.date().nullable().optional(), // For display, not submission if API handles created_at
  lastUpdated: z.date().nullable().optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required."),
});

type BuyerFormData = z.infer<typeof buyerFormSchema>;

// Type for API fetched buyer data
// IMPORTANT: Update this to include product_id, category_id, subcategory_id, brand_id
export type ApiFetchedBuyerItem = {
  id: number;
  opportunity_id: string | null;
  buy_listing_id: string | null;
  sell_listing_id: string | null;
  
  product_id: string | number | null; // Store ID from API
  product_name: string; // Keep name for display if needed

  category_id: string | number | null; // Store ID from API
  product_category: string | null; // Keep name for display if needed
  
  subcategory_id: string | number | null; // Store ID from API
  product_subcategory: string | null; // Keep name for display if needed

  brand_id: string | number | null; // Store ID from API
  brand: string | null; // Keep name for display if needed
  
  price_match_type: string | null;
  quantity_match_listing: string | null;
  location_match: string | null;
  match_score: number | null;
  opportunity_status: string | null;
  created_at: string | null; // ISO String from API
  updated_at: string | null; // ISO String from API
  assigned_to: string | null;
  notes: string | null;
  status: string;
};

// Dummy data source - UPDATE THIS with *_id fields
const initialDummyApiBuyerItems: ApiFetchedBuyerItem[] = [
  {
    id: 1,
    opportunity_id: "OPP-B001",
    buy_listing_id: "BUY-LST-B101",
    sell_listing_id: null,
    product_id: "prod_chairs_001", // Example ID
    product_name: "Bulk Order - Office Chairs",
    category_id: "cat_furniture_001", // Example ID
    product_category: "Furniture",
    subcategory_id: "sub_office_furn_001", // Example ID
    product_subcategory: "Office Furniture",
    brand_id: "brand_comfy_001", // Example ID
    brand: "ComfySeat",
    price_match_type: "Not Matched",
    quantity_match_listing: "Sufficient",
    location_match: "National",
    match_score: 60,
    opportunity_status: "Converted",
    created_at: "2023-03-10T11:00:00Z",
    updated_at: "2023-03-15T16:30:00Z",
    assigned_to: "Alice Brown",
    notes: "Order placed. Awaiting shipment details.",
    status: "closed",
  },
  {
    id: 2,
    opportunity_id: "OPP-B002",
    buy_listing_id: "BUY-LST-B102",
    sell_listing_id: "SELL-LST-S305",
    product_id: "prod_gpu_002", // Example ID
    product_name: "High-End Graphics Card",
    category_id: "cat_electronics_002", // Example ID
    product_category: "Electronics",
    subcategory_id: "sub_comp_parts_002", // Example ID
    product_subcategory: "Computer Components",
    brand_id: "brand_giga_002", // Example ID
    brand: "GigaPower",
    price_match_type: "Exact",
    quantity_match_listing: "Sufficient",
    location_match: "Local",
    match_score: 92,
    opportunity_status: "Shortlisted",
    created_at: "2023-04-01T13:00:00Z",
    updated_at: "2023-04-03T10:00:00Z",
    assigned_to: "Bob Green",
    notes: "Needs to confirm budget.",
    status: "active",
  },
];

const EditBuyerForm = () => {
  const navigate = useNavigate();
  const { id: itemIdFromParams } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(true); // For fetching the item to edit
  const [initialDataFetched, setInitialDataFetched] = useState(false); // For dropdown options
  const [itemToEditApiData, setItemToEditApiData] = useState<ApiFetchedBuyerItem | null>(null);

  const {
    productsMasterData = [],
    CategoriesData = [],
    subCategoriesForSelectedCategoryData = [],
    BrandData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const formMethods = useForm<BuyerFormData>({
    resolver: zodResolver(buyerFormSchema),
    // Default values will be overridden by reset
  });
  const { control, handleSubmit, watch, setValue, formState, reset } = formMethods;
  const { errors, isDirty, isValid } = formState;


  // Fetch dropdown options and then the item to edit
  useEffect(() => {
    const loadData = async () => {
      if (!itemIdFromParams) {
        toast.push(<Notification title="Error" type="danger">Invalid item ID.</Notification>);
        navigate("/sales-leads/opportunities");
        return;
      }

      setIsLoadingItem(true); // Start loading item
      try {
        // Fetch dropdown options first or in parallel
        await Promise.all([
          dispatch(getAllProductAction({})),
          dispatch(getCategoriesAction()),
          dispatch(getBrandAction()),
        ]);
        setInitialDataFetched(true); // Mark dropdown options as fetched

        // Simulate fetching the specific item
        const itemId = parseInt(itemIdFromParams, 10);
        // In a real app, this would be an API call:
        // const fetchedApiItem = await dispatch(getBuyerOpportunityByIdAction(itemId)).unwrap();
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
        const fetchedApiItem = initialDummyApiBuyerItems.find(item => item.id === itemId);

        if (fetchedApiItem) {
          setItemToEditApiData(fetchedApiItem);
          reset({ // Use reset to populate the form
            opportunityId: fetchedApiItem.opportunity_id,
            buyListingId: fetchedApiItem.buy_listing_id,
            sellListingId: fetchedApiItem.sell_listing_id,
            // IMPORTANT: Use stringified IDs from fetchedApiItem
            productId: fetchedApiItem.product_id ? String(fetchedApiItem.product_id) : "",
            productCategoryId: fetchedApiItem.category_id ? String(fetchedApiItem.category_id) : null,
            productSubcategoryId: fetchedApiItem.subcategory_id ? String(fetchedApiItem.subcategory_id) : null,
            brandId: fetchedApiItem.brand_id ? String(fetchedApiItem.brand_id) : null,
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
          // If a category was loaded, fetch its subcategories
          if (fetchedApiItem.category_id) {
            dispatch(getSubcategoriesByCategoryIdAction(String(fetchedApiItem.category_id)));
          }
        } else {
          toast.push(<Notification title="Error" type="danger">Buyer opportunity not found.</Notification>);
          navigate("/sales-leads/opportunities");
        }
      } catch (error) {
        console.error("Error loading data for edit form:", error);
        toast.push(<Notification title="Loading Error" type="danger">Could not load data.</Notification>);
        navigate("/sales-leads/opportunities");
      } finally {
        setIsLoadingItem(false); // Finish loading item
      }
    };
    loadData();
  }, [itemIdFromParams, navigate, dispatch, reset]);

  const productOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((p: ApiLookupItem) => ({ value: String(p.id), label: p.name, id: p.id }));
  }, [productsMasterData]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    return CategoriesData.map((c: ApiLookupItem) => ({ value: String(c.id), label: c.name, id: c.id }));
  }, [CategoriesData]);

  const brandOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(BrandData)) return [];
    return BrandData.map((b: ApiLookupItem) => ({ value: String(b.id), label: b.name, id: b.id }));
  }, [BrandData]);

  const subcategoryOptionsForForm: SelectOption[] = useMemo(() => {
    if (!Array.isArray(subCategoriesForSelectedCategoryData)) return [];
    return subCategoriesForSelectedCategoryData.map((sc: ApiLookupItem) => ({ value: String(sc.id), label: sc.name, id: sc.id }));
  }, [subCategoriesForSelectedCategoryData]);
  
  const watchedProductCategoryId = watch("productCategoryId");
  useEffect(() => {
    // Only run if not initial load (reset might trigger this) and category actually changes
    if (initialDataFetched && watchedProductCategoryId && watchedProductCategoryId !== (itemToEditApiData?.category_id ? String(itemToEditApiData.category_id) : null)) {
      dispatch(getSubcategoriesByCategoryIdAction(watchedProductCategoryId));
      setValue("productSubcategoryId", null, { shouldValidate: true, shouldDirty: true });
    } else if (initialDataFetched && !watchedProductCategoryId) {
        // Category cleared by user
        setValue("productSubcategoryId", null, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedProductCategoryId, dispatch, setValue, initialDataFetched, itemToEditApiData]);


  const onFormSubmit = useCallback(
    async (data: BuyerFormData) => {
      if (!itemIdFromParams || !itemToEditApiData) {
         toast.push(<Notification title="Error" type="danger">Cannot submit. Item data missing.</Notification>);
        return;
      }
      setIsSubmitting(true);

      const selectedProduct = productOptions.find(p => p.value === data.productId);
      const selectedCategory = categoryOptions.find(c => c.value === data.productCategoryId);
      const selectedSubcategory = subcategoryOptionsForForm.find(sc => sc.value === data.productSubcategoryId);
      const selectedBrand = brandOptions.find(b => b.value === data.brandId);

      const loggedPayload: any = { 
        id: parseInt(itemIdFromParams, 10), // ID of the item being edited
        // Map form data (which uses IDs for dropdowns) to API structure
        opportunity_id: data.opportunityId,
        buy_listing_id: data.buyListingId,
        sell_listing_id: data.sellListingId,
        
        product_id: data.productId, 
        product_name_selected: selectedProduct?.label,
        
        category_id: data.productCategoryId,
        category_name_selected: selectedCategory?.label,

        subcategory_id: data.productSubcategoryId,
        subcategory_name_selected: selectedSubcategory?.label,
        
        brand_id: data.brandId,
        brand_name_selected: selectedBrand?.label,

        price_match_type: data.priceMatchType,
        quantity_match_listing: data.quantityMatch,
        location_match: data.locationMatch,
        match_score: data.matchScore,
        opportunity_status: data.opportunityStatus,
        assigned_to: data.assignedTo,
        notes: data.notes,
        status: data.status,
        
        created_at: itemToEditApiData.created_at, // Preserve original created_at
        updated_at: new Date().toISOString(), // Set new updated_at
      };
      delete loggedPayload.product_name_selected;
      delete loggedPayload.category_name_selected;
      delete loggedPayload.subcategory_name_selected;
      delete loggedPayload.brand_name_selected;
      // Delete form-specific date fields if not part of API payload for update
      delete loggedPayload.createdDate; 
      delete loggedPayload.lastUpdated;


      console.log("--- EditBuyerForm Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", data);
      console.log("2. Item being edited (original API data):", itemToEditApiData);
      console.log("3. Constructed Payload (for API/logging):", loggedPayload);
      console.log("--- End EditBuyerForm Submission Log ---");

      try {
        // await dispatch(updateBuyerOpportunityAction(loggedPayload)).unwrap(); // Actual update action
        await new Promise((res) => setTimeout(res, 1000)); // Simulate API
        toast.push(<Notification title="Success" type="success">Buyer opportunity updated. (Simulated)</Notification>);
        // navigate("/sales-leads/opportunities"); // Or to item details page
      } catch (apiError: any) {
        toast.push(<Notification title="Update Error" type="danger">{apiError?.message || "Failed to update opportunity."}</Notification>);
      } finally {
        setIsSubmitting(false);
      }
    },
    [itemIdFromParams, itemToEditApiData, dispatch, navigate, productOptions, categoryOptions, subcategoryOptionsForForm, brandOptions]
  );

  const handleCancel = () => {
    navigate("/sales-leads/opportunities");
  };
  
  const handleSaveAsDraft = () => { // This might not be typical for an edit form, but kept if needed
    if (!itemIdFromParams) return;
    const currentValues = formMethods.getValues();
    const draftData = {
        ...currentValues,
        id: parseInt(itemIdFromParams, 10),
        // form's createdDate and lastUpdated are Date objects or null
        created_at_form: currentValues.createdDate ? dayjs(currentValues.createdDate).toISOString() : null,
        last_updated_form: currentValues.lastUpdated ? dayjs(currentValues.lastUpdated).toISOString() : null,
    };
    console.log("Saving as draft (Edit Buyer):", draftData);
    toast.push(<Notification title="Draft Changes Saved" type="info">Buyer changes saved as draft. (Simulated)</Notification>);
  };

  const isLoading = isLoadingItem || (masterLoadingStatus === "idle" && !initialDataFetched);

  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-60">
          <Spinner size={40} />
          <p className="ml-2">Loading buyer details...</p>
        </div>
      </Container>
    );
  }
  
   if (!itemToEditApiData && !isLoadingItem) { // Check after item loading attempt
    return (
        <Container>
            <p>Buyer opportunity not found.</p>
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
        <h6 className="font-semibold text-primary">Edit Buyer Opportunity (ID: {itemIdFromParams})</h6>
      </div>
      <Card>
        <h4 className="mb-6">Edit Buyer Information</h4>
        <Form id="editBuyerForm" onSubmit={handleSubmit(onFormSubmit)} >
          <div className="grid md:grid-cols-3 gap-4">
            <FormItem label="Opportunity ID" invalid={!!errors.opportunityId} errorMessage={errors.opportunityId?.message} >
              <Controller name="opportunityId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Opportunity ID (Optional)" />} />
            </FormItem>
            <FormItem label="Buy Listing ID" invalid={!!errors.buyListingId} errorMessage={errors.buyListingId?.message} >
              <Controller name="buyListingId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Buy Listing ID (Optional)" />} />
            </FormItem>
            <FormItem label="Sell Listing ID" invalid={!!errors.sellListingId} errorMessage={errors.sellListingId?.message} >
              <Controller name="sellListingId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Sell Listing ID (Optional)" />} />
            </FormItem>

            <FormItem label="Product*" invalid={!!errors.productId} errorMessage={errors.productId?.message} >
              <Controller name="productId" control={control} render={({ field }) => (
                  <UiSelect {...field} placeholder="Select Product" options={productOptions}
                    isLoading={masterLoadingStatus === "idle" && !initialDataFetched && productOptions.length === 0}
                    value={productOptions.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                    isClearable />
                )} />
            </FormItem>
            <FormItem label="Product Category*" invalid={!!errors.productCategoryId} errorMessage={errors.productCategoryId?.message} >
              <Controller name="productCategoryId" control={control} render={({ field }) => (
                  <UiSelect {...field} placeholder="Select Category" options={categoryOptions}
                    isLoading={masterLoadingStatus === "idle" && !initialDataFetched && categoryOptions.length === 0}
                    value={categoryOptions.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                    isClearable />
                )} />
            </FormItem>
            <FormItem label="Product Subcategory" invalid={!!errors.productSubcategoryId} errorMessage={errors.productSubcategoryId?.message} >
              <Controller name="productSubcategoryId" control={control} render={({ field }) => (
                  <UiSelect {...field} placeholder="Select Subcategory" options={subcategoryOptionsForForm}
                    isLoading={masterLoadingStatus === "idle" && watchedProductCategoryId !== null && subcategoryOptionsForForm.length === 0}
                    isDisabled={!watchedProductCategoryId || (masterLoadingStatus !== "idle" && subcategoryOptionsForForm.length === 0 && !!watchedProductCategoryId)}
                    value={subcategoryOptionsForForm.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                    isClearable />
                )} />
            </FormItem>
            <FormItem label="Brand*" invalid={!!errors.brandId} errorMessage={errors.brandId?.message} >
              <Controller name="brandId" control={control} render={({ field }) => (
                  <UiSelect {...field} placeholder="Select Brand" options={brandOptions}
                    isLoading={masterLoadingStatus === "idle" && !initialDataFetched && brandOptions.length === 0}
                    value={brandOptions.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                    isClearable />
                )} />
            </FormItem>
            
            {/* Other fields remain the same as CreateBuyerForm */}
            <FormItem label="Price Match Type" invalid={!!errors.priceMatchType} errorMessage={errors.priceMatchType?.message} >
              <Controller name="priceMatchType" control={control} render={({ field }) => (<Input {...field} value={field.value ?? ''} placeholder="Exact / Range (Optional)" /> )} />
            </FormItem>
            <FormItem label="Quantity Match" invalid={!!errors.quantityMatch} errorMessage={errors.quantityMatch?.message} >
              <Controller name="quantityMatch" control={control} render={({ field }) => (<Input {...field} value={field.value ?? ''} placeholder="Sufficient / Partial (Optional)" /> )} />
            </FormItem>
            <FormItem label="Location Match" invalid={!!errors.locationMatch} errorMessage={errors.locationMatch?.message} >
              <Controller name="locationMatch" control={control} render={({ field }) => (<Input {...field} value={field.value ?? ''} placeholder="Local / National (Optional)" /> )} />
            </FormItem>
            <FormItem label="Match Score (%)" invalid={!!errors.matchScore} errorMessage={errors.matchScore?.message} >
              <Controller name="matchScore" control={control} render={({ field }) => (<Input {...field} value={field.value ?? ''} type="number" placeholder="0-100 (Optional)" onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /> )} />
            </FormItem>
                        <FormItem
                          label="Opportunity Status"
                          invalid={!!errors.opportunityStatus}
                          errorMessage={errors.opportunityStatus?.message}
                        >
                          <Controller
                            name="opportunityStatus"
                            control={control}
                            render={({ field }) => (
                              <UiSelect
                                {...field}
                                placeholder="Select Opportunity Status"
                                options={[
                                  { value: "New", label: "New" },
                                  { value: "Shortlisted", label: "Shortlisted" },
                                ]}
                                value={
                                  [
                                    { value: "New", label: "New" },
                                    { value: "Shortlisted", label: "Shortlisted" },
                                  ].find(opt => opt.value === field.value) || null
                                }
                                onChange={option => field.onChange(option ? option.value : "")}
                                isClearable
                              />
                            )}
                          />
                        </FormItem>

            <FormItem label="Created Date" invalid={!!errors.createdDate} errorMessage={errors.createdDate?.message} >
              <Controller name="createdDate" control={control} render={({ field }) => (<DatePicker disabled {...field} value={field.value} inputFormat="YYYY-MM-DD" placeholder="Created Date" /> )} />
            </FormItem>
            <FormItem label="Last Updated" invalid={!!errors.lastUpdated} errorMessage={errors.lastUpdated?.message} >
              <Controller name="lastUpdated" control={control} render={({ field }) => (<DatePicker {...field} value={field.value} inputFormat="YYYY-MM-DD" placeholder="Select Date (Optional)" onChange={(date) => field.onChange(date)} /> )} />
            </FormItem>
            <FormItem label="Assigned To" invalid={!!errors.assignedTo} errorMessage={errors.assignedTo?.message} >
              <Controller name="assignedTo" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Assignee Name (Optional)" />} />
            </FormItem>
            <FormItem label="Notes" className="md:col-span-2" invalid={!!errors.notes} errorMessage={errors.notes?.message} >
              <Controller name="notes" control={control} render={({ field }) => (<Input textArea {...field} value={field.value ?? ''} placeholder="Additional Notes (Optional)" rows={3} /> )} />
            </FormItem>
            <FormItem
              label="Status"
              invalid={!!formMethods.formState.errors.status}
              errorMessage={formMethods.formState.errors.status?.message}
            >
              <Controller
                name="status"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    placeholder="Select Status"
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "active", label: "Active" },
                      { value: "on_hold", label: "On Hold" },
                      { value: "closed", label: "Closed" },
                    ]}
                    value={
                      [
                        { value: "pending", label: "Pending" },
                        { value: "active", label: "Active" },
                        { value: "on_hold", label: "On Hold" },
                        { value: "closed", label: "Closed" },
                      ].find(opt => opt.value === field.value) || null
                    }
                    onChange={option => field.onChange(option ? option.value : "")}
                    isClearable
                  />
                )}
              />
            </FormItem>

          </div>
        </Form>
      </Card>
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting}> Cancel </Button>
        <Button type="button" onClick={handleSaveAsDraft} variant="twoTone" disabled={isSubmitting}> Draft </Button>
        <Button type="submit" form="editBuyerForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !isDirty || !isValid } >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Card>
    </>
  );
};

export default EditBuyerForm;