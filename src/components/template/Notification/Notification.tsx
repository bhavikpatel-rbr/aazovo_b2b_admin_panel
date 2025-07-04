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
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { useAppDispatch } from '@/reduxtool/store'
import { PiEnvelopeLight, PiWarningLight } from 'react-icons/pi'
import { useSelector } from 'react-redux'
import { getAllNotificationAction } from '@/reduxtool/master/middleware'

// Define a clear type for notifications
type Notification = {
    id: string
    notification_title: string
    description: string
    created_at: string // Assuming this is the correct field from your API
    type: 'warning' | 'inquiry' | 'default'
    readed: boolean
}

const notificationHeight = 'h-[280px]'

const NotificationAvatar = ({ type }: { type: Notification['type'] }) => {
    // ... (no changes here)
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
                    className="bg-blue-500"
                />
            )
        default:
            return <Avatar icon={<PiEnvelopeLight />} className="bg-primary" />
    }
}

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
                {/* Corrected 'message' to 'description' based on your type definition */}
                <span>{notification?.message}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(notification?.created_at).toLocaleTimeString()}
                </span>
            </div>
        </div>
        {/* {!notification.readed && (
            <Badge className="absolute top-4 ltr:right-4 rtl:left-4 mt-1.5" />
        )} */}
    </div>
)

const _Notification = ({ className }: { className?: string }) => {
    const [loading, setLoading] = useState(false)
    const { larger } = useResponsive()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const notificationDropdownRef = useRef<DropdownRef>(null)

    const notifications = useSelector(masterSelector).getNotification?.data as
        | Notification[]
        | undefined

    // ✅ FIX #1: Make the useMemo hook robust by checking if `notifications` is an array.
    const { hasUnread, noResult } = useMemo(() => {
        // Add this check to prevent runtime errors
        if (!Array.isArray(notifications)) {
            return {
                hasUnread: false,
                noResult: true,
            }
        }

        const unreadCount = notifications.filter((item) => !item.readed).length
        return {
            hasUnread: unreadCount > 0,
            noResult: notifications.length === 0,
        }
    }, [notifications])

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

    const handleMarkAllAsRead = () => {
        console.log('Dispatching markAllNotificationsAsRead action...')
    }

    const handleMarkAsRead = (id: string) => {
        console.log(`Dispatching markNotificationAsRead action for id: ${id}`)
    }

    const handleViewAllActivity = () => {
        navigate('/notifiactions')
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
                            notificationHeight
                        )}
                    >
                        <Spinner size={40} />
                    </div>
                ) : noResult ? (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight
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
                    // ✅ FIX #2: Add an Array.isArray check before mapping to prevent crashes.
                    Array.isArray(notifications) &&
                    notifications.map((item) => (
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