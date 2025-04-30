import { lazy } from 'react';
import { SALES_LEADS_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const salesLeadsRoute: Routes = [
    {
        key: 'productManagement.wallListing',
        path: `${SALES_LEADS_PREFIX_PATH}/wall-listing`,
        component: lazy(() => import('@/views/product-management/Wall-Listing')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'salesLeads.opportunities',
        path: `${SALES_LEADS_PREFIX_PATH}/opportunities`,
        component: lazy(() => import('@/views/sales-Leads/Opportunities')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'salesLeads.lead',
        path: `${SALES_LEADS_PREFIX_PATH}/lead`,
        component: lazy(() => import('@/views/sales-Leads/Lead')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'salesLeads.offersDemands',
        path: `${SALES_LEADS_PREFIX_PATH}/offers-demands`,
        component: lazy(() => import('@/views/sales-Leads/Offers-Demands')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'salesLeads.inquiries',
        path: `${SALES_LEADS_PREFIX_PATH}/inquiries`,
        component: lazy(() => import('@/views/sales-Leads/Inquiries')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default salesLeadsRoute;