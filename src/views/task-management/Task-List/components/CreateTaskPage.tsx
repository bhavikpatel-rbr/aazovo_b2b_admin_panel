// src/views/your-path/CreateTaskPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

// UI Components (Import what's needed from your UI library)
import Container from '@/components/shared/Container';
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import { Button, Checkbox, Select, Input, Tag, Avatar, Dropdown, ScrollBar, Tabs, Card } from '@/components/ui';
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'; // Assuming you have this
import CloseButton from '@/components/ui/CloseButton'; // Assuming you have this
import { HiOutlinePlus } from 'react-icons/hi'; // For AddMoreMember
import { TbDownload, TbPlus, TbTrash } from 'react-icons/tb';
import { NavLink } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
import DatePicker from '@/components/ui/DatePicker'; // Assuming you have a DatePicker
// import NoMedia from '@/components/shared/NoMedia'; // Assuming you have this
import { TbPaperclip } from 'react-icons/tb'
import Tooltip from '@/components/ui/Tooltip'
import TabNav from '@/components/ui/Tabs/TabNav';
// Define the types for this page
// You might share some types with TaskList.tsx if applicable (e.g., TaskStatus)
type User = { id: string; name: string; img: string; };
type AttachmentFile = { id: string; name: string; size: string; src: string; file?: File }; // Added file for new uploads
type Comment = { id: string; name: string; src: string; date: Date; message: string; };

const LINK_TO_OPTIONS = [
  "Company", "Member", "Partner", "Inquiries", "Brand", "Categories",
  "Products", "Wall Listing", "Opportunity", "Offer & Demand", "Leads",
  "Request & Feedback", "campaign", "Teams", "CMS", "Others"
] as const; // Use const assertion for stricter typing in Zod

type LinkToOption = typeof LINK_TO_OPTIONS[number];

const taskStatusLabels = ["New", "On Hold", "In Progress", "Pending", "Completed", "Cancelled"] as const; // Example, align with your actual labels
type TaskStatusLabel = typeof taskStatusLabels[number];

// Zod Schema for Create Task Form
const createTaskSchema = z.object({
  linkedToTypes: z.array(z.enum(LINK_TO_OPTIONS)).min(1, "Select at least one item to link to."),
  selectedLinkEntityId: z.string().optional().nullable(), // ID of the selected company, member, etc.
  assignedToIds: z.array(z.string()).min(1, "Assign to at least one member."),
  statusLabels: z.array(z.enum(taskStatusLabels)).min(1, "Select at least one status label."),
  priority: z.enum(["Low", "Medium", "High", "Urgent"], { required_error: "Priority is required." }),
  category: z.string().min(1, "Category is required."),
  dueDate: z.date({ required_error: "Due date is required." }),
  note: z.string().min(1, "Note/Task title is required.").max(500), // This can be the main task title/description
  description: z.string().optional(), // Additional details
  activity_type: z.string().optional()
  // comments and attachments will be handled outside the main form data
});
type CreateTaskFormData = z.infer<typeof createTaskSchema>;

// Dummy data for Assignees, Status Labels, Categories, etc.
// In a real app, this would come from an API or Redux store
const DUMMY_BOARD_MEMBERS: User[] = [
  { id: 'user1', name: 'Alice Johnson', img: '/img/avatars/thumb-1.jpg' },
  { id: 'user2', name: 'Bob Williams', img: '/img/avatars/thumb-2.jpg' },
  { id: 'user3', name: 'Carol Davis', img: '/img/avatars/thumb-3.jpg' },
  { id: 'user4', name: 'David Brown', img: '/img/avatars/thumb-4.jpg' },
];
const DUMMY_LABEL_LIST: TaskStatusLabel[] = ["New", "On Hold", "In Progress", "Pending", "Completed", "Cancelled"]; // Should match your definitions
const DUMMY_PRIORITY_OPTIONS = [{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }, { label: "Urgent", value: "Urgent" }];
const DUMMY_CATEGORY_OPTIONS = [{ label: "General", value: "General" }, { label: "Development", value: "Development" }, { label: "Marketing", value: "Marketing" }, { label: "Sales", value: "Sales" }];
const DUMMY_LINK_SELECT_OPTIONS: Record<LinkToOption, { label: string, value: string }[]> = {
  "Company": [{ label: "Company A", value: "compA" }, { label: "Company B", value: "compB" }],
  "Member": [{ label: "Member X", value: "memX" }, { label: "Member Y", value: "memY" }],
  // ... populate for other LinkToOption types
  "Partner": [], "Inquiries": [], "Brand": [], "Categories": [], "Products": [],
  "Wall Listing": [], "Opportunity": [], "Offer & Demand": [], "Leads": [],
  "Request & Feedback": [], "campaign": [], "Teams": [], "CMS": [], "Others": [],
};

// Mock task label colors
const taskLabelColors: Record<string, string> = {
  Low: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
  Medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100',
  High: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
  Urgent: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
  // Add more as needed
};


const AddMoreMember = () => (
  <div className="flex items-center justify-center w-8 h-8 text-2xl text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
    <HiOutlinePlus />
  </div>
)


const CreateTaskPage = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    mode: "onChange",
    defaultValues: {
      linkedToTypes: [],
      assignedToIds: [],
      statusLabels: [],
      priority: "Medium",
      category: DUMMY_CATEGORY_OPTIONS[0]?.value,
      dueDate: new Date(),
      note: "",
      activity_type: "",
    }
  });

  const [selectedLinkedToTypes, setSelectedLinkedToTypes] = useState<LinkToOption[]>([]);
  const [linkSelectOptions, setLinkSelectOptions] = useState<{ label: string, value: string }[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<User[]>([]);
  const [currentStatusLabels, setCurrentStatusLabels] = useState<TaskStatusLabel[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const watchedLinkedToTypes = watch("linkedToTypes");

  useEffect(() => {
    // Update local state for UI and dynamic select options
    setSelectedLinkedToTypes(watchedLinkedToTypes || []);
    if (watchedLinkedToTypes && watchedLinkedToTypes.length > 0) {
      // For simplicity, let's just use the options for the *first* selected type
      // A more complex UI might allow selecting entities from multiple types
      const firstSelectedType = watchedLinkedToTypes[0];
      setLinkSelectOptions(DUMMY_LINK_SELECT_OPTIONS[firstSelectedType] || []);
      setValue("selectedLinkEntityId", null); // Reset selected entity when type changes
    } else {
      setLinkSelectOptions([]);
      setValue("selectedLinkEntityId", null);
    }
  }, [watchedLinkedToTypes, setValue]);


  const handleTicketClose = () => {
    navigate("/tasks"); // Or to the previous page
  };

  const handleAddMember = (memberId: string) => {
    const member = DUMMY_BOARD_MEMBERS.find(m => m.id === memberId);
    if (member && !assignedMembers.some(am => am.id === memberId)) {
      const newAssignedMembers = [...assignedMembers, member];
      setAssignedMembers(newAssignedMembers);
      setValue("assignedToIds", newAssignedMembers.map(m => m.id), { shouldValidate: true });
    }
  };
  const handleRemoveMember = (memberId: string) => {
    const newAssignedMembers = assignedMembers.filter(m => m.id !== memberId);
    setAssignedMembers(newAssignedMembers);
    setValue("assignedToIds", newAssignedMembers.map(m => m.id), { shouldValidate: true });
  };


  const handleAddLabel = (label: TaskStatusLabel) => {
    if (!currentStatusLabels.includes(label)) {
      const newLabels = [...currentStatusLabels, label];
      setCurrentStatusLabels(newLabels);
      setValue("statusLabels", newLabels, { shouldValidate: true });
    }
  };
  const handleRemoveLabel = (labelToRemove: TaskStatusLabel) => {
    const newLabels = currentStatusLabels.filter(label => label !== labelToRemove);
    setCurrentStatusLabels(newLabels);
    setValue("statusLabels", newLabels, { shouldValidate: true });
  }


  const submitComment = () => {
    if (commentInputRef.current?.value) {
      setComments([
        ...comments,
        { id: `c${Date.now()}`, name: 'Current User', src: '/img/avatars/thumb-1.jpg', date: new Date(), message: commentInputRef.current.value }
      ]);
      commentInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
        id: `f${Date.now()}-${file.name}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        src: URL.createObjectURL(file), // Create a preview URL
        file: file // Store the actual file object
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    const attachmentToRemove = attachments.find(att => att.id === fileId);
    if (attachmentToRemove?.src.startsWith('blob:')) {
      URL.revokeObjectURL(attachmentToRemove.src); // Clean up blob URL
    }
    setAttachments(prev => prev.filter(att => att.id !== fileId));
  };


  const onSubmit = (data: CreateTaskFormData) => {
    console.log("Task Creation Data:", data);
    console.log("Assigned Members:", assignedMembers);
    console.log("Status Labels:", currentStatusLabels);
    console.log("Comments:", comments);
    console.log("Attachments:", attachments.map(a => a.file)); // Send actual files
    // Here you would dispatch an action to save the task
    // e.g., dispatch(createTaskAction({ ...data, comments, attachments: attachmentFiles }));
    alert("Task data logged to console. Implement save logic.");
    // navigate("/tasks"); // Optionally navigate back after save
  };

  return (
    <Container>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/task/task-list">
          <h6 className="font-semibold hover:text-primary">Task</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">Add New Task</h6>
      </div>
      <AdaptiveCard>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-semibold">Create New Task</h4>
          </div> */}

          {/* <div className="flex flex-col gap-3 p-1"> */}
          <div className="lg:grid grid-cols-2 gap-3 p-1">
            {/* Link to Section */}
            <div className="flex items-center">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                Task Title / Name: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="activity_type"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter taks name or title..." />
                  )}
                />
                {errors.activity_type && <p className="text-red-500 text-xs mt-1">{errors.activity_type.message}</p>}
              </div>
            </div>
            {/* Assigned to Section */}
            <div className="flex items-start">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0 mt-2">
                Assigned to: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <div className="flex items-center gap-1 flex-wrap">
                  <UsersAvatarGroup
                    className="gap-1"
                    avatarProps={{ className: 'cursor-pointer' }}
                    avatarGroupProps={{ maxCount: 4 }}
                    nameKey="name" // Ensure UsersAvatarGroup uses 'name'
                    imgKey="img"   // Ensure UsersAvatarGroup uses 'img'
                    users={assignedMembers}
                    onAvatarClick={(member: User) => handleRemoveMember(member.id)} // Optional: remove on click
                  />
                  {DUMMY_BOARD_MEMBERS.length !== assignedMembers.length && (
                    <Dropdown renderTitle={<AddMoreMember />}>
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

            <div className='col-span-2'>
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
                      options={LINK_TO_OPTIONS.map(option => ({ label: option, value: option }))}
                      value={LINK_TO_OPTIONS.filter(option => field.value?.includes(option)).map(option => ({ label: option, value: option }))}
                      onChange={options => field.onChange(options ? options.map(opt => opt.value) : [])}
                      placeholder="Select link types..."
                    />
                  )}
                />
                {errors.linkedToTypes && <p className="text-red-500 text-xs mt-1">{errors.linkedToTypes.message}</p>}
              </div>
              {/* Select Link Section (Dynamic) */}
              {selectedLinkedToTypes.length > 0 && (
                <div className="flex items-center my-3">
                  <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                    Select {selectedLinkedToTypes.join(' / ')}:
                  </label>
                  <div className="w-full">
                    <Controller
                      name="selectedLinkEntityId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder={`Select a ${selectedLinkedToTypes[0]}...`} // Example placeholder
                          options={linkSelectOptions}
                          value={linkSelectOptions.find(opt => opt.value === field.value)}
                          onChange={option => field.onChange(option?.value)}
                          isClearable
                        />
                      )}
                    />
                    {/* Add error display if needed for selectedLinkEntityId */}
                  </div>
                </div>
              )}
            </div>




            {/* Status Labels Section */}
            <div className="flex items-start">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0 mt-1">
                Status: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <div className="flex items-center gap-1 flex-wrap">
                  {currentStatusLabels.map(label => (
                    <Tag key={label} className={`${taskLabelColors[label] || 'bg-gray-200'} cursor-pointer`} onClick={() => handleRemoveLabel(label)}>
                      {label}
                    </Tag>
                  ))}
                  <Dropdown
                    renderTitle={<Tag className="border-dashed cursor-pointer border-2 bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-500 hover:border-primary-500 hover:text-primary-500" prefix={<TbPlus />}> Add Status </Tag>}
                    placement="bottom-end" >
                    {DUMMY_LABEL_LIST.map(label =>
                      !currentStatusLabels.includes(label) && (
                        <Dropdown.Item key={label} eventKey={label} onSelect={() => handleAddLabel(label)}>
                          <div className="flex items-center">
                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${taskLabelColors[label] || 'bg-gray-200'}`}></span>
                            {label}
                          </div>
                        </Dropdown.Item>
                      )
                    )}
                  </Dropdown>
                </div>
                {errors.statusLabels && <p className="text-red-500 text-xs mt-1">{errors.statusLabels.message}</p>}
              </div>
            </div>


            {/* Priority Section */}
            <div className="flex items-center">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                Priority: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={DUMMY_PRIORITY_OPTIONS}
                      value={DUMMY_PRIORITY_OPTIONS.find(opt => opt.value === field.value)}
                      onChange={option => field.onChange(option?.value)}
                    />
                  )}
                />
                {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>}
              </div>
            </div>

            {/* Category Section */}
            <div className="flex items-center">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                Department: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={DUMMY_CATEGORY_OPTIONS}
                      value={DUMMY_CATEGORY_OPTIONS.find(opt => opt.value === field.value)}
                      onChange={option => field.onChange(option?.value)}
                    />
                  )}
                />
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>
            </div>

            {/* Due Date Section */}
            <div className="flex items-center">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                Due date: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={date => field.onChange(date)}
                      inputFormat="MMMM DD, YYYY" // Example format
                    />
                  )}
                />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
              </div>
            </div>

            {/* Activity Type Section */}
            {/* Note (Task Title/Main Description) Section */}
            <div className="flex flex-col"> {/* Changed to flex-col for better label placement */}
              <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Task Note / Remark: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} textArea rows={5} placeholder="Enter the main task details or remark..." />
                  )}
                />
                {errors.note && <p className="text-red-500 text-xs mt-1">{errors.note.message}</p>}
              </div>
            </div>

            {/* Additional Description Section (Optional) */}
            <div className="flex flex-col">
              <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Additional Description (Optional):
              </label>
              <div className="w-full">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} textArea rows={5} placeholder="Enter any additional details..." />
                  )}
                />
              </div>
            </div>


            {/* Tabs for Activity and Attachments */}
            <Tabs className="mt-3 col-span-2" defaultValue="activity">
              <Tabs.TabList>
                <TabNav value="activity" className='text-base'><b>Activity Notes</b></TabNav>
                <TabNav value="attachments">Attachments</TabNav>
              </Tabs.TabList>
              <div className="p-4 rounded-b-md">
                <Tabs.TabContent value="activity">
                  <div className="flex items-center mb-5">
                    <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                      Activity Type: <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full">
                      <Controller
                        name="activity_type"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="Enter activity type..." />
                        )}
                      />
                      {errors.activity_type && <p className="text-red-500 text-xs mt-1">{errors.activity_type.message}</p>}
                    </div>
                  </div>
                  <div className="w-full">
                    {comments.length > 0 && (
                      <div className="mb-4 max-h-60 overflow-y-auto">
                        {comments.map(comment => (
                          <div key={comment.id} className="mb-3 flex">
                            <div className="mt-1"><Avatar shape="circle" size="sm" src={comment.src} /></div>
                            <div className="ml-2 rtl:mr-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex-1 text-sm">
                              <div className="flex items-center mb-1">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.name}</span>
                                <span className="mx-1 text-xs text-gray-500 dark:text-gray-400">|</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{dayjs(comment.date).format('DD MMM YYYY, hh:mm A')}</span>
                              </div>
                              <p className="mb-0">{comment.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mb-3 flex gap-2">
                      <Avatar shape="circle" src="/img/avatars/thumb-1.jpg" /> {/* Placeholder for current user */}
                      <div className="w-full relative">
                        <Input ref={commentInputRef} textArea placeholder="Write comment..." />
                        <div className="absolute bottom-2 right-2">
                          <Button size="xs" variant="solid" onClick={submitComment}>Send</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tabs.TabContent>
                <Tabs.TabContent value="attachments">
                  <div className="mb-4">
                    <Input type="file" multiple onChange={handleFileUpload} />
                  </div>
                  {attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {attachments.map(file => (
                        <Card key={file.id} bodyClass="p-2" className="shadow-sm">
                          {file.src.startsWith('blob:') && file.file?.type.startsWith('image/') ? (
                            <img className="max-w-full h-24 object-contain rounded-md mx-auto mb-2" alt={file.name} src={file.src} />
                          ) : (
                            <div className="h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-md mb-2 text-4xl text-gray-400 dark:text-gray-500">

                            </div>
                          )}
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={file.name}>{file.name}</div>
                            <span className="text-gray-500 dark:text-gray-400">{file.size}</span>
                          </div>
                          <div className="mt-1 flex justify-end items-center">
                            <Tooltip title="Download (Not implemented)">
                              <Button variant="plain" size="xs" icon={<TbDownload />} disabled />
                            </Tooltip>
                            <Tooltip title="Delete">
                              <Button variant="plain" color="red-500" size="xs" icon={<TbTrash />} onClick={() => handleRemoveAttachment(file.id)} />
                            </Tooltip>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 items-center justify-center text-center py-6">
                      {/* <NoMedia height={100} width={100} /> */}
                      <TbPaperclip size={40} className="text-gray-400 dark:text-gray-500" />
                      <p className="font-semibold text-gray-600 dark:text-gray-300">No attachments yet.</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Upload files using the button above.</p>
                    </div>
                  )}
                </Tabs.TabContent>
              </div>
            </Tabs>


          </div>


          <div className="text-right mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button className="mr-2 rtl:ml-2" size="sm" variant="plain" onClick={handleTicketClose} type="button">Cancel</Button>
            <Button variant="solid" size="sm" type="submit" disabled={!isValid}>Create Task</Button>
          </div>
        </form>
      </AdaptiveCard>
    </Container>
  );
};

export default CreateTaskPage;