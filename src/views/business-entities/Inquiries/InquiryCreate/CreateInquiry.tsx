import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import { Notification, toast } from "@/components/ui";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/Card"; // Keep Card
import DatePicker from "@/components/ui/DatePicker";
import { FormItem } from "@/components/ui/Form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addInquiriesAction, editInquiriesAction } from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import axiosInstance from '@/services/api/api';
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BiChevronRight } from "react-icons/bi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

const CreateInquiry = () => {
  const transformApiToFormSchema = (apiData) => {
    // ... (same as your previous definition, ensure it's complete) ...
    return {
      "id": 1,
      "inquiry_type": apiData.inquiry_type,
      "inquiry_subject": apiData.inquiry_subject,
      "inquiry_description": apiData.inquiry_description,
      "inquiry_priority": apiData.inquiry_priority,
      "inquiry_status": apiData.inquiry_status,
      "assigned_to": apiData.assigned_to,
      "inquiry_date": apiData.inquiry_date,
      "response_date": apiData.response_date,
      "resolution_date": apiData.resolution_date,
      "follow_up_date": apiData.follow_up_date,
      "feedback_status": apiData.feedback_status,
      "inquiry_resolution": apiData.inquiry_resolution,
      "inquiry_attachments": apiData.inquiry_attachments,
      "name": apiData.name,
      "email": apiData.email,
      "mobile_no": apiData.mobile_no,
      "company_name": apiData.company_name,
      "requirements": apiData.requirements,
      "created_at": apiData.created_at,
      "updated_at": apiData.updated_at,
      "deleted_at": apiData.deleted_at,
      "inquiry_id": apiData.inquiry_id,
      "inquiry_department": apiData.inquiry_department,
      "inquiry_from": apiData.inquiry_from,
      "inquiry_attachments_array": apiData.inquiry_attachments_array,
      "assigned_to_name": apiData.assigned_to_name,
      "inquiry_department_name": apiData.inquiry_department_name
    }
  };
  const optionsType = [
    { value: "General", label: "General" },
    { value: "Product", label: "Product" },
    { value: "Service", label: "Service" },
    { value: "Support", label: "Support" },
  ]
  const [formdata, setformdata] = useState({
    "id": 1,
    "inquiry_type": '',
    "inquiry_subject": '',
    "inquiry_description": '',
    "inquiry_priority": '',
    "inquiry_status": '',
    "assigned_to": '',
    "inquiry_date": '',
    "response_date": '',
    "resolution_date": '',
    "follow_up_date": '',
    "feedback_status": '',
    "inquiry_resolution": '',
    "inquiry_attachments": '',
    "name": '',
    "email": '',
    "mobile_no": '',
    "company_name": '',
    "requirements": '',
    "created_at": '',
    "updated_at": '',
    "deleted_at": '',
    "inquiry_id": '',
    "inquiry_department": '',
    "inquiry_from": '',
    "inquiry_attachments_array": '',
    "assigned_to_name": '',
    "inquiry_department_name": ''
  });
  // Only email, mobile_no, and company_name are required. Others are optional or nullable.
  // Update the zod schema accordingly:
  const inquirySchema = z.object({
    id: z.any().optional().nullable(),
    inquiry_type: z.string().optional().nullable(),
    inquiry_subject: z.string().optional().nullable(),
    inquiry_description: z.string().optional().nullable(),
    inquiry_priority: z.string().optional().nullable(),
    inquiry_status: z.string().optional().nullable(),
    assigned_to: z.string().optional().nullable(),
    inquiry_date: z.string().optional().nullable(),
    response_date: z.string().optional().nullable(),
    resolution_date: z.string().optional().nullable(),
    follow_up_date: z.string().optional().nullable(),
    feedback_status: z.string().optional().nullable(),
    inquiry_resolution: z.string().optional().nullable(),
    inquiry_attachments: z.any().optional().nullable(),
    name: z.string().optional().nullable(),
    email: z.string()
      .trim()
      .min(1, { message: "Email is required!" })
      .email({ message: "Invalid email address" }),
    mobile_no: z.string()
      .trim()
      .min(1, { message: "Mobile number is required!" })
      .regex(/^\+?[1-9]\d{1,14}$/, {
        message: "Invalid international mobile number",
      }),
    company_name: z
      .string()
      .trim()
      .min(1, { message: "Company Name is Required!" }),
    requirements: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    inquiry_id: z.string().optional().nullable(),
    inquiry_department: z.string().optional().nullable(),
    inquiry_from: z.string().optional().nullable(),
    inquiry_attachments_array: z.any().optional().nullable(),
    assigned_to_name: z.string().optional().nullable(),
    inquiry_department_name: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: formdata,
    resolver: zodResolver(inquirySchema)
  });

  const dispatch = useAppDispatch(); // Initialize dispatch
  const location = useLocation();
  const navigate = useNavigate();
  const inquiryID = location.state ? location.state : undefined
  const isEditMode = Boolean(location.state ? true : false);
  const [attachments, setAttachments] = useState<File[]>([]);


  useEffect(() => {
    if (isEditMode && inquiryID) {
      const fetchMemberData = async () => {
        try {
          const response = await axiosInstance.get(`/inquiry/${inquiryID}`);
          if (response.data && response.data.status === true && response.data.data) {
            const transformed = transformApiToFormSchema(response.data.data);
            console.log(transformed, 'transformed')
            reset(transformed)
            setformdata(transformed)
          } else {
            toast.push(<Notification type="danger" title="Fetch Error">{response.data?.message || 'Failed to load inquiries data.'}</Notification>);
            navigate('/business-entities/inquiries');
          }
        } catch (error: any) {
          toast.push(<Notification type="danger" title="Fetch Error">{error.message || 'Error fetching inquiries.'}</Notification>);
          navigate('/business-entities/inquiries');
        } finally {

        }
      };
      fetchMemberData();
    } else {
      reset({});

    }
  }, [inquiryID, isEditMode, navigate]);

  const onSubmit = async (data: any) => {
    // Ensure all fields are included, including files
    const payload = {
      ...formdata,
      ...data,
      inquiry_attachments: Array.isArray(data.inquiry_attachments)
        ? data.inquiry_attachments.map((file: File) => file.name)
        : [],
      inquiry_status: typeof data.inquiry_status === "object" && data.inquiry_status?.value
        ? data.inquiry_status.value
        : data.inquiry_status,
      assigned_to: typeof data.assigned_to === "object" && data.assigned_to?.value
        ? data.assigned_to.value
        : data.assigned_to,
      department:
        data.department && typeof data.department === "object" && "value" in data.department
          ? data.department.value
          : data.department || "",
      inquiry_type: typeof data.inquiry_type === "object" && data.inquiry_type?.value
        ? data.inquiry_type.value
        : data.inquiry_type,
      inquiry_priority: typeof data.inquiry_priority === "object" && data.inquiry_priority?.value
        ? data.inquiry_priority.value
        : data.inquiry_priority,
      feedback_status: typeof data.feedback_status === "object" && data.feedback_status?.value
        ? data.feedback_status.value
        : data.feedback_status,
      inquiry_from: typeof data.inquiry_from === "object" && data.inquiry_from?.value
        ? data.inquiry_from.value
        : data.inquiry_from,
    };

    try {
      if (isEditMode && inquiryID) {
        await dispatch(editInquiriesAction(payload)).unwrap();
        toast.push(
          <Notification type="success" title="Inquiry Updated">
            Inquiry updated successfully.
          </Notification>
        );
        reset({});
        navigate("/business-entities/inquiries");
      } else {
        await dispatch(addInquiriesAction(payload)).unwrap();
        toast.push(
          <Notification type="success" title="Inquiry Created">
            New Inquiry created successfully.
          </Notification>
        );
        reset({});
        navigate("/business-entities/inquiries", { replace: true });
      }
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        `Failed to ${isEditMode ? "update" : "create"} inquiry.`;
      toast.push(
        <Notification
          type="danger"
          title={`${isEditMode ? "Update" : "Creation"} Failed`}
        >
          {errorMessage}
        </Notification>
      );
      console.error("Submit Inquiry Error:", error);
    }
    setAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <>
      <Container>
        <div className="flex gap-1 items-end mb-3 ">
          <NavLink to="/business-entities/inquiries">
            <h6 className="font-semibold hover:text-primary">Inquiries</h6>
          </NavLink>
          <BiChevronRight size={22} color="black" />
          <h6 className="font-semibold text-primary">Add New Inquiry</h6>
        </div>
        <AdaptiveCard>
          <div className="flex flex-col gap-6">
            <h5>New Inquiry</h5>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Basic Info */}
              <FormItem
                label="Inquiry ID"
                invalid={!!errors.inquiry_id}
                errorMessage={
                  typeof errors.inquiry_id === "object" && errors.inquiry_id
                    ? (errors.inquiry_id as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_id"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter Inquiry ID" />
                  )}
                />
              </FormItem>

              <FormItem
                label="Company Name"
                invalid={!!errors.company_name}
                errorMessage={
                  typeof errors.company_name === "object" && errors.company_name
                    ? (errors.company_name as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="company_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Company Name" />
                  )}
                />
              </FormItem>

              <FormItem
                label="Contact Person Name"
                invalid={!!errors.name}
                errorMessage={
                  typeof errors.name === "object" &&
                    errors.name
                    ? (errors.name as { message?: string })
                      .message
                    : undefined
                }
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input  {...field} placeholder="Full Name" />
                  )}
                />
              </FormItem>

              <FormItem
                label="Contact Person Email"
                invalid={!!errors.email}
                errorMessage={
                  typeof errors.email === "object" &&
                    errors.email
                    ? (errors.email as { message?: string })
                      .message
                    : undefined
                }
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email Address"
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Contact Person Phone"
                invalid={!!errors.mobile_no}
                errorMessage={
                  typeof errors.mobile_no === "object" &&
                    errors.mobile_no
                    ? (errors.mobile_no as { message?: string })
                      .message
                    : undefined
                }
              >
                <Controller
                  name="mobile_no"
                  control={control}
                  render={({ field }) => (
                    <Input  {...field} placeholder="Phone Number" />
                  )}
                />
              </FormItem>

              <FormItem
                label="Inquiry Type"
                invalid={!!errors.inquiry_type}
                errorMessage={
                  typeof errors.inquiry_type === "object" && errors.inquiry_type
                    ? (errors.inquiry_type as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={optionsType}
                      placeholder="Select Inquiry Type"
                      value={optionsType.filter((option) => option?.value === field?.value)}
                      onChange={(value) => {
                        field.onChange(value?.value)
                      }}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Inquiry Subject"
                invalid={!!errors.inquiry_subject}
                className="md:col-span-2"
                errorMessage={
                  typeof errors.inquiry_subject === "object" &&
                    errors.inquiry_subject
                    ? (errors.inquiry_subject as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_subject"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Subject" />
                  )}
                />
              </FormItem>

              <FormItem
                label="Priority"
                invalid={!!errors.inquiry_priority}
                errorMessage={
                  typeof errors.inquiry_priority === "object" &&
                    errors.inquiry_priority
                    ? (errors.inquiry_priority as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={[
                        { value: "Low", label: "Low" },
                        { value: "Medium", label: "Medium" },
                        { value: "High", label: "High" },
                      ]}
                      placeholder="Select priority"
                      value={
                        [
                          { value: "Low", label: "Low" },
                          { value: "Medium", label: "Medium" },
                          { value: "High", label: "High" },
                        ].find((option) => option.value === field.value) || null
                      }
                      onChange={(option) => field.onChange(option ? option.value : "")}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Inquiry Description"
                invalid={!!errors.inquiry_description}
                className="md:col-span-3"
                errorMessage={
                  typeof errors.inquiry_description === "object" &&
                    errors.inquiry_description
                    ? (errors.inquiry_description as { message?: string })
                      .message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_description"
                  control={control}
                  render={({ field }) => (
                    <Input textArea placeholder="Description" {...field} />
                  )}
                />
              </FormItem>

              <FormItem
                label="Status"
                invalid={!!errors.inquiry_status}
                errorMessage={
                  typeof errors.inquiry_status === "object" &&
                    errors.inquiry_status
                    ? (errors.inquiry_status as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "Open", label: "Open" },
                        { value: "In Progress", label: "In Progress" },
                        { value: "Closed", label: "Closed" },
                      ]}
                      placeholder="Select status"
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Assigned To"
                invalid={!!errors.assigned_to}
                errorMessage={
                  typeof errors.assigned_to === "object" && errors.assigned_to
                    ? (errors.assigned_to as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="assigned_to"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "John Doe", label: "John Doe" },
                        { value: "Jane Smith", label: "Jane Smith" },
                        { value: "Support Team", label: "Support Team" },
                        { value: "Sales Team", label: "Sales Team" },
                      ]}
                      placeholder="Select person or team"
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Department"
                invalid={!!errors.department}
                errorMessage={
                  typeof errors.department === "object" && errors.department
                    ? (errors.department as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={[
                        { value: "Sales", label: "Sales" },
                        { value: "Support", label: "Support" },
                        { value: "HR", label: "HR" },
                        { value: "IT", label: "IT" },
                        { value: "Finance", label: "Finance" },
                      ]}
                      placeholder="Select department"
                      value={
                        [
                          { value: "Sales", label: "Sales" },
                          { value: "Support", label: "Support" },
                          { value: "HR", label: "HR" },
                          { value: "IT", label: "IT" },
                          { value: "Finance", label: "Finance" },
                        ].find((option) => option.value === field.value) || null
                      }
                      onChange={(option) => field.onChange(option ? option.value : "")}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Inquiry Date"
                invalid={!!errors.inquiry_date}
                errorMessage={
                  typeof errors.inquiry_date === "object" && errors.inquiry_date
                    ? (errors.inquiry_date as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      labelFormat={{
                        month: "MMMM",
                        year: "YY",
                      }}
                      defaultValue={new Date()}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Response Date"
                invalid={!!errors.response_date}
                errorMessage={
                  typeof errors.response_date === "object" &&
                    errors.response_date
                    ? (errors.response_date as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="response_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      labelFormat={{
                        month: "MMMM",
                        year: "YY",
                      }}
                      defaultValue={new Date()}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Resolution Date"
                invalid={!!errors.resolution_date}
                errorMessage={
                  typeof errors.resolution_date === "object" &&
                    errors.resolution_date
                    ? (errors.resolution_date as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="resolution_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      labelFormat={{
                        month: "MMMM",
                        year: "YY",
                      }}
                      defaultValue={new Date()}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Resolution (Notes)"
                invalid={!!errors.inquiry_resolution}
                className="md:col-span-3"
                errorMessage={
                  typeof errors.inquiry_resolution === "object" &&
                    errors.inquiry_resolution
                    ? (errors.inquiry_resolution as { message?: string })
                      .message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_resolution"
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Enter resolution" {...field} textArea />
                  )}
                />
              </FormItem>

              <FormItem
                label="Follow-Up Date"
                invalid={!!errors.follow_up_date}
                errorMessage={
                  typeof errors.follow_up_date === "object" &&
                    errors.follow_up_date
                    ? (errors.follow_up_date as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="follow_up_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      labelFormat={{
                        month: "MMMM",
                        year: "YY",
                      }}
                      defaultValue={new Date()}
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Feedback Status"
                invalid={!!errors.feedback_status}
                errorMessage={
                  typeof errors.feedback_status === "object" &&
                    errors.feedback_status
                    ? (errors.feedback_status as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="feedback_status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "Positive", label: "Positive" },
                        { value: "Neutral", label: "Neutral" },
                        { value: "Negative", label: "Negative" },
                      ]}
                      placeholder="Select feedback"
                    />
                  )}
                />
              </FormItem>

              <FormItem
                label="Inquiry From"
                invalid={!!errors.inquiry_from}
                errorMessage={
                  typeof errors.inquiry_from === "object" && errors.inquiry_from
                    ? (errors.inquiry_from as { message?: string }).message
                    : undefined
                }
              >
                <Controller
                  name="inquiry_from"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "Call", label: "Call" },
                        { value: "Manual", label: "Manual" },
                        { value: "Email", label: "Email" },
                        { value: "Inquiry Form", label: "Inquiry Form" },
                      ]}
                      placeholder="Select inquiry source"
                    />
                  )}
                />
              </FormItem>

              <FormItem label="Attachments" className="md:col-span-3">
                <Controller
                  name="inquiry_attachments"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = (e.target as HTMLInputElement).files;
                          const fileList = files ? Array.from(files) : [];
                          field.onChange(fileList); // Pass the list of files to form state
                        }}
                      />
                      {Array.isArray(field.value) && field.value.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600">
                          {field.value.map((file: File, index: number) => (
                            <li key={index}>{file.name}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                />
              </FormItem>

              {/* Footer with Save and Cancel buttons */}
              <Card bodyClass="flex justify-end gap-2" className="mt-4">
                <Button type="button" className="px-4 py-2">
                  Cancel
                </Button>
                <Button type="submit" className="px-4 py-2" variant="solid">
                  Save
                </Button>
              </Card>
            </form>
          </div>
        </AdaptiveCard>
      </Container>
    </>
  );
};

export default CreateInquiry;
