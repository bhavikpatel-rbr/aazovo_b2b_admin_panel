import { createAsyncThunk } from "@reduxjs/toolkit"
import { AxiosResponse } from "axios"

import { forgotPasswordAsync, loginWithEmailAsync, updateUserProfilePictureAsync } from "./services"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"
import { logOutAsync } from "../master/services"
import { apiForgotPassword } from "@/services/AuthService"

/**
 * Logout Action
 * Dispatches success or failure messages.
 */
export const logoutAction = createAsyncThunk<
  boolean, // Type for the returned value on success
  void,    // Type for the thunk argument (none in this case)
  { rejectValue: string } // Type for the rejectWithValue payload
>(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // In a real app, you might have an API call here to invalidate a token.
      // For example: await logoutFromApi();

      // MODIFIED: Dispatch success message on logout
      const response: AxiosResponse<any> = await logOutAsync();
      if (response) {
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: "You have been successfully logged out.",
          })
        )
        return true;
      }
    } catch (error: unknown) {
      // MODIFIED: Dispatch error message on logout failure
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: "Logout failed. Please try again.",
        })
      )
      return rejectWithValue("Logout failed")
    }
  }
)

/**
 * Login Action
 * Dispatches success or failure messages.
 */
let loginAttempt = 0 // <-- Global module-scoped variable

export const loginUserByEmailAction = createAsyncThunk<
  any,
  any,
  { rejectValue: any }
>(
  "auth/loginByEmail",
  async (loginRequest: any, { rejectWithValue, dispatch }) => {
    loginAttempt++ // Increment attempt count

    try {
      const payloadWithAttempt = { ...loginRequest, attempt: loginAttempt }

      const response: AxiosResponse<any> = await loginWithEmailAsync(payloadWithAttempt)

      if (response?.data?.status) {
        loginAttempt = 0 // Reset attempt count on success
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message,
          })
        )
        return response?.data
      }
      // console.log("response", response)
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message,
        })
      )

      if (loginAttempt > 4) {
        window.location.reload() // Refresh page after 3 failed attempts
      }

      return rejectWithValue(response?.data)
    } catch (error: unknown) {
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: "An unexpected network error occurred. Please try again later.",
        })
      )

      if (loginAttempt >= 3) {
        window.location.reload() // Refresh page after 3 failed attempts
      }

      return rejectWithValue(error)
    }
  }
)

export const forgotPasswordAction = createAsyncThunk<
  any,
  any,
  { rejectValue: any }
>(
  'auth/forgotPassword', // Action type prefix
  async (data, { rejectWithValue }) => {
    try {
      // Call the API service function
      const response = await forgotPasswordAsync(data)

      // Check for successful response from the API
      if (response.data && response.data.status) {
        // Return the successful response data
        // This will be the payload of the 'fulfilled' action
        return response.data
      } else {
        // If API returns a known error (e.g., status: false)
        // Use rejectWithValue to send a specific error message
        return rejectWithValue(response.data.message || 'Invalid request')
      }
    } catch (error: any) {
      // Catch network errors or other exceptions
      // and send a generic or specific error message
      return rejectWithValue(
        error.response?.data?.message || error.message || 'An unknown error occurred'
      )
    }
  }
)
export const updateUserProfilePictureAction = createAsyncThunk<
  any,
  any,
  { rejectValue: any }
>(
  'auth/updateUserProfilePictureAction', // Action type prefix
  async (data, { rejectWithValue }) => {
    try {
      // Call the API service function
      const response = await updateUserProfilePictureAsync(data)

      // Check for successful response from the API
      if (response.status) {
        // Return the successful response data
        // This will be the payload of the 'fulfilled' action
        return response.status
      } else {
        // If API returns a known error (e.g., status: false)
        // Use rejectWithValue to send a specific error message
        return rejectWithValue(response.data.message || 'Invalid request')
      }
    } catch (error: any) {
      // Catch network errors or other exceptions
      // and send a generic or specific error message
      return rejectWithValue(
        error.response?.data?.message || error.message || 'An unknown error occurred'
      )
    }
  }
)

