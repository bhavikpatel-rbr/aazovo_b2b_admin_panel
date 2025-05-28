import { AxiosResponse } from "axios"
import { showMessage } from "../reduxtool/lem/lemSlice"
import { defaultMessageObj } from "../reduxtool/lem/types"

export const loadData = async <T>(
  asyncFn: () => Promise<AxiosResponse<any>>,
  dispatch: any,
  errorMessage = "Failed to load data"
): Promise<T | unknown> => {
  try {
    const response = await asyncFn()
    if (response?.data?.status === true) {
      return response.data.data as T
    }

    dispatch(
      showMessage({
        ...defaultMessageObj,
        type: "error",
        messageText: response?.data?.message || errorMessage,
      })
    )
    return Promise.reject(response)
  } catch (error) {
    return Promise.reject(error)
  }
}
