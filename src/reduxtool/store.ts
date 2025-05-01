import { Action, AnyAction, configureStore, Store, ThunkAction } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { ThunkDispatch } from "redux-thunk"
import { persistStore, persistReducer } from "redux-persist"
import { createStateSyncMiddleware } from "redux-state-sync"
import { Persistor } from "redux-persist/lib/types"
import { encryptTransform } from "redux-persist-transform-encrypt"
import combineReducer from "./reducer"
import localForage from "localforage"

const persistConfig = {
  key: "weedman",
  storage: localForage,
  transforms: [
    encryptTransform({
      secretKey: process.env.REACT_APP_PERSIST_SECRET_KEY || "@ntala@bhishek",
      onError: (error: Error) => {
        console.log("ERROR", error)
      }
    })
  ]
}

export type RootState = ReturnType<typeof combineReducer>

const persistedReducer = persistReducer<RootState>(persistConfig, combineReducer)

// 2. Create a type for thunk dispatch
export type AppThunkDispatch = ThunkDispatch<RootState, any, AnyAction>

export type AppStore = Omit<Store<RootState, AnyAction>, "dispatch"> & {
  dispatch: AppThunkDispatch
}

const rootReducer = (state: any, action: AnyAction) => {
  if (action.type === "auth/logout/fulfilled") {
    state = {
      ...state,
      Customer: undefined,
      ShoppingCartState: undefined
    }
  }
  return persistedReducer(state, action)
}

export const store: AppStore = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false
    }).concat([
      createStateSyncMiddleware({
        channel: "brunt",
        broadcastChannelOption: { type: "localstorage", webWorkerSupport: false },
        blacklist: ['persist/PERSIST', 'persist/PURGE', 'persist/REHYDRATE']
      })
    ])
})

export const persistor: Persistor = persistStore(store)

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>

export const useAppDispatch = () => useDispatch<AppThunkDispatch>()