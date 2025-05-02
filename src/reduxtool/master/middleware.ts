import { createAsyncThunk } from "@reduxjs/toolkit"

import { addUnitAsync, deletUnitAsync, editUnitAsync, getUnitAsync } from "./services"
import { AxiosResponse } from "axios"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"

export const getUnitAction = createAsyncThunk(
  "auth/getUnit",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getUnitAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addUnitAction = createAsyncThunk<any, any>(
  "auth/addUnit",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addUnitAsync(data)
      if (response?.data?.status === true) {
        
        dispatch(getUnitAction())

        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          }))
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editUnitAction = createAsyncThunk<any, any>(
  "auth/editUnit",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editUnitAsync(data)
      if (response?.data?.status === true) {
        dispatch(getUnitAction())
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          }))
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deletUnitAction = createAsyncThunk<any, any>(
  "auth/deletUnit",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletUnitAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getUnitAction())
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          }))
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
