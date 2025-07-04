import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BsCameraVideo, BsClipboardCheck } from 'react-icons/bs'
import { FiRefreshCw } from 'react-icons/fi'
import { HiOutlineCalendar, HiPlus } from 'react-icons/hi'
import { IoCalendarOutline } from 'react-icons/io5'
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

const EVENT_TYPE_STYLE: Record<
    string,
    { icon: JSX.Element; accentClass: string }
> = {
    Meeting: { icon: <BsCameraVideo />, accentClass: 'bg-blue-500' },
    Reminder: { icon: <BsClipboardCheck />, accentClass: 'bg-purple-500' },
    default: { icon: <BsClipboardCheck />, accentClass: 'bg-gray-400' },
}

// Zod schema for the general "Add Schedule" form
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
//        ADD SCHEDULE MODAL COMPONENT
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

    const eventTypeOptions = [
        { value: 'Meeting', label: 'Meeting' },
        { value: 'Call', label: 'Follow-up Call' },
        { value: 'Deadline', label: 'Project Deadline' },
        { value: 'Reminder', label: 'Reminder' },
    ]

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
        reset() // Reset form fields on close
        onClose()
    }

    const onFormSubmit = async (data: ScheduleFormData) => {
        setIsLoading(true)
        const payload = {
            // Note: module_id and module_name are omitted for a general event
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
            onScheduleAdded() // Callback to refresh the dropdown list
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
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose}>
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
                                    options={eventTypeOptions}
                                    value={eventTypeOptions.find(
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
                    >
                        Save Event
                    </Button>
                </div>
            </UiForm>
        </Dialog>
    )
}

// ======================================================
//        RE-IMAGINED & UNIQUE SUB-COMPONENTS
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

const TimelineEvent = ({
    event,
    isLast,
}: {
    event: ScheduleEvent
    isLast: boolean
}) => {
    const { accentClass } =
        EVENT_TYPE_STYLE[event.event_type] || EVENT_TYPE_STYLE.default

    return (
        <div className="relative pl-10 pr-4 py-2">
            <div
                className={classNames(
                    'absolute top-5 left-[18px] -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-50 dark:border-gray-800',
                    accentClass
                )}
            />
            {!isLast && (
                <div className="absolute top-7 left-[18px] -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-600" />
            )}
            <div className="flex items-start justify-between">
                <div className="flex-grow">
                    <p className="font-bold heading-text -mt-1">
                        {event.event_title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.event_type}
                    </p>
                </div>
                <span className="font-semibold text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {dayjs(event.date_time).format('h:mm A')}
                </span>
            </div>
            <p className="text-sm mt-2 text-gray-700 dark:text-gray-200">
                {event.notes}
            </p>
        </div>
    )
}

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 text-gray-500">
        <HiOutlineCalendar className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" />
        <h6 className="font-semibold text-gray-600 dark:text-gray-200">
            No Events Scheduled
        </h6>
        <p className="mt-1 text-sm">Enjoy your free day!</p>
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
        return <EmptyState />
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

    const handleAddEventClick = () => {
        setAddModalOpen(true)
        dropdownRef.current?.handleDropdownClose()
    }

    const onScheduleAdded = () => {
        setLoading(true)
        dispatch(getAllScheduleAction()).finally(() => setLoading(false))
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
                menuClass="!p-0 min-w-[340px] md:min-w-[420px] bg-gray-50 dark:bg-gray-800"
                placement={larger.md ? 'bottom-end' : 'bottom'}
            >
                <Dropdown.Item variant="header" className="!px-4 !py-3">
                    <DynamicHeader
                        title={headerTitle}
                        onRefresh={handleRefresh}
                    />
                </Dropdown.Item>

                <div className="px-4 py-3 border-y border-gray-200 dark:border-gray-600">
                    <DatePicker
                        value={selectedDate}
                        onChange={handleDateChange}
                        inputFormat="DD/MM/YYYY"
                        className="w-full"
                    />
                </div>

                <ScrollBar
                    className={classNames(
                        'overflow-y-auto',
                        scheduleContentHeight
                    )}
                >
                    <TimelineView
                        loading={loading}
                        events={eventsForSelectedDate}
                    />
                </ScrollBar>

                <Dropdown.Item variant="footer" className="!p-3 !border-t-0">
                    <Button
                        block
                        variant="solid"
                        icon={<HiPlus />}
                        onClick={handleAddEventClick}
                    >
                        Add Schedule
                    </Button>
                </Dropdown.Item>
            </Dropdown>

            <AddScheduleModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onScheduleAdded={onScheduleAdded}
            />
        </>
    )
}

const ScheduleDropdown = withHeaderItem(_ScheduleDropdown)
export default ScheduleDropdown