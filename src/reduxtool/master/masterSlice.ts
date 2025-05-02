import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { addUnitAction, deletUnitAction, editUnitAction, getUnitAction } from "./middleware"

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
  },
})

export const masterSelector = (state: RootState) => state?.Master

export default masterSlice.reducer