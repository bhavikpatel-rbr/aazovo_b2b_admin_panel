// src/views/hiring/AddJobApplicationPage.tsx

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink } from 'react-router-dom';

// UI Components
import Card from '@/components/ui/Card'; // Not used directly, AdaptableCard is
import Input from '@/components/ui/Input';
import { FormItem, FormContainer, Form } from '@/components/ui/Form';
import { Select as UiSelect, DatePicker, Button } from '@/components/ui';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import AdaptableCard from '@/components/shared/AdaptiveCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// Icons
import { BiChevronRight } from 'react-icons/bi';

// Types and Schema (from shared types.ts)
import type { ApplicationFormData } from '../types';
import { applicationFormSchema, applicationStatusOptions } from '../types';

const AddJobApplicationPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: {
            name: "", email: "", mobileNo: null, department: "", jobId: null,
            jobTitle: "", workExperience: "", applicationDate: new Date(),
            status: "new", resumeUrl: null, coverLetter: null, notes: null,
            jobApplicationLink: null,
        },
        mode: 'onChange',
    });

    const onSubmit = async (data: ApplicationFormData) => {
        setIsSubmitting(true);
        console.log("Submitting New Application:", data);
        // TODO: Replace with actual API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.push(<Notification title="Success" type="success">Application submitted.</Notification>);
            reset(); 
            navigate('/hiring/job-applications');
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Submission failed."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hiring/job-applications');
    };

    return (
        <Container className="h-full">
            <FormContainer>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='flex gap-1 items-end mb-3 '>
                        <NavLink to="/hr-employees/job-application">
                            <h6 className='font-semibold hover:text-primary'>Job Applications</h6>
                        </NavLink>
                        <BiChevronRight size={22} color='black'/>
                        <h6 className='font-semibold text-primary'>Add New Application</h6>
                    </div>

                    <AdaptableCard className="mb-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Applicant Name*" error={errors.name?.message}><Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Full name" />} /></FormItem>
                            <FormItem label="Email*" error={errors.email?.message}><Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" placeholder="email@example.com" />} /></FormItem>
                            <FormItem label="Mobile No" error={errors.mobileNo?.message}><Controller name="mobileNo" control={control} render={({ field }) => <Input {...field} placeholder="+1-XXX-XXX-XXXX" />} /></FormItem>
                            <FormItem label="Department*" error={errors.department?.message}><Controller name="department" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Engineering" />} /></FormItem>
                            <FormItem label="Job Title" error={errors.jobTitle?.message}><Controller name="jobTitle" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Software Engineer" />} /></FormItem>
                            <FormItem label="Job ID" error={errors.jobId?.message}><Controller name="jobId" control={control} render={({ field }) => <Input {...field} placeholder="e.g., JP001" />} /></FormItem>
                            <FormItem label="Work Experience*" error={errors.workExperience?.message}><Controller name="workExperience" control={control} render={({ field }) => <Input {...field} placeholder="e.g., 3 Years in React" />} /></FormItem>
                            <FormItem label="Application Date*" error={errors.applicationDate?.message as string}><Controller name="applicationDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || new Date()} />} /></FormItem>
                            <FormItem label="Status*" error={errors.status?.message}><Controller name="status" control={control} render={({ field }) => <UiSelect options={applicationStatusOptions} value={applicationStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />} /></FormItem>
                            <FormItem label="Resume URL" error={errors.resumeUrl?.message} className="lg:col-span-1 md:col-span-2"><Controller name="resumeUrl" control={control} render={({ field }) => <Input {...field} placeholder="https://link-to-resume.pdf" />} /></FormItem>
                            <FormItem label="Job Application Link" error={errors.jobApplicationLink?.message} className="lg:col-span-2 md:col-span-2"><Controller name="jobApplicationLink" control={control} render={({ field }) => <Input {...field} placeholder="https://job-portal/apply/123" />} /></FormItem>
                            <FormItem label="Notes / Cover Letter" error={errors.notes?.message || errors.coverLetter?.message} className="md:col-span-2 lg:col-span-3"><Controller name="coverLetter" control={control} render={({ field }) => <Input {...field} textArea rows={4} placeholder="Enter notes or cover letter content..." />} /></FormItem>
                        </div>
                    </AdaptableCard>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={!isValid && !isSubmitting}>Submit Application</Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate('/hiring/job-applications'); }} onCancel={() => setCancelConfirmOpen(false)}><p>Unsaved changes will be lost. Are you sure?</p></ConfirmDialog>
        </Container>
    );
};
export default AddJobApplicationPage;