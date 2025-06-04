import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect } from "@/components/ui";
import { Form, FormItem } from "@/components/ui/Form";
import { DatePicker } from "@/components/ui";
import { Button } from "@/components/ui";
import { BiChevronRight } from "react-icons/bi";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Spinner from "@/components/ui/Spinner";

// Redux
import { useAppDispatch } from '@/reduxtool/store'; // VERIFY PATH
import { shallowEqual } from 'react-redux';
import { useSelector } from 'react-redux';

import {
    getAllProductAction,
    getCategoriesAction,
    getSubcategoriesByCategoryIdAction,
    getBrandAction,
    // Placeholder for actual buyer creation action
    // createBuyerOpportunityAction, 
} from '@/reduxtool/master/middleware'; // VERIFY PATH & ACTION NAMES
import { masterSelector } from '@/reduxtool/master/masterSlice'; // VERIFY PATH

// --- Define Option Types for Selects ---
type SelectOption = { value: string; label: string; id?: number | string }; // id is original id, value is stringified id
type ApiLookupItem = { id: string | number; name: string; [key: string]: any }; // For data from API

// --- Zod Schema for Create Buyer Form ---
const buyerFormSchema = z.object({
  opportunityId: z.string().optional().nullable(),
  buyListingId: z.string().optional().nullable(),
  sellListingId: z.string().optional().nullable(),
  
  productId: z.string().min(1, "Product is required."), 
  productCategoryId: z.string().min(1,"Product Category is required.").optional().nullable(),
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
  createdDate: z.date().nullable().optional(),
  lastUpdated: z.date().nullable().optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required."),
});

type BuyerFormData = z.infer<typeof buyerFormSchema>;


const CreateBuyer = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // isLoadingOptions will be true until all initial dropdown data is attempted to be fetched
  const [initialDataFetched, setInitialDataFetched] = useState(false);


  const {
    productsMasterData = [],
    CategoriesData = [],
    subCategoriesForSelectedCategoryData = [], // Holds subcategories for the form
    BrandData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const formMethods = useForm<BuyerFormData>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      opportunityId: "",
      buyListingId: "",
      sellListingId: "",
      productId: "", 
      productCategoryId: null,
      productSubcategoryId: null,
      brandId: null,
      priceMatchType: "",
      quantityMatch: "",
      locationMatch: "",
      matchScore: null,
      opportunityStatus: "",
      createdDate: new Date(),
      lastUpdated: new Date(),
      assignedTo: "",
      notes: "",
      status: "pending",
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, watch, setValue, formState, reset } = formMethods;
  const { errors, isDirty, isValid } = formState;

  // Fetch initial options on mount
  useEffect(() => {
    const fetchInitialOptions = async () => {
      try {
        await Promise.all([
          dispatch(getAllProductAction({})), // Pass empty object or required params
          dispatch(getCategoriesAction()),
          dispatch(getBrandAction()),
        ]);
      } catch (error) {
        console.error("Failed to fetch initial dropdown data:", error);
        toast.push(<Notification title="Data Load Error" type="danger">Could not load initial selection options.</Notification>);
      } finally {
        setInitialDataFetched(true);
      }
    };
    fetchInitialOptions();
  }, [dispatch]);

  // --- Prepare options for Select components from Redux state ---
  const productOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: ApiLookupItem) => ({
      value: String(product.id), // Value is stringified ID
      label: product.name,
      id: product.id,
    }));
  }, [productsMasterData]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    return CategoriesData.map((category: ApiLookupItem) => ({
      value: String(category.id), // Value is stringified ID
      label: category.name,
      id: category.id,
    }));
  }, [CategoriesData]);

  const brandOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(BrandData)) return [];
    return BrandData.map((brand: ApiLookupItem) => ({
      value: String(brand.id), // Value is stringified ID
      label: brand.name,
      id: brand.id,
    }));
  }, [BrandData]);

  const subcategoryOptionsForForm: SelectOption[] = useMemo(() => {
    if (!Array.isArray(subCategoriesForSelectedCategoryData)) return [];
    return subCategoriesForSelectedCategoryData.map((subcategory: ApiLookupItem) => ({
      value: String(subcategory.id), // Value is stringified ID
      label: subcategory.name,
      id: subcategory.id,
    }));
  }, [subCategoriesForSelectedCategoryData]);

  // Update subcategory options when category changes
  const watchedProductCategoryId = watch("productCategoryId");
  useEffect(() => {
    if (watchedProductCategoryId) {
      dispatch(getSubcategoriesByCategoryIdAction(watchedProductCategoryId));
      setValue("productSubcategoryId", null, { shouldValidate: true, shouldDirty: true });
    } else {
      // If category is cleared, clear subcategory options (Redux state should reflect this)
      // dispatch(clearSubcategoriesAction()); // You might need an action to clear them from Redux state
       setValue("productSubcategoryId", null, { shouldValidate: true, shouldDirty: true }); // Also clear form value
    }
  }, [watchedProductCategoryId, dispatch, setValue]);


  const onFormSubmit = useCallback(
    async (data: BuyerFormData) => {
      setIsSubmitting(true);
      
      // Find selected product, category, brand names for logging if needed
      const selectedProduct = productOptions.find(p => p.value === data.productId);
      const selectedCategory = categoryOptions.find(c => c.value === data.productCategoryId);
      const selectedSubcategory = subcategoryOptionsForForm.find(sc => sc.value === data.productSubcategoryId);
      const selectedBrand = brandOptions.find(b => b.value === data.brandId);

      const loggedPayload: any = { 
        ...data, // Includes all form fields with their current values (mostly IDs)
        // Map to desired API field names, converting data types if necessary
        opportunity_id: data.opportunityId,
        buy_listing_id: data.buyListingId,
        sell_listing_id: data.sellListingId,
        
        product_id: data.productId, // Assuming API expects product_id
        product_name_selected: selectedProduct?.label, // For logging or if API needs name too
        
        category_id: data.productCategoryId, // Assuming API expects category_id
        category_name_selected: selectedCategory?.label,

        subcategory_id: data.productSubcategoryId,
        subcategory_name_selected: selectedSubcategory?.label,
        
        brand_id: data.brandId,
        brand_name_selected: selectedBrand?.label,

        price_match_type: data.priceMatchType,
        quantity_match_listing: data.quantityMatch, // Renamed based on WallItemAdd example
        location_match: data.locationMatch,
        match_score: data.matchScore, // Already a number or null
        opportunity_status: data.opportunityStatus,
        assigned_to: data.assignedTo,
        notes: data.notes,
        status: data.status,
        created_at: data.createdDate ? dayjs(data.createdDate).toISOString() : null,
        updated_at: data.lastUpdated ? dayjs(data.lastUpdated).toISOString() : null,
        // id: null, // Usually set by backend for new entries
      };
      // Remove helper _selected fields if not for API
      delete loggedPayload.product_name_selected;
      delete loggedPayload.category_name_selected;
      delete loggedPayload.subcategory_name_selected;
      delete loggedPayload.brand_name_selected;


      console.log("--- CreateBuyer Form Submission Log ---");
      console.log("1. Original formData (from react-hook-form):", data);
      console.log("2. Constructed Payload (for API/logging):", loggedPayload);
      console.log("--- End CreateBuyer Form Submission Log ---");
      
      try {
        // Placeholder for actual API call
        // await dispatch(createBuyerOpportunityAction(loggedPayload)).unwrap();
        await new Promise((res) => setTimeout(res, 1000)); // Simulate API
        toast.push(<Notification title="Success" type="success">Buyer opportunity created. (Simulated)</Notification>);
        reset(); // Reset form on success
        // navigate("/sales-leads/opportunities"); // Or to a relevant page
      } catch (apiError: any) {
        toast.push(<Notification title="Error" type="danger">{apiError?.message || "Failed to create buyer opportunity."}</Notification>);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, reset, navigate, productOptions, categoryOptions, subcategoryOptionsForForm, brandOptions]
  );

  const handleCancel = () => {
    reset();
    navigate("/sales-leads/opportunities"); // Or appropriate back/cancel route
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
    toast.push(<Notification title="Draft Saved" type="info">Buyer info saved as draft. (Simulated)</Notification>);
  };
  
  //isLoadingOptions will be true if initial data hasn't been fetched OR master slice is still loading
  const isLoadingOptions = !initialDataFetched || masterLoadingStatus === "loading";


  if (isLoadingOptions && !initialDataFetched) { // Show full page loader only on initial absolute load
    return (
        <div className="flex justify-center items-center h-screen">
            <Spinner size={40} /> <span className="ml-2">Loading options...</span>
        </div>
    )
  }

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/opportunities">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Opportunities</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className="font-semibold text-primary">Add New Buyer Opportunity</h6>
      </div>
      <Card>
        <h4 className="mb-6">Create Buyer Opportunity</h4>
        <Form
          id="createBuyerForm"
          onSubmit={handleSubmit(onFormSubmit)}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <FormItem
              label="Opportunity ID"
              invalid={!!errors.opportunityId}
              errorMessage={errors.opportunityId?.message}
            >
              <Controller name="opportunityId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Opportunity ID (Optional)" />} />
            </FormItem>

            <FormItem
              label="Buy Listing ID"
              invalid={!!errors.buyListingId}
              errorMessage={errors.buyListingId?.message}
            >
              <Controller name="buyListingId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Buy Listing ID (Optional)" />} />
            </FormItem>

            <FormItem
              label="Sell Listing ID"
              invalid={!!errors.sellListingId}
              errorMessage={errors.sellListingId?.message}
            >
              <Controller name="sellListingId" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Sell Listing ID (Optional)" />} />
            </FormItem>

            <FormItem
              label="Product*"
              invalid={!!errors.productId}
              errorMessage={errors.productId?.message}
            >
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    placeholder="Select Product"
                    options={productOptions}
                    isLoading={masterLoadingStatus === "loading" && productOptions.length === 0}
                    value={productOptions.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                    isClearable
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Product Category*"
              invalid={!!errors.productCategoryId}
              errorMessage={errors.productCategoryId?.message}
            >
              <Controller
                name="productCategoryId"
                control={control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    placeholder="Select Category"
                    options={categoryOptions}
                    isLoading={masterLoadingStatus === "loading" && categoryOptions.length === 0}
                    value={categoryOptions.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                    isClearable
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Product Subcategory"
              invalid={!!errors.productSubcategoryId}
              errorMessage={errors.productSubcategoryId?.message}
            >
              <Controller
                name="productSubcategoryId"
                control={control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    placeholder="Select Subcategory"
                    options={subcategoryOptionsForForm}
                    isLoading={masterLoadingStatus === "loading" && watchedProductCategoryId !== null && subcategoryOptionsForForm.length === 0}
                    isDisabled={!watchedProductCategoryId || (masterLoadingStatus !== "idle" && subcategoryOptionsForForm.length === 0 && !!watchedProductCategoryId) }
                    value={subcategoryOptionsForForm.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                    isClearable
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Brand*"
              invalid={!!errors.brandId}
              errorMessage={errors.brandId?.message}
            >
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    placeholder="Select Brand"
                    options={brandOptions}
                    isLoading={masterLoadingStatus === "loading" && brandOptions.length === 0}
                    value={brandOptions.find(opt => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option ? option.value : "")}
                    isClearable
                  />
                )}
              />
            </FormItem>

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
            <FormItem label="Opportunity Status" invalid={!!errors.opportunityStatus} errorMessage={errors.opportunityStatus?.message}>
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
                      [{ value: "New", label: "New" }, { value: "Shortlisted", label: "Shortlisted" }]
                        .find(opt => opt.value === field.value) || null
                    }
                    onChange={option => field.onChange(option ? option.value : "")}
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem label="Created Date" invalid={!!errors.createdDate} errorMessage={errors.createdDate?.message} >
              <Controller name="createdDate" control={control} render={({ field }) => (<DatePicker {...field} value={field.value} inputFormat="YYYY-MM-DD" placeholder="Select Date (Optional)" onChange={(date) => field.onChange(date)} /> )} />
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
            <FormItem label="Status*" invalid={!!errors.status} errorMessage={errors.status?.message} >
              <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <UiSelect
                {...field}
                placeholder="Select Status"
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "active", label: "Active" },
                  { value: "closed", label: "Closed" },
                ]}
                value={
                  [
                  { value: "pending", label: "Pending" },
                  { value: "active", label: "Active" },
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
        <Button type="button" onClick={handleCancel} disabled={isSubmitting || isLoadingOptions}> Cancel </Button>
        <Button type="button" onClick={handleSaveAsDraft} variant="twoTone" disabled={isSubmitting || isLoadingOptions}> Draft </Button>
        <Button type="submit" form="createBuyerForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || isLoadingOptions || !isDirty || !isValid } >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Card>
    </>
  );
};

export default CreateBuyer;