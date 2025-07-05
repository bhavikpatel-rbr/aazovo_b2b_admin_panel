// src/views/your-path/MergedTaskList.tsx
import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from "@/components/shared/DebouceInput";
import {
    Form as UiFormComponents,
    FormItem as UiFormItem,
} from '@/components/ui/Form'
import Badge from '@/components/ui/Badge'
import { DatePicker, Dialog, Dropdown, Select, Input, Drawer, Checkbox } from '@/components/ui'

// Icons
import {
    TbPlus,
    TbPencil,
    TbChecks,
    TbSearch,
    TbCloudUpload,
    TbFilter,
    TbX,
    TbUserCircle,
    TbEye,
    TbMail,
    TbBrandWhatsapp,
    TbBell,
    TbUser,
    TbTagStarred,
    TbCalendarEvent,
    TbActivity,
    TbReload,
    TbAlignLeft,
    TbPaperclip,
    TbMessageCircle,
    TbColumns,
} from 'react-icons/tb'
import { BsThreeDotsVertical } from 'react-icons/bs'

// Types
import type {
    OnSortParam,
    ColumnDef,
    Row,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    getAllTaskAction,
    submitExportReasonAction,
    addNotificationAction,
    addScheduleAction,
    getAllUsersAction
} from '@/reduxtool/master/middleware'

// --- Consolidated Type Definitions ---

export type TaskStatus =
    | 'completed'
    | 'on_hold'
    | 'pending'
    | 'cancelled'
    | 'in_progress'
    | 'review'
    | 'not_started'

export interface TaskItem {
    id: string
    note: string
    status: TaskStatus
    assignTo: string[]
    createdBy: string
    createdDate: Date
    dueDate?: Date | null
    priority?: string
    category?: string
    description?: string
    comments?: any[]
    attachments?: any[]
    updated_at?: string
    updated_by_name?: string
    _originalData?: any
}

type FilterSelectOption = {
    value: string
    label: string
}
export type ModalType = 'notification' | 'schedule';
export interface ModalState {
    isOpen: boolean;
    type: ModalType | null;
    data: TaskItem | null;
}
export type SelectOption = { value: any; label: string };


const filterValidationSchema = z.object({
    status: z.array(z.string()).optional().default([]),
    assignTo: z.array(z.string()).optional().default([]),
})
export type FilterFormSchema = z.infer<typeof filterValidationSchema>

const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(1, 'Reason for export is required.')
        .max(255, 'Reason cannot exceed 255 characters.'),
})
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

const scheduleSchema = z.object({
    event_title: z.string().min(3, "Title must be at least 3 characters."),
    event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
    date_time: z.date({ required_error: "Event date & time is required." }),
    remind_from: z.date().nullable().optional(),
    notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- Constants ---
export const taskStatusColor: Record<TaskStatus, string> = {
    pending: 'bg-amber-500',
    in_progress: 'bg-blue-500',
    review: 'bg-purple-500',
    completed: 'bg-emerald-500',
    on_hold: 'bg-gray-500',
    cancelled: 'bg-red-500',
    not_started: 'bg-yellow-500',
}

const eventTypeOptions = [
    // Customer Engagement & Sales
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Demo', label: 'Product Demo' },
    { value: 'IntroCall', label: 'Introductory Call' },
    { value: 'FollowUpCall', label: 'Follow-up Call' },
    { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
    { value: 'CheckIn', label: 'Customer Check-in' },
    { value: 'LogEmail', label: 'Log an Email' },

    // Project & Task Management
    { value: 'Milestone', label: 'Project Milestone' },
    { value: 'Task', label: 'Task' },
    { value: 'FollowUp', label: 'General Follow-up' },
    { value: 'ProjectKickoff', label: 'Project Kick-off' },

    // Customer Onboarding & Support
    { value: 'OnboardingSession', label: 'Onboarding Session' },
    { value: 'Training', label: 'Training Session' },
    { value: 'SupportCall', label: 'Support Call' },

    // General & Administrative
    { value: 'Reminder', label: 'Reminder' },
    { value: 'Note', label: 'Add a Note' },
    { value: 'FocusTime', label: 'Focus Time (Do Not Disturb)' },
    { value: 'StrategySession', label: 'Strategy Session' },
    { value: 'TeamMeeting', label: 'Team Meeting' },
    { value: 'PerformanceReview', label: 'Performance Review' },
    { value: 'Lunch', label: 'Lunch / Break' },
    { value: 'Appointment', label: 'Personal Appointment' },
    { value: 'Other', label: 'Other' },
    { value: 'ProjectKickoff', label: 'Project Kick-off' },
    { value: 'InternalSync', label: 'Internal Team Sync' },
    { value: 'ClientUpdateMeeting', label: 'Client Update Meeting' },
    { value: 'RequirementsGathering', label: 'Requirements Gathering' },
    { value: 'UAT', label: 'User Acceptance Testing (UAT)' },
    { value: 'GoLive', label: 'Go-Live / Deployment Date' },
    { value: 'ProjectSignOff', label: 'Project Sign-off' },
    { value: 'PrepareReport', label: 'Prepare Report' },
    { value: 'PresentFindings', label: 'Present Findings' },
    { value: 'TroubleshootingCall', label: 'Troubleshooting Call' },
    { value: 'BugReplication', label: 'Bug Replication Session' },
    { value: 'IssueEscalation', label: 'Escalate Issue' },
    { value: 'ProvideUpdate', label: 'Provide Update on Ticket' },
    { value: 'FeatureRequest', label: 'Log Feature Request' },
    { value: 'IntegrationSupport', label: 'Integration Support Call' },
    { value: 'DataMigration', label: 'Data Migration/Import Task' },
    { value: 'ColdCall', label: 'Cold Call' },
    { value: 'DiscoveryCall', label: 'Discovery Call' },
    { value: 'QualificationCall', label: 'Qualification Call' },
    { value: 'SendFollowUpEmail', label: 'Send Follow-up Email' },
    { value: 'LinkedInMessage', label: 'Log LinkedIn Message' },
    { value: 'ProposalReview', label: 'Proposal Review Meeting' },
    { value: 'ContractSent', label: 'Contract Sent' },
    { value: 'NegotiationCall', label: 'Negotiation Call' },
    { value: 'TrialSetup', label: 'Product Trial Setup' },
    { value: 'TrialCheckIn', label: 'Trial Check-in Call' },
    { value: 'WelcomeCall', label: 'Welcome Call' },
    { value: 'ImplementationSession', label: 'Implementation Session' },
    { value: 'UserTraining', label: 'User Training Session' },
    { value: 'AdminTraining', label: 'Admin Training Session' },
    { value: 'MonthlyCheckIn', label: 'Monthly Check-in' },
    { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
    { value: 'HealthCheck', label: 'Customer Health Check' },
    { value: 'FeedbackSession', label: 'Feedback Session' },
    { value: 'RenewalDiscussion', label: 'Renewal Discussion' },
    { value: 'UpsellOpportunity', label: 'Upsell/Cross-sell Call' },
    { value: 'CaseStudyInterview', label: 'Case Study Interview' },
    { value: 'InvoiceDue', label: 'Invoice Due' },
    { value: 'SendInvoice', label: 'Send Invoice' },
    { value: 'PaymentReminder', label: 'Send Payment Reminder' },
    { value: 'ChaseOverduePayment', label: 'Chase Overdue Payment' },
    { value: 'ConfirmPayment', label: 'Confirm Payment Received' },
    { value: 'ContractRenewalDue', label: 'Contract Renewal Due' },
    { value: 'DiscussBilling', label: 'Discuss Billing/Invoice' },
    { value: 'SendQuote', label: 'Send Quote/Estimate' },
]


// --- CSV Exporter Utility ---
const TASK_CSV_HEADERS = [
    'ID',
    'Title',
    'Status',
    'Assigned To',
    'Created By',
    'Created Date',
    'Due Date',
    'Priority',
    'Category',
    'Description',
    'Last Updated',
    'Updated By',
]

type TaskExportItem = {
    id: string
    note: string
    status: string
    assignToString: string
    createdBy: string
    createdDateFormatted: string
    dueDateFormatted: string
    priority: string
    category: string
    description: string
    updated_at_formatted?: string
    updated_by_name?: string
}

const exportTaskToCsv = (filename: string, rows: TaskItem[]) => {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        )
        return false
    }

    const transformedRows: TaskExportItem[] = rows.map((row) => ({
        id: row.id,
        note: row.note,
        status: row.status.replace(/_/g, ' '),
        assignToString: Array.isArray(row.assignTo)
            ? row.assignTo.join('; ')
            : '',
        createdBy: row.createdBy,
        createdDateFormatted: row.createdDate.toLocaleDateString(),
        dueDateFormatted: row.dueDate
            ? row.dueDate.toLocaleDateString()
            : 'N/A',
        priority: row.priority || 'N/A',
        category: row.category || 'N/A',
        description: row.description || 'N/A',
        updated_at_formatted: row.updated_at
            ? new Date(row.updated_at).toLocaleString()
            : 'N/A',
        updated_by_name: row.updated_by_name || 'N/A',
    }))

    const CSV_KEYS_EXPORT_DYNAMIC: (keyof TaskExportItem)[] = [
        'id',
        'note',
        'status',
        'assignToString',
        'createdBy',
        'createdDateFormatted',
        'dueDateFormatted',
        'priority',
        'category',
        'description',
        'updated_at_formatted',
        'updated_by_name',
    ]

    const separator = ','
    const csvContent =
        TASK_CSV_HEADERS.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return CSV_KEYS_EXPORT_DYNAMIC.map((k) => {
                    let cell = row[k]
                    if (cell === null || cell === undefined) {
                        cell = ''
                    } else {
                        cell = String(cell).replace(/"/g, '""')
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`
                    }
                    return cell
                }).join(separator)
            })
            .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.push(
            <Notification title="Export Successful" type="success">
                Data exported to {filename}.
            </Notification>,
        )
        return true
    }
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
        </Notification>,
    )
    return false
}


// --- TaskViewModal Component ---
interface TaskViewModalProps {
    task: TaskItem | null
    isOpen: boolean
    onClose: () => void
}

const TaskViewModal: React.FC<TaskViewModalProps> = ({
    task,
    isOpen,
    onClose,
}) => {
    if (!task) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title={
                <span className="truncate max-w-md">
                    Task Details: {task.note}
                </span>
            }
        >
            <div className="p-1 sm:p-4 space-y-3 overflow-y-auto max-h-[75vh]">
                <div className="border-b pb-3">
                    <h6 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                        General Information
                    </h6>
                    <p className="text-sm">
                        <strong>ID:</strong> {task.id}
                    </p>
                    <p className="text-sm">
                        <strong>Title:</strong> {task.note}
                    </p>
                    <p className="text-sm flex items-center">
                        <strong>Status:</strong>
                        <Tag
                            className={`ml-2 text-white capitalize text-xs px-1.5 py-0.5 ${taskStatusColor[task.status] || 'bg-gray-400'
                                }`}
                        >
                            {task.status.replace(/_/g, ' ')}
                        </Tag>
                    </p>
                    {task.priority && (
                        <p className="text-sm">
                            <strong>Priority:</strong> {task.priority}
                        </p>
                    )}
                    {task.category && (
                        <p className="text-sm">
                            <strong>Category:</strong> {task.category}
                        </p>
                    )}
                </div>

                <div className="border-b pb-3">
                    <h6 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                        Dates
                    </h6>
                    <p className="text-sm flex items-center gap-1.5">
                        <TbCalendarEvent className="text-lg text-gray-500" />{' '}
                        <strong>Created:</strong>{' '}
                        {task.createdDate.toLocaleString()}
                    </p>
                    {task.dueDate && (
                        <p className="text-sm flex items-center gap-1.5">
                            <TbCalendarEvent className="text-lg text-gray-500" />{' '}
                            <strong>Due:</strong> {task.dueDate.toLocaleString()}
                        </p>
                    )}
                    {task.updated_at && (
                        <p className="text-sm flex items-center gap-1.5">
                            <TbCalendarEvent className="text-lg text-gray-500" />{' '}
                            <strong>Last Updated:</strong>{' '}
                            {new Date(task.updated_at).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="border-b pb-3">
                    <h6 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                        People
                    </h6>
                    <div className="text-sm flex items-center gap-1.5 mb-1">
                        <Avatar
                            size={20}
                            shape="circle"
                            icon={<TbUserCircle />}
                        />
                        <strong>Created By:</strong> {task.createdBy}
                    </div>
                    {task.updated_by_name && (
                        <div className="text-sm flex items-center gap-1.5 mb-1">
                            <Avatar
                                size={20}
                                shape="circle"
                                icon={<TbUserCircle />}
                            />
                            <strong>Updated By:</strong> {task.updated_by_name}
                        </div>
                    )}
                    {task.assignTo.length > 0 && (
                        <div className="text-sm mt-1">
                            <strong>Assigned To:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {task.assignTo.map((assignee) => (
                                    <Tag
                                        key={assignee}
                                        className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100 text-xs px-1.5 py-0.5"
                                    >
                                        {assignee}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {task.description && (
                    <div className="border-b pb-3">
                        <h6 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                            <TbAlignLeft className="text-lg text-gray-500" />{' '}
                            Description
                        </h6>
                        <p className="text-sm whitespace-pre-wrap">
                            {task.description}
                        </p>
                    </div>
                )}

                {task.comments && task.comments.length > 0 && (
                    <div className="border-b pb-3">
                        <h6 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                            <TbMessageCircle className="text-lg text-gray-500" />{' '}
                            Activity Notes
                        </h6>
                        <ul className="space-y-1.5 text-sm max-h-60 overflow-y-auto pr-2">
                            {task.comments.map((comment: any, index: number) => (
                                <li key={comment.id || index} className="border-l-2 border-gray-200 dark:border-gray-600 pl-2 py-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium">
                                            {comment.user?.name || 'System User'}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(
                                                comment.created_at,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">
                                        {comment.activity_comment}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {task.attachments && task.attachments.length > 0 && (
                    <div className="border-b pb-3">
                        <h6 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                            <TbPaperclip className="text-lg text-gray-500" />{' '}
                            Attachments
                        </h6>
                        <ul className="space-y-1 text-sm">
                            {task.attachments.map(
                                (attachment: any, index: number) => (
                                    <li key={attachment.id || index}>
                                        <a
                                            href={attachment.attachment_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {attachment.attachment_name}
                                        </a>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">
                                            ({attachment.attachment_type})
                                        </span>
                                    </li>
                                ),
                            )}
                        </ul>
                    </div>
                )}
                {!task.description && (!task.comments || task.comments.length === 0) && (!task.attachments || task.attachments.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No additional details, comments, or attachments for this task.</p>
                )}
            </div>
        </Dialog>
    )
}

// --- Reusable Components ---

export const ActionColumn = ({
    onEdit,
    onView,
    onChangeStatus,
    onDelete,
    onOpenModal,
}: {
    onEdit: () => void
    onView: () => void
    onChangeStatus?: () => void
    onDelete?: () => void
    onOpenModal: (type: ModalType) => void;
}) => {
    const iconButtonClass =
        'text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-center">
            <Tooltip title="Edit Task">
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
            <Dropdown
                renderTitle={
                    <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
                }
            >
                <Dropdown.Item className="flex items-center gap-2">
                    <TbMail size={18} />
                    <span className="text-xs">Send Email</span>
                </Dropdown.Item>

                <Dropdown.Item className="flex items-center gap-2">
                    <TbBrandWhatsapp size={18} />
                    <span className="text-xs">Send Whatsapp</span>
                </Dropdown.Item>

                <Dropdown.Item className="flex items-center gap-2" onClick={() => onOpenModal('notification')}>
                    <TbBell size={18} />
                    <span className="text-xs">Add Notification</span>
                </Dropdown.Item>

                <Dropdown.Item className="flex items-center gap-2" onClick={() => onOpenModal('schedule')}>
                    <TbCalendarEvent size={18} />
                    <span className="text-xs">Add Schedule</span>
                </Dropdown.Item>

                <Dropdown.Item className="flex items-center gap-2">
                    <TbTagStarred size={18} />
                    <span className="text-xs">Add Active</span>
                </Dropdown.Item>

                <Dropdown.Item className="flex items-center gap-2">
                    <TbActivity size={18} />
                    <span className="text-xs">Add / View Activity</span>
                </Dropdown.Item>
            </Dropdown>

        </div>
    )
}

export const TaskTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedTasks,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<TaskItem>[]
    data: TaskItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedTasks: TaskItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: TaskItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<TaskItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedTasks.some((selected) => selected.id === row.id)
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

type TaskSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
export const TaskSearch = React.forwardRef<HTMLInputElement, TaskSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick Search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
TaskSearch.displayName = 'TaskSearch'

export const TaskFilter = ({
    filterData,
    setFilterData,
    uniqueAssignees,
    uniqueStatuses,
}: {
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
    uniqueAssignees: string[]
    uniqueStatuses: TaskStatus[]
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const openDialog = () => setIsOpen(true)
    const onDialogClose = () => setIsOpen(false)

    const { control, handleSubmit, reset } = useForm<FilterFormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(filterValidationSchema),
    })

    useEffect(() => {
        reset(filterData)
    }, [filterData, reset])

    const onSubmit = (values: FilterFormSchema) => {
        setFilterData(values)
        onDialogClose()
    }

    const handleReset = () => {
        const defaultVals = filterValidationSchema.parse({})
        reset(defaultVals)
        setFilterData(defaultVals)
        onDialogClose()
    }

    const activeFilterCount =
        (filterData.status?.length || 0) +
        (filterData.assignTo?.length || 0)

    const statusOptions: FilterSelectOption[] = uniqueStatuses.map((s) => ({
        value: s,
        label: s
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()),
    }))

    const assigneeOptions: FilterSelectOption[] = uniqueAssignees.map(
        (name) => ({
            value: name,
            label: name,
        }),
    )

    return (
        <>
            <Button icon={<TbFilter />} onClick={openDialog} className="relative">
                <span>Filter</span>{' '}
                {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}
            </Button>
            <Drawer
                title="Filters"
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={handleReset}
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={handleSubmit(onSubmit)}
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <UiFormComponents
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-y-4"
                >
                    <UiFormItem label="Status">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Status"
                                    options={statusOptions}
                                    value={statusOptions.filter((opt) =>
                                        field.value?.includes(opt.value),
                                    )}
                                    onChange={(selectedVal: any) =>
                                        field.onChange(
                                            selectedVal
                                                ? selectedVal.map(
                                                    (opt: any) => opt.value,
                                                )
                                                : [],
                                        )
                                    }
                                    isMulti
                                />
                            )}
                        />
                    </UiFormItem>

                    <UiFormItem label="Assigned To">
                        <Controller
                            name="assignTo"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Assignees"
                                    options={assigneeOptions}
                                    value={assigneeOptions.filter((opt) =>
                                        field.value?.includes(opt.value),
                                    )}
                                    onChange={(selectedVal: any) =>
                                        field.onChange(
                                            selectedVal
                                                ? selectedVal.map(
                                                    (opt: any) => opt.value,
                                                )
                                                : [],
                                        )
                                    }
                                    isMulti
                                />
                            )}
                        />
                    </UiFormItem>
                    <UiFormItem label="Created Date">
                        <DatePicker.DatePickerRange placeholder="Select Date Range"
                        />
                    </UiFormItem>
                    <UiFormItem label="Due Date">
                        <DatePicker.DatePickerRange placeholder="Select Date Range"
                        />
                    </UiFormItem>
                </UiFormComponents>
            </Drawer>
        </>
    )
}

export const TaskTableTools = ({
    onSearchChange,
    filterData,
    setFilterData,
    uniqueAssignees,
    uniqueStatuses,
    onExport,
    onClearFilters,
    columns,
    visibleColumns,
    onColumnToggle,
    isDashboard
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
    uniqueAssignees: string[]
    uniqueStatuses: TaskStatus[]
    onExport: () => void
    onClearFilters: () => void
    columns: ColumnDef<TaskItem>[]
    visibleColumns: ColumnDef<TaskItem>[]
    onColumnToggle: (checked: boolean, colId: string) => void
    isDashboard: boolean
}) => {
    const isColumnVisible = (colId: string) =>
        visibleColumns.some((c) => (c.id || c.accessorKey) === colId)

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <TaskSearch onInputChange={onSearchChange} />
            </div>
            {!isDashboard && <div className="flex items-center gap-2 flex-shrink-0">
                <Dropdown
                    renderTitle={
                        <Button
                            icon={<TbColumns />}

                        />
                    }
                    placement="bottom-end"
                >
                    <div className="flex flex-col p-2">
                        <div className="font-semibold mb-1 border-b pb-1">
                            Toggle Columns
                        </div>
                        {columns.map((col) => {
                            const id = col.id || (col.accessorKey as string)
                            if (!col.header) return null
                            return (
                                <div
                                    key={id}
                                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"
                                >
                                    <Checkbox
                                        checked={isColumnVisible(id)}
                                        onChange={(checked) =>
                                            onColumnToggle(checked, id)
                                        }
                                    >
                                        {col.header as string}
                                    </Checkbox>
                                </div>
                            )
                        })}
                    </div>
                </Dropdown>
                <Tooltip title="Clear Filters & Reload">
                    <Button
                        icon={<TbReload />}
                        onClick={onClearFilters}

                    />
                </Tooltip>
                <TaskFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                    uniqueAssignees={uniqueAssignees}
                    uniqueStatuses={uniqueStatuses}
                />
                <Button icon={<TbCloudUpload />} onClick={onExport}>
                    Export
                </Button>
            </div>}
        </div>
    )
}

export const ActiveFiltersDisplay = ({
    filterData,
    onRemoveFilter,
    onClearAll,
}: {
    filterData: FilterFormSchema
    onRemoveFilter: (key: keyof FilterFormSchema, value: string) => void
    onClearAll: () => void
}) => {
    const activeStatuses = filterData.status || []
    const activeAssignees = filterData.assignTo || []
    const hasActiveFilters =
        activeStatuses.length > 0 || activeAssignees.length > 0

    if (!hasActiveFilters) return null

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {activeStatuses.map((stat) => (
                <Tag
                    key={`stat-${stat}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    <span className="capitalize">{stat.replace(/_/g, ' ')}</span>
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('status', stat)}
                    />
                </Tag>
            ))}
            {activeAssignees.map((user) => (
                <Tag
                    key={`user-${user}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {user}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('assignTo', user)}
                    />
                </Tag>
            ))}
            {hasActiveFilters && (
                <Button
                    size="xs"
                    variant="plain"
                    className="text-red-600 hover:text-red-500 hover:underline ml-auto"
                    onClick={onClearAll}
                >
                    Clear All
                </Button>
            )}
        </div>
    )
}

export const TaskSelected = ({
    selectedTasks,
    setSelectedTasks,
    onDeleteSelected,
}: {
    selectedTasks: TaskItem[]
    setSelectedTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedTasks.length === 0) return null

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
                                {selectedTasks.length}
                            </span>
                            <span>
                                Task{selectedTasks.length > 1 ? 's' : ''}{' '}
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
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedTasks.length} Task${selectedTasks.length > 1 ? 's' : ''
                    }`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected task
                    {selectedTasks.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

const TaskListActionTools = ({ pageTitle }: { pageTitle: string }) => {
    const navigate = useNavigate()
    const handleAddNewTask = () => {
        navigate('/task/task-list/create')
    }
    return (
        <Button variant="solid" icon={<TbPlus />} onClick={handleAddNewTask}>
            Add New Task
        </Button>
    )
}

// --- Notification Dialog ---
const AddNotificationDialog = ({ task, onClose, getAllUserDataOptions }: { task: TaskItem, onClose: () => void, getAllUserDataOptions: SelectOption[] }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const notificationSchema = z.object({
        notification_title: z.string().min(3, "Title must be at least 3 characters long."),
        send_users: z.array(z.number()).min(1, "Please select at least one user."),
        message: z.string().min(10, "Message must be at least 10 characters long."),
    });

    type NotificationFormData = z.infer<typeof notificationSchema>;

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            notification_title: `Regarding Task: ${task.note}`,
            send_users: [],
            message: `This is a notification for the task: "${task.note}".`
        },
        mode: 'onChange'
    });

    const onSend = async (formData: NotificationFormData) => {
        setIsLoading(true);
        const payload = {
            send_users: formData.send_users,
            notification_title: formData.notification_title,
            message: formData.message,
            module_id: String(task.id),
            module_name: 'Task',
        };

        try {
            await dispatch(addNotificationAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Notification Sent Successfully!" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Notify about: {task.note}</h5>
            <UiFormComponents onSubmit={handleSubmit(onSend)}>
                <UiFormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}>
                    <Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} />
                </UiFormItem>
                <UiFormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}>
                    <Controller
                        name="send_users"
                        control={control}
                        render={({ field }) => (
                            <Select
                                isMulti
                                placeholder="Select User(s)"
                                options={getAllUserDataOptions}
                                value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))}
                                onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])}
                            />
                        )}
                    />
                </UiFormItem>
                <UiFormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}>
                    <Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} />
                </UiFormItem>
                <div className="text-right mt-6">
                    <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button>
                </div>
            </UiFormComponents>
        </Dialog>
    );
};

// --- AddScheduleDialog Component ---
const AddScheduleDialog: React.FC<{ task: TaskItem; onClose: () => void }> = ({ task, onClose }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            event_title: `Regarding Task: ${task.note}`,
            event_type: undefined,
            date_time: null as any,
            remind_from: null,
            notes: `Details for task "${task.note}".`,
        },
        mode: 'onChange',
    });

    const onAddEvent = async (data: ScheduleFormData) => {
        setIsLoading(true);
        const payload = {
            module_id: Number(task.id),
            module_name: 'Task',
            event_title: data.event_title,
            event_type: data.event_type,
            date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
            ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
            notes: data.notes || '',
        };

        try {
            await dispatch(addScheduleAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for task "${task.note}".`} />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Add Schedule for Task: {task.note}</h5>
            <UiFormComponents onSubmit={handleSubmit(onAddEvent)}>
                <UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}>
                    <Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} />
                </UiFormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}>
                        <Controller name="event_type" control={control} render={({ field }) => (
                            <Select placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />
                        )} />
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
            </UiFormComponents>
        </Dialog>
    );
};


const TaskModals = ({ modalState, onClose, getAllUserDataOptions }: { modalState: ModalState, onClose: () => void, getAllUserDataOptions: SelectOption[] }) => {
    const { type, data: task, isOpen } = modalState;
    if (!isOpen || !task) return null;

    switch (type) {
        case 'notification':
            return <AddNotificationDialog task={task} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
        case 'schedule':
            return <AddScheduleDialog task={task} onClose={onClose} />;
        default:
            return null;
    }
};

// --- Data Transformation Helper ---
const transformApiTaskToTaskItem = (apiTask: any): TaskItem => {
    let assignToArray: string[] = []
    if (
        apiTask.assign_to_users &&
        Array.isArray(apiTask.assign_to_users) &&
        apiTask.assign_to_users.length > 0
    ) {
        assignToArray = apiTask.assign_to_users.map(
            (user: any) => user.name || `User ID ${user.id}`,
        )
    } else if (
        apiTask.assign_to &&
        Array.isArray(apiTask.assign_to) &&
        apiTask.assign_to.length > 0
    ) {
        assignToArray = apiTask.assign_to.map(
            (id: string) => `User ID ${id}`,
        )
    }


    const statusString = apiTask.status || 'pending'
    let transformedStatus = statusString
        .toLowerCase()
        .replace(/\s+/g, '_') as TaskStatus

    const validStatuses: TaskStatus[] = ['completed', 'on_hold', 'pending', 'cancelled', 'in_progress', 'review', 'not_started'];
    if (!validStatuses.includes(transformedStatus)) {
        transformedStatus = 'pending';
    }


    return {
        id: String(apiTask.id),
        note: apiTask.task_title || 'No Title Provided',
        status: transformedStatus,
        assignTo: assignToArray,
        createdBy:
            apiTask.created_by_user?.name ||
            apiTask.created_user_info?.name ||
            (apiTask.user_id ? `User ID ${apiTask.user_id}` : 'Unknown Creator'),
        createdDate: apiTask.created_at
            ? new Date(apiTask.created_at)
            : new Date(),
        dueDate: apiTask.due_data ? new Date(apiTask.due_data) : null,
        priority: apiTask.priority || undefined,
        category: apiTask.module_name || undefined,
        description:
            apiTask.note_remark ||
            apiTask.additional_description ||
            undefined,
        comments: apiTask.activity_notes || [],
        attachments: apiTask.attachments || [],
        updated_at: apiTask.updated_at,
        updated_by_name: apiTask.updated_by_user?.name || undefined,
        _originalData: apiTask,
    }
}

// --- useTaskListingLogic Hook ---
export const useTaskListingLogic = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const {
        AllTaskData = [],
        status: masterLoadingStatus = 'idle',
        getAllUserData = [],
    } = useSelector(masterSelector, shallowEqual)

    const [isLoading, setIsLoading] = useState(false)
    const [tasks, setTasks] = useState<TaskItem[]>([])
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedTasks, setSelectedTasks] = useState<TaskItem[]>([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )

    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false)
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false)
    const exportReasonFormMethods = useForm<ExportReasonFormData>({
        resolver: zodResolver(exportReasonSchema),
        defaultValues: { reason: '' },
        mode: 'onChange',
    })

    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewingTask, setViewingTask] = useState<TaskItem | null>(null)
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
    const [visibleColumns, setVisibleColumns] = useState<ColumnDef<TaskItem>[]>([])


    const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);


    useEffect(() => {
        dispatch(getAllTaskAction())
        dispatch(getAllUsersAction())
    }, [dispatch])

    useEffect(() => {
        setIsLoading(masterLoadingStatus === 'loading')
        if (
            masterLoadingStatus === 'idle' &&
            AllTaskData &&
            Array.isArray(AllTaskData)
        ) {
            const transformed = AllTaskData.map(transformApiTaskToTaskItem)
            setTasks(transformed)
        } else if (masterLoadingStatus === 'failed') {
            toast.push(
                <Notification
                    title="Error Loading Tasks"
                    type="danger"
                    duration={3000}
                >
                    There was an issue fetching the task list.
                </Notification>,
            )
            setTasks([])
        }
    }, [AllTaskData, masterLoadingStatus])

    const uniqueAssignees = useMemo(() => {
        const allAssignees = tasks.flatMap((t) =>
            Array.isArray(t.assignTo)
                ? t.assignTo
                : [t.assignTo].filter(Boolean) as string[],
        )
        return Array.from(new Set(allAssignees)).sort()
    }, [tasks])

    const uniqueStatuses = useMemo(
        () =>
            Array.from(new Set(tasks.map((t) => t.status))).sort() as TaskStatus[],
        [tasks],
    )

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData = cloneDeep(tasks)

        if (filterData.status && filterData.status.length > 0) {
            const statusSet = new Set(filterData.status)
            processedData = processedData.filter((t) => statusSet.has(t.status))
        }
        if (filterData.assignTo && filterData.assignTo.length > 0) {
            const assignToSet = new Set(filterData.assignTo)
            processedData = processedData.filter((t) =>
                Array.isArray(t.assignTo)
                    ? t.assignTo.some((assignee) => assignToSet.has(assignee))
                    : false,
            )
        }

        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (t) =>
                    t.id.toLowerCase().includes(query) ||
                    t.note.toLowerCase().includes(query) ||
                    (Array.isArray(t.assignTo) &&
                        t.assignTo.some((a) => a.toLowerCase().includes(query))) ||
                    t.createdBy.toLowerCase().includes(query) ||
                    t.status.toLowerCase().includes(query) ||
                    (t.category && t.category.toLowerCase().includes(query)) ||
                    (t.priority && t.priority.toLowerCase().includes(query)),
            )
        }

        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            processedData.sort((a, b) => {
                let valA: any = a[key as keyof TaskItem]
                let valB: any = b[key as keyof TaskItem]

                if (key === 'createdDate' || key === 'dueDate') {
                    valA = valA ? new Date(valA).getTime() : 0
                    valB = valB ? new Date(valB).getTime() : 0
                } else if (typeof valA === 'string') {
                    valA = valA.toLowerCase()
                }
                if (typeof valB === 'string') {
                    valB = valB.toLowerCase()
                }

                if (valA === null || valA === undefined)
                    return order === 'asc' ? 1 : -1
                if (valB === null || valB === undefined)
                    return order === 'asc' ? -1 : 1

                if (valA < valB) return order === 'asc' ? -1 : 1
                if (valA > valB) return order === 'asc' ? 1 : -1
                return 0
            })
        }

        const dataTotal = processedData.length
        const pageIndexVal = tableData.pageIndex as number
        const pageSizeVal = tableData.pageSize as number
        const startIndex = (pageIndexVal - 1) * pageSizeVal
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSizeVal,
        )

        return {
            pageData: dataForPage,
            total: dataTotal,
            allFilteredAndSortedData: processedData,
        }
    }, [tasks, tableData, filterData])

    const handleSetTableData = useCallback(
        (data: Partial<TableQueries>) => {
            setTableData((prev) => ({ ...prev, ...data }))
        },
        [],
    )

    const handleApplyFilter = useCallback(
        (newFilterData: FilterFormSchema) => {
            setFilterData(newFilterData)
            handleSetTableData({ pageIndex: 1 })
            setSelectedTasks([])
        },
        [handleSetTableData],
    )

    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )

    const handleSelectChange = useCallback(
        (value: number) =>
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
        [handleSetTableData],
    )

    const handleSort = useCallback(
        (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
        [handleSetTableData],
    )

    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )

    const handleRemoveFilter = useCallback(
        (key: keyof FilterFormSchema, value: string) => {
            setFilterData((prev) => {
                const currentValues = prev[key] || []
                const newValues = currentValues.filter((item) => item !== value)
                const updatedFilterData = { ...prev, [key]: newValues }
                handleSetTableData({ pageIndex: 1 })
                setSelectedTasks([])
                return updatedFilterData
            })
        },
        [handleSetTableData],
    )

    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({})
        setFilterData(defaultFilters)
        handleSetTableData({ pageIndex: 1, query: '' })
        setSelectedTasks([])
    }, [handleSetTableData])

    const handleRowSelect = useCallback((checked: boolean, row: TaskItem) => {
        setSelectedTasks((prev) =>
            checked
                ? [...prev, row]
                : prev.filter((item) => item.id !== row.id),
        )
    }, [])
    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<TaskItem>[]) => {
            setSelectedTasks(checked ? rows.map((r) => r.original) : [])
        },
        [],
    )

    const handleEdit = useCallback(
        (task: TaskItem) => {
            navigate(`/task/task-list/create/${task.id}`, {
                state: { taskToEdit: task },
            })
        },
        [navigate],
    )
    const handleDelete = useCallback(
        (taskToDelete: TaskItem) => {
            setTasks((prev) =>
                prev.filter((task) => task.id !== taskToDelete.id),
            )
            setSelectedTasks((prev) =>
                prev.filter((task) => task.id !== taskToDelete.id),
            )
            toast.push(
                <Notification title="Task Deleted" type="success">
                    Task "{taskToDelete.note}" has been deleted.
                </Notification>,
            )
        },
        [setTasks, setSelectedTasks],
    )
    const handleChangeStatus = useCallback(
        (taskToUpdate: TaskItem, newStatus: TaskStatus = 'completed') => {
            setTasks(prevTasks => prevTasks.map(task =>
                task.id === taskToUpdate.id ? { ...task, status: newStatus } : task
            ));
            toast.push(<Notification title="Status Updated" type="success" children={`Task "${taskToUpdate.note}" marked as ${newStatus.replace(/_/g, " ")}.`} />);
        },
        [setTasks]
    );
    const handleDeleteSelected = useCallback(() => {
        setTasks((prev) =>
            prev.filter((task) => !selectedTasks.find((s) => s.id === task.id)),
        )
        setSelectedTasks([])
        toast.push(
            <Notification title="Tasks Deleted" type="success">
                Selected tasks have been deleted.
            </Notification>,
        )
    }, [selectedTasks, setTasks, setSelectedTasks])

    const handleOpenExportReasonModal = () => {
        if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
            toast.push(
                <Notification title="No Data" type="info">
                    Nothing to export.
                </Notification>,
            )
            return
        }
        exportReasonFormMethods.reset({ reason: '' })
        setIsExportReasonModalOpen(true)
    }

    const handleConfirmExportWithReason = async (
        data: ExportReasonFormData,
    ) => {
        setIsSubmittingExportReason(true)
        const moduleName = 'Tasks'
        const timestamp = new Date().toISOString().split('T')[0]
        const fileName = `tasks_export_${timestamp}.csv`
        try {
            await dispatch(
                submitExportReasonAction({
                    reason: data.reason,
                    module: moduleName,
                    file_name: fileName,
                }),
            ).unwrap()
            toast.push(
                <Notification title="Export Reason Submitted" type="success" />,
            )
            exportTaskToCsv(fileName, allFilteredAndSortedData)
            setIsExportReasonModalOpen(false)
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Submit Reason"
                    type="danger"
                    children={error.message || 'Unknown error occurred'}
                />,
            )
        } finally {
            setIsSubmittingExportReason(false)
        }
    }

    const handleOpenViewModal = useCallback((task: TaskItem) => {
        setViewingTask(task)
        setIsViewModalOpen(true)
    }, [])

    const handleCloseViewModal = useCallback(() => {
        setIsViewModalOpen(false)
        setViewingTask(null)
    }, [])

    const handleOpenModal = useCallback((type: ModalType, itemData: TaskItem) => {
        setModalState({ isOpen: true, type, data: itemData });
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalState({ isOpen: false, type: null, data: null });
    }, []);


    const columns: ColumnDef<TaskItem>[] = useMemo(
        () => [
            {
                header: 'Created By',
                accessorKey: 'createdBy',
                enableSorting: true,
                size: 160,
                cell: (props) => {
                    const createdBy = props.row.original.createdBy
                    const initials = createdBy
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    return (
                        <div className="flex items-center gap-1.5 text-xs">
                            <Avatar size={32} shape="circle">
                                {initials || <TbUserCircle />}
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">
                                    {createdBy}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {(props.row.original._originalData as any)?.created_by_user?.roles?.[0]?.display_name || ''}
                                </span>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Task',
                accessorKey: 'note',
                enableSorting: true,
                size: 280,
                cell: (props) => {
                    const task = props.row.original
                    return (
                        <div className="flex flex-col gap-0.5 text-[12px]">
                            <Tooltip title={task.note}>
                                <span className="font-semibold items-center whitespace-nowrap text-ellipsis max-w-[270px] overflow-hidden">
                                    {task.note}
                                </span>
                            </Tooltip>
                            <span className="text-gray-600 dark:text-gray-300">
                                Created:{' '}
                                {task.createdDate.toLocaleDateString()}
                            </span>
                            {task.dueDate && (
                                <span className="text-gray-600 dark:text-gray-300">
                                    Due: {task.dueDate.toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: 'Details',
                accessorKey: 'category',
                enableSorting: true,
                size: 200,
                cell: (props) => {
                    const task = props.row.original
                    return (
                        <div className="flex flex-col gap-1 text-[12px]">
                            {task.category && (
                                <span className="flex items-center gap-1">
                                    <b className="font-semibold">Category:</b>
                                    <Tag className="text-xs bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100">
                                        {task.category}
                                    </Tag>
                                </span>
                            )}
                            {task.priority && (
                                <span className="flex items-center gap-1">
                                    <b className="font-semibold">Priority:</b>
                                    <Tag className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-100">
                                        {task.priority}
                                    </Tag>
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: 'Assigned To',
                accessorKey: 'assignTo',
                enableSorting: false,
                size: 150,
                cell: (props) => {
                    const task = props.row.original
                    return (
                        <div className="flex flex-col gap-1.5 items-start">
                            {Array.isArray(task.assignTo) &&
                                task.assignTo.length > 0 ? (
                                <Avatar.Group
                                    chained
                                    maxCount={3}
                                    omittedAvatarProps={{
                                        shape: 'circle',
                                        size: 28,
                                    }}
                                    omittedAvatarTooltip
                                >
                                    {task.assignTo.map((assigneeName) => (
                                        <Tooltip
                                            key={assigneeName}
                                            title={assigneeName}
                                        >
                                            <Avatar size={28} shape="circle">
                                                {assigneeName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </Avatar>
                                        </Tooltip>
                                    ))}
                                </Avatar.Group>
                            ) : (
                                <span className="text-xs text-gray-500">
                                    Unassigned
                                </span>
                            )}
                            <Tag
                                className={classNames(
                                    `text-white capitalize text-xs px-2 py-0.5`,
                                    taskStatusColor[task.status] ||
                                    'bg-gray-400',
                                )}
                            >
                                {task.status.replace(/_/g, ' ')}
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                meta: { HeaderClass: 'text-center' },
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onView={() => handleOpenViewModal(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onChangeStatus={() => handleChangeStatus(props.row.original, 'completed')}
                        onOpenModal={(type) => handleOpenModal(type, props.row.original)}
                    />
                ),
            },
        ],
        [handleEdit, handleDelete, handleChangeStatus, handleOpenViewModal, handleOpenModal],
    )

    useEffect(() => {
        setVisibleColumns(columns)
    }, [columns])

    const handleCardClick = useCallback(
        (status: TaskStatus | 'all') => {
            const defaultFilters = filterValidationSchema.parse({})
            if (status === 'all') {
                setFilterData(defaultFilters)
            } else {
                setFilterData({ ...defaultFilters, status: [status] })
            }
            handleSetTableData({ pageIndex: 1, query: '' })
            setSelectedTasks([])
        },
        [handleSetTableData],
    )

    const handleColumnToggle = useCallback(
        (checked: boolean, colId: string) => {
            if (checked) {
                const originalColumn = columns.find(
                    (c) => (c.id || c.accessorKey) === colId,
                )
                if (originalColumn) {
                    setVisibleColumns((prev) => {
                        const newCols = [...prev, originalColumn]
                        newCols.sort((a, b) => {
                            const indexA = columns.findIndex(
                                (c) =>
                                    (c.id || c.accessorKey) ===
                                    (a.id || a.accessorKey),
                            )
                            const indexB = columns.findIndex(
                                (c) =>
                                    (c.id || c.accessorKey) ===
                                    (b.id || b.accessorKey),
                            )
                            return indexA - indexB
                        })
                        return newCols
                    })
                }
            } else {
                setVisibleColumns((prev) =>
                    prev.filter((c) => (c.id || c.accessorKey) !== colId),
                )
            }
        },
        [columns],
    )

    return {
        isLoading,
        tasks,
        tableData,
        selectedTasks,
        setSelectedTasks,
        filterData,
        setFilterData: handleApplyFilter,
        pageData,
        total,
        allFilteredAndSortedData,
        columns,
        visibleColumns,
        handlePaginationChange,
        handleSelectChange,
        handleSort,
        handleSearchChange,
        handleApplyFilter,
        handleRemoveFilter,
        handleClearAllFilters,
        handleRowSelect,
        handleAllRowSelect,
        handleDeleteSelected,
        uniqueAssignees,
        uniqueStatuses,
        isExportReasonModalOpen,
        setIsExportReasonModalOpen,
        isSubmittingExportReason,
        exportReasonFormMethods,
        handleOpenExportReasonModal,
        handleConfirmExportWithReason,
        isViewModalOpen,
        viewingTask,
        handleOpenViewModal,
        handleCloseViewModal,
        modalState,
        handleCloseModal,
        getAllUserDataOptions,
        handleCardClick,
        handleColumnToggle,
    }
}

// --- StatusSummaryCards Component ---
interface StatusSummaryCardsProps {
    tasks: TaskItem[]
    onCardClick: (status: TaskStatus | 'all') => void
}

const StatusSummaryCards: React.FC<StatusSummaryCardsProps> = ({
    tasks,
    onCardClick,
}) => {
    const stats = useMemo(() => {
        const total = tasks.length
        const pending = tasks.filter((t) => t.status === 'pending').length
        const in_progress = tasks.filter(
            (t) => t.status === 'in_progress',
        ).length
        const completed = tasks.filter((t) => t.status === 'completed').length
        return { total, pending, in_progress, completed }
    }, [tasks])

    const cardClass =
        'rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg'
    const cardBodyClass = 'flex items-center gap-4 p-4'
    const iconWrapperClass = 'p-3 rounded-full'

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Tooltip title="Click to show all tasks">
                <div onClick={() => onCardClick('all')}>
                    <AdaptiveCard
                        bodyClass={cardBodyClass}
                        className={classNames(
                            cardClass,
                            'border-blue-200 dark:border-blue-700',
                        )}
                    >
                        <div
                            className={classNames(
                                iconWrapperClass,
                                'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
                            )}
                        >
                            <TbActivity size={24} />
                        </div>
                        <div>
                            <h6 className="font-semibold">{stats.total}</h6>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total Tasks
                            </p>
                        </div>
                    </AdaptiveCard>
                </div>
            </Tooltip>
            <Tooltip title="Click to show 'Pending' tasks">
                <div onClick={() => onCardClick('pending')}>
                    <AdaptiveCard
                        bodyClass={cardBodyClass}
                        className={classNames(
                            cardClass,
                            'border-amber-200 dark:border-amber-700',
                        )}
                    >
                        <div
                            className={classNames(
                                iconWrapperClass,
                                'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
                            )}
                        >
                            <TbBell size={24} />
                        </div>
                        <div>
                            <h6 className="font-semibold">{stats.pending}</h6>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Pending
                            </p>
                        </div>
                    </AdaptiveCard>
                </div>
            </Tooltip>
            <Tooltip title="Click to show 'In Progress' tasks">
                <div onClick={() => onCardClick('in_progress')}>
                    <AdaptiveCard
                        bodyClass={cardBodyClass}
                        className={classNames(
                            cardClass,
                            'border-sky-200 dark:border-sky-700',
                        )}
                    >
                        <div
                            className={classNames(
                                iconWrapperClass,
                                'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100',
                            )}
                        >
                            <TbReload size={24} />
                        </div>
                        <div>
                            <h6 className="font-semibold">
                                {stats.in_progress}
                            </h6>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                In Progress
                            </p>
                        </div>
                    </AdaptiveCard>
                </div>
            </Tooltip>
            <Tooltip title="Click to show 'Completed' tasks">
                <div onClick={() => onCardClick('completed')}>
                    <AdaptiveCard
                        bodyClass={cardBodyClass}
                        className={classNames(
                            cardClass,
                            'border-emerald-200 dark:border-emerald-700',
                        )}
                    >
                        <div
                            className={classNames(
                                iconWrapperClass,
                                'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
                            )}
                        >
                            <TbChecks size={24} />
                        </div>
                        <div>
                            <h6 className="font-semibold">{stats.completed}</h6>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Completed
                            </p>
                        </div>
                    </AdaptiveCard>
                </div>
            </Tooltip>
        </div>
    )
}

// --- Main TaskList Component ---
const TaskList = ({ isDashboard }) => {
    const pageTitle = 'Task List'
    const {
        isLoading,
        tasks,
        tableData,
        selectedTasks,
        setSelectedTasks,
        filterData,
        pageData,
        total,
        columns,
        visibleColumns,
        handlePaginationChange,
        handleSelectChange,
        handleSort,
        handleSearchChange,
        handleApplyFilter,
        handleRemoveFilter,
        handleClearAllFilters,
        handleRowSelect,
        handleAllRowSelect,
        handleDeleteSelected,
        uniqueAssignees,
        uniqueStatuses,
        isExportReasonModalOpen,
        setIsExportReasonModalOpen,
        isSubmittingExportReason,
        exportReasonFormMethods,
        handleOpenExportReasonModal,
        handleConfirmExportWithReason,
        isViewModalOpen,
        viewingTask,
        handleCloseViewModal,
        modalState,
        handleCloseModal,
        getAllUserDataOptions,
        handleCardClick,
        handleColumnToggle,
    } = useTaskListingLogic()

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        {!isDashboard && <h5 className="mb-4 lg:mb-0">{pageTitle}</h5>}
                        {!isDashboard && <TaskListActionTools pageTitle={pageTitle} />}
                    </div>

                    {!isDashboard && <StatusSummaryCards
                        tasks={tasks}
                        onCardClick={handleCardClick}
                    />}

                    <div className="mb-2">
                        <TaskTableTools
                            isDashboard={isDashboard}
                            onSearchChange={handleSearchChange}
                            filterData={filterData}
                            setFilterData={handleApplyFilter}
                            uniqueAssignees={uniqueAssignees}
                            uniqueStatuses={uniqueStatuses}
                            onExport={handleOpenExportReasonModal}
                            onClearFilters={handleClearAllFilters}
                            columns={columns}
                            visibleColumns={visibleColumns}
                            onColumnToggle={handleColumnToggle}
                        />
                    </div>
                    <ActiveFiltersDisplay
                        filterData={filterData}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                    />
                    <div className="flex-grow overflow-auto">
                        <TaskTable
                            columns={visibleColumns}
                            data={pageData}
                            loading={isLoading}
                            pagingData={{
                                total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectedTasks={selectedTasks}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onRowSelect={handleRowSelect}
                            onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
                <TaskSelected
                    selectedTasks={selectedTasks}
                    setSelectedTasks={setSelectedTasks}
                    onDeleteSelected={handleDeleteSelected}
                />
            </Container>

            <ConfirmDialog
                isOpen={isExportReasonModalOpen}
                type="info"
                title="Reason for Export"
                onClose={() => setIsExportReasonModalOpen(false)}
                onRequestClose={() => setIsExportReasonModalOpen(false)}
                onCancel={() => setIsExportReasonModalOpen(false)}
                onConfirm={exportReasonFormMethods.handleSubmit(
                    handleConfirmExportWithReason,
                )}
                loading={isSubmittingExportReason}
                confirmText={
                    isSubmittingExportReason
                        ? 'Submitting...'
                        : 'Submit & Export'
                }
                cancelText="Cancel"
                confirmButtonProps={{
                    disabled:
                        !exportReasonFormMethods.formState.isValid ||
                        isSubmittingExportReason,
                }}
            >
                <UiFormComponents
                    id="exportTaskReasonForm"
                    onSubmit={(e) => {
                        e.preventDefault()
                        exportReasonFormMethods.handleSubmit(
                            handleConfirmExportWithReason,
                        )()
                    }}
                    className="flex flex-col gap-4 mt-2"
                >
                    <UiFormItem
                        label="Please provide a reason for exporting this data:"
                        invalid={
                            !!exportReasonFormMethods.formState.errors.reason
                        }
                        errorMessage={
                            exportReasonFormMethods.formState.errors.reason
                                ?.message
                        }
                    >
                        <Controller
                            name="reason"
                            control={exportReasonFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    {...field}
                                    placeholder="Enter reason..."
                                    rows={3}
                                />
                            )}
                        />
                    </UiFormItem>
                </UiFormComponents>
            </ConfirmDialog>

            <TaskViewModal
                task={viewingTask}
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
            />

            <TaskModals
                modalState={modalState}
                onClose={handleCloseModal}
                getAllUserDataOptions={getAllUserDataOptions}
            />
        </>
    )
}

export default TaskList