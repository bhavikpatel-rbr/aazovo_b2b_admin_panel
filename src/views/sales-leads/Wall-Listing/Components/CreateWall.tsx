// src/views/your-path/business-entities/WallItemForm.tsx
// MODIFIED: Renamed file to reflect dual purpose (Add/Edit)

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// NEW: Import useParams to read the item ID from the URL
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import {
  DatePicker,
  Form,
  FormItem,
  Input,
  Radio,
  Select as UiSelect,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import InputNumber from "@/components/ui/Input/InputNumber";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner"; // NEW: For loading state
import toast from "@/components/ui/toast";
import { BiChevronRight } from "react-icons/bi";

// Redux
import { masterSelector } from '@/reduxtool/master/masterSlice';
import {
  addWallItemAction,
  editWallItemAction,
  getAllProductAction,
  getCompanyAction,
  getPaymentTermAction,
  getProductSpecificationsAction,
  getSalesPersonAction,
  // NEW: You will need to create these actions in your Redux setup
  getWallItemById,
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';


// Types
export type WallIntent = "Buy" | "Sell" | "Exchange";

// MODIFIED: Zod schema is mostly the same but tweaked for flexibility
const wallItemFormSchema = z.object({
  product_name: z.string().min(1, "Product Name is required."),
  company_name: z.string().min(1, "Member Name is required."),
  qty: z.coerce.number({ required_error: "Quantity is required." }).min(1, "Quantity must be at least 1."),
  price: z.coerce.number().min(0, "Price cannot be negative.").nullable().optional(),
  intent: z.enum(["Buy", "Sell", "Exchange"] as const, { required_error: "Intent (Want to) is required." }),
  productStatus: z.string().min(1, "Product Status is required."),
  productSpecId: z.coerce.number().nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  color: z.string().max(50, "Color too long.").nullable().optional(),
  cartoonTypeId: z.string().nullable().optional(),
  dispatchStatus: z.string().max(100, "Dispatch status too long.").nullable().optional(),
  dispatchMode: z.string().nullable().optional(),
  paymentTermId: z.coerce.number().nullable().optional(),
  eta: z.date().nullable().optional(),
  location: z.string().max(100, "Location too long.").nullable().optional(),
  listingType: z.string().nullable().optional(),
  visibility: z.string().min(1, "Visibility is required."),
  priority: z.string().nullable().optional(),
  adminStatus: z.string().nullable().optional(),
  status: z.string().min(1, "Status is required."),
  assignedTeamId: z.coerce.number().nullable().optional(),
  activeHours: z.string().nullable().optional(),
  productUrl: z.string().url("Invalid URL format.").or(z.literal("")).optional().nullable(),
  warrantyInfo: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  internalRemarks: z.string().nullable().optional(),
  productId: z.number().min(1, "Product is required."),
  // MODIFIED: companyId is not directly in the form but is required for submission
  companyId: z.number().min(1, "Member is required."),
});
type WallItemFormData = z.infer<typeof wallItemFormSchema>;

// Define option types for clarity
type ProductOptionType = { value: string; label: string; id: number };
type CompanyOptionType = { value: string; label: string; id: number };
type PaymentTermType = { value: number; label: string; id: number };
type ProductSpecOptionType = { value: number; label: string };
type SalesPersonOptionType = { value: number; label: string };

// --- Form Options (Static data remains the same) ---
const intentOptions: { value: WallIntent; label: string }[] = [{ value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Exchange", label: "Exchange" }];
const productStatusOptions = [{ value: "Active", label: "Active" }, { value: "Non-active", label: "Non-active" }];
const statusOptions = [{ value: "Pending", label: "Pending" }, { value: "Active", label: "Active" }, { value: "Rejected", label: "Rejected" }, { value: "inactive", label: "Inactive" }];
const dummyCartoonTypes = [{ id: "Master Cartoon", name: "Master Cartoon" }, { id: "Non Masster Cartoon", name: "Non Masster Cartoon" }];
const deviceConditionRadioOptions = [{ value: "New", label: "New" }, { value: "Old", label: "Old" }];
const visibilityOptions = [{ value: 'Public', label: 'Public' }, { value: 'Internal', label: 'Internal' }];
const priorityOptions = [{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }];
const listingTypeOptions = [{ value: 'Featured', label: 'Featured' }, { value: 'Regular', label: 'Regular' }];
const dispatchModeOptions = [{ value: 'courier', label: 'Courier' }, { value: 'pickup', label: 'Pickup' }];
const adminStatusOptions = [{ value: 'Pending', label: 'Pending' }, { value: 'Approved', label: 'Approved' }, { value: 'Rejected', label: 'Rejected' }];

// NEW: Helper function to transform API data to form data structure
const transformApiDataToFormData = (apiData: any): WallItemFormData => {
  return {
    product_name: apiData?.product?.name || "",
    company_name: apiData?.customer?.name || "",
    qty: Number(apiData?.qty) || 1,
    price: apiData?.price ? Number(apiData.price) : null,
    intent: apiData?.want_to || "Sell",
    productStatus: apiData?.product_status || "Active",
    productSpecId: apiData?.product_spec_id ? Number(apiData?.product_spec_id) : null,
    deviceCondition: apiData?.device_condition || null,
    color: apiData?.color || "",
    cartoonTypeId: apiData?.cartoon_type || null,
    dispatchStatus: apiData?.dispatch_status || "",
    dispatchMode: apiData?.dispatch_mode || null,
    paymentTermId: apiData?.payment_term ? Number(apiData?.payment_term) : null,
    eta: apiData?.eta_details ? dayjs(apiData?.eta_details).toDate() : null,
    location: apiData?.location || "",
    listingType: apiData?.listing_type || "Regular",
    visibility: apiData?.visibility || "Public",
    priority: apiData?.priority || "Medium",
    adminStatus: apiData?.admin_status || "Pending",
    status: apiData?.status || "Pending",
    assignedTeamId: apiData?.assigned_team_id ? Number(apiData?.assigned_team_id) : null,
    activeHours: apiData?.active_hrs || "",
    productUrl: apiData?.product_url || "",
    warrantyInfo: apiData?.warranty_info || "",
    returnPolicy: apiData?.return_policy || "",
    internalRemarks: apiData?.internal_remarks || "",
    productId: Number(apiData?.product_id),
    companyId: Number(apiData?.customer_id),
  };
};

const WallItemForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // NEW: Get itemId from URL for edit mode
  // const { itemId } = useParams<{ itemId: string }>();
  const itemId = useLocation().state;
  const isEditMode = !!itemId;
  console.log(location, "location");

  // NEW: State for managing submission and loading of data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);

  // MODIFIED: useSelector now also gets the specific item detail for editing
  const {
    productsMasterData = [],
    CompanyData = [],
    ProductSpecificationsData = [],
    PaymentTermsData = [],
    salesPerson = [],
    // NEW: Add a selector for the single item detail
    wallItemsData, // Assuming your slice has a 'wallItemsData' field
    getwallItemsData,
    status: masterDataAccessStatus = 'idle',
  } = useSelector(masterSelector);


  const formMethods = useForm<WallItemFormData>({
    resolver: zodResolver(wallItemFormSchema),
    mode: 'onBlur',
    // MODIFIED: Default values are for ADD mode. They will be overwritten in EDIT mode.
    defaultValues: {
      product_name: "",
      company_name: "",
      qty: 1,
      price: null,
      intent: "Sell",
      productStatus: productStatusOptions[0]?.value,
      status: statusOptions[0]?.value,
      visibility: visibilityOptions[0]?.value,
      priority: priorityOptions[1]?.value,
      listingType: listingTypeOptions[1]?.value,
      adminStatus: adminStatusOptions[0]?.value,
      // ... other fields set to empty/null/default
      productId: 0,
      companyId: 0,
      productSpecId: null,
      deviceCondition: null,
      color: "",
      cartoonTypeId: null,
      dispatchStatus: "",
      dispatchMode: null,
      paymentTermId: null,
      eta: null,
      location: "",
      assignedTeamId: null,
      activeHours: "",
      productUrl: "",
      warrantyInfo: "",
      returnPolicy: "",
      internalRemarks: "",
    },
  });

  // NEW: useEffect to populate form when in EDIT mode
  useEffect(() => {
    if (isEditMode) {
      getWallItemById(itemId);
      const formData = transformApiDataToFormData(getwallItemsData);
      console.log(formData, "formData ");

      formMethods.reset(formData);
    }
  }, [isEditMode, wallItemsData, formMethods]);


  // MODIFIED: useEffect to fetch all necessary data (for dropdowns and for edit item)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPageData(true);
      try {
        const dropdownPromises = [
          dispatch(getAllProductAction()),
          dispatch(getCompanyAction()),
          dispatch(getProductSpecificationsAction()),
          dispatch(getPaymentTermAction()),
          dispatch(getSalesPersonAction()),
        ];

        // If in edit mode, also fetch the specific item's data
        if (isEditMode) {
          dropdownPromises.push(dispatch(getWallItemById(itemId)));
        }

        await Promise.all(dropdownPromises);

      } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast.push(<Notification title="Data Load Error" type="danger">Could not load required data.</Notification>);
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchData();
  }, [dispatch, itemId, isEditMode]);

  // --- Dropdown options (useMemo hooks remain the same) ---
  const productOptions: ProductOptionType[] = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((product: any) => ({ value: product.name, label: product.name, id: product.id }));
  }, [productsMasterData]);

  const companyOptions: CompanyOptionType[] = useMemo(() => {
    const companies = CompanyData?.data || CompanyData || [];
    if (!Array.isArray(companies)) return [];
    return companies.map((company: any) => ({ value: company.name || company.company_name, label: company.name || company.company_name, id: company.id }));
  }, [CompanyData]);

  const paymentTermsOption: PaymentTermType[] = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    return PaymentTermsData.map((payment: any) => ({ value: payment.id, label: payment.term_name || 'Unnamed Term', id: payment.id }));
  }, [PaymentTermsData]);

  const productSpecOptionsForSelect: ProductSpecOptionType[] = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    return ProductSpecificationsData.map((spec: any) => ({ value: spec.id, label: spec.name }));
  }, [ProductSpecificationsData]);

  const salesPersonOptions: SalesPersonOptionType[] = useMemo(() => {
    if (!Array.isArray(salesPerson)) return [];
    return salesPerson.map((person: any) => ({ value: person.id || person.value, label: person.name }));
  }, [salesPerson]);


  // MODIFIED: Form submission now handles both Add and Edit
  const onFormSubmit = async (formData: WallItemFormData) => {
    setIsSubmitting(true);
    try {
      // The payload structure is largely the same for add and update
      const payload = {
        product_id: String(formData.productId),
        customer_id: String(formData.companyId), // API uses customer_id
        want_to: formData.intent,
        qty: String(formData.qty),
        price: formData.price !== null && formData.price !== undefined ? String(formData.price) : null,
        product_status: formData.productStatus,
        product_spec_id: formData.productSpecId ? String(formData.productSpecId) : null,
        device_condition: formData.deviceCondition,
        color: formData.color,
        cartoon_type: formData.cartoonTypeId,
        dispatch_status: formData.dispatchStatus,
        dispatch_mode: formData.dispatchMode,
        payment_term: formData.paymentTermId ? String(formData.paymentTermId) : null,
        eta_details: formData.eta ? dayjs(formData.eta).format("YYYY-MM-DD") : null, // API uses eta_details
        location: formData.location,
        listing_type: formData.listingType,
        visibility: formData.visibility,
        priority: formData.priority,
        admin_status: formData.adminStatus,
        status: formData.status,
        assigned_team_id: formData.assignedTeamId ? String(formData.assignedTeamId) : null,
        active_hrs: String(formData.activeHours),
        product_url: formData.productUrl,
        warranty_info: formData.warrantyInfo,
        return_policy: formData.returnPolicy,
        internal_remarks: formData.internalRemarks,
      };

      if (isEditMode) {
        // --- EDIT LOGIC ---
        // NEW: You must create this editWallItemAction in your redux setup
        await dispatch(editWallItemAction({ id: itemId, ...payload })).unwrap();
        toast.push(
          <Notification title="Update Successful" type="success">
            Wall item for "{formData.product_name}" has been updated.
          </Notification>
        );
      } else {
        // --- ADD LOGIC ---
        const addPayload = {
          ...payload,
          // Add any fields specific to creation
          created_from: "FormUI-Add",
          source: "in",
          is_wall_manual: "0",
        };
        await dispatch(addWallItemAction(addPayload)).unwrap();
        toast.push(
          <Notification title="Item Added" type="success">
            Wall item for "{formData.product_name}" created.
          </Notification>
        );
      }
      navigate("/sales-leads/wall-listing");

    } catch (error: any) {
      toast.push(
        <Notification title={isEditMode ? "Update Failed" : "Add Failed"} type="danger">
          {error.message || "An unexpected error occurred."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/sales-leads/wall-listing");
  };

  // MODIFIED: Use a single loading flag for the whole page
  const isLoading = isLoadingPageData || (masterDataAccessStatus === 'loading' && !wallItemsData);

  // NEW: Show a spinner while loading initial data for the form
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Spinner size="40px" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/sales-leads/wall-listing">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Wall Listing</h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        {/* MODIFIED: Dynamic Title */}
        <h6 className="font-semibold text-primary">{isEditMode ? 'Edit Wall Item' : 'Add New Wall Item'}</h6>
      </div>
      <Card>
        {/* ... (Your entire <Form> component JSX goes here, it should work without changes) ... */}
        {/* Make sure to copy the entire Form block from your original code */}
        <Form
          id="wallItemAddForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            toast.push(<Notification title="Validation Error" type="warning">Please fix the errors before submitting.</Notification>);
          })}
          className="flex flex-col gap-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4 p-4">
            {/* Row 1 */}
            <FormItem
              label={<div>Product Name<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.product_name}
              errorMessage={formMethods.formState.errors.product_name?.message}
            >
              <Controller
                name="product_name"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isLoading={isLoading}
                    options={productOptions}
                    value={productOptions.find(opt => opt.value === field.value) || null}
                    onChange={option => {
                      if (option) {
                        field.onChange(option.value);
                        formMethods.setValue('productId', option.id, { shouldValidate: true, shouldDirty: true });
                      } else {
                        field.onChange("");
                        formMethods.setValue('productId', 0, { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    placeholder="Select Product Name"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label={<div>Member Name<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.company_name}
              errorMessage={formMethods.formState.errors.company_name?.message}
            >
              <Controller
                name="company_name"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isLoading={isLoading}
                    options={companyOptions}
                    value={companyOptions.find(opt => opt.value === field.value) || null}
                    onChange={option => {
                      if (option) {
                        field.onChange(option.value);
                        formMethods.setValue('companyId', option.id, { shouldValidate: true, shouldDirty: true });
                      } else {
                        field.onChange("");
                        formMethods.setValue('companyId', 0, { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    placeholder="Select Member Name"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label={<div>Quantity<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.qty}
              errorMessage={formMethods.formState.errors.qty?.message}
            >
              <Controller name="qty" control={formMethods.control} render={({ field }) => (<InputNumber {...field} placeholder="Enter Quantity" />)} />
            </FormItem>

            {/* Row 2 */}
            <FormItem
              label="Price"
              invalid={!!formMethods.formState.errors.price}
              errorMessage={formMethods.formState.errors.price?.message}
            >
              <Controller name="price" control={formMethods.control} render={({ field }) => (<InputNumber {...field} value={field.value ?? undefined} placeholder="Enter Price (Optional)" />)} />
            </FormItem>
            <FormItem
              label={<div>Intent (Want to)<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.intent}
              errorMessage={formMethods.formState.errors.intent?.message}
            >
              <Controller name="intent" control={formMethods.control} render={({ field }) => (<UiSelect options={intentOptions} {...field}
                value={intentOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Intent" />)} />
            </FormItem>
            <FormItem
              label={<div>Product Status<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller name="productStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={productStatusOptions} {...field}
                value={productStatusOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Product Status" />)} />
            </FormItem>

            {/* Row 3 */}
            <FormItem
              label="Product Spec"
              invalid={!!formMethods.formState.errors.productSpecId}
              errorMessage={formMethods.formState.errors.productSpecId?.message}
            >
              <Controller name="productSpecId" control={formMethods.control} render={({ field }) => (
                <UiSelect
                  isLoading={isLoading}
                  options={productSpecOptionsForSelect}
                  value={productSpecOptionsForSelect.find(opt => opt.value === field.value) || null}
                  onChange={(option) => field.onChange(option ? option.value : null)}
                  placeholder="Select Product Spec (Optional)"
                  isClearable
                />
              )} />
            </FormItem>
            <FormItem
              label="Device Condition"
              invalid={!!formMethods.formState.errors.deviceCondition}
              errorMessage={formMethods.formState.errors.deviceCondition?.message}
            >
              <Controller name="deviceCondition" control={formMethods.control} render={({ field }) => (
                <Radio.Group value={field.value} onChange={field.onChange}> {deviceConditionRadioOptions.map(opt => (<Radio key={opt.value} value={opt.value}>{opt.label}</Radio>))} </Radio.Group>
              )} />
            </FormItem>
            <FormItem
              label="Color"
              invalid={!!formMethods.formState.errors.color}
              errorMessage={formMethods.formState.errors.color?.message}
            >
              <Controller name="color" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="Enter Color (Optional)" />)} />
            </FormItem>

            {/* Row 4 */}
            <FormItem
              label="Cartoon Type"
              invalid={!!formMethods.formState.errors.cartoonTypeId}
              errorMessage={formMethods.formState.errors.cartoonTypeId?.message}
            >
              <Controller name="cartoonTypeId" control={formMethods.control} render={({ field }) => (
                <UiSelect options={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name, }))} {...field}
                  value={dummyCartoonTypes.map((ct) => ({ value: ct.id, label: ct.name })).find((opt) => opt.value === field.value) || null}
                  onChange={(option) => field.onChange(option ? option.value : null)}
                  placeholder="Select Cartoon Type (Optional)"
                  isClearable
                />
              )} />
            </FormItem>
            <FormItem
              label="Dispatch Status"
              invalid={!!formMethods.formState.errors.dispatchStatus}
              errorMessage={formMethods.formState.errors.dispatchStatus?.message}
            >
              <Controller name="dispatchStatus" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="e.g., Ready to Ship (Optional)" />)} />
            </FormItem>
            <FormItem
              label="Dispatch Mode"
              invalid={!!formMethods.formState.errors.dispatchMode}
              errorMessage={formMethods.formState.errors.dispatchMode?.message}
            >
              <Controller name="dispatchMode" control={formMethods.control} render={({ field }) => (<UiSelect options={dispatchModeOptions} {...field}
                value={dispatchModeOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Dispatch Mode (Optional)"
                isClearable
              />)} />
            </FormItem>

            {/* Row 5 */}
            <FormItem
              label="Payment Term"
              invalid={!!formMethods.formState.errors.paymentTermId}
              errorMessage={formMethods.formState.errors.paymentTermId?.message}
            >
              <Controller name="paymentTermId" control={formMethods.control} render={({ field }) => (
                <UiSelect
                  isLoading={isLoading}
                  options={paymentTermsOption}
                  value={paymentTermsOption.find(opt => opt.value === field.value) || null}
                  onChange={(option) => field.onChange(option ? option.value : null)}
                  placeholder="Select Payment Term (Optional)"
                  isClearable
                />
              )} />
            </FormItem>
            <FormItem
              label="ETA"
              invalid={!!formMethods.formState.errors.eta}
              errorMessage={formMethods.formState.errors.eta?.message}
            >
              <Controller name="eta" control={formMethods.control} render={({ field }) => (<DatePicker {...field} value={field.value} onChange={(date) => field.onChange(date)} placeholder="Select ETA (Optional)" inputFormat="YYYY-MM-DD" />)} />
            </FormItem>
            <FormItem
              label="Location"
              invalid={!!formMethods.formState.errors.location}
              errorMessage={formMethods.formState.errors.location?.message}
            >
              <Controller name="location" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="Enter Location (Optional)" />)} />
            </FormItem>

            {/* Row 6: Listing Configuration */}
            <FormItem
              label="Listing Type"
              invalid={!!formMethods.formState.errors.listingType}
              errorMessage={formMethods.formState.errors.listingType?.message}
            >
              <Controller name="listingType" control={formMethods.control} render={({ field }) => (<UiSelect options={listingTypeOptions} {...field}
                value={listingTypeOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Listing Type"
                isClearable />)} />
            </FormItem>
            <FormItem
              label={<div>Visibility<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.visibility}
              errorMessage={formMethods.formState.errors.visibility?.message}
            >
              <Controller name="visibility" control={formMethods.control} render={({ field }) => (<UiSelect options={visibilityOptions} {...field}
                value={visibilityOptions.find(opt => opt.value === field.value)}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Visibility" />)} />
            </FormItem>
            <FormItem
              label="Priority"
              invalid={!!formMethods.formState.errors.priority}
              errorMessage={formMethods.formState.errors.priority?.message}
            >
              <Controller name="priority" control={formMethods.control} render={({ field }) => (<UiSelect options={priorityOptions} {...field}
                value={priorityOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Priority (Optional)"
                isClearable
              />)} />
            </FormItem>

            {/* Row 7: Admin & Active Hours */}
            <FormItem
              label="Admin Status"
              invalid={!!formMethods.formState.errors.adminStatus}
              errorMessage={formMethods.formState.errors.adminStatus?.message}
            >
              <Controller name="adminStatus" control={formMethods.control} render={({ field }) => (<UiSelect options={adminStatusOptions} {...field}
                value={adminStatusOptions.find(opt => opt.value === field.value) || null}
                onChange={opt => field.onChange(opt ? opt.value : null)}
                placeholder="Select Admin Status"
                isClearable />)} />
            </FormItem>
            {/* --- NEW STATUS DROPDOWN --- */}
            <FormItem
              label={<div>Status<span className="text-red-500"> * </span></div>}
              invalid={!!formMethods.formState.errors.status}
              errorMessage={formMethods.formState.errors.status?.message}
            >
              <Controller
                name="status"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    {...field}
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === field.value)}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    placeholder="Select Status"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Assigned Team"
              invalid={!!formMethods.formState.errors.assignedTeamId}
              errorMessage={formMethods.formState.errors.assignedTeamId?.message}
            >
              <Controller name="assignedTeamId" control={formMethods.control} render={({ field }) => (
                <UiSelect
                  isLoading={isLoading}
                  options={salesPersonOptions} {...field}
                  value={salesPersonOptions.find(opt => opt.value === field.value) || null}
                  onChange={opt => field.onChange(opt ? opt.value : null)}
                  placeholder="Select Assigned Team (Optional)"
                  isClearable
                />
              )} />
            </FormItem>

            {/* Row 8 */}
            <FormItem
              label="Active Hours"
              invalid={!!formMethods.formState.errors.activeHours}
              errorMessage={formMethods.formState.errors.activeHours?.message}
            >
              <Controller name="activeHours" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value || ''} placeholder="e.g., 9 AM - 5 PM, 24/7 (Optional)" />)} />
            </FormItem>
            <FormItem
              label="Product URL"
              className="md:col-span-1"
              invalid={!!formMethods.formState.errors.productUrl}
              errorMessage={formMethods.formState.errors.productUrl?.message}
            >
              <Controller name="productUrl" control={formMethods.control} render={({ field }) => (<Input type="url" {...field} value={field.value || ''} placeholder="https://example.com/product (Optional)" />)} />
            </FormItem>
            <FormItem
              label="Warranty Info"
              className="md:col-span-2"
              invalid={!!formMethods.formState.errors.warrantyInfo}
              errorMessage={formMethods.formState.errors.warrantyInfo?.message}
            >
              <Controller name="warrantyInfo" control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={2} placeholder="Enter warranty details (Optional)" />)} />
            </FormItem>

            <FormItem
              label="Return Policy"
              className="md:col-span-3"
              invalid={!!formMethods.formState.errors.returnPolicy}
              errorMessage={formMethods.formState.errors.returnPolicy?.message}
            >
              <Controller name="returnPolicy" control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={3} placeholder="Enter return policy (Optional)" />)} />
            </FormItem>

            <FormItem
              label="Internal Remarks"
              className="md:col-span-3"
              invalid={!!formMethods.formState.errors.internalRemarks}
              errorMessage={
                formMethods.formState.errors.internalRemarks?.message
              }
            >
              <Controller name="internalRemarks" control={formMethods.control} render={({ field }) => (<Input textArea {...field} value={field.value || ""} rows={3} placeholder="Internal notes for this listing (Optional)" />)} />
            </FormItem>
          </div>
        </Form>
      </Card>

      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" onClick={handleCancel} disabled={isSubmitting} > Cancel </Button>
        {/* MODIFIED: Dynamic button text and disabled state */}
        <Button type="submit" form="wallItemAddForm" variant="solid" loading={isSubmitting} disabled={isSubmitting || !formMethods.formState.isDirty || !formMethods.formState.isValid} >
          {isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
        </Button>
      </Card>
    </>
  );
};

export default WallItemForm;