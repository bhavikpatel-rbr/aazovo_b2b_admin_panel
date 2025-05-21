import { lazy } from 'react';
import { EMAIL_MESSAGES_ROUTE } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const emailMessagesRoute: Routes = [
    {
        key: 'emailMessages.emailTemplates',
        path: `${EMAIL_MESSAGES_ROUTE}/email-templates`,
        component: lazy(() => import('@/views/email-messages/Email-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },

    {
        key: 'emailMessages.autoEmailTemplates',
        path: `${EMAIL_MESSAGES_ROUTE}/auto-email-templates`,
        component: lazy(() => import('@/views/email-messages/Auto-Email-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'emailMessages.autoMessagesTemplates',
        path: `${EMAIL_MESSAGES_ROUTE}/auto-messages-templates`,
        component: lazy(() => import('@/views/email-messages/Auto-Messages-Templates')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'emailMessages.autoEmail',
        path: `${EMAIL_MESSAGES_ROUTE}/auto-email`,
        component: lazy(() => import('@/views/email-messages/Auto-Email')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'emailMessages.autoMessages',
        path: `${EMAIL_MESSAGES_ROUTE}/auto-messages`,
        component: lazy(() => import('@/views/email-messages/Auto-Messages')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'emailMessages.emailCampaign',
        path: `${EMAIL_MESSAGES_ROUTE}/email-campaign`,
        component: lazy(() => import('@/views/email-messages/Email-Campaign')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'emailMessages.messagesSender',
        path: `${EMAIL_MESSAGES_ROUTE}/messages-sender`,
        component: lazy(() => import('@/views/email-messages/MessagesSender')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default emailMessagesRoute;