import { lazy } from 'react';
import { USER_ENGAGEMENT_ROUTE } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const userEngagementRoute: Routes = [
    {
        key: 'userengagement.subscriber',
        path: `${USER_ENGAGEMENT_ROUTE}/subscriber`,
        component: lazy(() => import('@/views/user-engagement/Subscribers')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'userengagement.requestFeedback',
        path: `${USER_ENGAGEMENT_ROUTE}/request-feedback`,
        component: lazy(() => import('@/views/user-engagement/RequestFeedback')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default userEngagementRoute;