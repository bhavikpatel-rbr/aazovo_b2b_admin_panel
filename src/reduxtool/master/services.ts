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

export const deleteAllUnitAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/unit/delete`, unitData)
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

export const addDocumentTypeAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_type`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editDocumentTypeAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/document_type/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_type/${unitData?.id}`, { _method: "PUT", name: unitData?.name })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletDocumentTypeAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/document_type/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllDocumentTypeAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/document_type/delete`, unitData)
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

export const addPaymentTermAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/payment_term`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editPaymentTermAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/payment_term/${unitData?.id}`, { _method: "PUT", term_name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/payment_term/${unitData?.id}`, { _method: "PUT", term_name: unitData?.term_name })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletPaymentTermAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/payment_term/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllPaymentTermAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/payment_term/delete`, unitData)
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

export const addCurrencyAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/currency`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editCurrencyAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/currency/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/currency/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.currency_symbol , currency_code : unitData?.currency_code}) 
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletCurrencyAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/currency/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllCurrencyAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/currency/delete`, unitData)
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

export const addcontinentAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/continent`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editcontinentAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/continent/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/continent/${unitData?.id}`, { _method: "PUT", name: unitData?.name }) 
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletcontinentAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/continent/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllcontinentAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/continent/delete`, unitData)
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
export const addcountryAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/country`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editcountryAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/country/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/country/${unitData?.id}`, { _method: "PUT", name: unitData?.name , iso : unitData?.iso,phonecode : unitData?.phonecode ,continent_id : unitData?.continent_id}) 
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletcountryAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/country/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllcountryAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/country/delete`, unitData)
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

export const addDocumentListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_master`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editDocumentListAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", name: unitData?.name , iso : unitData?.iso,phonecode : unitData?.phonecode ,continent_id : unitData?.continent_id}) 
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletDocumentListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/document_master/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllDocumentListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/document_master/delete`, unitData)
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

export const getBlogsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/blog`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addBlogsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_master`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editBlogsAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", name: unitData?.name , iso : unitData?.iso,phonecode : unitData?.phonecode ,continent_id : unitData?.continent_id}) 
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletBlogsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/document_master/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllBlogsAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/document_master/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}



export const getExportMappingsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/export_mapping`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getcategoryAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/category`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


