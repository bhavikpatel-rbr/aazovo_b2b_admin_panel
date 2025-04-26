import { ACCESS_CONTROL_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const accessControlNavigationConfig: NavigationTree[] = [
    {
        key: 'accessControl',
        path: '',
        title: 'Access Control',
        translateKey: 'nav.accessControl',
        icon: 'authentication',
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
                key: 'accessControl.user',
                path: `${ACCESS_CONTROL_PREFIX_PATH}/user`,
                title: 'User',
                translateKey: 'nav.accessControl.user',
                icon: 'user',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.accessControl.userDesc',
                        label: 'Manage users',
                    },
                },
                subMenu: [],
            },
            {
                key: 'accessControl.roles',
                path: `${ACCESS_CONTROL_PREFIX_PATH}/roles`,
                title: 'Roles',
                translateKey: 'nav.accessControl.roles',
                icon: 'roles',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.accessControl.rolesDesc',
                        label: 'Manage roles',
                    },
                },
                subMenu: [],
            },
            {
                key: 'accessControl.permission',
                path: `${ACCESS_CONTROL_PREFIX_PATH}/permission`,
                title: 'Permission',
                translateKey: 'nav.accessControl.permission',
                icon: 'permission',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.accessControl.permissionDesc',
                        label: 'Manage permissions',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default accessControlNavigationConfig;