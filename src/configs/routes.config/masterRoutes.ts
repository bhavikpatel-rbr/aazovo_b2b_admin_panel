import { lazy } from 'react';
import { MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const masterRoutes: Routes = [
    {
        key: 'master.formBuilder',
        path: `${MASTER_PREFIX_PATH}/form-builder`,
        component: lazy(() => import('@/views/master/Form-Builder')),
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
        key: 'master.homeCategoryImage',
        path: `${MASTER_PREFIX_PATH}/home-category-image`,
        component: lazy(() => import('@/views/master/Home-Category-Image')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.trendingImage',
        path: `${MASTER_PREFIX_PATH}/trending-image`,
        component: lazy(() => import('@/views/master/Trending-Image')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.sliders',
        path: `${MASTER_PREFIX_PATH}/sliders`,
        component: lazy(() => import('@/views/master/Sliders')),
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
];

export default masterRoutes;