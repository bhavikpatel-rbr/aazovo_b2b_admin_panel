import { SETTINGS_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const settingsNavigationConfig: NavigationTree[] = [
    {
        key: 'settings',
        path: '',
        title: 'Admin Settings',
        translateKey: 'nav.settings',
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
                key: 'settings.companyProfile',
                path: `${SETTINGS_PREFIX_PATH}/company-profile`,
                title: 'Company Profile',
                translateKey: 'nav.settings.companyProfile',
                icon: 'companyProfile',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.settings.companyProfileDesc',
                        label: 'Manage company profile',
                    },
                },
                subMenu: [],
            },
            {
                key: 'settings.globalSettings',
                path: `${SETTINGS_PREFIX_PATH}/global-settings`,
                title: 'Global Settings',
                translateKey: 'nav.settings.globalSettings',
                icon: 'globalSettings',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.settings.globalSettingsDesc',
                        label: 'Manage global settings',
                    },
                },
                subMenu: [],
            },
            {
                key: 'settings.domainManagement',
                path: `${SETTINGS_PREFIX_PATH}/domain-management`,
                title: 'Domain Management',
                translateKey: 'nav.settings.domainManagement',
                icon: 'domainManagement',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.settings.domainManagementDesc',
                        label: 'Manage domains',
                    },
                },
                subMenu: [],
            },
            {
                key: 'settings.numberSystem',
                path: `${SETTINGS_PREFIX_PATH}/number-system`,
                title: 'Number System',
                translateKey: 'nav.settings.numberSystem',
                icon: 'numberSystem',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.settings.numberSystemDesc',
                        label: 'Manage number systems',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default settingsNavigationConfig;