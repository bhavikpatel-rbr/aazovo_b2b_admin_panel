import { lazy } from 'react';
import { SYSTEM_TOOLS_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const systemToolsRoutes: Routes = [
    {
        key: 'systemTools.rawData',
        path: `${SYSTEM_TOOLS_PREFIX_PATH}/raw-data`,
        component: lazy(() => import('@/views/system-tools/Raw-Data')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'systemTools.formBuilder',
        path: `${SYSTEM_TOOLS_PREFIX_PATH}/form-builder`,
        component: lazy(() => import('@/views/system-tools/Form-Builder')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'systemTools.bugReport',
        path: `${SYSTEM_TOOLS_PREFIX_PATH}/bug-report`,
        component: lazy(() => import('@/views/system-tools/Bug-Report')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'systemTools.changeLog',
        path: `${SYSTEM_TOOLS_PREFIX_PATH}/change-log`,
        component: lazy(() => import('@/views/system-tools/Change-Log')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default systemToolsRoutes;