// src/views/hiring/EditJobApplicationPage.tsx

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

// UI Components
import Input from '@/components/ui/Input';
import { FormItem, FormContainer } from '@/components/ui/Form';
import { Select as UiSelect, DatePicker, Button } from '@/components/ui';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import Container from '@/components/shared/Container';
import AdaptableCard from '@/components/shared/AdaptiveCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
// import { Loading } from '@/components/shared'; // Assuming you have a Loading component

// Icons
import { BiChevronRight } from 'react-icons/bi';
import { TbInfoCircle } from 'react-icons/tb';

// Types and Schema (from shared types.ts)
import type { ApplicationFormData, JobApplicationItem } from '../types';
import { applicationFormSchema, applicationStatusOptions } from '../types';


const EditJobApplicationPage = () => {
    const navigate = useNavigate();
    const { applicationId } = useParams<{ applicationId: string }>(); // Get ID from URL

    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [applicationData, setApplicationData] = useState<JobApplicationItem | null>(null);

    const { control, handleSubmit, reset, formState: { errors, isDirty, isValid } } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationFormSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (!applicationId) {
            toast.push(<Notification title="Error" type="danger">Application ID is missing.</Notification>);
            navigate('/hiring/job-applications');
            return;
        }

        setIsLoading(true);
        // TODO: Replace with actual API call to fetch application by ID
        console.log("Fetching application data for ID:", applicationId);
        new Promise<JobApplicationItem | null>((resolve) => {
            setTimeout(() => {
                // Simulate finding the application from dummy data or API
                const dummyApplications: JobApplicationItem[] = [
                    { id: "APP001", status: "new", jobId: "JP001", jobTitle: "Senior Frontend Engineer", department: "Engineering", name: "Alice Applicant", email: "alice.a@email.com", mobileNo: "+1-555-2001", workExperience: "6 Years React", applicationDate: new Date(2023, 10, 6, 9, 0), avatar: "/img/avatars/thumb-1.jpg", resumeUrl: "https://example.com/alice.pdf" },
                    { id: "APP003", status: "interviewing", jobId: "JP006", jobTitle: "Data Scientist", department: "Data Science & Analytics", name: "Charlie Davis", email: "charlie.d@web.com", mobileNo: null, workExperience: "4 Years Python/ML", applicationDate: new Date(2023, 10, 7, 8, 15), notes: "Strong portfolio, scheduled 1st round.", avatar: "/img/avatars/thumb-3.jpg" },
                ];
                const foundApp = dummyApplications.find(app => app.id === applicationId);
                resolve(foundApp || null);
            }, 500);
        })
        .then(data => {
            if (data) {
                setApplicationData(data);
                reset({
                    ...data,
                    applicationDate: dayjs(data.applicationDate).isValid() ? dayjs(data.applicationDate).toDate() : new Date(), // Ensure Date object
                    mobileNo: data.mobileNo || null,
                    jobId: data.jobId || null,
                    resumeUrl: data.resumeUrl || null,
                    coverLetter: data.coverLetter || null,
                    notes: data.notes || null,
                    jobApplicationLink: data.jobApplicationLink || null,
                });
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


    const onSubmit = async (data: ApplicationFormData) => {
        if (!applicationId) return;
        setIsSubmitting(true);
        console.log("Updating Application:", applicationId, data);
        // TODO: Replace with actual API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.push(<Notification title="Success" type="success">Application updated successfully.</Notification>);
            navigate('/hiring/job-applications');
        } catch (error: any) {
            toast.push(<Notification title="Error" type="danger">{error.message || "Update failed."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) setCancelConfirmOpen(true);
        else navigate('/hiring/job-applications');
    };

    if (isLoading) {
        return <Container className="h-full flex justify-center items-center"><p className="ml-2">Loading application details...</p></Container>;
    }
    if (!applicationData) {
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
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex gap-1 items-center mb-4">
                        <NavLink to="/hiring/job-applications">
                            <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Job Applications</h6>
                        </NavLink>
                        <BiChevronRight size={18} className="text-gray-500" />
                        <h5 className="font-semibold text-primary-600 dark:text-primary-400">Edit Application: {applicationData.name} ({applicationData.id})</h5>
                    </div>

                    <AdaptableCard className="mb-4">
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                            <FormItem label="Applicant Name*" error={errors.name?.message}><Controller name="name" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Email*" error={errors.email?.message}><Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" />} /></FormItem>
                            <FormItem label="Mobile No" error={errors.mobileNo?.message}><Controller name="mobileNo" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Department*" error={errors.department?.message}><Controller name="department" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Job Title" error={errors.jobTitle?.message}><Controller name="jobTitle" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Job ID" error={errors.jobId?.message}><Controller name="jobId" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Work Experience*" error={errors.workExperience?.message}><Controller name="workExperience" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Application Date*" error={errors.applicationDate?.message as string}><Controller name="applicationDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || new Date()} />} /></FormItem>
                            <FormItem label="Status*" error={errors.status?.message}><Controller name="status" control={control} render={({ field }) => <UiSelect options={applicationStatusOptions} value={applicationStatusOptions.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />} /></FormItem>
                            <FormItem label="Resume URL" error={errors.resumeUrl?.message} className="lg:col-span-1 md:col-span-2"><Controller name="resumeUrl" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Job Application Link" error={errors.jobApplicationLink?.message} className="lg:col-span-2 md:col-span-2"><Controller name="jobApplicationLink" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                            <FormItem label="Notes / Cover Letter" error={errors.notes?.message || errors.coverLetter?.message} className="md:col-span-2 lg:col-span-3"><Controller name="coverLetter" control={control} render={({ field }) => <Input {...field} textArea rows={4} />} /></FormItem> {/* Changed to coverLetter, or use notes */}
                        </div>
                    </AdaptableCard>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="solid" loading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>Save Changes</Button>
                    </div>
                </form>
            </FormContainer>
            <ConfirmDialog isOpen={cancelConfirmOpen} type="warning" title="Discard Changes?" onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); navigate('/hiring/job-applications'); }} onCancel={() => setCancelConfirmOpen(false)}><p>Unsaved changes will be lost. Are you sure?</p></ConfirmDialog>
        </Container>
    );
};
export default EditJobApplicationPage;