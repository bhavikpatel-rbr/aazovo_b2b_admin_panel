import { lazy } from "react";
import { SALES_LEADS_PREFIX_PATH } from "@/constants/route.constant";
import { ADMIN, USER } from "@/constants/roles.constant";
import type { Routes } from "@/@types/routes";

const salesLeadsRoute: Routes = [
  {
    key: "salesLeads.wallListing",
    path: `${SALES_LEADS_PREFIX_PATH}/wall-listing`,
    component: lazy(() => import("@/views/sales-Leads/Wall-Listing")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.wallListing",
    path: `${SALES_LEADS_PREFIX_PATH}/wall-item/add`,
    component: lazy(
      () => import("@/views/sales-Leads/Wall-Listing/Components/CreateWall")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.wallListing",
    path: `${SALES_LEADS_PREFIX_PATH}/wall-item/edit/:id`,
    component: lazy(
      () => import("@/views/sales-Leads/Wall-Listing/Components/EditWall")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.opportunities",
    path: `${SALES_LEADS_PREFIX_PATH}/opportunities`,
    component: lazy(() => import("@/views/sales-Leads/Opportunities")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.opportunities",
    path: `${SALES_LEADS_PREFIX_PATH}/seller/create`,
    component: lazy(
      () =>
        import("@/views/sales-Leads/Opportunities/SellerCreate/CreateSeller")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.opportunities",
    path: `${SALES_LEADS_PREFIX_PATH}/buyer/create`,
    component: lazy(
      () => import("@/views/sales-Leads/Opportunities/BuyerCreate/CreateBuyer")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.lead",
    path: `${SALES_LEADS_PREFIX_PATH}/lead/edit/:id`,
    component: lazy(() => import("@/views/sales-Leads/Lead/components/EditLeadPage")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
    {
    key: "salesLeads.lead",
    path: `${SALES_LEADS_PREFIX_PATH}/lead`,
    component: lazy(() => import("@/views/sales-Leads/Lead")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.offersDemands",
    path: `${SALES_LEADS_PREFIX_PATH}/offers-demands`,
    component: lazy(() => import("@/views/sales-Leads/Offers-Demands")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.offersDemands",
    path: `${SALES_LEADS_PREFIX_PATH}/offers/create`,
    component: lazy(
      () => import("@/views/sales-Leads/Offers-Demands/OfferCreate/CreateOffer")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "salesLeads.offersDemands",
    path: `${SALES_LEADS_PREFIX_PATH}/offers/edit/:id`,
    component: lazy(
      () => import("@/views/sales-Leads/Offers-Demands/OfferCreate/EditOffer")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
{
  key: "salesLeads.offersDemands",
  path: `${SALES_LEADS_PREFIX_PATH}/demands/create`,
  component: lazy(
    () =>
      import("@/views/sales-Leads/Offers-Demands/DemandCreate/CreateDemand")
  ),
  authority: [ADMIN, USER],
  meta: {
    pageContainerType: "contained",
  },
},
  {
    key: "salesLeads.offersDemands",
    path: `${SALES_LEADS_PREFIX_PATH}/demands/edit/:id`,
    component: lazy(
      () => import("@/views/sales-Leads/Offers-Demands/DemandCreate/EditDemand")
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
{
    key: 'salesLeads.lead', // Distinct key
    path: `${SALES_LEADS_PREFIX_PATH}/lead/add`,
    component: lazy(
      () =>
        import('@/views/sales-leads/Lead/components/AddLeadPage') // LAZY LOAD THE WRAPPER
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: 'contained', // This meta is for your routing/layout system
    },
  },
  {
    key: 'salesLeads.leadEdit', // Distinct key for edit route
    path: `${SALES_LEADS_PREFIX_PATH}/lead/edit/:id`, // :id is a route parameter
    component: lazy(
      () =>
        import('@/views/sales-leads/Lead/components/EditLeadPage') // LAZY LOAD THE SAME WRAPPER
    ),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: 'contained',
    },
  },
];

export default salesLeadsRoute;
