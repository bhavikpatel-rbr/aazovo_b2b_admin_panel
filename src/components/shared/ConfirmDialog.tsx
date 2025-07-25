import {
    HiCheckCircle,
    HiOutlineInformationCircle,
    HiOutlineExclamation,
    HiOutlineExclamationCircle,
} from 'react-icons/hi'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import type { ReactNode } from 'react'
import type { DialogProps } from '@/components/ui/Dialog'
import type { ButtonProps } from '@/components/ui/Button'

type StatusType = 'info' | 'success' | 'warning' | 'danger'

interface ConfirmDialogProps extends DialogProps {
    cancelText?: ReactNode | string
    confirmText?: ReactNode | string
    confirmButtonProps?: ButtonProps
    cancelButtonProps?: ButtonProps
    type?: StatusType
    title?: ReactNode | string
    onCancel?: () => void
    onConfirm?: () => void
}

const StatusIcon = ({ status }: { status: StatusType }) => {
    switch (status) {
        case 'info':
            return (
                <Avatar
                    className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"
                    shape="circle"
                >
                    <span className="text-2xl">
                        <HiOutlineInformationCircle />
                    </span>
                </Avatar>
            )
        case 'success':
            return (
                <Avatar
                    className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"
                    shape="circle"
                >
                    <span className="text-2xl">
                        <HiCheckCircle />
                    </span>
                </Avatar>
            )
        case 'warning':
            return (
                <Avatar
                    className="text-amber-600 bg-amber-100 dark:text-amber-100"
                    shape="circle"
                >
                    <span className="text-2xl">
                        <HiOutlineExclamationCircle />
                    </span>
                </Avatar>
            )
        case 'danger':
            return (
                <Avatar
                    className="text-red-600 bg-red-100 dark:text-red-100"
                    shape="circle"
                >
                    <span className="text-2xl">
                        <HiOutlineExclamation />
                    </span>
                </Avatar>
            )

        default:
            return null
    }
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
    const {
        type = 'info',
        title,
        children,
        onCancel,
        onConfirm,
        cancelText = 'Cancel',
        confirmText = 'Confirm',
        confirmButtonProps,
        cancelButtonProps,
        ...rest
    } = props

    const handleCancel = () => {
        onCancel?.()
    }

    const handleConfirm = () => {
        onConfirm?.()
    }

    return (
        <Dialog contentClassName="pb-0 px-0" {...rest}>
            <div className="px-6 pb-6 pt-2">
                {/* <div>
                    <StatusIcon status={type} />
                </div> */}
                <div className="">
                    <h5 className="mb-2">{title}</h5>
                    {children}
                </div>
            </div>
            <div className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-bl-2xl rounded-br-2xl">
                <div className="flex justify-end items-center gap-2">
                    <Button
                        size="sm"
                        onClick={handleCancel}
                        {...cancelButtonProps}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        onClick={handleConfirm}
                        {...confirmButtonProps}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ConfirmDialog
