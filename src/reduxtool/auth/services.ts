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

export const forgotPasswordAsync = async (
    forgotPasswordRequest: any
) => {
    try {
        // Make the POST request to your backend's forgot-password endpoint
        const response = await axiosInstance.post<any>(
            `${config.apiURL}/forgot_password`, // <-- IMPORTANT: Replace with your actual endpoint
            forgotPasswordRequest
        )

        // Return the entire response object on success
        return response
    } catch (err) {
        // If an error occurs, process it with your utility and return it
        return isAxiosError(err)
    }
}

