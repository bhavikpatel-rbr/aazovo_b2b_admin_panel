import { TypeOptions, ToastPosition } from "react-toastify"

export interface LemState {
  loading: boolean
  message: string | MessageState | undefined
}

export interface MessageState {
  type: TypeOptions
  messageText?: string
  duration?: number
  position?: ToastPosition
  onCloseAction?: (data?: unknown) => void
}

export const defaultMessageObj: MessageState = {
  type: "info",
  messageText: "",
  duration: 3000,
  position: "top-right",
}