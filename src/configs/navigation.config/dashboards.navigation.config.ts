import { DASHBOARDS_PREFIX_PATH } from '@/constants/route.constant'
// We only need NAV_ITEM_TYPE_ITEM now
import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const dashboardsNavigationConfig: NavigationTree[] = [
    {
        // You can keep the key 'dashboard' or make it more specific like 'dashboard.main'
        key: 'dashboard',
        // Assign a direct path - using the ecommerce path as an example default
        path: `${DASHBOARDS_PREFIX_PATH}/ecommerce`,
        title: 'Dashboard',
        translateKey: 'nav.dashboard.dashboard',
        icon: 'dashboard',
        // Change type to ITEM to make it a clickable link
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        // The 'meta' key might not be needed for an ITEM type, depends on your implementation
        // meta: { ... },
        // Ensure subMenu is empty
        subMenu: [],
    },
]

export default dashboardsNavigationConfig
