import { EMAIL_MESSAGES_ROUTE } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const emailMessagesNavigationConfig: NavigationTree[] = [
    {
        key: 'emailMessages',
        path: '',
        title: 'Email & Messages',
        translateKey: 'nav.emailMessages',
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
            {
                key: 'emailMessages.autoEmail',
                path: `${EMAIL_MESSAGES_ROUTE}/auto-email`,
                title: 'Automation Email',
                translateKey: 'nav.emailMessages.autoEmail',
                icon: 'autoEmail',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.emailMessages.autoEmailDesc',
                        label: 'Manage automated emails',
                    },
                },
                subMenu: [],
            },
            
            {
                key: 'emailMessages.emailCampaign',
                path: `${EMAIL_MESSAGES_ROUTE}/email-campaign`,
                title: 'Email Campaign',
                translateKey: 'nav.emailMessages.emailCampaign',
                icon: 'emailCampaign',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.emailMessages.emailCampaignDesc',
                        label: 'Manage email campaigns',
                    },
                },
                subMenu: [],
            },
            {
                key: 'emailMessages.autoEmailTemplates',
                path: `${EMAIL_MESSAGES_ROUTE}/auto-email-templates`,
                title: 'Auto Email Templates',
                translateKey: 'nav.emailMessages.autoEmailTemplates',
                icon: 'autoEmailTemplates',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.emailMessages.autoEmailTemplatesDesc',
                        label: 'Manage automated email templates',
                    },
                },
                subMenu: [],
            },
            {
                key: 'emailMessages.emailTemplates',
                path: `${EMAIL_MESSAGES_ROUTE}/email-templates`,
                title: 'Email Templates',
                translateKey: 'nav.emailMessages.emailTemplates',
                icon: 'emailTemplates',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.emailMessages.emailTemplatesDesc',
                        label: 'Manage email templates',
                    },
                },
                subMenu: [],
            },
            {
                key: 'emailMessages.autoMessages',
                path: `${EMAIL_MESSAGES_ROUTE}/auto-messages`,
                title: 'Auto Send Messages',
                translateKey: 'nav.emailMessages.autoMessages',
                icon: 'autoMessages',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.emailMessages.autoMessagesDesc',
                        label: 'Manage automated messages',
                    },
                },
                subMenu: [],
            },
            {
                key: 'emailMessages.messagesSender',
                path: `${EMAIL_MESSAGES_ROUTE}/messages-sender`,
                title: 'Messages Sender',
                translateKey: 'nav.emailMessages.messagesSender',
                icon: 'messagesSender',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.emailMessages.messagesSenderDesc',
                        label: 'Manage message senders',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default emailMessagesNavigationConfig;