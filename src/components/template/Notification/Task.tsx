import { useState, useRef, useMemo } from 'react'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Drawer from '@/components/ui/Drawer'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import ScrollBar from '@/components/ui/ScrollBar'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Tooltip from '@/components/ui/Tooltip'
import {
    BiTask,
    BiCheckCircle,
    BiTimeFive,
    BiHourglass,
} from 'react-icons/bi'
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineEye,
    HiOutlineUserCircle,
    HiOutlineCalendar,
    HiOutlineDocumentText,
} from 'react-icons/hi'
import type { DrawerRef } from '@/components/ui/Drawer'

// --- Type Definitions & Constants ---

type TaskStatus = 'pending' | 'in_progress' | 'completed'
type FilterStatus = TaskStatus | 'all'

type Task = {
    id: string
    text: string
    status: TaskStatus
    assignedBy: string
    dueDate: Date | null
    description?: string
}

type StatusOption = {
    value: TaskStatus
    label: string
    color: string
}

const statusOptions: StatusOption[] = [
    { value: 'pending', label: 'Pending', color: 'bg-amber-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
]

// --- Reusable & Child Components ---

const TaskToggle = ({
    className,
    count,
}: {
    className?: string
    count: number
}) => {
    return (
        <div className={classNames('text-2xl', className)}>
            <Badge count={count} contentClassName="mt-1.5 me-1">
                <BiTask />
            </Badge>
        </div>
    )
}

const TaskViewModal = ({
    task,
    isOpen,
    onClose,
}: {
    task: Task | null
    isOpen: boolean
    onClose: () => void
}) => {
    if (!task) return null
    const statusInfo = statusOptions.find((s) => s.value === task.status)
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title="Task Details"
        >
            <div className="py-2 space-y-4">
                <div className="flex items-start space-x-4">
                    <div
                        className={classNames(
                            'p-2 rounded-full text-white text-xl',
                            statusInfo?.color
                        )}
                    >
                        {task.status === 'completed' ? (
                            <BiCheckCircle />
                        ) : task.status === 'in_progress' ? (
                            <BiHourglass />
                        ) : (
                            <BiTimeFive />
                        )}
                    </div>
                    <div>
                        <h5 className="font-semibold">{task.text}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Task ID: {task.id}
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 my-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <HiOutlineUserCircle className="text-lg" />
                        <div>
                            <p className="text-xs text-gray-500">Assigned By</p>
                            <p className="font-semibold">{task.assignedBy}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="text-lg" />
                        <div>
                            <p className="text-xs text-gray-500">Due Date</p>
                            <p className="font-semibold">
                                {task.dueDate
                                    ? task.dueDate.toLocaleDateString()
                                    : 'Not set'}
                            </p>
                        </div>
                    </div>
                </div>
                {task.description && (
                    <div className="flex items-start gap-2">
                        <HiOutlineDocumentText className="text-lg mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">Description</p>
                            <p className="text-sm">{task.description}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="text-right mt-6">
                <Button onClick={onClose}>Close</Button>
            </div>
        </Dialog>
    )
}

const TaskSummaryCards = ({
    counts,
    activeFilter,
    onCardClick,
}: {
    counts: Record<FilterStatus | 'total', number>
    activeFilter: FilterStatus
    onCardClick: (status: FilterStatus) => void
}) => {
    const cardData = [
        {
            key: 'all',
            title: 'Total Tasks',
            count: counts.total,
            icon: <BiTask />,
            color: 'text-gray-900 dark:text-gray-100',
            activeClass: 'border-gray-400 dark:border-gray-200 bg-gray-50 dark:bg-gray-700/60',
        },
        {
            key: 'pending',
            title: 'Pending',
            count: counts.pending,
            icon: <BiTimeFive />,
            color: 'text-amber-500',
            activeClass: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10',
        },
        {
            key: 'in_progress',
            title: 'In Progress',
            count: counts.in_progress,
            icon: <BiHourglass />,
            color: 'text-blue-500',
            activeClass: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10',
        },
        {
            key: 'completed',
            title: 'Completed',
            count: counts.completed,
            icon: <BiCheckCircle />,
            color: 'text-emerald-500',
            activeClass: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-4">
            {cardData.map((card) => (
                <div
                    key={card.key}
                    onClick={() => onCardClick(card.key as FilterStatus)}
                    className={classNames(
                        'p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all duration-200',
                        activeFilter === card.key
                            ? card.activeClass
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                    )}
                >
                    <div className={classNames('text-3xl', card.color)}>
                        {card.icon}
                    </div>
                    <div>
                        <h6 className="font-bold leading-tight">{card.count}</h6>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {card.title}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// --- Main Component Logic ---

const _Tasks = ({ className }: { className?: string }) => {
    const [tasks, setTasks] = useState<Task[]>([
        {
            id: '1',
            text: 'Review new design mockups',
            status: 'in_progress',
            assignedBy: 'John Doe',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            description:
                'Go over the latest Figma files from the design team. Focus on the new dashboard layout.',
        },
        {
            id: '2',
            text: 'Prepare for client presentation',
            status: 'pending',
            assignedBy: 'Jane Smith',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
            id: '3',
            text: 'Deploy latest updates to staging',
            status: 'completed',
            assignedBy: 'John Doe',
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            description:
                'Deployment was successful. Awaiting QA feedback before production release.',
        },
        {
            id: '4',
            text: 'Fix login page bug',
            status: 'pending',
            assignedBy: 'System Admin',
            dueDate: null,
            description: 'Users are reporting issues with social login.',
        },
    ])
    const [drawerIsOpen, setDrawerIsOpen] = useState(false)
    const [viewModalIsOpen, setViewModalIsOpen] = useState(false)
    const [viewingTask, setViewingTask] = useState<Task | null>(null)
    const [newTaskText, setNewTaskText] = useState('')
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
    const drawerRef = useRef<DrawerRef>(null)

    const onDrawerOpen = () => setDrawerIsOpen(true)
    const onDrawerClose = () => setDrawerIsOpen(false)

    const handleAddTask = () => {
        if (newTaskText.trim() === '') return
        const newTask: Task = {
            id: `task-${Date.now()}`,
            text: newTaskText,
            status: 'pending',
            assignedBy: 'Current User', // Replace with actual user data
            dueDate: null,
        }
        setTasks((prevTasks) => [newTask, ...prevTasks])
        setNewTaskText('')
    }

    const handleChangeStatus = (taskId: string, newStatus: TaskStatus) => {
        setTasks(
            tasks.map((task) =>
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        )
    }

    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter((task) => task.id !== taskId))
    }

    const handleViewTask = (task: Task) => {
        setViewingTask(task)
        setViewModalIsOpen(true)
    }

    const closeViewModal = () => {
        setViewModalIsOpen(false)
        setViewingTask(null)
    }

    const taskCounts = useMemo(() => {
        return tasks.reduce(
            (acc, task) => {
                acc[task.status]++
                acc.total++
                return acc
            },
            { total: 0, pending: 0, in_progress: 0, completed: 0 } as Record<
                FilterStatus | 'total',
                number
            >
        )
    }, [tasks])

    const filteredTasks = useMemo(() => {
        if (statusFilter === 'all') {
            return tasks
        }
        return tasks.filter((task) => task.status === statusFilter)
    }, [tasks, statusFilter])

    return (
        <>
            <div onClick={onDrawerOpen}>
                <TaskToggle className={className} count={taskCounts.total} />
            </div>

            <Drawer
                ref={drawerRef}
                title="My Tasks"
                isOpen={drawerIsOpen}
                onClose={onDrawerClose}
                width={620}
            >
                <div className="flex flex-col h-full">
                    {/* Summary and Filters */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600 space-y-4">
                        <TaskSummaryCards
                            counts={taskCounts}
                            activeFilter={statusFilter}
                            onCardClick={(status) => setStatusFilter(status)}
                        />
                    </div>

                    {/* Task List */}
                    <ScrollBar className="flex-grow p-4">
                        <div className="flex items-center mb-4">
                            <Input
                                size="sm"
                                placeholder="Add a new task..."
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            />
                            <Button
                                size="sm"
                                className="ms-2"
                                icon={<HiOutlinePlus />}
                                variant="solid"
                                onClick={handleAddTask}
                            />
                        </div>
                        {filteredTasks.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {filteredTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="font-semibold w-4/5">
                                                {task.text}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <Tooltip title="View Details">
                                                    <Button
                                                        size="xs"
                                                        shape="circle"
                                                        variant="plain"
                                                        icon={<HiOutlineEye />}
                                                        onClick={() =>
                                                            handleViewTask(task)
                                                        }
                                                    />
                                                </Tooltip>
                                                <Tooltip title="Delete Task">
                                                    <Button
                                                        size="xs"
                                                        shape="circle"
                                                        variant="plain"
                                                        icon={<HiOutlineTrash />}
                                                        onClick={() =>
                                                            handleDeleteTask(
                                                                task.id
                                                            )
                                                        }
                                                    />
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Assigned by: {task.assignedBy}
                                        </p>
                                        <div className="mt-3">
                                            <Select
                                                size="sm"
                                                options={statusOptions}
                                                value={statusOptions.find(
                                                    (s) => s.value === task.status
                                                )}
                                                onChange={(option) =>
                                                    handleChangeStatus(
                                                        task.id,
                                                        option?.value || 'pending'
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No tasks match your filter.
                            </div>
                        )}
                    </ScrollBar>
                </div>
            </Drawer>

            <TaskViewModal
                task={viewingTask}
                isOpen={viewModalIsOpen}
                onClose={closeViewModal}
            />
        </>
    )
}

const Tasks = withHeaderItem(_Tasks)

export default Tasks