import { lazy } from 'react';
import { PRODUCT_MANAGEMENT_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const productManagementRoute: Routes = [
    {
        key: 'productManagement.categories',
        path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/categories`,
        component: lazy(() => import('@/views/product-management/Categories')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'productManagement.brands',
        path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/brands`,
        component: lazy(() => import('@/views/product-management/Brands')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'productManagement.products',
        path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/products`,
        component: lazy(() => import('@/views/product-management/Products')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'productManagement.wallListing',
        path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/wall-listing`,
        component: lazy(() => import('@/views/product-management/Wall-Listing')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default productManagementRoute;