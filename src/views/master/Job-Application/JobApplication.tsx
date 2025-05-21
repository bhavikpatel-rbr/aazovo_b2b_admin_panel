// src/views/your-path/JobApplicationListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react"; // Added useEffect
import { Link, useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form"; // For drawer forms
import { zodResolver } from "@hookform/resolvers/zod"; // For drawer forms
import { z } from "zod"; // For Zod schemas

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
import { FormItem, FormContainer, Form } from "@/components/ui/Form"; // Added Form
import DatePicker from "@/components/ui/DatePicker";
import { HiOutlineCalendar } from "react-icons/hi";
import Select from "@/components/ui/Select"; // For drawer forms
import { Drawer } from "@/components/ui"; // For drawer forms

import { TbUserCircle, TbBriefcase, TbLink, TbFilter } from "react-icons/tb"; // Added TbFilter

// Icons
import {
  TbPencil,
  TbTrash,
  TbEye,
  TbCalendarEvent,
  TbPlus,
  TbChecks,
  TbSearch,
  TbCloudDownload, // Keep if you implement export
  TbCloudUpload, // If you use custom export for drawers
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Define Item Type & Status ---
export type ApplicationStatus =
  | "new"
  | "screening"
  | "interviewing"
  | "offer_extended"
  | "hired"
  | "rejected"
  | "withdrawn";
export type JobApplicationItem = {
  id: string;
  status: ApplicationStatus;
  jobId: string | null;
  jobTitle?: string;
  department: string;
  name: string;
  email: string;
  mobileNo: string | null;
  workExperience: string;
  applicationDate: Date; // Keep as Date for DatePicker, convert to string for API
  resumeUrl?: string | null;
  coverLetter?: string | null;
  notes?: string | null;
  jobApplicationLink?: string | null;
  // For dummy data, not in schema typically
  avatar?: string;
  requirement?: string;
  quantity?: number; // Example for sorting, not in schema
};
// --- End Item Type ---

// --- Zod Schemas for Drawers ---
const applicationFormSchema = z.object({
  name: z.string().min(1, "Applicant name is required."),
  email: z.string().email("Invalid email address."),
  mobileNo: z.string().nullable().optional(), // Allow empty or null
  department: z.string().min(1, "Department is required."),
  jobId: z.string().nullable().optional(), // Assuming jobId is a string
  jobTitle: z.string().optional(),
  workExperience: z.string().min(1, "Work experience is required."),
  applicationDate: z.date({ required_error: "Application date is required." }),
  status: z.enum([
    "new",
    "screening",
    "interviewing",
    "offer_extended",
    "hired",
    "rejected",
    "withdrawn",
  ]),
  resumeUrl: z.string().url().or(z.literal("")).nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  jobApplicationLink: z.string().url().or(z.literal("")).nullable().optional(),
});
type ApplicationFormData = z.infer<typeof applicationFormSchema>;

const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDepartment: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // Add more filters as needed (e.g., date range)
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Zod Schemas ---

// --- Constants ---
const applicationStatusOptions = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer_extended", label: "Offer Extended" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as { value: ApplicationStatus; label: string }[];

const applicationStatusColor: Record<ApplicationStatus, string> = {
  new: "bg-blue-500",
  screening: "bg-cyan-500",
  interviewing: "bg-indigo-500",
  offer_extended: "bg-purple-500",
  hired: "bg-emerald-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

const initialDummyApplications: JobApplicationItem[] = [
  {
    id: "APP001",
    status: "new",
    jobId: "JP001",
    jobTitle: "Senior Frontend Engineer",
    department: "Engineering",
    name: "Alice Applicant",
    email: "alice.a@email.com",
    mobileNo: "+1-555-2001",
    workExperience: "6 Years React",
    applicationDate: new Date(2023, 10, 6, 9, 0),
    avatar: "/img/avatars/thumb-1.jpg",
  },
  {
    id: "APP002",
    status: "screening",
    jobId: "JP002",
    jobTitle: "Marketing Content Writer",
    department: "Marketing",
    name: "Bob Candidate",
    email: "bob.c@mail.net",
    mobileNo: "+44-20-1111-2222",
    workExperience: "3 Years SEO Writing",
    applicationDate: new Date(2023, 10, 6, 10, 30),
    avatar: "/img/avatars/thumb-2.jpg",
  },
  {
    id: "APP003",
    status: "interviewing",
    jobId: "JP006",
    jobTitle: "Data Scientist",
    department: "Data Science & Analytics",
    name: "Charlie Davis",
    email: "charlie.d@web.com",
    mobileNo: null,
    workExperience: "4 Years Python/ML",
    applicationDate: new Date(2023, 10, 7, 8, 15),
    notes: "Strong portfolio, scheduled 1st round.",
    avatar: "/img/avatars/thumb-3.jpg",
  },
  {
    id: "APP004",
    status: "new",
    jobId: null,
    jobTitle: "General Application", // Or derive if jobId is null
    department: "Sales",
    name: "Diana Entrylevel",
    email: "diana.e@mail.co",
    mobileNo: "+1-800-555-DEMO",
    workExperience: "None",
    applicationDate: new Date(2023, 10, 7, 11, 0),
    requirement: "Interested in sales roles.",
    avatar: "/img/avatars/thumb-4.jpg",
  },
  {
    id: "APP005",
    status: "offer_extended",
    jobId: "JP001",
    jobTitle: "Senior Frontend Engineer",
    department: "Engineering",
    name: "Ethan Expert",
    email: "ethan.e@domain.org",
    mobileNo: "+1-650-555-1212",
    workExperience: "8 Years Fullstack",
    applicationDate: new Date(2023, 10, 5, 16, 20),
    avatar: "/img/avatars/thumb-5.jpg",
  },
  {
    id: "APP006",
    status: "rejected",
    jobId: "JP002",
    jobTitle: "Marketing Content Writer",
    department: "Marketing",
    name: "Fiona Fluff",
    email: "fiona.f@email.io",
    mobileNo: null,
    workExperience: "1 Year Blogging",
    applicationDate: new Date(2023, 10, 6, 13, 0),
    notes: "Writing samples did not meet requirements.",
    avatar: "/img/avatars/thumb-6.jpg",
  },
  {
    id: "APP007",
    status: "hired",
    jobId: "JP004",
    jobTitle: "Junior Accountant",
    department: "Finance",
    name: "George Graduate",
    email: "george.g@mail.com",
    mobileNo: "+1-312-555-4444",
    workExperience: "Internship",
    applicationDate: new Date(2023, 9, 18, 10, 0),
    avatar: "/img/avatars/thumb-7.jpg",
  },
  {
    id: "APP008",
    status: "withdrawn",
    jobId: "JP006",
    jobTitle: "Data Scientist",
    department: "Data Science & Analytics",
    name: "Heidi Highflyer",
    email: "heidi.h@email.co",
    mobileNo: null,
    workExperience: "5 Years ML/Stats",
    applicationDate: new Date(2023, 10, 7, 15, 55),
    notes: "Accepted another offer.",
    avatar: "/img/avatars/thumb-8.jpg",
  },
];
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
  onView,
  onEdit, // This will now open the Edit Drawer
  onDelete,
  onScheduleInterview,
  onAddJobLink,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onScheduleInterview: () => void;
  onAddJobLink: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip title="View Details">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          )}
          role="button"
          onClick={onView}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Edit Application">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Schedule Interview">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
          )}
          role="button"
          onClick={onScheduleInterview}
        >
          <TbCalendarEvent />
        </div>
      </Tooltip>
      <Tooltip title="Add Job Link">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400"
          )}
          role="button"
          onClick={onAddJobLink}
        >
          <TbLink />
        </div>
      </Tooltip>
      <Tooltip title="Delete Application">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          )}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};
// --- End ActionColumn ---

// --- ApplicationTable Component (No change needed) ---
const ApplicationTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedApplications,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: {
  columns: ColumnDef<JobApplicationItem>[];
  data: JobApplicationItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedApplications: JobApplicationItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: JobApplicationItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<JobApplicationItem>[]) => void;
}) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedApplications.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  );
};

// --- ApplicationSearch Component (No change needed) ---
type ApplicationSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ApplicationSearch = React.forwardRef<
  HTMLInputElement,
  ApplicationSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      placeholder="Search Applications (Name, Email, Job, Dept...)"
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
ApplicationSearch.displayName = "ApplicationSearch";

// --- ApplicationTableTools Component (Modified to include Filter Button) ---
const ApplicationTableTools = ({
  onSearchChange,
  onFilterOpen, // New prop to open filter drawer
}: {
  onSearchChange: (query: string) => void;
  onFilterOpen: () => void;
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
      <div className="flex-grow w-full md:w-auto">
        <ApplicationSearch onInputChange={onSearchChange} />
      </div>
      <Button
        icon={<TbFilter />}
        onClick={onFilterOpen}
        className="w-full md:w-auto"
      >
        Filter
      </Button>
    </div>
  );
};

// --- ApplicationActionTools Component (Modified to include Add New Application Drawer trigger) ---
const ApplicationActionTools = ({
  onAddNewApplicationOpen, // New prop to open add drawer
}: {
  onAddNewApplicationOpen: () => void;
}) => {
  const navigate = useNavigate();
  const [isDummyModalOpen, setIsDummyModalOpen] = useState(false);
  const handleAddNewJob = () => setIsDummyModalOpen(true);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Button
        variant="outline"
        icon={<TbBriefcase />}
        onClick={handleAddNewJob} // This can remain as navigation
        className="w-full sm:w-auto"
      >
        Add New Job Post
      </Button>
      <Button
        variant="solid"
        icon={<TbPlus />}
        onClick={onAddNewApplicationOpen} // Trigger Add Drawer
        className="w-full sm:w-auto"
      >
        Add New Application
      </Button>
      <Dialog
        isOpen={isDummyModalOpen}
        onClose={() => setIsDummyModalOpen(false)}
        onRequestClose={() => setIsDummyModalOpen(false)}
        width={400}
      >
        <h5 className="mb-4">Dummy Modal</h5>
        <p>This is a dummy modal opened from "Add New Job Post" button.</p>
        <div className="text-right mt-6">
          <Button variant="solid" onClick={() => setIsDummyModalOpen(false)}>
            Close
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

// --- ApplicationSelected Component (No change needed) ---
const ApplicationSelected = ({
  selectedApplications,
  onDeleteSelected,
}: {
  selectedApplications: JobApplicationItem[];
  onDeleteSelected: () => void;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };

  if (selectedApplications.length === 0) return null;

  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">
                {selectedApplications.length}
              </span>
              <span>
                Application
                {selectedApplications.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedApplications.length} Application${
          selectedApplications.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmButtonColor="red-600"
      >
        <p>
          Are you sure you want to delete the selected application
          {selectedApplications.length > 1 ? "s" : ""}? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Dialog Components (No change needed for existing dialogs) ---
const ApplicationDetailDialog = ({
  isOpen,
  onClose,
  application,
}: {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplicationItem | null;
}) => {
  /* ... existing code ... */
  if (!application) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={700}
    >
      <h5 className="mb-4">Application Details: {application.name}</h5>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <p>
          <strong>ID:</strong> {application.id}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <Tag
            className={`${
              applicationStatusColor[application.status]
            } text-white capitalize`}
          >
            {application.status.replace(/_/g, " ")}
          </Tag>
        </p>
        <p>
          <strong>Job Applied For:</strong>{" "}
          {application.jobTitle ?? "General Application"}
        </p>
        <p>
          <strong>Job ID:</strong> {application.jobId ?? "N/A"}
        </p>
        <p>
          <strong>Department:</strong> {application.department}
        </p>
        <p>
          <strong>Applicant Name:</strong> {application.name}
        </p>
        <p>
          <strong>Email:</strong> {application.email}
        </p>
        <p>
          <strong>Mobile:</strong> {application.mobileNo ?? "N/A"}
        </p>
        <p>
          <strong>Work Experience:</strong> {application.workExperience}
        </p>
        <p>
          <strong>Application Date:</strong>{" "}
          {application.applicationDate.toLocaleString()}
        </p>
        <p>
          <strong>Job Application Link:</strong>{" "}
          {application.jobApplicationLink ? (
            <a
              href={application.jobApplicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {application.jobApplicationLink}
            </a>
          ) : (
            "Not Added"
          )}
        </p>
      </div>
      <div className="mt-4">
        <h6 className="mb-2 font-semibold">Cover Letter / Requirement:</h6>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-60 overflow-y-auto">
          {application.coverLetter ?? application.requirement ?? "N/A"}
        </p>
      </div>
      <div className="mt-4">
        <h6 className="mb-2 font-semibold">Notes:</h6>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-40 overflow-y-auto">
          {application.notes ?? "No notes added."}
        </p>
      </div>
      {application.resumeUrl && (
        <div className="mt-4">
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Resume
          </a>
        </div>
      )}
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
const ScheduleInterviewDialog = ({
  isOpen,
  onClose,
  application,
}: {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplicationItem | null;
}) => {
  /* ... existing code ... */
  const [interviewDate, setInterviewDate] = useState<Date | null>(null);
  const [interviewer, setInterviewer] = useState("");
  const [notes, setNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedule = () => {
    if (!application || !interviewDate || !interviewer) {
      toast.push(
        <Notification title="Missing Information" type="warning">
          Please select date/time and interviewer.
        </Notification>
      );
      return;
    }
    setIsScheduling(true);
    // Simulate API call
    setTimeout(() => {
      toast.push(
        <Notification
          title="Interview Scheduled"
          type="success"
        >{`Interview scheduled for ${application.name}.`}</Notification>
      );
      setIsScheduling(false);
      onClose();
    }, 1000);
  };
  React.useEffect(() => {
    if (!isOpen) {
      setInterviewDate(null);
      setInterviewer("");
      setNotes("");
    }
  }, [isOpen]);
  if (!application) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={500}
    >
      <h5 className="mb-4">Schedule Interview for {application.name}</h5>
      <p className="mb-4 text-sm">
        Applied for: {application.jobTitle ?? "General Application"}
      </p>
      <FormContainer>
        <FormItem label="Interview Date & Time" className="mb-4">
          <DatePicker
            placeholder="Select date and time"
            value={interviewDate}
            onChange={(date) => setInterviewDate(date)}
            inputFormat="dd/MM/yyyy hh:mm a"
            inputPrefix={<HiOutlineCalendar className="text-lg" />}
            showTimeInput
          />
        </FormItem>
        <FormItem label="Interviewer(s)" className="mb-4">
          <Input
            placeholder="Enter interviewer names"
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
          />
        </FormItem>
        <FormItem label="Notes (Optional)">
          <Input
            textArea
            placeholder="Any specific notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormItem>
      </FormContainer>
      <div className="text-right mt-6">
        <Button
          size="sm"
          className="mr-2"
          onClick={onClose}
          disabled={isScheduling}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="solid"
          onClick={handleSchedule}
          loading={isScheduling}
        >
          Schedule
        </Button>
      </div>
    </Dialog>
  );
};
const AddJobLinkDialog = ({
  isOpen,
  onClose,
  application,
  onLinkSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplicationItem | null;
  onLinkSubmit: (applicationId: string, link: string) => void;
}) => {
  /* ... existing code ... */
  const [jobLink, setJobLink] = useState("");
  const [isSubmittingLink, setIsSubmittingLink] = useState(false); // Renamed to avoid conflict

  const handleSubmitLink = () => {
    // Renamed to avoid conflict
    if (!application || !jobLink) {
      toast.push(
        <Notification title="Missing Link" type="warning">
          Please enter the Job Application Link.
        </Notification>
      );
      return;
    }
    setIsSubmittingLink(true);
    setTimeout(() => {
      onLinkSubmit(application.id, jobLink);
      toast.push(
        <Notification title="Link Added" type="success">
          Job Application Link updated.
        </Notification>
      );
      setIsSubmittingLink(false);
      onClose();
    }, 500);
  };
  React.useEffect(() => {
    if (isOpen && application?.jobApplicationLink)
      setJobLink(application.jobApplicationLink);
    else if (!isOpen) setJobLink("");
  }, [isOpen, application]);
  if (!application) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={500}
    >
      <h5 className="mb-4">Add/Edit Job Application Link</h5>
      <p className="mb-4 text-sm">For applicant: {application.name}</p>
      <FormContainer>
        <FormItem label="Job Application Link">
          <Input
            placeholder="https://example.com/apply/123"
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
          />
        </FormItem>
      </FormContainer>
      <div className="text-right mt-6">
        <Button
          size="sm"
          className="mr-2"
          onClick={onClose}
          disabled={isSubmittingLink}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="solid"
          onClick={handleSubmitLink}
          loading={isSubmittingLink}
        >
          Save Link
        </Button>
      </div>
    </Dialog>
  );
};

// --- Main JobApplicationListing Component ---
const JobApplicationListing = () => {
  const navigate = useNavigate();

  // --- State ---
  const [isLoading, setIsLoading] = useState(false); // For actual API calls later
  const [applications, setApplications] = useState<JobApplicationItem[]>(
    initialDummyApplications
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedApplications, setSelectedApplications] = useState<
    JobApplicationItem[]
  >([]);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [addJobLinkOpen, setAddJobLinkOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<JobApplicationItem | null>(
    null
  );

  // Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<JobApplicationItem | null>(null); // For edit drawer
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false); // For drawer form submission

  // Filter Criteria State
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterStatus: [],
    filterDepartment: [],
  });
  // --- End State ---

  // --- Form Methods for Drawers ---
  const addFormMethods = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      // Sensible defaults
      name: "",
      email: "",
      mobileNo: null,
      department: "",
      jobId: null,
      jobTitle: "",
      workExperience: "",
      applicationDate: new Date(),
      status: "new",
      resumeUrl: null,
      coverLetter: null,
      notes: null,
      jobApplicationLink: null,
    },
    mode: "onChange",
  });

  const editFormMethods = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // Initialize with current filter criteria
  });
  // --- End Form Methods ---

  // --- Data Processing (Modified to include filterCriteria) ---
  const { pageData, total } = useMemo(() => {
    let processedData = cloneDeep(applications); // Use cloneDeep to avoid mutation issues

    // Apply Filters from filterCriteria
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map(
        (opt) => opt.value as ApplicationStatus
      );
      processedData = processedData.filter((app) =>
        selectedStatuses.includes(app.status)
      );
    }
    if (
      filterCriteria.filterDepartment &&
      filterCriteria.filterDepartment.length > 0
    ) {
      const selectedDepts = filterCriteria.filterDepartment.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((app) =>
        selectedDepts.includes(app.department.toLowerCase())
      );
    }

    // Apply Search
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (a) =>
          a.id.toLowerCase().includes(query) ||
          a.status.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          (a.mobileNo?.toLowerCase().includes(query) ?? false) ||
          a.department.toLowerCase().includes(query) ||
          (a.jobTitle?.toLowerCase().includes(query) ?? false) ||
          a.workExperience.toLowerCase().includes(query) ||
          (a.requirement?.toLowerCase().includes(query) ?? false)
      );
    }
    // Apply Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      const sortedData = [...processedData]; // Create a new array for sorting
      sortedData.sort((a, b) => {
        if (key === "applicationDate") {
          return order === "asc"
            ? a.applicationDate.getTime() - b.applicationDate.getTime()
            : b.applicationDate.getTime() - a.applicationDate.getTime();
        }
        // Ensure a and b have the key and it's comparable
        const aVal = a[key as keyof JobApplicationItem];
        const bVal = b[key as keyof JobApplicationItem];

        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return order === "asc" ? -1 : 1;
        if (bVal === null) return order === "asc" ? 1 : -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return order === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        // Fallback for other types or mixed types (might need more specific handling)
        return 0;
      });
      processedData = sortedData;
    }
    // Apply Pagination
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = processedData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: dataTotal };
  }, [applications, tableData, filterCriteria]); // Added filterCriteria to dependencies
  // --- End Data Processing ---

  // --- Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    // Made data partial
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const handlePaginationChange = useCallback(
    (page: number) => {
      handleSetTableData({ pageIndex: page });
    },
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1,
      });
      setSelectedApplications([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => {
      handleSetTableData({ query: query, pageIndex: 1 });
    },
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: JobApplicationItem) => {
      setSelectedApplications((prev) => {
        if (checked) {
          return prev.some((a) => a.id === row.id) ? prev : [...prev, row];
        } else {
          return prev.filter((a) => a.id !== row.id);
        }
      });
    },
    [] // Removed setSelectedApplications from deps as it's stable
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<JobApplicationItem>[]) => {
      // Use currentRows from DataTable
      const currentPageRowOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedApplications((prevSelected) => {
          const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
          const newRowsToAdd = currentPageRowOriginals.filter(
            (r) => !prevSelectedIds.has(r.id)
          );
          return [...prevSelected, ...newRowsToAdd];
        });
      } else {
        const currentPageRowIds = new Set(
          currentPageRowOriginals.map((r) => r.id)
        );
        setSelectedApplications((prevSelected) =>
          prevSelected.filter((item) => !currentPageRowIds.has(item.id))
        );
      }
    },
    []
  );

  // Action Handlers (Dialogs)
  const handleViewDetails = useCallback((item: JobApplicationItem) => {
    setCurrentItem(item);
    setDetailViewOpen(true);
  }, []);
  const handleCloseDetailView = useCallback(() => {
    setDetailViewOpen(false);
    setCurrentItem(null);
  }, []);

  const handleActualDelete = useCallback(
    // Renamed from handleDelete for clarity
    (itemToDelete: JobApplicationItem) => {
      // This is a dummy delete. Replace with API call.
      console.log("Deleting application:", itemToDelete.id);
      setApplications((current) =>
        current.filter((a) => a.id !== itemToDelete.id)
      );
      setSelectedApplications((prev) =>
        prev.filter((a) => a.id !== itemToDelete.id)
      );
      toast.push(
        <Notification
          title="Application Deleted"
          type="success"
          duration={2000}
        >{`Application from ${itemToDelete.name} deleted.`}</Notification>
      );
    },
    []
  );
  const handleDeleteSelected = useCallback(() => {
    // Dummy delete selected. Replace with API call.
    const selectedIds = new Set(selectedApplications.map((a) => a.id));
    setApplications((current) => current.filter((a) => !selectedIds.has(a.id)));
    setSelectedApplications([]);
    toast.push(
      <Notification
        title="Applications Deleted"
        type="success"
        duration={2000}
      >{`${selectedIds.size} application(s) deleted.`}</Notification>
    );
  }, [selectedApplications]);

  const handleScheduleInterview = useCallback((item: JobApplicationItem) => {
    setCurrentItem(item);
    setScheduleInterviewOpen(true);
  }, []);
  const handleCloseScheduleInterview = useCallback(() => {
    setScheduleInterviewOpen(false);
    setCurrentItem(null);
  }, []);
  const handleAddJobLink = useCallback((item: JobApplicationItem) => {
    setCurrentItem(item);
    setAddJobLinkOpen(true);
  }, []);
  const handleCloseAddJobLink = useCallback(() => {
    setAddJobLinkOpen(false);
    setCurrentItem(null);
  }, []);

  const handleSubmitJobLink = useCallback(
    (applicationId: string, link: string) => {
      setApplications((prevApps) =>
        prevApps.map((app) =>
          app.id === applicationId ? { ...app, jobApplicationLink: link } : app
        )
      );
      // handleCloseAddJobLink() // Dialog closes itself on submit
    },
    [handleCloseAddJobLink]
  );

  // Drawer Handlers
  const openAddDrawer = () => {
    addFormMethods.reset({
      // Reset with default or empty values
      name: "",
      email: "",
      mobileNo: null,
      department: "",
      jobId: null,
      jobTitle: "",
      workExperience: "",
      applicationDate: new Date(),
      status: "new",
      resumeUrl: null,
      coverLetter: null,
      notes: null,
      jobApplicationLink: null,
    });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    addFormMethods.reset(); // Clear form on close
  };

  const onAddApplicationSubmit = (data: ApplicationFormData) => {
    setIsSubmittingDrawer(true);
    // Simulate API call / state update
    const newApplication: JobApplicationItem = {
      ...data,
      id: `APP${String(Math.random()).slice(2, 7)}`, // Dummy ID
      applicationDate: data.applicationDate, // Already a Date object
      mobileNo: data.mobileNo || null,
      jobId: data.jobId || null,
    };
    console.log("Adding Application:", newApplication);
    setApplications((prev) => [newApplication, ...prev]);
    toast.push(
      <Notification title="Application Added" type="success" duration={2000}>
        Application for {data.name} added.
      </Notification>
    );
    setIsSubmittingDrawer(false);
    closeAddDrawer();
  };

  const openEditDrawer = (item: JobApplicationItem) => {
    setEditingApplication(item);
    editFormMethods.reset({
      ...item,
      applicationDate: new Date(item.applicationDate), // Ensure it's a Date object
      mobileNo: item.mobileNo || "", // Handle null for input
      jobId: item.jobId || "",
      resumeUrl: item.resumeUrl || "",
      coverLetter: item.coverLetter || "",
      notes: item.notes || "",
      jobApplicationLink: item.jobApplicationLink || "",
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingApplication(null);
    editFormMethods.reset();
  };
  const onEditApplicationSubmit = (data: ApplicationFormData) => {
    if (!editingApplication) return;
    setIsSubmittingDrawer(true);
    // Simulate API call / state update
    const updatedApplication: JobApplicationItem = {
      ...editingApplication,
      ...data,
      applicationDate: data.applicationDate, // Already a Date object
      mobileNo: data.mobileNo || null,
      jobId: data.jobId || null,
    };
    console.log("Updating Application:", updatedApplication);
    setApplications((prev) =>
      prev.map((app) =>
        app.id === editingApplication.id ? updatedApplication : app
      )
    );
    toast.push(
      <Notification title="Application Updated" type="success" duration={2000}>
        Application for {data.name} updated.
      </Notification>
    );
    setIsSubmittingDrawer(false);
    closeEditDrawer();
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria); // Load current filters into the form
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterStatus: data.filterStatus || [],
      filterDepartment: data.filterDepartment || [],
    });
    handleSetTableData({ pageIndex: 1 }); // Reset to first page on filter change
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {
      filterStatus: [],
      filterDepartment: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  // --- End Handlers ---

  // --- Define Columns (ActionColumn's onEdit will now trigger edit drawer) ---
  const columns: ColumnDef<JobApplicationItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        width: 140,
        cell: (props) => {
          const { status } = props.row.original;
          const displayStatus = status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          return (
            <Tag
              className={`${applicationStatusColor[status]} text-white capitalize`}
            >
              {displayStatus}
            </Tag>
          );
        },
      },
      {
        header: "Applicant",
        accessorKey: "name",
        enableSorting: true,
        cell: (props) => {
          const { name, email, avatar } = props.row.original;
          return (
            <div className="flex items-center">
              <Avatar
                size={28}
                shape="circle"
                src={avatar} // Ensure avatar field exists in JobApplicationItem or remove
                icon={<TbUserCircle />}
              >
                {!avatar && name ? name.charAt(0).toUpperCase() : ""}
              </Avatar>
              <div className="ml-2 rtl:mr-2">
                <span className="font-semibold">{name}</span>
                <div className="text-xs text-gray-500">{email}</div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Mobile",
        accessorKey: "mobileNo",
        enableSorting: false, // Mobile sorting might be complex due to formats
        width: 150,
        cell: (props) => <span>{props.row.original.mobileNo ?? "-"}</span>,
      },
      {
        header: "Department",
        accessorKey: "department",
        enableSorting: true,
      },
      {
        header: "Job Title", // Added Job Title
        accessorKey: "jobTitle",
        enableSorting: true,
        cell: (props) => <span>{props.row.original.jobTitle ?? "N/A"}</span>,
      },
      {
        header: "Experience",
        accessorKey: "workExperience",
        enableSorting: true,
      },
      {
        header: "Applied Date",
        accessorKey: "applicationDate",
        enableSorting: true,
        width: 180,
        cell: (props) => {
          const date = props.row.original.applicationDate;
          return (
            <span>
              {date.toLocaleDateString()}{" "}
              {date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      },
      {
        header: "",
        id: "action",
        width: 180,
        cell: (props) => (
          <ActionColumn
            onView={() => handleViewDetails(props.row.original)}
            onEdit={() => openEditDrawer(props.row.original)} // Open Edit Drawer
            onDelete={() => handleActualDelete(props.row.original)}
            onScheduleInterview={() =>
              handleScheduleInterview(props.row.original)
            }
            onAddJobLink={() => handleAddJobLink(props.row.original)}
          />
        ),
      },
    ],
    [
      handleViewDetails,
      openEditDrawer, // Changed from handleEdit
      handleActualDelete,
      handleScheduleInterview,
      handleAddJobLink,
    ]
  );
  // --- End Define Columns ---

  // Dynamic options for filter drawer
  const departmentOptionsForFilter = useMemo(() => {
    const depts = new Set(applications.map((app) => app.department));
    return Array.from(depts).map((dept) => ({ value: dept, label: dept }));
  }, [applications]);

  // --- Render Main Component ---
  return (
    <Container className="h-full">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        {/* Header */}
        <div className="lg:flex items-center justify-between mb-4">
          <h3 className="mb-4 lg:mb-0">Job Applications</h3>
          <ApplicationActionTools onAddNewApplicationOpen={openAddDrawer} />
        </div>

        {/* Tools */}
        <div className="mb-4">
          <ApplicationTableTools
            onSearchChange={handleSearchChange}
            onFilterOpen={openFilterDrawer}
          />
        </div>

        {/* Table */}
        <div className="flex-grow overflow-auto">
          <ApplicationTable
            columns={columns}
            data={pageData}
            loading={isLoading}
            pagingData={{
              total,
              pageIndex: tableData.pageIndex as number,
              pageSize: tableData.pageSize as number,
            }}
            selectedApplications={selectedApplications}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>

      {/* Selected Footer */}
      <ApplicationSelected
        selectedApplications={selectedApplications}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Dialogs (View, Schedule, Add Link) */}
      <ApplicationDetailDialog
        isOpen={detailViewOpen}
        onClose={handleCloseDetailView}
        application={currentItem}
      />
      <ScheduleInterviewDialog
        isOpen={scheduleInterviewOpen}
        onClose={handleCloseScheduleInterview}
        application={currentItem}
      />
      <AddJobLinkDialog
        isOpen={addJobLinkOpen}
        onClose={handleCloseAddJobLink}
        application={currentItem}
        onLinkSubmit={handleSubmitJobLink}
      />

      {/* Add Application Drawer */}
      <Drawer
        title="Add New Job Application"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeAddDrawer}
              disabled={isSubmittingDrawer}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="addApplicationForm"
              type="submit"
              loading={isSubmittingDrawer}
              disabled={!addFormMethods.formState.isValid || isSubmittingDrawer}
            >
              {isSubmittingDrawer ? "Adding..." : "Add Application"}
            </Button>
          </div>
        }
      >
        <Form
          id="addApplicationForm"
          onSubmit={addFormMethods.handleSubmit(onAddApplicationSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Applicant Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter applicant's full name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Email"
            invalid={!!addFormMethods.formState.errors.email}
            errorMessage={addFormMethods.formState.errors.email?.message}
          >
            <Controller
              name="email"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="applicant@example.com"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Mobile No (Optional)"
            invalid={!!addFormMethods.formState.errors.mobileNo}
            errorMessage={addFormMethods.formState.errors.mobileNo?.message}
          >
            <Controller
              name="mobileNo"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="+1-555-1234" />
              )}
            />
          </FormItem>
          <FormItem
            label="Department"
            invalid={!!addFormMethods.formState.errors.department}
            errorMessage={addFormMethods.formState.errors.department?.message}
          >
            <Controller
              name="department"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., Engineering, Marketing" />
              )}
            />
          </FormItem>
          <FormItem
            label="Job Title (Optional if general)"
            invalid={!!addFormMethods.formState.errors.jobTitle}
            errorMessage={addFormMethods.formState.errors.jobTitle?.message}
          >
            <Controller
              name="jobTitle"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., Software Engineer" />
              )}
            />
          </FormItem>
          <FormItem
            label="Job ID (Optional)"
            invalid={!!addFormMethods.formState.errors.jobId}
            errorMessage={addFormMethods.formState.errors.jobId?.message}
          >
            <Controller
              name="jobId"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., JP001" />
              )}
            />
          </FormItem>
          <FormItem
            label="Work Experience"
            invalid={!!addFormMethods.formState.errors.workExperience}
            errorMessage={
              addFormMethods.formState.errors.workExperience?.message
            }
          >
            <Controller
              name="workExperience"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., 3 Years in React, None" />
              )}
            />
          </FormItem>
          <FormItem
            label="Application Date"
            invalid={!!addFormMethods.formState.errors.applicationDate}
            errorMessage={
              addFormMethods.formState.errors.applicationDate?.message as string
            }
          >
            <Controller
              name="applicationDate"
              control={addFormMethods.control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  placeholder="Select date"
                  inputFormat="dd/MM/yyyy"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Status"
            invalid={!!addFormMethods.formState.errors.status}
            errorMessage={addFormMethods.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select status"
                  options={applicationStatusOptions}
                  value={applicationStatusOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(opt) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Resume URL (Optional)"
            invalid={!!addFormMethods.formState.errors.resumeUrl}
            errorMessage={addFormMethods.formState.errors.resumeUrl?.message}
          >
            <Controller
              name="resumeUrl"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="https://example.com/resume.pdf"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Job Application Link (Optional)"
            invalid={!!addFormMethods.formState.errors.jobApplicationLink}
            errorMessage={
              addFormMethods.formState.errors.jobApplicationLink?.message
            }
          >
            <Controller
              name="jobApplicationLink"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="https://platform.com/apply/xyz"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Cover Letter / Notes (Optional)"
            invalid={!!addFormMethods.formState.errors.coverLetter}
            errorMessage={addFormMethods.formState.errors.coverLetter?.message}
          >
            <Controller
              name="coverLetter"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  textArea
                  rows={3}
                  placeholder="Enter cover letter or additional notes"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Application Drawer */}
      <Drawer
        title="Edit Job Application"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeEditDrawer}
              disabled={isSubmittingDrawer}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="editApplicationForm"
              type="submit"
              loading={isSubmittingDrawer}
              disabled={
                !editFormMethods.formState.isValid || isSubmittingDrawer
              }
            >
              {isSubmittingDrawer ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        {editingApplication && (
          <Form
            id="editApplicationForm"
            onSubmit={editFormMethods.handleSubmit(onEditApplicationSubmit)}
            className="flex flex-col gap-4"
          >
            <FormItem
              label="Applicant Name"
              invalid={!!editFormMethods.formState.errors.name}
              errorMessage={editFormMethods.formState.errors.name?.message}
            >
              <Controller
                name="name"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Email"
              invalid={!!editFormMethods.formState.errors.email}
              errorMessage={editFormMethods.formState.errors.email?.message}
            >
              <Controller
                name="email"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} type="email" />}
              />
            </FormItem>
            <FormItem
              label="Mobile No (Optional)"
              invalid={!!editFormMethods.formState.errors.mobileNo}
              errorMessage={editFormMethods.formState.errors.mobileNo?.message}
            >
              <Controller
                name="mobileNo"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Department"
              invalid={!!editFormMethods.formState.errors.department}
              errorMessage={
                editFormMethods.formState.errors.department?.message
              }
            >
              <Controller
                name="department"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Job Title (Optional)"
              invalid={!!editFormMethods.formState.errors.jobTitle}
              errorMessage={editFormMethods.formState.errors.jobTitle?.message}
            >
              <Controller
                name="jobTitle"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Job ID (Optional)"
              invalid={!!editFormMethods.formState.errors.jobId}
              errorMessage={editFormMethods.formState.errors.jobId?.message}
            >
              <Controller
                name="jobId"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Work Experience"
              invalid={!!editFormMethods.formState.errors.workExperience}
              errorMessage={
                editFormMethods.formState.errors.workExperience?.message
              }
            >
              <Controller
                name="workExperience"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Application Date"
              invalid={!!editFormMethods.formState.errors.applicationDate}
              errorMessage={
                editFormMethods.formState.errors.applicationDate
                  ?.message as string
              }
            >
              <Controller
                name="applicationDate"
                control={editFormMethods.control}
                render={({ field }) => (
                  <DatePicker {...field} inputFormat="dd/MM/yyyy" />
                )}
              />
            </FormItem>
            <FormItem
              label="Status"
              invalid={!!editFormMethods.formState.errors.status}
              errorMessage={editFormMethods.formState.errors.status?.message}
            >
              <Controller
                name="status"
                control={editFormMethods.control}
                render={({ field }) => (
                  <Select
                    placeholder="Select status"
                    options={applicationStatusOptions}
                    value={applicationStatusOptions.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Resume URL (Optional)"
              invalid={!!editFormMethods.formState.errors.resumeUrl}
              errorMessage={editFormMethods.formState.errors.resumeUrl?.message}
            >
              <Controller
                name="resumeUrl"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Job Application Link (Optional)"
              invalid={!!editFormMethods.formState.errors.jobApplicationLink}
              errorMessage={
                editFormMethods.formState.errors.jobApplicationLink?.message
              }
            >
              <Controller
                name="jobApplicationLink"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            <FormItem
              label="Cover Letter / Notes (Optional)"
              invalid={!!editFormMethods.formState.errors.coverLetter}
              errorMessage={
                editFormMethods.formState.errors.coverLetter?.message
              }
            >
              <Controller
                name="coverLetter"
                control={editFormMethods.control}
                render={({ field }) => <Input {...field} textArea rows={3} />}
              />
            </FormItem>
          </Form>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Applications"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear All
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterApplicationForm"
              type="submit"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <Form
          id="filterApplicationForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status..."
                  options={applicationStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Department">
            <Controller
              name="filterDepartment"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select departments..."
                  options={departmentOptionsForFilter}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          {/* Add more filter fields here */}
        </Form>
      </Drawer>
    </Container>
  );
};
// --- End Main Component ---

export default JobApplicationListing;
