import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BsCameraVideo, BsClipboardCheck } from 'react-icons/bs'
import { FiRefreshCw } from 'react-icons/fi'
import { HiOutlineCalendar, HiPlus, HiCheck } from 'react-icons/hi'
import { IoCalendarOutline } from 'react-icons/io5'
import { MdOutlineGridView } from 'react-icons/md'
import { useSelector } from 'react-redux'
import { z } from 'zod'

// --- UI Components & Icons ---
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import Dialog from '@/components/ui/Dialog'
import Dropdown, { DropdownRef } from '@/components/ui/Dropdown'
import {
    Form as UiForm,
    FormItem as UiFormItem,
    Input,
    Select as UiSelect,
} from '@/components/ui/index'
import Notification from '@/components/ui/Notification'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import toast from '@/components/ui/toast'
import Tooltip from '@/components/ui/Tooltip'

// --- Redux & HOCs/Hooks ---
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    addScheduleAction,
    getAllScheduleAction,
} from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useResponsive from '@/utils/hooks/useResponsive'
import { TbPlus } from 'react-icons/tb'

// --- Types ---
type ScheduleEvent = {
    id: number
    event_title: string
    notes: string
    date_time: string
    event_type: 'Meeting' | 'Reminder' | string
}
type ScheduleData = { [date: string]: ScheduleEvent[] }

// ======================================================
//               CONFIGURATION & ZOD SCHEMA
// ======================================================

const scheduleContentHeight = 'h-[320px]'

// REFINED: More descriptive visual styles for different event types.
const EVENT_TYPE_STYLE: Record<
    string,
    { icon: JSX.Element; badgeClass: string; dotClass: string }
> = {
    Meeting: {
        icon: <BsCameraVideo />,
        badgeClass:
            'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
        dotClass: 'bg-blue-500',
    },
    Reminder: {
        icon: <BsClipboardCheck />,
        badgeClass:
            'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
        dotClass: 'bg-purple-500',
    },
    Task: {
        icon: <BsClipboardCheck />,
        badgeClass:
            'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
        dotClass: 'bg-amber-500',
    },
    Call: {
        icon: <BsCameraVideo />,
        badgeClass:
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
        dotClass: 'bg-emerald-500',
    },
    default: {
        icon: <BsClipboardCheck />,
        badgeClass:
            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-200',
        dotClass: 'bg-gray-400',
    },
}

const fullEventTypeOptions = [
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Demo', label: 'Product Demo' },
    { value: 'IntroCall', label: 'Introductory Call' },
    { value: 'FollowUpCall', label: 'Follow-up Call' },
    { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
    { value: 'CheckIn', label: 'Customer Check-in' },
    { value: 'LogEmail', label: 'Log an Email' },
    { value: 'Milestone', label: 'Project Milestone' },
    { value: 'Task', label: 'Task' },
    { value: 'FollowUp', label: 'General Follow-up' },
    { value: 'ProjectKickoff', label: 'Project Kick-off' },
    { value: 'OnboardingSession', label: 'Onboarding Session' },
    { value: 'Training', label: 'Training Session' },
    { value: 'SupportCall', label: 'Support Call' },
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

const uniqueFullEventTypeOptions = [
    ...new Map(
        fullEventTypeOptions.map((item) => [item['value'], item])
    ).values(),
]

const scheduleFormSchema = z.object({
    event_title: z
        .string()
        .min(3, 'Title must be at least 3 characters long.'),
    event_type: z.string({ required_error: 'Event type is required.' }),
    date_time: z.date({ required_error: 'Event date & time are required.' }),
    remind_from: z.date().nullable().optional(),
    notes: z.string().optional(),
})
type ScheduleFormData = z.infer<typeof scheduleFormSchema>

// ======================================================
//        ADD SCHEDULE MODAL COMPONENT (RESTORED)
// ======================================================

const AddScheduleModal = ({
    isOpen,
    onClose,
    onScheduleAdded,
}: {
    isOpen: boolean
    onClose: () => void
    onScheduleAdded: () => void
}) => {
    const dispatch = useAppDispatch()
    const [isLoading, setIsLoading] = useState(false)

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues: {
            event_title: '',
            event_type: undefined,
            date_time: null as any,
            remind_from: null,
            notes: '',
        },
        mode: 'onChange',
    })

    const handleClose = () => {
        reset()
        onClose()
    }

    const onFormSubmit = async (data: ScheduleFormData) => {
        setIsLoading(true)
        const payload = {
            event_title: data.event_title,
            event_type: data.event_type,
            date_time: dayjs(data.date_time).format('YYYY-MM-DD HH:mm:ss'),
            ...(data.remind_from && {
                remind_from: dayjs(data.remind_from).format(
                    'YYYY-MM-DD HH:mm:ss'
                ),
            }),
            notes: data.notes || '',
        }

        try {
            await dispatch(addScheduleAction(payload)).unwrap()
            toast.push(<Notification type="success" title="Event Scheduled" />)
            onScheduleAdded()
            handleClose()
        } catch (error: any) {
            toast.push(
                <Notification
                    type="danger"
                    title="Scheduling Failed"
                    children={error?.message || 'An unknown error occurred.'}
                />
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <h5 className="mb-4">Add New Schedule</h5>
            <UiForm onSubmit={handleSubmit(onFormSubmit)}>
                <UiFormItem
                    label="Event Title"
                    invalid={!!errors.event_title}
                    errorMessage={errors.event_title?.message}
                >
                    <Controller
                        name="event_title"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                    />
                </UiFormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UiFormItem
                        label="Event Type"
                        invalid={!!errors.event_type}
                        errorMessage={errors.event_type?.message}
                    >
                        <Controller
                            name="event_type"
                            control={control}
                            render={({ field }) => (
                                <UiSelect
                                    placeholder="Select Type"
                                    options={uniqueFullEventTypeOptions}
                                    value={uniqueFullEventTypeOptions.find(
                                        (o) => o.value === field.value
                                    )}
                                    onChange={(opt: any) =>
                                        field.onChange(opt?.value)
                                    }
                                />
                            )}
                        />
                    </UiFormItem>
                    <UiFormItem
                        label="Event Date & Time"
                        invalid={!!errors.date_time}
                        errorMessage={errors.date_time?.message}
                    >
                        <Controller
                            name="date_time"
                            control={control}
                            render={({ field }) => (
                                <DatePicker.DateTimepicker
                                    placeholder="Select date and time"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </UiFormItem>
                </div>
                <UiFormItem
                    label="Reminder Date & Time (Optional)"
                    invalid={!!errors.remind_from}
                    errorMessage={errors.remind_from?.message}
                >
                    <Controller
                        name="remind_from"
                        control={control}
                        render={({ field }) => (
                            <DatePicker.DateTimepicker
                                placeholder="Select date and time"
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </UiFormItem>
                <UiFormItem
                    label="Notes"
                    invalid={!!errors.notes}
                    errorMessage={errors.notes?.message}
                >
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) => <Input textArea {...field} />}
                    />
                </UiFormItem>
                <div className="text-right mt-6">
                    <Button
                        type="button"
                        className="mr-2"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isLoading}
                        disabled={!isValid || isLoading}
                        icon={<HiCheck />}
                    >
                        Save Event
                    </Button>
                </div>
            </UiForm>
        </Dialog>
    )
}

// ======================================================
//        COMPACT ALL SCHEDULES MODAL & SUB-COMPONENTS
// ======================================================

// REFINED: Event item with icon badge for better visual distinction.
const CompactEventItem = ({ event }: { event: ScheduleEvent }) => {
    const { icon, badgeClass } =
        EVENT_TYPE_STYLE[event.event_type] || EVENT_TYPE_STYLE.default

    return (
        <div className="flex items-center gap-4 py-3">
            <div
                className={classNames(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                    badgeClass
                )}
            >
                {icon}
            </div>
            <div className="flex-grow">
                <p className="font-semibold leading-tight text-gray-800 dark:text-gray-100">
                    {event.event_title}
                </p>
                <p className="text-xs text-gray-500">{event.event_type}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {dayjs(event.date_time).format('h:mm A')}
                </p>
            </div>
        </div>
    )
}

// REFINED: Cleaner, more modern date divider.
const DateDivider = ({ date }: { date: string }) => (
    <div className="flex items-center gap-3 my-3">
        <hr className="flex-grow border-gray-200 dark:border-gray-700" />
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            {dayjs(date).format('MMMM D, YYYY')}
        </span>
        <hr className="flex-grow border-gray-200 dark:border-gray-700" />
    </div>
)

const CompactAllSchedulesModal = ({
    isOpen,
    onClose,
    onAddNew,
    scheduleData,
    loading,
}: {
    isOpen: boolean
    onClose: () => void
    onAddNew: () => void
    scheduleData: ScheduleData | undefined
    loading: boolean
}) => {
    const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null)

    const sortedEvents = useMemo(() => {
        if (!scheduleData) return []
        return Object.values(scheduleData)
            .flat()
            .filter(
                (event) =>
                    !eventTypeFilter || event.event_type === eventTypeFilter
            )
            .sort(
                (a, b) =>
                    dayjs(a.date_time).valueOf() - dayjs(b.date_time).valueOf()
            )
    }, [scheduleData, eventTypeFilter])

    const uniqueEventTypesForFilter = useMemo(
        () => [
            { value: '', label: 'All Event Types' },
            ...Array.from(
                new Set(
                    Object.values(scheduleData || {})
                        .flat()
                        .map((e) => e.event_type)
                )
            ).map((type) => ({ value: type, label: type })),
        ],
        [scheduleData]
    )

    let lastRenderedDate: string | null = null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            contentClassName="flex flex-col" // Make dialog content a flex container
        >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <MdOutlineGridView className="text-xl" />
                <h5 className="font-semibold text-lg">All Schedules</h5>
            </div>
            <div className="p-6 flex flex-col min-h-0 flex-grow">
                <UiSelect
                    placeholder="Filter by event type..."
                    options={uniqueEventTypesForFilter}
                    isClearable
                    className="mb-4"
                    value={uniqueEventTypesForFilter.find(
                        (o) => o.value === eventTypeFilter
                    )}
                    onChange={(opt: any) =>
                        setEventTypeFilter(opt?.value || null)
                    }
                />
                <div className="flex-grow min-h-0">
                    <ScrollBar autoHide style={{ maxHeight: '55vh' }}>
                        <div className="pr-2">
                            {loading && (
                                <div className="flex justify-center p-10">
                                    <Spinner />
                                </div>
                            )}
                            {!loading && sortedEvents.length === 0 && (
                                <EmptyState message="No schedules found" />
                            )}
                            {!loading &&
                                sortedEvents.map((event) => {
                                    const eventDate = dayjs(
                                        event.date_time
                                    ).format('YYYY-MM-DD')
                                    const showDivider =
                                        eventDate !== lastRenderedDate
                                    lastRenderedDate = eventDate
                                    return (
                                        <div key={event.id}>
                                            {showDivider && (
                                                <DateDivider date={eventDate} />
                                            )}
                                            <CompactEventItem event={event} />
                                        </div>
                                    )
                                })}
                        </div>
                    </ScrollBar>
                </div>
            </div>
            
        </Dialog>
    )
}

// ======================================================
//        DROPDOWN & GENERIC SUB-COMPONENTS
// ======================================================

const ScheduleToggle = ({ className }: { className?: string }) => (
    <div className={classNames('text-2xl', className)}>
        <IoCalendarOutline />
    </div>
)

const DynamicHeader = ({
    title,
    onRefresh,
}: {
    title: string
    onRefresh: (e: React.MouseEvent) => void
}) => (
    <div className="flex items-center justify-between">
        <h6 className="font-bold">{title}</h6>
        <Tooltip title="Refresh">
            <Button
                shape="circle"
                variant="plain"
                size="sm"
                icon={<FiRefreshCw className="text-lg" />}
                onClick={onRefresh}
            />
        </Tooltip>
    </div>
)

// REFINED: Timeline event with styled badge for event type.
const TimelineEvent = ({
    event,
    isLast,
}: {
    event: ScheduleEvent
    isLast: boolean
}) => {
    const { dotClass, badgeClass } =
        EVENT_TYPE_STYLE[event.event_type] || EVENT_TYPE_STYLE.default
    return (
        <div className="relative pl-10 pr-4 py-2">
            <div
                className={classNames(
                    'absolute top-5 left-[18px] -translate-x-1/2 w-3 h-3 rounded-full border-2 border-gray-50 dark:border-gray-800',
                    dotClass
                )}
            />
            {!isLast && (
                <div className="absolute top-6 left-[18px] -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-600" />
            )}
            <div className="flex items-start justify-between">
                <p className="font-semibold heading-text -mt-1 flex-grow mr-3">
                    {event.event_title}
                </p>
                <span className="font-semibold text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {dayjs(event.date_time).format('h:mm A')}
                </span>
            </div>
            <div className="mt-1">
                <span
                    className={classNames(
                        'text-xs font-semibold px-2 py-0.5 rounded-full inline-block',
                        badgeClass
                    )}
                >
                    {event.event_type}
                </span>
            </div>
            {event.notes && (
                <p className="text-sm mt-2 text-gray-700 dark:text-gray-200">
                    {event.notes}
                </p>
            )}
        </div>
    )
}

// REFINED: Softer icon color for empty state.
const EmptyState = ({ message = 'No Events' }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 text-gray-500">
        <HiOutlineCalendar className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" />
        <h6 className="font-semibold text-gray-600 dark:text-gray-200">
            {message}
        </h6>
        <p className="mt-1 text-sm">You have a free day!</p>
    </div>
)

const TimelineView = ({
    loading,
    events,
}: {
    loading: boolean
    events: ScheduleEvent[]
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size={40} />
            </div>
        )
    }
    if (!events || events.length === 0) {
        return <EmptyState message="No Events Scheduled" />
    }
    const sortedEvents = [...events].sort(
        (a, b) =>
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    )
    return (
        <div className="py-5">
            {sortedEvents.map((event, index) => (
                <TimelineEvent
                    key={event.id}
                    event={event}
                    isLast={index === sortedEvents.length - 1}
                />
            ))}
        </div>
    )
}

// ======================================================
//              MAIN DROPDOWN COMPONENT
// ======================================================
const _ScheduleDropdown = ({ className }: { className?: string }) => {
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isAddModalOpen, setAddModalOpen] = useState(false)
    const [isCompactModalOpen, setCompactModalOpen] = useState(false)

    const { larger } = useResponsive()
    const dispatch = useAppDispatch()
    const dropdownRef = useRef<DropdownRef>(null)

    const scheduleData = useSelector(masterSelector).getSchedule
        ?.data as ScheduleData | undefined

    const { eventsForSelectedDate, headerTitle } = useMemo(() => {
        const dateKey = dayjs(selectedDate).format('YYYY-MM-DD')
        const events = scheduleData?.[dateKey] || []
        const today = dayjs()
        const sDate = dayjs(selectedDate)

        let title = ''
        if (sDate.isSame(today, 'day')) {
            title = "Today's Schedule"
        } else if (sDate.isSame(today.add(1, 'day'), 'day')) {
            title = "Tomorrow's Schedule"
        } else if (sDate.isSame(today.subtract(1, 'day'), 'day')) {
            title = "Yesterday's Schedule"
        } else {
            title = sDate.format('dddd, MMMM D')
        }

        return {
            eventsForSelectedDate: events,
            headerTitle: title,
        }
    }, [scheduleData, selectedDate])

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await dispatch(getAllScheduleAction())
            setLoading(false)
        }
        fetchInitialData()
    }, [dispatch])

    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        await dispatch(getAllScheduleAction())
        setLoading(false)
    }

    const onScheduleAdded = () => {
        setLoading(true)
        dispatch(getAllScheduleAction()).finally(() => setLoading(false))
    }

    const handleOpenAddModal = () => {
        setCompactModalOpen(false)
        setAddModalOpen(true)
        dropdownRef.current?.handleDropdownClose()
    }

    const handleOpenCompactModal = () => {
        setCompactModalOpen(true)
        dropdownRef.current?.handleDropdownClose()
    }

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setSelectedDate(date)
        }
    }

    return (
        <>
           <Dropdown
                ref={dropdownRef}
                renderTitle={<ScheduleToggle className={className} />}
                menuClass="min-w-[320px] md:min-w-[380px] bg-gray-50 dark:bg-gray-800"
                placement={larger.md ? 'bottom-end' : 'bottom-center'}
            >
                {/* Header */}
                <Dropdown.Item variant="header" className="!px-4 !py-3">
                    <DynamicHeader
                        title={headerTitle}
                        onRefresh={handleRefresh}
                    />
                </Dropdown.Item>

                {/* Date Filter */}
                <div className="px-4 py-3 border-y border-gray-200 dark:border-gray-600">
                    <DatePicker
                        value={selectedDate}
                        onChange={handleDateChange}
                        inputFormat="DD/MM/YYYY"
                        className="w-full"
                    />
                </div>

                {/* Scrollable Content */}
                <ScrollBar className={classNames('overflow-y-auto', scheduleContentHeight)}>
                    <TimelineView
                        loading={loading}
                        events={eventsForSelectedDate}
                    />
                </ScrollBar>

                {/* Footer with Buttons */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 w-full">
                        <Button block onClick={handleOpenCompactModal}>
                            View All
                        </Button>
                        <Button block variant="solid" onClick={handleOpenAddModal}>
                            Add New
                        </Button>
                    </div>
                </div>
            </Dropdown>


            <AddScheduleModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onScheduleAdded={onScheduleAdded}
            />

            <CompactAllSchedulesModal
                isOpen={isCompactModalOpen}
                onClose={() => setCompactModalOpen(false)}
                onAddNew={handleOpenAddModal}
                scheduleData={scheduleData}
                loading={loading}
            />
        </>
    )
}

const ScheduleDropdown = withHeaderItem(_ScheduleDropdown)
export default ScheduleDropdown