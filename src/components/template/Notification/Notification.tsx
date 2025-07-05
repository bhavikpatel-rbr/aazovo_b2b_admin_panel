import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip' // <-- Import Tooltip
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useResponsive from '@/utils/hooks/useResponsive'
import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationToggle from './NotificationToggle'

import { Avatar } from '@/components/ui'
import type { DropdownRef } from '@/components/ui/Dropdown'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getAllNotificationAction } from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import { PiEnvelopeLight, PiWarningLight } from 'react-icons/pi'
import { useSelector } from 'react-redux'

// ============================================================================
// 1. TYPE DEFINITIONS & CONFIGURATION
// ============================================================================

type RawNotification = {
    id: number
    notification_title: string
    message: string
    created_at: string
    type: string
    module_name: string
    seen: 0 | 1
}

type ProcessedNotification = {
    id: string
    notification_title: string
    description: string
    created_at: string
    type: 'warning' | 'inquiry' | 'message'
    readed: boolean
}

const MESSAGE_TYPES: Array<ProcessedNotification['type']> = ['message']

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'message', label: 'Messages' },
    { key: 'inquiry', label: 'Inquiries' },
    { key: 'warning', label: 'Warnings' },
]

const NOTIFICATION_DROPDOWN_HEIGHT = 'h-[280px]'

// ============================================================================
// 2. HELPER COMPONENTS (WITH UI ENHANCEMENTS)
// ============================================================================

const NotificationAvatar = ({ type }: { type: ProcessedNotification['type'] }) => {
    const iconClass = 'text-xl'
    switch (type) {
        case 'warning':
            return (
                <Avatar
                    size="md"
                    icon={<PiWarningLight className={classNames(iconClass, '!stroke-2')} />}
                    shape="circle"
                    className="bg-transparent text-red-600 bg-red-100 dark:text-red-100 dark:bg-red-500/20"
                />
            )
        case 'inquiry':
            return (
                <Avatar
                    size="md"
                    icon={<PiEnvelopeLight className={iconClass} />}
                    shape="circle"
                    className="bg-transparent text-blue-600 bg-blue-100 dark:text-blue-100 dark:bg-blue-500/20"
                />
            )
        case 'message':
            return (
                <Avatar
                    size="md"
                    icon={<PiEnvelopeLight className={iconClass} />}
                    shape="circle"
                    className="bg-transparent text-emerald-600 bg-emerald-100 dark:text-emerald-100 dark:bg-emerald-500/20"
                /> 
            )
        default:
            return <Avatar size="md" shape="circle" icon={<PiEnvelopeLight className={iconClass} />} />
    }
}

/**
 * Renders a single notification item.
 * The description is now truncated to 2 lines with a tooltip showing the full content.
 */
const NotificationItem = ({
    notification,
    onMarkAsRead,
    navigate,
}: {
    notification: ProcessedNotification
    onMarkAsRead: (id: string) => void
    navigate: ReturnType<typeof useNavigate>
}) => (
    <div
        className="relative flex items-start p-3 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/60 dark:active:bg-gray-700/60"
        onClick={() => {
            onMarkAsRead(notification.id)
            navigate('/notifiactions')
        }}
    >
        <NotificationAvatar type={notification.type} />
        <div className="ml-3">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {notification?.notification_title}
            </div>
            
            {/* START: Truncation and Tooltip Implementation */}
            <Tooltip title={notification.description}>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {notification.description}
                </p>
            </Tooltip>
            {/* END: Truncation and Tooltip Implementation */}

            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 block">
                {new Date(notification?.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </span>
        </div>
        {/* {!notification.readed && (
            <Badge className="absolute top-3 right-3" innerClass="bg-indigo-500" />
        )} */}
    </div>
)

const RenderContent = ({
    loading,
    notifications,
    navigate,
    onMarkAsRead,
}: {
    loading: boolean
    notifications: ProcessedNotification[]
    navigate: ReturnType<typeof useNavigate>
    onMarkAsRead: (id: string) => void
}) => {
    if (loading) {
        return (
            <div className={classNames('flex items-center justify-center', NOTIFICATION_DROPDOWN_HEIGHT)}>
                <Spinner size={40} />
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className={classNames('flex items-center justify-center', NOTIFICATION_DROPDOWN_HEIGHT)}>
                <div className="text-center">
                    <h6 className="font-semibold">No Notifications</h6>
                    <p className="mt-1 text-xs">There are no new updates in this category.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-2 space-y-1">
            {notifications.map((item) => (
                <NotificationItem
                    key={item.id}
                    navigate={navigate}
                    notification={item}
                    onMarkAsRead={onMarkAsRead}
                />
            ))}
        </div>
    )
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

const _Notification = ({ className }: { className?: string }) => {
    const [loading, setLoading] = useState(false)
    const [activeType, setActiveType] = useState('all')

    const { larger } = useResponsive()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const dropdownRef = useRef<DropdownRef>(null)

    const rawNotificationsFromRedux = useSelector(masterSelector).getNotification
        ?.data as RawNotification[] | undefined

    const processedNotifications = useMemo(() => {
        if (!rawNotificationsFromRedux) return []
        return rawNotificationsFromRedux.map((rawItem): ProcessedNotification => {
            let derivedType: ProcessedNotification['type'] = 'message'
            if (rawItem.type?.toLowerCase() === 'warning') derivedType = 'warning'
            else if (rawItem.module_name?.toLowerCase() === 'inquiry') derivedType = 'inquiry'

            return {
                id: String(rawItem.id),
                notification_title: rawItem.notification_title,
                description: rawItem.message,
                created_at: rawItem.created_at,
                readed: rawItem.seen === 1,
                type: derivedType,
            }
        })
    }, [rawNotificationsFromRedux])

    const latestNotifications = useMemo(() => {
        return processedNotifications.slice(0, 10)
    }, [processedNotifications])

    const hasUnread = useMemo(() => {
        return latestNotifications.some((item) => !item.readed)
    }, [latestNotifications])

    const filteredNotifications = useMemo(() => {
        if (activeType === 'all') return latestNotifications
        if (activeType === 'message') return latestNotifications.filter((n) => MESSAGE_TYPES.includes(n.type))
        return latestNotifications.filter((n) => n.type === activeType)
    }, [latestNotifications, activeType])

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await dispatch(getAllNotificationAction())
            setLoading(false)
        }
        fetchInitialData()

        const intervalId = setInterval(() => {
            dispatch(getAllNotificationAction())
        }, 1000 * 60 * 60) // every hour

        return () => clearInterval(intervalId)
    }, [dispatch])

    const handleMarkAsRead = (id: string) => {
        console.log(`Dispatching markNotificationAsRead action for id: ${id}`)
    }

    const handleViewAllActivity = () => {
        navigate('/notifiactions')
        dropdownRef.current?.handleDropdownClose()
    }

    const baseTabClass = 'py-2 px-3 text-sm font-medium focus:outline-none whitespace-nowrap'
    const activeTabClass = 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
    const inactiveTabClass = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'

    return (
        <Dropdown
            ref={dropdownRef}
            renderTitle={<NotificationToggle dot={hasUnread} className={className} />}
            menuClass="min-w-[320px] md:min-w-[380px]"
            placement={larger.md ? 'bottom-end' : 'bottom-center'}
        >
            <Dropdown.Item variant="header">
                <div className="flex items-center justify-between px-4 py-2">
                    <h6 className="font-semibold">Notifications</h6>
                </div>
            </Dropdown.Item>

            <div className="border-b border-gray-200 dark:border-gray-700 px-3">
                <nav className="-mb-px flex space-x-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveType(tab.key)}
                            className={classNames(
                                baseTabClass,
                                activeType === tab.key ? activeTabClass : inactiveTabClass
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <ScrollBar className={classNames('overflow-y-auto', NOTIFICATION_DROPDOWN_HEIGHT)}>
                <RenderContent
                    loading={loading}
                    notifications={filteredNotifications}
                    navigate={navigate}
                    onMarkAsRead={handleMarkAsRead}
                />
            </ScrollBar>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <Button block variant="solid" onClick={handleViewAllActivity}>
                    View All
                </Button>
            </div>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification