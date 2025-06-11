import {
    HiCheckCircle,
    HiInformationCircle,
    HiExclamation,
    HiXCircle,
} from 'react-icons/hi'
import type { TypeAttributes, CommonProps } from '../@types/common'
import type { ReactNode, JSX } from 'react'

export interface StatusIconProps extends CommonProps {
    type: TypeAttributes.Status
    custom?: ReactNode | JSX.Element
    iconColor?: string
}

const ICONS: Record<
    TypeAttributes.Status,
    {
        color: string
        icon: JSX.Element
    }
> = {
    success: {
        color: 'text-success',
        icon: <HiCheckCircle size={36}/>,
    },
    info: {
        color: 'text-info',
        icon: <HiInformationCircle size={36}/>,
    },
    warning: {
        color: 'text-warning',
        icon: <HiExclamation size={36}/>,
    },
    danger: {
        color: 'text-error',
        icon: <HiXCircle size={36}/>,
    },
}

const StatusIcon = (props: StatusIconProps) => {
    const { type = 'info', custom, iconColor } = props

    const icon = ICONS[type]

    return (
        <span className={`text-2xl ${iconColor || icon.color}`}>
            {custom || icon.icon}
        </span>
    )
}

export default StatusIcon
