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
                key: 'hrEmployees.jobPosts',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/job-posts`,
                title: 'Job Posts',
                translateKey: 'nav.hrEmployees.jobPosts',
                icon: 'jobPosts',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.jobPostsDesc',
                        label: 'Manage job posts',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.jobDepartments',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/job-departments`,
                title: 'Job Departments',
                translateKey: 'nav.hrEmployees.jobDepartments',
                icon: 'jobDepartments',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.jobDepartmentsDesc',
                        label: 'Manage job departments',
                    },
                },
                subMenu: [],
            },
            {
                key: 'hrEmployees.jobApplications',
                path: `${HR_EMPLOYEES_PREFIX_PATH}/job-applications`,
                title: 'Job Applications',
                translateKey: 'nav.hrEmployees.jobApplications',
                icon: 'jobApplications',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.hrEmployees.jobApplicationsDesc',
                        label: 'Manage job applications',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default hrEmployeesNavigationConfig;