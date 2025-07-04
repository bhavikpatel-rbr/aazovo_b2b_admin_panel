import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import dayjs from 'dayjs'

// --- UI Components & Icons ---
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip'
import { IoCalendarOutline } from 'react-icons/io5'
import { BsCameraVideo, BsClipboardCheck } from 'react-icons/bs'
import { FiRefreshCw } from 'react-icons/fi'

// --- Redux & HOCs/Hooks ---
import { useAppDispatch } from '@/reduxtool/store'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getAllScheduleAction } from '@/reduxtool/master/middleware'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useResponsive from '@/utils/hooks/useResponsive'
import { useSelector } from 'react-redux'

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

const scheduleContentHeight = 'h-[280px]'

const EVENT_TYPE_STYLE: Record<string, { icon: JSX.Element; accentClass: string }> = {
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
//             LOGICAL & REUSABLE SUB-COMPONENTS
// ======================================================
// (These sub-components remain unchanged)

const ScheduleToggle = ({ className }: { className?: string }) => (
    <div className={classNames('text-2xl', className)}>
        <IoCalendarOutline />
    </div>
)

const DynamicHeader = ({
    title,
    onRefresh,
    onViewAll,
}: {
    title: string
    onRefresh: (e: React.MouseEvent) => void
    onViewAll: () => void
}) => (
    <div className="flex items-center justify-between">
        <h6>{title}</h6>
        <div className="flex items-center gap-x-1">
            <Tooltip title="Refresh">
                <Button
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<FiRefreshCw />}
                    onClick={onRefresh}
                />
            </Tooltip>
            {/* <Button size="sm" onClick={onViewAll}>
                View All
            </Button> */}
        </div>
    </div>
)

const ScheduleItem = ({ event }: { event: ScheduleEvent }) => {
    const { icon, accentClass } =
        EVENT_TYPE_STYLE[event.event_type] || EVENT_TYPE_STYLE.default

    return (
        <div className="flex gap-x-4 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/60">
            <div className={classNames('w-1.5 rounded-full', accentClass)} />
            <div className="flex-grow">
                <div className="flex justify-between">
                    <div>
                        <p className="font-bold heading-text">{event.event_title}</p>
                        <p className="text-sm">{event.notes}</p>
                    </div>
                    <span className="font-semibold text-sm whitespace-nowrap">
                        {dayjs(event.date_time).format('h:mm A')}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {icon}
                    <span>{event.event_type}</span>
                </div>
            </div>
        </div>
    )
}

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center h-full p-6">
        <img
            className="w-24 mb-4"
            src="/img/others/no-event.png"
            alt="No events scheduled"
        />
        <h6 className="font-semibold">No Events Scheduled</h6>
        <p className="mt-1 text-sm text-gray-500">This day is all yours.</p>
    </div>
)

const ScheduleList = ({
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

    if (events.length === 0) {
        return <EmptyState />
    }

    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    )

    return (
        <div className="flex flex-col gap-y-2 p-3">
            {sortedEvents.map((event) => (
                <ScheduleItem key={event.id} event={event} />
            ))}
        </div>
    )
}

// ======================================================
//                 MAIN DROPDOWN COMPONENT
// ======================================================
const _Calender = ({ className }: { className?: string }) => {
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const { larger } = useResponsive()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const dropdownRef = useRef<DropdownRef>(null)

    const scheduleData = useSelector(masterSelector).getSchedule?.data as ScheduleData | undefined

    const { eventsForSelectedDate, headerTitle } = useMemo(() => {
        const dateKey = dayjs(selectedDate).format('YYYY-MM-DD')
        const events = scheduleData?.[dateKey] || []

        // --- START OF CHANGE ---
        // Changed the date format to match the picker for consistency
        let title = `Schedule for ${dayjs(selectedDate).format('DD/MM/YYYY')}`
        // --- END OF CHANGE ---

        if (dayjs(selectedDate).isSame(dayjs(), 'day')) {
            title = "Today's Schedule"
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

    // --- User Action Handlers (unchanged) ---
    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        await dispatch(getAllScheduleAction())
        setLoading(false)
    }

    const handleViewAll = () => {
        navigate('/schedule')
        dropdownRef.current?.handleDropdownClose()
    }

    const handleAddEvent = () => {
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
            menuClass="!p-0 min-w-[340px] md:min-w-[420px]"
            placement={larger.md ? 'bottom-end' : 'bottom'}
        >
            <Dropdown.Item variant="header" className="!px-4 !py-3">
                <DynamicHeader
                    title={headerTitle}
                    onRefresh={handleRefresh}
                    onViewAll={handleViewAll}
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

            <ScrollBar className={classNames('overflow-y-auto', scheduleContentHeight)}>
                <ScheduleList
                    loading={loading}
                    events={eventsForSelectedDate}
                />
            </ScrollBar>

            {/* <Dropdown.Item variant="footer" className="!border-t-0 !p-3">
                <Button block variant="solid" onClick={handleAddEvent}>
                    Add New Event
                </Button>
            </Dropdown.Item> */}
        </Dropdown>
    )
}

const Calender = withHeaderItem(_Calender)
export default Calender