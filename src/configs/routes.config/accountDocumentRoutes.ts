import { lazy } from "react";
import { ACCOUNT_DOCUMENT_ROUTE } from "@/constants/route.constant";
import { ADMIN, USER } from "@/constants/roles.constant";
import type { Routes } from "@/@types/routes";

const accountDocumentRoutes: Routes = [
  {
    key: "accountDocuments",
    path: `/account-document`,
    component: lazy(() => import("@/views/Account-Documents")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
  {
    key: "accountDocuments",
    path: `/fill-up-form`,
    component: lazy(() => import("@/views/Account-Documents/components/LogisticFrom")),
    authority: [ADMIN, USER],
    meta: {
      pageContainerType: "contained",
    },
  },
];

export default accountDocumentRoutes;
