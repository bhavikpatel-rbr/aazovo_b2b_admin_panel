import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct

// Define the structure of the form values for this section
interface DocumentSubmissionFormValues {
    identityProof?: File | FileList | string; // Can be File, FileList, or URL string if already uploaded
    addressProof?: File | FileList | string;
    educationalCertificates?: File | FileList | string;
    experienceCertificates?: File | FileList | string;
    currentOfferLetter?: File | FileList | string;
    pastOfferLetter?: File | FileList | string;
    relievingLetter?: File | FileList | string;
    designationLetter?: File | FileList | string;
    salarySlips?: File | FileList | string; // e.g., last 3 months combined or multiple uploads
    bankAccountProof?: File | FileList | string; // For bank account details for salary (e.g., cancelled cheque)
    panCard?: File | FileList | string;
    passportPhotograph?: File | FileList | string;
}

// Extend FormSectionBaseProps to include errors for documentSubmission
interface DocumentSubmissionSectionProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        documents?: { // Assuming form data is nested under 'documents'
            [K in keyof DocumentSubmissionFormValues]?: { message?: string }
        }
    };
    // control: Control<any>; // Already in FormSectionBaseProps
}

const DocumentSubmissionSection = ({
    control,
    errors,
}: DocumentSubmissionSectionProps) => {
    
    // Helper to handle file input changes for React Hook Form
    // This assumes you want to store the File object or FileList.
    // Adjust if your Input component or backend expects something different (e.g., only the first file, or specific handling)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: File | FileList | null) => void) => {
        if (event.target.files && event.target.files.length > 0) {
            // If your input allows multiple files, use event.target.files (FileList)
            // If only single file, use event.target.files[0] (File)
            // For this example, let's assume single file, but you can adjust
            fieldOnChange(event.target.files[0]); 
        } else {
            fieldOnChange(null);
        }
    };

    return (
        <Card id="documentSubmission">
            <h4 className="mb-6">Document Submission</h4>
            <div className="flex flex-col gap-6">
                {/* Using a 2-column layout for medium screens and up for better readability of file inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Identity Proof */}
                    <FormItem
                        label="Identity Proof (e.g., Aadhaar, Passport, Driver's License)"
                        invalid={Boolean(errors.documents?.identityProof)}
                        errorMessage={errors.documents?.identityProof?.message as string}
                    >
                        <Controller
                            name={`documents.identityProof`}
                            control={control}
                            rules={{ required: 'Identity Proof is required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png" // Specify acceptable file types
                                    // RHF's field.onChange will handle the FileList object by default.
                                    // No need to set field.value for uncontrolled file inputs.
                                    // We remove field.value and use a custom onChange to pass the File object(s)
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Address Proof */}
                    <FormItem
                        label="Address Proof (e.g., Utility Bill, Rental Agreement)"
                        invalid={Boolean(errors.documents?.addressProof)}
                        errorMessage={errors.documents?.addressProof?.message as string}
                    >
                        <Controller
                            name={`documents.addressProof`}
                            control={control}
                            rules={{ required: 'Address Proof is required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Educational Certificates */}
                    <FormItem
                        label="Educational Certificates (Highest Qualification, etc.)"
                        invalid={Boolean(errors.documents?.educationalCertificates)}
                        errorMessage={errors.documents?.educationalCertificates?.message as string}
                        // className="md:col-span-2" // If you want it to take full width
                    >
                        <Controller
                            name={`documents.educationalCertificates`}
                            control={control}
                            rules={{ required: 'Educational Certificates are required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.zip" // Allow zip for multiple documents
                                    // multiple // Add if multiple files can be uploaded for this field directly
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Experience Certificates */}
                    <FormItem
                        label="Experience Certificates (From previous employers)"
                        invalid={Boolean(errors.documents?.experienceCertificates)}
                        errorMessage={errors.documents?.experienceCertificates?.message as string}
                    >
                        <Controller
                            name={`documents.experienceCertificates`}
                            control={control}
                            // rules={{ required: 'Experience Certificates are required' }} // May not be required for freshers
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.zip"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Offer Letter (Current) */}
                    <FormItem
                        label="Offer Letter (Current Employment)"
                        invalid={Boolean(errors.documents?.currentOfferLetter)}
                        errorMessage={errors.documents?.currentOfferLetter?.message as string}
                    >
                        <Controller
                            name={`documents.currentOfferLetter`}
                            control={control}
                            rules={{ required: 'Current Offer Letter is required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Past Offer Letter */}
                    <FormItem
                        label="Past Offer Letter(s) (Optional)"
                        invalid={Boolean(errors.documents?.pastOfferLetter)}
                        errorMessage={errors.documents?.pastOfferLetter?.message as string}
                    >
                        <Controller
                            name={`documents.pastOfferLetter`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.zip"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Relieving Letter */}
                    <FormItem
                        label="Relieving Letter (From last employer)"
                        invalid={Boolean(errors.documents?.relievingLetter)}
                        errorMessage={errors.documents?.relievingLetter?.message as string}
                    >
                        <Controller
                            name={`documents.relievingLetter`}
                            control={control}
                            // rules={{ required: 'Relieving Letter is required for experienced candidates' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Designation Letter */}
                    <FormItem
                        label="Designation Letter (If applicable)"
                        invalid={Boolean(errors.documents?.designationLetter)}
                        errorMessage={errors.documents?.designationLetter?.message as string}
                    >
                        <Controller
                            name={`documents.designationLetter`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Salary Slip */}
                    <FormItem
                        label="Salary Slips (e.g., Last 3 Months)"
                        invalid={Boolean(errors.documents?.salarySlips)}
                        errorMessage={errors.documents?.salarySlips?.message as string}
                    >
                        <Controller
                            name={`documents.salarySlips`}
                            control={control}
                            // rules={{ required: 'Salary Slips are required for experienced candidates' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.zip"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Bank Account Details for Salary */}
                    <FormItem
                        label="Bank Account Proof (For Salary e.g. Cancelled Cheque)"
                        invalid={Boolean(errors.documents?.bankAccountProof)}
                        errorMessage={errors.documents?.bankAccountProof?.message as string}
                    >
                        <Controller
                            name={`documents.bankAccountProof`}
                            control={control}
                            rules={{ required: 'Bank Account Proof is required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* PAN Card */}
                    <FormItem
                        label="PAN Card"
                        invalid={Boolean(errors.documents?.panCard)}
                        errorMessage={errors.documents?.panCard?.message as string}
                    >
                        <Controller
                            name={`documents.panCard`}
                            control={control}
                            rules={{ required: 'PAN Card is required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Passport Size Photograph */}
                    <FormItem
                        label="Passport Size Photograph"
                        invalid={Boolean(errors.documents?.passportPhotograph)}
                        errorMessage={errors.documents?.passportPhotograph?.message as string}
                    >
                        <Controller
                            name={`documents.passportPhotograph`}
                            control={control}
                            rules={{ required: 'Passport Size Photograph is required' }}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, field.onChange)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </div>
            {/* 
                Optionally, add a submit button for this section or manage submission at a higher level
                <div className='flex justify-end items-center mt-6'>
                    <Button type='submit' variant="solid">Save Documents</Button>
                </div> 
            */}
        </Card>
    )
}

export default DocumentSubmissionSection