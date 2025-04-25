import { lazy } from 'react';
import { SYSTEM_TOOLS_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

// const systemToolsRoutes: Routes = [
//     {
//         key: 'systemTools.bugReport',
//         path: `${SYSTEM_TOOLS_PREFIX_PATH}/bug-report`,
//         component: lazy(() => import('@/views/system-tools/BugReport')),
//         authority: [ADMIN],
//         meta: {
//             pageContainerType: 'contained',
//         },
//     },
//     {
//         key: 'systemTools.changeLog',
//         path: `${SYSTEM_TOOLS_PREFIX_PATH}/change-log`,
//         component: lazy(() => import('@/views/systemTools/ChangeLog')),
//         authority: [ADMIN],
//         meta: {
//             pageContainerType: 'contained',
//         },
//     },
// ];

// export default systemToolsRoutes;