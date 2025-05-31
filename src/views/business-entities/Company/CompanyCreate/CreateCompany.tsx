// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import React, { useEffect, useState, ReactNode } from 'react';
import { useForm, Controller, Control, FieldErrors, UseFormReturn } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
// import { useAppDispatch } from '@/reduxtool/store'; // If using Redux for company actions

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
import NumericInput from '@/components/shared/NumericInput'; // Added

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbTrash, TbPlus } from 'react-icons/tb';
import { addcompanyAction, editcompanyAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';

// Utils & Services
// import config from '@/configs/app.config'; // If needed for API URLs etc.

// --- Redux Actions (Example, adapt if using Redux) ---
// import {
//     addCompanyAction,
//     editCompanyAction,
// } from '@/reduxtool/master/companyMiddleware'; // Hypothetical path


// --- Type Definitions ---
export interface CompanyFormSchema {
    id?: string | number; // For edit mode

    // CompanyDetails Section
    company_name?: string;
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
    no_of_employees?: number | string; // Allow string for input, convert later
    company_website?: string;
    company_logo_brochure?: File | string; // File for upload, string for URL
    primary_business_type?: string | { label: string; value: string };
    primary_business_category?: string | { label: string; value: string };
    certificate_name?: string;
    upload_certificate?: File | string; // File for upload, string for URL
    head_office?: string | { label: string; value: string }; // Or office_type
    branches?: string; // Office name
    branch_address?: string;
    location_country?: string | { label: string; value: string };
    branch_state?: string | { label: string; value: string };
    branch_zip_code?: string;
    branch_gst_reg_number?: string;

    // KYCDetailSection
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

    // BankDetailsSection
    primary_account_number?: string;
    primary_bank_name?: string | { label: string; value: string };
    primary_ifsc_code?: string;
    primary_bank_verification_photo?: File | string;
    secondary_account_number?: string;
    secondary_bank_name?: string | { label: string; value: string };
    secondary_ifsc_code?: string;
    secondary_bank_verification_photo?: File | string;

    // AccessibilitySection
    KYC_FIELD?: boolean; // Corresponds to kyc_verified
    BILLING_FIELD?: boolean; // Corresponds to enable_billing
    BILLING_PHOTOS_FIELD?: FileList | null; // Example from your code
    DOMAIN_MANAGEMENT_FIELD?: string | { label: string; value: string };

    // MemberManagementSection (Array of members)
    members?: Array<{
        member?: string | { label: string; value: string };
        designation?: string | { label: string; value: string };
        person_name?: string;
        contact_number?: string;
    }>;

    // Additional fields if needed, e.g., from CompanyItem for API transformation
    status?: string | { label: string, value: string }; // For overall status, mapping to 'Active', 'Inactive' etc.
}


export interface FormSectionBaseProps {
    control: Control<CompanyFormSchema>;
    errors: FieldErrors<CompanyFormSchema>;
}

// --- API Company Item Type (Raw from API for GET /company/{id}) ---
// This needs to be defined based on your actual API response for a single company
interface ApiSingleCompanyItem {
    id: number;
    company_name?: string;
    company_code?: string; // Assuming API provides this
    ownership_type?: string;
    owner_director_proprietor_name?: string;
    company_address?: string;
    city?: string;
    state?: string;
    country_id?: string; // API might send ID
    continent_id?: string; // API might send ID
    zip_postal_code?: string;
    gst_number?: string;
    pan_number?: string;
    trn_number?: string;
    tan_number?: string;
    company_establishment_year?: string;
    no_of_employees?: number;
    company_website?: string;
    company_logo_brochure_url?: string; // Assuming URL from API
    primary_business_type?: string;
    primary_business_category?: string;
    company_primary_contact_number?: string;
    primary_contact_country_code?: string;
    alternate_contact_number?: string;
    alternate_contact_country_code?: string;
    company_primary_email_id?: string;
    alternate_email_id?: string;
    // KYC docs as URLs
    declaration_206ab_url?: string;
    declaration_194q_url?: string;
    // ... other KYC doc URLs
    // Bank details
    primary_account_number?: string;
    primary_bank_name?: string;
    primary_ifsc_code?: string;
    primary_bank_verification_photo_url?: string;
    // Accessibility
    kyc_verified?: "Yes" | "No"; // Matches CompanyItem
    enable_billing?: "Yes" | "No"; // Matches CompanyItem
    domain?: string; // From DOMAIN_MANAGEMENT_FIELD
    // Member management (might be a separate endpoint or nested array)
    // status from API
    status?: string; // e.g., "Active", "Pending"
    // Add other fields from your CompanyItem that are fetched from API
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (apiData: ApiSingleCompanyItem): Partial<CompanyFormSchema> => {
    // This is a simplified transformation. You'll need to map all relevant fields.
    // Handle select options (e.g., convert string ID to { label, value })
    // Handle boolean/checkbox fields (e.g., "Yes"/"No" to true/false)
    // Handle file URLs
    return {
        id: apiData.id,
        company_name: apiData.company_name,
        ownership_type: apiData.ownership_type ? { label: apiData.ownership_type, value: apiData.ownership_type } : undefined,
        owner_director_proprietor_name: apiData.owner_director_proprietor_name,
        company_address: apiData.company_address,
        city: apiData.city ? { label: apiData.city, value: apiData.city } : undefined,
        state: apiData.state ? { label: apiData.state, value: apiData.state } : undefined,
        country: apiData.country_id ? { label: `Country ${apiData.country_id}`, value: apiData.country_id } : undefined, // Needs actual label
        continent_name: apiData.continent_id ? { label: `Continent ${apiData.continent_id}`, value: apiData.continent_id } : undefined, // Needs actual label
        zip_postal_code: apiData.zip_postal_code,
        gst_number: apiData.gst_number,
        pan_number: apiData.pan_number,
        company_establishment_year: apiData.company_establishment_year,
        no_of_employees: apiData.no_of_employees,
        company_website: apiData.company_website,
        company_logo_brochure: apiData.company_logo_brochure_url, // Assuming URL for display
        primary_business_type: apiData.primary_business_type ? { label: apiData.primary_business_type, value: apiData.primary_business_type } : undefined,
        primary_business_category: apiData.primary_business_category ? { label: apiData.primary_business_category, value: apiData.primary_business_category } : undefined,
        company_primary_contact_number: apiData.company_primary_contact_number,
        primary_contact_country_code: apiData.primary_contact_country_code,
        alternate_contact_number: apiData.alternate_contact_number,
        alternate_contact_country_code: apiData.alternate_contact_country_code,
        company_primary_email_id: apiData.company_primary_email_id,
        alternate_email_id: apiData.alternate_email_id,
        // KYC fields (assuming URLs)
        declaration_206ab: apiData.declaration_206ab_url,
        // Bank details
        primary_account_number: apiData.primary_account_number,
        primary_bank_name: apiData.primary_bank_name ? { label: apiData.primary_bank_name, value: apiData.primary_bank_name } : undefined,
        primary_ifsc_code: apiData.primary_ifsc_code,
        // Accessibility
        KYC_FIELD: apiData.kyc_verified === "Yes",
        BILLING_FIELD: apiData.enable_billing === "Yes",
        DOMAIN_MANAGEMENT_FIELD: apiData.domain ? { label: apiData.domain, value: apiData.domain } : undefined,
        status: apiData.status ? { label: apiData.status, value: apiData.status } : undefined,
        // ... map other fields
    };
};

// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (formData: CompanyFormSchema, isEditMode: boolean, originalData?: Partial<CompanyFormSchema>): any => {
    let payload: any = { ...formData };
    if (isEditMode && originalData) {
        payload = { ...originalData, ...formData }; // formData overwrites originalData for changed fields
    }

    // Convert select objects to their values
    const fieldsToExtractValue = [
        'ownership_type', 'city', 'state', 'country', 'continent_name',
        'primary_business_type', 'primary_business_category', 'head_office', // office_type
        'location_country', 'branch_state', 'primary_bank_name', 'secondary_bank_name',
        'DOMAIN_MANAGEMENT_FIELD', 'status',
        // Member management fields if they are selects
    ];
    fieldsToExtractValue.forEach(field => {
        if (payload[field] && typeof payload[field] === 'object' && 'value' in payload[field]) {
            payload[field] = payload[field].value;
        }
    });

    // Handle boolean to "Yes"/"No" or 1/0 if API expects that
    payload.kyc_verified = payload.KYC_FIELD ? "Yes" : "No";
    payload.enable_billing = payload.BILLING_FIELD ? "Yes" : "No";
    delete payload.KYC_FIELD;
    delete payload.BILLING_FIELD;


    // Handle file uploads: API might expect FormData or just URLs if pre-uploaded
    // This example assumes you might send FormData if files are present.
    // If sending JSON, you'd likely send URLs of already uploaded files.
    const fileFields = [
        'company_logo_brochure', 'upload_certificate', 'declaration_206ab',
        'declaration_194q', 'office_photo', 'gst_certificate', 'authority_letter',
        'visiting_card', 'cancel_cheque', 'aadhar_card', 'pan_card', 'other_document',
        'primary_bank_verification_photo', 'secondary_bank_verification_photo',
        'BILLING_PHOTOS_FIELD' // This was FileList, needs special handling
    ];

    let hasFiles = false;
    fileFields.forEach(field => {
        if (payload[field] instanceof File || payload[field] instanceof FileList) {
            hasFiles = true;
        }
    });

    if (hasFiles) {
        const formDataApi = new FormData();
        for (const key in payload) {
            if (payload[key] instanceof FileList) { // Handle FileList
                for (let i = 0; i < payload[key].length; i++) {
                    formDataApi.append(`${key}[${i}]`, payload[key][i]);
                }
            } else if (payload[key] instanceof File) {
                formDataApi.append(key, payload[key]);
            } else if (payload[key] !== undefined && payload[key] !== null) {
                // For arrays like members, stringify them or append each item
                if (Array.isArray(payload[key])) {
                    payload[key].forEach((item: any, index: number) => {
                        if (typeof item === 'object' && item !== null) {
                            for (const subKey in item) {
                                formDataApi.append(`${key}[${index}][${subKey}]`, item[subKey]);
                            }
                        } else {
                            formDataApi.append(`${key}[${index}]`, item);
                        }
                    });
                } else {
                    formDataApi.append(key, payload[key]);
                }
            }
        }
        if (isEditMode && payload.id) { // For PUT requests, often ID is in URL, but some APIs might want it in body too
            formDataApi.append('id', payload.id);
        }
        return formDataApi;
    }


    if (!isEditMode) {
        delete payload.id;
    }

    return payload; // Return JSON if no files
};


// --- Reusable Form Section Components ---

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
const CompanyDetailsSection = ({ control, errors }: FormSectionBaseProps) => {
    // Mock options - replace with actual data fetching or constants
    const countryOptions = [{ value: 'IN', label: 'India' }, { value: 'US', label: 'United States' }];
    const stateOptions = [{ value: 'MH', label: 'Maharashtra' }, { value: 'CA', label: 'California' }];
    const cityOptions = [{ value: 'Mumbai', label: 'Mumbai' }, { value: 'Los Angeles', label: 'Los Angeles' }];
    const continentOptions = [{ value: 'AS', label: 'Asia' }, { value: 'NA', label: 'North America' }];
    const ownershipTypeOptions = [{ value: 'private_limited', label: 'Private Limited' }, { value: 'llp', label: 'LLP' }];
    const primaryBusinessTypeOptions = [{ value: 'manufacturer', label: 'Manufacturer' }, { value: 'service', label: 'Service' }];
    const primaryBusinessCategoryOptions = [{ value: 'electronics', label: 'Electronics' }, { value: 'software', label: 'Software' }];
    const officeTypeOptions = [{ label: "Head Office", value: "Head Office" }, { label: "Branch", value: "Branch" }];


    return (
        <Card id="companyDetails">
            <h4 className="mb-4">Primary Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <FormItem label="Company Name" invalid={!!errors.company_name} errorMessage={errors.company_name?.message as string}>
                    <Controller name="company_name" control={control} render={({ field }) => <Input placeholder="Company Name" {...field} />} />
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
                        render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} />}
                    />
                </FormItem>
                <FormItem label="Primary Business Type" invalid={!!errors.primary_business_type} errorMessage={errors.primary_business_type?.message as string}>
                    <Controller name="primary_business_type" control={control} render={({ field }) => <Select placeholder="Select Business Type" options={primaryBusinessTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Primary Business Category" invalid={!!errors.primary_business_category} errorMessage={errors.primary_business_category?.message as string}>
                    <Controller name="primary_business_category" control={control} render={({ field }) => <Select placeholder="Select Category" options={primaryBusinessCategoryOptions} {...field} />} />
                </FormItem>
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Certificates</h4>
            <div className="grid md:grid-cols-7 gap-3 items-end"> {/* Use items-end to align button */}
                <FormItem label="Certificate Name" className="col-span-3" invalid={!!errors.certificate_name} errorMessage={errors.certificate_name?.message as string}>
                    <Controller name="certificate_name" control={control} render={({ field }) => <Input placeholder="e.g., ISO 9001" {...field} />} />
                </FormItem>
                <FormItem label="Upload Certificate" className="col-span-3" invalid={!!errors.upload_certificate} errorMessage={errors.upload_certificate?.message as string}>
                    <Controller name="upload_certificate" control={control}
                        render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} />}
                    />
                </FormItem>
                <div className="flex justify-center items-center col-span-1"> {/* Adjusted for alignment */}
                    <Button type="button" icon={<TbPlus />} shape="circle" size="sm" /> {/* Add More button */}
                </div>
            </div>

            <hr className="my-6" />
            <h4 className="mb-4">Office Information</h4>
            <div className="grid md:grid-cols-2 gap-3">
                <FormItem label="Office Type" invalid={!!errors.head_office} errorMessage={errors.head_office?.message as string}>
                    <Controller name="head_office" control={control} render={({ field }) => <Select placeholder="Select Office Type" options={officeTypeOptions} {...field} />} />
                </FormItem>
                <FormItem label="Office Name" invalid={!!errors.branches} errorMessage={errors.branches?.message as string}>
                    <Controller name="branches" control={control} render={({ field }) => <Input placeholder="e.g. XYZ Pvt. Ltd." {...field} />} />
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
            <div className="flex justify-end mt-4">
                <Button type="button" icon={<TbPlus />} shape="circle" size="sm" /> {/* Add More button */}
            </div>
        </Card>
    );
};

// --- KYCDetailSection ---
const KYCDetailSection = ({ control, errors }: FormSectionBaseProps) => {
    const kycDocs = [
        { label: '206AB Declaration', name: 'declaration_206ab' as const },
        { label: '194Q Declaration', name: 'declaration_194q' as const },
        { label: 'Office Photo', name: 'office_photo' as const },
        { label: 'GST Certificate', name: 'gst_certificate' as const },
        { label: 'Authority Letter', name: 'authority_letter' as const },
        { label: 'Visiting Card', name: 'visiting_card' as const },
        { label: 'Cancel Cheque', name: 'cancel_cheque' as const },
        { label: 'Aadhar Card', name: 'aadhar_card' as const },
        { label: 'PAN Card', name: 'pan_card' as const },
        { label: 'Other Document', name: 'other_document' as const },
    ];

    return (
        <Card id="kycDocuments">
            <h5 className="mb-4">Document Upload</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                {kycDocs.map((doc) => {
                    const remarkField = `${doc.name}_remark` as keyof CompanyFormSchema;
                    const checkboxField = `${doc.name}_remark_enabled` as keyof CompanyFormSchema;
                    const docField = doc.name as keyof CompanyFormSchema;

                    return (
                        <div key={doc.name}>
                            <label className="flex items-center gap-2 mb-1">
                                <Controller
                                    name={checkboxField}
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox checked={!!field.value} onChange={field.onChange}>
                                            {doc.label}
                                        </Checkbox>
                                    )}
                                />
                            </label>
                            <FormItem invalid={!!errors[docField]} errorMessage={errors[docField]?.message as string}>
                                <Controller
                                    name={docField}
                                    control={control}
                                    render={({ field: { onChange, ref } }) => (
                                        <Input type="file" ref={ref} onChange={e => onChange(e.target.files?.[0])} />
                                    )}
                                />
                            </FormItem>
                            <FormItem className="mt-2" invalid={!!errors[remarkField]} errorMessage={errors[remarkField]?.message as string}>
                                <Controller
                                    name={remarkField}
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            textArea
                                            placeholder={`Remark for ${doc.label}`}
                                            {...field}
                                        // disabled={!control._formValues[checkboxField]} // Requires watching the value
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
const BankDetailsSection = ({ control, errors }: FormSectionBaseProps) => {
    const bankNameOptions = [{ value: 'hdfc', label: 'HDFC Bank' }, { value: 'sbi', label: 'State Bank of India' }];
    return (
        <Card id="bankDetails">
            <h4 className="mb-6">Bank Details</h4>
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
                        render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} accept="image/*" onChange={e => onChange(e.target.files?.[0])} />}
                    />
                </FormItem>
                <FormItem label="Secondary Account Number">
                    <Controller name="secondary_account_number" control={control} render={({ field }) => <Input placeholder="Secondary Account No." {...field} />} />
                </FormItem>
                <FormItem label="Secondary Bank Name">
                    <Controller name="secondary_bank_name" control={control} render={({ field }) => <Select placeholder="Select Bank" options={bankNameOptions} {...field} />} />
                </FormItem>
                <FormItem label="Secondary IFSC Code">
                    <Controller name="secondary_ifsc_code" control={control} render={({ field }) => <Input placeholder="Secondary IFSC" {...field} />} />
                </FormItem>
                <FormItem label="Secondary Bank Verification Photo" className="md:col-span-3">
                    <Controller name="secondary_bank_verification_photo" control={control}
                        render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} accept="image/*" onChange={e => onChange(e.target.files?.[0])} />}
                    />
                </FormItem>
            </div>
            <div className="flex justify-end mt-4">
                <Button type="button" icon={<TbPlus />} shape="circle" size="sm" />
            </div>
        </Card>
    );
};

// --- AccessibilitySection ---
const AccessibilitySection = ({ control, errors }: FormSectionBaseProps) => {
    const domainOptions = [{ value: 'retail.com', label: 'retail.com' }, { value: 'service.co', label: 'service.co' }];
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
                <div className="md:grid grid-cols-subgrid lg:grid-cols-subgrid gap-2 col-span-7 mb-6 lg:mb-0 items-end"> {/* Use subgrid and items-end */}
                    <FormItem label="Billing Document Name" className="lg:col-span-3">
                        {/* Assuming this is a text input for the document name/type */}
                        <Controller name="BILLING_PHOTOS_FIELD_name" control={control} render={({ field }) => <Input type="text" placeholder="e.g., Invoice Template" {...field as any} />} />
                    </FormItem>
                    <FormItem label="Upload Billing Document" className="lg:col-span-3" invalid={!!errors.BILLING_PHOTOS_FIELD} errorMessage={errors.BILLING_PHOTOS_FIELD?.message as string}>
                        <Controller name="BILLING_PHOTOS_FIELD" control={control}
                            render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" multiple onChange={e => onChange(e.target.files)} />}
                        />
                    </FormItem>
                    <div className="flex lg:justify-center items-center lg:col-span-1 self-end pb-2"> {/* Align button with input bottom */}
                        <Button type="button" icon={<TbPlus />} shape="circle" size="sm" />
                    </div>
                </div>
                <FormItem label="Domain Management" className="md:col-span-2 lg:col-span-7" invalid={!!errors.DOMAIN_MANAGEMENT_FIELD} errorMessage={errors.DOMAIN_MANAGEMENT_FIELD?.message as string}>
                    <Controller name="DOMAIN_MANAGEMENT_FIELD" control={control} render={({ field }) => <Select placeholder="Select Domain" options={domainOptions} {...field} />} />
                </FormItem>
            </div>
        </Card>
    );
};


// --- MemberManagementSection ---
const MemberManagementSection = ({ control, errors }: FormSectionBaseProps) => {
    const memberOptions = [{ value: '1', label: 'John Doe' }, { value: '2', label: 'Jane Smith' }];
    const designationOptions = [{ value: 'ceo', label: 'CEO' }, { value: 'manager', label: 'Manager' }];
    // useFieldArray could be used here for dynamic members, but for simplicity using one set of fields
    return (
        <Card id="memberManagement">
            <h4 className="mb-6">Member Management</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end mb-4">
                <FormItem label="Member" invalid={!!errors.members?.[0]?.member} errorMessage={errors.members?.[0]?.member?.message as string}>
                    <Controller name="members.0.member" control={control} render={({ field }) => <Select placeholder="Select Member" options={memberOptions} {...field} />} />
                </FormItem>
                <FormItem label="Designation" invalid={!!errors.members?.[0]?.designation} errorMessage={errors.members?.[0]?.designation?.message as string}>
                    <Controller name="members.0.designation" control={control} render={({ field }) => <Select placeholder="Select Designation" options={designationOptions} {...field} />} />
                </FormItem>
                <FormItem label="Person Name" invalid={!!errors.members?.[0]?.person_name} errorMessage={errors.members?.[0]?.person_name?.message as string}>
                    <Controller name="members.0.person_name" control={control} render={({ field }) => <Input placeholder="Person Name" {...field} />} />
                </FormItem>
                <FormItem label="Contact Number" invalid={!!errors.members?.[0]?.contact_number} errorMessage={errors.members?.[0]?.contact_number?.message as string}>
                    <Controller name="members.0.contact_number" control={control} render={({ field }) => <Input type="tel" placeholder="Contact Number" {...field} />} />
                </FormItem>
            </div>
            <div className="flex gap-2 justify-end items-center">
                <Button type="button" icon={<TbPlus />}>
                    <NavLink to="/business-entities/member-create">Create New Member</NavLink>
                </Button>
                <Button type="button" icon={<TbPlus />}>Add Member</Button>
            </div>
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
    const [activeSection, setActiveSection] = useState<string>("companyDetails");

    const formMethods = useForm<CompanyFormSchema>({ defaultValues: defaultValues || {} });
    const { handleSubmit, reset, formState: { errors }, control } = formMethods;

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues);
        } else if (!isEditMode) {
            reset({});
        }
    }, [defaultValues, isEditMode, reset]);

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
        switch (activeSection) {
            case "companyDetails": return <CompanyDetailsSection errors={errors} control={control} />;
            case "kycDocuments": return <KYCDetailSection errors={errors} control={control} />;
            case "bankDetails": return <BankDetailsSection errors={errors} control={control} />;
            case "accessibility": return <AccessibilitySection errors={errors} control={control} />;
            case "memberManagement": return <MemberManagementSection errors={errors} control={control} />;
            default: return <CompanyDetailsSection errors={errors} control={control} />;
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


// --- CompanyFormPage (Combined Add/Edit Page) ---
const CompanyCreate = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch(); // Uncomment if using Redux
    const { companyId } = useParams<{ companyId?: string }>();
    const isEditMode = Boolean(companyId);

    const [initialData, setInitialData] = useState<Partial<CompanyFormSchema> | null>(null);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode && companyId) {
            const fetchCompanyData = async () => {
                setPageLoading(true);
                try {
                    // Replace with your actual API call to fetch company data
                    // const response = await getCompanyByIdService(companyId); // Example service call
                    // For now, using a mock timeout and data
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
                    const mockApiData: ApiSingleCompanyItem = { // Replace with actual fetched data
                        id: parseInt(companyId),
                        company_name: "Mock Edit Company",
                        ownership_type: "private_limited",
                        // ... other fields based on ApiSingleCompanyItem
                        status: "Active",
                        kyc_verified: "Yes",
                        enable_billing: "No",
                    };
                    const transformed = transformApiToFormSchema(mockApiData);
                    setInitialData(transformed);
                } catch (error: any) {
                    toast.push(<Notification type="danger" title="Fetch Error">{error.message || 'Error fetching company data.'}</Notification>);
                    navigate('/business-entities/company'); // Navigate back to list on error
                } finally {
                    setPageLoading(false);
                }
            };
            fetchCompanyData();
        } else {
            setInitialData({}); // For create mode, start with empty/default object
            setPageLoading(false);
        }
    }, [companyId, isEditMode, navigate]);

    const handleFormSubmit = async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
        setIsSubmitting(true);
        const payload = preparePayloadForApi(formValues, isEditMode, initialData || {});
        console.log("Submitting Payload:", payload);

        try {
            if (isEditMode && companyId) {
                await dispatch(editcompanyAction({ ...payload, id: companyId })).unwrap(); // Example Redux
                // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
                toast.push(<Notification type="success" title="Company Updated">Details updated successfully.</Notification>);
            } else {
                await dispatch(addcompanyAction(payload)).unwrap(); // Example Redux
                // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
                toast.push(<Notification type="success" title="Company Created">New company created successfully.</Notification>);
                formMethods.reset({}); // Reset form for next creation
            }
            navigate('/business-entities/company');
        } catch (error: any) {
            const errorMessage = error?.message || `Failed to ${isEditMode ? 'update' : 'create'} company.`;
            toast.push(<Notification type="danger" title={`${isEditMode ? 'Update' : 'Creation'} Failed`}>{errorMessage}</Notification>);
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
    if (isEditMode && !initialData) {
        return <Container className="h-full flex justify-center items-center"><p>Company data could not be loaded.</p></Container>;
    }

    return (
        <Container className="h-full">
            <Form onSubmit={() => { }} className="flex flex-col min-h-screen"> {/* Dummy onSubmit for Form, actual submit handled by button */}
                <div className="flex-grow">
                    <CompanyFormComponent
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

export default CompanyCreate;