// src/views/your-path/JobApplicationListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // For View Details / Schedule / Add Job Link
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Input } from '@/components/ui/Input' // For dialogs
import { FormItem, FormContainer } from '@/components/ui/Form' // For dialogs
import DatePicker from '@/components/ui/DatePicker' // For interview schedule
import { HiOutlineCalendar } from 'react-icons/hi' // For date picker

import { TbUserCircle, TbBriefcase, TbLink } from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil, // Edit
    TbTrash, // Delete
    TbEye, // View
    TbCalendarEvent, // Schedule Interview
    TbPlus, // Add Job / Add Job Application Link / Add New Job Application
    TbChecks, // Selected Footer
    TbSearch,
    TbCloudDownload,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type ApplicationStatus =
    | 'new'
    | 'screening'
    | 'interviewing'
    | 'offer_extended'
    | 'hired'
    | 'rejected'
    | 'withdrawn'
export type JobApplicationItem = {
    id: string // Unique Application ID
    status: ApplicationStatus
    jobId: string | null // Link to the Job Post (null if general application)
    jobTitle?: string // Denormalized for display (optional)
    department: string
    name: string // Applicant Name
    email: string
    mobileNo: string | null
    workExperience: string // e.g., "3 Years", "None", "5+ Years in Management"
    applicationDate: Date
    // Optional fields that might be shown in 'View Details'
    resumeUrl?: string | null
    coverLetter?: string | null
    notes?: string | null
    jobApplicationLink?: string | null // Link added later
}
// --- End Item Type ---

// --- Constants ---
const applicationStatusColor: Record<ApplicationStatus, string> = {
    new: 'bg-blue-500',
    screening: 'bg-cyan-500',
    interviewing: 'bg-indigo-500',
    offer_extended: 'bg-purple-500',
    hired: 'bg-emerald-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-500',
}

const initialDummyApplications: JobApplicationItem[] = [
    {
        id: 'APP001',
        status: 'new',
        jobId: 'JP001',
        jobTitle: 'Senior Frontend Engineer',
        department: 'Engineering',
        name: 'Alice Applicant',
        email: 'alice.a@email.com',
        mobileNo: '+1-555-2001',
        workExperience: '6 Years React',
        applicationDate: new Date(2023, 10, 6, 9, 0),
    },
    {
        id: 'APP002',
        status: 'screening',
        jobId: 'JP002',
        jobTitle: 'Marketing Content Writer',
        department: 'Marketing',
        name: 'Bob Candidate',
        email: 'bob.c@mail.net',
        mobileNo: '+44-20-1111-2222',
        workExperience: '3 Years SEO Writing',
        applicationDate: new Date(2023, 10, 6, 10, 30),
    },
    {
        id: 'APP003',
        status: 'interviewing',
        jobId: 'JP006',
        jobTitle: 'Data Scientist',
        department: 'Data Science & Analytics',
        name: 'Charlie Davis',
        email: 'charlie.d@web.com',
        mobileNo: null,
        workExperience: '4 Years Python/ML',
        applicationDate: new Date(2023, 10, 7, 8, 15),
        notes: 'Strong portfolio, scheduled 1st round.',
    },
    {
        id: 'APP004',
        status: 'new',
        jobId: null,
        jobTitle: 'General Application',
        department: 'Sales',
        name: 'Diana Entrylevel',
        email: 'diana.e@mail.co',
        mobileNo: '+1-800-555-DEMO',
        workExperience: 'None',
        applicationDate: new Date(2023, 10, 7, 11, 0),
        requirement: 'Interested in sales roles.',
    },
    {
        id: 'APP005',
        status: 'offer_extended',
        jobId: 'JP001',
        jobTitle: 'Senior Frontend Engineer',
        department: 'Engineering',
        name: 'Ethan Expert',
        email: 'ethan.e@domain.org',
        mobileNo: '+1-650-555-1212',
        workExperience: '8 Years Fullstack',
        applicationDate: new Date(2023, 10, 5, 16, 20),
    },
    {
        id: 'APP006',
        status: 'rejected',
        jobId: 'JP002',
        jobTitle: 'Marketing Content Writer',
        department: 'Marketing',
        name: 'Fiona Fluff',
        email: 'fiona.f@email.io',
        mobileNo: null,
        workExperience: '1 Year Blogging',
        applicationDate: new Date(2023, 10, 6, 13, 0),
        notes: 'Writing samples did not meet requirements.',
    },
    {
        id: 'APP007',
        status: 'hired',
        jobId: 'JP004',
        jobTitle: 'Junior Accountant',
        department: 'Finance',
        name: 'George Graduate',
        email: 'george.g@mail.com',
        mobileNo: '+1-312-555-4444',
        workExperience: 'Internship',
        applicationDate: new Date(2023, 9, 18, 10, 0),
    },
    {
        id: 'APP008',
        status: 'withdrawn',
        jobId: 'JP006',
        jobTitle: 'Data Scientist',
        department: 'Data Science & Analytics',
        name: 'Heidi Highflyer',
        email: 'heidi.h@email.co',
        mobileNo: null,
        workExperience: '5 Years ML/Stats',
        applicationDate: new Date(2023, 10, 7, 15, 55),
        notes: 'Accepted another offer.',
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onView,
    onEdit,
    onDelete,
    onScheduleInterview,
    onAddJobLink, // New action prop
}: {
    onView: () => void
    onEdit: () => void
    onDelete: () => void
    onScheduleInterview: () => void
    onAddJobLink: () => void // New action prop
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-1">
            {' '}
            {/* Reduced gap slightly */}
            <Tooltip title="View Details">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
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
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
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
                        'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400',
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
                        'text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400',
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
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
}
// --- End ActionColumn ---

// --- ApplicationTable Component ---
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
    columns: ColumnDef<JobApplicationItem>[]
    data: JobApplicationItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedApplications: JobApplicationItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: JobApplicationItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<JobApplicationItem>[]) => void
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
    )
}
// --- End ApplicationTable ---

// --- ApplicationSearch Component ---
type ApplicationSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
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
    )
})
ApplicationSearch.displayName = 'ApplicationSearch'
// --- End ApplicationSearch ---

// --- ApplicationTableTools Component ---
const ApplicationTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <ApplicationSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
    // Filter button could be added here
}
// --- End ApplicationTableTools ---

// --- ApplicationActionTools Component ---
const ApplicationActionTools = ({
    allApplications,
}: {
    allApplications: JobApplicationItem[]
}) => {
    const navigate = useNavigate()
    // Add handlers for the top-level buttons
    const handleAddNewJob = () => navigate('/job-posts/create') // Go to create job post page
    const handleAddNewApplication = () => navigate('/job-applications/create') // Go to create application page

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
                variant="outline"
                icon={<TbBriefcase />}
                onClick={handleAddNewJob}
                block
                className="sm:w-auto"
            >
                {' '}
                Add New Job Link{' '}
            </Button>
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={handleAddNewApplication}
                block
                className="sm:w-auto"
            >
                {' '}
                Add New Application{' '}
            </Button>
            {/* Optional: Export button
             <CSVLink data={csvData} headers={csvHeaders} filename="applications.csv">
                <Button icon={<TbCloudDownload />} block className="sm:w-auto"> Download </Button>
            </CSVLink>
             */}
        </div>
    )
}
// --- End ApplicationActionTools ---

// --- ApplicationSelected Component ---
const ApplicationSelected = ({
    selectedApplications,
    setSelectedApplications,
    onDeleteSelected,
}: {
    selectedApplications: JobApplicationItem[]
    setSelectedApplications: React.Dispatch<
        React.SetStateAction<JobApplicationItem[]>
    >
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedApplications.length === 0) return null

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
                                {selectedApplications.length > 1
                                    ? 's'
                                    : ''}{' '}
                                selected
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
                        {/* Add other bulk actions: e.g., Change Status, Assign */}
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedApplications.length} Application${selectedApplications.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected application
                    {selectedApplications.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End ApplicationSelected ---

// --- Dialog Components ---
const ApplicationDetailDialog = ({
    isOpen,
    onClose,
    application,
}: {
    isOpen: boolean
    onClose: () => void
    application: JobApplicationItem | null
}) => {
    if (!application) return null
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
                    <strong>Status:</strong>{' '}
                    <Tag
                        className={`${applicationStatusColor[application.status]} text-white capitalize`}
                    >
                        {application.status.replace(/_/g, ' ')}
                    </Tag>
                </p>
                <p>
                    <strong>Job Applied For:</strong>{' '}
                    {application.jobTitle ?? 'General Application'}
                </p>
                <p>
                    <strong>Job ID:</strong> {application.jobId ?? 'N/A'}
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
                    <strong>Mobile:</strong> {application.mobileNo ?? 'N/A'}
                </p>
                <p>
                    <strong>Work Experience:</strong>{' '}
                    {application.workExperience}
                </p>
                <p>
                    <strong>Quantity:</strong>{' '}
                    {application.qty?.toString() ?? 'N/A'}
                </p>
                <p>
                    <strong>Application Date:</strong>{' '}
                    {application.applicationDate.toLocaleString()}
                </p>
                <p>
                    <strong>Job Application Link:</strong>{' '}
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
                        'Not Added'
                    )}
                </p>
            </div>
            <div className="mt-4">
                <h6 className="mb-2 font-semibold">
                    Requirement / Cover Letter:
                </h6>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-60 overflow-y-auto">
                    {application.coverLetter ??
                        application.requirement ??
                        'N/A'}
                </p>
            </div>
            <div className="mt-4">
                <h6 className="mb-2 font-semibold">Notes:</h6>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-40 overflow-y-auto">
                    {application.notes ?? 'No notes added.'}
                </p>
            </div>
            {/* Add link to resume if available */}
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
    )
}

const ScheduleInterviewDialog = ({
    isOpen,
    onClose,
    application,
}: {
    isOpen: boolean
    onClose: () => void
    application: JobApplicationItem | null
}) => {
    const [interviewDate, setInterviewDate] = useState<Date | null>(null)
    const [interviewer, setInterviewer] = useState('')
    const [notes, setNotes] = useState('')
    const [isScheduling, setIsScheduling] = useState(false)

    const handleSchedule = () => {
        if (!application || !interviewDate || !interviewer) {
            toast.push(
                <Notification title="Missing Information" type="warning">
                    Please select date/time and interviewer.
                </Notification>,
            )
            return
        }
        setIsScheduling(true)
        console.log(
            `Scheduling interview for ${application.name} (${application.id})`,
        )
        console.log({ date: interviewDate, interviewer, notes })
        // Simulate API call
        setTimeout(() => {
            toast.push(
                <Notification
                    title="Interview Scheduled"
                    type="success"
                >{`Interview scheduled for ${application.name}.`}</Notification>,
            )
            setIsScheduling(false)
            onClose() // Close dialog
        }, 1000)
    }

    React.useEffect(() => {
        // Reset state when dialog closes or application changes
        if (!isOpen) {
            setInterviewDate(null)
            setInterviewer('')
            setNotes('')
        }
    }, [isOpen])

    if (!application) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={500}
        >
            <h5 className="mb-4">Schedule Interview for {application.name}</h5>
            <p className="mb-4 text-sm">
                Applied for: {application.jobTitle ?? 'General Application'}
            </p>
            <FormContainer>
                <FormItem label="Interview Date & Time" className="mb-4">
                    <DatePicker
                        placeholder="Select date and time"
                        value={interviewDate}
                        onChange={(date) => setInterviewDate(date)}
                        inputFormat="DD/MM/YYYY hh:mm A"
                        inputPrefix={<HiOutlineCalendar className="text-lg" />}
                        showTimeInput // Enable time selection
                    />
                </FormItem>
                <FormItem label="Interviewer(s)" className="mb-4">
                    <Input
                        placeholder="Enter interviewer names (e.g., John Doe, Jane Smith)"
                        value={interviewer}
                        onChange={(e) => setInterviewer(e.target.value)}
                    />
                </FormItem>
                <FormItem label="Notes (Optional)">
                    <Input
                        textArea
                        placeholder="Any specific notes for the interview..."
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
    )
}

const AddJobLinkDialog = ({
    isOpen,
    onClose,
    application,
    onLinkSubmit,
}: {
    isOpen: boolean
    onClose: () => void
    application: JobApplicationItem | null
    onLinkSubmit: (applicationId: string, link: string) => void // Callback to update parent state
}) => {
    const [jobLink, setJobLink] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = () => {
        if (!application || !jobLink) {
            toast.push(
                <Notification title="Missing Link" type="warning">
                    Please enter the Job Application Link.
                </Notification>,
            )
            return
        }
        setIsSubmitting(true)
        console.log(`Adding link ${jobLink} to application ${application.id}`)
        // Simulate update
        setTimeout(() => {
            onLinkSubmit(application.id, jobLink) // Call parent handler to update the actual data
            toast.push(
                <Notification title="Link Added" type="success">
                    Job Application Link updated.
                </Notification>,
            )
            setIsSubmitting(false)
            onClose()
        }, 500)
    }

    // Set initial value if link already exists when dialog opens
    React.useEffect(() => {
        if (isOpen && application?.jobApplicationLink) {
            setJobLink(application.jobApplicationLink)
        } else if (!isOpen) {
            setJobLink('') // Reset on close
        }
    }, [isOpen, application])

    if (!application) return null

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
                        placeholder="https://example.com/application/123"
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
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    variant="solid"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                >
                    Save Link
                </Button>
            </div>
        </Dialog>
    )
}
// --- End Dialogs ---

// --- Main JobApplicationListing Component ---
const JobApplicationListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [applications, setApplications] = useState<JobApplicationItem[]>(
        initialDummyApplications,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedApplications, setSelectedApplications] = useState<
        JobApplicationItem[]
    >([])
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false)
    const [addJobLinkOpen, setAddJobLinkOpen] = useState(false)
    const [currentItem, setCurrentItem] = useState<JobApplicationItem | null>(
        null,
    ) // For all dialogs
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...applications]
        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (a) =>
                    a.id.toLowerCase().includes(query) ||
                    a.status.toLowerCase().includes(query) ||
                    a.name.toLowerCase().includes(query) ||
                    a.email.toLowerCase().includes(query) ||
                    (a.mobileNo?.toLowerCase().includes(query) ?? false) ||
                    a.department.toLowerCase().includes(query) ||
                    a.jobTitle?.toLowerCase().includes(query) ||
                    a.workExperience.toLowerCase().includes(query) ||
                    a.requirement?.toLowerCase().includes(query),
            )
        }
        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'applicationDate') {
                    return order === 'asc'
                        ? a.applicationDate.getTime() -
                              b.applicationDate.getTime()
                        : b.applicationDate.getTime() -
                              a.applicationDate.getTime()
                }
                if (key === 'qty') {
                    const qtyA =
                        typeof a.quantity === 'number' ? a.quantity : Infinity
                    const qtyB =
                        typeof b.quantity === 'number' ? b.quantity : Infinity
                    return order === 'asc' ? qtyA - qtyB : qtyB - qtyA
                } // Example: handle non-numeric qty

                const aValue = a[key as keyof JobApplicationItem] ?? ''
                const bValue = b[key as keyof JobApplicationItem] ?? ''
                if (aValue === null && bValue === null) return 0
                if (aValue === null) return order === 'asc' ? -1 : 1
                if (bValue === null) return order === 'asc' ? 1 : -1
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                return 0
            })
            processedData = sortedData
        }
        // Apply Pagination
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )
        return { pageData: dataForPage, total: dataTotal }
    }, [applications, tableData])
    // --- End Data Processing ---

    // --- Handlers ---
    const handleSetTableData = useCallback((data: TableQueries) => {
        setTableData(data)
    }, [])
    const handlePaginationChange = useCallback(
        (page: number) => {
            handleSetTableData({ ...tableData, pageIndex: page })
        },
        [tableData, handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({
                ...tableData,
                pageSize: Number(value),
                pageIndex: 1,
            })
            setSelectedApplications([])
        },
        [tableData, handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 })
        },
        [tableData, handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => {
            handleSetTableData({ ...tableData, query: query, pageIndex: 1 })
        },
        [tableData, handleSetTableData],
    )

    const handleRowSelect = useCallback(
        (checked: boolean, row: JobApplicationItem) => {
            setSelectedApplications((prev) => {
                if (checked) {
                    return prev.some((a) => a.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((a) => a.id !== row.id)
                }
            })
        },
        [setSelectedApplications],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<JobApplicationItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedApplications((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((a) => a.id))
                    const newSelection = originalRows.filter(
                        (a) => !existingIds.has(a.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((a) => !rowIds.has(a.id))
                }
            })
        },
        [setSelectedApplications],
    )

    // Action Handlers
    const handleViewDetails = useCallback((item: JobApplicationItem) => {
        setCurrentItem(item)
        setDetailViewOpen(true)
    }, [])
    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItem(null)
    }, [])
    const handleEdit = useCallback(
        (item: JobApplicationItem) => {
            console.log('Edit application:', item.id)
            navigate(`/job-applications/edit/${item.id}`)
        },
        [navigate],
    )
    const handleDelete = useCallback(
        (itemToDelete: JobApplicationItem) => {
            console.log('Deleting application:', itemToDelete.id)
            setApplications((current) =>
                current.filter((a) => a.id !== itemToDelete.id),
            )
            setSelectedApplications((prev) =>
                prev.filter((a) => a.id !== itemToDelete.id),
            )
            toast.push(
                <Notification
                    title="Application Deleted"
                    type="success"
                    duration={2000}
                >{`Application from ${itemToDelete.name} deleted.`}</Notification>,
            )
        },
        [setApplications, setSelectedApplications],
    )
    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected applications:',
            selectedApplications.map((a) => a.id),
        )
        const selectedIds = new Set(selectedApplications.map((a) => a.id))
        setApplications((current) =>
            current.filter((a) => !selectedIds.has(a.id)),
        )
        setSelectedApplications([])
        toast.push(
            <Notification
                title="Applications Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} application(s) deleted.`}</Notification>,
        )
    }, [selectedApplications, setApplications, setSelectedApplications])
    const handleScheduleInterview = useCallback((item: JobApplicationItem) => {
        setCurrentItem(item)
        setScheduleInterviewOpen(true)
    }, [])
    const handleCloseScheduleInterview = useCallback(() => {
        setScheduleInterviewOpen(false)
        setCurrentItem(null)
    }, [])
    const handleAddJobLink = useCallback((item: JobApplicationItem) => {
        setCurrentItem(item)
        setAddJobLinkOpen(true)
    }, [])
    const handleCloseAddJobLink = useCallback(() => {
        setAddJobLinkOpen(false)
        setCurrentItem(null)
    }, [])

    // Handler to update the link in the main state
    const handleSubmitJobLink = useCallback(
        (applicationId: string, link: string) => {
            setApplications((prevApps) =>
                prevApps.map((app) =>
                    app.id === applicationId
                        ? { ...app, jobApplicationLink: link }
                        : app,
                ),
            )
            handleCloseAddJobLink() // Close dialog after submit
        },
        [setApplications, handleCloseAddJobLink],
    ) // Include dependencies

    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<JobApplicationItem>[] = useMemo(
        () => [
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 140,
                cell: (props) => {
                    const { status } = props.row.original
                    const displayStatus = status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${applicationStatusColor[status]} text-white capitalize`}
                        >
                            {displayStatus}
                        </Tag>
                    )
                },
            },
            {
                header: 'Applicant',
                accessorKey: 'name',
                enableSorting: true,
                cell: (props) => {
                    const { name, email, avatar } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Avatar
                                size={28}
                                shape="circle"
                                src={avatar}
                                icon={<TbUserCircle />}
                            >
                                {' '}
                                {!avatar
                                    ? name.charAt(0).toUpperCase()
                                    : ''}{' '}
                            </Avatar>
                            <div className="ml-2 rtl:mr-2">
                                <span className="font-semibold">{name}</span>
                                <div className="text-xs text-gray-500">
                                    {email}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Mobile',
                accessorKey: 'mobileNo',
                enableSorting: false,
                width: 150,
                cell: (props) => (
                    <span>{props.row.original.mobileNo ?? '-'}</span>
                ),
            }, // Sorting mobile might be odd
            {
                header: 'Department',
                accessorKey: 'department',
                enableSorting: true,
            },
            {
                header: 'Experience',
                accessorKey: 'workExperience',
                enableSorting: true,
            },
            // { header: 'Quantity', accessorKey: 'quantity', ... }, // Removed quantity as less relevant
            {
                header: 'Applied Date',
                accessorKey: 'applicationDate',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.applicationDate
                    return (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                width: 180, // Wider for more actions
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onScheduleInterview={() =>
                            handleScheduleInterview(props.row.original)
                        }
                        onAddJobLink={() =>
                            handleAddJobLink(props.row.original)
                        }
                    />
                ),
            },
        ],
        [
            handleViewDetails,
            handleEdit,
            handleDelete,
            handleScheduleInterview,
            handleAddJobLink,
        ], // Dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Job Applications</h3>
                    <ApplicationActionTools allApplications={applications} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <ApplicationTableTools
                        onSearchChange={handleSearchChange}
                    />
                    {/* Filter component could be added here */}
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
                setSelectedApplications={setSelectedApplications}
                onDeleteSelected={handleDeleteSelected}
            />

            {/* Detail View Dialog */}
            <ApplicationDetailDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                application={currentItem}
            />

            {/* Schedule Interview Dialog */}
            <ScheduleInterviewDialog
                isOpen={scheduleInterviewOpen}
                onClose={handleCloseScheduleInterview}
                application={currentItem}
            />

            {/* Add Job Link Dialog */}
            <AddJobLinkDialog
                isOpen={addJobLinkOpen}
                onClose={handleCloseAddJobLink}
                application={currentItem}
                onLinkSubmit={handleSubmitJobLink} // Pass handler to update state
            />
        </Container>
    )
}
// --- End Main Component ---

export default JobApplicationListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
