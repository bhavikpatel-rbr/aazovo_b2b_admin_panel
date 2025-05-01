import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { logoutAction, loginUserByEmailAction } from "./middleware"

const INITIAL_STATE: any = {
  token: "", 
}

const authSlice = createSlice({
  name: "auth",
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutAction.fulfilled, (state) => ({
      ...state,
      token: undefined, 
    }))
    builder.addCase(loginUserByEmailAction.fulfilled, (state, { payload }) => ({
      ...state,
      token: payload.access_token,
    }
    ))
  },
})

export const authSelector = (state: RootState) => state?.Auth

export default authSlice.reducer