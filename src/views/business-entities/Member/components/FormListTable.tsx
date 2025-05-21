// FormListTable.tsx

import { useState, useMemo, useCallback, Ref, useEffect } from "react"; // Added React, useEffect, Ref
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import Tooltip from "@/components/ui/Tooltip";
import DataTable from "@/components/shared/DataTable";
import { useNavigate } from "react-router-dom"; // Link removed if not used
import { useForm, Controller } from "react-hook-form"; // Added useForm, Controller
import { zodResolver } from "@hookform/resolvers/zod"; // Added zodResolver
import { z } from "zod"; // Added z
import FormListSearch from "./FormListSearch";

import {
  TbPencil,
  TbEye,
  TbUserCircle,
  TbShare,
  TbCloudUpload,
  TbDotsVertical,
  TbCloudDownload,
  TbFilter, // Added TbFilter
} from "react-icons/tb";
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import {
  Drawer,
  Form as UiForm,
  FormItem as UiFormItem,
  Input as UiInput,
  Select as UiSelect,
  Button,
} from "@/components/ui"; // Added Drawer, Button etc.

// --- Define Form Type (Your existing FormItem) ---
export type FormItem = {
  id: string;
  member_name: string;
  member_contact_number: string;
  member_email_id: string;
  member_photo: string;
  member_photo_upload: string;
  member_role: string;
  member_status: "active" | "inactive";
  member_join_date: string;
  profile_completion: number;
  success_score: number;
  trust_score: number;
  activity_score: number;
  associated_brands: string[];
  business_category: string[];
  interested_in: string;
  company_id: string;
  company_name: string;
  membership_stats: string;
  member_location: string;
  kyc_status: string;
};
// --- End Form Type Definition ---

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  // Making all fields optional and arrays of selected option objects
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterContinent: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBusinessType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterState: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCity: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // filterMemberClass: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  filterInterestedFor: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInterestedCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // filterInterestedSubCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  filterBrand: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // filterCreatedDate: z.object({ from: z.date().optional(), to: z.date().optional() }).optional(), // Date range needs date picker
  // filterMembershipType: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // filterRelationshipManager: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  // filterMemberGrade: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Add if needed
  filterKycVerified: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Filter Schema ---

// --- Status Colors ---
const statusColor: Record<FormItem["member_status"], string> = {
  active: "bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600",
  inactive: "bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600",
};

// --- MOCK FILTER OPTIONS (Replace with dynamic/actual data) ---
const memberStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const continentOptions = [
  { value: "Asia", label: "Asia" },
  { value: "Africa", label: "Africa" },
  { value: "North America", label: "North America" },
  { value: "South America", label: "South America" },
  { value: "Antarctica", label: "Antarctica" },
  { value: "Europe", label: "Europe" },
  { value: "Australia", label: "Australia" },
];
const businessTypeOptions = [
  // Example
  { value: "Manufacturer", label: "Manufacturer" },
  { value: "Retailer", label: "Retailer" },
  { value: "Service", label: "Service" },
];
const stateOptions = [
  // Example
  { value: "NY", label: "New York" },
  { value: "CA", label: "California" },
  { value: "KA", label: "Karnataka" },
];
const cityOptions = [
  // Example
  { value: "New York City", label: "New York City" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Bengaluru", label: "Bengaluru" },
];
const interestedForOptions = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Both", label: "Both" },
];
const kycStatusOptions = [
  { value: "Verified", label: "Verified" },
  { value: "Pending", label: "Pending" },
  { value: "Not Submitted", label: "Not Submitted" },
];
// --- END MOCK FILTER OPTIONS ---

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onChangeStatus,
  onShare,
  onMore,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onChangeStatus: () => void;
  onShare: () => void;
  onMore: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      {/* For Share and More, you'd typically use Dropdown component */}
      <Tooltip title="Share">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
          role="button"
          onClick={onShare}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400"
          role="button"
          onClick={onMore}
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
    </div>
  );
};
// --- End ActionColumn ---

// --- Initial Dummy Data ---
const initialDummyForms: FormItem[] = [
  // Your existing initialDummyForms data...
  {
    id: "1",
    member_name: "John Doe",
    member_contact_number: "+1234567890",
    member_email_id: "john.doe@example.com",
    member_photo: "https://example.com/photo1.jpg",
    member_photo_upload: "Uploaded at 2025-05-17T10:00:00Z",
    member_role: "Director",
    member_status: "active",
    member_join_date: "2023-01-01",
    profile_completion: 85.5,
    success_score: 75,
    trust_score: 80,
    activity_score: 90,
    associated_brands: ["Brand A", "Brand B"],
    business_category: ["Automotive", "Electronics"],
    interested_in: "Both",
    company_id: "COMP12345",
    company_name: "Acme Corporation",
    membership_stats: "12/43",
    member_location: "USA / New York / NY",
    kyc_status: "Verified",
  },
  {
    id: "2",
    member_name: "Jane Smith",
    member_contact_number: "+1987654321",
    member_email_id: "jane.smith@example.com",
    member_photo: "https://example.com/photo2.jpg",
    member_photo_upload: "Uploaded at 2025-05-16T11:00:00Z",
    member_role: "Manager",
    member_status: "inactive",
    member_join_date: "2022-06-15",
    profile_completion: 72.0,
    success_score: 60,
    trust_score: 70,
    activity_score: 65,
    associated_brands: ["Brand C"],
    business_category: ["Healthcare"],
    interested_in: "Sell",
    company_id: "COMP67890",
    company_name: "Beta Enterprises",
    membership_stats: "8/30",
    member_location: "UK / London",
    kyc_status: "Pending",
  },
  {
    id: "3",
    member_name: "Alice Johnson",
    member_contact_number: "+1123456789",
    member_email_id: "alice.johnson@example.com",
    member_photo: "https://example.com/photo3.jpg",
    member_photo_upload: "Uploaded at 2025-05-15T09:30:00Z",
    member_role: "Engineer",
    member_status: "active",
    member_join_date: "2021-09-10",
    profile_completion: 92.0,
    success_score: 88,
    trust_score: 95,
    activity_score: 98,
    associated_brands: ["Brand D", "Brand E"],
    business_category: ["IT Services", "FinTech"],
    interested_in: "Buy",
    company_id: "COMP24680",
    company_name: "Gamma Innovations",
    membership_stats: "20/50",
    member_location: "India / Bengaluru / KA",
    kyc_status: "Verified",
  },
];
// --- End Dummy Data ---

const FormListTable = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<FormItem[]>(initialDummyForms);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedForms, setSelectedForms] = useState<FormItem[]>([]);

  // --- Filter Drawer State and Logic ---
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({}); // Initialize with empty object

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // Keep defaultValues in sync with filterCriteria
  });

  useEffect(() => {
    // Reset form when filterCriteria changes externally (e.g. on clear)
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria); // Reset form with current criteria when opening
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 }); // Reset to page 1 when filters change
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {}; // Define what empty/cleared filters mean
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
    // closeFilterDrawer(); // Optionally close drawer on clear
  };
  // --- End Filter Drawer Logic ---

  const { pageData, total } = useMemo(() => {
    let filteredData = [...forms];

    // Apply search query first
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = filteredData.filter(
        (form) =>
          form.id.toLowerCase().includes(query) ||
          form.member_name.toLowerCase().includes(query) ||
          form.member_email_id.toLowerCase().includes(query) ||
          // ... other searchable fields
          form.company_name.toLowerCase().includes(query)
      );
    }

    // Apply drawer filters
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map(
        (opt) => opt.value
      );
      filteredData = filteredData.filter((form) =>
        selectedStatuses.includes(form.member_status)
      );
    }
    if (
      filterCriteria.filterContinent &&
      filterCriteria.filterContinent.length > 0
    ) {
      const selectedContinents = filterCriteria.filterContinent.map((opt) =>
        opt.value.toLowerCase()
      );
      // Assuming member_location contains continent, e.g., "USA / New York / NY / North America"
      // This is a naive check; you might need a more robust way to extract continent
      filteredData = filteredData.filter((form) =>
        selectedContinents.some((continent) =>
          form.member_location?.toLowerCase().includes(continent)
        )
      );
    }
    if (
      filterCriteria.filterBusinessType &&
      filterCriteria.filterBusinessType.length > 0
    ) {
      const selectedTypes = filterCriteria.filterBusinessType.map((opt) =>
        opt.value.toLowerCase()
      );
      // Assuming business_category is an array and we check if any selected type is in it
      filteredData = filteredData.filter((form) =>
        form.business_category.some((cat) =>
          selectedTypes.includes(cat.toLowerCase())
        )
      );
    }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) {
      const selectedStates = filterCriteria.filterState.map((opt) =>
        opt.value.toLowerCase()
      );
      filteredData = filteredData.filter(
        (form) =>
          selectedStates.some((state) =>
            form.member_location
              ?.toLowerCase()
              .includes(` / ${state}`.toLowerCase())
          ) // More specific state check
      );
    }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) {
      const selectedCities = filterCriteria.filterCity.map((opt) =>
        opt.value.toLowerCase()
      );
      filteredData = filteredData.filter(
        (form) =>
          selectedCities.some((city) =>
            form.member_location
              ?.toLowerCase()
              .includes(` / ${city} / `.toLowerCase())
          ) // More specific city check
      );
    }
    if (
      filterCriteria.filterInterestedFor &&
      filterCriteria.filterInterestedFor.length > 0
    ) {
      const selectedInterests = filterCriteria.filterInterestedFor.map(
        (opt) => opt.value
      );
      filteredData = filteredData.filter((form) =>
        selectedInterests.includes(form.interested_in)
      );
    }
    if (
      filterCriteria.filterInterestedCategory &&
      filterCriteria.filterInterestedCategory.length > 0
    ) {
      const selectedCategories = filterCriteria.filterInterestedCategory.map(
        (opt) => opt.value.toLowerCase()
      );
      filteredData = filteredData.filter((form) =>
        form.business_category.some((cat) =>
          selectedCategories.includes(cat.toLowerCase())
        )
      );
    }
    if (filterCriteria.filterBrand && filterCriteria.filterBrand.length > 0) {
      const selectedBrands = filterCriteria.filterBrand.map((opt) =>
        opt.value.toLowerCase()
      );
      filteredData = filteredData.filter((form) =>
        form.associated_brands.some((brand) =>
          selectedBrands.includes(brand.toLowerCase())
        )
      );
    }
    if (
      filterCriteria.filterKycVerified &&
      filterCriteria.filterKycVerified.length > 0
    ) {
      const selectedKyc = filterCriteria.filterKycVerified.map(
        (opt) => opt.value
      );
      filteredData = filteredData.filter((form) =>
        selectedKyc.includes(form.kyc_status)
      );
    }
    // Add more filter logic for other fields...

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      // ... your existing sorting logic
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof FormItem] ?? "";
        const bValue = b[key as keyof FormItem] ?? "";

        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = filteredData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = filteredData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [forms, tableData, filterCriteria]); // Added filterCriteria dependency

  const handleEdit = (form: FormItem) => {
    /* ... */
  };
  const handleViewDetails = (form: FormItem) => {
    /* ... */
  };
  const handleCloneForm = (form: FormItem) => {
    /* ... */
  };
  const handleChangeStatus = (form: FormItem) => {
    /* ... */
  };
  const handleShare = (form: FormItem) => {
    console.log("Share:", form.id);
  };
  const handleMore = (form: FormItem) => {
    console.log("More options for:", form.id);
  };

  const columns: ColumnDef<FormItem>[] = useMemo(
    () => [
      // Your existing columns definition...
      {
        header: "Member",
        accessorKey: "member_name",
        size: 180,
        cell: (props) => (
          <div className="flex items-center">
            <Avatar
              size={32}
              shape="circle"
              src={props.row.original.member_photo}
              icon={<TbUserCircle />}
            />
            <div className="ml-2 rtl:mr-2 text-xs">
              <span className="font-semibold">
                {" "}
                {props.row.original.id} | {props.row.original.member_name}
              </span>
              <div className="text-xs text-gray-500">
                {props.row.original.member_email_id}
              </div>
              <div className="text-xs text-gray-500">
                {props.row.original.member_contact_number}
              </div>
              <div className="text-xs text-gray-500">
                {" "}
                {props.row.original.member_location}{" "}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Company",
        accessorKey: "company_name",
        size: 200,
        cell: (props) => (
          <div className="ml-2 rtl:mr-2 text-xs">
            <b className="text-xs text-gray-500">
              {props.row.original.company_id}
            </b>
            <div className="text-xs text-gray-500">
              {props.row.original.company_name}
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "member_status",
        size: 140,
        cell: (props) => {
          const { member_status, member_join_date } = props.row.original;
          return (
            <div className="flex flex-col text-xs">
              <Tag
                className={`${statusColor[member_status]} inline capitalize`}
              >
                {member_status}
              </Tag>
              <span className="mt-0.5">
                <div className="text-[10px] text-gray-500 mt-0.5">
                Joined Date: &nbsp;&nbsp;&nbsp; {new Date(member_join_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }).replace(/ /g, "/")}
                </div>
              </span>
            </div>
          );
        },
      },
      {
        header: "Profile",
        accessorKey: "profile_completion",
        size: 220,
        cell: (props) => (
          <div className="text-xs flex flex-col">
            <b>{props.row.original.membership_stats}</b>{" "}
            {/* Assuming membership_stats is like "INS - Premium" */}
            <span>
              <b>RM: </b>Ajay Patel
            </span>{" "}
            {/* Placeholder */}
            <span>
              <b>Grade: </b>A
            </span>{" "}
            {/* Placeholder */}
            <Tooltip
              title={`Profile: ${props.row.original.profile_completion}%`}
            >
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${props.row.original.profile_completion}%` }}
                ></div>
              </div>
            </Tooltip>
          </div>
        ),
      },
      {
        header: "Preferences",
        accessorKey: "associated_brands",
        size: 300, // Changed accessorKey
        cell: (props) => (
          <div className="flex flex-col gap-1">
            <span className="text-xs">
              <b className="text-xs">Brands: </b>
              <span className="text-[11px]">
                {props.row.original.associated_brands.join(", ")}{" "}
              </span>
            </span>
            <span className="text-xs">
              <b className="text-xs">Category: </b>
              <span className="text-[11px]">
                {props.row.original.business_category.join(", ")}
              </span>
            </span>
            <span className="text-xs">
              <span className="text-[11px]">
                <b className="text-xs">Interested: </b>{" "}
                {props.row.original.interested_in}
              </span>
            </span>
          </div>
        ),
      },
      {
        header: "Ratio",
        accessorKey: "trust_score",
        size: 110,
        cell: (props) => (
          <div className="flex flex-col gap-1">
            <Tag className="flex gap-1 text-[10px]">
              <b>Success:</b> {props.row.original.success_score}%
            </Tag>
            <Tag className="flex gap-1 text-[10px]">
              <b>Trust:</b> {props.row.original.trust_score}%
            </Tag>
            <Tag className="flex gap-1 text-[10px] flex-wrap">
              <b>Activity:</b> {props.row.original.activity_score}%
            </Tag>
          </div>
        ),
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            onEdit={() => handleEdit(props.row.original)}
            onViewDetail={() => handleViewDetails(props.row.original)}
            onShare={() => handleShare(props.row.original)}
            onMore={() => handleMore(props.row.original)}
          />
        ),
      },
    ],
    []
  );

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) => {
      // Changed data to Partial
      setTableData((prev) => ({ ...prev, ...data }));
      if (selectedForms.length > 0 && !data.pageIndex) {
        // Clear selection if not just a page change
        setSelectedForms([]);
      }
    },
    [selectedForms.length]
  );

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) =>
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
    /* ... */
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<FormItem>[]) => {
      /* ... */
    },
    []
  );

  const handleImport = () => {
    console.log("Import clicked");
    // Implement import functionality
  };

  return (
    <>
      {" "}
      {/* Added Fragment */}
      {/* Table Tools (Search + Filter Button) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <FormListSearch
          onInputChange={(e) =>
            handleSetTableData({ query: e.target.value, pageIndex: 1 })
          }
        />
        {/* <FormListTableFilter /> */}
        <Button icon={<TbFilter />} onClick={openFilterDrawer}>
          Filter
        </Button>
        <Button icon={<TbCloudDownload />} onClick={handleImport}>
          Import
        </Button>
        <Button icon={<TbCloudUpload />}>Export</Button>
      </div>
      <DataTable
        selectable
        columns={columns}
        data={pageData}
        noData={!isLoading && forms.length === 0}
        loading={isLoading}
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) =>
          selectedForms.some((selected) => selected.id === row.id)
        }
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      {/* Filter Drawer */}
      <Drawer
        title="Filter Members"
        isOpen={isFilterDrawerOpen}
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
        <UiForm
          id="filterMemberForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <UiFormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select status..."
                  options={memberStatusOptions}
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
                  placeholder="Select continent..."
                  options={continentOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Business Type">
            <Controller
              name="filterBusinessType"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select business type..."
                  options={businessTypeOptions}
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
                  placeholder="Select state..."
                  options={stateOptions} // Ideally dynamic
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
                  placeholder="Select city..."
                  options={cityOptions} // Ideally dynamic
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
                  placeholder="Select interest..."
                  options={interestedForOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Interested Category">
            <Controller
              name="filterInterestedCategory"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select category..."
                  options={businessTypeOptions} // Assuming same as business type for example
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Brand">
            {" "}
            {/* Assuming associated_brands are the source */}
            <Controller
              name="filterBrand"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select brand..."
                  options={forms
                    .flatMap((f) => f.associated_brands)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((b) => ({ value: b, label: b }))}
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
                  placeholder="Select KYC status..."
                  options={kycStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </UiFormItem>
          {/* Add other filter fields here: created date (needs DatePicker), membership type, RM, member grade */}
        </UiForm>
      </Drawer>
    </>
  );
};

export default FormListTable;
