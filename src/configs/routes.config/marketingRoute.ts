import { lazy } from 'react';
import { MARKETING_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const marketingRoute: Routes = [
    {
        key: 'marketing.blog',
        path: `${MARKETING_PREFIX_PATH}/blog`,
        component: lazy(() => import('@/views/marketing/Blogs')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.emailTemplates',
        path: `${MARKETING_PREFIX_PATH}/email-templates`,
        component: lazy(() => import('@/views/marketing/Email-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.messagesTemplates',
        path: `${MARKETING_PREFIX_PATH}/messages-templates`,
        component: lazy(() => import('@/views/marketing/Message-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.autoEmailTemplates',
        path: `${MARKETING_PREFIX_PATH}/auto-email-templates`,
        component: lazy(() => import('@/views/marketing/Auto-Email-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.autoMessagesTemplates',
        path: `${MARKETING_PREFIX_PATH}/auto-messages-templates`,
        component: lazy(() => import('@/views/marketing/Auto-Messages-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.autoEmail',
        path: `${MARKETING_PREFIX_PATH}/auto-email`,
        component: lazy(() => import('@/views/marketing/Auto-Email')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.autoMessages',
        path: `${MARKETING_PREFIX_PATH}/auto-messages`,
        component: lazy(() => import('@/views/marketing/Auto-Messages')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.emailCampaign',
        path: `${MARKETING_PREFIX_PATH}/email-campaign`,
        component: lazy(() => import('@/views/marketing/Email-Campaign')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'marketing.messagesSender',
        path: `${MARKETING_PREFIX_PATH}/messages-sender`,
        component: lazy(() => import('@/views/marketing/MessagesSender')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default marketingRoute;