import type { Control, FieldErrors } from 'react-hook-form'

// --- Core Company Field Types ---
export type CompanyFormFields = {
    company_name: string
    company_primary_contact_number: string
    alternate_contact_number: string
    company_primary_email_id: string
    alternate_email_id: string
    ownership_type: string
    owner_director_proprietor_name: string
    company_address: string
    city: string
    state: string
    zip_postal_code: string
    country: string
    continent_name: string
    gst_number: string
    pan_number: string
    trn_number: string
    tan_number: string
    company_establishment_year: string
    no_of_employees: number
    company_website: string
    company_logo_brochure: string
    primary_business_type: string
    primary_business_category: string
    certificate_name: string
    upload_certificate: string // or use File if you're handling upload directly
    head_office: string
    location_country: string
    branch_state: string
    branch_zip_code: string
    branch_address: string
    branch_gst_reg_number: string
    declaration_206ab: string
    declaration_206ab_remark: string
    declaration_206ab_remark_enabled: boolean

    declaration_194q: string
    declaration_194q_remark: string
    declaration_194q_remark_enabled: boolean

    office_photo: string
    office_photo_remark: string
    office_photo_remark_enabled: boolean

    gst_certificate: string
    gst_certificate_remark: string
    gst_certificate_remark_enabled: boolean

    authority_letter: string
    authority_letter_remark: string
    authority_letter_remark_enabled: boolean

    visiting_card: string
    visiting_card_remark: string
    visiting_card_remark_enabled: boolean

    cancel_cheque: string
    cancel_cheque_remark: string
    cancel_cheque_remark_enabled: boolean

    aadhar_card: string
    aadhar_card_remark: string
    aadhar_card_remark_enabled: boolean

    pan_card: string
    pan_card_remark: string
    pan_card_remark_enabled: boolean

    other_document: string
    other_document_remark: string
    other_document_remark_enabled: boolean
}

// --- Main Schema ---
export type CompanyFormSchema = CompanyFormFields

// --- Reusable Props for Form Sections ---
export type FormSectionBaseProps = {
    control: Control<CompanyFormSchema>
    errors: FieldErrors<CompanyFormSchema>
}
