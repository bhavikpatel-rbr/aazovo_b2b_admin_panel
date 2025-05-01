import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"

import { getLocalAccessToken } from "./token"

const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = getLocalAccessToken()
  if (config.headers) {
    if (token) {
      config.headers.Authorization = `${token}`;
    }
  }
  return config
}

const onRequestError = (error: AxiosError): Promise<AxiosError> => Promise.reject(error)

const onResponse = (response: AxiosResponse): AxiosResponse => response

const onResponseError = async (error: AxiosError) => Promise.reject(error)

export const setupInterceptorsTo = (axiosObj: AxiosInstance): AxiosInstance => {
  axiosObj?.interceptors?.request?.use(onRequest, onRequestError)
  axiosObj?.interceptors?.response?.use(onResponse, onResponseError)
  return axiosObj
}