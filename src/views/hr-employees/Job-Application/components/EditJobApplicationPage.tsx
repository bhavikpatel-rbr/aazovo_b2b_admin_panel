// src/views/hiring/EditJobApplicationPage.tsx

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch, UseFormSetValue } from 'react-hook-form'; // Added UseFormSetValue
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer } from '@/components/ui/Form'; // Removed Form, not directly used
import { Select as UiSelect, DatePicker, Button, Radio, Card } from '@/components/ui';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbInfoCircle, TbPlus, TbTrash } from 'react-icons/tb';

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
    editJobApplicationAction, // Assuming you have this action
    getJobApplicationsAction,
    // getJobApplicationByIdAction, // You might have a specific action for fetching one item
} from '@/reduxtool/master/middleware';


// Types and Schema
import type { ApplicationFormData, JobApplicationItem, FamilyMemberData, EducationDetailData, EmploymentDetailData } from '../types';
import {
    applicationFormSchema,
    applicationStatusOptions,
    genderOptions,
    maritalStatusOptions,
    // countryOptions, // These were static in Edit, Add page now has dynamic ones
    // stateOptions,
    // cityOptions,
    bloodGroupOptions,
    nationalityOptions,
} from '../types';


// --- Sample Data for Cascading Dropdowns (same as Add page for consistency if PersonalDetailsSection is made identical) ---
const countriesData = [
    { value: 'USA', label: 'United States' },
    { value: 'CAN', label: 'Canada' },
    { value: 'IND', label: 'India' },
    { value: 'GBR', label: 'United Kingdom' },
];

const statesByCountryData: Record<string, Array<{ value: string; label: string }>> = {
    USA: [ { value: 'NY', label: 'New York' }, { value: 'CA', label: 'California' }, { value: 'TX', label: 'Texas' } ],
    CAN: [ { value: 'ON', label: 'Ontario' }, { value: 'QC', label: 'Quebec' }, { value: 'BC', label: 'British Columbia' } ],
    IND: [ { value: 'MH', label: 'Maharashtra' }, { value: 'KA', label: 'Karnataka' }, { value: 'DL', label: 'Delhi' }, { value: 'TN', label: 'Tamil Nadu'} ],
    GBR: [ { value: 'ENG', label: 'England' }, { value: 'SCT', label: 'Scotland' }, { value: 'WAL', label: 'Wales' } ],
};

const citiesByStateData: Record<string, Array<{ value: string; label: string }>> = {
    NY: [ { value: 'NYC', label: 'New York City' }, { value: 'Buffalo', label: 'Buffalo' }, { value: 'Albany', label: 'Albany' } ],
    CA: [ { value: 'LA', label: 'Los Angeles' }, { value: 'SF', label: 'San Francisco' }, { value: 'SD', label: 'San Diego' } ],
    TX: [ { value: 'Houston', label: 'Houston' }, { value: 'Austin', label: 'Austin' }, { value: 'Dallas', label: 'Dallas' } ],
    ON: [ { value: 'Toronto', label: 'Toronto' }, { value: 'Ottawa', label: 'Ottawa' }, { value: 'Hamilton', label: 'Hamilton' } ],
    QC: [ { value: 'Montreal', label: 'Montreal' }, { value: 'QuebecCity', label: 'Quebec City' } ],
    BC: [ { value: 'Vancouver', label: 'Vancouver' }, { value: 'Victoria', label: 'Victoria' } ],
    MH: [ { value: 'Mumbai', label: 'Mumbai' }, { value: 'Pune', label: 'Pune' }, { value: 'Nagpur', label: 'Nagpur' } ],
    KA: [ { value: 'Bangalore', label: 'Bengaluru' }, { value: 'Mysore', label: 'Mysuru' }, { value: 'Mangalore', label: 'Mangaluru' } ],
    DL: [ { value: 'NewDelhi', label: 'New Delhi' } ],
    TN: [ { value: 'Chennai', label: 'Chennai' }, { value: 'Coimbatore', label: 'Coimbatore'} ],
    ENG: [ { value: 'London', label: 'London' }, { value: 'Manchester', label: 'Manchester' }, { value: 'Birmingham', label: 'Birmingham' }],
    SCT: [ { value: 'Edinburgh', label: 'Edinburgh' }, { value: 'Glasgow', label: 'Glasgow' }],
    WAL: [ { value: 'Cardiff', label: 'Cardiff' }, { value: 'Swansea', label: 'Swansea' }],
};


// --- Sub-Components for Sections ---

// Section 1: Personal Details (Updated to match AddJobApplicationPage for cascading dropdowns)
const PersonalDetailsSection = ({ control, errors, workExperienceType, setValue }: { control: any, errors: any, workExperienceType: string | undefined, setValue: UseFormSetValue<ApplicationFormData> }) => {
    const dob = useWatch({ control, name: 'dateOfBirth' });
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

    const selectedCountry = useWatch({ control, name: 'country' });
    const selectedState = useWatch({ control, name: 'state' });

    const [stateOptions, setStateOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);

    useEffect(() => {
        if (dob && dayjs(dob).isValid()) {
            setCalculatedAge(dayjs().diff(dayjs(dob), 'year'));
        } else {
            setCalculatedAge(null);
        }
    }, [dob]);

    useEffect(() => {
        if (selectedCountry) {
            const newStates = statesByCountryData[selectedCountry] || [];
            setStateOptions(newStates);
            // Only reset if the current state is not in the new options or if country changes
            if (!newStates.find(s => s.value === 'state')) {
                setValue('state', undefined, { shouldValidate: true, shouldDirty: true });
                setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
            }
        } else {
            setStateOptions([]);
            setValue('state', undefined, { shouldValidate: true, shouldDirty: true });
            setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
        }
    }, [selectedCountry, setValue]);

    useEffect(() => {
        if (selectedState) {
            const newCities = citiesByStateData[selectedState] || [];
            setCityOptions(newCities);
            if (!newCities.find(c => c.value === 'city')) {
                setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
            }
        } else {
            setCityOptions([]);
            setValue('city', undefined, { shouldValidate: true, shouldDirty: true });
        }
    }, [selectedState, setValue]);
    
    // Pre-populate state and city options if country/state are already set on load
    useEffect(() => {
        const currentCountry = 'country';
        if (currentCountry) {
            setStateOptions(statesByCountryData[currentCountry] || []);
        }
        const currentState = 'state';
        if (currentState) {
            setCityOptions(citiesByStateData[currentState] || []);
        }
    }, ['country', 'state']); // Watch initial values from form

    return (
        <Card id="personalDetails" className="mb-6">
            <h4 className="mb-6">1. Personal Details</h4>
            <div className="grid md:grid-cols-3 gap-x-4 gap-y-2">
                <FormItem label="Department*" error={errors.department?.message}><Controller name="department" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Engineering" />} /></FormItem>
                <FormItem label="Applicant Name*" error={errors.name?.message}><Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Full name" />} /></FormItem>
                <FormItem label="Email*" error={errors.email?.message}><Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />} /></FormItem>
                <FormItem label="Mobile No" error={errors.mobileNo?.message}><Controller name="mobileNo" control={control} render={({ field }) => <Input {...field} placeholder="+1-XXX-XXX-XXXX" />} /></FormItem>
                <FormItem label="Gender" error={errors.gender?.message}><Controller name="gender" control={control} render={({ field }) => <UiSelect placeholder="Select Gender" options={genderOptions} value={genderOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                <FormItem label="Date Of Birth" error={errors.dateOfBirth?.message as string}><Controller name="dateOfBirth" control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} />} /></FormItem>
                <FormItem label="Age" error={errors.age?.message as string}>
                    <Controller name="age" control={control} render={({ field }) => (
                        <Input type="number" placeholder="Enter Age" {...field} value={field.value ?? (calculatedAge !== null ? calculatedAge : '')} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} />
                    )} />
                </FormItem>
                <FormItem label="Nationality" error={errors.nationality?.message}><Controller name="nationality" control={control} render={({ field }) => <UiSelect placeholder="Select Nationality" options={nationalityOptions} value={nationalityOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                <FormItem label="Marital Status" error={errors.maritalStatus?.message}><Controller name="maritalStatus" control={control} render={({ field }) => <UiSelect placeholder="Select Marital Status" options={maritalStatusOptions} value={maritalStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                <FormItem label="Blood Group" error={errors.bloodGroup?.message}><Controller name="bloodGroup" control={control} render={({ field }) => <UiSelect placeholder="Select Blood Group" options={bloodGroupOptions} value={bloodGroupOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} isClearable />}/></FormItem>
                
                <FormItem label="Country" error={errors.country?.message}>
                    <Controller name="country" control={control} render={({ field }) => 
                        <UiSelect 
                            placeholder="Select Country" 
                            options={countriesData} 
                            value={countriesData.find(o => o.value === field.value)} 
                            onChange={opt => field.onChange(opt?.value)} 
                            isClearable 
                        />}
                    />
                </FormItem>
                <FormItem label="State" error={errors.state?.message}>
                    <Controller name="state" control={control} render={({ field }) => 
                        <UiSelect 
                            placeholder="Select State" 
                            options={stateOptions} 
                            value={stateOptions.find(o => o.value === field.value)} 
                            onChange={opt => field.onChange(opt?.value)} 
                            isDisabled={!selectedCountry || stateOptions.length === 0}
                            isClearable 
                        />}
                    />
                </FormItem>
                <FormItem label="City" error={errors.city?.message}>
                    <Controller name="city" control={control} render={({ field }) => 
                        <UiSelect 
                            placeholder="Select City" 
                            options={cityOptions} 
                            value={cityOptions.find(o => o.value === field.value)} 
                            onChange={opt => field.onChange(opt?.value)} 
                            isDisabled={!selectedState || cityOptions.length === 0}
                            isClearable 
                        />}
                    />
                </FormItem>

                <FormItem label="Local Address" error={errors.localAddress?.message} className="md:col-span-3"><Controller name="localAddress" control={control} render={({ field }) => <Input textArea rows={2} placeholder="Enter Local Address" {...field} />} /></FormItem>
                <FormItem label="Permanent Address" error={errors.permanentAddress?.message} className="md:col-span-3"><Controller name="permanentAddress" control={control} render={({ field }) => <Input textArea rows={2} placeholder="Enter Permanent Address" {...field} />} /></FormItem>
                <FormItem label="Work Experience*" error={errors.workExperienceType?.message} className="md:col-span-3">
                    <Controller name="workExperienceType" control={control} render={({ field }) => (<Radio.Group value={field.value} onChange={field.onChange}><Radio value="fresher">Fresher</Radio><Radio value="experienced">Experienced</Radio></Radio.Group>)} />
                </FormItem>
                <FormItem label="Applying for Job Title (Optional)" error={errors.jobTitle?.message}><Controller name="jobTitle" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Software Engineer" />} /></FormItem>
                <FormItem label="Job ID (Optional)" error={errors.jobId?.message}><Controller name="jobId" control={control} render={({ field }) => <Input {...field} placeholder="e.g., JP001" />} /></FormItem>
                <FormItem label="Application Date*" error={errors.applicationDate?.message as string}><Controller name="applicationDate" control={control} render={({ field }) => <DatePicker placeholder="Select date" {...field} value={field.value ? dayjs(field.value).toDate() : new Date()} onChange={date=> field.onChange(date)} />} /></FormItem>
                <FormItem label="Application Status*" error={errors.status?.message}><Controller name="status" control={control} render={({ field }) => <UiSelect placeholder="Select status" options={applicationStatusOptions} value={applicationStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />}/></FormItem>
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
                        <FormItem label={`Name ${index + 1}`} error={errors.familyDetails?.[index]?.familyName?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyName`} control={control} render={({ field }) => <Input {...field} placeholder="Full Name" />} /></FormItem>
                        <FormItem label="Relation" error={errors.familyDetails?.[index]?.familyRelation?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyRelation`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., Father, Spouse" />} /></FormItem>
                        <FormItem label="Occupation" error={errors.familyDetails?.[index]?.familyOccupation?.message} className="mb-0"><Controller name={`familyDetails.${index}.familyOccupation`} control={control} render={({ field }) => <Input {...field} placeholder="Occupation" />} /></FormItem>
                        <FormItem label="Date of Birth" error={errors.familyDetails?.[index]?.familyDateOfBirth?.message as string} className="mb-0"><Controller name={`familyDetails.${index}.familyDateOfBirth`} control={control} render={({ field }) => <DatePicker placeholder="Select DOB" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date => field.onChange(date)} />} /></FormItem>
                    </div>
                    {fields.length > 0 && (
                        <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                    )}
                </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-gray-500">No family members added.</p>}
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
                        <FormItem label={`Degree ${index + 1}*`} error={errors.educationalDetails?.[index]?.degree?.message} className="mb-0"><Controller name={`educationalDetails.${index}.degree`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., B.Tech, MBA" />} /></FormItem>
                        <FormItem label="University/Institution*" error={errors.educationalDetails?.[index]?.university?.message} className="mb-0"><Controller name={`educationalDetails.${index}.university`} control={control} render={({ field }) => <Input {...field} placeholder="Name of University" />} /></FormItem>
                        <FormItem label="Percentage/Grade*" error={errors.educationalDetails?.[index]?.percentageGrade?.message} className="mb-0"><Controller name={`educationalDetails.${index}.percentageGrade`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., 75% or 8.2 CGPA" />} /></FormItem>
                        <FormItem label="From Date*" error={errors.educationalDetails?.[index]?.educationFromDate?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.educationFromDate`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} />} /></FormItem>
                        <FormItem label="To Date*" error={errors.educationalDetails?.[index]?.educationToDate?.message as string} className="mb-0"><Controller name={`educationalDetails.${index}.educationToDate`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} />} /></FormItem>
                        <FormItem label="Specialization (Optional)" error={errors.educationalDetails?.[index]?.specialization?.message} className="mb-0"><Controller name={`educationalDetails.${index}.specialization`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., Computer Science" />} /></FormItem>
                    </div>
                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                </div>
            ))}
             {fields.length === 0 && <p className="text-sm text-gray-500">No educational details added.</p>}
        </Card>
    );
};

// Section 5: Employment Details
const EmploymentDetailsSection = ({ control, errors, workExperienceType }: { control: any, errors: any, workExperienceType: string | undefined }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "employmentDetails" });
    if (workExperienceType !== 'experienced') return null;
    return (
        <Card id="employmentDetails" className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">5. Employment Details (For Experienced)</h4>
                <Button size="sm" type="button" icon={<TbPlus />} onClick={() => append({ organization: '', designation: '', annualCTC: '', periodServiceFrom: null, periodServiceTo: null })}>Add Employment</Button>
            </div>
            {fields.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md mb-4 relative">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 items-start">
                        <FormItem label={`Organization ${index + 1}*`} error={errors.employmentDetails?.[index]?.organization?.message} className="mb-0"><Controller name={`employmentDetails.${index}.organization`} control={control} render={({ field }) => <Input {...field} placeholder="Company Name" />} /></FormItem>
                        <FormItem label="Designation*" error={errors.employmentDetails?.[index]?.designation?.message} className="mb-0"><Controller name={`employmentDetails.${index}.designation`} control={control} render={({ field }) => <Input {...field} placeholder="Your Role" />} /></FormItem>
                        <FormItem label="Annual CTC (Optional)" error={errors.employmentDetails?.[index]?.annualCTC?.message} className="mb-0"><Controller name={`employmentDetails.${index}.annualCTC`} control={control} render={({ field }) => <Input {...field} placeholder="e.g., 12 LPA" />} /></FormItem>
                        <FormItem label="From*" error={errors.employmentDetails?.[index]?.periodServiceFrom?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceFrom`} control={control} render={({ field }) => <DatePicker placeholder="Start Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} />} /></FormItem>
                        <FormItem label="To*" error={errors.employmentDetails?.[index]?.periodServiceTo?.message as string} className="mb-0"><Controller name={`employmentDetails.${index}.periodServiceTo`} control={control} render={({ field }) => <DatePicker placeholder="End Date" {...field} value={field.value ? dayjs(field.value).toDate() : null} onChange={date=> field.onChange(date)} />} /></FormItem>
                    </div>
                    <Button size="xs" color="red-500" variant="plain" icon={<TbTrash />} type="button" onClick={() => remove(index)} className="absolute top-2 right-2">Remove</Button>
                </div>
            ))}
             {fields.length === 0 && <p className="text-sm text-gray-500">No employment details added for experienced candidate.</p>}
        </Card>
    );
};


// --- Main EditJobApplicationPage Component ---
const EditJobApplicationPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { applicationId } = useParams<{ applicationId: string }>();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [initialData, setInitialData] = useState<ApplicationFormData | null>(null);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid }, watch, setValue } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        mode: 'onChange',
    });

    const workExperienceType = watch("workExperienceType");

    useEffect(() => {
        if (!applicationId) {
            toast.push(<Notification title="Error" type="danger">Application ID is missing.</Notification>);
            navigate('/hiring/job-applications');
            return;
        }

        setIsLoading(true);
        // TODO: Replace with actual API call using Redux Thunk if available
        // For now, using the existing simulated fetch logic
        // Example: dispatch(getJobApplicationByIdAction(applicationId)).unwrap()
        console.log("Fetching application data for ID (Edit):", applicationId);
        new Promise<JobApplicationItem | null>((resolve) => {
            setTimeout(() => {
                const dummyApplications: JobApplicationItem[] = [
                    { id: "APP001", status: "new", jobId: "JP001", jobTitle: "Senior Frontend Engineer", department: "Engineering", name: "Alice Applicant", email: "alice.a@email.com", mobileNo: "+1-555-2001", workExperience: "experienced", applicationDate: new Date(2023, 10, 6, 9, 0), avatar: "/img/avatars/thumb-1.jpg", resumeUrl: "https://example.com/alice.pdf", gender: "female", dateOfBirth: new Date(1990, 5, 15), age: 33, nationality: "american", maritalStatus: "single", bloodGroup: "A+", city: "NYC", state: "NY", country: "USA", localAddress: "123 Main St", permanentAddress: "123 Main St", emergencyRelation: "Father", emergencyMobileNo: "555-0000", familyDetails: [{familyName: "John Doe", familyRelation: "Father", familyOccupation: "Engineer", familyDateOfBirth: new Date(1960,1,1)}], educationalDetails: [{degree: "B.Sc", university: "State U", percentageGrade: "80%", educationFromDate: new Date(2008,8,1), educationToDate: new Date(2012,5,1), specialization: "CS"}], employmentDetails: [{organization: "Tech Corp", designation: "Dev", annualCTC: "100k", periodServiceFrom: new Date(2018,1,1), periodServiceTo: new Date(2020,1,1)}] },
                    { id: "APP002", status: "screening", jobId: "JP002", jobTitle: "Marketing Content Writer", department: "Marketing", name: "Bob Candidate", email: "bob.c@mail.net", mobileNo: "+44-20-1111-2222", workExperience: "fresher", applicationDate: new Date(2023, 10, 6, 10, 30), avatar: "/img/avatars/thumb-2.jpg", emergencyRelation: "Mother", emergencyMobileNo: "555-1111", country: "GBR", state: "ENG", city: "London"},
                ];
                const foundApp = dummyApplications.find(app => app.id === applicationId);
                resolve(foundApp || null);
            }, 700);
        })
        .then(data => {
            if (data) {
                const transformedData: ApplicationFormData = {
                    department: data.department || "",
                    name: data.name || "",
                    email: data.email || "",
                    mobileNo: data.mobileNo || null,
                    gender: data.gender || undefined,
                    dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).toDate() : null,
                    age: data.age || null,
                    nationality: data.nationality || undefined,
                    maritalStatus: data.maritalStatus || undefined,
                    bloodGroup: data.bloodGroup || undefined,
                    country: data.country || undefined,
                    state: data.state || undefined,
                    city: data.city || undefined,
                    localAddress: data.localAddress || "",
                    permanentAddress: data.permanentAddress || "",
                    workExperienceType: data.workExperience === "experienced" || (data.employmentDetails && data.employmentDetails.length > 0) ? "experienced" : "fresher",
                    jobTitle: data.jobTitle || "",
                    jobId: data.jobId || null,
                    applicationDate: dayjs(data.applicationDate).toDate(),
                    status: data.status || "new",
                    resumeUrl: data.resumeUrl || null,
                    jobApplicationLink: data.jobApplicationLink || null,
                    coverLetter: data.coverLetter || null,
                    notes: data.notes || null,
                    familyDetails: data.familyDetails?.map(fd => ({
                        familyName: fd.familyName || "",
                        familyRelation: fd.familyRelation || "",
                        familyOccupation: fd.familyOccupation || "",
                        familyDateOfBirth: fd.familyDateOfBirth ? dayjs(fd.familyDateOfBirth).toDate() : null,
                    })) || [],
                    emergencyRelation: data.emergencyRelation || "",
                    emergencyMobileNo: data.emergencyMobileNo || "",
                    educationalDetails: data.educationalDetails?.map(ed => ({
                        degree: ed.degree || "",
                        university: ed.university || "",
                        percentageGrade: ed.percentageGrade || "",
                        educationFromDate: ed.educationFromDate ? dayjs(ed.educationFromDate).toDate() : null,
                        educationToDate: ed.educationToDate ? dayjs(ed.educationToDate).toDate() : null,
                        specialization: ed.specialization || "",
                    })) || [],
                    employmentDetails: data.employmentDetails?.map(emp => ({
                        organization: emp.organization || "",
                        designation: emp.designation || "",
                        annualCTC: emp.annualCTC || "",
                        periodServiceFrom: emp.periodServiceFrom ? dayjs(emp.periodServiceFrom).toDate() : null,
                        periodServiceTo: emp.periodServiceTo ? dayjs(emp.periodServiceTo).toDate() : null,
                    })) || [],
                };
                setInitialData(transformedData);
                reset(transformedData);
            } else {
                toast.push(<Notification title="Not Found" type="warning">Application not found.</Notification>);
                navigate('/hiring/job-applications');
            }
        })
        .catch(err => {
            toast.push(<Notification title="Error" type="danger">Failed to load application data.</Notification>);
            console.error("Fetch error:", err);
            navigate('/hiring/job-applications');
        })
        .finally(() => setIsLoading(false));

    }, [applicationId, navigate, reset]);


    const onSubmitHandler = async (formData: ApplicationFormData) => {
        if (!applicationId) {
            toast.push(<Notification title="Error" type="danger">Application ID is missing for update.</Notification>);
            return;
        }
        setIsSubmitting(true);

        const payload = {
            id: applicationId, // Crucial for edit operations
            job_department_id: formData.department,
            name: formData.name,
            email: formData.email,
            mobile_no: formData.mobileNo ?? "",
            city: formData.city,
            state: formData.state,
            country: formData.country,
            nationality: formData.nationality,
            marital_status: formData.maritalStatus,
            emg_mobile_no: formData.emergencyMobileNo,
            emg_relation: formData.emergencyRelation,
            gender: formData.gender,
            age: formData.age,
            dob: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format("YYYY-MM-DD") : null,
            blood_group: formData.bloodGroup,
            local_address: formData.localAddress,
            permanent_address: formData.permanentAddress,
            work_experience: formData.workExperienceType === "experienced" ? 1 : 0,
            total_experience: "", // Optional: Add if collected
            expected_salary: "",  // Optional: Add if collected
            notice_period: "",    // Optional: Add if collected
            reference: "",        // Optional: Add if collected
            reference_specify: "",// Optional: Add if collected

            education_details: formData.educationalDetails?.map(ed => ({
                ...ed, // Spread existing properties, then override dates
                degree: ed.degree,
                university: ed.university,
                percentageGrade: ed.percentageGrade,
                specialization: ed.specialization,
                educationFromDate: ed.educationFromDate ? dayjs(ed.educationFromDate).format("YYYY-MM-DD") : null,
                educationToDate: ed.educationToDate ? dayjs(ed.educationToDate).format("YYYY-MM-DD") : null,
            })) ?? [],

            employee_details: formData.workExperienceType === "experienced"
                ? formData.employmentDetails?.map(emp => ({
                    ...emp, // Spread existing properties, then override dates
                    organization: emp.organization,
                    designation: emp.designation,
                    annualCTC: emp.annualCTC,
                    periodServiceFrom: emp.periodServiceFrom ? dayjs(emp.periodServiceFrom).format("YYYY-MM-DD") : null,
                    periodServiceTo: emp.periodServiceTo ? dayjs(emp.periodServiceTo).format("YYYY-MM-DD") : null,
                }))
                : [],

            family_details: formData.familyDetails?.map(fd => ({
                ...fd, // Spread existing properties, then override dates
                familyName: fd.familyName,
                familyRelation: fd.familyRelation,
                familyOccupation: fd.familyOccupation,
                familyDateOfBirth: fd.familyDateOfBirth
                ? dayjs(fd.familyDateOfBirth).format("YYYY-MM-DD")
                : null,
            })) ?? [],

            emergency_contact_details: [], // Optional if needed

            first_interview: "", // Optional: Fill if available
            first_int_remarks: "",
            second_interview: "",
            second_int_remarks: "",
            final_interview: "",
            final_int_remarks: "",

            status: formData.status,
            remarks: formData.notes ?? "", // notes and coverLetter seem to be merged for `remarks` and `note`
            job_link_token: formData.jobApplicationLink ?? "", // Assuming this is the right mapping
            job_link_datetime: "", // Optional: Add if collected

            job_title: formData.jobTitle,
            job_id: formData.jobId,
            application_date: formData.applicationDate ? dayjs(formData.applicationDate).format("YYYY-MM-DD") : null,
            resume_url: formData.resumeUrl ?? "",
            application_link: formData.jobApplicationLink ?? "", // Re-confirm mapping if different
            note: formData.coverLetter ?? "", // Re-confirm mapping if different
        };
        
        console.log("Updating Application Payload:", payload);

        try {
            // Replace with actual API call:
            await dispatch(editJobApplicationAction(payload)).unwrap();
            // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating API call

            toast.push(
              <Notification
                title="Application Updated"
                type="success"
                duration={2000}
              >
                Job application updated successfully.
              </Notification>
            );
          dispatch(getJobApplicationsAction()); // Refresh the list
          navigate('/hr-emloyee/job-applications');
        } catch (error: any) {
          toast.push(
            <Notification
              title="Update Failed"
              type="danger"
              duration={3000}
            >
              {error?.data?.message || error?.message || "Operation failed."}
            </Notification>
          );
          console.error("Job Application Update Error:", error);
        } finally {
          setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hr-emloyee/job-applications');
    };

    if (isLoading) {
        return <Container className="h-full flex justify-center items-center"><p className="ml-2">Loading application details...</p></Container>;
    }
    if (!initialData) {
         return (
            <Container className="h-full flex flex-col justify-center items-center">
                <TbInfoCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Application Not Found</p>
                <Button className="mt-6" onClick={() => navigate('/hiring/job-applications')}>Back to Listing</Button>
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <FormContainer>
                <form onSubmit={handleSubmit(onSubmitHandler)}> {/* Use onSubmitHandler */}
                    <div className='flex gap-1 items-center mb-3'>
                        <NavLink to="/hiring/job-applications">
                            <h6 className='font-semibold hover:text-primary-600 dark:hover:text-primary-400'>Job Applications</h6>
                        </NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h6 className='font-semibold text-primary-600 dark:text-primary-400'>Edit Application: {initialData.name} ({applicationId})</h6>
                    </div>

                    <PersonalDetailsSection control={control} errors={errors} workExperienceType={workExperienceType} setValue={setValue} />
                    <FamilyDetailsSection control={control} errors={errors} />
                    <EmergencyContactSection control={control} errors={errors} />
                    <EducationalDetailsSection control={control} errors={errors} />
                    <EmploymentDetailsSection control={control} errors={errors} workExperienceType={workExperienceType} />

                    <div className="mt-8 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog 
                isOpen={cancelConfirmOpen} 
                type="warning" 
                title="Discard Changes?" 
                onClose={() => setCancelConfirmOpen(false)} 
                onConfirm={() => { setCancelConfirmOpen(false); navigate('/hiring/job-applications'); }}
                onCancel={() => setCancelConfirmOpen(false)}
            >
                <p>You have unsaved changes. Are you sure you want to discard them and leave this page?</p>
            </ConfirmDialog>
        </Container>
    );
};
export default EditJobApplicationPage;