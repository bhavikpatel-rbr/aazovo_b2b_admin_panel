import { CONCEPTS_PREFIX_PATH } from '@/constants/route.constant' // Assuming this is defined
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_COLLAPSE,
} from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

// Ensure these icon keys *exactly match* the keys in your navigationIcon object
const conceptsNavigationConfig: NavigationTree[] = [
    {
        key: 'concepts.companyManagement',
        path: `${CONCEPTS_PREFIX_PATH}/company-management`,
        title: 'Company Management',
        translateKey: 'nav.companyManagement',
        icon: 'account', // Using 'account' as a proxy for company/office
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.companyManagementDesc',
                label: 'Manage company details',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.memberManagement',
        path: `${CONCEPTS_PREFIX_PATH}/member-management`,
        title: 'Member Management',
        translateKey: 'nav.memberManagement',
        icon: 'customers', // <-- Corrected: uses PiUsersDuotone via 'customers' key
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.memberManagementDesc',
                label: 'Manage team members',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.requestsAndFeedbacks',
        path: `${CONCEPTS_PREFIX_PATH}/requests-feedbacks`,
        title: 'Requests and Feedbacks',
        translateKey: 'nav.requestsAndFeedbacks',
        icon: 'feedback', // Maps to PiChatDotsDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.requestsAndFeedbacksDesc',
                label: 'View requests and feedback',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.opportunity',
        path: `${CONCEPTS_PREFIX_PATH}/opportunity`,
        title: 'Opportunity',
        translateKey: 'nav.opportunity',
        icon: 'dashboardMarketing', // Maps to PiMegaphoneDuotone (suggests opportunity/outreach)
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.opportunityDesc',
                label: 'Track sales opportunities',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.productManagement',
        path: `${CONCEPTS_PREFIX_PATH}/product-management`,
        title: 'Product Management',
        translateKey: 'nav.productManagement',
        icon: 'products', // Maps to PiPackageDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.productManagementDesc',
                label: 'Manage product lifecycle',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.wallListing',
        path: `${CONCEPTS_PREFIX_PATH}/wall-listing`,
        title: 'Wall Listing',
        translateKey: 'nav.wallListing',
        icon: 'uiCommonGrid', // Maps to PiGridFourDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.wallListingDesc',
                label: 'View wall listings',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.leads',
        path: `${CONCEPTS_PREFIX_PATH}/leads`,
        title: 'Leads',
        translateKey: 'nav.leads',
        icon: 'customerCreate', // Maps to PiUserPlusDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.leadsDesc',
                label: 'Manage sales leads',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.accountDocument',
        path: `${CONCEPTS_PREFIX_PATH}/account-document`,
        title: 'Account Document',
        translateKey: 'nav.accountDocument',
        icon: 'forms', // Maps to PiFileTextDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.accountDocumentDesc',
                label: 'Manage account documents',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.subscribers',
        path: `${CONCEPTS_PREFIX_PATH}/subscribers`,
        title: 'Subscribers',
        translateKey: 'nav.subscribers',
        icon: 'customerList', // Re-using PiUsersDuotone (or consider 'mail')
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.subscribersDesc',
                label: 'Manage newsletter subscribers',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.blog',
        path: `${CONCEPTS_PREFIX_PATH}/blog`,
        title: 'Blog',
        translateKey: 'nav.blog',
        icon: 'helpCeterArticle', // Maps to PiNewspaperDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.blogDesc',
                label: 'Manage blog posts',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.formBuilder',
        path: `${CONCEPTS_PREFIX_PATH}/form-builder`,
        title: 'Form Builder',
        translateKey: 'nav.formBuilder',
        icon: 'uiFormsFormControl', // Maps to PiClipboardTextDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.formBuilderDesc',
                label: 'Create custom forms',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.masters',
        path: `${CONCEPTS_PREFIX_PATH}/masters`,
        title: 'Masters',
        translateKey: 'nav.masters',
        icon: 'signIn', // Maps to PiKeyDuotone (representing master keys/data)
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.mastersDesc',
                label: 'Manage master data',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.employeeManagement1',
        path: `${CONCEPTS_PREFIX_PATH}/employee-management`,
        title: 'Employee Management',
        translateKey: 'nav.projectList',
        icon: 'projectList', // <-- Updated from 'users' (Assuming PiBriefcaseDuotone is available)
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.employeeManagementDesc',
                label: 'Manage employees',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.data1',
        path: `${CONCEPTS_PREFIX_PATH}/data-management`,
        title: 'Data',
        translateKey: 'nav.data',
        icon: 'dashboardAnalytic', // Maps to PiChartBarDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.dataDesc',
                label: 'Manage application data',
            },
        },
        subMenu: [],
    },

    {
        key: 'concepts.exportMapping',
        path: `${CONCEPTS_PREFIX_PATH}/export-mapping`,
        title: 'Export Mapping',
        translateKey: 'nav.exportMapping',
        icon: 'uiFormsUpload', // Maps to PiUploadDuotone (suggests exporting)
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.exportMappingDesc',
                label: 'Configure data exports',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.globalSetting',
        path: `${CONCEPTS_PREFIX_PATH}/global-setting`,
        title: 'Global Setting',
        translateKey: 'nav.globalSetting',
        icon: 'accountSettings', // Maps to PiGearDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.globalSettingDesc',
                label: 'Configure global settings',
            },
        },
        subMenu: [],
    },
    {
        key: 'concepts.emailMarketing',
        path: `${CONCEPTS_PREFIX_PATH}/email-marketing`,
        title: 'Email Marketing',
        translateKey: 'nav.emailMarketing',
        icon: 'mail', // Maps to PiEnvelopeDuotone
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        meta: {
            description: {
                translateKey: 'nav.emailMarketingDesc',
                label: 'Manage email campaigns',
            },
        },
        subMenu: [],
    },
]

export default conceptsNavigationConfig
