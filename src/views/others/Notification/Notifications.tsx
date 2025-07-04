import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import { useEffect, useMemo, useState } from 'react'
import { TbCheck, TbFilter } from 'react-icons/tb'

// UI & Shared Components (as they were imported)
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Switcher from '@/components/ui/Switcher'
import Timeline from '@/components/ui/Timeline'

// Activity-specific Components & Constants (as they were imported)
import { ActivityAvatar, ActivityEvent } from '@/components/view/Activity'
import {
    ADD_FILES_TO_TICKET,
    ADD_TAGS_TO_TICKET,
    ASSIGN_TICKET,
    COMMENT,
    COMMENT_MENTION,
    CREATE_TICKET,
    UPDATE_TICKET,
} from '@/components/view/Activity/constants'

// Services (as it was imported)
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getNotificationAction } from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
// apiGetLogs is no longer needed since we use Redux
// import { apiGetLogs } from '@/services/LogService' 
import { useSelector } from 'react-redux'

// --- TYPE DEFINITIONS ---

// The structure required by the UI components
export type ActivityEventData = {
    type: string
    dateTime: number
    ticket?: string
    status?: number
    userName: string
    userImg?: string
    comment?: string
    tags?: string[]
    files?: string[]
    assignee?: string
}

export type Activity = {
    id: string
    date: number
    events: ActivityEventData[]
}

export type Activities = Activity[]

// The structure of a single notification from YOUR API response
export type ApiNotification = {
    id: number;
    notification_title: string;
    message: string;
    created_at: string;
    created_by_user: {
        name: string;
        profile_pic_path: string | null;
    } | null;
}

// The structure of the Redux state object for notifications
export type NotificationState = {
    data: ApiNotification[] | null
    loadable: boolean
}


// --- LOG COMPONENT ---
// Simplified to be a "dumb" component that only renders props.
// All Redux logic has been removed from here and centralized in the parent.

type LogProps = {
    onLoadMore: () => void
    isLoading: boolean
    loadable: boolean
    activities: Activity[]
    filter: string[]
}

const Log = ({
    activities,
    loadable,
    isLoading,
    onLoadMore,
    filter = [],
}: LogProps) => {

    return (
        <div>
            {isLoading && activities.length === 0 && (
                <div className="text-center p-4">Loading...</div>
            )}
            {!isLoading && activities.length === 0 && (
                <div className="text-center p-4 text-gray-500">No notifications to display.</div>
            )}
            {activities.map((log, index) => {
                const visibleEvents = log.events.filter((item) => filter.includes(item.type))
                if (visibleEvents.length === 0) {
                    return null
                }
                return (
                    <div key={log.id + index} className="mb-8">
                        <div className="mb-4 font-semibold uppercase">
                            {dayjs.unix(log.date).format('dddd, DD MMMM')}
                        </div>
                        <Timeline>
                            {visibleEvents.map((event, eventIndex) => (
                                <Timeline.Item
                                    key={log.id + event.type + eventIndex}
                                    media={<ActivityAvatar data={event} />}
                                >
                                    <div className="mt-1">
                                        <ActivityEvent data={event} />
                                    </div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                )
            }
            )}
            <div className="text-center">
                {loadable ? (
                    <Button loading={isLoading} onClick={onLoadMore}>
                        Load More
                    </Button>
                ) : (
                    activities.length > 0 && 'No more activity to load'
                )}
            </div>
        </div>
    )
}


// --- LOGACTION COMPONENT ---
// No changes are needed in this component.

type LogActionProps = {
    selectedType: string[]
    onFilterChange: (item: string) => void
    onCheckboxChange: (checked: boolean) => void
    showMentionedOnly: boolean
}

const filterItems = [
    { label: 'Ticket status', value: UPDATE_TICKET },
    { label: 'Assign ticket', value: ASSIGN_TICKET },
    { label: 'New ticket', value: CREATE_TICKET },
    { label: 'Add tags', value: ADD_TAGS_TO_TICKET },
    { label: 'Add files', value: ADD_FILES_TO_TICKET },
]

const LogAction = ({
    showMentionedOnly,
    selectedType = [],
    onFilterChange,
    onCheckboxChange,
}: LogActionProps) => {
    const allUnchecked = useMemo(() => {
        return !selectedType.some((type) =>
            filterItems.map((item) => item.value).includes(type),
        )
    }, [selectedType])

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <span className="font-semibold">
                    {showMentionedOnly
                        ? 'Show all activity'
                        : 'Show mentioned only'}
                </span>
                <Switcher
                    checked={showMentionedOnly}
                    onChange={onCheckboxChange}
                />
            </div>
            <Dropdown
                placement="bottom-end"
                renderTitle={
                    <button
                        className="close-button p-2.5! button-press-feedback"
                        type="button"
                    >
                        <TbFilter />
                    </button>
                }
            >
                {filterItems.map((item) => (
                    <Dropdown.Item
                        key={item.value}
                        eventKey={item.value}
                        onClick={() => onFilterChange(item.value)}
                    >
                        {!allUnchecked && (
                            <div className="flex justify-center w-[20px]">
                                {selectedType.includes(item.value) && (
                                    <TbCheck className="text-primary text-lg" />
                                )}
                            </div>
                        )}
                        <span>{item.label}</span>
                    </Dropdown.Item>
                ))}
            </Dropdown>
        </div>
    )
}


// --- MAIN Notification COMPONENT ---
// This component now fetches from Redux and transforms the data for its children.

const defaultSelectedType = [
    UPDATE_TICKET,
    COMMENT,
    COMMENT_MENTION,
    ASSIGN_TICKET,
    ADD_TAGS_TO_TICKET,
    ADD_FILES_TO_TICKET,
    CREATE_TICKET,
]

const Notification = () => {
    const dispatch = useAppDispatch()

    // 1. Get the entire notification state object from Redux
    const getAllNotification = useSelector(masterSelector)?.getAllNotification?.data?.data

    // Local state is only for UI controls
    const [showMentionedOnly, setShowMentionedOnly] = useState(false)
    const [selectedType, setSelectedType] = useState<string[]>(defaultSelectedType)

    // 2. Fetch data on component mount
    useEffect(() => {
        dispatch(getNotificationAction())
    }, [dispatch])

    // 3. Transform API data into the format the UI needs using useMemo for efficiency
    const activities: Activities = useMemo(() => {
        const apiData = (getAllNotification as ApiNotification[]) || []

        if (isEmpty(apiData)) {
            return []
        }

        // Group notifications by the date they were created
        const groupedByDay = apiData?.reduce((acc, notification) => {
            const dateKey = dayjs(notification.created_at).format('YYYY-MM-DD')
            if (!acc[dateKey]) {
                acc[dateKey] = []
            }
            acc[dateKey].push(notification)
            return acc
        }, {} as Record<string, ApiNotification[]>)

        // Map the grouped data to the Activity[] structure
        return Object.keys(groupedByDay)
            .map((dateKey) => ({
                id: dateKey,
                date: dayjs(dateKey).unix(),
                events: groupedByDay[dateKey].map((item): ActivityEventData => ({
                    // Map your API fields to the component's expected props
                    type: COMMENT, // All notifications are treated as 'COMMENT' for display
                    dateTime: dayjs(item.created_at).unix(),
                    userName: item.created_by_user?.name || 'System User',
                    userImg: item.created_by_user?.profile_pic_path || undefined,
                    comment: `<strong>${item.notification_title}</strong><br/>${item.message}`,
                    ticket: String(item.id),
                })),
            }))
            .sort((a, b) => b.date - a.date) // Sort days from newest to oldest
    }, [getAllNotification])


    const handleFilterChange = (selected: string) => {
        setShowMentionedOnly(false)
        if (selectedType.includes(selected)) {
            setSelectedType((prevData) =>
                prevData.filter((prev) => prev !== selected)
            )
        } else {
            setSelectedType((prevData) => [...prevData, selected])
        }
    }

    const handleLoadMore = () => {
        // This function would dispatch a Redux action for pagination if implemented
        console.log('Load More requires pagination logic in the Redux action.')
    }

    const handleCheckboxChange = (bool: boolean) => {
        setShowMentionedOnly(bool)
        if (bool) {
            setSelectedType([COMMENT_MENTION])
        } else {
            setSelectedType(defaultSelectedType)
        }
    }

    return (
        <AdaptiveCard>
            <div className="max-w-[800px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3>Notifications</h3>
                    <LogAction
                        selectedType={selectedType}
                        showMentionedOnly={showMentionedOnly}
                        onFilterChange={handleFilterChange}
                        onCheckboxChange={handleCheckboxChange}
                    />
                </div>
                <Log
                    // isLoading={getNotificationLoading}
                    // 'loadable' should come from your Redux state for pagination
                    loadable={getAllNotification?.loadable ?? false}
                    activities={activities}
                    filter={selectedType}
                    onLoadMore={handleLoadMore}
                />
            </div>
        </AdaptiveCard>
    )
}

export default Notification