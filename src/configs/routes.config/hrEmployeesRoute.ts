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
        key: 'hrEmployees.jobPosts',
        path: `${HR_EMPLOYEES_PREFIX_PATH}/job-posts`,
        component: lazy(() => import('@/views/hr-employees/Job-Posts')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
];

export default hrEmployeesRoute;