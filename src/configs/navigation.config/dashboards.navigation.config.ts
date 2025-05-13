import { DASHBOARDS_PREFIX_PATH } from '@/constants/route.constant'
import { NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_COLLAPSE
 } from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const dashboardsNavigationConfig: NavigationTree[] = [
    {
        key: 'dashboard',
        path: '',
        title: 'Dashboard',
        translateKey: '',
        icon: 'ai',
        type: NAV_ITEM_TYPE_COLLAPSE, // Changed from NAV_ITEM_TYPE_TITLE to NAV_ITEM_TYPE_COLLAPSE
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 2,
            },
        },
        subMenu: [
            {
                key: 'dashboard.main',
                path: `${DASHBOARDS_PREFIX_PATH}/main`,
                title: 'Main',
                translateKey: 'nav.dashboard.main',
                icon: 'main',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.dashboard.mainDesc',
                        label: 'Main dashboard overview',
                    },
                },
                subMenu: [],
            },
            {
                key: 'dashboard.active',
                path: `${DASHBOARDS_PREFIX_PATH}/active`,
                title: 'Active',
                translateKey: 'nav.dashboard.active',
                icon: 'active',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.dashboard.trendingDesc',
                        label: 'Trending analytics and insights',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default dashboardsNavigationConfig;