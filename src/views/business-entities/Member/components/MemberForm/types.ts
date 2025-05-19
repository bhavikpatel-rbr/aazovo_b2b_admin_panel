import type { Control, FieldErrors } from 'react-hook-form'

// --- Core Member Field Types ---
export type MemberFormFields = {
    status: string; // Dropdown - Active / Inactive (typically a string key)
    full_name: string; // Text Input
    mobile_number: string; // Text Input
    email: string; // Text Input
    alternate_mobile_number?: string; // Text Input (optional)
    alternate_email?: string; // Text Input (optional)
    password: string; // Password Input
    interested_category: string; // Dropdown
    interested_sub_category: string; // Dropdown
    favourite_brands: string[]; // Multi-Select - array of strings
    company_name_temp?: string; // Text Input (optional)
    business_type: string; // Dropdown
    interested_for: string; // Dropdown
    gmi_rm: string; // Dropdown
    dealing_in_bulk: boolean; // Checkbox
    assigned_company: string; // Dropdown / Text

    // Added: Social & Contact Information
    whatsapp_number: string; // Text Input - WhatsApp contact
    office_number: string; // Text Input - Office contact
    botim_id: string; // Text Input - Botim handle
    skype_id: string; // Text Input - Skype contact
    wechat_id: string; // Text Input - WeChat handle
    website: string; // Text Input - Personal or company website
    linkedin_profile: string; // Text Input - LinkedIn profile URL
    facebook_profile: string; // Text Input - Facebook profile URL
    twitter_handle: string; // Text Input - Twitter username
    instagram_handle: string; // Text Input - Instagram handle
    telegram_id: string; // Text Input - Telegram contact
    snapchat_id: string; // Text Input - Snapchat handle
    youtube_channel: string; // Text Input - YouTube channel link
    personal_email: string; // Text Input - Secondary/personal email

    // Added: Member Accessibility
    kyc_verified: 'Yes' | 'No';
    permanent_id: 'Yes' | 'No';
    product_upload_permission: 'Yes' | 'No';
    wall_enquiry_permission: 'Yes' | 'No' | 'Disabled';
    enquiry_permission: 'Yes' | 'No';
    profile_visibility: 'Public' | 'Private';

    // Plan-related fields
    plan_name: string;
    plan_type: 'Monthly' | 'Yearly';
    plan_price: number;
    product_limit: number;
    enquiry_limit: number;
    plan_duration_days: number;
    marketplace_access: 'Yes' | 'No';
    support_level: 'Basic' | 'Email-only';
    plan_status: 'Active' | 'Inactive';

    // Support & Feedback
    request_type: 'Query' | 'Feature Request' | 'Complaint' | 'Other';
    request_subject: string;
    request_description: string;
    request_status: 'Pending' | 'In Progress' | 'Resolved';
    feedback_type: 'Suggestion' | 'Complaint' | 'Experience';
    feedback_message: string;
    feedback_rating: number; // from 1 to 5
    submitted_on: string; // ISO date string
    submitted_by: string; // email or member ID
}

// --- Main Schema ---
export type MemberFormSchema = MemberFormFields

// --- Reusable Props for Form Sections ---
export type FormSectionBaseProps = {
    control: Control<MemberFormSchema>
    errors: FieldErrors<MemberFormSchema>
}
