import { createAsyncThunk } from "@reduxjs/toolkit"

import { loginWithEmailAsync } from "./services"
import { AxiosResponse } from "axios"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"

export const logoutAction = createAsyncThunk<
  boolean,
  boolean
>(
  "auth/logout", () => {
    return true
  }
)

export const loginUserByEmailAction = createAsyncThunk<
  any, any
>(
  "auth/loginByEmail",
  async (loginRequest: any, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await loginWithEmailAsync(loginRequest)
      if (response?.data?.status === true) {
        return response?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.error || "Login failed",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
