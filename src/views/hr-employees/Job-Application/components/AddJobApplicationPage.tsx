// src/views/hiring/AddJobApplicationPage.tsx

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer, Form } from '@/components/ui/Form';
import { Select as UiSelect, DatePicker, Button, Radio, Card } from '@/components/ui'; // Added Card, Radio
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
// import AdaptableCard from '@/components/shared/AdaptiveCard'; // Using Card directly for sections
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbPlus, TbTrash } from 'react-icons/tb'; // For useFieldArray

// Types and Schema
import type { ApplicationFormData, FamilyMemberData, EducationDetailData, EmploymentDetailData } from '../types'; // Assuming types.ts is in the same folder
import {
    applicationFormSchema,
    applicationStatusOptions, // Keep if needed, but status might be auto-set or not on this form
    genderOptions,
    maritalStatusOptions,
    countryOptions, // Add these to types.ts
    stateOptions,
    cityOptions,
    bloodGroupOptions,
    nationalityOptions,
} from '../types';

// --- Sub-Components for Sections ---

// Section 1: Personal Details
const PersonalDetailsSection = ({ control, errors, workExperienceType }: { control: any, errors: any, workExperienceType: string | undefined }) => {
    // Calculate Age (Optional: can also be a manual input)
    const dob = useWatch({ control, name: 'dateOfBirth' });
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

    useEffect(() => {
        if (dob && dayjs(dob).isValid()) {
            setCalculatedAge(dayjs().diff(dayjs(dob), 'year'));
        } else {
            setCalculatedAge(null);
        }
    }, [dob]);


    return (
        <Card id="personalDetails" className="mb-6">
            <h4 className="mb-6">1. Personal Details</h4>
            <div className="grid md:grid-cols-3 gap-x-4 gap-y-2">
                <FormItem label="Department*" error={errors.department?.message}><Controller name="department" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Engineering" />} /></FormItem>
                <FormItem label="Applicant Name*" error={errors.name?.message}><Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Full name" />} /></FormItem>
                <FormItem label="Email*" error={errors.email?.message}><Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />} /></FormItem>
                <FormItem label="Mobile No" error={errors.mobileNo?.message}><Controller name="mobileNo" control={control} render={({ field }) => <Input {...field} placeholder="+1-XXX-XXX-XXXX" />} /></FormItem>
                <FormItem label="Gender" error={errors.gender?.message}><Controller name="gender" control={control} render={({ field }) => <UiSelect placeholder="Select Gender" options={genderOptions} value={genderOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>
                <FormItem label="Date Of Birth" error={errors.dateOfBirth?.message as string}><Controller name="dateOfBirth" control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} />} /></FormItem>
                <FormItem label="Age" error={errors.age?.message as string}>
                    <Controller name="age" control={control} render={({ field }) => (
                        <Input type="number" placeholder="Enter Age" {...field} value={field.value ?? (calculatedAge !== null ? calculatedAge : '')} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} />
                    )} />
                </FormItem>
                <FormItem label="Nationality" error={errors.nationality?.message}><Controller name="nationality" control={control} render={({ field }) => <UiSelect placeholder="Select Nationality" options={nationalityOptions} value={nationalityOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>
                <FormItem label="Marital Status" error={errors.maritalStatus?.message}><Controller name="maritalStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Marital Status" options={maritalStatusOptions} value={maritalStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>
                <FormItem label="Blood Group" error={errors.bloodGroup?.message}><Controller name="bloodGroup" control={control} render={({ field }) => <UiSelect placeholder="Select Blood Group" options={bloodGroupOptions} value={bloodGroupOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>
                <FormItem label="City" error={errors.city?.message}><Controller name="city" control={control} render={({ field }) => <UiSelect placeholder="Select City" options={cityOptions} value={cityOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>
                <FormItem label="State" error={errors.state?.message}><Controller name="state" control={control} render={({ field }) => <UiSelect placeholder="Select State" options={stateOptions} value={stateOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>
                <FormItem label="Country" error={errors.country?.message}><Controller name="country" control={control} render={({ field }) => <UiSelect placeholder="Select Country" options={countryOptions} value={countryOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable {...field} />}/></FormItem>

                <FormItem label="Local Address" error={errors.localAddress?.message} className="md:col-span-3">
                    <Controller name="localAddress" control={control} render={({ field }) => <Input textArea rows={2} placeholder="Enter Local Address" {...field} />} />
                </FormItem>
                <FormItem label="Permanent Address" error={errors.permanentAddress?.message} className="md:col-span-3">
                    <Controller name="permanentAddress" control={control} render={({ field }) => <Input textArea rows={2} placeholder="Enter Permanent Address" {...field} />} />
                </FormItem>

                <FormItem label="Work Experience*" error={errors.workExperienceType?.message} className="md:col-span-3">
                    <Controller name="workExperienceType" control={control}
                        render={({ field }) => (
                            <Radio.Group value={field.value} onChange={field.onChange}>
                                <Radio value="fresher">Fresher</Radio>
                                <Radio value="experienced">Experienced</Radio>
                            </Radio.Group>
                        )}
                    />
                </FormItem>

                {/* Original form fields (can be moved to a "Job Specifics" section or kept here) */}
                <FormItem label="Applying for Job Title (Optional)" error={errors.jobTitle?.message}><Controller name="jobTitle" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Software Engineer" />} /></FormItem>
                <FormItem label="Job ID (Optional)" error={errors.jobId?.message}><Controller name="jobId" control={control} render={({ field }) => <Input {...field} placeholder="e.g., JP001" />} /></FormItem>
                <FormItem label="Application Date*" error={errors.applicationDate?.message as string}><Controller name="applicationDate" control={control} render={({ field }) => <DatePicker placeholder="Select date" {...field} value={field.value ? dayjs(field.value).toDate() : new Date()} />} /></FormItem>
                <FormItem label="Application Status*" error={errors.status?.message}><Controller name="status" control={control} render={({ field }) => <UiSelect placeholder="Select status" options={applicationStatusOptions} value={applicationStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} {...field}/>}/></FormItem>
                <FormItem label="Resume URL (Optional)" error={errors.resumeUrl?.message} className="lg:col-span-1 md:col-span-2"><Controller name="resumeUrl" control={control} render={({ field }) => <Input {...field} placeholder="https://link-to-resume.pdf" />} /></FormItem>
                <FormItem label="Job Application Link (Optional)" error={errors.jobApplicationLink?.message} className="lg:col-span-2 md:col-span-2"><Controller name="jobApplicationLink" control={control} render={({ field }) => <Input {...field} placeholder="https://job-portal/apply/123" />} /></FormItem>
                <FormItem label="Notes / Cover Letter (Optional)" error={errors.notes?.message || errors.coverLetter?.message} className="md:col-span-3"><Controller name="coverLetter" control={control} render={({ field }) => <Input {...field} textArea rows={3} placeholder="Enter notes or cover letter content..." />} /></FormItem>

            </div>
        </Card>
    );
};

// Section 2: Family Details
const FamilyDetailsSection = ({ control, errors }: { control: any, errors: any }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "familyDetails" });

    return (
        <Card id="familyDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">2. Family Details</h4>
                <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ familyName: '', familyRelation: '', familyOccupation: '', familyDateOfBirth: null })}>Add Member</Button>
            </div>
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 items-end">
                        <FormItem label={`Name ${index + 1}`} error={errors.familyDetails?.[index]?.familyName?.message} className="mb-0">
                            <Controller name={`familyDetails.${index}.familyName`} control={control} render={({ field }) => <Input {...field} placeholder="Full Name" />} />
                        </FormItem>
                        <FormItem label="Relation" error={errors.familyDetails?.[index]?.familyRelation?.message} className="mb-0">
                            <Controller name={`familyDetails.${index}.familyRelation`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., Father, Spouse" />} />
                        </FormItem>
                        <FormItem label="Occupation" error={errors.familyDetails?.[index]?.familyOccupation?.message} className="mb-0">
                            <Controller name={`familyDetails.${index}.familyOccupation`} control={control} render={({ field }) => <Input {...field} placeholder="Occupation" />} />
                        </FormItem>
                        <FormItem label="Date of Birth" error={errors.familyDetails?.[index]?.familyDateOfBirth?.message as string} className="mb-0">
                            <Controller name={`familyDetails.${index}.familyDateOfBirth`} control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} />} />
                        </FormItem>
                    </div>
                    {fields.length > 0 && ( // Show remove button only if there's at least one item or if you want to allow removing the last one.
                         <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                    )}
                </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-gray-500">No family members added yet.</p>}
        </Card>
    );
};

// Section 3: Emergency Contact Details
const EmergencyContactSection = ({ control, errors }: { control: any, errors: any }) => (
    <Card id="emergencyContact" className="mb-6">
        <h4 className="mb-6">3. Emergency Contact Details</h4>
        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
            <FormItem label="Relation*" error={errors.emergencyRelation?.message}><Controller name="emergencyRelation" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Spouse, Parent" />} /></FormItem>
            <FormItem label="Mobile No*" error={errors.emergencyMobileNo?.message}><Controller name="emergencyMobileNo" control={control} render={({ field }) => <Input {...field} placeholder="Emergency contact number" />} /></FormItem>
        </div>
    </Card>
);

// Section 4: Educational Details
const EducationalDetailsSection = ({ control, errors }: { control: any, errors: any }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "educationalDetails" });
    return (
        <Card id="educationalDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">4. Educational Details</h4>
                <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ degree: '', university: '', percentageGrade: '', educationFromDate: null, educationToDate: null, specialization: '' })}>Add Education</Button>
            </div>
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                        <FormItem label={`Degree ${index + 1}*`} error={errors.educationalDetails?.[index]?.degree?.message} className="mb-0">
                            <Controller name={`educationalDetails.${index}.degree`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., B.Tech, MBA" />} />
                        </FormItem>
                        <FormItem label="University/Institution*" error={errors.educationalDetails?.[index]?.university?.message} className="mb-0">
                            <Controller name={`educationalDetails.${index}.university`} control={control} render={({ field }) => <Input {...field} placeholder="Name of University" />} />
                        </FormItem>
                        <FormItem label="Percentage/Grade*" error={errors.educationalDetails?.[index]?.percentageGrade?.message} className="mb-0">
                            <Controller name={`educationalDetails.${index}.percentageGrade`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., 75% or 8.2 CGPA" />} />
                        </FormItem>
                        <FormItem label="From Date*" error={errors.educationalDetails?.[index]?.educationFromDate?.message as string} className="mb-0">
                            <Controller name={`educationalDetails.${index}.educationFromDate`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} />} />
                        </FormItem>
                        <FormItem label="To Date*" error={errors.educationalDetails?.[index]?.educationToDate?.message as string} className="mb-0">
                            <Controller name={`educationalDetails.${index}.educationToDate`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} />} />
                        </FormItem>
                        <FormItem label="Specialization (Optional)" error={errors.educationalDetails?.[index]?.specialization?.message} className="mb-0">
                            <Controller name={`educationalDetails.${index}.specialization`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., Computer Science, Marketing" />} />
                        </FormItem>
                    </div>
                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-gray-500">No educational details added yet.</p>}
        </Card>
    );
};

// Section 5: Employment Details
const EmploymentDetailsSection = ({ control, errors, workExperienceType }: { control: any, errors: any, workExperienceType: string | undefined }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "employmentDetails" });

    if (workExperienceType !== 'experienced') {
        return null; // Don't render this section if not experienced
    }

    return (
        <Card id="employmentDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">5. Employment Details (For Experienced)</h4>
                <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ organization: '', designation: '', annualCTC: '', periodServiceFrom: null, periodServiceTo: null })}>Add Employment</Button>
            </div>
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                        <FormItem label={`Organization ${index + 1}*`} error={errors.employmentDetails?.[index]?.organization?.message} className="mb-0">
                            <Controller name={`employmentDetails.${index}.organization`} control={control} render={({ field }) => <Input {...field} placeholder="Company Name" />} />
                        </FormItem>
                        <FormItem label="Designation*" error={errors.employmentDetails?.[index]?.designation?.message} className="mb-0">
                            <Controller name={`employmentDetails.${index}.designation`} control={control} render={({ field }) => <Input {...field} placeholder="Your Role" />} />
                        </FormItem>
                        <FormItem label="Annual CTC (Optional)" error={errors.employmentDetails?.[index]?.annualCTC?.message} className="mb-0">
                            <Controller name={`employmentDetails.${index}.annualCTC`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., 12 LPA or 100,000 USD" />} />
                        </FormItem>
                        <FormItem label="Period of Service From*" error={errors.employmentDetails?.[index]?.periodServiceFrom?.message as string} className="mb-0">
                            <Controller name={`employmentDetails.${index}.periodServiceFrom`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} />} />
                        </FormItem>
                        <FormItem label="Period of Service To*" error={errors.employmentDetails?.[index]?.periodServiceTo?.message as string} className="mb-0">
                            <Controller name={`employmentDetails.${index}.periodServiceTo`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} />} />
                        </FormItem>
                    </div>
                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-gray-500">No employment details added yet for experienced candidate.</p>}
        </Card>
    );
};


// --- Main AddJobApplicationPage Component ---
const AddJobApplicationPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid }, watch } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: {
            // Personal Details
            department: "", name: "", email: "", mobileNo: null, gender: undefined, dateOfBirth: null, age: null,
            nationality: undefined, maritalStatus: undefined, bloodGroup: undefined, city: undefined, state: undefined, country: undefined,
            localAddress: "", permanentAddress: "", workExperienceType: undefined, // Set undefined for radio to pick first or be unselected
            // Job Specifics (from original form)
            jobId: null, jobTitle: "", applicationDate: new Date(), status: "new", resumeUrl: null,
            coverLetter: null, notes: null, jobApplicationLink: null,
            // Arrays
            familyDetails: [],
            // Emergency
            emergencyRelation: "", emergencyMobileNo: "",
            // Arrays
            educationalDetails: [],
            employmentDetails: [],
        },
        mode: 'onChange',
    });

    const workExperienceType = watch("workExperienceType");

    const onSubmit = async (data: ApplicationFormData) => {
        setIsSubmitting(true);
        // Transform data if needed before sending to backend (e.g., date formatting)
        const payload = {
            ...data,
            dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).format('YYYY-MM-DD') : null,
            applicationDate: dayjs(data.applicationDate).format('YYYY-MM-DD'),
            familyDetails: data.familyDetails?.map(fd => ({
                ...fd,
                familyDateOfBirth: fd.familyDateOfBirth ? dayjs(fd.familyDateOfBirth).format('YYYY-MM-DD') : null,
            })),
            educationalDetails: data.educationalDetails?.map(ed => ({
                ...ed,
                educationFromDate: dayjs(ed.educationFromDate).format('YYYY-MM-DD'),
                educationToDate: dayjs(ed.educationToDate).format('YYYY-MM-DD'),
            })),
            employmentDetails: data.workExperienceType === 'experienced' ? data.employmentDetails?.map(emp => ({
                ...emp,
                periodServiceFrom: dayjs(emp.periodServiceFrom).format('YYYY-MM-DD'),
                periodServiceTo: dayjs(emp.periodServiceTo).format('YYYY-MM-DD'),
            })) : [], // Send empty array if fresher
        };
        console.log("Submitting New Application Payload:", payload);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.push(<Notification title="Success" type="success">Application submitted successfully.</Notification>);
            reset(); 
            navigate('/hiring/job-applications'); // Adjust to your listing page route
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Submission failed."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hiring/job-applications'); // Adjust route
    };

    return (
        <Container className="h-full">
            <FormContainer> {/* Recommended to wrap form for RHF context if not done by <Form> */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='flex gap-1 items-center mb-3'>
                        <NavLink to="/hiring/job-applications"> {/* Adjust route */}
                            <h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Job Applications</h6>
                        </NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h6 className='font-semibold text-primary-600 dark:text-primary-400'>Add New Application</h6>
                    </div>

                    {/* Section 1: Personal Details */}
                    <PersonalDetailsSection control={control} errors={errors} workExperienceType={workExperienceType} />

                    {/* Section 2: Family Details */}
                    <FamilyDetailsSection control={control} errors={errors} />

                    {/* Section 3: Emergency Contact */}
                    <EmergencyContactSection control={control} errors={errors} />
                    
                    {/* Section 4: Educational Details */}
                    <EducationalDetailsSection control={control} errors={errors} />

                    {/* Section 5: Employment Details (Conditional) */}
                    <EmploymentDetailsSection control={control} errors={errors} workExperienceType={workExperienceType} />


                    <div className="mt-8 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={!isValid && !isSubmitting}>
                            Submit Application
                        </Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog 
                isOpen={cancelConfirmOpen} 
                type="warning" 
                title="Discard Changes?" 
                onClose={() => setCancelConfirmOpen(false)} 
                onConfirm={() => { setCancelConfirmOpen(false); navigate('/hiring/job-applications'); }}  // Adjust route
                onCancel={() => setCancelConfirmOpen(false)}
            >
                <p>You have unsaved changes. Are you sure you want to discard them and leave this page?</p>
            </ConfirmDialog>
        </Container>
    );
};
export default AddJobApplicationPage;