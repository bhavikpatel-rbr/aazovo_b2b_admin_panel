// src/views/members/MemberFormPage.tsx (or your chosen path)
import React, { useEffect, useState, ReactNode } from 'react';
import { useForm, Controller, Control, FieldErrors, UseFormReturn } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
import { useAppDispatch } from '@/reduxtool/store'; // For dispatching Redux actions

// UI Components
import { Form, FormItem } from '@/components/ui/Form';
import Card from '@/components/ui/Card';
import Container from '@/components/shared/Container';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbTrash } from 'react-icons/tb';

// Utils & Services
// import sleep from '@/utils/sleep'; // Can be removed if API calls handle delay
import config from '@/configs/app.config';

// --- Redux Actions (Ensure these paths and names are correct) ---
import {
    addMemberAction,
    editMemberAction,
    // getMembersAction, // If you need to refetch the list after add/edit
} from '@/reduxtool/master/middleware'; // Or your members middleware path


// --- Type Definitions ---
export interface MemberFormSchema {
  id?: string | number;
  role_type?: string;
  full_name?: string;
  email?: string;
  password?: string; // Only for create or password change
  contact_country_code?: string;
  mobile_number?: string;
  interested_category_ids?: string;
  interested_subcategory_ids?: string;
  favourite_brands?: string;
  kyc_verified?: "Yes" | "No" | string;
  permanent_id?: string;
  city?: string | { label: string; value: string };
  state?: string | { label: string; value: string };
  country_id?: string | { label: string; value: string };
  continent_id?: string | { label: string; value: string };
  customer_ids?: string;
  pincode?: string;
  status?: string | { label: string; value: string };
  company_name?: string;
  company_name_temp?: string;
  company_description?: string | null;
  company_address?: string;
  whatsapp_number?: string;
  alternate_contact_country_code?: string;
  alternate_contact_number?: string;
  landline_number?: string;
  fax_number?: string;
  alternate_email?: string;
  botim_id?: string;
  skype_id?: string;
  we_chat?: string;
  website?: string;
  business_type?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
  swift_code?: string;
  fssai_license?: string;
  drug_license?: string;
  iec_code?: string;
  iso_certificate?: string;
  other_trading_license?: string;
  usfda_license?: string;
  other_trading_license_2?: string;
  wall_enquiry_permission?: boolean | string;
  enquiry_permission?: boolean | string;
  interested_for?: string;
  alt_email?: string;
  alt_mobile?: string;
  customer_code_permanent?: string;
  product_upload_permission?: boolean | string;
  trade_inquiry_allowed?: string | { label: string; value: string };
  membership_plan_text?: string;
  upgrade_plan?: string | { label: string; value: string };
  request_description?: string;
  favourite_product?: string | { label: string; value: string };
  business_opportunity?: string | { label: string; value: string };
  member_class?: string | { label: string; value: string };
  member_grade?: string | { label: string; value: string };
  relationship_manager?: string | { label: string; value: string };
  remarks?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_handle?: string;
}

export interface FormSectionBaseProps {
  control: Control<MemberFormSchema>;
  errors: FieldErrors<MemberFormSchema>;
}

// --- API Customer Item Type (Raw from API for GET /customer/{id}) ---
interface ApiSingleCustomerItem { /* ... (same as your previous definition) ... */
    id: number;
    role_type?: string;
    name?: string;
    email?: string;
    mobile_no?: string;
    interested_category_ids?: string;
    interested_subcategory_ids?: string;
    favourite_brands?: string;
    kyc_verified?: "Yes" | "No" | string;
    permanent_id?: string;
    city?: string;
    state?: string;
    country_id?: string;
    continent_id?: string;
    customer_ids?: string;
    pincode?: string;
    status?: string;
    company_name?: string;
    company_description?: string | null;
    company_address?: string;
    whatsapp_no?: string;
    office_no?: string;
    botim?: string;
    skype?: string;
    we_chat?: string;
    website?: string;
    business_type?: string;
    gst_number?: string;
    pan_number?: string;
    bank_account_no?: string;
    ifsc_code?: string;
    bank_name?: string;
    branch_name?: string;
    swift_code?: string;
    fssai_license?: string;
    drug_license?: string;
    iec_code?: string;
    iso_certificate?: string;
    other_trading_license?: string;
    usfda_license?: string;
    other_trading_license_2?: string;
    wall_enquiry_permission?: "0" | "1" | "Enabled" | "Disabled" | string;
    enquiry_permission?: "0" | "1" | "Enabled" | "Disabled" | string;
    interested_for?: string;
    alt_email?: string;
    alt_mobile?: string;
    customer_code_permanent?: string;
    product_upload_permission?: "0" | "1" | "Enabled" | "Disabled" | string;
}

// --- Helper to transform API data to MemberFormSchema for EDIT mode ---
const transformApiToFormSchema = (apiData: ApiSingleCustomerItem): Partial<MemberFormSchema> => {
    // ... (same as your previous definition, ensure it's complete) ...
    return {
        id: apiData.id,
        role_type: apiData.role_type,
        full_name: apiData.name,
        email: apiData.email,
        mobile_number: apiData.mobile_no,
        interested_category_ids: apiData.interested_category_ids,
        interested_subcategory_ids: apiData.interested_subcategory_ids,
        favourite_brands: apiData.favourite_brands,
        kyc_verified: apiData.kyc_verified,
        permanent_id: apiData.permanent_id,
        city: apiData.city ? { label: apiData.city, value: apiData.city } : undefined,
        state: apiData.state ? { label: apiData.state, value: apiData.state } : undefined,
        country_id: apiData.country_id ? { label: `Country ${apiData.country_id}`, value: apiData.country_id } : undefined,
        continent_id: apiData.continent_id ? { label: `Continent ${apiData.continent_id}`, value: apiData.continent_id } : undefined,
        customer_ids: apiData.customer_ids,
        pincode: apiData.pincode,
        status: apiData.status ? { label: apiData.status, value: apiData.status } : undefined,
        company_name: apiData.company_name,
        company_name_temp: apiData.company_name,
        company_description: apiData.company_description,
        company_address: apiData.company_address,
        whatsapp_number: apiData.whatsapp_no,
        alternate_contact_number: apiData.alt_mobile,
        landline_number: apiData.office_no,
        alternate_email: apiData.alt_email,
        botim_id: apiData.botim,
        skype_id: apiData.skype,
        we_chat: apiData.we_chat,
        website: apiData.website,
        business_type: apiData.business_type,
        gst_number: apiData.gst_number,
        pan_number: apiData.pan_number,
        bank_account_no: apiData.bank_account_no,
        ifsc_code: apiData.ifsc_code,
        bank_name: apiData.bank_name,
        branch_name: apiData.branch_name,
        swift_code: apiData.swift_code,
        fssai_license: apiData.fssai_license,
        drug_license: apiData.drug_license,
        iec_code: apiData.iec_code,
        iso_certificate: apiData.iso_certificate,
        other_trading_license: apiData.other_trading_license,
        usfda_license: apiData.usfda_license,
        other_trading_license_2: apiData.other_trading_license_2,
        wall_enquiry_permission: apiData.wall_enquiry_permission === "1" || apiData.wall_enquiry_permission?.toLowerCase() === "enabled",
        enquiry_permission: apiData.enquiry_permission === "1" || apiData.enquiry_permission?.toLowerCase() === "enabled",
        interested_for: apiData.interested_for,
        customer_code_permanent: apiData.customer_code_permanent,
        product_upload_permission: apiData.product_upload_permission === "1" || apiData.product_upload_permission?.toLowerCase() === "enabled",
    };
};

// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (formData: MemberFormSchema, isEditMode: boolean, originalData?: Partial<MemberFormSchema>): any => {
    let payload: any = { ...formData }; // Start with all form data

    if (isEditMode && originalData) {
        // For edit mode, merge originalData with formData.
        // formData values will overwrite originalData values if keys are the same.
        payload = { ...originalData, ...formData };
    }

    const toApiBoolean = (value: boolean | string | undefined) => (value === true ? "1" : (value === false ? "0" : value));

    payload.product_upload_permission = toApiBoolean(payload.product_upload_permission);
    payload.wall_enquiry_permission = toApiBoolean(payload.wall_enquiry_permission);
    payload.enquiry_permission = toApiBoolean(payload.enquiry_permission);

    const fieldsToExtractValue = ['status', 'city', 'state', 'country_id', 'continent_id', 'trade_inquiry_allowed', 'upgrade_plan', 'favourite_product', 'business_opportunity', 'member_class', 'member_grade', 'relationship_manager'];
    fieldsToExtractValue.forEach(field => {
        if (payload[field] && typeof payload[field] === 'object' && 'value' in payload[field]) {
            payload[field] = payload[field].value;
        }
    });

    if (!isEditMode) {
        // ADD mode:
        delete payload.id; // 'id' should not be sent for new member creation.
        // 'company_name_temp' (and all other fields from formData) will be included in the payload by default.
        // No need to explicitly delete 'company_name_temp' here if it should be sent for 'add'.
    } else {
        // EDIT mode:
        // 'id' will be part of the payload (either from formData or merged from originalData).
        // If 'company_name_temp' is a transient field or not meant for updates, delete it for edit mode.
        // If your API doesn't expect/handle 'company_name_temp' on updates, it's good to remove it.
        delete payload.company_name_temp;
    }

    return payload;
};


// --- Reusable MemberFormComponent ---
// ... (NavigatorComponent, PersonalDetailsComponent, ContactDetailsComponent, etc. remain the same as in your previous combined file)
// --- Navigator Component ---
const memberNavigationList = [
  { label: "Personal Details", link: "personalDetails" },
  { label: "Contact Info", link: "socialContactInformation" },
  { label: "Member Profile", link: "memberProfile" },
  { label: "Accessibilities", link: "memberAccessibility" },
  { label: "Membership Details", link: "membershipPlanDetails" },
  { label: "Feedback / Requests", link: "requestAndFeedbacks" },
];

type NavigatorComponentProps = {
  activeSection: string;
  onNavigate: (sectionKey: string) => void;
};

const NavigatorComponent = (props: NavigatorComponentProps) => {
  const { activeSection, onNavigate } = props;
  const itemsToRender = memberNavigationList;

  return (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
      {itemsToRender.map((nav) => (
        <button
          type="button"
          key={nav.link}
          className={classNames(
            "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max",
            "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
            {
                'bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold':  activeSection === nav.link,
                'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200':activeSection !== nav.link,
            }
          )}
          onClick={() => onNavigate(nav.link)}
          title={nav.label}
        >
          <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">
            {nav.label}
          </span>
        </button>
      ))}
    </div>
  );
};

const PersonalDetailsComponent = ({ control, errors }: FormSectionBaseProps) => {
  const cityOptions = [{ label: "New York", value: "new_york" }, { label: "London", value: "london" }];
  const stateOptions = [{ label: "New York", value: "ny" }, { label: "California", value: "ca" }];
  const countryOptions = [{ label: "United States", value: "us" }, { label: "United Kingdom", value: "uk" }];
  const continentOptions = [{ label: "North America", value: "north_america" }, { label: "Europe", value: "europe" }];
  const statusOptions = [{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }, { label: "Pending", value: "Pending" }, { label: "Unregistered", value: "Unregistered" }];

  return (
    <Card id="personalDetails">
      <h4 className="mb-6">Personal Details</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <FormItem label="Full Name" invalid={Boolean(errors.full_name)} errorMessage={errors.full_name?.message}>
          <Controller name="full_name" control={control} render={({ field }) => <Input placeholder="Member’s full name" {...field} />} />
        </FormItem>
        <FormItem label="Mobile Number">
          <div className="flex items-center gap-2">
            <Controller name="contact_country_code" control={control} render={({ field }) => <Input placeholder="+1" className="w-20" {...field} />} />
            <Controller name="mobile_number" control={control} render={({ field }) => <Input placeholder="Primary contact number" {...field} />} />
          </div>
        </FormItem>
        <FormItem label="Email" invalid={Boolean(errors.email)} errorMessage={errors.email?.message}>
          <Controller name="email" control={control} render={({ field }) => <Input type="email" placeholder="Primary email address" {...field} />} />
        </FormItem>
        <FormItem label="Company Name (Temp)" invalid={Boolean(errors.company_name_temp)} errorMessage={errors.company_name_temp?.message} className="md:col-span-3">
          <Controller name="company_name_temp" control={control} render={({ field }) => <Input placeholder="Temporary or display company name" {...field} />} />
        </FormItem>
         <FormItem label="Company Name (Actual)" invalid={Boolean(errors.company_name)} errorMessage={errors.company_name?.message} className="md:col-span-3">
          <Controller name="company_name" control={control} render={({ field }) => <Input placeholder="Official company name for submission" {...field} />} />
        </FormItem>
        <FormItem label="Address" invalid={Boolean(errors.address)} errorMessage={errors.address?.message} className="md:col-span-3">
          <Controller name="address" control={control} render={({ field }) => <Input textArea placeholder="Full Address" {...field} />} />
        </FormItem>
        <FormItem label="Status" invalid={Boolean(errors.status)} errorMessage={errors.status?.message as string}>
          <Controller name="status" control={control} render={({ field }) => <Select placeholder="Please Select" options={statusOptions} {...field} />} />
        </FormItem>
        <FormItem label="City" invalid={Boolean(errors.city)} errorMessage={errors.city?.message as string}>
          <Controller name="city" control={control} render={({ field }) => <Select placeholder="Select City" options={cityOptions} {...field} />} />
        </FormItem>
        <FormItem label="State" invalid={Boolean(errors.state)} errorMessage={errors.state?.message as string}>
          <Controller name="state" control={control} render={({ field }) => <Select placeholder="Select State" options={stateOptions} {...field} />} />
        </FormItem>
        <FormItem label="Country" invalid={Boolean(errors.country_id)} errorMessage={errors.country_id?.message as string}>
          <Controller name="country_id" control={control} render={({ field }) => <Select placeholder="Select Country" options={countryOptions} {...field} />} />
        </FormItem>
        <FormItem label="Continent" invalid={Boolean(errors.continent_id)} errorMessage={errors.continent_id?.message as string}>
          <Controller name="continent_id" control={control} render={({ field }) => <Select placeholder="Select Continent" options={continentOptions} {...field} />} />
        </FormItem>
        <FormItem label="Pincode" invalid={Boolean(errors.pincode)} errorMessage={errors.pincode?.message}>
          <Controller name="pincode" control={control} render={({ field }) => <Input placeholder="Enter pincode" {...field} />} />
        </FormItem>
      </div>
    </Card>
  );
};

const ContactDetailsComponent = ({ control, errors }: FormSectionBaseProps) => {
  return (
    <Card id="socialContactInformation">
      <h4 className="mb-6">Social & Contact Information</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <FormItem label="WhatsApp No." invalid={Boolean(errors.whatsapp_number)} errorMessage={errors.whatsapp_number?.message}>
          <Controller name="whatsapp_number" control={control} render={({ field }) => <Input placeholder="Enter WhatsApp number" {...field} />} />
        </FormItem>
        <FormItem label="Alternate Contact Number">
            <div className="flex items-center gap-2">
                <Controller name="alternate_contact_country_code" control={control} render={({ field }) => <Input placeholder="+1" className="w-20" {...field} />} />
                <Controller name="alternate_contact_number" control={control} render={({ field }) => <Input placeholder="Alternate contact" {...field} />} />
            </div>
        </FormItem>
        <FormItem label="Landline Number" invalid={Boolean(errors.landline_number)} errorMessage={errors.landline_number?.message}>
          <Controller name="landline_number" control={control} render={({ field }) => <Input type="tel" placeholder="Landline" {...field} />} />
        </FormItem>
        <FormItem label="Fax Number" invalid={Boolean(errors.fax_number)} errorMessage={errors.fax_number?.message}>
          <Controller name="fax_number" control={control} render={({ field }) => <Input type="tel" placeholder="Fax" {...field} />} />
        </FormItem>
        <FormItem label="Alternate Email" invalid={Boolean(errors.alternate_email)} errorMessage={errors.alternate_email?.message}>
          <Controller name="alternate_email" control={control} render={({ field }) => <Input type="email" placeholder="Alternate email" {...field} />} />
        </FormItem>
        <FormItem label="Botim ID" invalid={Boolean(errors.botim_id)} errorMessage={errors.botim_id?.message}>
            <Controller name="botim_id" control={control} render={({field}) => <Input {...field} placeholder="Botim ID"/>}/>
        </FormItem>
        <FormItem label="Skype ID" invalid={Boolean(errors.skype_id)} errorMessage={errors.skype_id?.message}>
            <Controller name="skype_id" control={control} render={({field}) => <Input {...field} placeholder="Skype ID"/>}/>
        </FormItem>
        <FormItem label="WeChat ID" invalid={Boolean(errors.we_chat)} errorMessage={errors.we_chat?.message}>
            <Controller name="we_chat" control={control} render={({field}) => <Input {...field} placeholder="WeChat ID"/>}/>
        </FormItem>
        <FormItem label="LinkedIn Profile" invalid={Boolean(errors.linkedin_profile)} errorMessage={errors.linkedin_profile?.message}>
            <Controller name="linkedin_profile" control={control} render={({field}) => <Input {...field} placeholder="LinkedIn URL"/>}/>
        </FormItem>
        <FormItem label="Facebook Profile" invalid={Boolean(errors.facebook_profile)} errorMessage={errors.facebook_profile?.message}>
            <Controller name="facebook_profile" control={control} render={({field}) => <Input {...field} placeholder="Facebook URL"/>}/>
        </FormItem>
        <FormItem label="Instagram Handle" invalid={Boolean(errors.instagram_handle)} errorMessage={errors.instagram_handle?.message}>
            <Controller name="instagram_handle" control={control} render={({field}) => <Input {...field} placeholder="@instagram"/>}/>
        </FormItem>
      </div>
    </Card>
  );
};

const MemberAccessibilityComponent = ({ control, errors }: FormSectionBaseProps) => {
  const yesNoOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  return (
    <Card id="memberAccessibility">
      <h4 className="mb-6">Member Accessibility</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <FormItem label="Product Upload Enable" invalid={Boolean(errors.product_upload_permission)} errorMessage={errors.product_upload_permission?.message as string}>
          <Controller name="product_upload_permission" control={control}
            render={({ field }) => (
              <div className="flex gap-4">
                <Checkbox checked={field.value === true} onChange={() => field.onChange(true)}>Yes</Checkbox>
                <Checkbox checked={field.value === false || field.value === undefined} onChange={() => field.onChange(false)}>No</Checkbox>
              </div>
            )} />
        </FormItem>
        <FormItem label="Wall Listing Enable" invalid={Boolean(errors.wall_enquiry_permission)} errorMessage={errors.wall_enquiry_permission?.message as string}>
          <Controller name="wall_enquiry_permission" control={control}
            render={({ field }) => (
              <div className="flex gap-4">
                <Checkbox checked={field.value === true} onChange={() => field.onChange(true)}>Yes</Checkbox>
                <Checkbox checked={field.value === false || field.value === undefined} onChange={() => field.onChange(false)}>No</Checkbox>
              </div>
            )} />
        </FormItem>
        <FormItem label="Trade Inquiry Allowed" invalid={Boolean(errors.trade_inquiry_allowed)} errorMessage={errors.trade_inquiry_allowed?.message as string}>
          <Controller name="trade_inquiry_allowed" control={control}
            render={({ field }) => <Select {...field} placeholder="Select" options={yesNoOptions} />} />
        </FormItem>
      </div>
    </Card>
  );
};

const MembershipPlanComponent = ({ control, errors }: FormSectionBaseProps) => {
  const planOptions = [{ value: "Basic", label: "Basic" }, { value: "Premium", label: "Premium" }, { value: "Enterprise", label: "Enterprise" }];
  return (
    <Card id="membershipPlanDetails">
      <h4 className="mb-6">Membership Plan Details</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <FormItem label="Membership Plan (Current)" invalid={Boolean(errors.membership_plan_text)} errorMessage={errors.membership_plan_text?.message}>
           <Controller name="membership_plan_text" control={control} render={({ field }) => <Input placeholder="e.g., Premium Plan" {...field}/>} />
        </FormItem>
        <FormItem label="Upgrade Your Plan" invalid={Boolean(errors.upgrade_plan)} errorMessage={errors.upgrade_plan?.message as string}>
          <Controller name="upgrade_plan" control={control} render={({ field }) => <Select placeholder="Select New Plan" options={planOptions} {...field} />} />
        </FormItem>
      </div>
    </Card>
  );
};

const RequestAndFeedbacksComponent = ({ control, errors }: FormSectionBaseProps) => {
  return (
    <Card id="requestAndFeedbacks">
      <h4 className="mb-6">Request & Feedback</h4>
      <div>
        <FormItem label="Add Feedback / Requests" invalid={Boolean(errors.request_description)} errorMessage={errors.request_description?.message}>
          <Controller name="request_description" control={control} render={({ field }) => <Input textArea rows={4} placeholder="Describe your request or feedback in detail..." {...field} />} />
        </FormItem>
      </div>
    </Card>
  );
};

const MemberProfileComponent = ({ control, errors }: FormSectionBaseProps) => {
  const productOptions = [{ value: "ProductA", label: "Product A" }, { value: "ProductB", label: "Product B" }];
  const opportunityOptions = [{ value: "Export", label: "Export" }, { value: "Import", label: "Import" }, { value: "Partnership", label: "Partnership" }];
  const classOptions = [{ value: "Gold", label: "Gold" }, { value: "Silver", label: "Silver" }, { value: "Bronze", label: "Bronze" }];
  const gradeOptions = [{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }];
  const managerOptions = [{ value: "Manager1", label: "Manager 1" }, { value: "Manager2", label: "Manager 2" }];

  return (
    <Card id="memberProfile">
      <h4 className="mb-6">Additional Member Profile</h4>
      <div className="grid md:grid-cols-3 gap-4">
        <FormItem label="Favourite Product(s)" invalid={Boolean(errors.favourite_product)} errorMessage={errors.favourite_product?.message as string}>
          <Controller name="favourite_product" control={control} render={({ field }) => <Select {...field} isMulti placeholder="Select favourite products" options={productOptions} />} />
        </FormItem>
        <FormItem label="Business Opportunity" invalid={Boolean(errors.business_opportunity)} errorMessage={errors.business_opportunity?.message as string}>
          <Controller name="business_opportunity" control={control} render={({ field }) => <Select {...field} placeholder="Select opportunity" options={opportunityOptions} />} />
        </FormItem>
        <FormItem label="Member Class" invalid={Boolean(errors.member_class)} errorMessage={errors.member_class?.message as string}>
          <Controller name="member_class" control={control} render={({ field }) => <Select {...field} placeholder="Select class" options={classOptions} />} />
        </FormItem>
        <FormItem label="Member Grade" invalid={Boolean(errors.member_grade)} errorMessage={errors.member_grade?.message as string}>
          <Controller name="member_grade" control={control} render={({ field }) => <Select {...field} placeholder="Select grade" options={gradeOptions} />} />
        </FormItem>
        <FormItem label="Relationship Manager" invalid={Boolean(errors.relationship_manager)} errorMessage={errors.relationship_manager?.message as string}>
          <Controller name="relationship_manager" control={control} render={({ field }) => <Select {...field} placeholder="Select RM" options={managerOptions} />} />
        </FormItem>
        <FormItem label="Remarks" className="md:col-span-3" invalid={Boolean(errors.remarks)} errorMessage={errors.remarks?.message}>
          <Controller name="remarks" control={control} render={({ field }) => <Input textArea {...field} placeholder="Enter internal remarks" />} />
        </FormItem>
      </div>
    </Card>
  );
};

type MemberFormComponentProps = {
  onFormSubmit: (values: MemberFormSchema, formMethods: UseFormReturn<MemberFormSchema>) => void;
  defaultValues?: Partial<MemberFormSchema>;
  isEditMode?: boolean;
  onDiscard?: () => void; 
  isSubmitting?: boolean;
};

const MemberFormComponent = (props: MemberFormComponentProps) => {
  const { onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting } = props;
  const [activeSection, setActiveSection] = useState<any>("personalDetails");

  const formMethods = useForm<MemberFormSchema>({ defaultValues: defaultValues || {} });
  const { handleSubmit, reset, formState: { errors }, control } = formMethods;

  useEffect(() => {
    if (!isEmpty(defaultValues)) {
      reset(defaultValues);
    } else if (!isEditMode) { 
      reset({}); 
    }
  }, [defaultValues, isEditMode, reset]);

  const internalFormSubmit = (values: MemberFormSchema) => {
    onFormSubmit?.(values, formMethods);
  };

  const navigationKeys: any[] = memberNavigationList.map(item => item.link as any);
  const handleNext = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex < navigationKeys.length - 1) setActiveSection(navigationKeys[currentIndex + 1]);
  };
  const handlePrevious = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "personalDetails": return <PersonalDetailsComponent errors={errors} control={control} />;
      case "socialContactInformation": return <ContactDetailsComponent errors={errors} control={control} />;
      case "memberAccessibility": return <MemberAccessibilityComponent errors={errors} control={control} />;
      case "membershipPlanDetails": return <MembershipPlanComponent errors={errors} control={control} />;
      case "requestAndFeedbacks": return <RequestAndFeedbacksComponent errors={errors} control={control} />;
      case "memberProfile": return <MemberProfileComponent errors={errors} control={control} />;
      default: return <PersonalDetailsComponent errors={errors} control={control} />;
    }
  };

  return (
    <>
        <div className="flex gap-1 items-end mb-3">
            <NavLink to="/business-entities/member">
                <h6 className="font-semibold hover:text-primary-600">Member</h6>
            </NavLink>
            <BiChevronRight size={22} />
            <h6 className="font-semibold text-primary-600">
                {isEditMode ? "Edit Member" : "Add New Member"}
            </h6>
        </div>
        <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
            <NavigatorComponent activeSection={activeSection} onNavigate={(sectionKey) => setActiveSection(sectionKey as any)} />
        </Card>
        <div className="flex flex-col gap-4 pb-20">
            {renderActiveSection()}
        </div>
        <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
           <div className="flex justify-between items-center p-4">
            <div>
                {onDiscard && (
                    <Button type="button" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"} icon={<TbTrash />} onClick={onDiscard} disabled={isSubmitting}>
                        Discard
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button type="button" onClick={handlePrevious} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === 0}>Previous</Button>
                <Button type="button" onClick={handleNext} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === navigationKeys.length -1}>Next</Button>
                <Button type="button" onClick={() => console.log("Draft clicked")} disabled={isSubmitting}>Draft</Button>
                <Button variant="solid" type="button" loading={isSubmitting} onClick={handleSubmit(internalFormSubmit)} disabled={isSubmitting}>
                    {isEditMode ? "Update" : "Create"}
                </Button>
            </div>
           </div>
        </Card>
    </>
  );
};


// --- MemberFormPage (Combined Add/Edit Page) ---
const MemberCreate  = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch(); // Initialize dispatch
    const { memberId } = useParams<{ memberId?: string }>();
    const isEditMode = Boolean(memberId);

    const [initialData, setInitialData] = useState<Partial<MemberFormSchema> | null>(null);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode && memberId) {
            const fetchMemberData = async () => {
                setPageLoading(true);
                try {
                    // const response = await axiosInstance.get(`/customer/${memberId}`);
                    const response :any = []
                    if (response.data && response.data.status === true && response.data.data) {
                        const transformed = transformApiToFormSchema(response.data.data);
                        setInitialData(transformed);
                    } else {
                        toast.push(<Notification type="danger" title="Fetch Error">{response.data?.message || 'Failed to load member data.'}</Notification>);
                        navigate('/business-entities/member');
                    }
                } catch (error: any) {
                    toast.push(<Notification type="danger" title="Fetch Error">{error.message || 'Error fetching member.'}</Notification>);
                    navigate('/business-entities/member');
                } finally {
                    setPageLoading(false);
                }
            };
            fetchMemberData();
        } else {
            setInitialData({});
            setPageLoading(false);
        }
    }, [memberId, isEditMode, navigate]);

    const handleFormSubmit = async (formValues: MemberFormSchema, formMethods: UseFormReturn<MemberFormSchema>) => {
        setIsSubmitting(true);
        const payload = preparePayloadForApi(formValues, isEditMode, initialData || {});

        try {
            if (isEditMode && memberId) {
                // Ensure 'id' is part of the payload if your editMemberAction expects it at the top level
                const updatePayload = { ...payload, id: memberId };
                await dispatch(editMemberAction(updatePayload)).unwrap(); // unwrap to handle promise
                toast.push(<Notification type="success" title="Member Updated">Details updated successfully.</Notification>);
            } else {
              console.log("payload",payload);
              
                await dispatch(addMemberAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Member Created">New member created successfully.</Notification>);
                formMethods.reset({}); // Reset form after successful creation to clear fields
            }
            navigate('/business-entities/member'); // Or to the member's detail page
        } catch (error: any) {
            // error object from rejectWithValue should have a 'message' property
            const errorMessage = error?.message || `Failed to ${isEditMode ? 'update' : 'create'} member.`;
            toast.push(<Notification type="danger" title={`${isEditMode ? 'Update' : 'Creation'} Failed`}>{errorMessage}</Notification>);
            console.error("Submit Member Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDiscardDialog = () => setDiscardConfirmationOpen(true);
    const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
    const handleConfirmDiscard = () => {
        closeDiscardDialog();
        navigate('/business-entities/member');
    };

    if (pageLoading) {
        return <Container className="h-full flex justify-center items-center"><p>Loading...</p></Container>;
    }
    if (isEditMode && !initialData) {
         return <Container className="h-full flex justify-center items-center"><p>Member data could not be loaded for editing.</p></Container>;
    }

    return (
        <Container className="h-full">
            <Form onSubmit={() => {}} className="flex flex-col min-h-screen">
                <div className="flex-grow">
                    <MemberFormComponent
                        onFormSubmit={handleFormSubmit}
                        defaultValues={initialData || {}}
                        isEditMode={isEditMode}
                        onDiscard={openDiscardDialog}
                        isSubmitting={isSubmitting}
                    />
                </div>
                <ConfirmDialog isOpen={discardConfirmationOpen} type="danger" title="Discard Changes"
                    onClose={closeDiscardDialog} onRequestClose={closeDiscardDialog} onCancel={closeDiscardDialog} onConfirm={handleConfirmDiscard}>
                    <p>Are you sure you want to discard changes? This cannot be undone.</p>
                </ConfirmDialog>
            </Form>
        </Container>
    );
};

export default MemberCreate ;