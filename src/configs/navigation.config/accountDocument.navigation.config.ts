import { ACCOUNT_DOCUMENT_ROUTE } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const accountDocumentNavigationConfig: NavigationTree[] = [
    {
        key: 'accountDocuments',
        path: `/account-document`,
        title: 'Account Document',
        translateKey: 'nav.accountDocuments',
        icon: 'accountDocument',
        // type: NAV_ITEM_TYPE_ITEM,
        type: 'item',
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.accountDocuments',
                label: 'Manage Account Document',
            },
        },
        subMenu : []
    },
];

export default accountDocumentNavigationConfig;