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
      const payload = {
        ...loginRequest,
        attempt: loginAttemptCount,
      };

      const response: AxiosResponse<any> = await loginWithEmailAsync(payload);
      const data = response;
      // ✅ Backend says login successful
      if (data?.status === true) {
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: "Login successful! Welcome.",
          })
        );
        loginAttemptCount = 1;
        return data;
      }

      loginAttemptCount++;

      const errorMsg = data?.error || "Login failed. Please check your credentials.";
      // console.log(data)
      if (errorMsg.includes("Account temporarily blocked.")) {
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "error",
            messageText: "Your account is temporarily blocked. Try again after 5 minutes.",
          })
        );
        loginAttemptCount = 1;
      } else {
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "error",
            messageText: errorMsg,
          })
        );
      }

      return rejectWithValue(data);
    } catch (error: any) {
      loginAttemptCount++;

      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: "An unexpected error occurred. Please try again later.",
        })
      );

      return rejectWithValue(error);
    }
  }
);

