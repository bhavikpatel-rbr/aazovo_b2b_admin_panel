import { createAsyncThunk } from "@reduxjs/toolkit";

import { AxiosResponse } from "axios";
// import { addAutoEmailAsync, addAutoEmailTemplatesAsync, addBlogsAsync, addBrandAsync, addBugReportAsync, addcategoryAsync, addCompanyAsync, addcontinentAsync, addcountryAsync, addCurrencyAsync, addDemandAsync, addDepartmentAsync, addDesignationAsync, addDocumentListAsync, addDocumentTypeAsync, addDomainsAsync, addEmailCampaignsAsync, addEmailTemplatesAsync, addFormBuilderAsync, addHomeCategoryAsync, addInquiriesAsync, addJobApplicationAsync, addJobDepartmentAsync, addJobPostsAsync, addLeadAsync, addMemberAsync, addMemberTypeAsync, addNumberSystemsAsync, addOfferAsync, addpartnerAsync, addPaymentTermAsync, addPriceListAsync, addProductAsync, addProductSepecificationAsync, addRequestFeedbacksAsync, addRolesAsync, addRowDataAsync, addSlidersAsync, addTrandingCarouselAsync, addTrandingImageAsync, addUnitAsync, addWallItemAsync, changeProductStatusAsync, deletBlogsAsync, deletBrandListAsync, deletBugReportAsync, deletcategoryListAsync, deletcompanyAsync, deletcontinentAsync, deletcountryAsync, deletCurrencyAsync, deletDepartmentAsync, deletDesignationAsync, deletDocumentListAsync, deletDocumentTypeAsync, deletDomainsAsync, deleteAllAutoEmailAsync, deleteAllAutoEmailTemplatesAsync, deleteAllBlogsAsync, deleteAllBrandListAsync, deleteAllBugReportAsync, deleteAllcategoryListAsync, deleteAllcompanyAsync, deleteAllcontinentAsync, deleteAllcountryAsync, deleteAllCurrencyAsync, deleteAllDemandAsync, deleteAllDepartmentAsync, deleteAllDesignationAsync, deleteAllDocumentListAsync, deleteAllDocumentTypeAsync, deleteAllEmailCampaignsAsync, deleteAllEmailTemplatesAsync, deleteAllFormBuilderAsync, deleteAllHomeCategoryAsync, deleteAllInquiriesAsync, deleteAllJobApplicationAsync, deleteAllJobDepartmentAsync, deleteAllJobPostsAsync, deleteAllLeadAsync, deleteAllMemberAsync, deleteAllNumberSystemsAsync, deleteAllOfferAsync, deleteAllpartnerAsync, deleteAllPaymentTermAsync, deleteAllPriceListAsync, deleteAllProductSepecificationAsync, deleteAllRequestFeedbacksAsync, deleteAllRolesAsync, deleteAllRowDataAsync, deleteAllSlidersListAsync, deleteAllTrandingCarouselAsync, deleteAllTrandingImageAsync, deleteAllUnitAsync, deleteAllWallAsync, deleteAutoEmailAsync, deleteAutoEmailTemplatesAsync, deleteDemandAsync, deleteDomainsAsync, deleteEmailCampaignsAsync, deleteEmailTemplatesAsync, deleteFormBuilderAsync, deleteJobApplicationAsync, deleteLeadAsync, deleteMemberAsync, deleteOfferAsync, deletepartnerAsync, deletePriceListAsync, deleteRequestFeedbacksAsync, deleteRolesAsync, deletHomeCategoryAsync, deletJobDepartmentAsync, deletJobPostsAsync, deletNumberSystemsAsync, deletPaymentTermAsync, deletProductListAsync, deletProductSepecificationAsync, deletRowDataAsync, deletSlidersListAsync, deletTrandingCarouselAsync, deletTrandingImageAsync, deletUnitAsync, editAutoEmailAsync, editAutoEmailTemplatesAsync, editBlogsAsync, editBrandListAsync, editBugReportAsync, editcategoryListAsync, editCompanyAsync, editCompanyProfileListAsync, editcontinentAsync, editcountryAsync, editCurrencyAsync, editDemandAsync, editDepartmentAsync, editDesignationAsync, editDocumentListAsync, editDocumentTypeAsync, editDomainsAsync, editEmailCampaignsAsync, editEmailTemplatesAsync, editFormBuilderAsync, editGlobalSettingAsync, editHomeCategoryAsync, editInquiriesAsync, editJobApplicationAsync, editJobDepartmentAsync, editJobPostsAsync, editLeadAsync, editMemberAsync, editMemberTypeAsync, editNumberSystemsAsync, editOfferAsync, editpartnerAsync, editPaymentTermAsync, editPriceListAsync, editProductListAsync, editProductSepecificationAsync, editRequestFeedbacksAsync, editRolesAsync, editRowDataAsync, editSlidersListAsync, editTrandingCarouselAsync, editTrandingImageAsync, editUnitAsync, getActivityLogAsync, getAllCategoriesData, getAllCompanyAsync, getAllproductAsync, getAllProductsAsync, getAllProductsDataAsync, getAllTaskAsync, getAutoEmailAsync, getAutoEmailTemplatesAsync, getAutoMatchDataAsync, getBlogsAsync, getBrandAsync, getBugReportAsync, getBuyerListingsAsync, getcategoryAsync, getcompanyAsync, getCompanyByIdAsync, getCompanyProfileAsync, getcontinentAsync, getcountryAsync, getCurrencyAsync, getDemandByIdAsync, getDemandsAsync, getDepartmentAsync, getDesignationAsync, getDocumentListAsync, getDocumentTypeAsync, getDomainsAsync, getEmailCampaignsAsync, getEmailTemplatesAsync, getEmployeeAsync, getExportMappingsAsync, getFormBuilderAsync, getGlobalSettingAsync, getHomeCategoryAsync, getInquiriesAsync, getJobApplicationAsync, getJobDepartmentAsync, getJobPostsAsync, getLeadAsync, getLeadByIdAsync, getLeadMemberAsync, getMailTemplatesAsync, getMemberAsync, getMemberByIdAsync, getMembersAsync, getMemberTypeAsync, getNumberSystemsAsync, getOfferByIdAsync, getOffersAsync, getOpportunitiesAsync, getParentcategoryAsync, getpartnerAsync, getPaymentTermAsync, getPriceListAsync, getProductAsync, getProductSepecificationAsync, getpWallListingAsync, getRequestFeedbacksAsync, getRolesAsync, getRowDataAsync, getSalesPersonAsync, getSellerListingsAsync, getSlidersAsync, getSubcategoriesByCategoryIdAsync, getSubcategoriesByIdAsync, getSubscribersAsync, getSuppliersAsync, getTrandingCarouseAsync, getTrandingImageAsync, getUnitAsync, getUsersAsync, getWallItemByIdAsync, getwallListingAsync, importRowDataAsync, sendCampaignNowAsync, submitResponseAsync } from "./services";
import { addAutoEmailAsync, addAutoEmailTemplatesAsync, addBlogsAsync, addBrandAsync, addBugReportAsync, addcategoryAsync, addCompanyAsync, addcontinentAsync, addcountryAsync, addCurrencyAsync, addDemandAsync, addDepartmentAsync, addDesignationAsync, addDocumentListAsync, addDocumentTypeAsync, addDomainsAsync, addEmailCampaignsAsync, addEmailTemplatesAsync, addEmployeeListAsync, addFormBuilderAsync, addHomeCategoryAsync, addInquiriesAsync, addJobApplicationAsync, addJobDepartmentAsync, addJobPostsAsync, addLeadAsync, addMemberAsync, addMemberTypeAsync, addNumberSystemsAsync, addOfferAsync, addpartnerAsync, addPaymentTermAsync, addPriceListAsync, addProductAsync, addProductSepecificationAsync, addRequestFeedbacksAsync, addRolesAsync, addRowDataAsync, addSlidersAsync, addSubscriberAsync, addTaskListAsync, addTrandingCarouselAsync, addTrandingImageAsync, addUnitAsync, addWallItemAsync, changeProductStatusAsync, deletBlogsAsync, deletBrandListAsync, deletBugReportAsync, deletcategoryListAsync, deletcompanyAsync, deletcontinentAsync, deletcountryAsync, deletCurrencyAsync, deletDepartmentAsync, deletDesignationAsync, deletDocumentListAsync, deletDocumentTypeAsync, deletDomainsAsync, deleteAllAutoEmailAsync, deleteAllAutoEmailTemplatesAsync, deleteAllBlogsAsync, deleteAllBrandListAsync, deleteAllBugReportAsync, deleteAllcategoryListAsync, deleteAllcompanyAsync, deleteAllcontinentAsync, deleteAllcountryAsync, deleteAllCurrencyAsync, deleteAllDemandAsync, deleteAllDepartmentAsync, deleteAllDesignationAsync, deleteAllDocumentListAsync, deleteAllDocumentTypeAsync, deleteAllEmailCampaignsAsync, deleteAllEmailTemplatesAsync, deleteAllExportMappingsAsync, deleteAllFormBuilderAsync, deleteAllHomeCategoryAsync, deleteAllInquiriesAsync, deleteAllJobApplicationAsync, deleteAllJobDepartmentAsync, deleteAllJobPostsAsync, deleteAllLeadAsync, deleteAllMemberAsync, deleteAllNumberSystemsAsync, deleteAllOfferAsync, deleteAllpartnerAsync, deleteAllPaymentTermAsync, deleteAllPriceListAsync, deleteAllProductSepecificationAsync, deleteAllRequestFeedbacksAsync, deleteAllRolesAsync, deleteAllRowDataAsync, deleteAllSlidersListAsync, deleteAllTrandingCarouselAsync, deleteAllTrandingImageAsync, deleteAllUnitAsync, deleteAllWallAsync, deleteAutoEmailAsync, deleteAutoEmailTemplatesAsync, deleteDemandAsync, deleteDomainsAsync, deleteEmailCampaignsAsync, deleteEmailTemplatesAsync, deleteFormBuilderAsync, deleteJobApplicationAsync, deleteLeadAsync, deleteMemberAsync, deleteOfferAsync, deletepartnerAsync, deletePriceListAsync, deleteRequestFeedbacksAsync, deleteRolesAsync, deletHomeCategoryAsync, deletJobDepartmentAsync, deletJobPostsAsync, deletNumberSystemsAsync, deletPaymentTermAsync, deletProductListAsync, deletProductSepecificationAsync, deletRowDataAsync, deletSlidersListAsync, deletTrandingCarouselAsync, deletTrandingImageAsync, deletUnitAsync, editAutoEmailAsync, editAutoEmailTemplatesAsync, editBlogsAsync, editBrandListAsync, editBugReportAsync, editcategoryListAsync, editCompanyAsync, editCompanyProfileListAsync, editcontinentAsync, editcountryAsync, editCurrencyAsync, editDemandAsync, editDepartmentAsync, editDesignationAsync, editDocumentListAsync, editDocumentTypeAsync, editDomainsAsync, editEmailCampaignsAsync, editEmailTemplatesAsync, editEmployeeListAsync, editFormBuilderAsync, editGlobalSettingAsync, editHomeCategoryAsync, editInquiriesAsync, editJobApplicationAsync, editJobDepartmentAsync, editJobPostsAsync, editLeadAsync, editMemberAsync, editMemberTypeAsync, editNumberSystemsAsync, editOfferAsync, editpartnerAsync, editPaymentTermAsync, editPriceListAsync, editProductListAsync, editProductSepecificationAsync, editRequestFeedbacksAsync, editRolesAsync, editRowDataAsync, editSlidersListAsync, editSubscriberAsync, editTaskListAsync, editTrandingCarouselAsync, editTrandingImageAsync, editUnitAsync, editWallAsync, getActivityLogAsync, getAllCategoriesData, getAllCompanyAsync, getAllNotificationAsync, getAllproductAsync, getAllProductsAsync, getAllProductsDataAsync, getAllTaskAsync, getAllTaskByStatuesAsync, getAutoEmailAsync, getAutoEmailTemplatesAsync, getAutoMatchDataAsync, getBlogsAsync, getBrandAsync, getBugReportAsync, getBuyerListingsAsync, getcategoryAsync, getcompanyAsync, getCompanyByIdAsync, getCompanyProfileAsync, getcontinentAsync, getcountryAsync, getCurrencyAsync, getDemandByIdAsync, getDemandsAsync, getDepartmentAsync, getDesignationAsync, getDocumentListAsync, getDocumentTypeAsync, getDomainsAsync, getEmailCampaignsAsync, getEmailTemplatesAsync, getEmployeeAsync, getEmployeeListAsync, getExportMappingsAsync, getFormBuilderAsync, getGlobalSettingAsync, getHomeCategoryAsync, getInquiriesAsync, getJobApplicationAsync, getJobDepartmentAsync, getJobPostsAsync, getLeadAsync, getLeadByIdAsync, getLeadMemberAsync, getMailTemplatesAsync, getMemberAsync, getMemberByIdAsync, getMembersAsync, getMemberTypeAsync, getNumberSystemsAsync, getOfferByIdAsync, getOffersAsync, getOpportunitiesAsync, getParentcategoryAsync, getpartnerAsync, getpartnerByIdAsync, getPaymentTermAsync, getPriceListAsync, getProductAsync, getProductSepecificationAsync, getpWallListingAsync, getReportingToAsync, getRequestFeedbacksAsync, getRolesAsync, getRowDataAsync, getSalesPersonAsync, getSellerListingsAsync, getSlidersAsync, getSubcategoriesByCategoryIdAsync, getSubcategoriesByIdAsync, getSubscribersAsync, getSuppliersAsync, getTrandingCarouseAsync, getTrandingImageAsync, getUnitAsync, getUsersAsync, getWallItemByIdAsync, getwallListingAsync, importRowDataAsync, sendCampaignNowAsync, submitResponseAsync, updateTaskStatusAsync } from "./services";

interface ApiParams {
  page?: number;
  per_page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
  created_by?: string; // Comma-separated IDs
  assign_user?: string; // Comma-separated IDs
  fetch_all?: boolean;
  // Add any other specific filter params your API might expect
}
export const getLeadAction = createAsyncThunk(
  "auth/getLead",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getLeadAsync()
      if (response?.data?.status === true) {
        return response?.data
      }

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

        return response?.data?.data
      }

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
      if (response?.data?.status) {
        dispatch(getLeadAction())

        return response?.data
      }

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
        dispatch(getLeadAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllLeadsAction = createAsyncThunk<any, any>(
  "auth/deleteAllLead", // Note: "Lead" is singular here, "Leads" might be more consistent with the function name
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllLeadAsync(data)
      if (response?.data?.status === true) {
        dispatch(getLeadAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteUnitAction = createAsyncThunk<any, any>(
  "auth/deleteUnit", // Corrected: "deletUnit" to "deleteUnit"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletUnitAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getUnitAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllUnitAction = createAsyncThunk<any, any>(
  "auth/deleteAllUnit", // Corrected: "delete" to "deleteAllUnit" for consistency
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllUnitAsync(data)
      if (response?.data?.status === true) {
        dispatch(getUnitAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteDocumentTypeAction = createAsyncThunk<any, any>(
  "auth/deleteDocumentType", // Corrected: "deletdocument_type"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDocumentTypeAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getDocumentTypeAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllDocumentTypeAction = createAsyncThunk<any, any>(
  "auth/deleteAlldocument_type",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDocumentTypeAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDocumentTypeAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await editPaymentTermAsync(data)
      if (response?.data?.status === true) {
        dispatch(getPaymentTermAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deletePaymentTermAction = createAsyncThunk<any, any>(
  "auth/deletePaymentTerm", // Corrected: "deletpayment_term"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletPaymentTermAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getPaymentTermAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllPaymentTermAction = createAsyncThunk<any, any>(
  "auth/deleteAllPaymentTerm", // Corrected: "payment_term" to be more specific
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllPaymentTermAsync(data)
      if (response?.data?.status === true) {
        dispatch(getPaymentTermAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await editCurrencyAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCurrencyAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteCurrencyAction = createAsyncThunk<any, any>(
  "auth/deleteCurrency", // Corrected: "deletcurrency"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletCurrencyAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getCurrencyAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllCurrencyAction = createAsyncThunk<any, any>(
  "auth/deleteAllCurrency", // Corrected: "currency" to be more specific
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllCurrencyAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCurrencyAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await editcontinentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getContinentsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteContinentAction = createAsyncThunk<any, any>(
  "auth/deleteContinent", // Corrected: "deletcontinent"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcontinentAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getContinentsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllContinentsAction = createAsyncThunk<any, any>(
  "auth/deleteAllContinents", // Corrected: "continent" to be more specific
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllcontinentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getContinentsAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await editcountryAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCountriesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteCountryAction = createAsyncThunk<any, any>(
  "auth/deleteCountry", // Corrected: "deletcountry"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcountryAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getCountriesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllCountriesAction = createAsyncThunk<any, any>(
  "auth/deleteAllCountries", // Corrected: "country" to be more specific
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<{ status: boolean; data: any; message?: string }> = await deleteAllcountryAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCountriesAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await editDocumentListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDocumentListAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteDocumentListAction = createAsyncThunk<any, any>(
  "auth/deleteDocumentMaster", // Corrected: "deletdocument_master"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDocumentListAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getDocumentListAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllDocumentListAction = createAsyncThunk<any, any>(
  "auth/deleteAllDocumentMaster", // Corrected: "document_master" for clarity
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDocumentListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDocumentListAction())

        return response?.data?.data
      }

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
      if (response?.data?.status === true) {
        return response?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editBlogAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editBlog", // Corrected "editBrand" to "editBlog"
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editBlogsAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getBlogsAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteBlogAction = createAsyncThunk<any, any>(
  "auth/deleteBlog", // Corrected: "deletdocument_master" to "deleteBlog"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletBlogsAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getBlogsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllBlogsAction = createAsyncThunk<any, any>(
  "auth/deleteAllBlogs", // Corrected: "document_master" to "deleteAllBlogs"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllBlogsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getBlogsAction()) // Corrected dispatch

        return response?.data?.data
      }

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

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

// Note: This section seems to mix "Product" and "Brand" logic.
// addProductAction uses addBrandAsync and getBrandAction.
export const addProductAction = createAsyncThunk<any, any>(
  "auth/addProduct", // Corrected from "addBrand" for consistency with "Product" context
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addProductAsync(data) // Uses Brand service
      if (response?.data?.status === true) {
        dispatch(getBrandAction()) // Dispatches Brand action

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editProductAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editProduct", // Corrected from "editBrand"
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editProductListAsync(payload.id, payload.formData); // Uses Brand service
      if (response?.data?.status === true) {
        dispatch(getProductsAction()); // Dispatches Brand action

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteProductAction = createAsyncThunk<any, any>(
  "auth/deleteProduct",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletProductListAsync(data) // Uses Product service (delet typo in service)
      if (response?.data?.status === true) {
        dispatch(getProductsAction()) // Should dispatch getProductsAction

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await deleteAllBrandListAsync(data) // Uses Brand service
      if (response?.data?.status === true) {
        dispatch(getProductsAction()) // Should dispatch getProductsAction

        return response?.data?.data
      }

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
      if (response?.data?.status) {
        return response?.data?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getAllTaskAction = createAsyncThunk(
  "auth/AllTask",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllTaskAsync()
      console.log("response?.data?.status", response?.status);

      if (response?.status) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getAllTaskByStatuesAction = createAsyncThunk(
  "auth/AllTaskbystatues",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllTaskByStatuesAsync()
      console.log("response?.data?.status", response?.status);

      if (response?.status) {
        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editBrandAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editBrand",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editBrandListAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getBrandAction());

        return response?.data?.data;
      }

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
      const response: AxiosResponse<any> = await deletBrandListAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getBrandAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllBrandsAction = createAsyncThunk<any, any>(
  "auth/deleteAllBrand", // "Brand" singular, "Brands" might be better
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllBrandListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getBrandAction())

        return response?.data?.data
      }

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
        return response?.data
      }

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
      if (response?.data?.status) {
        return response?.data?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
export const getParentCategoriesAction = createAsyncThunk(
  "auth/parentCategory",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getParentcategoryAsync()
      if (response?.data?.status) {
        return response?.data?.data?.data
      }

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
        dispatch(getCategoriesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editCategoryAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editCategory",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editcategoryListAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getCategoriesAction()); // Corrected dispatch

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteCategoryAction = createAsyncThunk<any, any>(
  "auth/deleteCategory", // Corrected: "deletcategory"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcategoryListAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getCategoriesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllCategoriesAction = createAsyncThunk<any, any>(
  "auth/deleteAllCategories", // Corrected: "category" for clarity
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllcategoryListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCategoriesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getWallItemsAction = createAsyncThunk(
  "auth/enquiry", // Note: "enquiry" might not be the best name for WallItems
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getwallListingAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
export const addWallItemAction = createAsyncThunk<any, any>(
  "auth/addWallItem", // Corrected "enquiry"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addWallItemAsync(data)
      if (response?.data?.status === true) {
        dispatch(getWallItemsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editWallItemAction = createAsyncThunk<any, any>(
  "auth/editWallItem", // Corrected "editdocument_master"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      // Assuming editWallItemAsync exists and should be used instead of editDocumentListAsync
      // For now, keeping the original service call as per instructions to only fix logs/comments primarily.
      const response: AxiosResponse<any> = await editWallAsync(data) // Potentially incorrect service call
      if (response?.data?.status === true) {
        dispatch(getWallItemsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteWallItemAction = createAsyncThunk<any, any>(
  "auth/deleteWallItem", // Corrected "deletdocument_master"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      // Assuming deletWallItemAsync exists and should be used
      const response: AxiosResponse<any> = await deletDocumentListAsync(data) // Potentially incorrect service (delet typo)
      if (response?.data?.status === true) {
        dispatch(getWallItemsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllWallItemsAction = createAsyncThunk<any, any>(
  "auth/deleteAllWallItems", // Corrected "document_master"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllWallAsync(data) // Corrected service call
      if (response?.data?.status === true) {
        dispatch(getWallItemsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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

        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deletePriceListAction = createAsyncThunk<any, any>(
  "auth/deletePriceList", // Corrected: "deletPriceList"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletePriceListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getPriceListAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllPriceListAction = createAsyncThunk<any, any>(
  "auth/deleteAllPriceList", // Corrected: "delete" for clarity
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllPriceListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getPriceListAction())

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await addSlidersAsync(data)
      if (response?.data?.status === true) {
        dispatch(getSlidersAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editSliderAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editSliders",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editSlidersListAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getSlidersAction());

        return response?.data?.data;
      }

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
      const response: AxiosResponse<any> = await deletSlidersListAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getSlidersAction())

        return response?.data?.data
      }

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
        dispatch(getSlidersAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getProductsDataAsync = createAsyncThunk(
  "auth/productsdata/",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllProductsDataAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getCategoriesData = createAsyncThunk(
  "auth/categoriesdata/",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllCategoriesData()
      if (response?.data?.status === true) {
        return response?.data?.data
      }

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

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const updateCompanyProfileAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/updateCompanyProfile", // Corrected "editSliders"
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editCompanyProfileListAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getCompanyProfileAction()); // Corrected dispatch

        return response?.data?.data;
      }

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

        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteTrendingImageAction = createAsyncThunk<any, any>(
  "auth/deleteTrendingImage", // Corrected: "deletTrandingImage"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletTrandingImageAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getTrendingImagesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteMultipleTrendingImagesAction = createAsyncThunk<any, any>(
  "auth/deleteMultipleTrendingImages", // Corrected: "TrandingImagedelete"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllTrandingImageAsync(data)
      if (response?.data?.status === true) {
        dispatch(getTrendingImagesAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteTrendingCarouselAction = createAsyncThunk<any, any>(
  "auth/deleteTrendingCarousel", // Corrected: "deletTrendingCarousel"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletTrandingCarouselAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getTrendingCarouselAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteMultipleTrendingCarouselAction = createAsyncThunk<any, any>(
  "auth/deleteMultipleTrendingCarousel", // Corrected: "TrendingCarouseldelete"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllTrandingCarouselAsync(data)
      if (response?.data?.status === true) {
        dispatch(getTrendingCarouselAction())

        return response?.data?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editProductSpecificationAction = createAsyncThunk<
  any,
  any // Assuming 'data' is the correct type for editProductSepecificationAsync
>(
  "auth/editProductSpecifications",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editProductSepecificationAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteProductSpecificationAction = createAsyncThunk<any, any>(
  "auth/deleteProductSpecification", // Corrected: "deletProductSpecifications" (singular for consistency)
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletProductSepecificationAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllProductSpecificationsAction = createAsyncThunk<any, any>(
  "auth/deleteAllProductSpecifications", // Corrected: "deleteProductSpecifications" for clarity
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllProductSepecificationAsync(data)
      if (response?.data?.status === true) {
        dispatch(getProductSpecificationsAction())

        return response?.data?.data
      }

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
        return response?.data
      }

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
        dispatch(getDesignationsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getDesignationsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteDesignationAction = createAsyncThunk<any, any>(
  "auth/deleteDesignation", // Corrected: "deletDesignation"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDesignationAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getDesignationsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllDesignationsAction = createAsyncThunk<any, any>(
  "auth/deleteAllDesignations", // Corrected: "deleteDesignation" for clarity
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDesignationAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDesignationsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
        dispatch(getDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteDepartmentAction = createAsyncThunk<any, any>(
  "auth/deleteDepartment", // Corrected: "deletDepartments" (singular)
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletDepartmentAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllDepartmentsAction = createAsyncThunk<any, any>(
  "auth/deleteAllDepartments", // Corrected: "deleteDepartments" for clarity
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDepartmentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getNumberSystemsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await editNumberSystemsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getNumberSystemsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await deletNumberSystemsAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getNumberSystemsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getNumberSystemsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getDomainsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getDomainsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      // Assuming deleteDomainsAsync is for single delete, deletDomainsAsync might be a typo or for something else
      const response: AxiosResponse<any> = await deleteDomainsAsync(data) // Changed from deletDomainsAsync
      if (response?.data?.status === true) {
        dispatch(getDomainsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      // Assuming deleteAllDomainsAsync should be used here. The import has deletDomainsAsync and deleteDomainsAsync.
      // Sticking with deletDomainsAsync as it was used, but this is potentially an issue in services.ts or naming.
      const response: AxiosResponse<any> = await deletDomainsAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getDomainsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getJobDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getJobDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await deletJobDepartmentAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getJobDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllJobDepartmentsAction = createAsyncThunk<any, any>(
  "auth/deleteAllJobDepartmentsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllJobDepartmentAsync(data)
      if (response?.data?.status === true) {
        dispatch(getJobDepartmentsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
        dispatch(getJobPostsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getJobPostsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      const response: AxiosResponse<any> = await deletJobPostsAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getJobPostsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllJobPostsAction = createAsyncThunk<any, any>(
  "auth/deleteAllJobPostsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllJobPostsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getJobPostsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
        dispatch(getBugReportsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editBugReportAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editBugReportsAction",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editBugReportAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getBugReportsAction());

        return response?.data?.data;
      }

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
      const response: AxiosResponse<any> = await deletBugReportAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getBugReportsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllBugReportsAction = createAsyncThunk<any, any>(
  "auth/deleteAllBugReportsAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllBugReportAsync(data)
      if (response?.data?.status === true) {
        dispatch(getBugReportsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addSubscriberAction = createAsyncThunk<any, any>(
  "auth/addsubscriber",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addSubscriberAsync(data)
      if (response?.data?.status === true) {
        // dispatch(getBugReportsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editSubscriberAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "auth/editsubscriber",
  async (payload, { rejectWithValue, dispatch }) => {

    try {
      console.log("formData", payload.formData);

      const response: AxiosResponse<any> = await editSubscriberAsync(payload.id, payload.formData);

      console.log("response", response);

      if (response?.data?.status === true) {
        // dispatch(getBugReportsAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getHomeCategoryAction = createAsyncThunk(
  "auth/getHomeCategory",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getHomeCategoryAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }

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
        dispatch(getHomeCategoryAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getHomeCategoryAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteHomeCategoryAction = createAsyncThunk<any, any>(
  "auth/deleteHomeCategory", // Corrected: "deletHomeCategory"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletHomeCategoryAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getHomeCategoryAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllHomeCategoryAction = createAsyncThunk<any, any>(
  "auth/deleteAllHomeCategory", // Corrected: "deleteHomeCategory"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllHomeCategoryAsync(data)
      if (response?.data?.status === true) {
        dispatch(getHomeCategoryAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
        dispatch(getRowDataAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getRowDataAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteRowDataAction = createAsyncThunk<any, any>(
  "auth/deleteRowData", // Corrected: "deletRowData"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletRowDataAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getRowDataAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllRowDataAction = createAsyncThunk<any, any>(
  "auth/deleteAllRowData", // Corrected: "deleteRowData"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllRowDataAsync(data)
      if (response?.data?.status === true) {
        dispatch(getRowDataAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
      const response: AxiosResponse<any> = await addAutoEmailAsync(data)
      if (response?.data?.status === true) {
        dispatch(getAutoEmailsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editAutoEmailAction = createAsyncThunk<
  any,
  any // Assuming 'payload' is the correct type for editAutoEmailAsync
>(
  "auth/editAutoEmail", // Corrected "AutoEmail"
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editAutoEmailAsync(payload);
      if (response?.data?.status === true) {
        dispatch(getAutoEmailsAction()); // Corrected dispatch

        return response?.data?.data;
      }

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
        dispatch(getAutoEmailsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllAutoEmailsAction = createAsyncThunk<any, any>(
  "auth/deleteAllAutoEmails", // Corrected: "deleteAutoEmails"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllAutoEmailAsync(data)
      if (response?.data?.status === true) {
        dispatch(getAutoEmailsAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
      const response: AxiosResponse<any> = await addEmailCampaignsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getEmailCampaignsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editEmailCampaignAction = createAsyncThunk<
  any,
  any // Assuming 'payload' is the correct type
>(
  "auth/editEmailCampaigns",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editEmailCampaignsAsync(payload);
      if (response?.data?.status === true) {
        dispatch(getEmailCampaignsAction())

        return response?.data?.data;
      }

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
        dispatch(getEmailCampaignsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllEmailCampaignAction = createAsyncThunk<any, any>(
  "auth/deleteAllEmailCampaigns", // Corrected "deleteEmailCampaigns"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllEmailCampaignsAsync(data)
      if (response?.data?.status === true) {
        dispatch(getEmailCampaignsAction())

        return response?.data?.data
      }

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
        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addAutoEmailTemplateAction = createAsyncThunk<any, any>(
  "auth/addAutoEmailTemplate", // Corrected "addEmailCampaigns"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addAutoEmailTemplatesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getAutoEmailTemplatesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editAutoEmailTemplateAction = createAsyncThunk<
  any,
  any // Assuming 'payload' is the correct type
>(
  "auth/editAutoEmailTemplate", // Corrected "AutoEmailTemplate"
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editAutoEmailTemplatesAsync(payload);
      if (response?.data?.status === true) {
        dispatch(getAutoEmailTemplatesAction()); // Corrected dispatch

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);
export const deleteAutoEmailTemplateAction = createAsyncThunk<any, any>(
  "auth/deleteAutoEmailTemplate", // Corrected "deleteEmailCampaigns"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAutoEmailTemplatesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getAutoEmailTemplatesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllAutoEmailTemplatesAction = createAsyncThunk<any, any>(
  "auth/deleteAllAutoEmailTemplates", // Corrected "deleteEmailCampaigns"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllAutoEmailTemplatesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getAutoEmailTemplatesAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
      const response: AxiosResponse<any> = await addEmailTemplatesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getEmailTemplatesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editEmailTemplateAction = createAsyncThunk<
  any,
  any // Assuming 'payload' is the correct type
>(
  "auth/editEmailTemplate", // Corrected "EmailTemplate"
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editEmailTemplatesAsync(payload);
      if (response?.data?.status === true) {
        dispatch(getEmailTemplatesAction()); // Corrected dispatch

        return response?.data?.data;
      }

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
        dispatch(getEmailTemplatesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllEmailTemplatesAction = createAsyncThunk<any, any>(
  "auth/deleteAllEmailTemplates", // Corrected "deleteEmailTemplates"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllEmailTemplatesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getEmailTemplatesAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        return response?.data
      }

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
      const response: AxiosResponse<any> = await addRequestFeedbacksAsync(data)
      if (response?.data?.status === true) {
        dispatch(getRequestFeedbacksAction()) // Corrected dispatch

        return response?.data?.data
      }

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
        dispatch(getRequestFeedbacksAction()); // Corrected dispatch

        return response?.data?.data;
      }

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
        dispatch(getRequestFeedbacksAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllRequestFeedbacksAction = createAsyncThunk<any, any>(
  "auth/deleteAllRequestFeedbacks", // Corrected "deleteRequestFeedbacks"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllRequestFeedbacksAsync(data)
      if (response?.data?.status === true) {
        dispatch(getRequestFeedbacksAction()) // Corrected dispatch

        return response?.data?.data
      }

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
      if (response?.data?.status === true) {
        return response?.data?.data?.data
      }

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
      if (response?.data?.status === true) {
        return response?.data?.data?.data
      }

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
      if (response?.data?.status === true) {
        return response?.data?.data
      }

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

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);


export const updateGlobalSettingAction = createAsyncThunk<
  any,
  { id: number | string; formData: FormData }
>(
  "settings/updateGlobalSetting",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editGlobalSettingAsync(payload.id, payload.formData);
      if (response?.data?.status === true) {
        dispatch(getGlobalSettingAction());

        return response?.data?.data;
      }

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
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getSubcategoriesByCategoryIdAction = createAsyncThunk(
  "master/getSubcategory",
  async (categoryId: string, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSubcategoriesByCategoryIdAsync(categoryId)
      if (response?.data?.status === true) {
        return response?.data?.data
      }

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

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const changeProductStatusAction = createAsyncThunk(
  "master/changeProductStatus",
  async (payload: { id: number; status: string }, { rejectWithValue, dispatch }) => {
    try {
      console.log("payload", payload)
      const response: AxiosResponse<any> = await changeProductStatusAsync(payload)
      if (response?.data?.status === true) {
        // Consider dispatching an action to refresh product list if needed
        // dispatch(getProductsAction()); 
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const importRowDataAction = createAsyncThunk(
  "master/importRowDataAction",
  async (_, { rejectWithValue, dispatch }) => { // data parameter removed as it was unused
    try {
      const response: AxiosResponse<any> = await importRowDataAsync() // Assuming importRowDataAsync doesn't need arguments
      if (response?.data?.status === true) {
        // Consider dispatching an action to refresh relevant data list if needed
        // dispatch(getRowDataAction());
        return response?.data?.data
      }

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
        dispatch(getInquiriesAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const addInquiriesAction = createAsyncThunk<any, any>("auth/addInquiries",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addInquiriesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getInquiriesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editInquiriesAction = createAsyncThunk<any, any>("auth/editInquiries",
  async (data, { rejectWithValue, dispatch }) => {
    try {

      const response: AxiosResponse<any> = await editInquiriesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getInquiriesAction())

        return response?.data?.data
      }

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
        return response?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const addJobApplicationAction = createAsyncThunk<any, any>(
  "auth/addJobApplication",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addJobApplicationAsync(data);
      if (response?.data?.status === true) {
        dispatch(getJobApplicationsAction());

        return response?.data?.data;
      }

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

        return response?.data?.data;
      }

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
        dispatch(getJobApplicationsAction());

        return response?.data?.data;
      }

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
        dispatch(getJobApplicationsAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

// export const getRolesAction = createAsyncThunk(
//   "auth/getRoles",
//   async (_, { rejectWithValue, dispatch }) => {
//     try {
//       const response: AxiosResponse<any> = await getRolesAsync();
//       if (response?.data?.status) {
//         return response?.data?.roles;
//       }

//       return rejectWithValue(response);
//     } catch (error: unknown) {
//       return rejectWithValue(error as Error);
//     }
//   }
// )

export const getSubcategoriesByIdAction = createAsyncThunk(
  "master/getSubcategoryById",
  async (categoryId: string, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSubcategoriesByIdAsync(categoryId)
      if (response?.data?.status === true) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

//
// Company Module
//
export const getCompanyAction = createAsyncThunk("auth/company",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getcompanyAsync()
      if (response?.data?.status) {
        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
export const addcompanyAction = createAsyncThunk<any, any>("auth/addcompany",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addCompanyAsync(data)
      if (response?.data?.status === true) {
        dispatch(getCompanyAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editCompanyAction = createAsyncThunk<any, { id: string | number; payload: FormData }>(
  "auth/editcompany",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editCompanyAsync(id, payload);
      if (response?.data?.status === true) {
        dispatch(getCompanyAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);
export const deletecompanyAction = createAsyncThunk<any, any>("auth/deleteCompany", // Corrected: "deletcompany"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletcompanyAsync(data) // Service call uses "delet"
      if (response?.data?.status === true) {
        dispatch(getCompanyAction())

        return response?.data?.data
      }

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
        dispatch(getCompanyAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

//
// Member Module
//

export const getAllProductsAction = createAsyncThunk("auth/allproducts",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllProductsAsync()
      if (response?.data?.status === true) {
        return response?.data.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const getMemberAction = createAsyncThunk("auth/Member",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getMemberAsync()
      if (response?.data?.status === true) {
        return response?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editMemberAction = createAsyncThunk<any, any>("auth/editMember",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editMemberAsync(data)
      if (response?.data?.status === true) {
        dispatch(getMemberAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteMemberAction = createAsyncThunk<any, any>("auth/deleteMember", // Corrected: "deletMember"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteMemberAsync(data)
      if (response?.data?.status === true) {
        dispatch(getMemberAction())

        return response?.data?.data
      }

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
        dispatch(getMemberAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

//
// Partner Module
//
export const getpartnerByIdAction = createAsyncThunk(
  "auth/getpartnerByIdAction",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getpartnerByIdAsync(id);
      if (response?.data?.status) {
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);
export const getpartnerAction = createAsyncThunk("auth/partner",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getpartnerAsync()
      if (response?.data?.status === true) {
        return response?.data
      }

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

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
export const editpartnerAction = createAsyncThunk<any, { id: string | number; payload: FormData }>(
  "auth/editpartner",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editpartnerAsync(id, payload);
      if (response?.data?.status === true) {
        dispatch(getpartnerAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deletepartnerAction = createAsyncThunk<any, any>("auth/deletePartner", // Corrected: "deletpartner"
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deletepartnerAsync(data)
      if (response?.data?.status === true) {
        dispatch(getpartnerAction())

        return response?.data?.data
      }

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
        dispatch(getpartnerAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
// It's a good practice to have the request params type available here
// You might want to define this in a shared types file or in your services file.
export interface WallApiRequestParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  company_id?: string;
  want_to?: string;
  product_id?: string;
  category_id?: string;
  subcategory_id?: string;
  brands_id?: string;
  product_status?: string;
  source?: string;
  product_spec?: string;
  member_type?: string;
  created_by?: string;
  created_date_range?: string;
}

// this is middleware (Corrected)
export const getWallListingAction = createAsyncThunk(
  "auth/walllisting",
  // 1. Change `_` to `params` to capture the dispatched arguments.
  // 2. Add the type `WallApiRequestParams | undefined` for type safety.
  async (params: WallApiRequestParams | undefined, { rejectWithValue }) => {
    try {
      // 3. Pass the captured `params` to your API service function.
      const response: AxiosResponse<any> = await getpWallListingAsync(params);

      if (response?.data?.status === true) {
        return response?.data;
      }

      // If the API returns a 2xx status but has a business logic error (e.g., status: false),
      // reject with the response data for better error handling in the component.
      return rejectWithValue(response.data);
    } catch (error: unknown) {
      // It's good practice to check if it's an AxiosError and reject with structured data.
      const axiosError = error as import('axios').AxiosError;
      if (axiosError.response) {
        return rejectWithValue(axiosError.response.data);
      }
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteAllWallAction = createAsyncThunk<any, any>(
  "auth/deleteAllWall",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<{ status: boolean; data: any; message?: string }> = await deleteAllWallAsync(data)
      if (response?.data?.status === true) {
        dispatch(getWallListingAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const submitExportReasonAction = createAsyncThunk("auth/submitResponse",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await submitResponseAsync(data)
      if (response?.data?.status === true) {

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getFormBuilderAction = createAsyncThunk(
  "formBuilder/getForms",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getFormBuilderAsync();
      if (response?.data?.status === true) {
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const addFormBuilderAction = createAsyncThunk<any, any>(
  "formBuilder/addForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addFormBuilderAsync(data);
      if (response?.data?.status === true) {
        dispatch(getFormBuilderAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const editFormBuilderAction = createAsyncThunk<any, any>(
  "formBuilder/editForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editFormBuilderAsync(data);
      if (response?.data?.status === true) {
        dispatch(getFormBuilderAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteFormBuilderAction = createAsyncThunk<any, any>(
  "formBuilder/deleteForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteFormBuilderAsync(data);
      if (response?.data?.status === true) {
        dispatch(getFormBuilderAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const deleteAllFormBuildersAction = createAsyncThunk<any, any>(
  "formBuilder/deleteAllForms",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllFormBuilderAsync(data);
      if (response?.data?.status === true) {
        dispatch(getFormBuilderAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const changeFormBuilderStatusAction = createAsyncThunk<
  any,
  { id: string | number; status: string }
>(
  "formBuilder/changeStatus",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      // Placeholder for actual API call
      // const response: AxiosResponse<any> = await changeFormBuilderStatusAsync(data);
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 300));
      const response: AxiosResponse<any> = {
        data: {
          status: true,
          message: `Status of form ${data.id} changed to ${data.status} successfully.`,
          data: { id: data.id, status: data.status },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      // End Placeholder

      if (response?.data?.status === true) {
        dispatch(getFormBuilderAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {

      return rejectWithValue(error as Error);
    }
  }
);

export const cloneFormBuilderAction = createAsyncThunk<
  any,
  any
>(
  "formBuilder/cloneForm",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      // Placeholder for actual API call
      // const response: AxiosResponse<any> = await cloneFormBuilderAsync(data);
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 300));
      const clonedForm = {
        ...data,
        id: `CLONE_${Date.now()}`,
        formName: `${data.formName || 'Form'} (Clone)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const response: AxiosResponse<any> = {
        data: {
          status: true,
          message: "Form cloned successfully.",
          data: clonedForm,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      // End Placeholder

      if (response?.data?.status === true) {
        dispatch(getFormBuilderAction());

        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {

      return rejectWithValue(error as Error);
    }
  }
);

export const getActivityLogAction = createAsyncThunk(
  "auth/exportLogAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getActivityLogAsync();
      if (response?.data?.status === true) {
        return response?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getOpportunitiesAction = createAsyncThunk(
  "auth/getOpportunities",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getOpportunitiesAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getWallItemById = createAsyncThunk(
  "auth/getWallItemById",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getWallItemByIdAsync(id);
      if (response?.data?.status === true) {
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getOffersAction = createAsyncThunk(
  "auth/getOffersAction",
  async (params: ApiParams | undefined, { rejectWithValue, dispatch }) => { // Changed _ to params
    try {
      // Pass params to the async function
      const responseData = await getOffersAsync(params); // getOffersAsync now returns response.data directly

      // The original thunk logic for checking responseData:
      // if (response?.data) { return response?.data }
      // This implies responseData IS what was previously response.data
      if (responseData?.data) {
        return responseData;
      }
      // If responseData is not satisfactory (e.g., falsy), reject.
      // The original code was `rejectWithValue(response)`, but `response` is not available here.
      // We should reject with the `responseData` if it's considered an error by this logic.
      return rejectWithValue(responseData || { message: "Invalid response from getOffersAsync" });
    } catch (error: unknown) {
      // The original code `return rejectWithValue(error as Error)`
      // This is okay, but more specific Axios error handling is often better.
      // For strict adherence to "no change" beyond params:
      return rejectWithValue(error as Error);
    }
  }
);

export const getDemandsAction = createAsyncThunk(
  "auth/getDemandsAction", // Assuming you'll keep "auth/" namespace for now
  async (params: ApiParams | undefined, { rejectWithValue, dispatch }) => { // Changed _ to params
    try {
      const responseData = await getDemandsAsync(params);

      if (responseData?.data) {
        return responseData?.data;
      }
      return rejectWithValue(responseData || { message: "Invalid response from getDemandsAsync" });
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);


export const addOfferAction = createAsyncThunk<any, any>(
  "auth/addOffer",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addOfferAsync(data)
      if (response?.data?.status === true) {
        dispatch(getOffersAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editOfferAction = createAsyncThunk<any, any>(
  "auth/editOffer",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editOfferAsync(data)
      if (response?.data?.status === true) {
        dispatch(getOffersAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addDemandAction = createAsyncThunk<any, any>(
  "auth/addDemand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addDemandAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDemandsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const getOfferById = createAsyncThunk(
  "auth/getOfferById",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getOfferByIdAsync(id);
      if (response?.data.status) {
        return response.data.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getDemandById = createAsyncThunk(
  "auth/getDemandById",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getDemandByIdAsync(id);
      if (response?.data.status) {
        return response.data.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const editDemandAction = createAsyncThunk<any, any>(
  "auth/editDemand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editDemandAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDemandsAction()) // Corrected dispatch

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
export const getLeadById = createAsyncThunk(
  "auth/getLeadById",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getLeadByIdAsync(id);
      if (response?.data.status) {
        return response.data.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getCompanyByIdAction = createAsyncThunk(
  "auth/getCompanyByIdAction",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getCompanyByIdAsync(id);
      if (response?.data?.status) {
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getAllCompany = createAsyncThunk(
  "auth/getCompanyByIdAction1",
  async (params: ApiParams | undefined, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllCompanyAsync();
      if (response?.data?.status) {
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getMemberByIdAction = createAsyncThunk(
  "auth/getMemberByIdAction",
  async (id: string | number, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getMemberByIdAsync(id);
      if (response?.data?.status) {
        return response?.data?.data;
      }

      return rejectWithValue(response);
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);


export const deleteOfferAction = createAsyncThunk<any, any>(
  "auth/deleteOffer",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log('data', data)
      const response: AxiosResponse<any> = await deleteOfferAsync(data)
      if (response?.data?.status === true) {
        dispatch(getOffersAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllOffersAction = createAsyncThunk<any, any>(
  "auth/deleteAllOffer", // Note: "Offer" is singular here, "Offers" might be more consistent with the function name
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllOfferAsync(data)
      if (response?.data?.status === true) {
        dispatch(getOffersAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteDemandAction = createAsyncThunk<any, any>(
  "auth/deleteDemand",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      console.log('data', data)
      const response: AxiosResponse<any> = await deleteDemandAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDemandsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllDemandsAction = createAsyncThunk<any, any>(
  "auth/deleteAllDemand", // Note: "Demand" is singular here, "Demands" might be more consistent with the function name
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllDemandAsync(data)
      if (response?.data?.status === true) {
        dispatch(getDemandsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getLeadMemberAction = createAsyncThunk(
  "auth/getLeadMemberAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getLeadMemberAsync()
      if (response?.data) { // Assuming response.data itself contains the relevant structure
        return response?.data.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getSalesPersonAction = createAsyncThunk(
  "auth/getSalesPersonAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSalesPersonAsync()
      if (response?.data) { // Assuming response.data itself contains the relevant structure
        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getSuppliersAction = createAsyncThunk(
  "auth/getSuppliersAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getSuppliersAsync()
      if (response?.data) { // Assuming response.data itself contains the relevant structure
        return response?.data.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getEmployeesAction = createAsyncThunk(
  "auth/getEmployeesAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getEmployeeAsync();

      if (response?.users?.data) {
        return response.users.data;
      }

      return rejectWithValue("No users found");
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getRolesAction = createAsyncThunk(
  "auth/getRoles",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getRolesAsync()
      if (response?.data?.status === true) {
        return response?.data?.roles
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addRolesAction = createAsyncThunk<any, any>(
  "auth/addRoles",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addRolesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getRolesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const editRolesAction = createAsyncThunk<any, any>(
  "auth/editRoles",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editRolesAsync(data)
      if (response?.data?.status) {
        dispatch(getRolesAction())

        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteRolesAction = createAsyncThunk<any, any>(
  "auth/deleteRoles",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteRolesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getRolesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const deleteAllRolessAction = createAsyncThunk<any, any>(
  "auth/deleteAllRoles", // Note: "Roles" is singular here, "Roless" might be more consistent with the function name
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await deleteAllRolesAsync(data)
      if (response?.data?.status === true) {
        dispatch(getRolesAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const sendCampaignNowAction = createAsyncThunk<any, any>(
  "auth/sendCampaignNow",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await sendCampaignNowAsync(data)
      if (response?.data?.status === true) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getMemberTypeAction = createAsyncThunk(
  "auth/MemberType",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getMemberTypeAsync()
      if (response?.data?.status === true) {
        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addMemberTypeAction = createAsyncThunk<any, any>(
  "auth/addMemberType",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addMemberTypeAsync(data)
      if (response?.data?.status === true) {
        dispatch(getMemberTypeAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editMemberTypeAction = createAsyncThunk<any, any>(
  "auth/editMemberType",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editMemberTypeAsync(data)
      if (response?.data?.status === true) {
        dispatch(getMemberTypeAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const addTaskAction = createAsyncThunk<any, any>(
  "auth/addtask",
  async (data, { rejectWithValue, dispatch }) => {
    try {

      console.log("data", data);

      const response: AxiosResponse<any> = await addTaskListAsync(data)

      console.log("name", response);

      if (response?.status === 200) {
        dispatch(getContinentsAction())

        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const updateTaskStatusAPI = createAsyncThunk<any, any>(
  "auth/updateTaskStatus",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await updateTaskStatusAsync(data)

      console.log("name", response);

      if (response?.status === 200) {
        dispatch(getAllTaskByStatuesAction())

        return response?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)


export const editTaskAction = createAsyncThunk<any, any>(
  "auth/editTask",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editTaskListAsync(data)
      if (response?.data?.status === true) {
        dispatch(getContinentsAction())

        return response?.data?.data
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)

export const getEmployeesListingAction = createAsyncThunk(
  "auth/getEmployeesListingAction",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getEmployeeListAsync();
      if (response) {
        return response;
      }

      return rejectWithValue("No users found");
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const addEmployeesAction = createAsyncThunk(
  "auth/addEmployeesListingAction",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await addEmployeeListAsync(payload);
      if (response) {
        return response;
      }

      return rejectWithValue("No users found");
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const editEmployeesAction = createAsyncThunk(
  "auth/editEmployeesListingAction",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editEmployeeListAsync(payload);
      if (response) {
        return response;
      }

      return rejectWithValue("No users found");
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const apiGetEmployeeById = createAsyncThunk(
  "auth/apiGetEmployeeById",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await editEmployeeListAsync(id);
      if (response) {
        return response;
      }

      return rejectWithValue("No users found");
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getReportingTo = createAsyncThunk(
  "auth/getReportingTo",
  async (department_id, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getReportingToAsync(department_id);
      if (response) {
        return response;
      }

      return rejectWithValue("No users found");
    } catch (error: unknown) {
      return rejectWithValue(error as Error);
    }
  }
);

export const getAllNotificationAction = createAsyncThunk<any, any>(
  "auth/getAllNotificationAction",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response: AxiosResponse<any> = await getAllNotificationAsync()
      if (response) {
        return response
      }

      return rejectWithValue(response)
    } catch (error: unknown) {
      return rejectWithValue(error as Error)
    }
  }
)
