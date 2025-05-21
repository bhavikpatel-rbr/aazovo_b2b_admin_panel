// src/views/your-path/GlobalSettings.tsx (Or a more appropriate name like GlobalConfiguration)

import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from 'react-router-dom'; // If save redirects
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import StickyFooter from "@/components/shared/StickyFooter"; // For the save button
import { Card, Form, FormItem, Input, Select } from "@/components/ui"; // Assuming Select and Textarea exist

// Icons
import { TbDeviceFloppy, TbLoader } from "react-icons/tb"; // Save, Loading icons
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// Redux (Optional - for fetching/saving settings from a central store/API)
// import { useAppDispatch, useAppSelector } from '@/reduxtool/store';
// import { getGlobalSettingsAction, updateGlobalSettingsAction } from '@/reduxtool/settings/middleware';
// import { settingsSelector, selectGlobalSettings } from '@/reduxtool/settings/settingsSlice';

// --- Define Global Settings Type ---
export type GlobalSettingsData = {
  // General Site Info
  siteName: string;
  siteTagline?: string;
  adminEmail: string; // For notifications

  // Contact Information
  contactEmail: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string; // Could be a select dropdown

  // Social Media Links (example)
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;

  // SEO Defaults
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  defaultMetaKeywords?: string; // Comma-separated

  // Store Settings (if e-commerce related)
  defaultCurrency: string; // e.g., 'USD', 'EUR' - Select dropdown
  weightUnit: "kg" | "lb"; // Select dropdown
  dimensionUnit: "cm" | "in"; // Select dropdown

  // Analytics
  googleAnalyticsId?: string;
  // Add other settings as needed, e.g., mail server config, API keys, feature flags
};

// --- Zod Schema for Global Settings Form ---
const SUPPORTED_CURRENCIES_SETTINGS = [
  // Example
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
];
const currencyValuesSettings = SUPPORTED_CURRENCIES_SETTINGS.map(
  (c) => c.value
) as [string, ...string[]];

const globalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site Name is required.").max(100),
  siteTagline: z.string().max(255).optional().or(z.literal("")),
  adminEmail: z
    .string()
    .email("Invalid admin email format.")
    .min(1, "Admin email is required."),

  contactEmail: z
    .string()
    .email("Invalid contact email format.")
    .min(1, "Contact email is required."),
  contactPhone: z.string().max(30).optional().or(z.literal("")), // Basic validation
  addressLine1: z.string().max(255).optional().or(z.literal("")),
  addressLine2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  stateProvince: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")), // Consider a select for countries

  facebookUrl: z
    .string()
    .url("Invalid Facebook URL.")
    .optional()
    .or(z.literal("")),
  twitterUrl: z
    .string()
    .url("Invalid Twitter URL.")
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .url("Invalid Instagram URL.")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Invalid LinkedIn URL.")
    .optional()
    .or(z.literal("")),

  defaultMetaTitle: z
    .string()
    .max(70, "Meta title too long")
    .optional()
    .or(z.literal("")),
  defaultMetaDescription: z
    .string()
    .max(160, "Meta description too long")
    .optional()
    .or(z.literal("")),
  defaultMetaKeywords: z.string().max(255).optional().or(z.literal("")),

  defaultCurrency: z.enum(currencyValuesSettings, {
    errorMap: () => ({ message: "Please select a default currency." }),
  }),
  weightUnit: z.enum(["kg", "lb"]),
  dimensionUnit: z.enum(["cm", "in"]),

  googleAnalyticsId: z
    .string()
    .regex(
      /^UA-\d{4,9}-\d{1,2}$|^G-[A-Z0-9]{10}$/,
      "Invalid Google Analytics ID format (UA-XXXXX-Y or G-XXXXXXXXXX)."
    )
    .optional()
    .or(z.literal("")),
});
type GlobalSettingsFormData = z.infer<typeof globalSettingsSchema>;

// --- Main GlobalSettings Component ---
const GlobalSettings = () => {
  // const dispatch = useAppDispatch(); // For Redux
  // const existingSettings = useAppSelector(selectGlobalSettings); // For Redux
  // const settingsStatus = useAppSelector(state => state.settings.status); // For Redux loading

  // Local state for settings - initialize with defaults or fetched data
  // In a real app, you'd fetch this from an API on component mount
  const [currentSettings, setCurrentSettings] =
    useState<GlobalSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<GlobalSettingsFormData>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      // These will be overridden by fetched settings
      siteName: "",
      adminEmail: "",
      contactEmail: "",
      defaultCurrency: currencyValuesSettings[0],
      weightUnit: "kg",
      dimensionUnit: "cm",
      // Initialize other optional fields as empty strings or undefined
      siteTagline: "",
      contactPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateProvince: "",
      postalCode: "",
      country: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      defaultMetaTitle: "",
      defaultMetaDescription: "",
      defaultMetaKeywords: "",
      googleAnalyticsId: "",
    },
    mode: "onChange",
  });

  // --- Fetch existing settings on mount ---
  useEffect(() => {
    // Simulate API call to fetch settings
    setIsLoading(true);
    const fetchSettings = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      const fetchedSettings: GlobalSettingsData = {
        // Replace with actual API response
        siteName: "Aazovo Commerce",
        siteTagline: "Your one-stop shop!",
        adminEmail: "admin@aazovo.com",
        contactEmail: "support@aazovo.com",
        contactPhone: "+1-555-123-4567",
        addressLine1: "123 Main St",
        city: "Anytown",
        stateProvince: "CA",
        postalCode: "90210",
        country: "USA",
        facebookUrl: "https://facebook.com/aazovo",
        twitterUrl: "https://twitter.com/aazovo",
        defaultCurrency: "USD",
        weightUnit: "kg",
        dimensionUnit: "cm",
        googleAnalyticsId: "G-XXXXXXXXXX",
        // ... other fetched settings
      };
      setCurrentSettings(fetchedSettings);
      formMethods.reset(fetchedSettings); // Populate form with fetched settings
      setIsLoading(false);
    };

    fetchSettings();
    // If using Redux: dispatch(getGlobalSettingsAction());
  }, [formMethods]); // formMethods.reset dependency

  // useEffect(() => { // For Redux, to update form when settings are fetched
  //     if (existingSettings && settingsStatus === 'succeeded') {
  //         formMethods.reset(existingSettings);
  //         setIsLoading(false);
  //     } else if (settingsStatus === 'loading') {
  //         setIsLoading(true);
  //     }
  // }, [existingSettings, settingsStatus, formMethods]);

  const onSaveSettings = async (data: GlobalSettingsFormData) => {
    setIsSubmitting(true);
    console.log("Saving Global Settings:", data);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      // dispatch(updateGlobalSettingsAction(data)); // If using Redux
      setCurrentSettings(data as GlobalSettingsData); // Update local state for demo
      toast.push(
        <Notification title="Settings Saved" type="success" duration={3000}>
          Global settings have been updated successfully.
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Save Failed" type="danger" duration={4000}>
          {error?.message || "Could not save settings."}
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
        <p className="ml-2">Loading Settings...</p>
      </Container>
    );
  }

  // Group form items for better organization
  const renderGeneralInfoFields = () => (
    <Card className="mb-6" header="General Site Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <FormItem
          label="Site Name"
          invalid={!!formMethods.formState.errors.siteName}
          errorMessage={formMethods.formState.errors.siteName?.message}
        >
          <Controller
            name="siteName"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="Your Awesome Site" />
            )}
          />
        </FormItem>
        <FormItem
          label="Site Tagline (Optional)"
          invalid={!!formMethods.formState.errors.siteTagline}
          errorMessage={formMethods.formState.errors.siteTagline?.message}
        >
          <Controller
            name="siteTagline"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="A catchy phrase for your site" />
            )}
          />
        </FormItem>
        <FormItem
          label="Admin Email (for notifications)"
          invalid={!!formMethods.formState.errors.adminEmail}
          errorMessage={formMethods.formState.errors.adminEmail?.message}
        >
          <Controller
            name="adminEmail"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} type="email" placeholder="admin@example.com" />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );

  const renderContactInfoFields = () => (
    <Card className="mb-6" header="Contact Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <FormItem
          label="Contact Email"
          invalid={!!formMethods.formState.errors.contactEmail}
          errorMessage={formMethods.formState.errors.contactEmail?.message}
        >
          <Controller
            name="contactEmail"
            control={formMethods.control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="support@example.com"
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Contact Phone (Optional)"
          invalid={!!formMethods.formState.errors.contactPhone}
          errorMessage={formMethods.formState.errors.contactPhone?.message}
        >
          <Controller
            name="contactPhone"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} type="tel" placeholder="+1-123-456-7890" />
            )}
          />
        </FormItem>
        <FormItem
          label="Address Line 1 (Optional)"
          className="md:col-span-2"
          invalid={!!formMethods.formState.errors.addressLine1}
          errorMessage={formMethods.formState.errors.addressLine1?.message}
        >
          <Controller
            name="addressLine1"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="123 Main Street" />
            )}
          />
        </FormItem>
        {/* Add more address fields: addressLine2, city, state, postalCode, country */}
      </div>
    </Card>
  );

  const renderStoreSettingsFields = () => (
    <Card className="mb-6" header="Store Settings">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <FormItem
          label="Default Currency"
          invalid={!!formMethods.formState.errors.defaultCurrency}
          errorMessage={formMethods.formState.errors.defaultCurrency?.message}
        >
          <Controller
            name="defaultCurrency"
            control={formMethods.control}
            render={({ field }) => (
              <Select
                placeholder="Select currency"
                options={SUPPORTED_CURRENCIES_SETTINGS}
                value={SUPPORTED_CURRENCIES_SETTINGS.find(
                  (c) => c.value === field.value
                )}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Weight Unit"
          invalid={!!formMethods.formState.errors.weightUnit}
          errorMessage={formMethods.formState.errors.weightUnit?.message}
        >
          <Controller
            name="weightUnit"
            control={formMethods.control}
            render={({ field }) => (
              <Select
                placeholder="Select unit"
                options={[
                  { value: "kg", label: "Kilogram (kg)" },
                  { value: "lb", label: "Pound (lb)" },
                ]}
                value={
                  field.value === "kg"
                    ? { value: "kg", label: "Kilogram (kg)" }
                    : { value: "lb", label: "Pound (lb)" }
                }
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Dimension Unit"
          invalid={!!formMethods.formState.errors.dimensionUnit}
          errorMessage={formMethods.formState.errors.dimensionUnit?.message}
        >
          <Controller
            name="dimensionUnit"
            control={formMethods.control}
            render={({ field }) => (
              <Select
                placeholder="Select unit"
                options={[
                  { value: "cm", label: "Centimeter (cm)" },
                  { value: "in", label: "Inch (in)" },
                ]}
                value={
                  field.value === "cm"
                    ? { value: "cm", label: "Centimeter (cm)" }
                    : { value: "in", label: "Inch (in)" }
                }
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );
  const renderSEOFields = () => (
    <Card className="mb-6" header="Default SEO Settings">
      <div className="grid grid-cols-1 gap-4 p-4">
        <FormItem
          label="Default Meta Title (Optional)"
          invalid={!!formMethods.formState.errors.defaultMetaTitle}
          errorMessage={formMethods.formState.errors.defaultMetaTitle?.message}
        >
          <Controller
            name="defaultMetaTitle"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="Your Site - Awesome Products" />
            )}
          />
        </FormItem>
        <FormItem
          label="Default Meta Description (Optional)"
          invalid={!!formMethods.formState.errors.defaultMetaDescription}
          errorMessage={
            formMethods.formState.errors.defaultMetaDescription?.message
          }
        >
          <Controller
            name="defaultMetaDescription"
            control={formMethods.control}
            render={({ field }) => (
              <Textarea
                {...field}
                rows={3}
                placeholder="Brief description of your site for search engines."
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Default Meta Keywords (Optional, comma-separated)"
          invalid={!!formMethods.formState.errors.defaultMetaKeywords}
          errorMessage={
            formMethods.formState.errors.defaultMetaKeywords?.message
          }
        >
          <Controller
            name="defaultMetaKeywords"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="keyword1, keyword2, keyword3" />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );

  const renderAnalyticsFields = () => (
    <Card className="mb-6" header="Analytics & Tracking">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <FormItem
          label="Google Analytics ID (Optional)"
          invalid={!!formMethods.formState.errors.googleAnalyticsId}
          errorMessage={formMethods.formState.errors.googleAnalyticsId?.message}
        >
          <Controller
            name="googleAnalyticsId"
            control={formMethods.control}
            render={({ field }) => (
              <Input {...field} placeholder="UA-XXXXX-Y or G-XXXXXXXXXX" />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );

  return (
    <>
      <Container className="h-full">
        <Form
          id="globalSettingsForm"
          onSubmit={formMethods.handleSubmit(onSaveSettings)}
        >
          <AdaptiveCard className="h-full" bodyClass="p-0 md:p-0">
            {" "}
            {/* Remove padding from card body if sections have their own */}
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Global Site Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure general settings for your entire application.
              </p>
            </div>
            <div
              className="p-4 md:p-6 space-y-6 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 200px)" }}
            >
              {" "}
              {/* Adjust max-height as needed */}
              {renderGeneralInfoFields()}
              {renderContactInfoFields()}
              {renderStoreSettingsFields()}
              {renderSEOFields()}
              {renderAnalyticsFields()}
              {/* Add more sections/cards for other settings groups */}
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
          form="globalSettingsForm" // Link to the form ID
          type="submit"
          loading={isSubmitting}
          icon={<TbDeviceFloppy />}
          disabled={
            !formMethods.formState.isDirty ||
            !formMethods.formState.isValid ||
            isSubmitting
          } // Disable if no changes or invalid
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </StickyFooter>
    </>
  );
};

export default GlobalSettings;
