import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { z } from "zod";

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
  Dialog,
  Drawer,
  Dropdown,
  Input,
  Tag,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCancel, MdCheckCircle } from "react-icons/md";
import {
  TbAlarm,
  TbBell,
  TbBrandWhatsapp,
  TbBuilding,
  TbBuildingBank,
  TbBuildingCommunity,
  TbCalendarEvent,
  TbCancel,
  TbChecks,
  TbCircleCheck,
  TbCircleX,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFileDescription,
  TbFilter,
  TbMail,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbReload,
  TbSearch,
  TbShieldCheck,
  TbShieldX,
  TbUser,
  TbUserCircle,
  TbUsersGroup,
  TbX
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
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllcompanyAction,
  getAllUsersAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction,
  submitExportReasonAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- Type Definitions ---
interface UserReference { id: number; name: string; profile_pic_path: string | null; }
interface ContinentReference { id: number; name: string; }
interface CountryReference { id: number; name: string; }
interface CompanyCertificate { id: number; company_id: string; certificate_id: string; certificate_name: string; upload_certificate: string | null; upload_certificate_path: string; }
interface CompanyBankDetail { id: number; company_id: string; type: string | null; bank_account_number: string; bank_name: string; ifsc_code: string; verification_photo: string | null; }
interface CompanyReference { id: number; person_name: string; company_id: string; number: string; remark: string; }
interface OfficeInfo { id: number; company_id: string; office_type: string; office_name: string; country_id: string; state: string; city: string; zip_code: string; gst_number: string; address: string; }
interface CompanySpotVerification { id: number; company_id: string; verified_by_name: string; verified: boolean; remark: string; photo_upload: string | null; photo_upload_path: string; }
interface BillingDocument { id: number; company_id: string; document_name: string; document: string | null; }
interface CompanyMemberManagement { id: number; company_id: string; member_id: string; designation: string; person_name: string; number: string; }
interface TeamMember { id: number; company_id: string; team_name: string; designation: string; person_name: string; number: string; }
export type CompanyItem = { id: number; company_code: string | null; company_name: string; status: | "Verified" | "Non Verified" | "Active" | "Pending" | "Inactive" | "active" | "inactive"; primary_email_id: string; primary_contact_number: string; primary_contact_number_code: string; alternate_contact_number: string | null; alternate_contact_number_code: string | null; alternate_email_id: string | null; general_contact_number: string | null; general_contact_number_code: string | null; ownership_type: string; owner_name: string; company_address: string; continent_id: string; country_id: string; state: string; city: string; zip_code: string; gst_number: string | null; pan_number: string | null; trn_number: string | null; tan_number: string | null; establishment_year: string | null; no_of_employees: string | null; company_website: string | null; primary_business_type: string | null; support_email: string | null; general_mobile: string | null; notification_email: string | null; kyc_verified: boolean; enable_billing: boolean; facebook_url: string | null; instagram_url: string | null; linkedIn_url: string | null; youtube_url: string | null; twitter_url: string | null; company_logo: string | null; created_at: string; updated_at: string; created_by: string; updated_by: string; deleted_at: string | null; members_count: number; teams_count: number; due_after_3_months_date: string; profile_completion: number; created_by_user: UserReference | null; updated_by_user: UserReference | null; continent: ContinentReference; country: CountryReference; company_certificate: CompanyCertificate[]; company_bank_details: CompanyBankDetail[]; company_references: CompanyReference[]; office_info: OfficeInfo[]; company_spot_verification: CompanySpotVerification[]; billing_documents: BillingDocument[]; company_member_management: CompanyMemberManagement[]; company_team_members: TeamMember[]; };

// --- Zod Schemas ---
const companyFilterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCompanyType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterEnableBilling: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCreatedDate: z.array(z.date().nullable()).optional().default([null, null]),
});
type CompanyFilterFormData = z.infer<typeof companyFilterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const scheduleSchema = z.object({ event_title: z.string().min(3, "Title must be at least 3 characters."), event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."), date_time: z.date({ required_error: "Event date & time is required." }), remind_from: z.date().nullable().optional(), notes: z.string().optional(), });
type ScheduleFormData = z.infer<typeof scheduleSchema>;

const taskValidationSchema = z.object({ task_title: z.string().min(3, 'Task title must be at least 3 characters.'), assign_to: z.array(z.number()).min(1, 'At least one assignee is required.'), priority: z.string().min(1, 'Please select a priority.'), due_date: z.date().nullable().optional(), description: z.string().optional(), });
type TaskFormData = z.infer<typeof taskValidationSchema>;
const taskPriorityOptions: SelectOption[] = [ { value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, ];

// --- Utility Functions & Constants ---
function exportToCsv(filename: string, rows: CompanyItem[]) {
    // ... (Your export logic is fine, no changes needed)
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
    const CSV_HEADERS = ["ID", "Company Name", "Owner Name", "Ownership Type", "Status", "Contact", "Email", "Country", "State", "City", "KYC Verified", "Created Date"];
    const preparedRows = rows.map(row => ({ id: row.id, company_name: row.company_name, owner_name: row.owner_name, ownership_type: row.ownership_type, status: row.status, primary_contact_number: `${row.primary_contact_number_code} ${row.primary_contact_number}`, primary_email_id: row.primary_email_id, country: row.country?.name || 'N/A', state: row.state, city: row.city, kyc_verified: row.kyc_verified ? 'Yes' : 'No', created_at: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A' }));
    const csvContent = [ CSV_HEADERS.join(','), ...preparedRows.map(row => CSV_HEADERS.map(header => JSON.stringify(row[header.toLowerCase().replace(/ /g, '_') as keyof typeof row] ?? '', (key, value) => value === null ? '' : value) ).join(',')) ].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>); return true; }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}

export const getCompanyStatusClass = (statusValue?: CompanyItem["status"]): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  const lowerCaseStatus = statusValue.toLowerCase();
  const companyStatusColors: Record<string, string> = { active: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300", verified: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300", pending: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300", inactive: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300", "non verified": "border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300", };
  return companyStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
};

// --- START: MODALS SECTION ---
export type SelectOption = { value: any; label: string };
export type ModalType = | "email" | "whatsapp" | "notification" | "task" | "schedule" | "members" | "alert" | "transaction" | "document" | "viewDetail";
export interface ModalState { isOpen: boolean; type: ModalType | null; data: CompanyItem | null; }
interface CompanyModalsProps { modalState: ModalState; onClose: () => void; getAllUserDataOptions: SelectOption[]; }

const ViewCompanyDetailDialog: React.FC<{ company: CompanyItem; onClose: () => void; }> = ({ company, onClose }) => {
    // ... (Your existing ViewCompanyDetailDialog component is fine, no changes needed)
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={800}>
            {/* Your existing implementation */}
        </Dialog>
    );
};
const AddCompanyNotificationDialog: React.FC<{ company: CompanyItem; onClose: () => void; getAllUserDataOptions: SelectOption[]; }> = ({ company, onClose, getAllUserDataOptions }) => {
    // ... (Your existing AddCompanyNotificationDialog component is fine, but ensure it uses UiForm & UiFormItem)
    return <Dialog isOpen={true} onClose={onClose}>...</Dialog>
};
const AddCompanyScheduleDialog: React.FC<{ company: CompanyItem; onClose: () => void }> = ({ company, onClose }) => {
    // ... (Your existing AddCompanyScheduleDialog component is fine, but ensure it uses UiForm & UiFormItem)
    return <Dialog isOpen={true} onClose={onClose}>...</Dialog>
};
const AssignCompanyTaskDialog: React.FC<{ company: CompanyItem; onClose: () => void; userOptions: SelectOption[] }> = ({ company, onClose, userOptions }) => {
    // ... (Your existing AssignCompanyTaskDialog component is fine, but ensure it uses UiForm & UiFormItem)
    return <Dialog isOpen={true} onClose={onClose}>...</Dialog>
};
const ViewCompanyMembersDialog: React.FC<{ company: CompanyItem; onClose: () => void; }> = ({ company, onClose }) => (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
        <h5 className="mb-4">Members of {company.company_name}</h5>
        <div className="max-h-96 overflow-y-auto">
            {company.company_member_management && company.company_member_management.length > 0 ? (
                <div className="space-y-3">
                    {company.company_member_management.map(member => (
                        <div key={member.id} className="p-3 border rounded-md dark:border-gray-600">
                            <p className="font-semibold">{member.person_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{member.designation}</p>
                            <p className="text-xs text-gray-500">{member.number}</p>
                        </div>
                    ))}
                </div>
            ) : ( <p>No members found for this company.</p> )}
        </div>
        <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
);
const ViewCompanyDataDialog: React.FC<{ title: string; message: string; onClose: () => void; }> = ({ title, message, onClose }) => (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
        <h5 className="mb-4">{title}</h5>
        <p>{message}</p>
        <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
);
const DownloadDocumentDialog: React.FC<{ company: CompanyItem; onClose: () => void; }> = ({ company, onClose }) => {
    const documents = useMemo(() => {
        const allDocs: { name: string; url: string | null }[] = [];
        company.company_certificate?.forEach(cert => { if (cert.upload_certificate_path) { allDocs.push({ name: cert.certificate_name, url: cert.upload_certificate_path }); } });
        company.billing_documents?.forEach(doc => { if (doc.document) { allDocs.push({ name: doc.document_name, url: doc.document }); } });
        return allDocs;
    }, [company]);
    
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
            <h5 className="mb-4">Download Documents for {company.company_name}</h5>
            <div className="max-h-96 overflow-y-auto">
                {documents.length > 0 ? (
                    <div className="space-y-2">
                        {documents.map((doc, index) => (
                            <a key={index} href={doc.url!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                                <span className="flex items-center gap-2"><TbFileDescription className="text-lg" />{doc.name}</span>
                                <TbDownload className="text-lg text-blue-500" />
                            </a>
                        ))}
                    </div>
                ) : ( <p>No documents available for download.</p> )}
            </div>
            <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};
const SendEmailAction: React.FC<{ company: CompanyItem; onClose: () => void; }> = ({ company, onClose }) => {
  useEffect(() => {
    if (!company.primary_email_id) { toast.push(<Notification type="warning" title="Missing Email" children="Primary email is not available for this company." />); onClose(); return; }
    const subject = `Regarding Company: ${company.company_name}`;
    const body = `Hello ${company.owner_name || company.company_name},\n\nThis is regarding your company profile (ID: ${company.id}).\n\n- Primary Contact: ${company.primary_contact_number_code || ''} ${company.primary_contact_number}\n\nThank you.`;
    window.open(`mailto:${company.primary_email_id}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    onClose();
  }, [company, onClose]);
  return null;
};
const SendWhatsAppAction: React.FC<{ company: CompanyItem; onClose: () => void; }> = ({ company, onClose }) => {
  useEffect(() => {
    const phone = company.primary_contact_number?.replace(/\D/g, '');
    const countryCode = company.primary_contact_number_code?.replace(/\D/g, '');
    if (!phone || !countryCode) { toast.push(<Notification type="warning" title="Missing Number" children="Primary contact number is not available for this company." />); onClose(); return; }
    const fullPhoneNumber = `${countryCode}${phone}`;
    const message = `Hello ${company.owner_name || company.company_name},\n\nThis is regarding your company profile with us.`;
    window.open(`https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  }, [company, onClose]);
  return null;
};

const CompanyModals: React.FC<CompanyModalsProps> = ({ modalState, onClose, getAllUserDataOptions }) => {
  const { type, data: company, isOpen } = modalState;
  if (!isOpen || !company) return null;

  switch (type) {
    case 'email': return <SendEmailAction company={company} onClose={onClose} />;
    case 'whatsapp': return <SendWhatsAppAction company={company} onClose={onClose} />;
    case "viewDetail": return <ViewCompanyDetailDialog company={company} onClose={onClose} />;
    case 'notification': return <AddCompanyNotificationDialog company={company} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
    case 'schedule': return <AddCompanyScheduleDialog company={company} onClose={onClose} />;
    case 'task': return <AssignCompanyTaskDialog company={company} onClose={onClose} userOptions={getAllUserDataOptions} />;
    case 'members': return <ViewCompanyMembersDialog company={company} onClose={onClose} />;
    case 'alert': return <ViewCompanyDataDialog title={`Alerts for ${company.company_name}`} message="No alerts found for this company." onClose={onClose} />;
    case 'transaction': return <ViewCompanyDataDialog title={`Transactions for ${company.company_name}`} message="No transactions found for this company." onClose={onClose} />;
    case 'document': return <DownloadDocumentDialog company={company} onClose={onClose} />;
    default: return null;
  }
};
// --- END MODALS SECTION ---

// --- Child Components (Search, ActionTools, Table, etc.) ---
const CompanyListContext = React.createContext<{ companyList: CompanyItem[], setSelectedCompanies: React.Dispatch<React.SetStateAction<CompanyItem[]>>, companyCount: any, ContinentsData: any[], CountriesData: any[], getAllUserData: SelectOption[] } | undefined>(undefined);
const useCompanyList = () => { const context = React.useContext(CompanyListContext); if (!context) throw new Error("useCompanyList must be used within a CompanyListProvider"); return context; };
const CompanyListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const dispatch = useAppDispatch();
  const { CompanyData, CountriesData, ContinentsData, getAllUserData = [] } = useSelector(masterSelector);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map(b => ({ value: b.id, label: b.name })) : [], [getAllUserData]);
  useEffect(() => { dispatch(getCompanyAction()); dispatch(getCountriesAction()); dispatch(getContinentsAction()); dispatch(getAllUsersAction()) }, [dispatch]);

  return (
    <CompanyListContext.Provider value={{ companyList: CompanyData?.data ?? [], setSelectedCompanies, companyCount: CompanyData?.counts ?? {}, selectedCompanies, ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [], CountriesData: Array.isArray(CountriesData) ? CountriesData : [], getAllUserData: getAllUserDataOptions, }}>{children}</CompanyListContext.Provider>
  );
};
const CompanyActionColumn = ({ rowData, onEdit, onOpenModal, }: { rowData: CompanyItem; onEdit: (id: number) => void; onOpenModal: (type: ModalType, data: CompanyItem) => void; }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600" role="button" onClick={() => onEdit(rowData.id)}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button" onClick={() => navigate(`/business-entities/company-view/${rowData.id}`)}><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"><TbMail /> Send Email</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"><TbBrandWhatsapp /> Send WhatsApp</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell /> Add Notification</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('schedule', rowData)} className="flex items-center gap-2"><TbCalendarEvent /> Add Schedule</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('task', rowData)} className="flex items-center gap-2"><TbUser /> Assign Task</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("members", rowData)} className="flex items-center gap-2"><TbUsersGroup /> View Members</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbAlarm /> View Alert</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("transaction", rowData)} className="flex items-center gap-2"><TbReceipt /> View Transaction</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("document", rowData)} className="flex items-center gap-2"><TbDownload /> Download Document</Dropdown.Item>
      </Dropdown>
    </div>
  );
};
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: CompanyFilterFormData; onRemoveFilter: (key: keyof CompanyFilterFormData, value: string) => void; onClearAll: () => void; }) => {
    // ... (Your existing ActiveFiltersDisplay component is fine, no changes needed)
    return <div>...</div>
};

const CompanyListTable = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { companyList, setSelectedCompanies, companyCount, ContinentsData, CountriesData, getAllUserData } = useCompanyList();
    const [isLoading, setIsLoading] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "", });
    const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<CompanyFilterFormData>({ filterCreatedDate: [null, null], });
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null, });

    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange", });
    const filterFormMethods = useForm<CompanyFilterFormData>({ resolver: zodResolver(companyFilterFormSchema) });

    const handleOpenModal = (type: ModalType, companyData: CompanyItem) => setModalState({ isOpen: true, type, data: companyData });
    const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });
    const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); };
    const onApplyFiltersSubmit = (data: CompanyFilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); setFilterDrawerOpen(false); };
    const onClearFilters = () => { const defaultFilters = { filterCreatedDate: [null, null] as [Date | null, Date | null], filterStatus: [], filterCompanyType: [], filterContinent: [], filterCountry: [], filterState: [], filterCity: [], filterKycVerified: [], filterEnableBilling: [], }; setFilterCriteria(defaultFilters); handleSetTableData({ pageIndex: 1, query: "" }); };
    const handleRemoveFilter = (key: keyof CompanyFilterFormData, valueToRemove: string) => { setFilterCriteria(prev => { const newCriteria = { ...prev }; if (key === 'filterCreatedDate') { (newCriteria as any)[key] = [null, null]; } else { const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined; if (currentFilterArray) { const newFilterArray = currentFilterArray.filter(item => item.value !== valueToRemove); (newCriteria as any)[key] = newFilterArray; } } return newCriteria; }); handleSetTableData({ pageIndex: 1 }); };
    const onRefreshData = () => { onClearFilters(); dispatch(getCompanyAction()); toast.push(<Notification title="Data Refreshed" type="success" duration={2000} />); };
    const handleCardClick = (filterType: string, value: string) => {
        const newCriteria: CompanyFilterFormData = { filterCreatedDate: [null, null], filterStatus: [], filterCompanyType: [], filterContinent: [], filterCountry: [], filterState: [], filterCity: [], filterKycVerified: [], filterEnableBilling: [], };
        if (filterType === 'status') {
            const statusOption = statusOptions.find(opt => opt.value === value);
            if (statusOption) { newCriteria.filterStatus = [statusOption]; }
        }
        setFilterCriteria(newCriteria);
        handleSetTableData({ pageIndex: 1, query: "" });
    };

    const { pageData, total, allFilteredAndSortedData, activeFilterCount } = useMemo(() => {
        let filteredData = [...companyList];
        // ... (Your existing filtering logic is fine)
        if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) { const selectedStatuses = filterCriteria.filterStatus.map((s) => s.value.toLowerCase()); filteredData = filteredData.filter((company) => company.status && selectedStatuses.includes(company.status.toLowerCase())); }
        if (filterCriteria.filterCompanyType && filterCriteria.filterCompanyType.length > 0) { const selectedTypes = filterCriteria.filterCompanyType.map((t) => t.value); filteredData = filteredData.filter((company) => selectedTypes.includes(company.ownership_type)); }
        if (tableData.query) { filteredData = filteredData.filter((i) => Object.values(i).some((v) => { if (typeof v === "object" && v !== null) { return Object.values(v).some((nestedV) => String(nestedV).toLowerCase().includes(tableData.query.toLowerCase())); } return String(v).toLowerCase().includes(tableData.query.toLowerCase()); })); }

        let count = 0;
        if (filterCriteria.filterStatus?.length) count++;
        // ... and so on for other filters

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { filteredData.sort((a, b) => { let av = a[key as keyof CompanyItem] as any; let bv = b[key as keyof CompanyItem] as any; if (key.includes(".")) { const keys = key.split("."); av = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), a); bv = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), b); } av = av ?? ""; bv = bv ?? ""; if (typeof av === "string" && typeof bv === "string") return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); if (typeof av === "number" && typeof bv === "number") return order === "asc" ? av - bv : bv - av; if (typeof av === "boolean" && typeof bv === "boolean") return order === "asc" ? (av === bv ? 0 : av ? -1 : 1) : (av === bv ? 0 : av ? 1 : -1); return 0; }); }
        
        const pI = tableData.pageIndex as number;
        const pS = tableData.pageSize as number;
        return { pageData: filteredData.slice((pI - 1) * pS, pI * pS), total: filteredData.length, allFilteredAndSortedData: filteredData, activeFilterCount: count };
    }, [companyList, tableData, filterCriteria]);

    const closeFilterDrawer = () => setFilterDrawerOpen(false);
    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `companies_export_${new Date().toISOString().split('T')[0]}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Company', file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            const exportSuccess = exportToCsv(fileName, allFilteredAndSortedData);
            if (exportSuccess) setIsExportReasonModalOpen(false);
        } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>); } 
        finally { setIsSubmittingExportReason(false); }
    };
    const handleEditCompany = (id: number) => navigate(`/business-entities/company-edit/${id}`);
    const handleSetTableData = (d: Partial<TableQueries>) => setTableData((p) => ({ ...p, ...d }));
    const handlePaginationChange = (p: number) => handleSetTableData({ pageIndex: p });
    const handleSelectChange = (v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 });
    const handleSort = (s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 });
    const handleRowSelect = (c: boolean, r: CompanyItem) => setSelectedCompanies((p) => c ? [...p, r] : p.filter((i) => i.id !== r.id));
    const handleAllRowSelect = (c: boolean, r: Row<CompanyItem>[]) => setSelectedCompanies(c ? r.map((i) => i.original) : []);
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);
    const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };
    const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };

    const columns: ColumnDef<CompanyItem>[] = useMemo(() => [
        { header: "Company Info", accessorKey: "company_name", id: "companyInfo", size: 220, cell: ({ row }) => { const { company_name, ownership_type, primary_business_type, country, city, state, company_logo, company_code } = row.original; return ( <div className="flex flex-col"> <div className="flex items-center gap-2"> <Avatar src={company_logo ? `https://aazovo.codefriend.in/${company_logo}` : undefined} size="sm" shape="circle" className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => company_logo && openImageViewer(company_logo)} icon={<TbUserCircle />} /> <div> <h6 className="text-xs font-semibold"><em className="text-blue-600">{company_code || "Company Code"}</em></h6> <span className="text-xs font-semibold leading-1">{company_name}</span> </div> </div> <span className="text-xs mt-1"><b>Ownership Type:</b> {ownership_type || "N/A"}</span> <span className="text-xs mt-1"><b>Primary Business Type:</b> {primary_business_type || "N/A"}</span> <div className="text-xs text-gray-500">{city}, {state}, {country?.name || "N/A"}</div> </div> ); }, },
        { header: "Contact", accessorKey: "owner_name", id: "contact", size: 180, cell: (props) => { const { owner_name, primary_contact_number, primary_email_id, company_website, primary_contact_number_code } = props.row.original; return ( <div className="text-xs flex flex-col gap-0.5"> {owner_name && (<span><b>Owner: </b> {owner_name}</span>)} {primary_contact_number && (<span>{primary_contact_number_code} {primary_contact_number}</span>)} {primary_email_id && (<a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>)} {company_website && (<a href={company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{company_website}</a>)} </div> ); }, },
        { header: "Legal IDs & Status", accessorKey: "status", id: "legal", size: 180, cell: ({ row }) => { const { gst_number, pan_number, status } = row.original; return ( <div className="flex flex-col gap-0.5 text-[11px]"> {gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>} {pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>} <Tag className={`${getCompanyStatusClass(status)} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>{status}</Tag> </div> ); }, },
        { header: "Profile & Scores", accessorKey: "profile_completion", id: "profile", size: 190, cell: ({ row }) => { const { members_count = 0, teams_count = 0, profile_completion = 0, kyc_verified, enable_billing, due_after_3_months_date } = row.original; const formattedDate = due_after_3_months_date ? dayjs(due_after_3_months_date).format('D MMM, YYYY') : "N/A"; return ( <div className="flex flex-col gap-1 text-xs"> <span><b>Members:</b> {members_count}</span> <span><b>Teams:</b> {teams_count}</span> <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>{kyc_verified ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div> <div className="flex gap-1 items-center"><b>Billing:</b><Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>{enable_billing ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div> <span><b>Billing Due:</b> {formattedDate}</span> <Tooltip title={`Profile Completion ${profile_completion}%`}> <div className="h-2.5 w-full rounded-full bg-gray-300"> <div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${profile_completion}%` }}></div> </div> </Tooltip> </div> ); }, },
        { header: "Actions", id: "action", meta: { HeaderClass: "text-center" }, size: 80, cell: (props) => <CompanyActionColumn rowData={props.row.original} onEdit={handleEditCompany} onOpenModal={handleOpenModal} /> },
    ], [handleOpenModal, openImageViewer, navigate]);

    const [filteredColumns, setFilteredColumns] = useState(columns);
    const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
    const toggleColumn = (checked: boolean, colId: string) => { if (checked) { const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId); if (originalColumn) { setFilteredColumns(prev => { const newCols = [...prev, originalColumn]; newCols.sort((a, b) => { const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey)); const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey)); return indexA - indexB; }); return newCols; }); } } else { setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId)); } };

    const statusOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.status))).filter(Boolean).map((s) => ({ value: s, label: s })), [companyList]);
    const companyTypeOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.ownership_type))).filter(Boolean).map((ct) => ({ value: ct, label: ct })), [companyList]);
    const continentOptions = useMemo(() => ContinentsData.map((co) => ({ value: co.name, label: co.name })), [ContinentsData]);
    const countryOptions = useMemo(() => CountriesData.map((ct) => ({ value: ct.name, label: ct.name })), [CountriesData]);
    const stateOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.state))).filter(Boolean).map((st) => ({ value: st, label: st })), [companyList]);
    const cityOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.city))).filter(Boolean).map((ci) => ({ value: ci, label: ci })), [companyList]);
    const kycOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
    const billingOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex gap-2 p-1";

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Company</h5>
                <div className="flex flex-col md:flex-row gap-3"><Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={() => navigate("/business-entities/company-create")}>Add New</Button></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-4 gap-2">
                <Tooltip title="Click to show all companies"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbBuilding size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm ">{companyCount?.total ?? 0}</b><span className="text-[9px] font-semibold">Total</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Active status"><div onClick={() => handleCardClick('status', 'Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbBuildingBank size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.active ?? 0}</b><span className="text-[9px] font-semibold">Active</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Inactive status"><div onClick={() => handleCardClick('status', 'Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.inactive ?? 0}</b><span className="text-[9px] font-semibold">Inactive</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Verified status"><div onClick={() => handleCardClick('status', 'Verified')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbCircleCheck size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.verified ?? 0}</b><span className="text-[9px] font-semibold">Verified</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Non Verified status"><div onClick={() => handleCardClick('status', 'Non Verified')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-yellow-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500"><TbCircleX size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.non_verified ?? 0}</b><span className="text-[9px] font-semibold">Non Verified</span></div></Card></div></Tooltip>
                <Card bodyClass={cardBodyClass} className="rounded-md border border-violet-200"><div className="h-8 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbShieldCheck size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.eligible ?? 0}</b><span className="text-[9px] font-semibold">Eligible</span></div></Card>
                <Card bodyClass={cardBodyClass} className="rounded-md border border-red-200"><div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbShieldX size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.not_eligible ?? 0}</b><span className="text-[9px] font-semibold">Not Eligible</span></div></Card>
                <Card bodyClass={cardBodyClass} className="rounded-md border border-orange-200"><div className="h-8 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbBuildingCommunity size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.members ?? 0}</b><span className="text-[9px] font-semibold">Members</span></div></Card>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <DebouceInput placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} value={tableData.query} />
                <div className="flex gap-2">
                    <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                        <div className="flex flex-col p-2">
                            <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                            {columns.map((col) => {
                                const id = col.id || col.accessorKey as string;
                                if (!col.header) return null;
                                return (
                                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox>
                                </div>
                                )
                            })}
                        </div>
                    </Dropdown>
                    <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
                    <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter{activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
                    <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData || allFilteredAndSortedData.length === 0}>Export</Button>
                </div>
            </div>
            <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
            <DataTable columns={filteredColumns} data={pageData} noData={pageData.length === 0} loading={isLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} selectable />
            <Drawer title="Company Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={() => { onClearFilters(); closeFilterDrawer(); }}>Clear All</Button><Button size="sm" variant="solid" form="filterCompanyForm" type="submit">Apply</Button></div>} >
                <UiForm id="filterCompanyForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
                    <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
                        <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={statusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="Ownership Type"><Controller name="filterCompanyType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Type" options={companyTypeOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="Continent"><Controller name="filterContinent" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Continent" options={continentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Country" options={countryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="State"><Controller name="filterState" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select State" options={stateOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="City"><Controller name="filterCity" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select City" options={cityOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="KYC Verified"><Controller name="filterKycVerified" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={kycOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="Enable Billing"><Controller name="filterEnableBilling" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={billingOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
                        <UiFormItem label="Created Date" className="col-span-2"><Controller name="filterCreatedDate" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange placeholder="Select Date Range" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />)} /></UiFormItem>
                    </div>
                </UiForm>
            </Drawer>
            <CompanyModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserData} />
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <UiForm id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
                    <UiFormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
                        <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
                    </UiFormItem>
                </UiForm>
            </ConfirmDialog>
            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={`https://aazovo.codefriend.in/${imageToView}`} alt="Company Logo Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
        </>
    );
};

const CompanyListSelected = () => {
  const { selectedCompanies, setSelectedCompanies } = useCompanyList();
  const dispatch = useAppDispatch();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = async () => {
    if (!selectedCompanies) return;
    setIsDeleting(true);
    try {
      const ids = selectedCompanies.map((d) => String(d.id));
      await dispatch(deleteAllcompanyAction({ ids: ids.join(",") })).unwrap();
      toast.push(<Notification title="Companies Deleted" type="success" />);
      dispatch(getCompanyAction());
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger">{error.message}</Notification>);
    } finally {
      setIsDeleting(false);
      setSelectedCompanies([]);
      setDeleteConfirmationOpen(false);
    }
  };
  if (selectedCompanies.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="container mx-auto flex items-center justify-between">
          <span>
            <span className="flex items-center gap-2"><TbChecks className="text-lg text-primary-600" /><span className="font-semibold">{selectedCompanies.length} Companies selected</span></span>
          </span>
          <div className="flex items-center">
            <Button size="sm" className="ltr:mr-3 rtl:ml-3" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50"} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title="Remove Companies" onClose={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to remove these companies? This action can't be undone.</p>
      </ConfirmDialog>
    </>
  );
};

const Company = () => {
  return (
    <CompanyListProvider>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <CompanyListTable />
          </div>
        </AdaptiveCard>
      </Container>
      <CompanyListSelected />
    </CompanyListProvider>
  );
};

export default Company;