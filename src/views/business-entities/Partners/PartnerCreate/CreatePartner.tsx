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
import { NavLink, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  addMemberAction,
  editMemberAction,
  // editMemberAction,
  // getMembersAction, // If you need to refetch the list after add/edit
} from "@/reduxtool/master/middleware"; // Or your members middleware path
import { useAppDispatch } from "@/reduxtool/store";

const CreatePartner = () => {
  const phoneRegex = new RegExp(
    /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
  );
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // Initialize dispatch

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const partnerFromSchema = z.object({
    partner_name: z
      .string()
      .trim()
      .min(1, { message: "Partner name is Required !" }),
    partner_contact_number: z.string().regex(phoneRegex, "Invalid Number!"),
    partner_email_id: z
      .string()
      .min(1, { message: "This field has to be filled." })
      .email("This is not a valid email."),
    partner_location: z
      .string()
      .trim()
      .min(1, { message: "Location is Required !" }),
    partner_profile_completion: z
      .union([
        z.string().refine((val) => !isNaN(Number(val)), {
          message: "Input must be a valid number",
        }),
        z.number(),
      ])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((value) => value >= 1 && value <= 100, {
        message: "Value must be between 1 and 100",
      }),
    partner_trust_score: z
      .union([
        z.string().refine((val) => !isNaN(Number(val)), {
          message: "Input must be a valid number",
        }),
        z.number(),
      ])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((value) => value >= 1 && value <= 100, {
        message: "Value must be between 1 and 100",
      }),
    partner_activity_score: z
      .union([
        z.string().refine((val) => !isNaN(Number(val)), {
          message: "Input must be a valid number",
        }),
        z.number(),
      ])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((value) => value >= 1, {
        message: "Value must be between 1 and 100",
      }),
    // partner_kyc_status: z.string().trim().min(1, { message: "KYC is Required !" }),
    partner_business_type: z
      .string()
      .trim()
      .min(1, { message: "Business Type is Required !" }),
  });

  const addFormMethods = useForm({
    resolver: zodResolver(partnerFromSchema),
    defaultValues: {
      partner_name: "",
      partner_profile_completion: 0,
      partner_location: "",
      partner_email_id: "",
      partner_contact_number: "",
      continent_id: "",
      name: "",
      iso: "",
      phonecode: "",
      partner_trust_score: 0,
      partner_activity_score: 0,
      partner_kyc_status: "",
      partner_business_type: "",
      partner_interested_in: "",
      partner_website: "",
      partner_payment_terms: "",
      partner_referenced_name: "",
      partner_reference_id: "",
      partner_lead_time: "",
    },
    mode: "onChange",
  });

  const onSubmit = (data: any) => {
    console.log("Partner submitted", data);
    try {
      await dispatch(addpartnerAction(payload)).unwrap();
      // toast.push(
      //   <Notification type="success" title="Partner Created">
      //     New Partner created successfully.
      //   </Notification>
      // );
      reset({}); // Reset form after successful creation to clear fields
      // }
      navigate("/business-entities/partner"); // Or to the partner's detail page
    } catch (error) {
      // error object from rejectWithValue should have a 'message' property
      // const errorMessage =
      //   error?.message ||
      //   `Failed to ${isEditMode ? "update" : "create"} member.`;
      // toast.push(
      //   <Notification
      //     type="danger"
      //     title={`${isEditMode ? "Update" : "Creation"} Failed`}
      //   >
      //     {errorMessage}
      //   </Notification>
      // );
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
          <h6 className="font-semibold text-primary">Add New Partner</h6>
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
                label="Partner Name"
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
                label="Contact Number"
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
                label="Email"
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
                label="Partner Status"
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
                  render={() => (
                    <Select
                      placeholder="Select status"
                      options={[
                        { value: "Active", label: "Active" },
                        { value: "Inactive", label: "Inactive" },
                        { value: "Pending", label: "Pending" },
                      ]}
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

              {/* Profile Completion */}
              <FormItem
                label="Profile Completion %"
                id="partner_profile_completion"
                invalid={
                  !!addFormMethods?.formState?.errors
                    ?.partner_profile_completion?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_profile_completion
                    ?.message
                }
              >
                <Controller
                  name="partner_profile_completion"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0 - 100"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Trust Score */}
              <FormItem
                label="Trust Score"
                id="partner_profile_completion"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_trust_score
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_trust_score
                    ?.message
                }
              >
                <Controller
                  name="partner_trust_score"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="Enter trust score"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Activity Score */}
              <FormItem
                label="Activity Score"
                id="partner_profile_completion"
                invalid={
                  !!addFormMethods?.formState?.errors?.partner_activity_score
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_activity_score
                    ?.message
                }
              >
                <Controller
                  name="partner_activity_score"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="Enter activity score"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* KYC Status */}
              <FormItem
                label="KYC Status"
                id="partner_profile_completion"
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
                    ?.message
                }
              >
                <Controller
                  name="partner_business_type"
                  control={addFormMethods.control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="e.g., B2B, B2C"
                      {...field}
                    />
                  )}
                />
              </FormItem>

              {/* Interested In */}
              <FormItem
                label="Interested In"
                id="partner_business_type"
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
                  render={() => (
                    <Select
                      placeholder="Select interested in"
                      options={[
                        { value: "Buy", label: "Buy" },
                        { value: "Sell", label: "Sell" },
                        { value: "Both", label: "Both" },
                        { value: "Other", label: "Other" },
                      ]}
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
                  !!addFormMethods?.formState?.errors?.partner_referenced_name
                    ?.message
                }
                errorMessage={
                  addFormMethods?.formState?.errors?.partner_referenced_name
                    ?.message
                }
              >
                <Controller
                  name="partner_referenced_name"
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
              {/* Footer with Save and Cancel buttons */}

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
            </form>
          </div>
        </AdaptiveCard>
      </Container>
      {/* Footer with Save and Cancel buttons */}
    
    </>
  );
};

export default CreatePartner;
