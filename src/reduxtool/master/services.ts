import axiosInstance, { isAxiosError } from "../../services/api/api"
import { setUser } from "../../services/api/token"
import { config } from "../../utils/config"

export const getUnitAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/unit`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addUnitAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/unit`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editUnitAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletUnitAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/unit/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getDocumentTypeAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/document_type`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getPaymentTermAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/payment_term`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getCurrencyAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/currency`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getcontinentAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/continent`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getcountryAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/country`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getDocumentListAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/document_master`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const getBrandAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/brand`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


