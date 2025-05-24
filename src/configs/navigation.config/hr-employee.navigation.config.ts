import { HR_EMPLOYEES_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const hrEmployeesNavigationConfig: NavigationTree[] = [
    {
        key: 'hrEmployees',
        path: '',
        title: 'HR & Employees',
        translateKey: 'nav.hrEmployees',
        icon: 'customers',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 3,
            },
        },
        subMenu: [
            {
                key: 'hrEmployees.employees',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/employees`,
                title: 'Employees',
                translateKey: 'nav.hrEmployees.employees',
                icon: 'employees',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.employeesDesc',
                        label: 'Manage employees',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.designation',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/designation`,
                title: 'Designation',
                translateKey: 'nav.hrEmployees.designation',
                icon: 'designation',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.designationDesc',
                        label: 'Manage designations',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.department',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/department`,
                title: 'Department',
                translateKey: 'nav.hrEmployees.department',
                icon: 'department',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.departmentDesc',
                        label: 'Manage departments',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.jobApplication',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/job-application`,
                title: 'Job Application',
                translateKey: 'nav.hrEmployees.jobApplication',
                icon: 'jobApplication',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.jobApplication',
                        label: 'Manage job applications',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.jobDepartment',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/job-department`,
                title: 'Job Department',
                translateKey: 'nav.hrEmployees.jobDepartment',
                icon: 'jobDepartment',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.jobDepartment',
                        label: 'Manage job departments',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.jobPost',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/job-post`,
                title: 'Job Post',
                translateKey: 'nav.hrEmployees.jobPost',
                icon: 'jobPost',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.jobPost',
                        label: 'Manage job posts',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default hrEmployeesNavigationConfig;