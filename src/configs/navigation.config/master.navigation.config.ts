import { MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const masterNavigationConfig: NavigationTree[] = [
    {
        key: 'master',
        path: '',
        title: 'Master',
        translateKey: 'nav.master',
        icon: 'masterAccount',
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
                key: 'master.PageType',
                path: `${MASTER_PREFIX_PATH}/pagetype-type`,
                title: 'Page Type',
                translateKey: 'nav.master.PageType',
                icon: 'documentType',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.PageTypeDesc',
                        label: 'Page Type',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.documentType',
                path: `${MASTER_PREFIX_PATH}/document-type`,
                title: 'Document Type',
                translateKey: 'nav.master.documentType',
                icon: 'documentType',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.documentTypeDesc',
                        label: 'Manage document types',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.memberType',
                path: `${MASTER_PREFIX_PATH}/member-type`,
                title: 'Member Type',
                translateKey: 'nav.master.memberType',
                icon: 'memberType',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.memberType',
                        label: 'Manage member types',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.paymentTerms',
                path: `${MASTER_PREFIX_PATH}/payment-terms`,
                title: 'Payment Terms',
                translateKey: 'nav.master.paymentTerms',
                icon: 'paymentTerms',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.paymentTermsDesc',
                        label: 'Manage payment terms',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.productSpec',
                path: `${MASTER_PREFIX_PATH}/product-spec`,
                title: 'Product Spec',
                translateKey: 'nav.master.productSpec',
                icon: 'productSpec',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.productSpecDesc',
                        label: 'Manage product spec',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.currency',
                path: `${MASTER_PREFIX_PATH}/currency`,
                title: 'Currency',
                translateKey: 'nav.master.currency',
                icon: 'currency',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.currencyDesc',
                        label: 'Manage currencies',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.units',
                path: `${MASTER_PREFIX_PATH}/units`,
                title: 'Units',
                translateKey: 'nav.master.units',
                icon: 'units',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.unitsDesc',
                        label: 'Manage units',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.continents',
                path: `${MASTER_PREFIX_PATH}/continents`,
                title: 'Continents',
                translateKey: 'nav.master.continents',
                icon: 'continents',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.continentsDesc',
                        label: 'Manage continents',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.countries',
                path: `${MASTER_PREFIX_PATH}/countries`,
                title: 'Countries',
                translateKey: 'nav.master.countries',
                icon: 'countries',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.countriesDesc',
                        label: 'Manage countries',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.priceList',
                path: `${MASTER_PREFIX_PATH}/price-list`,
                title: 'Price List',
                translateKey: 'nav.master.priceList',
                icon: 'priceList',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.priceListDesc',
                        label: 'Manage price lists',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.documents',
                path: `${MASTER_PREFIX_PATH}/documents`,
                title: 'Documents List',
                translateKey: 'nav.master.documents',
                icon: 'documents',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.documentsDesc',
                        label: 'Manage documents',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default masterNavigationConfig;