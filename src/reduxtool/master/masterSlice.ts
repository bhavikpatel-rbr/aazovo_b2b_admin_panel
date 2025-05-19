import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { addContinentAction, addCountryAction, addCurrencyAction, addDocumentTypeAction, addPaymentTermAction, addPriceListAction, addUnitAction, deletAllUnitAction, deleteAllPriceListAction, deleteContinentAction, deleteCountryAction, deleteCurrencyAction, deleteDocumentTypeAction, deletePaymentTermAction, deletePriceListAction, deletUnitAction, editContinentAction, editCountryAction, editCurrencyAction, editDocumentTypeAction, editPaymentTermAction, editPriceListAction, editUnitAction, getBlogsAction, getBrandAction, getCategoriesAction, getContinentsAction, getCountriesAction, getCurrencyAction, getDocumentListAction, getDocumentTypeAction, getExportMappingsAction, getPaymentTermAction, getPriceListAction, getProductsAction, getSlidersAction, getUnitAction, getWallItemsAction } from "./middleware"
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
      exportMappingData: payload
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

  },
})

export const masterSelector = (state: RootState) => state?.Master

export default masterSlice.reducer