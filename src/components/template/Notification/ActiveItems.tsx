import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FiRefreshCw } from 'react-icons/fi'
import { HiCheck, HiOutlineBell, HiOutlineOfficeBuilding, HiOutlinePuzzle, HiOutlineTag, HiOutlineUserGroup } from 'react-icons/hi'
import { LiaUserCheckSolid } from 'react-icons/lia'
import { MdOutlineGridView } from 'react-icons/md'
import { RiDeleteBinLine } from 'react-icons/ri' // --- NEW: Imported delete icon
import { useSelector } from 'react-redux'
import { z } from 'zod'

// --- UI Components ---
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Dropdown, { DropdownRef } from '@/components/ui/Dropdown'
import { Form as UiForm, FormItem as UiFormItem, Input, Select as UiSelect } from '@/components/ui/index'
import Notification from '@/components/ui/Notification'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import { Tag } from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import Tooltip from '@/components/ui/Tooltip'

// --- Redux & HOCs/Hooks ---
import { authSelector } from '@/reduxtool/auth/authSlice' // Assumed import for user data
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { addAllActionAction, getAllActionAction, deleteAllActionAction } from '@/reduxtool/master/middleware' // Assumed getAllModulesAction exists
import { useAppDispatch } from '@/reduxtool/store'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useResponsive from '@/utils/hooks/useResponsive'

// --- Types ---
type ActionItem = {
    id: number
    item: string
    module_name: string
    notes: string
    created_at: string
}
type ModuleItem = {
    id: number
    module_name: string
}
type GroupedActivityData = { [date: string]: ActionItem[] }

// ======================================================
//               CONFIGURATION & ZOD SCHEMA
// ======================================================

const activityContentHeight = 'h-[320px]'

// REFINED: Descriptive visual styles for different activity/module types.
const ACTIVITY_TYPE_STYLE: Record<string, { icon: JSX.Element; badgeClass: string; dotClass: string }> = {
    Companies: { icon: <HiOutlineOfficeBuilding />, badgeClass: 'bg-red-100 text-red-600', dotClass: 'bg-red-500' },
    Members: { icon: <HiOutlineUserGroup />, badgeClass: 'bg-green-100 text-green-600', dotClass: 'bg-green-500' },
    Products: { icon: <HiOutlineTag />, badgeClass: 'bg-blue-100 text-blue-600', dotClass: 'bg-blue-500' },
    Dashboard: { icon: <HiOutlinePuzzle />, badgeClass: 'bg-yellow-100 text-yellow-600', dotClass: 'bg-yellow-500' },
    default: { icon: <HiOutlineBell />, badgeClass: 'bg-gray-100 text-gray-500', dotClass: 'bg-gray-400' },
}

const activityFormSchema = z.object({
    item: z.string().min(3, 'Item name must be at least 3 characters.'),
    module_id: z.string({ required_error: 'Module is required.' }),
    notes: z.string().optional(),
})
type ActivityFormData = z.infer<typeof activityFormSchema>

// ======================================================
//           ADD ACTIVITY MODAL COMPONENT
// ======================================================

const AddActivityModal = ({ isOpen, onClose, onActivityAdded, allModules }: { isOpen: boolean; onClose: () => void; onActivityAdded: () => void; allModules: ModuleItem[] }) => {
    const dispatch = useAppDispatch()
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useSelector(authSelector) // Get the current user

    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<ActivityFormData>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: { item: '', module_id: undefined, notes: '' },
        mode: 'onChange',
    })

    const handleClose = () => {
        reset()
        onClose()
    }

    const moduleOptions = allModules.map((module) => ({
        label: module.module_name,
        value: module.id.toString(),
    }))

    const onFormSubmit = async (data: ActivityFormData) => {
        setIsLoading(true)
        const selectedModule = allModules.find((m) => m.id.toString() === data.module_id)

        if (!selectedModule || !user?.id) {
            toast.push(<Notification type="danger" title="Error" children="Invalid module or user not found." />)
            setIsLoading(false)
            return
        }

        const payload = {
            item: data.item,
            notes: data.notes || '',
            module_id: data.module_id,
            module_name: selectedModule.module_name,
            user_id: user.id,
        }

        try {
            await dispatch(addAllActionAction(payload)).unwrap()
            toast.push(<Notification type="success" title="Activity Added" />)
            onActivityAdded()
            handleClose()
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Add Activity" children={error?.message || 'An unknown error occurred.'} />)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose}>
            <h5 className="mb-4">Add New Activity</h5>
            <UiForm onSubmit={handleSubmit(onFormSubmit)}>
                <UiFormItem label="Item" invalid={!!errors.item} errorMessage={errors.item?.message}>
                    <Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Follow-up with Acme Corp" />} />
                </UiFormItem>
                <UiFormItem label="Module" invalid={!!errors.module_id} errorMessage={errors.module_id?.message}>
                    <Controller name="module_id" control={control} render={({ field }) => ( <UiSelect placeholder="Select a module" options={moduleOptions} value={moduleOptions.find((o) => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} /> )}/>
                </UiFormItem>
                <UiFormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
                    <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} />
                </UiFormItem>
                <div className="text-right mt-6">
                    <Button type="button" className="mr-2" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading} icon={<HiCheck />}>Save Activity</Button>
                </div>
            </UiForm>
        </Dialog>
    )
}

// ======================================================
//        VIEW ALL ACTIVITIES MODAL & SUB-COMPONENTS
// ======================================================

const CompactActivityItem = ({ activity, onDelete }: { activity: ActionItem; onDelete: (id: number) => void }) => {
    const { icon, badgeClass } = ACTIVITY_TYPE_STYLE[activity.module_name] || ACTIVITY_TYPE_STYLE.default
    return (
        <div className="flex items-center gap-4 py-3">
            <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center text-xl', badgeClass)}>{icon}</div>
            <div className="flex-grow">
                <p className="font-semibold leading-tight text-gray-800 dark:text-gray-100">{activity.item}</p>
                <p className="text-xs text-gray-500">{activity.notes}</p>
            </div>
            <div className="text-right flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{dayjs(activity.created_at).format('h:mm A')}</p>
                 {/* --- NEW: Delete button --- */}
                <Tooltip title="Delete">
                    <Button shape="circle" variant="plain" size="sm" icon={<RiDeleteBinLine />} onClick={() => onDelete(activity.id)} />
                </Tooltip>
            </div>
        </div>
    )
}

const DateDivider = ({ date }: { date: string }) => {
    const today = dayjs()
    const activityDate = dayjs(date)
    let displayDate = ''

    if (activityDate.isSame(today, 'day')) displayDate = 'Today'
    else if (activityDate.isSame(today.subtract(1, 'day'), 'day')) displayDate = 'Yesterday'
    else displayDate = activityDate.format('MMMM D, YYYY')

    return (
        <div className="flex items-center gap-3 my-3">
            <hr className="flex-grow border-gray-200 dark:border-gray-700" />
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{displayDate}</span>
            <hr className="flex-grow border-gray-200 dark:border-gray-700" />
        </div>
    )
}

const ViewAllActivityModal = ({ isOpen, onClose, groupedData, loading, availableModules, onDelete }: { isOpen: boolean; onClose: () => void; groupedData: GroupedActivityData; loading: boolean; availableModules: { label: string; value: string }[], onDelete: (id: number) => void }) => {
    const [moduleFilter, setModuleFilter] = useState<string | null>(null)

    const filteredAndSortedData = useMemo(() => {
        if (!groupedData) return {}
        const filtered: GroupedActivityData = {}
        for (const date in groupedData) {
            const activities = groupedData[date].filter((act) => !moduleFilter || act.module_name === moduleFilter)
            if (activities.length > 0) filtered[date] = activities
        }
        return filtered
    }, [groupedData, moduleFilter])

    const filterOptions = [{ value: '', label: 'All Modules' }, ...availableModules]
    const sortedDates = Object.keys(filteredAndSortedData).sort((a, b) => dayjs(b).diff(dayjs(a)))

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width="lg" contentClassName="flex flex-col">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <MdOutlineGridView className="text-xl" /> <h5 className="font-semibold text-lg">All Activities</h5>
            </div>
            <div className="p-6 flex flex-col min-h-0 flex-grow">
                <UiSelect placeholder="Filter by module..." options={filterOptions} isClearable className="mb-4" value={filterOptions.find((o) => o.value === moduleFilter)} onChange={(opt: any) => setModuleFilter(opt?.value || null)} />
                <div className="flex-grow min-h-0">
                    <ScrollBar autoHide style={{ maxHeight: '55vh' }}>
                        <div className="pr-2">
                            {loading && <div className="flex justify-center p-10"><Spinner /></div>}
                            {!loading && sortedDates.length === 0 && <EmptyState message="No activities found" />}
                            {!loading && sortedDates.map((date) => (
                                <div key={date}>
                                    <DateDivider date={date} />
                                    {filteredAndSortedData[date].map((activity) => <CompactActivityItem key={activity.id} activity={activity} onDelete={onDelete} />)}
                                </div>
                            ))}
                        </div>
                    </ScrollBar>
                </div>
            </div>
        </Dialog>
    )
}

// ======================================================
//        DROPDOWN & GENERIC SUB-COMPONENTS
// ======================================================

const ActivityToggle = ({ className }: { className?: string }) => (<div className={classNames('text-2xl', className)}><LiaUserCheckSolid /></div>)
const DynamicHeader = ({ title, onRefresh }: { title: string; onRefresh: (e: React.MouseEvent) => void }) => (
    <div className="flex items-center justify-between">
        <h6 className="font-bold">{title}</h6>
        <Tooltip title="Refresh"><Button shape="circle" variant="plain" size="sm" icon={<FiRefreshCw className="text-lg" />} onClick={onRefresh} /></Tooltip>
    </div>
)
const EmptyState = ({ message = 'No Recent Activity' }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center text-center h-full p-6 text-gray-500">
        <HiOutlineBell className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600" />
        <h6 className="font-semibold text-gray-600 dark:text-gray-200">{message}</h6>
        <p className="mt-1 text-sm">Everything is quiet for now.</p>
    </div>
)
const TimelineActivityItem = ({ activity, isLast, onDelete }: { activity: ActionItem; isLast: boolean, onDelete: (id: number) => void }) => {
    const { dotClass, badgeClass } = ACTIVITY_TYPE_STYLE[activity.module_name] || ACTIVITY_TYPE_STYLE.default
    return (
        <div className="relative pl-10 pr-4 py-2 group"> {/* --- NEW: Added 'group' for hover effect */}
            <div className={classNames('absolute top-5 left-[18px] -translate-x-1/2 w-3 h-3 rounded-full border-2 border-gray-50 dark:border-gray-800', dotClass)} />
            {!isLast && <div className="absolute top-6 left-[18px] -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-600" />}
            <div className="flex items-start justify-between">
                <p className="font-semibold heading-text -mt-1 flex-grow mr-3">{activity.item}</p>
                <div className="flex items-center gap-2"> {/* --- NEW: Wrapper for time and button */}
                    <span className="font-semibold text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">{dayjs(activity.created_at).format('h:mm A')}</span>
                    {/* --- NEW: Delete button, visible on group-hover --- */}
                    <Tooltip title="Delete">
                        <Button className="opacity-0 group-hover:opacity-100 transition-opacity" shape="circle" variant="plain" size="xs" icon={<RiDeleteBinLine />} onClick={() => onDelete(activity.id)} />
                    </Tooltip>
                </div>
            </div>
            <div className="mt-1"><Tag className={classNames('text-xs font-semibold', badgeClass)}>{activity.module_name}</Tag></div>
            {activity.notes && <p className="text-sm mt-2 text-gray-700 dark:text-gray-200">{activity.notes}</p>}
        </div>
    )
}

// ======================================================
//              MAIN DROPDOWN COMPONENT
// ======================================================
const _ActiveItems = ({ className }: { className?: string }) => {
    const [loading, setLoading] = useState(false)
    const [isAddModalOpen, setAddModalOpen] = useState(false)
    const [isViewAllModalOpen, setViewAllModalOpen] = useState(false)
    
    // --- NEW: State for delete confirmation ---
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

    const dispatch = useAppDispatch()
    const { larger } = useResponsive()
    const dropdownRef = useRef<DropdownRef>(null)

    const allActivities = (useSelector(masterSelector).getAllAction?.data as ActionItem[]) || []
    const allModules = (useSelector(masterSelector).getAllModules?.data as ModuleItem[]) || []

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            await Promise.all([dispatch(getAllActionAction())])
            setLoading(false)
        }
        fetchInitialData()
    }, [dispatch])

    const { groupedData, recentActivities, availableModules } = useMemo(() => {
        const sorted = [...allActivities].sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)))
        const grouped: GroupedActivityData = sorted.reduce((acc, activity) => {
            const dateKey = dayjs(activity.created_at).format('YYYY-MM-DD')
            if (!acc[dateKey]) acc[dateKey] = []
            acc[dateKey].push(activity)
            return acc
        }, {} as GroupedActivityData)
        const modules = [...new Set(allActivities.map((a) => a.module_name))].map((m) => ({ label: m, value: m }))
        return { groupedData: grouped, recentActivities: sorted.slice(0, 7), availableModules: modules }
    }, [allActivities])

    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        await Promise.all([dispatch(getAllActionAction())])
        setLoading(false)
    }

    const onDataChange = () => {
        setLoading(true)
        dispatch(getAllActionAction()).finally(() => setLoading(false))
    }

    const handleOpenAddModal = () => {
        dropdownRef.current?.handleDropdownClose()
        setAddModalOpen(true)
    }

    const handleOpenViewAllModal = () => {
        dropdownRef.current?.handleDropdownClose()
        setViewAllModalOpen(true)
    }
    
    // --- NEW: Functions for deletion flow ---
    const handleDeleteRequest = (id: number) => {
        // Close dropdown if open
        dropdownRef.current?.handleDropdownClose();
        setDeleteConfirmation({ open: true, id });
    };

    const handleCancelDelete = () => {
        setDeleteConfirmation({ open: false, id: null });
    };

    const handleConfirmDelete = async () => {
        const idToDelete = deleteConfirmation.id
        if (!idToDelete) return

        setIsDeleting(true)
        try {
            await dispatch(deleteAllActionAction({ id: idToDelete })).unwrap()
            toast.push(<Notification type="success" title="Activity Deleted" />)
            onDataChange() // Refresh data
            handleCancelDelete() // Close confirmation dialog
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Delete" children={error?.message || 'An unknown error occurred.'} />)
        } finally {
            setIsDeleting(false)
        }
    };


    return (
        <>
            <Dropdown ref={dropdownRef} renderTitle={<ActivityToggle className={className} />} menuClass="!p-0 min-w-[340px] md:min-w-[420px] bg-gray-50 dark:bg-gray-800" placement={larger.md ? 'bottom-end' : 'bottom'}>
                <Dropdown.Item variant="header" className="!px-4 !py-3">
                    <DynamicHeader title="Recent Activity" onRefresh={handleRefresh} />
                </Dropdown.Item>
                <ScrollBar className={classNames('overflow-y-auto', activityContentHeight)}>
                    {loading && <div className="flex items-center justify-center h-full"><Spinner size={40} /></div>}
                    {!loading && recentActivities.length === 0 && <EmptyState />}
                    {!loading && recentActivities.length > 0 && (
                        <div className="py-5">
                            {recentActivities.map((activity, index) => <TimelineActivityItem key={activity.id} activity={activity} isLast={index === recentActivities.length - 1} onDelete={handleDeleteRequest} />)}
                        </div>
                    )}
                </ScrollBar>
                <Dropdown.Item variant="footer" className="!p-3 !border-t-0">
                    <div className="flex gap-2 w-full">
                        <Button block onClick={handleOpenViewAllModal}>View All</Button>
                        {/* <Button block variant="solid" onClick={handleOpenAddModal}>Add New</Button> */}
                    </div>
                </Dropdown.Item>
            </Dropdown>
            
            {/* --- NEW: Add and View Modals are now passed the data change handler --- */}
            <AddActivityModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onActivityAdded={onDataChange} allModules={allModules} />
            <ViewAllActivityModal isOpen={isViewAllModalOpen} onClose={() => setViewAllModalOpen(false)} groupedData={groupedData} loading={loading} availableModules={availableModules} onDelete={handleDeleteRequest} />
            
            {/* --- NEW: Delete Confirmation Dialog --- */}
            <Dialog
                isOpen={deleteConfirmation.open}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
            >
                <h5 className="mb-4">Confirm Deletion</h5>
                <p>Are you sure you want to delete this activity? This action cannot be undone.</p>
                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color="red-600"
                        onClick={handleConfirmDelete}
                        loading={isDeleting}
                    >
                        Confirm Delete
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

const ActiveItems = withHeaderItem(_ActiveItems)
export default ActiveItems