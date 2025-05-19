import { DOCUMENT_MASTER_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const documentMasterNavigationConfig: NavigationTree[] = [
    {
        key: 'documentMaster',
        path: '',
        title: 'Web Settings',
        translateKey: 'nav.documentMaster',
        icon: 'documentDetails',
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
                key: 'settings.cmsManagement',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/cms-management`,
                title: 'CMS Management',
                translateKey: 'nav.settings.cmsManagement',
                icon: 'cmsManagement',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.settings.cmsManagementDesc',
                        label: 'Manage CMS content',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.homeCategoryImage',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/home-category-image`,
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
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/trending-image`,
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
                key: 'master.trendingCarousel',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/trending-carousel`,
                title: 'Trending Carousel',
                translateKey: 'nav.master.trendingCarousel',
                icon: 'trendingCarousel',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.master.trendingCarouselDesc',
                        label: 'Manage trending Carousels',
                    },
                },
                subMenu: [],
            },
            {
                key: 'master.sliders',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/sliders`,
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
                key: 'marketing.blog',
                path: `${DOCUMENT_MASTER_PREFIX_PATH}/blog`,
                title: 'Blog',
                translateKey: 'nav.marketing.blog',
                icon: 'blog',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.marketing.blogDesc',
                        label: 'Manage blog posts',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default documentMasterNavigationConfig;