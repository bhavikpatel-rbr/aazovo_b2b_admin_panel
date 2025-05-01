import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../../reduxtool/store"

import { LemState, MessageState } from "./types"

const INITIAL_STATE: LemState = {
  loading: false,
  message: "",
}

const lemSlice = createSlice({
  name: "Lem",
  initialState: INITIAL_STATE,
  reducers: {
    showLoader: (state: LemState, { payload }: PayloadAction<LemState>) => ({
      ...state,
      loading: payload.loading,
      message: payload.message,
    }),

    hideLoader: (state: LemState) => ({
      ...state,
      loading: false,
      message: "",
    }),

    showMessage: (state: LemState, { payload }: PayloadAction<MessageState>) => ({
      ...state,
      loading: false,
      message: payload,
    }),

    hideMessage: (state: LemState) => ({
      ...state,
      loading: false,
      message: undefined,
    }),
  },
})

export const { showLoader, hideLoader, showMessage, hideMessage } = lemSlice.actions

export const lemSelector = (state: RootState) => state?.Lem

export default lemSlice.reducer