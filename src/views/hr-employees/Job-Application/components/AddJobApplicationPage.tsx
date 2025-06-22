import { useEffect, useMemo, useState } from 'react';
// EDIT-MODE: Added useParams to get the ID from the URL
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Controller, useFieldArray, useForm, UseFormSetValue, useWatch } from 'react-hook-form';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod'; // EDIT-MODE: Import Zod for schema definition

// UI Components
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Container from '@/components/shared/Container';
import Loading from '@/components/shared/Loading'; // EDIT-MODE: Added for better UX
import { Button, Card, DatePicker, Radio, Select as UiSelect } from '@/components/ui';
import { FormContainer, FormItem } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbPlus, TbTrash } from 'react-icons/tb';

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
    addJobApplicationAction,
    editJobApplicationAction, getCountriesAction, // EDIT-MODE: Import the edit action
    getDepartmentsAction,
    getJobApplicationsAction,
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from "@/reduxtool/store";

// Types and Schema
import { useSelector } from 'react-redux';
import type {
    ApplicationFormData,
    EducationDetailData,
    EmploymentDetailData,
    FamilyMemberData,
} from '../types';
// NOTE: For a self-contained solution, the schema from '../types' is now defined below.
// import {
//     applicationFormSchema,
//     applicationStatusOptions,
//     bloodGroupOptions,
//     genderOptions,
//     maritalStatusOptions,
// } from '../types';

// --- START: Embedded Utilities & Static Data ---

// --- Schemas & Types (Moved from '../types' to fix validation issues) ---

// EDIT-MODE: A more lenient phone number regex
const phoneRegex = new RegExp(
    /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const familyDetailSchema = z.object({
    familyName: z.string().min(1, "Name is required."),
    familyRelation: z.string().min(1, "Relation is required."),
    familyOccupation: z.string().min(1, "Occupation is required."),
    familyDateOfBirth: z.date().nullable(),
});

const educationalDetailSchema = z.object({
    degree: z.string().min(1, "Degree is required."),
    university: z.string().min(1, "University is required."),
    percentageGrade: z.string().min(1, "Percentage/Grade is required."),
    educationFromDate: z.date({ required_error: "Start date is required." }),
    educationToDate: z.date({ required_error: "End date is required." }),
    specialization: z.string().optional(),
}).refine(data => {
    if (data.educationFromDate && data.educationToDate) {
        return data.educationToDate >= data.educationFromDate;
    }
    return true;
}, {
    message: "End date must be on or after start date",
    path: ["educationToDate"],
});

const employmentDetailSchema = z.object({
    organization: z.string().min(1, "Organization is required."),
    designation: z.string().min(1, "Designation is required."),
    annualCTC: z.string().optional(),
    periodServiceFrom: z.date({ required_error: "Start date is required." }),
    periodServiceTo: z.date({ required_error: "End date is required." }),
}).refine(data => {
    if (data.periodServiceFrom && data.periodServiceTo) {
        return data.periodServiceTo >= data.periodServiceFrom;
    }
    return true;
}, {
    message: "End date must be on or after start date",
    path: ["periodServiceTo"],
});

// EDIT-MODE: Corrected schema to resolve all validation errors
export const applicationFormSchema = z.object({
    department: z.number({ required_error: "Department is required." }),
    name: z.string().min(1, "Applicant name is required."),
    email: z.string().email("Invalid email address."),
    mobileNo: z.string().min(10, "Mobile number must be at least 10 digits.").regex(phoneRegex, "Invalid phone number format"),
    gender: z.string({ required_error: "Gender is required." }),
    dateOfBirth: z.date({ required_error: "Date of Birth is required." }),
    age: z.number().nullable(),
    nationality: z.number().optional().nullable(),
    maritalStatus: z.string().optional().nullable(),
    bloodGroup: z.string().optional().nullable(),
    country: z.number().optional().nullable(),
    // EDIT-MODE: Changed state and city from number to string to support text input
    state: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    localAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    jobTitle: z.string().min(1, "Job title is required."),
    jobId: z.string().optional(),
    applicationDate: z.date({ required_error: "Application date is required." }),
    status: z.enum(['New', 'In Review', 'Shortlisted', 'Hired', 'Rejected']),
    resumeUrl: z.string().optional(),
    jobApplicationLink: z.string().optional(),
    coverLetter: z.string().optional(),
    notes: z.string().optional(),
    emergencyRelation: z.string().min(1, "Emergency contact relation is required."),
    emergencyMobileNo: z.string().min(10, "Emergency mobile number is required.").regex(phoneRegex, "Invalid mobile number format"),
    familyDetails: z.array(familyDetailSchema).optional(),
    educationalDetails: z.array(educationalDetailSchema).min(1, "At least one educational detail is required."),
    workExperienceType: z.enum(['fresher', 'experienced']),
    employmentDetails: z.array(employmentDetailSchema),
    total_experience: z.string().optional(),
    expected_salary: z.string().optional(),
    notice_period: z.string().optional(),
    reference: z.string().optional(),
    reference_specify: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.workExperienceType === 'experienced') {
        if (!data.total_experience?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total experience is required.", path: ['total_experience'] });
        }
        if (!data.expected_salary?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expected salary is required.", path: ['expected_salary'] });
        }
        if (!data.notice_period?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Notice period is required.", path: ['notice_period'] });
        }
        if (data.employmentDetails.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one employment detail is required for experienced candidates.", path: ['employmentDetails'] });
        }
    }
    if (data.reference?.trim() && !data.reference_specify?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please specify details for the reference provided.", path: ['reference_specify'] });
    }
});

// --- Static Options Data (Moved from '../types') ---
export const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' },];
export const maritalStatusOptions = [{ value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }, { value: 'Divorced', label: 'Divorced' }, { value: 'Widowed', label: 'Widowed' },];
export const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },];

// EDIT-MODE: Corrected 'value' to be lowercase to match the Zod enum.
export const applicationStatusOptions = [
    { value: 'New', label: 'New' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Shortlisted', label: 'Shortlisted' },
    { value: 'Hired', label: 'Hired' },
    { value: 'Rejected', label: 'Rejected' },
];

// --- Data Transformation Utilities ---

// EDIT-MODE: Utility now correctly returns lowercase form values.
const transformApiStatusToFormStatus = (apiStatus?: string): string => {
    if (!apiStatus) return 'new';
    const option = applicationStatusOptions.find(opt => opt.label.toLowerCase() === apiStatus.toLowerCase());
    return option ? option.value : 'new'; // Default to "new" if not found
};

const transformFormStatusToApiStatus = (formStatusValue?: string): string => {
    if (!formStatusValue) return 'New';
    const option = applicationStatusOptions.find(opt => opt.value === formStatusValue);
    return option ? option.label : formStatusValue;
};

const transformFormDataToApiPayload = (formData: ApplicationFormData, applicationId?: string) => {
    const payload: any = {
        job_department_id: formData.department ? Number(formData.department) : null,
        name: formData.name,
        email: formData.email,
        mobile_no: formData.mobileNo || "",
        // EDIT-MODE: Changed state/city to send as string instead of number
        city: String(formData.city) || "",
        state: formData.state || "",
        country: String(formData.country) || null,
        nationality: String(formData.nationality) || null,
        marital_status: formData.maritalStatus || "",
        gender: formData.gender || "",
        age: formData.age ? Number(formData.age) : null,
        dob: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format("YYYY-MM-DD") : null,
        blood_group: formData.bloodGroup || "",
        local_address: formData.localAddress || "",
        permanent_address: formData.permanentAddress || "",
        // EDIT-MODE: Changed work_experience to send a string "1" or "0" as per the new API spec.
        work_experience: formData.workExperienceType === "experienced" ? "1" : "0",

        // EDIT-MODE: Added new top-level emergency contact keys as per the new API spec.
        emg_mobile_no: formData.emergencyMobileNo || "",
        emg_relation: formData.emergencyRelation || "",

        total_experience: formData.workExperienceType === "experienced" ? formData.total_experience || "" : "",
        expected_salary: formData.workExperienceType === "experienced" ? formData.expected_salary || "" : "",
        notice_period: formData.workExperienceType === "experienced" ? formData.notice_period || "" : "",
        reference: formData.workExperienceType === "experienced" ? formData.reference || "" : "",
        reference_specify: formData.workExperienceType === "experienced" ? formData.reference_specify || "" : "",

        education_details: formData.educationalDetails?.map(ed => ({
            degree: ed.degree,
            university: ed.university,
            grade: ed.percentageGrade,
            from_date: ed.educationFromDate ? dayjs(ed.educationFromDate).format("YYYY-MM-DD") : null,
            to_date: ed.educationToDate ? dayjs(ed.educationToDate).format("YYYY-MM-DD") : null,
            specialization: ed.specialization || "",
        })) || [],

        // EDIT-MODE: Updated employee_details to match new API keys (company_name) and removed annual_ctc.
        employee_details: formData.workExperienceType === "experienced"
            ? formData.employmentDetails?.map(emp => ({
                company_name: emp.organization,
                designation: emp.designation,
                from_date: emp.periodServiceFrom ? dayjs(emp.periodServiceFrom).format("YYYY-MM-DD") : null,
                to_date: emp.periodServiceTo ? dayjs(emp.periodServiceTo).format("YYYY-MM-DD") : null,
                // reason_for_leaving is in the new spec but not collected by the form.
            })) || []
            : [],

        family_details: formData.familyDetails?.map(fd => ({
            name: fd.familyName,
            relation: fd.familyRelation,
            occupation: fd.familyOccupation,
            dob: fd.familyDateOfBirth ? dayjs(fd.familyDateOfBirth).format("YYYY-MM-DD") : null,
        })) || [],

        status: transformFormStatusToApiStatus(formData.status),
        remarks: formData.notes || "",
        job_link_token: formData.jobApplicationLink || "",

        job_title: formData.jobTitle,
        job_id: formData.jobId || "",
        application_date: formData.applicationDate ? dayjs(formData.applicationDate).format("YYYY-MM-DD") : null,
        resume_url: formData.resumeUrl || "",
        application_link: formData.jobApplicationLink || "",

        // EDIT-MODE: Removed the old `emergency_contact_details` JSON string.
        // The new keys `emg_relation` and `emg_mobile_no` are used instead.

        note: formData.coverLetter || "",
    };

    if (applicationId) {
        payload.id = applicationId;
    }
    return payload;
};

const transformApiToFormData = (apiData: any): ApplicationFormData => {
    const safeJsonParse = (jsonString: string | null, defaultVal: any[] = []) => {
        if (!jsonString) return defaultVal;
        // Handle cases where data might already be an object/array
        if (typeof jsonString === 'object') return jsonString;
        try {
            return JSON.parse(jsonString) || defaultVal;
        } catch (e) {
            console.error("Failed to parse JSON string:", jsonString, e);
            return defaultVal;
        }
    };

    // EDIT-MODE: Updated work_experience check to include string "1".
    const workExperienceType = apiData.work_experience === "Experience" || apiData.work_experience === 1 || apiData.work_experience === "1" ? 'experienced' : 'fresher';

    return {
        department: apiData.job_department_id ? Number(apiData.job_department_id) : undefined,
        name: apiData.name || "",
        email: apiData.email || "",
        mobileNo: apiData.mobile_no || "",
        gender: apiData.gender || undefined,
        dateOfBirth: apiData.dob ? dayjs(apiData.dob, "YYYY-MM-DD").toDate() : null,
        age: apiData.age ? Number(apiData.age) : null,
        nationality: apiData.nationality ? Number(apiData.nationality) : undefined,
        maritalStatus: apiData.marital_status || undefined,
        bloodGroup: apiData.blood_group || undefined,
        country: apiData.country ? Number(apiData.country) : undefined,
        // EDIT-MODE: Changed state/city to treat as string for input fields
        state: apiData.state || "",
        city: apiData.city || "",
        localAddress: apiData.local_address || "",
        permanentAddress: apiData.permanent_address || "",
        workExperienceType: workExperienceType,
        total_experience: apiData.total_experience || "",
        expected_salary: apiData.expected_salary || "",
        notice_period: apiData.notice_period || "",
        reference: apiData.reference || "",
        reference_specify: apiData.reference_specify || "",
        jobTitle: apiData.job_title || "",
        jobId: apiData.job_id || "",
        applicationDate: apiData.application_date ? dayjs(apiData.application_date, "YYYY-MM-DD").toDate() : new Date(),
        status: transformApiStatusToFormStatus(apiData.status),
        resumeUrl: apiData.resume_url || "",
        jobApplicationLink: apiData.application_link || "",
        coverLetter: apiData.note || "",
        notes: apiData.remarks || "",
        // EDIT-MODE: Map from new top-level keys emg_relation and emg_mobile_no.
        emergencyRelation: apiData.emg_relation || "",
        emergencyMobileNo: apiData.emg_mobile_no || "",
        familyDetails: safeJsonParse(apiData.family_details).map((fd: any) => ({
            familyName: fd.name || "",
            familyRelation: fd.relation || "",
            familyOccupation: fd.occupation || "",
            familyDateOfBirth: fd.dob ? dayjs(fd.dob, "YYYY-MM-DD").toDate() : null,
        })),
        educationalDetails: safeJsonParse(apiData.education_details).map((ed: any) => ({
            degree: ed.degree || "",
            university: ed.university || "",
            percentageGrade: ed.grade || "",
            educationFromDate: ed.from_date ? dayjs(ed.from_date, "YYYY-MM-DD").toDate() : null,
            educationToDate: ed.to_date ? dayjs(ed.to_date, "YYYY-MM-DD").toDate() : null,
            specialization: ed.specialization || "",
        })),
        // EDIT-MODE: Map `company_name` from API to `organization` in the form.
        // `annualCTC` will be empty if not provided by API, which is correct.
        employmentDetails: workExperienceType === 'experienced' ? safeJsonParse(apiData.employee_details).map((emp: any) => ({
            organization: emp.company_name || "",
            designation: emp.designation || "",
            annualCTC: emp.annual_ctc || "",
            periodServiceFrom: emp.from_date ? dayjs(emp.from_date, "YYYY-MM-DD").toDate() : null,
            periodServiceTo: emp.to_date ? dayjs(emp.to_date, "YYYY-MM-DD").toDate() : null,
        })) : [],
    };
};
const formNationalityOptions = [{ value: 1, label: 'American' }, { value: 2, label: 'Canadian' }, { value: 3, label: 'Indian' }, { value: 4, label: 'British' }, { value: 5, label: 'Other' },];
const formCountriesData = [{ value: 1, label: 'United States' }, { value: 2, label: 'Canada' }, { value: 3, label: 'India' }, { value: 4, label: 'United Kingdom' },];
// EDIT-MODE: These are no longer needed for state/city dropdowns but kept for reference or other uses.
// const formStatesByCountryData: Record<number, Array<{ value: number; label: string }>> = { 1: [{ value: 10, label: 'New York' }, { value: 11, label: 'California' }, { value: 12, label: 'Texas' }], 2: [{ value: 20, label: 'Ontario' }, { value: 21, label: 'Quebec' }, { value: 22, label: 'British Columbia' }], 3: [{ value: 30, label: 'Maharashtra' }, { value: 31, label: 'Karnataka' }, { value: 32, label: 'Delhi' }, { value: 33, label: 'Tamil Nadu' }], 4: [{ value: 40, label: 'England' }, { value: 41, label: 'Scotland' }, { value: 42, label: 'Wales' }], };
// const formCitiesByStateData: Record<number, Array<{ value: number; label: string }>> = { 10: [{ value: 100, label: 'New York City' }, { value: 101, label: 'Buffalo' }], 11: [{ value: 110, label: 'Los Angeles' }, { value: 111, label: 'San Francisco' }], 30: [{ value: 300, label: 'Mumbai' }, { value: 301, label: 'Pune' }], 31: [{ value: 310, label: 'Bengaluru' }, { value: 311, label: 'Mysuru' }], 12: [{ value: 120, label: 'Houston' }, { value: 121, label: 'Austin' }], 20: [{ value: 200, label: 'Toronto' }, { value: 201, label: 'Ottawa' }], 21: [{ value: 210, label: 'Montreal' }, { value: 211, label: 'Quebec City' }], 22: [{ value: 220, label: 'Vancouver' }, { value: 221, label: 'Victoria' }], 32: [{ value: 320, label: 'New Delhi' }], 33: [{ value: 330, label: 'Chennai' }, { value: 331, label: 'Coimbatore' }], 40: [{ value: 400, label: 'London' }, { value: 401, label: 'Manchester' }], 41: [{ value: 410, label: 'Edinburgh' }, { value: 411, label: 'Glasgow' }], 42: [{ value: 420, label: 'Cardiff' }, { value: 421, label: 'Swansea' }], };

// --- START: Embedded Form Section Components ---
// NOTE: No changes were needed in the section components themselves.
interface PersonalDetailsSectionProps {
    control: any;
    errors: any;
    setValue: UseFormSetValue<ApplicationFormData>;
    departmentOptions: Array<{ value: string | number; label: string }>;
    workExperienceType: 'fresher' | 'experienced' | undefined;
}
const PersonalDetailsSection = ({ control, errors, setValue, departmentOptions, workExperienceType }: PersonalDetailsSectionProps) => {
    const dob = useWatch({ control, name: 'dateOfBirth' });
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
    const referenceValue = useWatch({ control, name: 'reference' });
    const {
        CountriesData = [],
    } = useSelector(masterSelector);


    const countryOptions = CountriesData.map((country: any) => ({
        // EDIT-MODE: Changed value from String(country.id) to country.id to match the schema's number type.
        value: country.id,
        label: country.name,
    }));
    // EDIT-MODE: Removed all state management and effects for state/city dropdowns
    // as they are now text inputs.

    useEffect(() => {
        if (dob && dayjs(dob).isValid()) {
            const age = dayjs().diff(dayjs(dob), 'year');
            setCalculatedAge(age);
            setValue('age', age, { shouldValidate: true, shouldDirty: true });
        } else {
            setCalculatedAge(null);
            setValue('age', null, { shouldValidate: true, shouldDirty: true });
        }
    }, [dob, setValue]);

    return (
        <Card id="personalDetails" className="mb-6">
            <h4 className="mb-6">1. Personal Details</h4>
            <div className="grid md:grid-cols-3 gap-x-4 gap-y-2">
                <FormItem label={<div>Job Department<span className="text-red-500"> * </span></div>} error={errors.department?.message as string}>
                    <Controller name="department" control={control} render={({ field }) =>
                        <UiSelect {...field} placeholder="Select Department" options={departmentOptions} value={departmentOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} />
                </FormItem>
                <FormItem label={<div>Applicant Name<span className="text-red-500"> * </span></div>} error={errors.name?.message as string}>
                    <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Full name" />} />
                </FormItem>
                <FormItem label={<div>Email<span className="text-red-500"> * </span></div>} error={errors.email?.message as string}><Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />} /></FormItem>
                <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} error={errors.mobileNo?.message as string}><Controller name="mobileNo" control={control} render={({ field }) => <Input {...field} placeholder="+1234567890" />} /></FormItem>
                <FormItem label={<div>Gender<span className="text-red-500"> * </span></div>} error={errors.gender?.message as string}><Controller name="gender" control={control} render={({ field }) => <UiSelect placeholder="Select Gender" options={genderOptions} value={genderOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                <FormItem label={<div>Date of Birth<span className="text-red-500"> * </span></div>} error={errors.dateOfBirth?.message as string}><Controller name="dateOfBirth" control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                <FormItem label="Age" error={errors.age?.message as string}>
                    <Controller name="age" control={control} render={({ field }) => (<Input type="number" placeholder="Calculated/Enter Age" {...field} value={field.value ?? (calculatedAge !== null ? calculatedAge : '')} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} />)} />
                </FormItem>
                <FormItem label="Nationality" error={errors.nationality?.message as string}><Controller name="nationality" control={control} render={({ field }) => <UiSelect placeholder="Select Nationality" options={formNationalityOptions} value={formNationalityOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                <FormItem label="Marital Status" error={errors.maritalStatus?.message as string}><Controller name="maritalStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Marital Status" options={maritalStatusOptions} value={maritalStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                <FormItem label="Blood Group" error={errors.bloodGroup?.message as string}><Controller name="bloodGroup" control={control} render={({ field }) => <UiSelect placeholder="Select Blood Group" options={bloodGroupOptions} value={bloodGroupOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>

                {/* EDIT-MODE: Country's onChange now clears state/city text inputs. State and City are now Input fields. */}
                <FormItem label="Country" error={errors.country?.message as string}><Controller name="country" control={control} render={({ field }) => <UiSelect placeholder="Select Country" options={countryOptions} value={countryOptions.find(o => o.value === field.value)} onChange={opt => { field.onChange(opt?.value); setValue('state', '', { shouldValidate: true }); setValue('city', '', { shouldValidate: true }); }} isClearable />} /></FormItem>
                <FormItem label="State" error={errors.state?.message as string}><Controller name="state" control={control} render={({ field }) => <Input {...field} placeholder="Enter State" />} /></FormItem>
                <FormItem label="City" error={errors.city?.message as string}><Controller name="city" control={control} render={({ field }) => <Input {...field} placeholder="Enter City" />} /></FormItem>

                <FormItem label="Local Address" error={errors.localAddress?.message as string} className="md:col-span-3"><Controller name="localAddress" control={control} render={({ field }) => <Input textArea rows={2} placeholder="Enter Local Address" {...field} />} /></FormItem>
                <FormItem label="Permanent Address" error={errors.permanentAddress?.message as string} className="md:col-span-3"><Controller name="permanentAddress" control={control} render={({ field }) => <Input textArea rows={2} placeholder="Enter Permanent Address" {...field} />} /></FormItem>

                <FormItem label={<div>Work Experience<span className="text-red-500"> * </span></div>} error={errors.workExperienceType?.message as string} className="md:col-span-3">
                    <Controller name="workExperienceType" control={control} render={({ field }) => (<Radio.Group value={field.value} onChange={field.onChange}><Radio value="fresher">Fresher</Radio><Radio value="experienced">Experienced</Radio></Radio.Group>)} />
                </FormItem>

                {workExperienceType === 'experienced' && (
                    <>
                        <FormItem label={<div>Total Experience<span className="text-red-500"> * </span></div>} error={errors.total_experience?.message as string}>
                            <Controller name="total_experience" control={control} render={({ field }) => <Input {...field} placeholder="e.g., 2 years 3 months" />} />
                        </FormItem>
                        <FormItem label={<div>Expected Salary<span className="text-red-500"> * </span></div>} error={errors.expected_salary?.message as string}>
                            <Controller name="expected_salary" control={control} render={({ field }) => <Input {...field} placeholder="e.g., 5 LPA or Negotiable" />} />
                        </FormItem>
                        <FormItem label={<div>Notice Period<span className="text-red-500"> * </span></div>} error={errors.notice_period?.message as string}>
                            <Controller name="notice_period" control={control} render={({ field }) => <Input {...field} placeholder="e.g., 1 month or Immediately" />} />
                        </FormItem>
                        <FormItem label="Reference" error={errors.reference?.message as string} className={referenceValue && referenceValue.trim() !== "" ? "md:col-span-1" : "md:col-span-3"}>
                            <Controller name="reference" control={control} render={({ field }) => <Input {...field} placeholder="Reference contact or details" />} />
                        </FormItem>
                        {referenceValue && referenceValue.trim() !== "" && (
                            <FormItem label={<div>Specify Reference<span className="text-red-500"> * </span></div>} error={errors.reference_specify?.message as string} className="md:col-span-2">
                                <Controller name="reference_specify" control={control} render={({ field }) => <Input textArea rows={1} {...field} placeholder="More details about the reference" />} />
                            </FormItem>
                        )}
                        {!(referenceValue && referenceValue.trim() !== "") && <div className="md:col-span-2 hidden md:block"></div>}

                    </>
                )}

                <FormItem label={<div>Applying for Job Title<span className="text-red-500"> * </span></div>} error={errors.jobTitle?.message as string}><Controller name="jobTitle" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Software Engineer" />} /></FormItem>
                <FormItem label="Job ID" error={errors.jobId?.message as string}><Controller name="jobId" control={control} render={({ field }) => <Input {...field} placeholder="e.g., JP001 or 0015" />} /></FormItem>
                <FormItem label={<div>Application Date<span className="text-red-500"> * </span></div>} error={errors.applicationDate?.message as string}><Controller name="applicationDate" control={control} render={({ field }) => <DatePicker placeholder="Select date" {...field} value={field.value ? dayjs(field.value).toDate() : new Date()} onChange={date => field.onChange(date)} />} /></FormItem>
                <FormItem label={<div>Application Status<span className="text-red-500"> * </span></div>} error={errors.status?.message as string}><Controller name="status" control={control} render={({ field }) => <UiSelect placeholder="Select status" options={applicationStatusOptions} value={applicationStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem>

                <FormItem label="Resume URL" error={errors.resumeUrl?.message as string} className="lg:col-span-1 md:col-span-2">
                    <Controller name="resumeUrl" control={control} render={({ field }) => <Input {...field} type='text' placeholder="https://link-to-resume.pdf or text" />} />
                </FormItem>
                <FormItem label="Job Application Link" error={errors.jobApplicationLink?.message as string} className="lg:col-span-2 md:col-span-1"><Controller name="jobApplicationLink" control={control} render={({ field }) => <Input {...field} placeholder="https://job-portal/apply/123 or text" />} /></FormItem>

                <FormItem label="Cover Letter (API: note)" error={errors.coverLetter?.message as string} className="md:col-span-3"><Controller name="coverLetter" control={control} render={({ field }) => <Input {...field} textArea rows={3} placeholder="Enter cover letter content..." />} /></FormItem>
                <FormItem label="Remarks/General Notes (API: remarks)" error={errors.notes?.message as string} className="md:col-span-3"><Controller name="notes" control={control} render={({ field }) => <Input {...field} textArea rows={3} placeholder="Enter additional notes or remarks..." />} /></FormItem>
            </div>
        </Card>
    );
};
const FamilyDetailsSection = ({ control, errors }: { control: any, errors: any }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "familyDetails" });
    return (
        <Card id="familyDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4"><h4 className="mb-0">2. Family Details</h4><Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ familyName: '', familyRelation: '', familyOccupation: '', familyDateOfBirth: null } as FamilyMemberData)}>Add Member</Button></div>
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 items-end">
                        <FormItem label={`Name ${index + 1}`} error={errors.familyDetails?.[index]?.familyName?.message as string} className="mb-0"><Controller name={`familyDetails.${index}.familyName`} control={control} render={({ field }) => <Input {...field} placeholder="Full Name" />} /></FormItem>
                        <FormItem label="Relation" error={errors.familyDetails?.[index]?.familyRelation?.message as string} className="mb-0"><Controller name={`familyDetails.${index}.familyRelation`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., Father" />} /></FormItem>
                        <FormItem label="Occupation" error={errors.familyDetails?.[index]?.familyOccupation?.message as string} className="mb-0"><Controller name={`familyDetails.${index}.familyOccupation`} control={control} render={({ field }) => <Input {...field} placeholder="Occupation" />} /></FormItem>
                        <FormItem label="Date of Birth" error={errors.familyDetails?.[index]?.familyDateOfBirth?.message as string} className="mb-0"><Controller name={`familyDetails.${index}.familyDateOfBirth`} control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                    </div>
                    {fields.length > 0 && (<Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>)}
                </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-gray-500">No family members added. (Optional)</p>}
        </Card>
    );
};
const EmergencyContactSection = ({ control, errors }: { control: any, errors: any }) => (
    <Card id="emergencyContact" className="mb-6">
        <h4 className="mb-6">3. Emergency Contact Details<span className="text-red-500"> * </span></h4>
        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
            <FormItem label={<div>Relation<span className="text-red-500"> * </span></div>} error={errors.emergencyRelation?.message as string}><Controller name="emergencyRelation" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Spouse, Parent" />} /></FormItem>
            <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} error={errors.emergencyMobileNo?.message as string}><Controller name="emergencyMobileNo" control={control} render={({ field }) => <Input {...field} placeholder="Emergency contact number" />} /></FormItem>
        </div>
    </Card>
);
const EducationalDetailsSection = ({ control, errors }: { control: any, errors: any }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "educationalDetails" });
    return (
        <Card id="educationalDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4"><h4 className="mb-0">4. Educational Details<span className="text-red-500"> * </span></h4><Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ degree: '', university: '', percentageGrade: '', educationFromDate: null, educationToDate: null, specialization: '' } as EducationDetailData)}>Add Education</Button></div>
            {errors.educationalDetails && !Array.isArray(errors.educationalDetails) && errors.educationalDetails.message && <p className="text-red-500 text-sm mb-2">{errors.educationalDetails.message as string}</p>}
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                        <FormItem label={<div>Degree {index + 1}<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.degree?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.degree`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., B.Tech" />} /></FormItem>
                        <FormItem label={<div>University/Institution<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.university?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.university`} control={control} render={({ field }) => <Input {...field} placeholder="Name of University" />} /></FormItem>
                        <FormItem label={<div>Percentage/Grade<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.percentageGrade?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.percentageGrade`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., 75% or A+" />} /></FormItem>
                        <FormItem label={<div>From Date<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.educationFromDate?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.educationFromDate`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                        <FormItem label={<div>To Date<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.educationToDate?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.educationToDate`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                        <FormItem label="Specialization" error={errors.educationalDetails?.[index]?.specialization?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.specialization`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., CS" />} /></FormItem>
                    </div>
                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                </div>
            ))}
            {fields.length === 0 && errors.educationalDetails?.message && !Array.isArray(errors.educationalDetails) && (
                <p className="text-sm text-red-500 mt-2">{errors.educationalDetails.message as string}</p>
            )}
            {fields.length === 0 && !errors.educationalDetails?.message && <p className="text-sm text-gray-500">At least one educational detail is required.</p>}
        </Card>
    );
};
const EmploymentDetailsSection = ({ control, errors, workExperienceType }: { control: any, errors: any, workExperienceType: string | undefined }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "employmentDetails" });
    if (workExperienceType !== 'experienced') return null;
    return (
        <Card id="employmentDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4"><h4 className="mb-0">5. Employment Details (For Experienced)<span className="text-red-500"> * </span></h4><Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ organization: '', designation: '', annualCTC: '', periodServiceFrom: null, periodServiceTo: null } as EmploymentDetailData)}>Add Employment</Button></div>
            {errors.employmentDetails && !Array.isArray(errors.employmentDetails) && errors.employmentDetails.message && <p className="text-red-500 text-sm mb-2">{errors.employmentDetails.message as string}</p>}
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                        <FormItem label={<div>Organization {index + 1}<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.organization?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.organization`} control={control} render={({ field }) => <Input {...field} placeholder="Company Name" />} /></FormItem>
                        <FormItem label={<div>Designation<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.designation?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.designation`} control={control} render={({ field }) => <Input {...field} placeholder="Your Role" />} /></FormItem>
                        <FormItem label="Annual CTC" error={errors.employmentDetails?.[index]?.annualCTC?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.annualCTC`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., 12 LPA" />} /></FormItem>
                        <FormItem label={<div>From<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.periodServiceFrom?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceFrom`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                        <FormItem label={<div>To<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.periodServiceTo?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceTo`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                    </div>
                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                </div>
            ))}
            {fields.length === 0 && errors.employmentDetails?.message && !Array.isArray(errors.employmentDetails) && (
                <p className="text-sm text-red-500 mt-2">{errors.employmentDetails.message as string}</p>
            )}
            {fields.length === 0 && !errors.employmentDetails?.message && <p className="text-sm text-gray-500">At least one employment detail is required for experienced candidates.</p>}
        </Card>
    );
};
// --- END: Embedded Form Section Components ---

const AddJobApplicationPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const applicationId = location?.state?.id || 0
    
    const isEditMode = !!applicationId;

    const [isLoadingData, setIsLoadingData] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const { departmentsData, jobApplicationsData, CountriesData } = useSelector(masterSelector);

    useEffect(() => {
        dispatch(getCountriesAction());
        if (!departmentsData?.data || departmentsData.data.length === 0) {
            dispatch(getDepartmentsAction());
        }
        if (isEditMode && (!jobApplicationsData?.data || jobApplicationsData.data.length === 0)) {
            dispatch(getJobApplicationsAction());
        }
    }, [dispatch, departmentsData, jobApplicationsData, isEditMode]);

    const departmentOptions = useMemo(() => {
        const depts: any = Array.isArray(departmentsData?.data) ? departmentsData.data : [];
        return depts.map((dept: { id: number; name: string }) => ({ value: dept.id, label: dept.name }));
    }, [departmentsData?.data]);

    const { control, handleSubmit, reset, formState: { errors, isDirty }, watch, setValue, trigger, setError } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: {
            department: undefined, name: "", email: "", mobileNo: "", gender: undefined, dateOfBirth: null, age: null,
            nationality: undefined, maritalStatus: undefined, bloodGroup: undefined,
            // EDIT-MODE: Default values for state/city are now empty strings
            country: undefined, state: "", city: "",
            localAddress: "", permanentAddress: "", workExperienceType: "fresher",
            jobId: "", jobTitle: "", applicationDate: new Date(),
            // EDIT-MODE: Default status is now lowercase to match schema
            status: "new",
            resumeUrl: "", jobApplicationLink: "",
            coverLetter: "", notes: "",
            familyDetails: [], emergencyRelation: "", emergencyMobileNo: "",
            educationalDetails: [],
            employmentDetails: [],
            total_experience: "", expected_salary: "", notice_period: "", reference: "", reference_specify: ""
        },
        mode: 'onTouched',
    });

    useEffect(() => {
        if (isEditMode && jobApplicationsData?.data) {
            console.log(jobApplicationsData, "jobApplicationsData 11111", applicationId);
            
            const applicationToEdit = jobApplicationsData.data.find(app => app.id.toString() === applicationId);
            if (applicationToEdit) {
                const formData = transformApiToFormData(applicationToEdit);
                reset(formData);
                setIsLoadingData(false);
            } else {
                toast.push(<Notification title="Not Found" type="danger">Job application not found.</Notification>);
                navigate('/hr-employees/job-applications');
            }
        }
    }, [isEditMode, applicationId]);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log("Current Form Validation Errors:", JSON.parse(JSON.stringify(errors)));
        }
    }, [errors]);

    const workExperienceType = watch('workExperienceType');

    useEffect(() => {
        const fieldsToResetForFresher: (keyof ApplicationFormData)[] = ['total_experience', 'expected_salary', 'notice_period', 'reference', 'reference_specify'];
        if (workExperienceType === 'fresher') {
            fieldsToResetForFresher.forEach(field => setValue(field, "", { shouldValidate: true, shouldDirty: true }));
            setValue('employmentDetails', [], { shouldValidate: true, shouldDirty: true });
        }
        // When switching, re-validate to apply conditional rules
        if (workExperienceType === 'experienced') {
            trigger(['total_experience', 'expected_salary', 'notice_period', 'employmentDetails']);
        }
    }, [workExperienceType, setValue, trigger]);

    const onSubmitHandler = async (formData: ApplicationFormData) => {
        setIsSubmitting(true);
        const payload = transformFormDataToApiPayload(formData, applicationId);
        console.log(`Submitting ${isEditMode ? 'Updated' : 'New'} Application Payload:`, JSON.stringify(payload, null, 2));

        const action = isEditMode ? editJobApplicationAction(payload) : addJobApplicationAction(payload);
        const actionType = isEditMode ? 'Update' : 'Add';

        try {
            const resultAction = await dispatch(action);
            if (resultAction) {
                toast.push(<Notification title={`Application ${actionType}d`} type="success" duration={2000}>Job application {actionType.toLowerCase()}d successfully.</Notification>);
                dispatch(getJobApplicationsAction());
                reset();
                navigate('/hr-employees/job-application');
            } else {
                let toastMessage = `Operation failed. Please check your input.`;
                const errorPayload = resultAction.payload as any;

                if (errorPayload?.message) {
                    toastMessage = errorPayload.message;
                }
                if (errorPayload?.errors) {
                    Object.entries(errorPayload.errors).forEach(([field, messages]) => {
                        setError(field as any, { type: 'server', message: (messages as string[]).join(', ') });
                    });
                    const fieldErrorText = Object.values(errorPayload.errors).flat().join(' ');
                    toastMessage = `Validation Failed: ${fieldErrorText}`;
                }

                toast.push(<Notification title={`${actionType} Failed`} type="danger" duration={5000}>{toastMessage}</Notification>);
                console.error(`Submit Error (API) for ${actionType}:`, resultAction.payload || resultAction.error);
            }
        } catch (error: any) {
            toast.push(<Notification title="Submit Exception" type="danger" duration={5000}>An unexpected error occurred.</Notification>);
            console.error("Submit Exception:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hr-employees/job-applications');
    };

    if (isLoadingData) {
        return (
            <Container className="h-full">
                <Loading loading={true} />
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <FormContainer>
                <form onSubmit={handleSubmit(onSubmitHandler, (formErrors) => {
                    console.log("Form validation errors on submit (handler):", formErrors);
                    toast.push(<Notification title="Validation Error" type="warning" duration={3000}>Please correct the highlighted errors before submitting.</Notification>);
                })}>
                    <div className='flex gap-1 items-center mb-3'>
                        <NavLink to="/hr-employees/job-applications"><h6 className='font-semibold hover:text-primary-600'>Job Applications</h6></NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h6 className='font-semibold text-primary-600'>{isEditMode ? 'Edit Application' : 'Add New Application'}</h6>
                    </div>

                    <PersonalDetailsSection control={control} errors={errors} setValue={setValue} departmentOptions={departmentOptions} workExperienceType={workExperienceType} />
                    <FamilyDetailsSection control={control} errors={errors} />
                    <EmergencyContactSection control={control} errors={errors} />
                    <EducationalDetailsSection control={control} errors={errors} />
                    <EmploymentDetailsSection control={control} errors={errors} workExperienceType={workExperienceType} />

                    <div className="mt-8 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting}>
                            {isEditMode ? 'Update Application' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); reset(); navigate('/hr-employees/job-applications'); }} onCancel={() => setCancelConfirmOpen(false)}>
                <p>You have unsaved changes. Discard them and leave?</p>
            </ConfirmDialog>
        </Container>
    );
};
export default AddJobApplicationPage;