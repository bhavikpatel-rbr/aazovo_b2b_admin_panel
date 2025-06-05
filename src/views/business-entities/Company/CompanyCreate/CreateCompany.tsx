// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { useEffect, useState } from 'react';
import { Control, Controller, FieldErrors, UseFormReturn, useFieldArray, useForm } from 'react-hook-form';
import { NavLink, useLocation, useParams, useNavigate } from 'react-router-dom';

// UI Components
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Container from '@/components/shared/Container';
import NumericInput from '@/components/shared/NumericInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import { Form, FormItem } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Notification from '@/components/ui/Notification';
import Select from '@/components/ui/Select';
import toast from '@/components/ui/toast';

// Icons & Redux
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { addcompanyAction, editCompanyAction, getContinentsAction, getCountriesAction, getCompanyByIdAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import axiosInstance from '@/services/api/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { BiChevronRight } from 'react-icons/bi';
import { TbPlus, TbTrash } from 'react-icons/tb';
import { useSelector } from 'react-redux';
import { z } from 'zod';

// --- Type Definitions ---

interface MemberItem {
    member?: string | { label: string; value: string };
    designation?: string | { label: string; value: string };
    person_name?: string;
    contact_number?: string;
}

interface CompanySpotVerificationItemFE {
    spot_verification_status?: string | { label: string; value: string };
    verified_by?: string | { label: string; value: string };
    photo_upload?: File | string;
    reference_person_name?: string;
    reference_company_name?: string;
    reference_contact_number?: string;
    remarks?: string;
}

interface CompanyBankDetailItemFE {
    bank_account_number?: string;
    bank_name?: string | { label: string; value: string };
    ifsc_code?: string;
    bank_verification_photo?: File | string;
    type?: string | { label: string; value: string };
}


export interface CompanyFormSchema {
    id?: string | number;
    company_profile_settings_id?: any;

    name?: string;
    company_primary_contact_number?: string;
    primary_contact_country_code?: string;
    alternate_contact_number?: string;
    alternate_contact_country_code?: string;
    company_primary_email_id?: string;
    alternate_email_id?: string;
    ownership_type?: string | { label: string; value: string };
    owner_director_proprietor_name?: string;
    company_address?: string;
    city?: string | { label: string; value: string };
    state?: string | { label: string; value: string };
    zip_postal_code?: string;
    country?: string | { label: string; value: string };
    continent_name?: string | { label: string; value: string };
    gst_number?: string;
    pan_number?: string;
    trn_number?: string;
    tan_number?: string;
    company_establishment_year?: string;
    no_of_employees?: number | string;
    company_website?: string;
    company_logo_brochure?: File | string;
    primary_business_type?: string | { label: string; value: string };
    primary_business_category?: string | { label: string; value: string };

    certificate_name?: string;
    upload_certificate?: File | string;

    head_office?: string | { label: string; value: string };
    branches?: string;
    branch_address?: string;
    location_country?: string | { label: string; value: string };
    branch_state?: string | { label: string; value: string };
    branch_zip_code?: string;
    branch_gst_reg_number?: string;

    declaration_206ab?: File | string;
    declaration_206ab_remark?: string;
    declaration_206ab_remark_enabled?: boolean;
    declaration_194q?: File | string;
    declaration_194q_remark?: string;
    declaration_194q_remark_enabled?: boolean;
    office_photo?: File | string;
    office_photo_remark?: string;
    office_photo_remark_enabled?: boolean;
    gst_certificate?: File | string;
    gst_certificate_remark?: string;
    gst_certificate_remark_enabled?: boolean;
    authority_letter?: File | string;
    authority_letter_remark?: string;
    authority_letter_remark_enabled?: boolean;
    visiting_card?: File | string;
    visiting_card_remark?: string;
    visiting_card_remark_enabled?: boolean;
    cancel_cheque?: File | string;
    cancel_cheque_remark?: string;
    cancel_cheque_remark_enabled?: boolean;
    aadhar_card?: File | string;
    aadhar_card_remark?: string;
    aadhar_card_remark_enabled?: boolean;
    pan_card?: File | string;
    pan_card_remark?: string;
    pan_card_remark_enabled?: boolean;
    other_document?: File | string;
    other_document_remark?: string;
    other_document_remark_enabled?: boolean;

    primary_account_number?: string;
    primary_bank_name?: string | { label: string; value: string };
    primary_ifsc_code?: string;
    primary_bank_verification_photo?: File | string;
    secondary_account_number?: string;
    secondary_bank_name?: string | { label: string; value: string };
    secondary_ifsc_code?: string;
    secondary_bank_verification_photo?: File | string;
    additional_bank_details?: CompanyBankDetailItemFE[];

    KYC_FIELD?: boolean;
    BILLING_FIELD?: boolean;
    BILLING_PHOTOS_FIELD?: FileList | File | null | string;
    BILLING_DOCUMENT_NAME_FIELD?: string;
    DOMAIN_MANAGEMENT_FIELD?: string | { label: string; value: string };

    members?: MemberItem[];

    status?: string | { label: string, value: string };
    company_code?: string;
    brands?: string;
    category?: string;
    interested_in?: string;
    total_members?: number | string;
    member_participation?: number | string;
    success_score?: number | string;
    trust_score?: number | string;
    health_score?: number | string;
    support_email?: string;
    mobile?: string;
    expiry_date?: string;
    company_type?: string | { label: string; value: string };

    smtp_host?: string;
    smtp_port?: string;
    smtp_secure?: string | { label: string; value: string };
    smtp_username?: string;
    smtp_password?: string;
    smtp_name?: string;
    smtp_email?: string;

    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;

    logo_for_meta?: File | string;
    notification_email?: string;

    company_spot_verification_data?: CompanySpotVerificationItemFE[];
}


export interface FormSectionBaseProps {
    control: Control<CompanyFormSchema>;
    errors: FieldErrors<CompanyFormSchema>;
    formMethods: UseFormReturn<CompanyFormSchema>; // This provides access to getValues, watch, etc.
}

interface ApiSingleCompanyItem {
    id: number;
    name?: string;
    company_profile_settings_id?: any;
    status?: string;
    company_code?: string;
    company_primary_contact_number?: string;
    alternate_contact_number?: string;
    company_primary_email_id?: string;
    alternate_email_id?: string;
    ownership_type?: string;
    owner_director_proprietor_name?: string;
    address?: string;
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
    kyc_verification?: boolean | "Yes" | "No";
    billing_enabled?: boolean | "Yes" | "No";
    billing_photos_url?: string; // Can be a single URL string or comma-separated if multiple
    billing_document_name?: string;
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
    logo_url?: string;
    gst?: string;
    pan_number?: string;
    tan_number?: string;
    expiry_date?: string;
    company_type?: string;
    trn_number?: string;
    company_establishment_year?: string;
    no_of_employees?: number;
    company_website?: string;
    primary_business_type?: string;
    primary_business_category?: string;
    smtp_host?: string; smtp_port?: string; smtp_secure?: string; smtp_username?: string; smtp_password?: string; smtp_name?: string; smtp_email?: string;
    facebook?: string; instagram?: string; linkedin?: string; youtube?: string; twitter?: string;
    logo_for_meta_url?: string;
    notification_email?: string;

    declaration_206AB_url?: string; declaration_206AB_verify?: boolean | string; declaration_206AB_remark?: string;
    declaration_194Q_url?: string; declaration_194Q_verify?: boolean | string; declaration_194Q_remark?: string;
    office_photo_url?: string; office_photo_verify?: boolean | string; office_photo_remark?: string;
    gst_certificate_url?: string; gst_certificate_verify?: boolean | string; gst_certificate_remark?: string;
    authority_letter_url?: string; authority_letter_verify?: boolean | string; authority_letter_remark?: string;
    visiting_card_url?: string; visiting_card_verify?: boolean | string; visiting_card_remark?: string;
    cancel_cheque_url?: string; cancel_cheque_verify?: boolean | string; cancel_cheque_remark?: string;
    aadhar_card_url?: string; aadhar_card_verify?: boolean | string; aadhar_card_remark?: string;
    pan_card_url?: string; pan_card_verify?: boolean | string; pan_card_remark?: string;
    other_document_url?: string; other_document_verify?: boolean | string; other_document_remark?: string;

    company_spot_verification?: any[];
    company_members?: any[];
    company_bank_details?: any[];
    company_branches?: any[];
    company_certificate?: any[];
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (apiData: ApiSingleCompanyItem): Partial<CompanyFormSchema> => {
    const kycVerifyToBoolean = (verifyValue?: boolean | string): boolean => {
        if (typeof verifyValue === 'string') {
            return verifyValue.toLowerCase() === 'yes' || verifyValue === '1' || verifyValue.toLowerCase() === 'true' || verifyValue.toLowerCase() === 'test';
        }
        return !!verifyValue;
    };

    return {
        id: apiData.id,
        company_profile_settings_id: apiData.company_profile_settings_id,
        name: apiData.name,
        company_primary_contact_number: apiData.company_primary_contact_number,
        alternate_contact_number: apiData.alternate_contact_number,
        company_primary_email_id: apiData.company_primary_email_id,
        alternate_email_id: apiData.alternate_email_id,
        ownership_type: apiData.ownership_type ? { label: apiData.ownership_type, value: apiData.ownership_type } : undefined,
        owner_director_proprietor_name: apiData.owner_director_proprietor_name,
        company_address: apiData.address,
        city: apiData.city ? { label: apiData.city, value: apiData.city } : undefined,
        state: apiData.state ? { label: apiData.state, value: apiData.state } : undefined,
        zip_postal_code: apiData.zip_postal_code,
        country: apiData.country ? { label: apiData.country, value: apiData.country } : undefined,
        continent_name: apiData.continent_name ? { label: apiData.continent_name, value: apiData.continent_name } : undefined,
        gst_number: apiData.gst,
        pan_number: apiData.pan_number,
        trn_number: apiData.trn_number,
        tan_number: apiData.tan_number,
        company_establishment_year: apiData.company_establishment_year,
        no_of_employees: apiData.no_of_employees,
        company_website: apiData.company_website,
        company_logo_brochure: apiData.logo_url,
        primary_business_type: apiData.primary_business_type ? { label: apiData.primary_business_type, value: apiData.primary_business_type } : undefined,
        primary_business_category: apiData.primary_business_category ? { label: apiData.primary_business_category, value: apiData.primary_business_category } : undefined,

        certificate_name: apiData.company_certificate?.[0]?.certificate_name,
        upload_certificate: apiData.company_certificate?.[0]?.upload_certificate_url || apiData.company_certificate?.[0]?.upload_certificate,

        head_office: apiData.company_branches?.[0]?.office_type ? { label: apiData.company_branches?.[0]?.office_type, value: apiData.company_branches?.[0]?.office_type } : undefined,
        branches: apiData.company_branches?.[0]?.branch_name,
        branch_address: apiData.company_branches?.[0]?.branch_address,
        location_country: apiData.company_branches?.[0]?.location_country ? { label: apiData.company_branches?.[0]?.location_country, value: apiData.company_branches?.[0]?.location_country } : undefined,
        branch_state: apiData.company_branches?.[0]?.branch_state ? { label: apiData.company_branches?.[0]?.branch_state, value: apiData.company_branches?.[0]?.branch_state } : undefined,
        branch_zip_code: apiData.company_branches?.[0]?.branch_zip_code,
        branch_gst_reg_number: apiData.company_branches?.[0]?.branch_gst_reg_number,

        declaration_206ab: apiData.declaration_206AB_url,
        declaration_206ab_remark_enabled: kycVerifyToBoolean(apiData.declaration_206AB_verify),
        declaration_206ab_remark: apiData.declaration_206AB_remark,
        declaration_194q: apiData.declaration_194Q_url,
        declaration_194q_remark_enabled: kycVerifyToBoolean(apiData.declaration_194Q_verify),
        declaration_194q_remark: apiData.declaration_194Q_remark,
        office_photo: apiData.office_photo_url,
        office_photo_remark_enabled: kycVerifyToBoolean(apiData.office_photo_verify),
        office_photo_remark: apiData.office_photo_remark,
        gst_certificate: apiData.gst_certificate_url,
        gst_certificate_remark_enabled: kycVerifyToBoolean(apiData.gst_certificate_verify),
        gst_certificate_remark: apiData.gst_certificate_remark,
        authority_letter: apiData.authority_letter_url,
        authority_letter_remark_enabled: kycVerifyToBoolean(apiData.authority_letter_verify),
        authority_letter_remark: apiData.authority_letter_remark,
        visiting_card: apiData.visiting_card_url,
        visiting_card_remark_enabled: kycVerifyToBoolean(apiData.visiting_card_verify),
        visiting_card_remark: apiData.visiting_card_remark,
        cancel_cheque: apiData.cancel_cheque_url,
        cancel_cheque_remark_enabled: kycVerifyToBoolean(apiData.cancel_cheque_verify),
        cancel_cheque_remark: apiData.cancel_cheque_remark,
        aadhar_card: apiData.aadhar_card_url,
        aadhar_card_remark_enabled: kycVerifyToBoolean(apiData.aadhar_card_verify),
        aadhar_card_remark: apiData.aadhar_card_remark,
        pan_card: apiData.pan_card_url,
        pan_card_remark_enabled: kycVerifyToBoolean(apiData.pan_card_verify),
        pan_card_remark: apiData.pan_card_remark,
        other_document: apiData.other_document_url,
        other_document_remark_enabled: kycVerifyToBoolean(apiData.other_document_verify),
        other_document_remark: apiData.other_document_remark,

        primary_account_number: apiData.primary_bank_account_number,
        primary_bank_name: apiData.primary_bank_name ? { label: apiData.primary_bank_name, value: apiData.primary_bank_name } : undefined,
        primary_ifsc_code: apiData.primary_ifsc_code,
        primary_bank_verification_photo: apiData.primary_bank_verification_photo_url,
        secondary_account_number: apiData.secondary_bank_account_number,
        secondary_bank_name: apiData.secondary_bank_name ? { label: apiData.secondary_bank_name, value: apiData.secondary_bank_name } : undefined,
        secondary_ifsc_code: apiData.secondary_ifsc_code,
        secondary_bank_verification_photo: apiData.secondary_bank_verification_photo_url,
        additional_bank_details: apiData.company_bank_details?.map(b => ({
            bank_account_number: b.bank_account_number,
            bank_name: b.bank_name ? { label: String(b.bank_name), value: String(b.bank_name) } : undefined,
            ifsc_code: b.ifsc_code,
            type: b.type ? { label: String(b.type), value: String(b.type) } : undefined,
            bank_verification_photo: b.primary_bank_verification_photo_url || b.bank_verification_photo,
        })),

        KYC_FIELD: kycVerifyToBoolean(apiData.kyc_verification),
        BILLING_FIELD: kycVerifyToBoolean(apiData.billing_enabled),
        BILLING_PHOTOS_FIELD: apiData.billing_photos_url,
        BILLING_DOCUMENT_NAME_FIELD: apiData.billing_document_name,
        DOMAIN_MANAGEMENT_FIELD: apiData.domain_id ? { label: apiData.domain_id, value: apiData.domain_id } : undefined,

        members: apiData.company_members?.map(m => ({
            member: m.member_id ? { label: `Member ${m.member_id}`, value: String(m.member_id) } : undefined,
            designation: m.designation ? { label: String(m.designation), value: String(m.designation) } : undefined,
            person_name: m.name,
            contact_number: m.mobile,
        })),

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
        smtp_secure: apiData.smtp_secure ? { label: apiData.smtp_secure, value: apiData.smtp_secure } : undefined,
        smtp_username: apiData.smtp_username, smtp_password: apiData.smtp_password, smtp_name: apiData.smtp_name, smtp_email: apiData.smtp_email,
        facebook: apiData.facebook, instagram: apiData.instagram, linkedin: apiData.linkedin, youtube: apiData.youtube, twitter: apiData.twitter,
        logo_for_meta: apiData.logo_for_meta_url,
        notification_email: apiData.notification_email,

        company_spot_verification_data: apiData.company_spot_verification?.map(item => ({
            ...item,
            spot_verification_status: item.spot_verification_status && typeof item.spot_verification_status === 'string' ? { label: item.spot_verification_status, value: item.spot_verification_status } : item.spot_verification_status,
            verified_by: item.verified_by && typeof item.verified_by === 'string' ? { label: item.verified_by, value: item.verified_by } : item.verified_by,
            photo_upload: (item as any).photo_upload_url || item.photo_upload,
        })),
    };
};


// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (formData: CompanyFormSchema, isEditMode: boolean, originalData?: Partial<CompanyFormSchema>): FormData => {
    const apiPayload = new FormData();
    let dataToProcess: any = { ...formData };

    if (dataToProcess.id && isEditMode) {
        apiPayload.append('id', String(dataToProcess.id));
    }

    const appendField = (backendKey: string, formValue: any, isFileKey = false) => {
        if (formValue instanceof File) {
            apiPayload.append(backendKey, formValue);
        } else if (formValue instanceof FileList) {
            if (formValue.length > 0) {
                if (backendKey === 'billing_photos') { // Special handling for billing_photos (single file expected by backend)
                    apiPayload.append(backendKey, formValue[0]);
                } else {
                    for (let i = 0; i < formValue.length; i++) {
                        apiPayload.append(`${backendKey}[]`, formValue[i]);
                    }
                }
            } else if (!isFileKey) { // Only append empty string if not a file key and FileList is empty
                apiPayload.append(backendKey, '');
            }
        } else if (typeof formValue === 'object' && formValue !== null && 'value' in formValue) {
            const val = formValue.value;
            apiPayload.append(backendKey, (val !== null && val !== undefined) ? String(val) : '');
        } else if (typeof formValue === 'boolean') {
            apiPayload.append(backendKey, formValue ? '1' : '0');
        } else if (formValue !== undefined && formValue !== null) {
            apiPayload.append(backendKey, String(formValue));
        } else if (!isFileKey) { // Append empty string for non-file keys if value is undefined or null
            apiPayload.append(backendKey, '');
        }
        // If isFileKey is true and formValue is not File or FileList, nothing is appended (correct for optional files)
    };

    // Append other fields (condensed for brevity, keep your existing appends here)
    appendField('name', dataToProcess.name);
    appendField('address', dataToProcess.company_address);
    appendField('support_email', dataToProcess.support_email);
    // ... (all other non-bank fields) ...
    appendField('status', dataToProcess.status);
    appendField('company_code', dataToProcess.company_code);
    appendField('country', dataToProcess.country);
    appendField('brands', dataToProcess.brands);
    appendField('category', dataToProcess.category);
    appendField('interested_in', dataToProcess.interested_in);
    appendField('total_members', dataToProcess.total_members);
    appendField('member_participation', dataToProcess.member_participation);
    appendField('success_score', dataToProcess.success_score);
    appendField('trust_score', dataToProcess.trust_score);
    appendField('health_score', dataToProcess.health_score);
    appendField('company_primary_contact_number', dataToProcess.company_primary_contact_number);
    appendField('alternate_contact_number', dataToProcess.alternate_contact_number);
    appendField('company_primary_email_id', dataToProcess.company_primary_email_id);
    appendField('alternate_email_id', dataToProcess.alternate_email_id);
    appendField('ownership_type', dataToProcess.ownership_type);
    appendField('owner_director_proprietor_name', dataToProcess.owner_director_proprietor_name);
    appendField('city', dataToProcess.city);
    appendField('state', dataToProcess.state);
    appendField('zip_postal_code', dataToProcess.zip_postal_code);
    appendField('continent_name', dataToProcess.continent_name);
    appendField('pan_number', dataToProcess.pan_number);
    appendField('tan_number', dataToProcess.tan_number);
    appendField('trn_number', dataToProcess.trn_number);
    appendField('company_establishment_year', dataToProcess.company_establishment_year);
    appendField('no_of_employees', dataToProcess.no_of_employees);
    appendField('company_website', dataToProcess.company_website);
    appendField('primary_business_type', dataToProcess.primary_business_type);
    appendField('primary_business_category', dataToProcess.primary_business_category);
    appendField('expiry_date', dataToProcess.expiry_date);
    appendField('company_type', dataToProcess.company_type);
    appendField('smtp_host', dataToProcess.smtp_host);
    appendField('smtp_port', dataToProcess.smtp_port);
    appendField('smtp_secure', dataToProcess.smtp_secure);
    appendField('smtp_username', dataToProcess.smtp_username);
    appendField('smtp_password', dataToProcess.smtp_password);
    appendField('smtp_name', dataToProcess.smtp_name);
    appendField('smtp_email', dataToProcess.smtp_email);
    appendField('facebook', dataToProcess.facebook);
    appendField('instagram', dataToProcess.instagram);
    appendField('linkedin', dataToProcess.linkedin);
    appendField('youtube', dataToProcess.youtube);
    appendField('twitter', dataToProcess.twitter);
    appendField('notification_email', dataToProcess.notification_email);

    appendField('kyc_verification', dataToProcess.KYC_FIELD);
    appendField('billing_enabled', dataToProcess.BILLING_FIELD);
    appendField('billing_document_name', dataToProcess.BILLING_DOCUMENT_NAME_FIELD);
    appendField('billing_document', dataToProcess.BILLING_PHOTOS_FIELD, true); // isFileKey = true
    appendField('domain_id', dataToProcess.DOMAIN_MANAGEMENT_FIELD);
    
    appendField('certificate_name', dataToProcess.certificate_name || '');
    if (dataToProcess.upload_certificate instanceof File) {
        apiPayload.append('upload_certificate', dataToProcess.upload_certificate);
    }

    appendField('company_profile_settings_id', dataToProcess.company_profile_settings_id);
    appendField('logo', dataToProcess.company_logo_brochure, true); // isFileKey = true
    appendField('logo_for_meta', dataToProcess.logo_for_meta, true); // isFileKey = true
    
    // --- Consolidated Bank Details ---
    const allBankDetailsForApi: Array<{
        bank_account_number: string;
        bank_name: string;
        ifsc_code: string;
        type: string;
        photo_to_upload?: File | string; // Can be File for new/changed, string for existing URL (though we only send File)
    }> = [];

    // Primary Bank Details
    if (dataToProcess.primary_account_number || dataToProcess.primary_bank_name || dataToProcess.primary_ifsc_code || dataToProcess.primary_bank_verification_photo) {
        const bankNameVal = (typeof dataToProcess.primary_bank_name === 'object' && dataToProcess.primary_bank_name?.value)
            ? dataToProcess.primary_bank_name.value
            : dataToProcess.primary_bank_name;
        allBankDetailsForApi.push({
            bank_account_number: dataToProcess.primary_account_number || '',
            bank_name: bankNameVal ? String(bankNameVal) : '',
            ifsc_code: dataToProcess.primary_ifsc_code || '',
            photo_to_upload: dataToProcess.primary_bank_verification_photo,
            type: 'Primary'
        });
    }

    // Secondary Bank Details
    if (dataToProcess.secondary_account_number || dataToProcess.secondary_bank_name || dataToProcess.secondary_ifsc_code || dataToProcess.secondary_bank_verification_photo) {
        const bankNameVal = (typeof dataToProcess.secondary_bank_name === 'object' && dataToProcess.secondary_bank_name?.value)
            ? dataToProcess.secondary_bank_name.value
            : dataToProcess.secondary_bank_name;
        allBankDetailsForApi.push({
            bank_account_number: dataToProcess.secondary_account_number || '',
            bank_name: bankNameVal ? String(bankNameVal) : '',
            ifsc_code: dataToProcess.secondary_ifsc_code || '',
            photo_to_upload: dataToProcess.secondary_bank_verification_photo,
            type: 'Secondary'
        });
    }

    // Additional Bank Details from the form's field array
    if (dataToProcess.additional_bank_details && Array.isArray(dataToProcess.additional_bank_details)) {
        dataToProcess.additional_bank_details.forEach((bank: CompanyBankDetailItemFE) => {
            // Ensure there's some data to avoid sending completely empty entries
            if (bank.bank_account_number || bank.bank_name || bank.ifsc_code || bank.bank_verification_photo) {
                const bankNameVal = (typeof bank.bank_name === 'object' && bank.bank_name?.value) ? bank.bank_name.value : bank.bank_name;
                const typeVal = (typeof bank.type === 'object' && bank.type?.value) ? bank.type.value : (bank.type || 'Other'); // Default to 'Other'
                allBankDetailsForApi.push({
                    bank_account_number: bank.bank_account_number || '',
                    bank_name: bankNameVal ? String(bankNameVal) : '',
                    ifsc_code: bank.ifsc_code || '',
                    photo_to_upload: bank.bank_verification_photo,
                    type: typeVal ? String(typeVal) : 'Other'
                });
            }
        });
    }

    // Now append all collected bank details to the FormData
    if (allBankDetailsForApi.length > 0) {
        allBankDetailsForApi.forEach(bank => {
            apiPayload.append(`company_bank_details[bank_account_number][]`, bank.bank_account_number);
            apiPayload.append(`company_bank_details[bank_name][]`, bank.bank_name);
            apiPayload.append(`company_bank_details[ifsc_code][]`, bank.ifsc_code);
            apiPayload.append(`company_bank_details[type][]`, bank.type);
            if (bank.photo_to_upload instanceof File) {
                // Use the key 'primary_bank_verification_photo' as per existing additional bank details loop
                apiPayload.append(`company_bank_details[primary_bank_verification_photo][]`, bank.photo_to_upload);
            }
            // If photo_to_upload is a string (URL) or undefined, we don't re-send it unless it's a new File.
            // If backend requires placeholders for files not being sent, an else condition to append '' might be needed here.
            // However, the current code for additional_bank_details was already conditional, suggesting this is fine.
        });
    } else {
        // If there are absolutely no bank details, send empty arrays to satisfy API structure if needed.
        apiPayload.append(`company_bank_details[bank_account_number][]`, '');
        apiPayload.append(`company_bank_details[bank_name][]`, '');
        apiPayload.append(`company_bank_details[ifsc_code][]`, '');
        apiPayload.append(`company_bank_details[type][]`, '');
        // No need to append for `primary_bank_verification_photo[]` if no banks.
    }
    // REMOVE THE OLD SINGLE FIELDS FOR BANK DETAILS
    // The appendField calls for primary_bank_account_number etc. were already removed/commented out or should be.
    // Ensure these are not called anymore:
    // appendField('primary_bank_account_number', dataToProcess.primary_account_number);
    // appendField('primary_bank_name', dataToProcess.primary_bank_name);
    // appendField('primary_ifsc_code', dataToProcess.primary_ifsc_code);
    // appendField('primary_bank_verification_photo', dataToProcess.primary_bank_verification_photo, true);
    // appendField('secondary_bank_account_number', dataToProcess.secondary_account_number);
    // appendField('secondary_bank_name', dataToProcess.secondary_bank_name);
    // appendField('secondary_ifsc_code', dataToProcess.secondary_ifsc_code);
    // appendField('secondary_bank_verification_photo', dataToProcess.secondary_bank_verification_photo, true);


    const hasBranchData = dataToProcess.head_office || dataToProcess.branches || dataToProcess.branch_address || dataToProcess.location_country || dataToProcess.branch_state || dataToProcess.branch_zip_code || dataToProcess.branch_gst_reg_number;
    if (hasBranchData) {
        const officeTypeVal = (typeof dataToProcess.head_office === 'object' && dataToProcess.head_office?.value) ? dataToProcess.head_office.value : dataToProcess.head_office;
        const locationCountryVal = (typeof dataToProcess.location_country === 'object' && dataToProcess.location_country?.value) ? dataToProcess.location_country.value : dataToProcess.location_country;
        const branchStateVal = (typeof dataToProcess.branch_state === 'object' && dataToProcess.branch_state?.value) ? dataToProcess.branch_state.value : dataToProcess.branch_state;
        apiPayload.append(`company_branches[head_office][]`, String(officeTypeVal).toLowerCase().includes('head office') ? (officeTypeVal || 'head office') : '');
        apiPayload.append(`company_branches[office_type][]`, officeTypeVal ? String(officeTypeVal) : '');
        apiPayload.append(`company_branches[location_country][]`, locationCountryVal ? String(locationCountryVal) : '');
        apiPayload.append(`company_branches[branch_state][]`, branchStateVal ? String(branchStateVal) : '');
        apiPayload.append(`company_branches[branch_zip_code][]`, dataToProcess.branch_zip_code || '');
        apiPayload.append(`company_branches[branch_address][]`, dataToProcess.branch_address || '');
        apiPayload.append(`company_branches[branch_gst_reg_number][]`, dataToProcess.branch_gst_reg_number || '');
    } else {
        apiPayload.append(`company_branches[head_office][]`, '');
        apiPayload.append(`company_branches[office_type][]`, '');
        apiPayload.append(`company_branches[location_country][]`, '');
        apiPayload.append(`company_branches[branch_state][]`, '');
        apiPayload.append(`company_branches[branch_zip_code][]`, '');
        apiPayload.append(`company_branches[branch_address][]`, '');
        apiPayload.append(`company_branches[branch_gst_reg_number][]`, '');
    }

    if (dataToProcess.company_spot_verification_data && Array.isArray(dataToProcess.company_spot_verification_data) && dataToProcess.company_spot_verification_data.length > 0) {
        dataToProcess.company_spot_verification_data.forEach((item: CompanySpotVerificationItemFE) => {
            const status = (typeof item.spot_verification_status === 'object' && item.spot_verification_status?.value) ? item.spot_verification_status.value : item.spot_verification_status;
            const verifiedBy = (typeof item.verified_by === 'object' && item.verified_by?.value) ? item.verified_by.value : item.verified_by;
            apiPayload.append(`company_spot_verification[spot_verification_status][]`, status ? String(status) : '');
            apiPayload.append(`company_spot_verification[verified_by][]`, verifiedBy ? String(verifiedBy) : '');
            apiPayload.append(`company_spot_verification[reference_person_name][]`, item.reference_person_name || '');
            apiPayload.append(`company_spot_verification[reference_company_name][]`, item.reference_company_name || '');
            apiPayload.append(`company_spot_verification[reference_contact_number][]`, item.reference_contact_number || '');
            apiPayload.append(`company_spot_verification[remarks][]`, item.remarks || '');
            if (item.photo_upload instanceof File) {
                apiPayload.append(`company_spot_verification[photo_upload][]`, item.photo_upload);
            }
        });
    } else {
        apiPayload.append(`company_spot_verification[spot_verification_status][]`, '');
        apiPayload.append(`company_spot_verification[verified_by][]`, '');
        apiPayload.append(`company_spot_verification[reference_person_name][]`, '');
        apiPayload.append(`company_spot_verification[reference_company_name][]`, '');
        apiPayload.append(`company_spot_verification[reference_contact_number][]`, '');
        apiPayload.append(`company_spot_verification[remarks][]`, '');
    }

    const kycDocsConfig = [
        { feFile: 'declaration_206ab', beFile: 'declaration_206AB', feVerify: 'declaration_206ab_remark_enabled', beVerify: 'declaration_206AB_verify', feRemark: 'declaration_206ab_remark', beRemark: 'declaration_206AB_remark' },
        { feFile: 'declaration_194q', beFile: 'declaration_194Q', feVerify: 'declaration_194q_remark_enabled', beVerify: 'declaration_194Q_verify', feRemark: 'declaration_194q_remark', beRemark: 'declaration_194Q_remark' },
        { feFile: 'office_photo', beFile: 'office_photo', feVerify: 'office_photo_remark_enabled', beVerify: 'office_photo_verify', feRemark: 'office_photo_remark', beRemark: 'office_photo_remark' },
        { feFile: 'gst_certificate', beFile: 'gst_certificate', feVerify: 'gst_certificate_remark_enabled', beVerify: 'gst_certificate_verify', feRemark: 'gst_certificate_remark', beRemark: 'gst_certificate_remark' },
        { feFile: 'authority_letter', beFile: 'authority_letter', feVerify: 'authority_letter_remark_enabled', beVerify: 'authority_letter_verify', feRemark: 'authority_letter_remark', beRemark: 'authority_letter_remark' },
        { feFile: 'visiting_card', beFile: 'visiting_card', feVerify: 'visiting_card_remark_enabled', beVerify: 'visiting_card_verify', feRemark: 'visiting_card_remark', beRemark: 'visiting_card_remark' },
        { feFile: 'cancel_cheque', beFile: 'cancel_cheque', feVerify: 'cancel_cheque_remark_enabled', beVerify: 'cancel_cheque_verify', feRemark: 'cancel_cheque_remark', beRemark: 'cancel_cheque_remark' },
        { feFile: 'aadhar_card', beFile: 'aadhar_card', feVerify: 'aadhar_card_remark_enabled', beVerify: 'aadhar_card_verify', feRemark: 'aadhar_card_remark', beRemark: 'aadhar_card_remark' },
        { feFile: 'pan_card', beFile: 'pan_card', feVerify: 'pan_card_remark_enabled', beVerify: 'pan_card_verify', feRemark: 'pan_card_remark', beRemark: 'pan_card_remark' },
        { feFile: 'other_document', beFile: 'other_document', feVerify: 'other_document_remark_enabled', beVerify: 'other_document_verify', feRemark: 'other_document_remark', beRemark: 'other_document_remark' },
    ];
    kycDocsConfig.forEach(doc => {
        if (dataToProcess[doc.feFile] instanceof File) {
            apiPayload.append(doc.beFile, dataToProcess[doc.feFile]);
        }
        if (doc.beVerify === 'declaration_206AB_verify' && String(dataToProcess[doc.feRemark]).toLowerCase() === 'test' && dataToProcess[doc.feVerify]) {
             apiPayload.append(doc.beVerify, 'test');
        } else {
            apiPayload.append(doc.beVerify, dataToProcess[doc.feVerify] ? '1' : ''); // Send '1' or empty string
        }
        const remarkValue = dataToProcess[doc.feRemark];
        apiPayload.append(doc.beRemark, (remarkValue !== undefined && remarkValue !== null) ? String(remarkValue) : '');
    });

    if (dataToProcess.members && Array.isArray(dataToProcess.members) && dataToProcess.members.length > 0) {
        dataToProcess.members.forEach((member: MemberItem) => {
            const memberId = (typeof member.member === 'object' && member.member?.value) ? member.member.value : member.member;
            const designation = (typeof member.designation === 'object' && member.designation?.value) ? member.designation.value : member.designation;
            apiPayload.append(`company_members[member_id][]`, memberId ? String(memberId) : '');
            apiPayload.append(`company_members[designation][]`, designation ? String(designation) : '');
            apiPayload.append(`company_members[name][]`, member.person_name || '');
            apiPayload.append(`company_members[mobile][]`, member.contact_number || '');
        });
    } else {
        apiPayload.append(`company_members[member_id][]`, '');
        apiPayload.append(`company_members[designation][]`, '');
        apiPayload.append(`company_members[name][]`, '');
        apiPayload.append(`company_members[mobile][]`, '');
    }
    
    // The additional_bank_details loop is now replaced by the allBankDetailsForApi loop above.

    return apiPayload;
};


// --- Navigator Component ---
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


// --- CompanyDetails Section ---
const CompanyDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => { // Added formMethods
    const { CountriesData = [], ContinentsData = [] } = useSelector(masterSelector);
    const { getValues, watch } = formMethods; // Use getValues from formMethods

    const countryOptions = CountriesData.map((value: any) => ({ value: value.id, label: value.name }));
    const stateOptions = [{ value: 'MH', label: 'Maharashtra' }, { value: 'CA', label: 'California' }];
    const cityOptions = [{ value: 'Mumbai', label: 'Mumbai' }, { value: 'Los Angeles', label: 'Los Angeles' }];
    const continentOptions = ContinentsData.map((value: any) => ({ value: value.id, label: value.name }));
    const ownershipTypeOptions = [{ value: 'private_limited', label: 'Private Limited' }, { value: 'llp', label: 'LLP' }];
    const primaryBusinessTypeOptions = [{ value: 'manufacturer', label: 'Manufacturer' }, { value: 'service', label: 'Service' }];
    const primaryBusinessCategoryOptions = [{ value: 'electronics', label: 'Electronics' }, { value: 'software', label: 'Software' }];
    const officeTypeOptions = [{ label: "Head Office", value: "Head Office" }, { label: "Branch", value: "Branch" }];
    const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
    const companyTypeOptions = [{ value: 'TypeA', label: 'Type A' }, { value: 'TypeB', label: 'Type B' }];

    const companyLogoBrochureValue = watch('company_logo_brochure'); // For reactive preview
    const logoForMetaValue = watch('logo_for_meta');
    const uploadCertificateValue = watch('upload_certificate');


    return (
        <Card id="companyDetails">
            <h4 className="mb-4">Primary Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <FormItem label="Company Name" invalid={!!errors.name} errorMessage={errors.name?.message as string}>
                    <Controller name="name" control={control} render={({ field }) => <Input placeholder="Company Name" {...field} />} />
                </FormItem>
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
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                    />
                    {typeof companyLogoBrochureValue === 'string' && companyLogoBrochureValue && <img src={companyLogoBrochureValue} alt="logo preview" className="mt-2 h-16 w-auto" />}
                </FormItem>
                <FormItem label="Primary Business Type" invalid={!!errors.primary_business_type} errorMessage={errors.primary_business_type?.message as string}>
                    <Controller name="primary_business_type" control={control} render={({ field }) => <Select placeholder="Select Business Type" options={primaryBusinessTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Primary Business Category" invalid={!!errors.primary_business_category} errorMessage={errors.primary_business_category?.message as string}>
                    <Controller name="primary_business_category" control={control} render={({ field }) => <Select placeholder="Select Category" options={primaryBusinessCategoryOptions} {...field} />} />
                </FormItem>
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
                     {typeof logoForMetaValue === 'string' && logoForMetaValue && <img src={logoForMetaValue} alt="meta logo preview" className="mt-2 h-16 w-auto" />}
                </FormItem>
                <FormItem label="Brands"><Controller name="brands" control={control} render={({ field }) => <Input placeholder="Brands" {...field} />} /></FormItem>
                <FormItem label="Category (General)"><Controller name="category" control={control} render={({ field }) => <Input placeholder="General Category" {...field} />} /></FormItem>
                <FormItem label="Interested In"><Controller name="interested_in" control={control} render={({ field }) => <Input placeholder="Interested In" {...field} />} /></FormItem>
                <FormItem label="Total Members"><Controller name="total_members" control={control} render={({ field }) => <NumericInput placeholder="e.g., 50" {...field} onChange={val => field.onChange(val)} />} /></FormItem>
                <FormItem label="Member Participation"><Controller name="member_participation" control={control} render={({ field }) => <Input placeholder="e.g., 80%" {...field} />} /></FormItem>
                <FormItem label="Success Score"><Controller name="success_score" control={control} render={({ field }) => <NumericInput placeholder="e.g., 90" {...field} onChange={val => field.onChange(val)} />} /></FormItem>
                <FormItem label="Trust Score"><Controller name="trust_score" control={control} render={({ field }) => <NumericInput placeholder="e.g., 85" {...field} onChange={val => field.onChange(val)} />} /></FormItem>
                <FormItem label="Health Score"><Controller name="health_score" control={control} render={({ field }) => <NumericInput placeholder="e.g., 95" {...field} onChange={val => field.onChange(val)} />} /></FormItem>
                <FormItem label="General Mobile"><Controller name="mobile" control={control} render={({ field }) => <Input placeholder="Company Mobile" {...field} />} /></FormItem>
                <FormItem label="Expiry Date"><Controller name="expiry_date" control={control} render={({ field }) => <Input type="date" placeholder="YYYY-MM-DD" {...field} />} /></FormItem>
                <FormItem label="Notification Email"><Controller name="notification_email" control={control} render={({ field }) => <Input type="email" placeholder="notifications@example.com" {...field} />} /></FormItem>
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Certificates (Single Entry UI)</h4>
            <div className="grid md:grid-cols-7 gap-3 items-end">
                <FormItem label="Certificate Name" className="col-span-3" invalid={!!errors.certificate_name} errorMessage={errors.certificate_name?.message as string}>
                    <Controller name="certificate_name" control={control} render={({ field }) => <Input placeholder="e.g., ISO 9001" {...field} />} />
                </FormItem>
                <FormItem label="Upload Certificate" className="col-span-3" invalid={!!errors.upload_certificate} errorMessage={errors.upload_certificate?.message as string}>
                    <Controller name="upload_certificate" control={control}
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                    />
                    {typeof uploadCertificateValue === 'string' && uploadCertificateValue &&
                        <a href={uploadCertificateValue} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 inline-block">View Uploaded Certificate</a>
                    }
                </FormItem>
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Office Information (Single Entry UI)</h4>
            <div className="grid md:grid-cols-2 gap-3">
                <FormItem label="Office Type" invalid={!!errors.head_office} errorMessage={errors.head_office?.message as string}>
                    <Controller name="head_office" control={control} render={({ field }) => <Select placeholder="Select Office Type" options={officeTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Office Name (Optional UI field)" invalid={!!errors.branches} errorMessage={errors.branches?.message as string}>
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
        </Card>
    );
};

// --- KYCDetailSection ---
const KYCDetailSection = ({ control, errors, formMethods }: FormSectionBaseProps) => { // Added formMethods
    const { watch } = formMethods; // Use watch from formMethods

    const kycDocs = [
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
                     const isVerified = watch(doc.enabledName);
                     const fileValue = watch(doc.name);
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
                                {typeof fileValue === 'string' && fileValue &&
                                    <a href={fileValue} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 inline-block">View Uploaded</a>
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
                                            disabled={!isVerified && !field.value}
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

// --- BankDetailsSection ---
const BankDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => { // Added formMethods
    const { watch } = formMethods; // Use watch from formMethods
    const bankNameOptions = [{ value: 'hdfc', label: 'HDFC Bank' }, { value: 'sbi', label: 'State Bank of India' }];
    const bankTypeOptions = [{ value: 'Primary', label: 'Primary' }, { value: 'Secondary', label: 'Secondary' }, { value: 'Other', label: 'Other' }];

    const { fields, append, remove } = useFieldArray({
        control: formMethods.control,
        name: "additional_bank_details"
    });

    const primaryBankPhotoValue = watch('primary_bank_verification_photo');
    const secondaryBankPhotoValue = watch('secondary_bank_verification_photo');


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
                        render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" onChange={e => onChange(e.target.files?.[0])} {...restField} />}
                    />
                     {typeof primaryBankPhotoValue === 'string' && primaryBankPhotoValue && <img src={primaryBankPhotoValue} alt="Primary bank photo" className="mt-2 h-16 w-auto" />}
                </FormItem>
            </div>
            <hr className="my-6" />
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
                    {typeof secondaryBankPhotoValue === 'string' && secondaryBankPhotoValue && <img src={secondaryBankPhotoValue} alt="Secondary bank photo" className="mt-2 h-16 w-auto" />}
                </FormItem>
            </div>

            <hr className="my-6" />
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">Additional Bank Details</h4>
                <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ bank_account_number: '', bank_name: undefined, ifsc_code: '', bank_verification_photo: undefined, type: undefined })}>
                    Add More Banks
                </Button>
            </div>

            {fields.map((item, index) => {
                const bankPhotoValue = watch(`additional_bank_details.${index}.bank_verification_photo`);
                return (
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
                            {typeof bankPhotoValue === 'string' && bankPhotoValue && <img src={bankPhotoValue} alt={`Bank ${index+1} photo`} className="mt-2 h-16 w-auto" />}
                        </FormItem>
                        <div className="md:col-span-3 flex justify-end">
                            <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => remove(index)} danger />
                        </div>
                    </div>
                </Card>
            )})}
        </Card>
    );
};

// --- AccessibilitySection ---
const AccessibilitySection = ({ control, errors, formMethods }: FormSectionBaseProps) => { // Added formMethods
    const { watch } = formMethods; // Use watch from formMethods
    const domainOptions = [{ value: 'retail.com', label: 'retail.com' }, { value: 'service.co', label: 'service.co' }];
    const smtpSecureOptions = [{value: 'tls', label: 'TLS'}, {value: 'ssl', label: 'SSL'}, {value: 'none', label: 'None'}];

    const billingPhotosValue = watch('BILLING_PHOTOS_FIELD');

    return (
        <Card id="accessibility">
            <h4 className="mb-6">Accessibility & Configuration</h4>
            <div className="md:grid md:grid-cols-2 lg:grid-cols-7 lg:gap-2">
                <FormItem label="KYC Verified" className="col-span-1 lg:col-span-3" invalid={!!errors.KYC_FIELD} errorMessage={errors.KYC_FIELD?.message as string}>
                    <Controller name="KYC_FIELD" control={control} render={({ field }) => <Checkbox checked={!!field.value} onChange={field.onChange}>KYC Verified</Checkbox>} />
                </FormItem>
                <FormItem label="Enable Billing" className="col-span-1 lg:col-span-4" invalid={!!errors.BILLING_FIELD} errorMessage={errors.BILLING_FIELD?.message as string}>
                    <Controller name="BILLING_FIELD" control={control} render={({ field }) => <Checkbox checked={!!field.value} onChange={field.onChange}>Enable Billing</Checkbox>} />
                </FormItem>
                <div className="md:grid grid-cols-subgrid lg:grid-cols-subgrid gap-2 col-span-7 mb-6 lg:mb-0 items-end">
                    <FormItem label="Billing Document Name" className="lg:col-span-3" invalid={!!errors.BILLING_DOCUMENT_NAME_FIELD} errorMessage={errors.BILLING_DOCUMENT_NAME_FIELD?.message as string}>
                        <Controller
                            name="BILLING_DOCUMENT_NAME_FIELD"
                            control={control}
                            render={({ field }) => <Input type="text" placeholder="e.g., Invoice Template" {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Upload Billing Document(s)" className="lg:col-span-3" invalid={!!errors.BILLING_PHOTOS_FIELD} errorMessage={errors.BILLING_PHOTOS_FIELD?.message as string}>
                        <Controller name="BILLING_PHOTOS_FIELD" control={control}
                            render={({ field: { onChange, ref, value, ...restField } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" multiple onChange={e => onChange(e.target.files)} {...restField} />}
                        />
                         {billingPhotosValue && typeof billingPhotosValue !== 'string' && billingPhotosValue instanceof FileList && Array.from(billingPhotosValue).map((file, idx) => (
                            <p key={idx} className="text-xs mt-1">{file.name}</p>
                        ))}
                        {typeof billingPhotosValue === 'string' && billingPhotosValue && (
                            <a href={billingPhotosValue} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 inline-block">View Uploaded Document</a>
                        )}
                    </FormItem>
                </div>
                <FormItem label="Domain Management" className="md:col-span-2 lg:col-span-7" invalid={!!errors.DOMAIN_MANAGEMENT_FIELD} errorMessage={errors.DOMAIN_MANAGEMENT_FIELD?.message as string}>
                    <Controller name="DOMAIN_MANAGEMENT_FIELD" control={control} render={({ field }) => <Select placeholder="Select Domain" options={domainOptions} {...field} />} />
                </FormItem>

                <Card className='mt-4 col-span-full'>
                    <h4 className="mb-4">SMTP Configuration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <FormItem label="SMTP Host"><Controller name="smtp_host" control={control} render={({ field }) => <Input placeholder="mail.example.com" {...field} />} /></FormItem>
                        <FormItem label="SMTP Port"><Controller name="smtp_port" control={control} render={({ field }) => <Input placeholder="587" {...field} />} /></FormItem>
                        <FormItem label="SMTP Secure"><Controller name="smtp_secure" control={control} render={({ field }) => <Select options={smtpSecureOptions} placeholder="TLS/SSL/None" {...field} /> } /></FormItem>
                        <FormItem label="SMTP Username"><Controller name="smtp_username" control={control} render={({ field }) => <Input placeholder="username" {...field} />} /></FormItem>
                        <FormItem label="SMTP Password"><Controller name="smtp_password" control={control} render={({ field }) => <Input type="password" placeholder="password" {...field} />} /></FormItem>
                        <FormItem label="SMTP Sender Name"><Controller name="smtp_name" control={control} render={({ field }) => <Input placeholder="Sender Name" {...field} />} /></FormItem>
                        <FormItem label="SMTP Sender Email"><Controller name="smtp_email" control={control} render={({ field }) => <Input type="email" placeholder="sender@example.com" {...field} />} /></FormItem>
                    </div>
                    <hr className="my-6" />
                    <h4 className="mb-4">Social Media Links</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <FormItem label="Facebook URL"><Controller name="facebook" control={control} render={({ field }) => <Input type="url" placeholder="https://facebook.com/..." {...field} />} /></FormItem>
                        <FormItem label="Instagram URL"><Controller name="instagram" control={control} render={({ field }) => <Input type="url" placeholder="https://instagram.com/..." {...field} />} /></FormItem>
                        <FormItem label="LinkedIn URL"><Controller name="linkedin" control={control} render={({ field }) => <Input type="url" placeholder="https://linkedin.com/in/..." {...field} />} /></FormItem>
                        <FormItem label="YouTube URL"><Controller name="youtube" control={control} render={({ field }) => <Input type="url" placeholder="https://youtube.com/..." {...field} />} /></FormItem>
                        <FormItem label="Twitter URL"><Controller name="twitter" control={control} render={({ field }) => <Input type="url" placeholder="https://twitter.com/..." {...field} />} /></FormItem>
                    </div>
                </Card>
            </div>
        </Card>
    );
};


// --- MemberManagementSection ---
const MemberManagementSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const memberOptions = [{ value: '1', label: 'John Doe (ID:1)' }, { value: '2', label: 'Jane Smith (ID:2)' }];
    const designationOptions = [{ value: 'ceo', label: 'CEO' }, { value: 'manager', label: 'Manager' }];

    const { fields, append, remove } = useFieldArray({
        control: formMethods.control,
        name: "members"
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

// --- CompanyFormComponent ---
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

    const companySchema = z.object({
        name: z.string().trim().min(1, { message: "Name is Required!" }),
        company_code: z.string().trim().min(1, { message: "Company code is required!" }),
        company_primary_email_id: z.string().trim().min(1, { message: "Email is Required !" }).email("Invalid email format"),
        status: z.object({ value: z.string(), label: z.string(), }).optional().nullable(),
        company_primary_contact_number: z.string().trim().min(1, { message: "Primary contact number is required!" })
            .regex(/^\+?\d{7,15}$/, { message: "Invalid contact number format" }),
        company_website: z.string().url({ message: "Invalid website URL" }).optional().or(z.literal('')),
        support_email: z.string().email({ message: "Invalid support email" }).optional().or(z.literal('')),
    }).passthrough();

    const formMethods = useForm<CompanyFormSchema>({
        defaultValues: defaultValues || {},
        resolver: zodResolver(companySchema)
    });
    const { handleSubmit, reset, formState: { errors }, control } = formMethods;

    useEffect(() => {
        const initialValues = defaultValues || {};
        const fullInitialValues: Partial<CompanyFormSchema> = {
            members: [],
            additional_bank_details: [],
            company_spot_verification_data: [],
            ...initialValues,
        };
        reset(fullInitialValues);
    }, [defaultValues, reset]);


    const internalFormSubmit = (values: CompanyFormSchema) => {
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
        const sectionProps = { errors, control, formMethods }; // Pass full formMethods here
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
// src/views/companies/CompanyFormPage.tsx

// ... (interfaces, helper functions like transformApiToFormSchema, preparePayloadForApi, section components remain the same) ...

// --- CompanyFormPage (Combined Add/Edit Page) ---
const CompanyCreate = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Still useful if you sometimes pass state
    const dispatch = useAppDispatch();
    const { id } = useParams<{ id?: string }>(); // <<< GET ID FROM URL PARAMS

    const isEditMode = Boolean(id); // Determine edit mode based on URL param

    const [initialData, setInitialData] = useState<Partial<CompanyFormSchema> | null>(null);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getEmptyFormValues = (): Partial<CompanyFormSchema> => ({
        // ... (same as before - ensures all fields are initialized)
        name: '', company_primary_contact_number: '', primary_contact_country_code: '', company_profile_settings_id: '',
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
        additional_bank_details: [],
        KYC_FIELD: false, BILLING_FIELD: false, BILLING_PHOTOS_FIELD: null,
        BILLING_DOCUMENT_NAME_FIELD: '',
        DOMAIN_MANAGEMENT_FIELD: undefined,
        members: [],
        status: undefined, company_code: '', brands: '', category: '', interested_in: '',
        total_members: '', member_participation: '', success_score: '', trust_score: '', health_score: '',
        support_email: '', mobile: '', expiry_date: '', company_type: undefined,
        smtp_host: '', smtp_port: '', smtp_secure: undefined, smtp_username: '', smtp_password: '',
        smtp_name: '', smtp_email: '',
        facebook: '', instagram: '', linkedin: '', youtube: '', twitter: '',
        logo_for_meta: undefined, notification_email: '',
        company_spot_verification_data: [],
    });

    useEffect(() => {
        dispatch(getCountriesAction());
        dispatch(getContinentsAction());
    }, [dispatch])

    useEffect(() => {
        const emptyForm = getEmptyFormValues();
        if (isEditMode && id) { // <<< USE id FROM useParams
            const fetchCompanyData = async () => {
                setPageLoading(true);
                try {
                    // Dispatch your Redux action to get company by ID
                    const actionResult = await dispatch(getCompanyByIdAction(id)).unwrap();
                    // actionResult should be the ApiSingleCompanyItem
                    const companyApiData = actionResult;

                    if (companyApiData) {
                        const transformed = transformApiToFormSchema(companyApiData);
                        setInitialData({ ...emptyForm, ...transformed });
                    } else {
                        // This might not be reached if unwrap() throws for non-existent data or error
                        toast.push(<Notification type="danger" title="Fetch Error">Company data not found or invalid structure.</Notification>);
                        navigate('/business-entities/company'); // Or an appropriate error page
                    }
                } catch (error: any) {
                    // Error from dispatch(getCompanyByIdAction(...)).unwrap() will be caught here
                    const errorMessage = error?.message || 'Error fetching company data.';
                    toast.push(<Notification type="danger" title="Fetch Error">{errorMessage}</Notification>);
                    navigate('/business-entities/company'); // Or an appropriate error page
                } finally {
                    setPageLoading(false);
                }
            };
            fetchCompanyData();
        } else {
            // Create mode
            setInitialData(emptyForm);
            setPageLoading(false);
        }
    }, [id, isEditMode, navigate, dispatch]); // <<< ADD id to dependency array

    const handleFormSubmit = async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
        setIsSubmitting(true);
        // Pass id for editCompanyAction, it might expect it in the payload or params object
        const payload = preparePayloadForApi(formValues, isEditMode, initialData || {});

        try {
            if (isEditMode && id) { // <<< USE id
                // Ensure editCompanyAction can receive id if it's needed alongside payload
                // e.g., editCompanyAction({ id, payload })
                await dispatch(editCompanyAction({ id: id, payload })).unwrap();
                toast.push(<Notification type="success" title="Company Updated">Details updated successfully.</Notification>);
            } else {
                await dispatch(addcompanyAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Company Created">New company created successfully.</Notification>);
            }
            // Optional: 
            navigate('/business-entities/company');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} company.`;
            if (error?.response?.data?.errors) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key) => {
                    let formKey = key as keyof CompanyFormSchema;
                    if (key === 'address') formKey = 'company_address' as keyof CompanyFormSchema;
                    if (key === 'gst') formKey = 'gst_number' as keyof CompanyFormSchema;
                    formMethods.setError(formKey, {
                        type: 'manual',
                        message: Array.isArray(validationErrors[key]) ? validationErrors[key][0] : validationErrors[key],
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
    // Ensure initialData is populated before rendering the form, especially for edit mode.
    // For create mode, initialData will be `emptyForm`.
    if (!initialData) {
        // This state should ideally not be hit if logic is correct,
        // but acts as a fallback during loading or if an error occurred before pageLoading is set back to false.
        return <Container className="h-full flex justify-center items-center"><p>Initializing form or error loading data...</p></Container>;
    }

    return (
        <Container className="h-full">
            <Form onSubmit={(e) => e.preventDefault()} className="flex flex-col min-h-screen">
                <div className="flex-grow">
                    <CompanyFormComponent
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

export default CompanyCreate;