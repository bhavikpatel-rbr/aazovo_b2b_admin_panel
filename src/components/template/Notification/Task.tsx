import { useState, useMemo, useEffect } from 'react'
import classNames from 'classnames'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSelector, shallowEqual } from 'react-redux'

// --- Redux ---
import { useAppDispatch } from '@/reduxtool/store'
import {
    getAllTaskAction,
    addTaskAction,
    deleteTaskAction,
    updateTaskStatusAPI,
    getEmployeesAction,
} from '@/reduxtool/master/middleware'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// UI Components
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Drawer from '@/components/ui/Drawer'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import ScrollBar from '@/components/ui/ScrollBar'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Tooltip from '@/components/ui/Tooltip'
import DatePicker from '@/components/ui/DatePicker'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { FormItem, Form } from '@/components/ui/Form'
import Tag from '@/components/ui/Tag'

// Icons
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

// --- Type Definitions, Schemas & Constants ---
type Priority = 'Low' | 'Medium' | 'High'
type TaskStatus = 'Pending' | 'in_progress' | 'Completed'
type FilterStatus = TaskStatus | 'all'
type EmployeeOption = { value: string; label: string }
type CompanyOption = { value: string; label: string }
type GeneralListItem = { id: string | number; name: string }

export type Task = {
    id: string
    text: string
    status: TaskStatus
    assign_to: { id: number; name: string }[]
    due_date: Date | null
    priority: Priority
    description?: string
}

const priorityOptions: { value: Priority; label: string }[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
]

const taskValidationSchema = z.object({
    task_title: z.string().min(3, 'Task title must be at least 3 characters.'),
    assign_to: z.array(z.string()).min(1, 'At least one assignee is required.'),
    priority: z.string().min(1, 'Please select a priority.'),
    due_date: z.date().nullable().optional(),
    description: z.string().optional(),
    company_ids: z.array(z.string()).min(1, 'At least one company is required.'),
})

export type TaskFormData = z.infer<typeof taskValidationSchema>

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'Pending', label: 'Pending', color: 'bg-amber-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'Completed', label: 'Completed', color: 'bg-emerald-500' },
]

// --- Child Components ---

const TaskToggle = ({
    className,
    count,
}: {
    className?: string
    count: number
}) => (
    <div className={classNames('text-2xl', className)}>
        <BiTask />
    </div>
)

const AddTaskModal = ({
    isOpen,
    onClose,
    onTaskAdd,
    employeeOptions,
    companyOptions,
}: {
    isOpen: boolean
    onClose: () => void
    onTaskAdd: (data: TaskFormData) => Promise<void>
    employeeOptions: EmployeeOption[]
    companyOptions: CompanyOption[]
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskValidationSchema),
        defaultValues: {
            task_title: '',
            assign_to: [],
            priority: 'Medium',
            due_date: null,
            description: '',
            company_ids: [],
        },
    })

    const handleClose = () => {
        reset()
        onClose()
    }

    const onSubmit = async (data: TaskFormData) => {
        setIsLoading(true)
        try {
            await onTaskAdd(data)
            handleClose()
        } catch (error) {
            // Error is handled by the dispatching component
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <h5 className="mb-4">Add New Task</h5>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Task Title"
                    invalid={!!errors.task_title}
                    errorMessage={errors.task_title?.message}
                >
                    <Controller
                        name="task_title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                autoFocus
                                placeholder="e.g., Follow up on KYC"
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Company"
                    invalid={!!errors.company_ids}
                    errorMessage={errors.company_ids?.message}
                >
                    <Controller
                        name="company_ids"
                        control={control}
                        render={({ field }) => (
                            <Select
                                isMulti
                                placeholder="Select Company(s)"
                                options={companyOptions}
                                value={companyOptions.filter((o) =>
                                    field.value?.includes(o.value)
                                )}
                                onChange={(options) =>
                                    field.onChange(
                                        options
                                            ? options.map((o) => o.value)
                                            : []
                                    )
                                }
                            />
                        )}
                    />
                </FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        label="Assign To"
                        invalid={!!errors.assign_to}
                        errorMessage={errors.assign_to?.message}
                    >
                        <Controller
                            name="assign_to"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select User(s)"
                                    options={employeeOptions}
                                    value={employeeOptions.filter((o) =>
                                        field.value?.includes(o.value)
                                    )}
                                    onChange={(options) =>
                                        field.onChange(
                                            options
                                                ? options.map((o) => o.value)
                                                : []
                                        )
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Priority"
                        invalid={!!errors.priority}
                        errorMessage={errors.priority?.message}
                    >
                        <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Priority"
                                    options={priorityOptions}
                                    value={priorityOptions.find(
                                        (p) => p.value === field.value
                                    )}
                                    onChange={(opt) =>
                                        field.onChange(opt?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <FormItem
                    label="Due Date"
                    invalid={!!errors.due_date}
                    errorMessage={errors.due_date?.message}
                >
                    <Controller
                        name="due_date"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                placeholder="Select date"
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Description"
                    invalid={!!errors.description}
                    errorMessage={errors.description?.message}
                >
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => <Input textArea {...field} />}
                    />
                </FormItem>
                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isLoading}
                    >
                        Add Task
                    </Button>
                </div>
            </Form>
        </Dialog>
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

    const assignedToText =
        task.assign_to_users && task.assign_to_users.length > 0
            ? task.assign_to_users.map((a) => a.name).join(', ')
            : 'Not Assigned'

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
                        {task.status === 'Completed' ? (
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
                            Task Title: {task.task_title}
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 my-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <HiOutlineUserCircle className="text-lg" />
                        <div>
                            <p className="text-xs text-gray-500">Assigned To</p>
                            <p className="font-semibold">{assignedToText}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="text-lg" />
                        <div>
                            <p className="text-xs text-gray-500">Due Date</p>
                            <p className="font-semibold">
                                {task.due_date
                                    ? new Date(
                                          task.due_date
                                      ).toLocaleDateString()
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
            task_title: 'Total Tasks',
            count: counts.total,
            icon: <BiTask />,
            iconBgClass: 'bg-blue-100 dark:bg-blue-500/20',
            iconColorClass: 'text-blue-600 dark:text-blue-100',
            activeClass: 'border-blue-300',
        },
        {
            key: 'Pending',
            task_title: 'Pending',
            count: counts.Pending,
            icon: <BiTimeFive />,
            iconBgClass: 'bg-amber-100 dark:bg-amber-500/20',
            iconColorClass: 'text-amber-600 dark:text-amber-100',
            activeClass: 'border-amber-300',
        },
        {
            key: 'in_progress',
            task_title: 'In Progress',
            count: counts.in_progress,
            icon: <BiHourglass />,
            iconBgClass: 'bg-sky-100 dark:bg-sky-500/20',
            iconColorClass: 'text-sky-600 dark:text-sky-100',
            activeClass: 'border-sky-300',
        },
        {
            key: 'Completed',
            task_title: 'Completed',
            count: counts.Completed,
            icon: <BiCheckCircle />,
            iconBgClass: 'bg-emerald-100 dark:bg-emerald-500/20',
            iconColorClass: 'text-emerald-600 dark:text-emerald-100',
            activeClass: 'border-emerald-300',
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-4">
            {cardData.map((card) => (
                <Tooltip
                    title={`Click to show '${card.task_title}'`}
                    key={card.key}
                >
                    <div onClick={() => onCardClick(card.key as FilterStatus)}>
                        <Card
                            clickable
                            bodyClass="flex items-center gap-3 p-3"
                            className={classNames(
                                'rounded-lg',
                                activeFilter === card.key ? card.activeClass : ''
                            )}
                        >
                            <div
                                className={classNames(
                                    'h-12 w-12 rounded-md flex items-center justify-center',
                                    card.iconBgClass
                                )}
                            >
                                <span
                                    className={classNames(
                                        'text-2xl',
                                        card.iconColorClass
                                    )}
                                >
                                    {card.icon}
                                </span>
                            </div>
                            <div>
                                <h6
                                    className={classNames(
                                        'font-bold',
                                        card.iconColorClass
                                    )}
                                >
                                    {card.count}
                                </h6>
                                <p className="font-semibold text-xs">
                                    {card.task_title}
                                </p>
                            </div>
                        </Card>
                    </div>
                </Tooltip>
            ))}
        </div>
    )
}

const DeleteConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    task,
    isDeleting,
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    task: Task | null
    isDeleting: boolean
}) => {
    if (!task) {
        return null
    }

    const isCompleted = task.status === 'Completed'

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title="Confirm Deletion"
            width={400}
        >
            <div className="py-2">
                <p>
                    Are you sure you want to delete the task:{' '}
                    <span className="font-semibold">"{task.text}"</span>?
                </p>
                {!isCompleted && (
                    <p className="mt-2 text-amber-600 dark:text-amber-400 font-semibold">
                        This task is still in_progress. This action cannot be
                        undone.
                    </p>
                )}
                {isCompleted && (
                    <p className="mt-2 text-gray-500">
                        This action cannot be undone.
                    </p>
                )}
            </div>
            <div className="text-right mt-6">
                <Button
                    className="mr-2"
                    onClick={onClose}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button
                    variant="solid"
                    color="red"
                    onClick={onConfirm}
                    loading={isDeleting}
                >
                    Delete
                </Button>
            </div>
        </Dialog>
    )
}

// --- Main Component Logic ---

const _Tasks = ({ className }: { className?: string }) => {
    const dispatch = useAppDispatch()
    const {
        AllTaskData = [],
        Employees = [],
        status: loadingStatus,
        isSubmitting,
        AllCompanyData = [],
    } = useSelector(masterSelector, shallowEqual)

    const [drawerIsOpen, setDrawerIsOpen] = useState(false)
    const [viewModalIsOpen, setViewModalIsOpen] = useState(false)
    const [addTaskModalIsOpen, setAddTaskModalIsOpen] = useState(false)
    const [viewingTask, setViewingTask] = useState<Task | null>(null)
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
    const [deleteConfirmIsOpen, setDeleteConfirmIsOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

    const employeeOptions: EmployeeOption[] = useMemo(
        () =>
            Array.isArray(Employees)
                ? Employees.map((emp: GeneralListItem) => ({
                      value: String(emp.id),
                      label: emp.name,
                  }))
                : [],
        [Employees]
    )

    const companyOptions: CompanyOption[] = useMemo(
        () =>
            Array.isArray(AllCompanyData)
                ? AllCompanyData.map((company: GeneralListItem) => ({
                      value: String(company.id),
                      label: company.company_name,
                  }))
                : [],
        [AllCompanyData]
    )

    const onDrawerOpen = () => {
        if (!drawerIsOpen) {
            dispatch(getAllTaskAction())
            dispatch(getEmployeesAction())
        }
        setDrawerIsOpen(true)
    }

    const onDrawerClose = () => setDrawerIsOpen(false)

    const handleConfirmAddTask = async (data: TaskFormData) => {
        try {
            await dispatch(addTaskAction(data)).unwrap()
            toast.push(
                <Notification
                    type="success"
                    title="Task Added Successfully!"
                />
            )
        } catch (error: any) {
            toast.push(
                <Notification
                    type="danger"
                    title="Failed to Add Task"
                >
                    {error.message || 'An unexpected error occurred.'}
                </Notification>
            )
            throw error // Re-throw to prevent modal from closing
        }
    }

    const handleChangeStatus = (id: string, status: TaskStatus) => {
        dispatch(updateTaskStatusAPI({ id, status }))
    }

    const openDeleteConfirmation = (task: Task) => {
        setTaskToDelete(task)
        setDeleteConfirmIsOpen(true)
    }

    const closeDeleteConfirmation = () => {
        setTaskToDelete(null)
        setDeleteConfirmIsOpen(false)
    }

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return
        try {
            await dispatch(deleteTaskAction(taskToDelete.id)).unwrap()
            toast.push(<Notification type="success" title="Task Deleted" />)
            closeDeleteConfirmation()
        } catch (error: any) {
            toast.push(
                <Notification
                    type="danger"
                    title="Failed to Delete Task"
                >
                    {error.message || 'An unexpected error occurred.'}
                </Notification>
            )
            closeDeleteConfirmation()
        }
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
        const tasks = Array.isArray(AllTaskData) ? AllTaskData : []
        return tasks.reduce(
            (acc, task) => {
                if (task.status) {
                    acc[task.status]++
                }
                acc.total++
                return acc
            },
            {
                total: 0,
                Pending: 0,
                in_progress: 0,
                Completed: 0,
            } as Record<FilterStatus | 'total', number>
        )
    }, [AllTaskData])

    const filteredTasks = useMemo(() => {
        const tasks = Array.isArray(AllTaskData) ? AllTaskData : []
        if (statusFilter === 'all') {
            return tasks
        }
        return tasks.filter((task) => task.status === statusFilter)
    }, [AllTaskData, statusFilter])

    return (
        <>
            <div onClick={onDrawerOpen}>
                <TaskToggle className={className} count={taskCounts.total} />
            </div>

            <Drawer
                title="My Tasks"
                isOpen={drawerIsOpen}
                onClose={onDrawerClose}
                width={620}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600 space-y-4">
                        <div className="flex justify-end">
                            <Button
                                variant="solid"
                                icon={<HiOutlinePlus />}
                                onClick={() => setAddTaskModalIsOpen(true)}
                            >
                                Add New
                            </Button>
                        </div>
                        <TaskSummaryCards
                            counts={taskCounts}
                            activeFilter={statusFilter}
                            onCardClick={(status) => setStatusFilter(status)}
                        />
                    </div>

                    <div className="flex-grow p-4">
                        {loadingStatus === 'loading' && (
                            <div className="flex justify-center items-center">
                                <Spinner size={40} />
                            </div>
                        )}
                        {loadingStatus !== 'loading' &&
                            filteredTasks.length > 0 && (
                                <div className="flex flex-col gap-4">
                                    {filteredTasks.map((task) => {
                                        const assignedToText =
                                            task.assign_to_users &&
                                            task.assign_to_users.length > 0
                                                ? task.assign_to_users
                                                      .map((a) => a.name)
                                                      .join(', ')
                                                : 'N/A'

                                        return (
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
                                                                icon={
                                                                    <HiOutlineEye />
                                                                }
                                                                onClick={() =>
                                                                    handleViewTask(
                                                                        task
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                        {/* <Tooltip title="Delete Task">
                                                            <Button
                                                                size="xs"
                                                                shape="circle"
                                                                variant="plain"
                                                                icon={
                                                                    <HiOutlineTrash />
                                                                }
                                                                onClick={() =>
                                                                    openDeleteConfirmation(
                                                                        task
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip> */}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Assigned to: {assignedToText}
                                                </p>
                                                <div className="mt-3">
                                                    <Select
                                                        size="sm"
                                                        options={statusOptions}
                                                        value={statusOptions.find(
                                                            (s) =>
                                                                s.value ===
                                                                task.status
                                                        )}
                                                        onChange={(option) =>
                                                            handleChangeStatus(
                                                                task.id,
                                                                option?.value ||
                                                                    'Pending'
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        {loadingStatus !== 'loading' &&
                            filteredTasks.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    No tasks to display.
                                </div>
                            )}
                    </div>
                </div>
            </Drawer>

            <AddTaskModal
                isOpen={addTaskModalIsOpen}
                onClose={() => setAddTaskModalIsOpen(false)}
                onTaskAdd={handleConfirmAddTask}
                employeeOptions={employeeOptions}
                companyOptions={companyOptions}
            />
            <TaskViewModal
                task={viewingTask}
                isOpen={viewModalIsOpen}
                onClose={closeViewModal}
            />
            <DeleteConfirmationDialog
                isOpen={deleteConfirmIsOpen}
                onClose={closeDeleteConfirmation}
                onConfirm={handleConfirmDelete}
                task={taskToDelete}
                isDeleting={isSubmitting}
            />
        </>
    )
}

const Tasks = withHeaderItem(_Tasks)

export default Tasks