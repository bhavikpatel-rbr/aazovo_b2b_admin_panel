import { SALES_LEADS_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const salesLeadsNavigationConfig: NavigationTree[] = [
    {
        key: 'salesLeads',
        path: '',
        title: 'Sales & Leads',
        translateKey: 'nav.salesLeads',
        icon: 'accountPricing',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 2,
            },
        },
        subMenu: [
            {
                key: 'salesLeads.opportunities',
                path: `${SALES_LEADS_PREFIX_PATH}/opportunities`,
                title: 'Opportunities',
                translateKey: 'nav.salesLeads.opportunities',
                icon: 'opportunities',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.salesLeads.opportunitiesDesc',
                        label: 'Manage sales opportunities',
                    },
                },
                subMenu: [],
            },
            {
                key: 'salesLeads.lead',
                path: `${SALES_LEADS_PREFIX_PATH}/lead`,
                title: 'Lead',
                translateKey: 'nav.salesLeads.lead',
                icon: 'lead',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.salesLeads.leadDesc',
                        label: 'Manage leads',
                    },
                },
                subMenu: [],
            },
            {
                key: 'salesLeads.offersDemands',
                path: `${SALES_LEADS_PREFIX_PATH}/offers-demands`,
                title: 'Offers & Demands',
                translateKey: 'nav.salesLeads.offersDemands',
                icon: 'offersDemands',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.salesLeads.offersDemandsDesc',
                        label: 'Manage offers and demands',
                    },
                },
                subMenu: [],
            },
            {
                key: 'salesLeads.inquiries',
                path: `${SALES_LEADS_PREFIX_PATH}/inquiries`,
                title: 'Inquiries',
                translateKey: 'nav.salesLeads.inquiries',
                icon: 'inquiries',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.salesLeads.inquiriesDesc',
                        label: 'Manage inquiries',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default salesLeadsNavigationConfig;