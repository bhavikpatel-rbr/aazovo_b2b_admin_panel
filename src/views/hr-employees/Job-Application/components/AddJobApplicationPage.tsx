import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

// UI Components
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Container from '@/components/shared/Container';
import Loading from '@/components/shared/Loading';
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
    editJobApplicationAction,
    getCountriesAction,
    getDepartmentsAction,
    getJobApplicationsAction,
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from "@/reduxtool/store";

// Types and Schema
import type {
    ApplicationFormData
} from '../types';

// --- Schemas & Types ---
const phoneRegex = new RegExp(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/);

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
    if (data.educationFromDate && data.educationToDate) return data.educationToDate >= data.educationFromDate;
    return true;
}, { message: "End date must be on or after start date", path: ["educationToDate"], });

const employmentDetailSchema = z.object({
    organization: z.string().min(1, "Organization is required."),
    designation: z.string().min(1, "Designation is required."),
    annualCTC: z.string().optional(),
    periodServiceFrom: z.date({ required_error: "Start date is required." }),
    periodServiceTo: z.date({ required_error: "End date is required." }),
}).refine(data => {
    if (data.periodServiceFrom && data.periodServiceTo) return data.periodServiceTo >= data.periodServiceFrom;
    return true;
}, { message: "End date must be on or after start date", path: ["periodServiceTo"], });

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
    state: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    localAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    jobTitle: z.string().min(1, "Job title is required."),
    jobId: z.string().optional(),
    applicationDate: z.date({ required_error: "Application date is required." }),
    status: z.enum(['New', 'In Review', 'Shortlisted', 'Hired', 'Rejected']),
    resume: z.any().optional(),
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
        if (!data.total_experience?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Total experience is required.", path: ['total_experience'] });
        if (!data.expected_salary?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expected salary is required.", path: ['expected_salary'] });
        if (!data.notice_period?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Notice period is required.", path: ['notice_period'] });
        if (data.employmentDetails.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one employment detail is required for experienced candidates.", path: ['employmentDetails'] });
    }
    if (data.reference?.trim() && !data.reference_specify?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please specify details for the reference provided.", path: ['reference_specify'] });
});

// --- Static Options Data ---
export const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
export const maritalStatusOptions = [{ value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }, { value: 'Divorced', label: 'Divorced' }, { value: 'Widowed', label: 'Widowed' }];
export const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }];
export const applicationStatusOptions = [{ value: 'New', label: 'New' }, { value: 'In Review', label: 'In Review' }, { value: 'Shortlisted', label: 'Shortlisted' }, { value: 'Hired', label: 'Hired' }, { value: 'Rejected', label: 'Rejected' }];
export const formNationalityOptions = [{ value: 1, label: 'American' }, { value: 2, label: 'Canadian' }, { value: 3, label: 'Indian' }, { value: 4, label: 'British' }, { value: 5, label: 'Other' }];

// --- Data Transformation Utilities ---
const transformApiStatusToFormStatus = (apiStatus?: string): string => {
    if (!apiStatus) return 'New';
    const option = applicationStatusOptions.find(opt => opt.label.toLowerCase() === apiStatus.toLowerCase());
    return option ? option.value : 'New';
};

const transformFormStatusToApiStatus = (formStatusValue?: string): string => {
    if (!formStatusValue) return 'New';
    const option = applicationStatusOptions.find(opt => opt.value === formStatusValue);
    return option ? option.label : formStatusValue;
};

// --- CORRECTED DATA TRANSFORMATION LOGIC ---
const transformApiToFormData = (apiData: any): ApplicationFormData => {
    const safeJsonParse = (jsonString: string | null | object, defaultVal: any[] = []) => {
        if (!jsonString) return defaultVal;
        if (typeof jsonString === 'object' && jsonString !== null) return jsonString; // Already parsed
        try {
            let parsed = JSON.parse(jsonString as string);
            // Handle double-stringified JSON
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            return Array.isArray(parsed) ? parsed : defaultVal;
        } catch (e) {
            console.error("Failed to parse JSON string from API:", jsonString, e);
            return defaultVal;
        }
    };

    const workExperienceType = apiData.work_experience === "experienced" || apiData.work_experience === 1 || apiData.work_experience === "1" ? 'experienced' : 'fresher';
    const parseDate = (date: any) => (date ? dayjs(date).toDate() : null);

    return {
        department: apiData.job_department_id ? Number(apiData.job_department_id) : undefined,
        name: apiData.name || "",
        email: apiData.email || "",
        mobileNo: apiData.mobile_no || "",
        gender: apiData.gender || undefined,
        dateOfBirth: parseDate(apiData.dob),
        age: apiData.age ? Number(apiData.age) : null,
        nationality: apiData.nationality ? Number(apiData.nationality) : undefined,
        maritalStatus: apiData.marital_status || undefined,
        bloodGroup: apiData.blood_group || undefined,
        country: apiData.country ? Number(apiData.country) : undefined,
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
        applicationDate: parseDate(apiData.application_date) || new Date(),
        status: transformApiStatusToFormStatus(apiData.status),
        resume: apiData.resume_url || apiData.resume || null,
        jobApplicationLink: apiData.application_link || "",
        coverLetter: apiData.note || "",
        notes: apiData.remarks || "",
        emergencyRelation: apiData.emg_relation || "",
        emergencyMobileNo: apiData.emg_mobile_no || "",

        // FIXED: Mapped keys to match the API response (e.g., familyName instead of name)
        familyDetails: safeJsonParse(apiData.family_details).map((fd: any) => ({
            familyName: fd.familyName || "",
            familyRelation: fd.familyRelation || "",
            familyOccupation: fd.familyOccupation || "",
            familyDateOfBirth: parseDate(fd.dob || fd.familyDateOfBirth)
        })),
        
        // FIXED: Mapped percentageGrade and made date parsing more robust
        educationalDetails: safeJsonParse(apiData.education_details).map((ed: any) => ({
            degree: ed.degree || "",
            university: ed.university || "",
            percentageGrade: ed.percentageGrade || "",
            educationFromDate: parseDate(ed.from_date || ed.educationFromDate),
            educationToDate: parseDate(ed.to_date || ed.educationToDate),
            specialization: ed.specialization || ""
        })),

        employmentDetails: workExperienceType === 'experienced'
            ? safeJsonParse(apiData.employee_details).map((emp: any) => ({
                organization: emp.company_name || "",
                designation: emp.designation || "",
                annualCTC: emp.annual_ctc || "",
                periodServiceFrom: parseDate(emp.from_date),
                periodServiceTo: parseDate(emp.to_date)
            }))
            : [],
    };
};

const transformFormDataToApiPayload = (formData: ApplicationFormData, applicationId?: string): FormData => {
    const payload = new FormData();
    const append = (key: string, value: any) => { if (value !== null && value !== undefined && value !== '') payload.append(key, value); };

    if (applicationId) {
        append('id', applicationId);
        payload.append('_method', 'PUT');
    }

    append('job_department_id', formData.department);
    append('name', formData.name);
    append('email', formData.email);
    append('mobile_no', formData.mobileNo);
    append('city', formData.city);
    append('state', formData.state);
    append('country', formData.country);
    append('nationality', formData.nationality);
    append('marital_status', formData.maritalStatus);
    append('gender', formData.gender);
    append('age', formData.age);
    append('dob', formData.dateOfBirth ? dayjs(formData.dateOfBirth).format("YYYY-MM-DD") : '');
    append('blood_group', formData.bloodGroup);
    append('local_address', formData.localAddress);
    append('permanent_address', formData.permanentAddress);
    append('work_experience', formData.workExperienceType === "experienced" ? "1" : "0");
    append('emg_mobile_no', formData.emergencyMobileNo);
    append('emg_relation', formData.emergencyRelation);

    if (formData.workExperienceType === "experienced") {
        append('total_experience', formData.total_experience);
        append('expected_salary', formData.expected_salary);
        append('notice_period', formData.notice_period);
        append('reference', formData.reference);
        append('reference_specify', formData.reference_specify);
    }

    if (formData.resume instanceof File) payload.append('resume', formData.resume);

    append('education_details', JSON.stringify(formData.educationalDetails?.map(ed => ({ ...ed, from_date: dayjs(ed.educationFromDate).format("YYYY-MM-DD"), to_date: dayjs(ed.educationToDate).format("YYYY-MM-DD") })) || []));
    append('employee_details', JSON.stringify(formData.workExperienceType === "experienced" ? formData.employmentDetails?.map(emp => ({ ...emp, from_date: dayjs(emp.periodServiceFrom).format("YYYY-MM-DD"), to_date: dayjs(emp.periodServiceTo).format("YYYY-MM-DD") })) || [] : []));
    append('family_details', JSON.stringify(formData.familyDetails?.map(fd => ({ ...fd, dob: fd.familyDateOfBirth ? dayjs(fd.familyDateOfBirth).format("YYYY-MM-DD") : '' })) || []));

    append('status', transformFormStatusToApiStatus(formData.status));
    append('remarks', formData.notes);
    append('job_title', formData.jobTitle);
    append('job_id', formData.jobId);
    append('application_date', formData.applicationDate ? dayjs(formData.applicationDate).format("YYYY-MM-DD") : '');
    append('application_link', formData.jobApplicationLink);
    append('note', formData.coverLetter);

    return payload;
};

const AddJobApplicationPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id: applicationId } = useLocation()?.state || {};

    const isEditMode = !!applicationId;

    const [isLoadingData, setIsLoadingData] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const { jobApplicationsData, departmentsData, CountriesData } = useSelector(masterSelector);

    useEffect(() => {
        dispatch(getJobApplicationsAction());
        dispatch(getCountriesAction());
        dispatch(getDepartmentsAction());
    }, [dispatch]);

    const departmentOptions = useMemo(() => {
        const depts: any[] = departmentsData?.data || [];
        return depts.map((dept) => ({ value: dept.id, label: dept.name }));
    }, [departmentsData?.data]);

    const countryOptions = useMemo(() => CountriesData?.length > 0 ? CountriesData.map((country: any) => ({ value: country.id, label: country.name })) : [], [CountriesData]);

    const { control, handleSubmit, reset, formState: { errors, isDirty }, watch, setValue } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: { status: "New", workExperienceType: "fresher", applicationDate: new Date(), educationalDetails: [], employmentDetails: [], familyDetails: [] },
        mode: 'onTouched',
    });

    useEffect(() => {
        if (isEditMode && jobApplicationsData?.data) { // Ensure data is available before processing
            const fetchApplicationData = () => {
                setIsLoadingData(true);
                try {
                    const result = jobApplicationsData.data.find((val: any) => val.id == applicationId);
                    if (result) {
                        const formData = transformApiToFormData(result);
                        reset(formData);
                    } else {
                        toast.push(<Notification title="Not Found" type="danger">Job application not found.</Notification>);
                        navigate('/hr-employees/job-applications');
                    }
                } catch (error) {
                    console.error("Error processing application data:", error);
                    toast.push(<Notification title="Error" type="danger">Failed to process application data.</Notification>);
                    navigate('/hr-employees/job-applications');
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchApplicationData();
        } else if (!isEditMode) {
             reset({ status: "New", workExperienceType: "fresher", applicationDate: new Date(), educationalDetails: [], employmentDetails: [], familyDetails: [] });
             setIsLoadingData(false);
        }
    }, [isEditMode, applicationId, navigate, reset, jobApplicationsData]);


    const workExperienceType = watch('workExperienceType');
    const dob = watch('dateOfBirth');
    const resumeValue = watch('resume');
    const referenceValue = watch('reference');
    const { fields: familyFields, append: appendFamily, remove: removeFamily } = useFieldArray({ control, name: "familyDetails" });
    const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "educationalDetails" });
    const { fields: empFields, append: appendEmp, remove: removeEmp } = useFieldArray({ control, name: "employmentDetails" });

    useEffect(() => {
        if (dob && dayjs(dob).isValid()) setValue('age', dayjs().diff(dayjs(dob), 'year'), { shouldValidate: true, shouldDirty: true });
        else setValue('age', null, { shouldValidate: true, shouldDirty: true });
    }, [dob, setValue]);

    useEffect(() => {
        if (workExperienceType === 'fresher') {
            const fieldsToReset: (keyof ApplicationFormData)[] = ['total_experience', 'expected_salary', 'notice_period', 'reference', 'reference_specify'];
            fieldsToReset.forEach(field => setValue(field, "", { shouldValidate: true }));
            setValue('employmentDetails', [], { shouldValidate: true });
        }
    }, [workExperienceType, setValue]);

    const onSubmitHandler = async (formData: ApplicationFormData) => {
        setIsSubmitting(true);
        const payload = transformFormDataToApiPayload(formData, applicationId);
        const action = isEditMode ? editJobApplicationAction({ id: applicationId, data: payload }) : addJobApplicationAction(payload);

        try {
            await dispatch(action).unwrap();
            toast.push(<Notification title={`Application ${isEditMode ? 'Updated' : 'Added'}`} type="success" />);
            navigate('/hr-employees/job-application');
        } catch (error: any) {
            toast.push(<Notification title="Operation Failed" type="danger">{error?.message || 'An unexpected error occurred.'}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hr-employees/job-applications');
    };

    if (isLoadingData) {
        return <Container className="h-full"><Loading loading={true} /></Container>;
    }

    return (
        <Container className="h-full">
            <FormContainer>
                <form onSubmit={handleSubmit(onSubmitHandler)}>
                    <div className='flex gap-1 items-center mb-3'>
                        <NavLink to="/hr-employees/job-applications"><h6 className='font-semibold hover:text-primary-600'>Job Applications</h6></NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h6 className='font-semibold text-primary-600'>{isEditMode ? 'Edit Application' : 'Add New Application'}</h6>
                    </div>

                    <Card id="personalDetails" className="mb-6">
                        <h4 className="mb-6">1. Personal Details</h4>
                        <div className="grid md:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label={<div>Job Department<span className="text-red-500"> * </span></div>} error={errors.department?.message}><Controller name="department" control={control} render={({ field }) => <UiSelect {...field} placeholder="Select Department" invalid={!!errors.department} options={departmentOptions} value={departmentOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                            <FormItem label={<div>Applicant Name<span className="text-red-500"> * </span></div>} error={errors.name?.message}><Controller name="name" control={control} render={({ field }) => <Input {...field} invalid={!!errors.name} placeholder="Full name" />} /></FormItem>
                            <FormItem label={<div>Email<span className="text-red-500"> * </span></div>} error={errors.email?.message}><Controller name="email" control={control} render={({ field }) => <Input {...field} invalid={!!errors.email} type="email" placeholder="email@example.com" />} /></FormItem>
                            <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} error={errors.mobileNo?.message}><Controller name="mobileNo" control={control} render={({ field }) => <Input {...field} invalid={!!errors.mobileNo} placeholder="+1234567890" />} /></FormItem>
                            <FormItem label={<div>Gender<span className="text-red-500"> * </span></div>} error={errors.gender?.message}><Controller name="gender" control={control} render={({ field }) => <UiSelect placeholder="Select Gender" invalid={!!errors.gender} options={genderOptions} value={genderOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                            <FormItem label={<div>Date of Birth<span className="text-red-500"> * </span></div>} error={errors.dateOfBirth?.message}><Controller name="dateOfBirth" control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} invalid={!!errors.dateOfBirth} value={field.value} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                            <FormItem label="Age" error={errors.age?.message}><Controller name="age" control={control} render={({ field }) => (<Input type="number" invalid={!!errors.age} placeholder="Calculated/Enter Age" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} />)} /></FormItem>
                            <FormItem label="Nationality" error={errors.nationality?.message}><Controller name="nationality" control={control} render={({ field }) => <UiSelect placeholder="Select Nationality" invalid={!!errors.nationality} options={formNationalityOptions} value={formNationalityOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                            <FormItem label="Marital Status" error={errors.maritalStatus?.message}><Controller name="maritalStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Marital Status" invalid={!!errors.maritalStatus} options={maritalStatusOptions} value={maritalStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                            <FormItem label="Blood Group" error={errors.bloodGroup?.message}><Controller name="bloodGroup" control={control} render={({ field }) => <UiSelect placeholder="Select Blood Group" invalid={!!errors.bloodGroup} options={bloodGroupOptions} value={bloodGroupOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem>
                            <FormItem label="Country" error={errors.country?.message}><Controller name="country" control={control} render={({ field }) => <UiSelect placeholder="Select Country" invalid={!!errors.country} options={countryOptions} value={countryOptions.find(o => o.value === field.value)} onChange={opt => { field.onChange(opt?.value); setValue('state', '', { shouldValidate: true }); setValue('city', '', { shouldValidate: true }); }} isClearable />} /></FormItem>
                            <FormItem label="State" error={errors.state?.message}><Controller name="state" control={control} render={({ field }) => <Input {...field} invalid={!!errors.state} placeholder="Enter State" />} /></FormItem>
                            <FormItem label="City" error={errors.city?.message}><Controller name="city" control={control} render={({ field }) => <Input {...field} invalid={!!errors.city} placeholder="Enter City" />} /></FormItem>
                            <FormItem label="Local Address" error={errors.localAddress?.message} className="md:col-span-3"><Controller name="localAddress" control={control} render={({ field }) => <Input textArea rows={2} invalid={!!errors.localAddress} placeholder="Enter Local Address" {...field} />} /></FormItem>
                            <FormItem label="Permanent Address" error={errors.permanentAddress?.message} className="md:col-span-3"><Controller name="permanentAddress" control={control} render={({ field }) => <Input textArea rows={2} invalid={!!errors.permanentAddress} placeholder="Enter Permanent Address" {...field} />} /></FormItem>
                            <FormItem label={<div>Work Experience<span className="text-red-500"> * </span></div>} error={errors.workExperienceType?.message} className="md:col-span-3"><Controller name="workExperienceType" control={control} render={({ field }) => (<Radio.Group value={field.value} onChange={field.onChange}><Radio value="fresher">Fresher</Radio><Radio value="experienced">Experienced</Radio></Radio.Group>)} /></FormItem>
                            {workExperienceType === 'experienced' && (<>
                                <FormItem label={<div>Total Experience<span className="text-red-500"> * </span></div>} error={errors.total_experience?.message}><Controller name="total_experience" control={control} render={({ field }) => <Input {...field} invalid={!!errors.total_experience} placeholder="e.g., 2 years 3 months" />} /></FormItem>
                                <FormItem label={<div>Expected Salary<span className="text-red-500"> * </span></div>} error={errors.expected_salary?.message}><Controller name="expected_salary" control={control} render={({ field }) => <Input {...field} invalid={!!errors.expected_salary} placeholder="e.g., 5 LPA or Negotiable" />} /></FormItem>
                                <FormItem label={<div>Notice Period<span className="text-red-500"> * </span></div>} error={errors.notice_period?.message}><Controller name="notice_period" control={control} render={({ field }) => <Input {...field} invalid={!!errors.notice_period} placeholder="e.g., 1 month or Immediately" />} /></FormItem>
                                <FormItem label="Reference" error={errors.reference?.message} className={referenceValue && referenceValue.trim() !== "" ? "md:col-span-1" : "md:col-span-3"}><Controller name="reference" control={control} render={({ field }) => <Input {...field} invalid={!!errors.reference} placeholder="Reference contact or details" />} /></FormItem>
                                {referenceValue && referenceValue.trim() !== "" && (<FormItem label={<div>Specify Reference<span className="text-red-500"> * </span></div>} error={errors.reference_specify?.message} className="md:col-span-2"><Controller name="reference_specify" control={control} render={({ field }) => <Input textArea rows={1} invalid={!!errors.reference_specify} {...field} placeholder="More details about the reference" />} /></FormItem>)}
                            </>)}
                            <FormItem label={<div>Applying for Job Title<span className="text-red-500"> * </span></div>} error={errors.jobTitle?.message}><Controller name="jobTitle" control={control} render={({ field }) => <Input {...field} invalid={!!errors.jobTitle} placeholder="e.g., Software Engineer" />} /></FormItem>
                            <FormItem label="Job ID" error={errors.jobId?.message}><Controller name="jobId" control={control} render={({ field }) => <Input {...field} invalid={!!errors.jobId} placeholder="e.g., JP001 or 0015" />} /></FormItem>
                            <FormItem label={<div>Application Date<span className="text-red-500"> * </span></div>} error={errors.applicationDate?.message}><Controller name="applicationDate" control={control} render={({ field }) => <DatePicker placeholder="Select date" {...field} invalid={!!errors.applicationDate} value={field.value} onChange={date => field.onChange(date)} />} /></FormItem>
                            <FormItem label={<div>Application Status<span className="text-red-500"> * </span></div>} error={errors.status?.message}><Controller name="status" control={control} render={({ field }) => <UiSelect placeholder="Select status" invalid={!!errors.status} options={applicationStatusOptions} value={applicationStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem>
                            <FormItem label="Resume" error={errors.resume?.message} className="lg:col-span-1 md:col-span-2">
                                {isEditMode && typeof resumeValue === 'string' && resumeValue && (<div className="mb-2"> <a href={resumeValue} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline"> View Current Resume </a> </div>)}
                                <Controller name="resume" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} invalid={!!errors.resume} onChange={(e) => { onChange(e.target.files?.[0] || null); }} accept=".pdf,.doc,.docx,.txt" />)} />
                            </FormItem>
                            <FormItem label="Job Application Link" error={errors.jobApplicationLink?.message} className="lg:col-span-2 md:col-span-1"><Controller name="jobApplicationLink" control={control} render={({ field }) => <Input {...field} invalid={!!errors.jobApplicationLink} placeholder="https://job-portal/apply/123 or text" />} /></FormItem>
                            <FormItem label="Cover Letter" error={errors.coverLetter?.message} className="md:col-span-3"><Controller name="coverLetter" control={control} render={({ field }) => <Input {...field} invalid={!!errors.coverLetter} textArea rows={3} placeholder="Enter cover letter content..." />} /></FormItem>
                            <FormItem label="Remarks/General Notes" error={errors.notes?.message} className="md:col-span-3"><Controller name="notes" control={control} render={({ field }) => <Input {...field} invalid={!!errors.notes} textArea rows={3} placeholder="Enter additional notes or remarks..." />} /></FormItem>
                        </div>
                    </Card>

                    <Card id="familyDetails" className="mb-6">
                        <div className="flex justify-between items-center mb-4"><h4 className="mb-0">2. Family Details</h4><Button size="sm" type="button" icon={<TbPlus />} onClick={() => appendFamily({ familyName: '', familyRelation: '', familyOccupation: '', familyDateOfBirth: null })}>Add Member</Button></div>
                        {familyFields.map((item, index) => (
                            <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 items-end">
                                    <FormItem label={`Name ${index + 1}`} error={errors.familyDetails?.[index]?.familyName?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyName`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.familyDetails?.[index]?.familyName} placeholder="Full Name" />} /></FormItem>
                                    <FormItem label="Relation" error={errors.familyDetails?.[index]?.familyRelation?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyRelation`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.familyDetails?.[index]?.familyRelation} placeholder="e.g., Father" />} /></FormItem>
                                    <FormItem label="Occupation" error={errors.familyDetails?.[index]?.familyOccupation?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyOccupation`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.familyDetails?.[index]?.familyOccupation} placeholder="Occupation" />} /></FormItem>
                                    <FormItem label="Date of Birth" error={errors.familyDetails?.[index]?.familyDateOfBirth?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyDateOfBirth`} control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} invalid={!!errors.familyDetails?.[index]?.familyDateOfBirth} value={field.value} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                                </div>
                                <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => removeFamily(index)} className="absolute top-2 right-2">Remove</Button>
                            </div>
                        ))}
                    </Card>

                    <Card id="emergencyContact" className="mb-6">
                        <h4 className="mb-6">3. Emergency Contact Details<span className="text-red-500"> * </span></h4>
                        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                            <FormItem label={<div>Relation<span className="text-red-500"> * </span></div>} error={errors.emergencyRelation?.message}><Controller name="emergencyRelation" control={control} render={({ field }) => <Input {...field} invalid={!!errors.emergencyRelation} placeholder="e.g., Spouse, Parent" />} /></FormItem>
                            <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} error={errors.emergencyMobileNo?.message}><Controller name="emergencyMobileNo" control={control} render={({ field }) => <Input {...field} invalid={!!errors.emergencyMobileNo} placeholder="Emergency contact number" />} /></FormItem>
                        </div>
                    </Card>

                    <Card id="educationalDetails" className="mb-6">
                        <div className="flex justify-between items-center mb-4"><h4 className="mb-0">4. Educational Details<span className="text-red-500"> * </span></h4><Button size="sm" type="button" icon={<TbPlus />} onClick={() => appendEdu({ degree: '', university: '', percentageGrade: '', educationFromDate: null, educationToDate: null, specialization: '' })}>Add Education</Button></div>
                        {errors.educationalDetails && !Array.isArray(errors.educationalDetails) && <p className="text-red-500 text-sm mb-2">{errors.educationalDetails.message as string}</p>}
                        {eduFields.map((item, index) => (
                            <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                                    <FormItem label={<div>Degree {index + 1}<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.degree?.message} className="mb-0"><Controller name={`educationalDetails.${index}.degree`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.educationalDetails?.[index]?.degree} placeholder="e.g., B.Tech" />} /></FormItem>
                                    <FormItem label={<div>University<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.university?.message} className="mb-0"><Controller name={`educationalDetails.${index}.university`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.educationalDetails?.[index]?.university} placeholder="Name of University" />} /></FormItem>
                                    <FormItem label={<div>Percentage/Grade<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.percentageGrade?.message} className="mb-0"><Controller name={`educationalDetails.${index}.percentageGrade`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.educationalDetails?.[index]?.percentageGrade} placeholder="e.g., 75% or A+" />} /></FormItem>
                                    <FormItem label={<div>From Date<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.educationFromDate?.message} className="mb-0"><Controller name={`educationalDetails.${index}.educationFromDate`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} invalid={!!errors.educationalDetails?.[index]?.educationFromDate} value={field.value} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                                    <FormItem label={<div>To Date<span className="text-red-500"> * </span></div>} error={errors.educationalDetails?.[index]?.educationToDate?.message} className="mb-0"><Controller name={`educationalDetails.${index}.educationToDate`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} invalid={!!errors.educationalDetails?.[index]?.educationToDate} value={field.value} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                                    <FormItem label="Specialization" error={errors.educationalDetails?.[index]?.specialization?.message} className="mb-0"><Controller name={`educationalDetails.${index}.specialization`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.educationalDetails?.[index]?.specialization} placeholder="e.g., CS" />} /></FormItem>
                                </div>
                                <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => removeEdu(index)} className="absolute top-2 right-2">Remove</Button>
                            </div>
                        ))}
                    </Card>

                    {workExperienceType === 'experienced' && (
                        <Card id="employmentDetails" className="mb-6">
                            <div className="flex justify-between items-center mb-4"><h4 className="mb-0">5. Employment Details<span className="text-red-500"> * </span></h4><Button size="sm" type="button" icon={<TbPlus />} onClick={() => appendEmp({ organization: '', designation: '', annualCTC: '', periodServiceFrom: null, periodServiceTo: null })}>Add Employment</Button></div>
                            {errors.employmentDetails && !Array.isArray(errors.employmentDetails) && <p className="text-red-500 text-sm mb-2">{errors.employmentDetails.message as string}</p>}
                            {empFields.map((item, index) => (
                                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                                        <FormItem label={<div>Organization {index + 1}<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.organization?.message} className="mb-0"><Controller name={`employmentDetails.${index}.organization`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.employmentDetails?.[index]?.organization} placeholder="Company Name" />} /></FormItem>
                                        <FormItem label={<div>Designation<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.designation?.message} className="mb-0"><Controller name={`employmentDetails.${index}.designation`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.employmentDetails?.[index]?.designation} placeholder="Your Role" />} /></FormItem>
                                        <FormItem label="Annual CTC" error={errors.employmentDetails?.[index]?.annualCTC?.message} className="mb-0"><Controller name={`employmentDetails.${index}.annualCTC`} control={control} render={({ field }) => <Input {...field} invalid={!!errors.employmentDetails?.[index]?.annualCTC} placeholder="e.g., 12 LPA" />} /></FormItem>
                                        <FormItem label={<div>From<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.periodServiceFrom?.message} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceFrom`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} invalid={!!errors.employmentDetails?.[index]?.periodServiceFrom} value={field.value} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                                        <FormItem label={<div>To<span className="text-red-500"> * </span></div>} error={errors.employmentDetails?.[index]?.periodServiceTo?.message} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceTo`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} invalid={!!errors.employmentDetails?.[index]?.periodServiceTo} value={field.value} onChange={date => field.onChange(date)} maxDate={new Date()} />} /></FormItem>
                                    </div>
                                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => removeEmp(index)} className="absolute top-2 right-2">Remove</Button>
                                </div>
                            ))}
                        </Card>
                    )}

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