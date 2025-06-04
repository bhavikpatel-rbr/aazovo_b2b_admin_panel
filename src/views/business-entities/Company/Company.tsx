import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  DatePicker,
  Drawer,
  Dropdown,
  Form as UiForm,
  FormItem as UiFormItem, // Not directly used in filter but can be for other forms
  Select as UiSelect
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { MdCancel, MdCheckCircle } from "react-icons/md";
import {
  TbChecks,
  TbCloudDownload,
  TbCloudUpload,
  TbDotsVertical,
  TbEye,
  TbFilter,
  TbPencil,
  TbPlus,
  TbSearch, // For Avatar fallback
  TbShare,
  TbUserCircle, // For Avatar fallback
} from "react-icons/tb";


// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  deleteAllcompanyAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";


// --- CompanyItem Type (Data Structure) ---
export type CompanyItem = {
  id: string;
  name: string;
  company_code?: string;
  type: string; // e.g., 'Private Limited', 'LLP' (Company Type from filter)
  interested_in: string; // Renamed from 'interested' to match member/partner
  category: string[]; // Matched to member (array of strings)
  brands: string[];
  country: string;
  // noOfMember: number; // This seems specific, will use total_members for consistency if applicable
  status: "Active" | "Pending" | "Inactive" | "Verified" | "active" | "inactive"; // Combined statuses
  progress: number; // Profile completion

  // From Overview.tsx data
  gst_number?: string;
  pan_number?: string;
  company_photo?: string; // URL
  total_members?: number;
  member_participation?: number; // Percentage
  success_score?: number; // Percentage
  trust_score?: number; // Percentage
  health_score?: number; // Percentage

  // Display strings (can be derived or part of data)
  wallCountDisplay?: string; // Example: "13 | 12 | 25"

  // Fields from filter schema that should be in data
  business_type: string; // e.g., 'Manufacture', 'Supplier'
  continent: string;
  state: string;
  city: string;
  kyc_verified: "Yes" | "No";
  enable_billing: "Yes" | "No";
  created_date: string; // ISO date string
  // sub_categories: string[]; // Assuming 'category' is the main one for now
  company_owner?: string; // Placeholder for contact person
  company_contact_number?: string; // Placeholder
  company_email?: string; // Placeholder
  company_website?: string; // Placeholder
};
// --- End CompanyItem Type ---

// --- Zod Schema for Company Filter Form ---
const companyFilterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBusinessType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCompanyType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInterestedIn: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBrand: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterSubCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterEnableBilling: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCreatedDate: z.array(z.date().nullable()).optional().default([null, null]),
});
type CompanyFilterFormData = z.infer<typeof companyFilterFormSchema>;
// --- End Company Filter Schema ---

// --- Status Colors ---
const companyStatusColors: Record<string, string> = {
  Active: "bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  Verified: "bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  Pending: "bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  Inactive: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  active: "bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300", // for lowercase 'active'
  inactive: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300",   // for lowercase 'inactive'
};

const getCompanyStatusClass = (statusValue?: CompanyItem["status"]): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  return companyStatusColors[statusValue] || "bg-gray-200 text-gray-600";
};
// --- End Status Colors ---

// --- Company List Store ---
interface CompanyListStore {
  companyList: CompanyItem[];
  selectedCompanies: CompanyItem[];
  CountriesData: [];
  ContinentsData:[];
  companyListTotal: number;
  setCompanyList: React.Dispatch<React.SetStateAction<CompanyItem[]>>;
  setSelectedCompanies: React.Dispatch<React.SetStateAction<CompanyItem[]>>;
  setCompanyListTotal: React.Dispatch<React.SetStateAction<number>>;
}

const CompanyListContext = React.createContext<CompanyListStore | undefined>(undefined);

const useCompanyList = (): CompanyListStore => {
  const context = useContext(CompanyListContext);
  if (!context) {
    throw new Error("useCompanyList must be used within a CompanyListProvider");
  }
  return context;
};
const CompanyListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const { CompanyData = [], CountriesData = [],
    ContinentsData = [], } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [companyList, setCompanyList] = useState<CompanyItem[]>(CompanyData);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const [companyListTotal, setCompanyListTotal] = useState(CompanyData.length);

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
  }, [])
  useEffect(() => {
    setCompanyList(CompanyData)
    setCompanyListTotal(CompanyData.length)
  }, [CompanyData])

  useEffect(() => {
    dispatch(getCompanyAction()); // Fetch continents for select dropdown
  }, [dispatch]);

  return (
    <CompanyListContext.Provider value={{
      companyList, setCompanyList,
      selectedCompanies, setSelectedCompanies,
      companyListTotal, setCompanyListTotal,
      ContinentsData: ContinentsData,
      CountriesData:CountriesData,

    }}>
      {children}
    </CompanyListContext.Provider>
  );
};
// --- End Company List Store ---


// --- CompanyListSearch Component ---
interface CompanyListSearchProps {
  onInputChange: (value: string) => void;
}
const CompanyListSearch: React.FC<CompanyListSearchProps> = ({ onInputChange }) => {
  return (
    <DebouceInput
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    //   className="max-w-xs"
    />
  );
};
// --- End CompanyListSearch ---


// --- CompanyListActionTools Component (for Page Header) ---
const CompanyListActionTools = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/company-create")} // Ensure this route exists
      >
        Add New
      </Button>
    </div>
  );
};
// --- End CompanyListActionTools ---


// --- CompanyActionColumn Component (for DataTable) ---
const CompanyActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onShare,
  onChangeItemStatus, // For dropdown action
}: {
  rowData: CompanyItem;
  onEdit: (id: string) => void;
  onViewDetail: (id: string) => void;
  onShare: (id: string) => void;
  onChangeItemStatus: (id: string, currentStatus: CompanyItem["status"]) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
          onClick={() => onEdit(rowData.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={() => onViewDetail(rowData.id)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
          role="button"
          onClick={() => onShare(rowData.id)}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <Dropdown renderTitle={<TbDotsVertical />} style={{ fontSize: "10px" }}>
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }} onClick={() => onChangeItemStatus(rowData.id, rowData.status)}>
            Toggle Status
          </Dropdown.Item>
          {/* <Dropdown.Separator /> */}
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Request For</Dropdown.Item>
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add in Active</Dropdown.Item>
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add Schedule</Dropdown.Item>
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>Add Task</Dropdown.Item>
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>View Documents</Dropdown.Item>
          <Dropdown.Item className="text-xs py-2" style={{ height: "auto" }}>View Alert</Dropdown.Item>
        </Dropdown>
      </Tooltip>
    </div>
  );
};
// --- End CompanyActionColumn ---


// --- CompanyListTable Component ---
const CompanyListTable = () => {
  const navigate = useNavigate();
  const {
    companyList,
    setCompanyList,
    selectedCompanies,
    setSelectedCompanies,
    setCompanyListTotal,
    CountriesData,
    ContinentsData
  } = useCompanyList();
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<CompanyFilterFormData>({
    filterCreatedDate: [null, null], // Initialize date ranges
  });

  const filterFormMethods = useForm<CompanyFilterFormData>({
    resolver: zodResolver(companyFilterFormSchema),
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

  const onApplyFiltersSubmit = (data: CompanyFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: CompanyFilterFormData = { filterCreatedDate: [null, null] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const { pageData, total } = useMemo(() => {
    let filteredData = [...companyList];

    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = filteredData.filter((item) =>
        Object.values(item).some((value) => {
          if (typeof value === "string") return value.toLowerCase().includes(query);
          if (Array.isArray(value)) return value.some(subVal => String(subVal).toLowerCase().includes(query));
          return String(value).toLowerCase().includes(query); // Handle numbers etc.
        })
      );
    }

    // Apply advanced filters
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selected = filterCriteria.filterStatus.map(opt => opt.value?.toLowerCase());
      filteredData = filteredData.filter(item => selected.includes(item?.status?.toLowerCase()));
    }
    if (filterCriteria.filterBusinessType && filterCriteria.filterBusinessType.length > 0) {
      const selected = filterCriteria.filterBusinessType.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.business_type));
    }
    if (filterCriteria.filterCompanyType && filterCriteria.filterCompanyType.length > 0) {
      const selected = filterCriteria.filterCompanyType.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.type));
    }
    if (filterCriteria.filterContinent && filterCriteria.filterContinent.length > 0) {
      const selected = filterCriteria.filterContinent.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.continent));
    }
    if (filterCriteria.filterCountry && filterCriteria.filterCountry.length > 0) {
      const selected = filterCriteria.filterCountry.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.country));
    }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) {
      const selected = filterCriteria.filterState.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.state));
    }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) {
      const selected = filterCriteria.filterCity.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.city));
    }
    if (filterCriteria.filterInterestedIn && filterCriteria.filterInterestedIn.length > 0) {
      const selected = filterCriteria.filterInterestedIn.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.interested_in));
    }
    if (filterCriteria.filterBrand && filterCriteria.filterBrand.length > 0) {
      const selectedBrands = filterCriteria.filterBrand.map(opt => opt.value);
      filteredData = filteredData.filter(item => selectedBrands.includes(item.brands));
    }
    if (filterCriteria.filterCategory && filterCriteria.filterCategory.length > 0) {
      const selectedCategories = filterCriteria.filterCategory.map(opt => opt.value);
      filteredData = filteredData.filter(item => item.category.some(cat => selectedCategories.includes(cat)));
    }
    if (filterCriteria.filterKycVerified && filterCriteria.filterKycVerified.length > 0) {
      const selected = filterCriteria.filterKycVerified.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.kyc_verified));
    }
    if (filterCriteria.filterEnableBilling && filterCriteria.filterEnableBilling.length > 0) {
      const selected = filterCriteria.filterEnableBilling.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.enable_billing));
    }

    const checkDateRange = (dateStr: string, range: (Date | null)[] | undefined) => {
      if (!dateStr || !range || (!range[0] && !range[1])) return true;
      try {
        const itemDate = new Date(dateStr).setHours(0, 0, 0, 0);
        const from = range[0] ? new Date(range[0]).setHours(0, 0, 0, 0) : null;
        const to = range[1] ? new Date(range[1]).setHours(0, 0, 0, 0) : null;
        if (from && to) return itemDate >= from && itemDate <= to;
        if (from) return itemDate >= from;
        if (to) return itemDate <= to;
        return true;
      } catch (e) { return true; }
    };

    if (filterCriteria.filterCreatedDate && (filterCriteria.filterCreatedDate[0] || filterCriteria.filterCreatedDate[1])) {
      filteredData = filteredData.filter(item => checkDateRange(item.created_date, filterCriteria.filterCreatedDate));
    }


    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof CompanyItem] ?? "";
        const bValue = b[key as keyof CompanyItem] ?? "";
        if (['progress', 'total_members', 'member_participation', 'success_score', 'trust_score', 'health_score'].includes(key)) {
          const numA = Number(aValue);
          const numB = Number(bValue);
          if (!isNaN(numA) && !isNaN(numB)) return order === 'asc' ? numA - numB : numB - numA;
        }
        if (key === 'created_date') {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return order === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
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
  }, [companyList, tableData, filterCriteria]);


  const handleEditCompany = (id: string) => { console.log("Edit Company:", id); navigate("/business-entities/company-create", { state: id }) };
  const handleViewCompanyDetails = (id: string) => { console.log("View Company Details:", id); navigate("/business-entities/company-create", { state: id }) };
  const handleShareCompany = (id: string) => { console.log("Share Company:", id); };
  const handleChangeCompanyStatus = (id: string, currentStatus: CompanyItem["status"]) => {
    let newStatus: CompanyItem["status"] = "Inactive"; // Default to inactive
    // Normalize current status to lowercase for comparison
    const lowerCurrentStatus = currentStatus.toLowerCase();
    if (lowerCurrentStatus === "active") newStatus = "Inactive";
    else if (lowerCurrentStatus === "inactive") newStatus = "Active";
    else if (lowerCurrentStatus === "pending") newStatus = "Active"; // Example: Pending -> Active
    else if (lowerCurrentStatus === "verified") newStatus = "Active"; // Example: Verified -> Active

    setCompanyList((currentList) =>
      currentList.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    toast.push(<Notification type="info" title="Company Status Updated">{`Company status changed to ${newStatus}.`}</Notification>, { placement: "top-center" });
  };

  const columns: ColumnDef<CompanyItem>[] = useMemo(
    () => [
      {
        header: "Company Info",
        accessorKey: "name",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const { name, type, country, city, state, company_photo, company_code } = row.original;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Avatar src={company_photo} alt={name} size="md" shape="circle" icon={<TbUserCircle />} />
                <div>
                  <h6 className="text-xs font-semibold">{company_code}</h6>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{name}</span>
                </div>
              </div>
              <span className="text-xs mt-1"><span className="font-semibold">Type:</span> {type}</span>
              <span className="text-xs"><span className="font-semibold">Business:</span> {row.original.business_type}</span>
              <div className="text-xs text-gray-500 dark:text-gray-400">{city}, {state}, {country}</div>
            </div>
          );
        },
      },
      {
        header: "Contact",
        accessorKey: "company_owner", // Example, can be email or phone
        size: 180,
        cell: (props) => {
          const { company_owner, company_contact_number, company_email, company_website } = props.row.original;
          return (
            <div className="text-xs flex flex-col gap-0.5">
              {company_owner && <span><b>Owner: </b> {company_owner}</span>}
              {company_contact_number && <span>{company_contact_number}</span>}
              {company_email && <a href={`mailto:${company_email}`} className="text-blue-600 hover:underline">{company_email}</a>}
              {company_website && <a href={company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{company_website}</a>}
            </div>
          );
        },
      },
      {
        header: "Legal IDs & Status",
        accessorKey: "gst_number",
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const { gst_number, pan_number, status } = row.original;
          return (
            <div className="flex flex-col gap-1 text-[10px]">
              {gst_number && <div><span className="font-semibold">GST:</span> <span className="break-all">{gst_number}</span></div>}
              {pan_number && <div><span className="font-semibold">PAN:</span> <span className="break-all">{pan_number}</span></div>}
              {!gst_number && !pan_number && <span className="text-gray-400">N/A</span>}
              <Tag className={`${getCompanyStatusClass(status)} capitalize mt-1 self-start !text-[10px] px-1.5 py-0.5`}>{status}</Tag>
            </div>
          );
        },
      },
      {
        header: "Preferences",
        accessorKey: "interested_in",
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const { brands, category, interested_in } = row.original;
          console.log(brands, 'bb')
          return (
            <div className="flex flex-col gap-1 text-xs">
              <span><span className="font-semibold">Brands:</span> {brands || "N/A"}</span>
              <span><span className="font-semibold">Category:</span> {category || "N/A"}</span>
              <span><span className="font-semibold">Interested In:</span> {interested_in}</span>
            </div>
          );
        },
      },
      {
        header: "Profile & Scores",
        accessorKey: "progress",
        enableSorting: true,
        size: 190,
        cell: ({ row }) => {
          const { total_members = 0, member_participation = 0, progress = 0, success_score = 0, trust_score = 0, health_score = 0, kyc_verified, enable_billing } = row.original;
          return (
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="flex flex-wrap gap-1">
                <span className="font-semibold">Members:</span> {total_members} ({member_participation}%)
              </span>
              <div className="flex gap-1 items-center">
                <Tooltip title={`KYC: ${kyc_verified}`}>
                  {kyc_verified === "Yes" ? <MdCheckCircle className="text-green-500 text-lg" /> : <MdCancel className="text-red-500 text-lg" />}
                </Tooltip>
                <Tooltip title={`Billing: ${enable_billing}`}>
                  {enable_billing === "Yes" ? <MdCheckCircle className="text-green-500 text-lg" /> : <MdCancel className="text-red-500 text-lg" />}
                </Tooltip>
              </div>
              <Tooltip title={`Profile Completion ${progress}%`}>
                <div className="h-1.5 w-full rounded-full bg-gray-300 dark:bg-gray-700">
                  <div className="rounded-full h-1.5 bg-blue-500" style={{ width: `${progress}%` }}></div>
                </div>
              </Tooltip>
              <div className="grid grid-cols-3 gap-x-1 text-center mt-1">
                <Tooltip title={`Success: ${success_score}%`}><div className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 p-0.5 rounded text-[10px]">S: {success_score}%</div></Tooltip>
                <Tooltip title={`Trust: ${trust_score}%`}><div className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 p-0.5 rounded text-[10px]">T: {trust_score}%</div></Tooltip>
                <Tooltip title={`Health: ${health_score}%`}><div className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 p-0.5 rounded text-[10px]">H: {health_score}%</div></Tooltip>
              </div>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <CompanyActionColumn
            rowData={props.row.original}
            onEdit={handleEditCompany}
            onViewDetail={handleViewCompanyDetails}
            onShare={handleShareCompany}
            onChangeItemStatus={handleChangeCompanyStatus}
          />
        ),
      },
    ],
    []
  );

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);

  const handleRowSelect = useCallback((checked: boolean, row: CompanyItem) => {
    setSelectedCompanies((prevSelected) => {
      if (checked) return [...prevSelected, row];
      return prevSelected.filter((item) => item.id !== row.id);
    });
  }, [setSelectedCompanies]);

  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<CompanyItem>[]) => {
    if (checked) setSelectedCompanies(rows.map(r => r.original));
    else setSelectedCompanies([]);
  }, [setSelectedCompanies]);

  const handleImport = () => { console.log("Import Companies Clicked"); /* Implement import */ };

  const csvData = useMemo(() => {
    if (companyList.length === 0) return [];
    // const headers = Object.keys(initialDummyCompanies[0] || {}).map(key => ({
    //   label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    //   key: key
    // }));
    return companyList.map(item => {
      const newItem: any = { ...item };
      Object.keys(newItem).forEach(key => {
        if (Array.isArray(newItem[key as keyof CompanyItem])) {
          newItem[key] = (newItem[key as keyof CompanyItem] as any[]).join('; ');
        }
      });
      return newItem;
    });
  }, [companyList]);

  // Dynamic Filter Options
  const statusOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.status))).map(s => ({ value: s, label: s })), [companyList]);
  const businessTypeOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.business_type))).map(bt => ({ value: bt, label: bt })), [companyList]);
  const companyTypeOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.type))).map(ct => ({ value: ct, label: ct })), [companyList]);
  const continentOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.continent))).map(co => ({ value: co, label: co })), [companyList]);
  const countryOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.country))).map(cy => ({ value: cy, label: cy })), [companyList]);
  const stateOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.state))).map(st => ({ value: st, label: st })), [companyList]);
  const cityOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.city))).map(ci => ({ value: ci, label: ci })), [companyList]);
  const interestedInOptions = useMemo(() => Array.from(new Set(companyList.map(c => c.interested_in))).map(ii => ({ value: ii, label: ii })), [companyList]);
  const brandOptions = useMemo(() => Array.from(new Set(companyList.flatMap(c => c.brands))).map(b => ({ value: b, label: b })), [companyList]);
  const categoryOptions = useMemo(() => Array.from(new Set(companyList.flatMap(c => c.category))).map(cat => ({ value: cat, label: cat })), [companyList]);
  const kycOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  const billingOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  const { DatePickerRange } = DatePicker;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <CompanyListSearch onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button icon={<TbCloudDownload />} onClick={handleImport}>Import</Button>
          {companyList.length > 0 ? (
            <CSVLink data={csvData} filename="companies_export.csv">
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
        data={pageData}
        noData={!isLoading && companyList.length === 0}
        loading={isLoading}
        // loading={
        //         masterLoadingStatus === "loading" || isSubmitting || isDeleting
        //       }
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) => selectedCompanies.some((selected) => selected.id === row.id)}
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Company Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterCompanyForm" type="submit">Apply</Button>
          </div>
        }
      >
        <UiForm id="filterCompanyForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={statusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Business Type"><Controller name="filterBusinessType" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Type" options={businessTypeOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Company Type"><Controller name="filterCompanyType" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Type" options={companyTypeOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Continent"><Controller name="filterContinent" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Continent" options={continentOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Country" options={countryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="State"><Controller name="filterState" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select State" options={stateOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="City"><Controller name="filterCity" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select City" options={cityOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Interested In"><Controller name="filterInterestedIn" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Interest" options={interestedInOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Brand"><Controller name="filterBrand" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Brand" options={brandOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Category"><Controller name="filterCategory" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Category" options={categoryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="KYC Verified"><Controller name="filterKycVerified" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={kycOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Enable Billing"><Controller name="filterEnableBilling" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={billingOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></UiFormItem>
            <UiFormItem label="Created Date" className="col-span-2"><Controller name="filterCreatedDate" control={filterFormMethods.control} render={({ field }) => <DatePickerRange placeholder="Select Date Range" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>
    </>
  );
};
// --- End CompanyListTable ---

// --- CompanyListSelected Component ---
const CompanyListSelected = () => {
  const {
    selectedCompanies,
    setSelectedCompanies,
    companyList,
    setCompanyList,
    setCompanyListTotal
  } = useCompanyList();
  const dispatch = useAppDispatch();


  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [CompanyToDelete, setCompanyToDelete] = useState(
    null
  );
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);


  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => {
    setCompanyToDelete(null)
    setDeleteConfirmationOpen(false);
  }

  const handleConfirmDelete = async () => {
    if (
      !selectedCompanies
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Company ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setSelectedCompanies([]);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      const ids = selectedCompanies.map((data) => data.id);
      await dispatch(deleteAllcompanyAction({ ids: ids.toString() })).unwrap();
      toast.push(
        <Notification title="Comapny Deleted" type="success" duration={2000}>
          "{selectedCompanies.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== selectedCompanies!.id)
      );
      dispatch(getCompanyAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete company.`}
        </Notification>
      );
      console.error("Delete Company Error:", error);
    } finally {
      setIsDeleting(false);
      setSelectedCompanies([]);
    }
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent">Message sent to selected companies!</Notification>, {
        placement: "top-center",
      });
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedCompanies([]);
    }, 500);
  };

  if (selectedCompanies.length === 0) {
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
                  <span className="heading-text">{selectedCompanies.length} Companies</span>
                  <span>selected</span>
                </span>
              </span>
            </span>
            <div className="flex items-center">
              <Button
                size="sm"
                className="ltr:mr-3 rtl:ml-3"
                type="button"
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
        title="Remove Companies"
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>Are you sure you want to remove these companies? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message</h5>
        <p>Send message to the following companies:</p>
        <Avatar.Group chained omittedAvatarTooltip className="mt-4" maxCount={4} omittedAvatarProps={{ size: 30 }}>
          {selectedCompanies.map((company) => (
            <Tooltip key={company.id} title={company.name}>
              <Avatar size={30} src={company.company_photo} alt={company.name} icon={<TbUserCircle />} />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor content={""} />
        </div>
        <div className="ltr:justify-end flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button>
        </div>
      </Dialog>
    </>
  );
};
// --- End CompanyListSelected ---

// --- Main Company Page Component ---
const Company = () => {
  return (
    <CompanyListProvider>
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Company</h5>
                <CompanyListActionTools />
              </div>
              <CompanyListTable />
            </div>
          </AdaptiveCard>
        </Container>
        <CompanyListSelected />
      </>
    </CompanyListProvider>
  );
};

export default Company;