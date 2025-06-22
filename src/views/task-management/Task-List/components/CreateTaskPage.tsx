// src/views/your-path/CreateTaskPage.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { config } from "@/utils/config";

// UI Components
import Container from '@/components/shared/Container';
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import { Button, Select, Input, Tag, Avatar, Dropdown, Tabs, Card, Spinner } from '@/components/ui';
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup';
import { HiOutlinePlus } from 'react-icons/hi';
import { TbDownload, TbPlus, TbTrash, TbPaperclip } from 'react-icons/tb';
import { BiChevronRight } from "react-icons/bi";
import DatePicker from '@/components/ui/DatePicker';
import Tooltip from '@/components/ui/Tooltip';
import TabNav from '@/components/ui/Tabs/TabNav';
import { encryptStorage } from '@/utils/secureLocalStorage';
import toast from '@/components/ui/toast';
import Notification from '@/components/ui/Notification';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import {
    addTaskAction,
    editTaskAction,
    getAllCompany, // Make sure this is correctly imported and fetches company data
    // getTaskByIdAction,
    getUsersAction,
    getDepartmentsAction,
} from '@/reduxtool/master/middleware';


// Define the types for this page
interface ApiUser { id: number; name: string; profile_pic_path?: string | null; /* other user fields */ }
interface FormUser { id: string; name: string; img: string; }
// Assuming Company data structure from API (adjust as needed)
interface ApiCompany { id: number; company_name: string; /* other company fields */ }

type AttachmentFile = { id: string; name: string; size: string; src: string; file?: File, type?: string };
type Comment = { id: string; name: string; src: string; date: Date; message: string; user_id?: string | number };

const LINK_TO_OPTIONS = [
  "Company", "Member", "Partner", "Inquiries", "Brand", "Categories",
  "Products", "Wall Listing", "Opportunity", "Offer & Demand", "Leads",
  "Request & Feedback", "campaign", "Teams", "CMS", "Others"
] as const;

type LinkToOption = typeof LINK_TO_OPTIONS[number];

const MODULE_ID_MAP: Record<LinkToOption, string> = {
    "Company": "2",
    "Member": "3",
    "Partner": "4",
    "Inquiries": "5",
    "Brand": "6",
    "Categories": "7",
    "Products": "8",
    "Wall Listing": "9",
    "Opportunity": "10",
    "Offer & Demand": "11",
    "Leads": "12",
    "Request & Feedback": "13",
    "campaign": "14",
    "Teams": "15",
    "CMS": "16",
    "Others": "99",
};


const taskStatusLabelsApi = ["Pending", "On_Hold", "In_Progress", "Completed", "Cancelled"] as const;
type TaskStatusApi = typeof taskStatusLabelsApi[number];

const taskStatusLabelsDisplay = ["Pending", "On Hold", "In Progress", "Completed", "Cancelled"] as const;
type TaskStatusDisplay = typeof taskStatusLabelsDisplay[number];


const createTaskSchema = z.object({
  task_title: z.string().min(1, "Task title is required.").max(255),
  linkedToTypes: z.array(z.enum(LINK_TO_OPTIONS)).min(1, "Select at least one item to link to."),
  selectedLinkEntityId: z.string().optional().nullable(),
  assignedToIds: z.array(z.string()).min(1, "Assign to at least one member."),
  status: z.enum(taskStatusLabelsApi, { required_error: "Status is required." }),
  priority: z.enum(["Low", "Medium", "High", "Urgent"], { required_error: "Priority is required." }),
  department_id: z.string().min(1, "Department is required."),
  dueDate: z.date({ required_error: "Due date is required." }),
  note_remark: z.string().min(1, "Note/Remark is required.").max(1000),
  additional_description: z.string().optional(),
  activity_type: z.string().optional(), // Added from your previous code, ensure it's handled or remove if not needed
});
type CreateTaskFormData = z.infer<typeof createTaskSchema>;

const { useEncryptApplicationStorage } = config;

const taskLabelColors: Record<string, string> = {
  Low: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
  Medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100',
  High: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
  Urgent: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
  Pending: 'bg-amber-100 text-amber-600',
  On_Hold: 'bg-gray-100 text-gray-600',
  In_Progress: 'bg-sky-100 text-sky-600',
  Completed: 'bg-emerald-100 text-emerald-600',
  Cancelled: 'bg-rose-100 text-rose-600',
};

const AddMoreMember = () => (
  <div className="flex items-center justify-center w-8 h-8 text-2xl text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
    <HiOutlinePlus />
  </div>
);

// Updated function to fetch/process linkable entities
const processLinkableEntities = async (
    entityType: LinkToOption,
    allUsers: FormUser[],
    allCompanyData: ApiCompany[] // Pass the company data from Redux
    // Add other data sources here, e.g., allPartnerData: ApiPartner[]
): Promise<{ label: string, value: string }[]> => {
    console.log(`Processing entities for: ${entityType}`);
    // Simulate a small processing delay (can be removed if data is readily available and transformed quickly)
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (entityType) {
        case "Company":
            if (allCompanyData && allCompanyData.length > 0) {
                return allCompanyData.map(company => ({
                    label: company.company_name, // Adjust if your company object has a different name field
                    value: String(company.id)
                }));
            }
            toast.push(<Notification title="Info" type="info" duration={2500}>No companies found or data still loading.</Notification>);
            return []; // Return empty if no company data
        case "Member":
            return allUsers.map(user => ({ label: user.name, value: user.id }));
        case "Partner":
            // Replace with actual data fetching/processing for Partners
            return [
                { label: "Acme Partners (Mock)", value: "partner_acme" },
                { label: "Beta Logistics (Mock)", value: "partner_beta" },
            ];
        case "Products":
            // Replace with actual data fetching/processing for Products
            return [
                { label: "Product A001 (Mock)", value: "prod_A001" },
                { label: "Product B002 (Mock)", value: "prod_B002" },
            ];
        // Add more cases for other LINK_TO_OPTIONS as needed
        // ...
        default:
            toast.push(<Notification title="Info" type="info" duration={2500}>Data source for "{entityType}" is not configured yet.</Notification>)
            return [{ label: `No ${entityType} available (placeholder)`, value: "" }];
    }
};


const CreateTaskPage = () => {
  const { taskId } = useParams<{ taskId?: string }>();
  const isEditMode = Boolean(taskId);

  const [loggedInUserData, setLoggedInUserData] = useState<any>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    usersData = [],
    departmentsData = [],
    AllCompanyData = [], // Ensure this matches your Redux slice state key
    taskDetailsForEdit,
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const [isLinkEntityLoading, setIsLinkEntityLoading] = useState(false);

  console.log("departmentsData",departmentsData);
  
  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isValid, isSubmitting } } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    mode: "onChange",
    defaultValues: {
      task_title: "",
      linkedToTypes: [],
      selectedLinkEntityId: null,
      assignedToIds: [],
      status: "Pending",
      priority: "Medium",
      department_id: "",
      dueDate: dayjs().add(1,'day').toDate(),
      note_remark: "",
      additional_description: "",
      activity_type: "", // Initialize activity_type
    }
  });

   useEffect(() => {
      const getUserDataFromStorage = () => {
        try {
          return encryptStorage.getItem("UserData", !useEncryptApplicationStorage);
        } catch (error) {
          console.error("Error getting UserData:", error); return null;
        }
      };
      setLoggedInUserData(getUserDataFromStorage());

      dispatch(getUsersAction());
      dispatch(getAllCompany()); // Fetch company data on component mount
      dispatch(getDepartmentsAction());

      if (isEditMode && taskId) {
        // dispatch(getTaskByIdAction(taskId));
      }
    }, [dispatch, taskId, isEditMode]);


  const boardMembersOptions: FormUser[] = useMemo(() =>
   usersData && usersData.length > 0 ? usersData.map((user: ApiUser) => ({
      id: String(user.id),
      name: user.name,
      img: user.profile_pic_path || `/img/avatars/default-avatar.png`
    })) : []
  , [usersData]);

  const departmentOptions = useMemo(() =>
   departmentsData?.data.length > 0 ? departmentsData?.data.map((dept: { id: string | number; name: string }) => ({
      label: dept.name,
      value: String(dept.id)
    })) : []
  , [departmentsData?.data]);


  const [selectedLinkedToTypesUI, setSelectedLinkedToTypesUI] = useState<LinkToOption[]>([]);
  const [linkSelectOptions, setLinkSelectOptions] = useState<{ label: string, value: string }[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<FormUser[]>([]);
  const [currentDisplayStatus, setCurrentDisplayStatus] = useState<TaskStatusDisplay>("Pending");

  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const watchedLinkedToTypes = watch("linkedToTypes");
  const watchedStatus = watch("status");
  const previousLinkedToTypeRef = useRef<LinkToOption | undefined>();


  // Effect to process/load linkable entities when the primary linkedToType changes or relevant data loads
  useEffect(() => {
    const currentPrimaryType = watchedLinkedToTypes && watchedLinkedToTypes.length > 0 ? watchedLinkedToTypes[0] : undefined;
    setSelectedLinkedToTypesUI(watchedLinkedToTypes || []);

    if (currentPrimaryType) {
        // Condition to re-process:
        // 1. Primary type changed
        // 2. Primary type is 'Company' and AllCompanyData has just loaded/changed
        // 3. Primary type is 'Member' and boardMembersOptions has just loaded/changed (already a dep)
        const shouldProcess = currentPrimaryType !== previousLinkedToTypeRef.current ||
                              (currentPrimaryType === "Company" && AllCompanyData.length > 0 && previousLinkedToTypeRef.current === "Company" && linkSelectOptions.length === 0) || // Reprocess if company data arrived
                              (currentPrimaryType === "Member" && boardMembersOptions.length > 0 && previousLinkedToTypeRef.current === "Member" && linkSelectOptions.length === 0); // Reprocess if member data arrived


        if (shouldProcess) {
            setValue("selectedLinkEntityId", null, { shouldValidate: true });
            setLinkSelectOptions([]);
            setIsLinkEntityLoading(true);

            processLinkableEntities(currentPrimaryType, boardMembersOptions, AllCompanyData as ApiCompany[]) // Pass AllCompanyData
                .then(options => {
                    setLinkSelectOptions(options);
                    // If in edit mode and an ID was pre-filled, try to re-select it if options are now available
                    if (isEditMode && taskDetailsForEdit?.linked_entity_id && options.some(opt => opt.value === String(taskDetailsForEdit.linked_entity_id))) {
                        setValue("selectedLinkEntityId", String(taskDetailsForEdit.linked_entity_id), { shouldValidate: true });
                    }
                })
                .catch(error => {
                    console.error("Failed to process linkable entities:", error);
                    toast.push(<Notification title={`Error processing ${currentPrimaryType}`} type="danger">Could not load items.</Notification>);
                    setLinkSelectOptions([]);
                })
                .finally(() => {
                    setIsLinkEntityLoading(false);
                });
        }
    } else {
        setLinkSelectOptions([]);
        setValue("selectedLinkEntityId", null, { shouldValidate: false });
    }
    previousLinkedToTypeRef.current = currentPrimaryType;

  }, [
    watchedLinkedToTypes,
    setValue,
    boardMembersOptions,
    AllCompanyData, // Add AllCompanyData as a dependency
    isEditMode,     // Add for edit mode pre-selection logic
    taskDetailsForEdit // Add for edit mode pre-selection logic
  ]);


  useEffect(() => {
    if (isEditMode && taskDetailsForEdit && taskDetailsForEdit.id === taskId && boardMembersOptions.length > 0 /* && AllCompanyData.length > 0 if Company is pre-selected */) {
        const apiTask = taskDetailsForEdit;
        const assignedUserIds = (Array.isArray(apiTask.assign_to_users) ? apiTask.assign_to_users.map((u: ApiUser) => String(u.id)) : []) as string[];

        const linkedToTypesFromApi = apiTask.module_name ? [apiTask.module_name as LinkToOption] : [];

        reset({
            task_title: apiTask.task_title || "",
            linkedToTypes: linkedToTypesFromApi,
            selectedLinkEntityId: apiTask.linked_entity_id ? String(apiTask.linked_entity_id) : null, // Pre-fill
            assignedToIds: assignedUserIds,
            status: (apiTask.status?.replace(/ /g, '_') as TaskStatusApi) || "Pending",
            priority: apiTask.priority || "Medium",
            department_id: String(apiTask.department_id) || "",
            dueDate: apiTask.due_data ? dayjs(apiTask.due_data).toDate() : dayjs().add(1,'day').toDate(),
            note_remark: apiTask.note_remark || "",
            additional_description: apiTask.additional_description || "",
            activity_type: apiTask.activity_type || "", // Assuming activity_type comes from API
        });

        const assigned = boardMembersOptions.filter(member => assignedUserIds.includes(member.id));
        setAssignedMembers(assigned);
        setCurrentDisplayStatus((apiTask.status?.replace(/_/g, ' ') as TaskStatusDisplay) || "Pending");


        setComments( (apiTask.activity_notes || []).map((note: any) => ({
            id: String(note.id),
            name: note.user?.name || "Unknown User",
            src: note.user?.profile_pic_path || '/img/avatars/default-avatar.png',
            date: dayjs(note.created_at).toDate(),
            message: note.activity_comment,
            user_id: note.user_id,
        })).sort((a,b) => b.date.getTime() - a.date.getTime())); // Sort comments by date descending
        setAttachments((apiTask.attachments || []).map((att: any) => ({
            id: String(att.id),
            name: att.attachment_name,
            size: "N/A",
            src: att.attachment_path,
            type: att.attachment_type,
        })));
    }
  }, [isEditMode, taskDetailsForEdit, taskId, reset, boardMembersOptions, AllCompanyData]); // Added AllCompanyData here too for consistency if edit mode depends on it


  useEffect(() => {
    if(watchedStatus){
        setCurrentDisplayStatus(watchedStatus.replace(/_/g, ' ') as TaskStatusDisplay);
    }
  }, [watchedStatus]);


  const handleAddMember = (memberId: string) => {
    const member = boardMembersOptions.find(m => m.id === memberId);
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


  const handleStatusChange = (apiStatus: TaskStatusApi) => {
    setValue("status", apiStatus, { shouldValidate: true });
  };


  const submitComment = () => {
    const activityType = watch('activity_type'); // Get activity type from form
    if (!activityType) {
        toast.push(<Notification title="Missing Info" type="warning" duration={3000}>Please enter an activity type before commenting.</Notification>);
        // Optionally, focus the activity_type input
        return;
    }
    if (commentInputRef.current?.value && loggedInUserData) {
      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        name: loggedInUserData.name,
        src: loggedInUserData.profile_image_path || '/img/avatars/thumb-1.jpg',
        date: new Date(),
        // Prepend activity type to the comment message
        message: `${activityType}: ${commentInputRef.current.value}`,
        user_id: loggedInUserData.id,
      };
      setComments(prevComments => [newComment, ...prevComments].sort((a,b) => b.date.getTime() - a.date.getTime()));
      commentInputRef.current.value = '';
      // Do not reset activity_type here, user might want to add multiple comments of the same type
    }
  };

  console.log("loggedInUserData",loggedInUserData);
  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
        id: `f-${Date.now()}-${file.name}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        src: URL.createObjectURL(file),
        file: file,
        type: file.type,
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleRemoveAttachment = (fileId: string) => {
    const attachmentToRemove = attachments.find(att => att.id === fileId);
    if (attachmentToRemove?.src.startsWith('blob:')) {
      URL.revokeObjectURL(attachmentToRemove.src);
    }
    setAttachments(prev => prev.filter(att => att.id !== fileId));
  };


  const onSubmit = async (data: CreateTaskFormData) => {
    if (!loggedInUserData?.id) {
        toast.push(<Notification title="Error" type="danger">User not identified. Please log in again.</Notification>);
        return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append("user_id", String(loggedInUserData?.id));
    formDataPayload.append("task_title", data.task_title);

    data.assignedToIds.forEach(id => formDataPayload.append("assign_to[]", id));

    const moduleName = data.linkedToTypes[0];
    formDataPayload.append("module_name", moduleName);
    formDataPayload.append("module_id", MODULE_ID_MAP[moduleName] || "0");

    if (data.selectedLinkEntityId) {
        formDataPayload.append("linked_entity_id", data.selectedLinkEntityId);
    }

    formDataPayload.append("status", data.status);
    formDataPayload.append("priority", data.priority);
    formDataPayload.append("department_id", data.department_id);
    formDataPayload.append("due_data", dayjs(data.dueDate).format('YYYY-MM-DD HH:mm:ss'));
    formDataPayload.append("note_remark", data.note_remark);
    if (data.additional_description) {
        formDataPayload.append("additional_description", data.additional_description);
    }
    // if (data.activity_type) { // Include activity_type if it's part of the main task data
    //     formDataPayload.append("activity_type_overall", data.activity_type);
    // }


    // Handle initial activity_note for "add" mode or new comments for "edit" mode
    if (!isEditMode) {
        // For add mode, the first "note_remark" could be considered the initial activity comment
        // or a generic "Task created" comment.
        // The API structure for "activity_note" in the example was a bit specific.
        // Let's assume the main "note_remark" serves as the primary initial note.
        // If a separate "activity_note" object is strictly required for creation:
        if (data.activity_type && data.note_remark) { // If activity_type is meant for the initial note
            formDataPayload.append("activity_note[user_id]", String(loggedInUserData?.id));
            formDataPayload.append("activity_note[activity_type]", data.activity_type); // Use from form
            formDataPayload.append("activity_note[activity_comment]", data.note_remark);
        } else { // Generic creation note if activity_type isn't for the initial note
             formDataPayload.append("activity_note[user_id]", String(loggedInUserData?.id));
             formDataPayload.append("activity_note[activity_type]", "created_task");
             formDataPayload.append("activity_note[activity_comment]", `Task "${data.task_title}" created by ${loggedInUserData?.name}.`);
        }
    } else { // Edit Mode - send new comments from the UI
        const newUiComments = comments.filter(c => c.id.startsWith('temp-'));
        newUiComments.forEach((comment, index) => {
            // Extract activity type from comment message if it was prepended
            const parts = comment.message.split(': ');
            const activityType = parts.length > 1 ? parts[0] : (data.activity_type || "comment"); // Fallback
            const messageContent = parts.length > 1 ? parts.slice(1).join(': ') : comment.message;

            formDataPayload.append(`new_activity_notes[${index}][user_id]`, String(comment.user_id));
            formDataPayload.append(`new_activity_notes[${index}][activity_type]`, activityType);
            formDataPayload.append(`new_activity_notes[${index}][activity_comment]`, messageContent);
        });
    }


    attachments.forEach((att, index) => {
        if (att.file) {
            formDataPayload.append(`attachments[${index}][user_id]`, String(loggedInUserData.id));
            formDataPayload.append(`attachments[${index}][file_data]`, att.file, att.name);
        }
    });


    try {
        if (isEditMode && taskId) {
            await dispatch(editTaskAction({ taskId, data: formDataPayload })).unwrap();
            toast.push(<Notification title="Task Updated" type="success" duration={2000}>Task updated successfully.</Notification>);
        } else {
            await dispatch(addTaskAction(formDataPayload)).unwrap();
            toast.push(<Notification title="Task Created" type="success" duration={2000}>Task created successfully.</Notification>);
        }
        navigate("/task/task-list");
    } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || "An error occurred during submission.";
        toast.push(<Notification title="Operation Failed" type="danger" duration={4000}>{errorMessage}</Notification>);
        console.error("Task submission error:", error);
    }
  };

  const statusDropdownOptions = taskStatusLabelsDisplay.map((displayLabel, index) => {
    const apiValue = taskStatusLabelsApi[index];
    return {
        label: displayLabel,
        value: apiValue,
        colorClass: taskLabelColors[apiValue] || 'bg-gray-200',
    };
  });

  const availableMembersToAdd = useMemo(() =>
    boardMembersOptions.length > 0 ? boardMembersOptions.filter(
        member => !assignedMembers.some(m => m.id === member.id)
    ) : [],
  [boardMembersOptions, assignedMembers]);

  return (
    <Container>
      <div className="flex gap-1 items-end mb-3 ">
        <NavLink to="/task/task-list">
          <h6 className="font-semibold hover:text-primary">Task</h6>
        </NavLink>
        <BiChevronRight size={22} color="black" />
        <h6 className="font-semibold text-primary">{isEditMode ? 'Edit Task' : 'Add New Task'}</h6>
      </div>
      <AdaptiveCard>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="lg:grid grid-cols-2 gap-x-6 gap-y-4 p-1">
            <div className="flex items-center">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                Task Title: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="task_title"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter task title..." />
                  )}
                />
                {errors.task_title && <p className="text-red-500 text-xs mt-1">{errors.task_title.message}</p>}
              </div>
            </div>

            <div className="flex items-start">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0 pt-2">
                Assigned to: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <div className="flex items-center gap-1 flex-wrap">
                  <UsersAvatarGroup
                    className="gap-1"
                    avatarProps={{ className: 'cursor-pointer' }}
                    avatarGroupProps={{ maxCount: 4 }}
                    nameKey="name"
                    imgKey="img"
                    users={assignedMembers}
                    onAvatarClick={(member: FormUser) => handleRemoveMember(member.id)}
                  />
                  {boardMembersOptions.length > 0 && assignedMembers.length < boardMembersOptions.length && (
                    <Dropdown renderTitle={<AddMoreMember />} placement="bottom-start" >
                       <div className="max-h-60 overflow-y-auto min-w-[200px]">
                        {availableMembersToAdd.length > 0 ? (
                            availableMembersToAdd.map(member => (
                            <Dropdown.Item key={member.id} eventKey={member.id} onSelect={() => handleAddMember(member.id)}>
                                <div className="flex items-center">
                                <Avatar shape="circle" size={22} src={member.img} />
                                <span className="ml-2 rtl:mr-2">{member.name}</span>
                                </div>
                            </Dropdown.Item>
                            ))
                        ) : (
                            <Dropdown.Item disabled className="text-center text-gray-500">
                                {boardMembersOptions.length > 0 ? "All members assigned" : "No members available"}
                            </Dropdown.Item>
                        )}
                       </div>
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
                      value={field.value ? field.value.map(val => ({label: val, value: val})) : []}
                      onChange={options => field.onChange(options ? options.map(opt => opt.value) : [])}
                      placeholder="Select link types..."
                    />
                  )}
                />
                {errors.linkedToTypes && <p className="text-red-500 text-xs mt-1">{errors.linkedToTypes.message}</p>}
              </div>
              {selectedLinkedToTypesUI.length > 0 && (
                <div className="flex items-center my-3">
                  <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                    Select {selectedLinkedToTypesUI[0]}:
                  </label>
                  <div className="w-full">
                    <Controller
                      name="selectedLinkEntityId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          placeholder={isLinkEntityLoading ? `Loading ${selectedLinkedToTypesUI[0]}s...` : `Select a ${selectedLinkedToTypesUI[0]}...`}
                          options={linkSelectOptions}
                          value={linkSelectOptions.find(opt => opt.value === field.value) || null}
                          onChange={option => field.onChange(option?.value)}
                          isClearable
                          isLoading={isLinkEntityLoading}
                          isDisabled={isLinkEntityLoading || (linkSelectOptions.length === 0 || (linkSelectOptions.length === 1 && linkSelectOptions[0].value === ""))}
                        />
                      )}
                    />
                     {errors.selectedLinkEntityId && <p className="text-red-500 text-xs mt-1">{errors.selectedLinkEntityId.message}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0 pt-1">
                Status: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                        <Dropdown
                            renderTitle={
                                <Tag className={`${taskLabelColors[field.value] || 'bg-gray-200'} cursor-pointer min-w-[100px] text-center py-1.5`} >
                                    {currentDisplayStatus}
                                </Tag>
                            }
                            placement="bottom-start"
                        >
                            {statusDropdownOptions.map(opt => (
                                <Dropdown.Item
                                    key={opt.value}
                                    eventKey={opt.value}
                                    onSelect={() => handleStatusChange(opt.value as TaskStatusApi)}
                                    className={field.value === opt.value ? 'bg-gray-100 dark:bg-gray-600' : ''}
                                >
                                    <div className="flex items-center">
                                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${opt.colorClass}`}></span>
                                        {opt.label}
                                    </div>
                                </Dropdown.Item>
                            ))}
                        </Dropdown>
                    )}
                />
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
              </div>
            </div>

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
                      options={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }, { label: "Urgent", value: "Urgent" }]}
                      value={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }, { label: "Urgent", value: "Urgent" }].find(opt => opt.value === field.value) || null}
                      onChange={option => field.onChange(option?.value)}
                    />
                  )}
                />
                {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>}
              </div>
            </div>

            <div className="flex items-center">
              <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                Department: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="department_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={departmentOptions}
                      value={departmentOptions.length > 0 ? departmentOptions.find(opt => opt.value === field.value) : null}
                      onChange={option => field.onChange(option?.value)}
                      placeholder="Select Department..."
                    />
                  )}
                />
                {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id.message}</p>}
              </div>
            </div>

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
                      inputFormat="MMMM DD, YYYY"
                    />
                  )}
                />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Note / Remark: <span className="text-red-500">*</span>
              </label>
              <div className="w-full">
                <Controller
                  name="note_remark"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} textArea rows={5} placeholder="Enter task note or remark..." />
                  )}
                />
                {errors.note_remark && <p className="text-red-500 text-xs mt-1">{errors.note_remark.message}</p>}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Additional Description (Optional):
              </label>
              <div className="w-full">
                <Controller
                  name="additional_description"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} textArea rows={5} placeholder="Enter any additional details..." />
                  )}
                />
              </div>
            </div>

            <Tabs className="mt-3 col-span-2" defaultValue="activity">
              <Tabs.TabList>
                <TabNav value="activity" className='text-base'><b>Activity Notes</b></TabNav>
                <TabNav value="attachments">Attachments</TabNav>
              </Tabs.TabList>
              <div className="p-4 rounded-b-md border border-t-0 dark:border-gray-700">
                <Tabs.TabContent value="activity">
                 <div className="flex items-center mb-5">
                    <label className="font-semibold text-gray-900 dark:text-gray-100 min-w-[150px] shrink-0">
                      Activity Type:
                    </label>
                    <div className="w-full">
                      <Controller
                        name="activity_type" // This field is now part of the main form schema
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="E.g., Follow-up, Meeting Note, General Update" />
                        )}
                      />
                      {/* Removed asterisk and error message as it's optional in schema for overall task, but required for new comments by logic */}
                    </div>
                  </div>
                  <div className="w-full">
                    {comments.length > 0 && (
                      <div className="mb-4 max-h-60 overflow-y-auto pr-2">
                        {comments.map(comment => (
                          <div key={comment.id} className="mb-3 flex">
                            <div className="mt-1 shrink-0"><Avatar shape="circle" size="sm" src={comment.src} /></div>
                            <div className="ml-2 rtl:mr-2 p-2 bg-gray-50 dark:bg-gray-700/60 rounded-md flex-1 text-sm">
                              <div className="flex items-center mb-1">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.name}</span>
                                <span className="mx-1.5 text-xs text-gray-500 dark:text-gray-400">|</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{dayjs(comment.date).format('DD MMM YYYY, hh:mm A')}</span>
                              </div>
                              <p className="mb-0 whitespace-pre-wrap break-words">{comment.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mb-3 flex gap-2 items-start">
                      <Avatar shape="circle" src={loggedInUserData?.profile_image_path || "/img/avatars/thumb-1.jpg"} className="mt-1 shrink-0"/>
                      <div className="w-full relative">
                        <Input ref={commentInputRef} textArea placeholder="Write comment..." rows={3}/>
                        <div className="absolute bottom-2 right-2">
                          <Button size="xs" variant="solid" onClick={submitComment} type="button">Send</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tabs.TabContent>
                <Tabs.TabContent value="attachments">
                  <div className="mb-4">
                    <label htmlFor="file-upload" className="w-full inline-flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-primary dark:hover:border-primary text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                        <TbPaperclip className="mr-2" />
                        <span>Select or Drop files here</span>
                        <input id="file-upload" type="file" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {attachments.map(file => (
                        <Card key={file.id} bodyClass="p-2" className="shadow-sm">
                          {file.file?.type?.startsWith('image/') ? (
                            <img className="max-w-full h-24 object-contain rounded-md mx-auto mb-2" alt={file.name} src={file.src} />
                          ) : !file.file && file.type?.startsWith('image/') ? (
                            <img className="max-w-full h-24 object-contain rounded-md mx-auto mb-2" alt={file.name} src={file.src} />
                          ) : (
                            <div className="h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md mb-2 text-4xl text-gray-400 dark:text-gray-500">
                               <TbPaperclip />
                            </div>
                          )}
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={file.name}>{file.name}</div>
                            <span className="text-gray-500 dark:text-gray-400">{file.size}</span>
                          </div>
                          <div className="mt-1 flex justify-end items-center">
                            <Tooltip title="Download">
                              <Button
                                variant="plain"
                                size="xs"
                                icon={<TbDownload />}
                                onClick={() => { if(file.src && !file.src.startsWith('blob:')) window.open(file.src, '_blank')}}
                                disabled={file.src.startsWith('blob:')}
                              />
                            </Tooltip>
                            <Tooltip title="Delete">
                              <Button variant="plain" color="red-500" size="xs" icon={<TbTrash />} onClick={() => handleRemoveAttachment(file.id)} />
                            </Tooltip>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 items-center justify-center text-center py-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                      <TbPaperclip size={40} className="text-gray-400 dark:text-gray-500" />
                      <p className="font-semibold text-gray-600 dark:text-gray-300">No attachments yet.</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Upload files using the area above.</p>
                    </div>
                  )}
                </Tabs.TabContent>
              </div>
            </Tabs>
          </div>

          <div className="text-right mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button className="mr-2 rtl:ml-2" size="sm" variant="plain" onClick={() => navigate("/task/task-list")} type="button">Cancel</Button>
            <Button variant="solid" size="sm" type="submit" loading={isSubmitting || masterLoadingStatus === 'loading'} disabled={!isValid || isSubmitting || masterLoadingStatus === 'loading'}>
                {isEditMode ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </AdaptiveCard>
    </Container>
  );
};

export default CreateTaskPage;