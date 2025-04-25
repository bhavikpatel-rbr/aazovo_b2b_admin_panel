import { SYSTEM_SETTINGS_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const systemSettingsNavigationConfig: NavigationTree[] = [
    {
        key: 'systemTools',
        path: '',
        title: 'System Tools',
        translateKey: 'nav.systemTools',
        icon: 'systemTools',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [ADMIN], // Restricted to ADMIN
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 2,
            },
        },
        subMenu: [
            {
                key: 'systemTools.bugReport',
                path: `${SYSTEM_SETTINGS_PREFIX_PATH}/bug-report`,
                title: 'Bug Report',
                translateKey: 'nav.systemTools.bugReport',
                icon: 'bugReport',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.systemTools.bugReportDesc',
                        label: 'Report and manage bugs',
                    },
                },
                subMenu: [],
            },
            {
                key: 'systemTools.changeLog',
                path: `${SYSTEM_SETTINGS_PREFIX_PATH}/change-log`,
                title: 'Change Log',
                translateKey: 'nav.systemTools.changeLog',
                icon: 'changeLog',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.systemTools.changeLogDesc',
                        label: 'View system change logs',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default systemSettingsNavigationConfig;