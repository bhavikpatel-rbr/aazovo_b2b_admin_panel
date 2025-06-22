import { AxiosResponse } from "axios";
import axiosInstance, { isAxiosError } from "../../services/api/api"
import { config } from "../../utils/config"
interface ApiParams {
  page?: number;
  per_page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
  created_by?: string; // Comma-separated IDs
  assign_user?: string; // Comma-separated IDs
  fetch_all?: boolean;
  // Add any other specific filter params your API might expect
}
export const getLeadAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/lead/lead`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addLeadAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/lead/lead`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editLeadAsync = async (leadData: any) => {
  console.log(`${config.apiURL}/lead/lead/${leadData?.id}`, { _method: "PUT", ...leadData });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/lead/lead/${leadData?.id}`, { _method: "PUT", ...leadData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteLeadAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/lead/lead/${leadData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllLeadAsync = async (leadData: any) => {
  try {
    console.log("leadData", leadData);

    const response = await axiosInstance.post(`${config.apiURL}/lead/lead/delete`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

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
    const response = await axiosInstance.post(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name, status: unitData?.status, category_id: unitData.category_id, })
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
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_type/${unitData?.id}`, { _method: "PUT", name: unitData?.name, status: unitData?.status })
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
    const response = await axiosInstance.post(`${config.apiURL}/master/payment_term/${unitData?.id}`, { _method: "PUT", term_name: unitData?.term_name, status: unitData?.status })
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
    const response = await axiosInstance.post(`${config.apiURL}/master/currency/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.currency_symbol, currency_code: unitData?.currency_code, status: unitData?.status })
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
    const response = await axiosInstance.post(`${config.apiURL}/master/continent/${unitData?.id}`, { _method: "PUT", name: unitData?.name, region: unitData?.region, iso_code: unitData?.iso_code, phone_code: unitData?.phone_code, status: unitData?.status })
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
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/country/${unitData?.id}`, { _method: "PUT", name: unitData?.name, iso_code: unitData?.iso_code, phone_code: unitData?.phone_code, region: unitData?.region, status: unitData?.status })
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


export const addDocumentListAsync = async (unitData: FormData) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_master`, unitData);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editDocumentListAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", name: unitData?.name, document_type: unitData?.document_type, status: unitData?.status })
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
    const response = await axiosInstance.post(`${config.apiURL}/master/brand/get`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getAllTaskAsync = async () => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/get-all-task`, {
      "user_id": 53
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addBrandAsync = async (unitData: FormData) => {
  try {
    // For FormData, we need to set the correct headers (or let Axios set them automatically)
    const response = await axiosInstance.post(`${config.apiURL}/master/brand`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editBrandListAsync = async (brandId: number | string, formData: FormData) => {
  for (const pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  try {
    // The formData already contains _method: 'PUT'
    // Axios will automatically set 'Content-Type': 'multipart/form-data'
    // when the second argument to post/put is a FormData instance.
    const response = await axiosInstance.post(
      `${config.apiURL}/master/brand/${brandId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const deletBrandListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/brand/${unitData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllBrandListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/brand/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getProductAsync = async () => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/product/get?page=1`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getAllProductsDataAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/product`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getAllCategoriesData = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/dashboard/categories`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addProductAsync = async (unitData: FormData) => {
  try {
    // For FormData, we need to set the correct headers (or let Axios set them automatically)
    const response = await axiosInstance.post(`${config.apiURL}/master/product`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editProductListAsync = async (productId: number | string, formData: FormData) => {
  try {
    // The formData already contains _method: 'PUT'
    // Axios will automatically set 'Content-Type': 'multipart/form-data'
    // when the second argument to post/put is a FormData instance.
    const response = await axiosInstance.post(
      `${config.apiURL}/master/product/${productId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const deletProductListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/product/${unitData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllProductListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/brand/delete`, unitData)
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

export const addBlogsAsync = async (unitData: FormData) => {
  try {
    // For FormData, we need to set the correct headers (or let Axios set them automatically)
    const response = await axiosInstance.post(`${config.apiURL}/blog`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

// export const editBlogsAsync = async (unitData: any) => {
//   console.log(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", currency_symbol: unitData?.name });

//   try {
//     const response = await axiosInstance.post(`${config.apiURL}/master/document_master/${unitData?.id}`, { _method: "PUT", name: unitData?.name, iso_code: unitData?.iso_code, phone_code: unitData?.phone_code, region: unitData?.region })
//     return response
//   } catch (err) {
//     return isAxiosError(err)
//   }
// }

export const editBlogsAsync = async (brandId: number | string, formData: FormData) => {
  console.log("editBrandListAsync - brandId:", brandId);
  console.log("editBrandListAsync - formData to be sent:");
  for (const pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  try {
    // The formData already contains _method: 'PUT'
    // Axios will automatically set 'Content-Type': 'multipart/form-data'
    // when the second argument to post/put is a FormData instance.
    const response = await axiosInstance.post(
      `${config.apiURL}/blog/${brandId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};


export const deletBlogsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/blog/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllBlogsAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/blog/delete`, unitData)
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
export const getParentcategoryAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/parent-category`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addcategoryAsync = async (unitData: FormData) => {
  try {
    console.log(unitData);
    // For FormData, we need to set the correct headers (or let Axios set them automatically)
    const response = await axiosInstance.post(`${config.apiURL}/master/category`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editcategoryListAsync = async (brandId: number | string, formData: FormData) => {
  console.log("editBrandListAsync - brandId:", brandId);
  console.log("editBrandListAsync - formData to be sent:");
  for (const pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  try {
    // The formData already contains _method: 'PUT'
    // Axios will automatically set 'Content-Type': 'multipart/form-data'
    // when the second argument to post/put is a FormData instance.
    const response = await axiosInstance.post(
      `${config.apiURL}/master/category/${brandId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const deletcategoryListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/category/${unitData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllcategoryListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/category/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const getwallListingAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/wall/enquiry`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getPriceListAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/price_list`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addPriceListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/price_list`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editPriceListAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/other/price_list/${unitData?.id}`, { _method: "PUT", product_id: unitData?.product_id, expance: unitData?.expance, margin: unitData?.margin, price: unitData?.price, usd_rate: unitData?.usd_rate });
  console.log("unitData", unitData);

  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/price_list/${unitData?.id}`, { _method: "PUT", product_id: parseInt(unitData?.product_id), price: parseFloat(unitData?.price), usd_rate: parseFloat(unitData?.usd_rate), expance: parseFloat(unitData?.expance), margin: parseFloat(unitData?.margin), id: unitData?.id, status: unitData?.status })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletePriceListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/other/price_list/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllPriceListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/price_list/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getSlidersAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/slider`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addSlidersAsync = async (unitData: FormData) => {
  try {
    // For FormData, we need to set the correct headers (or let Axios set them automatically)
    const response = await axiosInstance.post(`${config.apiURL}/setting/slider`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editSlidersListAsync = async (brandId: number | string, formData: FormData) => {
  console.log("editBrandListAsync - brandId:", brandId);
  console.log("editBrandListAsync - formData to be sent:");
  for (const pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  try {
    // The formData already contains _method: 'PUT'
    // Axios will automatically set 'Content-Type': 'multipart/form-data'
    // when the second argument to post/put is a FormData instance.
    const response = await axiosInstance.post(
      `${config.apiURL}/setting/slider/${brandId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const deletSlidersListAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/setting/slider/${unitData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllSlidersListAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/setting/slider/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getCompanyProfileAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/company_profile_setting`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const editCompanyProfileListAsync = async (brandId: number | string, formData: FormData) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/setting/company_profile_setting/${brandId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const getTrandingImageAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/trending_image`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addTrandingImageAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/trending_image`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editTrandingImageAsync = async (unitData: any) => {

  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/trending_image/${unitData?.id}`, { _method: "PUT", page_name: unitData?.page_name, product_ids: unitData?.product_ids, status: unitData?.status })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletTrandingImageAsync = async (unitData: any) => {

  console.log("unitData", unitData);

  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/trending_image/delete`, { ids: unitData?.id.toString() })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllTrandingImageAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/trending_image/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getTrandingCarouseAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/trending_carousel`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addTrandingCarouselAsync = async (unitData: FormData) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/trending_carousel`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editTrandingCarouselAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/other/trending_carousel/${unitData?.id}`,
      unitData?.formData, // ✅ send raw FormData
      {
        headers: {
          "Content-Type": "multipart/form-data", // ✅ Required for file + FormData
        },
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};



export const deletTrandingCarouselAsync = async (unitData: any) => {

  console.log("unitData", unitData);

  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/trending_carousel/delete`, { ids: unitData?.id.toString() })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllTrandingCarouselAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/trending_carousel/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getProductSepecificationAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/product_spec`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addProductSepecificationAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/product_spec`, unitData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editProductSepecificationAsync = async ({
  id,
  formData,
}: {
  id: string | number;
  formData: FormData;
}) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/master/product_spec/${id}`,
      formData, // 👈 pass FormData directly
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (err) {
    throw err; // or handle/log properly
  }
};



export const deletProductSepecificationAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/product_spec/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllProductSepecificationAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/product_spec/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getDepartmentAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/department`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addDepartmentAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/department`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editDepartmentAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/department/${unitData?.id}`, { _method: "PUT", name: unitData?.name, status: unitData?.status })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletDepartmentAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/department/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllDepartmentAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/department/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getDesignationAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/designation`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addDesignationAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/designation`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editDesignationAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/designation/${unitData?.id}`, { _method: "PUT", name: unitData?.name })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletDesignationAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/designation/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllDesignationAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/designation/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const getNumberSystemsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/number_system`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addNumberSystemsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/number_system`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editNumberSystemsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/number_system/${unitData?.id}`, {
      _method: "PUT", name: unitData?.name, prefix: unitData?.prefix,
      ...unitData,
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletNumberSystemsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/setting/number_system/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllNumberSystemsAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/setting/number_system/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getDomainsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/domain_management`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addDomainsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/domain_management`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editDomainsAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/domain_management/${unitData?.id}`, {
      _method: "PUT", domain: unitData?.domain, prefix: unitData?.prefix,
      analytics_script: unitData?.analytics_script,
      currency_id: unitData?.currency_id,
      country_ids: unitData?.country_ids,
      customer_code_starting: unitData?.customer_code_starting,
      current_customer_code: unitData?.current_customer_code,
      non_kyc_customer_code_starting: unitData?.non_kyc_customer_code_starting,
      non_kyc_current_customer_code: unitData?.non_kyc_current_customer_code,
      status: unitData?.status
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletDomainsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/domain_management/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteDomainsAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/domain_management/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getJobDepartmentAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/job_department`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addJobDepartmentAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/job_department`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editJobDepartmentAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/job_department/${unitData?.id}`, {
      _method: "PUT", name: unitData?.name
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletJobDepartmentAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/master/job_department/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllJobDepartmentAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/master/job_department/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getJobPostsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/job_post`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addJobPostsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/job_post`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editJobPostsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/job_post/${unitData?.id}`, {
      _method: "PUT", name: unitData?.name
      , status: unitData?.status
      , description: unitData?.description
      , location: unitData?.location
      , vacancies: unitData?.vacancies
      , experience: unitData?.experience
      , job_title: unitData?.job_title
      , job_department_id: unitData?.job_department_id
      , job_plateforms: unitData?.job_plateforms
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletJobPostsAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/other/job_post/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllJobPostsAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/job_post/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getBugReportAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/bug_report`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addBugReportAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/bug_report`, unitData, {

      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editBugReportAsync = async (brandId: number | string, formData: FormData) => {
  try {
    formData.append('_method', 'PUT');
    const response = await axiosInstance.post(
      `${config.apiURL}/other/bug_report/${brandId}`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const deletBugReportAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/other/bug_report/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllBugReportAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/bug_report/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getSubscribersAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/subscriber`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addSubscriberAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/subscriber`, unitData, {

      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editSubscriberAsync = async (brandId: number | string, formData: FormData) => {
  try {
    // formData.append('_method', 'PUT');
    const response = await axiosInstance.post(
      `${config.apiURL}/subscriber/${brandId}`, // Use brandId in the URL
      formData,

    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};
export const getHomeCategoryAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/home_category_image`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addHomeCategoryAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/home_category_image`, unitData?.formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}


export const editHomeCategoryAsync = async (unitData: any) => {
  console.log('editHomeCategoryAsync - unitData:', unitData);
  try {
    // Send the formData directly
    const response = await axiosInstance.post(
      `${config.apiURL}/other/home_category_image/${unitData?.id}`,
      unitData.formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const deletHomeCategoryAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/other/home_category_image/${unitData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllHomeCategoryAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/other/home_category_image/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getRowDataAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/row_data`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addRowDataAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/row_data`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editRowDataAsync = async (unitData: any) => {
  console.log(`${config.apiURL}/master/unit/${unitData?.id}`, { _method: "PUT", name: unitData?.name });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/row_data/${unitData?.id}`, {
      _method: "PUT", country_id: unitData?.country_id,
      category_id: unitData?.category_id
      , brand_id: unitData?.brand_id
      , mobile_no: unitData?.mobile_no
      , email: unitData?.email
      , name: unitData?.name
      , company_name: unitData?.company_name
      , quality: unitData?.quality
      , city: unitData?.city
      , status: unitData?.status
      , remarks: unitData?.remarks
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletRowDataAsync = async (unitData: any) => {
  try {
    console.log(unitData.id)
    const response = await axiosInstance.delete(`${config.apiURL}/row_data/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllRowDataAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/row_data/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getAutoEmailAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/automation_email`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addAutoEmailAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/automation_email`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editAutoEmailAsync = async (leadData: any) => {
  console.log(`${config.apiURL}/lead/lead/${leadData?.id}`, { _method: "PUT", ...leadData });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/automation_email/${leadData?.id}`, { _method: "PUT", ...leadData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAutoEmailAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/setting/automation_email/${leadData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllAutoEmailAsync = async (leadData: any) => {
  try {
    console.log("leadData", leadData);

    const response = await axiosInstance.post(`${config.apiURL}/setting/automation_email/delete`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getUsersAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/users/users`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getEmailCampaignsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/mail_campaign`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addEmailCampaignsAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/mail_campaign`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editEmailCampaignsAsync = async (leadData: any) => {
  console.log(`${config.apiURL}/lead/lead/${leadData?.id}`, { _method: "PUT", ...leadData });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/mail_campaign/${leadData?.id}`, { _method: "PUT", ...leadData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteEmailCampaignsAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/setting/mail_campaign/${leadData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllEmailCampaignsAsync = async (leadData: any) => {
  try {
    console.log("leadData", leadData);

    const response = await axiosInstance.post(`${config.apiURL}/setting/mail_campaign/delete`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getMailTemplatesAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/mail_template`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getAutoEmailTemplatesAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/automation_email_template`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addAutoEmailTemplatesAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/automation_email_template`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editAutoEmailTemplatesAsync = async (leadData: any) => {
  console.log(`${config.apiURL}/lead/lead/${leadData?.id}`, { _method: "PUT", ...leadData });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/automation_email_template/${leadData?.id}`, { _method: "PUT", ...leadData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAutoEmailTemplatesAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/setting/automation_email_template/${leadData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllAutoEmailTemplatesAsync = async (leadData: any) => {
  try {
    console.log("leadData", leadData);

    const response = await axiosInstance.post(`${config.apiURL}/setting/automation_email_template/delete`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getEmailTemplatesAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/email_templates`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addEmailTemplatesAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/email_templates`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editEmailTemplatesAsync = async (leadData: any) => {
  console.log(`${config.apiURL}/lead/lead/${leadData?.id}`, { _method: "PUT", ...leadData });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/email_templates/${leadData?.id}`, { _method: "PUT", ...leadData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteEmailTemplatesAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/setting/email_templates/${leadData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllEmailTemplatesAsync = async (leadData: any) => {
  try {
    console.log("leadData", leadData);

    const response = await axiosInstance.post(`${config.apiURL}/setting/email_templates/delete`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getRequestFeedbacksAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/feedback`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addRequestFeedbacksAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/feedback`, leadData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};


export const editRequestFeedbacksAsync = async (
  id: number | string,
  formData: FormData
) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/feedback/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};


export const deleteRequestFeedbacksAsync = async (leadData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/feedback/${leadData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllRequestFeedbacksAsync = async (leadData: any) => {
  try {
    console.log("leadData", leadData);

    const response = await axiosInstance.post(`${config.apiURL}/feedback/delete`, leadData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const getSellerListingsAsync = async () => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/opportunity/seller`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getBuyerListingsAsync = async () => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/opportunity/buyer`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getAutoMatchDataAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/opportunity/autospb`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getAllproductAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/product`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getGlobalSettingAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/setting/global_setting`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editGlobalSettingAsync = async (settingId: number | string, formData: FormData) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/setting/global_setting/${settingId}`, // Use settingId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const getMembersAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/customer`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const getSubcategoriesByCategoryIdAsync = async (categoryId: string) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/sub_category?category_id=${categoryId}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getBrandsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/brand`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getUnitsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/unit`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const changeProductStatusAsync = async ({ id, status }: { id: number; status: string }) => {
  try {
    console.log("ididid", id)
    const response = await axiosInstance.post(`${config.apiURL}/master/product/status/${id}`, {
      status,
    })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getInquiriesAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/inquiry`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllInquiriesAsync = async (unitData: any) => {
  try {
    console.log("unitData", unitData);

    const response = await axiosInstance.post(`${config.apiURL}/inquiry/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const importRowDataAsync = async () => {
  try {
    const response = await axiosInstance.put(`${config.apiURL}/master/import`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const getJobApplicationAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/other/job_application`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addJobApplicationAsync = async (applicationData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/job_application`, applicationData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editJobApplicationAsync = async (applicationData: any) => {
  console.log(`${config.apiURL}/other/job_application/${applicationData?.id}`, { _method: "PUT", ...applicationData });

  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/job_application/${applicationData?.id}`, { _method: "PUT", ...applicationData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteJobApplicationAsync = async (applicationData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/jother/job_application/${applicationData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllJobApplicationAsync = async (applicationData: any) => {
  try {
    console.log("applicationData", applicationData);

    const response = await axiosInstance.post(`${config.apiURL}/other/job_application/delete`, applicationData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getRolesAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/roles/role`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const getSubcategoriesByIdAsync = async (categoryId: string) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/category/${categoryId}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


{/*
  * Company Module
  */}

export const getcompanyAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/company`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addCompanyAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/company`,
      unitData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log(unitData, response);

    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

// export const editcompanyAsync = async (unitData: any) => {
//   try {
//     const response = await axiosInstance.post(`${config.apiURL}/company/${unitData?.id}`, { _method: "PUT", ...unitData })
//     return response
//   } catch (err) {
//     return isAxiosError(err)
//   }
// }

export const deletcompanyAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/company/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllcompanyAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/setting/company_profile_setting/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


{/*
  * Member Module
*/}


export const getAllProductsAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/product`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getMemberAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/customer`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addMemberAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/customer`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editMemberAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/customer/${unitData?.id}`, { _method: "PUT", ...unitData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteMemberAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/customer/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllMemberAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/customer/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getpartnerAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/partner`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}
export const getpartnerByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/partner/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}
export const addpartnerAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/partner`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editpartnerAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/partner/${unitData?.id}`, { _method: "PUT", ...unitData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deletepartnerAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/partner/${unitData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllpartnerAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/partner/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getpWallListingAsync = async (params: any = {}) => { // <-- ACCEPTS PARAMS
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      // For per_page = -1 (export all), ensure your API handles this.
      // If API expects a very large number instead of -1, adjust here.
      // e.g. if (key === 'per_page' && value === -1) value = 99999;
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();

  try {
    // Make sure the response type matches what your API actually returns
    const response: AxiosResponse<any> = await axiosInstance.get(
      `${config.apiURL}/wall/enquiry${queryString ? `?${queryString}` : ''}`
    );
    return response; // Return the full Axios response
  } catch (err) {
    // It's generally better to let the createAsyncThunk handle the error catching
    // by re-throwing, or to return a structured error object.
    // The `isAxiosError` check should happen in the thunk's catch block.
    console.error("Error in getpWallListingAsync:", err);
    throw err; // Re-throw to be caught by the thunk or calling function
  }
};


export const deleteAllWallAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/wall/enquiry/delete`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}



export const addInquiriesAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/inquiry`, unitData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editInquiriesAsync = async (params: { id: string | number; data: FormData }) => {
  // params.data is the FormData object from the React component.
  // We will ensure _method: 'PUT' is appended here.
  // If it was already appended by the component, appending again might lead to duplicate _method fields
  // depending on how the backend handles it. It's usually better to have it set in one place.
  // However, to fulfill the request of adding it here:

  const formDataToSend = params.data; // Use the FormData passed in

  // Check if _method is already there; if not, or if you want to ensure it's specifically 'PUT'
  // Note: FormData doesn't have a simple 'has' or 'get' for all browsers/environments
  // in a way that's easy to check without iterating or if it can have multiple values.
  // For simplicity and to ensure it's present as per your request, we'll just append it.
  // If the backend picks the first or last _method, this might be fine.
  // A cleaner way is for the React component to be solely responsible for adding it.
  formDataToSend.append('_method', 'PUT');

  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/inquiry/${params.id}`,
      formDataToSend, // Send the FormData object
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return { error: false, data: response.data };
  } catch (err) {
    return isAxiosError(err);
  }
};

export const submitResponseAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/other/export_mapping/add`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const getFormBuilderAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/form_builder`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addFormBuilderAsync = async (formData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/form_builder`, formData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editFormBuilderAsync = async (formData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/form_builder/${formData?.id}`, { _method: "PUT", ...formData })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteFormBuilderAsync = async (formData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/form_builder/${formData.id}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllFormBuilderAsync = async (formData: any) => {
  try {
    console.log(formData);
    const response = await axiosInstance.delete(`${config.apiURL}/master/form_builder/delete`, formData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const changeFormBuilderStatusAsync = async (data: { id: string | number; status: string }) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/form_builder/change-status`, data);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const cloneFormBuilderAsync = async (formData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/form_builder/clone`, formData);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const getActivityLogAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/activity-logs`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addWallItemAsync = async (unitData: FormData) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/wall/enquiry`, unitData);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const getOpportunitiesAsync = async () => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/opportunity`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getWallItemByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/wall/enquiry/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const getOffersAsync = async (params?: ApiParams) => { // Accept params
  try {
    let url = `${config.apiURL}/offer`;
    if (params) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          const value = params[key as keyof ApiParams];
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            queryParams.append(key, String(value));
          }
        }
      }
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    // console.log("Fetching Offers with URL:", url); // Optional: for debugging
    const response = await axiosInstance.get(url);
    // IMPORTANT: The original thunk expects `response.data` to be returned here.
    // If `response.data` contains { status: true, data: { actual_payload } },
    // and your thunk's `if (response?.data)` check is on this outer structure,
    // then `return response.data` is correct.
    return response.data;
  } catch (err) {
    // The original thunk expects the error object itself if it's an AxiosError,
    // or just the error for other types.
    // Let's keep it simple and rethrow, `createAsyncThunk` will handle it.
    throw err;
  }
};

export const getDemandsAsync = async (params?: ApiParams) => { // Accept params
  try {
    let url = `${config.apiURL}/demand`;
    if (params) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          const value = params[key as keyof ApiParams];
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            queryParams.append(key, String(value));
          }
        }
      }
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    // console.log("Fetching Demands with URL:", url); // Optional: for debugging
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const addOfferAsync = async (offerData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/offer`, offerData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editOfferAsync = async (offerData: any) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/offer/${offerData?.id}`,
      { _method: "PUT", ...offerData }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const addDemandAsync = async (demandData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/demand`, demandData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getOfferByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/offer/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const editDemandAsync = async (demandData: any) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/demand/${demandData?.id}`,
      { _method: "PUT", ...demandData }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const getDemandByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/demand/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}


export const getLeadByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/lead/lead/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const getCompanyByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/company/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const getAllCompanyAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/company`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const editCompanyAsync = async (id: string | number, formData: FormData) => {
  try {
    formData.append("_method", "PUT");
    const response = await axiosInstance.post(
      `${config.apiURL}/company/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const getMemberByIdAsync = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/customer/${id}`);
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
}

export const deleteOfferAsync = async (OfferData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/offer/${OfferData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllOfferAsync = async (OfferData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/offer/delete`, OfferData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}


export const deleteDemandAsync = async (DemandData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/demand/${DemandData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllDemandAsync = async (DemandData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/demand/delete`, DemandData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getLeadMemberAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/lead/lead-member`)
    return response.data
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getSalesPersonAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/sales-person`)
    return response.data
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getSuppliersAsync = async () => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/opportunity/seller`)
    return response.data
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getEmployeeAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/admin/user`)
    return response.data
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addRolesAsync = async (RolesData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/roles/role`, RolesData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editRolesAsync = async (RolesData: any) => {
  try {
    const response = await axiosInstance.post(
      `${config.apiURL}/roles/role/${RolesData?.id}`,
      {
        _method: "PUT",
        ...RolesData.data, // flatten the data object
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};


export const deleteRolesAsync = async (RolesData: any) => {
  try {
    const response = await axiosInstance.delete(`${config.apiURL}/roles/role/${RolesData}`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const deleteAllRolesAsync = async (RolesData: any) => {
  try {
    console.log("RolesData", RolesData);

    const response = await axiosInstance.post(`${config.apiURL}/roles/role/delete`, RolesData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const sendCampaignNowAsync = async (data: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/campaign`, data)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const getMemberTypeAsync = async () => {
  try {
    const response = await axiosInstance.get(`${config.apiURL}/master/member_type`)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addMemberTypeAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/member_type`, unitData)
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const editMemberTypeAsync = async (unitData: any) => {
  try {
    const response = await axiosInstance.post(`${config.apiURL}/master/member_type/${unitData?.id}`, { _method: "PUT", name: unitData?.name, status: unitData?.status })
    return response
  } catch (err) {
    return isAxiosError(err)
  }
}

export const addTaskListAsync = async (unitData: FormData) => {
  try {
    // For FormData, we need to set the correct headers (or let Axios set them automatically)
    const response = await axiosInstance.post(`${config.apiURL}/create-task`, unitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};

export const editTaskListAsync = async (formData: FormData) => {
  for (const pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  try {
    // The formData already contains _method: 'PUT'
    // Axios will automatically set 'Content-Type': 'multipart/form-data'
    // when the second argument to post/put is a FormData instance.
    const response = await axiosInstance.post(
      `${config.apiURL}/create-task`, // Use brandId in the URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  } catch (err) {
    return isAxiosError(err);
  }
};