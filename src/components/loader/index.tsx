import React, { useEffect } from 'react' 
import { useSelector } from 'react-redux'

import { hideMessage, lemSelector } from '../../reduxtool/lem/lemSlice'
import { LemState, MessageState } from '../../reduxtool/lem/types'
import { useAppDispatch } from '../../reduxtool/store'
import { Notification, Spinner, toast } from '../ui'

const Loader: React.FC = () => {
    const dispatch = useAppDispatch()
    const state: LemState = useSelector(lemSelector)
    const { message, loading } = state

    useEffect(() => {
        if (message && message !== null && !loading) {
            const { type, messageText, duration, position, onCloseAction } =
                message as MessageState
            const toastConfig  = {
                position,
                autoClose: duration || false,
                onClose: () => {
                    dispatch(hideMessage())
                    if (onCloseAction) {
                        onCloseAction()
                    }
                },
            }

            switch (type) {
                case 'error':
                  toast.push(<Notification closable type="danger" duration={3000}>
                    {messageText}
                </Notification>)
                    break

                case 'success':
                  toast.push(<Notification closable type="success" duration={3000}>
                    {messageText}
                </Notification>)
                    break

                default:
                  toast.push(<Notification closable type="info" duration={3000}>
                    {messageText}
                </Notification>)
                    break
            }
        }
        const handleBeforeUnload = () => {
            dispatch(hideMessage())
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [loading, message])

    if (loading) {
        return (
            <div className="modal d-flex loader-l">
                <Spinner />
            </div>
        )
    }
    return null
}

export default Loader
