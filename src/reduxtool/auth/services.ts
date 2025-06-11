import axiosInstance, { isAxiosError } from "../../services/api/api"
import { setUser, setUserData, setUserpermission } from "../../services/api/token"
import { config } from "../../utils/config"

export const loginWithEmailAsync = async (loginRequest: any) => {
  try {
    const response = await axiosInstance.post<any>(`${config.apiURL}/login`, loginRequest)
    console.log("response?.data?", response?.data);

    setUser(response?.data?.access_token)
    setUserData(response?.data?.user)
    setUserpermission(response?.data?.permissions)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
