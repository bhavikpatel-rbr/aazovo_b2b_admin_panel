import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Input,
  Select,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
  Tag,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCancel, MdCheckCircle } from "react-icons/md";
import {
  TbBrandWhatsapp,
  TbCalendarEvent, // Added Icon
  TbChecks,
  TbCloudUpload,
  TbColumns,
  TbEye,
  TbFilter,
  TbMail,
  TbPencil,
  TbPlus,
  TbReload,
  TbSearch,
  TbUser,
  TbUserCancel,
  TbUserCheck,
  TbUserCircle,
  TbUserMinus,
  TbUsersGroup,
  TbUserX,
  TbX,
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
  addScheduleAction, // Added Action
  deleteAllpartnerAction,
  getContinentsAction,
  getCountriesAction,
  getpartnerAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import dayjs from "dayjs"; // Added dayjs
import { useSelector } from "react-redux";

// --- PartnerItem Type (Data Structure) ---
export type PartnerItem = {
  id: string;
  partner_name: string;
  owner_name: string;
  ownership_type: string;
  partner_code?: string;
  primary_contact_number: string;
  primary_contact_number_code: string;
  primary_email_id: string;
  partner_website?: string;
  status: "Active" | "Pending" | "Inactive" | "Verified" | "active" | "inactive" | "Non Verified";
  country: { name: string };
  continent: { name: string };
  state: string;
  city: string;
  gst_number?: string;
  pan_number?: string;
  partner_logo?: string;
  teams_count: number;
  profile_completion: number;
  kyc_verified: boolean;
  due_after_3_months_date: string;
  created_at: string;
  [key: string]: any;
};

// --- Zod Schema for Partner Filter Form ---
const partnerFilterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterOwnershipType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCreatedDate: z.array(z.date().nullable()).optional().default([null, null]),
});
type PartnerFilterFormData = z.infer<typeof partnerFilterFormSchema>;

// --- Zod Schema for Export Reason ---
const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Zod Schema for Schedule Form (ADDED) ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- CSV Exporter Utility ---
const PARTNER_CSV_HEADERS = ["ID", "Name", "Partner Code", "Ownership Type", "Status", "Country", "State", "City", "KYC Verified", "Created Date", "Owner", "Contact Number", "Email", "Website", "GST", "PAN"];
type PartnerExportItem = { [key: string]: any };

function exportToCsv(filename: string, rows: PartnerItem[]) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }
  const transformedRows: PartnerExportItem[] = rows.map(row => ({
    id: String(row.id) || "N/A",
    name: row.partner_name || "N/A",
    partner_code: row.partner_code || "N/A",
    ownership_type: row.ownership_type || "N/A",
    status: row.status || "N/A",
    country: row.country?.name || "N/A",
    state: row.state || "N/A",
    city: row.city || "N/A",
    kyc_verified: row.kyc_verified ? "Yes" : "No",
    created_at: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "N/A",
    owner_name: row.owner_name || "N/A",
    primary_contact_number: row.primary_contact_number || "N/A",
    primary_email_id: row.primary_email_id || "N/A",
    partner_website: row.partner_website || "N/A",
    gst_number: row.gst_number || "N/A",
    pan_number: row.pan_number || "N/A",
  }));
  const csvContent = [
    PARTNER_CSV_HEADERS.join(','),
    ...transformedRows.map(row => PARTNER_CSV_HEADERS.map(header => JSON.stringify(row[header.toLowerCase().replace(/ /g, '_')] || '', (key, value) => value === null ? '' : value)).join(','))
  ].join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Status Colors & Context ---
export const getPartnerStatusClass = (statusValue?: PartnerItem["status"]): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  const lowerCaseStatus = statusValue.toLowerCase();
  const partnerStatusColors: Record<string, string> = {
    active: "bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    verified: "bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    pending: "bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
    inactive: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    "non verified": "bg-yellow-200 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
  };
  return partnerStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
};

interface PartnerListStore {
  partnerList: PartnerItem[];
  selectedPartners: PartnerItem[];
  partnerCount: any;
  CountriesData: any[];
  ContinentsData: any[];
  partnerListTotal: number;
  setPartnerList: React.Dispatch<React.SetStateAction<PartnerItem[]>>;
  setSelectedPartners: React.Dispatch<React.SetStateAction<PartnerItem[]>>;
  setPartnerListTotal: React.Dispatch<React.SetStateAction<number>>;
}
const PartnerListContext = React.createContext<PartnerListStore | undefined>(undefined);
const usePartnerList = (): PartnerListStore => {
  const context = useContext(PartnerListContext);
  if (!context) throw new Error("usePartnerList must be used within a PartnerListProvider");
  return context;
};

const PartnerListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { partnerData, CountriesData, ContinentsData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [partnerList, setPartnerList] = useState<PartnerItem[]>(partnerData?.data ?? []);
  const [selectedPartners, setSelectedPartners] = useState<PartnerItem[]>([]);
  const [partnerCount, setPartnerCount] = useState(partnerData?.counts ?? {});
  const [partnerListTotal, setPartnerListTotal] = useState<number>(partnerData?.data?.length ?? 0);

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
  }, [dispatch]);

  useEffect(() => {
    setPartnerList(partnerData?.data ?? []);
    setPartnerListTotal(partnerData?.data?.length ?? 0);
    setPartnerCount(partnerData?.counts ?? {});
  }, [partnerData]);

  useEffect(() => {
    dispatch(getpartnerAction());
  }, [dispatch]);

  return (
    <PartnerListContext.Provider value={{
      partnerList, setPartnerList,
      selectedPartners, setSelectedPartners,
      partnerListTotal, setPartnerListTotal,
      partnerCount,
      ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [],
      CountriesData: Array.isArray(CountriesData) ? CountriesData : [],
    }}
    >
      {children}
    </PartnerListContext.Provider>
  );
};

// --- MODALS SECTION ---
export type ModalType = 'email' | 'whatsapp' | 'schedule';
export interface ModalState { isOpen: boolean; type: ModalType | null; data: PartnerItem | null; }

const AddPartnerScheduleDialog: React.FC<{ partner: PartnerItem; onClose: () => void }> = ({ partner, onClose }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const eventTypeOptions = [ { value: "Meeting", label: "Meeting" }, { value: "Call", label: "Follow-up Call" }, { value: "Deadline", label: "Project Deadline" }, { value: "Reminder", label: "Reminder" }, ];

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
      resolver: zodResolver(scheduleSchema),
      defaultValues: { event_title: `Meeting with ${partner.partner_name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Regarding partner ${partner.partner_name} (${partner.partner_code}).`},
      mode: 'onChange',
    });
  
    const onAddEvent = async (data: ScheduleFormData) => {
      setIsLoading(true);
      const payload = {
        module_id: Number(partner.id),
        module_name: 'Partner',
        event_title: data.event_title,
        event_type: data.event_type,
        date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
        ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
        notes: data.notes || '',
      };
  
      try {
        await dispatch(addScheduleAction(payload)).unwrap();
        toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${partner.partner_name}.`} />);
        onClose();
      } catch (error: any) {
        toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
      } finally {
        setIsLoading(false);
      }
    };
    
    return (
      <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
        <h5 className="mb-4">Add Schedule for {partner.partner_name}</h5>
        <UiForm onSubmit={handleSubmit(onAddEvent)}>
          <UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}>
            <Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} />
          </UiFormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}>
              <Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} /> )} />
            </UiFormItem>
            <UiFormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}>
              <Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
            </UiFormItem>
          </div>
          <UiFormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}>
            <Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
          </UiFormItem>
          <UiFormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
            <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} />
          </UiFormItem>
          <div className="text-right mt-6">
            <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button>
          </div>
        </UiForm>
      </Dialog>
    );
};

const PartnerModals: React.FC<{ modalState: ModalState; onClose: () => void; }> = ({ modalState, onClose }) => {
  const { type, data: partner, isOpen } = modalState;
  if (!isOpen || !partner) return null;

  switch (type) {
    case 'schedule':
      return <AddPartnerScheduleDialog partner={partner} onClose={onClose} />;
    // Other cases for 'email', 'whatsapp' can be added here
    default:
      return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
          <p>Modal for action: {type}</p>
        </Dialog>
      );
  }
};


// --- Child Components ---
const PartnerListSearch: React.FC<{ onInputChange: (value: string) => void; value: string; }> = ({ onInputChange, value }) => {
  return <DebouceInput placeholder="Quick Search..." value={value} suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />;
};

const PartnerListActionTools = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={() => navigate("/business-entities/create-partner")}>
        Add New Partner
      </Button>
    </div>
  );
};

const PartnerActionColumn = ({ rowData, onEdit, onOpenModal }: { 
    rowData: PartnerItem; 
    onEdit: (id: string) => void;
    onOpenModal: (type: ModalType, data: PartnerItem) => void;
}) => {
    const navigate = useNavigate();
    return (
      <div className="flex items-center justify-center gap-1">
        <Tooltip title="Edit"><div className="text-xl cursor-pointer hover:text-emerald-600" role="button" onClick={() => onEdit(rowData.id)}><TbPencil /></div></Tooltip>
        <Tooltip title="View"><div className="text-xl cursor-pointer hover:text-blue-600" role="button" onClick={() => navigate(`/business-entities/partner-view/${rowData.id}`)}><TbEye /></div></Tooltip>
        <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
          <Dropdown.Item className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
          <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item>
          <Dropdown.Item onClick={() => onOpenModal('schedule', rowData)} className="flex items-center gap-2">
            <TbCalendarEvent size={18} />
            <span className="text-xs">Add Schedule</span>
          </Dropdown.Item>
        </Dropdown>
      </div>
    );
};

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
    filterData: PartnerFilterFormData;
    onRemoveFilter: (key: keyof PartnerFilterFormData, value: string) => void;
    onClearAll: () => void;
  }) => {
    const filterKeyToLabelMap: Record<string, string> = {
      filterStatus: 'Status', filterOwnershipType: 'Type', filterContinent: 'Continent',
      filterCountry: 'Country', filterState: 'State', filterCity: 'City',
      filterKycVerified: 'KYC',
    };
    const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return [];
      if (key === 'filterCreatedDate') {
        const dateArray = value as [Date | null, Date | null];
        if (dateArray[0] && dateArray[1]) {
          return [{ key, value: 'date-range', label: `Date: ${dateArray[0].toLocaleDateString()} - ${dateArray[1].toLocaleDateString()}` }];
        }
        return [];
      }
      if (Array.isArray(value)) {
        return value.filter(item => item !== null && item !== undefined).map((item: { value: string; label: string }) => ({
          key, value: item.value, label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}`,
        }));
      }
      return [];
    });
    if (activeFiltersList.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
        {activeFiltersList.map(filter => (
          <Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
            {filter.label}
            <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof PartnerFilterFormData, filter.value)} />
          </Tag>
        ))}
        <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
      </div>
    );
};

const PartnerListTable = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { partnerList, setSelectedPartners, partnerCount, ContinentsData, CountriesData } = usePartnerList();
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<PartnerFilterFormData>({ filterCreatedDate: [null, null] });
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
  
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), mode: 'onChange' });
  const filterFormMethods = useForm<PartnerFilterFormData>({ resolver: zodResolver(partnerFilterFormSchema) });

  const handleOpenModal = (type: ModalType, partnerData: PartnerItem) => setModalState({ isOpen: true, type, data: partnerData });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };

  const onApplyFiltersSubmit = (data: PartnerFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    setFilterDrawerOpen(false);
  };

  const onClearFilters = () => {
    const defaultFilters: PartnerFilterFormData = { filterCreatedDate: [null, null], filterStatus: [], filterOwnershipType: [], filterContinent: [], filterCountry: [], filterState: [], filterCity: [], filterKycVerified: [] };
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const handleRemoveFilter = (key: keyof PartnerFilterFormData, valueToRemove: string) => {
    setFilterCriteria(prev => {
        const newCriteria = { ...prev };
        if (key === 'filterCreatedDate') {
          (newCriteria as any)[key] = [null, null];
        } else {
          const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined;
          if (currentFilterArray) {
            const newFilterArray = currentFilterArray.filter(item => item.value !== valueToRemove);
            (newCriteria as any)[key] = newFilterArray;
          }
        }
        return newCriteria;
    });
    handleSetTableData({ pageIndex: 1 });
  };

  const onRefreshData = () => {
    onClearFilters();
    dispatch(getpartnerAction());
    toast.push(<Notification title="Data Refreshed" type="success" duration={2000} />);
  };

  const handleCardClick = (filterType: string, value: string) => {
    const newCriteria: PartnerFilterFormData = {
      filterCreatedDate: [null, null],
      filterStatus: [], filterOwnershipType: [], filterContinent: [], filterCountry: [],
      filterState: [], filterCity: [], filterKycVerified: [],
    };
    if (filterType === 'status') {
      newCriteria.filterStatus = [{ value, label: value }];
    }
    setFilterCriteria(newCriteria);
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let filteredData = [...partnerList];
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) { const selected = filterCriteria.filterStatus.map(s => s.value.toLowerCase()); filteredData = filteredData.filter(p => p.status && selected.includes(p.status.toLowerCase())); }
    if (filterCriteria.filterOwnershipType && filterCriteria.filterOwnershipType.length > 0) { const selected = filterCriteria.filterOwnershipType.map(s => s.value); filteredData = filteredData.filter(p => selected.includes(p.ownership_type)); }
    if (filterCriteria.filterContinent && filterCriteria.filterContinent.length > 0) { const selected = filterCriteria.filterContinent.map(s => s.value); filteredData = filteredData.filter(p => p.continent && selected.includes(p.continent.name)); }
    if (filterCriteria.filterCountry && filterCriteria.filterCountry.length > 0) { const selected = filterCriteria.filterCountry.map(s => s.value); filteredData = filteredData.filter(p => p.country && selected.includes(p.country.name)); }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) { const selected = filterCriteria.filterState.map(s => s.value); filteredData = filteredData.filter(p => selected.includes(p.state)); }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) { const selected = filterCriteria.filterCity.map(s => s.value); filteredData = filteredData.filter(p => selected.includes(p.city)); }
    if (filterCriteria.filterKycVerified && filterCriteria.filterKycVerified.length > 0) { const selected = filterCriteria.filterKycVerified.map(k => k.value === "Yes"); filteredData = filteredData.filter(p => selected.includes(p.kyc_verified)); }
    if (filterCriteria.filterCreatedDate?.[0] && filterCriteria.filterCreatedDate?.[1]) { const [start, end] = filterCriteria.filterCreatedDate; end.setHours(23, 59, 59, 999); filteredData = filteredData.filter(p => { const date = new Date(p.created_at); return date >= start && date <= end; }); }
    if (tableData.query) { filteredData = filteredData.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(tableData.query.toLowerCase()))); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { filteredData.sort((a, b) => { const av = a[key as keyof PartnerItem] ?? ""; const bv = b[key as keyof PartnerItem] ?? ""; if (typeof av === "string" && typeof bv === "string") return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); return 0; }); }
    const pI = tableData.pageIndex as number, pS = tableData.pageSize as number;
    return { pageData: filteredData.slice((pI - 1) * pS, pI * pS), total: filteredData.length, allFilteredAndSortedData: filteredData };
  }, [partnerList, tableData, filterCriteria]);

  const handleSetTableData = useCallback((d: Partial<TableQueries>) => setTableData(p => ({ ...p, ...d })), []);
  const handlePaginationChange = useCallback((p: number) => handleSetTableData({ pageIndex: p }), [handleSetTableData]);
  const handleSelectChange = useCallback((v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 }), [handleSetTableData]);
  const handleSort = useCallback((s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((c: boolean, r: PartnerItem) => setSelectedPartners(p => c ? [...p, r] : p.filter(i => i.id !== r.id)), [setSelectedPartners]);
  const handleAllRowSelect = useCallback((c: boolean, r: Row<PartnerItem>[]) => setSelectedPartners(c ? r.map(i => i.original) : []), [setSelectedPartners]);

  const handleOpenExportReasonModal = () => { /* ... */ };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { /* ... */ };

  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  const closeImageViewer = () => setImageViewerOpen(false);

  const columns: ColumnDef<PartnerItem>[] = useMemo(() => [
    { header: "Partner Info", accessorKey: "partner_name", id: 'partnerInfo', size: 220, cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Avatar src={row.original.partner_logo ? `https://aazovo.codefriend.in/${row.original.partner_logo}` : ''} size="md" shape="circle" className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(row.original.partner_logo || null)} icon={<TbUserCircle />} />
            <div>
              <h6 className="text-xs font-semibold">{row.original.partner_code}</h6>
              <span className="text-xs font-semibold">{row.original.partner_name}</span>
            </div>
          </div>
          <span className="text-xs mt-1"><b>Type:</b> {row.original.ownership_type}</span>
          <div className="text-xs text-gray-500">{row.original.city}, {row.original.state}, {row.original.country?.name}</div>
        </div>
      ),
    },
    { header: "Contact", accessorKey: "owner_name", id: 'contact', size: 180, cell: ({ row }) => (
        <div className="text-xs flex flex-col gap-0.5">
          {row.original.owner_name && <span><b>Owner:</b> {row.original.owner_name}</span>}
          {row.original.primary_contact_number && <span>{row.original.primary_contact_number_code} {row.original.primary_contact_number}</span>}
          {row.original.primary_email_id && <a href={`mailto:${row.original.primary_email_id}`} className="text-blue-600 hover:underline">{row.original.primary_email_id}</a>}
          {row.original.partner_website && <a href={row.original.partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{row.original.partner_website}</a>}
        </div>
      )
    },
    { header: "Legal IDs & Status", size: 180, accessorKey: 'status', id: 'legal', cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-[10px]">
          {row.original.gst_number && <div><b>GST:</b> <span className="break-all">{row.original.gst_number}</span></div>}
          {row.original.pan_number && <div><b>PAN:</b> <span className="break-all">{row.original.pan_number}</span></div>}
          <Tag className={`${getPartnerStatusClass(row.original.status)} capitalize mt-1 self-start !text-[10px] px-1.5 py-0.5`}>{row.original.status}</Tag>
        </div>
      )
    },
    { header: "Profile & Scores", size: 190, accessorKey: 'profile_completion', id: 'profile', cell: ({ row }) => (
        <div className="flex flex-col gap-1.5 text-xs">
          <span><b>Teams:</b> {row.original.teams_count || 0}</span>
          <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${row.original.kyc_verified ? 'Yes' : 'No'}`}>{row.original.kyc_verified ? <MdCheckCircle className="text-green-500 text-lg" /> : <MdCancel className="text-red-500 text-lg" />}</Tooltip></div>
          <Tooltip title={`Profile Completion ${row.original.profile_completion}%`}>
            <div className="h-2.5 w-full rounded-full bg-gray-300"><div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${row.original.profile_completion}%` }}></div></div>
          </Tooltip>
        </div>
      )
    },
    { header: "Actions", id: "action", meta: { HeaderClass: "text-center" }, size: 80, cell: (props) => <PartnerActionColumn rowData={props.row.original} onEdit={(id) => navigate(`/business-entities/partner-edit/${id}`)} onOpenModal={handleOpenModal} />, },
  ], [navigate, openImageViewer, handleOpenModal]);

  const [filteredColumns, setFilteredColumns] = useState(columns);
  const toggleColumn = (checked: boolean, colId: string) => { /* ... */ };
  const isColumnVisible = (colId: string) => { /* ... */ };
  const statusOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.status))).filter(Boolean).map((s) => ({ value: s, label: s })), [partnerList]);
  const ownershipTypeOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.ownership_type))).filter(Boolean).map((t) => ({ value: t, label: t })), [partnerList]);
  const continentOptions = useMemo(() => ContinentsData.map((co) => ({ value: co.name, label: co.name })), [ContinentsData]);
  const countryOptions = useMemo(() => CountriesData.map((ct) => ({ value: ct.name, label: ct.name })), [CountriesData]);
  const stateOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.state))).filter(Boolean).map((st) => ({ value: st, label: st })), [partnerList]);
  const cityOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.city))).filter(Boolean).map((ci) => ({ value: ci, label: ci })), [partnerList]);
  const kycOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  const { DatePickerRange } = DatePicker;
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-4 gap-2">
        <Tooltip title="Click to show all partners"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsersGroup size={24} /></div><div><h6>{partnerCount?.total ?? 0}</h6><span className="text-xs font-semibold">Total</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Active status"><div onClick={() => handleCardClick('status', 'Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUser size={24} /></div><div><h6>{partnerCount?.active ?? 0}</h6><span className="text-xs font-semibold">Active</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Inactive status"><div onClick={() => handleCardClick('status', 'Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserCancel size={24} /></div><div><h6>{partnerCount?.disabled ?? 0}</h6><span className="text-xs font-semibold">Disabled</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Verified status"><div onClick={() => handleCardClick('status', 'Verified')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbUserCheck size={24} /></div><div><h6>{partnerCount?.verified ?? 0}</h6><span className="text-xs font-semibold">Verified</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Unverified status"><div onClick={() => handleCardClick('status', 'Non Verified')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUserMinus size={24} /></div><div><h6>{partnerCount?.unverified ?? 0}</h6><span className="text-xs font-semibold">Unverified</span></div></Card></div></Tooltip>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <PartnerListSearch onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} value={tableData.query} />
        <div className="flex gap-2">
          <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
            <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}</div>
          </Dropdown>
          <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData.length}>Export</Button>
        </div>
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <DataTable selectable columns={filteredColumns} data={pageData} loading={isLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} />
      <Drawer title="Partner Filters" isOpen={isFilterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} onRequestClose={() => setFilterDrawerOpen(false)} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear All</Button><Button size="sm" variant="solid" form="filterPartnerForm" type="submit">Apply</Button></div>}>
        <UiForm id="filterPartnerForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={statusOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Ownership Type"><Controller name="filterOwnershipType" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Type" options={ownershipTypeOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Continent"><Controller name="filterContinent" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Continent" options={continentOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Country" options={countryOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="State"><Controller name="filterState" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select State" options={stateOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="City"><Controller name="filterCity" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select City" options={cityOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="KYC Verified"><Controller name="filterKycVerified" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={kycOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Created Date" className="col-span-2"><Controller name="filterCreatedDate" control={filterFormMethods.control} render={({ field }) => <DatePickerRange placeholder="Select Date Range" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <PartnerModals modalState={modalState} onClose={handleCloseModal} />
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <UiForm id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}>
          <UiFormItem label="Please provide a reason:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => <Input textArea {...field} placeholder="Enter reason..." rows={3} />} /></UiFormItem>
        </UiForm>
      </ConfirmDialog>
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
        <div className="flex justify-center items-center p-4">
          {imageToView ? <img src={`https://aazovo.codefriend.in/${imageToView}`} alt="Partner Logo Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} /> : <p>No image to display.</p>}
        </div>
      </Dialog>
    </>
  );
};


const PartnerListSelected = () => {
  const { selectedPartners, setSelectedPartners } = usePartnerList();
  const dispatch = useAppDispatch();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleConfirmDelete = async () => {
    if (!selectedPartners.length) return;
    setIsDeleting(true);
    try {
      const ids = selectedPartners.map((d) => d.id);
      await dispatch(deleteAllpartnerAction({ ids: ids.join(",") })).unwrap();
      toast.push(<Notification title="Partners Deleted" type="success" />);
      dispatch(getpartnerAction());
      setSelectedPartners([]);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger">{error.message}</Notification>);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationOpen(false);
    }
  };

  if (selectedPartners.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="container mx-auto flex items-center justify-between">
          <span><span className="flex items-center gap-2"><TbChecks className="text-lg text-primary-600" /><span className="font-semibold">{selectedPartners.length} Partners selected</span></span></span>
          <div className="flex items-center"><Button size="sm" className="ltr:mr-3 rtl:ml-3" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50"} onClick={handleDelete}>Delete</Button></div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title="Remove Partners" onClose={() => setDeleteConfirmationOpen(false)} onConfirm={handleConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to remove these partners? This action can't be undone.</p>
      </ConfirmDialog>
    </>
  );
};

const Partner = () => {
  return (
    <PartnerListProvider>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h5>Partner</h5>
              <PartnerListActionTools />
            </div>
            <PartnerListTable />
          </div>
        </AdaptiveCard>
      </Container>
      <PartnerListSelected />
    </PartnerListProvider>
  );
};

export default Partner;