import { createAsyncThunk } from "@reduxjs/toolkit"

import { addBlogsAsync, addBrandAsync, addcategoryAsync, addcontinentAsync, addcountryAsync, addCurrencyAsync, addDocumentListAsync, addDocumentTypeAsync, addPaymentTermAsync, addPriceListAsync, addSlidersAsync, addTrandingImageAsync, addUnitAsync, deletBrandListAsync, deletcategoryListAsync, deletcontinentAsync, deletcountryAsync, deletCurrencyAsync, deletDocumentListAsync, deletDocumentTypeAsync, deleteAllBrandListAsync, deleteAllcategoryListAsync, deleteAllcontinentAsync, deleteAllcountryAsync, deleteAllCurrencyAsync, deleteAllDocumentTypeAsync, deleteAllPaymentTermAsync, deleteAllPriceListAsync, deleteAllSlidersListAsync, deleteAllTrandingImageAsync, deleteAllUnitAsync, deletePriceListAsync, deletPaymentTermAsync, deletSlidersListAsync, deletTrandingImageAsync, deletUnitAsync, editBlogsAsync, editBrandListAsync, editcategoryListAsync, editcontinentAsync, editcountryAsync, editCurrencyAsync, editDocumentListAsync, editDocumentTypeAsync, editPaymentTermAsync, editPriceListAsync, editSlidersListAsync, editTrandingImageAsync, editUnitAsync, getBlogsAsync, getBrandAsync, getcategoryAsync, getCompanyProfileAsync, getcontinentAsync, getcountryAsync, getCurrencyAsync, getDocumentListAsync, getDocumentTypeAsync, getExportMappingsAsync, getPaymentTermAsync, getPriceListAsync, getProductAsync, getSlidersAsync, getTrandingImageAsync, getUnitAsync, getwallListingAsync } from "./services"
import { AxiosResponse } from "axios"
import { defaultMessageObj } from "../lem/types"
import { showMessage } from "../lem/lemSlice"
import { log } from "console"
import { json } from "d3-fetch"

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
      console.log("data", data);

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
      console.log("data", data);

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
      console.log("data", data);

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
      console.log("data", data);

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
      console.log("data", data);

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
  "auth/getBlogs",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getBlogsAsync()

      console.log("response", response?.data?.status);

      if (response?.data?.status === true) {
        console.log("response?.data?.data", response?.data?.data);

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
  "auth/addBlog",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addBlogsAsync(data)
      if (response?.data?.status === true) {

        dispatch(getBlogsAction())

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




export const editBlogAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editBrand",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editBlogsAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getBlogsAction());
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          })
        );
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

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


export const getProductsAction = createAsyncThunk(
  "auth/product",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getProductAsync()
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

export const addProductAction = createAsyncThunk<any, any>(
  "auth/addBrand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addBrandAsync(data)
      if (response?.data?.status === true) {

        dispatch(getBrandAction())

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


export const editProductAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editBrand",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editBrandListAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getBrandAction());
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          })
        );
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteProductAction = createAsyncThunk<any, any>(
  "auth/deleteBrand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletBrandListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getBrandAction())
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

export const deleteAllProductsAction = createAsyncThunk<any, any>(
  "auth/deleteAllBrand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllBrandListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getBrandAction())
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

export const addBrandAction = createAsyncThunk<any, any>(
  "auth/addBrand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addBrandAsync(data)
      if (response?.data?.status === true) {

        dispatch(getBrandAction())

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


export const editBrandAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editBrand",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editBrandListAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getBrandAction());
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          })
        );
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteBrandAction = createAsyncThunk<any, any>(
  "auth/deleteBrand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletBrandListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getBrandAction())
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

export const deleteAllBrandsAction = createAsyncThunk<any, any>(
  "auth/deleteAllBrand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllBrandListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getBrandAction())
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

export const getCategoriesAction = createAsyncThunk(
  "auth/category",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getcategoryAsync()
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
export const addCategoryAction = createAsyncThunk<any, any>(
  "auth/addcategory",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addcategoryAsync(data)
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




export const editCategoryAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editCategory",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editcategoryListAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getBrandAction());
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          })
        );
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteCategoryAction = createAsyncThunk<any, any>(
  "auth/deletcategory",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("id", data);

      const response: AxiosResponse<any> = await deletcategoryListAsync(data)
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

export const deleteAllCategoriesAction = createAsyncThunk<any, any>(
  "auth/category",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllcategoryListAsync(data)
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

export const getWallItemsAction = createAsyncThunk(
  "auth/enquiry",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getwallListingAsync()
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
export const addWallItemAction = createAsyncThunk<any, any>(
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


export const editWallItemAction = createAsyncThunk<any, any>(
  "auth/editdocument_master",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

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

export const deleteWallItemAction = createAsyncThunk<any, any>(
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

export const deleteAllWallItemsAction = createAsyncThunk<any, any>(
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

export const getPriceListAction = createAsyncThunk(
  "auth/getPriceList",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getPriceListAsync()
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

export const addPriceListAction = createAsyncThunk<any, any>(
  "auth/addPriceList",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addPriceListAsync(data)
      if (response?.data?.status === true) {

        dispatch(getPriceListAction())

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

export const editPriceListAction = createAsyncThunk<any, any>(
  "auth/editPriceList",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editPriceListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getPriceListAction())
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

export const deletePriceListAction = createAsyncThunk<any, any>(
  "auth/deletPriceList",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletePriceListAsync(data)
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

export const deleteAllPriceListAction = createAsyncThunk<any, any>(
  "auth/delete",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllPriceListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getPriceListAction())
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

export const getSlidersAction = createAsyncThunk(
  "auth/Sliders",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSlidersAsync()
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

export const addSliderAction = createAsyncThunk<any, any>(
  "auth/addSliders",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addSlidersAsync(data)
      if (response?.data?.status === true) {

        dispatch(getSlidersAction())

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


export const editSliderAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editSliders",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editSlidersListAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getSlidersAction());
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          })
        );
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteSliderAction = createAsyncThunk<any, any>(
  "auth/deleteSliders",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletSlidersListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getSlidersAction())
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

export const deleteAllSlidersAction = createAsyncThunk<any, any>(
  "auth/deleteAllSliders",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllSlidersListAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getSlidersAction())
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


export const getCompanyProfileAction = createAsyncThunk(
  "auth/CompanyProfile",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getCompanyProfileAsync()
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




export const updateCompanyProfileAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editSliders",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editSlidersListAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getSlidersAction());
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "success",
          })
        );
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getTrendingImagesAction = createAsyncThunk(
  "auth/getTrandingImage",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getTrandingImageAsync()
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

export const addTrendingImageAction = createAsyncThunk<any, any>(
  "auth/addTrandingImage",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addTrandingImageAsync(data)
      if (response?.data?.status === true) {

        dispatch(getTrendingImagesAction())

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

export const editTrendingImageAction = createAsyncThunk<any, any>(
  "auth/editTrandingImage",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editTrandingImageAsync(data)
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

export const deleteTrendingImageAction = createAsyncThunk<any, any>(
  "auth/deletTrandingImage",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletTrandingImageAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getTrendingImagesAction())
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

export const deleteMultipleTrendingImagesAction = createAsyncThunk<any, any>(
  "auth/TrandingImagedelete",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllTrandingImageAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getTrendingImagesAction())
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

