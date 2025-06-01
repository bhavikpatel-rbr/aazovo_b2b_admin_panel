import { zodResolver } from "@hookform/resolvers/zod";
import cloneDeep from "lodash/cloneDeep"; // Added for partner table logic
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
import DebouceInput from "@/components/shared/DebouceInput"; // For Partner Search
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Drawer,
  Dropdown,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import {
  MdCheckCircle,
  MdErrorOutline,
  MdHourglassEmpty,
  MdLink,
} from "react-icons/md";
import {
  TbBriefcase,
  TbCertificate,
  TbChecks,
  TbClockHour4,
  TbCloudDownload,
  TbCloudUpload,
  TbCreditCard,
  TbDotsVertical, // For Partner Search
  TbExternalLink,
  TbEye,
  TbFileDescription,
  TbFilter,
  TbMapPin,
  TbPencil,
  TbPlus,
  TbSearch,
  TbShare,
  TbUserCircle,
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
  deleteAllpartnerAction,
  getpartnerAction // Ensure these actions exist or are created
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";


// --- PartnerListItem Type (Data Structure) ---
export type PartnerListItem = {
  id: string;
  partner_name: string;
  partner_logo: string;
  partner_email_id: string;
  partner_contact_number: string;
  partner_reference_id?: string;
  status: "active" | "inactive"; // Overall status of the entry for list management

  partner_business_type: string;
  business_category: string[];
  partner_service_offerings: string[];
  partner_interested_in: "Buy" | "Sell" | "Both" | "None";

  partner_status_orig: "Active" | "Inactive" | "Pending"; // Partner's operational status
  partner_kyc_status: string; // e.g., 'Verified', 'Pending', 'Under Review', 'Not Submitted'
  partner_profile_completion: number;
  partner_join_date: string;
  partner_trust_score: number;
  partner_activity_score: number;

  partner_location: string; // e.g., "City, Country" or "Country / State / City"
  partner_website?: string;
  partner_profile_link?: string;
  partner_certifications: string[];

  partner_payment_terms?: string;
  partner_lead_time?: number; // In days
  partner_document_upload?: string;
};
// --- End PartnerListItem Type ---

// --- Zod Schema for Partner Filter Form ---
const partnerFilterFormSchema = z.object({
  filterPartnerStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterKycStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBusinessType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCountry: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // Add more partner-specific filters if needed:
  // filterInterestedIn: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterLeadTime: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(), // Example for range
});
type PartnerFilterFormData = z.infer<typeof partnerFilterFormSchema>;
// --- End Partner Filter Schema ---

// --- Partner Status Colors ---
const partnerDisplayStatusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Inactive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Pending: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  Verified: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Under Review": "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  "Not Submitted": "bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400",
  // For the `status` field (overall list management)
  active: "bg-green-200 text-green-600",
  inactive: "bg-red-200 text-red-600",
};

const getPartnerDisplayStatusClass = (statusValue?: string): string => {
  if (!statusValue) return "bg-gray-100 text-gray-500";
  return partnerDisplayStatusColors[statusValue] || "bg-gray-100 text-gray-500";
};
// --- End Partner Status Colors ---

// --- MOCK PARTNER FILTER OPTIONS (Replace/derive from actual data) ---
const partnerStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Pending", label: "Pending" },
];
const partnerKycStatusOptions = [
  { value: "Verified", label: "Verified" },
  { value: "Pending", label: "Pending" },
  { value: "Under Review", label: "Under Review" },
  { value: "Not Submitted", label: "Not Submitted" },
];
// Example: derive from data if possible, or use mocks
const partnerCountryOptions = [
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "India", label: "India" },
];
// --- END MOCK PARTNER FILTER OPTIONS ---


// --- Partner List Store ---
interface PartnerListStore {
  partnerList: PartnerListItem[];
  selectedPartners: PartnerListItem[];
  partnerListTotal: number;
  setPartnerList: React.Dispatch<React.SetStateAction<PartnerListItem[]>>;
  setSelectedPartners: React.Dispatch<React.SetStateAction<PartnerListItem[]>>;
  setPartnerListTotal: React.Dispatch<React.SetStateAction<number>>;
}

const PartnerListContext = React.createContext<PartnerListStore | undefined>(undefined);

const usePartnerList = (): PartnerListStore => {
  const context = useContext(PartnerListContext);
  if (!context) {
    throw new Error("usePartnerList must be used within a PartnerListProvider");
  }
  return context;
};

const PartnerListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


  const { partnerData = [] } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [partnerList, setPartnerList] = useState<PartnerListItem[]>(partnerData);
  const [selectedPartners, setSelectedPartners] = useState<PartnerListItem[]>([]);
  const [partnerListTotal, setPartnerListTotal] = useState(partnerData.length);
  console.log(partnerList, partnerData)
  useEffect(() => {
    setPartnerList(partnerData)
    setPartnerListTotal(partnerData.length)
  }, [partnerData])

  useEffect(() => {
    dispatch(getpartnerAction()); // Fetch continents for select dropdown
  }, [dispatch]);




  return (
    <PartnerListContext.Provider value={{
      partnerList, setPartnerList,
      selectedPartners, setSelectedPartners,
      partnerListTotal, setPartnerListTotal
    }}>
      {children}
    </PartnerListContext.Provider>
  );
};
// --- End Partner List Store ---

// --- PartnerListSearch Component ---
interface PartnerListSearchProps {
  onInputChange: (value: string) => void;
  // ref?: Ref<HTMLInputElement>; // DebounceInput might not need explicit ref passing like this
}
const PartnerListSearch: React.FC<PartnerListSearchProps> = ({ onInputChange }) => {
  return (
    <DebouceInput
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
};
// --- End PartnerListSearch ---

// --- PartnerListActionTools Component (for Page Header) ---
const PartnerListActionTools = () => {
  const navigate = useNavigate();
  // const { partnerList } // If CSVLink for all data was here

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* CSVLink for all data could be here if desired, or with table tools */}
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/create-partner")}
      >
        Add New
      </Button>
    </div>
  );
};
// --- End PartnerListActionTools ---

// --- PartnerActionColumn Component (for DataTable) ---
const PartnerActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  // onClone, // Clone was in dropdown in original, let's keep it there if more actions
  // onChangeStatus, // Status change was also in dropdown
  // onDelete, // Delete was also in dropdown
  onShare,
}: {
  rowData: PartnerListItem;
  onEdit: (id: string) => void;
  onViewDetail: (id: string) => void;
  onShare: (id: string) => void;
  // For actions inside dropdown:
  onCloneItem: (id: string) => void;
  onChangeItemStatus: (id: string, currentStatus: PartnerListItem["status"]) => void;
  onDeleteItem: (id: string) => void;
}) => {
  // const navigate = useNavigate(); // If navigation is needed from actions

  return (
    <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400"
          role="button"
          onClick={() => onEdit(rowData.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View Details">
        <div
          className="text-xl cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400"
          role="button"
          onClick={() => onViewDetail(rowData.id)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className="text-xl cursor-pointer select-none hover:text-orange-600 dark:hover:text-orange-400"
          role="button"
          onClick={() => onShare(rowData.id)}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <Dropdown renderTitle={<TbDotsVertical />} style={{ fontSize: "10px" }}>
          {/* Example actions from original partner code */}
          {/* <Dropdown.Item className="text-xs py-2" style={{height:"auto"}} onClick={() => onCloneItem(rowData.id)}>
                Clone Partner
            </Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}} onClick={() => onChangeItemStatus(rowData.id, rowData.status)}>
                Change Status (List)
            </Dropdown.Item>
            <Dropdown.Item className="text-xs py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" style={{height:"auto"}} onClick={() => onDeleteItem(rowData.id)}>
                Delete Partner
            </Dropdown.Item>
            <Dropdown.Separator /> */}
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
// --- End PartnerActionColumn ---

// --- PartnerListTable Component ---
const PartnerListTable = () => {
  const navigate = useNavigate();
  const {
    partnerList,
    setPartnerList,
    selectedPartners,
    setSelectedPartners,
    // partnerListTotal, // This will be derived by `total` from useMemo
    setPartnerListTotal,
  } = usePartnerList();

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<PartnerFilterFormData>({});

  const filterFormMethods = useForm<PartnerFilterFormData>({
    resolver: zodResolver(partnerFilterFormSchema),
    defaultValues: filterCriteria,
  });

  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria); // Ensure form resets to current applied filters
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: PartnerFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page on new filter
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: PartnerFilterFormData = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page
    // closeFilterDrawer(); // Optional: keep drawer open or close
  };

  const { pageData, total } = useMemo(() => {
    let filteredData = [...partnerList];

    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = filteredData.filter(
        (partner) =>
          partner.id.toLowerCase().includes(query) ||
          partner.partner_name.toLowerCase().includes(query) ||
          partner.partner_email_id.toLowerCase().includes(query) ||
          partner.partner_contact_number.toLowerCase().includes(query) ||
          partner.partner_business_type.toLowerCase().includes(query) ||
          (partner.partner_reference_id && partner.partner_reference_id.toLowerCase().includes(query)) ||
          partner.business_category.some(cat => cat.toLowerCase().includes(query)) ||
          partner.partner_location.toLowerCase().includes(query)
      );
    }

    // Apply partner-specific filters
    if (filterCriteria.filterPartnerStatus && filterCriteria.filterPartnerStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterPartnerStatus.map((opt) => opt.value);
      filteredData = filteredData.filter((partner) => selectedStatuses.includes(partner.partner_status_orig));
    }
    if (filterCriteria.filterKycStatus && filterCriteria.filterKycStatus.length > 0) {
      const selectedKyc = filterCriteria.filterKycStatus.map((opt) => opt.value);
      filteredData = filteredData.filter((partner) => selectedKyc.includes(partner.partner_kyc_status));
    }
    if (filterCriteria.filterBusinessType && filterCriteria.filterBusinessType.length > 0) {
      const selectedTypes = filterCriteria.filterBusinessType.map((opt) => opt.value.toLowerCase());
      filteredData = filteredData.filter((partner) => selectedTypes.includes(partner.partner_business_type.toLowerCase()));
    }
    if (filterCriteria.filterCategory && filterCriteria.filterCategory.length > 0) {
      const selectedCategories = filterCriteria.filterCategory.map((opt) => opt.value.toLowerCase());
      filteredData = filteredData.filter((partner) =>
        partner.business_category.some(cat => selectedCategories.includes(cat.toLowerCase()))
      );
    }
    if (filterCriteria.filterCountry && filterCriteria.filterCountry.length > 0) {
      const selectedCountries = filterCriteria.filterCountry.map(opt => opt.value.toLowerCase());
      filteredData = filteredData.filter(partner => {
        // Assuming country is the last part of "City, Country" or parsable
        const locationParts = partner.partner_location.split(/,\s*|\s*\/\s*/);
        const country = locationParts.pop()?.toLowerCase();
        return country && selectedCountries.includes(country);
      });
    }


    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof PartnerListItem] ?? "";
        const bValue = b[key as keyof PartnerListItem] ?? "";
        if (["partner_profile_completion", "partner_trust_score", "partner_activity_score", "partner_lead_time"].includes(key)) {
          const numA = Number(aValue);
          const numB = Number(bValue);
          if (!isNaN(numA) && !isNaN(numB)) return order === "asc" ? numA - numB : numB - numA;
        }
        if (key === "partner_join_date") {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return order === "asc" ? dateA - dateB : dateB - dateA;
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
  }, [partnerList, tableData, filterCriteria]);

  const handleEditPartner = (id: string) => { console.log("Edit Partner:", id); navigate(`/business-entities/create-partner`, {state:id}) };
  const handleViewPartnerDetails = (id: string) => { console.log("View Partner Details:", id); navigate(`/business-entities/create-partner`, {state:id}) };
  const handleSharePartner = (id: string) => { console.log("Share Partner:", id); };

  // More actions (from dropdown)
  const handleClonePartnerItem = (id: string) => {
    const partnerToClone = partnerList.find((p) => p.id === id);
    if (!partnerToClone) return;
    const newId = `P-CLONE-${Date.now()}`;
    const clonedPartner: PartnerListItem = {
      ...cloneDeep(partnerToClone),
      id: newId,
      partner_name: `${partnerToClone.partner_name} (Clone)`,
      status: "inactive", // Default status for cloned item
      partner_status_orig: "Pending", // Default partner status for cloned item
    };
    setPartnerList((prev) => [clonedPartner, ...prev]);
    setPartnerListTotal(prev => prev + 1);
    toast.push(<Notification type="success" title="Partner Cloned">New partner created from clone.</Notification>, { placement: "top-center" });
  };

  const handleChangePartnerItemStatus = (id: string, currentStatus: PartnerListItem["status"]) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setPartnerList((current) =>
      current.map((p) =>
        p.id === id ? { ...p, status: newStatus, partner_status_orig: newStatus === "active" ? "Active" : "Inactive" } : p
      )
    );
    toast.push(<Notification type="info" title="Partner Status Updated">{`Partner list status changed to ${newStatus}.`}</Notification>, { placement: "top-center" });
  };

  const handleDeletePartnerItem = (id: string) => {
    // This could open a confirmation dialog first
    setPartnerList((current) => current.filter((p) => p.id !== id));
    setPartnerListTotal(prev => prev - 1);
    setSelectedPartners(prev => prev.filter(p => p.id !== id)); // Also remove from selection if present
    toast.push(<Notification type="success" title="Partner Deleted">Partner removed from the list.</Notification>, { placement: "top-center" });
  };


  const columns: ColumnDef<PartnerListItem>[] = useMemo(
    () => [
      {
        header: "Partner Details",
        accessorKey: "partner_name",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const { partner_name, partner_logo, partner_email_id, partner_contact_number, partner_reference_id, id } = row.original;
          return (
            <div className="flex items-start gap-3">
              <Avatar src={partner_logo} size="lg" shape="circle" icon={<TbUserCircle />} />
              <div className="flex flex-col text-xs min-w-0">
                <span
                  className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-blue-600 cursor-pointer truncate"
                  onClick={() => handleViewPartnerDetails(id)}
                  title={partner_name}
                >
                  {partner_name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 truncate" title={partner_email_id}>
                  {partner_email_id}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{partner_contact_number}</span>
                {partner_reference_id && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Ref: {partner_reference_id}</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Business Focus",
        accessorKey: "partner_business_type",
        enableSorting: true,
        size: 250,
        cell: ({ row }) => {
          const { partner_business_type, business_category, partner_interested_in, partner_service_offerings } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center">
                <TbBriefcase className="inline mr-1.5 text-gray-500 flex-shrink-0" />
                <span className="font-semibold mr-1">Type:</span>
                <span className="text-gray-600 dark:text-gray-400 truncate" title={partner_business_type}>
                  {partner_business_type}
                </span>
              </div>
              {business_category?.length > 0 && (
                <div className="flex items-start">
                  <span className="font-semibold mr-1.5">Category: </span>
                  <Tooltip placement="top" title={business_category.join(" | ")}>
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {business_category.join(", ")}
                    </span>
                  </Tooltip>
                </div>
              )}
              {partner_service_offerings?.length > 0 && (
                <div className="flex items-start">
                  <span className="font-semibold mr-1.5">Services: </span>
                  <Tooltip placement="top" title={partner_service_offerings.join(" | ")}>
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {partner_service_offerings.join(", ")}
                    </span>
                  </Tooltip>
                </div>
              )}
              <div className="flex items-start">
                <span className="font-semibold mr-1.5">Interested In: </span>
                <Tooltip placement="top" title={partner_interested_in}>
                  <span className="text-gray-600 dark:text-gray-400">
                    {partner_interested_in}
                  </span>
                </Tooltip>
              </div>
            </div>
          );
        },
      },
      {
        header: "Status & Scores",
        accessorKey: "partner_status_orig",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const { partner_status_orig, partner_kyc_status, partner_profile_completion, partner_trust_score, partner_activity_score, partner_join_date } = row.original;
          let kycIcon = <MdHourglassEmpty className="text-orange-500 inline mr-0.5" size={12} />;
          if (partner_kyc_status === "Verified") kycIcon = <MdCheckCircle className="text-green-500 inline mr-0.5" size={12} />;
          else if (["Not Submitted", "Rejected"].includes(partner_kyc_status)) kycIcon = <MdErrorOutline className="text-red-500 inline mr-0.5" size={12} />;

          return (
            <div className="flex flex-col gap-1 text-xs">
              <Tag className={`${getPartnerDisplayStatusClass(partner_status_orig)} capitalize font-semibold border-0 self-start px-2 py-0.5 !text-[10px]`}>
                Partner: {partner_status_orig}
              </Tag>
              <Tooltip title={`KYC: ${partner_kyc_status}`} className="text-xs mt-0.5">
                <Tag className={`${getPartnerDisplayStatusClass(partner_kyc_status)} capitalize !text-[9px] px-1.5 py-0.5 border self-start flex items-center`}>
                  {kycIcon}{partner_kyc_status}
                </Tag>
              </Tooltip>
              <Tooltip title={`Profile: ${partner_profile_completion}%`}>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 my-1">
                  <div
                    className="bg-blue-500 h-full rounded-full flex items-center justify-end text-white pr-1 text-[8px]"
                    style={{ width: `${partner_profile_completion}%` }}
                  >
                    {partner_profile_completion > 15 && `${partner_profile_completion}%`}
                  </div>
                </div>
              </Tooltip>
              <div className="flex justify-between items-center text-[10px] gap-1">
                <Tooltip title={`Trust: ${partner_trust_score}%`}>
                  <Tag className="flex-1 text-center !py-0.5 bg-blue-100 text-blue-700">T: {partner_trust_score}%</Tag>
                </Tooltip>
                <Tooltip title={`Activity: ${partner_activity_score}%`}>
                  <Tag className="flex-1 text-center !py-0.5 bg-purple-100 text-purple-700">A: {partner_activity_score}%</Tag>
                </Tooltip>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                Joined: {new Date(partner_join_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, "/")}
              </div>
            </div>
          );
        },
      },
      {
        header: "Location & Links",
        accessorKey: "partner_location",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const { partner_location, partner_website, partner_profile_link, partner_certifications, partner_document_upload, partner_payment_terms, partner_lead_time } = row.original;
          const getShortCertificationsDisplay = (certs: string[] | undefined): string => {
            if (!certs || certs.length === 0) return "N/A";
            if (certs.length === 1) return certs[0].length > 15 ? certs[0].substring(0, 12) + "..." : certs[0];
            const firstFew = certs.slice(0, 1).map(cert => cert.substring(0, 8) + (cert.length > 8 ? ".." : ""));
            let display = firstFew.join(", ");
            if (certs.length > 1) display += `, +${certs.length - 1}`;
            return display;
          };
          return (
            <div className="flex flex-col gap-1 text-xs">
              {partner_location && <div className="flex items-center"><TbMapPin className="text-gray-500 mr-1.5 flex-shrink-0" /> {partner_location}</div>}
              {partner_website && <a href={partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex items-center"><TbExternalLink className="mr-1.5 flex-shrink-0" /> Website</a>}
              {partner_profile_link && <a href={partner_profile_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex items-center"><MdLink className="mr-1.5 flex-shrink-0" size={14} /> Profile</a>}
              {partner_certifications && partner_certifications.length > 0 && (
                <Tooltip placement="top" title={partner_certifications.join(" | ")}>
                  <div className="text-gray-600 dark:text-gray-400 truncate flex items-center">
                    <TbCertificate className="text-gray-500 mr-1.5 flex-shrink-0" /> {getShortCertificationsDisplay(partner_certifications)}
                  </div>
                </Tooltip>
              )}
              {partner_document_upload && <a href={partner_document_upload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex items-center"><TbFileDescription className="mr-1.5 flex-shrink-0" /> Document</a>}
              {partner_payment_terms && <div className="flex items-center"><TbCreditCard className="text-gray-500 mr-1.5 flex-shrink-0" /> {partner_payment_terms}</div>}
              {partner_lead_time !== undefined && <div className="flex items-center"><TbClockHour4 className="text-gray-500 mr-1.5 flex-shrink-0" /> Lead: {partner_lead_time} days</div>}
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
          <PartnerActionColumn
            rowData={props.row.original}
            onEdit={handleEditPartner}
            onViewDetail={handleViewPartnerDetails}
            onShare={handleSharePartner}
            onCloneItem={handleClonePartnerItem}
            onChangeItemStatus={handleChangePartnerItemStatus}
            onDeleteItem={handleDeletePartnerItem}
          />
        ),
      },
    ],
    [partnerList] // Add partnerList to re-evaluate if needed for dynamic options inside columns, though not strictly necessary for these handlers
  );

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);

  const handleRowSelect = useCallback((checked: boolean, row: PartnerListItem) => {
    setSelectedPartners((prevSelected) => {
      if (checked) {
        return [...prevSelected, row];
      } else {
        return prevSelected.filter((item) => item.id !== row.id);
      }
    });
  }, [setSelectedPartners]);

  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<PartnerListItem>[]) => {
    if (checked) {
      const allOriginalRows = rows.map(r => r.original);
      setSelectedPartners(allOriginalRows);
    } else {
      setSelectedPartners([]);
    }
  }, [setSelectedPartners]);

  const handleImport = () => { console.log("Import clicked"); /* Implement import logic */ };

  const csvData = useMemo(() => {
    if (partnerList.length === 0) return [];
    // const headers = Object.keys(initialPartnerData[0] || {}).map(key => ({
    //     label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    //     key: key
    // }));

    return partnerList.map(partner => {
      const newPartner: any = { ...partner };
      Object.keys(newPartner).forEach(key => {
        if (Array.isArray(newPartner[key as keyof PartnerListItem])) {
          newPartner[key] = (newPartner[key as keyof PartnerListItem] as string[]).join('; '); // Use semicolon for multi-value fields
        }
      });
      return newPartner;
    });
  }, [partnerList]);

  // Dynamic filter options (example for business types and categories)
  const getPartnerBusinessTypeOptions = useMemo(() => {
    return partnerList
      .map((p) => p.partner_business_type)
      .filter((v, i, a) => a.indexOf(v) === i && v) // Unique and non-empty
      .map((type) => ({ value: type, label: type }));
  }, [partnerList]);

  const getPartnerCategoryOptions = useMemo(() => {
    return partnerList
      .flatMap((p) => p.business_category)
      .filter((v, i, a) => a.indexOf(v) === i && v) // Unique and non-empty
      .map((cat) => ({ value: cat, label: cat }));
  }, [partnerList]);


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <PartnerListSearch onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button icon={<TbCloudDownload />} onClick={handleImport}>Import</Button>
          {partnerList.length > 0 ? (
            <CSVLink data={csvData} filename="partners_export.csv">
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
        noData={!isLoading && partnerList.length === 0}
        loading={isLoading}
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) => selectedPartners.some((selected) => selected.id === row.id)}
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Partner Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterPartnerForm" type="submit">Apply</Button>
          </div>
        }
      >
        <UiForm id="filterPartnerForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-2">
            <UiFormItem label="Partner Status">
              <Controller name="filterPartnerStatus" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Status" options={partnerStatusOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="KYC Status">
              <Controller name="filterKycStatus" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select KYC Status" options={partnerKycStatusOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Business Type">
              <Controller name="filterBusinessType" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Type" options={getPartnerBusinessTypeOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Business Category">
              <Controller name="filterCategory" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Category" options={getPartnerCategoryOptions}
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            <UiFormItem label="Country">
              <Controller name="filterCountry" control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect isMulti placeholder="Select Country" options={partnerCountryOptions} // Or derive dynamically
                    value={field.value || []} onChange={(val) => field.onChange(val || [])} />
                )} />
            </UiFormItem>
            {/* Add more filter fields here based on PartnerFilterFormData */}
          </div>
        </UiForm>
      </Drawer>
    </>
  );
};
// --- End PartnerListTable ---

// --- PartnerListSelected Component (for bulk actions) ---
const PartnerListSelected = () => {
  const {
    selectedPartners,
    setSelectedPartners,
    partnerList,
    setPartnerList,
    // partnerListTotal, // Not directly used, setPartnerListTotal used instead
    setPartnerListTotal
  } = usePartnerList();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false); // Example action
  const [sendMessageLoading, setSendMessageLoading] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const dispatch = useAppDispatch();

  const handleConfirmDelete = async () => {
    if (
      !selectedPartners
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Parter ID is missing.
        </Notification>
      );
      setSelectedPartners([]);
      setDeleteConfirmationOpen(false);
      return;
    }
    setDeleteConfirmationOpen(false);
    try {
      const ids = selectedPartners.map((data) => data.id);
      await dispatch(deleteAllpartnerAction({ ids: ids.toString() })).unwrap();
      toast.push(
        <Notification title="Country Deleted" type="success" duration={2000}>
          parters "{selectedPartners.name}" deleted.
        </Notification>
      );
      dispatch(getpartnerAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete parters.`}
        </Notification>
      );
      console.error("Delete parters Error:", error);
    } finally {
      setSelectedPartners([]);
    }
  };

  // Example bulk message action
  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent">Message sent to selected partners!</Notification>, {
        placement: "top-center",
      });
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedPartners([]);
    }, 500);
  };

  if (selectedPartners.length === 0) {
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
                  <span className="heading-text">{selectedPartners.length} Partners</span>
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
                Message {/* Or other bulk action */}
              </Button>
            </div>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title="Remove Partners"
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>Are you sure you want to remove these partners? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message to Partners</h5>
        <p>Send message to the following partners:</p>
        <Avatar.Group chained omittedAvatarTooltip className="mt-4" maxCount={4} omittedAvatarProps={{ size: 30 }}>
          {selectedPartners.map((partner) => (
            <Tooltip key={partner.id} title={partner.partner_name}>
              <Avatar size={30} src={partner.partner_logo} alt={partner.partner_name} icon={<TbUserCircle />} />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor content={""} /> {/* Manage content state if needed */}
        </div>
        <div className="ltr:justify-end flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button>
        </div>
      </Dialog>
    </>
  );
};
// --- End PartnerListSelected ---

// --- Main Partner Page Component ---
const Partner = () => {
  return (
    <PartnerListProvider> {/* Wrap components with Provider */}
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Partners</h5>
                <PartnerListActionTools />
              </div>
              <PartnerListTable />
            </div>
          </AdaptiveCard>
        </Container>
        <PartnerListSelected />
      </>
    </PartnerListProvider>
  );
};

export default Partner;