import { lazy } from 'react';
import { WEB_SETTINGS_ROUTE } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const webSettingsRoutes: Routes = [
    {
        key: 'webSettings.cmsManagement',
        path: `${WEB_SETTINGS_ROUTE}/cms-management`,
        component: lazy(() => import('@/views/web-settings/Cms-Management')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'webSettings.homeCategoryImage',
        path: `${WEB_SETTINGS_ROUTE}/home-category-image`,
        component: lazy(() => import('@/views/web-settings/Home-Category-Image')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'webSettings.trendingImage',
        path: `${WEB_SETTINGS_ROUTE}/trending-image`,
        component: lazy(() => import('@/views/web-settings/Trending-Image')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'webSettings.trendingCarousel',
        path: `${WEB_SETTINGS_ROUTE}/trending-carousel`,
        component: lazy(() => import('@/views/web-settings/Trending-Carousel')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'webSettings.sliders',
        path: `${WEB_SETTINGS_ROUTE}/sliders`,
        component: lazy(() => import('@/views/web-settings/Sliders')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'webSettings.blog',
        path: `${WEB_SETTINGS_ROUTE}/blog`,
        component: lazy(() => import('@/views/web-settings/Blogs')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },

];

export default webSettingsRoutes;
