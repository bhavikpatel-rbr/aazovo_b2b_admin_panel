import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card"; // Keep Card
import DatePicker from "@/components/ui/DatePicker";
import { FormItem } from "@/components/ui/Form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { BiChevronRight } from "react-icons/bi";
import { TbPlus } from "react-icons/tb";
import { NavLink, useLocation, useNavigate, useNavigation } from "react-router-dom";
import { z } from "zod";
import {
  addpartnerAction,
  editpartnerAction,
} from "@/reduxtool/master/middleware"; // Or your members middleware path
import { useAppDispatch } from "@/reduxtool/store";
import toast from '@/components/ui/toast';
import { Notification } from "@/components/ui";
import { useEffect, useState } from "react";
import axiosInstance, { isAxiosError } from '@/services/api/api';

const CreatePartner = () => {
  const phoneRegex = new RegExp(
    /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
  );
  const location = useLocation();
  const navigate = useNavigate();
  const memberId = location.state ? location.state : undefined
  const isEditMode = Boolean(location.state ? true : false);

  const dispatch = useAppDispatch(); // Initialize dispatch
  const getVal = (fieldValue: any): string | undefined => {
    if (fieldValue === null || fieldValue === undefined) return undefined;
    if (typeof fieldValue === 'object' && 'value' in fieldValue) {
      return String(fieldValue.value ?? '');
    }
    return String(fieldValue ?? '');
  };
  const transformApiToFormSchema = (apiData) => {
    const createSelectOption = (value?: string | null, labelPrefix?: string): { label: string; value: string } | undefined => {
      if (value === null || value === undefined || String(value).trim() === '') return undefined;
      const strValue = String(value);
      return { label: labelPrefix ? `${labelPrefix} ${strValue}` : strValue, value: strValue };
    };
    return {
      "id": apiData.id,
      "partner_name": apiData.partner_name,
      "partner_contact_number": apiData.partner_contact_number,
      "partner_email_id": apiData.partner_email_id,
      "partner_logo": apiData.partner_logo,
      "partner_status": createSelectOption(apiData.partner_status),
      "partner_join_date": apiData.partner_join_date,
      "partner_location": apiData.partner_location,
      "partner_kyc_status": createSelectOption(apiData.partner_kyc_status),
      "business_category": apiData.business_category,
      "partner_interested_in": createSelectOption(apiData.partner_interested_in),
      "partner_business_type": createSelectOption(apiData.partner_business_type),
      "partner_profile_link": apiData.partner_profile_link,
      "partner_certifications": apiData.partner_certifications,
      "partner_service_offerings": apiData.partner_service_offerings,
      "partner_website": apiData.partner_website,
      "partner_payment_terms": apiData.partner_payment_terms,
      "partner_reference_id": apiData.partner_reference_id,
      "partner_document_upload": apiData.partner_document_upload,
      "partner_lead_time": apiData.partner_lead_time,
      "created_at": apiData.created_at,
      "updated_at": apiData.updated_at,
      "deleted_at": apiData.deleted_at,
      "partner_reference_name": apiData.partner_reference_name,
      "partner_doctument": apiData.partner_doctument,
      "partner_logo_url": apiData.partner_logo_url,
      "partner_document_array": apiData.partner_document_array
    }
  };
  const transformdataToAPISchema = (apiData) => {
    return {
      "id": apiData.id,
      "partner_name": apiData.partner_name,
      "partner_contact_number": apiData.partner_contact_number,
      "partner_email_id": apiData.partner_email_id,
      "partner_logo": apiData.partner_logo,
      "partner_status": getVal(apiData.partner_status),
      "partner_join_date": apiData.partner_join_date,
      "partner_location": apiData.partner_location,
      "partner_kyc_status": getVal(apiData.partner_kyc_status),
      "business_category": apiData.business_category,
      "partner_interested_in": getVal(apiData.partner_interested_in),
      "partner_business_type": getVal(apiData.partner_business_type),
      "partner_profile_link": apiData.partner_profile_link,
      "partner_certifications": apiData.partner_certifications,
      "partner_service_offerings": apiData.partner_service_offerings,
      "partner_website": apiData.partner_website,
      "partner_payment_terms": apiData.partner_payment_terms,
      "partner_reference_id": apiData.partner_reference_id,
      "partner_document_upload": apiData.partner_document_upload,
      "partner_lead_time": apiData.partner_lead_time,
      "created_at": apiData.created_at,
      "updated_at": apiData.updated_at,
      "deleted_at": apiData.deleted_at,
      "partner_reference_name": apiData.partner_reference_name,
      "partner_doctument": apiData.partner_doctument,
      "partner_logo_url": apiData.partner_logo_url,
      "partner_document_array": apiData.partner_document_array
    }
  };
  const [formdata, setformdata] = useState({
    "id": '',
    "partner_name": '',
    "partner_contact_number": '',
    "partner_email_id": '',
    "partner_logo": '',
    "partner_status": '',
    "partner_join_date": '',
    "partner_location": '',
    "partner_kyc_status": '',
    "business_category": '',
    "partner_interested_in": '',
    "partner_business_type": '',
    "partner_profile_link": '',
    "partner_certifications": '',
    "partner_service_offerings": '',
    "partner_website": '',
    "partner_payment_terms": '',
    "partner_reference_id": '',
    "partner_document_upload": '',
    "partner_lead_time": '',
    "created_at": '',
    "updated_at": '',
    "deleted_at": '',
    "partner_reference_name": '',
    "partner_doctument": '',
    "partner_logo_url": '',
    "partner_document_array": '',
  })

  const businessTypeOptions = [
    { value: "Manufacturer", label: "Manufacturer" },
    { value: "Wholesaler", label: "Wholesaler" },
    { value: "Retailer", label: "Retailer" },
    { value: "Service Provider", label: "Service Provider" },
    { value: "Distributor", label: "Distributor" },
    { value: "Trader", label: "Trader" },
    { value: "Other", label: "Other" },
];

  const partnerFromSchema = z.object({
    partner_name: z
      .string()
      .trim()
      .min(1, { message: "Partner name is Required !" }),
    partner_interested_in: z.object({ value: z.string(), label: z.string() })
      .optional(),
    partner_kyc_status: z.object({ value: z.string(), label: z.string() })
      .optional(),
    partner_status: z.object({ value: z.string(), label: z.string() })
      .optional(),
    partner_website: z.string()
      .trim()
      .min(1, { message: "Website is Required !" }),
    partner_payment_terms: z.string()
      .trim()
      .min(1, { message: "Payment Term is Required !" }),

    partner_lead_time: z.string()
      .min(1, { message: "Lead Time is Required !" }),
    partner_reference_id: z.string().regex(phoneRegex, "Invalid Number!"),
    partner_contact_number: z.string().regex(phoneRegex, "Invalid Number!"),
    partner_reference_name: z.string()
      .min(1, { message: "Ref Name is Required !" }),
    partner_email_id: z
      .string()
      .min(1, { message: "This field has to be filled." })
      .email("This is not a valid email."),
    partner_location: z
      .string()
      .trim()
      .min(1, { message: "Location is Required !" }),
    partner_business_type: z.object(
        { value: z.string(), label: z.string() },
        { required_error: "Business Type is required." }
    ),
  });
  const addFormMethods = useForm({
    resolver: zodResolver(partnerFromSchema),
    defaultValues: formdata,
    mode: "onChange",
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = addFormMethods;

  useEffect(() => {
    if (isEditMode && memberId) {
      const fetchMemberData = async () => {
        try {
          const response = await axiosInstance.get(`/partner/${memberId}`);
          if (response.data && response.data.status === true && response.data.data) {
            const transformed = transformApiToFormSchema(response.data.data);
            reset(transformed)
            setformdata(transformed)
          } else {
            toast.push(<Notification type="danger" title="Fetch Error">{response.data?.message || 'Failed to load partner data.'}</Notification>);
            navigate('/business-entities/partner');
          }
        } catch (error: any) {
          toast.push(<Notification type="danger" title="Fetch Error">{error.message || 'Error fetching partner.'}</Notification>);
          navigate('/business-entities/partner');
        } finally {

        }
      };
      fetchMemberData();
    } else {
      reset({});
    }
  }, [memberId, isEditMode, navigate]);


  const onSubmit = async (data: any) => {
    console.log("Partner submitted", data, formdata, { ...formdata, ...data });
    try {
      if (isEditMode && memberId) {
        await dispatch(editpartnerAction(transformdataToAPISchema({ ...formdata, ...data }))).unwrap();
        toast.push(
          <Notification type="success" title="Partner Created">
            Partner updated successfully.
          </Notification>
        );
        reset({}); // Reset form after successful creation to clear fields
        navigate("/business-entities/partner"); // Or to the partner's detail page
      } else {
        await dispatch(addpartnerAction(data)).unwrap();
        toast.push(
          <Notification type="success" title="Partner Created">
            New Partner created successfully.
          </Notification>
        );
        reset({}); // Reset form after successful creation to clear fields;
        navigate("/business-entities/partner", { replace: true }); // Or to the partner's detail page
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
  };

  // Inside your component:
  const { fields, append, remove } = useFieldArray({
    control,
    name: "partner_documents",
  });

  return (
    <>
      <Container>
        <div className="flex gap-1 items-end mb-3 ">
          <NavLink to="/business-entities/partner">
            <h6 className="font-semibold hover:text-primary">Partner</h6>
          </NavLink>
          <BiChevronRight size={22} color="black" />
          <h6 className="font-semibold text-primary">{isEditMode ? 'Edit Partner' : 'Add New Partner'}</h6>
        </div>
        <AdaptiveCard>
          <div className="flex flex-col gap-6">
            <h4 className="">Partner Details</h4>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Partner Name */}
              <FormItem
                id="partner_name"
                label={<div>Partner Name<span className="text-red-500"> * </span></div>}
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_name?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_name?.message
                }
              >
                <Controller
                  name="partner_name"
                  control={addFormMethods?.control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="Enter partner name"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Contact Number */}
              <FormItem
                id="partner_name"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_contact_number
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_contact_number
                    ?.message
                }
                label={<div>Contact Number<span className="text-red-500"> * </span></div>}
              >
                <Controller
                  name="partner_contact_number"
                  control={addFormMethods?.control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="Enter contact number"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Email */}
              <FormItem
                id="partner_email_id"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_email_id?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_email_id?.message
                }
                label={<div>Email<span className="text-red-500"> * </span></div>}
              >
                <Controller
                  name="partner_email_id"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input type="email" placeholder="Enter email" {...field} />
                  )}
                />
              </FormItem>

              {/* Upload Logo" */}
              <FormItem
                label="Upload Logo"
                invalid={Boolean(errors.partner_logo)}
                errorMessage={
                  typeof errors.partner_logo?.message === "string"
                    ? errors.partner_logo.message
                    : undefined
                }
              >
                <Controller
                  name="partner_logo"
                  control={control}
                  render={({ field }) => (
                    <Input type="file" placeholder="Upload Logo" {...field} />
                  )}
                />
              </FormItem>

              {/* Status */}
              <FormItem
                label={<div>Status<span className="text-red-500"> * </span></div>}
                invalid={Boolean(errors.partner_status)}
                errorMessage={
                  typeof errors.partner_status?.message === "string"
                    ? errors.partner_status.message
                    : undefined
                }
              >
                <Controller
                  name="partner_status"
                  control={control}
                  render={({ ...field }
                  ) => (
                    <Select
                      placeholder="Select status"
                      options={[
                        { value: "Active", label: "Active" },
                        { value: "Inactive", label: "Inactive" },
                        { value: "Pending", label: "Pending" },
                      ]}
                      {...field}

                    />
                  )}
                />
              </FormItem>

              {/* Join Date */}
              <FormItem
                label="Join Date"
                invalid={Boolean(errors.partner_join_date)}
                errorMessage={
                  typeof errors.partner_join_date?.message === "string"
                    ? errors.partner_join_date.message
                    : undefined
                }
              >
                <Controller
                  name="partner_join_date"
                  control={control}
                  render={() => <DatePicker defaultValue={new Date()} />}
                />
              </FormItem>

              {/* Partner Location */}
              <FormItem
                label="Location"
                id="partner_email_id"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_location?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_location?.message
                }
              >
                <Controller
                  name="partner_location"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input type="text" placeholder="City, Country" {...field} />
                  )}
                />
              </FormItem>

              {/* KYC Status */}
              <FormItem
                label="KYC Status"
                id="partner_kyc_status"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_kyc_status
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_kyc_status?.message
                }
              >
                <Controller
                  name="partner_kyc_status"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select KYC status"
                      options={[
                        { value: "Verified", label: "Verified" },
                        { value: "Not Verified", label: "Not Verified" },
                        { value: "Pending", label: "Pending" },
                      ]}
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Business Type */}
              <FormItem
                label="Business Type"
                id="partner_business_type"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_business_type
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_business_type
                    ?.message as string
                }
              >
                <Controller
                  name="partner_business_type"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select business type"
                      options={businessTypeOptions}
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Interested In */}
              <FormItem
                label="Interested In"
                id="partner_interested_in"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_interested_in
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_interested_in
                    ?.message
                }
              >
                <Controller
                  name="partner_interested_in"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select interested in"
                      options={[
                        { value: "Yes", label: "Yes" },
                        { value: "No", label: "No" },
                        { value: "None", label: "None" },
                      ]}
                      {...field}

                    />
                  )}
                />
              </FormItem>

              {/* Website */}
              <FormItem
                label="Website URL"
                id="partner_website"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_website?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_website?.message
                }
              >
                <Controller
                  name="partner_website"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Payment Terms */}
              <FormItem
                label="Payment Terms"
                id="partner_payment_terms"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_payment_terms
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_payment_terms
                    ?.message
                }
              >
                <Controller
                  name="partner_payment_terms"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input type="text" placeholder="e.g., Net 30" {...field} />
                  )}
                />
              </FormItem>

              {/* Reference ID / Contact */}
              {/* Referenced Name Input */}
              <FormItem
                label="Referenced Name"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_reference_name
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_reference_name
                    ?.message
                }
              >
                <Controller
                  name="partner_reference_name"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="Enter referenced name"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Existing Reference Contact/ID Input */}
              <FormItem
                label="Reference Contact/ID"
                id="partner_reference_id"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_reference_id
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_reference_id
                    ?.message
                }
              >
                <Controller
                  name="partner_reference_id"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="Reference name or ID"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Lead Time */}
              <FormItem
                label="Lead Time (days)"
                id="partner_lead_time"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_lead_time
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_lead_time?.message
                }
              >
                <Controller
                  name="partner_lead_time"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="Enter lead time"
                      {...field}
                    />
                  )}
                />
              </FormItem>
              {/* Upload Documents */}
              <FormItem
                className="col-span-3"
                label={
                  <div className="flex items-center gap-2 w-full ">
                    <span className="form-label mb-2">Upload Documents</span>
                    <div className="flex-1 text-right">
                      <Button
                        type="button"
                        onClick={() => append({ name: "", file: null })}
                        icon={<TbPlus />}
                      >
                        Add New
                      </Button>
                    </div>
                  </div>
                }
                invalid={Boolean(errors.partner_documents)}
                errorMessage={
                  typeof errors.partner_documents?.message === "string"
                    ? errors.partner_documents.message
                    : undefined
                }
              >
                <div className="md:grid grid-cols-3 gap-2">
                  {fields.map((item, index) => (
                    <Card key={item.id} className="">
                      <div className="mb-2">
                        <Controller
                          name={`partner_documents.${index}.name`}
                          control={addFormMethods.control}
                          render={({ field }) => (
                            <Input placeholder="Document Name" {...field} />
                          )}
                        />
                      </div>
                      <div>
                        <Controller
                          name={`partner_documents.${index}.file`}
                          control={addFormMethods.control}
                          render={({ field: { onChange, ...rest } }) => (
                            <Input
                              type="file"
                              onChange={(e) => onChange(e.target.files[0])}
                              {...rest}
                            />
                          )}
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </FormItem>
              <Card bodyClass="flex justify-end gap-2" className="mt-4 col-span-3">
                <Button type="button" className="px-4 py-2" onClick={() => navigate("/business-entities/partner")}>
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
      {/* Footer with Save and Cancel buttons */}

    </>
  );
};

export default CreatePartner;