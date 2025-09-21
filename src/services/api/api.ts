import axios, { AxiosInstance } from "axios"

import { setupInterceptorsTo } from "./setupInterceptor"


import { ErrorResponse } from "./SuccessResponse"

const instance: AxiosInstance = axios.create({
  // baseURL: "https://aazovo.codefriend.in/api",
  // baseURL: "https://test.aazovo.co.in/api",
  // baseURL: "https://api.omcommunication.co/api",
  baseURL: "https://api.aazovo.com/api",
  timeout: 1000 * 50,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  },
})
const specificInstance: AxiosInstance = setupInterceptorsTo(instance)

export const isAxiosError = (err: any): ErrorResponse | any => {

  if (axios.isAxiosError(err)) {
    console.log(err?.response?.data?.message == "Unauthenticated.", "errerrerr");
    if (err?.response?.data?.message == "Unauthenticated.") {
      // localStorage.clear();
      // localStorage.setItem("@secure:user", "undefined")
      // localStorage.setItem("@secure:Userpermission", "undefined")
      // localStorage.setItem("@secure:UserData", "undefined")
      // window.location.href = '/';
    } else {

      if (err?.response && err?.response?.data) {
        if (err?.response?.status === 404) return { status: 404, statusText: err?.message } as ErrorResponse
        return err?.response?.data as ErrorResponse
      }
      return { status: 401, statusText: err?.message } as ErrorResponse
      // return { status: 401, statusText: err?.message } as ErrorResponse
    }
  }
}

export default specificInstance