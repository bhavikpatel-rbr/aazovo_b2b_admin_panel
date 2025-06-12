import { createAsyncThunk } from "@reduxjs/toolkit"
import { AxiosResponse } from "axios"

import { loginWithEmailAsync } from "./services"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"

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
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "success",
          messageText: "You have been successfully logged out.",
        })
      )
      return true;
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
            messageText: "Login successful! Welcome.",
          })
        )
        return response?.data
      }

      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.error || "Login failed. Please check your credentials.",
        })
      )

      if (loginAttempt >= 3) {
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

