import { combineReducers } from "redux"

import authReducer from "./auth/authSlice" 
import lemReducer from "./lem/lemSlice" 
import masterReducer from "./master/masterSlice" 

const reducer = combineReducers({
  Auth: authReducer,  
  Lem: lemReducer,  
  Master: masterReducer,  
})

export default reducer