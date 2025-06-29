import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useResponsive from '@/utils/hooks/useResponsive'
import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HiOutlineMailOpen } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import NotificationToggle from './NotificationToggle'

import { Avatar } from '@/components/ui'
import type { DropdownRef } from '@/components/ui/Dropdown'
// TODO: Import your actual 'mark as read' actions from the master slice
import {
    // markAllNotificationsAsRead, // Example action
    // markNotificationAsRead, // Example action
    masterSelector,
} from '@/reduxtool/master/masterSlice'
import { useAppDispatch } from '@/reduxtool/store'
import { PiEnvelopeLight, PiWarningLight } from 'react-icons/pi'
import { useSelector } from 'react-redux'
import { getAllNotificationAction } from '@/reduxtool/master/middleware'
// Define a clear type for notifications
type Notification = {
    id: string
    notification_title: string
    description: string
    date: string // Should be an ISO date string
    type: 'warning' | 'inquiry' | 'default' // Example types
    readed: boolean
}

const notificationHeight = 'h-[280px]'

// Helper component for rendering avatars based on notification type
const NotificationAvatar = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'warning':
            return (
                <Avatar
                    icon={<PiWarningLight className="!stroke-2" />}
                    className="bg-red-500"
                />
            )
        case 'inquiry':
            return (
                <Avatar
                    icon={<PiEnvelopeLight />}
                    className="bg-blue-500" // Use a different color for distinction
                />
            )
        default:
            return <Avatar icon={<PiEnvelopeLight />} className="bg-primary" />
    }
}

// Helper component for a single notification item for better readability
const NotificationItem = ({
    notification,
    onMarkAsRead,
}: {
    notification: Notification
    onMarkAsRead: (id: string) => void
}) => (
    <div
        className="relative rounded-xl flex px-4 py-3 cursor-pointer hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-700"
        onClick={() => onMarkAsRead(notification.id)}
    >
        <div>
            <NotificationAvatar type={notification.type} />
        </div>
        <div className="mx-3">
            <div className="font-semibold heading-text">
                {notification?.notification_title}
            </div>
            <div className="text-xs">
                <span>{notification?.message}</span>
                {/* TODO: Use a library like 'date-fns' to format 'notification.date' as relative time (e.g., "10m ago") */}
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(notification?.created_at).toLocaleTimeString()}
                </span>
            </div>
        </div>
        {!notification.readed && (
            <Badge className="absolute top-4 ltr:right-4 rtl:left-4 mt-1.5" />
        )}
    </div>
)

const _Notification = ({ className }: { className?: string }) => {
    const [loading, setLoading] = useState(false)
    const { larger } = useResponsive()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const notificationDropdownRef = useRef<DropdownRef>(null)

    // Get notifications directly from the Redux store
    const notifications = useSelector(masterSelector).getNotification?.data as
        | Notification[]
        | undefined

    // Derive state from Redux store, avoiding local state duplication
    const { hasUnread, noResult } = useMemo(() => {
        const unreadCount =
            notifications?.filter((item) => !item.readed).length ?? 0
        return {
            hasUnread: unreadCount > 0,
            noResult: !notifications || notifications.length === 0,
        }
    }, [notifications])

    // Fetch notifications on component mount and set up polling
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await dispatch(getAllNotificationAction())
            setLoading(false)
        }

        fetchInitialData()

        // Set up polling with cleanup to prevent memory leaks
        const intervalId = setInterval(() => {
            dispatch(getAllNotificationAction())
        }, 1000 * 60 * 60) // every hour

        return () => clearInterval(intervalId)
    }, [dispatch])

    const handleMarkAllAsRead = () => {
        // TODO: This should dispatch a Redux action to update the backend and store.
        // Example: dispatch(markAllNotificationsAsRead());
        console.log('Dispatching markAllNotificationsAsRead action...')
    }

    const handleMarkAsRead = (id: string) => {
        // TODO: This should dispatch a Redux action to update the backend and store.
        // Example: dispatch(markNotificationAsRead(id));
        console.log(`Dispatching markNotificationAsRead action for id: ${id}`)
    }

    const handleViewAllActivity = () => {
        // Corrected path from 'notifiactions' to 'notifications'
        navigate('/notifications')
        notificationDropdownRef.current?.handleDropdownClose()
    }

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle dot={hasUnread} className={className} />
            }
            menuClass="min-w-[280px] md:min-w-[340px]"
            placement={larger.md ? 'bottom-end' : 'bottom'}
        >
            <Dropdown.Item variant="header">
                <div className="dark:border-gray-700 px-2 flex items-center justify-between mb-1">
                    <h6>Notifications</h6>
                    <Tooltip title="Mark all as read">
                        <Button
                            variant="plain"
                            shape="circle"
                            size="sm"
                            icon={<HiOutlineMailOpen className="text-xl" />}
                            onClick={handleMarkAllAsRead}
                        />
                    </Tooltip>
                </div>
            </Dropdown.Item>
            <ScrollBar
                className={classNames('overflow-y-auto', notificationHeight)}
            >
                {loading && noResult ? (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <Spinner size={40} />
                    </div>
                ) : noResult ? (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <div className="text-center">
                            <img
                                className="mx-auto mb-2 max-w-[150px]"
                                src="/img/others/no-notification.png"
                                alt="no-notification"
                            />
                            <h6 className="font-semibold">No notifications!</h6>
                            <p className="mt-1">You're all caught up.</p>
                        </div>
                    </div>
                ) : (
                    notifications?.map((item) => (
                        <NotificationItem
                            key={item.id}
                            notification={item}
                            onMarkAsRead={handleMarkAsRead}
                        />
                    ))
                )}
            </ScrollBar>
            <Dropdown.Item variant="header">
                <div className="pt-4">
                    <Button
                        block
                        variant="solid"
                        onClick={handleViewAllActivity}
                    >
                        View All
                    </Button>
                </div>
            </Dropdown.Item>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification