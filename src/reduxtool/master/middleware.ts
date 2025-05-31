import { createAsyncThunk } from "@reduxjs/toolkit"

import { AxiosResponse } from "axios"
import { showMessage } from "../lem/lemSlice"
import { defaultMessageObj } from "../lem/types"
import { addAutoEmailAsync, addAutoEmailTemplatesAsync, addBlogsAsync, addBrandAsync, addBugReportAsync, addcategoryAsync, addcompanyAsync, addcontinentAsync, addcountryAsync, addCurrencyAsync, addDepartmentAsync, addDesignationAsync, addDocumentListAsync, addDocumentTypeAsync, addDomainsAsync, addEmailCampaignsAsync, addEmailTemplatesAsync, addHomeCategoryAsync, addJobApplicationAsync, addJobDepartmentAsync, addJobPostsAsync, addLeadAsync, addMemberAsync, addNumberSystemsAsync, addpartnerAsync, addPaymentTermAsync, addPriceListAsync, addProductSepecificationAsync, addRequestFeedbacksAsync, addRowDataAsync, addSlidersAsync, addTrandingCarouselAsync, addTrandingImageAsync, addUnitAsync, changeProductStatusAsync, deletBlogsAsync, deletBrandListAsync, deletBugReportAsync, deletcategoryListAsync, deletcompanyAsync, deletcontinentAsync, deletcountryAsync, deletCurrencyAsync, deletDepartmentAsync, deletDesignationAsync, deletDocumentListAsync, deletDocumentTypeAsync, deletDomainsAsync, deleteAllAutoEmailAsync, deleteAllAutoEmailTemplatesAsync, deleteAllBlogsAsync, deleteAllBrandListAsync, deleteAllBugReportAsync, deleteAllcategoryListAsync, deleteAllcompanyAsync, deleteAllcontinentAsync, deleteAllcountryAsync, deleteAllCurrencyAsync, deleteAllDepartmentAsync, deleteAllDesignationAsync, deleteAllDocumentListAsync, deleteAllDocumentTypeAsync, deleteAllEmailCampaignsAsync, deleteAllEmailTemplatesAsync, deleteAllHomeCategoryAsync, deleteAllInquiriesAsync, deleteAllJobApplicationAsync, deleteAllJobDepartmentAsync, deleteAllJobPostsAsync, deleteAllLeadAsync, deleteAllMemberAsync, deleteAllNumberSystemsAsync, deleteAllpartnerAsync, deleteAllPaymentTermAsync, deleteAllPriceListAsync, deleteAllProductSepecificationAsync, deleteAllRequestFeedbacksAsync, deleteAllRowDataAsync, deleteAllSlidersListAsync, deleteAllTrandingCarouselAsync, deleteAllTrandingImageAsync, deleteAllUnitAsync, deleteAutoEmailAsync, deleteAutoEmailTemplatesAsync, deleteDomainsAsync, deleteEmailCampaignsAsync, deleteEmailTemplatesAsync, deleteJobApplicationAsync, deleteLeadAsync, deleteMemberAsync, deletepartnerAsync, deletePriceListAsync, deleteRequestFeedbacksAsync, deletHomeCategoryAsync, deletJobDepartmentAsync, deletJobPostsAsync, deletNumberSystemsAsync, deletPaymentTermAsync, deletProductListAsync, deletProductSepecificationAsync, deletRowDataAsync, deletSlidersListAsync, deletTrandingCarouselAsync, deletTrandingImageAsync, deletUnitAsync, editAutoEmailAsync, editAutoEmailTemplatesAsync, editBlogsAsync, editBrandListAsync, editBugReportAsync, editcategoryListAsync, editcompanyAsync, editCompanyProfileListAsync, editcontinentAsync, editcountryAsync, editCurrencyAsync, editDepartmentAsync, editDesignationAsync, editDocumentListAsync, editDocumentTypeAsync, editDomainsAsync, editEmailCampaignsAsync, editEmailTemplatesAsync, editGlobalSettingAsync, editHomeCategoryAsync, editJobApplicationAsync, editJobDepartmentAsync, editJobPostsAsync, editLeadAsync, editMemberAsync, editNumberSystemsAsync, editpartnerAsync, editPaymentTermAsync, editPriceListAsync, editProductSepecificationAsync, editRequestFeedbacksAsync, editRowDataAsync, editSlidersListAsync, editTrandingCarouselAsync, editTrandingImageAsync, editUnitAsync, getAllproductAsync, getAutoEmailAsync, getAutoEmailTemplatesAsync, getAutoMatchDataAsync, getBlogsAsync, getBrandAsync, getBugReportAsync, getBuyerListingsAsync, getcategoryAsync, getcompanyAsync, getCompanyProfileAsync, getcontinentAsync, getcountryAsync, getCurrencyAsync, getDepartmentAsync, getDesignationAsync, getDocumentListAsync, getDocumentTypeAsync, getDomainsAsync, getEmailCampaignsAsync, getEmailTemplatesAsync, getExportMappingsAsync, getGlobalSettingAsync, getHomeCategoryAsync, getInquiriesAsync, getJobApplicationAsync, getJobDepartmentAsync, getJobPostsAsync, getLeadAsync, getMailTemplatesAsync, getMemberAsync, getMembersAsync, getNumberSystemsAsync, getpartnerAsync, getPaymentTermAsync, getPriceListAsync, getProductAsync, getProductSepecificationAsync, getRequestFeedbacksAsync, getRolesAsync, getRowDataAsync, getSellerListingsAsync, getSlidersAsync, getSubcategoriesByCategoryIdAsync, getSubcategoriesByIdAsync, getSubscribersAsync, getTrandingCarouseAsync, getTrandingImageAsync, getUnitAsync, getUsersAsync, getwallListingAsync, importRowDataAsync } from "./services"


export const getLeadAction = createAsyncThunk(
  "auth/getLead",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getLeadAsync()
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

export const addLeadAction = createAsyncThunk<any, any>(
  "auth/addLead",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addLeadAsync(data)
      if (response?.data?.status === true) {

        dispatch(getLeadAction())

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

export const editLeadAction = createAsyncThunk<any, any>(
  "auth/editLead",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editLeadAsync(data)
      if (response?.data?.status === true) {
        dispatch(getLeadAction())
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

export const deleteLeadAction = createAsyncThunk<any, any>(
  "auth/deleteLead",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteLeadAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getLeadAction())
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

export const deleteAllLeadsAction = createAsyncThunk<any, any>(
  "auth/deleteAllLead",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllLeadAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getLeadAction())
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
      const response: AxiosResponse<any> = await deleteAllDocumentListAsync(data)
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
      const response: AxiosResponse<any> = await deletBlogsAsync(data)
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
      const response: AxiosResponse<any> = await deleteAllBlogsAsync(data)
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
        console.log(response?.data?.data);
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
  "auth/deleteProduct",
  async (data, { rejectWithValue, dispatch }) => {
    console.log(data);
    try {
      const response: AxiosResponse<any> = await deletProductListAsync(data)
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
  "auth/deleteAllProduct",
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
      // console.log(data);
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
      const response: AxiosResponse<any> = await editCompanyProfileListAsync(payload.id, payload.formData);

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


export const getTrendingCarouselAction = createAsyncThunk(
  "auth/getTrendingCarouse",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getTrandingCarouseAsync()
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

export const addTrendingCarouselAction = createAsyncThunk<any, any>(
  "auth/addTrendingCarousel",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addTrandingCarouselAsync(data)
      if (response?.data?.status === true) {

        dispatch(getTrendingCarouselAction())

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



export const editTrendingCarouselAction = createAsyncThunk<any, any>(
  "auth/editTrendingCarousel",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editTrandingCarouselAsync(data)
      if (response?.data?.status === true) {
        dispatch(getTrendingCarouselAction())
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

export const deleteTrendingCarouselAction = createAsyncThunk<any, any>(
  "auth/deletTrendingCarousel",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletTrandingCarouselAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getTrendingCarouselAction())
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

export const deleteMultipleTrendingCarouselAction = createAsyncThunk<any, any>(
  "auth/TrendingCarouseldelete",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllTrandingCarouselAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getTrendingCarouselAction())
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

export const getProductSpecificationsAction = createAsyncThunk(
  "auth/getProductSpecifications",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getProductSepecificationAsync()
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

export const addProductSpecificationAction = createAsyncThunk<any, any>(
  "auth/addProductSpecifications",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addProductSepecificationAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editProductSpecificationAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editProductSpecifications",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editProductSepecificationAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteProductSpecificationAction = createAsyncThunk<any, any>(
  "auth/deletProductSpecifications",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletProductSepecificationAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllProductSpecificationsAction = createAsyncThunk<any, any>(
  "auth/deleteProductSpecifications",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllProductSepecificationAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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


export const getDesignationsAction = createAsyncThunk(
  "auth/getDesignation",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getDesignationAsync()
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

export const addDesignationAction = createAsyncThunk<any, any>(
  "auth/addDesignation",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDesignationAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editDesignationAction = createAsyncThunk<any, any>(
  "auth/editDesignation",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editDesignationAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteDesignationAction = createAsyncThunk<any, any>(
  "auth/deletDesignation",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDesignationAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllDesignationsAction = createAsyncThunk<any, any>(
  "auth/deleteDesignation",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDesignationAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const getDepartmentsAction = createAsyncThunk(
  "auth/getDepartments",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getDepartmentAsync()
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

export const addDepartmentAction = createAsyncThunk<any, any>(
  "auth/addDepartments",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDepartmentAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editDepartmentAction = createAsyncThunk<any, any>(
  "auth/editDepartments",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editDepartmentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteDepartmentAction = createAsyncThunk<any, any>(
  "auth/deletDepartments",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDepartmentAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllDepartmentsAction = createAsyncThunk<any, any>(
  "auth/deleteDepartments",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDepartmentAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const getNumberSystemsAction = createAsyncThunk(
  "auth/getNumberSystemsAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getNumberSystemsAsync()
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

export const addNumberSystemAction = createAsyncThunk<any, any>(
  "auth/addNumberSystemAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addNumberSystemsAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editNumberSystemAction = createAsyncThunk<any, any>(
  "auth/editNumberSystemAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log(data);
      const response: AxiosResponse<any> = await editNumberSystemsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteNumberSystemAction = createAsyncThunk<any, any>(
  "auth/deleteNumberSystemAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletNumberSystemsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllNumberSystemsAction = createAsyncThunk<any, any>(
  "auth/deleteAllNumberSystemsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllNumberSystemsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const getDomainsAction = createAsyncThunk(
  "auth/getDomainsAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getDomainsAsync()
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

export const addDomainAction = createAsyncThunk<any, any>(
  "auth/addDomainsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDomainsAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editDomainAction = createAsyncThunk<any, any>(
  "auth/editDomainsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editDomainsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteDomainAction = createAsyncThunk<any, any>(
  "auth/deleteDomainsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDomainsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllDomainsAction = createAsyncThunk<any, any>(
  "auth/deleteAllDomainsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteDomainsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const getJobDepartmentsAction = createAsyncThunk(
  "auth/getJobDepartmentsAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getJobDepartmentAsync()
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

export const addJobDepartmentAction = createAsyncThunk<any, any>(
  "auth/addJobDepartmentsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addJobDepartmentAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editJobDepartmentAction = createAsyncThunk<any, any>(
  "auth/editJobDepartmentsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editJobDepartmentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteJobDepartmentAction = createAsyncThunk<any, any>(
  "auth/deleteJobDepartmentsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletJobDepartmentAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllJobDepartmentsAction = createAsyncThunk<any, any>(
  "auth/deleteJobDepartmentsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllJobDepartmentAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const getJobPostsAction = createAsyncThunk(
  "auth/getJobPostAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getJobPostsAsync()
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

export const addJobPostAction = createAsyncThunk<any, any>(
  "auth/addJobPostsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addJobPostsAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

export const editJobPostAction = createAsyncThunk<any, any>(
  "auth/editJobPostAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editJobPostsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())
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

export const deleteJobPostAction = createAsyncThunk<any, any>(
  "auth/deleteJobPostAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletJobPostsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllJobPostsAction = createAsyncThunk<any, any>(
  "auth/deleteJobPostsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllJobPostsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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


export const getBugReportsAction = createAsyncThunk(
  "auth/getBugReportsAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getBugReportAsync()
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

export const addBugReportAction = createAsyncThunk<any, any>(
  "auth/addBugReportsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addBugReportAsync(data)
      if (response?.data?.status === true) {

        dispatch(getProductSpecificationsAction())

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

// export const editBugReportAction = createAsyncThunk<any, any>(
//   "auth/editBugReportsAction",
//   async (data, { rejectWithValue, dispatch }) => {
//     try {
//       const response: AxiosResponse<any> = await editBugReportAsync(data)
//       if (response?.data?.status === true) {
//         dispatch(getProductSpecificationsAction())
//         dispatch(
//           showMessage({
//             ...defaultMessageObj,
//             type: "success",
//             messageText: response?.data?.message || "success",
//           }))
//         return response?.data?.data
//       }
//       dispatch(
//         showMessage({
//           ...defaultMessageObj,
//           type: "error",
//           messageText: response?.data?.message || "failed",
//         }))
//       return rejectWithValue(response)
//     } catch (error: unknown) {
//       return rejectWithValue(error as Error)
//     }
//   }
// )

export const editBugReportAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editBugReportsAction",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editBugReportAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getBugReportsAction());
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

export const deleteBugReportAction = createAsyncThunk<any, any>(
  "auth/deleteBugReportsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletBugReportAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const deleteAllBugReportsAction = createAsyncThunk<any, any>(
  "auth/deleteBugReportsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllBugReportAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getProductSpecificationsAction())
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

export const getSubscribersAction = createAsyncThunk(
  "auth/getSubscribers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSubscribersAsync()
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

export const getHomeCategoryAction = createAsyncThunk(
  "auth/getHomeCategory",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getHomeCategoryAsync()
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

export const addHomeCategoryAction = createAsyncThunk<any, any>(
  "auth/addHomeCategory",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addHomeCategoryAsync(data)
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

export const editHomeCategoryAction = createAsyncThunk<any, any>(
  "auth/editHomeCategory",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editHomeCategoryAsync(data)
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

export const deletHomeCategoryAction = createAsyncThunk<any, any>(
  "auth/deletHomeCategory",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletHomeCategoryAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getHomeCategoryAction())
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

export const deletAllHomeCategoryAction = createAsyncThunk<any, any>(
  "auth/deleteHomeCategory",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllHomeCategoryAsync(data)
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

export const getRowDataAction = createAsyncThunk(
  "auth/getRowData",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getRowDataAsync()
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

export const addRowDataAction = createAsyncThunk<any, any>(
  "auth/addRowData",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addRowDataAsync(data)
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

export const editRowDataAction = createAsyncThunk<any, any>(
  "auth/editRowData",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editRowDataAsync(data)
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

export const deleteRowDataAction = createAsyncThunk<any, any>(
  "auth/deletRowData",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletRowDataAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getHomeCategoryAction())
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

export const deleteAllRowDataAction = createAsyncThunk<any, any>(
  "auth/deleteRowData",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllRowDataAsync(data)
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

export const getAutoEmailsAction = createAsyncThunk(
  "auth/AutoEmails",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAutoEmailAsync()
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

export const addAutoEmailAction = createAsyncThunk<any, any>(
  "auth/addAutoEmail",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addAutoEmailAsync(data)
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


export const editAutoEmailAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/AutoEmail",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editAutoEmailAsync(payload);

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
export const deleteAutoEmailAction = createAsyncThunk<any, any>(
  "auth/deleteAutoEmail",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAutoEmailAsync(data)
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

export const deleteAllAutoEmailsAction = createAsyncThunk<any, any>(
  "auth/deleteAutoEmails",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllAutoEmailAsync(data)
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

export const getUsersAction = createAsyncThunk(
  "auth/Users",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getUsersAsync()
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
export const getEmailCampaignsAction = createAsyncThunk(
  "auth/EmailCampaigns",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getEmailCampaignsAsync()
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

export const addEmailCampaignAction = createAsyncThunk<any, any>(
  "auth/addEmailCampaigns",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addEmailCampaignsAsync(data)
      if (response?.data?.status === true) {

        dispatch(getEmailCampaignsAction())

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


export const editEmailCampaignAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/editEmailCampaigns",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editEmailCampaignsAsync(payload);

      if (response?.data?.status === true) {
        dispatch(getEmailCampaignsAction())
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
export const deleteEmailCampaignAction = createAsyncThunk<any, any>(
  "auth/deleteEmailCampaigns",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteEmailCampaignsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getEmailCampaignsAction())
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

export const deleteAllEmailCampaignAction = createAsyncThunk<any, any>(
  "auth/deleteEmailCampaigns",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllEmailCampaignsAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getEmailCampaignsAction())
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

export const getMailTemplatesAction = createAsyncThunk(
  "auth/MailTemplates",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getMailTemplatesAsync()
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
export const getAutoEmailTemplatesAction = createAsyncThunk(
  "auth/AutoEmailTemplates",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAutoEmailTemplatesAsync()
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

export const addAutoEmailTemplateAction = createAsyncThunk<any, any>(
  "auth/addEmailCampaigns",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addAutoEmailTemplatesAsync(data)
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


export const editAutoEmailTemplateAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/AutoEmailTemplate",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editAutoEmailTemplatesAsync(payload);

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
export const deleteAutoEmailTemplateAction = createAsyncThunk<any, any>(
  "auth/deleteEmailCampaigns",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAutoEmailTemplatesAsync(data)
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

export const deleteAllAutoEmailTemplatesAction = createAsyncThunk<any, any>(
  "auth/deleteEmailCampaigns",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllAutoEmailTemplatesAsync(data)
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

export const getEmailTemplatesAction = createAsyncThunk(
  "auth/EmailTemplates",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getEmailTemplatesAsync()
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

export const addEmailTemplateAction = createAsyncThunk<any, any>(
  "auth/addEmailTemplate",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addEmailTemplatesAsync(data)
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


export const editEmailTemplateAction = createAsyncThunk<
  any, // Return type of the fulfilled action
  { id: number | string; formData: FormData } // Type of the payload passed to the thunk
>(
  "auth/EmailTemplate",
  async (payload, { rejectWithValue, dispatch }) => {
    // payload here is { id: editingBrand.id, formData: formData }
    try {
      console.log("editBrandAction - payload received:", payload);
      // *** CHANGE HERE: Pass id and formData separately ***
      const response: AxiosResponse<any> = await editEmailTemplatesAsync(payload);

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
export const deleteEmailTemplateAction = createAsyncThunk<any, any>(
  "auth/deleteEmailTemplate",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteEmailTemplatesAsync(data)
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

export const deleteAllEmailTemplatesAction = createAsyncThunk<any, any>(
  "auth/deleteEmailTemplates",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllEmailTemplatesAsync(data)
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
export const getRequestFeedbacksAction = createAsyncThunk(
  "auth/RequestFeedbacks",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getRequestFeedbacksAsync()
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

export const addRequestFeedbackAction = createAsyncThunk<any, any>(
  "auth/addRequestFeedback",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await addRequestFeedbacksAsync(data)
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

export const editRequestFeedbackAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editRequestFeedback",
  async ({ id, formData }, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editRequestFeedbacksAsync(id, formData);
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




export const deleteRequestFeedbackAction = createAsyncThunk<any, any>(
  "auth/deleteRequestFeedback",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteRequestFeedbacksAsync(data)
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

export const deleteAllRequestFeedbacksAction = createAsyncThunk<any, any>(
  "auth/deleteRequestFeedbacks",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllRequestFeedbacksAsync(data)
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
export const getSellerListingsAction = createAsyncThunk(
  "auth/SellerListings",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSellerListingsAsync()
      console.log("response?.data?.status", response?.data?.status);
      if (response?.data?.status === true) {
        console.log("response?.data?.data", response?.data?.data);

        return response?.data?.data?.data
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
export const getBuyerListingsAction = createAsyncThunk(
  "auth/BuyerListings",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getBuyerListingsAsync()
      if (response?.data?.status === true) {
        return response?.data?.data?.data
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
export const getAutoMatchDataAction = createAsyncThunk(
  "auth/AutoMatchData",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAutoMatchDataAsync()
      console.log("response?.data?.status", response);

      if (response?.data?.status === true) {
        console.log("response?.data?.data", response?.data?.data);

        return response?.data?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "failed",
        }))

      console.log("response", response);

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getAllProductAction = createAsyncThunk(
  "auth/AllProduct",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllproductAsync()
      console.log("response?.data?.status", response);

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

      console.log("response", response);

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getGlobalSettingAction = createAsyncThunk(
  "settings/getGlobalSetting",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getGlobalSettingAsync();
      if (response?.data?.status === true) {
        return response?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load global settings",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);


export const updateGlobalSettingAction = createAsyncThunk<
  any, // fulfilled return type
  { id: number | string; formData: FormData } // payload type
>(
  "settings/updateGlobalSetting",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      console.log("updateGlobalSettingAction - payload:", payload);

      const response: AxiosResponse<any> = await editGlobalSettingAsync(payload.id, payload.formData);

      if (response?.data?.status === true) {
        dispatch(getGlobalSettingAction()); // Refresh global setting after update
        dispatch(
          showMessage({
            ...defaultMessageObj,
            type: "success",
            messageText: response?.data?.message || "Global setting updated successfully",
          })
        );
        return response?.data?.data;
      }

      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to update global setting",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getMembersAction = createAsyncThunk(
  "settings/getMembers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getMembersAsync();
      if (response?.data?.status === true) {
        return response?.data?.data?.data;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load global settings",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);


// export const editMemberAction = createAsyncThunk<
//   any, // Return type of the fulfilled action
//   { id: number | string; formData: FormData } // Type of the payload passed to the thunk
// >(
//   "auth/editMember",
//   async (payload, { rejectWithValue, dispatch }) => {
//     // payload here is { id: editingBrand.id, formData: formData }
//     try {
//       console.log("editBrandAction - payload received:", payload);
//       // *** CHANGE HERE: Pass id and formData separately ***
//       const response: AxiosResponse<any> = await editRequestFeedbacksAsync(payload);

//       if (response?.data?.status === true) {
//         dispatch(getSlidersAction());
//         dispatch(
//           showMessage({
//             ...defaultMessageObj,
//             type: "success",
//             messageText: response?.data?.message || "success",
//           })
//         );
//         return response?.data?.data;
//       }
//       dispatch(
//         showMessage({
//           ...defaultMessageObj,
//           type: "error",
//           messageText: response?.data?.message || "failed",
//         })
//       );
//       return rejectWithValue(response);
//     } catch (error: unknown) {
//       return rejectWithValue(error as Error);
//     }
//   }
// );

export const getSubcategoriesByCategoryIdAction = createAsyncThunk(
  "master/getSubcategory",
  async (categoryId: string, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSubcategoriesByCategoryIdAsync(categoryId)
      if (response?.data?.status === true) {
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load subcategories",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getBrandsAction = createAsyncThunk(
  "master/getBrands",
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
          messageText: response?.data?.message || "Failed to load brands",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getUnitsAction = createAsyncThunk(
  "master/getUnits",
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
          messageText: response?.data?.message || "Failed to load units",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const changeProductStatusAction = createAsyncThunk(
  "master/changeProductStatus",
  async (payload: { id: string; status: boolean }, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await changeProductStatusAsync(payload)
      if (response?.data?.status === true) {
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to change product status",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const importRowDataAction = createAsyncThunk(
  "master/importRowDataAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await importRowDataAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load units",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getInquiriesAction = createAsyncThunk(
  "master/getInquiries",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getInquiriesAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load units",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
export const deleteAllInquiryAction = createAsyncThunk<any, any>(
  "auth/deleteAllInquiry",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllInquiriesAsync(data)
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



export const getJobApplicationsAction = createAsyncThunk(
  "auth/getJobApplications",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getJobApplicationAsync();
      if (response?.data?.status === true) {
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

export const addJobApplicationAction = createAsyncThunk<any, any>(
  "auth/addJobApplication",
  async (data, { rejectWithValue, dispatch }) => {
    console.log(data);
    try {
      const response: AxiosResponse<any> = await addJobApplicationAsync(data);
      if (response?.data?.status === true) {
        dispatch(getJobApplicationsAction());
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

export const editJobApplicationAction = createAsyncThunk<any, any>(
  "auth/editJobApplication",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editJobApplicationAsync(data);
      if (response?.data?.status === true) {
        dispatch(getJobApplicationsAction());
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

export const deleteJobApplicationAction = createAsyncThunk<any, any>(
  "auth/deleteJobApplication",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteJobApplicationAsync(data);
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getJobApplicationsAction());
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

export const deleteAllJobApplicationsAction = createAsyncThunk<any, any>(
  "auth/deleteAllJobApplications",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllJobApplicationAsync(data);
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getJobApplicationsAction());
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

export const getRolesAction = createAsyncThunk(
  "auth/getRoles",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getRolesAsync();
      if (response?.data?.status) {
        console.log(response);
        return response?.data?.roles;
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load roles",
        })
      );
      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
)

export const getSubcategoriesByIdAction = createAsyncThunk(
  "master/getSubcategoryById",
  async (categoryId: string, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSubcategoriesByIdAsync(categoryId)
      if (response?.data?.status === true) {
        return response?.data?.data
      }
      dispatch(
        showMessage({
          ...defaultMessageObj,
          type: "error",
          messageText: response?.data?.message || "Failed to load subcategories",
        }))
      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)





{/*
  * Company Module
*/}
export const getCompanyAction = createAsyncThunk("auth/company",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getcompanyAsync()
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
export const addcompanyAction = createAsyncThunk<any, any>("auth/addcompany",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addcompanyAsync(data)
      if (response?.data?.status === true) {

        dispatch(getCompanyAction())

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
export const editcompanyAction = createAsyncThunk<any, any>("auth/editcompany",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await editcompanyAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCompnayAction())
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
export const deletecompanyAction = createAsyncThunk<any, any>("auth/deletcompany",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcompanyAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getCompnayAction())
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
export const deleteAllcompanyAction = createAsyncThunk<any, any>(
  "auth/deleteAllcompany",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<{ status: boolean; data: any; message?: string }> = await deleteAllcompanyAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getCompanyAction())
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

{/*
  * Member Module
*/}

export const getMemberAction = createAsyncThunk("auth/Member",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getMemberAsync()
      
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

export const addMemberAction = createAsyncThunk<any, any>("auth/addMember",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addMemberAsync(data)
      if (response?.data?.status === true) {

        dispatch(getMemberAction())

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

export const editMemberAction = createAsyncThunk<any, any>("auth/editMember",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await editMemberAsync(data)
      if (response?.data?.status === true) {
        dispatch(getMemberAction())
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

export const deleteMemberAction = createAsyncThunk<any, any>("auth/deletMember",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteMemberAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getMemberAction())
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

export const deleteAllMemberAction = createAsyncThunk<any, any>(
  "auth/deleteAllMember",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<{ status: boolean; data: any; message?: string }> = await deleteAllMemberAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getMemberAction())
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




export const getpartnerAction = createAsyncThunk("auth/partner",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getpartnerAsync()
      
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

export const addpartnerAction = createAsyncThunk<any, any>("auth/addpartner",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addpartnerAsync(data)
      if (response?.data?.status === true) {

        dispatch(getpartnerAction())

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

export const editpartnerAction = createAsyncThunk<any, any>("auth/editpartner",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log("data", data);

      const response: AxiosResponse<any> = await editpartnerAsync(data)
      if (response?.data?.status === true) {
        dispatch(getpartnerAction())
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

export const deletepartnerAction = createAsyncThunk<any, any>("auth/deletpartner",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletepartnerAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getpartnerAction())
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

export const deleteAllpartnerAction = createAsyncThunk<any, any>(
  "auth/deleteAllpartner",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<{ status: boolean; data: any; message?: string }> = await deleteAllpartnerAsync(data)
      if (response?.data?.status === true) {
        console.log(response?.data);
        dispatch(getpartnerAction())
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