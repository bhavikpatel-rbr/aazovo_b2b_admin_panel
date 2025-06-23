// src/views/your-path/EditTaskPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs'; // For comment timestamps

import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import { NavLink } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
// UI Components (similar to CreateTaskPage)
import Container from '@/components/shared/Container';
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import { Button, Checkbox, Select, Input, Tag, Avatar, Dropdown, ScrollBar, Tabs, Card, Spinner } from '@/components/ui';
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup';
import CloseButton from '@/components/ui/CloseButton';
import { HiOutlinePlus } from 'react-icons/hi';
import { TbDownload, TbPlus, TbTrash, TbPaperclip } from 'react-icons/tb'; // TbFileText might not be needed if using generic icon
import DatePicker from '@/components/ui/DatePicker';
import Tooltip from '@/components/ui/Tooltip'; // For attachment actions

// Redux (Keep for future real implementation)
import { useAppDispatch } from '@/reduxtool/store';
// import {
//     // getTaskByIdAction,
//     // updateTaskAction,
//     // getAssignableUsersAction,
//     // getTaskCategoriesAction,
//     // getTaskLinkableEntitiesAction,
// } from '@/reduxtool/your-task-module/taskMiddleware';

// Types
import type { TaskItem, TaskStatus } from '../TaskList'; // Assuming TaskStatus is defined here or globally

type User = { id: string; name: string; img: string; };
type AttachmentFile = {
    id: string;
    name: string;
    size: string;
    src: string;
    file?: File;
    serverPath?: string; // Path on server for existing files
    isNew?: boolean;
    isDeleted?: boolean; // To mark existing attachments for deletion
};
type Comment = { id: string; name: string; src: string; date: Date; message: string; };

const LINK_TO_OPTIONS = [ "Company", "Member", "Partner", "Inquiries", "Brand", "Categories", "Products", "Wall Listing", "Opportunity", "Offer & Demand", "Leads", "Request & Feedback", "campaign", "Teams", "CMS", "Others"] as const;
type LinkToOption = typeof LINK_TO_OPTIONS[number];

const taskStatusValues: TaskStatus[] = ["pending", "in_progress", "on_hold", "completed", "cancelled"];
const DUMMY_LABEL_OPTIONS = ["Bug", "Feature", "Urgent", "Project Alpha", "Client Request", "Quick Fix"] as const; // Example general labels/tags
type LabelOption = typeof DUMMY_LABEL_OPTIONS[number];


// Zod Schema: Adjusted to include 'labels' and ensure consistency with CreateTaskPage where applicable
const editTaskSchema = z.object({
  linkedToTypes: z.array(z.enum(LINK_TO_OPTIONS)).min(1, "Select at least one item to link to."),
  selectedLinkEntityId: z.string().optional().nullable(),
  assignedToIds: z.array(z.string()).min(1, "Assign to at least one member."),
  labels: z.array(z.string()).optional(), // For general tags, similar to CreateTaskPage's "statusLabels"
  priority: z.enum(["Low", "Medium", "High", "Urgent"], { required_error: "Priority is required." }),
  category: z.string().min(1, "Category is required."),
  status: z.enum(taskStatusValues, { required_error: "Status (lifecycle) is required." }), // Core task status
  dueDate: z.date({ required_error: "Due date is required." }),
  note: z.string().min(1, "Note/Task title is required.").max(500),
  description: z.string().optional(),
});
type EditTaskFormData = z.infer<typeof editTaskSchema>;


// --- Dummy Data (largely same as CreateTaskPage, adapt as needed) ---
const DUMMY_BOARD_MEMBERS: User[] = [ { id: 'user1', name: 'Alice Johnson', img: '/img/avatars/thumb-1.jpg' }, { id: 'user2', name: 'Bob Williams', img: '/img/avatars/thumb-2.jpg' }, { id: 'user3', name: 'Carol Davis', img: '/img/avatars/thumb-3.jpg' }, { id: 'user4', name: 'David Brown', img: '/img/avatars/thumb-4.jpg' }, ];
const DUMMY_PRIORITY_OPTIONS = [ {label: "Low", value: "Low"}, {label: "Medium", value: "Medium"}, {label: "High", value: "High"}, {label: "Urgent", value: "Urgent"} ];
const DUMMY_CATEGORY_OPTIONS = [ {label: "General", value: "General"}, {label: "Development", value: "Development"}, {label: "Marketing", value: "Marketing"}, {label: "Sales", value: "Sales"} ];
const DUMMY_STATUS_OPTIONS = taskStatusValues.map(s => ({ label: s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value: s }));
const DUMMY_LINK_SELECT_OPTIONS: Record<LinkToOption, {label: string, value: string}[]> = { "Company": [{label: "Company A", value: "compA"}, {label: "Company B", value: "compB"}], "Member": [{label: "Member X", value: "memX"}, {label: "Member Y", value: "memY"}], "Partner": [], "Inquiries": [], "Brand": [], "Categories": [], "Products": [], "Wall Listing": [], "Opportunity": [], "Offer & Demand": [], "Leads": [], "Request & Feedback": [], "campaign": [], "Teams": [], "CMS": [], "Others": []};

const taskUiColors: Record<string, string> = { // For labels and status tags
  // For General Labels/Tags (can be expanded)
  Bug: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
  Feature: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100',
  Urgent: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
  "Project Alpha": 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100',
  "Client Request": 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
  "Quick Fix": 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100',
  // For Task Status
  pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100',
  in_progress: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
  completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
  on_hold: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200',
  cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100',
};

const AddMoreButton = ({ icon, text }: { icon?: React.ReactNode, text: string }) => (
    <Tag className="border-dashed cursor-pointer border-2 bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-500 hover:border-primary-500 hover:text-primary-500" prefix={icon || <TbPlus />}>
        {text}
    </Tag>
);


// MOCK: Simulate fetching a task (replace with actual API call)
const fetchTaskById = async (id: string): Promise<TaskItem | undefined> => {
    console.log(`Simulating fetch for task ID: ${id}`);
    const { initialTaskListData } = await import('../TaskList');
    return new Promise(resolve => setTimeout(() => {
        const task = initialTaskListData.find(task => task.id === id);
        // Simulate richer task data for editing, including 'labels' and more complex 'linkedTo'
        if (task && task.id === "TL001") {
            resolve({
                ...task,
                labels: ["Project Alpha", "Urgent"],
                linkedTo: [{ type: "Company", id: "compA", name: "Company A" }],
                description: "This is a more detailed description for TL001 fetched for editing.",
                // comments: [{id: 'cmt1', name: 'Alice', src: '/img/avatars/thumb-1.jpg', date: new Date(), message: 'Initial comment from server.'}],
                // attachments: [{ id: 'attServ1', name: 'server_document.pdf', size: '1.2MB', serverPath: 'docs/server_document.pdf', src: '/path/to/server_document.pdf' }]
            });
        } else if (task) {
             resolve(task);
        }
        else {
            resolve(undefined);
        }
    }, 500));
};


const EditTaskPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch(); // Keep for future redux integration

  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isValid, isDirty } } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    mode: "onChange",
  });

  // UI-specific states, similar to CreateTaskPage
  const [selectedLinkedToTypes, setSelectedLinkedToTypes] = useState<LinkToOption[]>([]);
  const [linkSelectOptions, setLinkSelectOptions] = useState<{label: string, value: string}[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<User[]>([]);
  const [currentLabels, setCurrentLabels] = useState<string[]>([]); // For general tags
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const watchedLinkedToTypes = watch("linkedToTypes");
  const watchedAssignedToIds = watch("assignedToIds");
  const watchedLabels = watch("labels");


  // Fetch task data and populate form & UI states
  useEffect(() => {
    if (id) {
      setIsLoadingTask(true);
      fetchTaskById(id) // !!! REPLACE with dispatch(getTaskByIdAction(id)).unwrap() !!!
        .then((taskData) => {
          if (taskData) {
            setEditingTask(taskData);
            
            // Populate form using reset
            reset({
              linkedToTypes: taskData.linkedTo?.map(l => l.type as LinkToOption) || [],
              selectedLinkEntityId: taskData.linkedTo?.[0]?.id || null, // Assuming first one for simplicity
              assignedToIds: typeof taskData.assignTo === 'string'
                ? DUMMY_BOARD_MEMBERS.filter(m => m.name === taskData.assignTo).map(m => m.id) // Handle single name
                : (Array.isArray(taskData.assignTo) ? taskData.assignTo : []) || [], // Handle array of IDs
              labels: taskData.labels || [],
              priority: taskData.priority as EditTaskFormData['priority'] || "Medium",
              category: taskData.category || DUMMY_CATEGORY_OPTIONS[0]?.value,
              status: taskData.status as TaskStatus,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : new Date(),
              note: taskData.note,
              description: taskData.description || "",
            });

            // Populate local UI states from taskData
            setAssignedMembers(DUMMY_BOARD_MEMBERS.filter(m => {
                const assignees = typeof taskData.assignTo === 'string' ? [taskData.assignTo] : (taskData.assignTo || []);
                return assignees.includes(m.id) || assignees.includes(m.name);
            }));
            setCurrentLabels(taskData.labels || []);
            setComments(taskData.comments?.map(c => ({...c, date: new Date(c.date)})) || []); // Ensure date is Date object
            setAttachments(taskData.attachments?.map(att => ({
                id: att.id || `srv-${att.serverPath || att.name}`, // Use server ID or generate one
                name: att.name,
                size: att.size || 'N/A',
                // IMPORTANT: Construct the actual src URL based on your API
                src: att.src || (att.serverPath ? `YOUR_API_BASE_URL/attachments/${att.serverPath}` : '/img/icons/file-generic.png'),
                serverPath: att.serverPath,
                isNew: false,
                isDeleted: false,
            })) || []);

          } else {
            toast.push(<Notification title="Error" type="danger">Task not found (ID: {id}).</Notification>);
            navigate("/tasks"); // Adjust path as needed
          }
        })
        .catch(err => {
          console.error("Failed to fetch task for editing:", err);
          toast.push(<Notification title="Error" type="danger">Could not load task data.</Notification>);
          navigate("/tasks"); // Adjust path as needed
        })
        .finally(() => setIsLoadingTask(false));
    } else {
        toast.push(<Notification title="Error" type="danger">Task ID missing.</Notification>);
        navigate("/tasks"); // Adjust path as needed
    }
  }, [id, dispatch, navigate, reset]);


  useEffect(() => {
    setSelectedLinkedToTypes(watchedLinkedToTypes || []);
    if (watchedLinkedToTypes && watchedLinkedToTypes.length > 0) {
      const firstSelectedType = watchedLinkedToTypes[0];
      setLinkSelectOptions(DUMMY_LINK_SELECT_OPTIONS[firstSelectedType] || []);
      // Preserve selectedLinkEntityId if its type is still in watchedLinkedToTypes
      const currentEntityLink = editingTask?.linkedTo?.find(link => link.id === watch('selectedLinkEntityId'));
      if (currentEntityLink && !watchedLinkedToTypes.includes(currentEntityLink.type as LinkToOption)) {
        setValue("selectedLinkEntityId", null); // Reset if type is no longer selected
      } else if (!watch('selectedLinkEntityId') && DUMMY_LINK_SELECT_OPTIONS[firstSelectedType]?.length > 0) {
        // If nothing is selected and options exist, don't automatically set one unless it was from initial data
      }
    } else {
      setLinkSelectOptions([]);
      setValue("selectedLinkEntityId", null);
    }
  }, [watchedLinkedToTypes, setValue, editingTask, watch]);


  useEffect(() => {
    if (watchedAssignedToIds) {
        const newAssigned = DUMMY_BOARD_MEMBERS.filter(user => watchedAssignedToIds.includes(user.id));
        // Only update if there's an actual change to prevent infinite loops if objects are different but content same
        if (JSON.stringify(newAssigned.map(u => u.id).sort()) !== JSON.stringify(assignedMembers.map(u => u.id).sort())) {
            setAssignedMembers(newAssigned);
        }
    }
  }, [watchedAssignedToIds, assignedMembers]); // Removed assignedMembers from dep array or use a more stable comparison

  useEffect(() => {
    if (watchedLabels) {
        // Only update if there's an actual change
        if (JSON.stringify(watchedLabels.sort()) !== JSON.stringify(currentLabels.sort())) {
            setCurrentLabels(watchedLabels);
        }
    }
  }, [watchedLabels, currentLabels]);


  const handleTicketClose = () => navigate("/tasks"); // Adjust path as needed

  const handleAddMember = (memberId: string) => {
    const member = DUMMY_BOARD_MEMBERS.find(m => m.id === memberId);
    if (member && !assignedMembers.some(am => am.id === memberId)) {
      const newAssignedIds = [...(watch("assignedToIds") || []), member.id];
      setValue("assignedToIds", newAssignedIds, { shouldValidate: true, shouldDirty: true });
      // setAssignedMembers will be updated by the useEffect watching assignedToIds
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const newAssignedIds = (watch("assignedToIds") || []).filter(id => id !== memberId);
    setValue("assignedToIds", newAssignedIds, { shouldValidate: true, shouldDirty: true });
    // setAssignedMembers will be updated by the useEffect watching assignedToIds
  };

  const handleAddLabel = (label: string) => {
    if (!currentLabels.includes(label)) {
      const newLabels = [...currentLabels, label];
      setValue("labels", newLabels, { shouldValidate: true, shouldDirty: true });
      // setCurrentLabels will be updated by useEffect watching 'labels'
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const newLabels = currentLabels.filter(label => label !== labelToRemove);
    setValue("labels", newLabels, { shouldValidate: true, shouldDirty: true });
    // setCurrentLabels will be updated by useEffect watching 'labels'
  };

  const submitComment = () => {
    if (commentInputRef.current?.value) {
      const newComment: Comment = {
        id: `c${Date.now()}`,
        name: 'Current User (Edited)', // Placeholder
        src: '/img/avatars/thumb-1.jpg', // Placeholder
        date: new Date(),
        message: commentInputRef.current.value
      };
      setComments(prevComments => [...prevComments, newComment]);
      commentInputRef.current.value = '';
      // Mark form as dirty if comments are part of the save payload
      // setValue('comments', newComments, { shouldDirty: true }); // If comments are part of RHF
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
        id: `new-${Date.now()}-${file.name}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        src: URL.createObjectURL(file),
        file: file,
        isNew: true,
        isDeleted: false
      }));
      setAttachments(prev => [...prev.filter(a => !a.isDeleted), ...newAttachments]);
      // Optionally, mark form as dirty:
      // This depends on how you handle the overall dirty state for the save button
      // if (!isDirty) setValue('note', watch('note'), { shouldDirty: true }); // A trick to make form dirty
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    const attachment = attachments.find(att => att.id === fileId);
    if (attachment) {
      if (attachment.isNew) { // New file, remove from list and revoke blob URL
        if (attachment.src.startsWith('blob:')) URL.revokeObjectURL(attachment.src);
        setAttachments(prev => prev.filter(att => att.id !== fileId));
      } else { // Existing server file, mark as deleted
        setAttachments(prev => prev.map(att => att.id === fileId ? { ...att, isDeleted: true, src: att.src + '?deleted=true' /* visual cue */ } : att));
      }
    }
  };
  
  const handleUndoRemoveAttachment = (fileId: string) => {
    setAttachments(prev => prev.map(att => att.id === fileId ? { ...att, isDeleted: false, src: att.src.replace('?deleted=true', '') } : att ));
  }


  const onSubmit = (data: EditTaskFormData) => {
    if (!editingTask) return;
    console.log("Edit Task Form Data:", data);
    console.log("Current Labels (UI state):", currentLabels); // Should match data.labels
    console.log("Comments (UI state):", comments);

    const newAttachmentsToUpload = attachments.filter(a => a.isNew && a.file && !a.isDeleted).map(a => a.file as File);
    const existingAttachmentsToDelete = attachments.filter(a => !a.isNew && a.isDeleted && a.serverPath).map(a => ({ id: a.id, serverPath: a.serverPath }));
    const finalAttachmentsState = attachments.filter(a => !a.isDeleted); // For updating local state or optimistic UI

    console.log("New Attachments to Upload:", newAttachmentsToUpload);
    console.log("Existing Attachments to Delete:", existingAttachmentsToDelete);
    
    const payload = {
        ...data, // Contains all RHF managed fields including 'labels'
        // comments, // If comments are part of the task update payload
        // newAttachments: newAttachmentsToUpload, // If sending files separately
        // deletedAttachmentIds: existingAttachmentsToDelete.map(a => a.id), // Or serverPaths
    };
    console.log("Dispatching updateTaskAction with payload:", payload, "and Task ID:", editingTask.id);
    
    // !!! dispatch(updateTaskAction({ id: editingTask.id, taskData: payload, newAttachments: newAttachmentsToUpload, deletedAttachments: existingAttachmentsToDelete })).unwrap() !!!
    //   .then(() => {
    //     toast.push(<Notification title="Success" type="success">Task Updated!</Notification>);
    //     navigate("/tasks"); // Adjust path
    //   })
    //   .catch(err => {
    //     toast.push(<Notification title="Error" type="danger">Update Failed: {err.message || 'Unknown error'}</Notification>);
    //   });
    alert("Update Task Logic (Not Implemented) - Data in console. Implement Redux action.");
  };

  if (isLoadingTask) { return <Container><div className="flex justify-center items-center h-screen"><Spinner size="3rem" /></div></Container>; }
  if (!editingTask && !isLoadingTask) { return <Container><AdaptiveCard><p className="p-4 text-center">Task not found or error loading task.</p></AdaptiveCard></Container>; }

  const hasAttachmentChanges = attachments.some(a => a.isNew || a.isDeleted);
  const isSaveDisabled = (!isDirty && !hasAttachmentChanges && comments.length === (editingTask?.comments?.length || 0)) || !isValid;


  return (
    <Container>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/task/task-list">
          <h6 className="font-semibold hover:text-primary">Task</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Edit Task</h6>
      </div>
      <AdaptiveCard>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold">Edit Task (ID: {editingTask?.id})</h4>
          </div>
            <div className="flex flex-col gap-6 p-1">
                {/* Link to Section (as Select) */}
                <div>
                <label className="font-semibold mb-2 text-gray-900 dark:text-gray-100 block">
                  Link to: <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="linkedToTypes"
                  control={control}
                  render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    options={LINK_TO_OPTIONS.map(option => ({
                    label: option,
                    value: option,
                    }))}
                    value={LINK_TO_OPTIONS.filter(option => field.value?.includes(option)).map(option => ({
                    label: option,
                    value: option,
                    }))}
                    onChange={selectedOptions => {
                    field.onChange(selectedOptions ? selectedOptions.map((opt: any) => opt.value) : []);
                    }}
                    placeholder="Select link types..."
                  />
                  )}
                />
                {errors.linkedToTypes && (
                  <p className="text-red-500 text-xs mt-1">{errors.linkedToTypes.message}</p>
                )}
                </div>

              {/* Select Link Section (Dynamic) */}
              {selectedLinkedToTypes.length > 0 && (
                <div className="flex items-center">
                  <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                    Select {selectedLinkedToTypes.join(' / ')}:
                  </label>
                  <div className="w-full">
                    <Controller name="selectedLinkEntityId" control={control}
                      render={({ field }) => (
                        <Select {...field} placeholder={`Select a ${selectedLinkedToTypes[0]}...`}
                          options={linkSelectOptions}
                          value={linkSelectOptions.find(opt => opt.value === field.value)}
                          onChange={option => field.onChange(option?.value)}
                          isClearable />
                      )} />
                    {/* errors.selectedLinkEntityId logic if it becomes required conditionally */}
                  </div>
                </div>
              )}

              {/* Assigned to Section */}
              <div className="flex items-start">
                <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0 mt-2">
                    Assigned to: <span className="text-red-500">*</span>
                </label>
                <div className="w-full">
                    <div className="flex items-center gap-1 flex-wrap">
                        <UsersAvatarGroup className="gap-1" avatarProps={{ className: 'cursor-pointer' }}
                            avatarGroupProps={{ maxCount: 4 }} nameKey="name" imgKey="img"
                            users={assignedMembers}
                            onAvatarClick={(member: User) => handleRemoveMember(member.id)} />
                        {DUMMY_BOARD_MEMBERS.length !== assignedMembers.length && (
                            <Dropdown renderTitle={ <div className="flex items-center justify-center w-8 h-8 text-2xl text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"> <HiOutlinePlus /> </div> }>
                                {DUMMY_BOARD_MEMBERS.map(member =>
                                    !assignedMembers.some(m => m.id === member.id) && (
                                        <Dropdown.Item key={member.id} eventKey={member.id} onSelect={() => handleAddMember(member.id)}>
                                            <div className="flex items-center">
                                                <Avatar shape="circle" size={22} src={member.img} />
                                                <span className="ml-2 rtl:mr-2">{member.name}</span>
                                            </div>
                                        </Dropdown.Item>
                                    )
                                )}
                            </Dropdown>
                        )}
                    </div>
                    {errors.assignedToIds && <p className="text-red-500 text-xs mt-1">{errors.assignedToIds.message}</p>}
                </div>
              </div>

              {/* Labels (Tags) Section */}
              <div className="flex items-start">
                <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0 mt-1">
                    Labels:
                </label>
                <div className="w-full">
                    <div className="flex items-center gap-1 flex-wrap">
                        {currentLabels.map(label => (
                            <Tag key={label} className={`${taskUiColors[label] || 'bg-gray-200 dark:bg-gray-600'} cursor-pointer`} onClick={() => handleRemoveLabel(label)}>
                                {label}
                            </Tag>
                        ))}
                        <Dropdown renderTitle={ <AddMoreButton text="Add Label" />} placement="bottom-end" >
                            {DUMMY_LABEL_OPTIONS.map(labelOpt =>
                                !currentLabels.includes(labelOpt) && (
                                    <Dropdown.Item key={labelOpt} eventKey={labelOpt} onSelect={() => handleAddLabel(labelOpt)}>
                                        <div className="flex items-center">
                                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${taskUiColors[labelOpt] || 'bg-gray-200'}`}></span>
                                            {labelOpt}
                                        </div>
                                    </Dropdown.Item>
                                )
                            )}
                        </Dropdown>
                    </div>
                    {errors.labels && <p className="text-red-500 text-xs mt-1">{errors.labels.message}</p>}
                </div>
              </div>

              {/* Priority Section */}
              <div className="flex items-center">
                <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                  Priority: <span className="text-red-500">*</span>
                </label>
                <div className="w-full">
                  <Controller name="priority" control={control}
                    render={({ field }) => (
                      <Select {...field} options={DUMMY_PRIORITY_OPTIONS}
                        value={DUMMY_PRIORITY_OPTIONS.find(opt => opt.value === field.value)}
                        onChange={option => field.onChange(option?.value)} />
                    )} />
                  {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>}
                </div>
              </div>

              {/* Category Section */}
              <div className="flex items-center">
                <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                  Category: <span className="text-red-500">*</span>
                </label>
                <div className="w-full">
                  <Controller name="category" control={control}
                    render={({ field }) => (
                        <Select {...field} options={DUMMY_CATEGORY_OPTIONS}
                            value={DUMMY_CATEGORY_OPTIONS.find(opt => opt.value === field.value)}
                            onChange={option => field.onChange(option?.value)} />
                    )} />
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                </div>
              </div>
              
              {/* Status (Lifecycle) Section */}
              <div className="flex items-center">
                <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                  Status: <span className="text-red-500">*</span>
                </label>
                <div className="w-full">
                  <Controller name="status" control={control}
                    render={({ field }) => (
                      <Select {...field} options={DUMMY_STATUS_OPTIONS}
                        value={DUMMY_STATUS_OPTIONS.find(opt => opt.value === field.value)}
                        onChange={option => field.onChange(option?.value)}
                        components={{ 
                            Option: ({ data, ...props }: any) => ( <Select {...props}><Tag className={`${taskUiColors[data.value] || 'bg-gray-200'}`}>{data.label}</Tag></Select> ), 
                            SingleValue: ({ data, ...props }: any) => ( <div {...props} className="flex items-center"><Tag className={`${taskUiColors[data.value] || 'bg-gray-200'}`}>{data.label}</Tag></div> ) 
                        }}/>
                    )} />
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>
              </div>

              {/* Due Date Section */}
              <div className="flex items-center">
                <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                  Due date: <span className="text-red-500">*</span>
                </label>
                <div className="w-full">
                    <Controller name="dueDate" control={control}
                        render={({ field }) => (
                            <DatePicker value={field.value ? new Date(field.value) : null} // Ensure value is Date or null
                                onChange={date => field.onChange(date)} inputFormat="MMMM DD, YYYY" />
                        )} />
                    {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
                </div>
              </div>

                {/* Activity Type Section */}
                <div className="flex flex-col">
                <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Activity Type:
                </label>
                <div className="w-full">
                  <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter activity type..." />
                  )}
                  />
                  {errors.note && (
                  <p className="text-red-500 text-xs mt-1">{errors.note.message}</p>
                  )}
                </div>
                </div>

              {/* Note (Task Title/Main Description) Section */}
              <div className="flex flex-col">
                <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Task Note / Title: <span className="text-red-500">*</span>
                </label>
                <div className="w-full">
                    <Controller name="note" control={control}
                        render={({ field }) => ( <Input {...field} textArea rows={3} placeholder="Enter the main task details or title..."/> )} />
                    {errors.note && <p className="text-red-500 text-xs mt-1">{errors.note.message}</p>}
                </div>
              </div>

              {/* Additional Description Section (Optional) */}
              <div className="flex flex-col">
                <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Additional Description (Optional):
                </label>
                <div className="w-full">
                    <Controller name="description" control={control}
                        render={({ field }) => ( <Input {...field} textArea rows={5} placeholder="Enter any additional details..."/> )} />
                </div>
              </div>

              {/* Tabs for Activity and Attachments */}
              <Tabs className="mt-6" defaultValue="activity">
                <Tabs.TabList>
                  <Tabs value="activity" label="Activity Notes"/>
                  <Tabs value="attachments" label="Attachments"/>
                </Tabs.TabList>
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-b-md">
                  <Tabs.TabContent value="activity">
                    <div className="w-full">
                      {comments.length > 0 && (
                        <div className="mb-4 max-h-60 overflow-y-auto pr-1">
                          {comments.map(comment => (
                            <div key={comment.id} className="mb-3 flex">
                              <div className="mt-1"><Avatar shape="circle" size="sm" src={comment.src} /></div>
                              <div className="ml-2 rtl:mr-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex-1 text-sm">
                                <div className="flex items-center mb-1">
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.name}</span>
                                  <span className="mx-1 text-xs text-gray-500 dark:text-gray-400">|</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{dayjs(comment.date).format('DD MMM YYYY, hh:mm A')}</span>
                                </div>
                                <p className="mb-0 whitespace-pre-wrap">{comment.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mb-3 flex gap-2 items-start">
                        <Avatar shape="circle" src="/img/avatars/thumb-1.jpg" /> {/* Current user placeholder */}
                        <div className="w-full relative">
                          <Input ref={commentInputRef} textArea placeholder="Write comment..." rows={3} />
                          <div className="absolute bottom-2 right-2">
                            <Button size="xs" variant="solid" onClick={submitComment} type="button">Send</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tabs.TabContent>
                  <Tabs.TabContent value="attachments">
                    <div className="mb-4">
                      <Input type="file" multiple onChange={handleFileUpload} className="text-sm" />
                    </div>
                    {attachments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {attachments.map(file => (
                          <Card key={file.id} bodyClass="p-2" className={`shadow-sm ${file.isDeleted ? 'opacity-50 border-red-500 border-dashed' : ''}`}>
                            {(file.src.startsWith('blob:') && file.file?.type.startsWith('image/')) ||
                            file.src.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                              <img
                                className="max-w-full h-24 object-contain rounded-md mx-auto mb-2"
                                alt={file.name}
                                src={file.src.replace('?deleted=true', '')}
                              />
                            ) : (
                              <div className="h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-md mb-2 text-4xl text-gray-400 dark:text-gray-500">
                                <TbPaperclip />
                              </div>
                            )}

                            <div className="text-xs">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={file.name}>{file.name}</div>
                              <span className="text-gray-500 dark:text-gray-400">{file.size}</span>
                              {file.isNew && <Tag className="ml-1 bg-sky-100 text-sky-600 text-xs">New</Tag>}
                              {file.isDeleted && <Tag className="ml-1 bg-red-100 text-red-600 text-xs">Marked for Deletion</Tag>}
                            </div>
                            <div className="mt-1 flex justify-end items-center">
                              {!file.isNew && (
                                <Tooltip title="Download (simulated)">
                                  <Button variant="plain" size="xs" icon={<TbDownload />} onClick={() => alert(`Simulate download: ${file.name}`)} />
                                </Tooltip>
                              )}
                              {file.isDeleted ? (
                                <Tooltip title="Undo Delete">
                                  <Button variant="plain" color="green" size="xs" icon={<HiOutlinePlus className="transform rotate-45" />} onClick={() => handleUndoRemoveAttachment(file.id)} />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Delete">
                                  <Button variant="plain" color="red" size="xs" icon={<TbTrash />} onClick={() => handleRemoveAttachment(file.id)} />
                                </Tooltip>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 items-center justify-center text-center py-6">
                        <TbPaperclip size={40} className="text-gray-400 dark:text-gray-500" />
                        <p className="font-semibold text-gray-600 dark:text-gray-300">No attachments.</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload files using the button above.</p>
                      </div>
                    )}
                  </Tabs.TabContent>
                </div>
              </Tabs>
            </div>
          <div className="text-right mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button className="mr-2 rtl:ml-2" size="sm" variant="plain" onClick={handleTicketClose} type="button">Cancel</Button>
            <Button variant="solid" size="sm" type="submit" disabled={isSaveDisabled}>
              Save
            </Button>
          </div>
        </form>
      </AdaptiveCard>
    </Container>
  );
};

export default EditTaskPage;