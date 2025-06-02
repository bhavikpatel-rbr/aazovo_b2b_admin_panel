import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { addcompanyAction, addContinentAction, addCountryAction, addCurrencyAction, addDocumentTypeAction, addInquiriesAction, addMemberAction, addpartnerAction, addPaymentTermAction, addUnitAction, deletAllUnitAction, deleteAllcompanyAction, deleteAllMemberAction, deleteAllpartnerAction, deletecompanyAction, deleteContinentAction, deleteCountryAction, deleteCurrencyAction, deleteDocumentTypeAction, deleteMemberAction, deletepartnerAction, deletePaymentTermAction, deletUnitAction, editcompanyAction, editContinentAction, editCountryAction, editCurrencyAction, editDocumentTypeAction, editInquiriesAction, editMemberAction, editpartnerAction, editPaymentTermAction, editUnitAction, getAllProductAction, getAutoEmailsAction, getAutoEmailTemplatesAction, getAutoMatchDataAction, getBlogsAction, getBrandAction, getBugReportsAction, getBuyerListingsAction, getCategoriesAction, getCompanyAction, getCompanyProfileAction, getContinentsAction, getCountriesAction, getCurrencyAction, getDepartmentsAction, getDesignationsAction, getDocumentListAction, getDocumentTypeAction, getDomainsAction, getEmailCampaignsAction, getEmailTemplatesAction, getExportMappingsAction, getFormBuilderAction, getHomeCategoryAction, getInquiriesAction, getJobApplicationsAction, getJobDepartmentsAction, getJobPostsAction, getLeadAction, getMailTemplatesAction, getMemberAction, getMembersAction, getNumberSystemsAction, getpartnerAction, getPaymentTermAction, getPriceListAction, getProductsAction, getProductSpecificationsAction, getRequestFeedbacksAction, getRolesAction, getRowDataAction, getSellerListingsAction, getSlidersAction, getSubcategoriesByCategoryIdAction, getSubscribersAction, getTrendingCarouselAction, getTrendingImagesAction, getUnitAction, getUsersAction, getWallItemsAction, getWallListingAction } from "./middleware"

const INITIAL_STATE: any = {
  unitData: "",
  LeadsData: "",
  PaymentTermsData: "",
  DocumentTypeData: "",
  CurrencyData: "",
  ContinentsData: "",
  CountriesData: "",
  DocumentListData: "",
  memberData: "",
  productsMasterData: "",
  autoMatchData: "",
  buyerListings: "",
  sellerListings: "",
  requestFeedbacksData: "",
  emailTemplatesData: "",
  autoEmailTemplatesData: "",
  mailTemplatesData: "",
  emailCampaignsData: "",
  usersData: "",
  autoEmailsData: "",
  rowData: "",
  categoryData: "",
  rawApiSubscribers: "",
  bugReportsData: "",
  jobPostsData: "",
  jobDepartmentsData: "",
  domainsData: "",
  numberSystemsData: "",
  departmentsData: "",
  designationsData: "",
  ProductSpecificationsData: "",
  trendingCarouselData: "",
  trendingImagesData: "",
  rawProfileArrayFromState: "",
  slidersData: "",
  ProductsData: "",
  priceListData: "",
  wallItemsData: "",
  CategoriesData: "",
  apiExportMappings: "",
  BlogsData: "",
  BrandData: "",
  inquiryList: [],
  CompanyData: [],
  MemberData: [],
  partnerData: [],
  jobApplicationsData: [],
  wallListing: [],
  formsData:[]
}

const masterSlice = createSlice({
  name: "master",
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
      unitData: payload
    }))
    builder.addCase(addUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deletUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getLeadAction.fulfilled, (state, { payload }) => ({
      ...state,
      LeadsData: payload
    }))
    // ...
    builder.addCase(deletAllUnitAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
      DocumentTypeData: payload
    }))
    builder.addCase(addDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editDocumentTypeAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    // builder.addCase(deleteAllDocumentTypeAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    builder.addCase(getPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
      PaymentTermsData: payload
    }))
    builder.addCase(addPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deletePaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editPaymentTermAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    // builder.addCase(deleteAllDocumentTypeAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    builder.addCase(getCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
      CurrencyData: payload
    }))
    builder.addCase(addCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editCurrencyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getContinentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ContinentsData: payload
    }))
    builder.addCase(addContinentAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteContinentAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editContinentAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))

    builder.addCase(getCountriesAction.fulfilled, (state, { payload }) => ({
      ...state,
      CountriesData: payload
    }))
    builder.addCase(addCountryAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteCountryAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editCountryAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))

    builder.addCase(getDocumentListAction.fulfilled, (state, { payload }) => ({
      ...state,
      DocumentListData: payload
    }))
    builder.addCase(getBrandAction.fulfilled, (state, { payload }) => ({
      ...state,
      BrandData: payload
    }))
    builder.addCase(getBlogsAction.fulfilled, (state, { payload }) => ({
      ...state,
      BlogsData: payload
    }))
    builder.addCase(getExportMappingsAction.fulfilled, (state, { payload }) => ({
      ...state,
      apiExportMappings: payload
    }))
    builder.addCase(getCategoriesAction.fulfilled, (state, { payload }) => ({
      ...state,
      CategoriesData: payload
    }))
    builder.addCase(getWallItemsAction.fulfilled, (state, { payload }) => ({
      ...state,
      wallItemsData: payload
    }))
    builder.addCase(getPriceListAction.fulfilled, (state, { payload }) => ({
      ...state,
      priceListData: payload
    }))

    builder.addCase(getProductsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ProductsData: payload
    }))
    // builder.addCase(addPriceListAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    // builder.addCase(deletePriceListAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    // builder.addCase(editPriceListAction.fulfilled, (state, { payload }) => ({
    //   ...state,
    // }))
    builder.addCase(getSlidersAction.fulfilled, (state, { payload }) => ({
      ...state,
      slidersData: payload
    }))
    builder.addCase(getCompanyProfileAction.fulfilled, (state, { payload }) => ({
      ...state,
      rawProfileArrayFromState: payload
    }))
    builder.addCase(getTrendingImagesAction.fulfilled, (state, { payload }) => ({
      ...state,
      trendingImagesData: payload
    }))

    builder.addCase(getTrendingCarouselAction.fulfilled, (state, { payload }) => ({
      ...state,
      trendingCarouselData: payload
    }))
    builder.addCase(getProductSpecificationsAction.fulfilled, (state, { payload }) => ({
      ...state,
      ProductSpecificationsData: payload
    }))
    builder.addCase(getDesignationsAction.fulfilled, (state, { payload }) => ({
      ...state,
      designationsData: payload
    }))
    builder.addCase(getDepartmentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      departmentsData: payload
    }))
    builder.addCase(getNumberSystemsAction.fulfilled, (state, { payload }) => ({
      ...state,
      numberSystemsData: payload
    }))
    builder.addCase(getDomainsAction.fulfilled, (state, { payload }) => ({
      ...state,
      domainsData: payload
    }))
    builder.addCase(getJobDepartmentsAction.fulfilled, (state, { payload }) => ({
      ...state,
      jobDepartmentsData: payload
    }))
    builder.addCase(getJobPostsAction.fulfilled, (state, { payload }) => ({
      ...state,
      jobPostsData: payload
    }))

    builder.addCase(getBugReportsAction.fulfilled, (state, { payload }) => ({
      ...state,
      bugReportsData: payload
    }))
    builder.addCase(getSubscribersAction.fulfilled, (state, { payload }) => ({
      ...state,
      rawApiSubscribers: payload
    }))
    builder.addCase(getHomeCategoryAction.fulfilled, (state, { payload }) => ({
      ...state,
      categoryData: payload
    }))
    builder.addCase(getRowDataAction.fulfilled, (state, { payload }) => ({
      ...state,
      rowData: payload
    }))
    builder.addCase(getAutoEmailsAction.fulfilled, (state, { payload }) => ({
      ...state,
      autoEmailsData: payload
    }))
    builder.addCase(getUsersAction.fulfilled, (state, { payload }) => ({
      ...state,
      usersData: payload
    }))
    builder.addCase(getEmailCampaignsAction.fulfilled, (state, { payload }) => ({
      ...state,
      emailCampaignsData: payload
    }))
    builder.addCase(getMailTemplatesAction.fulfilled, (state, { payload }) => ({
      ...state,
      mailTemplatesData: payload
    }))
    builder.addCase(getAutoEmailTemplatesAction.fulfilled, (state, { payload }) => ({
      ...state,
      autoEmailTemplatesData: payload
    }))
    builder.addCase(getEmailTemplatesAction.fulfilled, (state, { payload }) => ({
      ...state,
      emailTemplatesData: payload
    }))
    builder.addCase(getRequestFeedbacksAction.fulfilled, (state, { payload }) => ({
      ...state,
      requestFeedbacksData: payload
    }))
    builder.addCase(getSellerListingsAction.fulfilled, (state, { payload }) => ({
      ...state,
      sellerListings: payload
    }))
    builder.addCase(getBuyerListingsAction.fulfilled, (state, { payload }) => ({
      ...state,
      buyerListings: payload
    }))
    builder.addCase(getAutoMatchDataAction.fulfilled, (state, { payload }) => (

      {
        ...state,
        autoMatchData: payload
      }))
    builder.addCase(getAllProductAction.fulfilled, (state, { payload }) => (

      {
        ...state,
        productsMasterData: payload
      }))
    builder.addCase(getMembersAction.fulfilled, (state, { payload }) => (

      {
        ...state,
        memberData: payload
      }))
    builder.addCase(getInquiriesAction.fulfilled, (state, { payload }) => (

      {
        ...state,
        inquiryList1: payload
      }))

    builder.addCase(getSubcategoriesByCategoryIdAction.fulfilled, (state, { payload }) => (

      {
        ...state,
        subCategoriesForSelectedCategoryData: payload
      }))
    builder.addCase(getRolesAction.fulfilled, (state, { payload }) => (
      {
        ...state,
        Roles: payload
      }))


    builder.addCase(getCompanyAction.fulfilled, (state, { payload }) => ({
      ...state,
      CompanyData: payload
    }))
    builder.addCase(addcompanyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deletecompanyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editcompanyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))

    builder.addCase(deleteAllcompanyAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))


    builder.addCase(getMemberAction.fulfilled, (state, { payload }) => ({
      ...state,
      MemberData: payload
    }))
    builder.addCase(addMemberAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editMemberAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteMemberAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteAllMemberAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))

     builder.addCase(addInquiriesAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editInquiriesAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))

    builder.addCase(getpartnerAction.fulfilled, (state, { payload }) => ({
      ...state,
      partnerData: payload
    }))
    builder.addCase(addpartnerAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(editpartnerAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deletepartnerAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(deleteAllpartnerAction.fulfilled, (state, { payload }) => ({
      ...state,
    }))
    builder.addCase(getJobApplicationsAction.fulfilled, (state, { payload }) => ({
      ...state,
      jobApplicationsData: payload
    }))



    builder.addCase(getWallListingAction.fulfilled, (state, { payload }) => ({
      ...state,
      wallListing: payload
    }))
    builder.addCase(getFormBuilderAction.fulfilled, (state, { payload }) => ({
      ...state,
      formsData: payload
    }))
  },
})

export const masterSelector = (state: RootState) => state?.Master

export default masterSlice.reducer