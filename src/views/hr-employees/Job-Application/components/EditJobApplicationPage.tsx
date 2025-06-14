import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray, useWatch, UseFormSetValue, UseFormSetError } from 'react-hook-form'; // Added UseFormSetError
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer } from '@/components/ui/Form';
import { Select as UiSelect, DatePicker, Button, Radio, Card } from '@/components/ui';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbPlus, TbTrash } from 'react-icons/tb';

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
    getJobApplicationsAction,
    addJobApplicationAction,
    getDepartmentsAction,
} from '@/reduxtool/master/middleware';

// Types and Schema
import type {
    ApplicationFormData,
    FamilyMemberData,
    EducationDetailData,
    EmploymentDetailData,
    // Gender as GenderType // Import if needed for strict typing, genderOptions already uses it
} from '../types'; // Adjust path if 'types.ts' is elsewhere
import {
    applicationFormSchema,
    applicationStatusOptions,
    genderOptions,
    maritalStatusOptions,
    bloodGroupOptions,
} from '../types'; // Adjust path
import { useSelector } from 'react-redux';

// --- START: Embedded Utilities & Static Data ---

const transformFormStatusToApiStatus = (formStatusValue?: string): string => {
    if (!formStatusValue) return 'New'; // Default if undefined
    const option = applicationStatusOptions.find(opt => opt.value === formStatusValue);
    return option ? option.label : formStatusValue; // API expects the label
};

const transformFormDataToApiPayload = (formData: ApplicationFormData, applicationId?: string) => {
    const payload: any = {
        job_department_id: formData.department ? Number(formData.department) : null,
        name: formData.name,
        email: formData.email,
        mobile_no: formData.mobileNo || "",
        city: formData.city ? Number(formData.city) : null,
        state: formData.state ? Number(formData.state) : null,
        country: formData.country ? Number(formData.country) : null,
        nationality: formData.nationality ? Number(formData.nationality) : null,
        marital_status: formData.maritalStatus || "",
        emg_mobile_no: "", // As per example payload, these are empty at the top level
        emg_relation: "",  // Data is in emergency_contact_details
        gender: formData.gender || "", // Will be non-empty due to schema validation
        age: formData.age ? Number(formData.age) : null,
        dob: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format("YYYY-MM-DD") : null,
        blood_group: formData.bloodGroup || "",
        local_address: formData.localAddress || "",
        permanent_address: formData.permanentAddress || "",
        work_experience: formData.workExperienceType === "experienced" ? 1 : 0,

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

        employee_details: formData.workExperienceType === "experienced"
            ? formData.employmentDetails?.map(emp => ({
                organization: emp.organization,
                designation: emp.designation,
                annual_ctc: emp.annualCTC || "",
                from_date: emp.periodServiceFrom ? dayjs(emp.periodServiceFrom).format("YYYY-MM-DD") : null,
                to_date: emp.periodServiceTo ? dayjs(emp.periodServiceTo).format("YYYY-MM-DD") : null,
            })) || [] // Send empty array if not experienced or no details
            : [],

        family_details: formData.familyDetails?.map(fd => ({
            name: fd.familyName,
            relation: fd.familyRelation,
            occupation: fd.familyOccupation,
            dob: fd.familyDateOfBirth ? dayjs(fd.familyDateOfBirth).format("YYYY-MM-DD") : null,
        })) || [],

        first_interview: "",
        first_int_remarks: "",
        second_interview: "",
        second_int_remarks: "",
        final_interview: "",
        final_int_remarks: "",

        status: transformFormStatusToApiStatus(formData.status), // API expects "Rejected", not "rejected"
        remarks: formData.notes || "", // API 'remarks' is 'notes' in form
        job_link_token: formData.jobApplicationLink || "", // Per example, this could be empty
        job_link_datetime: "", // No form field, send empty

        job_title: formData.jobTitle,
        job_id: formData.jobId || "",
        application_date: formData.applicationDate ? dayjs(formData.applicationDate).format("YYYY-MM-DD") : null,
        resume_url: formData.resumeUrl || "",
        application_link: formData.jobApplicationLink || "", // Per example, this could be an ID like "89489"

        emergency_contact_details: JSON.stringify({ // This contains the actual emergency contact data
            relation: formData.emergencyRelation || "",
            mobile_no: formData.emergencyMobileNo || "",
        }),
        note: formData.coverLetter || "", // API 'note' is 'coverLetter' in form
    };

    if (applicationId) {
        payload.id = applicationId;
    }
    return payload;
};

// These options are specific to this form's value requirements (numeric IDs)
const formNationalityOptions = [
    { value: 1, label: 'American' }, { value: 2, label: 'Canadian' },
    { value: 3, label: 'Indian' }, { value: 4, label: 'British' },
    { value: 5, label: 'Other' }, // Example, expand as needed
];
const formCountriesData = [
    { value: 1, label: 'United States' }, { value: 2, label: 'Canada' },
    { value: 3, label: 'India' }, { value: 4, label: 'United Kingdom' },
];
const formStatesByCountryData: Record<number, Array<{ value: number; label: string }>> = {
    1: [{ value: 10, label: 'New York' }, { value: 11, label: 'California' }, { value: 12, label: 'Texas' }],
    2: [{ value: 20, label: 'Ontario' }, { value: 21, label: 'Quebec' }, { value: 22, label: 'British Columbia' }],
    3: [{ value: 30, label: 'Maharashtra' }, { value: 31, label: 'Karnataka' }, { value: 32, label: 'Delhi' }, { value: 33, label: 'Tamil Nadu' }],
    4: [{ value: 40, label: 'England' }, { value: 41, label: 'Scotland' }, { value: 42, label: 'Wales' }],
};
const formCitiesByStateData: Record<number, Array<{ value: number; label: string }>> = {
    10: [{ value: 100, label: 'New York City' }, { value: 101, label: 'Buffalo' }],
    11: [{ value: 110, label: 'Los Angeles' }, { value: 111, label: 'San Francisco' }],
    30: [{ value: 300, label: 'Mumbai' }, { value: 301, label: 'Pune' }],
    31: [{ value: 310, label: 'Bengaluru'}, { value: 311, label: 'Mysuru'}],
    12: [{ value: 120, label: 'Houston' }, { value: 121, label: 'Austin' }],
    20: [{ value: 200, label: 'Toronto' }, { value: 201, label: 'Ottawa' }],
    21: [{ value: 210, label: 'Montreal' }, { value: 211, label: 'Quebec City' }],
    22: [{ value: 220, label: 'Vancouver' }, { value: 221, label: 'Victoria' }],
    32: [{ value: 320, label: 'New Delhi' }],
    33: [{ value: 330, label: 'Chennai' }, { value: 331, label: 'Coimbatore' }],
    40: [{ value: 400, label: 'London' }, { value: 401, label: 'Manchester' }],
    41: [{ value: 410, label: 'Edinburgh' }, { value: 411, label: 'Glasgow' }],
    42: [{ value: 420, label: 'Cardiff' }, { value: 421, label: 'Swansea' }],
};
// --- END: Embedded Utilities & Static Data ---


// --- START: Embedded Form Section Components ---
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
    const selectedCountry = useWatch({ control, name: 'country' }) as number | undefined;
    const selectedState = useWatch({ control, name: 'state' }) as number | undefined;
    const [stateOptions, setStateOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [cityOptions, setCityOptions] = useState<Array<{ value: number; label: string }>>([]);

    const referenceValue = useWatch({ control, name: 'reference' });

    useEffect(() => {
        if (dob && dayjs(dob).isValid()) {
            const age = dayjs().diff(dayjs(dob), 'year');
            setCalculatedAge(age);
            setValue('age', age, {shouldValidate: true, shouldDirty: true });
        } else {
            setCalculatedAge(null);
            setValue('age', null, {shouldValidate: true, shouldDirty: true });
        }
    }, [dob, setValue]);

    useEffect(() => {
        if (selectedCountry) {
            const newStates = formStatesByCountryData[selectedCountry] || [];
            setStateOptions(newStates);
            const currentSelectedState = control._getWatch('state');
            if (!newStates.find(s => s.value === currentSelectedState)) {
                 setValue('state', undefined, { shouldValidate: true, shouldDirty: true });
                 setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
            }
        } else {
            setStateOptions([]);
            setCityOptions([]); // Clear city options if country is cleared
            setValue('state', undefined, { shouldValidate: true, shouldDirty: true });
            setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCountry, setValue]); // control removed as _getWatch can be problematic in deps

    useEffect(() => {
        if (selectedState) {
            const newCities = formCitiesByStateData[selectedState] || [];
            setCityOptions(newCities);
            const currentCity = control._getWatch('city');
            if (!newCities.find(c => c.value === currentCity)) {
                setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
            }
        } else {
            setCityOptions([]);
            // setValue('city', undefined, { shouldValidate: true, shouldDirty: true }); // This might clear city when state is reset by country change
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedState, setValue]); // control removed

    useEffect(() => { // For initial load or if values are pre-filled externally
        const initialCountry = control._getWatch('country');
        if (initialCountry && formStatesByCountryData[initialCountry]) {
            setStateOptions(formStatesByCountryData[initialCountry]);
        }
        const initialState = control._getWatch('state');
        if (initialState && formCitiesByStateData[initialState]) {
            setCityOptions(formCitiesByStateData[initialState]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

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
                    <Controller name="age" control={control} render={({ field }) => (<Input type="number" placeholder="Calculated/Enter Age" {...field} value={field.value ?? (calculatedAge !== null ? calculatedAge : '')} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} /> )} />
                </FormItem>
                <FormItem label="Nationality" error={errors.nationality?.message as string}><Controller name="nationality" control={control} render={({ field }) => <UiSelect placeholder="Select Nationality" options={formNationalityOptions} value={formNationalityOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                <FormItem label="Marital Status" error={errors.maritalStatus?.message as string}><Controller name="maritalStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Marital Status" options={maritalStatusOptions} value={maritalStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                <FormItem label="Blood Group" error={errors.bloodGroup?.message as string}><Controller name="bloodGroup" control={control} render={({ field }) => <UiSelect placeholder="Select Blood Group" options={bloodGroupOptions} value={bloodGroupOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />}/></FormItem>

                <FormItem label="Country" error={errors.country?.message as string}><Controller name="country" control={control} render={({ field }) => <UiSelect placeholder="Select Country" options={formCountriesData} value={formCountriesData.find(o => o.value === field.value)} onChange={opt => { field.onChange(opt?.value); setValue('state', undefined, {shouldValidate: true}); setValue('city', undefined, {shouldValidate: true}); }} isClearable />} /></FormItem>
                <FormItem label="State" error={errors.state?.message as string}><Controller name="state" control={control} render={({ field }) => <UiSelect placeholder="Select State" options={stateOptions} value={stateOptions.find(o => o.value === field.value)} onChange={opt => { field.onChange(opt?.value); setValue('city', undefined, {shouldValidate: true}); }} isDisabled={!selectedCountry || stateOptions.length === 0} isClearable />} /></FormItem>
                <FormItem label="City" error={errors.city?.message as string}><Controller name="city" control={control} render={({ field }) => <UiSelect placeholder="Select City" options={cityOptions} value={cityOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isDisabled={!selectedState || cityOptions.length === 0} isClearable />} /></FormItem>

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
                        {/* Ensure grid layout consistency */}
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
                        <FormItem label={<div>From Date<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.educationFromDate?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.educationFromDate`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                        <FormItem label={<div>To Date<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.educationToDate?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.educationToDate`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} maxDate={new Date()} />} /></FormItem>
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
                        <FormItem label={<div>From<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.periodServiceFrom?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceFrom`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                        <FormItem label={<div>To<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.periodServiceTo?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceTo`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} maxDate={new Date()} />} /></FormItem>
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


const EditJobApplicationPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const { departmentsData } = useSelector(masterSelector);
    useEffect(() => {
        if (!departmentsData?.data || departmentsData.data.length === 0) {
            dispatch(getDepartmentsAction());
        }
    }, [dispatch, departmentsData]);

    const departmentOptions = useMemo(() => {
        const depts: any = Array.isArray(departmentsData?.data) ? departmentsData.data : [];
        return depts.map((dept: { id: number; name: string }) => ({ value: dept.id, label: dept.name }));
    }, [departmentsData?.data]);


    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid }, watch, setValue, trigger, setError } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: {
            department: undefined, name: "", email: "", mobileNo: "", gender: undefined, dateOfBirth: null, age: null,
            nationality: undefined, maritalStatus: undefined, bloodGroup: undefined,
            country: undefined, state: undefined, city: undefined,
            localAddress: "", permanentAddress: "", workExperienceType: "fresher",
            jobId: "", jobTitle: "", applicationDate: new Date(), status: "New", // Default to New status
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
        if (Object.keys(errors).length > 0) {
            console.log("Current Form Validation Errors:", JSON.parse(JSON.stringify(errors)));
        }
    }, [errors]);

    const workExperienceType = watch('workExperienceType');

    useEffect(() => {
        const fieldsToResetForFresher: (keyof ApplicationFormData)[] = [
            'total_experience', 'expected_salary', 'notice_period',
            'reference', 'reference_specify'
        ];

        if (workExperienceType === 'fresher') {
            fieldsToResetForFresher.forEach(field => setValue(field, "", { shouldValidate: true, shouldDirty: true }));
            setValue('employmentDetails', [], { shouldValidate: true, shouldDirty: true });
            // Optionally trigger validation for these fields if needed, though superRefine should catch it.
            // trigger([...fieldsToResetForFresher, 'employmentDetails']);
        }
    }, [workExperienceType, setValue, trigger]);


   
    
    

    const onSubmitHandler = async (formData: ApplicationFormData) => {
        setIsSubmitting(true);
        const payload = transformFormDataToApiPayload(formData);
        console.log("Submitting New Application Payload:", JSON.stringify(payload, null, 2));

        try {
            const resultAction = await dispatch(addJobApplicationAction(payload));
            if (addJobApplicationAction.fulfilled.match(resultAction)) {
                toast.push(<Notification title="Application Added" type="success" duration={2000}>New job application added successfully.</Notification>);
                dispatch(getJobApplicationsAction()); // Refresh list
                reset();
                navigate('/hr-employees/job-applications');
            } else {
                let toastMessage = "Operation failed. Please check your input.";
                const errorPayload = resultAction.payload as any;

                if (errorPayload && typeof errorPayload === 'object') {
                    if (errorPayload.message && typeof errorPayload.message === 'string') {
                        toastMessage = errorPayload.message;
                    }

                    if (errorPayload.errors && typeof errorPayload.errors === 'object') {
                        const fieldErrors = Object.entries(errorPayload.errors)
                            .map(([field, messages]) => {
                                const messageArray = Array.isArray(messages) ? messages : [messages];
                                // Attempt to map API error key to form field name (simple example)
                                // const formFieldKey = apiToFormFieldKeyMap[field] || field;
                                // setError(formFieldKey as any, { type: 'server', message: messageArray.join(', ') });
                                return `${field}: ${messageArray.join(', ')}`;
                            })
                            .join('; ');

                        if (fieldErrors) {
                            // If a general message was already set from errorPayload.message, append details.
                            // Otherwise, the field errors themselves become the main message.
                            if (toastMessage !== "Operation failed. Please check your input." && toastMessage !== errorPayload.message) {
                                toastMessage = fieldErrors; // Prefer specific errors if no general message from API
                            } else if (errorPayload.message && errorPayload.message !== toastMessage) {
                                toastMessage = `${errorPayload.message} Details: ${fieldErrors}`;
                            }
                             else {
                                toastMessage = `Validation Failed: ${fieldErrors}`;
                            }
                        }
                    }
                } else if (typeof resultAction.payload === 'string') {
                    toastMessage = resultAction.payload;
                }

                toast.push(<Notification title="Add Failed" type="danger" duration={5000}>{toastMessage}</Notification>);
                console.error("Submit Error (API):", resultAction.payload || resultAction.error);
            }
        } catch (error: any) {
            // This catch block handles unexpected errors during dispatch or other operations
            let exceptionMessage = "An unexpected error occurred.";
            if (error?.response?.data) { // Example for Axios error structure
                const responseData = error.response.data;
                if (responseData.message) exceptionMessage = responseData.message;
                if (responseData.errors) {
                    const fieldErrors = Object.entries(responseData.errors).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('; ');
                    exceptionMessage += ` Details: ${fieldErrors}`;
                }
            } else if (error?.message) {
                exceptionMessage = error.message;
            }
            toast.push(<Notification title="Submit Exception" type="danger" duration={5000}>{exceptionMessage}</Notification>);
            console.error("Submit Exception:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hr-employees/job-applications');
    };


    
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
                        <h6 className='font-semibold text-primary-600'>Add New Application</h6>
                    </div>

                    <PersonalDetailsSection
                        control={control}
                        errors={errors}
                        setValue={setValue}
                        departmentOptions={departmentOptions}
                        workExperienceType={workExperienceType}
                    />
                    <FamilyDetailsSection control={control} errors={errors} />
                    <EmergencyContactSection control={control} errors={errors} />
                    <EducationalDetailsSection control={control} errors={errors} />
                    <EmploymentDetailsSection control={control} errors={errors} workExperienceType={workExperienceType} />

                    <div className="mt-8 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isSubmitting}
                            disabled={isSubmitting || !isDirty || !isValid} // Keep !isDirty || !isValid for better UX
                        >
                            Submit Application
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
export default EditJobApplicationPage;