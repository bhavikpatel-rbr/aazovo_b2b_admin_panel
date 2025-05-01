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
        key: 'settings.numberSystem',
        path: `${SETTINGS_PREFIX_PATH}/number-system`,
        component: lazy(() => import('@/views/document-master/Number-System')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default settingsRoutes;