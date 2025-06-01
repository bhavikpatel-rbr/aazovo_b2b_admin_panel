// src/views/your-path/CompanyProfile.tsx

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
import { Form, FormItem, Input, Card, Avatar } from "@/components/ui"; // Removed UiSelect as SMTP is gone
import Textarea from "@/views/ui-components/forms/Input/Textarea"; // Ensure this path is correct (e.g., '@/components/ui/Textarea')

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
import { BiChevronRight } from "react-icons/bi";
import { NavLink } from "react-router-dom";

const LOGO_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "";

// --- Define API and UI Data Types ---
type ApiCompanyProfileItem = {
  id: number;
  name: string;
  address: string | null;
  support_email: string;
  mobile: string | null;
  logo: string | null;
  gst: string | null;
  smtp_host?: string | null; // Keep optional if backend might send them
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
  logo_for_meta: string | null;
  notification_email: string;
  icon_full_path: string;
  meta_icon_full_path: string;
};

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
> & {
  logo_full_path: string | null;
  meta_icon_full_path: string | null;
  icon_full_path: string | null;
};

// --- Zod Schema for Company Profile Form (SMTP fields removed) ---
const companyProfileSchema = z.object({
  name: z.string().min(1, "Company Name is required.").max(150),
  address: z.string().max(500, "Address is too long.").optional().nullable(),
  support_email: z
    .string()
    .email("Invalid Support Email format.")
    .min(1, "Support Email is required."),
  mobile: z.string().max(30, "Mobile number too long").optional().nullable(),
  logo: z
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
  logo_for_meta: z
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
  // CRITICAL: Check what 'masterSelector' returns.
  // 'rawProfileArrayFromState' is the key used in previous examples. If your slice returns the profile object directly, adjust accordingly.
  // e.g., const { companyProfile: actualProfileData, status: masterLoadingStatus } = useSelector(masterSelector);
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
    console.log("[CompanyProfile] Dispatching getCompanyProfileAction");
    dispatch(getCompanyProfileAction());
  }, [dispatch]);

  useEffect(() => {
    console.log(
      "[CompanyProfile] Form reset useEffect triggered. Profile Status:",
      masterLoadingStatus,
      "Redux Data (actualProfileData):",
      actualProfileData
    );

    let effectiveApiProfile: ApiCompanyProfileItem | null = null;

    if (masterLoadingStatus === "succeeded") {
      if (actualProfileData) {
        if (Array.isArray(actualProfileData) && actualProfileData.length > 0) {
          effectiveApiProfile = actualProfileData[0] as ApiCompanyProfileItem;
          console.log(
            "[CompanyProfile] Extracted API Profile from ARRAY:",
            effectiveApiProfile
          );
        } else if (
          typeof actualProfileData === "object" &&
          !Array.isArray(actualProfileData) &&
          (actualProfileData as ApiCompanyProfileItem).id
        ) {
          effectiveApiProfile = actualProfileData as ApiCompanyProfileItem;
          console.log(
            "[CompanyProfile] Extracted API Profile from DIRECT OBJECT:",
            effectiveApiProfile
          );
        } else if (
          Array.isArray(actualProfileData) &&
          actualProfileData.length === 0
        ) {
          console.warn(
            "[CompanyProfile] Profile fetch succeeded, but data array is empty."
          );
        } else {
          console.warn(
            "[CompanyProfile] Profile fetch succeeded, but data format is unexpected:",
            actualProfileData
          );
        }
      } else {
        console.warn(
          "[CompanyProfile] Profile fetch succeeded, but actualProfileData is null or undefined."
        );
      }

      if (effectiveApiProfile) {
        const apiProfile = effectiveApiProfile;

        const uiProfile: CompanyProfileUIData = {
          id: apiProfile.id,
          name: apiProfile.name,
          address: apiProfile.address || null,
          support_email: apiProfile.support_email,
          mobile: apiProfile.mobile || null,
          logo: apiProfile.logo || null,
          logo_full_path:
            apiProfile.logo && LOGO_BASE_URL
              ? `${LOGO_BASE_URL}${apiProfile.logo}`
              : null,
          gst: apiProfile.gst || null,
          facebook: apiProfile.facebook || null,
          instagram: apiProfile.instagram || null,
          linkedin: apiProfile.linkedin || null,
          youtube: apiProfile.youtube || null,
          twitter: apiProfile.twitter || null,
          logo_for_meta: apiProfile.logo_for_meta || null,
          icon_full_path: apiProfile.icon_full_path,
          // meta_icon_full_path:
          //   apiProfile.logo_for_meta && LOGO_BASE_URL
          //     ? `${LOGO_BASE_URL}${apiProfile.logo_for_meta}`
          //     : null,
          meta_icon_full_path: apiProfile.meta_icon_full_path,
          notification_email: apiProfile.notification_email,
        };
        setCurrentProfileUI(uiProfile);

        const formValuesToReset: CompanyProfileFormData = {
          name: uiProfile.name || "",
          address: uiProfile.address || "",
          support_email: uiProfile.support_email || "",
          mobile: uiProfile.mobile || "",
          logo: null, // logo is a File; can't set it from a string
          gst: uiProfile.gst || "",
          facebook: uiProfile.facebook || "",
          instagram: uiProfile.instagram || "",
          linkedin: uiProfile.linkedin || "",
          youtube: uiProfile.youtube || "",
          twitter: uiProfile.twitter || "",
          logo_for_meta: null,
          notification_email: uiProfile.notification_email || "",
        };

        formMethods.reset(formValuesToReset);

        setIsLoadingInitial(false);
      } else {
        // masterLoadingStatus === 'succeeded' but no effectiveApiProfile found
        setIsLoadingInitial(false);
        formMethods.reset({
          // Reset to empty if no profile
          name: "",
          address: "",
          support_email: "",
          mobile: "",
          logo: null,
          gst: "",
          facebook: "",
          instagram: "",
          linkedin: "",
          youtube: "",
          twitter: "",
          logo_for_meta: null,
          notification_email: "",
        });
        setCurrentProfileUI(null);
        if (
          masterLoadingStatus === "succeeded" &&
          actualProfileData !== undefined
        ) {
          toast.push(
            <Notification title="Info" type="info">
              No company profile data found.
            </Notification>
          );
        }
      }
    } else if (masterLoadingStatus === "idle") {
      setIsLoadingInitial(true);
      console.log("[CompanyProfile] Profile status is LOADING.");
    } else if (masterLoadingStatus === "failed") {
      setIsLoadingInitial(false);
      console.error("[CompanyProfile] Failed to load profile.");
      toast.push(
        <Notification title="Error" type="danger">
          Could not load company profile data.
        </Notification>
      );
    } else if (
      masterLoadingStatus !== "idle" &&
      !actualProfileData &&
      masterLoadingStatus !== "idle"
    ) {
      setIsLoadingInitial(false);
      console.warn(
        "[CompanyProfile] Profile status is ",
        masterLoadingStatus,
        " but no data from selector."
      );
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
    formData.append("_method", "PUT");

    (Object.keys(data) as Array<keyof CompanyProfileFormData>).forEach(
      (key) => {
        const value = data[key];
        if (key === "logo" || key === "logo_for_meta") {
          if (value instanceof File) formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          // Send empty strings if they are actual values
          formData.append(key, String(value));
        }
        // If backend expects nulls as empty strings, or explicit nulls, adjust here.
        // Current logic: send non-null/undefined values. Empty string is sent as empty string.
        // If a field should be "cleared" to null, ensure form submits empty string and backend handles it.
      }
    );

    console.log(
      "[CompanyProfile] Submitting FormData:",
      Object.fromEntries(formData.entries())
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

      if (data.logo instanceof File && logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl); // Clean up old preview if new file was part of submission
        setLogoPreviewUrl(null);
      }
      if (data.logo_for_meta instanceof File && metaLogoPreviewUrl) {
        URL.revokeObjectURL(metaLogoPreviewUrl);
        setMetaLogoPreviewUrl(null);
      }
      // Re-fetch is good, formMethods.reset() will be triggered by the useEffect watching Redux state
      dispatch(getCompanyProfileAction());
    } catch (error: any) {
      alert("Error updating profile: " + error);
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

  if (isLoadingInitial && masterLoadingStatus === "idle") {
    return (
      <Container className="h-full flex justify-center items-center">
        <TbLoader className="animate-spin text-4xl text-gray-500" />
        <p className="ml-2">Loading Company Profile...</p>
      </Container>
    );
  }

  if (
    !currentProfileUI &&
    !isLoadingInitial &&
    masterLoadingStatus === "succeeded" &&
    (actualProfileData === null ||
      (Array.isArray(actualProfileData) && actualProfileData.length === 0))
  ) {
    return (
      <Container className="h-full flex justify-center items-center">
        <p className="text-center">
          No company profile data found. You may need to create one.
        </p>
      </Container>
    );
  }

  if (
    !currentProfileUI &&
    !isLoadingInitial &&
    masterLoadingStatus !== "idle"
  ) {
    // Catch other failure/empty states
    return (
      <Container className="h-full flex justify-center items-center">
        <p className="text-red-500">
          Company profile data could not be loaded. Please check console.
        </p>
      </Container>
    );
  }

  // --- Render Functions for Form Sections ---
  const renderLogoFields = () => (
    // <Card
    //   className=""
    //   header={
    //     <div className="flex items-center gap-2">
    //       <TbPhoto />
    //       <span>Logos</span>
    //     </div>
    //   }
    // >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-0">
      <FormItem
        label="Company Logo"
        className=""
        invalid={!!formMethods.formState.errors.logo}
        errorMessage={formMethods.formState.errors.logo?.message as string}
      >
        <div className="flex gap-2 items-end">
          {logoPreviewUrl ? (
            <img
              src={logoPreviewUrl}
              alt="New Logo Preview"
              className="mt-2 max-h-20 h-auto object-contain border rounded p-1"
            />
          ) : (
            currentProfileUI?.icon_full_path && (
              <img
                src={currentProfileUI.icon_full_path}
                alt="Current Logo"
                className="mt-2 max-h-20 h-auto object-contain border rounded p-1"
              />
            )
          )}
          <Controller
            name="logo"
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
        invalid={!!formMethods.formState.errors.logo_for_meta}
        errorMessage={
          formMethods.formState.errors.logo_for_meta?.message as string
        }
      >
        <div className="flex gap-2 items-end ">
          {metaLogoPreviewUrl ? (
            <img
              src={metaLogoPreviewUrl}
              alt="New Logo Preview"
              className="mt-2 max-h-20 h-auto object-contain border rounded p-1"
            />
          ) : (
            currentProfileUI?.meta_icon_full_path && (
              <img
                src={currentProfileUI?.meta_icon_full_path}
                alt="Current Meta Logo"
                className="mt-2 max-h-20 h-auto object-contain border rounded p-1"
              />
            )
          )}
          <Controller
            name="logo_for_meta"
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
    // </Card>
  );

  const renderCompanyInfoFields = () => (
    // <Card
    //   className="mb-6"
    //   header={
    //     <div className="flex items-center gap-2">
    //       <TbBuildingSkyscraper />
    //       <span>Company Information</span>
    //     </div>
    //   }
    // >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-0">
      <FormItem
        label="Company Name"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.name}
        errorMessage={formMethods.formState.errors.name?.message}
      >
        <Controller
          name="name"
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
              rows={3}
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
    // </Card>
  );

  const renderSocialMediaFields = () => (
    // <Card
    //   className="mb-6"
    //   header={
    //     <div className="flex items-center gap-2">
    //       <TbLink />
    //       <span>Social Media Links</span>
    //     </div>
    //   }
    // >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-0">
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
    // </Card>
  );

  const isButtonDisabled =
    (!formMethods.formState.isDirty &&
      !logoPreviewUrl &&
      !metaLogoPreviewUrl) ||
    !formMethods.formState.isValid ||
    isSubmitting ||
    (masterLoadingStatus === "idle" && !isSubmitting);

  // For debugging button state:
  // useEffect(() => {
  //     console.log('Button Disabled Check:', {
  //         isDirty: formMethods.formState.isDirty,
  //         isDirtyFields: formMethods.formState.dirtyFields, // which fields are dirty
  //         defaultValues: formMethods.formState.defaultValues,
  //         currentValues: formMethods.getValues(),
  //         logoPreviewUrl: !!logoPreviewUrl,
  //         metaLogoPreviewUrl: !!metaLogoPreviewUrl,
  //         isValid: formMethods.formState.isValid,
  //         errors: formMethods.formState.errors,
  //         isSubmitting,
  //         masterLoadingStatus,
  //         calculatedDisabled: isButtonDisabled,
  //     });
  // }, [formMethods.formState, logoPreviewUrl, metaLogoPreviewUrl, isSubmitting, masterLoadingStatus, isButtonDisabled, formMethods]);

  return (
    <>
      <Container className="h-auto">
        <Form
          id="companyProfileForm"
          onSubmit={formMethods.handleSubmit(onUpdateProfile)}
        >
          <AdaptiveCard className="h-full" bodyClass="p-0 md:p-0">
            <div className="p-4 pt-2 md:p-6 md:pt-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">
                Company Profile Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage company branding, contact, and integration settings.
              </p>
            </div>

            <div
              className="p-4 md:p-6 space-y-6 overflow-y-auto"
              style={{
                maxHeight: "calc(100vh - 200px)" /* Adjust as needed */,
              }}
            >
              {renderLogoFields()}
              {renderCompanyInfoFields()}
              {renderSocialMediaFields()}
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
          disabled={isButtonDisabled}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </StickyFooter>
    </>
  );
};

export default CompanyProfile;
