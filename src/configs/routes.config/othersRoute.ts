import { lazy } from 'react'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

const othersRoute: Routes = [
    {
        key: 'others.exportMapping',
        path: `/export-mapping`,
        component: lazy(() => import('@/views/others/Export-Mapping')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    // {
    //     key: 'logout',
    //     path: `logout`,
    //     component: lazy(() => import('@/views/other/Logout')),
    //     authority: [ADMIN, USER],
    //     meta: {
    //         pageContainerType: 'contained',
    //     },
    // },
    {
        key: 'notifications',
        path: `/notifiactions`,
        component: lazy(() => import('@/views/others/Notification/Notifications')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
]

export default othersRoute
