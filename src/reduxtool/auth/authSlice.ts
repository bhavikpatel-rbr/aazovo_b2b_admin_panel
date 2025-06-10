import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { logoutAction, loginUserByEmailAction } from "./middleware"


type PunchInStatus = 'punched-in' | 'punched-out' | null

export interface AuthState {
    signedIn: boolean
    token: string | null
    punchInStatus: PunchInStatus // <-- ADD THIS
    // ... other user info
}

export const punchIn = createAsyncThunk('auth/punchIn', async () => {
    // await api.punchIn();
    return 'punched-in'
})

export const punchOut = createAsyncThunk('auth/punchOut', async () => {
    // await api.punchOut();
    return 'punched-out'
})
const INITIAL_STATE: any = {
    signedIn: false,
    token: null,
    punchInStatus: null, // <-- ADD THIS
}



const authSlice = createSlice({
  name: "auth",
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutAction.fulfilled, (state) => {
        state.signedIn = false
        state.token = null
        state.punchInStatus = null // Reset on logout
    })
    builder.addCase(loginUserByEmailAction.fulfilled, (state, action) => {
        state.signedIn = true
        // Use either action.payload.token or action.payload.access_token depending on your API response
        state.token = action.payload.token || action.payload.access_token
        // IMPORTANT: Assume API response includes the user's punch-in status
        state.punchInStatus = action.payload.user?.punchInStatus || 'punched-out'
    })
    // Handle the state change for punch-in/out actions
    .addCase(punchIn.fulfilled, (state) => {
        state.punchInStatus = 'punched-in'
    })
    .addCase(punchOut.fulfilled, (state) => {
        state.punchInStatus = 'punched-out'
    })
  },
})

export const authSelector = (state: RootState) => state?.Auth

export default authSlice.reducer