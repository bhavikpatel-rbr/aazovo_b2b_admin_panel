import React, { lazy, Suspense, useState, useEffect, useRef, ChangeEvent, CSSProperties, Ref, useMemo } from 'react';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
// import AdaptiveCard from '@/components/shared/AdaptiveCard'; // Using Card directly for main board container
import reorderDragable from '@/utils/reorderDragable';
import sleep from '@/utils/sleep';
import reoderArray from '@/utils/reoderArray'; // Note: Original file has 'reoderArray', assuming typo for 'reorderArray'
import {
    apiGetScrumBoards,
    apiGetProjectMembers,
} from '@/services/ProjectService';
import {
    Droppable,
    DragDropContext,
    Draggable,
    DraggableChildrenFn,
    DroppableProvided,
    DraggableProvidedDragHandleProps,
} from '@hello-pangea/dnd';
import useSWR from 'swr';
import type { DropResult } from '@hello-pangea/dnd';
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { Form, FormItem } from '@/components/ui/Form'; // Combined Form & FormItem
import Input from '@/components/ui/Input';
import Radio from "@/components/ui/Radio";
import ScrollBar from '@/components/ui/ScrollBar';
import Select from "@/components/ui/Select";
import Tag from '@/components/ui/Tag';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Segment from '@/components/ui/Segment'; // Added for view switcher

// Shared Components
import IconText from '@/components/shared/IconText';
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup';

// Icons
import { TbPaperclip, TbMessageCircle, TbSearch, TbPencil, TbCirclePlus, TbTrash, TbCircleXFilled, TbPlus, TbUserPlus, TbSettings, TbDownload, TbLayoutGridAdd, TbUserSearch, TbList, TbLayoutKanban, TbEye } from 'react-icons/tb';

// Store
import { useScrumBoardStore } from '../store/scrumBoardStore';

// Utils & Assets
import { createCardObject, labelList as originalLabelList, createUID } from '../utils'; // Renamed originalLabelList
import NoMedia from '@/assets/svg/NoMedia';
import { getAllTaskAction, getAllTaskByStatuesAction, updateTaskStatusAPI } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';
import { masterSelector } from '@/reduxtool/master/masterSlice';


// Types from '../types' (as imported in original files)
export type GetScrumBoardsResponse = Record<string, Ticket[]>;
export type Member = {
    id: string;
    name: string;
    email: string;
    img: string;
};
export type Comment = {
    id: string;
    name: string;
    src: string;
    message: string;
    date: string | Date; 
};
export type Attachment = {
    id: string;
    name: string;
    src: string;
    size: string;
};
export type Ticket = {
    id: string;
    name: string;
    description?: string;
    dueDate?: string | Date;
    labels?: string[]; // These are for the card display (e.g., status, "Bug", "Feature")
    members: Member[];
    comments?: Comment[];
    attachments?: Attachment[];
    priority?: string; // For detailed view
    category?: string; // For detailed view
    _originalApiData?: any; // To store the original API task if needed
};
export type Columns = Record<string, Ticket[]>;
export type AllMembers = Member[]; 
export type ParticipantMembers = Member[]; 
export type GetProjectMembersResponse = {
    allMembers: AllMembers;
    participantMembers: ParticipantMembers;
};

// For TaskListView
export interface TaskWithStatus extends Ticket {
    status: string;
}

// Modernized taskLabelColors
export const taskLabelColors: Record<string, string> = {
    // Priority specific tags (can be used in detail view or on card if needed)
    'Urgent': 'bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    'High': 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Low': 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    
    // Generic labels (examples from original labelList)
    'Feature Request': 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Bug': 'bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Improvement': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Task': 'bg-gray-100 text-gray-700 dark:bg-gray-600/30 dark:text-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold',

    // Status tags for board cards (transformed from API)
    'Not Started': 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Pending': 'bg-yellow-200 text-yellow-700 dark:bg-yellow-600/40 dark:text-yellow-100 px-2.5 py-1 rounded-full text-xs font-semibold',
    'In Progress': 'bg-blue-200 text-blue-700 dark:bg-blue-600/40 dark:text-blue-100 px-2.5 py-1 rounded-full text-xs font-semibold',
    'On Hold': 'bg-orange-200 text-orange-700 dark:bg-orange-600/40 dark:text-orange-100 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Review': 'bg-teal-200 text-teal-700 dark:bg-teal-600/40 dark:text-teal-100 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Completed': 'bg-green-200 text-green-700 dark:bg-green-600/40 dark:text-green-100 px-2.5 py-1 rounded-full text-xs font-semibold',
    'Cancelled': 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-semibold line-through',
    // Fallback for any other labels
    'default': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-semibold'
};

// Updated labelList for "Add Label" dropdown in TicketContent
const labelList = [
    { value: 'Feature Request', label: 'Feature Request', color: taskLabelColors['Feature Request'] },
    { value: 'Bug', label: 'Bug', color: taskLabelColors['Bug'] },
    { value: 'Improvement', label: 'Improvement', color: taskLabelColors['Improvement'] },
    { value: 'Task', label: 'Task', color: taskLabelColors['Task'] },
    { value: 'Urgent', label: 'Urgent', color: taskLabelColors['Urgent'] }, // Priority example
];


// Props for the main Board component
export type BoardProps = {
    containerHeight?: boolean;
    useClone?: DraggableChildrenFn;
    isCombineEnabled?: boolean;
    withScrollableColumns?: boolean;
};

// --- AddNewColumnContent Component ---
export type EntityType =
  | "company"
  | "member"
  | "partner"
  | "lead"
  | "wall_listing";

type AddNewColumnFormSchema = {
  title: string;
};

const addNewColumnValidationSchema: ZodType<AddNewColumnFormSchema> = z.object({
  title: z.string().min(1, "Column title is required!").max(50, "Title is too long (max 50 chars)"),
});

const ActualAddNewColumnContent = () => {
  const {
    columns,
    ordered,
    closeDialog,
    updateColumns,
    resetView,
    updateOrdered,
  } = useScrumBoardStore();

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<AddNewColumnFormSchema>({
    defaultValues: { title: "" },
    resolver: zodResolver(addNewColumnValidationSchema),
  });

  const onFormSubmit = async (data: AddNewColumnFormSchema) => {
    const newColumnTitle = data.title.trim() || "Untitled Board";
    if (ordered.includes(newColumnTitle)) {
        // Handle error: column title already exists (e.g., using react-hook-form setError or a toast)
        console.error("Column title already exists");
        // Example: setError("title", { type: "manual", message: "This title already exists." });
        return;
    }

    const currentColumns = cloneDeep(columns);
    currentColumns[newColumnTitle] = []; // New column starts empty

    const newOrdered = [...ordered, newColumnTitle];
    const newColumnsState: Columns = {};
    newOrdered.forEach((elm) => {
      newColumnsState[elm] = currentColumns[elm] || [];
    });

    updateColumns(newColumnsState);
    updateOrdered(newOrdered);
    closeDialog();
    await sleep(300); // Shorter sleep
    resetView();
  };

  return (
    <div className="p-1">
      <h5 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Add New Status Column</h5>
      <Form layout="vertical" onSubmit={handleSubmit(onFormSubmit)}>
        <FormItem
          label="Column Title"
          invalid={Boolean(errors.title)}
          errorMessage={errors.title?.message as string}
          className="mb-6"
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="E.g., 'Backlog' or 'Testing'"
                {...field}
                className="w-full rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700/60"
              />
            )}
          />
        </FormItem>
        <Button variant="solid" type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white">
          Add Column
        </Button>
      </Form>
    </div>
  );
};

// --- AddNewMemberContent Component ---
const ActualAddNewMemberContent = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { allMembers, boardMembers, updateBoardMembers, closeDialog } = useScrumBoardStore();
    const [memberList, setMemberList] = useState(allMembers);

    const debounceFn = debounce(handleDebounceFn, 300);

    function handleDebounceFn(query: string) {
        const data = wildCardSearch(allMembers, query);
        setMemberList(data as Member[]);
    }

    const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value);
    };

    const existingMember = (id: string) => boardMembers.some((member) => member.id === id);

    const onAddMember = (member: Member) => {
        if (!existingMember(member.id)) {
            updateBoardMembers([...boardMembers, member]);
        }
    };

    const onRemoveMember = (id: string) => {
        updateBoardMembers(boardMembers.filter((member) => member.id !== id));
    };

    return (
        <div className="p-1">
            <div className="text-center mb-6">
                <TbUserSearch className="text-sky-500 text-4xl mx-auto mb-2" />
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Invite Members</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Search and add members to this board.</p>
            </div>
            <Input
                ref={inputRef}
                prefix={<TbSearch className="text-lg text-slate-400 dark:text-slate-500" />}
                placeholder="Search by name or email"
                onChange={onSearch}
                className="w-full rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700/60"
            />
            <div className="mt-6">
                <p className="font-semibold uppercase text-xs text-slate-500 dark:text-slate-400 mb-3 tracking-wider">
                    {memberList.length} member(s) found
                </p>
                <ScrollBar className="overflow-y-auto h-72 pr-1 -mr-2"> {/* Negative margin to hide system scrollbar if custom one is thin */}
                    {memberList.map((member) => (
                        <div
                            key={member.id}
                            className="p-3 pr-4 mb-2 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar shape="circle" size={40} src={member.img} name={member.name}/>
                                <div>
                                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                        {member.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                </div>
                            </div>
                            {existingMember(member.id) ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-50 dark:border-red-500 dark:hover:bg-red-500/10"
                                    onClick={() => onRemoveMember(member.id)}
                                >
                                    Remove
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    className="bg-sky-600 hover:bg-sky-700 text-white"
                                    onClick={() => onAddMember(member)}
                                >
                                    Add
                                </Button>
                            )}
                        </div>
                    ))}
                    {memberList.length === 0 && (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-10">No members match your search.</p>
                    )}
                </ScrollBar>
            </div>
            <Button block variant="solid" onClick={closeDialog} className="mt-6 bg-sky-600 hover:bg-sky-700 text-white">
                Done
            </Button>
        </div>
    );
}

// --- AddNewTicketContent Component ---
type AddNewTicketFormSchema = {
    title: string
}

const addNewTicketValidationSchema: ZodType<AddNewTicketFormSchema> = z.object({
    title: z.string().min(1, 'Task title is required!').max(100, "Title is too long (max 100 chars)"),
})

const ActualAddNewTicketContent = () => {
    const { columns, board, closeDialog, updateColumns, setSelectedBoard } = useScrumBoardStore();

    const { control, formState: { errors }, handleSubmit } = useForm<AddNewTicketFormSchema>({
        defaultValues: { title: '' },
        resolver: zodResolver(addNewTicketValidationSchema),
    });

    const onFormSubmit = async ({ title }: AddNewTicketFormSchema) => {
        const data = columns;
        const newCard = createCardObject();
        newCard.name = title.trim() || 'Untitled Task';

        const newData = cloneDeep(data);
        if (newData[board]) {
            newData[board].push(newCard);
        } else {
            newData[board] = [newCard];
        }
        
        updateColumns(newData);
        closeDialog();
        await sleep(300);
        setSelectedBoard('');
    };

    return (
        <div className="p-1">
            <h5 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Add New Task</h5>
            <Form layout="vertical" onSubmit={handleSubmit(onFormSubmit)}>
                <FormItem
                    label="Task Title"
                    invalid={Boolean(errors.title)}
                    errorMessage={errors.title?.message as string}
                    className="mb-4"
                >
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                placeholder="E.g., 'Design homepage mockups'"
                                {...field}
                                className="w-full rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700/60"
                            />
                        )}
                    />
                </FormItem>
                <Button variant="solid" type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white">
                    Add Task
                </Button>
            </Form>
        </div>
    );
}

// --- TicketContent Component ---
interface TransformedComment extends Omit<Comment, 'date'> {
    date: Date;
}

const createCommentObject = (message: string): TransformedComment => {
    return {
        id: createUID(10),
        name: 'Angelina Gotelli', // Example user
        src: '/img/avatars/thumb-1.jpg', // Example avatar
        message: message,
        date: new Date(),
    };
};

const AddMoreMemberButton = () => {
    return (
        <Tooltip title="Add Assignee" placement="top">
            <Button
                icon={<TbUserPlus />}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500 hover:text-sky-500 dark:hover:border-sky-400 dark:hover:text-sky-400 text-slate-500 dark:text-slate-400 transition-colors"
                size="sm"
                shape="circle"
            />
        </Tooltip>
    );
};

const ActualTicketContent = ({ onTicketClose }: { onTicketClose: () => void }) => {
    const { updateColumns, ticketId, columns, boardMembers } = useScrumBoardStore();
    const [ticketData, setTicketData] = useState<Partial<Ticket & { comments: TransformedComment[] }>>({});
    const [loading, setLoading] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null); // Changed to HTMLTextAreaElement for Textarea

    const getTicketDetail = async () => {
        setLoading(true);
        await sleep(200); // Simulate API delay
        let ticketDetail: Partial<Ticket> = {};
        for (const key in columns) {
            if (Object.hasOwnProperty.call(columns, key)) {
                const board = columns[key];
                const result = board.find((ticket) => ticket.id === ticketId);
                if (result) {
                    ticketDetail = result;
                    break;
                }
            }
        }
        if (ticketDetail.comments) {
            const transformedComments = ticketDetail.comments.map(c => ({...c, date: new Date(c.date)})) as TransformedComment[];
            setTicketData({...ticketDetail, comments: transformedComments});
        } else {
            setTicketData({...ticketDetail, comments: []});
        }
        setLoading(false);
    };
    
    useEffect(() => {
        if (ticketId && (isEmpty(ticketData) || ticketData.id !== ticketId)) {
            getTicketDetail();
        }
        // No dependency on ticketData here to prevent loop on internal updates
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId, columns]);

    const onUpdateTicketField = (field: keyof Ticket, value: any) => {
        setTicketData(prev => ({...prev, [field]: value}));
    };
    
    const onSaveChanges = () => {
        if (isEmpty(ticketData) || !ticketData.id) return;
        const data = cloneDeep(columns);
        let updated = false;
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const board = data[key];
                const ticketIndex = board.findIndex(t => t.id === ticketData.id);
                if (ticketIndex !== -1) {
                    // Ensure all fields are correctly typed for Ticket
                    const finalTicketData: Ticket = {
                        id: ticketData.id!,
                        name: ticketData.name || "Untitled Ticket",
                        members: ticketData.members || [],
                        description: ticketData.description,
                        dueDate: ticketData.dueDate,
                        labels: ticketData.labels,
                        comments: (ticketData.comments || []).map(c => ({...c, date: c.date.toISOString()})), // Convert Date back to string for storage
                        attachments: ticketData.attachments,
                        priority: ticketData.priority,
                        category: ticketData.category,
                        _originalApiData: ticketData._originalApiData
                    };
                    data[key][ticketIndex] = finalTicketData;
                    updated = true;
                    break;
                }
            }
        }
        if(updated) updateColumns(data);
        onTicketClose();
    };

    const submitComment = () => {
        if (commentInputRef.current) {
            const message = commentInputRef.current.value.trim();
            if (!message) return;
            const comment = createCommentObject(message);
            setTicketData(prev => ({
                ...prev,
                comments: [...(prev.comments || []), comment],
            }));
            commentInputRef.current.value = '';
        }
    };

    const onAddMemberClick = (memberId: string) => {
        const newMember = boardMembers.find((m) => m.id === memberId);
        if (!newMember) return;
        const currentMembers = ticketData.members || [];
        if (!currentMembers.find(m => m.id === newMember.id)) {
            setTicketData(prev => ({ ...prev, members: [...currentMembers, newMember] }));
        }
    };

    const onAddLabelClick = (labelValue: string) => {
        const currentLabels = ticketData.labels || [];
        if (!currentLabels.includes(labelValue)) {
            setTicketData(prev => ({ ...prev, labels: [...currentLabels, labelValue] }));
        }
    };
    
    const { TabNav, TabList, TabContent } = Tabs;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px] p-6">
                <Spinner size={40} className="text-sky-500" />
            </div>
        );
    }

    if (isEmpty(ticketData) || !ticketData.id) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[400px] p-6 text-center">
                 <TbCircleXFilled className="text-red-500 text-5xl mb-4" />
                <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold">Ticket Not Found</p>
                <p className="text-slate-500 dark:text-slate-400">The requested ticket could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="p-1"> {/* Reduced padding as inner elements will handle it */}
            <div className="flex justify-between items-start mb-6 px-5 pt-5">
                <h4 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{ticketData.name}</h4>
                <CloseButton onClick={onTicketClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
            </div>

            <ScrollBar className="max-h-[calc(80vh-180px)] overflow-y-auto px-5 pb-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-6">
                    {/* Assigned to */}
                    <div className="md:col-span-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned to</label>
                        <div className="flex items-center gap-2 mt-1.5">
                            <UsersAvatarGroup
                                avatarProps={{ size: 30 }}
                                users={ticketData.members || []}
                            />
                            {boardMembers.length > (ticketData.members?.length || 0) && (
                                <Dropdown renderTitle={<AddMoreMemberButton />}>
                                    {boardMembers
                                        .filter(member => !ticketData.members?.some(m => m.id === member.id))
                                        .map(member => (
                                            <Dropdown.Item key={member.id} eventKey={member.id} onSelect={() => onAddMemberClick(member.id)}>
                                                <div className="flex items-center">
                                                    <Avatar shape="circle" size={22} src={member.img} name={member.name} />
                                                    <span className="ml-2 rtl:mr-2 text-sm text-slate-700 dark:text-slate-200">{member.name}</span>
                                                </div>
                                            </Dropdown.Item>
                                        ))}
                                </Dropdown>
                            )}
                        </div>
                    </div>

                    {/* Status / Labels */}
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Labels</label>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            {(ticketData.labels || []).map((label) => (
                                <Tag key={label} className={taskLabelColors[label] || taskLabelColors.default}>
                                    {label}
                                </Tag>
                            ))}
                            <Dropdown
                                renderTitle={
                                    <Tag className="border-dashed cursor-pointer border-2 bg-transparent dark:bg-transparent border-slate-300 dark:border-slate-500 hover:border-sky-500 hover:text-sky-500 dark:hover:border-sky-400 dark:hover:text-sky-400 text-slate-500 dark:text-slate-400 transition-colors" prefix={<TbPlus size={14}/>}>
                                        Add Label
                                    </Tag>
                                }
                                placement="bottom-end"
                            >
                                {labelList
                                    .filter(labelObj => !ticketData.labels?.includes(labelObj.value))
                                    .map(labelObj => (
                                        <Dropdown.Item key={labelObj.value} eventKey={labelObj.value} onSelect={() => onAddLabelClick(labelObj.value)}>
                                            <div className="flex items-center">
                                                <Badge className="mr-2" innerClass={`${(taskLabelColors[labelObj.value] || taskLabelColors.default).split(' ')[0]}`} /> {/* Extract bg color for badge */}
                                                <span className="ml-2 rtl:mr-2 text-sm text-slate-700 dark:text-slate-200">{labelObj.label}</span>
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                            </Dropdown>
                        </div>
                    </div>
                
                    {/* Due Date */}
                     <div className="md:col-span-1">
                        <label htmlFor="dueDate" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</label>
                        {/* Replace with a DatePicker component if available */}
                        <Input 
                            type="date" 
                            id="dueDate"
                            value={ticketData.dueDate ? dayjs(ticketData.dueDate).format('YYYY-MM-DD') : ''}
                            onChange={(e) => onUpdateTicketField('dueDate', e.target.value ? new Date(e.target.value) : undefined)}
                            className="mt-1.5 w-full rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700/60"
                        />
                    </div>


                    {/* Priority */}
                    <div className="md:col-span-1">
                        <label htmlFor="priority" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</label>
                        <Select
                            id="priority"
                            placeholder="Select priority..."
                            options={[
                                {label: "Low", value: "Low"}, {label: "Medium", value: "Medium"},
                                {label: "High", value: "High"}, {label: "Urgent", value: "Urgent"},
                            ]}
                            value={ticketData.priority ? {label: ticketData.priority, value: ticketData.priority} : null}
                            onChange={(option) => onUpdateTicketField('priority', option?.value)}
                            className="mt-1.5"
                            styles={{ // Example for react-select like styling
                                control: (provided) => ({ ...provided, backgroundColor: 'var(--tw-bg-opacity)', borderColor: 'var(--tw-border-color)'}),
                                singleValue: (provided) => ({...provided, color: 'var(--tw-text-color)'}),
                                menu: (provided) => ({ ...provided, backgroundColor: 'var(--tw-bg-menu)'})
                            }}
                             // Custom class for Select wrapper if needed by your component library for Tailwind
                            // selectClassName="bg-white dark:bg-slate-700/60 border-slate-300 dark:border-slate-600" 
                        />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-1">
                        <label htmlFor="category" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                        <Select
                            id="category"
                            placeholder="Select category..."
                            options={[ {label: "Electronics", value: "Electronics"}, {label: "Plastic", value: "Plastic"} ]} // Example options
                            value={ticketData.category ? {label: ticketData.category, value: ticketData.category} : null}
                            onChange={(option) => onUpdateTicketField('category', option?.value)}
                            className="mt-1.5"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <label htmlFor="description" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                    <Input
                        id="description"
                        textArea
                        rows={4}
                        placeholder="Add a detailed description for this task..."
                        value={ticketData.description || ''}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onUpdateTicketField('description', e.target.value)}
                        className="mt-1.5 w-full rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700/60 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                
                {/* Link To - Original Checkbox section, styled for better appearance */}
                 <div className="mb-6">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Link to Entities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                        {['Company', 'Member', 'Partner', 'Inquiries', 'Brand', 'Categories', 'Products', 'Wall Listing', 'Opportunity', 'Offer & Demand', 'Leads', 'Request & Feedback', 'Campaign', 'Teams', 'CMS', 'Others'].map(item => (
                            <label key={item} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                <Checkbox value={item} /> <span>{item}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="mb-8">
                    <label htmlFor="selectLink" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Link Item</label>
                     <Select
                        id="selectLink"
                        placeholder="Select linked item..."
                        options={[{label: "Lead 1", value: "Lead 1"}, {label: "Lead 2", value: "Lead 2"}]}
                        className="mt-1.5"
                    />
                </div>


                <Tabs defaultValue="comments" className="mb-6">
                    <TabList className="border-b border-slate-200 dark:border-slate-700">
                        <TabNav value="comments" className="hover:text-sky-600 dark:hover:text-sky-400 focus:text-sky-600 dark:focus:text-sky-400 aria-selected:border-sky-600 dark:aria-selected:border-sky-400 aria-selected:text-sky-600 dark:aria-selected:text-sky-400">Activity Notes</TabNav>
                        <TabNav value="attachments" className="hover:text-sky-600 dark:hover:text-sky-400 focus:text-sky-600 dark:focus:text-sky-400 aria-selected:border-sky-600 dark:aria-selected:border-sky-400 aria-selected:text-sky-600 dark:aria-selected:text-sky-400">Attachments ({ticketData.attachments?.length || 0})</TabNav>
                    </TabList>
                    <div className="py-5">
                        <TabContent value="comments">
                            {(ticketData.comments || []).map((comment) => (
                                <div key={comment.id} className="mb-5 flex items-start space-x-3">
                                    <Avatar shape="circle" size={32} src={comment.src} name={comment.name} />
                                    <div className="flex-1 p-3.5 rounded-lg bg-slate-100 dark:bg-slate-700/70">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{comment.name}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{dayjs(comment.date).format('MMM DD, YYYY h:mm A')}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{comment.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-5 flex items-start space-x-3">
                                <Avatar shape="circle" size={32} src="/img/avatars/thumb-1.jpg" /> {/* Current user avatar */}
                                <div className="flex-1 relative">
                                    <Input
                                        ref={commentInputRef as any} // Cast if Input doesn't directly support HTMLTextAreaElement ref
                                        textArea
                                        rows={3}
                                        placeholder="Add a comment..."
                                        className="w-full rounded-md border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700/60 placeholder-slate-400 dark:placeholder-slate-500"
                                    />
                                    <div className="absolute bottom-2.5 right-2.5">
                                        <Button size="sm" variant="solid" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={submitComment}>
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabContent>
                        <TabContent value="attachments">
                            {(ticketData.attachments || []).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {ticketData.attachments?.map((file) => (
                                        <Card
                                            key={file.id}
                                            bodyClass="p-3"
                                            className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 shadow-sm"
                                        >
                                            {/* Basic image preview or icon based on file type */}
                                            {file.src.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                                 <img className="w-full h-32 object-cover rounded-md mb-2" alt={file.name} src={file.src} />
                                            ) : (
                                                <div className="w-full h-32 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded-md mb-2">
                                                    <TbPaperclip className="text-4xl text-slate-400 dark:text-slate-500" />
                                                </div>
                                            )}
                                            <div className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate" title={file.name}>{file.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{file.size}</div>
                                            <div className="flex items-center space-x-2">
                                                <Button size="xs" icon={<TbDownload size={14} />} variant='outline' className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600">Download</Button>
                                                <Button size="xs" icon={<TbTrash size={14} />} variant='outline' className="text-red-500 border-red-300 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10">Delete</Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <NoMedia height={120} width={120} className="text-slate-400 dark:text-slate-500 mb-4" />
                                    <p className="font-semibold text-slate-600 dark:text-slate-300">No Attachments Yet</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload files related to this task.</p>
                                    <Button variant="solid" className="mt-4 bg-sky-600 hover:bg-sky-700 text-white" leftIcon={<TbCirclePlus />}>
                                        Upload File
                                    </Button>
                                </div>
                            )}
                        </TabContent>
                    </div>
                </Tabs>
            </ScrollBar>

            <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                <Button size="sm" onClick={onTicketClose} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">
                    Cancel
                </Button>
                <Button variant="solid" size="sm" onClick={onSaveChanges} className="bg-sky-600 hover:bg-sky-700 text-white">
                    Save Changes
                </Button>
            </div>
        </div>
    );
};


// --- BoardCard Component ---
interface BoardCardProps extends CardProps {
    data: Ticket;
    ref?: Ref<HTMLDivElement>;
}

const BoardCard = React.forwardRef<HTMLDivElement, BoardCardProps>((props, ref) => {
    const { openDialog, updateDialogView, setSelectedTicketId } = useScrumBoardStore();
    const { data, ...rest } = props;
    const { id, name, comments, attachments, members, labels, priority } = data;

    const onCardClick = () => {
        openDialog();
        updateDialogView('TICKET');
        setSelectedTicketId(id);
    };

    return (
        <Card
            ref={ref}
            clickable
            className="hover:shadow-xl transition-shadow duration-200 rounded-lg mb-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            bodyClass="p-4"
            onClick={onCardClick} // Restored onClick
            {...rest}
        >
            <div className="mb-2.5">
                <h6 className="font-semibold text-base text-slate-800 dark:text-slate-100 leading-tight break-words">{name}</h6>
            </div>

            {(labels && labels.length > 0 || priority) && (
                <div className="mb-3 flex flex-wrap gap-1.5 items-center">
                    {priority && (
                        <Tag className={taskLabelColors[priority] || taskLabelColors.default}>
                           Priority: {priority}
                        </Tag>
                    )}
                    {labels?.map((label) => ( // Show only first status-like label on card, others in detail
                        <Tag key={label} className={`${taskLabelColors[label] || taskLabelColors.default}`}>
                            {label}
                        </Tag>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2"> {/* mt-auto pushes to bottom if card has fixed height */}
                <UsersAvatarGroup avatarProps={{ size: 28, className:"ring-1 ring-white dark:ring-slate-800" }} users={members || []} />
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    {comments && comments.length > 0 && (
                        <IconText className="gap-1 items-center" icon={<TbMessageCircle className="text-base" />}>
                            {comments.length}
                        </IconText>
                    )}
                    {attachments && attachments.length > 0 && (
                        <IconText className="gap-1 items-center" icon={<TbPaperclip className="text-base" />}>
                            {attachments.length}
                        </IconText>
                    )}
                </div>
            </div>
        </Card>
    );
});
BoardCard.displayName = "BoardCard";


// --- BoardCardList Component ---
export interface BaseBoardProps {
    contents?: Ticket[];
    useClone?: DraggableChildrenFn;
    isCombineEnabled?: boolean;
}

interface BoardCardListProps extends BaseBoardProps {
    ignoreContainerClipping?: boolean;
    internalScroll?: boolean;
    scrollContainerStyle?: CSSProperties;
    isDropDisabled?: boolean;
    listId?: string;
    style?: CSSProperties;
    listType?: string;
    className?: string;
}

type InnerListProps = {
    dropProvided: DroppableProvided;
    contents?: Ticket[];
    useClone?: DraggableChildrenFn;
    isCombineEnabled?: boolean;
};

const InnerList = React.memo(function InnerList(props: InnerListProps) {
    const { dropProvided, contents, ...rest } = props;

    return (
        <div ref={dropProvided.innerRef} className="board-dropzone h-full pt-1"> {/* Added pt-1 for slight space from title */}
            <div className="px-3.5 h-full"> {/* Adjusted padding */}
                {contents?.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                            <BoardCard
                                ref={dragProvided.innerRef}
                                data={item}
                                {...rest}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                    ...dragProvided.draggableProps.style,
                                    opacity: dragSnapshot.isDragging ? 0.85 : 1,
                                    transform: dragSnapshot.isDragging ? `${dragProvided.draggableProps.style?.transform} rotate(1deg)` : dragProvided.draggableProps.style?.transform, // Slight tilt
                                }}
                            />
                        )}
                    </Draggable>
                ))}
                {dropProvided.placeholder}
            </div>
        </div>
    );
});

const BoardCardList = (props: BoardCardListProps) => {
    const {
        ignoreContainerClipping, internalScroll, scrollContainerStyle, isDropDisabled,
        isCombineEnabled, listId = 'LIST', style, listType, contents, useClone, className,
    } = props;

    return (
        <Droppable
            droppableId={listId} type={listType} ignoreContainerClipping={ignoreContainerClipping}
            isDropDisabled={isDropDisabled} isCombineEnabled={isCombineEnabled} renderClone={useClone}
        >
            {(dropProvided, dropSnapshot) => (
                <div
                    style={style}
                    className={classNames(
                        "board-wrapper flex-auto transition-colors duration-200", // Removed overflow-hidden, scrollbar handles it
                        className,
                        dropSnapshot.isDraggingOver ? 'bg-sky-50 dark:bg-sky-900/30' : 'bg-transparent'
                    )}
                    {...dropProvided.droppableProps}
                >
                    {internalScroll ? (
                        <ScrollBar
                            className="board-scrollContainer overflow-y-auto h-full"
                            style={scrollContainerStyle}
                        >
                            <InnerList contents={contents} dropProvided={dropProvided} useClone={useClone} isCombineEnabled={isCombineEnabled} />
                        </ScrollBar>
                    ) : (
                        <InnerList contents={contents} dropProvided={dropProvided} useClone={useClone} isCombineEnabled={isCombineEnabled} />
                    )}
                </div>
            )}
        </Droppable>
    );
};


// --- BoardTitle Component ---
type BoardTitleProps = {
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    title: string;
    taskCount: number;
};

type RenameBoardFormSchema = { title: string };

type RenameFormProps = {
    title: string;
    closeRenameForm: () => void;
    columns: Columns;
    ordered: string[];
    onEnter: (newColumns: Columns, newOrder: string[]) => void;
};

const RenameForm = ({ title, closeRenameForm, columns = {}, ordered, onEnter }: RenameFormProps) => {
    const { control, handleSubmit, setFocus, formState: { errors } } = useForm<RenameBoardFormSchema>({
        defaultValues: { title },
        resolver: zodResolver(z.object({ title: z.string().min(1, "Required").max(50, "Too long") }))
    });

    useEffect(() => { setFocus('title') }, [setFocus]);

    const onFormSubmit = (value: RenameBoardFormSchema) => {
        const newTitle = value.title.trim();
        if (!newTitle || newTitle === title) {
            closeRenameForm();
            return;
        }
        if (ordered.some((elm) => elm === newTitle)) {
            // setError('title', { type: 'manual', message: 'Title exists' }); // Using react-hook-form error
            console.error("Column title already exists");
            closeRenameForm(); 
            return;
        }
        const newColumns: Columns = { ...columns };
        if (newColumns[title]) {
            newColumns[newTitle] = newColumns[title];
            delete newColumns[title];
        }
        const newOrder = ordered.map((elm) => (elm === title ? newTitle : elm));
        onEnter(newColumns, newOrder);
        closeRenameForm();
    };

    return (
        <Form onSubmit={handleSubmit(onFormSubmit)} className="w-full flex items-center">
            <Controller
                name="title"
                control={control}
                render={({ field }) => (
                    <Input
                        size="sm" // Smaller input for header
                        autoComplete="off"
                        {...field}
                        onBlur={handleSubmit(onFormSubmit)}
                        className="text-base font-semibold bg-white dark:bg-slate-700 border-sky-500 dark:border-sky-400 ring-1 ring-sky-500 dark:ring-sky-400"
                    />
                )}
            />
            {errors.title && <span className="text-xs text-red-500 ml-2">{errors.title.message}</span>}
        </Form>
    );
};

const BoardTitle = (props: BoardTitleProps) => {
    const { dragHandleProps, title, taskCount } = props;
    const { columns, ordered, openDialog, updateColumns, updateDialogView, setSelectedBoard, updateOrdered, deleteBoard } = useScrumBoardStore();
    const [renameActive, setRenameActive] = useState(false);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);

    const onRenameActive = () => setRenameActive(true);
    const onRenameDeactivate = () => setRenameActive(false);
    const onConfirmDeleteOpen = () => setConfirmDeleteDialog(true);
    const onConfirmDeleteClose = () => setConfirmDeleteDialog(false);

    const onAddNewTicket = () => {
        openDialog();
        updateDialogView('NEW_TICKET');
        setSelectedBoard(title);
    };

    const onDeleteConfirmed = () => {
        if (deleteBoard) {
            deleteBoard(title);
        } else {
            const newOrder = ordered.filter((elm) => elm !== title);
            const newColumnsState = { ...columns };
            delete newColumnsState[title];
            updateOrdered(newOrder);
            updateColumns(newColumnsState);
        }
        setConfirmDeleteDialog(false);
    };

    const handleRenameEnter = (newCols: Columns, newOrd: string[]) => {
        updateColumns(newCols);
        updateOrdered(newOrd);
    };

    return (
        <div
            className="board-title px-3.5 py-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 cursor-grab"
            {...dragHandleProps}
        >
            {renameActive ? (
                <div className="flex items-center w-full gap-2">
                    <RenameForm title={title} closeRenameForm={onRenameDeactivate} columns={columns} ordered={ordered} onEnter={handleRenameEnter} />
                    <TbCircleXFilled className="cursor-pointer text-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" onClick={onRenameDeactivate} />
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <h6 className="font-semibold text-base text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={title}>{title}</h6>
                        <Badge innerClass="bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200">{taskCount}</Badge>
                    </div>
                    <Dropdown
                        placement="bottom-end"
                        renderTitle={<EllipsisButton className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"/>}
                    >
                        <Dropdown.Item eventKey="renameBoard" onClick={onRenameActive} className="gap-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                            <TbPencil size={16}/><span>Rename</span>
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="addTicket" onClick={onAddNewTicket} className="gap-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                            <TbPlus size={16}/><span>Add Task</span>
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="deleteBoard" onClick={onConfirmDeleteOpen} className="gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                            <TbTrash size={16}/><span>Delete Board</span>
                        </Dropdown.Item>
                    </Dropdown>
                </>
            )}
            <ConfirmDialog
                isOpen={confirmDeleteDialog} type="danger" title="Delete Board"
                confirmButtonColor="red-600" onClose={onConfirmDeleteClose}
                onRequestClose={onConfirmDeleteClose} onCancel={onConfirmDeleteClose}
                onConfirm={onDeleteConfirmed}
            >
                <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to delete the board "<strong>{title}</strong>"? All tasks within this board will also be removed. This action cannot be undone.
                </p>
            </ConfirmDialog>
        </div>
    );
};


// --- BoardColumn Component ---
interface BoardColumnProps extends BaseBoardProps {
    title: string;
    index: number;
    isScrollable?: boolean;
}

const BoardColumn = (props: BoardColumnProps) => {
    const { title, contents, index, isScrollable, isCombineEnabled, useClone } = props;
    const taskCount = contents?.length || 0;

    return (
        <Draggable draggableId={title} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    className={classNames(
                        "board-column flex flex-col min-w-[320px] w-[320px] max-w-[320px] rounded-xl shadow-sm transition-shadow duration-200",
                        "bg-slate-100 dark:bg-slate-800/60 border border-transparent", // Base background
                        snapshot.isDragging ? "shadow-2xl border-sky-400 dark:border-sky-600 ring-2 ring-sky-300 dark:ring-sky-700 bg-slate-200 dark:bg-slate-800" : "hover:shadow-md"
                    )}
                    {...provided.draggableProps}
                >
                    <BoardTitle
                        title={title}
                        taskCount={taskCount}
                        dragHandleProps={provided.dragHandleProps}
                    />
                    <BoardCardList
                        listId={title}
                        listType="CONTENT"
                        contents={contents}
                        internalScroll={isScrollable}
                        isCombineEnabled={isCombineEnabled}
                        useClone={useClone}
                        scrollContainerStyle={{ maxHeight: isScrollable ? 'calc(100vh - 280px)' : undefined, paddingBottom: '8px' }}
                    />
                </div>
            )}
        </Draggable>
    );
};


// --- ScrumBoardHeader Component (Updated) ---
interface ScrumBoardHeaderProps {
    boardMembers?: Member[];
    currentView: 'board' | 'list';
    onViewChange: (view: 'board' | 'list') => void;
}

const ScrumBoardHeader = ({ boardMembers = [], currentView, onViewChange }: ScrumBoardHeaderProps) => {
    const { updateDialogView, openDialog } = useScrumBoardStore();

    const onAddMember = () => {
        updateDialogView('ADD_MEMBER');
        openDialog();
    };

    const handleAddNewColumn = () => {
        updateDialogView('NEW_COLUMN');
        openDialog();
    };

    const viewOptions = [
        { value: 'board', label: 'Board', icon: <TbLayoutKanban className="text-lg" /> },
        { value: 'list', label: 'List', icon: <TbList className="text-lg" /> },
    ];

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-1">
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 ml-5">Task Board</h3>
               
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-shrink-0">
                    <Segment 
                        value={currentView} 
                        onChange={(val) => onViewChange(val as 'board' | 'list')} 
                        size="sm"
                        className="min-w-[180px]" // Ensure segment has enough width
                    >
                        {viewOptions.map(option => (
                            <Segment.Item key={option.value} value={option.value}>
                                <span className="flex items-center justify-center gap-2">
                                    {option.icon}
                                    {option.label}
                                </span>
                            </Segment.Item>
                        ))}
                    </Segment>
                </div>
                
            </div>
        </div>
    );
};


const transformApiTaskToTicket = (apiTask: any): Ticket => {
    const members: Member[] = (apiTask.assign_to_users || []).map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email || `user-${user.id}@example.com`,
        img: user.profile_pic_path || '',
    }));

    const comments: Comment[] = (apiTask.activity_notes || []).map((note: any) => ({
        id: note?.id?.toString(),
        name: note?.user?.name,
        src: note?.user?.profile_pic_path || '',
        message: note?.activity_comment,
        date: new Date(note?.created_at).toISOString(), // Store as ISO string
    }));

    const attachments: Attachment[] = (apiTask.attachments || []).map((att: any) => ({
        id: att.id.toString(),
        name: att.attachment_name,
        src: att.attachment_path,
        size: att.attachment_type,
    }));

    const cardLabels: string[] = [];
    if (apiTask.status) { // Primary label for the card, usually status
        cardLabels.push(apiTask.status);
    }
    // Additional labels could be pushed here if desired on the card itself
    // e.g., if (apiTask.tags) cardLabels.push(...apiTask.tags);

    return {
        id: apiTask.id.toString(),
        name: apiTask.task_title,
        description: apiTask.additional_description || apiTask.note_remark || '',
        dueDate: apiTask.due_data ? new Date(apiTask.due_data).toISOString() : undefined,
        labels: cardLabels,
        members: members,
        comments: comments,
        attachments: attachments,
        priority: apiTask.priority, // For detailed view
        category: apiTask.department_info?.name || apiTask.module_name, // For detailed view
        _originalApiData: apiTask,
    };
};

// --- TaskListView Component (New) ---
// This should ideally be in its own file, e.g., TaskListView.tsx
interface TaskListViewProps {
    tasks: TaskWithStatus[];
}

const ActualTaskListView: React.FC<TaskListViewProps> = ({ tasks }) => {
    const { openDialog, updateDialogView, setSelectedTicketId } = useScrumBoardStore();

    const handleViewTicket = (ticketId: string) => {
        openDialog();
        updateDialogView('TICKET');
        setSelectedTicketId(ticketId);
    };

 

    if (!tasks || tasks.length === 0) {
        return (
            <Card className="mt-6">
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    No tasks to display in list view.
                </div>
            </Card>
        );
    }

    return (
        <Card className="mt-6 shadow-sm border border-slate-200 dark:border-slate-700" bodyClass="p-0">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Title</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignees</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800/80 divide-y divide-slate-200 dark:divide-slate-700">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div 
                                        className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 cursor-pointer"
                                        onClick={() => handleViewTicket(task.id)}
                                    >
                                        {task.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Tag className={taskLabelColors[task.status] || taskLabelColors.default}>
                                        {task.status}
                                    </Tag>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {task.priority ? (
                                        <Tag className={taskLabelColors[task.priority] || taskLabelColors.default}>
                                            {task.priority}
                                        </Tag>
                                    ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {task.members && task.members.length > 0 ? (
                                        <UsersAvatarGroup avatarProps={{ size: 28, className:"ring-1 ring-white dark:ring-slate-800" }} users={task.members} />
                                    ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {task.dueDate ? dayjs(task.dueDate).format('MMM DD, YYYY') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Tooltip title="View Details">
                                        <Button
                                            shape="circle"
                                            size="sm"
                                            variant="plain"
                                            icon={<TbEye />}
                                            onClick={() => handleViewTicket(task.id)}
                                            className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-500"
                                        />
                                    </Tooltip>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- Main Board Component (Updated) ---
const Board = (props: BoardProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {
        columns, ordered, boardMembers, updateOrdered, updateColumns,
        updateBoardMembers, updateAllMembers, closeDialog, resetView,
        dialogView, dialogOpen, ticketId, setSelectedBoard // Added setSelectedBoard for store access
    } = useScrumBoardStore();

    const { containerHeight, useClone, isCombineEnabled, withScrollableColumns } = props;

    const [currentView, setCurrentView] = useState<'board' | 'list'>('board');

    const DEFAULT_BOARD_STATUSES = [
        "Not Started", "Pending", "In Progress", "On Hold", "Review", "Completed", "Cancelled"
    ];
    const { AllTaskDataByStatues = {}, status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

    useEffect(() => { dispatch(getAllTaskByStatuesAction()); }, [dispatch]);
    
    useEffect(() => {
        if (masterLoadingStatus === 'succeeded' || (masterLoadingStatus === 'idle' && !isEmpty(AllTaskDataByStatues))) {
            const newColumns: Columns = {};
            const safeApiData = (AllTaskDataByStatues && typeof AllTaskDataByStatues === 'object' && !Array.isArray(AllTaskDataByStatues))
                ? AllTaskDataByStatues
                : {};

            DEFAULT_BOARD_STATUSES.forEach(statusKey => {
                const apiTasksForStatus: any[] = safeApiData[statusKey];
                if (Array.isArray(apiTasksForStatus)) {
                    newColumns[statusKey] = apiTasksForStatus.map(transformApiTaskToTicket);
                } else {
                    newColumns[statusKey] = []; 
                    if (safeApiData.hasOwnProperty(statusKey) && !Array.isArray(apiTasksForStatus)) {
                        console.warn(`Data for status "${statusKey}" was not an array:`, apiTasksForStatus);
                    }
                }
            });
            
            Object.keys(safeApiData).forEach(apiStatusKey => {
                if (!DEFAULT_BOARD_STATUSES.includes(apiStatusKey) && safeApiData[apiStatusKey]?.length > 0) { // Only warn if there are tasks in unknown status
                    console.warn(`API returned unknown status "${apiStatusKey}" with tasks. These tasks will not be displayed on the board unless the status is added to DEFAULT_BOARD_STATUSES or handled.`);
                }
            });

            updateColumns(newColumns);
            updateOrdered([...DEFAULT_BOARD_STATUSES]);
        }
    }, [AllTaskDataByStatues, masterLoadingStatus, updateColumns, updateOrdered, dispatch]);

    const TicketContent = lazy(() => Promise.resolve({ default: ActualTicketContent }));
    const AddNewTicketContent = lazy(() => Promise.resolve({ default: ActualAddNewTicketContent }));
    const AddNewMemberContent = lazy(() => Promise.resolve({ default: ActualAddNewMemberContent }));
    const AddNewColumnContent = lazy(() => Promise.resolve({ default: ActualAddNewColumnContent }));
    const TaskListView = lazy(() => Promise.resolve({ default: ActualTaskListView }));


    const allTicketsFlat: TaskWithStatus[] = useMemo(() => {
        if (isEmpty(columns) || !ordered || ordered.length === 0) {
            return [];
        }
        return ordered.reduce((acc, statusKey) => {
            const tasksInStatus = columns[statusKey] || [];
            const tasksWithStatus = tasksInStatus.map(task => ({ ...task, status: statusKey }));
            return acc.concat(tasksWithStatus);
        }, [] as TaskWithStatus[]);
    }, [columns, ordered]);

    const onDialogClose = async () => {
        closeDialog();
        await sleep(200);
        resetView();
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, combine, type, draggableId } = result;

        if (combine) {
            if (type === 'COLUMN') {
                const newOrder = [...ordered];
                const columnIdToRemove = newOrder.splice(source.index, 1)[0];
                updateOrdered(newOrder);
                if (columnIdToRemove) {
                    const newCols = { ...columns };
                    delete newCols[columnIdToRemove];
                    updateColumns(newCols);
                }
            } else { // Ticket combining
                const column = columns[source.droppableId];
                if (column) {
                    const withRemoved = [...column];
                    withRemoved.splice(source.index, 1);
                    updateColumns({ ...columns, [source.droppableId]: withRemoved });
                }
            }
            return;
        }

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        if (type === 'COLUMN') {
            const newOrdered = reoderArray(ordered, source.index, destination.index);
            updateOrdered(newOrdered as string[]);
            return;
        }

        const data = reorderDragable<Record<string, Ticket[]>>({ quoteMap: columns, source, destination });
        updateColumns(data.quoteMap); // Optimistic UI update

        if (source.droppableId !== destination.droppableId) {
            const taskId = parseInt(draggableId, 10);
            const newStatus = destination.droppableId;
            if (isNaN(taskId)) {
                console.error("Invalid draggableId for API update:", draggableId);
                return;
            }
            // Ensure user_id is dynamically fetched from auth store or context
            const payload = { user_id: 53, task_id: taskId, status: newStatus }; 
            try {
                const actionResult = await dispatch(updateTaskStatusAPI(payload)).unwrap();
                if (!actionResult) { 
                     console.warn("API task status update failed. UI may be inconsistent.");
                    // Consider re-fetching to ensure data consistency
                    // dispatch(getAllTaskByStatuesAction()); 
                }
            } catch (error) {
                console.error("Error updating task status via API:", error);
                // Revert or re-fetch state on error
                // dispatch(getAllTaskByStatuesAction());
            }
        }
    };

    const handleViewChange = (view: 'board' | 'list') => {
        setCurrentView(view);
    };
     
    return (
        <div className="p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
            <Card className="h-full shadow-none bg-transparent" bodyClass="h-full flex flex-col p-0">
                <ScrumBoardHeader 
                    boardMembers={boardMembers} 
                    currentView={currentView}
                    onViewChange={handleViewChange}
                />
                {masterLoadingStatus === 'loading' && currentView === 'board' && ( // Show general loading for board view
                     <div className="flex justify-center items-center py-20">
                        <Spinner size={50} className="text-sky-500"/>
                        <p className="ml-3 text-slate-600 dark:text-slate-300">Loading board...</p>
                    </div>
                )}
                 {/* List view has its own loading/empty state handling */}
                 {(masterLoadingStatus !== 'loading' || currentView === 'list') && ( 
                    <>
                        {currentView === 'board' && (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="board" type="COLUMN" direction="horizontal" ignoreContainerClipping={Boolean(containerHeight)} isCombineEnabled={isCombineEnabled}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} className="scrumboard flex flex-auto w-full" {...provided.droppableProps}>
                                            <div className="scrumboard-body flex flex-nowrap overflow-x-auto pb-4 gap-5 items-start">
                                                {ordered.map((key, index) => (
                                                    columns[key] ? (
                                                        <BoardColumn
                                                            key={key} index={index} title={key}
                                                            contents={columns[key]}
                                                            isScrollable={withScrollableColumns}
                                                            isCombineEnabled={isCombineEnabled}
                                                            useClone={useClone}
                                                        />
                                                    ) : null
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                        {currentView === 'list' && (
                            <Suspense fallback={
                                <div className="flex justify-center items-center py-20">
                                    <Spinner size={40} className="text-sky-500" />
                                    <p className="ml-3 text-slate-600 dark:text-slate-300">Loading list view...</p>
                                </div>
                            }>
                                <TaskListView tasks={allTicketsFlat} />
                            </Suspense>
                        )}
                    </>
                 )}
            </Card>
            <Dialog
                isOpen={dialogOpen}
                width={dialogView === 'TICKET' ? 850 : (dialogView === 'ADD_MEMBER' ? 600 : 480)}
                contentClassName={classNames(
                    "shadow-xl rounded-xl",
                    dialogView === 'TICKET' ? "max-h-[90vh] flex flex-col" : "" 
                )}
                dialogStyle={{ content: { padding: 0 } }} 
                closable={true}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <Suspense
                    fallback={
                        <div className="flex justify-center items-center h-80 p-6">
                            <Spinner size={40} className="text-sky-500"/>
                        </div>
                    }
                >
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