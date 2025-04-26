import { lazy } from 'react';
import { DOCUMENT_MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const documentMasterRoutes: Routes = [
    {
        key: 'documentMaster.documentType',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/document-type`,
        component: lazy(() => import('@/views/document-master/Document-Type')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'documentMaster.documents',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/documents`,
        component: lazy(() => import('@/views/document-master/Documents')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'documentMaster.numberSystem',
        path: `${DOCUMENT_MASTER_PREFIX_PATH}/number-system`,
        component: lazy(() => import('@/views/document-master/Number-System')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default documentMasterRoutes;