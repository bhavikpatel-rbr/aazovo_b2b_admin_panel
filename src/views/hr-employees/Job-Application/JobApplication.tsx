// src/views/hiring/JobApplicationListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames"; // Ensure this is imported if not global
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from 'dayjs';
import type { MouseEvent } from 'react'

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
import { FormItem, FormContainer, Form } from "@/components/ui/Form"; // Keep Form if Edit drawer uses it
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import { Card, Drawer, Dropdown } from "@/components/ui";

// Icons
import {
  TbPencil, TbTrash, TbEye, TbCalendarEvent, TbPlus, TbChecks,
  TbSearch, TbFilter, TbUserCircle, TbBriefcase, TbLink, TbClipboardCopy,
  TbReload,
  TbMail,
  TbCalendarWeek,
  TbMailSpark,
  TbMailUp,
  TbMailSearch,
  TbMailCheck,
  TbMailHeart,
  TbMailX,
  TbUserShare,
  TbBrandWhatsapp,
  TbUser,
  TbUserCheck,
  TbCalendarTime,
  TbDownload,
  TbBell
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux"; // Import useSelector and shallowEqual
import {
  getJobApplicationsAction,
  // Import other actions like add, edit, delete if they exist for applications
  // addJobApplicationAction,
  // editJobApplicationAction,
  // deleteJobApplicationAction,
} from '@/reduxtool/master/middleware';
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Assuming applications are part of masterSlice

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type { ApplicationStatus, JobApplicationItem, ApplicationFormData } from './types';
import { applicationStatusOptions as appStatusOptionsConst } from './types';

// --- Constants ---
const applicationStatusColor: Record<ApplicationStatus, string> = {
  new: "bg-blue-500", screening: "bg-cyan-500", interviewing: "bg-indigo-500",
  offer_extended: "bg-purple-500", hired: "bg-emerald-500",
  rejected: "bg-red-500", withdrawn: "bg-gray-500",
};

// --- Zod Schemas for Drawers ---
const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

import { applicationFormSchema as editApplicationFormSchema } from './types';
type EditApplicationFormData = ApplicationFormData;

// --- Reusable ActionColumn Component (No change) ---
const ActionColumn = ({ onView, onEdit, onDelete, onScheduleInterview, onAddJobLink }: {
  onView: () => void; onEdit: () => void; onDelete: () => void;
  onScheduleInterview: () => void; onAddJobLink: () => void;
}) => {
  const iconButtonClass = "text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-end">
      <Tooltip title="View Details"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400")} role="button" onClick={onView}><TbEye /></div></Tooltip>
      <Tooltip title="Edit Application"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400")} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      {/* <Tooltip title="Delete Application"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400")} role="button" onClick={onDelete}><TbTrash /></div></Tooltip> */}
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Add to Task</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add as Notification</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs"> Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span></Dropdown.Item>
        <Dropdown.Item onClick={onAddJobLink} className="flex items-center gap-2"><TbLink size={18} /> <span className="text-xs">Generate Job Link</span></Dropdown.Item>
        <Dropdown.Item onClick={onAddJobLink} className="flex items-center gap-2"><TbDownload size={18} /> <span className="text-xs">Download Resume</span></Dropdown.Item>
        <Dropdown.Item onClick={onScheduleInterview} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Schedule Interview</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbUserShare size={18} /> <span className="text-xs">Convert to Employee</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

// --- Table, Search, Tools, Selected Footer Components (No change) ---
const ApplicationTable = (props: any) => <DataTable {...props} />;
const ApplicationSearch = React.forwardRef<HTMLInputElement, any>((props, ref) => <DebouceInput {...props} ref={ref} />);
ApplicationSearch.displayName = "ApplicationSearch";
const ApplicationTableTools = ({ onSearchChange, onFilterOpen, onClearFilters }: { onSearchChange: (query: string) => void; onFilterOpen: () => void; onClearFilters: () => void; }) => (
  <div className="flex flex-col md:flex-row items-center gap-1 w-full">
    <div className="flex-grow w-full md:w-auto"><ApplicationSearch onInputChange={onSearchChange} placeholder="Search applications..." suffix={<TbSearch />} /></div>
    <Tooltip title="Clear Filters">
      <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
    </Tooltip>
    <Button icon={<TbFilter />} onClick={onFilterOpen} className="w-full md:w-auto">Filter</Button>
  </div>
);
const ApplicationSelected = ({ selectedApplications, onDeleteSelected, isDeleting }: { selectedApplications: JobApplicationItem[]; onDeleteSelected: () => void; isDeleting: boolean }) => {
  const [open, setOpen] = useState(false); if (selectedApplications.length === 0) return null;
  return (<><StickyFooter stickyClass="-mx-4 sm:-mx-8 border-t px-8" className="py-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedApplications.length} selected</span></span><Button size="sm" variant="plain" className="text-red-500" onClick={() => setOpen(true)} loading={isDeleting}>Delete</Button></div></StickyFooter><ConfirmDialog type="danger" title="Delete Selected" isOpen={open} onClose={() => setOpen(false)} onConfirm={() => { onDeleteSelected(); setOpen(false); }} loading={isDeleting}><p>Are you sure you want to delete the selected {selectedApplications.length} application(s)?</p></ConfirmDialog></>);
};

// --- Dialog Components (No change) ---
const ApplicationDetailDialog = ({ isOpen, onClose, application }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title={`Details: ${application.name}`}><p>ID: {application.id}</p>{/* ... more details ... */}<Button onClick={onClose}>Close</Button></Dialog> };
const ScheduleInterviewDialog = ({ isOpen, onClose, application }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title={`Schedule for ${application.name}`}><p>Form to schedule...</p><Button onClick={onClose}>Close</Button></Dialog> };
const AddJobLinkDialog = ({ isOpen, onClose, application, onLinkSubmit }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title="Add Job Link"><Input placeholder="Enter link" /><Button onClick={() => onLinkSubmit(application.id, 'dummy-link')}>Save</Button></Dialog> };


// --- Main JobApplicationListing Component ---
const JobApplicationListing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // --- Get data from Redux store ---
  const {
    jobApplicationsData = [], // Assuming this key exists in your masterSlice
    status: masterLoadingStatus = "idle",
    // error: masterError = null, // If you handle errors in slice
  } = useSelector(masterSelector, shallowEqual);

  const [dialogIsOpen, setIsOpen] = useState(false);
  const openDialog = () => setIsOpen(true);
  const onDialogClose = (e: MouseEvent) => setIsOpen(false);
  const onDialogOk = (e: MouseEvent) => setIsOpen(false);

  // isLoading now primarily reflects the Redux store's masterLoadingStatus
  // const [isLoading, setIsLoading] = useState(false); // Can be removed or used for local loading states

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "applicationDate" }, // Default sort
    query: "",
  });
  const [selectedApplications, setSelectedApplications] = useState<JobApplicationItem[]>([]);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [addJobLinkOpen, setAddJobLinkOpen] = useState(false);
  const [currentItemForDialog, setCurrentItemForDialog] = useState<JobApplicationItem | null>(null);

  // Deletion states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JobApplicationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // For delete operations

  // Edit & Filter Drawer States
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplicationItem | null>(null);
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false); // For add/edit drawer submissions
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatus: [], filterDepartment: [] });

  const editFormMethods = useForm<EditApplicationFormData>({ resolver: zodResolver(editApplicationFormSchema), mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  // --- Fetch Initial Data ---
  useEffect(() => {
    // Fetch all applications once on mount, or an initial set if API supports it without detailed params
    // If your API for getJobApplicationsAction requires pagination/sort params even for an initial load,
    // you might pass default params here or adjust the action.
    // For simplicity, like JobPostsListing, let's assume it fetches a base list.
    dispatch(getJobApplicationsAction({})); // Pass empty object or default params if needed by action
  }, [dispatch]);

  // --- Client-Side Data Processing (Filtering, Sorting, Pagination) ---
  const { pageData, total } = useMemo(() => {
    const sourceData: JobApplicationItem[] = Array.isArray(jobApplicationsData) ? jobApplicationsData : [];
    let processedData = cloneDeep(sourceData);

    // Apply filters
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map(opt => opt.value as ApplicationStatus);
      processedData = processedData.filter(app => selectedStatuses.includes(app.status));
    }
    if (filterCriteria.filterDepartment && filterCriteria.filterDepartment.length > 0) {
      const selectedDepts = filterCriteria.filterDepartment.map(opt => opt.value.toLowerCase());
      processedData = processedData.filter(app => selectedDepts.includes(app.department.toLowerCase()));
    }

    // Apply search query
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(a =>
        a.id.toLowerCase().includes(query) ||
        a.status.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        (a.mobileNo?.toLowerCase().includes(query) ?? false) ||
        a.department.toLowerCase().includes(query) ||
        (a.jobTitle?.toLowerCase().includes(query) ?? false) ||
        (a.workExperience?.toLowerCase().includes(query) ?? false) // Ensure workExperience exists
      );
    }

    // Apply sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof JobApplicationItem] as any;
        let bVal = b[key as keyof JobApplicationItem] as any;

        if (key === "applicationDate") {
          // Ensure dates are valid before getTime()
          const dateA = aVal ? new Date(aVal).getTime() : 0;
          const dateB = bVal ? new Date(bVal).getTime() : 0;
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return order === 'asc' ? -1 : 1;
          if (isNaN(dateB)) return order === 'asc' ? 1 : -1;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        // Generic sort for other types
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return order === "asc" ? -1 : 1;
        if (bVal === null) return order === "asc" ? 1 : -1;
        if (typeof aVal === "string" && typeof bVal === "string") return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return 0;
      });
    }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: currentTotal };
  }, [jobApplicationsData, tableData, filterCriteria]);

  // --- Table Interaction Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedApplications([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: JobApplicationItem) => setSelectedApplications(prev => checked ? (prev.some(a => a.id === row.id) ? prev : [...prev, row]) : prev.filter(a => a.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<JobApplicationItem>[]) => { const originals = currentRows.map(r => r.original); if (checked) { setSelectedApplications(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))] }); } else { const currentIds = new Set(originals.map(o => o.id)); setSelectedApplications(prev => prev.filter(i => !currentIds.has(i.id))); } }, []);

  // --- Action Handlers ---
  const handleViewDetails = useCallback((item: JobApplicationItem) => { setCurrentItemForDialog(item); setDetailViewOpen(true); }, []);

  const handleDeleteClick = useCallback((item: JobApplicationItem) => {
    if (!item.id) return;
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setDeleteConfirmOpen(false);
    try {
      // TODO: Dispatch deleteJobApplicationAction if it exists
      // await dispatch(deleteJobApplicationAction({ id: itemToDelete.id })).unwrap();
      // For now, optimistic UI update if no delete action:
      // setApplications(current => current.filter(a => a.id !== itemToDelete.id)); // No direct setApplications
      dispatch(getJobApplicationsAction({})); // Refetch after delete
      toast.push(<Notification title="Deleted" type="success">{`Application for ${itemToDelete.name} deleted.`}</Notification>);
      setSelectedApplications(prev => prev.filter(a => a.id !== itemToDelete!.id));
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{error.message || "Could not delete application."}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedApplications.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedApplications.map(app => String(app.id));
    try {
      // TODO: Dispatch deleteAllJobApplicationsAction if it exists
      // await dispatch(deleteAllJobApplicationsAction({ ids: idsToDelete.join(',') })).unwrap();
      // For now, optimistic UI update if no delete action:
      dispatch(getJobApplicationsAction({})); // Refetch after delete
      toast.push(<Notification title="Deleted" type="success">{`${idsToDelete.length} application(s) deleted.`}</Notification>);
      setSelectedApplications([]);
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{error.message || "Could not delete selected applications."}</Notification>);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedApplications]);

  const handleScheduleInterview = useCallback((item: JobApplicationItem) => { setCurrentItemForDialog(item); setScheduleInterviewOpen(true); }, []);
  const handleAddJobLink = useCallback((item: JobApplicationItem) => { setCurrentItemForDialog(item); setAddJobLinkOpen(true); }, []);
  const handleSubmitJobLink = useCallback(async (applicationId: string, link: string) => {
    setIsSubmittingDrawer(true); // Use a generic submitting state or a specific one
    try {
      // TODO: Dispatch an action to update the job link
      // await dispatch(updateJobApplicationLinkAction({ id: applicationId, link })).unwrap();
      dispatch(getJobApplicationsAction({})); // Refetch
      toast.push(<Notification title="Link Added" type="success">Job link updated.</Notification>);
      setAddJobLinkOpen(false); // Close dialog on success
    } catch (error: any) {
      toast.push(<Notification title="Update Failed" type="danger">{error.message || "Could not update link."}</Notification>);
    } finally {
      setIsSubmittingDrawer(false);
    }
  }, [dispatch]);

  const openEditDrawer = useCallback((item: JobApplicationItem) => {
    setEditingApplication(item);
    editFormMethods.reset({
      ...item,
      applicationDate: item.applicationDate ? new Date(item.applicationDate) : new Date(),
      mobileNo: item.mobileNo || "", resumeUrl: item.resumeUrl || "",
      coverLetter: item.coverLetter || "", notes: item.notes || "",
      jobApplicationLink: item.jobApplicationLink || "",
      // Ensure all fields from EditApplicationFormData are covered
    });
    setIsEditDrawerOpen(true);
  }, [editFormMethods]);
  const closeEditDrawer = useCallback(() => { setIsEditDrawerOpen(false); setEditingApplication(null); editFormMethods.reset(); }, [editFormMethods]);

  const onEditApplicationSubmit = useCallback(async (data: EditApplicationFormData) => {
    if (!editingApplication) return;
    setIsSubmittingDrawer(true);
    try {
      const payload = { ...editingApplication, ...data, id: editingApplication.id };
      // TODO: Dispatch editJobApplicationAction if it exists
      // await dispatch(editJobApplicationAction(payload)).unwrap();
      dispatch(getJobApplicationsAction({})); // Refetch after edit
      toast.push(<Notification title="Updated" type="success">{`Application for ${data.name} updated.`}</Notification>);
      closeEditDrawer();
    } catch (error: any) {
      toast.push(<Notification title="Update Failed" type="danger">{error.message || "Could not update application."}</Notification>);
    } finally {
      setIsSubmittingDrawer(false);
    }
  }, [dispatch, editingApplication, closeEditDrawer]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [], filterDepartment: data.filterDepartment || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaults = { filterStatus: [], filterDepartment: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const columns: ColumnDef<JobApplicationItem>[] = useMemo(() => [
    { header: "Status", accessorKey: "status", width: 120, cell: props => <Tag className={`${applicationStatusColor[props.row.original.status]} text-white capitalize px-2 py-1 text-xs`}>{props.row.original.status.replace(/_/g, " ")}</Tag> },
    { header: "Applicant", accessorKey: "name", cell: props => <div className="flex items-center"><Avatar size={28} shape="circle" src={props.row.original.avatar} icon={<TbUserCircle />}>{!props.row.original.avatar && props.row.original.name ? props.row.original.name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2"><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500">{props.row.original.email}</div></div></div> },
    { header: "Mobile", accessorKey: "mobileNo", width: 140, cell: props => props.row.original.mobile_no || "-" },
    { header: "Department", accessorKey: "department", width: 160, cell: props => props.row.original.job_department_id || "-" },
    { header: "Job Title", accessorKey: "jobTitle", width: 200, cell: props => props.row.original.job_title || "N/A" },
    { header: "Experience", accessorKey: "workExperience", width: 150, cell: props => props.row.original.work_experience || "N/A" },
    { header: "Applied Date", accessorKey: "applicationDate", width: 160, cell: props => props.row.original.application_date ? dayjs(props.row.original.application_date).format("MMM D, YYYY h:mm A") : "-" },
    { header: "Action", id: "action", width: 130, meta: { HeaderClass: "text-center" }, cell: props => <ActionColumn onView={() => handleViewDetails(props.row.original)} onEdit={() => navigate(`/hr-employees/job-applications/edit/${props.row.original.id}`)} onDelete={() => handleDeleteClick(props.row.original)} onScheduleInterview={() => handleScheduleInterview(props.row.original)} onAddJobLink={() => handleAddJobLink(props.row.original)} /> },
  ], [navigate, handleViewDetails, handleDeleteClick, handleScheduleInterview, handleAddJobLink]); // Removed openEditDrawer if not used here

  const departmentOptionsForFilter = useMemo(() => {
    // Now derives from the full jobApplicationsData from Redux
    const sourceData: JobApplicationItem[] = Array.isArray(jobApplicationsData) ? jobApplicationsData : [];
    return Array.from(new Set(sourceData.map(app => app.department)))
      .filter(dept => dept)
      .map(dept => ({ value: dept, label: dept }));
  }, [jobApplicationsData]);

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Job Applications</h5>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button icon={<TbCalendarTime />}  className="w-full sm:w-auto">View Schedule</Button>
            <Button icon={<TbUserCheck />}  className="w-full sm:w-auto">View Shortlisted</Button>
            <Button icon={<TbBriefcase />} onClick={openDialog} className="w-full sm:w-auto">Add New Job Post</Button>
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/job-applications/add')} className="w-full sm:w-auto">Add New Application</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-4 gap-2">
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
              <TbMail size={24} />
            </div>
            <div>
              <h6 className="text-blue-500">879</h6>
              <span className="font-semibold text-xs">Total</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-emerald-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500">
              <TbMailSpark size={24} />
            </div>
            <div>
              <h6 className="text-emerald-500">34</h6>
              <span className="font-semibold text-xs">New</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
              <TbMailUp size={24} />
            </div>
            <div>
              <h6 className="text-pink-500">3</h6>
              <span className="font-semibold text-xs">Today</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
              <TbMailSearch size={24} />
            </div>
            <div>
              <h6 className="text-orange-500">345</h6>
              <span className="font-semibold text-xs">In Review</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
              <TbMailCheck size={24} />
            </div>
            <div>
              <h6 className="text-violet-500">23</h6>
              <span className="font-semibold text-xs">Shortlisted</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
              <TbMailHeart size={24} />
            </div>
            <div>
              <h6 className="text-green-500">18</h6>
              <span className="font-semibold text-xs">Hired</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
              <TbMailX size={24} />
            </div>
            <div>
              <h6 className="text-red-500">78</h6>
              <span className="font-semibold text-xs">Rejected</span>
            </div>
          </Card>
        </div>
        <div className="mb-4"><ApplicationTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilterOpen={openFilterDrawer} /></div>
        <div className="flex-grow overflow-auto">
          <ApplicationTable
            columns={columns}
            data={pageData}
            loading={masterLoadingStatus === "loading" || masterLoadingStatus === "loading"} // Show loading if idle (initial) or loading
            pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
            selectedApplications={selectedApplications} // Corrected prop name
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>
      <ApplicationSelected selectedApplications={selectedApplications} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <ApplicationDetailDialog isOpen={detailViewOpen} onClose={() => setDetailViewOpen(false)} application={currentItemForDialog} />
      <ScheduleInterviewDialog isOpen={scheduleInterviewOpen} onClose={() => setScheduleInterviewOpen(false)} application={currentItemForDialog} />
      <AddJobLinkDialog isOpen={addJobLinkOpen} onClose={() => setAddJobLinkOpen(false)} application={currentItemForDialog} onLinkSubmit={handleSubmitJobLink} />
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title="Delete Application" onClose={() => setDeleteConfirmOpen(false)} onConfirm={confirmDelete} loading={isDeleting}><p>Are you sure you want to delete the application for <strong>{itemToDelete?.name}</strong>?</p></ConfirmDialog>

      {/* Edit Application Drawer */}
      <Drawer title="Edit Job Application" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={600} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmittingDrawer}>Cancel</Button><Button size="sm" variant="solid" form="editAppForm" type="submit" loading={isSubmittingDrawer} disabled={!editFormMethods.formState.isValid || isSubmittingDrawer}>Save</Button></div>}>
        {editingApplication && (
          <Form id="editAppForm" onSubmit={editFormMethods.handleSubmit(onEditApplicationSubmit)} className="flex flex-col gap-4 p-4">
            <FormItem label="Applicant Name*" error={editFormMethods.formState.errors.name?.message}><Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Email*" error={editFormMethods.formState.errors.email?.message}><Controller name="email" control={editFormMethods.control} render={({ field }) => <Input {...field} type="email" />} /></FormItem>
            <FormItem label="Mobile No" error={editFormMethods.formState.errors.mobileNo?.message}><Controller name="mobileNo" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Department*" error={editFormMethods.formState.errors.department?.message}><Controller name="department" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
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

      {/* Filter Drawer */}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterAppForm" type="submit">Apply</Button></div>}>
        <Form id="filterAppForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 p-4">
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <Select isMulti options={appStatusOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
          <FormItem label="Department"><Controller name="filterDepartment" control={filterFormMethods.control} render={({ field }) => <Select isMulti options={departmentOptionsForFilter} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
        </Form>
      </Drawer>

      <Dialog
        isOpen={dialogIsOpen}
        onClose={onDialogClose}
        onRequestClose={onDialogClose}
      >
        <h5 className="mb-4">Job application Link</h5>
        <p>
          Link Goes Here!
        </p>
        <div className="text-right mt-6 flex items-center justify-end gap-4">
          <Button
            className="ltr:mr-2 rtl:ml-2"
            variant="plain"
            onClick={onDialogClose}
          >
            Cancel
          </Button>
          <Button variant="solid" onClick={onDialogOk}>
            Generate New Add Link
          </Button>
          <TbClipboardCopy size={25} className="text-gray-500 hover:text-blue-600 cursor-pointer" />
        </div>
      </Dialog>
    </Container>
  );
};
export default JobApplicationListing;