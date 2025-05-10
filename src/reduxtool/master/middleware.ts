import { createAsyncThunk } from "@reduxjs/toolkit"

import { addcontinentAsync, addcountryAsync, addCurrencyAsync, addDocumentListAsync, addDocumentTypeAsync, addPaymentTermAsync, addUnitAsync, deletcontinentAsync, deletcountryAsync, deletCurrencyAsync, deletDocumentListAsync, deletDocumentTypeAsync, deleteAllcontinentAsync, deleteAllcountryAsync, deleteAllCurrencyAsync, deleteAllDocumentTypeAsync, deleteAllPaymentTermAsync, deleteAllUnitAsync, deletPaymentTermAsync, deletUnitAsync, editcontinentAsync, editcountryAsync, editCurrencyAsync, editDocumentListAsync, editDocumentTypeAsync, editPaymentTermAsync, editUnitAsync, getBrandAsync, getcontinentAsync, getcountryAsync, getCurrencyAsync, getDocumentListAsync, getDocumentTypeAsync, getExportMappingsAsync, getPaymentTermAsync, getUnitAsync } from "./services"
import { AxiosResponse } from "axios"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"
import { log } from "console"

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

export const deletAllUnitAction = createAsyncThunk<any, any>(
  "auth/delete",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllUnitAsync(data)
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

export const getDocumentTypeAction = createAsyncThunk(
  "auth/document_type",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getDocumentTypeAsync()
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

export const addDocumentTypeAction = createAsyncThunk<any, any>(
  "auth/adddocument_type",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDocumentTypeAsync(data)
      if (response?.data?.status === true) {

        dispatch(getDocumentTypeAction())

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


export const editDocumentTypeAction = createAsyncThunk<any, any>(
  "auth/editdocument_type",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editDocumentTypeAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDocumentTypeAction())
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

export const deleteDocumentTypeAction = createAsyncThunk<any, any>(
  "auth/deletdocument_type",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDocumentTypeAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getDocumentTypeAction())
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

export const deleteAllDocumentTypeAction = createAsyncThunk<any, any>(
  "auth/deletealldocument_type",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDocumentTypeAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getDocumentTypeAction())
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


export const getPaymentTermAction = createAsyncThunk(
  "auth/payment_term",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getPaymentTermAsync()
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

export const addPaymentTermAction = createAsyncThunk<any, any>(
  "auth/addpayment_term",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addPaymentTermAsync(data)
      if (response?.data?.status === true) {

        dispatch(getPaymentTermAction())

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


export const editPaymentTermAction = createAsyncThunk<any, any>(
  "auth/editpayment_term",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data",data);
      
      const response: AxiosResponse<any> = await editPaymentTermAsync(data)
      if (response?.data?.status === true) {
        dispatch(getPaymentTermAction())
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

export const deletePaymentTermAction = createAsyncThunk<any, any>(
  "auth/deletpayment_term",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletPaymentTermAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getPaymentTermAction())
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

export const deleteAllPaymentTermAction = createAsyncThunk<any, any>(
  "auth/payment_term",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllPaymentTermAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getPaymentTermAction())
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

export const getCurrencyAction = createAsyncThunk(
  "auth/currency",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getCurrencyAsync()
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

export const addCurrencyAction = createAsyncThunk<any, any>(
  "auth/addcurrency",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addCurrencyAsync(data)
      if (response?.data?.status === true) {

        dispatch(getCurrencyAction())

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


export const editCurrencyAction = createAsyncThunk<any, any>(
  "auth/editcurrency",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data",data);
      
      const response: AxiosResponse<any> = await editCurrencyAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCurrencyAction())
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

export const deleteCurrencyAction = createAsyncThunk<any, any>(
  "auth/deletcurrency",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletCurrencyAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getCurrencyAction())
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

export const deleteAllCurrencyAction = createAsyncThunk<any, any>(
  "auth/currency",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllCurrencyAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getCurrencyAction())
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


export const getContinentsAction = createAsyncThunk(
  "auth/continent",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getcontinentAsync()
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

export const addContinentAction = createAsyncThunk<any, any>(
  "auth/addcontinent",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addcontinentAsync(data)
      if (response?.data?.status === true) {

        dispatch(getContinentsAction())

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


export const editContinentAction = createAsyncThunk<any, any>(
  "auth/editcontinent",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data",data);
      
      const response: AxiosResponse<any> = await editcontinentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getContinentsAction())
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

export const deleteContinentAction = createAsyncThunk<any, any>(
  "auth/deletcontinent",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcontinentAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getContinentsAction())
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

export const deleteAllContinentsAction = createAsyncThunk<any, any>(
  "auth/continent",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllcontinentAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getContinentsAction())
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


export const getCountriesAction = createAsyncThunk(
  "auth/country",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getcountryAsync()
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

export const addCountryAction = createAsyncThunk<any, any>(
  "auth/addcountry",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addcountryAsync(data)
      if (response?.data?.status === true) {

        dispatch(getCountriesAction())

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


export const editCountryAction = createAsyncThunk<any, any>(
  "auth/editcountry",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data",data);
      
      const response: AxiosResponse<any> = await editcountryAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCountriesAction())
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

export const deleteCountryAction = createAsyncThunk<any, any>(
  "auth/deletcountry",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcountryAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getCountriesAction())
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

export const deleteAllCountriesAction = createAsyncThunk<any, any>(
  "auth/country",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<{ status: boolean; data: any; message?: string }> = await deleteAllcountryAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getCountriesAction())
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


export const getDocumentListAction = createAsyncThunk(
  "auth/document_master",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getDocumentListAsync()
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

export const addDocumentListAction = createAsyncThunk<any, any>(
  "auth/adddocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDocumentListAsync(data)
      if (response?.data?.status === true) {

        dispatch(getDocumentListAction())

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


export const editDocumentListAction = createAsyncThunk<any, any>(
  "auth/editdocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data",data);
      
      const response: AxiosResponse<any> = await editDocumentListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDocumentListAction())
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

export const deleteDocumentListAction = createAsyncThunk<any, any>(
  "auth/deletdocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDocumentListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getDocumentListAction())
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

export const deleteAllDocumentListAction = createAsyncThunk<any, any>(
  "auth/document_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllcountryAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getDocumentListAction())
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

export const getBlogsAction = createAsyncThunk(
  "auth/brand",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getBrandAsync()
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

export const addBlogAction = createAsyncThunk<any, any>(
  "auth/adddocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDocumentListAsync(data)
      if (response?.data?.status === true) {

        dispatch(getDocumentListAction())

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


export const editBlogAction = createAsyncThunk<any, any>(
  "auth/editdocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data",data);
      
      const response: AxiosResponse<any> = await editDocumentListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDocumentListAction())
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

export const deleteBlogAction = createAsyncThunk<any, any>(
  "auth/deletdocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDocumentListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getDocumentListAction())
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

export const deleteAllBlogsAction = createAsyncThunk<any, any>(
  "auth/document_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllcountryAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getDocumentListAction())
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


export const getBrandAction = createAsyncThunk(
  "auth/brand",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getBrandAsync()
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
export const getExportMappingsAction = createAsyncThunk(
  "auth/export_mapping",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getExportMappingsAsync()
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
