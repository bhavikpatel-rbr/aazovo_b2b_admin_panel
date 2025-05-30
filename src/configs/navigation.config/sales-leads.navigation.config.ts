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
                key: 'salesLeads.wallListing',
                path: `${SALES_LEADS_PREFIX_PATH}/wall-listing`,
                title: 'Wall Listing',
                translateKey: 'nav.salesLeads.wallListing',
                icon: 'wallListing',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.salesLeads.wallListingDesc',
                        label: 'Manage wall listings',
                    },
                },
                subMenu: [],
            },
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
                key: 'salesLeads.lead',
                path: `${SALES_LEADS_PREFIX_PATH}/lead`,
                title: 'Leads',
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
            // {
            //     key: 'salesLeads.accountDocuments',
            //     path: `${SALES_LEADS_PREFIX_PATH}/account-documents`,
            //     title: 'Account Document',
            //     translateKey: 'nav.salesLeads.accountDocuments',
            //     icon: 'lead',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN, USER],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.salesLeads.accountDocuments',
            //             label: 'Manage Account Document',
            //         },
            //     },
            //     subMenu: [],
            // },
        ],
    },
];

export default salesLeadsNavigationConfig;