import { lazy } from 'react';
import { DOCUMENT_MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const documentMasterRoutes: Routes = [
    {
        key: 'settings.cmsManagement',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/cms-management`,
        component: lazy(() => import('@/views/settings/Cms-Management')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.homeCategoryImage',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/home-category-image`,
        component: lazy(() => import('@/views/master/Home-Category-Image')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.trendingImage',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/trending-image`,
        component: lazy(() => import('@/views/master/Trending-Image')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.trendingCarousel',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/trending-carousel`,
        component: lazy(() => import('@/views/master/Trending-Carousel')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'master.sliders',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/sliders`,
        component: lazy(() => import('@/views/master/Sliders')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.blog',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/blog`,
        component: lazy(() => import('@/views/marketing/blogs')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default documentMasterRoutes;