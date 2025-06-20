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
  department: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).nullable().optional(),
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
  department: null,
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
    department: apiData.department_id || apiData.inquiry_department || null,
    inquiry_date: safeNewDate(apiData.inquiry_date) || new Date(),
    response_date: safeNewDate(apiData.response_date),
    resolution_date: safeNewDate(apiData.resolution_date),
    follow_up_date: safeNewDate(apiData.last_follow_up_date || apiData.follow_up_date),
    inquiry_resolution: apiData.resolution_notes || apiData.inquiry_resolution || null,
    feedback_status: apiData.feedback_status || null,
    inquiry_from: apiData.inquiry_from || null,
    inquiry_attachments: [], // Existing attachments are not part of this form field's state for new uploads
  };
};

type ApiLookupItem = { id: string | number; name: string; [key: string]: any; };

const CreateInquiry = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  
  const inquiryIDFromState = location.state ? (location.state as string | number) : undefined;
  const isEditMode = Boolean(inquiryIDFromState);

  const [isConfirmCancelDialogOpen, setIsConfirmCancelDialogOpen] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { departmentsData, salesPerson = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

  const departmentOptions = useMemo(() => departmentsData?.data?.map((c: ApiLookupItem) => ({ value: String(c.id), label: c.name })) || [], [departmentsData]);
  const salesPersonOptions = useMemo(() => Array.isArray(salesPerson) ? salesPerson.map((sp: ApiLookupItem) => ({ value: String(sp.id), label: sp.name })) : [], [salesPerson]);

  const inquiryTypeOptions = [ { value: "Sales Inquiry", label: "Sales Inquiry" }, { value: "Buy Inquiry", label: "Buy Inquiry" }, { value: "Product Support", label: "Product Support" }, { value: "Service Support", label: "Service Support" }, { value: "Technical Support", label: "Technical Support" }, { value: "Complaint", label: "Complaint" }, { value: "Others", label: "Others" }];
  const priorityOptions = [ { value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }];
  const statusOptions = [ { value: "Open", label: "Open" }, { value: "In Progress", label: "In Progress" }, { value: "Resolved", label: "Resolved" }, { value: "On Hold", label: "On Hold" }, { value: "Rejected", label: "Rejected" }, { value: "Closed", label: "Closed" }];
  const feedbackStatusOptions = [ { value: "Received", label: "Received" }, { value: "Pending", label: "Pending" }, { value: "Positive", label: "Positive" }, { value: "Neutral", label: "Neutral" }, { value: "Negative", label: "Negative" }];
  const inquiryFromOptions = [ { value: "Website", label: "Website (Inquiry Form)" }, { value: "Call", label: "Call" }, { value: "Email", label: "Email" }, { value: "Whatsapp", label: "Whatsapp" }, { value: "Manual", label: "Manual Entry" }, { value: "Partner", label: "Partner Referral" }, { value: "Others", label: "Others" }];

  const { control, handleSubmit, formState: { errors, isDirty }, reset } = useForm<InquiryFormData>({
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
            reset(transformApiDataToForm(response.data.data));
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
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  const handleCancel = () => {
    if (isDirty) setIsConfirmCancelDialogOpen(true);
    else navigate("/business-entities/inquiries");
  };

  const confirmNavigateAway = () => {
    setIsConfirmCancelDialogOpen(false);
    reset(formDefaultValues);
    navigate("/business-entities/inquiries");
  };

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);

    const apiPayloadObject: any = {
      // id: data.id, // ID will be part of URL for edit or appended to FormData later if needed
      company_id: 1, // Placeholder
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
      department_id: Array.isArray(data.department)
        ? (data.department.length > 0 ? Number(data.department[0]) : null)
        : (data.department ? Number(data.department) : null),
      inquiry_date: formatDateForApi(data.inquiry_date),
      response_date: formatDateForApi(data.response_date),
      resolution_date: formatDateForApi(data.resolution_date),
      resolution_notes: data.inquiry_resolution?.trim() || null,
      last_follow_up_date: formatDateForApi(data.follow_up_date),
      feedback_status: data.feedback_status || null,
      inquiry_from: data.inquiry_from || null,
    };

    const formDataPayload = new FormData();

    // Append all defined, non-null fields from apiPayloadObject to formDataPayload
    for (const key in apiPayloadObject) {
      if (Object.prototype.hasOwnProperty.call(apiPayloadObject, key)) {
        const value = apiPayloadObject[key];
        if (value !== undefined && value !== null) {
          formDataPayload.append(key, String(value)); // Convert all to string for FormData
        } else if (value === null) {
          // If your API expects an empty string for null values when using FormData:
          // formDataPayload.append(key, '');
          // Otherwise, omitting it (as done by `value !== undefined && value !== null`) is often fine.
        }
      }
    }
    
    // Handle NEW attachments
    if (Array.isArray(data.inquiry_attachments) && data.inquiry_attachments.length > 0) {
      data.inquiry_attachments.forEach((file: any) => { // Use 'any' if it could be File or other object
        if (file instanceof File) { // Important: only append actual File objects
          formDataPayload.append('inquiry_attachments[]', file, file.name);
        }
      });
    }
    // Note: No special handling for 'inquiry_attachments' being empty in edit mode here.
    // If no new files are selected, 'inquiry_attachments[]' won't be appended.
    // This typically means "no changes to existing attachments" for the backend.

    try {
      if (isEditMode && data.id) {
        formDataPayload.append('id', String(data.id)); // Ensure ID is part of the payload for edit action

        // VERY IMPORTANT: If your backend uses POST to handle PUT/PATCH with FormData,
        // you might need to append a _method field:
        // formDataPayload.append('_method', 'PUT'); // Or 'PATCH'

        await dispatch(editInquiriesAction({ id: data.id, data: formDataPayload })).unwrap();
        toast.push(<Notification type="success" title="Inquiry Updated" duration={3000}>Inquiry updated successfully.</Notification>);
      } else {
        await dispatch(addInquiriesAction(formDataPayload)).unwrap();
        toast.push(<Notification type="success" title="Inquiry Created" duration={3000}>New Inquiry created successfully.</Notification>);
      }
      reset(formDefaultValues);
      navigate("/business-entities/inquiries", { replace: true });
    } catch (error: any) {
      // Improved error message extraction
      const rejectedValue = error?.payload || error; // error from unwrap() is often the rejectedValue
      const errorMessage = rejectedValue?.message || 
                           (typeof rejectedValue === 'string' ? rejectedValue : 
                           `Failed to ${isEditMode ? "update" : "create"} inquiry.`);
      toast.push(<Notification type="danger" title={`${isEditMode ? "Update" : "Creation"} Failed`} duration={4000}>{errorMessage}</Notification>);
      console.error("Submit Inquiry Error:", error, "Rejected Value:", rejectedValue);
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
          {isLoadingInitialForm && isEditMode ? ( // Show spinner inside card for edit mode initial data load
             <div className="flex justify-center items-center py-10"> <Spinner size="lg" /></div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 mt-6">
            {/* Row 1: Dates and Types */}
            <FormItem label={<>Inquiry Date <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_date} errorMessage={errors.inquiry_date?.message as string} >
              <Controller name="inquiry_date" control={control} render={({ field }) => ( <DatePicker {...field} value={field.value} onChange={field.onChange} placeholder="Select Inquiry Date" /> )} />
            </FormItem>
            <FormItem label={<>Status <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_status} errorMessage={errors.inquiry_status?.message} >
              <Controller name="inquiry_status" control={control} render={({ field }) => ( <Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} /> )} />
            </FormItem>
            <FormItem label="Inquiry From" invalid={!!errors.inquiry_from} errorMessage={errors.inquiry_from?.message} >
              <Controller name="inquiry_from" control={control} render={({ field }) => ( <Select placeholder="Select Inquiry Source" options={inquiryFromOptions} value={inquiryFromOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable /> )} />
            </FormItem>
            <FormItem label={<>Inquiry Type <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_type} errorMessage={errors.inquiry_type?.message} >
              <Controller name="inquiry_type" control={control} render={({ field }) => ( <Select placeholder="Select Inquiry Type" options={inquiryTypeOptions} value={inquiryTypeOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} /> )} />
            </FormItem>

            {/* Row 2: Assignment and Priority */}
            <FormItem label="Department" invalid={!!errors.department} errorMessage={errors.department?.message as string} >
              <Controller name="department" control={control} render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Department(s)"
                  options={departmentOptions}
                  isLoading={masterLoadingStatus === "loading" && departmentOptions.length === 0}
                  value={ Array.isArray(field.value) ? departmentOptions.filter(opt => field.value.includes(opt.value)) : departmentOptions.find(opt => opt.value === field.value) || null }
                  onChange={(selectedOptions) => field.onChange( Array.isArray(selectedOptions) ? selectedOptions.map(opt => opt.value) : selectedOptions?.value || null )}
                  isClearable
                />
              )} />
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
              <Controller name="inquiry_priority" control={control} render={({ field }) => ( <Select placeholder="Select Priority" options={priorityOptions} value={priorityOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} /> )} />
            </FormItem>
            <FormItem label="Response Date" invalid={!!errors.response_date} errorMessage={errors.response_date?.message as string} >
              <Controller name="response_date" control={control} render={({ field }) => ( <DatePicker {...field} value={field.value} onChange={field.onChange} placeholder="Select Response Date" /> )} />
            </FormItem>

            {/* Row 3: Company & Contact Info */}
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
            
            {/* Row 4: Inquiry Subject (Full Width) */}
            <FormItem label={<>Inquiry Subject <span className="text-red-500">*</span></>} invalid={!!errors.inquiry_subject} errorMessage={errors.inquiry_subject?.message} className="lg:col-span-4" >
              <Controller name="inquiry_subject" control={control} render={({ field }) => <Input {...field} placeholder="Enter Subject of Inquiry" />} />
            </FormItem>

            {/* Row 5: Resolution Notes & Attachments */}
            <FormItem label="Resolution (Notes)" invalid={!!errors.inquiry_resolution} errorMessage={errors.inquiry_resolution?.message} className="md:col-span-2 lg:col-span-3" >
              <Controller name="inquiry_resolution" control={control} render={({ field }) => <Input textArea rows={3} {...field} value={field.value || ''} placeholder="Enter Resolution Notes" />} />
            </FormItem>
            <FormItem label="Attachments" className="lg:col-span-1">
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
                    />
                    {Array.isArray(value) && value.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-500 list-disc list-inside">
                        {value.map((file: any, index: number) => ( 
                           <li key={index} className="truncate" title={file.name}>{file.name}</li> 
                        ))}
                      </ul>
                    )}
                  </>
                )}
              />
            </FormItem>

            {/* Row 6: Inquiry Description (Full Width) */}
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
                    loading={isSubmitting} // This prop should handle showing spinner & disabling
                    disabled={(!isDirty && isEditMode) || (masterLoadingStatus === 'loading' && !initialDataFetched) || isSubmitting}
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