import React, { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import cloneDeep from "lodash/cloneDeep";

import FormListSearch from "./FormListSearch"; // Assuming this is your search component
// Assuming useCustomerList provides access to the main data and table query state
import useCustomerList from "@/views/concepts/customers/CustomerList/hooks/useCustomerList";

import {
  Button,
  DatePicker,
  Drawer,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import { TbCloudDownload, TbCloudUpload, TbFilter } from "react-icons/tb";

// --- Define FormItem type (assuming it's similar to what's used by useCustomerList) ---
// This should match the structure of the items in your customer list
export type CustomerListItem = {
  // Example - replace with your actual item type
  id: string;
  status: "Active" | "Inactive"; // Example
  business_type: string; // e.g., 'Manufacture', 'Supplier'
  company_type: string; // e.g., 'Private Limited', 'Charitable Trust'
  continent: string;
  country: string;
  state: string;
  city: string;
  interested_for: string; // 'Buy', 'Sell', 'Both'
  brands: string[];
  categories: string[];
  sub_categories: string[];
  kyc_verified: "Yes" | "No";
  enable_billing: "Yes" | "No";
  created_date: string | Date; // Date string or Date object
  // ... other fields
};
// --- End FormItem type ---

// --- Zod Schema for Filter Form (matching the new fields) ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBusinessType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(), // For 'Manufacture', 'Supplier'
  filterCompanyType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(), // For 'Private Limited'
  filterContinent: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCountry: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterState: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCity: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInterestedFor: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBrand: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterSubCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterKycVerified: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterEnableBilling: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCreatedDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]), // For DatePickerRange [from, to]
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Filter Schema ---

// --- MOCK FILTER OPTIONS (Replace/Augment with dynamic data) ---
const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const businessTypeOptions = [
  // For 'Manufacture', 'Supplier'
  { value: "Manufacture", label: "Manufacture" },
  { value: "Supplier", label: "Supplier" },
  { value: "Service", label: "Service Provider" }, // Add more as needed
];
const companyTypeOptions = [
  // For 'Private Limited' etc.
  { value: "Private Limited", label: "Private Limited" },
  { value: "Charitable Trust", label: "Charitable Trust" },
  { value: "LLP", label: "LLP" },
  { value: "Partnership", label: "Partnership" },
];
const continentOptionsList = [
  /* Your continent options */ { value: "Asia", label: "Asia" },
  { value: "Europe", label: "Europe" }, // etc.
];
const countryOptionsList = [
  /* Your country options, ideally dynamic */
  { value: "India", label: "India" },
  { value: "USA", label: "USA" }, // etc.
];
const stateOptionsList = [
  /* Your state options, ideally dynamic */
  { value: "Gujarat", label: "Gujarat" },
  { value: "New York", label: "New York" }, // etc.
];
const cityOptionsList = [
  /* Your city options, ideally dynamic */
  { value: "Ahmedabad", label: "Ahmedabad" },
  { value: "New York City", label: "New York City" }, // etc.
];
const interestedForOptionsList = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Both", label: "Both" },
];
const kycOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];
const billingOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];
// --- End Mock Filter Options ---

const FormListTableTools = () => {
  // Assuming useCustomerList provides:
  // 1. `tableData` (current query, sort, pagination)
  // 2. `setTableData` (to update query, sort, pagination)
  // 3. `allCustomers` or `data` (the full unfiltered list of customers to derive dynamic options)
  // 4. `setFilterCriteria` (a function in the context to apply the actual filtering logic based on FilterFormData)
  const {
    tableData,
    setTableData,
    allCustomers,
    setFilterCriteria: applyFiltersToContext,
  } = useCustomerList();
  const customersData: CustomerListItem[] = allCustomers || []; // Ensure it's an array

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // This local filterCriteria is for the form state within this component
  const [localFilterCriteria, setLocalFilterCriteria] =
    useState<FilterFormData>({});

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: localFilterCriteria,
  });

  // Sync form with external changes to localFilterCriteria (e.g., on clear)
  useEffect(() => {
    filterFormMethods.reset(localFilterCriteria);
  }, [localFilterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    // Potentially sync localFilterCriteria with context's current filters if they exist
    // For now, just uses its own last state or default
    filterFormMethods.reset(localFilterCriteria);
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    console.log("Applying filters from Tools:", data);
    setLocalFilterCriteria(data); // Update local state for the form
    if (applyFiltersToContext) {
      applyFiltersToContext(data); // Pass to context to handle actual data filtering
    }
    // Reset table to page 1 when filters change
    const newTableData = cloneDeep(tableData);
    newTableData.pageIndex = 1;
    setTableData(newTableData);
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: FilterFormData = { filterCreatedDate: [null, null] };
    filterFormMethods.reset(defaultFilters);
    setLocalFilterCriteria(defaultFilters);
    if (applyFiltersToContext) {
      applyFiltersToContext(defaultFilters);
    }
    const newTableData = cloneDeep(tableData);
    newTableData.pageIndex = 1;
    setTableData(newTableData);
    // Optionally close drawer: closeFilterDrawer();
  };

  const handleInputChange = (val: string) => {
    const newTableData = cloneDeep(tableData);
    newTableData.query = val;
    newTableData.pageIndex = 1;
    // Original logic for string length check (can be simplified)
    if (
      (typeof val === "string" && val.length > 1) ||
      (typeof val === "string" && val.length === 0)
    ) {
      setTableData(newTableData);
    }
  };

  const { DatePickerRange } = DatePicker;

  // --- Dynamic options generation ---
  const dynamicBrandOptions = useMemo(() => {
    if (!customersData || customersData.length === 0) return [];
    const allBrands = customersData.flatMap((item) => item.brands || []);
    return Array.from(new Set(allBrands)).map((brand) => ({
      value: brand,
      label: brand,
    }));
  }, [customersData]);

  const dynamicCategoryOptions = useMemo(() => {
    if (!customersData || customersData.length === 0) return [];
    const allCategories = customersData.flatMap(
      (item) => item.categories || []
    );
    return Array.from(new Set(allCategories)).map((cat) => ({
      value: cat,
      label: cat,
    }));
  }, [customersData]);

  const dynamicSubCategoryOptions = useMemo(() => {
    if (!customersData || customersData.length === 0) return [];
    const allSubCategories = customersData.flatMap(
      (item) => item.sub_categories || []
    );
    return Array.from(new Set(allSubCategories)).map((subCat) => ({
      value: subCat,
      label: subCat,
    }));
  }, [customersData]);
  // --- End Dynamic options ---

  const handleExport = () => {
    console.log("Export clicked");
    // Implement export functionality
  };
  const handleImport = () => {
    console.log("Import clicked");
    // Implement import functionality
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <FormListSearch
        onInputChange={(e) => handleInputChange(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button icon={<TbFilter />} onClick={openFilterDrawer}>
          Filter
        </Button>
        <Button icon={<TbCloudDownload />} onClick={handleImport}>
          Import
        </Button>
        <Button icon={<TbCloudUpload />} onClick={handleExport}>
          Export
        </Button>
      </div>

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480} // Adjusted width
        footer={
          <div className="text-right w-full dark:border-gray-700">
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterFormInTools" // Unique form ID
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <UiForm
          id="filterFormInTools"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
        >
          <div className="sm:grid grid-cols-2 gap-2">
            <UiFormItem label="Status">
              <Controller
                name="filterStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={statusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Business Type">
              {" "}
              {/* Manufacture, Supplier */}
              <Controller
                name="filterBusinessType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Type"
                    options={businessTypeOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>

            <UiFormItem label="Continent">
              <Controller
                name="filterContinent"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Continent"
                    options={continentOptionsList}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Country">
              <Controller
                name="filterCountry"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Country"
                    options={countryOptionsList}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>

            <UiFormItem label="State">
              <Controller
                name="filterState"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select State"
                    options={stateOptionsList}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="City">
              <Controller
                name="filterCity"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select City"
                    options={cityOptionsList}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>

            <UiFormItem label="Interested For">
              <Controller
                name="filterInterestedFor"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Interested For"
                    options={interestedForOptionsList}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Brand">
              <Controller
                name="filterBrand"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Brand"
                    options={dynamicBrandOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>

            <UiFormItem label="Category">
              <Controller
                name="filterCategory"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Category"
                    options={dynamicCategoryOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Sub Category">
              <Controller
                name="filterSubCategory"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Sub Category"
                    options={dynamicSubCategoryOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>

            <UiFormItem label="KYC Verified">
              <Controller
                name="filterKycVerified"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="KYC Verified"
                    options={kycOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Enable Billing">
              <Controller
                name="filterEnableBilling"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Enable Billing"
                    options={billingOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>

            <UiFormItem label="Company Type">
              {" "}
              {/* e.g. Private Limited */}
              <Controller
                name="filterCompanyType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Type"
                    options={companyTypeOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Created Date">
              <Controller
                name="filterCreatedDate"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <DatePickerRange
                    placeholder="Select Date Range"
                    value={field.value as [Date | null, Date | null]} // Cast to expected type
                    onChange={(dateRange) => field.onChange(dateRange)}
                  />
                )}
              />
            </UiFormItem>
          </div>
        </UiForm>
      </Drawer>
    </div>
  );
};

export default FormListTableTools;
