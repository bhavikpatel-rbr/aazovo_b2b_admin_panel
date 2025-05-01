import { combineReducers } from "redux"

import authReducer from "./auth/authSlice" 
import lemReducer from "./lem/lemSlice" 

const reducer = combineReducers({
  Auth: authReducer,  
  Lem: lemReducer,  
})

export default reducer