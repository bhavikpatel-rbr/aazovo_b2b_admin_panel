import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_LOGOUT,
} from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const othersNavigationConfig: NavigationTree[] = [
    {
        key: 'others',
        path: '',
        title: 'Others',
        translateKey: 'nav.others.others',
        icon: 'others',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [ADMIN, USER],
        subMenu: [
            {
                key: 'others.exportMapping',
                path: `/export-mapping`,
                title: 'Export Mapping',
                translateKey: 'nav.others.exportMapping',
                icon: 'locationPin',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.others.exportMappingDesc',
                        label: 'Manage export mappings',
                    },
                },
                subMenu: [],
            },
            {
                key: 'others.logout',
                path: `/logout`,
                title: 'Logout',
                translateKey: 'nav.others.logout',
                icon: 'logout',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.others.logoutDesc',
                        label: 'Logout from the system',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default othersNavigationConfig;