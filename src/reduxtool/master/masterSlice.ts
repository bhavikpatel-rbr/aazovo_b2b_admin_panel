import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { addUnitAction, deletAllUnitAction, deletUnitAction, editUnitAction, getBrandAction, getContinentsAction, getCountriesAction, getCurrencyAction, getDocumentListAction, getDocumentTypeAction, getExportMappingsAction, getPaymentTermAction, getUnitAction } from "./middleware"

const INITIAL_STATE: any = {
  unitData: "",
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
    builder.addCase(getPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
      PaymentTermsData: payload
    }))
    builder.addCase(getCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
      CurrencyData: payload
    }))
    builder.addCase(getContinentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ContinentsData: payload
    }))
    builder.addCase(getCountriesAction.fulfilled, (state, { payload }) => ({
      ...state,
      CountriesData: payload
    }))
    builder.addCase(getDocumentListAction.fulfilled, (state, { payload }) => ({
      ...state,
      DocumentListData: payload
    }))
    builder.addCase(getBrandAction.fulfilled, (state, { payload }) => ({
      ...state,
      BrandData: payload
    }))
    builder.addCase(getExportMappingsAction.fulfilled, (state, { payload }) => ({
      ...state,
      exportMappingData: payload
    }))
  },
})

export const masterSelector = (state: RootState) => state?.Master

export default masterSlice.reducer