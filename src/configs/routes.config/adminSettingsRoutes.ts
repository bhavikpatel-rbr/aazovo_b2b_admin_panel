import { lazy } from 'react';
import { ADMIN_SETTINGS_ROUTE } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const adminSettingsRoutes: Routes = [
    {
        key: 'adminSettings.companyProfile',
        path: `${ADMIN_SETTINGS_ROUTE}/company-profile`,
        component: lazy(() => import('@/views/admin-settings/Company-Profile')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'adminSettings.adminSlobalSettings',
        path: `${ADMIN_SETTINGS_ROUTE}/global-adminSettings`,
        component: lazy(() => import('@/views/admin-settings/Global-Settings')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'adminSettings.domainManagement',
        path: `${ADMIN_SETTINGS_ROUTE}/domain-management`,
        component: lazy(() => import('@/views/admin-settings/Domain-Management')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'adminSettings.numberSystem',
        path: `${ADMIN_SETTINGS_ROUTE}/number-system`,
        component: lazy(() => import('@/views/admin-settings/Number-System')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default adminSettingsRoutes;