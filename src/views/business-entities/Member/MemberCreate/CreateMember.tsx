// src/views/members/MemberFormPage.tsx

import { useAppDispatch } from '@/reduxtool/store';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { useEffect, useState }
from 'react';
import { Control, Controller, FieldErrors, useForm, UseFormReturn } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom'; // Removed useLocation as useParams is preferred

// UI Components
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Container from '@/components/shared/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import { Form, FormItem } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Notification from '@/components/ui/Notification';
import Select from '@/components/ui/Select';
import toast from '@/components/ui/toast';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbTrash } from 'react-icons/tb';

// Redux Actions & Selectors
import {
    addMemberAction,
    editMemberAction,
    getMemberByIdAction,
    getContinentsAction, // Assuming you have these for members too or common master data
    getCountriesAction,
} from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import axiosInstance from '@/services/api/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { z } from 'zod';

// --- Type Definitions ---
export interface MemberFormSchema {
    id?: string | number;
    role_type?: string | { label: string; value: string };
    name?: string;
    email?: string;
    password?: string;
    contact_country_code?: string;
    mobile_no?: string;
    interested_category_ids?: string;
    interested_subcategory_ids?: string;
    favourite_brands?: string;
    kyc_verified?: "Yes" | "No" | string | { label: string; value: string };
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
    address?: string,
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
    customer_code_permanent?: string;
    product_upload_permission?: boolean | string;
    trade_inquiry_allowed?: string | { label: string; value: string };
    membership_plan_text?: string;
    upgrade_plan?: string | { label: string; value: string };
    request_description?: string;
    favourite_product_ids?: Array<{ label: string; value: string }>; // For multi-select
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
    formMethods: UseFormReturn<MemberFormSchema>;
}

interface ApiSingleCustomerItem {
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
    company_name_tmp?: string; // API might send this for temp name
    company_description?: string | null;
    address?: string;
    company_address?: string;
    whatsapp_no?: string;
    office_no?: string;
    alt_mobile?: string;
    alt_email?: string;
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
    wall_enquiry_permission?: "0" | "1" | string;
    enquiry_permission?: "0" | "1" | string;
    interested_for?: string;
    customer_code_permanent?: string;
    product_upload_permission?: "0" | "1" | string;
    trade_inquiry_allowed?: string;
    membership_plan?: string;
    upgrade_your_plan?: string;
    request_feedback?: string;
    favourite_products?: string; // Comma-separated IDs "1,2"
    business_opportunity?: string;
    member_class?: string;
    member_grade?: string;
    relationship_manager?: string;
    remarks?: string;
    linkedin_profile?: string;
    facebook_profile?: string;
    instagram_profile?: string;
    created_by?: string,
    password?: string,
    reset_count?: number,
    // ... other fields from your API as needed
}

// --- Helper to transform API data to MemberFormSchema for EDIT mode ---
const transformApiToFormSchema = (apiData: ApiSingleCustomerItem): Partial<MemberFormSchema> => {
    const toFormBoolean = (value?: "0" | "1" | string): boolean | undefined => {
        if (value === "1" || value?.toLowerCase() === "yes" || value?.toLowerCase() === "true" || value?.toLowerCase() === "enabled") return true;
        if (value === "0" || value?.toLowerCase() === "no" || value?.toLowerCase() === "false" || value?.toLowerCase() === "disabled") return false;
        return undefined;
    };

    const createSelectOption = (value?: string | null, labelPrefix?: string): { label: string; value: string } | undefined => {
        if (value === null || value === undefined || String(value).trim() === '') return undefined;
        const strValue = String(value);
        return { label: labelPrefix ? `${labelPrefix} ${strValue}` : strValue, value: strValue };
    };

    // This assumes productOptions for Select component is available elsewhere to map IDs to labels
    // For now, we'll just create options with ID as label.
    const favouriteProductOptions = apiData.favourite_products
        ?.split(',')
        .filter(id => id.trim() !== '')
        .map(id => ({ label: `Product ${id}`, value: id })) || [];

    return {
        id: apiData.id,
        role_type: createSelectOption(apiData.role_type, 'Role'),
        name: apiData.name,
        email: apiData.email,
        mobile_no: apiData.mobile_no,
        interested_category_ids: apiData.interested_category_ids,
        interested_subcategory_ids: apiData.interested_subcategory_ids,
        favourite_brands: apiData.favourite_brands,
        kyc_verified: createSelectOption(apiData.kyc_verified),
        permanent_id: apiData.permanent_id,
        city: createSelectOption(apiData.city),
        state: createSelectOption(apiData.state),
        // For country/continent, you'd ideally map ID to a label from your Redux store's CountriesData/ContinentsData
        country_id: createSelectOption(apiData.country_id, apiData.country_id),
        continent_id: createSelectOption(apiData.continent_id, apiData.continent_id),
        customer_ids: apiData.customer_ids,
        pincode: apiData.pincode,
        status: createSelectOption(apiData.status),
        company_name: apiData.company_name,
        company_name_temp: apiData.company_name_tmp || apiData.company_name,
        company_description: apiData.company_description,
        address: apiData.address,
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
        wall_enquiry_permission: toFormBoolean(apiData.wall_enquiry_permission),
        enquiry_permission: toFormBoolean(apiData.enquiry_permission),
        interested_for: apiData.interested_for,
        customer_code_permanent: apiData.customer_code_permanent,
        product_upload_permission: toFormBoolean(apiData.product_upload_permission),
        trade_inquiry_allowed: createSelectOption(apiData.trade_inquiry_allowed),
        membership_plan_text: apiData.membership_plan,
        upgrade_plan: createSelectOption(apiData.upgrade_your_plan),
        request_description: apiData.request_feedback,
        favourite_product_ids: favouriteProductOptions,
        business_opportunity: createSelectOption(apiData.business_opportunity),
        member_class: createSelectOption(apiData.member_class),
        member_grade: createSelectOption(apiData.member_grade),
        relationship_manager: createSelectOption(apiData.relationship_manager),
        remarks: apiData.remarks,
        linkedin_profile: apiData.linkedin_profile,
        facebook_profile: apiData.facebook_profile,
        instagram_handle: apiData.instagram_profile,
    };
};

// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (formData: Partial<MemberFormSchema>, isEditMode: boolean): any => {
    const payload: any = {};

    const getVal = (fieldValue: any): string | undefined => {
        if (fieldValue === null || fieldValue === undefined) return undefined;
        if (typeof fieldValue === 'object' && 'value' in fieldValue) {
            return String(fieldValue.value ?? '');
        }
        return String(fieldValue ?? '');
    };

    const toApiBooleanString = (value: boolean | string | undefined): string => {
        if (value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes' || String(value) === '1') return '1';
        // Only map explicit false to '0', otherwise, if API expects '0' for undefined, adjust here.
        if (value === false || String(value).toLowerCase() === 'false' || String(value).toLowerCase() === 'no' || String(value) === '0') return '0';
        return ''; // Or '0' if your API expects '0' for not explicitly true
    };

    const formatMultiSelectToString = (value?: Array<{ label: string, value: string }>): string => {
        if (!value || value.length === 0) return '';
        return value.map(item => item.value).join(',');
    };

    payload.role_type = getVal(formData.role_type) ?? '0';
    payload.name = formData.name ?? '';
    payload.email = formData.email ?? '';
    if (formData.password) { // Only include password if provided
        payload.password = formData.password;
    } else if (!isEditMode) { // For create mode, if password is empty, send empty string
        payload.password = '';
    } // For edit mode, if password is empty, it's omitted (API usually doesn't update password if empty)

    payload.mobile_no = formData.mobile_no ?? '';
    // payload.contact_country_code = formData.contact_country_code ?? ''; // Add if needed
    payload.interested_category_ids = formData.interested_category_ids ?? '';
    payload.interested_subcategory_ids = formData.interested_subcategory_ids ?? '';
    payload.favourite_brands = formData.favourite_brands ?? '';
    payload.kyc_verified = getVal(formData.kyc_verified) ?? '';
    payload.permanent_id = formData.permanent_id ?? ''; // Postman has '1'
    payload.city = getVal(formData.city) ?? '';
    payload.state = getVal(formData.state) ?? '';
    payload.country_id = getVal(formData.country_id) ?? '';
    payload.continent_id = getVal(formData.continent_id) ?? '';
    payload.customer_ids = formData.customer_ids ?? '';
    payload.pincode = formData.pincode ?? '';
    payload.status = getVal(formData.status) ?? 'Active';
    payload.company_name = formData.company_name ?? '';
    payload.company_description = formData.company_description ?? '';
    payload.company_address = formData.company_address ?? ''; // Specific company address
    payload.whatsapp_no = formData.whatsapp_number ?? '';
    payload.office_no = formData.landline_number ?? '';
    payload.botim = formData.botim_id ?? '';
    payload.skype = formData.skype_id ?? '';
    payload.we_chat = formData.we_chat ?? '';
    payload.website = formData.website ?? '';
    payload.business_type = formData.business_type ?? '';
    payload.gst_number = formData.gst_number ?? '';
    payload.pan_number = formData.pan_number ?? '';
    payload.bank_account_no = formData.bank_account_no ?? '';
    payload.ifsc_code = formData.ifsc_code ?? '';
    payload.bank_name = formData.bank_name ?? '';
    payload.branch_name = formData.branch_name ?? '';
    payload.swift_code = formData.swift_code ?? '';
    payload.fssai_license = formData.fssai_license ?? '';
    payload.drug_license = formData.drug_license ?? '';
    payload.iec_code = formData.iec_code ?? '';
    payload.iso_certificate = formData.iso_certificate ?? '';
    payload.other_trading_license = formData.other_trading_license ?? '';
    payload.usfda_license = formData.usfda_license ?? '';
    payload.other_trading_license_2 = formData.other_trading_license_2 ?? '';
    payload.wall_enquiry_permission = toApiBooleanString(formData.wall_enquiry_permission);
    payload.enquiry_permission = toApiBooleanString(formData.enquiry_permission);
    payload.interested_for = formData.interested_for ?? '';
    payload.alt_email = formData.alternate_email ?? '';
    payload.alt_mobile = formData.alternate_contact_number ?? '';
    // payload.alternate_contact_country_code = formData.alternate_contact_country_code ?? ''; // Add if needed
    payload.customer_code_permanent = formData.customer_code_permanent ?? '';
    payload.product_upload_permission = toApiBooleanString(formData.product_upload_permission);
    payload.company_name_tmp = formData.company_name_temp ?? '';
    payload.address = formData.address ?? ''; // Member's primary address
    payload.fax_number = formData.fax_number ?? '';
    payload.linkedin_profile = formData.linkedin_profile ?? '';
    payload.facebook_profile = formData.facebook_profile ?? '';
    payload.instagram_profile = formData.instagram_handle ?? '';
    payload.favourite_products = formatMultiSelectToString(formData.favourite_product_ids);
    payload.business_opportunity = getVal(formData.business_opportunity) ?? '';
    payload.member_class = getVal(formData.member_class) ?? '';
    payload.member_grade = getVal(formData.member_grade) ?? '';
    payload.relationship_manager = getVal(formData.relationship_manager) ?? '';
    payload.remarks = formData.remarks ?? '';
    payload.trade_inquiry_allowed = getVal(formData.trade_inquiry_allowed) ?? '';
    payload.membership_plan = formData.membership_plan_text ?? '';
    payload.upgrade_your_plan = getVal(formData.upgrade_plan) ?? '';
    payload.request_feedback = formData.request_description ?? '';

    // Fields from Postman that are often empty or have defaults
    payload.email_verified = '';
    payload.email_verified_token = '';
    payload.gmi = '';
    payload.last_login_at = ''; // Usually set by backend
    payload.wall_enq_per_allowfor = '';
    payload.source = '';
    payload.remember_token = ''; // Usually set by backend
    payload.reset_count = '0';
    payload.reset_date = '';
    payload.timezone = '';
    payload.logout_at = ''; // Usually set by backend
    payload.updated_at = ''; // Usually set by backend
    payload.com_establish_date = '';
    payload.no_of_emp = '';
    payload.dealing_in_bulk = '';
    payload.declaration_194q = '';
    payload.domain_id = '';
    payload.kyc_link_token = '';
    payload.kyc_link_datetime = '';
    payload.enable_billing = '';
    payload.billing_file_1 = ''; // Assuming not handling files here
    payload.billing_file_2 = '';
    payload.billing_file_3 = '';
    payload.billing_file_4 = '';
    payload.enable_billing_status = '';
    payload.reject_reason = '';
    payload.enable_billing_created_by = '';
    payload.enable_billing_datetime = '';
    payload.spot_verified = '';
    payload.references = '';
    payload.kyc_remarks = '';
    payload.wall_link_token = '';
    payload.wall_link_datetime = '';
    if (!isEditMode) { // Only for create
        payload.created_by = '1'; // Example default, adjust as needed
    }
    payload.company_name_acl = '';
    payload.customer_type = '';

    if (isEditMode && formData.id) {
        payload.id = formData.id;
    } else if (!isEditMode) {
        delete payload.id; // Ensure no ID for new members
    }

    return payload;
};


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
    return (
        <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
            {memberNavigationList.map((nav) => (
                <button
                    type="button"
                    key={nav.link}
                    className={classNames(
                        "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max",
                        "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
                        {
                            'bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold': activeSection === nav.link,
                            'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200': activeSection !== nav.link,
                        }
                    )}
                    onClick={() => onNavigate(nav.link)}
                    title={nav.label}
                >
                    <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">{nav.label}</span>
                </button>
            ))}
        </div>
    );
};

// --- Section Components ---
const PersonalDetailsComponent = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const { CountriesData = [], ContinentsData = [] } = useSelector(masterSelector);
    // TODO: Replace with actual city/state options, possibly fetched or dynamic
    const cityOptions = [{ label: "New York", value: "New York" }, { label: "London", value: "London" }];
    const stateOptions = [{ label: "NY", value: "NY" }, { label: "CA", value: "CA" }];

    const countryOptions = CountriesData.map((country: any) => ({ value: String(country.id), label: country.name }));
    const continentOptions = ContinentsData.map((continent: any) => ({ value: String(continent.id), label: continent.name }));
    const statusOptions = [{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }, { label: "Pending", value: "Pending" }];

    return (
        <Card id="personalDetails">
            <h4 className="mb-6">Personal Details</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem label="Full Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
                    <Controller name="name" control={control} render={({ field }) => <Input placeholder="Member’s full name" {...field} />} />
                </FormItem>
                <FormItem label="Mobile Number" invalid={!!errors.mobile_no || !!errors.contact_country_code} errorMessage={errors.mobile_no?.message || errors.contact_country_code?.message}>
                    <div className="flex items-center gap-2">
                        <Controller name="contact_country_code" control={control} render={({ field }) => <Input placeholder="+1" className="w-20" {...field} />} />
                        <Controller name="mobile_no" control={control} render={({ field }) => <Input placeholder="Primary contact number" {...field} />} />
                    </div>
                </FormItem>
                <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}>
                    <Controller name="email" control={control} render={({ field }) => <Input type="email" placeholder="Primary email address" {...field} />} />
                </FormItem>
                <FormItem label="Password (leave blank to keep current)" invalid={!!errors.password} errorMessage={errors.password?.message} className="md:col-span-3">
                    <Controller name="password" control={control} render={({ field }) => <Input type="password" placeholder="Enter new password" {...field} />} />
                </FormItem>
                <FormItem label="Company Name (Temp)" invalid={!!errors.company_name_temp} errorMessage={errors.company_name_temp?.message} className="md:col-span-3">
                    <Controller name="company_name_temp" control={control} render={({ field }) => <Input placeholder="Temporary or display company name" {...field} />} />
                </FormItem>
                <FormItem label="Company Name (Actual)" invalid={!!errors.company_name} errorMessage={errors.company_name?.message} className="md:col-span-3">
                    <Controller name="company_name" control={control} render={({ field }) => <Input placeholder="Official company name for submission" {...field} />} />
                </FormItem>
                <FormItem label="Address" invalid={!!errors.address} errorMessage={errors.address?.message} className="md:col-span-3">
                    <Controller name="address" control={control} render={({ field }) => <Input textArea placeholder="Full Address" {...field} />} />
                </FormItem>
                <FormItem label="Status" invalid={!!errors.status} errorMessage={errors.status?.message as string}>
                    <Controller name="status" control={control} render={({ field }) => <Select placeholder="Please Select" options={statusOptions} {...field} />} />
                </FormItem>
                <FormItem label="City" invalid={!!errors.city} errorMessage={errors.city?.message as string}>
                    <Controller name="city" control={control} render={({ field }) => <Select placeholder="Select City" options={cityOptions} {...field} isClearable />} />
                </FormItem>
                <FormItem label="State" invalid={!!errors.state} errorMessage={errors.state?.message as string}>
                    <Controller name="state" control={control} render={({ field }) => <Select placeholder="Select State" options={stateOptions} {...field} isClearable />} />
                </FormItem>
                <FormItem label="Country" invalid={!!errors.country_id} errorMessage={errors.country_id?.message as string}>
                    <Controller name="country_id" control={control} render={({ field }) => <Select placeholder="Select Country" options={countryOptions} {...field} isClearable />} />
                </FormItem>
                <FormItem label="Continent" invalid={!!errors.continent_id} errorMessage={errors.continent_id?.message as string}>
                    <Controller name="continent_id" control={control} render={({ field }) => <Select placeholder="Select Continent" options={continentOptions} {...field} isClearable />} />
                </FormItem>
                <FormItem label="Pincode" invalid={!!errors.pincode} errorMessage={errors.pincode?.message}>
                    <Controller name="pincode" control={control} render={({ field }) => <Input placeholder="Enter pincode" {...field} />} />
                </FormItem>
            </div>
        </Card>
    );
};

const ContactDetailsComponent = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    return (
        <Card id="socialContactInformation">
            <h4 className="mb-6">Social & Contact Information</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem label="WhatsApp No." invalid={!!errors.whatsapp_number} errorMessage={errors.whatsapp_number?.message}>
                    <Controller name="whatsapp_number" control={control} render={({ field }) => <Input placeholder="Enter WhatsApp number" {...field} />} />
                </FormItem>
                <FormItem label="Alternate Contact Number" invalid={!!errors.alternate_contact_number || !!errors.alternate_contact_country_code} errorMessage={errors.alternate_contact_number?.message || errors.alternate_contact_country_code?.message}>
                    <div className="flex items-center gap-2">
                        <Controller name="alternate_contact_country_code" control={control} render={({ field }) => <Input placeholder="+1" className="w-20" {...field} />} />
                        <Controller name="alternate_contact_number" control={control} render={({ field }) => <Input placeholder="Alternate contact" {...field} />} />
                    </div>
                </FormItem>
                <FormItem label="Landline Number" invalid={!!errors.landline_number} errorMessage={errors.landline_number?.message}>
                    <Controller name="landline_number" control={control} render={({ field }) => <Input type="tel" placeholder="Landline" {...field} />} />
                </FormItem>
                <FormItem label="Fax Number" invalid={!!errors.fax_number} errorMessage={errors.fax_number?.message}>
                    <Controller name="fax_number" control={control} render={({ field }) => <Input type="tel" placeholder="Fax" {...field} />} />
                </FormItem>
                <FormItem label="Alternate Email" invalid={!!errors.alternate_email} errorMessage={errors.alternate_email?.message}>
                    <Controller name="alternate_email" control={control} render={({ field }) => <Input type="email" placeholder="Alternate email" {...field} />} />
                </FormItem>
                <FormItem label="Botim ID" invalid={!!errors.botim_id} errorMessage={errors.botim_id?.message}>
                    <Controller name="botim_id" control={control} render={({ field }) => <Input {...field} placeholder="Botim ID" />} />
                </FormItem>
                <FormItem label="Skype ID" invalid={!!errors.skype_id} errorMessage={errors.skype_id?.message}>
                    <Controller name="skype_id" control={control} render={({ field }) => <Input {...field} placeholder="Skype ID" />} />
                </FormItem>
                <FormItem label="WeChat ID" invalid={!!errors.we_chat} errorMessage={errors.we_chat?.message}>
                    <Controller name="we_chat" control={control} render={({ field }) => <Input {...field} placeholder="WeChat ID" />} />
                </FormItem>
                <FormItem label="LinkedIn Profile" invalid={!!errors.linkedin_profile} errorMessage={errors.linkedin_profile?.message}>
                    <Controller name="linkedin_profile" control={control} render={({ field }) => <Input {...field} placeholder="LinkedIn URL" />} />
                </FormItem>
                <FormItem label="Facebook Profile" invalid={!!errors.facebook_profile} errorMessage={errors.facebook_profile?.message}>
                    <Controller name="facebook_profile" control={control} render={({ field }) => <Input {...field} placeholder="Facebook URL" />} />
                </FormItem>
                <FormItem label="Instagram Handle" invalid={!!errors.instagram_handle} errorMessage={errors.instagram_handle?.message}>
                    <Controller name="instagram_handle" control={control} render={({ field }) => <Input {...field} placeholder="@instagram" />} />
                </FormItem>
                 <FormItem label="Website" invalid={!!errors.website} errorMessage={errors.website?.message}>
                    <Controller name="website" control={control} render={({ field }) => <Input type="url" placeholder="https://example.com" {...field} />} />
                </FormItem>
            </div>
        </Card>
    );
};

const MemberAccessibilityComponent = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const yesNoOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
    return (
        <Card id="memberAccessibility">
            <h4 className="mb-6">Member Accessibility</h4>
            <div className="grid md:grid-cols-3 gap-4 items-start">
                <FormItem label="Product Upload Permission" invalid={!!errors.product_upload_permission} errorMessage={errors.product_upload_permission?.message as string}>
                    <Controller
                        name="product_upload_permission"
                        control={control}
                        render={({ field }) => (
                            <Checkbox checked={!!field.value} onChange={(checked) => field.onChange(checked)}>
                                Enabled
                            </Checkbox>
                        )}
                    />
                </FormItem>
                <FormItem label="Wall Enquiry Permission" invalid={!!errors.wall_enquiry_permission} errorMessage={errors.wall_enquiry_permission?.message as string}>
                    <Controller
                        name="wall_enquiry_permission"
                        control={control}
                        render={({ field }) => (
                             <Checkbox checked={!!field.value} onChange={(checked) => field.onChange(checked)}>
                                Enabled
                            </Checkbox>
                        )}
                    />
                </FormItem>
                <FormItem label="Enquiry Permission" invalid={!!errors.enquiry_permission} errorMessage={errors.enquiry_permission?.message as string}>
                     <Controller
                        name="enquiry_permission"
                        control={control}
                        render={({ field }) => (
                             <Checkbox checked={!!field.value} onChange={(checked) => field.onChange(checked)}>
                                Enabled
                            </Checkbox>
                        )}
                    />
                </FormItem>
                <FormItem label="Trade Inquiry Allowed" invalid={!!errors.trade_inquiry_allowed} errorMessage={errors.trade_inquiry_allowed?.message as string}>
                    <Controller name="trade_inquiry_allowed" control={control}
                        render={({ field }) => <Select {...field} placeholder="Select" options={yesNoOptions} isClearable />} />
                </FormItem>
            </div>
        </Card>
    );
};

const MembershipPlanComponent = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const planOptions = [{ value: "Basic", label: "Basic" }, { value: "Premium", label: "Premium" }, { value: "Enterprise", label: "Enterprise" }];
    return (
        <Card id="membershipPlanDetails">
            <h4 className="mb-6">Membership Plan Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem label="Membership Plan (Current)" invalid={!!errors.membership_plan_text} errorMessage={errors.membership_plan_text?.message}>
                    <Controller name="membership_plan_text" control={control} render={({ field }) => <Input placeholder="e.g., Premium Plan" {...field} />} />
                </FormItem>
                <FormItem label="Upgrade Your Plan" invalid={!!errors.upgrade_plan} errorMessage={errors.upgrade_plan?.message as string}>
                    <Controller name="upgrade_plan" control={control} render={({ field }) => <Select placeholder="Select New Plan" options={planOptions} {...field} isClearable />} />
                </FormItem>
            </div>
        </Card>
    );
};

const RequestAndFeedbacksComponent = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    return (
        <Card id="requestAndFeedbacks">
            <h4 className="mb-6">Request & Feedback</h4>
            <div>
                <FormItem label="Add Feedback / Requests" invalid={!!errors.request_description} errorMessage={errors.request_description?.message}>
                    <Controller name="request_description" control={control} render={({ field }) => <Input textArea rows={4} placeholder="Describe your request or feedback in detail..." {...field} />} />
                </FormItem>
            </div>
        </Card>
    );
};

const MemberProfileComponent = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    // TODO: Replace with actual options, possibly fetched
    const productOptions = [{ value: "1", label: "Product A (ID:1)" }, { value: "2", label: "Product B (ID:2)" }];
    const opportunityOptions = [{ value: "Export", label: "Export" }, { value: "Import", label: "Import" }, { value: "Partnership", label: "Partnership" }];
    const classOptions = [{ value: "Gold", label: "Gold" }, { value: "Silver", label: "Silver" }, { value: "Bronze", label: "Bronze" }];
    const gradeOptions = [{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }];
    const managerOptions = [{ value: "Manager1", label: "Manager 1" }, { value: "Manager2", label: "Manager 2" }];

    return (
        <Card id="memberProfile">
            <h4 className="mb-6">Additional Member Profile</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem label="Favourite Product(s)" invalid={!!errors.favourite_product_ids} errorMessage={errors.favourite_product_ids?.message as string}>
                    <Controller
                        name="favourite_product_ids"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                isMulti
                                placeholder="Select favourite products"
                                options={productOptions}
                                isClearable
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Business Opportunity" invalid={!!errors.business_opportunity} errorMessage={errors.business_opportunity?.message as string}>
                    <Controller name="business_opportunity" control={control} render={({ field }) => <Select {...field} placeholder="Select opportunity" options={opportunityOptions} isClearable />} />
                </FormItem>
                <FormItem label="Member Class" invalid={!!errors.member_class} errorMessage={errors.member_class?.message as string}>
                    <Controller name="member_class" control={control} render={({ field }) => <Select {...field} placeholder="Select class" options={classOptions} isClearable />} />
                </FormItem>
                <FormItem label="Member Grade" invalid={!!errors.member_grade} errorMessage={errors.member_grade?.message as string}>
                    <Controller name="member_grade" control={control} render={({ field }) => <Select {...field} placeholder="Select grade" options={gradeOptions} isClearable />} />
                </FormItem>
                <FormItem label="Relationship Manager" invalid={!!errors.relationship_manager} errorMessage={errors.relationship_manager?.message as string}>
                    <Controller name="relationship_manager" control={control} render={({ field }) => <Select {...field} placeholder="Select RM" options={managerOptions} isClearable />} />
                </FormItem>
                <FormItem label="Remarks" className="md:col-span-3" invalid={!!errors.remarks} errorMessage={errors.remarks?.message}>
                    <Controller name="remarks" control={control} render={({ field }) => <Input textArea {...field} placeholder="Enter internal remarks" />} />
                </FormItem>
            </div>
        </Card>
    );
};

// --- MemberFormComponent ---
type MemberFormComponentProps = {
    onFormSubmit: (values: MemberFormSchema, formMethods: UseFormReturn<MemberFormSchema>) => void;
    defaultValues: Partial<MemberFormSchema>; // Changed from optional to required for clarity
    isEditMode?: boolean;
    onDiscard?: () => void;
    isSubmitting?: boolean;
};

const MemberFormComponent = (props: MemberFormComponentProps) => {
    const { onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting } = props;
    const [activeSection, setActiveSection] = useState<string>(memberNavigationList[0].link);

    // Define your Zod schema here based on actual API requirements
    const memberSchema = z.object({
        name: z.string().trim().min(1, { message: "Name is Required!" }),
        email: z.string().trim().min(1, { message: "Email is Required!" }).email("Invalid email format"),
        password: z.string().optional().refine(val => !val || val.length >= 6, {
            message: "Password must be at least 6 characters if provided",
        }),
        mobile_no: z.string().trim().min(1, "Mobile number is required"),
        company_name: z.string().trim().min(1, "Company Name (Actual) is required"),
        address: z.string().trim().min(1, "Address is required"),
        // Add more validations as needed for other fields
        // Example:
        // status: z.object({ value: z.string().min(1), label: z.string() }, { required_error: "Status is required"}),
    }).passthrough(); // Use passthrough if you have fields not strictly validated but part of the form

    const formMethods = useForm<MemberFormSchema>({
        defaultValues, // Default values are now directly passed
        resolver: zodResolver(memberSchema),
    });
    const { handleSubmit, reset, formState: { errors }, control } = formMethods;

    useEffect(() => {
        // Reset form when defaultValues change (e.g., after fetching data for edit mode)
        // Ensure defaultValues is not null/undefined before resetting
        if (defaultValues) {
            reset(defaultValues);
        }
    }, [defaultValues, reset]);


    const internalFormSubmit = (values: MemberFormSchema) => {
        onFormSubmit?.(values, formMethods);
    };

    const navigationKeys = memberNavigationList.map(item => item.link);
    const handleNext = () => {
        const currentIndex = navigationKeys.indexOf(activeSection);
        if (currentIndex < navigationKeys.length - 1) setActiveSection(navigationKeys[currentIndex + 1]);
    };
    const handlePrevious = () => {
        const currentIndex = navigationKeys.indexOf(activeSection);
        if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]);
    };

    const renderActiveSection = () => {
        const sectionProps = { errors, control, formMethods };
        switch (activeSection) {
            case "personalDetails": return <PersonalDetailsComponent {...sectionProps} />;
            case "socialContactInformation": return <ContactDetailsComponent {...sectionProps} />;
            case "memberAccessibility": return <MemberAccessibilityComponent {...sectionProps} />;
            case "membershipPlanDetails": return <MembershipPlanComponent {...sectionProps} />;
            case "requestAndFeedbacks": return <RequestAndFeedbacksComponent {...sectionProps} />;
            case "memberProfile": return <MemberProfileComponent {...sectionProps} />;
            default: return <PersonalDetailsComponent {...sectionProps} />;
        }
    };

    return (
        <>
            <div className="flex gap-1 items-end mb-3">
                <NavLink to="/business-entities/member"> {/* Update this path to your members list */}
                    <h6 className="font-semibold hover:text-primary-600">Member</h6>
                </NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary">
                    {isEditMode ? "Edit Member" : "Add New Member"}
                </h6>
            </div>
            <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
                <NavigatorComponent activeSection={activeSection} onNavigate={setActiveSection} />
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
                        <Button type="button" onClick={handleNext} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === navigationKeys.length - 1}>Next</Button>
                        {/* <Button type="button" onClick={() => console.log("Draft clicked")} disabled={isSubmitting}>Draft</Button> */}
                        <Button variant="solid" type="button" loading={isSubmitting} onClick={handleSubmit(internalFormSubmit)} disabled={isSubmitting}>
                            {isEditMode ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
};


// --- MemberCreate Page (Combined Add/Edit Page) ---
const MemberCreate = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id } = useParams<{ id?: string }>();

    const isEditMode = Boolean(id);

    const [initialData, setInitialData] = useState<Partial<MemberFormSchema> | null>(null);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getEmptyFormValues = (): Partial<MemberFormSchema> => ({
        role_type: { label: 'Member', value: '0' }, // Default role
        name: '',
        email: '',
        password: '',
        contact_country_code: '+1', // Default country code
        mobile_no: '',
        interested_category_ids: '',
        interested_subcategory_ids: '',
        favourite_brands: '',
        kyc_verified: undefined,
        permanent_id: '',
        city: undefined,
        state: undefined,
        country_id: undefined,
        continent_id: undefined,
        customer_ids: '',
        pincode: '',
        status: { label: 'Active', value: 'Active' }, // Default status
        company_name: '',
        company_name_temp: '',
        address: '',
        company_description: '',
        company_address: '',
        whatsapp_number: '',
        alternate_contact_country_code: '',
        alternate_contact_number: '',
        landline_number: '',
        fax_number: '',
        alternate_email: '',
        botim_id: '',
        skype_id: '',
        we_chat: '',
        website: '',
        business_type: '',
        gst_number: '',
        pan_number: '',
        bank_account_no: '',
        ifsc_code: '',
        bank_name: '',
        branch_name: '',
        swift_code: '',
        fssai_license: '',
        drug_license: '',
        iec_code: '',
        iso_certificate: '',
        other_trading_license: '',
        usfda_license: '',
        other_trading_license_2: '',
        wall_enquiry_permission: false,
        enquiry_permission: false,
        interested_for: '',
        customer_code_permanent: '',
        product_upload_permission: false,
        trade_inquiry_allowed: undefined,
        membership_plan_text: '',
        upgrade_plan: undefined,
        request_description: '',
        favourite_product_ids: [],
        business_opportunity: undefined,
        member_class: undefined,
        member_grade: undefined,
        relationship_manager: undefined,
        remarks: '',
        linkedin_profile: '',
        facebook_profile: '',
        instagram_handle: '',
    });

    useEffect(() => {
        dispatch(getCountriesAction());
        dispatch(getContinentsAction());
    }, [dispatch]);

    useEffect(() => {
        const emptyForm = getEmptyFormValues();
        if (isEditMode && id) {
            const fetchMemberData = async () => {
                setPageLoading(true);
                try {
                    const response =  await dispatch(getMemberByIdAction(id)).unwrap();
                    if (response) {
                        const apiMemberData: ApiSingleCustomerItem = response;
                        const transformed = transformApiToFormSchema(apiMemberData);
                        setInitialData({ ...emptyForm, ...transformed });
                    } else {
                        toast.push(<Notification type="danger" title="Fetch Error">{response?.message || 'Failed to load member data.'}</Notification>);
                        navigate('/business-entities/member'); // Your members list route
                    }
                } catch (error: any) {
                    const errorMessage = error?.response?.data?.message || error?.message || 'Error fetching member details.';
                    toast.push(<Notification type="danger" title="Fetch Error">{errorMessage}</Notification>);
                    navigate('/business-entities/member');
                } finally {
                    setPageLoading(false);
                }
            };
            fetchMemberData();
        } else {
            setInitialData(emptyForm);
            setPageLoading(false);
        }
    }, [id, isEditMode, navigate, dispatch]);

    const handleFormSubmit = async (formValues: MemberFormSchema, formMethods: UseFormReturn<MemberFormSchema>) => {
        setIsSubmitting(true);
        const payload = preparePayloadForApi(formValues as Partial<MemberFormSchema>, isEditMode);
        
        try {
            if (isEditMode && id) {
                await dispatch(editMemberAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Member Updated">Details updated successfully.</Notification>);
            } else {
                await dispatch(addMemberAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Member Created">New member created successfully.</Notification>);
            }
            navigate('/business-entities/member'); // Your members list route
        } catch (error: any) {
            const errorMessage = error?.message || `Failed to ${isEditMode ? 'update' : 'create'} member.`;
            if (error?.errors && typeof error.errors === 'object') { // Check if backend sends structured validation errors
                Object.entries(error.errors).forEach(([key, value]) => {
                    formMethods.setError(key as keyof MemberFormSchema, {
                        type: 'server',
                        message: Array.isArray(value) ? value.join(', ') : String(value),
                    });
                });
                toast.push(<Notification type="danger" title="Validation Error">Please check the form fields.</Notification>);
            } else {
                toast.push(<Notification type="danger" title={`${isEditMode ? 'Update' : 'Creation'} Failed`}>{errorMessage}</Notification>);
            }
            console.error("Submit Member Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDiscardDialog = () => setDiscardConfirmationOpen(true);
    const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
    const handleConfirmDiscard = () => {
        closeDiscardDialog();
        navigate('/business-entities/member'); // Your members list route
    };

    if (pageLoading) {
        return <Container className="h-full flex justify-center items-center"><p>Loading member details...</p></Container>;
    }
    if (!initialData) {
        return <Container className="h-full flex justify-center items-center"><p>Initializing form or data could not be loaded.</p></Container>;
    }

    return (
        <Container className="h-full">
            <Form onSubmit={(e) => e.preventDefault()} className="flex flex-col min-h-screen"> {/* Prevent default HTML form submission */}
                <div className="flex-grow">
                    <MemberFormComponent
                        onFormSubmit={handleFormSubmit}
                        defaultValues={initialData}
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

export default MemberCreate;