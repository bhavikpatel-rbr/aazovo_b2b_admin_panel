import { lazy } from 'react';
import { TASK_PREFIX_PATH } from '@/constants/route.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { Routes } from '@/@types/routes';

const taskRoute: Routes = [
    {
        key: 'task.taskBoard',
        path: `${TASK_PREFIX_PATH}/task-board`,
        component: lazy(() => import('@/views/task-management/Task-Board')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'task.taskList',
        path: `${TASK_PREFIX_PATH}/task-list`,
        component: lazy(() => import('@/views/task-management/Task-List')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'task.taskList',
        path: `${TASK_PREFIX_PATH}/task-list/create`,
        component: lazy(() => import('@/views/task-management/Task-List/components/CreateTaskPage')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'task.taskList',
        path: `${TASK_PREFIX_PATH}/task-list/create/:id`,
        component: lazy(() => import('@/views/task-management/Task-List/components/CreateTaskPage')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    }

];

export default taskRoute;