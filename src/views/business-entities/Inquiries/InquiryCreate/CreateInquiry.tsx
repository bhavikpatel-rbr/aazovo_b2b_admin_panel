import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { shallowEqual, useSelector } from "react-redux";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/DatePicker";
import { FormItem } from "@/components/ui/Form";
import { Input } from "@/components/ui/input";
import { Notification, toast } from "@/components/ui";
import { Select } from "@/components/ui/select";
import Spinner from "@/components/ui/Spinner";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { HiOutlineTrash } from "react-icons/hi"; 

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addInquiriesAction,
  editInquiriesAction,
  getDepartmentsAction,
  getSalesPersonAction,
} from "@/reduxtool/master/middleware";

// Services
import axiosInstance from '@/services/api/api';

// --- Helper to format Date object to "YYYY-MM-DD" string ---
const formatDateForApi = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null; // Invalid date
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};

// --- Zod Schema for the Form Data ---
const inquiryFormSchema = z.object({
  id: z.number().optional().nullable(),
  company_name: z.string().trim().min(1, "Company Name is Required!"),
  name: z.string().trim().min(1, "Contact Person Name is Required!"),
  email: z.string().trim().min(1, "Email is required!").email("Invalid email address"),
  mobile_no: z.string().trim().min(1, "Mobile number is required!")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid mobile number (e.g., +1234567890)"),
  inquiry_type: z.string().min(1, "Inquiry Type is required."),
  inquiry_subject: z.string().trim().min(1, "Inquiry Subject is required."),
  inquiry_priority: z.string().min(1, "Priority is required."),
  inquiry_description: z.string().trim().optional().nullable(),
  inquiry_status: z.string().min(1, "Status is required."),
  assigned_to: z.union([z.string(), z.number()]).nullable().optional(),
  department: z.array(z.union([z.string(), z.number()])).nullable().optional(), 
  inquiry_date: z.date({ required_error: "Inquiry date is required." }).nullable(),
  response_date: z.date().optional().nullable(),
  resolution_date: z.date().optional().nullable(),
  follow_up_date: z.date().optional().nullable(),
  inquiry_resolution: z.string().trim().optional().nullable(),
  feedback_status: z.string().optional().nullable(),
  inquiry_from: z.string().optional().nullable(),
  inquiry_attachments: z.any().optional(), 
});
type InquiryFormData = z.infer<typeof inquiryFormSchema>;

// --- Default values for a new form ---
const formDefaultValues: InquiryFormData = {
  id: null,
  company_name: "",
  name: "",
  email: "",
  mobile_no: "",
  inquiry_type: "",
  inquiry_subject: "",
  inquiry_priority: "Medium",
  inquiry_description: null,
  inquiry_status: "Open",
  assigned_to: null,
  department: [], 
  inquiry_date: new Date(),
  response_date: null,
  resolution_date: null,
  follow_up_date: null,
  inquiry_resolution: null,
  feedback_status: null,
  inquiry_from: null,
  inquiry_attachments: [], 
};

// --- Transform API data to Form Data ---
const transformApiDataToForm = (apiData: any): InquiryFormData => {
  const safeNewDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const rawDept = apiData.department_id || apiData.inquiry_department || apiData.department;
  let departmentIds: string[] = [];

  if (rawDept) {
    if (typeof rawDept === 'string') {
      departmentIds = rawDept.split(',').map(id => id.trim()).filter(Boolean);
    } else if (Array.isArray(rawDept)) {
      departmentIds = rawDept.map(item => String(item?.id || item)).filter(Boolean);
    } else if (typeof rawDept === 'object' && rawDept !== null) {
      departmentIds = rawDept.id ? [String(rawDept.id)] : [];
    } else if (typeof rawDept === 'number' || typeof rawDept === 'string') {
      departmentIds = [String(rawDept)];
    }
  }

  return {
    id: apiData.id || null,
    company_name: apiData.company_name || "",
    name: apiData.contact_person_name || apiData.name || "",
    email: apiData.contact_person_email || apiData.email || "",
    mobile_no: apiData.contact_person || apiData.mobile_no || "",
    inquiry_type: apiData.inquiry_type || "",
    inquiry_subject: apiData.inquiry_subject || "",
    inquiry_priority: apiData.priority || apiData.inquiry_priority || "Medium",
    inquiry_description: apiData.inquiry_description || null,
    inquiry_status: apiData.status || apiData.inquiry_status || "Open",
    assigned_to: apiData.assigned_to !== undefined && apiData.assigned_to !== null ? String(apiData.assigned_to) : null,
    department: departmentIds,
    inquiry_date: safeNewDate(apiData.inquiry_date) || new Date(),
    response_date: safeNewDate(apiData.response_date),
    resolution_date: safeNewDate(apiData.resolution_date),
    follow_up_date: safeNewDate(apiData.last_follow_up_date || apiData.follow_up_date),
    inquiry_resolution: apiData.resolution_notes || apiData.inquiry_resolution || null,
    feedback_status: apiData.feedback_status || null,
    inquiry_from: apiData.inquiry_from || null,
    inquiry_attachments: [], 
  };
};

type ApiLookupItem = { id: string | number; name: string;[key: string]: any; };
type ExistingAttachment = { name: string; url: string; originalName: string; };

const CreateInquiry = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const inquiryIDFromState = location.state ? (location.state as string | number) : undefined;
  const isEditMode = Boolean(inquiryIDFromState);

  const [isConfirmCancelDialogOpen, setIsConfirmCancelDialogOpen] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);

  const { departmentsData, salesPerson = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

  const departmentOptions = useMemo(() => departmentsData?.data?.map((c: ApiLookupItem) => ({ value: String(c.id), label: c.name })) || [], [departmentsData]);
  const salesPersonOptions = useMemo(() => Array.isArray(salesPerson) ? salesPerson.map((sp: ApiLookupItem) => ({ value: String(sp.id), label: sp.name })) : [], [salesPerson]);

  const inquiryTypeOptions = [
    { value: "New Product Inquiry", label: "New Product Inquiry" },
    { value: "Services Inquiry", label: "Services Inquiry" },
    { value: "Price Quotation", label: "Price Quotation" },
    { value: "General Inquiry", label: "General Inquiry" },
    { value: "Marketing Inquiry", label: "Marketing Inquiry" },
    { value: "Membership Inquiry", label: "Membership Inquiry" },
    { value: "Partnership Inquiry", label: "Partnership Inquiry" },
    { value: "Others", label: "Others" }];
  const priorityOptions = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }];
  const statusOptions = [{ value: "Open", label: "Open" }, { value: "In Progress", label: "In Progress" }, { value: "Resolved", label: "Resolved" }, { value: "On Hold", label: "On Hold" }, { value: "Rejected", label: "Rejected" }, { value: "Closed", label: "Closed" }];
  const feedbackStatusOptions = [{ value: "Received", label: "Received" }, { value: "Pending", label: "Pending" }, { value: "Positive", label: "Positive" }, { value: "Neutral", label: "Neutral" }, { value: "Negative", label: "Negative" }];
  const inquiryFromOptions = [{ value: "Website", label: "Website (Inquiry Form)" },
  { value: "Phone", label: "Phone" }, { value: "Email", label: "Email" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Social Media", label: "Social Media" },
  { value: "Trade Show/Event", label: "Trade Show/Event" },
  { value: "Partner", label: "Partner/Reseller" },
  { value: "Whatsapp", label: "Whatsapp" },
  { value: "Referral", label: "Referral" },
  { value: "Others", label: "Others" }];

  const { control, handleSubmit, formState: { errors, isDirty }, reset, setValue } = useForm<InquiryFormData>({
    defaultValues: formDefaultValues,
    resolver: zodResolver(inquiryFormSchema),
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      setInitialDataFetched(false);
      try {
        await Promise.all([dispatch(getDepartmentsAction()), dispatch(getSalesPersonAction())]);
      } catch (error: any) {
        console.error("Failed to fetch dropdown data:", error);
        toast.push(<Notification title="Data Load Error" type="danger" duration={4000}>{error?.message || "Could not load selection options."}</Notification>);
      } finally {
        setInitialDataFetched(true);
      }
    };
    fetchDropdownData();
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && inquiryIDFromState && initialDataFetched) {
      const fetchInquiryData = async () => {
        try {
          const response = await axiosInstance.get(`/inquiry/${inquiryIDFromState}`);
          if (response.data?.status === true && response.data.data) {
            const apiData = response.data.data;
            reset(transformApiDataToForm(apiData));
            setAttachmentsToRemove([]);

            let originalFileNames: string[] = [];
            if (apiData.inquiry_attachments && typeof apiData.inquiry_attachments === 'string') {
              try {
                originalFileNames = JSON.parse(apiData.inquiry_attachments);
              } catch (e) {
                console.error("Failed to parse inquiry_attachments JSON string:", e);
              }
            }

            if (apiData.inquiry_attachments_array && Array.isArray(apiData.inquiry_attachments_array)) {
              const formattedAttachments = apiData.inquiry_attachments_array.map((url: string, index: number) => {
                const nameFromUrl = url.substring(url.lastIndexOf('/') + 1);
                return { name: nameFromUrl, url, originalName: originalFileNames[index] || nameFromUrl };
              });
              setExistingAttachments(formattedAttachments);
            } else {
              setExistingAttachments([]);
            }
          } else {
            toast.push(<Notification type="danger" title="Fetch Error" duration={4000}>{response.data?.message || 'Failed to load inquiry data.'}</Notification>);
            navigate('/business-entities/inquiries');
          }
        } catch (error: any) {
          toast.push(<Notification type="danger" title="Fetch Error" duration={4000}>{error?.response?.data?.message || error.message || 'Error fetching inquiry details.'}</Notification>);
          navigate('/business-entities/inquiries');
        }
      };
      fetchInquiryData();
    } else if (!isEditMode && initialDataFetched) {
      reset(formDefaultValues);
      setExistingAttachments([]);
      setAttachmentsToRemove([]);
    }
  }, [inquiryIDFromState, isEditMode, reset, navigate, initialDataFetched, dispatch]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        event.preventDefault();
        event.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, isSubmitting]);


  const handleRemoveExistingAttachment = (attachment: ExistingAttachment) => {
    setExistingAttachments(prev => prev.filter(att => att.url !== attachment.url));
    setAttachmentsToRemove(prev => [...prev, attachment.name]); // Add the server-side file name to the removal list
    if (!isDirty) {
      setValue("company_name", control._formValues.company_name, { shouldDirty: true }); 
    }
  };

  const handleCancel = () => {
    if (isDirty || attachmentsToRemove.length > 0) {
      setIsConfirmCancelDialogOpen(true);
    } else {
      resetStatesAndNavigate();
    }
  };

  const resetStatesAndNavigate = () => {
    reset(formDefaultValues);
    setExistingAttachments([]);
    setAttachmentsToRemove([]);
    navigate("/business-entities/inquiries");
  };

  const confirmNavigateAway = () => {
    setIsConfirmCancelDialogOpen(false);
    resetStatesAndNavigate();
  };

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);

    const apiPayloadObject: any = {
      company_id: 1,
      company_name: data.company_name,
      contact_person_name: data.name,
      contact_person_email: data.email,
      contact_person: data.mobile_no,
      inquiry_type: data.inquiry_type,
      inquiry_subject: data.inquiry_subject,
      priority: data.inquiry_priority,
      inquiry_description: data.inquiry_description?.trim() || null,
      status: data.inquiry_status,
      assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
      inquiry_date: formatDateForApi(data.inquiry_date),
      response_date: formatDateForApi(data.response_date),
      resolution_date: formatDateForApi(data.resolution_date),
      resolution_notes: data.inquiry_resolution?.trim() || null,
      last_follow_up_date: formatDateForApi(data.follow_up_date),
      feedback_status: data.feedback_status || null,
      inquiry_from: data.inquiry_from || null,
    };

    const formDataPayload = new FormData();

    for (const key in apiPayloadObject) {
      if (Object.prototype.hasOwnProperty.call(apiPayloadObject, key)) {
        const value = apiPayloadObject[key];
        if (value !== undefined && value !== null) {
          formDataPayload.append(key, String(value));
        }
      }
    }
    
    // **FIX**: Send department IDs as a comma-separated string, a more robust method.
    if (Array.isArray(data.department) && data.department.length > 0) {
        formDataPayload.append('department_id', data.department.join(','));
    }

    if (Array.isArray(data.inquiry_attachments) && data.inquiry_attachments.length > 0) {
      data.inquiry_attachments.forEach((file: any) => {
        if (file instanceof File) {
          formDataPayload.append('inquiry_attachments[]', file, file.name);
        }
      });
    }

    if (isEditMode && attachmentsToRemove.length > 0) {
      attachmentsToRemove.forEach(fileName => {
        formDataPayload.append('attachments_to_remove[]', fileName);
      });
    }

    try {
      if (isEditMode && data.id) {
        formDataPayload.append('id', String(data.id));
        formDataPayload.append('_method', 'PUT');
        await dispatch(editInquiriesAction({ id: data.id, data: formDataPayload })).unwrap();
        toast.push(<Notification type="success" title="Inquiry Updated" duration={3000}>Inquiry updated successfully.</Notification>);
      } else {
        await dispatch(addInquiriesAction(formDataPayload)).unwrap();
        toast.push(<Notification type="success" title="Inquiry Created" duration={3000}>New Inquiry created successfully.</Notification>);
      }
      resetStatesAndNavigate();
    } catch (error: any) {
      const rejectedValue = error?.payload || error;
      let errorMessage = `Failed to ${isEditMode ? "update" : "create"} inquiry.`;
      if (rejectedValue?.message) { errorMessage = rejectedValue.message; }
      else if (typeof rejectedValue === 'string') { errorMessage = rejectedValue; }
      else if (rejectedValue?.errors && typeof rejectedValue.errors === 'object') {
        const firstErrorKey = Object.keys(rejectedValue.errors)[0];
        if (firstErrorKey && Array.isArray(rejectedValue.errors[firstErrorKey]) && rejectedValue.errors[firstErrorKey].length > 0) {
          errorMessage = rejectedValue.errors[firstErrorKey][0];
        }
      }
      toast.push(<Notification type="danger" title={`${isEditMode ? "Update" : "Creation"} Failed`} duration={4000}>{errorMessage}</Notification>);
      console.error("Submit Inquiry Error:", error, "Full Rejected Value:", rejectedValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoadingInitialForm = masterLoadingStatus === "loading" && !initialDataFetched;

  if (isLoadingInitialForm && !isEditMode) {
    return <Container className="h-full flex justify-center items-center"><Spinner size="xl" /></Container>;
  }

  return (
    <>
      <Container>
        <div className="flex gap-1 items-center mb-3">
          <NavLink to="/business-entities/inquiries"><h6 className="font-semibold hover:text-primary">Inquiries</h6></NavLink>
          <BiChevronRight size={22} />
          <h6 className="font-semibold text-primary">{isEditMode ? 'Edit Inquiry' : 'Add New Inquiry'}</h6>
        </div>
        <AdaptiveCard>
          <h5>{isEditMode ? 'Edit Inquiry Details' : 'New Inquiry Details'}</h5>
          {isLoadingInitialForm && isEditMode ? (
            <div className="flex justify-center items-center py-10"> <Spinner size="lg" /></div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 mt-6">
              {/* Rows 1-3 ... no changes here */}
              <FormItem label={<>Inquiry Date <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_date} errorMessage={errors.inquiry_date?.message as string} >
                <Controller name="inquiry_date" control={control} render={({ field }) => (<DatePicker {...field} value={field.value} onChange={field.onChange} placeholder="Select Inquiry Date" />)} />
              </FormItem>
              <FormItem label={<>Status <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_status} errorMessage={errors.inquiry_status?.message} >
                <Controller name="inquiry_status" control={control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
              </FormItem>
              <FormItem label="Inquiry From" invalid={!!errors.inquiry_from} errorMessage={errors.inquiry_from?.message} >
                <Controller name="inquiry_from" control={control} render={({ field }) => (<Select placeholder="Select Inquiry Source" options={inquiryFromOptions} value={inquiryFromOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />)} />
              </FormItem>
              <FormItem label={<>Inquiry Type <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_type} errorMessage={errors.inquiry_type?.message} >
                <Controller name="inquiry_type" control={control} render={({ field }) => (<Select placeholder="Select Inquiry Type" options={inquiryTypeOptions} value={inquiryTypeOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
              </FormItem>

              <FormItem label="Department" invalid={!!errors.department} errorMessage={errors.department?.message as string} >
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => {
                    const selectedValue = departmentOptions.filter(
                      (option) => field.value?.includes(String(option.value))
                    );
                    return (
                      <Select
                        isMulti
                        placeholder="Select Department(s)"
                        options={departmentOptions}
                        isLoading={masterLoadingStatus === 'loading'}
                        value={selectedValue}
                        onChange={(selected) => {
                          const newIds = Array.isArray(selected) ? selected.map((opt) => opt.value) : [];
                          field.onChange(newIds);
                        }}
                        isClearable
                      />
                    );
                  }}
                />
              </FormItem>
              <FormItem label="Assigned To" invalid={!!errors.assigned_to} errorMessage={errors.assigned_to?.message as string} >
                <Controller name="assigned_to" control={control} render={({ field }) => (
                  <Select
                    placeholder="Select Assignee"
                    options={salesPersonOptions}
                    isLoading={masterLoadingStatus === "loading" && salesPersonOptions.length === 0}
                    value={salesPersonOptions.find(o => o.value === field.value) || null}
                    onChange={opt => field.onChange(opt ? opt.value : null)}
                    isClearable
                  />
                )} />
              </FormItem>
              <FormItem label={<>Priority <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_priority} errorMessage={errors.inquiry_priority?.message} >
                <Controller name="inquiry_priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={priorityOptions} value={priorityOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} />
              </FormItem>
              <FormItem label="Response Date" invalid={!!errors.response_date} errorMessage={errors.response_date?.message as string} >
                <Controller name="response_date" control={control} render={({ field }) => (<DatePicker {...field} value={field.value} onChange={field.onChange} placeholder="Select Response Date" />)} />
              </FormItem>

              <FormItem label={<>Company Name <span className="text-red-500">*</span></>} invalid={!!errors.company_name} errorMessage={errors.company_name?.message} >
                <Controller name="company_name" control={control} render={({ field }) => <Input {...field} placeholder="Enter Company Name" />} />
              </FormItem>
              <FormItem label={<>Contact Person Name <span className="text-red-500">*</span></>} invalid={!!errors.name} errorMessage={errors.name?.message} >
                <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Enter Full Name" />} />
              </FormItem>
              <FormItem label={<>Contact Person Email <span className="text-red-500">*</span></>} invalid={!!errors.email} errorMessage={errors.email?.message} >
                <Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" placeholder="Enter Email Address" />} />
              </FormItem>
              <FormItem label={<>Contact Person Mobile <span className="text-red-500">*</span></>} invalid={!!errors.mobile_no} errorMessage={errors.mobile_no?.message} >
                <Controller name="mobile_no" control={control} render={({ field }) => <Input {...field} placeholder="Enter Phone Number (e.g. +1...)" />} />
              </FormItem>

              {/* Row 4 (Subject) & 5 (Resolution & Attachments) */}
              <FormItem label={<>Inquiry Subject <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_subject} errorMessage={errors.inquiry_subject?.message} className="lg:col-span-4" >
                <Controller name="inquiry_subject" control={control} render={({ field }) => <Input {...field} placeholder="Enter Subject of Inquiry" />} />
              </FormItem>

              <FormItem label="Resolution (Notes)" invalid={!!errors.inquiry_resolution} errorMessage={errors.inquiry_resolution?.message} className="md:col-span-2 lg:col-span-3" >
                <Controller name="inquiry_resolution" control={control} render={({ field }) => <Input textArea rows={3} {...field} value={field.value || ''} placeholder="Enter Resolution Notes" />} />
              </FormItem>
              <FormItem label="Attachments" className="lg:col-span-1">
                {existingAttachments.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Existing Files:</p>
                    <ul className="mt-1 text-xs text-gray-500 dark:text-gray-400 list-none p-0">
                      {existingAttachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between py-1">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate" title={`View ${file.originalName}`}>
                            {file.originalName}
                          </a>
                          <Button
                            type="button"
                            shape="circle"
                            size="sm"
                            icon={<HiOutlineTrash />}
                            variant="plain"
                            className="text-red-500 hover:text-red-700 ml-2"
                            onClick={() => handleRemoveExistingAttachment(file)} // **FIX**: Pass the whole file object
                            title={`Remove ${file.originalName}`}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Controller
                  name="inquiry_attachments"
                  control={control}
                  render={({ field: { onChange, value, name, ref } }) => (
                    <>
                      <Input
                        type="file"
                        multiple
                        name={name}
                        ref={ref}
                        onChange={(e) => {
                          const files = e.target.files;
                          onChange(files ? Array.from(files) : []);
                        }}
                        className={existingAttachments.length > 0 ? "mt-2" : ""}
                      />
                      {Array.isArray(value) && value.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">New Files to Upload:</p>
                          <ul className="mt-1 text-xs text-gray-500 dark:text-gray-400 list-disc list-inside">
                            {value.map((file: File | { name: string }, fileIndex: number) => (
                              <li key={fileIndex} className="truncate" title={file.name}>{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                />
              </FormItem>

              <FormItem label="Inquiry Description" invalid={!!errors.inquiry_description} errorMessage={errors.inquiry_description?.message} className="lg:col-span-4" >
                <Controller name="inquiry_description" control={control} render={({ field }) => <Input textArea rows={4} {...field} value={field.value || ''} placeholder="Detailed Description of the Inquiry" />} />
              </FormItem>

              <div className="lg:col-span-4 flex justify-end gap-2 mt-4">
                <Button size="sm" className="mr-2" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="solid"
                  type="submit"
                  loading={isSubmitting}
                  disabled={(!isDirty && isEditMode && attachmentsToRemove.length === 0) || (masterLoadingStatus === 'loading' && !initialDataFetched) || isSubmitting}
                >
                  {isEditMode ? "Update Inquiry" : "Save Inquiry"}
                </Button>
              </div>
            </form>
          )}
        </AdaptiveCard>
      </Container>

      <ConfirmDialog
        isOpen={isConfirmCancelDialogOpen}
        type="warning"
        title="Unsaved Changes"
        onClose={() => setIsConfirmCancelDialogOpen(false)}
        onRequestClose={() => setIsConfirmCancelDialogOpen(false)}
        onCancel={() => setIsConfirmCancelDialogOpen(false)}
        onConfirm={confirmNavigateAway}
      >
        <p>You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.</p>
      </ConfirmDialog>
    </>
  );
};

export default CreateInquiry;