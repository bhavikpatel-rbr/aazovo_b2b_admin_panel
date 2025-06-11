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
export const loginUserByEmailAction = createAsyncThunk<
  any,
  any,
  { rejectValue: any } // It's good practice to type the reject value
>(
  "auth/loginByEmail",
  async (loginRequest: any, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await loginWithEmailAsync(loginRequest)

      // Case 1: API confirms successful login
      if (response?.data?.status) {
        // ADDED: Dispatch success message on login
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: "Login successful! Welcome.",
          })
        )
        return response?.data
      }

      // Case 2: API returns a known error (e.g., wrong password)
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.error || "Login failed. Please check your credentials.",
        })
      )
      return rejectWithValue(response?.data) // Reject with the specific error data
    } catch (error: unknown) {
      // Case 3: Network or other unexpected error
      // ADDED: Dispatch a generic error message
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: "An unexpected network error occurred. Please try again later.",
        })
      )
      return rejectWithValue(error)
    }
  }
)