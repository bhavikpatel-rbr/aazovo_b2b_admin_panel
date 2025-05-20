import { useEffect, useState, useRef } from 'react'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import {
    apiGetNotificationList,
    apiGetNotificationCount,
} from '@/services/CommonService'
import useResponsive from '@/utils/hooks/useResponsive'
import { useNavigate } from 'react-router-dom'

import type { DropdownRef } from '@/components/ui/Dropdown'
import { IoCalendarOutline } from 'react-icons/io5'
import { Avatar, Button, Calendar, ScrollBar } from '@/components/ui'
import { PiWarningLight } from 'react-icons/pi'
import { BsCameraVideo } from 'react-icons/bs'

type NotificationList = {
    id: string
    target: string
    description: string
    date: string
    image: string
    type: number
    location: string
    locationLabel: string
    status: string
    readed: boolean
}

const NotificationToggle = ({
    className,
    dot,
}: {
    className?: string
    dot: boolean
}) => {
    return (
        <div className={classNames('text-2xl', className)}>
            <IoCalendarOutline />
        </div>
    )
}

const notificationHeight = 'h-[280px]'

const _Calender = ({ className }: { className?: string }) => {
    const [notificationList, setNotificationList] = useState<
        NotificationList[]
    >([])
    const [unreadNotification, setUnreadNotification] = useState(false)
    const [noResult, setNoResult] = useState(false)
    const [loading, setLoading] = useState(false)

    const { larger } = useResponsive()

    const navigate = useNavigate()

    const getNotificationCount = async () => {
        const resp = await apiGetNotificationCount()
        if (resp.count > 0) {
            setNoResult(false)
            setUnreadNotification(true)
        } else {
            setNoResult(true)
        }
    }

    useEffect(() => {
        getNotificationCount()
    }, [])

    const onNotificationOpen = async () => {
        if (notificationList.length === 0) {
            setLoading(true)
            const resp = await apiGetNotificationList()
            setLoading(false)
            setNotificationList(resp)
        }
    }

    const onMarkAllAsRead = () => {
        const list = notificationList.map((item: NotificationList) => {
            if (!item.readed) {
                item.readed = true
            }
            return item
        })
        setNotificationList(list)
        setUnreadNotification(false)
    }

    const onMarkAsRead = (id: string) => {
        const list = notificationList.map((item) => {
            if (item.id === id) {
                item.readed = true
            }
            return item
        })
        setNotificationList(list)
        const hasUnread = notificationList.some((item) => !item.readed)

        if (!hasUnread) {
            setUnreadNotification(false)
        }
    }

    const notificationDropdownRef = useRef<DropdownRef>(null)

    const handleViewAllActivity = () => {
        navigate('/concepts/account/activity-log')
        if (notificationDropdownRef.current) {
            notificationDropdownRef.current.handleDropdownClose()
        }
    }

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle
                    dot={unreadNotification}
                    className={className}
                />
            }
            menuClass="min-w-[280px] md:min-w-[340px] h-auto min-h-none"
            placement={larger.md ? 'bottom-end' : 'bottom'}
            onOpen={onNotificationOpen}
        >
            <Calendar />


            <div className="w-full mt-3 ">
                <h6 className='my-2'>Schedule Today</h6>
                <div className="w-full">
                    <ScrollBar className="overflow-y-auto max-h-[280px]">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4 py-1">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <Avatar
                                            className={classNames('text-gray-900')}
                                            icon={<BsCameraVideo/>}
                                            shape="round"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold heading-text">Client Meeting</div>
                                        <div className="font-normal">Prepare contact draft</div>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold heading-text">
                                        3:00
                                    </span>
                                    <small> PM</small>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4 py-1">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <Avatar
                                            className={classNames('text-gray-900')}
                                            icon={<BsCameraVideo/>}
                                            shape="round"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold heading-text">Meeting Review</div>
                                        <div className="font-normal">Review campaign results</div>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold heading-text">
                                        3:00
                                    </span>
                                    <small> PM</small>
                                </div>
                            </div>
                        </div>
                        <Button className='w-full mt-2'>Add Event</Button>
                    </ScrollBar>
                </div>
            </div>
        </Dropdown>
    )
}

const Calender = withHeaderItem(_Calender)

export default Calender
