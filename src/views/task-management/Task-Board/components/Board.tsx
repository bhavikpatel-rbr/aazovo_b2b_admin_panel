import React, { lazy, Suspense, useState, useEffect, useRef, ChangeEvent, CSSProperties, Ref, useMemo, useCallback } from 'react';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import reorderDragable from '@/utils/reorderDragable';
import sleep from '@/utils/sleep';
import reoderArray from '@/utils/reoderArray';
import {
    Droppable,
    DragDropContext,
    Draggable,
    DraggableChildrenFn,
    DroppableProvided,
    DraggableProvidedDragHandleProps,
} from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodType } from "zod";
import cloneDeep from "lodash/cloneDeep";
import debounce from 'lodash/debounce';
import wildCardSearch from '@/utils/wildCardSearch';
import classNames from '@/utils/classNames';
import dayjs from 'dayjs';
import isEmpty from 'lodash/isEmpty';
import { useNavigate } from 'react-router-dom';

// UI Components
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card, { CardProps } from '@/components/ui/Card';
import Checkbox from "@/components/ui/Checkbox";
import CloseButton from '@/components/ui/CloseButton';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Dropdown from '@/components/ui/Dropdown';
import EllipsisButton from '@/components/shared/EllipsisButton';
import { Form, FormItem } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import ScrollBar from '@/components/ui/ScrollBar';
import Select from "@/components/ui/Select";
import Tag from '@/components/ui/Tag';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Segment from '@/components/ui/Segment';
import DatePicker from '@/components/ui/DatePicker';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';

// Shared Components
import IconText from '@/components/shared/IconText';
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup';

// Icons
import { TbPaperclip, TbMessageCircle, TbSearch, TbPencil, TbCirclePlus, TbTrash, TbCircleXFilled, TbPlus, TbUserPlus, TbSettings, TbDownload, TbUserSearch, TbList, TbLayoutKanban, TbEye } from 'react-icons/tb';

// Store & Utils
import { useScrumBoardStore } from '../store/scrumBoardStore';
import { createCardObject, createUID } from '../utils';
import { getAllTaskByStatuesAction, updateTaskStatusAPI } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { config } from "@/utils/config";
import { encryptStorage } from '@/utils/secureLocalStorage';

// --- Type Definitions ---
export type Member = { id: string; name: string; email: string; img: string; };
export type Comment = { id: string; name: string; src: string; message: string; date: string | Date; };
export type Attachment = { id: string; name: string; src: string; size: string; };
export type Ticket = {
    id: string; name: string; description?: string; dueDate?: string | Date; labels?: string[];
    members: Member[]; comments?: Comment[]; attachments?: Attachment[]; priority?: string; category?: string;
    _originalData?: any;
};
export type Columns = Record<string, Ticket[]>;
export interface TaskWithStatus extends Ticket { status: string; }

// --- Constants and Color Mappings ---
export const taskLabelColors: Record<string, string> = {
    'Urgent': 'bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-200',
    'High': 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200',
    'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200',
    'Low': 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200',
    'Feature Request': 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200',
    'Bug': 'bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-200',
    'Improvement': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200',
    'Task': 'bg-gray-100 text-gray-700 dark:bg-gray-600/30 dark:text-gray-200',
    'Not Started': 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-100',
    'Pending': 'bg-yellow-200 text-yellow-700 dark:bg-yellow-600/40 dark:text-yellow-100',
    'In Progress': 'bg-blue-200 text-blue-700 dark:bg-blue-600/40 dark:text-blue-100',
    'On Hold': 'bg-orange-200 text-orange-700 dark:bg-orange-600/40 dark:text-orange-100',
    'Review': 'bg-teal-200 text-teal-700 dark:bg-teal-600/40 dark:text-teal-100',
    'Completed': 'bg-green-200 text-green-700 dark:bg-green-600/40 dark:text-green-100',
    'Cancelled': 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 line-through',
    'default': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};
const labelList = [ { value: 'Feature Request', label: 'Feature Request' }, { value: 'Bug', label: 'Bug' }, { value: 'Improvement', label: 'Improvement' }, { value: 'Task', label: 'Task' }, { value: 'Urgent', label: 'Urgent' }, ];
export type BoardProps = { containerHeight?: boolean; useClone?: DraggableChildrenFn; isCombineEnabled?: boolean; withScrollableColumns?: boolean; };


// --- HOISTED HELPER FUNCTION ---
const transformApiTaskToTicket = (apiTask: any): Ticket => {
    return {
        id: apiTask.id.toString(), name: apiTask.task_title, description: apiTask.additional_description || apiTask.note_remark || '',
        dueDate: apiTask.due_data ? new Date(apiTask.due_data).toISOString() : undefined, labels: apiTask.status ? [apiTask.status] : [],
        members: (apiTask.assign_to_users || []).map((user: any) => ({ id: user.id.toString(), name: user.name, email: user.email || `user-${user.id}@example.com`, img: user.profile_pic_path || '' })),
        comments: (apiTask.activity_notes || []).map((note: any) => ({ id: note?.id?.toString(), name: note?.user?.name, src: note?.user?.profile_pic_path || '', message: note?.activity_comment, date: new Date(note?.created_at).toISOString() })),
        attachments: (apiTask.attachments || []).map((att: any) => ({ id: att.id.toString(), name: att.attachment_name, src: att.attachment_path, size: att.attachment_type })),
        priority: apiTask.priority, category: apiTask.department_info?.name || apiTask.module_name,
        _originalData: apiTask,
    };
};

// --- ALL SUB-COMPONENTS ---
interface TransformedComment extends Omit<Comment, 'date'> { date: Date; }
const createCommentObject = (message: string): TransformedComment => ({ id: createUID(10), name: 'Angelina Gotelli', src: '/img/avatars/thumb-1.jpg', message: message, date: new Date(), });
const ActualTicketContent = ({ onTicketClose }: { onTicketClose: () => void }) => {
    const { updateColumns, ticketId, columns, boardMembers } = useScrumBoardStore();
    const [ticketData, setTicketData] = useState<Partial<Ticket & { comments: TransformedComment[] }>>({});
    const [loading, setLoading] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const getTicketDetail = useCallback(async () => {
        setLoading(true); await sleep(200); let ticketDetail: Partial<Ticket> = {};
        for (const key in columns) { if (Object.hasOwnProperty.call(columns, key)) { const board = columns[key]; const result = board.find((ticket) => ticket.id === ticketId); if (result) { ticketDetail = cloneDeep(result); break; } } }
        if (ticketDetail.comments) { const transformedComments = ticketDetail.comments.map(c => ({...c, date: new Date(c.date)})) as TransformedComment[]; setTicketData({...ticketDetail, comments: transformedComments}); } else { setTicketData({...ticketDetail, comments: []}); }
        setLoading(false);
    }, [ticketId, columns]);
    useEffect(() => { if (ticketId) { getTicketDetail(); } }, [ticketId, getTicketDetail]);
    const onUpdateTicketField = (field: keyof Ticket, value: any) => setTicketData(prev => ({...prev, [field]: value}));
    const onSaveChanges = () => {
        if (isEmpty(ticketData) || !ticketData.id) return; const data = cloneDeep(columns); let updated = false;
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const board = data[key]; const ticketIndex = board.findIndex(t => t.id === ticketData.id);
                if (ticketIndex !== -1) {
                    const finalTicketData: Ticket = { id: ticketData.id!, name: ticketData.name || "Untitled Ticket", members: ticketData.members || [], description: ticketData.description, dueDate: ticketData.dueDate, labels: ticketData.labels, comments: (ticketData.comments || []).map(c => ({...c, date: c.date.toISOString()})), attachments: ticketData.attachments, priority: ticketData.priority, category: ticketData.category, _originalData: ticketData._originalData };
                    data[key][ticketIndex] = finalTicketData; updated = true; break;
                }
            }
        }
        if(updated) updateColumns(data); onTicketClose();
    };
    const submitComment = () => {
        if (commentInputRef.current) {
            const message = commentInputRef.current.value.trim(); if (!message) return;
            const comment = createCommentObject(message); setTicketData(prev => ({ ...prev, comments: [...(prev.comments || []), comment] })); commentInputRef.current.value = '';
        }
    };
    const onAddMemberClick = (memberId: string) => { const newMember = boardMembers.find((m) => m.id === memberId); if (newMember) { setTicketData(prev => ({ ...prev, members: [...(prev.members || []), newMember] })); } };
    const onRemoveMember = (memberId: string) => { setTicketData(prev => ({ ...prev, members: (prev.members || []).filter(m => m.id !== memberId) })); };
    const onAddLabelClick = (labelValue: string) => { const currentLabels = ticketData.labels || []; if (!currentLabels.includes(labelValue)) { setTicketData(prev => ({ ...prev, labels: [...currentLabels, labelValue] })); } };
    const onRemoveLabel = (labelValue: string) => { setTicketData(prev => ({...prev, labels: (prev.labels || []).filter(l => l !== labelValue)})); };
    
    if (loading) { return <div className="flex justify-center items-center min-h-[400px] p-6"><Spinner size={40} className="text-sky-500" /></div>; }
    if (isEmpty(ticketData) || !ticketData.id) { return <div className="flex flex-col justify-center items-center min-h-[400px] p-6 text-center"><TbCircleXFilled className="text-red-500 text-5xl mb-4" /><p className="text-slate-700 dark:text-slate-200 text-lg font-semibold">Ticket Not Found</p><p className="text-slate-500 dark:text-slate-400">The requested ticket could not be loaded.</p></div>; }
    
    return (
        <div className="flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start"><Input className="border-none hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-sky-500 text-xl font-semibold !p-1" variant="plain" value={ticketData.name} onChange={(e) => onUpdateTicketField('name', e.target.value)} /><CloseButton onClick={onTicketClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" /></div>
            <ScrollBar className="flex-grow overflow-y-auto"><div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6 p-5">
                <div className="lg:col-span-2 space-y-6">
                    <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label><Input textArea rows={4} placeholder="Add a detailed description..." value={ticketData.description || ''} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onUpdateTicketField('description', e.target.value)} className="mt-1.5" /></div>
                    <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</label>
                        {(ticketData.comments || []).map((comment) => (<div key={comment.id} className="mt-4 flex items-start space-x-3"><Avatar shape="circle" size={32} src={comment.src} name={comment.name} /><div className="flex-1 p-3.5 rounded-lg bg-slate-100 dark:bg-slate-700/70"><div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{comment.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{dayjs(comment.date).format('MMM DD, YYYY h:mm A')}</span></div><p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{comment.message}</p></div></div>))}
                        <div className="mt-5 flex items-start space-x-3"><Avatar shape="circle" size={32} src="/img/avatars/thumb-1.jpg" /><div className="flex-1 relative"><Input ref={commentInputRef as any} textArea rows={3} placeholder="Add a comment..." className="w-full" /><div className="absolute bottom-2.5 right-2.5"><Button size="sm" variant="solid" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={submitComment}>Send</Button></div></div></div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned to</label>
                        <div className="flex flex-col gap-2 mt-1.5">
                            {(ticketData.members || []).map(member => (<div key={member.id} className="flex items-center justify-between p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/60"><div className="flex items-center gap-2"><Avatar shape="circle" size={28} src={member.img} name={member.name} /><span className="text-sm font-semibold">{member.name}</span></div><CloseButton size="xs" onClick={() => onRemoveMember(member.id)} /></div>))}
                            <Dropdown renderTitle={<Button size="sm" variant='plain' className="w-full !justify-start p-1" icon={<TbUserPlus />}>Add Assignee</Button>}>
                                {boardMembers.filter(m => !(ticketData.members || []).some(tm => tm.id === m.id)).map(member => (<Dropdown.Item key={member.id} onSelect={() => onAddMemberClick(member.id)}>{member.name}</Dropdown.Item>))}
                            </Dropdown>
                        </div>
                    </div>
                    <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</label><DatePicker value={ticketData.dueDate ? new Date(ticketData.dueDate) : null} onChange={(date) => onUpdateTicketField('dueDate', date)} className="mt-1.5" size="sm" /></div>
                    <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</label><Select size="sm" className="mt-1.5" placeholder="Select priority..." options={[{label: "Low", value: "Low"}, {label: "Medium", value: "Medium"}, {label: "High", value: "High"}, {label: "Urgent", value: "Urgent"}]} value={ticketData.priority ? {label: ticketData.priority, value: ticketData.priority} : null} onChange={(option) => onUpdateTicketField('priority', option?.value)}/></div>
                    <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Labels</label>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {(ticketData.labels || []).map(label => (<Tag key={label} className={`${taskLabelColors[label] || 'bg-gray-100'} cursor-pointer`} suffix={<CloseButton size="xs" onClick={(e) => { e.stopPropagation(); onRemoveLabel(label);}} />} suffixClass="ml-2 rtl:mr-2">{label}</Tag>))}
                            <Dropdown renderTitle={<Tag className="border-dashed cursor-pointer" prefix={<TbPlus size={12}/>}>Add</Tag>}>
                                {labelList.filter(l => !(ticketData.labels || []).includes(l.value)).map(label => (<Dropdown.Item key={label.value} onSelect={() => onAddLabelClick(label.value)}>{label.label}</Dropdown.Item>))}
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div></ScrollBar>
            <div className="px-5 pb-5 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-x-2"><Button size="sm" onClick={onTicketClose}>Cancel</Button><Button variant="solid" size="sm" onClick={onSaveChanges}>Save Changes</Button></div>
        </div>
    );
};
interface ScrumBoardHeaderProps { boardMembers?: Member[]; currentView: 'board' | 'list'; onViewChange: (view: 'board' | 'list') => void; }
const ScrumBoardHeader = ({ boardMembers = [], currentView, onViewChange }: ScrumBoardHeaderProps) => {
    const viewOptions = [ { value: 'board', label: 'Board', icon: <TbLayoutKanban className="text-lg" /> }, { value: 'list', label: 'List', icon: <TbList className="text-lg" /> }, ];
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-1">
            <div className="flex-1"><h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 ml-5">Task Board</h3></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-shrink-0">
                    <Segment value={currentView} onChange={(val) => onViewChange(val as 'board' | 'list')} size="sm" className="min-w-[180px]">
                        {viewOptions.map(option => (<Segment.Item key={option.value} value={option.value}><span className="flex items-center justify-center gap-2">{option.icon}{option.label}</span></Segment.Item>))}
                    </Segment>
                </div>
            </div>
        </div>
    );
};
type RenameBoardFormSchema = { title: string };
const RenameForm = ({ title, closeRenameForm }: { title: string, closeRenameForm: () => void }) => { const { setFocus } = useForm<RenameBoardFormSchema>({ defaultValues: { title } }); useEffect(() => { setFocus('title') }, [setFocus]); return <Input defaultValue={title} onBlur={closeRenameForm} autoFocus />; };
const BoardTitle = (props: { dragHandleProps?: DraggableProvidedDragHandleProps | null; title: string; taskCount: number; }) => {
    const { dragHandleProps, title, taskCount } = props;
    return (
        <div className="board-title px-3.5 py-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 cursor-grab" {...dragHandleProps}>
            <div className="flex items-center gap-2"><h6 className="font-semibold text-base text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={title}>{title}</h6><Badge innerClass="bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200">{taskCount}</Badge></div>
            <EllipsisButton />
        </div>
    );
};
interface BoardCardProps extends CardProps { data: Ticket; ref?: Ref<HTMLDivElement>; onEdit: (task: Ticket) => void; }
const BoardCard = React.forwardRef<HTMLDivElement, BoardCardProps>((props, ref) => {
    const { openDialog, updateDialogView, setSelectedTicketId } = useScrumBoardStore();
    const { data, onEdit, ...rest } = props;
    const { id, name, comments, attachments, members, labels, priority } = data;
    const onViewDetails = () => { openDialog(); updateDialogView('TICKET'); setSelectedTicketId(id); };
    return (
        <Card ref={ref} className="hover:shadow-xl transition-shadow duration-200 rounded-lg mb-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" bodyClass="p-4 flex flex-col" {...rest}>
            <div className="flex justify-between items-start mb-2.5">
                <h6 className="font-semibold text-base text-slate-800 dark:text-slate-100 leading-tight break-words cursor-pointer hover:text-sky-600 dark:hover:text-sky-400" onClick={onViewDetails}>{name}</h6>
                <Dropdown placement="bottom-end" renderTitle={<EllipsisButton />}><Dropdown.Item eventKey="view" onClick={onViewDetails} className="gap-2"><TbEye />View Details</Dropdown.Item><Dropdown.Item eventKey="edit" onClick={() => onEdit(data)} className="gap-2"><TbPencil />Edit Task</Dropdown.Item></Dropdown>
            </div>
            {(labels && labels.length > 0 || priority) && (<div className="mb-3 flex flex-wrap gap-1.5 items-center">{priority && <Tag className={taskLabelColors[priority] || taskLabelColors.default}>Priority: {priority}</Tag>}{labels?.map((label) => <Tag key={label} className={`${taskLabelColors[label] || taskLabelColors.default}`}>{label}</Tag>)}</div>)}
            <div className="flex items-center justify-between mt-auto pt-2"><UsersAvatarGroup avatarProps={{ size: 28, className:"ring-1 ring-white dark:ring-slate-800" }} users={members || []} /><div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">{comments && comments.length > 0 && <IconText className="gap-1 items-center" icon={<TbMessageCircle className="text-base" />}>{comments.length}</IconText>}{attachments && attachments.length > 0 && <IconText className="gap-1 items-center" icon={<TbPaperclip className="text-base" />}>{attachments.length}</IconText>}</div></div>
        </Card>
    );
});
interface InnerListProps { dropProvided: DroppableProvided; contents?: Ticket[]; onEdit: (task: Ticket) => void; useClone?: DraggableChildrenFn; isCombineEnabled?: boolean; };
const InnerList = React.memo(function InnerList(props: InnerListProps) {
    const { dropProvided, contents, onEdit, ...rest } = props;
    return (
        <div ref={dropProvided.innerRef} className="board-dropzone h-full pt-1"><div className="px-3.5 h-full">
            {contents?.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(dragProvided, dragSnapshot) => ( <BoardCard ref={dragProvided.innerRef} data={item} onEdit={onEdit} {...rest} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} style={{ ...dragProvided.draggableProps.style, opacity: dragSnapshot.isDragging ? 0.85 : 1, transform: dragSnapshot.isDragging ? `${dragProvided.draggableProps.style?.transform} rotate(1deg)` : dragProvided.draggableProps.style?.transform }}/> )}
                </Draggable>
            ))}
            {dropProvided.placeholder}
        </div></div>
    );
});
interface BoardCardListProps { contents?: Ticket[]; onEdit: (task: Ticket) => void; ignoreContainerClipping?: boolean; internalScroll?: boolean; scrollContainerStyle?: CSSProperties; isDropDisabled?: boolean; listId?: string; style?: CSSProperties; listType?: string; className?: string; useClone?: DraggableChildrenFn; isCombineEnabled?: boolean; }
const BoardCardList = (props: BoardCardListProps) => {
    const { listId = 'LIST', contents, onEdit, ...rest } = props;
    return (
        <Droppable droppableId={listId} type={rest.listType} ignoreContainerClipping={rest.ignoreContainerClipping} isDropDisabled={rest.isDropDisabled} isCombineEnabled={rest.isCombineEnabled} renderClone={rest.useClone}>
            {(dropProvided, dropSnapshot) => (
                <div style={rest.style} className={classNames("board-wrapper flex-auto transition-colors duration-200", rest.className, dropSnapshot.isDraggingOver ? 'bg-sky-50 dark:bg-sky-900/30' : 'bg-transparent')} {...dropProvided.droppableProps}>
                    {rest.internalScroll ? (<ScrollBar className="board-scrollContainer overflow-y-auto h-full" style={rest.scrollContainerStyle}><InnerList contents={contents} dropProvided={dropProvided} {...rest} onEdit={onEdit} /></ScrollBar>) : (<InnerList contents={contents} dropProvided={dropProvided} {...rest} onEdit={onEdit} />)}
                </div>
            )}
        </Droppable>
    );
};
interface BoardColumnProps { title: string; contents?: Ticket[]; index: number; onEdit: (task: Ticket) => void; isScrollable?: boolean; isCombineEnabled?: boolean; useClone?: DraggableChildrenFn; }
const BoardColumn = (props: BoardColumnProps) => {
    const { title, contents, index, onEdit, ...rest } = props;
    const taskCount = contents?.length || 0;
    return (
        <Draggable draggableId={title} index={index}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} className={classNames("board-column flex flex-col min-w-[320px] w-[320px] max-w-[320px] rounded-xl shadow-sm transition-shadow duration-200", "bg-slate-100 dark:bg-slate-800/60 border border-transparent", snapshot.isDragging ? "shadow-2xl border-sky-400 dark:border-sky-600 ring-2 ring-sky-300 dark:ring-sky-700 bg-slate-200 dark:bg-slate-800" : "hover:shadow-md")} {...provided.draggableProps}>
                    <BoardTitle title={title} taskCount={taskCount} dragHandleProps={provided.dragHandleProps} />
                    <BoardCardList listId={title} listType="CONTENT" contents={contents} {...rest} onEdit={onEdit} />
                </div>
            )}
        </Draggable>
    );
};
interface TaskListViewProps { tasks: TaskWithStatus[]; onEdit: (task: TaskWithStatus) => void; }
const ActualTaskListView: React.FC<TaskListViewProps> = ({ tasks, onEdit }) => {
    const { openDialog, updateDialogView, setSelectedTicketId } = useScrumBoardStore();
    const handleViewTicket = (ticketId: string) => { openDialog(); updateDialogView('TICKET'); setSelectedTicketId(ticketId); };
    if (!tasks || tasks.length === 0) { return <Card className="mt-6"><div className="text-center py-10 text-slate-500 dark:text-slate-400">No tasks to display.</div></Card>; }
    return (
        <Card className="mt-6 shadow-sm border border-slate-200 dark:border-slate-700" bodyClass="p-0"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task Title</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assignees</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th></tr></thead>
            <tbody className="bg-white dark:bg-slate-800/80 divide-y divide-slate-200 dark:divide-slate-700">
                {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 cursor-pointer" onClick={() => handleViewTicket(task.id)}>{task.name}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><Tag className={taskLabelColors[task.status] || taskLabelColors.default}>{task.status}</Tag></td>
                        <td className="px-6 py-4 whitespace-nowrap">{task.priority ? <Tag className={taskLabelColors[task.priority] || taskLabelColors.default}>{task.priority}</Tag> : <span className="text-xs text-slate-400">-</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{task.members && task.members.length > 0 ? <UsersAvatarGroup avatarProps={{ size: 28, className:"ring-1 ring-white dark:ring-slate-800" }} users={task.members} /> : <span className="text-xs text-slate-400">Unassigned</span>}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{task.dueDate ? dayjs(task.dueDate).format('MMM DD, YYYY') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><Tooltip title="View Details"><Button shape="circle" size="sm" variant="plain" icon={<TbEye />} onClick={() => handleViewTicket(task.id)} className="text-slate-500 hover:text-sky-600" /></Tooltip><Tooltip title="Edit Task"><Button shape="circle" size="sm" variant="plain" icon={<TbPencil />} onClick={() => onEdit(task)} className="text-slate-500 hover:text-emerald-600" /></Tooltip></td>
                    </tr>
                ))}
            </tbody>
        </table></div></Card>
    );
};


// --- Main Board Component ---
const Board = (props: BoardProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { columns, ordered, boardMembers, updateOrdered, updateColumns, dialogView, dialogOpen, ticketId } = useScrumBoardStore();
    const { containerHeight, useClone, isCombineEnabled, withScrollableColumns } = props;
    const [currentView, setCurrentView] = useState<'board' | 'list'>('board');
    const [loggedInUserData, setLoggedInUserData] = useState<any>(null);

    const DEFAULT_BOARD_STATUSES = [ "Not Started", "Pending", "In Progress", "On Hold", "Review", "Completed", "Cancelled" ];
    const { AllTaskDataByStatues = {}, status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

    useEffect(() => { 
        dispatch(getAllTaskByStatuesAction()); 
        setLoggedInUserData(encryptStorage.getItem("UserData", !config.useEncryptApplicationStorage));
    }, [dispatch]);
    
    useEffect(() => {
        if (masterLoadingStatus === 'succeeded' || (masterLoadingStatus === 'idle' && !isEmpty(AllTaskDataByStatues))) {
            const newColumns: Columns = {};
            const safeApiData = (AllTaskDataByStatues && typeof AllTaskDataByStatues === 'object' && !Array.isArray(AllTaskDataByStatues)) ? AllTaskDataByStatues : {};
            DEFAULT_BOARD_STATUSES.forEach(statusKey => {
                const apiTasksForStatus: any[] = safeApiData[statusKey];
                newColumns[statusKey] = Array.isArray(apiTasksForStatus) ? apiTasksForStatus.map(transformApiTaskToTicket) : [];
            });
            updateColumns(newColumns);
            updateOrdered([...DEFAULT_BOARD_STATUSES]);
        }
    }, [AllTaskDataByStatues, masterLoadingStatus, updateColumns, updateOrdered]);

    const TicketContent = lazy(() => Promise.resolve({ default: ActualTicketContent }));
    const TaskListView = lazy(() => Promise.resolve({ default: ActualTaskListView }));
    const AddNewColumnContent = lazy(() => Promise.resolve({ default: ActualAddNewColumnContent }));
    const AddNewMemberContent = lazy(() => Promise.resolve({ default: ActualAddNewMemberContent }));
    const AddNewTicketContent = lazy(() => Promise.resolve({ default: ActualAddNewTicketContent }));

    const allTicketsFlat: TaskWithStatus[] = useMemo(() => {
        if (isEmpty(columns) || !ordered || ordered.length === 0) return [];
        return ordered.reduce((acc, statusKey) => acc.concat( (columns[statusKey] || []).map(task => ({ ...task, status: statusKey })) ), [] as TaskWithStatus[]);
    }, [columns, ordered]);

    const handleEdit = useCallback( (task: Ticket) => { navigate(`/task/task-list/create/${task.id}`, { state: { taskToEdit: task } }); }, [navigate] );
    const onDialogClose = async () => { useScrumBoardStore.getState().closeDialog(); await sleep(200); useScrumBoardStore.getState().resetView(); };
    const handleViewChange = (view: 'board' | 'list') => setCurrentView(view);
     
    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId, type } = result;
        if (!destination) return;
        if (type === 'COLUMN') { /* ... */ return; }
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;
        
        const data = reorderDragable<Record<string, Ticket[]>>({ quoteMap: columns, source, destination });
        updateColumns(data.quoteMap);

        if (source.droppableId !== destination.droppableId) {
            if (!loggedInUserData?.id) {
                toast.push(<Notification type="danger" title="Authentication Error">Could not verify user. Please refresh.</Notification>);
                dispatch(getAllTaskByStatuesAction());
                return;
            }
            const taskId = parseInt(draggableId, 10);
            if (isNaN(taskId)) { dispatch(getAllTaskByStatuesAction()); return; }
            
            const newStatusDisplay = destination.droppableId;
            const newStatusApi = newStatusDisplay.replace(/ /g, '_');

            const payload = { user_id: loggedInUserData.id, id: taskId, status: newStatusApi, }; 

            try {
                await dispatch(updateTaskStatusAPI(payload)).unwrap();
                toast.push(<Notification type="success" title="Status Updated" duration={2000} />);
            } catch (error: any) {
                toast.push(<Notification type="danger" title="Update Failed">Could not save task status. Reverting.</Notification>);
                dispatch(getAllTaskByStatuesAction());
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <Card className="h-full shadow-none bg-transparent" bodyClass="h-full flex flex-col p-0">
                <ScrumBoardHeader currentView={currentView} onViewChange={handleViewChange} />
                {masterLoadingStatus === 'loading' && currentView === 'board' && (
                     <div className="flex justify-center items-center py-20"><Spinner size={50} className="text-sky-500"/><p className="ml-3 text-slate-600 dark:text-slate-300">Loading board...</p></div>
                )}
                 {(masterLoadingStatus !== 'loading' || currentView === 'list') && ( 
                    <>
                        {currentView === 'board' && (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="board" type="COLUMN" direction="horizontal" ignoreContainerClipping={Boolean(containerHeight)} isCombineEnabled={isCombineEnabled}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} className="scrumboard flex flex-auto w-full" {...provided.droppableProps}>
                                            <div className="scrumboard-body flex flex-nowrap overflow-x-auto pb-4 gap-5 items-start">
                                                {ordered.map((key, index) => (
                                                    columns[key] ? ( <BoardColumn key={key} index={index} title={key} contents={columns[key]} isScrollable={withScrollableColumns} isCombineEnabled={isCombineEnabled} useClone={useClone} onEdit={handleEdit} /> ) : null
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                        {currentView === 'list' && (
                            <Suspense fallback={ <div className="p-10 text-center">Loading...</div> }>
                                <TaskListView tasks={allTicketsFlat} onEdit={handleEdit} />
                            </Suspense>
                        )}
                    </>
                 )}
            </Card>
            <Dialog isOpen={dialogOpen} width={dialogView === 'TICKET' ? 1000 : 480} contentClassName="shadow-xl rounded-xl" dialogStyle={{ content: { padding: 0 } }} closable={false} onClose={onDialogClose} onRequestClose={onDialogClose}>
                <Suspense fallback={ <div className="p-10 text-center"><Spinner size="xl" /></div> }>
                    {dialogView === 'TICKET' && ticketId && <TicketContent onTicketClose={onDialogClose} />}
                    {dialogView === 'NEW_TICKET' && <div className="p-6"><AddNewTicketContent /></div>}
                    {dialogView === 'NEW_COLUMN' && <div className="p-6"><AddNewColumnContent /></div>}
                    {dialogView === 'ADD_MEMBER' && <div className="p-6"><AddNewMemberContent /></div>}
                </Suspense>
            </Dialog>
        </div>
    );
};

export default Board;