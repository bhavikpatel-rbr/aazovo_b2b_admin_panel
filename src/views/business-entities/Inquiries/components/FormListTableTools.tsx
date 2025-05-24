// src/views/your-inquiry-module/FormListTableTools.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import cloneDeep from "lodash/cloneDeep";

import FormListSearch from "./FormListSearch"; // Your search component

// Assume a context hook for inquiries, similar to useCustomerList
// You'll need to create this or adapt an existing one.
// For example: import useInquiryList from './hooks/useInquiryList';
// For now, I'll mock what it might provide.
const useInquiryList = () => {
  const [tableData, setTableDataState] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    query: "",
    sort: { key: "", order: "" },
  });
  const [allInquiries, setAllInquiries] = useState<FormItem[]>([]); // Example: fetch this data
  const [filterCriteria, setFilterCriteriaState] = useState({});

  const setTableData = (data: Partial<TableQueries>) => {
    setTableDataState((prev) => ({ ...prev, ...data }));
  };
  const setFilterCriteria = (filters: InquiryFilterFormData) => {
    console.log("Context: Setting inquiry filter criteria", filters);
    setFilterCriteriaState(filters);
    // Actual filtering logic would reside in the context's data processing
  };
  // In a real hook, you'd fetch/manage allInquiries and apply filters
  return {
    tableData,
    setTableData,
    allInquiries,
    setFilterCriteria,
    filterCriteria,
  };
};

import {
  Button,
  DatePicker,
  Drawer,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import { TbCloudDownload, TbCloudUpload, TbFilter } from "react-icons/tb";
import type { TableQueries } from "@/@types/common"; // Common type for table queries

// --- Define FormItem Type (for Inquiries) ---
export type FormItem = {
  id: string;
  inquiry_id: string;
  company_name: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  inquiry_type: string;
  inquiry_subject: string;
  inquiry_description: string;
  inquiry_priority: string; // e.g., 'High', 'Medium', 'Low'
  inquiry_status: string; // e.g., 'New', 'In Progress', 'Resolved'
  assigned_to: string;
  inquiry_date: string; // ISO date string or Date object
  response_date: string;
  resolution_date: string;
  follow_up_date: string;
  feedback_status: string;
  inquiry_resolution: string;
  inquiry_attachments: string[];
  status: "active" | "inactive"; // Overall record status
};
// --- End FormItem Type ---

// --- Zod Schema for Inquiry Filter Form ---
const inquiryFilterFormSchema = z.object({
  filterRecordStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryPriority: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(), // For 'New', 'In Progress'
  filterAssignedTo: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterFeedbackStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  filterResponseDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  filterResolutionDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  filterFollowUpDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  // Add company_name or contact_person_name if you want text input filters here,
  // though they are often better handled by the main search.
});
type InquiryFilterFormData = z.infer<typeof inquiryFilterFormSchema>;
// --- End Inquiry Filter Schema ---

const FormListTableTools = () => {
  const {
    tableData,
    setTableData,
    allInquiries, // This should be the full list of FormItem
    setFilterCriteria: applyFiltersToContext, // Function from context to apply filters
    filterCriteria: contextFilterCriteria, // Current filters from context (if needed to pre-fill)
  } = useInquiryList(); // Use your inquiry-specific context hook

  const inquiriesData: FormItem[] = allInquiries || [];

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  // Local state for the form within this drawer
  const [localFilterCriteria, setLocalFilterCriteria] =
    useState<InquiryFilterFormData>(
      (contextFilterCriteria as InquiryFilterFormData) || {
        // Pre-fill from context if available
        filterInquiryDate: [null, null],
        filterResponseDate: [null, null],
        filterResolutionDate: [null, null],
        filterFollowUpDate: [null, null],
      }
    );

  const filterFormMethods = useForm<InquiryFilterFormData>({
    resolver: zodResolver(inquiryFilterFormSchema),
    defaultValues: localFilterCriteria,
  });

  // Sync form with localFilterCriteria if it changes (e.g., from clear or context update)
  useEffect(() => {
    filterFormMethods.reset(localFilterCriteria);
  }, [localFilterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    // Ensure the form shows the currently active filters (from local state, which could be synced from context)
    filterFormMethods.reset(localFilterCriteria);
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: InquiryFilterFormData) => {
    console.log("Applying Inquiry Filters:", data);
    setLocalFilterCriteria(data); // Update local form state
    if (applyFiltersToContext) {
      applyFiltersToContext(data); // Pass to context for actual data filtering
    }
    const newTableData = cloneDeep(tableData);
    newTableData.pageIndex = 1; // Reset to first page
    setTableData(newTableData);
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: InquiryFilterFormData = {
      // Define cleared state
      filterInquiryDate: [null, null],
      filterResponseDate: [null, null],
      filterResolutionDate: [null, null],
      filterFollowUpDate: [null, null],
    };
    filterFormMethods.reset(defaultFilters);
    setLocalFilterCriteria(defaultFilters);
    if (applyFiltersToContext) {
      applyFiltersToContext(defaultFilters);
    }
    const newTableData = cloneDeep(tableData);
    newTableData.pageIndex = 1;
    setTableData(newTableData);
  };

  const handleInputChange = (val: string) => {
    const newTableData = cloneDeep(tableData);
    newTableData.query = val;
    newTableData.pageIndex = 1;
    if (
      (typeof val === "string" && val.length > 1) ||
      (typeof val === "string" && val.length === 0)
    ) {
      setTableData(newTableData);
    }
  };

  const { DatePickerRange } = DatePicker;

  // --- Dynamic Options Generation ---
  const recordStatusOptions = useMemo(
    () => [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    []
  );

  const inquiryTypeOptions = useMemo(() => {
    if (!inquiriesData || inquiriesData.length === 0) return [];
    return Array.from(
      new Set(inquiriesData.map((item) => item.inquiry_type).filter(Boolean))
    ).map((type) => ({ value: type, label: type }));
  }, [inquiriesData]);

  const inquiryPriorityOptions = useMemo(() => {
    if (!inquiriesData || inquiriesData.length === 0) return [];
    return Array.from(
      new Set(
        inquiriesData.map((item) => item.inquiry_priority).filter(Boolean)
      )
    ).map((priority) => ({ value: priority, label: priority }));
  }, [inquiriesData]);

  const inquiryStatusOptions = useMemo(() => {
    // For 'New', 'In Progress', etc.
    if (!inquiriesData || inquiriesData.length === 0) return [];
    return Array.from(
      new Set(inquiriesData.map((item) => item.inquiry_status).filter(Boolean))
    ).map((status) => ({ value: status, label: status }));
  }, [inquiriesData]);

  const assignedToOptions = useMemo(() => {
    if (!inquiriesData || inquiriesData.length === 0) return [];
    return Array.from(
      new Set(inquiriesData.map((item) => item.assigned_to).filter(Boolean))
    ).map((assignee) => ({ value: assignee, label: assignee }));
  }, [inquiriesData]);

  const feedbackStatusOptions = useMemo(() => {
    if (!inquiriesData || inquiriesData.length === 0) return [];
    return Array.from(
      new Set(inquiriesData.map((item) => item.feedback_status).filter(Boolean))
    ).map((status) => ({ value: status, label: status }));
  }, [inquiriesData]);
  // --- End Dynamic Options ---

  const handleExport = () => console.log("Export Inquiries Clicked");
  const handleImport = () => console.log("Import Inquiries Clicked"); // If needed

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <FormListSearch
        onInputChange={(e) => handleInputChange(e.target.value)}
      />{" "}
      {/* Pass event target value */}
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
        width={480}
        footer={
          <div className="text-right w-full">
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
              form="filterInquiryForm" // Unique form ID
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <UiForm
          id="filterInquiryForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-5"
        >
          <div className="md:grid grid-cols-2 gap-2">
          <UiFormItem label="Record Status">
            <Controller
              name="filterRecordStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Status"
                  options={recordStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Inquiry Type">
            <Controller
              name="filterInquiryType"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Type"
                  options={inquiryTypeOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Inquiry Priority">
            <Controller
              name="filterInquiryPriority"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Priority"
                  options={inquiryPriorityOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Inquiry Status">
            <Controller
              name="filterInquiryStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Status"
                  options={inquiryStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Assigned To">
            <Controller
              name="filterAssignedTo"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Assignee"
                  options={assignedToOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Feedback Status">
            <Controller
              name="filterFeedbackStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Status"
                  options={feedbackStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Inquiry Date Range">
            <Controller
              name="filterInquiryDate"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePickerRange
                  placeholder="Select Inquiry Dates"
                  value={field.value as [Date | null, Date | null]}
                  onChange={field.onChange}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Response Date Range">
            <Controller
              name="filterResponseDate"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePickerRange
                  placeholder="Select Response Dates"
                  value={field.value as [Date | null, Date | null]}
                  onChange={field.onChange}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Resolution Date Range">
            <Controller
              name="filterResolutionDate"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePickerRange
                  placeholder="Select Resolution Dates"
                  value={field.value as [Date | null, Date | null]}
                  onChange={field.onChange}
                />
              )}
            />
          </UiFormItem>

          <UiFormItem label="Follow-up Date Range">
            <Controller
              name="filterFollowUpDate"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePickerRange
                  placeholder="Select Follow-up Dates"
                  value={field.value as [Date | null, Date | null]}
                  onChange={field.onChange}
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
