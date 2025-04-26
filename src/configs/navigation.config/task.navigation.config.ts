import { TASK_PREFIX_PATH } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const taskNavigationConfig: NavigationTree[] = [
    {
        key: 'task',
        path: '',
        title: 'Task',
        translateKey: 'nav.task',
        icon: 'projectTask',
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
                key: 'task.board',
                path: `${TASK_PREFIX_PATH}/task-board`,
                title: 'Task Board',
                translateKey: 'nav.task.board',
                icon: 'taskBoard',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.task.boardDesc',
                        label: 'Manage task boards',
                    },
                },
                subMenu: [],
            },
            {
                key: 'task.list',
                path: `${TASK_PREFIX_PATH}/task-list`,
                title: 'Task List',
                translateKey: 'nav.task.list',
                icon: 'taskList',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.task.listDesc',
                        label: 'Manage task lists',
                    },
                },
                subMenu: [],
            },
            {
                key: 'task.feedback',
                path: `${TASK_PREFIX_PATH}/task-feedback`,
                title: 'Task Feedback',
                translateKey: 'nav.task.feedback',
                icon: 'taskFeedback',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.task.feedbackDesc',
                        label: 'Manage task feedback',
                    },
                },
                subMenu: [],
            },
        ],
    },
];

export default taskNavigationConfig;