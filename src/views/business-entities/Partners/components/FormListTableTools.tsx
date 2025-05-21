import useCustomerList from "@/views/concepts/customers/CustomerList/hooks/useCustomerList";

import cloneDeep from "lodash/cloneDeep";
import FormListSearch from "./FormListSearch";
import {
  Drawer,
  Form as UiForm,
  FormItem as UiFormItem,
  Input as UiInput,
  Select as UiSelect,
  Button,
} from "@/components/ui"; // Added Drawer, Button etc.
import { TbCloudDownload, TbCloudUpload, TbFilter } from "react-icons/tb";
import { DatePicker } from "@/components/ui/DatePicker"; // Added DatePicker
import { useForm, Controller } from "react-hook-form"; // Added useForm, Controller
// import { TbCloudUpload, TbFilter } from 'react-icons/tb'
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"; // Added zodResolver
import { z } from "zod"; // Added z

const filterFormSchema = z.object({
  // Making all fields optional and arrays of selected option objects
  // filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterBusinessType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // // filterMemberClass: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // filterInterestedFor: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterInterestedCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // // filterInterestedSubCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // filterBrand: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // // filterCreatedDate: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(), // Date range needs date picker
  // // filterMembershipType: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // // filterRelationshipManager: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // // filterMemberGrade: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const FormListTableTools = () => {
  const { tableData, setTableData } = useCustomerList();

  const handleInputChange = (val: string) => {
    const newTableData = cloneDeep(tableData);
    newTableData.query = val;
    newTableData.pageIndex = 1;
    if (typeof val === "string" && val.length > 1) {
      setTableData(newTableData);
    }

    if (typeof val === "string" && val.length === 0) {
      setTableData(newTableData);
    }
  };

  const [filterOpen, setFilterOpen] = useState(false);

  const openFilterDrawer = () => setFilterOpen(true);
  const closeFilterDrawer = () => setFilterOpen(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({}); // Initialize with empty object
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // Keep defaultValues in sync with filterCriteria
  });

  // useEffect(() => { // Reset form when filterCriteria changes externally (e.g. on clear)
  //     filterFormMethods.reset(filterCriteria);
  // }, [filterCriteria, filterFormMethods]);
  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {}; // Define what empty/cleared filters mean
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    // handleSetTableData({ pageIndex: 1 });
    // closeFilterDrawer(); // Optionally close drawer on clear
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <FormListSearch onInputChange={handleInputChange} />
      {/* <FormListTableFilter /> */}
      <Button icon={<TbFilter />} onClick={openFilterDrawer}>
        Filter
      </Button>
      {/* Filter Drawer */}
      <Drawer
        title="Filter Members"
        isOpen={filterOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear Filters
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterMemberForm"
              type="submit"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <UiForm id="filterMemberForm" className="flex flex-col gap-4">
          {/* <UiFormItem label="Status">
                        <Controller name="filterStatus"
                            render={({ field }) => <UiSelect isMulti placeholder="Select status..."
                                                        value={field.value || []} onChange={val => field.onChange(val || [])} />} />
                    </UiFormItem> */}
          {/* Add other filter fields here: created date (needs DatePicker), membership type, RM, member grade */}
        </UiForm>
      </Drawer>
      <Button icon={<TbCloudDownload />}>Import</Button>
      <Button icon={<TbCloudUpload />}>Export</Button>
    </div>
  );
};

export default FormListTableTools;
