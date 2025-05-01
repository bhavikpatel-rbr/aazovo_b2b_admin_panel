import { BUSINESS_ENTITIES_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const businessEntitiesNavigationConfig: NavigationTree[] = [
    {
        key: 'businessEntities',
        path: '',
        title: 'Business Entities',
        translateKey: 'nav.businessEntities',
        icon: 'dashboardAnalytic',
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
                key: 'businessEntities.company',
                path: `${BUSINESS_ENTITIES_PREFIX_PATH}/company`,
                title: 'Company',
                translateKey: 'nav.businessEntities.company',
                icon: 'company',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.businessEntities.companyDesc',
                        label: 'Manage company details',
                    },
                },
                subMenu: [],
            },
            {
                key: 'businessEntities.member',
                path: `${BUSINESS_ENTITIES_PREFIX_PATH}/member`,
                title: 'Member',
                translateKey: 'nav.businessEntities.member',
                icon: 'member',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.businessEntities.memberDesc',
                        label: 'Manage members',
                    },
                },
                subMenu: [],
            },
            {
                key: 'businessEntities.partner',
                path: `${BUSINESS_ENTITIES_PREFIX_PATH}/partner`,
                title: 'Partner',
                translateKey: 'nav.businessEntities.partner',
                icon: 'partner',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.businessEntities.partnerDesc',
                        label: 'Manage partners',
                    },
                },
                subMenu: [],
            },
            {
                key: 'businessEntities.partner',
                path: `${BUSINESS_ENTITIES_PREFIX_PATH}/partner`,
                title: 'Inquiries',
                translateKey: 'nav.businessEntities.partner',
                icon: 'partner',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.businessEntities.partnerDesc',
                        label: 'Manage Inquiries',
                    },
                },
                subMenu: [],
            },
            {
                key: 'businessEntities.allDocuments',
                path: `${BUSINESS_ENTITIES_PREFIX_PATH}/all-documents`,
                title: 'All Documents',
                translateKey: 'nav.businessEntities.allDocuments',
                icon: 'allDocuments',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.businessEntities.allDocumentsDesc',
                        label: 'Access all documents',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default businessEntitiesNavigationConfig;