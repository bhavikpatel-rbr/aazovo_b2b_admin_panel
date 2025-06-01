import React, { useState, useMemo, useCallback, Ref, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CSVLink } from "react-csv";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import Tooltip from "@/components/ui/Tooltip";
import DataTable from "@/components/shared/DataTable";
import {
  Drawer,
  Form as UiForm,
  FormItem as UiFormItem,
  Input as UiInput,
  Select as UiSelect,
  Button,
  Dropdown,
} from "@/components/ui";
import StickyFooter from "@/components/shared/StickyFooter";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import RichTextEditor from "@/components/shared/RichTextEditor";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

// Icons
import {
  TbPencil,
  TbEye,
  TbUserCircle,
  TbShare,
  TbCloudUpload,
  TbDotsVertical,
  TbCloudDownload,
  TbFilter,
  TbPlus,
  TbChecks,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  deleteAllMemberAction,
  getMemberAction
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import axiosInstance, { isAxiosError } from '@/services/api/api';


// --- FormItem Type (Member Data Structure) ---
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
  membership_stats: string; // Example: "INS - PREMIUM"
  member_location: string; // Example: "USA / New York / NY" or "India / Bengaluru / KA"
  kyc_status: string; // Example: "Verified", "Pending"
};
// --- End FormItem Type ---

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
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
  filterInterestedFor: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInterestedCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBrand: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
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
  { value: "Manufacturer", label: "Manufacturer" },
  { value: "Retailer", label: "Retailer" },
  { value: "Service", label: "Service" },
  { value: "Automotive", label: "Automotive" },
  { value: "Electronics", label: "Electronics" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "IT Services", label: "IT Services" },
  { value: "FinTech", label: "FinTech" },
];
const stateOptions = [
  { value: "NY", label: "New York" },
  { value: "CA", label: "California" },
  { value: "KA", label: "Karnataka" },
  // Add more states based on your data
];
const cityOptions = [
  { value: "New York City", label: "New York City" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Bengaluru", label: "Bengaluru" },
  // Add more cities
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

// --- Simplified Member List Store (Replaces useCustomerList for this context) ---
interface MemberListStore {
  memberList: FormItem[];
  selectedMembers: FormItem[];
  memberListTotal: number;
  setMemberList: React.Dispatch<React.SetStateAction<FormItem[]>>;
  setSelectedMembers: React.Dispatch<React.SetStateAction<FormItem[]>>;
  setMemberListTotal: React.Dispatch<React.SetStateAction<number>>;
  // Derived/helper functions could be added here
}

const MemberListContext = React.createContext<MemberListStore | undefined>(undefined);

const useMemberList = (): MemberListStore => {
  const context = useContext(MemberListContext);
  if (!context) {
    throw new Error("useMemberList must be used within a MemberListProvider");
  }
  return context;
};

const MemberListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // debugger



  const { MemberData = [] } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [memberList, setMemberList] = useState<FormItem[]>(MemberData?.data ?? []);
  const [selectedMembers, setSelectedMembers] = useState<FormItem[]>([]);
  const [memberListTotal, setMemberListTotal] = useState(MemberData?.total ?? 0);
console.log(MemberData, 'MemberData')
  useEffect(() => {
    setMemberList(MemberData?.data)
    setMemberListTotal(MemberData?.total)
  }, [MemberData])

  useEffect(() => {
    dispatch(getMemberAction()); // Fetch continents for select dropdown
  }, [dispatch]);









  return (
    <MemberListContext.Provider value={{
      memberList, setMemberList,
      selectedMembers, setSelectedMembers,
      memberListTotal, setMemberListTotal
    }}>
      {children}
    </MemberListContext.Provider>
  );
};
// --- End Member List Store ---


// --- FormListSearch Component (Simple Inline Version) ---
interface FormListSearchProps {
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const FormListSearch: React.FC<FormListSearchProps> = ({ onInputChange }) => {
  return (
    <UiInput
      placeholder="Quick Search..."
      onChange={onInputChange}
    // className="max-w-xs"
    // Add any other props like prefix icon if needed
    />
  );
};
// --- End FormListSearch ---


// --- FormListActionTools Component (for Page Header) ---
const FormListActionTools = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/member-create")}
      >
        Add New
      </Button>
    </div>
  );
};
// --- End FormListActionTools ---


// --- ActionColumn Component (for DataTable) ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  // onChangeStatus, // This was not used in the original ActionColumn, so removed for now
  onShare,
  onMore,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  // onChangeStatus: () => void;
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
          onClick={onMore} // This onClick might be redundant if Dropdown handles its own open
        >
          <Dropdown renderTitle={<TbDotsVertical />} style={{ fontSize: "10px" }}>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Assign to company</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Assign to RM/GM</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add Feedback or Internal Note</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Request For</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add in Active</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add Schedule</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add Task</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>View Documents</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>View Alert</Dropdown.Item>
          </Dropdown>
        </div>
      </Tooltip>
    </div>
  );
};
// --- End ActionColumn ---


// --- FormListTable Component ---
const FormListTable = () => {
  const navigate = useNavigate();
  const {
    memberList: forms, // Renaming for consistency with original 'forms' variable
    setMemberList,
    selectedMembers,
    setSelectedMembers,
    memberListTotal, // This is the total before client-side filtering if data isn't from server
    setMemberListTotal
  } = useMemberList();

  const [isLoading, setIsLoading] = useState(false); // For API loading simulation
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  // Filter Drawer State and Logic
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const { pageData, total } = useMemo(() => {
    let filteredData = [...forms];
    if (tableData.query) {
      const query = tableData.query?.toLowerCase();
      filteredData = filteredData.filter(
        (form) =>
          form?.member_name?.toLowerCase()?.includes(query) ||
          form?.member_email_id?.toLowerCase()?.includes(query) ||
          form?.company_name?.toLowerCase()?.includes(query)
      );
    }

    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map((opt) => opt.value);
      filteredData = filteredData.filter((form) => selectedStatuses.includes(form.member_status));
    }
    if (filterCriteria.filterContinent && filterCriteria.filterContinent.length > 0) {
      const selectedContinents = filterCriteria.filterContinent.map((opt) => opt.value.toLowerCase());
      filteredData = filteredData.filter((form) =>
        selectedContinents.some((continent) => form.member_location?.toLowerCase().includes(continent))
      );
    }
    if (filterCriteria.filterBusinessType && filterCriteria.filterBusinessType.length > 0) {
      const selectedTypes = filterCriteria.filterBusinessType.map((opt) => opt.value.toLowerCase());
      filteredData = filteredData.filter((form) =>
        form.business_category.some((cat) => selectedTypes.includes(cat.toLowerCase()))
      );
    }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) {
      const selectedStates = filterCriteria.filterState.map(opt => opt.value.toLowerCase());
      filteredData = filteredData.filter(form =>
        selectedStates.some(state => {
          const locationParts = form.member_location?.toLowerCase().split(' / ');
          // Assuming state is the 3rd part if continent is present, or 2nd if not.
          // This needs robust parsing based on your member_location format.
          // Example: "USA / New York / NY / North America" -> state is NY
          // Example: "India / Bengaluru / KA" -> state is KA
          return locationParts && locationParts.length >= 3 && locationParts[2] === state;
        })
      );
    }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) {
      const selectedCities = filterCriteria.filterCity.map(opt => opt.value.toLowerCase());
      filteredData = filteredData.filter(form =>
        selectedCities.some(city => {
          const locationParts = form.member_location?.toLowerCase().split(' / ');
          // Example: "USA / New York / NY / North America" -> city is New York
          // Example: "India / Bengaluru / KA" -> city is Bengaluru
          return locationParts && locationParts.length >= 2 && locationParts[1] === city;
        })
      );
    }
    if (filterCriteria.filterInterestedFor && filterCriteria.filterInterestedFor.length > 0) {
      const selectedInterests = filterCriteria.filterInterestedFor.map((opt) => opt.value);
      filteredData = filteredData.filter((form) => selectedInterests.includes(form.interested_in));
    }
    if (filterCriteria.filterInterestedCategory && filterCriteria.filterInterestedCategory.length > 0) {
      const selectedCategories = filterCriteria.filterInterestedCategory.map((opt) => opt.value.toLowerCase());
      filteredData = filteredData.filter((form) =>
        form.business_category.some((cat) => selectedCategories.includes(cat.toLowerCase()))
      );
    }
    if (filterCriteria.filterBrand && filterCriteria.filterBrand.length > 0) {
      const selectedBrands = filterCriteria.filterBrand.map((opt) => opt.value.toLowerCase());
      filteredData = filteredData.filter((form) =>
        form.associated_brands.some((brand) => selectedBrands.includes(brand.toLowerCase()))
      );
    }
    if (filterCriteria.filterKycVerified && filterCriteria.filterKycVerified.length > 0) {
      const selectedKyc = filterCriteria.filterKycVerified.map((opt) => opt.value);
      filteredData = filteredData.filter((form) => selectedKyc.includes(form.kyc_status));
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof FormItem] ?? "";
        const bValue = b[key as keyof FormItem] ?? "";
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    // const dataTotal = filteredData.length;
    const dataTotal = memberListTotal;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = filteredData;

    return { pageData: dataForPage, total: dataTotal };
  }, [forms, tableData, filterCriteria]);

  const handleEdit = (form: FormItem) => { navigate("/business-entities/member-create", {state:form}); console.log("Edit:", form.id); };
  const handleViewDetails = (form: FormItem) => { console.log("View Details:", form.id); navigate("/business-entities/member-create", {state:form}) };
  const handleChangeStatus = (form: FormItem) => { console.log("Change Status:", form.id); /* Implement status change */ };
  const handleShare = (form: FormItem) => { console.log("Share:", form.id); };
  const handleMore = (form: FormItem) => { console.log("More options for:", form.id); };

  console.log(pageData, 'pageData');
  
  const columns: ColumnDef<FormItem>[] = useMemo(
    () => [
      {
        header: "Member",
        accessorKey: "member_name",
        size: 180,
        cell: (props) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Avatar size={32} shape="circle" src={props.row.original.member_photo} icon={<TbUserCircle />} />
              <div className="text-xs">
                <h6 className="text-xs">{props.row.original.id}</h6>
                <span>{props.row.original.member_name}</span>
              </div>
            </div>
            <div className="ml-2 mr-2 text-xs">
              <div className="text-xs text-gray-500">{props.row.original.member_email_id}</div>
              <div className="text-xs text-gray-500">{props.row.original.member_contact_number}</div>
              <div className="text-xs text-gray-500">{props.row.original.member_location}</div>
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
            <b className="text-xs text-gray-500">{props.row.original.company_id}</b>
            <div className="text-xs text-gray-500">{props.row.original.company_name}</div>
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
              <Tag className={`${statusColor[member_status]} inline capitalize`}>{member_status}</Tag>
              <span className="mt-0.5">
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Joined Date:    {" "}
                  {new Date(member_join_date).toLocaleDateString("en-GB", {
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
            <div>
              <Tag className="text-[10px] mb-1 bg-orange-100 text-orange-400">{props.row.original.membership_stats}</Tag>
            </div>
            <span><b>RM: </b>{props.row.original.member_name}</span> {/* Placeholder */}
            <span><b>Grade: </b>A</span> {/* Placeholder */}
            <Tooltip title={`Profile: ${props.row.original.profile_completion}%`}>
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
        size: 300,
        cell: (props) => (
          <div className="flex flex-col gap-1">
            <span className="text-xs">
              <b className="text-xs">Brands: </b>
              <span className="text-[11px]">{props.row.original.associated_brands}</span>
            </span>
            <span className="text-xs">
              <b className="text-xs">Category: </b>
              <span className="text-[11px]">{props.row.original.business_category}</span>
            </span>
            <span className="text-xs">
              <span className="text-[11px]"><b className="text-xs">Interested: </b>{props.row.original.interested_in}</span>
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
            <Tag className="flex gap-1 text-[10px]"><b>Success:</b> {props.row.original.success_score}%</Tag>
            <Tag className="flex gap-1 text-[10px]"><b>Trust:</b> {props.row.original.trust_score}%</Tag>
            <Tag className="flex gap-1 text-[10px] flex-wrap"><b>Activity:</b> {props.row.original.activity_score}%</Tag>
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
            // onChangeStatus={() => handleChangeStatus(props.row.original)}
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

  const handleSetTableData = useCallback(async (data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
    
    const response = await axiosInstance.get(`/customer?page=${data.pageIndex}`);
    console.log(response,response.data.data.data, 'response')
    setMemberList(response.data.data.data)
    setMemberListTotal(response.data.data.total)
    // If not a page change, and selection exists, you might want to clear selection
    // This depends on desired UX, for now, selection is managed by MemberListContext globally
    // if (selectedMembers.length > 0 && !data.pageIndex) {
    //   setSelectedMembers([]);
    // }
  }, [/* setSelectedMembers, selectedMembers.length */]); // Dependencies if clearing selection

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);

  const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
    setSelectedMembers((prevSelected) => {
      if (checked) {
        return [...prevSelected, row];
      } else {
        return prevSelected.filter((item) => item.id !== row.id);
      }
    });
  }, [setSelectedMembers]);

  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<FormItem>[]) => {
    if (checked) {
      // Select all items currently visible on the page / in 'pageData'
      // Or, if you want to select ALL items from 'forms' that match current filters:
      // For simplicity, let's select from `pageData` as DataTable typically shows.
      const allOriginalRows = rows.map(r => r.original);
      setSelectedMembers(allOriginalRows);
    } else {
      setSelectedMembers([]);
    }
  }, [setSelectedMembers /* pageData */]); // pageData if selecting only visible

  const handleImport = () => { console.log("Import clicked"); /* Implement import */ };

  const csvData = useMemo(() => {
    if (forms.length === 0) return [];
    // Basic CSV export, customize headers and data as needed
    const headers = Object.keys(forms[0]).map(key => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), key: key }));
    return forms.map(form => {
      const newForm: any = { ...form };
      // Convert arrays to strings for CSV
      Object.keys(newForm).forEach(key => {
        if (Array.isArray(newForm[key as keyof FormItem])) {
          newForm[key] = (newForm[key as keyof FormItem] as string[]).join(', ');
        }
      });
      return newForm;
    });

  }, [forms]);


  const getBrandOptions = useMemo(() => {
    return forms
      .flatMap((f) => f.associated_brands)
      .filter((v, i, a) => a.indexOf(v) === i) // Unique brands
      .map((b) => ({ value: b, label: b }));
  }, [forms]);


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <FormListSearch onInputChange={(e) => handleSetTableData({ query: e.target.value, pageIndex: 1 })} />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button icon={<TbCloudDownload />} onClick={handleImport}>Import</Button>
          {forms.length > 0 ? (
            <CSVLink data={csvData} filename="members_export.csv">
              <Button icon={<TbCloudUpload />}>Export</Button>
            </CSVLink>
          ) : (
            <Button icon={<TbCloudUpload />} disabled>Export</Button>
          )}
        </div>
      </div>
      <DataTable
        selectable
        columns={columns}
        data={pageData} // Data for the current page
        noData={!isLoading && forms.length === 0}
        loading={isLoading}
        pagingData={{
          total: total, // Total items after filtering
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) => selectedMembers.some((selected) => selected.id === row.id)}
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterMemberForm" type="submit">Apply</Button>
          </div>
        }
      >
        <UiForm id="filterMemberForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-2">
            <UiFormItem label="Status">
              <Controller name="filterStatus" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Status" options={memberStatusOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Continent">
              <Controller name="filterContinent" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Continent" options={continentOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Business Type">
              <Controller name="filterBusinessType" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Type" options={businessTypeOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="State">
              <Controller name="filterState" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select State" options={stateOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="City">
              <Controller name="filterCity" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select City" options={cityOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Interested For">
              <Controller name="filterInterestedFor" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Interest" options={interestedForOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Interested Category">
              <Controller name="filterInterestedCategory" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Category" options={businessTypeOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Brand">
              <Controller name="filterBrand" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Brand" options={getBrandOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="KYC Verified">
              <Controller name="filterKycVerified" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Status" options={kycStatusOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
          </div>
        </UiForm>
      </Drawer>
    </>
  );
};
// --- End FormListTable ---


// --- FormListSelected Component ---
const FormListSelected = () => {
  const {
    selectedMembers,
    setSelectedMembers,
    memberList,
    setMemberList,
    memberListTotal,
    setMemberListTotal
  } = useMemberList();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const dispatch = useAppDispatch();

  const handleConfirmDelete = async () => {
    if (
      !selectedMembers
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Member ID is missing.
        </Notification>
      );
      setSelectedMembers([]);
      setDeleteConfirmationOpen(false);
      return;
    }
    setDeleteConfirmationOpen(false);
    try {
      const ids = selectedMembers.map((data) => data.id);
      await dispatch(deleteAllMemberAction({ ids: ids.toString() })).unwrap();
      toast.push(
        <Notification title="Country Deleted" type="success" duration={2000}>
          Member "{selectedMembers.name}" deleted.
        </Notification>
      );
      dispatch(getMemberAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete parters.`}
        </Notification>
      );
      console.error("Delete parters Error:", error);
    } finally {
      setSelectedMembers([]);
    }
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent">Message sent to selected members!</Notification>, {
        placement: "top-center",
      });
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedMembers([]); // Clear selection after sending
    }, 500);
  };

  if (selectedMembers.length === 0) {
    return null;
  }

  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      // defaultClass="container mx-auto px-8 rounded-xl border border-gray-200 dark:border-gray-600 mt-4" // defaultClass seems to be for non-sticky state, might not be needed here
      >
        <div className="container mx-auto"> {/* Ensure content is centered */}
          <div className="flex items-center justify-between">
            <span>
              <span className="flex items-center gap-2">
                <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                <span className="font-semibold flex items-center gap-1">
                  <span className="heading-text">{selectedMembers.length} Members</span>
                  <span>selected</span>
                </span>
              </span>
            </span>
            <div className="flex items-center">
              <Button
                size="sm"
                className="ltr:mr-3 rtl:ml-3"
                type="button"
                // Custom color directly in Tailwind classes for error state
                customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"}
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>
                Message
              </Button>
            </div>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title="Remove Members"
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>Are you sure you want to remove these members? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message</h5>
        <p>Send message to the following members:</p>
        <Avatar.Group chained omittedAvatarTooltip className="mt-4" maxCount={4} omittedAvatarProps={{ size: 30 }}>
          {selectedMembers.map((member) => (
            <Tooltip key={member.id} title={member.member_name}>
              <Avatar size={30} src={member.member_photo} alt={member.member_name} />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor content={""} /> {/* Assuming content state will be managed if needed */}
        </div>
        <div className="ltr:justify-end flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button>
        </div>
      </Dialog>
    </>
  );
};
// --- End FormListSelected ---


// --- Main Member Page Component ---
const Member = () => {
  return (
    <MemberListProvider> {/* Wrap components needing shared state with the Provider */}
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Member</h5>
                <FormListActionTools />
              </div>
              <FormListTable />
            </div>
          </AdaptiveCard>
        </Container>
        <FormListSelected />
      </>
    </MemberListProvider>
  );
};

export default Member;
