import { lazy } from 'react';
import { MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const masterRoutes: Routes = [
    {
        key: 'master.PageType',
        path: `${MASTER_PREFIX_PATH}/pagetype-type`,
        component: lazy(() => import('@/views/master/PageType')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.documentType',
        path: `${MASTER_PREFIX_PATH}/document-type`,
        component: lazy(() => import('@/views/master/Document-Type')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.memberType',
        path: `${MASTER_PREFIX_PATH}/member-type`,
        component: lazy(() => import('@/views/master/MemberType')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.documents',
        path: `${MASTER_PREFIX_PATH}/documents`,
        component: lazy(() => import('@/views/master/Documents-List')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.units',
        path: `${MASTER_PREFIX_PATH}/units`,
        component: lazy(() => import('@/views/master/Units')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.currency',
        path: `${MASTER_PREFIX_PATH}/currency`,
        component: lazy(() => import('@/views/master/Currency')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.continents',
        path: `${MASTER_PREFIX_PATH}/continents`,
        component: lazy(() => import('@/views/master/Continents')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.countries',
        path: `${MASTER_PREFIX_PATH}/countries`,
        component: lazy(() => import('@/views/master/Countries')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.priceList',
        path: `${MASTER_PREFIX_PATH}/price-list`,
        component: lazy(() => import('@/views/master/Price-List')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.paymentTerms',
        path: `${MASTER_PREFIX_PATH}/payment-terms`,
        component: lazy(() => import('@/views/master/Payment-Terms')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.productSpec',
        path: `${MASTER_PREFIX_PATH}/product-spec`,
        component: lazy(() => import('@/views/master/Product-Specification')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default masterRoutes;