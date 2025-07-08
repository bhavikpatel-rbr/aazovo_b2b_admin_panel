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
    getAllCompany,
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
    HiOutlineExclamation,
    HiOutlineClipboardList,
    HiOutlineHashtag,
    HiOutlineOfficeBuilding,
    HiOutlineUserGroup,
    HiOutlineFlag
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
    task_title: string
    status: TaskStatus
    assign_to_users: { id: number; name: string }[]
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
})

export type TaskFormData = z.infer<typeof taskValidationSchema>

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: JSX.Element }> = {
    Pending: { label: 'Pending', color: 'amber', icon: <BiTimeFive /> },
    in_progress: { label: 'In Progress', color: 'blue', icon: <BiHourglass /> },
    Completed: { label: 'Completed', color: 'emerald', icon: <BiCheckCircle /> },
}

// --- Helper Functions ---
const getPriorityClasses = (priority: Priority) => {
    switch (priority) {
        case 'High': return 'bg-red-500'
        case 'Medium': return 'bg-amber-500'
        case 'Low': default: return 'bg-emerald-500'
    }
}


// --- Child Components ---

const TaskToggle = ({ className, count }: { className?: string, count: number }) => (
    <div className={classNames('text-2xl', className)}>
        <BiTask />
    </div>
)

// AddTaskModal remains largely the same as it's a functional form

const AddTaskModal = ({
    isOpen,
    onClose,
    onTaskAdd,
    employeeOptions,
}: {
    isOpen: boolean
    onClose: () => void
    onTaskAdd: (data: TaskFormData) => Promise<void>
    employeeOptions: EmployeeOption[]
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
                    label="Due Date (Optional)"
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
                    label="Description (Optional)"
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

// --- NEW: Heavily Redesigned Task View Modal ---
const TaskViewModal = ({ task, isOpen, onClose }: { task: Task | null, isOpen: boolean, onClose: () => void }) => {
    if (!task) return null;
    const statusInfo = statusConfig[task.status];
    const assignedToText = task.assign_to_users?.length > 0 ? task.assign_to_users.map((a) => a.name).join(', ') : 'Not Assigned';

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={600}>
            <div className="space-y-6">
                <div className="pb-4 border-b border-gray-200 dark:border-gray-600">
                    <Tag className={classNames('text-sm', `bg-${statusInfo?.color}-500`)}>{statusInfo.label}</Tag>
                    <h4 className="font-bold mt-2">{task.task_title}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-start gap-3">
                        <HiOutlineUserCircle className="text-xl text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500">Assigned To</p>
                            <p className="font-semibold">{assignedToText}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <HiOutlineHashtag className="text-xl text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500">Priority</p>
                            <Tag className={classNames('text-xs', getPriorityClasses(task.priority))}>{task.priority}</Tag>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <HiOutlineCalendar className="text-xl text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs text-gray-500">Due Date</p>
                            <p className="font-semibold">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</p>
                        </div>
                    </div>
                </div>
                {task.description && (
                    <div className="flex items-start gap-3">
                        <HiOutlineDocumentText className="text-xl text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">Description</p>
                            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="text-right mt-8">
                <Button variant="solid" onClick={onClose}>Close</Button>
            </div>
        </Dialog>
    );
};

// --- MODIFIED: Summary Cards design updated to match the reference style ---
const TaskSummaryCards = ({ counts, activeFilter, onCardClick }: { counts: Record<FilterStatus | 'total', number>, activeFilter: FilterStatus, onCardClick: (status: FilterStatus) => void }) => {
    const cardData = [
        { key: 'all', title: 'Total Tasks', count: counts.total, icon: <BiTask size={24} />, color: 'indigo' },
        { key: 'Pending', title: 'Pending', count: counts.Pending, icon: <BiTimeFive size={24}/>, color: 'amber' },
        { key: 'in_progress', title: 'In Progress', count: counts.in_progress, icon: <BiHourglass size={24}/>, color: 'blue' },
        { key: 'Completed', title: 'Completed', count: counts.Completed, icon: <BiCheckCircle size={24}/>, color: 'emerald' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {cardData.map((card) => {
                const isActive = activeFilter === card.key;
                const activeClasses = `ring-2 ring-offset-1 dark:ring-offset-gray-900 ring-${card.color}-500`;

                return (
                    <Tooltip title={`Click to filter by ${card.title}`} key={card.key}>
                        <div onClick={() => onCardClick(card.key as FilterStatus)}>
                            <Card
                                clickable
                                bodyClass="flex gap-2 p-2"
                                className={classNames(
                                    'rounded-md transition-shadow duration-200 ease-in-out',
                                    'hover:shadow-lg',
                                    'shadow-sm'
                                )}
                            >
                                <div className={classNames(
                                    'h-12 w-12 rounded-md flex items-center justify-center shrink-0',
                                    `bg-${card.color}-100 dark:bg-${card.color}-500/20 text-${card.color}-500`
                                )}>
                                    {card.icon}
                                </div>
                                <div>
                                    <h6 className={classNames('font-bold', `text-${card.color}-500 dark:text-${card.color}-300`)}>{card.count}</h6>
                                    <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">{card.title}</span>
                                </div>
                            </Card>
                        </div>
                    </Tooltip>
                );
            })}
        </div>
    );
};

// --- NEW: Interactive Status Changer Component ---
const TaskStatusChanger = ({ taskId, currentStatus, onChange }: { taskId: string, currentStatus: TaskStatus, onChange: (id: string, status: TaskStatus) => void }) => {
    return (
        <div className="flex items-center space-x-2">
            {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
                const config = statusConfig[status];
                const isActive = currentStatus === status;
                const activeClasses = `bg-${config.color}-500 text-white`;
                const inactiveClasses = `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-${config.color}-100 dark:hover:bg-${config.color}-500/20 hover:text-${config.color}-600 dark:hover:text-${config.color}-100`;

                return (
                    <Tooltip title={config.label} key={status}>
                        <Button
                            shape="circle"
                            size="sm"
                            variant="plain"
                            icon={config.icon}
                            className={classNames('transition-colors duration-200', isActive ? activeClasses : inactiveClasses)}
                            onClick={() => onChange(taskId, status)}
                        />
                    </Tooltip>
                );
            })}
        </div>
    );
};

const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, task, isDeleting }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, task: Task | null, isDeleting: boolean }) => {
    // ... (Previous implementation was good, keeping it for brevity)
    if (!task) return null;
    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} contentClassName="pb-0 px-0">
            <div className="px-6 pt-6 pb-2">
                <div className="flex">
                    <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-full">
                        <HiOutlineExclamation className="text-2xl text-red-600 dark:text-red-100" />
                    </div>
                    <div className="ml-4">
                        <h5 className="mb-2">Delete Task</h5>
                        <p>Are you sure you want to delete the task: <span className="font-semibold">"{task.task_title}"</span>?</p>
                        <p className="mt-1 text-sm text-gray-500">This action cannot be undone.</p>
                    </div>
                </div>
            </div>
            <div className="text-right px-6 py-3 bg-gray-50 dark:bg-gray-700/60 rounded-b-lg">
                <Button className="mr-2" onClick={onClose} disabled={isDeleting}>Cancel</Button>
                <Button variant="solid" color="red" onClick={onConfirm} loading={isDeleting}>Delete</Button>
            </div>
        </Dialog>
    )
};


// --- Main Component Logic ---
const _Tasks = ({ className }: { className?: string }) => {
    const dispatch = useAppDispatch();
    const { AllTaskData = [], Employees = [], status: loadingStatus, isSubmitting, AllCompanyData = [] } = useSelector(masterSelector, shallowEqual);
    useEffect(() => {
        dispatch(getAllCompany())
    }, [dispatch])
    const [drawerIsOpen, setDrawerIsOpen] = useState(false);
    const [viewModalIsOpen, setViewModalIsOpen] = useState(false);
    const [addTaskModalIsOpen, setAddTaskModalIsOpen] = useState(false);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [deleteConfirmIsOpen, setDeleteConfirmIsOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const employeeOptions: EmployeeOption[] = useMemo(() => Array.isArray(Employees) ? Employees.map((emp: GeneralListItem) => ({ value: String(emp.id), label: emp.name })) : [], [Employees]);
    const companyOptions: CompanyOption[] = useMemo(() => Array.isArray(AllCompanyData) ? AllCompanyData.map((co: GeneralListItem) => ({ value: String(co.id), label: co.company_name })) : [], [AllCompanyData]);

    const onDrawerOpen = () => { if (!drawerIsOpen) { dispatch(getAllTaskAction()); dispatch(getEmployeesAction()); } setDrawerIsOpen(true); };
    const onDrawerClose = () => setDrawerIsOpen(false);
    const handleConfirmAddTask = async (data: TaskFormData) => { /* ...omitted for brevity... */ try { await dispatch(addTaskAction(data)).unwrap(); toast.push(<Notification type="success" title="Task Added!" />); } catch (e) { toast.push(<Notification type="danger" title="Failed to Add Task">{e.message || 'Error'}</Notification>); throw e; } };
    const handleChangeStatus = (id: string, status: TaskStatus) => dispatch(updateTaskStatusAPI({ id, status }));
    const openDeleteConfirmation = (task: Task) => { setTaskToDelete(task); setDeleteConfirmIsOpen(true); };
    const closeDeleteConfirmation = () => { setTaskToDelete(null); setDeleteConfirmIsOpen(false); };
    const handleConfirmDelete = async () => { /* ...omitted for brevity... */ if (!taskToDelete) return; try { await dispatch(deleteTaskAction(taskToDelete.id)).unwrap(); toast.push(<Notification type="success" title="Task Deleted" />); closeDeleteConfirmation(); } catch (e) { toast.push(<Notification type="danger" title="Failed to Delete">{e.message || 'Error'}</Notification>); closeDeleteConfirmation(); } };
    const handleViewTask = (task: Task) => { setViewingTask(task); setViewModalIsOpen(true); };
    const closeViewModal = () => { setViewModalIsOpen(false); setViewingTask(null); };

    const taskCounts = useMemo(() => {
        const tasks = Array.isArray(AllTaskData) ? AllTaskData : [];
        return tasks.reduce((acc, task) => {
            if (task.status) { acc[task.status] = (acc[task.status] || 0) + 1; }
            acc.total++;
            return acc;
        }, { total: 0, Pending: 0, in_progress: 0, Completed: 0 } as Record<FilterStatus | 'total', number>);
    }, [AllTaskData]);

    const filteredTasks = useMemo(() => {
        const tasks = Array.isArray(AllTaskData) ? AllTaskData : [];
        if (statusFilter === 'all') return tasks;
        return tasks.filter((task) => task.status === statusFilter);
    }, [AllTaskData, statusFilter]);

    return (
        <>
            <div onClick={onDrawerOpen}>
                <TaskToggle className={className} count={taskCounts.total} />
            </div>

            <Drawer title={null} isOpen={drawerIsOpen} onClose={onDrawerClose} width={800} bodyClass="p-0">
                <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                    <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="mb-0">My Tasks ({taskCounts.total})</h5>
                            <Button variant="solid" icon={<HiOutlinePlus />} onClick={() => setAddTaskModalIsOpen(true)}>Add New</Button>
                        </div>
                        <TaskSummaryCards counts={taskCounts} activeFilter={statusFilter} onCardClick={setStatusFilter} />
                    </header>

                    <main className="flex-grow p-4 overflow-y-auto">
                        <ScrollBar>
                            {loadingStatus === 'loading' && <div className="flex justify-center items-center h-full"><Spinner size={40} /></div>}

                            {loadingStatus !== 'loading' && filteredTasks.length > 0 && (
                                <div className="flex flex-col gap-4">
                                    {filteredTasks.map((task) => {
                                        const assignedToText = task.assign_to_users?.length > 3 ? `${task.assign_to_users.slice(0, 3).map(u => u.name).join(', ')} +${task.assign_to_users.length - 3}` : task.assign_to_users?.map(u => u.name).join(', ') || 'N/A';
                                        return (
                                            <div key={task.id} className="relative pl-4 pr-3 py-2 hover:shadow-lg transition-shadow duration-200 min-h-0">
                                                {/* Priority Indicator Bar */}
                                                <div className={classNames('absolute left-0 top-0 h-full w-1.5 rounded-l-lg', getPriorityClasses(task.priority))} />

                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <h6 className="font-semibold pr-2 text-sm truncate">{task.task_title}</h6>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <Tooltip title="View Details">
                                                                <Button size="xs" shape="circle" variant="plain" icon={<HiOutlineEye />} onClick={() => handleViewTask(task)} />
                                                            </Tooltip>
                                                            <Tooltip title="Delete Task">
                                                                <Button size="xs" shape="circle" variant="plain" icon={<HiOutlineTrash />} onClick={() => openDeleteConfirmation(task)} />
                                                            </Tooltip>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1.5"><HiOutlineUserCircle /> {assignedToText}</span>
                                                        {task.due_date && (
                                                            <span className="flex items-center gap-1.5">
                                                                <HiOutlineCalendar /> {new Date(task.due_date).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-end border-t border-gray-200 dark:border-gray-600 pt-2 mt-1">
                                                        <TaskStatusChanger taskId={task.id} currentStatus={task.status} onChange={handleChangeStatus} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {loadingStatus !== 'loading' && filteredTasks.length === 0 && (
                                <div className="text-center py-24 flex flex-col items-center justify-center h-full">
                                    <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                                        <HiOutlineClipboardList className="text-5xl text-gray-400" />
                                    </div>
                                    <h6 className="font-semibold">All clear!</h6>
                                    <p className="text-gray-500">No tasks match the current filter.</p>
                                </div>
                            )}
                        </ScrollBar>
                    </main>
                </div>
            </Drawer>

            <AddTaskModal
                isOpen={addTaskModalIsOpen}
                onClose={() => setAddTaskModalIsOpen(false)}
                onTaskAdd={handleConfirmAddTask}
                employeeOptions={employeeOptions}
            />
            <TaskViewModal task={viewingTask} isOpen={viewModalIsOpen} onClose={closeViewModal} />
            <DeleteConfirmationDialog isOpen={deleteConfirmIsOpen} onClose={closeDeleteConfirmation} onConfirm={handleConfirmDelete} task={taskToDelete} isDeleting={isSubmitting} />
        </>
    );
};

const Tasks = withHeaderItem(_Tasks);
export default Tasks;