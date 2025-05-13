// src/views/your-path/CompanyProfile.tsx

import React, { useState, useEffect, useCallback } from 'react'
// import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import StickyFooter from '@/components/shared/StickyFooter'
import { Form, FormItem, Input, Card } from '@/components/ui' // Assuming Card is available

// Icons
import {
    TbDeviceFloppy, TbLoader, TbBuildingSkyscraper, TbMail, TbPhone, TbLink,
    TbPhoto, TbScript // Icons for sections
} from 'react-icons/tb'
import Textarea from '@/views/ui-components/forms/Input/Textarea'

// Redux (Optional)
// import { useAppDispatch, useAppSelector } from '@/reduxtool/store';
// import { getCompanyProfileAction, updateCompanyProfileAction } from '@/reduxtool/company/middleware';
// import { companySelector, selectCompanyProfile } from '@/reduxtool/company/companySlice';

// --- Define Company Profile Data Type ---
export type CompanyProfileData = {
    // Logos
    logoUrl?: string; // URL for main logo
    metaLogoUrl?: string; // URL for logo used in meta tags/social shares

    // Company Information
    companyName: string;
    address?: string; // Can be a single textarea or broken into parts
    customerCareEmail: string;
    notificationEmail: string; // Email for system notifications
    mobileNumber?: string; // Main contact/support mobile

    // Social Media Links
    facebookLink?: string;
    instagramLink?: string;
    linkedinLink?: string;
    youtubeLink?: string;
    twitterLink?: string;
};

// --- Zod Schema for Company Profile Form ---
const companyProfileSchema = z.object({
    logoUrl: z.string().url('Invalid URL for Logo.').optional().or(z.literal('')),
    metaLogoUrl: z.string().url('Invalid URL for Meta Logo.').optional().or(z.literal('')),

    companyName: z.string().min(1, 'Company Name is required.').max(150),
    address: z.string().max(500, "Address is too long.").optional().or(z.literal('')),
    customerCareEmail: z.string().email('Invalid Customer Care Email format.').min(1, "Customer Care Email is required."),
    notificationEmail: z.string().email('Invalid Notification Email format.').min(1, "Notification Email is required."),
    mobileNumber: z.string().max(30).optional().or(z.literal('')), // Basic validation

    facebookLink: z.string().url('Invalid Facebook URL.').optional().or(z.literal('')),
    instagramLink: z.string().url('Invalid Instagram URL.').optional().or(z.literal('')),
    linkedinLink: z.string().url('Invalid LinkedIn URL.').optional().or(z.literal('')),
    youtubeLink: z.string().url('Invalid YouTube URL.').optional().or(z.literal('')),
    twitterLink: z.string().url('Invalid Twitter URL.').optional().or(z.literal('')),
});
type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

// --- Main CompanyProfile Component ---
const CompanyProfile = () => {
    // const dispatch = useAppDispatch();
    // const existingProfile = useAppSelector(selectCompanyProfile);
    // const profileStatus = useAppSelector(state => state.company.status);

    const [currentProfile, setCurrentProfile] = useState<CompanyProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formMethods = useForm<CompanyProfileFormData>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: { // Will be overridden by fetched data
            companyName: '', customerCareEmail: '', notificationEmail: '',
            logoUrl: '', metaLogoUrl: '', address: '', mobileNumber: '',
            facebookLink: '', instagramLink: '', linkedinLink: '', youtubeLink: '', twitterLink: '',
        },
        mode: 'onChange',
    });

    // --- Fetch existing profile on mount ---
    useEffect(() => {
        setIsLoading(true);
        const fetchProfile = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
            const fetchedProfile: CompanyProfileData = { // Replace with actual API data
                companyName: 'Aazovo Inc.',
                address: '456 Tech Park, Silicon Valley, CA 94000, USA',
                customerCareEmail: 'care@aazovo.com',
                notificationEmail: 'noreply@aazovo.com',
                mobileNumber: '+1-800-555-AAZO',
                logoUrl: 'https://via.placeholder.com/150x50/007bff/ffffff?text=AazovoLogo',
                metaLogoUrl: 'https://via.placeholder.com/1200x630/007bff/ffffff?text=AazovoSocial',
                facebookLink: 'https://facebook.com/aazovo',
                instagramLink: 'https://instagram.com/aazovo',
                linkedinLink: 'https://linkedin.com/company/aazovo',
                youtubeLink: 'https://youtube.com/aazovo',
                twitterLink: 'https://twitter.com/aazovo',
            };
            setCurrentProfile(fetchedProfile);
            formMethods.reset(fetchedProfile);
            setIsLoading(false);
        };
        fetchProfile();
        // If using Redux: dispatch(getCompanyProfileAction());
    }, [formMethods]);

    // useEffect(() => { // For Redux
    //     if (existingProfile && profileStatus === 'succeeded') {
    //         formMethods.reset(existingProfile);
    //         setIsLoading(false);
    //     } else if (profileStatus === 'loading') {
    //         setIsLoading(true);
    //     }
    // }, [existingProfile, profileStatus, formMethods]);

    const onSaveProfile = async (data: CompanyProfileFormData) => {
        setIsSubmitting(true);
        console.log('Saving Company Profile:', data);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
        try {
            // dispatch(updateCompanyProfileAction(data)); // If using Redux
            setCurrentProfile(data as CompanyProfileData); // Update local state for demo
            toast.push(
                <Notification title="Profile Saved" type="success" duration={3000}>
                    Company profile updated successfully.
                </Notification>
            );
        } catch (error: any) {
            toast.push(
                <Notification title="Save Failed" type="danger" duration={4000}>
                    {error?.message || 'Could not save company profile.'}
                </Notification>
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Container className="h-full flex justify-center items-center">
                <TbLoader className="animate-spin text-4xl text-gray-500" />
                <p className="ml-2">Loading Company Profile...</p>
            </Container>
        );
    }

    // --- Render Functions for Form Sections ---
    const renderLogoFields = () => (
        <Card className="mb-6" header={
            <div className="flex items-center gap-2">
                <TbPhoto className="text-xl text-gray-600 dark:text-gray-300" />
                <span>Logos</span>
            </div>
        }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <FormItem label="Logo URL (Main)" invalid={!!formMethods.formState.errors.logoUrl} errorMessage={formMethods.formState.errors.logoUrl?.message}>
                    <Controller name="logoUrl" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/logo.png" />} />
                    {formMethods.getValues("logoUrl") && <img src={formMethods.getValues("logoUrl")} alt="Logo Preview" className="mt-2 max-h-16 object-contain border rounded"/>}
                </FormItem>
                <FormItem label="Logo URL for Meta/Social" invalid={!!formMethods.formState.errors.metaLogoUrl} errorMessage={formMethods.formState.errors.metaLogoUrl?.message}>
                    <Controller name="metaLogoUrl" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/meta-logo.jpg" />} />
                     {formMethods.getValues("metaLogoUrl") && <img src={formMethods.getValues("metaLogoUrl")} alt="Meta Logo Preview" className="mt-2 max-h-16 object-contain border rounded"/>}
                </FormItem>
                 {/* Note: For actual file uploads, replace Input with a FileUpload component */}
            </div>
        </Card>
    );

    const renderCompanyInfoFields = () => (
        <Card className="mb-6" header={
            <div className="flex items-center gap-2">
                <TbBuildingSkyscraper className="text-xl text-gray-600 dark:text-gray-300" />
                <span>Company Information</span>
            </div>
        }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <FormItem label="Company Name" className="md:col-span-2" invalid={!!formMethods.formState.errors.companyName} errorMessage={formMethods.formState.errors.companyName?.message}>
                    <Controller name="companyName" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Your Company LLC" />} />
                </FormItem>
                <FormItem label="Address (Optional)" className="md:col-span-2" invalid={!!formMethods.formState.errors.address} errorMessage={formMethods.formState.errors.address?.message}>
                    <Controller name="address" control={formMethods.control} render={({ field }) => <Textarea {...field} rows={3} placeholder="123 Business Rd, Suite 400, City, State, Zip, Country" />} />
                </FormItem>
                <FormItem label="Customer Care Support Email" invalid={!!formMethods.formState.errors.customerCareEmail} errorMessage={formMethods.formState.errors.customerCareEmail?.message}>
                    <Controller name="customerCareEmail" control={formMethods.control} render={({ field }) => <Input {...field} type="email" placeholder="support@yourcompany.com" />} />
                </FormItem>
                <FormItem label="Notification Email" invalid={!!formMethods.formState.errors.notificationEmail} errorMessage={formMethods.formState.errors.notificationEmail?.message}>
                    <Controller name="notificationEmail" control={formMethods.control} render={({ field }) => <Input {...field} type="email" placeholder="noreply@yourcompany.com" />} />
                </FormItem>
                <FormItem label="Mobile Number (Optional)" invalid={!!formMethods.formState.errors.mobileNumber} errorMessage={formMethods.formState.errors.mobileNumber?.message}>
                    <Controller name="mobileNumber" control={formMethods.control} render={({ field }) => <Input {...field} type="tel" placeholder="+1-XXX-XXX-XXXX" />} />
                </FormItem>
            </div>
        </Card>
    );

    const renderSocialMediaFields = () => (
        <Card className="mb-6" header={
            <div className="flex items-center gap-2">
                <TbLink className="text-xl text-gray-600 dark:text-gray-300" />
                <span>Social Media Links (Optional)</span>
            </div>
        }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <FormItem label="Facebook Link" invalid={!!formMethods.formState.errors.facebookLink} errorMessage={formMethods.formState.errors.facebookLink?.message}>
                    <Controller name="facebookLink" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://facebook.com/yourcompany" />} />
                </FormItem>
                <FormItem label="Instagram Link" invalid={!!formMethods.formState.errors.instagramLink} errorMessage={formMethods.formState.errors.instagramLink?.message}>
                    <Controller name="instagramLink" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://instagram.com/yourcompany" />} />
                </FormItem>
                <FormItem label="LinkedIn Link" invalid={!!formMethods.formState.errors.linkedinLink} errorMessage={formMethods.formState.errors.linkedinLink?.message}>
                    <Controller name="linkedinLink" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://linkedin.com/company/yourcompany" />} />
                </FormItem>
                <FormItem label="YouTube Link" invalid={!!formMethods.formState.errors.youtubeLink} errorMessage={formMethods.formState.errors.youtubeLink?.message}>
                    <Controller name="youtubeLink" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://youtube.com/yourcompany" />} />
                </FormItem>
                <FormItem label="Twitter (X) Link" className="md:col-span-2" invalid={!!formMethods.formState.errors.twitterLink} errorMessage={formMethods.formState.errors.twitterLink?.message}>
                    <Controller name="twitterLink" control={formMethods.control} render={({ field }) => <Input {...field} type="url" placeholder="https://twitter.com/yourcompany" />} />
                </FormItem>
            </div>
        </Card>
    );

    return (
        <>
            <Container className="h-full">
                <Form id="companyProfileForm" onSubmit={formMethods.handleSubmit(onSaveProfile)}>
                    <AdaptiveCard className="h-full" bodyClass="p-0 md:p-0">
                         <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                             <h3 className="text-lg font-semibold">Company Profile</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Manage your company's public information and branding.</p>
                        </div>

                        <div className="p-4 md:p-6 space-y-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                            {renderLogoFields()}
                            {renderCompanyInfoFields()}
                            {renderSocialMediaFields()}
                            {/* Add other sections as needed */}
                        </div>
                    </AdaptiveCard>
                </Form>
            </Container>

            <StickyFooter
                className="flex items-center justify-end py-4 px-6 bg-white dark:bg-gray-800"
                stickyClass="border-t border-gray-200 dark:border-gray-700"
            >
                <Button
                    size="sm"
                    variant="solid"
                    form="companyProfileForm"
                    type="submit"
                    loading={isSubmitting}
                    icon={<TbDeviceFloppy />}
                    disabled={!formMethods.formState.isDirty || !formMethods.formState.isValid || isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
            </StickyFooter>
        </>
    );
};

export default CompanyProfile;

// Helper function (if not globally available)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }