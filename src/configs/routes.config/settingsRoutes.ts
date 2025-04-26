import { lazy } from 'react';
import { SETTINGS_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const settingsRoutes: Routes = [
    {
        key: 'settings.companyProfile',
        path: `${SETTINGS_PREFIX_PATH}/company-profile`,
        component: lazy(() => import('@/views/settings/Company-Profile')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'settings.globalSettings',
        path: `${SETTINGS_PREFIX_PATH}/global-settings`,
        component: lazy(() => import('@/views/settings/Global-Settings')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'settings.domainManagement',
        path: `${SETTINGS_PREFIX_PATH}/domain-management`,
        component: lazy(() => import('@/views/settings/Domain-Management')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'settings.cmsManagement',
        path: `${SETTINGS_PREFIX_PATH}/cms-management`,
        component: lazy(() => import('@/views/settings/Cms-Management')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'settings.rawData',
        path: `${SETTINGS_PREFIX_PATH}/raw-data`,
        component: lazy(() => import('@/views/settings/Raw-Data')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default settingsRoutes;