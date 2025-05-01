import { MARKETING_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const marketingNavigationConfig: NavigationTree[] = [
    {
        key: 'marketing',
        path: '',
        title: 'Email & Messages',
        translateKey: 'nav.marketing',
        icon: 'dashboardMarketing',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 3,
            },
        },
        subMenu: [
            // {
            //     key: 'marketing.subscriber',
            //     path: `${MARKETING_PREFIX_PATH}/subscriber`,
            //     title: 'Subscriber',
            //     translateKey: 'nav.marketing.subscriber',
            //     icon: 'subscriber',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.marketing.subscriberDesc',
            //             label: 'Manage subscribers',
            //         },
            //     },
            //     subMenu: [],
            // },
            // {
            //     key: 'marketing.requestFeedback',
            //     path: `${MARKETING_PREFIX_PATH}/request-feedback`,
            //     title: 'Request & Feedback',
            //     translateKey: 'nav.marketing.requestFeedback',
            //     icon: 'requestFeedback',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.marketing.requestFeedbackDesc',
            //             label: 'Handle requests and feedback',
            //         },
            //     },
            //     subMenu: [],
            // },
            {
                key: 'marketing.autoEmail',
                path: `${MARKETING_PREFIX_PATH}/auto-email`,
                title: 'Auto Send Email',
                translateKey: 'nav.marketing.autoEmail',
                icon: 'autoEmail',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.autoEmailDesc',
                        label: 'Manage automated emails',
                    },
                },
                subMenu: [],
            },
            {
                key: 'marketing.autoMessages',
                path: `${MARKETING_PREFIX_PATH}/auto-messages`,
                title: 'Auto Send Messages',
                translateKey: 'nav.marketing.autoMessages',
                icon: 'autoMessages',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.autoMessagesDesc',
                        label: 'Manage automated messages',
                    },
                },
                subMenu: [],
            },
            {
                key: 'marketing.emailCampaign',
                path: `${MARKETING_PREFIX_PATH}/email-campaign`,
                title: 'Email Campaign',
                translateKey: 'nav.marketing.emailCampaign',
                icon: 'emailCampaign',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.emailCampaignDesc',
                        label: 'Manage email campaigns',
                    },
                },
                subMenu: [],
            },
            
            {
                key: 'marketing.messagesSender',
                path: `${MARKETING_PREFIX_PATH}/messages-sender`,
                title: 'Messages Sender',
                translateKey: 'nav.marketing.messagesSender',
                icon: 'messagesSender',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.messagesSenderDesc',
                        label: 'Manage message senders',
                    },
                },
                subMenu: [],
            },
            {
                key: 'marketing.emailTemplates',
                path: `${MARKETING_PREFIX_PATH}/email-templates`,
                title: 'Email Templates',
                translateKey: 'nav.marketing.emailTemplates',
                icon: 'emailTemplates',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.emailTemplatesDesc',
                        label: 'Manage email templates',
                    },
                },
                subMenu: [],
            },
            {
                key: 'marketing.messagesTemplates',
                path: `${MARKETING_PREFIX_PATH}/messages-templates`,
                title: 'Messages Templates',
                translateKey: 'nav.marketing.messagesTemplates',
                icon: 'messagesTemplates',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.messagesTemplatesDesc',
                        label: 'Manage message templates',
                    },
                },
                subMenu: [],
            },
            {
                key: 'marketing.autoEmailTemplates',
                path: `${MARKETING_PREFIX_PATH}/auto-email-templates`,
                title: 'Auto Email Templates',
                translateKey: 'nav.marketing.autoEmailTemplates',
                icon: 'autoEmailTemplates',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.autoEmailTemplatesDesc',
                        label: 'Manage automated email templates',
                    },
                },
                subMenu: [],
            },
            {
                key: 'marketing.autoMessagesTemplates',
                path: `${MARKETING_PREFIX_PATH}/auto-messages-templates`,
                title: 'Auto Messages Templates',
                translateKey: 'nav.marketing.autoMessagesTemplates',
                icon: 'autoMessagesTemplates',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.autoMessagesTemplatesDesc',
                        label: 'Manage automated message templates',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default marketingNavigationConfig;