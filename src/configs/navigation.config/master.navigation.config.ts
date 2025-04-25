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
        icon: 'master',
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
                key: 'master.formBuilder',
                path: `${MASTER_PREFIX_PATH}/form-builder`,
                title: 'Form Builder',
                translateKey: 'nav.master.formBuilder',
                icon: 'formBuilder',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.formBuilderDesc',
                        label: 'Manage form builders',
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
                key: 'master.homeCategoryImage',
                path: `${MASTER_PREFIX_PATH}/home-category-image`,
                title: 'Home Category Image',
                translateKey: 'nav.master.homeCategoryImage',
                icon: 'homeCategoryImage',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.homeCategoryImageDesc',
                        label: 'Manage home category images',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.trendingImage',
                path: `${MASTER_PREFIX_PATH}/trending-image`,
                title: 'Trending Image',
                translateKey: 'nav.master.trendingImage',
                icon: 'trendingImage',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.trendingImageDesc',
                        label: 'Manage trending images',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.sliders',
                path: `${MASTER_PREFIX_PATH}/sliders`,
                title: 'Sliders',
                translateKey: 'nav.master.sliders',
                icon: 'sliders',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.slidersDesc',
                        label: 'Manage sliders',
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
        ],
    },
];

export default masterNavigationConfig;