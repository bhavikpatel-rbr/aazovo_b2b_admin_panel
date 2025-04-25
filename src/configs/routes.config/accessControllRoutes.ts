import { lazy } from 'react';
import { ACCESS_CONTROL_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const accessControllRoute: Routes = [
    {
        key: 'accessControl.user',
        path: `${ACCESS_CONTROL_PREFIX_PATH}/user`,
        component: lazy(() => import('@/views/access-controll/User')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'accessControl.roles',
        path: `${ACCESS_CONTROL_PREFIX_PATH}/roles`,
        component: lazy(() => import('@/views/access-controll/Roles')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'accessControl.permission',
        path: `${ACCESS_CONTROL_PREFIX_PATH}/permission`,
        component: lazy(() => import('@/views/access-controll/Permissions')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default accessControllRoute;