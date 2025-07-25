import { lazy } from 'react'
import { DASHBOARDS_PREFIX_PATH } from '@/constants/route.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

const dashboardsRoute: Routes = [
     {
        key: 'dashboard.analytics',
        path: `${DASHBOARDS_PREFIX_PATH}/dashboard-analytics`,
        // H:\aazovo_b2b_admin_panel\src\views\dashboards\DynemicData\DynemicDashboard.tsx
        component: lazy(() => import('@/views/dashboards/DashboardGraph/DashboardGraph')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'dashboard.ecommerce',
        path: `${DASHBOARDS_PREFIX_PATH}/ecommerce`,
        component: lazy(() => import('@/views/dashboards/EcommerceDashboard')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'dashboard.main',
        path: `${DASHBOARDS_PREFIX_PATH}/main`,
        component: lazy(() => import('@/views/dashboards/Main')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'dashboard.active',
        path: `${DASHBOARDS_PREFIX_PATH}/active`,
        component: lazy(() => import('@/views/dashboards/Trending')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'dashboard.Trending',
        path: `${DASHBOARDS_PREFIX_PATH}/Trending`,
        // H:\aazovo_b2b_admin_panel\src\views\dashboards\DynemicData\DynemicDashboard.tsx
        component: lazy(() => import('@/views/dashboards/DynemicData/DynemicDashboard')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
   
]

export default dashboardsRoute
