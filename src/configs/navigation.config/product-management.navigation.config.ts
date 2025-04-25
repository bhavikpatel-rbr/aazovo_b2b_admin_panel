import { PRODUCT_MANAGEMENT_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const productManagementNavigationConfig: NavigationTree[] = [
    {
        key: 'productManagement',
        path: '',
        title: 'Product Management',
        translateKey: 'nav.productManagement',
        icon: 'products',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 2,
            },
        },
        subMenu: [
            {
                key: 'productManagement.categories',
                path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/categories`,
                title: 'Categories',
                translateKey: 'nav.productManagement.categories',
                icon: 'categories',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.productManagement.categoriesDesc',
                        label: 'Manage product categories',
                    },
                },
                subMenu: [],
            },
            {
                key: 'productManagement.brands',
                path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/brands`,
                title: 'Brands',
                translateKey: 'nav.productManagement.brands',
                icon: 'brands',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.productManagement.brandsDesc',
                        label: 'Manage product brands',
                    },
                },
                subMenu: [],
            },
            {
                key: 'productManagement.products',
                path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/products`,
                title: 'Products',
                translateKey: 'nav.productManagement.products',
                icon: 'products',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.productManagement.productsDesc',
                        label: 'Manage all products',
                    },
                },
                subMenu: [],
            },
            {
                key: 'productManagement.wallListing',
                path: `${PRODUCT_MANAGEMENT_PREFIX_PATH}/wall-listing`,
                title: 'Wall Listing',
                translateKey: 'nav.productManagement.wallListing',
                icon: 'wallListing',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.productManagement.wallListingDesc',
                        label: 'Manage wall listings',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default productManagementNavigationConfig;