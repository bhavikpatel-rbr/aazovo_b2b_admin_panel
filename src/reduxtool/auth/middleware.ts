import { createAsyncThunk } from "@reduxjs/toolkit"
import { AxiosResponse } from "axios"

import { loginWithEmailAsync } from "./services"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"

let loginAttemptCount = 1;

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
  { rejectValue: any }
>(
  "auth/loginByEmail",
  async (loginRequest: any, { rejectWithValue, dispatch }) => {
    try {
      // Attach the current attempt count
      const payload = {
        ...loginRequest,
        attempt: loginAttemptCount,
      };

      const response: AxiosResponse<any> = await loginWithEmailAsync(payload);

      if (response?.status === 200) {
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: "Login successful! Welcome.",
          })
        );
        loginAttemptCount = 1; // ✅ Reset on success
        return response?.data;
      }

      loginAttemptCount++; // ❌ Login failed: increase count

      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.error || "Login failed. Please check your credentials.",
        })
      );
      return rejectWithValue(response?.data);
    } catch (error: unknown) {
      loginAttemptCount++; // Also increase here just in case backend couldn't be reached

      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: "An unexpected network error occurred. Please try again later.",
        })
      );
      return rejectWithValue(error);
    }
  }
);
