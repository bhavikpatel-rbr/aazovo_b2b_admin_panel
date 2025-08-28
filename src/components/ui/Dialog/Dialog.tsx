import Modal from 'react-modal'
import classNames from 'classnames'
import CloseButton from '../CloseButton'
import { motion } from 'framer-motion'
import type ReactModal from 'react-modal'
import type { MouseEvent, CSSProperties } from 'react'

export interface DialogProps extends ReactModal.Props {
    closable?: boolean
    contentClassName?: string
    height?: string | number
    onClose?: (e: MouseEvent<HTMLSpanElement>) => void
    width?: string | number
}

const Dialog = (props: DialogProps) => {
    const {
        bodyOpenClassName,
        children,
        className,
        closable = true,
        closeTimeoutMS = 150,
        contentClassName,
        // We get width and height directly to check if they are undefined
        height,
        width,
        isOpen,
        onClose,
        overlayClassName,
        portalClassName,
        style,
        ...rest
    } = props

    const onCloseClick = (e: MouseEvent<HTMLSpanElement>) => {
        onClose?.(e)
    }

    const renderCloseButton = (
        <CloseButton
            absolute
            className="ltr:right-6 rtl:left-6 top-4.5"
            onClick={onCloseClick}
        />
    )

    // --- Conditional Style Logic ---
    // Start with base styles that are always applied
    const dynamicContentStyle: CSSProperties = {
        inset: 'unset',
        maxWidth: '90vw', // Always responsive
        maxHeight: '90vh', // Always responsive
    }

    // If a width is provided, use it as a fixed width.
    // Otherwise, set a minimum width.
    if (width !== undefined) {
        dynamicContentStyle.width = width
    } else {
        dynamicContentStyle.minWidth = 700
    }

    // If a height is provided, use it as a fixed height.
    // Otherwise, set a minimum height.
    if (height !== undefined) {
        dynamicContentStyle.height = height
    } else {
        dynamicContentStyle.minHeight = 700
    }
    // --- End of Conditional Style Logic ---


    // Combine our dynamic styles with any user-provided styles
    const finalStyle = {
        content: dynamicContentStyle,
        ...style,
    }

    // Classes for the inner container to enable scrolling
    const dialogClass = classNames(
        'dialog-content',
        'h-full', // Take full height of the container
        'overflow-auto', // Add scrollbars if inner content overflows
        contentClassName
    )

    return (
        <Modal
            className={{
                base: classNames('dialog', className as string),
                afterOpen: 'dialog-after-open',
                beforeClose: 'dialog-before-close',
            }}
            overlayClassName={{
                base: classNames('dialog-overlay', overlayClassName as string),
                afterOpen: 'dialog-overlay-after-open',
                beforeClose: 'dialog-overlay-before-close',
            }}
            portalClassName={classNames('dialog-portal', portalClassName)}
            bodyOpenClassName={classNames('dialog-open', bodyOpenClassName)}
            ariaHideApp={false}
            isOpen={isOpen}
            
            style={finalStyle} // Use the final calculated style
            closeTimeoutMS={closeTimeoutMS}
            {...rest}
        >
            <motion.div
                className={dialogClass}
                initial={{ transform: 'scale(0.9)' }}
                animate={{
                    transform: isOpen ? 'scale(1)' : 'scale(0.9)',
                }}
            >
                {closable && renderCloseButton}
                {children}
            </motion.div>
        </Modal>
    )
}

Dialog.displayName = 'Dialog'

export default Dialog