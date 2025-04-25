import { lazy } from 'react';
import { BUSINESS_ENTITIES_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const businessEntityRoute: Routes = [
    {
        key: 'businessEntities.company',
        path: `${BUSINESS_ENTITIES_PREFIX_PATH}/company`,
        component: lazy(() => import('@/views/business-entities/Company')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'businessEntities.member',
        path: `${BUSINESS_ENTITIES_PREFIX_PATH}/member`,
        component: lazy(() => import('@/views/business-entities/Member')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'businessEntities.partner',
        path: `${BUSINESS_ENTITIES_PREFIX_PATH}/partner`,
        component: lazy(() => import('@/views/business-entities/Partners')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'businessEntities.subscriber',
        path: `${BUSINESS_ENTITIES_PREFIX_PATH}/subscriber`,
        component: lazy(() => import('@/views/business-entities/Subscribers')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'businessEntities.requestFeedback',
        path: `${BUSINESS_ENTITIES_PREFIX_PATH}/request-feedback`,
        component: lazy(() => import('@/views/business-entities/RequestFeedback')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'businessEntities.allDocuments',
        path: `${BUSINESS_ENTITIES_PREFIX_PATH}/all-documents`,
        component: lazy(() => import('@/views/business-entities/All-Documents')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default businessEntityRoute;