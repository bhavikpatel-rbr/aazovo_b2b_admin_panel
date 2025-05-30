// src/views/hiring/JobApplicationListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from 'dayjs'; // For date formatting
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
import { FormItem, FormContainer, Form } from "@/components/ui/Form";
import DatePicker from "@/components/ui/DatePicker";
import { HiOutlineCalendar } from "react-icons/hi";
import Select from "@/components/ui/Select";
import { Drawer, Dropdown } from "@/components/ui";

// Icons
import {
  TbPencil, TbTrash, TbEye, TbCalendarEvent, TbPlus, TbChecks,
  TbSearch, TbFilter, TbUserCircle, TbBriefcase, TbLink, TbClipboardCopy,
  TbReload
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Types (Import from shared types file)
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type { ApplicationStatus, JobApplicationItem, ApplicationFormData } from './types'; // Assuming types.ts
import { applicationStatusOptions as appStatusOptionsConst } from './types'; // For filter/edit drawer

// --- Constants (moved some to types.ts) ---
const applicationStatusColor: Record<ApplicationStatus, string> = {
  new: "bg-blue-500", screening: "bg-cyan-500", interviewing: "bg-indigo-500",
  offer_extended: "bg-purple-500", hired: "bg-emerald-500",
  rejected: "bg-red-500", withdrawn: "bg-gray-500",
};

const initialDummyApplications: JobApplicationItem[] = [ // Keep this for now, replace with API fetch
  { id: "APP001", status: "new", jobId: "JP001", jobTitle: "Senior Frontend Engineer", department: "Engineering", name: "Alice Applicant", email: "alice.a@email.com", mobileNo: "+1-555-2001", workExperience: "6 Years React", applicationDate: new Date(2023, 10, 6, 9, 0), avatar: "/img/avatars/thumb-1.jpg" },
  { id: "APP002", status: "screening", jobId: "JP002", jobTitle: "Marketing Content Writer", department: "Marketing", name: "Bob Candidate", email: "bob.c@mail.net", mobileNo: "+44-20-1111-2222", workExperience: "3 Years SEO Writing", applicationDate: new Date(2023, 10, 6, 10, 30), avatar: "/img/avatars/thumb-2.jpg" },
  { id: "APP003", status: "interviewing", jobId: "JP006", jobTitle: "Data Scientist", department: "Data Science & Analytics", name: "Charlie Davis", email: "charlie.d@web.com", mobileNo: null, workExperience: "4 Years Python/ML", applicationDate: new Date(2023, 10, 7, 8, 15), notes: "Strong portfolio, scheduled 1st round.", avatar: "/img/avatars/thumb-3.jpg" },
];

// --- Zod Schemas for Drawers (Filter & Edit) ---
const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // Consider adding date range filter here
  // dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// Edit form schema can be imported from types.ts or defined here if specific to edit
import { applicationFormSchema as editApplicationFormSchema } from './types';
type EditApplicationFormData = ApplicationFormData; // Alias if it's the same

// --- Reusable ActionColumn Component ---
const ActionColumn = ({ onView, onEdit, onDelete, onScheduleInterview, onAddJobLink }: {
  onView: () => void; onEdit: () => void; onDelete: () => void;
  onScheduleInterview: () => void; onAddJobLink: () => void;
}) => {
  const iconButtonClass = "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-end">
      <Tooltip title="View Details"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400")} role="button" onClick={onView}><TbEye /></div></Tooltip>
      <Tooltip title="Edit Application"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400")} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="Delete Application"><div className={classNames(iconButtonClass, hoverBgClass, "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400")} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-1 mr-2 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"/>}>
          <Dropdown.Item onClick={onScheduleInterview} className="flex items-center gap-2"><TbCalendarEvent size={18}/> <span className="text-xs">Schedule Interview</span></Dropdown.Item>
          {/* <Dropdown.Item className="flex items-center gap-2"><TbUserPlus size={18}/> <span className="text-xs">Add Employee</span></Dropdown.Item> */}
          <Dropdown.Item onClick={onAddJobLink} className="flex items-center gap-2"><TbLink size={18}/> <span className="text-xs">Add Job Link</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

// --- Table, Search, Tools, Selected Footer Components (No change needed from your original, simplified here for brevity) ---
const ApplicationTable = (props: any) => <DataTable {...props} />;
const ApplicationSearch = React.forwardRef<HTMLInputElement, any>((props, ref) => <DebouceInput {...props} ref={ref} />);
ApplicationSearch.displayName = "ApplicationSearch";
const ApplicationTableTools = ({ onSearchChange, onFilterOpen, onClearFilters }: { onSearchChange: (query: string) => void; onFilterOpen: () => void; onClearFilters: () => void; }) => (
  <div className="flex flex-col md:flex-row items-center gap-1 w-full">
    <div className="flex-grow w-full md:w-auto"><ApplicationSearch onInputChange={onSearchChange} placeholder="Search applications..." suffix={<TbSearch/>}/></div>
    <Tooltip title="Clear Filters">
      <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
    </Tooltip>
    <Button icon={<TbFilter />} onClick={onFilterOpen} className="w-full md:w-auto">Filter</Button>
  </div>
);
const ApplicationSelected = ({ selectedApplications, onDeleteSelected }: { selectedApplications: JobApplicationItem[]; onDeleteSelected: () => void; }) => {
  const [open, setOpen] = useState(false); if (selectedApplications.length === 0) return null;
  return (<><StickyFooter stickyClass="-mx-4 sm:-mx-8 border-t px-8" className="py-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500"/><span className="font-semibold">{selectedApplications.length} selected</span></span><Button size="sm" variant="plain" className="text-red-500" onClick={()=>setOpen(true)}>Delete</Button></div></StickyFooter><ConfirmDialog type="danger" title="Delete Selected" isOpen={open} onClose={()=>setOpen(false)} onConfirm={()=>{onDeleteSelected(); setOpen(false);}}><p>Are you sure?</p></ConfirmDialog></>);
};

// --- Dialog Components (View, Schedule, AddLink - No change from your original, simplified) ---
const ApplicationDetailDialog = ({ isOpen, onClose, application }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title={`Details: ${application.name}`}><p>ID: {application.id}</p>{/* ... more details ... */}<Button onClick={onClose}>Close</Button></Dialog> };
const ScheduleInterviewDialog = ({ isOpen, onClose, application }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title={`Schedule for ${application.name}`}><p>Form to schedule...</p><Button onClick={onClose}>Close</Button></Dialog> };
const AddJobLinkDialog = ({ isOpen, onClose, application, onLinkSubmit }: any) => { if (!application) return null; return <Dialog isOpen={isOpen} onClose={onClose} title="Add Job Link"><Input placeholder="Enter link"/><Button onClick={() => onLinkSubmit(application.id, 'dummy-link')}>Save</Button></Dialog> };


// --- Main JobApplicationListing Component ---
const JobApplicationListing = () => {
  const navigate = useNavigate();
    const [dialogIsOpen, setIsOpen] = useState(false)

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = (e: MouseEvent) => {
        console.log('onDialogClose', e)
        setIsOpen(false)
    }

    const onDialogOk = (e: MouseEvent) => {
        console.log('onDialogOk', e)
        setIsOpen(false)
    }
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState<JobApplicationItem[]>(initialDummyApplications);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "asc", key: "applicationDate" }, query: "" });
  const [selectedApplications, setSelectedApplications] = useState<JobApplicationItem[]>([]);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [addJobLinkOpen, setAddJobLinkOpen] = useState(false);
  const [currentItemForDialog, setCurrentItemForDialog] = useState<JobApplicationItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JobApplicationItem | null>(null);

  // Edit & Filter Drawer States
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplicationItem | null>(null);
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatus: [], filterDepartment: [] });

  // Edit & Filter Form Methods
  const editFormMethods = useForm<EditApplicationFormData>({ resolver: zodResolver(editApplicationFormSchema), mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  // --- Fetch Data (Example, replace with your actual data fetching) ---
  useEffect(() => {
    // setIsLoading(true);
    // fetchJobApplicationsApi(tableData).then(data => {
    //   setApplications(data.items);
    //   // setTableData(prev => ({...prev, total: data.total})); // If API returns total
    // }).finally(() => setIsLoading(false));
    console.log("Fetching applications with tableData:", tableData); // Placeholder
  }, [tableData]); // Re-fetch when tableData (sort, pagination, query) changes

  const { pageData, total } = useMemo(() => {
    let processedData = cloneDeep(applications);
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) { const selectedStatuses = filterCriteria.filterStatus.map(opt => opt.value as ApplicationStatus); processedData = processedData.filter(app => selectedStatuses.includes(app.status)); }
    if (filterCriteria.filterDepartment && filterCriteria.filterDepartment.length > 0) { const selectedDepts = filterCriteria.filterDepartment.map(opt => opt.value.toLowerCase()); processedData = processedData.filter(app => selectedDepts.includes(app.department.toLowerCase())); }
    if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter(a => a.id.toLowerCase().includes(query) || a.status.toLowerCase().includes(query) || a.name.toLowerCase().includes(query) || a.email.toLowerCase().includes(query) || (a.mobileNo?.toLowerCase().includes(query) ?? false) || a.department.toLowerCase().includes(query) || (a.jobTitle?.toLowerCase().includes(query) ?? false) || a.workExperience.toLowerCase().includes(query) ); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { const sortedData = [...processedData]; sortedData.sort((a, b) => { if (key === "applicationDate") { return order === "asc" ? a.applicationDate.getTime() - b.applicationDate.getTime() : b.applicationDate.getTime() - a.applicationDate.getTime(); } const aVal = a[key as keyof JobApplicationItem] as any; const bVal = b[key as keyof JobApplicationItem] as any; if (aVal === null && bVal === null) return 0; if (aVal === null) return order === "asc" ? -1 : 1; if (bVal === null) return order === "asc" ? 1 : -1; if (typeof aVal === "string" && typeof bVal === "string") return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal); if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal; return 0; }); processedData = sortedData; }
    const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const dataTotal = processedData.length; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: dataTotal };
  }, [applications, tableData, filterCriteria]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedApplications([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: JobApplicationItem) => setSelectedApplications(prev => checked ? (prev.some(a => a.id === row.id) ? prev : [...prev, row]) : prev.filter(a => a.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<JobApplicationItem>[]) => { const originals = currentRows.map(r => r.original); if (checked) { setSelectedApplications(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))] }); } else { const currentIds = new Set(originals.map(o => o.id)); setSelectedApplications(prev => prev.filter(i => !currentIds.has(i.id))); } }, []);

  const handleViewDetails = useCallback((item: JobApplicationItem) => { setCurrentItemForDialog(item); setDetailViewOpen(true); }, []);
  const handleDeleteClick = useCallback((item: JobApplicationItem) => { setItemToDelete(item); setDeleteConfirmOpen(true); }, []);
  const confirmDelete = useCallback(() => { if (!itemToDelete) return; setApplications(current => current.filter(a => a.id !== itemToDelete.id)); setSelectedApplications(prev => prev.filter(a => a.id !== itemToDelete.id)); toast.push(<Notification title="Deleted" type="success">{`Application for ${itemToDelete.name} deleted.`}</Notification>); setDeleteConfirmOpen(false); setItemToDelete(null); }, [itemToDelete]);
  const handleDeleteSelected = useCallback(() => { const ids = new Set(selectedApplications.map(a => a.id)); setApplications(current => current.filter(a => !ids.has(a.id))); setSelectedApplications([]); toast.push(<Notification title="Deleted" type="success">{`${ids.size} application(s) deleted.`}</Notification>); }, [selectedApplications]);
  const handleScheduleInterview = useCallback((item: JobApplicationItem) => { setCurrentItemForDialog(item); setScheduleInterviewOpen(true); }, []);
  const handleAddJobLink = useCallback((item: JobApplicationItem) => { setCurrentItemForDialog(item); setAddJobLinkOpen(true); }, []);
  const handleSubmitJobLink = useCallback((applicationId: string, link: string) => setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, jobApplicationLink: link } : app)), []);

  const openEditDrawer = useCallback((item: JobApplicationItem) => {
    setEditingApplication(item);
    editFormMethods.reset({
      ...item,
      applicationDate: new Date(item.applicationDate), // Ensure Date object
      mobileNo: item.mobileNo || "", resumeUrl: item.resumeUrl || "",
      coverLetter: item.coverLetter || "", notes: item.notes || "",
      jobApplicationLink: item.jobApplicationLink || "",
    });
    setIsEditDrawerOpen(true);
  }, [editFormMethods]);
  const closeEditDrawer = useCallback(() => { setIsEditDrawerOpen(false); setEditingApplication(null); editFormMethods.reset(); }, [editFormMethods]);
  const onEditApplicationSubmit = useCallback((data: EditApplicationFormData) => {
    if (!editingApplication) return;
    setIsSubmittingDrawer(true);
    const updatedApp: JobApplicationItem = { ...editingApplication, ...data, applicationDate: data.applicationDate, mobileNo: data.mobileNo || null, jobId: data.jobId || null };
    setApplications(prev => prev.map(app => app.id === editingApplication.id ? updatedApp : app));
    toast.push(<Notification title="Updated" type="success">{`Application for ${data.name} updated.`}</Notification>);
    setIsSubmittingDrawer(false); closeEditDrawer();
  }, [editingApplication, closeEditDrawer]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [], filterDepartment: data.filterDepartment || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaults = { filterStatus: [], filterDepartment: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const columns: ColumnDef<JobApplicationItem>[] = useMemo(() => [
    { header: "Status", accessorKey: "status", width: 120, cell: props => <Tag className={`${applicationStatusColor[props.row.original.status]} text-white capitalize px-2 py-1 text-xs`}>{props.row.original.status.replace(/_/g, " ")}</Tag> },
    { header: "Applicant", accessorKey: "name", cell: props => <div className="flex items-center"><Avatar size={28} shape="circle" src={props.row.original.avatar} icon={<TbUserCircle />}>{!props.row.original.avatar && props.row.original.name ? props.row.original.name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2"><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500">{props.row.original.email}</div></div></div> },
    { header: "Mobile", accessorKey: "mobileNo", width: 140, cell: props => props.row.original.mobileNo || "-" },
    { header: "Department", accessorKey: "department", width: 160 },
    { header: "Job Title", accessorKey: "jobTitle", width: 200, cell: props => props.row.original.jobTitle || "N/A" },
    { header: "Experience", accessorKey: "workExperience", width: 150 },
    { header: "Applied Date", accessorKey: "applicationDate", width: 160, cell: props => dayjs(props.row.original.applicationDate).format("MMM D, YYYY h:mm A") },
    { header: "Action", id: "action", width: 130, meta: { HeaderClass: "text-center" }, cell: props => <ActionColumn onView={() => handleViewDetails(props.row.original)} onEdit={() => navigate(`/hr-employees/job-applications/edit/${props.row.original.id}`)} onDelete={() => handleDeleteClick(props.row.original)} onScheduleInterview={() => handleScheduleInterview(props.row.original)} onAddJobLink={() => handleAddJobLink(props.row.original)} /> },
  ], [navigate, handleViewDetails, handleDeleteClick, handleScheduleInterview, handleAddJobLink]); // Removed openEditDrawer

  const departmentOptionsForFilter = useMemo(() => Array.from(new Set(applications.map(app => app.department))).map(dept => ({ value: dept, label: dept })), [applications]);

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Job Applications</h5>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button variant="outline" icon={<TbBriefcase />} onClick={() => openDialog()} className="w-full sm:w-auto">Add New Job Post</Button>
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/job-applications/add')} className="w-full sm:w-auto">Add New Application</Button>
          </div>
        </div>
        <div className="mb-4"><ApplicationTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilterOpen={openFilterDrawer} /></div>
        <div className="flex-grow overflow-auto"><ApplicationTable columns={columns} data={pageData} loading={isLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedApplications={selectedApplications} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div>
      </AdaptiveCard>
      <ApplicationSelected selectedApplications={selectedApplications} onDeleteSelected={handleDeleteSelected} />
      <ApplicationDetailDialog isOpen={detailViewOpen} onClose={() => setDetailViewOpen(false)} application={currentItemForDialog} />
      <ScheduleInterviewDialog isOpen={scheduleInterviewOpen} onClose={() => setScheduleInterviewOpen(false)} application={currentItemForDialog} />
      <AddJobLinkDialog isOpen={addJobLinkOpen} onClose={() => setAddJobLinkOpen(false)} application={currentItemForDialog} onLinkSubmit={handleSubmitJobLink} />
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title="Delete Application" onClose={() => setDeleteConfirmOpen(false)} onConfirm={confirmDelete}><p>Are you sure you want to delete the application for <strong>{itemToDelete?.name}</strong>?</p></ConfirmDialog>

      {/* Edit Application Drawer - This remains for now, can be converted to a page too */}
      <Drawer title="Edit Job Application" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={600} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer}>Cancel</Button><Button size="sm" variant="solid" form="editAppForm" type="submit" loading={isSubmittingDrawer}>Save</Button></div>}>
        {editingApplication && (
          <Form id="editAppForm" onSubmit={editFormMethods.handleSubmit(onEditApplicationSubmit)} className="flex flex-col gap-4 p-4">
            <FormItem label="Applicant Name*" error={editFormMethods.formState.errors.name?.message}><Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Email*" error={editFormMethods.formState.errors.email?.message}><Controller name="email" control={editFormMethods.control} render={({ field }) => <Input {...field} type="email" />} /></FormItem>
            <FormItem label="Mobile No" error={editFormMethods.formState.errors.mobileNo?.message}><Controller name="mobileNo" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Department*" error={editFormMethods.formState.errors.department?.message}><Controller name="department" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Job Title" error={editFormMethods.formState.errors.jobTitle?.message}><Controller name="jobTitle" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Job ID" error={editFormMethods.formState.errors.jobId?.message}><Controller name="jobId" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Work Experience*" error={editFormMethods.formState.errors.workExperience?.message}><Controller name="workExperience" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
            <FormItem label="Application Date*" error={editFormMethods.formState.errors.applicationDate?.message as string}><Controller name="applicationDate" control={editFormMethods.control} render={({ field }) => <DatePicker {...field} />} /></FormItem>
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