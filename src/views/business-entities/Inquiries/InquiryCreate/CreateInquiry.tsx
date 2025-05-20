import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormItem } from '@/components/ui/Form'
import { useState } from 'react';
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DatePicker from '@/components/ui/DatePicker'

const CreateInquiry = () => {
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();

    const [attachments, setAttachments] = useState<File[]>([]);

    const onSubmit = (data : any) => {
        console.log('Submitted Inquiry:', { ...data, inquiry_attachments: attachments.map((file) => file.name) });
        reset();
        setAttachments([]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    return (
        <>
            <Container>
                <AdaptiveCard>
                <div className="flex flex-col gap-6 p-6">
                    <h1 className="text-2xl font-bold">Create Inquiry</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Basic Info */}
                        <FormItem label="Inquiry ID" invalid={!!errors.inquiry_id} errorMessage={typeof errors.inquiry_id === 'object' && errors.inquiry_id ? (errors.inquiry_id as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_id"
                                control={control}
                                render={({ field }) => <Input placeholder="Enter Inquiry ID" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Company Name" invalid={!!errors.company_name} errorMessage={typeof errors.company_name === 'object' && errors.company_name ? (errors.company_name as { message?: string }).message : undefined}>
                            <Controller
                                name="company_name"
                                control={control}
                                render={({ field }) => <Input placeholder="Company Name" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Contact Person Name" invalid={!!errors.contact_person_name} errorMessage={typeof errors.contact_person_name === 'object' && errors.contact_person_name ? (errors.contact_person_name as { message?: string }).message : undefined}>
                            <Controller
                                name="contact_person_name"
                                control={control}
                                render={({ field }) => <Input placeholder="Full Name" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Contact Person Email" invalid={!!errors.contact_person_email} errorMessage={typeof errors.contact_person_email === 'object' && errors.contact_person_email ? (errors.contact_person_email as { message?: string }).message : undefined}>
                            <Controller
                                name="contact_person_email"
                                control={control}
                                render={({ field }) => <Input type="email" placeholder="Email Address" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Contact Person Phone" invalid={!!errors.contact_person_phone} errorMessage={typeof errors.contact_person_phone === 'object' && errors.contact_person_phone ? (errors.contact_person_phone as { message?: string }).message : undefined}>
                            <Controller
                                name="contact_person_phone"
                                control={control}
                                render={({ field }) => <Input placeholder="Phone Number" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Inquiry Type" invalid={!!errors.inquiry_type} errorMessage={typeof errors.inquiry_type === 'object' && errors.inquiry_type ? (errors.inquiry_type as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_type"
                                control={control}
                                render={({ field }) => <Input placeholder="Inquiry Type" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Inquiry Subject" invalid={!!errors.inquiry_subject} errorMessage={typeof errors.inquiry_subject === 'object' && errors.inquiry_subject ? (errors.inquiry_subject as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_subject"
                                control={control}
                                render={({ field }) => <Input placeholder="Subject" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Inquiry Description" invalid={!!errors.inquiry_description} errorMessage={typeof errors.inquiry_description === 'object' && errors.inquiry_description ? (errors.inquiry_description as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_description"
                                control={control}
                                render={({ field }) => <Input placeholder="Description" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Priority" invalid={!!errors.inquiry_priority} errorMessage={typeof errors.inquiry_priority === 'object' && errors.inquiry_priority ? (errors.inquiry_priority as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_priority"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={[
                                            { value: 'Low', label: 'Low' },
                                            { value: 'Medium', label: 'Medium' },
                                            { value: 'High', label: 'High' },
                                        ]}
                                        placeholder="Select priority"
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Status" invalid={!!errors.inquiry_status} errorMessage={typeof errors.inquiry_status === 'object' && errors.inquiry_status ? (errors.inquiry_status as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={[
                                            { value: 'Open', label: 'Open' },
                                            { value: 'In Progress', label: 'In Progress' },
                                            { value: 'Closed', label: 'Closed' },
                                        ]}
                                        placeholder="Select status"
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Assigned To" invalid={!!errors.assigned_to} errorMessage={typeof errors.assigned_to === 'object' && errors.assigned_to ? (errors.assigned_to as { message?: string }).message : undefined}>
                            <Controller
                                name="assigned_to"
                                control={control}
                                render={({ field }) => <Input placeholder="Person or Team Name" {...field} />}
                            />
                        </FormItem>

                        <FormItem label="Inquiry Date" invalid={!!errors.inquiry_date} errorMessage={typeof errors.inquiry_date === 'object' && errors.inquiry_date ? (errors.inquiry_date as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_date"
                                control={control}
                                render={({ field }) => <DatePicker
                        labelFormat={{
                            month: 'MMMM',
                            year: 'YY',
                        }}
                        defaultValue={new Date()}
                    /> }
                            />
                        </FormItem>

                        <FormItem label="Response Date" invalid={!!errors.response_date} errorMessage={typeof errors.response_date === 'object' && errors.response_date ? (errors.response_date as { message?: string }).message : undefined}>
                            <Controller
                                name="response_date"
                                control={control}
                                render={({ field }) => <DatePicker
                                    labelFormat={{
                                        month: 'MMMM',
                                        year: 'YY',
                                    }}
                                    defaultValue={new Date()}
                                />}
                            />
                        </FormItem>

                        <FormItem label="Resolution Date" invalid={!!errors.resolution_date} errorMessage={typeof errors.resolution_date === 'object' && errors.resolution_date ? (errors.resolution_date as { message?: string }).message : undefined}>
                            <Controller
                                name="resolution_date"
                                control={control}
                                render={({ field }) => <DatePicker
                                    labelFormat={{
                                        month: 'MMMM',
                                        year: 'YY',
                                    }}
                                    defaultValue={new Date()}
                                />}
                            />
                        </FormItem>

                        <FormItem label="Follow-Up Date" invalid={!!errors.follow_up_date} errorMessage={typeof errors.follow_up_date === 'object' && errors.follow_up_date ? (errors.follow_up_date as { message?: string }).message : undefined}>
                            <Controller
                                name="follow_up_date"
                                control={control}
                                render={({ field }) => <DatePicker
                                    labelFormat={{
                                        month: 'MMMM',
                                        year: 'YY',
                                    }}
                                    defaultValue={new Date()}
                                />}
                            />
                        </FormItem>

                        <FormItem label="Feedback Status" invalid={!!errors.feedback_status} errorMessage={typeof errors.feedback_status === 'object' && errors.feedback_status ? (errors.feedback_status as { message?: string }).message : undefined}>
                            <Controller
                                name="feedback_status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={[
                                            { value: 'Positive', label: 'Positive' },
                                            { value: 'Neutral', label: 'Neutral' },
                                            { value: 'Negative', label: 'Negative' },
                                        ]}
                                        placeholder="Select feedback"
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Resolution" invalid={!!errors.inquiry_resolution} errorMessage={typeof errors.inquiry_resolution === 'object' && errors.inquiry_resolution ? (errors.inquiry_resolution as { message?: string }).message : undefined}>
                            <Controller
                                name="inquiry_resolution"
                                control={control}
                                render={({ field }) => <Input placeholder="Enter resolution" {...field} />}
                            />
                        </FormItem>
                        <FormItem label="Attachments">
                            <Controller
                                name="inquiry_attachments"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            type="file"
                                            multiple
                                            onChange={(e) => {
                                                const files = (e.target as HTMLInputElement).files;
                                                const fileList = files ? Array.from(files) : [];
                                                field.onChange(fileList); // Pass the list of files to form state
                                            }}
                                        />
                                        {Array.isArray(field.value) && field.value.length > 0 && (
                                            <ul className="mt-2 text-sm text-gray-600">
                                                {field.value.map((file: File, index: number) => (
                                                    <li key={index}>{file.name}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            />
                        </FormItem>


                        <FormItem label="Form Status" invalid={!!errors.status} errorMessage={typeof errors.status === 'object' && errors.status ? (errors.status as { message?: string }).message : undefined}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={[
                                            { value: 'active', label: 'Active' },
                                            { value: 'inactive', label: 'Inactive' },
                                        ]}
                                        placeholder="Select form status"
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Submit/Cancel Buttons */}
                        <div className="col-span-full flex justify-end gap-x-3 mt-4">
                            <Button type="button" className="px-4 py-2 rounded">Cancel</Button>
                            <Button type="submit" className="px-4 py-2 rounded" variant="solid">Save</Button>
                        </div>
                    </form>
                </div>
                </AdaptiveCard>
            </Container>
        </>
    );
};

export default CreateInquiry;
