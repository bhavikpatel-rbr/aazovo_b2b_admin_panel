import axiosInstance, { isAxiosError } from "../../services/api/api"
import { setUser } from "../../services/api/token"
import { config } from "../../utils/config"

export const loginWithEmailAsync = async (loginRequest: any) => {
  try {
    const response = await axiosInstance.post<any>(`${config.apiURL}/login`, loginRequest)

    // setUser(response?.data?.data?.token)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
 