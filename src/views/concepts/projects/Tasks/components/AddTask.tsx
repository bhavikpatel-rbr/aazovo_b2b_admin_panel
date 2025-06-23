import { useEffect, useState, useRef, ChangeEvent } from 'react'
import classNames from '@/utils/classNames'
import Tag from '@/components/ui/Tag'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Badge from '@/components/ui/Badge'
import DatePicker from '@/components/ui/DatePicker'
import { labelClass } from '../utils' // Ensure this maps your status/priority strings to CSS classes
import { useTasksStore } from '../store/tasksStore'
import {
    TbPlus,
    TbCircleCheck,
    TbChevronDown,
    TbCalendar,
    TbUser,
} from 'react-icons/tb'
import dayjs from 'dayjs'

const { TBody, Tr, Td } = Table

// Define NewTaskPayload here or import it from a shared types file
// This type should align with your API expectations.
export type NewTaskPayload = {
    task_id?: string; // Optional: only for edit mode, passed via taskToEdit.task_id
    task_title: string;
    user_id: number; // As per your requirement: 53
    assign_to: string[]; // Array of assignee IDs, e.g., ['7']
    module_id: number; // As per your requirement: 5
    module_name: string; // As per your requirement: 'company'
    company_ids: number[]; // As per your requirement: [1]
    status: string; // e.g., 'Pending', 'In Progress'
    priority: string; // e.g., 'Low', 'Medium', 'High'
    department_id: number; // As per your requirement: 2
    due_date: string | null; // Format: 'YYYY-MM-DD' or null
    note_remark: string;
    additional_description: string;
};

type AddTaskProps = {
    groupKey: string; // Used by "Add task" button to identify context group
    isCreatingTask: boolean; // True when parent wants to show "new task" form for this group
    onAddTaskClick: (key: string) => void; // Called when "Add task" button is clicked
    onCreateTask: (taskPayload: NewTaskPayload) => void; // Callback for creating a task
    onUpdateTask?: (taskPayload: NewTaskPayload) => void; // Callback for updating a task
    taskToEdit?: NewTaskPayload | null; // Task data for pre-filling the form in edit mode
};

const priorityList: string[] = ['Low', 'Medium', 'High'] // Customize as needed
const statusList: string[] = ['Pending', 'In Progress'] // Customize as needed

const AddTask = ({
    groupKey,
    isCreatingTask,
    onAddTaskClick,
    onCreateTask,
    onUpdateTask,
    taskToEdit,
}: AddTaskProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [focused, setFocused] = useState(false)

    // Form state
    const [taskTitle, setTaskTitle] = useState('')
    const [status, setStatus] = useState(statusList[0]) // Default to first status
    const [priority, setPriority] = useState(priorityList[0]) // Default to first priority
    const [assignee, setAssignee] = useState('') // Stores single assignee ID
    const [dueDate, setDuedate] = useState<number | null>(null) // Unix timestamp or null
    const [noteRemark, setNoteRemark] = useState('')
    const [additionalDescription, setAdditionalDescription] = useState('')

    const { boardMembers } = useTasksStore()

    const isEditing = !!taskToEdit;
    const showForm = isCreatingTask || isEditing;

    // Effect to populate form when taskToEdit changes or for a new task
    useEffect(() => {
        if (taskToEdit) {
            setTaskTitle(taskToEdit.task_title);
            setStatus(taskToEdit.status || statusList[0]);
            setPriority(taskToEdit.priority || priorityList[0]);
            setAssignee(taskToEdit.assign_to && taskToEdit.assign_to.length > 0 ? taskToEdit.assign_to[0] : '');
            setDuedate(taskToEdit.due_date ? dayjs(taskToEdit.due_date, 'YYYY-MM-DD').unix() : null);
            setNoteRemark(taskToEdit.note_remark || '');
            setAdditionalDescription(taskToEdit.additional_description || '');
        } else {
            // Reset form for new task creation or when edit mode is exited
            resetFormFields();
        }
    }, [taskToEdit]);

    // Effect to focus input when form becomes visible
    useEffect(() => {
        if (showForm && inputRef.current) {
            inputRef.current.focus();
        }
        if (!showForm) {
            setFocused(false); // Reset shadow effect if form is hidden
        }
    }, [showForm]);

    const resetFormFields = () => {
        setTaskTitle('');
        setStatus(statusList[0]);
        setPriority(priorityList[0]);
        setAssignee('');
        setDuedate(null);
        setNoteRemark('');
        setAdditionalDescription('');
    };

    const handleSubmit = () => {
        const finalTaskTitle = taskTitle.trim();
        
        // Basic validation for new tasks
        if (!isEditing && !finalTaskTitle) {
            // alert('Task title cannot be empty.'); // Or some other UI feedback
            inputRef.current?.focus();
            return;
        }

        const payload: NewTaskPayload = {
            // Conditionally add task_id only if it exists (for updates)
            ...(isEditing && taskToEdit?.task_id && { task_id: taskToEdit.task_id }),
            task_title: finalTaskTitle || (isEditing ? taskToEdit?.task_title || 'Untitled Task' : 'Untitled Task'), // Ensure title is not empty string
            user_id: 53, // Fixed value from requirement
            assign_to: assignee ? [assignee] : [], // API expects an array of IDs
            module_id: 5, // Fixed value
            module_name: 'company', // Fixed value
            company_ids: [1], // Fixed value
            status: status, // Already defaults to statusList[0]
            priority: priority, // Already defaults to priorityList[0]
            department_id: 2, // Fixed value
            due_date: dueDate ? dayjs.unix(dueDate).format('YYYY-MM-DD') : null,
            note_remark: noteRemark.trim(),
            additional_description: additionalDescription.trim(),
        };

        if (isEditing && onUpdateTask) {
            onUpdateTask(payload);
            // Parent component should handle UI changes post-update (e.g., closing editor, refreshing data)
        } else if (!isEditing) {
            onCreateTask(payload);
            resetFormFields(); // Reset for next potential task creation
            // Parent component should handle UI changes post-create (e.g., closing form, refreshing data)
            // Consider if onAddTaskClick(groupKey) should be called by parent to hide the form.
        }
    };

    if (!showForm) {
        return (
            <Button
                block
                icon={<TbPlus />}
                className="border-dashed border-2 hover:ring-transparent bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600" // Example styling, adjust as needed
                onClick={() => onAddTaskClick(groupKey)}
            >
                Add task
            </Button>
        );
    }

    return (
        <div
            className={classNames(
                'rounded-lg transition-shadow duration-150',
                focused && 'shadow-xl dark:shadow-2xl dark:shadow-slate-900', // Added dark mode shadow
            )}
        >
            <Table hoverable={false} overflow={false} className="mb-0">
                <TBody>
                    <Tr>
                        <Td className="w-[66px]"></Td>
                        <Td className="w-[40px] text-2xl align-middle">
                            <TbCircleCheck />
                        </Td>
                        <Td className="w-[500px]">
                            <input
                                ref={inputRef}
                                value={taskTitle}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskTitle(e.target.value)}
                                className="outline-0 font-semibold w-full heading-text bg-transparent py-3 dark:text-gray-100"
                                placeholder="Enter task name"
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                            />
                        </Td>
                        <Td className="w-[150px]">
                            <Dropdown
                                renderTitle={
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        {status ? (
                                            <Tag
                                                className={`${
                                                    status && labelClass[status]
                                                        ? labelClass[status]
                                                        : 'bg-gray-500 text-white' // Default tag style
                                                }`}
                                            >
                                                {status}
                                            </Tag>
                                        ) : (
                                            <span className="font-semibold dark:text-gray-100">Status</span>
                                        )}
                                        <TbChevronDown className="text-lg dark:text-gray-100" />
                                    </div>
                                }
                                placement="bottom-end"
                            >
                                {statusList.map((s_val) => (
                                    <Dropdown.Item
                                        key={s_val}
                                        eventKey={s_val}
                                        onSelect={setStatus}
                                    >
                                        <div className="flex items-center">
                                            <Badge innerClass={`${labelClass[s_val] || 'bg-gray-500'}`} />
                                            <span className="ml-2 rtl:mr-2">{s_val}</span>
                                        </div>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown>
                        </Td>
                        <Td className="w-[150px]">
                             <Dropdown
                                renderTitle={
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        {priority ? (
                                            <Tag
                                                className={`${
                                                    priority && labelClass[priority]
                                                        ? labelClass[priority]
                                                        : 'bg-gray-500 text-white' // Default tag style
                                                }`}
                                            >
                                                {priority}
                                            </Tag>
                                        ) : (
                                            <span className="font-semibold dark:text-gray-100">Priority</span>
                                        )}
                                        <TbChevronDown className="text-lg dark:text-gray-100" />
                                    </div>
                                }
                                placement="bottom-end"
                            >
                                {priorityList.map((p_val) => (
                                    <Dropdown.Item
                                        key={p_val}
                                        eventKey={p_val}
                                        onSelect={setPriority}
                                    >
                                        <div className="flex items-center">
                                            <Badge innerClass={`${labelClass[p_val] || 'bg-gray-500'}`} />
                                            <span className="ml-2 rtl:mr-2">{p_val}</span>
                                        </div>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown>
                        </Td>
                        <Td className="w-[150px]">
                            <div className="flex items-center gap-2 cursor-pointer relative max-w-[200px]">
                                <TbCalendar className="text-xl dark:text-gray-100" />
                                <span className="font-semibold dark:text-gray-100">
                                    {dueDate
                                        ? dayjs.unix(dueDate).format('DD MMM')
                                        : 'Due date'}
                                </span>
                                <DatePicker
                                    className="opacity-0 cursor-pointer absolute inset-0 w-full h-full"
                                    value={dayjs.unix(dueDate || dayjs().unix()).toDate()}
                                    inputtable={false}
                                    inputPrefix={null}
                                    inputSuffix={null}
                                    clearable={false} // If true, need to handle null from onChange
                                    onChange={(date) =>
                                        setDuedate(date ? dayjs(date as Date).unix() : null)
                                    }
                                />
                            </div>
                        </Td>
                        <Td className="py-1">
                            <div className="flex items-center justify-between">
                                <Dropdown
                                    placement="bottom"
                                    renderTitle={
                                        <div className="flex items-center gap-2 cursor-pointer">
                                            {assignee && boardMembers.find(m => m.id === assignee) ? (
                                                <>
                                                    <Avatar
                                                        shape="circle"
                                                        size="sm"
                                                        src={boardMembers.find(m => m.id === assignee)?.img}
                                                    />
                                                    <span className="font-bold heading-text dark:text-gray-100">
                                                        {boardMembers.find(m => m.id === assignee)?.name}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <TbUser className="text-xl dark:text-gray-100" />
                                                    <span className="font-semibold dark:text-gray-100">Assignee</span>
                                                </>
                                            )}
                                        </div>
                                    }
                                >
                                    {boardMembers.map((member) => (
                                        <Dropdown.Item
                                            key={member.id}
                                            eventKey={member.id}
                                            onSelect={setAssignee}
                                        >
                                            <div className="flex items-center">
                                                <Avatar shape="circle" size={22} src={member.img} />
                                                <span className="ml-2 rtl:mr-2">{member.name}</span>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown>
                                
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={handleSubmit}
                                >
                                    {isEditing ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </Td>
                    </Tr>
                    {/* New Row for Note/Remark and Additional Description */}
                    <Tr>
                        <Td className="w-[66px] py-1 align-top"></Td>
                        <Td className="w-[40px] py-1 align-top"></Td>
                        <Td colSpan={5} className="py-1 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                <div>
                                    <label htmlFor="note_remark_input" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Note/Remark
                                    </label>
                                    <input
                                        id="note_remark_input"
                                        type="text"
                                        className="mt-1 block w-full py-1.5 px-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={noteRemark}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNoteRemark(e.target.value)}
                                        placeholder="Enter note or remark"
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="additional_description_input" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Additional Description
                                    </label>
                                    <textarea
                                        id="additional_description_input"
                                        rows={2} // Increased rows for better usability
                                        className="mt-1 block w-full py-1.5 px-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={additionalDescription}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdditionalDescription(e.target.value)}
                                        placeholder="Enter additional details"
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                    />
                                </div>
                            </div>
                        </Td>
                    </Tr>
                </TBody>
            </Table>
        </div>
    );
};

export default AddTask;