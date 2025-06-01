
// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import React, { useEffect, useState, ReactNode } from 'react';
import { useForm, Controller, Control, FieldErrors, UseFormReturn, useFieldArray } from 'react-hook-form'; // Keep useFieldArray for sections that already imply arrays
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

// UI Components (Assuming these are correct)
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
import NumericInput from '@/components/shared/NumericInput';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbTrash, TbPlus } from 'react-icons/tb';
import { addcompanyAction, editcompanyAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';

// --- Type Definitions ---

// For array items, using original frontend naming where possible, then mapping in payload
interface MemberItem { // From original members array
    member?: string | { label: string; value: string }; // Maps to company_members[member_id]
    designation?: string | { label: string; value: string }; // Maps to company_members[designation]
    person_name?: string; // Maps to company_members[name]
    contact_number?: string; // Maps to company_members[mobile]
}

// For backend's company_spot_verification (not in original UI, adding for completeness)
interface CompanySpotVerificationItemFE {
    spot_verification_status?: string | { label: string; value: string };
    verified_by?: string | { label: string; value: string };
    photo_upload?: File | string;
    reference_person_name?: string;
    reference_company_name?: string;
    reference_contact_number?: string;
    remarks?: string;
}

// For backend's company_bank_details (for the "Add More" bank details)
interface CompanyBankDetailItemFE {
    bank_account_number?: string;
    bank_name?: string | { label: string; value: string };
    ifsc_code?: string;
    // In backend, this photo is primary_bank_verification_photo, same as top-level CompanyProfileSetting
    // For array items, backend expects: company_bank_details.$i.primary_bank_verification_photo
    bank_verification_photo?: File | string; 
    type?: string | { label: string; value: string }; // e.g., 'Primary', 'Secondary', 'Other'
}


export interface CompanyFormSchema {
    id?: string | number; // For edit mode

    // --- CompanyDetails Section (Original Fields) ---
    name?: string;
    company_primary_contact_number?: string;
    primary_contact_country_code?: string; // UI only, combine or handle separately if needed for backend
    alternate_contact_number?: string;
    alternate_contact_country_code?: string; // UI only
    company_primary_email_id?: string;
    alternate_email_id?: string;
    ownership_type?: string | { label: string; value: string };
    owner_director_proprietor_name?: string;
    company_address?: string; // Will map to `address` for CompanyProfileSetting
    city?: string | { label: string; value: string };
    state?: string | { label: string; value: string };
    zip_postal_code?: string;
    country?: string | { label: string; value: string };
    continent_name?: string | { label: string; value: string };
    gst_number?: string; // Will map to `gst` for CompanyProfileSetting
    pan_number?: string;
    trn_number?: string;
    tan_number?: string;
    company_establishment_year?: string;
    no_of_employees?: number | string;
    company_website?: string;
    company_logo_brochure?: File | string; // Will map to `logo` file for CompanyProfileSetting
    primary_business_type?: string | { label: string; value: string };
    primary_business_category?: string | { label: string; value: string };
    
    // Certificate fields (singular in original UI, will be wrapped into company_certificate[0] for backend)
    certificate_name?: string;
    upload_certificate?: File | string;

    // Office Information fields (singular in original UI, will be wrapped into company_branches[0] for backend)
    head_office?: string | { label: string; value: string }; // This was 'Office Type' in UI. Maps to company_branches[office_type] or company_branches[head_office]
    branches?: string; // This was 'Office Name' in UI. Maps to company_branches[branch_name] (custom, or needs mapping)
    branch_address?: string; // Maps to company_branches[branch_address]
    location_country?: string | { label: string; value: string }; // Maps to company_branches[location_country]
    branch_state?: string | { label: string; value: string }; // Maps to company_branches[branch_state]
    branch_zip_code?: string; // Maps to company_branches[branch_zip_code]
    branch_gst_reg_number?: string; // Maps to company_branches[branch_gst_reg_number]

    // --- KYCDetailSection (Original Fields) ---
    declaration_206ab?: File | string; // Maps to declaration_206AB (file)
    declaration_206ab_remark?: string; // UI only for remarks
    declaration_206ab_remark_enabled?: boolean; // Maps to declaration_206AB_verify
    declaration_194q?: File | string; // Maps to declaration_194Q (file)
    declaration_194q_remark?: string; // UI only
    declaration_194q_remark_enabled?: boolean; // Maps to declaration_194Q_verify
    office_photo?: File | string;
    office_photo_remark?: string; // UI only
    office_photo_remark_enabled?: boolean; // Maps to office_photo_verify
    gst_certificate?: File | string;
    gst_certificate_remark?: string; // UI only
    gst_certificate_remark_enabled?: boolean; // Maps to gst_certificate_verify
    authority_letter?: File | string;
    authority_letter_remark?: string; // UI only
    authority_letter_remark_enabled?: boolean; // Maps to authority_letter_verify
    visiting_card?: File | string;
    visiting_card_remark?: string; // UI only
    visiting_card_remark_enabled?: boolean; // Maps to visiting_card_verify
    cancel_cheque?: File | string;
    cancel_cheque_remark?: string; // UI only
    cancel_cheque_remark_enabled?: boolean; // Maps to cancel_cheque_verify
    aadhar_card?: File | string;
    aadhar_card_remark?: string; // UI only
    aadhar_card_remark_enabled?: boolean; // Maps to aadhar_card_verify
    pan_card?: File | string;
    pan_card_remark?: string; // UI only
    pan_card_remark_enabled?: boolean; // Maps to pan_card_verify
    other_document?: File | string;
    other_document_remark?: string; // UI only
    other_document_remark_enabled?: boolean; // Maps to other_document_verify

    // --- BankDetailsSection (Original Fields for Primary/Secondary, plus array for additional) ---
    primary_account_number?: string; // Maps to primary_bank_account_number
    primary_bank_name?: string | { label: string; value: string }; // Maps to primary_bank_name
    primary_ifsc_code?: string; // Maps to primary_ifsc_code
    primary_bank_verification_photo?: File | string; // Maps to primary_bank_verification_photo (file)
    secondary_account_number?: string; // Maps to secondary_bank_account_number
    secondary_bank_name?: string | { label: string; value: string }; // Maps to secondary_bank_name
    secondary_ifsc_code?: string; // Maps to secondary_ifsc_code
    secondary_bank_verification_photo?: File | string; // Maps to secondary_bank_verification_photo (file)
    
    // For "Add More" bank details, mapping to company_bank_details backend array
    additional_bank_details?: CompanyBankDetailItemFE[];


    // --- AccessibilitySection (Original Fields) ---
    KYC_FIELD?: boolean; // Maps to kyc_verification
    BILLING_FIELD?: boolean; // Maps to billing_enabled
    BILLING_PHOTOS_FIELD?: FileList | File | null; // Maps to billing_photos (file/s)
    DOMAIN_MANAGEMENT_FIELD?: string | { label: string; value: string }; // Maps to domain_id

    // --- MemberManagementSection (Original Array) ---
    members?: MemberItem[]; // Maps to company_members backend array

    // --- Fields from Laravel $input not explicitly in original UI sections, but needed for backend ---
    // These are for CompanyProfileSetting model primarily
    status?: string | { label: string, value: string }; // Overall company status
    company_code?: string;
    brands?: string;
    category?: string; // General category for company
    interested_in?: string;
    total_members?: number | string; // Numeric
    member_participation?: number | string; // Numeric or percentage
    success_score?: number | string; // Numeric
    trust_score?: number | string; // Numeric
    health_score?: number | string; // Numeric
    support_email?: string;
    mobile?: string; // A general mobile for the company, if different from contacts
    // `logo` is covered by company_logo_brochure mapping
    // `gst` is covered by gst_number mapping
    expiry_date?: string; // Date
    company_type?: string | { label: string; value: string };
    // `company_logo_brochure` text field from $input is not covered if different from the file upload. Assuming file upload is primary.
    
    // SMTP fields
    smtp_host?: string;
    smtp_port?: string;
    smtp_secure?: string | { label: string; value: string };
    smtp_username?: string;
    smtp_password?: string;
    smtp_name?: string; // Sender name for SMTP
    smtp_email?: string; // Sender email for SMTP

    // Social Media
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;

    logo_for_meta?: File | string; // Specific file upload for meta logo
    notification_email?: string;

    // --- Data for backend's specific array structures (if not covered by existing UI elements directly) ---
    // This is for backend's company_spot_verification array.
    // If you don't have UI for this, it will be an empty array or not sent.
    company_spot_verification_data?: CompanySpotVerificationItemFE[];
}


export interface FormSectionBaseProps {
    control: Control<CompanyFormSchema>;
    errors: FieldErrors<CompanyFormSchema>;
    formMethods: UseFormReturn<CompanyFormSchema>; // Added to pass to sections if they use useFieldArray
}

// --- API Company Item Type (Simplified, adapt to your actual GET response) ---
interface ApiSingleCompanyItem {
    id: number;
    name?: string;
    // CompanyProfileSetting fields (backend names)
    company_profile_settings_id?:any,
    status?: string;
    company_code?: string;
    company_primary_contact_number?: string;
    alternate_contact_number?: string;
    company_primary_email_id?: string;
    alternate_email_id?: string;
    ownership_type?: string;
    owner_director_proprietor_name?: string;
    address?: string; // Note: backend uses 'address'
    city?: string;
    state?: string;
    zip_postal_code?: string;
    country?: string;
    continent_name?: string;
    brands?: string;
    category?: string;
    interested_in?: string;
    total_members?: number;
    member_participation?: number;
    success_score?: number;
    trust_score?: number;
    health_score?: number;
    kyc_verification?: boolean; // Or "Yes"/"No"
    billing_enabled?: boolean; // Or "Yes"/"No"
    billing_photos_url?: string; // Assuming URL for existing
    domain_id?: string;
    primary_bank_account_number?: string;
    primary_bank_name?: string;
    primary_ifsc_code?: string;
    primary_bank_verification_photo_url?: string;
    secondary_bank_account_number?: string;
    secondary_bank_name?: string;
    secondary_ifsc_code?: string;
    secondary_bank_verification_photo_url?: string;
    support_email?: string;
    mobile?: string;
    logo_url?: string; // For 'company_logo_brochure'
    gst?: string; // Note: backend uses 'gst'
    pan_number?: string;
    tan_number?: string;
    expiry_date?: string;
    company_type?: string;
    trn_number?: string;
    company_establishment_year?: string;
    no_of_employees?: number;
    company_website?: string;
    // company_logo_brochure: string; // If this is a separate text field in backend API response
    primary_business_type?: string;
    primary_business_category?: string;
    smtp_host?: string; smtp_port?: string; smtp_secure?: string; smtp_username?: string; smtp_name?: string; smtp_email?: string;
    facebook?: string; instagram?: string; linkedin?: string; youtube?: string; twitter?: string;
    logo_for_meta_url?: string;
    notification_email?: string;

    // KYC Docs (backend names for files are uppercase, verify flags too)
    declaration_206AB_url?: string; declaration_206AB_verify?: boolean;
    declaration_194Q_url?: string; declaration_194Q_verify?: boolean;
    office_photo_url?: string; office_photo_verify?: boolean;
    gst_certificate_url?: string; gst_certificate_verify?: boolean;
    authority_letter_url?: string; authority_letter_verify?: boolean;
    visiting_card_url?: string; visiting_card_verify?: boolean;
    cancel_cheque_url?: string; cancel_cheque_verify?: boolean;
    aadhar_card_url?: string; aadhar_card_verify?: boolean;
    pan_card_url?: string; pan_card_verify?: boolean;
    other_document_url?: string; other_document_verify?: boolean;
    
    // Related model arrays (backend names)
    company_spot_verification?: CompanySpotVerificationItemFE[]; // Assuming API sends them structured
    company_members?: MemberItem[]; // Assuming API sends MemberItem like structure
    company_bank_details?: CompanyBankDetailItemFE[]; // For additional banks
    company_branches?: any[]; // Define structure if API returns this
    company_certificate?: any[]; // Define structure if API returns this
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (apiData: ApiSingleCompanyItem): Partial<CompanyFormSchema> => {
    return {
        id: apiData.id,
        company_profile_settings_id: apiData.company_profile_settings_id,
        // Map backend names to frontend schema names
        name: apiData.name,
        company_primary_contact_number: apiData.company_primary_contact_number,
        // primary_contact_country_code: undefined, // If you parse from main number or have separate API field
        alternate_contact_number: apiData.alternate_contact_number,
        // alternate_contact_country_code: undefined,
        company_primary_email_id: apiData.company_primary_email_id,
        alternate_email_id: apiData.alternate_email_id,
        ownership_type: apiData.ownership_type ? { label: apiData.ownership_type, value: apiData.ownership_type } : undefined,
        owner_director_proprietor_name: apiData.owner_director_proprietor_name,
        company_address: apiData.address, // map 'address' to 'company_address'
        city: apiData.city ? { label: apiData.city, value: apiData.city } : undefined,
        state: apiData.state ? { label: apiData.state, value: apiData.state } : undefined,
        zip_postal_code: apiData.zip_postal_code,
        country: apiData.country ? { label: apiData.country, value: apiData.country } : undefined,
        continent_name: apiData.continent_name ? { label: apiData.continent_name, value: apiData.continent_name } : undefined,
        gst_number: apiData.gst, // map 'gst' to 'gst_number'
        pan_number: apiData.pan_number,
        trn_number: apiData.trn_number,
        tan_number: apiData.tan_number,
        company_establishment_year: apiData.company_establishment_year,
        no_of_employees: apiData.no_of_employees,
        company_website: apiData.company_website,
        company_logo_brochure: apiData.logo_url, // map 'logo_url' to 'company_logo_brochure'
        primary_business_type: apiData.primary_business_type ? { label: apiData.primary_business_type, value: apiData.primary_business_type } : undefined,
        primary_business_category: apiData.primary_business_category ? { label: apiData.primary_business_category, value: apiData.primary_business_category } : undefined,

        // Assuming single certificate/branch from API maps to the singular UI fields
        // This needs careful handling if API sends arrays for these
        certificate_name: apiData.company_certificate?.[0]?.certificate_name,
        upload_certificate: apiData.company_certificate?.[0]?.upload_certificate, // Assuming URL

        head_office: apiData.company_branches?.[0]?.office_type ? { label: apiData.company_branches?.[0]?.office_type, value: apiData.company_branches?.[0]?.office_type } : undefined, // Example mapping
        branches: apiData.company_branches?.[0]?.branch_name, // Example
        branch_address: apiData.company_branches?.[0]?.branch_address,
        location_country: apiData.company_branches?.[0]?.location_country ? { label: apiData.company_branches?.[0]?.location_country, value: apiData.company_branches?.[0]?.location_country} : undefined,
        branch_state: apiData.company_branches?.[0]?.branch_state ? {label: apiData.company_branches?.[0]?.branch_state, value: apiData.company_branches?.[0]?.branch_state} : undefined,
        branch_zip_code: apiData.company_branches?.[0]?.branch_zip_code,
        branch_gst_reg_number: apiData.company_branches?.[0]?.branch_gst_reg_number,

        // KYC Docs
        declaration_206ab: apiData.declaration_206AB_url,
        declaration_206ab_remark_enabled: apiData.declaration_206AB_verify,
        declaration_194q: apiData.declaration_194Q_url,
        declaration_194q_remark_enabled: apiData.declaration_194Q_verify,
        office_photo: apiData.office_photo_url,
        office_photo_remark_enabled: apiData.office_photo_verify,
        gst_certificate: apiData.gst_certificate_url,
        gst_certificate_remark_enabled: apiData.gst_certificate_verify,
        authority_letter: apiData.authority_letter_url,
        authority_letter_remark_enabled: apiData.authority_letter_verify,
        visiting_card: apiData.visiting_card_url,
        visiting_card_remark_enabled: apiData.visiting_card_verify,
        cancel_cheque: apiData.cancel_cheque_url,
        cancel_cheque_remark_enabled: apiData.cancel_cheque_verify,
        aadhar_card: apiData.aadhar_card_url,
        aadhar_card_remark_enabled: apiData.aadhar_card_verify,
        pan_card: apiData.pan_card_url,
        pan_card_remark_enabled: apiData.pan_card_verify,
        other_document: apiData.other_document_url,
        other_document_remark_enabled: apiData.other_document_verify,

        // Bank Details
        primary_account_number: apiData.primary_bank_account_number,
        primary_bank_name: apiData.primary_bank_name ? { label: apiData.primary_bank_name, value: apiData.primary_bank_name } : undefined,
        primary_ifsc_code: apiData.primary_ifsc_code,
        primary_bank_verification_photo: apiData.primary_bank_verification_photo_url,
        secondary_account_number: apiData.secondary_bank_account_number,
        secondary_bank_name: apiData.secondary_bank_name ? { label: apiData.secondary_bank_name, value: apiData.secondary_bank_name } : undefined,
        secondary_ifsc_code: apiData.secondary_ifsc_code,
        secondary_bank_verification_photo: apiData.secondary_bank_verification_photo_url,
        additional_bank_details: apiData.company_bank_details?.map(b => ({ ...b, bank_name: b.bank_name ? {label: String(b.bank_name), value: String(b.bank_name)} : undefined, type: b.type ? {label: String(b.type), value: String(b.type)}: undefined, bank_verification_photo: (b as any).primary_bank_verification_photo_url || b.bank_verification_photo  })), // Map photo key if different in API

        // Accessibility
        KYC_FIELD: typeof apiData.kyc_verification === 'string' ? apiData.kyc_verification === "Yes" : apiData.kyc_verification,
        BILLING_FIELD: typeof apiData.billing_enabled === 'string' ? apiData.billing_enabled === "Yes" : apiData.billing_enabled,
        BILLING_PHOTOS_FIELD: apiData.billing_photos_url, // Assuming single URL for FileList becomes a string
        DOMAIN_MANAGEMENT_FIELD: apiData.domain_id ? { label: apiData.domain_id, value: apiData.domain_id } : undefined,

        // Member Management
        members: apiData.company_members?.map(m => ({...m, member: m.member_id ? {label: `Member ${m.member_id}`, value: String(m.member_id)} : undefined, designation: m.designation ? {label: String(m.designation), value: String(m.designation)} : undefined, person_name: m.name, contact_number: m.mobile })),

        // Other CompanyProfileSetting fields
        status: apiData.status ? { label: apiData.status, value: apiData.status } : undefined,
        company_code: apiData.company_code,
        brands: apiData.brands,
        category: apiData.category,
        interested_in: apiData.interested_in,
        total_members: apiData.total_members,
        member_participation: apiData.member_participation,
        success_score: apiData.success_score,
        trust_score: apiData.trust_score,
        health_score: apiData.health_score,
        support_email: apiData.support_email,
        mobile: apiData.mobile,
        expiry_date: apiData.expiry_date,
        company_type: apiData.company_type ? { label: apiData.company_type, value: apiData.company_type } : undefined,
        smtp_host: apiData.smtp_host, smtp_port: apiData.smtp_port, 
        smtp_secure: apiData.smtp_secure ? {label: apiData.smtp_secure, value: apiData.smtp_secure} : undefined, 
        smtp_username: apiData.smtp_username, smtp_name: apiData.smtp_name, smtp_email: apiData.smtp_email,
        facebook: apiData.facebook, instagram: apiData.instagram, linkedin: apiData.linkedin, youtube: apiData.youtube, twitter: apiData.twitter,
        logo_for_meta: apiData.logo_for_meta_url,
        notification_email: apiData.notification_email,

        company_spot_verification_data: apiData.company_spot_verification?.map(item => ({
            ...item,
            spot_verification_status: item.spot_verification_status && typeof item.spot_verification_status === 'string' ? { label: item.spot_verification_status, value: item.spot_verification_status } : item.spot_verification_status,
            verified_by: item.verified_by && typeof item.verified_by === 'string' ? { label: item.verified_by, value: item.verified_by } : item.verified_by,
        })),
    };
};

// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (formData: CompanyFormSchema, isEditMode: boolean, originalData?: Partial<CompanyFormSchema>): FormData => {
    const apiPayload = new FormData();

    let dataToProcess: any = { ...formData }; // Use a mutable copy
     if (isEditMode && originalData) {
        // For edit mode, it's often better to send only changed fields if using PATCH.
        // For PUT or if backend `$request->only` is used, sending all is fine.
        // This example sends all fields from the form, potentially overwriting originalData.
        dataToProcess = { ...originalData, ...formData }; 
    }


    if (dataToProcess.id && isEditMode) {
        apiPayload.append('id', String(dataToProcess.id)); // For Laravel update, ID might be in URL.
    }
     // If Laravel needs _method: 'PUT' for FormData updates
    // if (isEditMode) {
    //     apiPayload.append('_method', 'PUT');
    // }

    // --- Helper to append to FormData, handling Select objects ---
    const appendField = (backendKey: string, formValue: any) => {
        if (formValue instanceof File) {
            apiPayload.append(backendKey, formValue);
        } else if (formValue instanceof FileList) {
             for (let i = 0; i < formValue.length; i++) {
                apiPayload.append(`${backendKey}[${i}]`, formValue[i]); // e.g., billing_photos[0]
            }
        } else if (typeof formValue === 'object' && formValue !== null && 'value' in formValue) {
            apiPayload.append(backendKey, String(formValue.value));
        } else if (typeof formValue === 'boolean') {
            apiPayload.append(backendKey, formValue ? '1' : '0'); // Backend might expect 1/0 for booleans
        } else if (formValue !== undefined && formValue !== null) {
            apiPayload.append(backendKey, String(formValue));
        }
        // If formValue is undefined or null, it's not appended, which is usually fine.
    };

    // --- Map CompanyProfileSetting fields ---
    // Direct mapping or simple renames
    appendField('name', dataToProcess.name);
    appendField('status', dataToProcess.status);
    appendField('company_code', dataToProcess.company_code);
    appendField('company_profile_settings_id', dataToProcess.company_profile_settings_id);
    appendField('company_primary_contact_number', dataToProcess.company_primary_contact_number);
    appendField('alternate_contact_number', dataToProcess.alternate_contact_number);
    appendField('company_primary_email_id', dataToProcess.company_primary_email_id);
    appendField('alternate_email_id', dataToProcess.alternate_email_id);
    appendField('ownership_type', dataToProcess.ownership_type);
    appendField('owner_director_proprietor_name', dataToProcess.owner_director_proprietor_name);
    appendField('address', dataToProcess.company_address); // Rename: company_address -> address
    appendField('city', dataToProcess.city);
    appendField('state', dataToProcess.state);
    appendField('zip_postal_code', dataToProcess.zip_postal_code);
    appendField('country', dataToProcess.country);
    appendField('continent_name', dataToProcess.continent_name);
    appendField('brands', dataToProcess.brands);
    appendField('category', dataToProcess.category);
    appendField('interested_in', dataToProcess.interested_in);
    appendField('total_members', dataToProcess.total_members);
    appendField('member_participation', dataToProcess.member_participation);
    appendField('success_score', dataToProcess.success_score);
    appendField('trust_score', dataToProcess.trust_score);
    appendField('health_score', dataToProcess.health_score);
    appendField('support_email', dataToProcess.support_email);
    appendField('mobile', dataToProcess.mobile); // General mobile for company
    appendField('gst', dataToProcess.gst_number); // Rename: gst_number -> gst
    appendField('pan_number', dataToProcess.pan_number);
    appendField('tan_number', dataToProcess.tan_number);
    appendField('expiry_date', dataToProcess.expiry_date);
    appendField('company_type', dataToProcess.company_type);
    appendField('trn_number', dataToProcess.trn_number);
    appendField('company_establishment_year', dataToProcess.company_establishment_year);
    appendField('no_of_employees', dataToProcess.no_of_employees);
    appendField('company_website', dataToProcess.company_website);
    // company_logo_brochure from $input is not directly mapped if it's a text field;
    // frontend company_logo_brochure (File) maps to 'logo' file.
    appendField('primary_business_type', dataToProcess.primary_business_type);
    appendField('primary_business_category', dataToProcess.primary_business_category);
    
    // SMTP
    appendField('smtp_host', dataToProcess.smtp_host);
    appendField('smtp_port', dataToProcess.smtp_port);
    appendField('smtp_secure', dataToProcess.smtp_secure);
    appendField('smtp_username', dataToProcess.smtp_username);
    appendField('smtp_password', dataToProcess.smtp_password); // Be mindful of sending passwords
    appendField('smtp_name', dataToProcess.smtp_name);
    appendField('smtp_email', dataToProcess.smtp_email);

    // Social
    appendField('facebook', dataToProcess.facebook);
    appendField('instagram', dataToProcess.instagram);
    appendField('linkedin', dataToProcess.linkedin);
    appendField('youtube', dataToProcess.youtube);
    appendField('twitter', dataToProcess.twitter);
    appendField('notification_email', dataToProcess.notification_email);

    // Files for CompanyProfileSetting (handled by appendField if File instance)
    // Main logo
    if (dataToProcess.company_logo_brochure instanceof File) {
        apiPayload.append('logo', dataToProcess.company_logo_brochure);
    }
    // Meta Logo
    if (dataToProcess.logo_for_meta instanceof File) {
        apiPayload.append('logo_for_meta', dataToProcess.logo_for_meta);
    }
    // Billing Photos (Accessibility section)
    if (dataToProcess.BILLING_PHOTOS_FIELD instanceof File) { // Single file
        apiPayload.append('billing_photos', dataToProcess.BILLING_PHOTOS_FIELD);
    } else if (dataToProcess.BILLING_PHOTOS_FIELD instanceof FileList) { // Multiple files
        for (let i = 0; i < dataToProcess.BILLING_PHOTOS_FIELD.length; i++) {
            apiPayload.append(`billing_photos[${i}]`, dataToProcess.BILLING_PHOTOS_FIELD[i]);
        }
    }
    
    // Bank verification photos for CompanyProfileSetting
    appendField('primary_bank_verification_photo', dataToProcess.primary_bank_verification_photo);
    appendField('secondary_bank_verification_photo', dataToProcess.secondary_bank_verification_photo);

    // Accessibility fields mapping to CompanyProfileSetting booleans/ID
    appendField('kyc_verification', dataToProcess.KYC_FIELD); // Boolean will be '1' or '0'
    appendField('billing_enabled', dataToProcess.BILLING_FIELD); // Boolean
    appendField('domain_id', dataToProcess.DOMAIN_MANAGEMENT_FIELD);

    // Primary/Secondary bank details for CompanyProfileSetting
    appendField('primary_bank_account_number', dataToProcess.primary_account_number);
    appendField('primary_bank_name', dataToProcess.primary_bank_name);
    appendField('primary_ifsc_code', dataToProcess.primary_ifsc_code);
    appendField('secondary_bank_account_number', dataToProcess.secondary_account_number);
    appendField('secondary_bank_name', dataToProcess.secondary_bank_name);
    appendField('secondary_ifsc_code', dataToProcess.secondary_ifsc_code);


    // --- company_spot_verification (Array) ---
    // Backend expects: company_spot_verification[field_name][index] and company_spot_verification[index][photo_upload]
    if (dataToProcess.company_spot_verification_data && Array.isArray(dataToProcess.company_spot_verification_data)) {
        dataToProcess.company_spot_verification_data.forEach((item: CompanySpotVerificationItemFE, index: number) => {
            const status = (typeof item.spot_verification_status === 'object' && item.spot_verification_status?.value) ? item.spot_verification_status.value : item.spot_verification_status;
            const verifiedBy = (typeof item.verified_by === 'object' && item.verified_by?.value) ? item.verified_by.value : item.verified_by;

            if (status !== undefined) apiPayload.append(`company_spot_verification[spot_verification_status][${index}]`, String(status));
            if (verifiedBy !== undefined) apiPayload.append(`company_spot_verification[verified_by][${index}]`, String(verifiedBy));
            if (item.reference_person_name) apiPayload.append(`company_spot_verification[reference_person_name][${index}]`, item.reference_person_name);
            if (item.reference_company_name) apiPayload.append(`company_spot_verification[reference_company_name][${index}]`, item.reference_company_name);
            if (item.reference_contact_number) apiPayload.append(`company_spot_verification[reference_contact_number][${index}]`, item.reference_contact_number);
            if (item.remarks) apiPayload.append(`company_spot_verification[remarks][${index}]`, item.remarks);
            if (item.photo_upload instanceof File) {
                apiPayload.append(`company_spot_verification[${index}][photo_upload]`, item.photo_upload);
            }
        });
    }
    
    // --- CompanyKycDocument fields ---
    // Backend uses keys like 'declaration_206AB', 'declaration_206AB_verify'
    const kycDocsConfig = [
        { feFile: 'declaration_206ab', beFile: 'declaration_206AB', feVerify: 'declaration_206ab_remark_enabled', beVerify: 'declaration_206AB_verify' },
        { feFile: 'declaration_194q', beFile: 'declaration_194Q', feVerify: 'declaration_194q_remark_enabled', beVerify: 'declaration_194Q_verify' },
        { feFile: 'office_photo', beFile: 'office_photo', feVerify: 'office_photo_remark_enabled', beVerify: 'office_photo_verify' },
        { feFile: 'gst_certificate', beFile: 'gst_certificate', feVerify: 'gst_certificate_remark_enabled', beVerify: 'gst_certificate_verify' },
        { feFile: 'authority_letter', beFile: 'authority_letter', feVerify: 'authority_letter_remark_enabled', beVerify: 'authority_letter_verify' },
        { feFile: 'visiting_card', beFile: 'visiting_card', feVerify: 'visiting_card_remark_enabled', beVerify: 'visiting_card_verify' },
        { feFile: 'cancel_cheque', beFile: 'cancel_cheque', feVerify: 'cancel_cheque_remark_enabled', beVerify: 'cancel_cheque_verify' },
        { feFile: 'aadhar_card', beFile: 'aadhar_card', feVerify: 'aadhar_card_remark_enabled', beVerify: 'aadhar_card_verify' },
        { feFile: 'pan_card', beFile: 'pan_card', feVerify: 'pan_card_remark_enabled', beVerify: 'pan_card_verify' },
        { feFile: 'other_document', beFile: 'other_document', feVerify: 'other_document_remark_enabled', beVerify: 'other_document_verify' },
    ];

    kycDocsConfig.forEach(doc => {
        if (dataToProcess[doc.feFile] instanceof File) {
            apiPayload.append(doc.beFile, dataToProcess[doc.feFile]);
        }
        // Send verify flag (backend expects boolean as 0/1 or true/false string)
        apiPayload.append(doc.beVerify, dataToProcess[doc.feVerify] ? '1' : '0');
    });

    // --- company_members (Array) ---
    // Backend: company_members[field_name][index]
    if (dataToProcess.members && Array.isArray(dataToProcess.members)) {
        dataToProcess.members.forEach((member: MemberItem, index: number) => {
            const memberId = (typeof member.member === 'object' && member.member?.value) ? member.member.value : member.member;
            const designation = (typeof member.designation === 'object' && member.designation?.value) ? member.designation.value : member.designation;

            if (memberId !== undefined) apiPayload.append(`company_members[member_id][${index}]`, String(memberId));
            if (designation !== undefined) apiPayload.append(`company_members[designation][${index}]`, String(designation));
            if (member.person_name) apiPayload.append(`company_members[name][${index}]`, member.person_name); // Map person_name -> name
            if (member.contact_number) apiPayload.append(`company_members[mobile][${index}]`, member.contact_number); // Map contact_number -> mobile
        });
    }
    
    // --- company_bank_details (Array for additional banks) ---
    // Backend: company_bank_details[field_name][index] and company_bank_details[index][primary_bank_verification_photo]
    if (dataToProcess.additional_bank_details && Array.isArray(dataToProcess.additional_bank_details)) {
        dataToProcess.additional_bank_details.forEach((bank: CompanyBankDetailItemFE, index: number) => {
            const bankName = (typeof bank.bank_name === 'object' && bank.bank_name?.value) ? bank.bank_name.value : bank.bank_name;
            const type = (typeof bank.type === 'object' && bank.type?.value) ? bank.type.value : bank.type;

            if (bank.bank_account_number) apiPayload.append(`company_bank_details[bank_account_number][${index}]`, bank.bank_account_number);
            if (bankName !== undefined) apiPayload.append(`company_bank_details[bank_name][${index}]`, String(bankName));
            if (bank.ifsc_code) apiPayload.append(`company_bank_details[ifsc_code][${index}]`, bank.ifsc_code);
            if (type !== undefined) apiPayload.append(`company_bank_details[type][${index}]`, String(type));
            if (bank.bank_verification_photo instanceof File) {
                // Backend expects 'primary_bank_verification_photo' for the file in this array items
                apiPayload.append(`company_bank_details[${index}][primary_bank_verification_photo]`, bank.bank_verification_photo);
            }
        });
    }

    // --- company_branches (Array) ---
    // Singular UI for Office Info needs to be wrapped into company_branches[0]
    // Backend: company_branches[field_name][index]
    // Check if any branch data is present to avoid sending empty array if not intended
    const hasBranchData = dataToProcess.head_office || dataToProcess.branches || dataToProcess.branch_address || dataToProcess.location_country || dataToProcess.branch_state || dataToProcess.branch_zip_code || dataToProcess.branch_gst_reg_number;

    if (hasBranchData) { // Only create branch entry if there's data
        // head_office in UI (Select) maps to office_type in backend for branches.
        // The backend also has `company_branches[head_office][$i]` which seems to be a boolean/flag.
        // Let's assume `dataToProcess.head_office` (which is the 'Office Type' select) maps to `office_type`.
        // And we need a way to determine the `head_office` flag.
        // For simplicity, if office_type is "Head Office", we set head_office flag to 1. This is an assumption.
        
        const officeType = (typeof dataToProcess.head_office === 'object' && dataToProcess.head_office?.value) ? dataToProcess.head_office.value : dataToProcess.head_office;
        const locationCountry = (typeof dataToProcess.location_country === 'object' && dataToProcess.location_country?.value) ? dataToProcess.location_country.value : dataToProcess.location_country;
        const branchState = (typeof dataToProcess.branch_state === 'object' && dataToProcess.branch_state?.value) ? dataToProcess.branch_state.value : dataToProcess.branch_state;

        // Heuristic for head_office flag based on office_type selection
        const isHeadOfficeFlag = (String(officeType).toLowerCase().includes('head office')) ? '1' : '0';
        apiPayload.append(`company_branches[head_office][0]`, isHeadOfficeFlag);

        if (officeType !== undefined) apiPayload.append(`company_branches[office_type][0]`, String(officeType));
        // `branches` from UI (Office Name) - needs a target field in backend branch structure.
        // Assuming `branch_name` as a custom field or if backend has one like it.
        // If not, this field (`dataToProcess.branches`) might not be saved unless mapped.
        // For now, let's map it to 'branch_name' if you add it to your backend Branch model.
        // if (dataToProcess.branches) apiPayload.append(`company_branches[branch_name][0]`, dataToProcess.branches);
        
        if (locationCountry !== undefined) apiPayload.append(`company_branches[location_country][0]`, String(locationCountry));
        if (branchState !== undefined) apiPayload.append(`company_branches[branch_state][0]`, String(branchState));
        if (dataToProcess.branch_zip_code) apiPayload.append(`company_branches[branch_zip_code][0]`, dataToProcess.branch_zip_code);
        if (dataToProcess.branch_address) apiPayload.append(`company_branches[branch_address][0]`, dataToProcess.branch_address);
        if (dataToProcess.branch_gst_reg_number) apiPayload.append(`company_branches[branch_gst_reg_number][0]`, dataToProcess.branch_gst_reg_number);
    }


    // --- company_certificate (Array) ---
    // Singular UI for Certificate needs to be wrapped into company_certificate[0]
    // Backend: company_certificate[field_name][index] and company_certificate[index][upload_certificate]
    if (dataToProcess.certificate_name || dataToProcess.upload_certificate instanceof File) {
        if (dataToProcess.certificate_name) apiPayload.append(`company_certificate[certificate_name][0]`, dataToProcess.certificate_name);
        if (dataToProcess.upload_certificate instanceof File) {
            apiPayload.append(`company_certificate[0][upload_certificate]`, dataToProcess.upload_certificate);
        }
    }
    
    return apiPayload;
};


// --- Navigator Component (Original) ---
const companyNavigationList = [
    { label: 'Company Details', link: 'companyDetails' },
    { label: 'KYC Documents', link: 'kycDocuments' },
    { label: 'Bank Details', link: 'bankDetails' },
    { label: 'Accessibility', link: 'accessibility' },
    { label: 'Member Management', link: 'memberManagement' },
];

type NavigatorComponentProps = {
    activeSection: string;
    onNavigate: (sectionKey: string) => void;
};

const NavigatorComponent = (props: NavigatorComponentProps) => {
    const { activeSection, onNavigate } = props;
    return (
        <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
            {companyNavigationList.map((nav) => (
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

// --- CompanyDetails Section (Original Structure, fields mapped in payload) ---
const CompanyDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    // Mock options - replace with actual data fetching or constants
    const countryOptions = [{ value: 'IN', label: 'India' }, { value: 'US', label: 'United States' }];
    const stateOptions = [{ value: 'MH', label: 'Maharashtra' }, { value: 'CA', label: 'California' }];
    const cityOptions = [{ value: 'Mumbai', label: 'Mumbai' }, { value: 'Los Angeles', label: 'Los Angeles' }];
    const continentOptions = [{ value: 'AS', label: 'Asia' }, { value: 'NA', label: 'North America' }];
    const ownershipTypeOptions = [{ value: 'private_limited', label: 'Private Limited' }, { value: 'llp', label: 'LLP' }];
    const primaryBusinessTypeOptions = [{ value: 'manufacturer', label: 'Manufacturer' }, { value: 'service', label: 'Service' }];
    const primaryBusinessCategoryOptions = [{ value: 'electronics', label: 'Electronics' }, { value: 'software', label: 'Software' }];
    const officeTypeOptions = [{ label: "Head Office", value: "Head Office" }, { label: "Branch", value: "Branch" }]; // For 'head_office' field in UI

    // Add new fields from schema if you want them in this UI section
    // e.g. status, company_code, brands, etc.
    const statusOptions = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];
    const companyTypeOptions = [{ value: 'TypeA', label: 'Type A' }];


    return (
        <Card id="companyDetails">
            <h4 className="mb-4">Primary Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <FormItem label="Company Name" invalid={!!errors.name} errorMessage={errors.name?.message as string}>
                    <Controller name="name" control={control} render={({ field }) => <Input placeholder="Company Name" {...field} />} />
                </FormItem>
                 {/* Example of adding a new field to UI from schema */}
                <FormItem label="Company Code" invalid={!!errors.company_code} errorMessage={errors.company_code?.message as string}>
                    <Controller name="company_code" control={control} render={({ field }) => <Input placeholder="Company Code" {...field} />} />
                </FormItem>
                <FormItem label="Status" invalid={!!errors.status} errorMessage={errors.status?.message as string}>
                    <Controller name="status" control={control} render={({ field }) => <Select options={statusOptions} placeholder="Select Status" {...field} />} />
                </FormItem>


                <FormItem label="Primary Contact Number" invalid={!!errors.company_primary_contact_number} errorMessage={errors.company_primary_contact_number?.message as string}>
                    <div className="flex items-center gap-2">
                        <Controller name="primary_contact_country_code" control={control} render={({ field }) => <Input placeholder="+91" className="w-20" {...field} />} />
                        <Controller name="company_primary_contact_number" control={control} render={({ field }) => <Input placeholder="Primary Contact" {...field} />} />
                    </div>
                </FormItem>
                <FormItem label="Primary E-mail ID" invalid={!!errors.company_primary_email_id} errorMessage={errors.company_primary_email_id?.message as string}>
                    <Controller name="company_primary_email_id" control={control} render={({ field }) => <Input type="email" placeholder="Primary Email" {...field} />} />
                </FormItem>
                <FormItem label="Alternate Contact Number">
                    <div className="flex items-center gap-2">
                        <Controller name="alternate_contact_country_code" control={control} render={({ field }) => <Input placeholder="+91" className="w-20" {...field} />} />
                        <Controller name="alternate_contact_number" control={control} render={({ field }) => <Input placeholder="Alternate Contact" {...field} />} />
                    </div>
                </FormItem>
                <FormItem label="Alternate E-mail ID" invalid={!!errors.alternate_email_id} errorMessage={errors.alternate_email_id?.message as string}>
                    <Controller name="alternate_email_id" control={control} render={({ field }) => <Input type="email" placeholder="Alternate Email" {...field} />} />
                </FormItem>
                <FormItem label="Ownership Type" invalid={!!errors.ownership_type} errorMessage={errors.ownership_type?.message as string}>
                    <Controller name="ownership_type" control={control} render={({ field }) => <Select placeholder="Select Ownership" options={ownershipTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Owner/Director Name" invalid={!!errors.owner_director_proprietor_name} errorMessage={errors.owner_director_proprietor_name?.message as string} className="md:col-span-3">
                    <Controller name="owner_director_proprietor_name" control={control} render={({ field }) => <Input placeholder="Owner/Director Name" {...field} />} />
                </FormItem>
                <FormItem label="Company Address" invalid={!!errors.company_address} errorMessage={errors.company_address?.message as string} className="md:col-span-3">
                    <Controller name="company_address" control={control} render={({ field }) => <Input textArea placeholder="Company Address" {...field} />} />
                </FormItem>
                <FormItem label="Continent" invalid={!!errors.continent_name} errorMessage={errors.continent_name?.message as string}>
                    <Controller name="continent_name" control={control} render={({ field }) => <Select placeholder="Select Continent" options={continentOptions} {...field} />} />
                </FormItem>
                <FormItem label="Country" invalid={!!errors.country} errorMessage={errors.country?.message as string}>
                    <Controller name="country" control={control} render={({ field }) => <Select placeholder="Select Country" options={countryOptions} {...field} />} />
                </FormItem>
                <FormItem label="State" invalid={!!errors.state} errorMessage={errors.state?.message as string}>
                    <Controller name="state" control={control} render={({ field }) => <Select placeholder="Select State" options={stateOptions} {...field} />} />
                </FormItem>
                <FormItem label="City" invalid={!!errors.city} errorMessage={errors.city?.message as string} className="md:col-span-2">
                    <Controller name="city" control={control} render={({ field }) => <Select placeholder="Select City" options={cityOptions} {...field} />} />
                </FormItem>
                <FormItem label="ZIP / Postal Code" invalid={!!errors.zip_postal_code} errorMessage={errors.zip_postal_code?.message as string}>
                    <Controller name="zip_postal_code" control={control} render={({ field }) => <Input placeholder="ZIP Code" {...field} />} />
                </FormItem>
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Trade Information</h4>
            <div className="grid md:grid-cols-2 gap-3">
                <FormItem label="GST Number" invalid={!!errors.gst_number} errorMessage={errors.gst_number?.message as string}><Controller name="gst_number" control={control} render={({ field }) => <Input placeholder="GST Number" {...field} />} /></FormItem>
                <FormItem label="PAN Number" invalid={!!errors.pan_number} errorMessage={errors.pan_number?.message as string}><Controller name="pan_number" control={control} render={({ field }) => <Input placeholder="PAN Number" {...field} />} /></FormItem>
                <FormItem label="TRN Number" invalid={!!errors.trn_number} errorMessage={errors.trn_number?.message as string}><Controller name="trn_number" control={control} render={({ field }) => <Input placeholder="TRN Number" {...field} />} /></FormItem>
                <FormItem label="TAN Number" invalid={!!errors.tan_number} errorMessage={errors.tan_number?.message as string}><Controller name="tan_number" control={control} render={({ field }) => <Input placeholder="TAN Number" {...field} />} /></FormItem>
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Company Information</h4>
            <div className="grid md:grid-cols-3 gap-3">
                <FormItem label="Establishment Year" invalid={!!errors.company_establishment_year} errorMessage={errors.company_establishment_year?.message as string}>
                    <Controller name="company_establishment_year" control={control} render={({ field }) => <Input placeholder="YYYY" maxLength={4} {...field} />} />
                </FormItem>
                <FormItem label="No. of Employees" invalid={!!errors.no_of_employees} errorMessage={errors.no_of_employees?.message as string}>
                    <Controller name="no_of_employees" control={control} render={({ field }) => <NumericInput placeholder="e.g., 100" {...field} onChange={value => field.onChange(value)} />} />
                </FormItem>
                <FormItem label="Company Website" invalid={!!errors.company_website} errorMessage={errors.company_website?.message as string}>
                    <Controller name="company_website" control={control} render={({ field }) => <Input type="url" placeholder="https://example.com" {...field} />} />
                </FormItem>
                <FormItem label="Company Logo/Brochure" invalid={!!errors.company_logo_brochure} errorMessage={errors.company_logo_brochure?.message as string}>
                    <Controller name="company_logo_brochure" control={control}
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} {...restField}/>}
                    />
                     {typeof control._formValues.company_logo_brochure === 'string' && control._formValues.company_logo_brochure && <img src={control._formValues.company_logo_brochure} alt="logo preview" className="mt-2 h-16 w-auto" />}
                </FormItem>
                <FormItem label="Primary Business Type" invalid={!!errors.primary_business_type} errorMessage={errors.primary_business_type?.message as string}>
                    <Controller name="primary_business_type" control={control} render={({ field }) => <Select placeholder="Select Business Type" options={primaryBusinessTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Primary Business Category" invalid={!!errors.primary_business_category} errorMessage={errors.primary_business_category?.message as string}>
                    <Controller name="primary_business_category" control={control} render={({ field }) => <Select placeholder="Select Category" options={primaryBusinessCategoryOptions} {...field} />} />
                </FormItem>
                {/* Fields like brands, category, interested_in, support_email, mobile, expiry_date, company_type etc. can be added here if desired in this section */}
                 <FormItem label="Company Type" invalid={!!errors.company_type} errorMessage={errors.company_type?.message as string}>
                    <Controller name="company_type" control={control} render={({ field }) => <Select placeholder="Select Company Type" options={companyTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Support Email" invalid={!!errors.support_email} errorMessage={errors.support_email?.message as string}>
                    <Controller name="support_email" control={control} render={({ field }) => <Input type="email" placeholder="support@example.com" {...field} />} />
                </FormItem>
                 <FormItem label="Logo for Meta Tags" invalid={!!errors.logo_for_meta} errorMessage={errors.logo_for_meta?.message as string}>
                    <Controller name="logo_for_meta" control={control}
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                    />
                     {typeof control._formValues.logo_for_meta === 'string' && control._formValues.logo_for_meta && <img src={control._formValues.logo_for_meta} alt="meta logo preview" className="mt-2 h-16 w-auto" />}
                </FormItem>

            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Certificates (Single Entry UI)</h4>
            <div className="grid md:grid-cols-7 gap-3 items-end"> {/* Use items-end to align button */}
                <FormItem label="Certificate Name" className="col-span-3" invalid={!!errors.certificate_name} errorMessage={errors.certificate_name?.message as string}>
                    <Controller name="certificate_name" control={control} render={({ field }) => <Input placeholder="e.g., ISO 9001" {...field} />} />
                </FormItem>
                <FormItem label="Upload Certificate" className="col-span-3" invalid={!!errors.upload_certificate} errorMessage={errors.upload_certificate?.message as string}>
                    <Controller name="upload_certificate" control={control}
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                    />
                </FormItem>
                {/* Removed "Add More" button for certificates to keep original UI */}
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Office Information (Single Entry UI)</h4>
            <div className="grid md:grid-cols-2 gap-3">
                <FormItem label="Office Type" invalid={!!errors.head_office} errorMessage={errors.head_office?.message as string}>
                    <Controller name="head_office" control={control} render={({ field }) => <Select placeholder="Select Office Type" options={officeTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Office Name" invalid={!!errors.branches} errorMessage={errors.branches?.message as string}>
                    <Controller name="branches" control={control} render={({ field }) => <Input placeholder="e.g. XYZ Pvt. Ltd. Main Office" {...field} />} />
                </FormItem>
                <FormItem label="Address" className="md:col-span-2" invalid={!!errors.branch_address} errorMessage={errors.branch_address?.message as string}>
                    <Controller name="branch_address" control={control} render={({ field }) => <Input textArea placeholder="Full Address" {...field} />} />
                </FormItem>
                <FormItem label="Location Country" invalid={!!errors.location_country} errorMessage={errors.location_country?.message as string}>
                    <Controller name="location_country" control={control} render={({ field }) => <Select placeholder="Select Country" options={countryOptions} {...field} />} />
                </FormItem>
                <FormItem label="State" invalid={!!errors.branch_state} errorMessage={errors.branch_state?.message as string}>
                    <Controller name="branch_state" control={control} render={({ field }) => <Select placeholder="Select State" options={stateOptions} {...field} />} />
                </FormItem>
                <FormItem label="ZIP Code" invalid={!!errors.branch_zip_code} errorMessage={errors.branch_zip_code?.message as string}>
                    <Controller name="branch_zip_code" control={control} render={({ field }) => <Input placeholder="ZIP Code" {...field} />} />
                </FormItem>
                <FormItem label="GST/REG Number" invalid={!!errors.branch_gst_reg_number} errorMessage={errors.branch_gst_reg_number?.message as string}>
                    <Controller name="branch_gst_reg_number" control={control} render={({ field }) => <Input placeholder="GST or Registration Number" {...field} />} />
                </FormItem>
            </div>
            {/* Removed "Add More" button for branches to keep original UI */}
        </Card>
    );
};

// --- KYCDetailSection (Original Structure) ---
const KYCDetailSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const kycDocs = [
        // Uses original schema names, mapping happens in payload
        { label: '206AB Declaration', name: 'declaration_206ab' as const, remarkName: 'declaration_206ab_remark' as const, enabledName: 'declaration_206ab_remark_enabled' as const },
        { label: '194Q Declaration', name: 'declaration_194q' as const, remarkName: 'declaration_194q_remark' as const, enabledName: 'declaration_194q_remark_enabled' as const },
        { label: 'Office Photo', name: 'office_photo' as const, remarkName: 'office_photo_remark' as const, enabledName: 'office_photo_remark_enabled' as const },
        { label: 'GST Certificate', name: 'gst_certificate' as const, remarkName: 'gst_certificate_remark' as const, enabledName: 'gst_certificate_remark_enabled' as const },
        { label: 'Authority Letter', name: 'authority_letter' as const, remarkName: 'authority_letter_remark' as const, enabledName: 'authority_letter_remark_enabled' as const },
        { label: 'Visiting Card', name: 'visiting_card' as const, remarkName: 'visiting_card_remark' as const, enabledName: 'visiting_card_remark_enabled' as const },
        { label: 'Cancel Cheque', name: 'cancel_cheque' as const, remarkName: 'cancel_cheque_remark' as const, enabledName: 'cancel_cheque_remark_enabled' as const },
        { label: 'Aadhar Card', name: 'aadhar_card' as const, remarkName: 'aadhar_card_remark' as const, enabledName: 'aadhar_card_remark_enabled' as const },
        { label: 'PAN Card', name: 'pan_card' as const, remarkName: 'pan_card_remark' as const, enabledName: 'pan_card_remark_enabled' as const },
        { label: 'Other Document', name: 'other_document' as const, remarkName: 'other_document_remark' as const, enabledName: 'other_document_remark_enabled' as const },
    ];

    return (
        <Card id="kycDocuments">
            <h5 className="mb-4">Document Upload</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                {kycDocs.map((doc) => {
                    return (
                        <div key={doc.name}>
                            <label className="flex items-center gap-2 mb-1">
                                <Controller
                                    name={doc.enabledName}
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox checked={!!field.value} onChange={field.onChange}>
                                            {doc.label} (Verified)
                                        </Checkbox>
                                    )}
                                />
                            </label>
                            <FormItem invalid={!!errors[doc.name]} errorMessage={errors[doc.name]?.message as string}>
                                <Controller
                                    name={doc.name}
                                    control={control}
                                    render={({ field: { onChange, ref, value, ...restField } }) => (
                                        <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} {...restField} />
                                    )}
                                />
                                 {typeof control._formValues[doc.name] === 'string' && control._formValues[doc.name] && 
                                <a href={control._formValues[doc.name] as string} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">View Uploaded</a>
                            }
                            </FormItem>
                            <FormItem className="mt-2" invalid={!!errors[doc.remarkName]} errorMessage={errors[doc.remarkName]?.message as string}>
                                <Controller
                                    name={doc.remarkName}
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            textArea
                                            placeholder={`Remark for ${doc.label}`}
                                            {...field}
                                        // disabled={!control._formValues[doc.enabledName]} // Requires watching
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

// --- BankDetailsSection (Original Structure for Primary/Secondary, and useFieldArray for additional) ---
const BankDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const bankNameOptions = [{ value: 'hdfc', label: 'HDFC Bank' }, { value: 'sbi', label: 'State Bank of India' }];
    const bankTypeOptions = [{ value: 'Primary', label: 'Primary' }, { value: 'Secondary', label: 'Secondary' }, {value: 'Other', label: 'Other'}]; // For additional banks type

    const { fields, append, remove } = useFieldArray({
        control: formMethods.control,
        name: "additional_bank_details" // Using the schema field for the array part
    });

    return (
        <Card id="bankDetails">
            <h4 className="mb-6">Bank Details (Primary)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormItem label="Primary Account Number" invalid={!!errors.primary_account_number} errorMessage={errors.primary_account_number?.message as string}>
                    <Controller name="primary_account_number" control={control} render={({ field }) => <Input placeholder="Primary Account No." {...field} />} />
                </FormItem>
                <FormItem label="Primary Bank Name" invalid={!!errors.primary_bank_name} errorMessage={errors.primary_bank_name?.message as string}>
                    <Controller name="primary_bank_name" control={control} render={({ field }) => <Select placeholder="Select Bank" options={bankNameOptions} {...field} />} />
                </FormItem>
                <FormItem label="Primary IFSC Code" invalid={!!errors.primary_ifsc_code} errorMessage={errors.primary_ifsc_code?.message as string}>
                    <Controller name="primary_ifsc_code" control={control} render={({ field }) => <Input placeholder="Primary IFSC" {...field} />} />
                </FormItem>
                <FormItem label="Primary Bank Verification Photo" className="md:col-span-3" invalid={!!errors.primary_bank_verification_photo} errorMessage={errors.primary_bank_verification_photo?.message as string}>
                    <Controller name="primary_bank_verification_photo" control={control}
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" onChange={e => onChange(e.target.files?.[0])} {...restField}/>}
                    />
                     {typeof control._formValues.primary_bank_verification_photo === 'string' && control._formValues.primary_bank_verification_photo && <img src={control._formValues.primary_bank_verification_photo} alt="Primary bank photo" className="mt-2 h-16 w-auto" />}
                </FormItem>
            </div>
            <hr className="my-6"/>
            <h4 className="mb-6">Bank Details (Secondary)</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormItem label="Secondary Account Number" invalid={!!errors.secondary_account_number} errorMessage={errors.secondary_account_number?.message as string}>
                    <Controller name="secondary_account_number" control={control} render={({ field }) => <Input placeholder="Secondary Account No." {...field} />} />
                </FormItem>
                <FormItem label="Secondary Bank Name" invalid={!!errors.secondary_bank_name} errorMessage={errors.secondary_bank_name?.message as string}>
                    <Controller name="secondary_bank_name" control={control} render={({ field }) => <Select placeholder="Select Bank" options={bankNameOptions} {...field} />} />
                </FormItem>
                <FormItem label="Secondary IFSC Code" invalid={!!errors.secondary_ifsc_code} errorMessage={errors.secondary_ifsc_code?.message as string}>
                    <Controller name="secondary_ifsc_code" control={control} render={({ field }) => <Input placeholder="Secondary IFSC" {...field} />} />
                </FormItem>
                <FormItem label="Secondary Bank Verification Photo" className="md:col-span-3" invalid={!!errors.secondary_bank_verification_photo} errorMessage={errors.secondary_bank_verification_photo?.message as string}>
                    <Controller name="secondary_bank_verification_photo" control={control}
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                    />
                     {typeof control._formValues.secondary_bank_verification_photo === 'string' && control._formValues.secondary_bank_verification_photo && <img src={control._formValues.secondary_bank_verification_photo} alt="Secondary bank photo" className="mt-2 h-16 w-auto" />}
                </FormItem>
            </div>

            <hr className="my-6"/>
             <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">Additional Bank Details</h4>
                 <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ bank_account_number: '', bank_name: undefined, ifsc_code: '', bank_verification_photo: undefined, type: undefined })}>
                    Add More Banks
                </Button>
            </div>

            {fields.map((item, index) => (
                <Card key={item.id} className="mb-4 p-4 border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
                         <FormItem label={`Type`} invalid={!!errors.additional_bank_details?.[index]?.type} errorMessage={errors.additional_bank_details?.[index]?.type?.message as string}>
                            <Controller name={`additional_bank_details.${index}.type`} control={control} render={({ field }) => <Select placeholder="Select Type" options={bankTypeOptions} {...field} />} />
                        </FormItem>
                        <FormItem label={`Account Number`} invalid={!!errors.additional_bank_details?.[index]?.bank_account_number} errorMessage={errors.additional_bank_details?.[index]?.bank_account_number?.message as string}>
                            <Controller name={`additional_bank_details.${index}.bank_account_number`} control={control} render={({ field }) => <Input placeholder="Account No." {...field} />} />
                        </FormItem>
                        <FormItem label={`Bank Name`} invalid={!!errors.additional_bank_details?.[index]?.bank_name} errorMessage={errors.additional_bank_details?.[index]?.bank_name?.message as string}>
                            <Controller name={`additional_bank_details.${index}.bank_name`} control={control} render={({ field }) => <Select placeholder="Select Bank" options={bankNameOptions} {...field} />} />
                        </FormItem>
                        <FormItem label={`IFSC Code`} invalid={!!errors.additional_bank_details?.[index]?.ifsc_code} errorMessage={errors.additional_bank_details?.[index]?.ifsc_code?.message as string}>
                            <Controller name={`additional_bank_details.${index}.ifsc_code`} control={control} render={({ field }) => <Input placeholder="IFSC" {...field} />} />
                        </FormItem>
                        <FormItem label={`Bank Verification Photo`} className="md:col-span-2" invalid={!!errors.additional_bank_details?.[index]?.bank_verification_photo} errorMessage={errors.additional_bank_details?.[index]?.bank_verification_photo?.message as string}>
                             <Controller name={`additional_bank_details.${index}.bank_verification_photo`} control={control}
                                render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                            />
                             {/* Preview logic for array item photo */}
                        </FormItem>
                         <div className="md:col-span-3 flex justify-end">
                            <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => remove(index)} danger />
                        </div>
                    </div>
                </Card>
            ))}
        </Card>
    );
};

// --- AccessibilitySection (Original Structure) ---
const AccessibilitySection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const domainOptions = [{ value: 'retail.com', label: 'retail.com' }, { value: 'service.co', label: 'service.co' }]; // Example
    // The BILLING_PHOTOS_FIELD_name is UI only, not in schema unless you specifically want to save it.
    // The BILLING_PHOTOS_FIELD maps to backend 'billing_photos'.
    return (
        <Card id="accessibility">
            <h4 className="mb-6">Accessibility</h4>
            <div className="md:grid md:grid-cols-2 lg:grid-cols-7 lg:gap-2">
                <FormItem label="KYC Verified" className="col-span-1 lg:col-span-3" invalid={!!errors.KYC_FIELD} errorMessage={errors.KYC_FIELD?.message as string}>
                    <Controller name="KYC_FIELD" control={control} render={({ field }) => <Checkbox checked={!!field.value} onChange={field.onChange}>KYC Verified</Checkbox>} />
                </FormItem>
                <FormItem label="Enable Billing" className="col-span-1 lg:col-span-4" invalid={!!errors.BILLING_FIELD} errorMessage={errors.BILLING_FIELD?.message as string}>
                    <Controller name="BILLING_FIELD" control={control} render={({ field }) => <Checkbox checked={!!field.value} onChange={field.onChange}>Enable Billing</Checkbox>} />
                </FormItem>
                <div className="md:grid grid-cols-subgrid lg:grid-cols-subgrid gap-2 col-span-7 mb-6 lg:mb-0 items-end">
                    <FormItem label="Billing Document Name (UI Only)" className="lg:col-span-3">
                        <Input type="text" placeholder="e.g., Invoice Template (UI Reference)" />
                    </FormItem>
                    <FormItem label="Upload Billing Document(s)" className="lg:col-span-3" invalid={!!errors.BILLING_PHOTOS_FIELD} errorMessage={errors.BILLING_PHOTOS_FIELD?.message as string}>
                        <Controller name="BILLING_PHOTOS_FIELD" control={control}
                            render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" multiple onChange={e => onChange(e.target.files)} {...restField} />}
                        />
                    </FormItem>
                    {/* Removed Add More for billing photos to keep UI simple, assuming multiple attribute on input is enough */}
                </div>
                <FormItem label="Domain Management" className="md:col-span-2 lg:col-span-7" invalid={!!errors.DOMAIN_MANAGEMENT_FIELD} errorMessage={errors.DOMAIN_MANAGEMENT_FIELD?.message as string}>
                    <Controller name="DOMAIN_MANAGEMENT_FIELD" control={control} render={({ field }) => <Select placeholder="Select Domain" options={domainOptions} {...field} />} />
                </FormItem>
                 {/* Section for SMTP, Social Media Links etc. if you want them here */}
                <Card className='mt-4 col-span-full'>
                    <h4 className="mb-4">SMTP Configuration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <FormItem label="SMTP Host"><Controller name="smtp_host" control={control} render={({ field }) => <Input placeholder="mail.example.com" {...field} />} /></FormItem>
                        <FormItem label="SMTP Port"><Controller name="smtp_port" control={control} render={({ field }) => <Input placeholder="587" {...field} />} /></FormItem>
                        {/* ... other SMTP fields ... */}
                        <FormItem label="SMTP Sender Email"><Controller name="smtp_email" control={control} render={({ field }) => <Input type="email" placeholder="sender@example.com" {...field} />} /></FormItem>
                    </div>
                    <hr className="my-6" />
                    <h4 className="mb-4">Social Media Links</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <FormItem label="Facebook URL"><Controller name="facebook" control={control} render={({ field }) => <Input type="url" placeholder="https://facebook.com/..." {...field} />} /></FormItem>
                        {/* ... other social media fields ... */}
                        <FormItem label="Twitter URL"><Controller name="twitter" control={control} render={({ field }) => <Input type="url" placeholder="https://twitter.com/..." {...field} />} /></FormItem>
                    </div>
                </Card>
            </div>
        </Card>
    );
};


// --- MemberManagementSection (Original Structure, uses useFieldArray) ---
const MemberManagementSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const memberOptions = [{ value: '1', label: 'John Doe' }, { value: '2', label: 'Jane Smith' }]; // Example member IDs
    const designationOptions = [{ value: 'ceo', label: 'CEO' }, { value: 'manager', label: 'Manager' }];

    const { fields, append, remove } = useFieldArray({
        control: formMethods.control, // Use control from formMethods
        name: "members" // This should match the array name in your CompanyFormSchema
    });

    return (
        <Card id="memberManagement">
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">Member Management</h4>
                <div className="flex gap-2">
                    <Button type="button" size="sm" icon={<TbPlus />} onClick={() => append({ member: undefined, designation: undefined, person_name: '', contact_number: '' })}>
                        Add Member
                    </Button>
                     <Button type="button" size="sm" icon={<TbPlus />}>
                        <NavLink to="/business-entities/member-create">Create New Member</NavLink>
                    </Button>
                </div>
            </div>

            {fields.map((item, index) => (
                <Card key={item.id} className="mb-4 p-4 border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
                        <FormItem label="Member" invalid={!!errors.members?.[index]?.member} errorMessage={errors.members?.[index]?.member?.message as string}>
                            <Controller name={`members.${index}.member`} control={control} render={({ field }) => <Select placeholder="Select Member" options={memberOptions} {...field} />} />
                        </FormItem>
                        <FormItem label="Designation" invalid={!!errors.members?.[index]?.designation} errorMessage={errors.members?.[index]?.designation?.message as string}>
                            <Controller name={`members.${index}.designation`} control={control} render={({ field }) => <Select placeholder="Select Designation" options={designationOptions} {...field} />} />
                        </FormItem>
                        <FormItem label="Person Name" invalid={!!errors.members?.[index]?.person_name} errorMessage={errors.members?.[index]?.person_name?.message as string}>
                            <Controller name={`members.${index}.person_name`} control={control} render={({ field }) => <Input placeholder="Person Name" {...field} />} />
                        </FormItem>
                        <FormItem label="Contact Number" invalid={!!errors.members?.[index]?.contact_number} errorMessage={errors.members?.[index]?.contact_number?.message as string}>
                            <Controller name={`members.${index}.contact_number`} control={control} render={({ field }) => <Input type="tel" placeholder="Contact Number" {...field} />} />
                        </FormItem>
                        <div className="md:col-span-4 flex justify-end">
                             <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => remove(index)} danger />
                        </div>
                    </div>
                </Card>
            ))}
        </Card>
    );
};

// --- CompanyFormComponent (Main form structure) ---
type CompanyFormComponentProps = {
    onFormSubmit: (values: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => void;
    defaultValues?: Partial<CompanyFormSchema>;
    isEditMode?: boolean;
    onDiscard?: () => void;
    isSubmitting?: boolean;
};

const CompanyFormComponent = (props: CompanyFormComponentProps) => {
    const { onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting } = props;
    const [activeSection, setActiveSection] = useState<string>(companyNavigationList[0].link);

    const formMethods = useForm<CompanyFormSchema>({ 
        defaultValues: defaultValues || {},
    });
    const { handleSubmit, reset, formState: { errors }, control } = formMethods;

    useEffect(() => {
        const initialValues = defaultValues || {};
        // Ensure arrays are initialized for useFieldArray if not present in defaultValues
        const fullInitialValues: Partial<CompanyFormSchema> = {
            members: [], // Default to empty array for useFieldArray
            additional_bank_details: [], // Default for additional banks
            company_spot_verification_data: [], // Default for spot verification
            ...initialValues, // Spread incoming defaults, overwriting if present
        };
        
        if (!isEmpty(fullInitialValues) || !isEditMode) { // Reset if we have values or it's create mode
            reset(fullInitialValues);
        }
    }, [defaultValues, isEditMode, reset]);


    const internalFormSubmit = (values: CompanyFormSchema) => {
        console.log("Form Values before preparePayloadForApi:", values);
        onFormSubmit?.(values, formMethods);
    };

    const navigationKeys = companyNavigationList.map(item => item.link);
    const handleNext = () => {
        const currentIndex = navigationKeys.indexOf(activeSection);
        if (currentIndex < navigationKeys.length - 1) setActiveSection(navigationKeys[currentIndex + 1]);
    };
    const handlePrevious = () => {
        const currentIndex = navigationKeys.indexOf(activeSection);
        if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]);
    };

    const renderActiveSection = () => {
        // Pass formMethods to sections that might use useFieldArray
        const sectionProps = { errors, control, formMethods };
        switch (activeSection) {
            case "companyDetails": return <CompanyDetailsSection {...sectionProps} />;
            case "kycDocuments": return <KYCDetailSection {...sectionProps} />;
            case "bankDetails": return <BankDetailsSection {...sectionProps} />;
            case "accessibility": return <AccessibilitySection {...sectionProps} />;
            case "memberManagement": return <MemberManagementSection {...sectionProps} />;
            default: return <CompanyDetailsSection {...sectionProps} />;
        }
    };

    return (
        <>
            <div className="flex gap-1 items-end mb-3">
                <NavLink to="/business-entities/company">
                    <h6 className="font-semibold hover:text-primary-600">Company</h6>
                </NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary">
                    {isEditMode ? "Edit Company" : "Add New Company"}
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
                        {/* Removed Draft button to match original UI */}
                        <Button variant="solid" type="button" loading={isSubmitting} onClick={handleSubmit(internalFormSubmit)} disabled={isSubmitting}>
                            {isEditMode ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            </Card>
        </>
    );
};


// --- CompanyFormPage (Combined Add/Edit Page) ---
const CompanyCreate = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { companyId } = useParams<{ companyId?: string }>();
    const isEditMode = Boolean(companyId);

    const [initialData, setInitialData] = useState<Partial<CompanyFormSchema> | null>(null);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const getEmptyFormValues = (): Partial<CompanyFormSchema> => ({
        // Initialize all fields to default/empty to ensure controlled components
        // And ensure arrays are initialized for useFieldArray hooks
        name: '', company_primary_contact_number: '', primary_contact_country_code: '',company_profile_settings_id:'',
        alternate_contact_number: '', alternate_contact_country_code: '', company_primary_email_id: '',
        alternate_email_id: '', ownership_type: undefined, owner_director_proprietor_name: '',
        company_address: '', city: undefined, state: undefined, zip_postal_code: '', country: undefined,
        continent_name: undefined, gst_number: '', pan_number: '', trn_number: '', tan_number: '',
        company_establishment_year: '', no_of_employees: '', company_website: '',
        company_logo_brochure: undefined, primary_business_type: undefined, primary_business_category: undefined,
        certificate_name: '', upload_certificate: undefined,
        head_office: undefined, branches: '', branch_address: '', location_country: undefined,
        branch_state: undefined, branch_zip_code: '', branch_gst_reg_number: '',
        declaration_206ab: undefined, declaration_206ab_remark: '', declaration_206ab_remark_enabled: false,
        declaration_194q: undefined, declaration_194q_remark: '', declaration_194q_remark_enabled: false,
        office_photo: undefined, office_photo_remark: '', office_photo_remark_enabled: false,
        gst_certificate: undefined, gst_certificate_remark: '', gst_certificate_remark_enabled: false,
        authority_letter: undefined, authority_letter_remark: '', authority_letter_remark_enabled: false,
        visiting_card: undefined, visiting_card_remark: '', visiting_card_remark_enabled: false,
        cancel_cheque: undefined, cancel_cheque_remark: '', cancel_cheque_remark_enabled: false,
        aadhar_card: undefined, aadhar_card_remark: '', aadhar_card_remark_enabled: false,
        pan_card: undefined, pan_card_remark: '', pan_card_remark_enabled: false,
        other_document: undefined, other_document_remark: '', other_document_remark_enabled: false,
        primary_account_number: '', primary_bank_name: undefined, primary_ifsc_code: '',
        primary_bank_verification_photo: undefined,
        secondary_account_number: '', secondary_bank_name: undefined, secondary_ifsc_code: '',
        secondary_bank_verification_photo: undefined,
        additional_bank_details: [], // Initialize for useFieldArray
        KYC_FIELD: false, BILLING_FIELD: false, BILLING_PHOTOS_FIELD: null, DOMAIN_MANAGEMENT_FIELD: undefined,
        members: [], // Initialize for useFieldArray
        status: undefined, company_code: '', brands: '', category: '', interested_in: '',
        total_members: '', member_participation: '', success_score: '', trust_score: '', health_score: '',
        support_email: '', mobile: '', expiry_date: '', company_type: undefined,
        smtp_host: '', smtp_port: '', smtp_secure: undefined, smtp_username: '', smtp_password: '',
        smtp_name: '', smtp_email: '',
        facebook: '', instagram: '', linkedin: '', youtube: '', twitter: '',
        logo_for_meta: undefined, notification_email: '',
        company_spot_verification_data: [], // Initialize for potential data
    });


    useEffect(() => {
        const emptyForm = getEmptyFormValues();
        if (isEditMode && companyId) {
            const fetchCompanyData = async () => {
                setPageLoading(true);
                try {
                    // --- Replace with your actual API call ---
                    // const response = await getCompanyByIdService(companyId); 
                    // const apiData = response.data; 
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
                    const mockApiData: ApiSingleCompanyItem = { // Replace with actual fetched data
                        id: parseInt(companyId),
                        name: "Mock Edit Company LLC",
                        address: "123 Edit Lane", // Backend name 'address'
                        gst: "GSTEDITMOCK", // Backend name 'gst'
                        logo_url: "https://via.placeholder.com/150/FF0000/FFFFFF?Text=EditLogo",
                        // ... other fields based on ApiSingleCompanyItem
                        status: "Active",
                        kyc_verification: true,
                        billing_enabled: false,
                        members: [{member_id: "user1", name: "Alice E.", designation: "Manager", mobile: "5551234"}],
                        // ... populate more mock data to test transformation
                    };
                    // --- End Mock Data ---
                    
                    const transformed = transformApiToFormSchema(mockApiData);
                    setInitialData({ ...emptyForm, ...transformed }); 
                } catch (error: any) {
                    toast.push(<Notification type="danger" title="Fetch Error">{error.message || 'Error fetching company data.'}</Notification>);
                    navigate('/business-entities/company'); 
                } finally {
                    setPageLoading(false);
                }
            };
            fetchCompanyData();
        } else {
            setInitialData(emptyForm); 
            setPageLoading(false);
        }
    }, [companyId, isEditMode, navigate]);

    const handleFormSubmit = async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
        setIsSubmitting(true);
        const payload = preparePayloadForApi(formValues, isEditMode, initialData || {});
        
        // For debugging the FormData payload:
        // if (payload instanceof FormData) {
        //     console.log("--- FormData Payload ---");
        //     for (let [key, value] of payload.entries()) {
        //         console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
        //     }
        //     console.log("--- End FormData Payload ---");
        // }


        try {
            if (isEditMode && companyId) {
                // The 'id' is added to payload in preparePayloadForApi if needed by backend
                // Or it's often part of the URL for PUT/PATCH requests.
                // Ensure your editcompanyAction handles FormData correctly.
                await dispatch(editcompanyAction({payload})).unwrap(); 
                toast.push(<Notification type="success" title="Company Updated">Details updated successfully.</Notification>);
            } else {
                await dispatch(addcompanyAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Company Created">New company created successfully.</Notification>);
                formMethods.reset(getEmptyFormValues()); // Reset to clean slate for new creation
            }
            // navigate('/business-entities/company'); // Optional: navigate after successful save
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} company.`;
             if (error?.response?.data?.errors) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key) => {
                    // Attempt to map backend error key to frontend form field key if they differ
                    // This is a simple example; complex mapping might be needed
                    let formKey = key as keyof CompanyFormSchema;
                    if (key === 'address') formKey = 'company_address' as keyof CompanyFormSchema;
                    if (key === 'gst') formKey = 'gst_number' as keyof CompanyFormSchema;
                    // Add more mappings if backend validation keys differ from form schema keys
                    
                    formMethods.setError(formKey, {
                        type: 'manual',
                        message: validationErrors[key][0],
                    });
                });
                toast.push(<Notification type="danger" title="Validation Error">Please check the form fields.</Notification>);
            } else {
                toast.push(<Notification type="danger" title={`${isEditMode ? 'Update' : 'Creation'} Failed`}>{errorMessage}</Notification>);
            }
            console.error("Submit Company Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDiscardDialog = () => setDiscardConfirmationOpen(true);
    const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
    const handleConfirmDiscard = () => {
        closeDiscardDialog();
        navigate('/business-entities/company');
    };

    if (pageLoading) {
        return <Container className="h-full flex justify-center items-center"><p>Loading company details...</p></Container>;
    }
    // Ensure initialData is not null before rendering form, especially after async fetch
    if (!initialData) {
         return <Container className="h-full flex justify-center items-center"><p>Initializing form...</p></Container>;
    }

    return (
        <Container className="h-full">
            <Form onSubmit={(e) => e.preventDefault()} className="flex flex-col min-h-screen">
                <div className="flex-grow">
                    <CompanyFormComponent
                        onFormSubmit={handleFormSubmit}
                        defaultValues={initialData} // Pass the fully initialized or fetched data
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

export default CompanyCreate;