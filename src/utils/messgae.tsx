
import { toast, Notification } from '@/components/ui'

// Define a type for the expected structure of an API error response
interface ApiErrorResponse {
  message?: string
  errors?: {
    // This handles Laravel-style validation errors: "errors": { "field_name": ["message1", "message2"] }
    [key: string]: string[]
  }
}

/**
 * Displays a toast notification for API errors with type safety.
 * It intelligently extracts the error message from the response.
 * @param {ApiErrorResponse | any} responseData - The `data` object from the API response.
 */
export const showErrorToast = (responseData: ApiErrorResponse | any) => {
  let errorMessage = 'An unknown error occurred.'

  if (responseData && typeof responseData.message === 'string') {
    errorMessage = responseData.message
  } else if (responseData && responseData.errors) {
    const firstErrorKey = Object.keys(responseData.errors)[0]
    if (firstErrorKey && responseData.errors[firstErrorKey].length > 0) {
      errorMessage = responseData.errors[firstErrorKey][0]
    }
  }

  toast.push(
    <Notification title="Operation Failed" type="danger" duration={5000}>
      {errorMessage}
    </Notification>
  )
}