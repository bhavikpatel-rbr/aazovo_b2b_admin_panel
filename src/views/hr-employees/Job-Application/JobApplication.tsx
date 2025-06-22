// src/views/hiring/JobApplicationListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from 'dayjs';
import type { MouseEvent } from 'react'
import * as XLSX from 'xlsx'; // For export functionality

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import { Input } from "@/components/ui/Input";
import { FormItem, FormContainer, Form } from "@/components/ui/Form";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import { Card, Drawer, Dropdown } from "@/components/ui";

// Icons
import {
  TbPencil, TbEye, TbCalendarEvent, TbPlus, TbChecks,
  TbSearch, TbFilter, TbUserCircle, TbBriefcase, TbLink, TbClipboardCopy,
  TbReload, TbMail, TbMailSpark, TbMailUp, TbMailSearch, TbMailCheck,
  TbMailHeart, TbMailX, TbUserShare, TbBrandWhatsapp, TbUser,
  TbUserCheck, TbCalendarTime, TbDownload, TbBell,
  TbTagStarred
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getDepartmentsAction,
  getJobApplicationsAction,
  submitExportReasonAction,
  // --- TODO: Ensure this action exists and is imported ---
  // getDepartmentsAction, // Example: import { getDepartmentsAction } from '@/reduxtool/master/middleware';
} from '@/reduxtool/master/middleware';
import { masterSelector } from "@/reduxtool/master/masterSlice";
// --- TODO: Ensure a selector for departments exists ---
// Example: import { departmentsSelector } from "@/reduxtool/master/masterSlice";


// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type { ApplicationStatus, JobApplicationItem as JobApplicationItemInternal, ApplicationFormData } from './types'; // Renamed to avoid conflict
import { applicationStatusOptions as appStatusOptionsConst } from './types';

// API Response Item Type (Snake Case)
interface JobApplicationApiItem {
    id: number;
    job_department_id: string | null;
    name: string;
    email: string;
    mobile_no: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    nationality?: string | null;
    work_experience: string | null;
    job_title: string | null;
    application_date: string | null; // e.g., "2025-05-29"
    status: string; // Ensure this string matches ApplicationStatus values or can be mapped
    resume_url?: string | null;
    application_link?: string | null; // Will be mapped to jobApplicationLink
    note?: string | null;
    job_id?: string | null;
    avatar?: string | null; // Assuming avatar might come from API or be handled locally
    // Add other snake_case fields from your API response
    [key: string]: any; // Allow other properties
}

// Department Item Type (from API/Redux)
interface DepartmentItem {
    id: string | number;
    name: string;
    // ... other department fields
}

let inreview = 'In Review'
// --- Constants ---
const applicationStatusColor: { [key in ApplicationStatus]?: string } = {
  'New': "bg-blue-500",    
  'In Review': "bg-yellow-500", // As per your request
  'Shortlisted': "bg-violet-500",
  'Hired': "bg-emerald-500",
  'Rejected': "bg-red-500",
  // 'Withdrawn': "bg-gray-500", // If 'Withdrawn' is still a status, add it here and in types.ts
};

const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

import { applicationFormSchema as editApplicationFormSchema } from './types';
type EditApplicationFormData = ApplicationFormData;


const ActionColumn = ({ 
  onView, onEdit, onDelete, onScheduleInterview, onAddJobLink, onDownloadResume 
}: {
  onView: () => void; onEdit: () => void; onDelete: () => void;
  onScheduleInterview: () => void; onAddJobLink: () => void; onDownloadResume: () => void;
}) => {
  const iconButtonClass = "text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-end">
      <Tooltip title="View Details"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400")} role="button" onClick={onView}><TbEye /></div></Tooltip>
      <Tooltip title="Edit Application"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400")} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add as Notification</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Mark as Active</span></Dropdown.Item>
        <Dropdown.Item onClick={onScheduleInterview} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Schedule Interview</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
        <Dropdown.Item onClick={onAddJobLink} className="flex items-center gap-2"><TbLink size={18} /> <span className="text-xs">Generate Job Link</span></Dropdown.Item>
        <Dropdown.Item onClick={onDownloadResume} className="flex items-center gap-2"><TbDownload size={18} /> <span className="text-xs">Download Resume</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbUserShare size={18} /> <span className="text-xs">Convert to Employee</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs"> Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

interface JobApplicationExportItem {
    id: string;
    status: string; // User-friendly status
    name: string;
    email: string;
    mobileNo: string;
    departmentName: string;
    jobTitle: string;
    workExperience: string;
    applicationDateFormatted: string; // Formatted date
    resumeUrl: string;
    jobApplicationLink: string;
    notes: string;
    jobId: string;
    // coverLetter?: string; // Optional, add if needed
}

// Headers for the CSV file
const CSV_HEADERS_JOB_APPLICATIONS = [
    "ID", "Status", "Applicant Name", "Email", "Mobile No",
    "Department", "Job Title", "Work Experience", "Application Date",
    "Resume URL", "Job Application Link", "Notes", "Job ID"
];

// Keys from JobApplicationExportItem, in the order they should appear in the CSV
const CSV_KEYS_JOB_APPLICATIONS_EXPORT: (keyof JobApplicationExportItem)[] = [
    'id', 'status', 'name', 'email', 'mobileNo',
    'departmentName', 'jobTitle', 'workExperience', 'applicationDateFormatted',
    'resumeUrl', 'jobApplicationLink', 'notes', 'jobId'
];

const ApplicationTable = (props: any) => <DataTable {...props} />;
// const ApplicationSearch = React.forwardRef<HTMLInputElement, any>((props, ref) => <DebouceInput {...props} ref={ref} />);
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ApplicationSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />)
);
ApplicationSearch.displayName = "ApplicationSearch";
const ApplicationTableTools = ({ onSearchChange, onFilterOpen, onClearFilters, onExport }: {
  onSearchChange: (query: string) => void;
  onFilterOpen: () => void;
  onClearFilters: () => void;
  onExport: () => void;
}) => (
  <div className="flex flex-col md:flex-row items-center gap-2 w-full">
    <div className="flex-grow w-full md:w-auto">
      <ApplicationSearch onInputChange={onSearchChange} placeholder="Search applications..." suffix={<TbSearch />} />
    </div>
    <div className="flex items-center gap-2 mt-2 md:mt-0">
      <Tooltip title="Clear Filters">
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
      </Tooltip>
      <Button icon={<TbFilter />} onClick={onFilterOpen} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbDownload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

const ApplicationSelected = ({ selectedApplications, onDeleteSelected, isDeleting }: { selectedApplications: JobApplicationItemInternal[]; onDeleteSelected: () => void; isDeleting: boolean }) => {
  const [open, setOpen] = useState(false); if (selectedApplications.length === 0) return null;
  return (<><StickyFooter stickyClass="-mx-4 sm:-mx-8 border-t px-8" className="py-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedApplications.length} selected</span></span><Button size="sm" variant="plain" className="text-red-500" onClick={() => setOpen(true)} loading={isDeleting}>Delete</Button></div></StickyFooter><ConfirmDialog type="danger" title="Delete Selected" isOpen={open} onClose={() => setOpen(false)} onConfirm={() => { onDeleteSelected(); setOpen(false); }} loading={isDeleting}><p>Are you sure you want to delete the selected {selectedApplications.length} application(s)?</p></ConfirmDialog></>);
};

// --- MODIFIED: ApplicationDetailDialog ---
const ApplicationDetailDialog = ({ 
  isOpen, 
  onClose, 
  application 
}: {
  isOpen: boolean;
  onClose: (e?: MouseEvent) => void;
  application: JobApplicationItemInternal | null;
}) => {
  if (!application) return null;

  const detailItemClass = "py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0";
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5";
  const valueClass = "text-sm text-gray-800 dark:text-gray-200";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      title={`Application Details: ${application.name}`}
      width={600}
    >
      <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        <div className={detailItemClass}>
          <p className={labelClass}>Applicant Name:</p>
          <p className={valueClass}>{application.name}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Email:</p>
          <p className={valueClass}>{application.email}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Mobile No:</p>
          <p className={valueClass}>{application.mobileNo || "N/A"}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Status:</p>
          <Tag className={`${applicationStatusColor[application.status]} text-white capitalize px-2 py-1 text-xs`}>
            {application.status.replace(/_/g, " ")}
          </Tag>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Department:</p>
          <p className={valueClass}>{application.departmentName || "N/A"}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Job Title:</p>
          <p className={valueClass}>{application.jobTitle || "N/A"}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Job ID:</p>
          <p className={valueClass}>{application.jobId || "N/A"}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Work Experience:</p>
          <p className={valueClass}>{application.workExperience || "N/A"}</p>
        </div>
        <div className={detailItemClass}>
          <p className={labelClass}>Application Date:</p>
          <p className={valueClass}>
            {application.applicationDate ? dayjs(application.applicationDate).format("MMM D, YYYY h:mm A") : "N/A"}
          </p>
        </div>
        {application.resumeUrl && (
          <div className={detailItemClass}>
            <p className={labelClass}>Resume URL:</p>
            <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
              {application.resumeUrl}
            </a>
          </div>
        )}
        {application.jobApplicationLink && (
          <div className={detailItemClass}>
            <p className={labelClass}>Job Application Link:</p>
            <a href={application.jobApplicationLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
              {application.jobApplicationLink}
            </a>
          </div>
        )}
        <div className={detailItemClass}>
          <p className={labelClass}>Notes:</p>
          <p className={valueClass} style={{ whiteSpace: 'pre-wrap' }}>{application.notes || "N/A"}</p>
        </div>
        {application.coverLetter && ( // Display if coverLetter is part of JobApplicationItemInternal and populated
          <div className={detailItemClass}>
            <p className={labelClass}>Cover Letter:</p>
            <p className={valueClass} style={{ whiteSpace: 'pre-wrap' }}>{application.coverLetter}</p>
          </div>
        )}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
// --- END MODIFIED: ApplicationDetailDialog ---


const ScheduleInterviewDialog = ({ isOpen, onClose, application }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title={`Schedule for ${application.name}`}><p>Form to schedule...</p><Button onClick={onClose}>Close</Button></Dialog> };
const AddJobLinkDialog = ({ isOpen, onClose, application, onLinkSubmit }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title="Add Job Link"><Input placeholder="Enter link" /><Button onClick={() => onLinkSubmit(application.id, 'dummy-link')}>Save</Button></Dialog> };


const JobApplicationListing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    jobApplicationsData = [],
    departmentsData = { data: [] } as { data: DepartmentItem[] }, // Ensure departmentsData.data exists
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [dialogIsOpen, setIsOpen] = useState(false);
  const openDialog = () => setIsOpen(true);
  const onDialogClose = (e?: MouseEvent) => setIsOpen(false);
  const onDialogOk = (e?: MouseEvent) => setIsOpen(false);

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1, pageSize: 10,
    sort: { order: "desc", key: "applicationDate" },
    query: "",
  });
  const [selectedApplications, setSelectedApplications] = useState<JobApplicationItemInternal[]>([]);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [addJobLinkOpen, setAddJobLinkOpen] = useState(false);
  const [currentItemForDialog, setCurrentItemForDialog] = useState<JobApplicationItemInternal | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JobApplicationItemInternal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplicationItemInternal | null>(null);
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatus: [], filterDepartment: [] });

  const editFormMethods = useForm<EditApplicationFormData>({ resolver: zodResolver(editApplicationFormSchema), mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  useEffect(() => {
    dispatch(getJobApplicationsAction());
     dispatch(getDepartmentsAction());
  }, [dispatch]);
  
  const transformedJobApplications = useMemo(() => {
    const apiData: JobApplicationApiItem[] = Array.isArray(jobApplicationsData?.data) ? jobApplicationsData.data : [];
    // Ensure departmentsData.data is an array before mapping
    const depts: DepartmentItem[] = Array.isArray(departmentsData?.data) ? departmentsData.data : [];
    
    const departmentMap = new Map(depts.map(dept => [String(dept.id), dept.name]));

    return apiData.map((apiItem): JobApplicationItemInternal => ({
      id: String(apiItem.id),
      status: (apiItem.status || 'new') as ApplicationStatus,
      name: apiItem.name,
      email: apiItem.email,
      mobileNo: apiItem.mobile_no || "",
      departmentId: apiItem.job_department_id || undefined,
      departmentName: apiItem.job_department_id ? departmentMap.get(String(apiItem.job_department_id)) || "Unknown Dept." : "N/A",
      jobTitle: apiItem.job_title || "",
      workExperience: apiItem.work_experience || "",
      applicationDate: apiItem.application_date ? new Date(apiItem.application_date) : new Date(),
      resumeUrl: apiItem.resume_url || "",
      jobApplicationLink: apiItem.application_link || "",
      notes: apiItem.note || "",
      jobId: apiItem.job_id || "",
      avatar: apiItem.avatar || undefined,
      coverLetter: apiItem.cover_letter || "", // Assuming cover_letter might come from API
    }));
  }, [jobApplicationsData?.data, departmentsData?.data]);


  const processedAndSortedData = useMemo(() => {
    let processedDataResult = cloneDeep(transformedJobApplications);

    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map(opt => opt.value as ApplicationStatus);
      console.log("selectedStatuses",selectedStatuses);
      console.log("processedDataResult",processedDataResult);
      
      processedDataResult = processedDataResult.filter(app => selectedStatuses.includes(app.status));
    }
    if (filterCriteria.filterDepartment && filterCriteria.filterDepartment.length > 0) {
      const selectedDeptNames = filterCriteria.filterDepartment.map(opt => opt.value.toLowerCase());
      processedDataResult = processedDataResult.filter(app => app.departmentName && selectedDeptNames.includes(app.departmentName.toLowerCase()));
    }
    
    if (tableData.query && tableData.query.trim() !== "") {
        const query = tableData.query.toLowerCase().trim();
        processedDataResult = processedDataResult.filter(a => {
            return Object.values(a).some(value => 
                String(value).toLowerCase().includes(query)
            );
        });
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedDataResult.sort((a, b) => {
        let aVal = a[key as keyof JobApplicationItemInternal] as any;
        let bVal = b[key as keyof JobApplicationItemInternal] as any;

        if (key === "applicationDate") {
            const d_a = aVal as Date | null;
            const d_b = bVal as Date | null;
            if (d_a === null && d_b === null) return 0;
            if (d_a === null) return order === 'asc' ? -1 : 1;
            if (d_b === null) return order === 'asc' ? 1 : -1;
            const timeA = d_a.getTime();
            const timeB = d_b.getTime();
            return order === "asc" ? timeA - timeB : timeB - timeA;
        }
        
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return order === "asc" ? -1 : 1;
        if (bVal === null) return order === "asc" ? 1 : -1;
        if (typeof aVal === "string" && typeof bVal === "string") return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return 0;
      });
    }
    return processedDataResult;
  }, [transformedJobApplications, tableData.query, tableData.sort, filterCriteria]);

  const { pageData, total } = useMemo(() => {
    const currentTotal = processedAndSortedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedAndSortedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal };
  }, [processedAndSortedData, tableData.pageIndex, tableData.pageSize]);

  const handleSetTableData = 
  useCallback((data: Partial<TableQueries>) => 
    setTableData(prev => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedApplications([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => {
    handleSetTableData({ query: query, pageIndex: 1 });
  }, [handleSetTableData]); 
  const handleRowSelect = useCallback((checked: boolean, row: JobApplicationItemInternal) => setSelectedApplications(prev => checked ? (prev.some(a => a.id === row.id) ? prev : [...prev, row]) : prev.filter(a => a.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<JobApplicationItemInternal>[]) => { const originals = currentRows.map(r => r.original); if (checked) { setSelectedApplications(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))] }); } else { const currentIds = new Set(originals.map(o => o.id)); setSelectedApplications(prev => prev.filter(i => !currentIds.has(i.id))); } }, []);

  const handleViewDetails = useCallback((item: JobApplicationItemInternal) => { setCurrentItemForDialog(item); setDetailViewOpen(true); }, []);
  const handleDeleteClick = useCallback((item: JobApplicationItemInternal) => { if (!item.id) return; setItemToDelete(item); setDeleteConfirmOpen(true); }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete?.id) return; setIsDeleting(true); setDeleteConfirmOpen(false);
    try {
      // await dispatch(deleteJobApplicationAction({ id: itemToDelete.id })).unwrap();
      dispatch(getJobApplicationsAction()); // Refetch
      toast.push(<Notification title="Deleted" type="success">{`Application for ${itemToDelete.name} deleted.`}</Notification>);
      setSelectedApplications(prev => prev.filter(a => a.id !== itemToDelete!.id));
    } catch (error: any) { toast.push(<Notification title="Delete Failed" type="danger">{error.message || "Could not delete."}</Notification>);
    } finally { setIsDeleting(false); setItemToDelete(null); }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedApplications.length === 0) return; setIsDeleting(true);
    const idsToDelete = selectedApplications.map(app => String(app.id));
    try {
      // await dispatch(deleteAllJobApplicationsAction({ ids: idsToDelete })).unwrap();
      dispatch(getJobApplicationsAction({})); // Refetch
      toast.push(<Notification title="Deleted" type="success">{`${idsToDelete.length} application(s) deleted.`}</Notification>);
      setSelectedApplications([]);
    } catch (error: any) { toast.push(<Notification title="Delete Failed" type="danger">{error.message || "Could not delete."}</Notification>);
    } finally { setIsDeleting(false); }
  }, [dispatch, selectedApplications]);

  const handleScheduleInterview = useCallback((item: JobApplicationItemInternal) => { setCurrentItemForDialog(item); setScheduleInterviewOpen(true); }, []);
  const handleAddJobLink = useCallback((item: JobApplicationItemInternal) => { setCurrentItemForDialog(item); setAddJobLinkOpen(true); }, []);
  
  // --- ADDED: handleDownloadResume ---
  const handleDownloadResume = useCallback((item: JobApplicationItemInternal) => {
    if (item.resumeUrl) {
      window.open(item.resumeUrl, '_blank');
      toast.push(<Notification title="Resume" type="info">Attempting to open/download resume...</Notification>);
    } else {
      toast.push(<Notification title="No Resume" type="warning">No resume URL found for this applicant.</Notification>);
    }
  }, []);

  const handleSubmitJobLink = useCallback(async (applicationId: string, link: string) => {
    setIsSubmittingDrawer(true);
    try {
      // await dispatch(updateJobApplicationLinkAction({ id: applicationId, link })).unwrap();
      dispatch(getJobApplicationsAction({})); // Refetch
      toast.push(<Notification title="Link Added" type="success">Job link updated.</Notification>); setAddJobLinkOpen(false);
    } catch (error: any) { toast.push(<Notification title="Update Failed" type="danger">{error.message || "Could not update."}</Notification>);
    } finally { setIsSubmittingDrawer(false); }
  }, [dispatch]);

  const openEditDrawer = useCallback((item: JobApplicationItemInternal) => {
    console.log(item, "item in openEditDrawer ");
    
   navigate(`/hr-employees/job-applications/add`, { state: item });
  }, [editFormMethods]); // Add departmentOptionsForFilter if used directly here

  const closeEditDrawer = useCallback(() => { setIsEditDrawerOpen(false); setEditingApplication(null); editFormMethods.reset(); }, [editFormMethods]);

  const onEditApplicationSubmit = useCallback(async (data: EditApplicationFormData) => {
    if (!editingApplication) return; setIsSubmittingDrawer(true);
    try {
      const payload = { ...editingApplication, ...data, id: editingApplication.id };
      // TODO: Transform data.department back to departmentId if API expects ID
      // For example, if data.department is a string (name), find its ID
      // const dept = departmentsData?.data.find(d => d.name === data.department);
      // payload.departmentId = dept ? dept.id : null;
      
      // await dispatch(editJobApplicationAction(payload)).unwrap();
      dispatch(getJobApplicationsAction({})); // Refetch
      toast.push(<Notification title="Updated" type="success">{`Application for ${data.name} updated.`}</Notification>);
      closeEditDrawer();
    } catch (error: any) { toast.push(<Notification title="Update Failed" type="danger">{error.message || "Could not update."}</Notification>);
    } finally { setIsSubmittingDrawer(false); }
  }, [dispatch, editingApplication, closeEditDrawer]); // Add departmentsData if used for mapping


  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => 

    { 
      console.log("data.filterStatus",data.filterStatus);
      
      
      setFilterCriteria({ filterStatus: data.filterStatus || [], 
      filterDepartment: data.filterDepartment || [] }); 
      handleSetTableData({ pageIndex: 1 }); 
      closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = 
  useCallback(() => { 
    const defaults = { filterStatus: [], filterDepartment: [] }; 
    filterFormMethods.reset(defaults); 
    setFilterCriteria(defaults); 
    handleSetTableData({ pageIndex: 1, query: "" });
  dispatch(getJobApplicationsAction())
  }, [filterFormMethods, handleSetTableData, dispatch]); // Added dispatch to dependencies
  const exportReasonSchema = z.object({
    reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
  });
  type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  const handleOpenExportReasonModal = () => {
      if (!processedAndSortedData || !processedAndSortedData.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return;
      }
      exportReasonFormMethods.reset({ reason: "" });
      setIsExportReasonModalOpen(true);
    };

    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const moduleName = "JobApplications";
        const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const fileName = `JobApplications_export_${timestamp}.csv`;
        try {
          await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
          toast.push(<Notification title="Export Reason Submitted" type="success" />);
           exportJobApplicationsToCsv(fileName, processedAndSortedData);
          
          toast.push(<Notification title="Data Exported" type="success">Job application data exported.</Notification>);
          setIsExportReasonModalOpen(false);
        } catch (error: any) {
          toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete export."} />);
        } finally {
          setIsSubmittingExportReason(false);
        }
      };

      function exportJobApplicationsToCsv(filename: string, rows: JobApplicationItemInternal[]): boolean {
        if (!rows || !rows.length) {
          return false;
        }

        const preparedRows: JobApplicationExportItem[] = rows.map((row) => ({
          id: row.id,
          status: row.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          name: row.name || "N/A",
          email: row.email || "N/A",
          mobileNo: row.mobileNo || "N/A",
          departmentName: row.departmentName || "N/A",
          jobTitle: row.jobTitle || "N/A",
          workExperience: row.workExperience || "N/A",
          applicationDateFormatted: row.applicationDate ? dayjs(row.applicationDate).format("YYYY-MM-DD HH:mm:ss") : "N/A",
          resumeUrl: row.resumeUrl || "N/A",
          jobApplicationLink: row.jobApplicationLink || "N/A",
          notes: row.notes || "N/A",
          jobId: row.jobId || "N/A",
        }));

        const separator = ",";
        const csvContent =
          CSV_HEADERS_JOB_APPLICATIONS.join(separator) +
          "\n" +
          preparedRows
            .map((rowItem) =>
              CSV_KEYS_JOB_APPLICATIONS_EXPORT.map((k) => {
                let cell = rowItem[k as keyof JobApplicationExportItem];
                if (cell === null || cell === undefined) {
                  cell = ""; 
                } else {
                  cell = String(cell).replace(/"/g, '""');
                  if (String(cell).search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`;
                  }
                }
                return cell;
              }).join(separator)
            )
            .join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); 
        const link = document.createElement("a");

        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return true;
        }
        toast.push(<Notification title="Export Failed" type="danger">Your browser does not support this feature.</Notification>);
        return false;
      }

  const columns: ColumnDef<JobApplicationItemInternal>[] = useMemo(() => [
    { header: "Applicant", accessorKey: "name", cell: props => <div className="flex items-center"><Avatar size={28} shape="circle" src={props.row.original.avatar} icon={<TbUserCircle />}>{!props.row.original.avatar && props.row.original.name ? props.row.original.name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2"><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500">{props.row.original.email}</div></div></div> },
    { header: "Status", accessorKey: "status", width: 120, cell: props => <Tag className={`${applicationStatusColor[props.row.original.status]} text-white capitalize px-2 py-1 text-xs`}>{props.row.original.status}</Tag> },
    { header: "Mobile", accessorKey: "mobileNo", width: 140, cell: props => props.row.original.mobileNo || "-" },
    { header: "Department", accessorKey: "departmentName", width: 160, cell: props => props.row.original.departmentName || "-" },
    { header: "Job Title", accessorKey: "jobTitle", width: 200, cell: props => props.row.original.jobTitle || "N/A" },
    { header: "Experience", accessorKey: "workExperience", width: 150, cell: props => props.row.original.workExperience || "N/A" },
    { header: "Applied Date", 
      accessorKey: "applicationDate", 
      width: 160, 
      cell: (props) => {
          const { updated_at, updated_by_user, updated_by_role } =
            props.row.original.applicationDate ;
          const formattedDate = props.row.original.applicationDate 
            ? `${new Date(props.row.original.applicationDate).getDate()} ${new Date(
                props.row.original.applicationDate 
              ).toLocaleString("en-US", { month: "short" })} ${new Date(
                props.row.original.applicationDate 
              ).getFullYear()}, ${new Date(props.row.original.applicationDate).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";
          return (
            <div className="text-xs">
             
              <span>{formattedDate}</span>
            </div>
          );
        }
      },
      // cell: props => props.row.original.applicationDate ? dayjs(props.row.original.applicationDate).format("MMM D, YYYY h:mm A") : "-" },

    { 
      header: "Action", id: "action", width: 130, meta: { HeaderClass: "text-center" }, 
      cell: props => (
        <ActionColumn 
          onView={() => handleViewDetails(props.row.original)} 
          onEdit={() => openEditDrawer(props.row.original)} // --- MODIFIED: onEdit now opens drawer ---
          onDelete={() => handleDeleteClick(props.row.original)} 
          onScheduleInterview={() => handleScheduleInterview(props.row.original)} 
          onAddJobLink={() => handleAddJobLink(props.row.original)}
          onDownloadResume={() => handleDownloadResume(props.row.original)} // --- ADDED: onDownloadResume ---
        />
      ) 
    },
  ], [navigate, handleViewDetails, handleDeleteClick, handleScheduleInterview, handleAddJobLink, openEditDrawer, handleDownloadResume]); // Added openEditDrawer & handleDownloadResume

  const departmentOptionsForFilter = useMemo(() => {
    // Ensure departmentsData.data is an array before mapping
    const depts: DepartmentItem[] = Array.isArray(departmentsData?.data) ? departmentsData.data : [];
    return Array.from(new Set(depts.map(dept => dept.name)))
      .filter(name => !!name)
      .map(name => ({ value: name, label: name }));
  }, [departmentsData?.data]);

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        {/* Header and Action Buttons */}
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Job Applications</h5>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button icon={<TbCalendarTime />} className="w-full sm:w-auto">View Schedule</Button>
            <Button icon={<TbUserCheck />} className="w-full sm:w-auto">View Shortlisted</Button>
            <Button icon={<TbBriefcase />} onClick={() => navigate('/hr-employees/job-post')} className="w-full sm:w-auto">Add New Job Post</Button>
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/job-applications/add')} className="w-full sm:w-auto">Add New Application</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMail size={24} /></div>
                <div><h6 className="text-blue-500">{jobApplicationsData?.counts?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-emerald-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbMailSpark size={24} /></div>
                <div><h6 className="text-emerald-500">{jobApplicationsData?.counts?.new || 0}</h6><span className="font-semibold text-xs">New</span></div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbMailUp size={24} /></div>
                <div><h6 className="text-pink-500">{jobApplicationsData?.counts?.today || 0}</h6><span className="font-semibold text-xs">Today</span></div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbMailSearch size={24} /></div>
                <div><h6 className="text-orange-500">{jobApplicationsData?.counts?.in_review || 0}</h6><span className="font-semibold text-xs">In Review</span></div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbMailCheck size={24} /></div>
                <div><h6 className="text-violet-500">{jobApplicationsData?.counts?.shortlisted || 0}</h6><span className="font-semibold text-xs">Shortlisted</span></div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" >
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMailHeart size={24} /></div>
                <div><h6 className="text-green-500">{jobApplicationsData?.counts?.hired || 0}</h6><span className="font-semibold text-xs">Hired</span></div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMailX size={24} /></div>
                <div><h6 className="text-red-500">{jobApplicationsData?.counts?.rejected || 0}</h6><span className="font-semibold text-xs">Rejected</span></div>
            </Card>
        </div>

        {/* Table Tools (Search, Filter, Export) */}
        <div className="mb-4">
          <ApplicationTableTools
            onSearchChange={handleSearchChange}
            onFilterOpen={openFilterDrawer}
            onClearFilters={onClearFilters}
            onExport={handleOpenExportReasonModal}
          />
        </div>

        {/* Data Table */}
        <div className="flex-grow overflow-auto">
          <ApplicationTable
            columns={columns}
            noData={pageData.length === 0}
            data={pageData} 
            loading={masterLoadingStatus === "loading"}
            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>

      {/* Selected Footer & Dialogs */}
      <ApplicationSelected selectedApplications={selectedApplications} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <ApplicationDetailDialog isOpen={detailViewOpen} onClose={() => setDetailViewOpen(false)} application={currentItemForDialog} />
      <ScheduleInterviewDialog isOpen={scheduleInterviewOpen} onClose={() => setScheduleInterviewOpen(false)} application={currentItemForDialog} />
      <AddJobLinkDialog isOpen={addJobLinkOpen} onClose={() => setAddJobLinkOpen(false)} application={currentItemForDialog} onLinkSubmit={handleSubmitJobLink} />
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title="Delete Application" onClose={() => setDeleteConfirmOpen(false)} onConfirm={confirmDelete} loading={isDeleting}><p>Are you sure you want to delete the application for <strong>{itemToDelete?.name}</strong>?</p></ConfirmDialog>
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form
          id="exportDomainsReasonForm" // Keep id for form attribute if used, or remove if not.
          onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
      {/* Edit Application Drawer */}
      <Drawer title="Edit Job Application" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={600} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmittingDrawer}>Cancel</Button><Button size="sm" variant="solid" form="editAppForm" type="submit" loading={isSubmittingDrawer} disabled={!editFormMethods.formState.isValid || isSubmittingDrawer}>Save</Button></div>}>
        {editingApplication && (
          <Form id="editAppForm" onSubmit={editFormMethods.handleSubmit(onEditApplicationSubmit)} className="flex flex-col gap-4 p-4">
            <FormItem label="Applicant Name*" error={editFormMethods.formState.errors.name?.message}><Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Email*" error={editFormMethods.formState.errors.email?.message}><Controller name="email" control={editFormMethods.control} render={({ field }) => <Input {...field} type="email" />} /></FormItem>
            <FormItem label="Mobile No" error={editFormMethods.formState.errors.mobileNo?.message}><Controller name="mobileNo" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Department*" error={editFormMethods.formState.errors.department?.message}>
              <Controller 
                name="department" 
                control={editFormMethods.control} 
                render={({ field }) => (
                  <Select 
                    options={departmentOptionsForFilter} 
                    value={departmentOptionsForFilter.find(o => o.value === field.value) || null} // Ensure value is object or null
                    onChange={opt => field.onChange(opt?.value)} // Pass only the value string
                  />
                )} 
              />
            </FormItem>
            <FormItem label="Job Title" error={editFormMethods.formState.errors.jobTitle?.message}><Controller name="jobTitle" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Job ID" error={editFormMethods.formState.errors.jobId?.message}><Controller name="jobId" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Work Experience*" error={editFormMethods.formState.errors.workExperience?.message}><Controller name="workExperience" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Application Date*" error={editFormMethods.formState.errors.applicationDate?.message as string}><Controller name="applicationDate" control={editFormMethods.control} render={({ field }) => <DatePicker {...field} value={field.value ? new Date(field.value) : null} />} /></FormItem>
            <FormItem label="Status*" error={editFormMethods.formState.errors.status?.message}><Controller name="status" control={editFormMethods.control} render={({ field }) => <Select options={appStatusOptionsConst} value={appStatusOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Resume URL" error={editFormMethods.formState.errors.resumeUrl?.message}><Controller name="resumeUrl" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Job App Link" error={editFormMethods.formState.errors.jobApplicationLink?.message}><Controller name="jobApplicationLink" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Notes" error={editFormMethods.formState.errors.notes?.message}><Controller name="notes" control={editFormMethods.control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
            <FormItem label="Cover Letter" error={editFormMethods.formState.errors.coverLetter?.message}><Controller name="coverLetter" control={editFormMethods.control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
          </Form>
        )}
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} 
      onClose={closeFilterDrawer} 
      onRequestClose={closeFilterDrawer}
      footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterAppForm" type="submit">Apply</Button></div>}>
        <Form id="filterAppForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 ">
          <FormItem label="Status"><Controller name="filterStatus" 
          control={filterFormMethods.control} 
          render={({ field }) => <Select isMulti options={appStatusOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
          <FormItem label="Department"><Controller name="filterDepartment" control={filterFormMethods.control} render={({ field }) => <Select isMulti options={departmentOptionsForFilter} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
        </Form>
      </Drawer>
      
      <Dialog isOpen={dialogIsOpen} onClose={onDialogClose} onRequestClose={onDialogClose}>
        <h5 className="mb-4">Generate Job Application Link</h5>
        <p>Link Goes Here!</p>
        <div className="text-right mt-6 flex items-center justify-end gap-4">
          <Button className="ltr:mr-2 rtl:ml-2" variant="plain" onClick={onDialogClose}>Cancel</Button>
          <Button variant="solid" onClick={onDialogOk}>Generate New Add Link</Button>
          <Tooltip title="Copy Link (not implemented)"><TbClipboardCopy size={25} className="text-gray-500 hover:text-blue-600 cursor-pointer" /></Tooltip>
        </div>
      </Dialog>
    </Container>
  );
};
export default JobApplicationListing;