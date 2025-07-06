import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import StickyFooter from "@/components/shared/StickyFooter";
import { Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbDeviceFloppy,
  TbLoader,
  TbBuildingSkyscraper,
  TbMail,
  TbPhone,
  TbLink,
  TbPhoto,
  TbBrandFacebook,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandYoutube,
  TbBrandTwitter,
} from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getCompanyProfileAction,
  updateCompanyProfileAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";

// --- Define API and UI Data Types ---
type ApiCompanyProfileItem = {
  id: number;
  company_name: string;
  address: string | null;
  support_email: string;
  mobile: string | null;
  company_logo: string | null; // This is the full URL from API
  gst: string | null;
  smtp_host?: string | null;
  smtp_port?: string | null;
  smtp_secure?: string | null;
  smtp_username?: string | null;
  smtp_password?: string | null;
  smtp_name?: string | null;
  smtp_email?: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  twitter: string | null;
  created_at: string;
  updated_at: string;
  meta_logo: string | null; // This is the full URL from API
  notification_email: string;
};

// CORRECTED: This type now correctly reflects the data needed by the UI,
// omitting unnecessary fields without adding incorrect ones.
export type CompanyProfileUIData = Omit<
  ApiCompanyProfileItem,
  | "created_at"
  | "updated_at"
  | "smtp_password"
  | "smtp_host"
  | "smtp_port"
  | "smtp_secure"
  | "smtp_username"
  | "smtp_name"
  | "smtp_email"
>;

// --- Zod Schema for Company Profile Form ---
const companyProfileSchema = z.object({
  company_name: z.string().min(1, "Company Name is required.").max(150),
  address: z.string().max(500, "Address is too long.").optional().nullable(),
  support_email: z
    .string()
    .email("Invalid Support Email format.")
    .min(1, "Support Email is required."),
  mobile: z.string().max(30, "Mobile number too long").optional().nullable(),
  company_logo: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),
  gst: z.string().max(50, "GSTIN too long").optional().nullable(),
  facebook: z
    .string()
    .url("Invalid Facebook URL.")
    .optional()
    .nullable()
    .or(z.literal("")),
  instagram: z
    .string()
    .url("Invalid Instagram URL.")
    .optional()
    .nullable()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url("Invalid LinkedIn URL.")
    .optional()
    .nullable()
    .or(z.literal("")),
  youtube: z
    .string()
    .url("Invalid YouTube URL.")
    .optional()
    .nullable()
    .or(z.literal("")),
  twitter: z
    .string()
    .url("Invalid Twitter URL.")
    .optional()
    .nullable()
    .or(z.literal("")),
  meta_logo: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),
  notification_email: z
    .string()
    .email("Invalid Notification Email format.")
    .min(1, "Notification Email is required."),
});
type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

// --- Main CompanyProfile Component ---
const CompanyProfile = () => {
  const dispatch = useAppDispatch();
  const {
    rawProfileArrayFromState,
    status: masterLoadingStatus = "succeeded",
  } = useSelector(masterSelector);
  const actualProfileData =
    rawProfileArrayFromState === undefined ? null : rawProfileArrayFromState;

  const [currentProfileUI, setCurrentProfileUI] =
    useState<CompanyProfileUIData | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [metaLogoPreviewUrl, setMetaLogoPreviewUrl] = useState<string | null>(
    null
  );

  const formMethods = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    mode: "onChange",
  });

  useEffect(() => {
    dispatch(getCompanyProfileAction());
  }, [dispatch]);

  useEffect(() => {
    let effectiveApiProfile: ApiCompanyProfileItem | null = null;

    if (masterLoadingStatus === "succeeded") {
      if (
        actualProfileData &&
        Array.isArray(actualProfileData) &&
        actualProfileData.length > 0
      ) {
        effectiveApiProfile = actualProfileData[0] as ApiCompanyProfileItem;
      }

      if (effectiveApiProfile) {
        const apiProfile = effectiveApiProfile;

        // CORRECTED: Direct mapping as `CompanyProfileUIData` now matches API structure.
        // `apiProfile.company_logo` and `apiProfile.meta_logo` are the full URLs.
        const uiProfile: CompanyProfileUIData = {
          id: apiProfile.id,
          company_name: apiProfile.company_name,
          address: apiProfile.address || null,
          support_email: apiProfile.support_email,
          mobile: apiProfile.mobile || null,
          company_logo: apiProfile.company_logo || null,
          gst: apiProfile.gst || null,
          facebook: apiProfile.facebook || null,
          instagram: apiProfile.instagram || null,
          linkedin: apiProfile.linkedin || null,
          youtube: apiProfile.youtube || null,
          twitter: apiProfile.twitter || null,
          meta_logo: apiProfile.meta_logo || null,
          notification_email: apiProfile.notification_email,
        };
        setCurrentProfileUI(uiProfile);

        const formValuesToReset: CompanyProfileFormData = {
          company_name: uiProfile.company_name || "",
          address: uiProfile.address || "",
          support_email: uiProfile.support_email || "",
          mobile: uiProfile.mobile || "",
          company_logo: null,
          gst: uiProfile.gst || "",
          facebook: uiProfile.facebook || "",
          instagram: uiProfile.instagram || "",
          linkedin: uiProfile.linkedin || "",
          youtube: uiProfile.youtube || "",
          twitter: uiProfile.twitter || "",
          meta_logo: null,
          notification_email: uiProfile.notification_email || "",
        };

        formMethods.reset(formValuesToReset);
        setIsLoadingInitial(false);
      } else {
        setIsLoadingInitial(false);
        setCurrentProfileUI(null);
      }
    } else if (masterLoadingStatus === "loading") {
      setIsLoadingInitial(true);
    }
  }, [actualProfileData, masterLoadingStatus, formMethods, dispatch]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      if (metaLogoPreviewUrl) URL.revokeObjectURL(metaLogoPreviewUrl);
    };
  }, [logoPreviewUrl, metaLogoPreviewUrl]);

  const onUpdateProfile = async (data: CompanyProfileFormData) => {
    if (!currentProfileUI?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Profile ID missing. Cannot update.
        </Notification>
      );
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    (Object.keys(data) as Array<keyof CompanyProfileFormData>).forEach(
      (key) => {
        const value = data[key];
        if (key === "company_logo" || key === "meta_logo") {
          if (value instanceof File) formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    );

    try {
      await dispatch(
        updateCompanyProfileAction({ id: currentProfileUI.id, formData })
      ).unwrap();
      toast.push(
        <Notification title="Profile Updated" type="success" duration={2000}>
          Company profile updated.
        </Notification>
      );
      dispatch(getCompanyProfileAction()); // Re-fetch data
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Update failed.";
      toast.push(
        <Notification title="Update Failed" type="danger" duration={3000}>
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <Container className="h-full flex justify-center items-center">
        <TbLoader className="animate-spin text-4xl text-gray-500" />
        <p className="ml-2">Loading Company Profile...</p>
      </Container>
    );
  }

  if (!currentProfileUI) {
    return (
      <Container className="h-full flex justify-center items-center">
        <p className="text-center">No company profile data found.</p>
      </Container>
    );
  }

  // --- Render Functions for Form Sections ---
  const renderLogoFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormItem
        label="Company Logo"
        invalid={!!formMethods.formState.errors.company_logo}
        errorMessage={
          formMethods.formState.errors.company_logo?.message as string
        }
      >
        <div className="flex gap-4 items-end">
          {logoPreviewUrl ? (
            <img
              src={logoPreviewUrl}
              alt="New Logo Preview"
              className="mt-2 w-20 h-20 object-contain border rounded p-1"
            />
          ) : (
            // CORRECTED: Use currentProfileUI.company_logo which holds the full URL
            currentProfileUI?.company_logo && (
              <img
                src={currentProfileUI.company_logo}
                alt="Current Logo"
                className="mt-2 w-20 h-20 object-contain border rounded p-1"
              />
            )
          )}
          <Controller
            name="company_logo"
            control={formMethods.control}
            render={({ field: { onChange, onBlur, name } }) => (
              <Input
                type="file"
                name={name}
                onBlur={onBlur}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onChange(file);
                  if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
                  setLogoPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
              />
            )}
          />
        </div>
      </FormItem>

      <FormItem
        label="Meta Logo (Social Share)"
        invalid={!!formMethods.formState.errors.meta_logo}
        errorMessage={
          formMethods.formState.errors.meta_logo?.message as string
        }
      >
        <div className="flex gap-4 items-end">
          {metaLogoPreviewUrl ? (
            <img
              src={metaLogoPreviewUrl}
              alt="New Meta Logo Preview"
              className="mt-2 w-20 h-20 object-contain border rounded p-1"
            />
          ) : (
            // CORRECTED: Use currentProfileUI.meta_logo which holds the full URL
            currentProfileUI?.meta_logo && (
              <img
                src={currentProfileUI.meta_logo}
                alt="Current Meta Logo"
                className="mt-2 w-20 h-20 object-contain border rounded p-1"
              />
            )
          )}
          <Controller
            name="meta_logo"
            control={formMethods.control}
            render={({ field: { onChange, onBlur, name } }) => (
              <Input
                type="file"
                name={name}
                onBlur={onBlur}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onChange(file);
                  if (metaLogoPreviewUrl)
                    URL.revokeObjectURL(metaLogoPreviewUrl);
                  setMetaLogoPreviewUrl(
                    file ? URL.createObjectURL(file) : null
                  );
                }}
                accept="image/png, image/jpeg, image/webp"
              />
            )}
          />
        </div>
      </FormItem>
    </div>
  );

  const renderCompanyInfoFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormItem
        label="Company Name"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.company_name}
        errorMessage={formMethods.formState.errors.company_name?.message}
      >
        <Controller
          name="company_name"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Your Company LLC"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Address"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.address}
        errorMessage={formMethods.formState.errors.address?.message}
      >
        <Controller
          name="address"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="123 Business Rd..."
              textArea
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Support Email"
        invalid={!!formMethods.formState.errors.support_email}
        errorMessage={formMethods.formState.errors.support_email?.message}
      >
        <Controller
          name="support_email"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="email"
              placeholder="support@example.com"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Notification Email"
        invalid={!!formMethods.formState.errors.notification_email}
        errorMessage={
          formMethods.formState.errors.notification_email?.message
        }
      >
        <Controller
          name="notification_email"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="email"
              placeholder="noreply@example.com"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Mobile Number"
        invalid={!!formMethods.formState.errors.mobile}
        errorMessage={formMethods.formState.errors.mobile?.message}
      >
        <Controller
          name="mobile"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="tel"
              placeholder="+1-XXX-XXX-XXXX"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="GSTIN (Optional)"
        invalid={!!formMethods.formState.errors.gst}
        errorMessage={formMethods.formState.errors.gst?.message}
      >
        <Controller
          name="gst"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Your Company GSTIN"
            />
          )}
        />
      </FormItem>
    </div>
  );

  const renderSocialMediaFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormItem
        label="Facebook"
        invalid={!!formMethods.formState.errors.facebook}
        errorMessage={formMethods.formState.errors.facebook?.message}
      >
        <Controller
          name="facebook"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="url"
              placeholder="https://facebook.com/yourcompany"
              prefix={<TbBrandFacebook />}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Instagram"
        invalid={!!formMethods.formState.errors.instagram}
        errorMessage={formMethods.formState.errors.instagram?.message}
      >
        <Controller
          name="instagram"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="url"
              placeholder="https://instagram.com/yourcompany"
              prefix={<TbBrandInstagram />}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="LinkedIn"
        invalid={!!formMethods.formState.errors.linkedin}
        errorMessage={formMethods.formState.errors.linkedin?.message}
      >
        <Controller
          name="linkedin"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="url"
              placeholder="https://linkedin.com/company/yourcompany"
              prefix={<TbBrandLinkedin />}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="YouTube"
        invalid={!!formMethods.formState.errors.youtube}
        errorMessage={formMethods.formState.errors.youtube?.message}
      >
        <Controller
          name="youtube"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="url"
              placeholder="https://youtube.com/yourcompany"
              prefix={<TbBrandYoutube />}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Twitter (X)"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.twitter}
        errorMessage={formMethods.formState.errors.twitter?.message}
      >
        <Controller
          name="twitter"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="url"
              placeholder="https://twitter.com/yourcompany"
              prefix={<TbBrandTwitter />}
            />
          )}
        />
      </FormItem>
    </div>
  );

  const isButtonDisabled =
    (!formMethods.formState.isDirty &&
      !logoPreviewUrl &&
      !metaLogoPreviewUrl) ||
    !formMethods.formState.isValid ||
    isSubmitting;

  return (
    <>
      <Container>
        <Form
          id="companyProfileForm"
          onSubmit={formMethods.handleSubmit(onUpdateProfile)}
        >
          <AdaptiveCard>
            <div className="p-4 pt-2 md:p-6 md:pt-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">
                Company Profile Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage company branding, contact, and social media links.
              </p>
            </div>

            <div className="p-4 md:p-6 space-y-8">
              {renderLogoFields()}
              {renderCompanyInfoFields()}
              {renderSocialMediaFields()}
            </div>
          </AdaptiveCard>
        </Form>
        <StickyFooter
          className="flex items-center justify-end py-4 px-6"
          stickyClass="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <Button
            size="sm"
            variant="solid"
            form="companyProfileForm"
            type="submit"
            loading={isSubmitting}
            icon={<TbDeviceFloppy />}
            disabled={isButtonDisabled}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </StickyFooter>
      </Container>
    </>
  );
};

export default CompanyProfile;