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
  member_photo_upload: string; // This seems unused in the table, ensure it's needed or remove
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
];
const cityOptions = [
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

// --- Simplified Member List Store ---
interface MemberListStore {
  memberList: FormItem[];
  selectedMembers: FormItem[];
  memberListTotal: number;
  setMemberList: React.Dispatch<React.SetStateAction<FormItem[]>>;
  setSelectedMembers: React.Dispatch<React.SetStateAction<FormItem[]>>;
  setMemberListTotal: React.Dispatch<React.SetStateAction<number>>;
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
  const { MemberData } = useSelector(masterSelector); // Removed = [] default here, handle undefined below
  const dispatch = useAppDispatch();

  // Initialize with guaranteed valid types
  const [memberList, setMemberList] = useState<FormItem[]>(MemberData?.data ?? []);
  const [selectedMembers, setSelectedMembers] = useState<FormItem[]>([]);
  const [memberListTotal, setMemberListTotal] = useState<number>(MemberData?.total ?? 0);

  useEffect(() => {
    // Ensure MemberData and its properties are valid before setting state
    setMemberList(MemberData?.data ?? []);
    setMemberListTotal(MemberData?.total ?? 0);
  }, [MemberData]);

  useEffect(() => {
    dispatch(getMemberAction()); // Fetch initial members
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


// --- FormListSearch Component ---
interface FormListSearchProps {
  onInputChange: (value: string) => void; // Changed to pass value directly
}
const FormListSearch: React.FC<FormListSearchProps> = ({ onInputChange }) => {
  return (
    <UiInput
      placeholder="Quick Search..."
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
};
// --- End FormListSearch ---


// --- FormListActionTools Component ---
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


// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onShare,
  onMore,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onShare: () => void;
  onMore: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400" role="button" onClick={onEdit}>
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" role="button" onClick={onViewDetail}>
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400" role="button" onClick={onShare}>
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div> {/* Removed onClick here as Dropdown handles its own trigger */}
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
    memberList: forms,
    setMemberList,
    selectedMembers,
    setSelectedMembers,
    memberListTotal,
    setMemberListTotal
  } = useMemberList();

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // Will be updated by useEffect below
  });

  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods.reset]);

  const openFilterDrawer = () => {
    // filterFormMethods.reset(filterCriteria); // Not needed here, useEffect handles it
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  // API fetching logic
  const fetchPageData = useCallback(async (
    pageIdx: number,
    limit: number,
    currentSort?: OnSortParam,
    // Add other server-side filter/query params here if API supports
  ) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append('page', String(pageIdx));
    params.append('limit', String(limit)); // Assuming API uses 'limit' for page size

    // Example for server-side sort (if your API supports it)
    // if (currentSort?.key && currentSort.order) {
    //   params.append('sortBy', currentSort.key);
    //   params.append('sortOrder', currentSort.order);
    // }
    // Example for server-side search (if your API supports it)
    // if (tableData.query) { // Assuming tableData.query is for server-side search
    //    params.append('search', tableData.query)
    // }
    // Example for server-side advanced filters
    // Object.entries(filterCriteria).forEach(([key, value]) => {
    //   if (value && value.length > 0) {
    //      value.forEach(item => params.append(key.replace('filter', '').toLowerCase(), item.value));
    //   }
    // });


    try {
      const response = await axiosInstance.get(`/customer?${params.toString()}`);
      setMemberList(response.data?.data?.data ?? []);
      setMemberListTotal(response.data?.data?.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch member data:", error);
      toast.push(<Notification title="Error" type="danger" duration={3000}>Failed to load members.</Notification>);
      // Potentially set empty data or keep stale data on error
      // setMemberList([]);
      // setMemberListTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [setMemberList, setMemberListTotal /* include tableData.query, filterCriteria if they are sent to server */]);

  // Effect to fetch data when server-relevant parameters change
  useEffect(() => {
    fetchPageData(
      tableData.pageIndex as number,
      tableData.pageSize as number,
      tableData.sort as OnSortParam
      // Pass other server-side params from tableData/filterCriteria if needed
    );
  }, [tableData.pageIndex, tableData.pageSize, tableData.sort, fetchPageData]);
  // Removed tableData.query and filterCriteria from deps, assuming they are client-side for now
  // If they become server-side, add them back and pass to fetchPageData.

  // Client-side quick search handler
  const handleQueryChange = (newQuery: string) => {
    setTableData(prev => ({ ...prev, query: newQuery, pageIndex: 1 }));
    // No API call here if query is client-side. Page reset might trigger fetchPageData for page 1.
  };

  // Client-side filter application
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData(prev => ({ ...prev, pageIndex: 1 })); // Reset to page 1 for new filters
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData(prev => ({ ...prev, pageIndex: 1 })); // Reset to page 1
  };

  const { pageData, total } = useMemo(() => {
    if (!forms) { // Guard against forms being null/undefined, though provider should prevent this
      return { pageData: [], total: 0 };
    }

    let processedData = [...forms]; // `forms` is the data for the current page from server

    // Apply client-side quick search (on current page data)
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (form) =>
          form.member_name?.toLowerCase().includes(query) ||
          form.member_email_id?.toLowerCase().includes(query) ||
          form.company_name?.toLowerCase().includes(query)
      );
    }

    // Apply client-side advanced filters (on current page data)
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((form) => selectedStatuses.includes(form.member_status));
    }
    if (filterCriteria.filterContinent && filterCriteria.filterContinent.length > 0) {
      const selectedContinents = filterCriteria.filterContinent.map((opt) => opt.value.toLowerCase());
      processedData = processedData.filter((form) =>
        selectedContinents.some((continent) => form.member_location?.toLowerCase().includes(continent))
      );
    }
    if (filterCriteria.filterBusinessType && filterCriteria.filterBusinessType.length > 0) {
      const selectedTypes = filterCriteria.filterBusinessType.map((opt) => opt.value.toLowerCase());
      processedData = processedData.filter((form) =>
        form.business_category.some((cat) => selectedTypes.includes(cat.toLowerCase()))
      );
    }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) {
      const selectedStates = filterCriteria.filterState.map(opt => opt.value.toLowerCase());
      processedData = processedData.filter(form =>
        selectedStates.some(state => {
          const locationParts = form.member_location?.toLowerCase().split(' / ');
          return locationParts && locationParts.length >= 3 && locationParts[2] === state;
        })
      );
    }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) {
      const selectedCities = filterCriteria.filterCity.map(opt => opt.value.toLowerCase());
      processedData = processedData.filter(form =>
        selectedCities.some(city => {
          const locationParts = form.member_location?.toLowerCase().split(' / ');
          return locationParts && locationParts.length >= 2 && locationParts[1] === city;
        })
      );
    }
    if (filterCriteria.filterInterestedFor && filterCriteria.filterInterestedFor.length > 0) {
      const selectedInterests = filterCriteria.filterInterestedFor.map((opt) => opt.value);
      processedData = processedData.filter((form) => selectedInterests.includes(form.interested_in));
    }
    if (filterCriteria.filterInterestedCategory && filterCriteria.filterInterestedCategory.length > 0) {
      const selectedCategories = filterCriteria.filterInterestedCategory.map((opt) => opt.value.toLowerCase());
      processedData = processedData.filter((form) =>
        form.business_category.some((cat) => selectedCategories.includes(cat.toLowerCase()))
      );
    }
    if (filterCriteria.filterBrand && filterCriteria.filterBrand.length > 0) {
      const selectedBrands = filterCriteria.filterBrand.map((opt) => opt.value.toLowerCase());
      processedData = processedData.filter((form) =>
        form.associated_brands.some((brand) => selectedBrands.includes(brand.toLowerCase()))
      );
    }
    if (filterCriteria.filterKycVerified && filterCriteria.filterKycVerified.length > 0) {
      const selectedKyc = filterCriteria.filterKycVerified.map((opt) => opt.value);
      processedData = processedData.filter((form) => selectedKyc.includes(form.kyc_status));
    }

    // Apply client-side sort (on current page data after filters)
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
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

    return { pageData: processedData, total: memberListTotal };
  }, [forms, tableData, filterCriteria, memberListTotal]);


  const handleEdit = (form: FormItem) => { navigate(`/business-entities/member-edit/${form.id}`); };
  const handleViewDetails = (form: FormItem) => { navigate("/business-entities/member-create", { state: form }); };
  // const handleChangeStatus = (form: FormItem) => { console.log("Change Status:", form.id); /* Implement status change */ };
  const handleShare = (form: FormItem) => { console.log("Share:", form.id); };
  const handleMore = (form: FormItem) => { console.log("More options for:", form.id); };
  
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
                  Joined Date:     {/* Using   for spacing */}
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
        accessorKey: "associated_brands", // This key might not be ideal if you display multiple fields
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
        accessorKey: "trust_score", // Similarly, this key might not be ideal
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
        meta: { HeaderClass: "text-center" }, // This might need specific DataTable support
        cell: (props) => (
          <ActionColumn
            onEdit={() => handleEdit(props.row.original)}
            onViewDetail={() => handleViewDetails(props.row.original)}
            onShare={() => handleShare(props.row.original)}
            onMore={() => handleMore(props.row.original)}
          />
        ),
      },
    ],
    [] // Removed navigate from deps as it's stable
  );

  const handlePaginationChange = useCallback((page: number) => {
    setTableData(prev => ({ ...prev, pageIndex: page }));
  }, []);
  const handleSelectChange = useCallback((value: number) => {
    setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 }));
  }, []);
  const handleSort = useCallback((sort: OnSortParam) => {
    // This sort is client-side as per useMemo. If server-side, logic here and in fetchPageData changes.
    setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 }));
  }, []);

  const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
    setSelectedMembers((prevSelected) => {
      if (checked) {
        return [...prevSelected, row];
      } else {
        return prevSelected.filter((item) => item.id !== row.id);
      }
    });
  }, [setSelectedMembers]);

  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<FormItem>[]) => {
    // currentRows are the rows *visible* on the current page of the DataTable
    // This selects/deselects all original items corresponding to the visible rows
    const originalItemsOnPage = currentRows.map(r => r.original);
    if (checked) {
      // Add only those not already selected to avoid duplicates,
      // though DataTable usually handles single selection on its end
      setSelectedMembers(prevSelected => {
        const newSelections = originalItemsOnPage.filter(
          pageItem => !prevSelected.some(selItem => selItem.id === pageItem.id)
        );
        return [...prevSelected, ...newSelections];
      });
    } else {
      // Remove only those items that are on the current page from selection
      setSelectedMembers(prevSelected =>
        prevSelected.filter(selItem =>
          !originalItemsOnPage.some(pageItem => pageItem.id === selItem.id)
        )
      );
    }
  }, [setSelectedMembers]);


  const handleImport = () => { console.log("Import clicked"); /* Implement import */ };

  const csvData = useMemo(() => {
    if (!forms || forms.length === 0) return [];
    const headers = Object.keys(forms[0] as FormItem)
      .map(key => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), key: key }));
    
    return forms.map(form => {
      const newForm: Record<string, any> = { ...form };
      Object.keys(newForm).forEach(key => {
        if (Array.isArray(newForm[key])) {
          newForm[key] = (newForm[key] as string[]).join(', ');
        }
      });
      return newForm;
    });
  }, [forms]);


  const getBrandOptions = useMemo(() => {
    if (!forms) return [];
    return forms
      .flatMap((f) => f.associated_brands)
      .filter((v, i, a) => a.indexOf(v) === i && v) // Unique and non-empty brands
      .map((b) => ({ value: b, label: b }));
  }, [forms]);


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <FormListSearch onInputChange={handleQueryChange} />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button icon={<TbCloudDownload />} onClick={handleImport}>Import</Button>
          {(forms && forms.length > 0) ? (
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
        data={pageData} // Data for the current page (client-side filtered/sorted)
        noData={!isLoading && (!pageData || pageData.length === 0)}
        loading={isLoading}
        pagingData={{
          total: total, // Total items from server
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) => selectedMembers.some((selected) => selected.id === row.original.id)} // Use row.original.id
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={(checked, row) => handleRowSelect(checked, row.original)} // Pass row.original
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
                  <UiSelect isMulti placeholder="Select Category" options={businessTypeOptions} /* Should this be different options? */
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
    // memberList, // Not directly used for actions here
    // setMemberList,
    // memberListTotal,
    // setMemberListTotal
  } = useMemberList();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [messageContent, setMessageContent] = useState(""); // For RichTextEditor

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const dispatch = useAppDispatch();

  const handleConfirmDelete = async () => {
    if (!selectedMembers || selectedMembers.length === 0) {
      toast.push(
        <Notification title="Error" type="danger">
          No members selected for deletion.
        </Notification>
      );
      setDeleteConfirmationOpen(false);
      return;
    }
    
    setDeleteConfirmationOpen(false); // Close dialog first
    try {
      const ids = selectedMembers.map((data) => data.id);
      // Assuming deleteAllMemberAction can handle an array of IDs or a comma-separated string
      await dispatch(deleteAllMemberAction({ ids: ids.join(',') })).unwrap(); // Use unwrap if it's an RTK thunk
      toast.push(
        <Notification title="Members Deleted" type="success" duration={2000}>
          {selectedMembers.length} member(s) deleted.
        </Notification>
      );
      dispatch(getMemberAction()); // Refresh list after deletion
      setSelectedMembers([]); // Clear selection
    } catch (error: any) {
      const errorMessage = isAxiosError(error) ? error.response?.data?.message || error.message : error.message;
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {errorMessage || `Could not delete members.`}
        </Notification>
      );
      console.error("Delete members Error:", error);
    } 
    // setSelectedMembers([]) is now inside try/catch to ensure it's cleared on success.
    // If deletion fails, you might want to keep them selected for retry.
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    // console.log("Sending message:", messageContent, "to:", selectedMembers.map(m => m.member_name));
    // Simulate API call
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent">Message sent to {selectedMembers.length} member(s)!</Notification>, {
        placement: "top-center",
      });
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedMembers([]); // Clear selection after sending
      setMessageContent(""); // Clear message content
    }, 1000);
  };

  if (selectedMembers.length === 0) {
    return null;
  }

  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="container mx-auto">
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
                // Using customColorClass prop if your Button supports it, or direct Tailwind
                // This example assumes Button does not have customColorClass, so apply classes directly if possible or use variant="danger" if exists
                // For a generic button, you might need to style it or use a specific 'danger' variant if available from your UI kit.
                // For now, relying on standard button styling or assuming a danger variant would be used.
                // If customColorClass is a function as in your original code:
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
        title={`Remove ${selectedMembers.length} Member(s)`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmButtonColor="red-600"
      >
        <p>Are you sure you want to remove {selectedMembers.length} selected member(s)? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
        width={600} // Adjusted width for RichTextEditor
      >
        <h5 className="mb-2">Send Message</h5>
        <p>Send message to the following {selectedMembers.length} member(s):</p>
        <Avatar.Group chained omittedAvatarTooltip className="my-4" maxCount={6} omittedAvatarProps={{ size: 30 }}>
          {selectedMembers.map((member) => (
            <Tooltip key={member.id} title={member.member_name}>
              <Avatar size={30} src={member.member_photo || undefined} icon={!member.member_photo ? <TbUserCircle/> : null} alt={member.member_name} />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor value={messageContent} onChange={setMessageContent} />
        </div>
        <div className="ltr:justify-end flex items-center gap-2 mt-4">
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
    <MemberListProvider>
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