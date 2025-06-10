import { useState, useRef } from 'react'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import ScrollBar from '@/components/ui/ScrollBar'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { BiTask } from 'react-icons/bi'
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import type { DropdownRef } from '@/components/ui/Dropdown'

// Define the structure for a single task
type Task = {
    id: string
    text: string
    completed: boolean
}

// The icon component that will be displayed in the header
const TaskToggle = ({ className }: { className?: string }) => {
    return (
        <div className={classNames('text-2xl', className)}>
            <BiTask />
        </div>
    )
}

// Main component logic
const _Tasks = ({ className }: { className?: string }) => {
    const [tasks, setTasks] = useState<Task[]>([
        // Some initial dummy data
        { id: '1', text: 'Review new design mockups', completed: false },
        { id: '2', text: 'Prepare for client presentation', completed: false },
        { id: '3', text: 'Deploy latest updates to staging', completed: true },
    ])
    const [dialogIsOpen, setDialogIsOpen] = useState(false)
    const [newTaskText, setNewTaskText] = useState('')
    const dropdownRef = useRef<DropdownRef>(null)

    const openDialog = () => setDialogIsOpen(true)
    const closeDialog = () => {
        setNewTaskText('') // Reset input on close
        setDialogIsOpen(false)
    }

    const handleAddTask = () => {
        if (newTaskText.trim() === '') return
        const newTask: Task = {
            id: `task-${Date.now()}`,
            text: newTaskText,
            completed: false,
        }
        setTasks((prevTasks) => [newTask, ...prevTasks])
        closeDialog()
    }

    const handleToggleTask = (taskId: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            )
        )
    }

    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter((task) => task.id !== taskId))
    }

    return (
        <>
            <Dropdown
                ref={dropdownRef}
                renderTitle={<TaskToggle className={className} />}
                menuClass="min-w-[280px] md:min-w-[340px] h-auto min-h-none"
                placement="bottom-end"
            >
                <div className="flex justify-between items-center mb-4">
                    <h6 className="mb-0">My Tasks</h6>
                    <Button
                        size="sm"
                        shape="circle"
                        variant="plain"
                        icon={<HiOutlinePlus className="text-lg" />}
                        onClick={openDialog}
                    />
                </div>

                <div className="w-full">
                    <ScrollBar className="overflow-y-auto max-h-[280px]">
                        {tasks.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/60"
                                    >
                                        <Checkbox
                                            checked={task.completed}
                                            onChange={() => handleToggleTask(task.id)}
                                        >
                                            <span
                                                className={classNames(
                                                    'font-semibold',
                                                    task.completed &&
                                                        'line-through text-gray-400 dark:text-gray-500'
                                                )}
                                            >
                                                {task.text}
                                            </span>
                                        </Checkbox>
                                        <Button
                                            size="xs"
                                            shape="circle"
                                            variant="plain"
                                            icon={<HiOutlineTrash />}
                                            onClick={() => handleDeleteTask(task.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No tasks yet. Add one!
                            </div>
                        )}
                    </ScrollBar>
                </div>
                <div className="w-full mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                    <Button className="w-full">View All Tasks</Button>
                </div>
            </Dropdown>

            {/* "Add New Task" Dialog */}
            <Dialog isOpen={dialogIsOpen} onClose={closeDialog}>
                <h5 className="mb-4">Add New Task</h5>
                <FormContainer>
                    <FormItem label="Task Description">
                        <Input
                            autoFocus
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        />
                    </FormItem>
                </FormContainer>
                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={closeDialog}
                    >
                        Cancel
                    </Button>
                    <Button variant="solid" onClick={handleAddTask}>
                        Add Task
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

// Wrap the component with the HOC and export it
const Tasks = withHeaderItem(_Tasks)

export default Tasks