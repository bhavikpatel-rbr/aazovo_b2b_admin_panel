import { ADMIN_SETTINGS_ROUTE } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const adminSettingsNavigationConfig: NavigationTree[] = [
    {
        key: 'adminSettings',
        path: '',
        title: 'Admin Settings',
        translateKey: 'nav.adminSettings',
        icon: 'accountSettings',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [ADMIN], // Restricted to ADMIN
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 3,
            },
        },
        subMenu: [
            {
                key: 'adminSettings.companyProfile',
                path: `${ADMIN_SETTINGS_ROUTE}/company-profile`,
                title: 'Company Profile',
                translateKey: 'nav.adminSettings.companyProfile',
                icon: 'companyProfile',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.adminSettings.companyProfileDesc',
                        label: 'Manage company profile',
                    },
                },
                subMenu: [],
            },
            // {
            //     key: 'adminSettings.adminSlobalSettings',
            //     path: `${ADMIN_SETTINGS_ROUTE}/global-adminSettings`,
            //     title: 'Global Admin Settings',
            //     translateKey: 'nav.adminSettings.adminSlobalSettings',
            //     icon: 'adminSlobalSettings',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.adminSettings.adminSlobalSettingsDesc',
            //             label: 'Manage global Admin Settings',
            //         },
            //     },
            //     subMenu: [],
            // },
            {
                key: 'adminSettings.domainManagement',
                path: `${ADMIN_SETTINGS_ROUTE}/domain-management`,
                title: 'Domain Management',
                translateKey: 'nav.adminSettings.domainManagement',
                icon: 'domainManagement',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.adminSettings.domainManagementDesc',
                        label: 'Manage domains',
                    },
                },
                subMenu: [],
            },
            {
                key: 'adminSettings.numberSystem',
                path: `${ADMIN_SETTINGS_ROUTE}/number-system`,
                title: 'Number System',
                translateKey: 'nav.adminSettings.numberSystem',
                icon: 'numberSystem',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.adminSettings.numberSystemDesc',
                        label: 'Manage number systems',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default adminSettingsNavigationConfig;