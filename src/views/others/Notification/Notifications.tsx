import { useState, useEffect, useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'
import dayjs from 'dayjs'
import { TbFilter, TbCheck } from 'react-icons/tb'

// UI & Shared Components (as they were imported)
import Timeline from '@/components/ui/Timeline'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Switcher from '@/components/ui/Switcher'
import AdaptiveCard from '@/components/shared/AdaptiveCard'

// Activity-specific Components & Constants (as they were imported)
import { ActivityAvatar, ActivityEvent } from '@/components/view/Activity'
import {
    UPDATE_TICKET,
    COMMENT,
    COMMENT_MENTION,
    ASSIGN_TICKET,
    ADD_TAGS_TO_TICKET,
    ADD_FILES_TO_TICKET,
    CREATE_TICKET,
} from '@/components/view/Activity/constants'

// Services (as it was imported)
import { apiGetLogs } from '@/services/LogService'

// --- TYPE DEFINITIONS ---

export type Activity = {
    id: string
    date: number
    events: Array<{
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
    }>
}

export type Activities = Activity[]

export type GetNotificationResponse = {
    data: Activities
    loadable: boolean
}


// --- LOG COMPONENT ---

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
            {activities.map((log, index) => (
                <div key={log.id + index} className="mb-8">
                    {log.events.filter((item) => filter.includes(item.type))
                        .length > 0 && (
                        <div className="mb-4 font-semibold uppercase">
                            {dayjs.unix(log.date).format('dddd, DD MMMM')}
                        </div>
                    )}
                    <Timeline>
                        {isEmpty(log.events) ? (
                            <Timeline.Item>No Activities</Timeline.Item>
                        ) : (
                            log.events
                                .filter((item) => filter.includes(item.type))
                                .map((event, index) => (
                                    <Timeline.Item
                                        key={log.id + event.type + index}
                                        media={<ActivityAvatar data={event} />}
                                    >
                                        <div className="mt-1">
                                            <ActivityEvent data={event} />
                                        </div>
                                    </Timeline.Item>
                                ))
                        )}
                    </Timeline>
                </div>
            ))}
            <div className="text-center">
                {loadable ? (
                    <Button loading={isLoading} onClick={onLoadMore}>
                        Load More
                    </Button>
                ) : (
                    'No more activity to load'
                )}
            </div>
        </div>
    )
}


// --- LOGACTION COMPONENT ---

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
    const [isLoading, setIsLoading] = useState(false)
    const [loadable, seLoadable] = useState(true)
    const [activities, setActivities] = useState<Activity[]>([])
    const [activityIndex, setActivityIndex] = useState(1)
    const [showMentionedOnly, setShowMentionedOnly] = useState(false)
    const [selectedType, setSelectedType] =
        useState<string[]>(defaultSelectedType)

    const getLogs = async (index: number) => {
        setIsLoading(true)
        const resp = await apiGetLogs<
            GetNotificationResponse,
            { activityIndex: number }
        >({ activityIndex: index })
        setActivities((prevActivities) => [...prevActivities, ...resp.data])
        seLoadable(resp.loadable)
        setIsLoading(false)
    }

    useEffect(() => {
        getLogs(activityIndex)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleFilterChange = (selected: string) => {
        setShowMentionedOnly(false)
        if (selectedType.includes(selected)) {
            setSelectedType((prevData) =>
                prevData.filter((prev) => prev !== selected),
            )
        } else {
            setSelectedType((prevData) => [...prevData, ...[selected]])
        }
    }

    const handleLoadMore = () => {
        setActivityIndex((prevIndex) => prevIndex + 1)
        getLogs(activityIndex + 1)
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
                    isLoading={isLoading}
                    loadable={loadable}
                    activities={activities}
                    filter={selectedType}
                    onLoadMore={handleLoadMore}
                />
            </div>
        </AdaptiveCard>
    )
}

export default Notification;