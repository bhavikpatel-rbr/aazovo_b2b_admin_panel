import React, { lazy, Suspense, useState, useEffect, useRef, ChangeEvent, CSSProperties, Ref } from 'react';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import AdaptiveCard from '@/components/shared/AdaptiveCard';
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
import Textarea from '@/views/ui-components/forms/Input/Textarea'; // Assuming this path is correct

// Shared Components
import IconText from '@/components/shared/IconText';
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup';

// Icons
import { TbPaperclip, TbMessageCircle, TbSearch, TbPencil, TbCirclePlus, TbTrash, TbCircleXFilled, TbPlus, TbUserPlus, TbSettings, TbDownload } from 'react-icons/tb';

// Store
import { useScrumBoardStore } from '../store/scrumBoardStore';

// Utils & Assets
import { createCardObject, taskLabelColors, labelList, createUID } from '../utils';
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
    // Potentially other fields if used by Ticket's member structure
};
export type Comment = {
    id: string;
    name: string;
    src: string;
    message: string;
    date: string | Date; // Assuming it can be string from API, then Date object
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
    labels?: string[];
    members: Member[];
    comments?: Comment[];
    attachments?: Attachment[];
    // Any other ticket properties
};
export type Columns = Record<string, Ticket[]>;
export type AllMembers = Member[]; // From GetProjectMembersResponse
export type ParticipantMembers = Member[]; // From GetProjectMembersResponse
export type GetProjectMembersResponse = {
    allMembers: AllMembers;
    participantMembers: ParticipantMembers;
};


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
  // entityType: EntityType;
  // selectedEntityId?: string;
  // selectedOptions?: string[]; // This will effectively not be used if checkboxes are removed
};

const addNewColumnValidationSchema: ZodType<AddNewColumnFormSchema> = z.object({
  title: z.string().min(1, "Column title is required!"),
  // entityType: z.enum(['company', 'member', 'partner', 'lead', 'wall_listing'], {
  //     required_error: 'Please select an entity type.',
  // }),
  // selectedEntityId: z.string().optional(), // Make optional, then refine
  // selectedOptions: z.array(z.string()).optional(), // Will be unused but keep in schema for now
});
// .refine(data => {
//     if (data.entityType && !data.selectedEntityId) {
//         return false; // selectedEntityId is required if entityType is chosen
//     }
//     return true;
// }, {
//     message: "Please select an item from the list.",
//     path: ["selectedEntityId"], // Error applies to selectedEntityId
// });

const entityTypeOptions = [
  { value: "company", label: "Company" },
  { value: "member", label: "Member" },
  { value: "partner", label: "Partner" },
  { value: "lead", label: "Lead" },
  { value: "wall_listing", label: "Wall Listing" },
];

const selectOptionsMap: Record<
  EntityType,
  Array<{ value: string; label: string }>
> = {
  company: [
    { value: "compA", label: "Company Alpha" },
    { value: "compB", label: "Company Beta" },
  ],
  member: [
    { value: "mem1", label: "Member John" },
    { value: "mem2", label: "Member Jane" },
  ],
  partner: [
    /* ... partner options ... */
  ],
  lead: [
    /* ... lead options ... */
  ],
  wall_listing: [
    /* ... wall_listing options ... */
  ],
};

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
    // watch, // Not used
    // resetField, // Not used
    // setValue, // Not used
  } = useForm<AddNewColumnFormSchema>({
    defaultValues: {
      title: "",
      // selectedEntityId: undefined,
      // selectedOptions: [], // Keep for schema, will be empty
    },
    resolver: zodResolver(addNewColumnValidationSchema),
  });

  // const watchedEntityType = watch('entityType'); // Commented out in original
  // const watchedSelectedEntityId = watch('selectedEntityId'); // Commented out in original

  // useEffect(() => { // Commented out in original
  //     if (watchedEntityType) {
  //         setValue('selectedEntityId', undefined, { shouldValidate: true });
  //     }
  // }, [watchedEntityType, setValue]);

  // const currentSelectOptions = watchedEntityType ? selectOptionsMap[watchedEntityType] : []; // Commented out in original

  const onFormSubmit = async (data: AddNewColumnFormSchema) => {
    console.log("Form Data:", data);

    const newColumnTitle = data.title || "Untitled Board";
    const currentColumns = cloneDeep(columns);
    
    let tasks: Ticket[] = []; // Ensure tasks is of type Ticket[]
    // if (data.selectedEntityId) { // Commented out in original
    //     const entityTypeLabel = entityTypeOptions.find(opt => opt.value === data.entityType)?.label;
    //     const selectedItemLabel = currentSelectOptions.find(opt => opt.value === data.selectedEntityId)?.label;
    //     tasks.push({
    //         id: `item-${Date.now()}`,
    //         name: `Selected: ${entityTypeLabel} - ${selectedItemLabel}`, // Ensure name is present
    //         members: [], // Add other required Ticket fields
    //     });
    // }

    currentColumns[newColumnTitle] = tasks;

    const newOrdered = [...ordered, newColumnTitle];
    const newColumnsState: Columns = {};
    newOrdered.forEach((elm) => {
      newColumnsState[elm] = currentColumns[elm];
    });
console.log("newColumnsState",newColumnsState);

    updateColumns(newColumnsState);
    updateOrdered(newOrdered);
    closeDialog();
    await sleep(500);
    resetView();
  };

  return (
    <div>
      <h5>Add New Column</h5>
      <div className="mt-4">
        <Form layout="vertical" onSubmit={handleSubmit(onFormSubmit)}>
          <FormItem
            label="Column title"
            invalid={Boolean(errors.title)}
            errorMessage={errors.title?.message as string}
            className="mb-4"
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="Enter column title"
                  {...field}
                />
              )}
            />
          </FormItem>

          {/* <FormItem
              label="Select Type"
              invalid={Boolean(errors.entityType)}
              errorMessage={errors.entityType?.message}
              className="mb-4"
          >
              <Controller
                  name="entityType"
                  control={control}
                  render={({ field }) => (
                      <Radio.Group
                          value={field.value}
                          onChange={(val) => {
                              field.onChange(val);
                              setValue('selectedEntityId', undefined, { shouldValidate: true });
                          }}
                      >
                          {entityTypeOptions.map((option) => (
                              <Radio key={option.value} value={option.value}>
                                  {option.label}
                              </Radio>
                          ))}
                      </Radio.Group>
                  )}
              />
          </FormItem> */}

          {/* {watchedEntityType && (
              <FormItem
                  label={`Select ${entityTypeOptions.find(opt => opt.value === watchedEntityType)?.label || 'Item'}`}
                  invalid={Boolean(errors.selectedEntityId)}
                  errorMessage={errors.selectedEntityId?.message}
                  className="mb-4"
              >
                  <Controller
                      name="selectedEntityId"
                      control={control}
                      render={({ field }) => (
                          <Select
                              placeholder={`Select a ${watchedEntityType}...`}
                              options={currentSelectOptions}
                              value={currentSelectOptions.find(option => option.value === field.value)}
                              onChange={(option) => {
                                  field.onChange(option?.value);
                              }}
                          />
                      )}
                  />
              </FormItem>
          )} */}
          
          <FormItem>
            <Button variant="solid" type="submit" className="mt-4">
              Add Status
            </Button>
          </FormItem>
        </Form>
      </div>
    </div>
  );
};

// --- AddNewMemberContent Component ---
const ActualAddNewMemberContent = () => {
    const inputRef = useRef<HTMLInputElement>(null);

    const { allMembers, boardMembers, updateBoardMembers, closeDialog } =
        useScrumBoardStore()

    const [memberList, setMemberList] = useState(allMembers)

    const debounceFn = debounce(handleDebounceFn, 500)

    function handleDebounceFn(query: string) {
        const data = wildCardSearch(allMembers, query)
        setMemberList(data as Member[])
    }

    const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value)
    }

    const existingMember = (id: string) => {
        return boardMembers.some((member) => member.id === id)
    }

    const onAddMember = (member: Member) => {
        const data = cloneDeep(boardMembers)
        data.push(member)
        updateBoardMembers(data)
    }

    const onRemoveMember = (id: string) => {
        const data = cloneDeep(boardMembers).filter(
            (member) => member.id !== id,
        )
        updateBoardMembers(data)
    }

    const onDone = () => {
        closeDialog()
    }

    return (
        <div>
            <div className="text-center mb-6">
                <h4 className="mb-1">Add people</h4>
                <p>Invite existing team member to this project.</p>
            </div>
            <Input
                ref={inputRef}
                prefix={<TbSearch className="text-lg" />}
                placeholder="Quick search member"
                onChange={onSearch}
            />
            <div className="mt-4">
                <p className="font-semibold uppercase text-xs mb-4">
                    {memberList.length} members available
                </p>
                <div className="mb-6">
                    <ScrollBar className={classNames('overflow-y-auto h-80')}>
                        {memberList.map((member) => (
                            <div
                                key={member.id}
                                className="py-3 pr-5 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar shape="circle" src={member.img} />
                                    <div>
                                        <p className="heading-text font-bold">
                                            {member.name}
                                        </p>
                                        <p>{member.email}</p>
                                    </div>
                                </div>
                                {existingMember(member.id) ? (
                                    <Button
                                        size="xs"
                                        onClick={() =>
                                            onRemoveMember(member.id)
                                        }
                                    >
                                        <span className="text-red-500">
                                            Remove
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        size="xs"
                                        onClick={() => onAddMember(member)}
                                    >
                                        Add
                                    </Button>
                                )}
                            </div>
                        ))}
                    </ScrollBar>
                </div>
                <Button block variant="solid" onClick={onDone}>
                    Done
                </Button>
            </div>
        </div>
    )
}

// --- AddNewTicketContent Component ---
type AddNewTicketFormSchema = {
    title: string
}

const addNewTicketValidationSchema: ZodType<AddNewTicketFormSchema> = z.object({
    title: z.string().min(1, 'Task title is required!'),
})

const ActualAddNewTicketContent = () => {
    const { columns, board, closeDialog, updateColumns, setSelectedBoard } =
        useScrumBoardStore()

    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<AddNewTicketFormSchema>({
        defaultValues: {
            title: '',
        },
        resolver: zodResolver(addNewTicketValidationSchema),
    })

    const onFormSubmit = async ({ title }: AddNewTicketFormSchema) => {
        const data = columns
        const newCard = createCardObject()
        newCard.name = title ? title : 'Untitled Card'

        const newData = cloneDeep(data)
        if (newData[board]) { // Check if board exists
            newData[board].push(newCard)
        } else {
            newData[board] = [newCard] // Create board if it doesn't exist
        }
        
        updateColumns(newData)
        closeDialog()
        await sleep(1000) // Original sleep was 1000, not 500
        setSelectedBoard('')
    }

    return (
        <div>
            <h5>Add New Task</h5>
            <div className="mt-8">
                <Form layout="inline" onSubmit={handleSubmit(onFormSubmit)}>
                    <FormItem
                        label="Task Name"
                        invalid={Boolean(errors.title)}
                        errorMessage={errors.title?.message as string}
                    >
                        <Controller
                            name="title"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem>
                        <Button variant="solid" type="submit">
                            Add
                        </Button>
                    </FormItem>
                </Form>
            </div>
        </div>
    )
}

// --- TicketContent Component ---
interface TransformedComment extends Omit<Comment, 'date'> {
    date: Date;
}

const createCommentObject = (message: string): TransformedComment => {
    return {
        id: createUID(10),
        name: 'Angelina Gotelli', // Example user, consider making dynamic
        src: '/img/avatars/thumb-1.jpg', // Example avatar
        message: message,
        date: new Date(),
    }
}

const AddMoreMemberButton = () => { // Renamed to avoid conflict if used elsewhere
    return (
        <Tooltip title="Add More" wrapperClass="flex">
            <Button
                icon={<TbPlus />}
                // customColorClass={() => // customColorClass was removed or changed in Button component
                //     'border-2 border-dashed hover:ring-0 h-[30px] w-[30px] text-sm'
                // }
                className="border-2 border-dashed hover:ring-0 h-[30px] w-[30px] text-sm" // Use className for styling
                size="sm"
                shape="circle"
            />
        </Tooltip>
    )
}

const ActualTicketContent = ({ onTicketClose }: { onTicketClose: () => void }) => {
    const { updateColumns, ticketId, columns, boardMembers } =
        useScrumBoardStore()

    const [ticketData, setTicketData] = useState<
        Partial<Omit<Ticket, 'comments'> & { comments: TransformedComment[] }>
    >({})
    const [loading, setLoading] = useState(false)

    const commentInput = useRef<HTMLInputElement>(null) // HTMLInputElement, but used on Textarea

    const getTicketDetail = async () => {
        setLoading(true)
        let ticketDetail: Partial<Ticket> = {} // Ensure type consistency
        for (const key in columns) {
            if (Object.hasOwnProperty.call(columns, key)) {
                const board = columns[key]
                const result = board.find((ticket) => ticket.id === ticketId)
                if (result) {
                    ticketDetail = result
                    break; // Found ticket, no need to continue loop
                }
            }
        }
        // Transform comment dates if necessary
        if (ticketDetail.comments) {
            const transformedComments = ticketDetail.comments.map(c => ({...c, date: new Date(c.date)}));
            setTicketData({...ticketDetail, comments: transformedComments as TransformedComment[]});
        } else {
            setTicketData(ticketDetail);
        }
        setLoading(false)
    }

    useEffect(() => {
        if (ticketId && isEmpty(ticketData) || (ticketData.id !== ticketId)) {
            getTicketDetail();
        } else if (!isEmpty(ticketData) && ticketData.id === ticketId) { // Avoid infinite loop by checking if ticketData actually changed
            onUpdateColumn();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId, columns]); // Added columns to dependencies for updates, removed ticketData to prevent loop

     useEffect(() => { // Separate effect for updating column when ticketData changes internally
        if (!isEmpty(ticketData) && ticketData.id === ticketId) {
            onUpdateColumn();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketData]);


    const submitComment = () => {
        if (commentInput.current) {
            const message = commentInput.current.value
            if (message.trim() === '') return; // Don't submit empty comment
            const comment = createCommentObject(message)
            const comments = cloneDeep(ticketData.comments || [])
            comments?.push(comment)
            setTicketData((prevState) => ({
                ...prevState,
                comments: comments,
            }))
            commentInput.current.value = ''
        }
    }

    const handleTicketClose = () => {
        onTicketClose?.()
    }

    const onUpdateColumn = () => {
        if (isEmpty(ticketData) || !ticketData.id) return; // Do not update if no data
        const data = cloneDeep(columns)
        let updated = false;
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const board = data[key]
                const ticketIndex = board.findIndex(ticket => ticket.id === ticketData.id);
                if (ticketIndex !== -1) {
                    data[key][ticketIndex] = ticketData as Ticket;
                    updated = true;
                    break; 
                }
            }
        }
        if(updated) updateColumns(data);
    }

    const onAddMemberClick = (id: string) => {
        const newMember = boardMembers.find((member) => member.id === id)
        if (!newMember) return;
        const members = cloneDeep(ticketData.members || [])
        if (!members.find(m => m.id === newMember.id)) { // Avoid adding duplicates
            members?.push(newMember as Member)
            setTicketData((prevState) => ({
                ...prevState,
                members: members,
            }))
        }
    }

    const onAddLabelClick = (label: string) => {
        const labels = cloneDeep(ticketData.labels || [])
        if (!labels.includes(label)) { // Avoid adding duplicates
             labels?.push(label)
            setTicketData((prevState) => ({ ...prevState, labels: labels } ))
        }
    }
    
    const { TabNav, TabList, TabContent } = Tabs // Destructure Tabs locally

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <Spinner size={40} />
                </div>
            ) : isEmpty(ticketData) ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <p>Ticket not found or no data available.</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-2 mb-10">
                        <div className="w-full">
                            <div className="flex justify-between">
                                <h4>{ticketData.name}</h4>
                                <div>
                                    <CloseButton onClick={handleTicketClose} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <ScrollBar className="max-h-[380px] overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar visibility */}
                        <div className="flex flex-col gap-6">
                            <div className=''>
                                <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100 min-w-[150px]">
                                    Link to:
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label><Checkbox className='mr-1'/> Company</label>
                                    <label><Checkbox className='mr-1'/> Member</label>
                                    <label><Checkbox className='mr-1'/> Partner </label>
                                    <label><Checkbox className='mr-1'/> Inquiries</label>
                                    <label><Checkbox className='mr-1'/> Brand</label>
                                    <label><Checkbox className='mr-1'/> Categories</label>
                                    <label><Checkbox className='mr-1'/> Products</label>
                                    <label><Checkbox className='mr-1'/> Wall Listing</label>
                                    <label><Checkbox className='mr-1'/> Opportunity</label>
                                    <label><Checkbox className='mr-1'/> Offer & Demand</label>
                                    <label><Checkbox className='mr-1'/> Leads</label>
                                    <label><Checkbox className='mr-1'/> Request & Feedback</label>
                                    <label><Checkbox className='mr-1'/> campaign</label>
                                    <label><Checkbox className='mr-1'/> Teams</label>
                                    <label><Checkbox className='mr-1'/> CMS</label>
                                    <label><Checkbox className='mr-1'/> Others</label>
                                </div>
                            </div>
                            <div className='flex'>
                                <label className="font-semibold mb-2 text-gray-900 dark:text-gray-100 min-w-[150px] pt-2">
                                   Select Link :
                                </label>
                                <div className="w-full">
                                    <Select placeholder="Select link..." options={[
                                        {label: "Lead 1", value: "Lead 1"},
                                        {label: "Lead 2", value: "Lead 2"},
                                    ]}/>
                                </div>
                            </div>
                            <div className="flex items-center min-h-[30px]">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                                    Assigned to:
                                </div>
                                <div className="flex items-center gap-1">
                                    <UsersAvatarGroup
                                        className="gap-1"
                                        avatarProps={{
                                            className: 'cursor-pointer',
                                            size: 30, // Explicit size
                                        }}
                                        avatarGroupProps={{ maxCount: 4 }}
                                        // chained={false} // chained is not a prop for UsersAvatarGroup in some versions
                                        users={ticketData.members || []}
                                    />
                                    {boardMembers.length !==
                                        (ticketData.members?.length || 0) && (
                                        <Dropdown
                                            renderTitle={<AddMoreMemberButton />}
                                        >
                                            {boardMembers.map(
                                                (member) =>
                                                    !ticketData.members?.some(
                                                        (m) =>
                                                            m.id === member.id,
                                                    ) && (
                                                        <Dropdown.Item
                                                            key={member.id} // Use id for key
                                                            eventKey={member.id} // Use id for eventKey
                                                            onSelect={() => onAddMemberClick(member.id) } // Pass member.id to onSelect
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <Avatar
                                                                        shape="circle"
                                                                        size={22}
                                                                        src={member.img}
                                                                    />
                                                                    <span className="ml-2 rtl:mr-2">
                                                                        {member.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </Dropdown.Item>
                                                    ),
                                            )}
                                        </Dropdown>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center min-h-[30px]">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                                    Status:
                                </div>
                                <div className="flex items-center gap-1 flex-wrap"> {/* Added flex-wrap */}
                                    {ticketData.labels?.map((label) => (
                                        <Tag
                                            key={label}
                                            className={taskLabelColors[label] || 'bg-gray-500 text-white'} // Fallback color
                                        >
                                            {label}
                                        </Tag>
                                    ))}
                                    <Dropdown
                                        renderTitle={
                                            <Tag
                                                className="border-dashed cursor-pointer border-2 bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-500 hover:border-primary-600 hover:text-primary-600" // Adjusted hover color
                                                prefix={<TbPlus />}
                                            >
                                                Add Label
                                            </Tag>
                                        }
                                        placement="bottom-end"
                                    >
                                        {labelList.map(
                                            (labelObj) => // Assuming labelList is an array of objects {label: string, color: string} or similar
                                                !ticketData.labels?.includes(labelObj.label) && (
                                                    <Dropdown.Item
                                                        key={labelObj.label}
                                                        eventKey={labelObj.label}
                                                        onSelect={() => onAddLabelClick(labelObj.label)}
                                                    >
                                                        <div className="flex items-center">
                                                            <Badge
                                                                className="mr-2" // Added margin
                                                                innerClass={`${taskLabelColors[labelObj.label] || 'bg-gray-200'}`} // Fallback color
                                                            />
                                                            <span className="ml-2 rtl:mr-2">
                                                                {labelObj.label}
                                                            </span>
                                                        </div>
                                                    </Dropdown.Item>
                                                ),
                                        )}
                                    </Dropdown>
                                </div>
                            </div>
                            <div className='flex'>
                                <label className="font-semibold mb-2 text-gray-900 dark:text-gray-100 min-w-[150px] pt-2">
                                   Priority :
                                </label>
                                <div className="w-full">
                                    <Select placeholder="Select priority..." options={[
                                        {label: "Low", value: "Low"},
                                        {label: "Medium", value: "Medium"},
                                        {label: "High", value: "High"},
                                        {label: "Urgent", value: "Urgent"},
                                    ]}/>
                                </div>
                            </div>
                            <div className='flex'>
                                <label className="font-semibold mb-2 text-gray-900 dark:text-gray-100 min-w-[150px] pt-2">
                                   Category :
                                </label>
                                <div className="w-full">
                                    <Select placeholder="Select category..." options={[
                                        {label: "Electronics", value: "Electronics"},
                                        {label: "Plastic", value: "Plastic"},
                                    ]}/>
                                </div>
                            </div>
                            <div className="flex items-center min-h-[30px]">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                                    Due date:
                                </div>
                                <span className="font-semibold">
                                    {ticketData.dueDate ? dayjs(ticketData.dueDate).format('MMMM DD, YYYY') : 'Not set'}
                                </span>
                            </div>
                            {ticketData.description && (
                                <div className="flex">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                                        Note:
                                    </div>
                                    <div className="w-full">
                                        {/* Using Input component with textArea prop, ensure it works like a <textarea> */}
                                        <Input textArea rows={4} defaultValue={ticketData.description} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <Tabs className="mt-6" defaultValue="comments">
                            <TabList>
                                <TabNav value="comments">Activity Notes</TabNav>
                                <TabNav value="attachments">Attachments</TabNav>
                            </TabList>
                            <div className="p-4">
                                <TabContent value="comments">
                                    <div className="w-full">
                                        {ticketData.comments &&
                                            ticketData.comments.length > 0 && (
                                                <>
                                                    {ticketData.comments.map(
                                                        (comment) => (
                                                            <div
                                                                key={comment.id}
                                                                className="mb-3 flex"
                                                            >
                                                                <div className="mt-2">
                                                                    <Avatar
                                                                        shape="circle"
                                                                        src={comment.src}
                                                                    />
                                                                </div>
                                                                <div className="ml-2 rtl:mr-2 p-3 rounded-sm flex-1 bg-gray-50 dark:bg-gray-700"> {/* Added bg for contrast */}
                                                                    <div className="flex items-center mb-2">
                                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                            {comment.name}
                                                                        </span>
                                                                        <span className="mx-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            |
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {dayjs(comment.date).format('DD MMMM YYYY, h:mm A')}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mb-0 whitespace-pre-wrap"> {/* Preserve line breaks */}
                                                                        {comment.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </>
                                            )}
                                        <div className="mb-3 flex gap-2">
                                            <Avatar
                                                shape="circle"
                                                src="/img/avatars/thumb-1.jpg" // Current user avatar
                                            />
                                            <div className="w-full relative">
                                                {/* Using Input with textArea prop; ensure 'ref' is compatible or use 'Textarea' component if available and more suitable */}
                                                <Input
                                                    ref={commentInput as any} // Cast if needed for Input component
                                                    textArea
                                                    rows={3}
                                                    placeholder="Write comment..."
                                                />
                                                <div className="absolute bottom-3 right-3"> {/* Adjusted position */}
                                                    <Button
                                                        size="sm"
                                                        variant="solid"
                                                        onClick={() => submitComment()}
                                                    >
                                                        Send
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabContent>
                                <TabContent value="attachments">
                                    {ticketData.attachments &&
                                    ticketData.attachments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                            {ticketData.attachments.map(
                                                (file) => (
                                                    <Card
                                                        key={file.id}
                                                        bodyClass="px-3 pt-3 pb-1"
                                                        className="bg-gray-100 dark:bg-gray-700 shadow-none"
                                                        bordered={false} // bordered is not a standard Card prop, use border class if needed
                                                    >
                                                        <img
                                                            className="max-w-full rounded-lg h-32 object-cover" // Added fixed height and object-cover
                                                            alt={file.name}
                                                            src={file.src}
                                                        />
                                                        <div className="mt-1 flex justify-between items-center">
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate w-36" title={file.name}> {/* Added truncate */}
                                                                    {file.name}
                                                                </div>
                                                                <span className="text-xs">
                                                                    {file.size}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Tooltip title="Download">
                                                                    <Button
                                                                        variant="plain"
                                                                        size="xs"
                                                                        icon={<TbDownload />}
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Delete">
                                                                    <Button
                                                                        variant="plain"
                                                                        size="xs"
                                                                        icon={<TbTrash />}
                                                                        className="text-red-500 hover:text-red-700" // Added color
                                                                    />
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 items-center justify-center py-10"> {/* Added padding */}
                                            <NoMedia height={150} width={150} />
                                            <p className="font-semibold">
                                                No attachments
                                            </p>
                                        </div>
                                    )}
                                </TabContent>
                            </div>
                        </Tabs>
                    </ScrollBar>
                    <div className="text-right mt-4">
                        <Button
                            className="mr-2 rtl:ml-2"
                            size="sm"
                            // variant="plain" // Plain variant might not exist, use default or outline
                            onClick={() => handleTicketClose()}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            size="sm"
                            onClick={() => handleTicketClose()}
                        >
                            Save Changes
                        </Button>
                    </div>
                </>
            )}
        </>
    )
}

// --- BoardCard Component ---
interface BoardCardProps extends CardProps {
    data: Ticket;
    ref?: Ref<HTMLDivElement>; // Keep ref for Draggable
}

const BoardCard = React.forwardRef<HTMLDivElement, BoardCardProps>((props, ref) => {
    const { openDialog, updateDialogView, setSelectedTicketId } = useScrumBoardStore();
    const { data, ...rest } = props;
    const { id, name, comments, attachments, members, labels } = data;

    const onCardClick = () => {
        openDialog();
        updateDialogView('TICKET');
        setSelectedTicketId(id);
    };

    return (
        <Card
            ref={ref}
            clickable
            className="hover:shadow-lg rounded-lg mb-4 border-0 dark:bg-gray-700" // Added dark mode bg
            bodyClass="p-4"
            // onClick={onCardClick}
            {...rest}
        >
            <div className="mb-2 font-bold heading-text text-base text-gray-800 dark:text-gray-100">{name}</div>
            {labels && labels.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1"> {/* Added flex-wrap and gap */}
                    {labels.map((label, index) => (
                        <Tag
                            key={label + index}
                            className={`mr-0 rtl:ml-0 ${taskLabelColors[label] || 'bg-gray-500 text-white'}`} // Fallback color
                        >
                            {label}
                        </Tag>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between mt-3">
                <UsersAvatarGroup avatarProps={{ size: 25 }} users={members || []} />
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    {comments && comments.length > 0 && (
                        <IconText
                            className="font-semibold gap-1"
                            icon={<TbMessageCircle className="text-base" />}
                        >
                            {comments.length}
                        </IconText>
                    )}
                    {attachments && attachments.length > 0 && (
                        <IconText
                            icon={<TbPaperclip className="text-base" />} // Removed className, icon itself has size
                            className="gap-1" // Added gap
                        >
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
    // Pass down other props if BoardCard needs them from BoardCardList
    useClone?: DraggableChildrenFn;
    isCombineEnabled?: boolean;
};

// Memoize InnerList and BoardCard to prevent unnecessary re-renders during drag
const InnerList = React.memo(function InnerList(props: InnerListProps) {
    const { dropProvided, contents, ...rest } = props;

    return (
        <div ref={dropProvided.innerRef} className="board-dropzone h-full">
            <div className="px-5 h-full"> {/* Original has px-5 */}
                {contents?.map((item, index) => (
                    <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                    >
                        {(dragProvided, dragSnapshot) => (
                            <BoardCard
                                ref={dragProvided.innerRef}
                                data={item}
                                {...rest} // Pass down useClone, isCombineEnabled if needed by BoardCard directly
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{...dragProvided.draggableProps.style, opacity: dragSnapshot.isDragging ? 0.8 : 1}} // Example style change on drag
                            />
                        )}
                    </Draggable>
                ))}
                {dropProvided.placeholder} {/* Moved placeholder inside the scrollable content for better layout */}
            </div>
        </div>
    );
});

const BoardCardList = (props: BoardCardListProps) => {
    const {
        ignoreContainerClipping,
        internalScroll,
        scrollContainerStyle,
        isDropDisabled,
        isCombineEnabled,
        listId = 'LIST',
        style,
        listType,
        contents,
        useClone,
        className, // Added className to props
    } = props;

    return (
        <Droppable
            droppableId={listId}
            type={listType}
            ignoreContainerClipping={ignoreContainerClipping}
            isDropDisabled={isDropDisabled}
            isCombineEnabled={isCombineEnabled}
            renderClone={useClone}
        >
            {(dropProvided, dropSnapshot) => (
                <div
                    style={style}
                    className={classNames(
                        "board-wrapper overflow-hidden flex-auto",
                        className, // Apply passed className
                        dropSnapshot.isDraggingOver ? 'bg-blue-50 dark:bg-gray-800' : '' // Example visual feedback
                    )}
                    {...dropProvided.droppableProps}
                >
                    {internalScroll ? (
                        <div
                            className="board-scrollContainer overflow-y-auto h-full" // Added overflow-y-auto and h-full
                            style={scrollContainerStyle}
                        >
                            <InnerList
                                contents={contents}
                                dropProvided={dropProvided}
                                useClone={useClone}
                                isCombineEnabled={isCombineEnabled}
                            />
                        </div>
                    ) : (
                        <InnerList
                            contents={contents}
                            dropProvided={dropProvided}
                            useClone={useClone}
                            isCombineEnabled={isCombineEnabled}
                        />
                    )}
                    {/* Placeholder is now inside InnerList if not internalScroll, or if internalScroll, it's inside the scroll container by InnerList */}
                </div>
            )}
        </Droppable>
    );
};


// --- BoardTitle Component ---
type BoardTitleProps = {
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    title: string;
};

type RenameBoardFormSchema = { // Renamed to avoid conflict
    title: string;
};

type RenameFormProps = {
    title: string;
    closeRenameForm: () => void;
    columns: Columns;
    ordered: string[];
    onEnter: (newColumns: Columns, newOrder: string[]) => void;
};

const RenameForm = ({
    title,
    closeRenameForm,
    columns = {},
    ordered,
    onEnter,
}: RenameFormProps) => {
    
    const { control, handleSubmit, setFocus } = useForm<RenameBoardFormSchema>({
        defaultValues: {
            title,
        },
    });

    useEffect(() => {
        setFocus('title');
    }, [setFocus]);

    const onFormSubmit = (value: RenameBoardFormSchema) => {
        const newTitle = value.title.trim();

        if (!newTitle || newTitle === title) { // Check if title is empty or unchanged
            closeRenameForm();
            return;
        }

        if (ordered.some((elm) => elm === newTitle)) {
            // Handle error: title already exists (e.g., show a toast)
            console.error("Column title already exists");
            closeRenameForm(); // Or keep open and show error
            return;
        }

        const newColumns: Columns = { ...columns }; // Create a new object for immutability
        if (newColumns[title]) {
            newColumns[newTitle] = newColumns[title];
            delete newColumns[title];
        }


        const newOrder = ordered.map((elm) => {
            if (elm === title) {
                return newTitle;
            }
            return elm;
        });
        onEnter(newColumns, newOrder);
        closeRenameForm();
    };


    return (
        <Form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
            <Controller
                name="title"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                    <Input 
                        type="text" 
                        autoComplete="off" 
                        {...field} 
                        onBlur={handleSubmit(onFormSubmit)} // Submit on blur
                        className="text-base font-semibold" // Match heading style
                    />
                )}
            />
        </Form>
    );
};

const BoardTitle = (props: BoardTitleProps) => {
    const { dragHandleProps, title } = props;

    const {
        columns,
        ordered,
        openDialog,
        updateColumns,
        updateDialogView,
        setSelectedBoard,
        updateOrdered,
        deleteBoard, // Assuming a deleteBoard action in store
    } = useScrumBoardStore();

    const [renameActive, setRenameActive] = useState(false);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);

    const onRenameActive = () => {
        setRenameActive(true);
    };

    const onRenameDeactivate = () => {
        setRenameActive(false);
    };

    const onConfirmDeleteOpen = () => { // Renamed for clarity
        setConfirmDeleteDialog(true);
    };
    
    const onConfirmDeleteClose = () => {
        setConfirmDeleteDialog(false);
    };

    const onAddNewTicket = () => {
        openDialog();
        updateDialogView('NEW_TICKET');
        setSelectedBoard(title);
    };

    const onDeleteConfirmed = () => { // Renamed for clarity
        // Original logic:
        // const newOrder = ordered.filter((elm) => elm !== title);
        // const newColumns: Columns = {};
        // Object.assign(newColumns, columns);
        // delete newColumns[title];
        // updateOrdered(newOrder);
        // updateColumns(newColumns); // Added this based on typical store patterns

        // Using store action if available:
        if (deleteBoard) {
             deleteBoard(title);
        } else { // Fallback to original manual update
            const newOrder = ordered.filter((elm) => elm !== title);
            const newColumnsState = { ...columns };
            delete newColumnsState[title];
            updateOrdered(newOrder);
            updateColumns(newColumnsState);
        }
        setConfirmDeleteDialog(false); // Close dialog after deletion
    };

    const handleRenameEnter = (newColumns: Columns, newOrder: string[]) => {
        updateColumns(newColumns);
        updateOrdered(newOrder);
    };

    return (
        <div
            className="board-title px-4 py-3 flex justify-between items-center border-b dark:border-gray-700" // Adjusted padding and border
            {...dragHandleProps}
        >
            {renameActive ? (
                <div className="flex items-center w-full gap-2">
                    <RenameForm
                        title={title}
                        closeRenameForm={onRenameDeactivate}
                        columns={columns as Columns}
                        ordered={ordered}
                        onEnter={handleRenameEnter}
                    />
                    <TbCircleXFilled
                        className="cursor-pointer text-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={onRenameDeactivate}
                    />
                </div>
            ) : (
                <>
                    <h6 className="truncate" title={title}>{title}</h6> {/* Added truncate and title for long names */}
                    <Dropdown
                        placement="bottom-end"
                        renderTitle={<EllipsisButton />}
                    >
                        <Dropdown.Item eventKey="renameBoard" onClick={onRenameActive} className="gap-2">
                            <TbPencil />
                            <span>Rename</span>
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="addTicket" onClick={onAddNewTicket} className="gap-2">
                            <TbPlus />
                            <span>Add Task</span>
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="deleteBoard" onClick={onConfirmDeleteOpen} className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                            <TbTrash />
                            <span>Delete Board</span>
                        </Dropdown.Item>
                    </Dropdown>
                </>
            )}
            <ConfirmDialog
                isOpen={confirmDeleteDialog}
                type="danger"
                title="Delete Board"
                confirmButtonColor="red-600"
                onClose={onConfirmDeleteClose}
                onRequestClose={onConfirmDeleteClose} // for ESC key or overlay click
                onCancel={onConfirmDeleteClose}
                onConfirm={onDeleteConfirmed}
            >
                <p>
                    Are you sure you want to delete this board? All the tasks
                    under this board will be deleted as well. This action cannot
                    be undone.
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

    return (
        <Draggable draggableId={title} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    className={classNames(
                        "board-column flex flex-col mb-3 min-w-[300px] w-[300px] max-w-[300px] p-0 dark:bg-gray-800 bg-gray-100 rounded-lg shadow-sm", // Adjusted bg, rounded, shadow
                        snapshot.isDragging ? "shadow-lg" : ""
                    )}
                    {...provided.draggableProps}
                    // dragHandleProps is applied by BoardTitle
                >
                    <BoardTitle
                        title={title}
                        dragHandleProps={provided.dragHandleProps}
                    />
                    <BoardCardList
                        listId={title}
                        listType="CONTENT" // Ensure this matches Droppable type in Board
                        className={snapshot.isDragging ? 'is-dragging' : ''} // This className seems for the list, not column
                        contents={contents}
                        internalScroll={isScrollable}
                        isCombineEnabled={isCombineEnabled}
                        useClone={useClone}
                        scrollContainerStyle={{ maxHeight: isScrollable ? 'calc(100vh - 250px)' : undefined, paddingBottom: '8px' }} // Example max height
                    />
                </div>
            )}
        </Draggable>
    );
};


// --- ScrumBoardHeader Component ---
const ScrumBoardHeader = ({ boardMembers = [] }: { boardMembers: Member[] }) => {
    const navigate = useNavigate();
    const { updateDialogView, openDialog } = useScrumBoardStore();

    const onAddMember = () => {
        updateDialogView('ADD_MEMBER');
        openDialog();
    };

    const handleAddNewColumn = () => {
        updateDialogView('NEW_COLUMN');
        openDialog();
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h3 className="text-xl font-bold dark:text-white">Task Board</h3>
                {/* <p className="font-semibold">Add Task</p> */}
            </div>
           
        </div>
    );
};


const transformApiTaskToTicket = (apiTask: any): Ticket => {
    const members: Member[] = (apiTask.assign_to_users || []).map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email || `user-${user.id}@example.com`, // Fallback email
        img: user.profile_pic_path || '', // Provide a fallback avatar if needed
    }));

    const comments: Comment[] = (apiTask.activity_notes || []).map((note: any) => ({
        id: note.id.toString(),
        name: note.user.name,
        src: note.user.profile_pic_path || '',
        message: note.activity_comment,
        date: new Date(note.created_at),
    }));

    const attachments: Attachment[] = (apiTask.attachments || []).map((att: any) => ({
        id: att.id.toString(),
        name: att.attachment_name,
        src: att.attachment_path, // Ensure this is a full URL or prefix with base URL if needed
        size: att.attachment_type, // API provides type, can be displayed or converted
    }));

    // Labels for board card display - typically status and priority
    const cardLabels: string[] = [];
    if (apiTask.status) {
        cardLabels.push(apiTask.status);
    }
    // if (apiTask.priority) { // Decided to show priority separately in ticket detail
    //     cardLabels.push(apiTask.priority);
    // }

    return {
        id: apiTask.id.toString(),
        name: apiTask.task_title,
        description: apiTask.additional_description || apiTask.note_remark || '',
        dueDate: apiTask.due_data ? new Date(apiTask.due_data) : undefined,
        labels: cardLabels, // These are the tags shown on the card
        members: members,
        comments: comments,
        attachments: attachments,
        priority: apiTask.priority, // For detailed view
        category: apiTask.department_info?.name || apiTask.module_name, // For detailed view
        _originalApiData: apiTask,
    };
};

// --- Main Board Component ---
const Board = (props: BoardProps) => {

    const navigate = useNavigate();
      const dispatch = useAppDispatch();
    const {
        columns,
        ordered,
        boardMembers,
        updateOrdered,
        updateColumns,
        updateBoardMembers,
        updateAllMembers,
        closeDialog,
        resetView,
        dialogView,
        dialogOpen,
    } = useScrumBoardStore();

    const {
        containerHeight, // default false
        useClone, // default undefined
        isCombineEnabled, // default false
        withScrollableColumns, // default false
    } = props;
const DEFAULT_BOARD_STATUSES = [
    "Not Started", 
    "Pending", 
    "In Progress", 
    "On Hold", 
    "Review", 
    "Completed", 
    "Cancelled"
];
   const { AllTaskDataByStatues = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

    useEffect(() => { dispatch(getAllTaskByStatuesAction()); }, [dispatch]);
    console.log("AllTaskDataByStatues",AllTaskDataByStatues);
    
  useEffect(() => {
    // Only process when loading is complete (or an attempt to load has finished)
    if (masterLoadingStatus === 'idle') {
        const newColumns: Columns = {}; // Assuming Columns is something like Record<string, Ticket[]>

        // Safely access API data, defaulting to an empty object if it's not a valid object
        const safeApiData = (AllTaskDataByStatues && typeof AllTaskDataByStatues === 'object' && !Array.isArray(AllTaskDataByStatues))
            ? AllTaskDataByStatues
            : {};

        // Log a warning if the API data was not in the expected format
        if (AllTaskDataByStatues && (typeof AllTaskDataByStatues !== 'object' || Array.isArray(AllTaskDataByStatues))) {
            console.warn(
                "AllTaskDataByStatues from API/Redux was not in the expected object format. Will initialize boards as empty or with partial data if possible. Data received:", 
                AllTaskDataByStatues
            );
        }

        // Iterate over the definitive list of statuses to ensure all are present
        DEFAULT_BOARD_STATUSES.forEach(statusKey => {
            const apiTasksForStatus: any[] = safeApiData[statusKey];

            if (Array.isArray(apiTasksForStatus)) {
                // If API provides an array for this status (even an empty one), map it
                newColumns[statusKey] = apiTasksForStatus.map(apiTask => transformApiTaskToTicket(apiTask));
            } else {
                // If statusKey is not in safeApiData OR safeApiData[statusKey] is not an array,
                // initialize this column as empty.
                newColumns[statusKey] = []; 
                
                // Optionally, log if the key existed in API data but wasn't an array
                if (safeApiData.hasOwnProperty(statusKey) && !Array.isArray(apiTasksForStatus)) {
                    console.warn(
                        `Data for status "${statusKey}" was expected to be an array but was not:`, 
                        apiTasksForStatus
                    );
                }
            }
        });
        
        // Optional: Log any statuses received from the API that are NOT in DEFAULT_BOARD_STATUSES
        // These statuses will be ignored by the current setup.
        Object.keys(safeApiData).forEach(apiStatusKey => {
            if (!DEFAULT_BOARD_STATUSES.includes(apiStatusKey)) {
                console.warn(
                    `API returned status "${apiStatusKey}" which is not in the predefined DEFAULT_BOARD_STATUSES list. This status and its tasks will be ignored.`
                );
            }
        });

        updateColumns(newColumns);
        // The 'ordered' state will be directly from our definitive list, ensuring correct order and inclusion
        updateOrdered([...DEFAULT_BOARD_STATUSES]); // Use a copy to be safe

    } 
    // You might have other conditions for 'masterLoadingStatus' (e.g., 'loading', 'failed')
    // to set loading states or display errors, but this useEffect specifically handles 'idle'.

}, [
    AllTaskDataByStatues, 
    masterLoadingStatus, 
    updateColumns, 
    updateOrdered, 
    // transformApiTaskToTicket // Add if it's a prop or defined in a way that its reference can change
]);

    const TicketContent = lazy(() => Promise.resolve({ default: ActualTicketContent }));
    const AddNewTicketContent = lazy(() => Promise.resolve({ default: ActualAddNewTicketContent }));
    const AddNewMemberContent = lazy(() => Promise.resolve({ default: ActualAddNewMemberContent }));
    const AddNewColumnContent = lazy(() => Promise.resolve({ default: ActualAddNewColumnContent }));


    const onDialogClose = async () => {
        closeDialog();
        await sleep(200); // Wait for dialog close animation
        resetView();
    };

   

    const onDragEnd = async (result: DropResult) => { // Make the handler async
    const { source, destination, combine, type, draggableId } = result;

    // 1. Handling combining items
    if (combine) {
        if (type === 'COLUMN') {
            const shallow = [...ordered];
            shallow.splice(source.index, 1);
            updateOrdered(shallow);

            // Also remove the column from 'columns' state
            // IMPORTANT: If 'ordered' contains IDs that are keys in 'columns'
            const columnIdToRemove = ordered[source.index]; // Get the ID *before* splicing 'ordered'
            if (columnIdToRemove) {
                const newColumns = { ...columns };
                delete newColumns[columnIdToRemove];
                updateColumns(newColumns);
            } else {
                console.warn("Could not determine column ID to remove for combine operation.");
            }
            return;
        }

        // Ticket combining (if implemented)
        const column = columns[source.droppableId];
        if (column) {
            const withQuoteRemoved = [...column];
            withQuoteRemoved.splice(source.index, 1);
            const newColumns = {
                ...columns,
                [source.droppableId]: withQuoteRemoved,
            };
            updateColumns(newColumns);
            // NOTE: You might want an API call here too if combining means a status change or deletion.
        }
        return;
    }

    // 2. Item dropped outside a droppable area
    if (!destination) {
        return;
    }

    // 3. Item dropped in the same place
    if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
    ) {
        return;
    }

    // 4. Reordering Columns
    if (type === 'COLUMN') {
        const newOrdered = reoderArray( // Assuming reoderArray is reorderArray
            ordered,
            source.index,
            destination.index,
        );
        updateOrdered(newOrdered as string[]); // Ensure type
        return;
    }

    // 5. Reordering or Moving Tickets (this is where the main logic for tickets goes)
    // At this point, type is not 'COLUMN', so it's a ticket.

    const oldColumnsState = { ...columns }; // Save old state for potential revert on API failure

    const data = reorderDragable<Record<string, Ticket[]>>({
        quoteMap: columns, // current columns
        source,
        destination,
    });

    updateColumns(data.quoteMap); // Optimistically update the UI
console.log("source.droppableId !== destination.droppableId",source.droppableId !== destination.droppableId);

    // Check if the ticket moved to a DIFFERENT column
    if (source.droppableId !== destination.droppableId) {
        // This is where you call your API
        const taskId = parseInt(draggableId, 10); // Assuming draggableId is the string version of task_id
        const newStatus = destination.droppableId; // This is the ID of the column (e.g., "Start", "InProgress")

        if (isNaN(taskId)) {
            console.error("Invalid draggableId, cannot parse to taskId:", draggableId);
            // Optionally revert UI
            // updateColumns(oldColumnsState);
            return;
        }

        const payload = {
            user_id: 53, // Get this from your app's auth state
            task_id: taskId,
            status: newStatus,
        };

        console.log("Calling API task-status-update with:", payload);
        // const success = await updateTaskStatusAPI(payload);
const success = await dispatch(updateTaskStatusAPI(payload)).unwrap();
        if (!success) {
            // API call failed, consider reverting the optimistic UI update
            console.warn("API call failed. Reverting UI change.");
            // To revert, you'd need to re-apply the state before the drag
            // This can get complex if you allow multiple quick drags.
            // A simple revert would be:
            // updateColumns(oldColumnsState); // This might not be perfectly accurate if other changes happened
            // For a more robust solution, you might need to re-fetch or use a more sophisticated state management.
            alert("Failed to update task status. The change has been reverted (or please refresh).");
            // For a simple revert of *this specific move*, you can reconstruct the previous state
            // by moving the item back programmatically, but that's more involved.
            // Simplest for now is to inform the user and potentially revert to `oldColumnsState`.
            // Let's assume for now, we just log the error and the optimistic update stays.
        }
    }
    // If it's just reordering within the same column (source.droppableId === destination.droppableId),
    // the UI is already updated by updateColumns(data.quoteMap), and no API call for status change is needed.
    // You might have a different API for reordering tasks within a list, if that's required.
};
     

    return (
        <>
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col"> {/* Added padding */}
                <ScrumBoardHeader boardMembers={boardMembers} />
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable
                        droppableId="board" // This ID should be unique for the board itself
                        type="COLUMN" // This Droppable accepts COLUMN Draggables
                        direction="horizontal"
                        ignoreContainerClipping={Boolean(containerHeight)} // Ensure boolean
                        isCombineEnabled={isCombineEnabled}
                    >
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                className="scrumboard flex flex-col flex-auto w-full mb-2" // Original class
                                {...provided.droppableProps}
                            >
                                <div className="scrumboard-body flex flex-nowrap max-w-full overflow-x-auto h-full mt-4 gap-4 pb-2"> {/* Added flex-nowrap and pb-2 */}
                                    {ordered.map((key, index) => (
                                        columns[key] ? ( // Ensure column data exists
                                            <BoardColumn
                                                key={key}
                                                index={index}
                                                title={key}
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
            </AdaptiveCard>
            <Dialog
                isOpen={dialogOpen}
                width={dialogView === 'TICKET' ? 800 : 520} // Increased width for TICKET view
                closable={dialogView !== 'TICKET'} // Tickets might have custom close logic
                onClose={onDialogClose}
                onRequestClose={onDialogClose} // Handles ESC and overlay click
                // bodyOpenClassName="overflow-hidden" // Prevent body scroll when dialog is open
            >
                <Suspense
                    fallback={
                        <div className="flex justify-center items-center h-60"> {/* Added h-60 */}
                            <Spinner size={40}/>
                        </div>
                    }
                >
                    {dialogView === 'TICKET' && ticketId && ( // Ensure ticketId is present
                        <TicketContent onTicketClose={onDialogClose} />
                    )}
                    {dialogView === 'NEW_TICKET' && <AddNewTicketContent />}
                    {dialogView === 'NEW_COLUMN' && <AddNewColumnContent />}
                    {dialogView === 'ADD_MEMBER' && <AddNewMemberContent />}
                </Suspense>
            </Dialog>
        </>
    );
};

export default Board;