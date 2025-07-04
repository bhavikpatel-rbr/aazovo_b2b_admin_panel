import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import dayjs from 'dayjs'

// --- UI Components & Icons ---
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip'
import { IoCalendarOutline } from 'react-icons/io5'
import { BsCameraVideo, BsClipboardCheck } from 'react-icons/bs'
import { FiRefreshCw } from 'react-icons/fi'
import { HiOutlineCalendar, HiPlus } from 'react-icons/hi'

// --- Redux & HOCs/Hooks ---
import { useAppDispatch } from '@/reduxtool/store'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getAllScheduleAction } from '@/reduxtool/master/middleware'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useResponsive from '@/utils/hooks/useResponsive'
import { useSelector } from 'react-redux'
import { DropdownRef } from '@/components/ui'

// --- Types ---
type ScheduleEvent = {
    id: number
    event_title: string
    notes: string
    date_time: string // e.g., "2025-06-21 00:44:00"
    event_type: 'Meeting' | 'Reminder' | string
}
type ScheduleData = { [date: string]: ScheduleEvent[] }

// ======================================================
//               CONFIGURATION & CONSTANTS
// ======================================================

const scheduleContentHeight = 'h-[320px]' // Increased height for better timeline view

const EVENT_TYPE_STYLE: Record<
    string,
    { icon: JSX.Element; accentClass: string }
> = {
    Meeting: {
        icon: <BsCameraVideo />,
        accentClass: 'bg-blue-500',
    },
    Reminder: {
        icon: <BsClipboardCheck />,
        accentClass: 'bg-purple-500',
    },
    default: {
        icon: <BsClipboardCheck />,
        accentClass: 'bg-gray-400',
    },
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

/**
 * A visually distinct component to render a single event on the timeline.
 */
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
            {/* Timeline Dot */}
            <div
                className={classNames(
                    'absolute top-5 left-[18px] -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-50 dark:border-gray-800',
                    accentClass
                )}
            />

            {/* Timeline Connector Line */}
            {!isLast && (
                <div className="absolute top-7 left-[18px] -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-600" />
            )}

            {/* Event Details Card */}
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

/**
 * A cleaner, icon-based empty state.
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 text-gray-500">
        <HiOutlineCalendar className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" />
        <h6 className="font-semibold text-gray-600 dark:text-gray-200">
            No Events Scheduled
        </h6>
        <p className="mt-1 text-sm">Enjoy your free day!</p>
    </div>
)

/**
 * Renders events in a vertical timeline view.
 */
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

    const { larger } = useResponsive()
    const dispatch = useAppDispatch()
    const dropdownRef = useRef<DropdownRef>(null)

    const scheduleData = useSelector(masterSelector).getSchedule
        ?.data as ScheduleData | undefined

    // Memoized calculation for events and a more descriptive header title
    const { eventsForSelectedDate, headerTitle } = useMemo(() => {
        const dateKey = dayjs(selectedDate).format('YYYY-MM-DD')
        const events = scheduleData?.[dateKey] || []
        const today = dayjs()
        const sDate = dayjs(selectedDate)

        let title = ''
        if (sDate.isSame(today, 'day')) {
            title = "Today's Agenda"
        } else if (sDate.isSame(today.add(1, 'day'), 'day')) {
            title = "Tomorrow's Agenda"
        } else if (sDate.isSame(today.subtract(1, 'day'), 'day')) {
            title = "Yesterday's Agenda"
        } else {
            title = sDate.format('dddd, MMMM D') // e.g., "Monday, June 23"
        }

        return {
            eventsForSelectedDate: events,
            headerTitle: title,
        }
    }, [scheduleData, selectedDate])

    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await dispatch(getAllScheduleAction())
            setLoading(false)
        }
        fetchInitialData()
    }, [dispatch])

    // --- User Action Handlers ---
    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent dropdown from closing
        setLoading(true)
        await dispatch(getAllScheduleAction())
        setLoading(false)
    }

    const handleAddEvent = () => {
        // Here you would navigate to an "add event" page or open a modal
        console.log('Navigate to add event page/modal...')
        dropdownRef.current?.handleDropdownClose()
    }

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setSelectedDate(date)
        }
    }

    return (
        <Dropdown
            ref={dropdownRef}
            renderTitle={<ScheduleToggle className={className} />}
            menuClass="!p-0 min-w-[340px] md:min-w-[420px] bg-gray-50 dark:bg-gray-800"
            placement={larger.md ? 'bottom-end' : 'bottom'}
        >
            <Dropdown.Item variant="header" className="!px-4 !py-3">
                <DynamicHeader title={headerTitle} onRefresh={handleRefresh} />
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
                className={classNames('overflow-y-auto', scheduleContentHeight)}
            >
                <TimelineView
                    loading={loading}
                    events={eventsForSelectedDate}
                />
            </ScrollBar>

            {/* <Dropdown.Item variant="footer" className="!p-3 !border-t-0">
                <Button
                    block
                    variant="solid"
                    icon={<HiPlus />}
                    onClick={handleAddEvent}
                >
                    Add New Event
                </Button>
            </Dropdown.Item> */}
        </Dropdown>
    )
}

const ScheduleDropdown = withHeaderItem(_ScheduleDropdown)
export default ScheduleDropdown