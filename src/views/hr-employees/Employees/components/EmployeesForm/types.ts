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
