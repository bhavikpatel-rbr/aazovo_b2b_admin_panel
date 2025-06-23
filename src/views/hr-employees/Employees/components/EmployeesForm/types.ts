import type { Control, FieldErrors } from 'react-hook-form'

// --- Core Employee Field Types ---
export type EmployeeFormFields = {
    full_name: string;
    date_of_joining: string;
    email: string;
    password: string;
    mobile_number: number;
    experience: string;
}

// --- Main Schema ---
export type EmployeeFormSchema = EmployeeFormFields

// --- Reusable Props for Form Sections ---
export type FormSectionBaseProps = {
    control: Control<EmployeeFormSchema>
    errors: FieldErrors<EmployeeFormSchema>
}

import type { Control, FieldErrors } from 'react-hook-form'

// The complete structure of the form's data
export interface EmployeeFormSchema {
    id?: string;
    registration: {
        fullName: string;
        dateOfJoining: string | Date;
        mobileNumber: string;
        mobileNumberCode: string;
        email: string;
        experience: string | number;
        password?: string;
    };
    personalInformation: {
        status: string;
        dateOfBirth: string | Date;
        age: number | string;
        gender: string;
        maritalStatus: string;
        nationalityId: number | string;
        bloodGroup: string;
        permanentAddress: string;
        localAddress: string;
    };
    roleResponsibility: {
        roleId: number | string;
        departmentId: number | string;
        designationId: number | string;
        countryId: number | string;
        categoryId: number | string;
        subcategoryId: number | string;
        brandId: number | string;
        productServiceId: number | string;
        reportingHrId: number | string;
        reportingHeadId: number | string;
    };
    documentSubmission: {
        identity_proof?: FileList;
        address_proof?: FileList;
        educational_certificates?: FileList;
        experience_certificates?: FileList;
        offer_letter?: FileList;
        past_offer_letter?: FileList;
        relieving_letter?: FileList;
        designation_letter?: FileList;
        salary_slips?: FileList;
        bank_account_proof?: FileList;
        pan_card?: FileList;
        passport_size_photograph?: FileList;
    };
    training: {
        training_date_of_completion: string | Date;
        training_remark: string;
        specific_training_date_of_completion: string | Date;
        specific_training_remark: string;
    };
    equipmentsAssetsProvided: {
        items: Array<{
            name: string;
            serial_no: string;
            remark: string;
            provided: boolean;
        }>;
    };
    offBoarding: {
        exit_interview_conducted: 'yes' | 'no';
        exit_interview_remark: string;
        resignation_letter_received: 'yes' | 'no';
        resignation_letter_remark: string;
        company_assets_returned: 'all' | 'partial' | 'none';
        assets_returned_remarks: string;
        full_and_final_settlement: 'yes' | 'no';
        fnf_remarks: string;
        notice_period_status: 'served' | 'waived' | 'bought_out' | 'absconded';
        notice_period_remarks: string;
    };
    timeAttendence: Record<string, unknown>; // Define if needed
}


// Base props for all form section components
export interface FormSectionBaseProps {
    control: Control<EmployeeFormSchema>;
    errors: FieldErrors<EmployeeFormSchema>;
}