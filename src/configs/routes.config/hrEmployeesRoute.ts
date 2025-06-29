import { lazy } from 'react';
import { HR_EMPLOYEES_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const hrEmployeesRoute: Routes = [
    {
        key: 'hrEmployees.employees',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/employees`,
        component: lazy(() => import('@/views/hr-employees/Employees')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.employees',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/employees/view/:id`,
        component: lazy(() => import('@/views/hr-employees/Employees/components/EmployeeView')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.designation',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/designation`,
        component: lazy(() => import('@/views/hr-employees/Designation')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.department',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/department`,
        component: lazy(() => import('@/views/hr-employees/Departments')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.jobPosts',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-posts`,
        component: lazy(() => import('@/views/hr-employees/Job-Posts')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.employees',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/employees/add`,
        component: lazy(() => import('@/views/hr-employees/Employees/EmployeesCreate/CreateEmployee')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.employees',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/employees/edit/:id`,
        component: lazy(() => import('@/views/hr-employees/Employees/EmployeesCreate/CreateEmployee')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.jobApplicationsAdd', // Unique key
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-applications/add`,
        component: lazy(() => import('@/views/hr-employees/Job-Application/components/AddJobApplicationPage')), // Adjust path
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.jobApplicationsEdit', // Unique key
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-applications/edit/:applicationId`, // Path with parameter
        component: lazy(() => import('@/views/hr-employees/Job-Application/components/EditJobApplicationPage')), // Adjust path
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.jobApplication',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-application`,
        component: lazy(() => import('@/views/hr-employees/Job-Application')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.jobPost',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-post`,
        component: lazy(() => import('@/views/hr-employees/Job-Posts')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'hrEmployees.jobDepartment',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-department`,
        component: lazy(() => import('@/views/hr-employees/Job-Department')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default hrEmployeesRoute;