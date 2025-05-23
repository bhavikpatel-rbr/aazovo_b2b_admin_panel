import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { addContinentAction, addCountryAction, addCurrencyAction, getLeadAction, addDocumentTypeAction, addPaymentTermAction, addPriceListAction, addUnitAction, deletAllUnitAction, deleteAllPriceListAction, deleteContinentAction, deleteCountryAction, deleteCurrencyAction, deleteDocumentTypeAction, deletePaymentTermAction, deletePriceListAction, deletUnitAction, editContinentAction, editCountryAction, editCurrencyAction, editDocumentTypeAction, editPaymentTermAction, editPriceListAction, editUnitAction, getBlogsAction, getBrandAction, getBugReportsAction, getCategoriesAction, getCompanyProfileAction, getContinentsAction, getCountriesAction, getCurrencyAction, getDepartmentsAction, getDesignationsAction, getDocumentListAction, getDocumentTypeAction, getDomainsAction, getExportMappingsAction, getJobDepartmentsAction, getJobPostsAction, getNumberSystemsAction, getPaymentTermAction, getPriceListAction, getProductsAction, getProductSpecificationsAction, getSlidersAction, getSubscribersAction, getTrendingCarouselAction, getTrendingImagesAction, getUnitAction, getWallItemsAction } from "./middleware"
import { deletPaymentTermAsync } from "./services"

const INITIAL_STATE: any = {
  unitData: "",
  BlogsData: []
}

const masterSlice = createSlice({
  name: "master",
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
      unitData: payload
    }))
    builder.addCase(addUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deletUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getLeadAction.fulfilled, (state, { payload }) => ({
      ...state,
      LeadsData: payload
    }))
    // ...
    builder.addCase(deletAllUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
      DocumentTypeData: payload
    }))
    builder.addCase(addDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    // builder.addCase(deleteAllDocumentTypeAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    builder.addCase(getPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
      PaymentTermsData: payload
    }))
    builder.addCase(addPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deletePaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    // builder.addCase(deleteAllDocumentTypeAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    builder.addCase(getCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
      CurrencyData: payload
    }))
    builder.addCase(addCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getContinentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ContinentsData: payload
    }))
    builder.addCase(addContinentAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteContinentAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editContinentAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getCountriesAction.fulfilled, (state, { payload }) => ({
      ...state,
      CountriesData: payload
    }))
    builder.addCase(addCountryAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteCountryAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editCountryAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getDocumentListAction.fulfilled, (state, { payload }) => ({
      ...state,
      DocumentListData: payload
    }))
    builder.addCase(getBrandAction.fulfilled, (state, { payload }) => ({
      ...state,
      BrandData: payload
    }))
    builder.addCase(getBlogsAction.fulfilled, (state, { payload }) => ({
      ...state,
      BlogsData: payload
    }))
    builder.addCase(getExportMappingsAction.fulfilled, (state, { payload }) => ({
      ...state,
      apiExportMappings: payload
    }))
    builder.addCase(getCategoriesAction.fulfilled, (state, { payload }) => ({
      ...state,
      CategoriesData: payload
    }))
    builder.addCase(getWallItemsAction.fulfilled, (state, { payload }) => ({
      ...state,
      wallItemsData: payload
    }))
    builder.addCase(getPriceListAction.fulfilled, (state, { payload }) => ({
      ...state,
      priceListData: payload
    }))

    builder.addCase(getProductsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ProductsData: payload
    }))
    // builder.addCase(addPriceListAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    // builder.addCase(deletePriceListAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    // builder.addCase(editPriceListAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    builder.addCase(getSlidersAction.fulfilled, (state, { payload }) => ({
      ...state,
      slidersData: payload
    }))
    builder.addCase(getCompanyProfileAction.fulfilled, (state, { payload }) => ({
      ...state,
      rawProfileArrayFromState: payload
    }))
    builder.addCase(getTrendingImagesAction.fulfilled, (state, { payload }) => ({
      ...state,
      trendingImagesData: payload
    }))

    builder.addCase(getTrendingCarouselAction.fulfilled, (state, { payload }) => ({
      ...state,
      trendingCarouselData: payload
    }))
    builder.addCase(getProductSpecificationsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ProductSpecificationsData: payload
    }))
    builder.addCase(getDesignationsAction.fulfilled, (state, { payload }) => ({
      ...state,
      designationsData: payload
    }))
    builder.addCase(getDepartmentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      departmentsData: payload
    }))
    builder.addCase(getNumberSystemsAction.fulfilled, (state, { payload }) => ({
      ...state,
      numberSystemsData: payload
    }))
    builder.addCase(getDomainsAction.fulfilled, (state, { payload }) => ({
      ...state,
      domainsData: payload
    }))
    builder.addCase(getJobDepartmentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      jobDepartmentsData: payload
    }))
    builder.addCase(getJobPostsAction.fulfilled, (state, { payload }) => ({
      ...state,
      jobPostsData: payload
    }))

    builder.addCase(getBugReportsAction.fulfilled, (state, { payload }) => ({
      ...state,
      bugReportsData: payload
    }))
    builder.addCase(getSubscribersAction.fulfilled, (state, { payload }) => ({
      ...state,
      rawApiSubscribers: payload
    }))




  },
})

export const masterSelector = (state: RootState) => state?.Master

export default masterSlice.reducer