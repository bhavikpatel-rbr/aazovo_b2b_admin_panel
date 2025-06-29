import { WEB_SETTINGS_ROUTE } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const webSettingsNavigationConfig: NavigationTree[] = [
    {
        key: 'webSettings',
        path: '',
        title: 'Web Settings',
        translateKey: 'nav.webSettings',
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

            // {
            //     key: 'webSettings.homeCategoryImage',
            //     path: `${WEB_SETTINGS_ROUTE}/home-category-image`,
            //     title: 'Home Category Image',
            //     translateKey: 'nav.webSettings.homeCategoryImage',
            //     icon: 'homeCategoryImage',
            //     type: NAV_ITEM_TYPE_ITEM,
            //     authority: [ADMIN],
            //     meta: {
            //         description: {
            //             translateKey: 'nav.webSettings.homeCategoryImageDesc',
            //             label: 'Manage home category images',
            //         },
            //     },
            //     subMenu: [],
            // },
            {
                key: 'webSettings.trendingImage',
                path: `${WEB_SETTINGS_ROUTE}/trending-image`,
                title: 'Trending Image',
                translateKey: 'nav.webSettings.trendingImage',
                icon: 'trendingImage',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.webSettings.trendingImageDesc',
                        label: 'Manage trending images',
                    },
                },
                subMenu: [],
            },
            {
                key: 'webSettings.trendingCarousel',
                path: `${WEB_SETTINGS_ROUTE}/trending-carousel`,
                title: 'Trending Carousel',
                translateKey: 'nav.webSettings.trendingCarousel',
                icon: 'trendingCarousel',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.webSettings.trendingCarouselDesc',
                        label: 'Manage trending Carousels',
                    },
                },
                subMenu: [],
            },
            {
                key: 'webSettings.sliders',
                path: `${WEB_SETTINGS_ROUTE}/sliders`,
                title: 'Sliders',
                translateKey: 'nav.webSettings.sliders',
                icon: 'sliders',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.webSettings.slidersDesc',
                        label: 'Manage sliders',
                    },
                },
                subMenu: [],
            },
            {
                key: 'webSettings.blog',
                path: `${WEB_SETTINGS_ROUTE}/blog`,
                title: 'Blog',
                translateKey: 'nav.webSettings.blog',
                icon: 'blog',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.webSettings.blogDesc',
                        label: 'Manage blog posts',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default webSettingsNavigationConfig;