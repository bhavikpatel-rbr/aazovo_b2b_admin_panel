import { DOCUMENT_MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const documentMasterNavigationConfig: NavigationTree[] = [
    {
        key: 'documentMaster',
        path: '',
        title: 'Document Master',
        translateKey: 'nav.documentMaster',
        icon: 'documentMaster',
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
                key: 'documentMaster.documentType',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/document-type`,
                title: 'Document Type',
                translateKey: 'nav.documentMaster.documentType',
                icon: 'documentType',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.documentMaster.documentTypeDesc',
                        label: 'Manage document types',
                    },
                },
                subMenu: [],
            },
            {
                key: 'documentMaster.documents',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/documents`,
                title: 'Documents',
                translateKey: 'nav.documentMaster.documents',
                icon: 'documents',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.documentMaster.documentsDesc',
                        label: 'Manage documents',
                    },
                },
                subMenu: [],
            },
            {
                key: 'documentMaster.numberSystem',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/number-system`,
                title: 'Number System',
                translateKey: 'nav.documentMaster.numberSystem',
                icon: 'numberSystem',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.documentMaster.numberSystemDesc',
                        label: 'Manage number systems',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default documentMasterNavigationConfig;