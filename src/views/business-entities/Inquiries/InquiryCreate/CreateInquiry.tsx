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

  const inquirySchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Name is Required!" }),
    company_name: z
      .string()
      .trim()
      .min(1, { message: "Company Name is Required!" }),
    inquiry_id: z
      .string()
      .trim()
      .min(1, { message: "Inquiry ID is required!" }),
    email: z.string()
      .trim()
      .min(1, { message: "Email is required!" })
      .email({ message: "Invalid email address" }),
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

  console.log(errors, "errors");

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
    // debugger
    try {
      if (isEditMode && inquiryID) {
        await dispatch(editInquiriesAction({ ...formdata, ...data, inquiry_attachments: attachments?.map((file) => file?.name), inquiry_status: data?.inquiry_status?.value, assigned_to: data?.assigned_to?.value, })).unwrap();
        toast.push(
          <Notification type="success" title="Inquery Update">
            Inquery updated successfully.
          </Notification>
        );
        reset({}); // Reset form after successful creation to clear fields
        navigate("/business-entities/inquiries"); // Or to the Inquery's detail page
      } else {
        await dispatch(addInquiriesAction({ ...formdata, ...data, inquiry_attachments: attachments.map((file) => file.name), })).unwrap();
        toast.push(
          <Notification type="success" title="Inquery Created">
            New Inquery created successfully.
          </Notification>
        );
        reset({}); // Reset form after successful creation to clear fields;
        navigate("/business-entities/inquiries", { replace: true }); // Or to the Inquery's detail page
      }

    } catch (error) {
      const errorMessage =
        error?.message ||
        `Failed to ${isEditMode ? "update" : "create"} member.`;
      toast.push(
        <Notification
          type="danger"
          title={`${isEditMode ? "Update" : "Creation"} Failed`}
        >
          {errorMessage}
        </Notification>
      );
      console.error("Submit Member Error:", error);
    }

    reset();
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
                    <Input placeholder="Enter Inquiry ID" {...field} />
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
                    <Input placeholder="Company Name" {...field} />
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
                    <Input placeholder="Full Name" {...field} />
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
                      type="email"
                      placeholder="Email Address"
                      {...field}
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
                    <Input placeholder="Phone Number" {...field} />
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
                      options={[
                        { value: "General", label: "General" },
                        { value: "Product", label: "Product" },
                        { value: "Service", label: "Service" },
                        { value: "Support", label: "Support" },
                      ]}
                      placeholder="Select Inquiry Type"
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
                    <Input placeholder="Subject" {...field} />
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
                      {...field}
                      options={[
                        { value: "Low", label: "Low" },
                        { value: "Medium", label: "Medium" },
                        { value: "High", label: "High" },
                      ]}
                      placeholder="Select priority"
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
                      {...field}
                      options={[
                        { value: "Sales", label: "Sales" },
                        { value: "Support", label: "Support" },
                        { value: "HR", label: "HR" },
                        { value: "IT", label: "IT" },
                        { value: "Finance", label: "Finance" },
                      ]}
                      placeholder="Select department"
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
