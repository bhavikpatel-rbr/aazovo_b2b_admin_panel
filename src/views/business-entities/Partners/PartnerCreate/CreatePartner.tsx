import classNames from "classnames";
import isEmpty from "lodash/isEmpty";
import { useEffect, useState, useMemo } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormReturn,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { NavLink, useLocation, useParams, useNavigate } from "react-router-dom";

// UI Components
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import NumericInput from "@/components/shared/NumericInput";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import { Form, FormItem } from "@/components/ui/Form";
import Input from "@/components/ui/Input";
import Notification from "@/components/ui/Notification";
import Select from "@/components/ui/Select";
import toast from "@/components/ui/toast";

// Icons & Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addcompanyAction,
  editCompanyAction,
  getContinentsAction,
  getCountriesAction,
  getCompanyByIdAction,
  getBrandAction,
  getCategoriesAction,
  getMembersAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import axiosInstance from "@/services/api/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { BiChevronRight } from "react-icons/bi";
import { TbPlus, TbTrash } from "react-icons/tb";
import { useSelector } from "react-redux";
import { z } from "zod";

// --- Type Definitions ---

interface MemberItem {
  member?: string | { label: string; value: string };
  designation?: string;
  person_name?: string;
  contact_number?: string;
  type?: string;
  team_name?: string;
}

interface SpotVerificationItemFE {
  is_verified?: boolean;
  verified_by_name?: string;
  photo_upload?: File | string;
  remarks?: string;
}

interface CompanyBankDetailItemFE {
  bank_account_number?: string;
  bank_name?: string | { label: string; value: string };
  ifsc_code?: string;
  bank_verification_photo?: File | string;
  type?: string | { label: string; value: string };
}

interface CertificateItemFE {
  certificate_id?: string;
  certificate_name?: string;
  upload_certificate?: File | string;
}

interface BranchItemFE {
  office_type?: string | { label: string; value: string };
  branch_name?: string;
  branch_address?: string;
  location_country?: string | { label: string; value: string };
  branch_state?: string | { label: string; value: string };
  branch_zip_code?: string;
  branch_gst_reg_number?: string;
}

interface BillingDocItemFE {
  document_name?: string;
  document_file?: File | string;
}

interface ReferenceItemFE {
  person_name?: string;
  company_name?: string;
  contact_number?: string;
  remark?: string;
}

export interface CompanyFormSchema {
  id?: string | number;
  company_profile_settings_id?: any;

  name?: string;
  company_primary_contact_number?: string;
  primary_contact_country_code?: { label: string; value: string };
  alternate_contact_number?: string;
  alternate_contact_country_code?: { label: string; value: string };
  company_primary_email_id?: string;
  alternate_email_id?: string;
  ownership_type?: string | { label: string; value: string };
  owner_director_proprietor_name?: string;
  company_address?: string;
  city?: string | { label: string; value: string };
  state?: string | { label: string; value: string };
  zip_postal_code?: string;
  country?: string | { label: string; value: string };
  continent_name?: string | { label: string; value: string };
  gst_number?: string;
  pan_number?: string;
  trn_number?: string;
  tan_number?: string;
  company_establishment_year?: string;
  no_of_employees?: number | string;
  company_website?: string;
  company_logo_brochure?: File | string;
  primary_business_type?: string | { label: string; value: string };
  primary_business_category?: string;
  sub_category?: Array<{ label: string; value: string }>;
  interested_in?: { label: string; value: string };

  company_certificates?: CertificateItemFE[];
  company_branches?: BranchItemFE[];

  declaration_206ab?: File | string;
  declaration_206ab_remark?: string;
  declaration_206ab_remark_enabled?: boolean;
  declaration_194q?: File | string;
  declaration_194q_remark?: string;
  declaration_194q_remark_enabled?: boolean;
  office_photo?: File | string;
  office_photo_remark?: string;
  office_photo_remark_enabled?: boolean;
  gst_certificate?: File | string;
  gst_certificate_remark?: string;
  gst_certificate_remark_enabled?: boolean;
  authority_letter?: File | string;
  authority_letter_remark?: string;
  authority_letter_remark_enabled?: boolean;
  visiting_card?: File | string;
  visiting_card_remark?: string;
  visiting_card_remark_enabled?: boolean;
  cancel_cheque?: File | string;
  cancel_cheque_remark?: string;
  cancel_cheque_remark_enabled?: boolean;
  aadhar_card?: File | string;
  aadhar_card_remark?: string;
  aadhar_card_remark_enabled?: boolean;
  pan_card?: File | string;
  pan_card_remark?: string;
  pan_card_remark_enabled?: boolean;
  other_document?: File | string;
  other_document_remark?: string;
  other_document_remark_enabled?: boolean;

  primary_account_number?: string;
  primary_bank_name?: string | { label: string; value: string };
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: File | string;
  secondary_account_number?: string;
  secondary_bank_name?: string | { label: string; value: string };
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo?: File | string;
  additional_bank_details?: CompanyBankDetailItemFE[];

  KYC_FIELD?: boolean;
  BILLING_FIELD?: boolean;
  billing_documents?: BillingDocItemFE[];
  DOMAIN_MANAGEMENT_FIELD?: Array<{ label: string; value: string }>;

  members?: MemberItem[];

  status?: string | { label: string; value: string };
  company_code?: string;
  brands?: Array<{ label: string; value: string }>;
  category?: Array<{ label: string; value: string }>;
  support_email?: string;
  mobile?: string;
  company_type?: string | { label: string; value: string };

  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;

  notification_email?: string;
  company_spot_verification_data?: SpotVerificationItemFE[];
  references?: ReferenceItemFE[];
}

export interface FormSectionBaseProps {
  control: Control<CompanyFormSchema>;
  errors: FieldErrors<CompanyFormSchema>;
  formMethods: UseFormReturn<CompanyFormSchema>;
}

interface ApiSingleCompanyItem {
  id: number;
  name?: string;
  company_profile_settings_id?: any;
  status?: string;
  company_code?: string;
  company_primary_contact_number?: string;
  primary_contact_country_code?: string;
  alternate_contact_number?: string;
  alternate_contact_country_code?: string;
  company_primary_email_id?: string;
  alternate_email_id?: string;
  ownership_type?: string;
  owner_director_proprietor_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_postal_code?: string;
  country?: string;
  continent_name?: string;
  brands?: string;
  category?: string;
  sub_category?: string;
  interested_in?: string;
  kyc_verification?: boolean | "Yes" | "No";
  billing_enabled?: boolean | "Yes" | "No";
  billing_documents?: any[];
  domain_id?: string;
  primary_bank_account_number?: string;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_bank_verification_photo_url?: string;
  secondary_bank_account_number?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo_url?: string;
  support_email?: string;
  mobile?: string;
  logo_url?: string;
  gst?: string;
  pan_number?: string;
  tan_number?: string;
  company_type?: string;
  trn_number?: string;
  company_establishment_year?: string;
  no_of_employees?: number;
  company_website?: string;
  primary_business_type?: string;
  primary_business_category?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  notification_email?: string;

  declaration_206AB_url?: string;
  declaration_206AB_verify?: boolean | string;
  declaration_206AB_remark?: string;
  declaration_194Q_url?: string;
  declaration_194Q_verify?: boolean | string;
  declaration_194Q_remark?: string;
  office_photo_url?: string;
  office_photo_verify?: boolean | string;
  office_photo_remark?: string;
  gst_certificate_url?: string;
  gst_certificate_verify?: boolean | string;
  gst_certificate_remark?: string;
  authority_letter_url?: string;
  authority_letter_verify?: boolean | string;
  authority_letter_remark?: string;
  visiting_card_url?: string;
  visiting_card_verify?: boolean | string;
  visiting_card_remark?: string;
  cancel_cheque_url?: string;
  cancel_cheque_verify?: boolean | string;
  cancel_cheque_remark?: string;
  aadhar_card_url?: string;
  aadhar_card_verify?: boolean | string;
  aadhar_card_remark?: string;
  pan_card_url?: string;
  pan_card_verify?: boolean | string;
  pan_card_remark?: string;
  other_document_url?: string;
  other_document_verify?: boolean | string;
  other_document_remark?: string;

  company_spot_verification?: any[];
  company_members?: any[];
  company_bank_details?: any[];
  company_branches?: any[];
  company_certificate?: any[];
  company_references?: any[];
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (
  apiData: ApiSingleCompanyItem
): Partial<CompanyFormSchema> => {
  const kycVerifyToBoolean = (verifyValue?: boolean | string): boolean => {
    if (typeof verifyValue === "string") {
      return (
        verifyValue.toLowerCase() === "yes" ||
        verifyValue === "1" ||
        verifyValue.toLowerCase() === "true" ||
        verifyValue.toLowerCase() === "test"
      );
    }
    return !!verifyValue;
  };
  const stringToSelectArray = (
    str?: string
  ): Array<{ label: string; value: string }> => {
    if (!str) return [];
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ label: s, value: s }));
  };
  return {
    id: apiData.id,
    name: apiData.name,
    company_primary_contact_number: apiData.company_primary_contact_number,
    primary_contact_country_code: apiData.primary_contact_country_code
      ? {
        label: apiData.primary_contact_country_code,
        value: apiData.primary_contact_country_code,
      }
      : undefined,
    alternate_contact_number: apiData.alternate_contact_number,
    alternate_contact_country_code: apiData.alternate_contact_country_code
      ? {
        label: apiData.alternate_contact_country_code,
        value: apiData.alternate_contact_country_code,
      }
      : undefined,
    company_primary_email_id: apiData.company_primary_email_id,
    alternate_email_id: apiData.alternate_email_id,
    ownership_type: apiData.ownership_type
      ? { label: apiData.ownership_type, value: apiData.ownership_type }
      : undefined,
    owner_director_proprietor_name: apiData.owner_director_proprietor_name,
    company_address: apiData.address,
    city: apiData.city
      ? { label: apiData.city, value: apiData.city }
      : undefined,
    state: apiData.state
      ? { label: apiData.state, value: apiData.state }
      : undefined,
    zip_postal_code: apiData.zip_postal_code,
    country: apiData.country
      ? { label: apiData.country, value: apiData.country }
      : undefined,
    continent_name: apiData.continent_name
      ? { label: apiData.continent_name, value: apiData.continent_name }
      : undefined,
    gst_number: apiData.gst,
    pan_number: apiData.pan_number,
    trn_number: apiData.trn_number,
    tan_number: apiData.tan_number,
    company_establishment_year: apiData.company_establishment_year,
    no_of_employees: apiData.no_of_employees,
    company_website: apiData.company_website,
    company_logo_brochure: apiData.logo_url,
    primary_business_type: apiData.primary_business_type
      ? {
        label: apiData.primary_business_type,
        value: apiData.primary_business_type,
      }
      : undefined,
    primary_business_category: apiData.primary_business_category,
    sub_category: stringToSelectArray(apiData.sub_category),
    interested_in: apiData.interested_in
      ? { label: apiData.interested_in, value: apiData.interested_in }
      : undefined,
    company_certificates: apiData.company_certificate?.map((c) => ({
      certificate_id: c.id,
      certificate_name: c.certificate_name,
      upload_certificate: c.upload_certificate_url || c.upload_certificate,
    })),
    company_branches: apiData.company_branches?.map((b) => ({
      office_type: b.office_type
        ? { label: b.office_type, value: b.office_type }
        : undefined,
      branch_name: b.branch_name,
      branch_address: b.branch_address,
      location_country: b.location_country
        ? { label: b.location_country, value: b.location_country }
        : undefined,
      branch_state: b.branch_state
        ? { label: b.branch_state, value: b.branch_state }
        : undefined,
      branch_zip_code: b.branch_zip_code,
      branch_gst_reg_number: b.branch_gst_reg_number,
    })),
    declaration_206ab: apiData.declaration_206AB_url,
    declaration_206ab_remark_enabled: kycVerifyToBoolean(
      apiData.declaration_206AB_verify
    ),
    declaration_206ab_remark: apiData.declaration_206AB_remark,
    declaration_194q: apiData.declaration_194Q_url,
    declaration_194q_remark_enabled: kycVerifyToBoolean(
      apiData.declaration_194Q_verify
    ),
    declaration_194q_remark: apiData.declaration_194Q_remark,
    office_photo: apiData.office_photo_url,
    office_photo_remark_enabled: kycVerifyToBoolean(
      apiData.office_photo_verify
    ),
    office_photo_remark: apiData.office_photo_remark,
    gst_certificate: apiData.gst_certificate_url,
    gst_certificate_remark_enabled: kycVerifyToBoolean(
      apiData.gst_certificate_verify
    ),
    gst_certificate_remark: apiData.gst_certificate_remark,
    authority_letter: apiData.authority_letter_url,
    authority_letter_remark_enabled: kycVerifyToBoolean(
      apiData.authority_letter_verify
    ),
    authority_letter_remark: apiData.authority_letter_remark,
    visiting_card: apiData.visiting_card_url,
    visiting_card_remark_enabled: kycVerifyToBoolean(
      apiData.visiting_card_verify
    ),
    visiting_card_remark: apiData.visiting_card_remark,
    cancel_cheque: apiData.cancel_cheque_url,
    cancel_cheque_remark_enabled: kycVerifyToBoolean(
      apiData.cancel_cheque_verify
    ),
    cancel_cheque_remark: apiData.cancel_cheque_remark,
    aadhar_card: apiData.aadhar_card_url,
    aadhar_card_remark_enabled: kycVerifyToBoolean(apiData.aadhar_card_verify),
    aadhar_card_remark: apiData.aadhar_card_remark,
    pan_card: apiData.pan_card_url,
    pan_card_remark_enabled: kycVerifyToBoolean(apiData.pan_card_verify),
    pan_card_remark: apiData.pan_card_remark,
    other_document: apiData.other_document_url,
    other_document_remark_enabled: kycVerifyToBoolean(
      apiData.other_document_verify
    ),
    other_document_remark: apiData.other_document_remark,
    primary_account_number: apiData.primary_bank_account_number,
    primary_bank_name: apiData.primary_bank_name
      ? { label: apiData.primary_bank_name, value: apiData.primary_bank_name }
      : undefined,
    primary_ifsc_code: apiData.primary_ifsc_code,
    primary_bank_verification_photo:
      apiData.primary_bank_verification_photo_url,
    secondary_account_number: apiData.secondary_bank_account_number,
    secondary_bank_name: apiData.secondary_bank_name
      ? {
        label: apiData.secondary_bank_name,
        value: apiData.secondary_bank_name,
      }
      : undefined,
    secondary_ifsc_code: apiData.secondary_ifsc_code,
    secondary_bank_verification_photo:
      apiData.secondary_bank_verification_photo_url,
    additional_bank_details: apiData.company_bank_details?.map((b) => ({
      bank_account_number: b.bank_account_number,
      bank_name: b.bank_name
        ? { label: String(b.bank_name), value: String(b.bank_name) }
        : undefined,
      ifsc_code: b.ifsc_code,
      type: b.type
        ? { label: String(b.type), value: String(b.type) }
        : undefined,
      bank_verification_photo:
        b.primary_bank_verification_photo_url || b.bank_verification_photo,
    })),
    KYC_FIELD: kycVerifyToBoolean(apiData.kyc_verification),
    BILLING_FIELD: kycVerifyToBoolean(apiData.billing_enabled),
    billing_documents: apiData.billing_documents?.map((doc) => ({
      document_name: doc.document_name,
      document_file: doc.document_url,
    })),
    DOMAIN_MANAGEMENT_FIELD: stringToSelectArray(apiData.domain_id),
    members: apiData.company_members?.map((m) => ({
      member: m.member_id
        ? { label: `Member ${m.member_id}`, value: String(m.member_id) }
        : undefined,
      designation: m.designation,
      person_name: m.name,
      team_name: m.team_name,
      contact_number: m.mobile,
    })),
    status: apiData.status
      ? { label: apiData.status, value: apiData.status }
      : undefined,
    company_code: apiData.company_code,
    brands: stringToSelectArray(apiData.brands),
    category: stringToSelectArray(apiData.category),
    support_email: apiData.support_email,
    mobile: apiData.mobile,
    company_type: apiData.company_type
      ? { label: apiData.company_type, value: apiData.company_type }
      : undefined,
    facebook: apiData.facebook,
    instagram: apiData.instagram,
    linkedin: apiData.linkedin,
    youtube: apiData.youtube,
    twitter: apiData.twitter,
    notification_email: apiData.notification_email,
    company_spot_verification_data: apiData.company_spot_verification?.map(
      (item) => ({
        is_verified: kycVerifyToBoolean(item.is_verified),
        verified_by_name: item.verified_by_name,
        remarks: item.remarks,
        photo_upload: (item as any).photo_upload_url || item.photo_upload,
      })
    ),
    references: apiData.company_references?.map((ref) => ({
      person_name: ref.person_name,
      company_name: ref.company_name,
      contact_number: ref.contact_number,
      remark: ref.remark,
    })),
  };
};

// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (
  formData: CompanyFormSchema,
  isEditMode: boolean,
  originalData?: Partial<CompanyFormSchema>
): FormData => {
  const apiPayload = new FormData();
  let dataToProcess: any = { ...formData };
  if (dataToProcess.id && isEditMode) {
    apiPayload.append("id", String(dataToProcess.id));
  }
  const appendField = (
    backendKey: string,
    formValue: any,
    isFileKey = false
  ) => {
    if (formValue instanceof File) {
      apiPayload.append(backendKey, formValue);
    } else if (
      Array.isArray(formValue) &&
      formValue.every((item) => item instanceof File)
    ) {
      formValue.forEach((file) => apiPayload.append(`${backendKey}[]`, file));
    } else if (
      typeof formValue === "object" &&
      formValue !== null &&
      "value" in formValue
    ) {
      const val = formValue.value;
      apiPayload.append(
        backendKey,
        val !== null && val !== undefined ? String(val) : ""
      );
    } else if (typeof formValue === "boolean") {
      apiPayload.append(backendKey, formValue ? "1" : "0");
    } else if (Array.isArray(formValue)) {
      const values = formValue.map((item) => item.value).join(",");
      apiPayload.append(backendKey, values);
    } else if (formValue !== undefined && formValue !== null) {
      apiPayload.append(backendKey, String(formValue));
    } else if (!isFileKey) {
      apiPayload.append(backendKey, "");
    }
  };
  appendField("name", dataToProcess.name);
  appendField("address", dataToProcess.company_address);
  appendField("support_email", dataToProcess.support_email);
  appendField("status", dataToProcess.status);
  appendField("company_code", dataToProcess.company_code);
  appendField("country", dataToProcess.country);
  appendField("brands", dataToProcess.brands);
  appendField("category", dataToProcess.category);
  appendField("sub_category", dataToProcess.sub_category);
  appendField("interested_in", dataToProcess.interested_in);
  appendField(
    "company_primary_contact_number",
    dataToProcess.company_primary_contact_number
  );
  appendField(
    "primary_contact_country_code",
    dataToProcess.primary_contact_country_code
  );
  appendField(
    "alternate_contact_number",
    dataToProcess.alternate_contact_number
  );
  appendField(
    "alternate_contact_country_code",
    dataToProcess.alternate_contact_country_code
  );
  appendField(
    "company_primary_email_id",
    dataToProcess.company_primary_email_id
  );
  appendField("alternate_email_id", dataToProcess.alternate_email_id);
  appendField("ownership_type", dataToProcess.ownership_type);
  appendField(
    "owner_director_proprietor_name",
    dataToProcess.owner_director_proprietor_name
  );
  appendField("city", dataToProcess.city);
  appendField("state", dataToProcess.state);
  appendField("zip_postal_code", dataToProcess.zip_postal_code);
  appendField("continent_name", dataToProcess.continent_name);
  appendField("pan_number", dataToProcess.pan_number);
  appendField("tan_number", dataToProcess.tan_number);
  appendField("trn_number", dataToProcess.trn_number);
  appendField(
    "company_establishment_year",
    dataToProcess.company_establishment_year
  );
  appendField("no_of_employees", dataToProcess.no_of_employees);
  appendField("company_website", dataToProcess.company_website);
  appendField("primary_business_type", dataToProcess.primary_business_type);
  appendField(
    "primary_business_category",
    dataToProcess.primary_business_category
  );
  appendField("company_type", dataToProcess.company_type);
  appendField("notification_email", dataToProcess.notification_email);
  appendField("facebook", dataToProcess.facebook);
  appendField("instagram", dataToProcess.instagram);
  appendField("linkedin", dataToProcess.linkedin);
  appendField("youtube", dataToProcess.youtube);
  appendField("twitter", dataToProcess.twitter);
  appendField("kyc_verification", dataToProcess.KYC_FIELD);
  appendField("billing_enabled", dataToProcess.BILLING_FIELD);
  appendField("domain_id", dataToProcess.DOMAIN_MANAGEMENT_FIELD);
  appendField(
    "company_profile_settings_id",
    dataToProcess.company_profile_settings_id
  );
  appendField("logo", dataToProcess.company_logo_brochure, true);
  if (
    dataToProcess.billing_documents &&
    Array.isArray(dataToProcess.billing_documents)
  ) {
    dataToProcess.billing_documents.forEach((doc: BillingDocItemFE) => {
      apiPayload.append(
        "billing_documents[document_name][]",
        doc.document_name || ""
      );
      if (doc.document_file instanceof File) {
        apiPayload.append(
          "billing_documents[document_file][]",
          doc.document_file
        );
      }
    });
  }
  const allBankDetailsForApi: Array<{
    bank_account_number: string;
    bank_name: string;
    ifsc_code: string;
    type: string;
    photo_to_upload?: File | string;
  }> = [];
  if (dataToProcess.primary_account_number || dataToProcess.primary_bank_name) {
    allBankDetailsForApi.push({
      bank_account_number: dataToProcess.primary_account_number || "",
      bank_name:
        (typeof dataToProcess.primary_bank_name === "object"
          ? dataToProcess.primary_bank_name?.value
          : dataToProcess.primary_bank_name) || "",
      ifsc_code: dataToProcess.primary_ifsc_code || "",
      photo_to_upload: dataToProcess.primary_bank_verification_photo,
      type: "Primary",
    });
  }
  if (
    dataToProcess.secondary_account_number ||
    dataToProcess.secondary_bank_name
  ) {
    allBankDetailsForApi.push({
      bank_account_number: dataToProcess.secondary_account_number || "",
      bank_name:
        (typeof dataToProcess.secondary_bank_name === "object"
          ? dataToProcess.secondary_bank_name?.value
          : dataToProcess.secondary_bank_name) || "",
      ifsc_code: dataToProcess.secondary_ifsc_code || "",
      photo_to_upload: dataToProcess.secondary_bank_verification_photo,
      type: "Secondary",
    });
  }
  if (
    dataToProcess.additional_bank_details &&
    Array.isArray(dataToProcess.additional_bank_details)
  ) {
    dataToProcess.additional_bank_details.forEach(
      (bank: CompanyBankDetailItemFE) => {
        if (bank.bank_account_number || bank.bank_name) {
          allBankDetailsForApi.push({
            bank_account_number: bank.bank_account_number || "",
            bank_name:
              (typeof bank.bank_name === "object"
                ? bank.bank_name?.value
                : bank.bank_name) || "",
            ifsc_code: bank.ifsc_code || "",
            photo_to_upload: bank.bank_verification_photo,
            type:
              (typeof bank.type === "object" ? bank.type?.value : bank.type) ||
              "Other",
          });
        }
      }
    );
  }
  if (allBankDetailsForApi.length > 0) {
    allBankDetailsForApi.forEach((bank) => {
      apiPayload.append(
        `company_bank_details[bank_account_number][]`,
        bank.bank_account_number
      );
      apiPayload.append(`company_bank_details[bank_name][]`, bank.bank_name);
      apiPayload.append(`company_bank_details[ifsc_code][]`, bank.ifsc_code);
      apiPayload.append(`company_bank_details[type][]`, bank.type);
      if (bank.photo_to_upload instanceof File) {
        apiPayload.append(
          `company_bank_details[primary_bank_verification_photo][]`,
          bank.photo_to_upload
        );
      }
    });
  } else {
    apiPayload.append(`company_bank_details[bank_account_number][]`, "");
    apiPayload.append(`company_bank_details[bank_name][]`, "");
    apiPayload.append(`company_bank_details[ifsc_code][]`, "");
    apiPayload.append(`company_bank_details[type][]`, "");
  }
  if (
    dataToProcess.company_branches &&
    Array.isArray(dataToProcess.company_branches) &&
    dataToProcess.company_branches.length > 0
  ) {
    dataToProcess.company_branches.forEach((branch: BranchItemFE) => {
      const officeTypeVal =
        typeof branch.office_type === "object" && branch.office_type?.value
          ? branch.office_type.value
          : branch.office_type;
      const countryVal =
        typeof branch.location_country === "object" &&
          branch.location_country?.value
          ? branch.location_country.value
          : branch.location_country;
      const stateVal =
        typeof branch.branch_state === "object" && branch.branch_state?.value
          ? branch.branch_state.value
          : branch.branch_state;
      apiPayload.append(
        `company_branches[office_type][]`,
        officeTypeVal ? String(officeTypeVal) : ""
      );
      apiPayload.append(
        `company_branches[branch_name][]`,
        branch.branch_name || ""
      );
      apiPayload.append(
        `company_branches[location_country][]`,
        countryVal ? String(countryVal) : ""
      );
      apiPayload.append(
        `company_branches[branch_state][]`,
        stateVal ? String(stateVal) : ""
      );
      apiPayload.append(
        `company_branches[branch_zip_code][]`,
        branch.branch_zip_code || ""
      );
      apiPayload.append(
        `company_branches[branch_address][]`,
        branch.branch_address || ""
      );
      apiPayload.append(
        `company_branches[branch_gst_reg_number][]`,
        branch.branch_gst_reg_number || ""
      );
    });
  }
  if (
    dataToProcess.company_certificates &&
    Array.isArray(dataToProcess.company_certificates) &&
    dataToProcess.company_certificates.length > 0
  ) {
    dataToProcess.company_certificates.forEach((cert: CertificateItemFE) => {
      apiPayload.append(`company_certificate[id][]`, cert.certificate_id || "");
      apiPayload.append(
        `company_certificate[certificate_name][]`,
        cert.certificate_name || ""
      );
      if (cert.upload_certificate instanceof File) {
        apiPayload.append(
          `company_certificate[upload_certificate][]`,
          cert.upload_certificate
        );
      }
    });
  }
  if (
    dataToProcess.company_spot_verification_data &&
    Array.isArray(dataToProcess.company_spot_verification_data) &&
    dataToProcess.company_spot_verification_data.length > 0
  ) {
    dataToProcess.company_spot_verification_data.forEach(
      (item: SpotVerificationItemFE) => {
        apiPayload.append(
          `company_spot_verification[is_verified][]`,
          item.is_verified ? "1" : "0"
        );
        apiPayload.append(
          `company_spot_verification[verified_by_name][]`,
          item.verified_by_name || ""
        );
        apiPayload.append(
          `company_spot_verification[remarks][]`,
          item.remarks || ""
        );
        if (item.photo_upload instanceof File) {
          apiPayload.append(
            `company_spot_verification[photo_upload][]`,
            item.photo_upload
          );
        }
      }
    );
  }
  if (
    dataToProcess.references &&
    Array.isArray(dataToProcess.references) &&
    dataToProcess.references.length > 0
  ) {
    dataToProcess.references.forEach((ref: ReferenceItemFE) => {
      apiPayload.append(
        `company_references[person_name][]`,
        ref.person_name || ""
      );
      apiPayload.append(
        `company_references[company_name][]`,
        ref.company_name || ""
      );
      apiPayload.append(
        `company_references[contact_number][]`,
        ref.contact_number || ""
      );
      apiPayload.append(`company_references[remark][]`, ref.remark || "");
    });
  }
  const kycDocsConfig = [
    {
      feFile: "declaration_206ab",
      beFile: "declaration_206AB",
      feVerify: "declaration_206ab_remark_enabled",
      beVerify: "declaration_206AB_verify",
      feRemark: "declaration_206ab_remark",
      beRemark: "declaration_206AB_remark",
    },
    {
      feFile: "declaration_194q",
      beFile: "declaration_194Q",
      feVerify: "declaration_194q_remark_enabled",
      beVerify: "declaration_194Q_verify",
      feRemark: "declaration_194q_remark",
      beRemark: "declaration_194Q_remark",
    },
    {
      feFile: "office_photo",
      beFile: "office_photo",
      feVerify: "office_photo_remark_enabled",
      beVerify: "office_photo_verify",
      feRemark: "office_photo_remark",
      beRemark: "office_photo_remark",
    },
    {
      feFile: "gst_certificate",
      beFile: "gst_certificate",
      feVerify: "gst_certificate_remark_enabled",
      beVerify: "gst_certificate_verify",
      feRemark: "gst_certificate_remark",
      beRemark: "gst_certificate_remark",
    },
    {
      feFile: "authority_letter",
      beFile: "authority_letter",
      feVerify: "authority_letter_remark_enabled",
      beVerify: "authority_letter_verify",
      feRemark: "authority_letter_remark",
      beRemark: "authority_letter_remark",
    },
    {
      feFile: "visiting_card",
      beFile: "visiting_card",
      feVerify: "visiting_card_remark_enabled",
      beVerify: "visiting_card_verify",
      feRemark: "visiting_card_remark",
      beRemark: "visiting_card_remark",
    },
    {
      feFile: "cancel_cheque",
      beFile: "cancel_cheque",
      feVerify: "cancel_cheque_remark_enabled",
      beVerify: "cancel_cheque_verify",
      feRemark: "cancel_cheque_remark",
      beRemark: "cancel_cheque_remark",
    },
    {
      feFile: "aadhar_card",
      beFile: "aadhar_card",
      feVerify: "aadhar_card_remark_enabled",
      beVerify: "aadhar_card_verify",
      feRemark: "aadhar_card_remark",
      beRemark: "aadhar_card_remark",
    },
    {
      feFile: "pan_card",
      beFile: "pan_card",
      feVerify: "pan_card_remark_enabled",
      beVerify: "pan_card_verify",
      feRemark: "pan_card_remark",
      beRemark: "pan_card_remark",
    },
    {
      feFile: "other_document",
      beFile: "other_document",
      feVerify: "other_document_remark_enabled",
      beVerify: "other_document_verify",
      feRemark: "other_document_remark",
      beRemark: "other_document_remark",
    },
  ];
  kycDocsConfig.forEach((doc) => {
    if (dataToProcess[doc.feFile] instanceof File) {
      apiPayload.append(doc.beFile, dataToProcess[doc.feFile]);
    }
    if (
      doc.beVerify === "declaration_206AB_verify" &&
      String(dataToProcess[doc.feRemark]).toLowerCase() === "test" &&
      dataToProcess[doc.feVerify]
    ) {
      apiPayload.append(doc.beVerify, "test");
    } else {
      apiPayload.append(doc.beVerify, dataToProcess[doc.feVerify] ? "1" : "");
    }
    const remarkValue = dataToProcess[doc.feRemark];
    apiPayload.append(
      doc.beRemark,
      remarkValue !== undefined && remarkValue !== null
        ? String(remarkValue)
        : ""
    );
  });
  if (
    dataToProcess.members &&
    Array.isArray(dataToProcess.members) &&
    dataToProcess.members.length > 0
  ) {
    dataToProcess.members.forEach((member: MemberItem) => {
      const memberId =
        typeof member.member === "object" && member.member?.value
          ? member.member.value
          : member.member;
      apiPayload.append(
        `company_members[member_id][]`,
        memberId ? String(memberId) : ""
      );
      apiPayload.append(
        `company_members[designation][]`,
        member.designation || ""
      );
      apiPayload.append(`company_members[name][]`, member.person_name || "");
      apiPayload.append(
        `company_members[mobile][]`,
        member.contact_number || ""
      );
    });
  }
  return apiPayload;
};

// --- Navigator Component ---
const companyNavigationList = [
  { label: "Partner Details", link: "companyDetails" },
  { label: "KYC Documents", link: "kycDocuments" },
  { label: "Bank Details", link: "bankDetails" },
  // { label: "Spot Verification", link: "spotVerification" },
  { label: "Reference", link: "reference" },
  { label: "Accessibility", link: "accessibility" },
  { label: "Team Management", link: "memberManagement" },
];
type NavigatorComponentProps = {
  activeSection: string;
  onNavigate: (sectionKey: string) => void;
};
const NavigatorComponent = (props: NavigatorComponentProps) => {
  const { activeSection, onNavigate } = props;
  return (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
      {" "}
      {companyNavigationList.map((nav) => (
        <button
          type="button"
          key={nav.link}
          className={classNames(
            "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max",
            "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
            {
              "bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold":
                activeSection === nav.link,
              "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200":
                activeSection !== nav.link,
            }
          )}
          onClick={() => onNavigate(nav.link)}
          title={nav.label}
        >
          {" "}
          <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">
            {nav.label}
          </span>{" "}
        </button>
      ))}{" "}
    </div>
  );
};

// --- CompanyDetails Section ---
const CompanyDetailsSection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const {
    CountriesData = [],
    ContinentsData = [],
    BrandData,
    CategoriesData,
  } = useSelector(masterSelector);
  const { watch } = formMethods;
  const countryOptions = CountriesData.map((value: any) => ({
    value: value.id,
    label: value.name,
  }));
  const countryCodeOptions = CountriesData.map((c: any) => ({
    value: `+${c.phonecode}`,
    label: `+${c.phonecode} (${c.iso2})`,
  }));
  const stateOptions = [
    { value: "MH", label: "Maharashtra" },
    { value: "CA", label: "California" },
  ];
  const cityOptions = [
    { value: "Mumbai", label: "Mumbai" },
    { value: "Los Angeles", label: "Los Angeles" },
  ];
  const continentOptions = ContinentsData.map((value: any) => ({
    value: value.id,
    label: value.name,
  }));
  const ownershipTypeOptions = [
    { value: "Sole Proprietorship", label: "Sole Proprietorship" },
    { value: "Partner", label: "Partner" },
    { value: "LLC", label: "LLC" },
    { value: "Corporate", label: "Corporate" }, 
    { value: "Others", label: "Others" }, 
  ];
  const primaryBusinessTypeOptions = [
    { value: "manufacturer", label: "Manufacturer" },
    { value: "service", label: "Service" },
  ];
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "disabled", label: "Disabled" },
    { value: "unregistered", label: "Unregistered" },
  ];
  const companyTypeOptions = [
    { value: "TypeA", label: "Type A" },
    { value: "TypeB", label: "Type B" },
  ];
  const interestedInOptions = [
    { value: "For Sell", label: "For Sell" },
    { value: "For Buy", label: "For Buy" },
    { value: "Both", label: "Both" },
  ];
  const officeTypeOptions = [
    { label: "Head Office", value: "Head Office" },
    { label: "Branch", value: "Branch" },
    { label: "Warehouse", value: "Warehouse" },
    { label: "Other", value: "Other" },
  ];

  // Correctly access nested data for paginated results
  const brandOptions = useMemo(() => {
    const data = BrandData?.data?.data || BrandData;
    return Array.isArray(data)
      ? data.map((b: any) => ({ value: String(b.id), label: b.name }))
      : [];
  }, [BrandData]);

  const categoryOptions = useMemo(() => {
    const data = CategoriesData?.data || CategoriesData;
    return Array.isArray(data)
      ? data.map((c: any) => ({ value: String(c.id), label: c.name }))
      : [];
  }, [CategoriesData]);

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({
    control: formMethods.control,
    name: "company_certificates",
  });
  const {
    fields: branchFields,
    append: appendBranch,
    remove: removeBranch,
  } = useFieldArray({ control: formMethods.control, name: "company_branches" });
  const companyLogoBrochureValue = watch("company_logo_brochure");
  return (
    <Card id="companyDetails">
      <h4 className="mb-4">Primary Information</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {/* <FormItem
          label="Partner Code"
          invalid={!!errors.company_code}
          errorMessage={errors.company_code?.message as string}
        >
          <Controller
            name="company_code"
            control={control}
            render={({ field }) => (
              <Input placeholder="Partner Code" {...field} />
            )}
          />
        </FormItem> */}
        <FormItem
          label={<div>Status<span className="text-red-500"> * </span></div>}
          invalid={!!errors.status}
          errorMessage={errors.status?.message as string}
        >
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                options={statusOptions}
                placeholder="Select Status"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label={<div>Partner Name<span className="text-red-500"> * </span></div>}
          invalid={!!errors.name}
          // className="md:col-span-2"
          errorMessage={errors.name?.message as string}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input placeholder="Partner Name" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Owner/Director Name"
          invalid={!!errors.owner_director_proprietor_name}
          errorMessage={
            errors.owner_director_proprietor_name?.message as string
          }
        >
          <Controller
            name="owner_director_proprietor_name"
            control={control}
            render={({ field }) => (
              <Input placeholder="Owner/Director Name" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Ownership Type"
          invalid={!!errors.ownership_type}
          errorMessage={errors.ownership_type?.message as string}
        >
          <Controller
            name="ownership_type"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Ownership"
                options={ownershipTypeOptions}
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Industrial Expertise"
        >
          <Controller
            name="industrial_expertise"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Expertise"
                options={[
                  {label:"Logistics", value:"Logistics"},
                  {label:"CHA", value:"CHA"},
                  {label:"Account", value:"Account"},
                  {label:"CA", value:"CA"},
                  {label:"Sales Consultant", value:"Sales Consultant"},
                  {label:"HR Related Services", value:"HR Related Services"},
                  {label:"Finance", value:"Finance"},
                  {label:"Banking", value:"Banking"},
                  {label:"IT", value:"IT"},
                  {label:"Non IT Hardware", value:"Non IT Hardware"},
                  {label:"Retail", value:"Retail"},
                  {label:"Non Profit", value:"Non Profit"},
                  {label:"Others", value:"Others"},
                ]}
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Join Us As"
        >
          <Controller
            name="join_us_as"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Join us as"
                options={[
                  {label:"Team", value:"Team"},
                  {label:"Remote Partner", value:"Remote Partner"},
                  {label:"Consultant", value:"Consultant"},
                  {label:"Auditor", value:"Auditor"},
                  {label:"Other", value:"Other"},
                ]}
                {...field}
              />
            )}
          />
        </FormItem>
      </div>

      

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <FormItem
          label="Continent"
          invalid={!!errors.continent_name}
          errorMessage={errors.continent_name?.message as string}
        >
          <Controller
            name="continent_name"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Continent"
                options={continentOptions}
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label={<div>Country<span className="text-red-500"> * </span></div>}
          invalid={!!errors.country}
          errorMessage={errors.country?.message as string}
        >
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Country"
                options={countryOptions}
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="State"
          invalid={!!errors.state}
          errorMessage={errors.state?.message as string}
        >
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Input placeholder="Enter state" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="City"
          invalid={!!errors.city}
          errorMessage={errors.city?.message as string}
        >
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input placeholder="Enter city" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="ZIP / Postal Code"
          invalid={!!errors.zip_postal_code}
          errorMessage={errors.zip_postal_code?.message as string}
        >
          <Controller
            name="zip_postal_code"
            control={control}
            render={({ field }) => <Input placeholder="ZIP Code" {...field} />}
          />
        </FormItem>
      </div>
      <FormItem
        label="Partner Address"
        invalid={!!errors.company_address}
        errorMessage={errors.company_address?.message as string}
        className="md:col-span-3"
      >
        <Controller
          name="company_address"
          control={control}
          render={({ field }) => (
            <Input placeholder="Partner Address" {...field} />
          )}
        />
      </FormItem>

      <hr className="my-6" /> <h4 className="mb-4">Contact Information</h4>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-2">
        <FormItem
          label={<div>Primary Email ID<span className="text-red-500"> * </span></div>}
          invalid={!!errors.company_primary_email_id}
          errorMessage={errors.company_primary_email_id?.message as string}
        >
          <Controller
            name="company_primary_email_id"
            control={control}
            render={({ field }) => (
              <Input type="email" placeholder="Primary Email" {...field} />
            )}
          />
        </FormItem>
       
        <FormItem
          label="Alternate E-mail ID"
          invalid={!!errors.alternate_email_id}
          errorMessage={errors.alternate_email_id?.message as string}
        >
          <Controller
            name="alternate_email_id"
            control={control}
            render={({ field }) => (
              <Input type="email" placeholder="Alternate Email" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          label="Support Email"
          invalid={!!errors.support_email}
          errorMessage={errors.support_email?.message as string}
        >
          <Controller
            name="support_email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                placeholder="support@example.com"
                {...field}
              />
            )}
          />
        </FormItem>{" "}
        
        <FormItem label="Notification Email">
          <Controller
            name="notification_email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                placeholder="notifications@example.com"
                {...field}
              />
            )}
          />
        </FormItem>{" "}
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <FormItem
          label={<div>Primary Contact Number<span className="text-red-500"> * </span></div>}
          invalid={!!errors.company_primary_contact_number}
          errorMessage={
            errors.company_primary_contact_number?.message as string
          }
        >
          <div className="flex items-center gap-2">
            <Controller
              name="primary_contact_country_code"
              control={control}
              render={({ field }) => (
                <Select
                  options={countryCodeOptions}
                  className="w-28"
                  {...field}
                />
              )}
            />
            <Controller
              name="company_primary_contact_number"
              control={control}
              render={({ field }) => (
                <Input placeholder="Primary Contact" {...field} />
              )}
            />
          </div>
        </FormItem>
        <FormItem label="Alternate Contact Number">
          <div className="flex items-center gap-2">
            <Controller
              name="alternate_contact_country_code"
              control={control}
              render={({ field }) => (
                <Select
                  options={countryCodeOptions}
                  className="w-28"
                  {...field}
                />
              )}
            />
            <Controller
              name="alternate_contact_number"
              control={control}
              render={({ field }) => (
                <Input placeholder="Alternate Contact" {...field} />
              )}
            />
          </div>
        </FormItem>
        <FormItem label="General Mobile">
          <div className="flex items-center gap-2">
            <Controller
              name="general_mobile_country_code"
              control={control}
              render={({ field }) => (
                <Select
                  options={countryCodeOptions}
                  className="w-28"
                  {...field}
                />
              )}
            />
            <Controller
              name="mobile"
              control={control}
              render={({ field }) => (
                <Input placeholder="General Mobile" {...field} />
              )}
            />
          </div>
        </FormItem>
      </div>

      <hr className="my-6" /> <h4 className="mb-4">Trade Information</h4>{" "}
      <div className="grid md:grid-cols-4 gap-3">
        {" "}
        <FormItem
          label={<div>GST Number<span className="text-red-500"> * </span></div>}
          invalid={!!errors.gst_number}
          errorMessage={errors.gst_number?.message as string}
        >
          <Controller
            name="gst_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="GST Number" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label={<div>PAN Number<span className="text-red-500"> * </span></div>}
          invalid={!!errors.pan_number}
          errorMessage={errors.pan_number?.message as string}
        >
          <Controller
            name="pan_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="PAN Number" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="TRN Number"
          invalid={!!errors.trn_number}
          errorMessage={errors.trn_number?.message as string}
        >
          <Controller
            name="trn_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="TRN Number" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="TAN Number"
          invalid={!!errors.tan_number}
          errorMessage={errors.tan_number?.message as string}
        >
          <Controller
            name="tan_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="TAN Number" {...field} />
            )}
          />
        </FormItem>{" "}
      </div>{" "}
      <hr className="my-6" /> <h4 className="mb-4">Partner Information</h4>{" "}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {" "}
        <FormItem
          label="Establishment Year"
          invalid={!!errors.company_establishment_year}
          errorMessage={errors.company_establishment_year?.message as string}
        >
          <Controller
            name="company_establishment_year"
            control={control}
            render={({ field }) => (
              <Input placeholder="YYYY" maxLength={4} {...field} />
            )}
          />
        </FormItem>{" "}
        
        <FormItem
          label="Partner Website"
          invalid={!!errors.company_website}
          errorMessage={errors.company_website?.message as string}
        >
          <Controller
            name="company_website"
            control={control}
            render={({ field }) => (
              <Input type="url" placeholder="https://example.com" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="Partner Logo/Brochure"
          invalid={!!errors.company_logo_brochure}
          errorMessage={errors.company_logo_brochure?.message as string}
        >
          <Controller
            name="company_logo_brochure"
            control={control}
            render={({ field: { onChange, ref } }) => (
              <Input
                type="file"
                ref={ref}
                onChange={(e) => onChange(e.target.files?.[0])}
              />
            )}
          />
          {typeof companyLogoBrochureValue === "string" &&
            companyLogoBrochureValue && (
              <img
                src={companyLogoBrochureValue}
                alt="logo preview"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>{" "}
        <FormItem
          label="No. of Employees"
          invalid={!!errors.no_of_employees}
          errorMessage={errors.no_of_employees?.message as string}
        >
          <Controller
            name="no_of_employees"
            control={control}
            render={({ field }) => (
              <NumericInput
                placeholder="e.g., 100"
                {...field}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        </FormItem>{" "}
        {/* <FormItem
          label="Primary Business Type"
          invalid={!!errors.primary_business_type}
          errorMessage={errors.primary_business_type?.message as string}
        >
          <Controller
            name="primary_business_type"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Business Type"
                options={primaryBusinessTypeOptions}
                {...field}
              />
            )}
          />
        </FormItem>{" "} */}
        {/* <FormItem
          label="Primary Business Category"
          invalid={!!errors.primary_business_category}
          errorMessage={errors.primary_business_category?.message as string}
        >
          <Controller
            name="primary_business_category"
            control={control}
            render={({ field }) => (
              <Input placeholder="e.g., Electronics" {...field} />
            )}
          />
        </FormItem>{" "} */}
        {/* <FormItem
          label="Sub Category"
          invalid={!!errors.sub_category}
          errorMessage={errors.sub_category?.message as string}
        >
          <Controller
            name="sub_category"
            control={control}
            render={({ field }) => (
              <Select placeholder="Select Sub-Categories" isMulti {...field} />
            )}
          />
        </FormItem>{" "} */}
        {/* <FormItem
          label="Interested In"
          invalid={!!errors.interested_in}
          errorMessage={errors.interested_in?.message as string}
        >
          <Controller
            name="interested_in"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Interest"
                options={interestedInOptions}
                {...field}
              />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="Partner Type"
          invalid={!!errors.company_type}
          errorMessage={errors.company_type?.message as string}
        >
          <Controller
            name="company_type"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Partner Type"
                options={companyTypeOptions}
                {...field}
              />
            )}
          />
        </FormItem>{" "} */}
        
        {/* <FormItem label="Brands">
          <Controller
            name="brands"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Brands"
                isMulti
                options={brandOptions}
                {...field}
              />
            )}
          />
        </FormItem>{" "}
        <FormItem label="Category">
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Categories"
                isMulti
                options={categoryOptions}
                {...field}
              />
            )}
          />
        </FormItem>{" "} */}
      </div>{" "}
      <hr className="my-6" />{" "}
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Certificates</h4>
        <Button
          type="button"
          icon={<TbPlus />}
          size="sm"
          onClick={() =>
            appendCert({
              certificate_id: "",
              certificate_name: "",
              upload_certificate: undefined,
            })
          }
        >
          Add Certificate
        </Button>
      </div>{" "}
      {certFields.map((item, index) => {
        const uploadCertificateValue = watch(
          `company_certificates.${index}.upload_certificate`
        );
        return (
          <Card key={item.id} className="mb-4 rounded-md border-black dark:border-gray-100 relative">
            <div className="grid md:grid-cols-10 gap-3 items-center">
              <FormItem label="Certificate ID" className="col-span-3">
                <Controller
                  name={`company_certificates.${index}.certificate_id`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="e.g., 1345" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="Certificate Name" className="col-span-3">
                <Controller
                  name={`company_certificates.${index}.certificate_name`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="e.g., ISO 9001" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="Upload Certificate" className="col-span-3">
                <Controller
                  name={`company_certificates.${index}.upload_certificate`}
                  control={control}
                  render={({ field: { onChange, ref } }) => (
                    <Input
                      type="file"
                      ref={ref}
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  )}
                />
                {typeof uploadCertificateValue === "string" &&
                  uploadCertificateValue && (
                    <a
                      href={uploadCertificateValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                    >
                      View Uploaded
                    </a>
                  )}
              </FormItem>
              <Button
                className="border mt-2"
                type="button"
                shape="circle"
                size="sm"
                icon={<TbTrash />}
                onClick={() => removeCert(index)}
              />
            </div>
          </Card>
        );
      })}{" "}
      <hr className="my-6" />{" "}
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Office Information</h4>
        <Button
          type="button"
          icon={<TbPlus />}
          size="sm"
          onClick={() =>
            appendBranch({
              office_type: undefined,
              branch_name: "",
              branch_address: "",
              location_country: undefined,
              branch_state: undefined,
              branch_zip_code: "",
              branch_gst_reg_number: "",
            })
          }
        >
          Add Office
        </Button>
      </div>{" "}
      {branchFields.map((item, index) => (
        <Card key={item.id} className="mb-4 rounded-md border-black dark:border-gray-100 relative">
          <div className="grid md:grid-cols-3 gap-x-3 gap-y-1">
            <FormItem label="Office Type">
              <Controller
                name={`company_branches.${index}.office_type`}
                control={control}
                render={({ field }) => (
                  <Select
                    placeholder="Select Office Type"
                    options={officeTypeOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Office Name">
              <Controller
                name={`company_branches.${index}.branch_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="e.g. Main Office" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Country">
              <Controller
                name={`company_branches.${index}.location_country`}
                control={control}
                render={({ field }) => (
                  <Select
                    placeholder="Select Country"
                    options={countryOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="State">
              <Controller
                name={`company_branches.${index}.branch_state`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Enter state" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="ZIP Code">
              <Controller
                name={`company_branches.${index}.branch_zip_code`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="ZIP Code" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="GST/REG Number">
              <Controller
                name={`company_branches.${index}.branch_gst_reg_number`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="GST or Registration Number" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Address" className="md:col-span-3">
              <Controller
                name={`company_branches.${index}.branch_address`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Full Address" {...field} />
                )}
              />
            </FormItem>
              <Button
                className="absolute top-2 right-2 text-xs"
                type="button"
                variant="plain"
                size="sm"
                icon={<TbTrash />}
                onClick={() => removeBranch(index)}
              >Remove</Button>
          </div>
        </Card>
      ))}{" "}
    </Card>
  );
};

// --- KYCDetailSection ---
const KYCDetailSection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const kycDocs = [
    {
      label: "Aadhar Card",
      name: "aadhar_card" as const,
      remarkName: "aadhar_card_remark" as const,
      enabledName: "aadhar_card_remark_enabled" as const,
    },
    {
      label: "PAN Card",
      name: "pan_card" as const,
      remarkName: "pan_card_remark" as const,
      enabledName: "pan_card_remark_enabled" as const,
    },
    {
      label: "GST Certificate",
      name: "gst_certificate" as const,
      remarkName: "gst_certificate_remark" as const,
      enabledName: "gst_certificate_remark_enabled" as const,
    },
    {
      label: "Authority Letter",
      name: "authority_letter" as const,
      remarkName: "authority_letter_remark" as const,
      enabledName: "authority_letter_remark_enabled" as const,
    },
    {
      label: "Visiting Card",
      name: "visiting_card" as const,
      remarkName: "visiting_card_remark" as const,
      enabledName: "visiting_card_remark_enabled" as const,
    },
    {
      label: "Cancel Cheque",
      name: "cancel_cheque" as const,
      remarkName: "cancel_cheque_remark" as const,
      enabledName: "cancel_cheque_remark_enabled" as const,
    },
    // {
    //   label: "206AB Declaration",
    //   name: "declaration_206ab" as const,
    //   remarkName: "declaration_206ab_remark" as const,
    //   enabledName: "declaration_206ab_remark_enabled" as const,
    // },
    // {
    //   label: "194Q Declaration",
    //   name: "declaration_194q" as const,
    //   remarkName: "declaration_194q_remark" as const,
    //   enabledName: "declaration_194q_remark_enabled" as const,
    // },
    {
      label: "Agreement / Quotation",
      name: "agreement" as const,
      remarkName: "agreement_remark" as const,
      enabledName: "agreement_remark_enabled" as const,
    },
    {
      label: "Office Photo",
      name: "office_photo" as const,
      remarkName: "office_photo_remark" as const,
      enabledName: "office_photo_remark_enabled" as const,
    },
    {
      label: "Other Document",
      name: "other_document" as const,
      remarkName: "other_document_remark" as const,
      enabledName: "other_document_remark_enabled" as const,
    },
  ];
  return (
    <Card id="kycDocuments">
      {" "}
      <h5 className="mb-4">Current Documents</h5>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
        {" "}
        {kycDocs.map((doc) => {
          const isVerified = watch(doc.enabledName);
          const fileValue = watch(doc.name);
          const isImageFile = (file: unknown): file is File =>
            file instanceof File && file.type.startsWith("image/");
          const isImageUrl = (url: unknown): url is string =>
            typeof url === "string" &&
            /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);
          return (
            <div key={doc.name}>
              {" "}
              <label className="flex items-center gap-2 mb-2">
                {" "}
                <Controller
                  name={doc.enabledName}
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={!!field.value} onChange={field.onChange}>
                      {" "}
                      {doc.label} (Verified){" "}
                    </Checkbox>
                  )}
                />{" "}
              </label>{" "}
              <FormItem
                invalid={!!errors[doc.name]}
                errorMessage={errors[doc.name]?.message as string}
              >
                {" "}
                <Controller
                  name={doc.name}
                  control={control}
                  render={({ field: { onChange, ref } }) => (
                    <Input
                      type="file"
                      ref={ref}
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  )}
                />{" "}
              </FormItem>{" "}
              {fileValue && (
                <div className="mt-2">
                  {" "}
                  {isImageFile(fileValue) ? (
                    <img
                      src={URL.createObjectURL(fileValue)}
                      alt="Preview"
                      className="h-24 w-auto object-contain border rounded p-1"
                    />
                  ) : isImageUrl(fileValue) ? (
                    <img
                      src={fileValue}
                      alt="Preview"
                      className="h-24 w-auto object-contain border rounded p-1"
                    />
                  ) : (
                    <div className="text-sm">
                      {" "}
                      {typeof fileValue === "string" ? (
                        <a
                          href={fileValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Uploaded Document
                        </a>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">
                          {(fileValue as File).name}
                        </p>
                      )}{" "}
                    </div>
                  )}{" "}
                </div>
              )}{" "}
              <FormItem
                className="mt-2"
                invalid={!!errors[doc.remarkName]}
                errorMessage={errors[doc.remarkName]?.message as string}
              >
                {" "}
                <Controller
                  name={doc.remarkName}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder={`Remark for ${doc.label}`}
                      {...field}
                    />
                  )}
                />{" "}
              </FormItem>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      <hr className="my-6" /> <h5 className="mb-4">Past Documents</h5>{" "}
      <p className="text-gray-500">
        Section for past documents can be built here if needed.
      </p>{" "}
    </Card>
  );
};

// --- BankDetailsSection ---
const BankDetailsSection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const bankNameOptions = [
    { value: "hdfc", label: "HDFC Bank" },
    { value: "sbi", label: "State Bank of India" },
  ];
  const bankTypeOptions = [
    { value: "Primary", label: "Primary" },
    { value: "Secondary", label: "Secondary" },
    { value: "Other", label: "Other" },
  ];
  const { fields, append, remove } = useFieldArray({
    control,
    name: "additional_bank_details",
  });
  const primaryBankPhotoValue = watch("primary_bank_verification_photo");
  const secondaryBankPhotoValue = watch("secondary_bank_verification_photo");
  return (
    <Card id="bankDetails">
      {" "}
      <h4 className="mb-6">Bank Details (Primary)</h4>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {" "}
        <FormItem label="Primary Account Number">
          <Controller
            name="primary_account_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="Primary Account No." {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem label="Primary Bank Name">
          <Controller
            name="primary_bank_name"
            control={control}
            render={({ field }) => (
              // <Select
              //   placeholder="Select Bank"
              //   options={bankNameOptions}
              //   {...field}
              // />
              <Input type="text" {...field} placeholder="Enter Bank Name" />
            )}
          />
        </FormItem>{" "}
        <FormItem label="Primary IFSC Code">
          <Controller
            name="primary_ifsc_code"
            control={control}
            render={({ field }) => (
              <Input placeholder="Primary IFSC" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="Primary Bank Verification Photo"
          className="md:col-span-3"
        >
          <Controller
            name="primary_bank_verification_photo"
            control={control}
            render={({ field: { onChange, ref } }) => (
              <Input
                type="file"
                ref={ref}
                accept="image/*,application/pdf"
                onChange={(e) => onChange(e.target.files?.[0])}
              />
            )}
          />
          {typeof primaryBankPhotoValue === "string" &&
            primaryBankPhotoValue && (
              <img
                src={primaryBankPhotoValue}
                alt="Primary bank photo"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>{" "}
      </div>{" "}
      <hr className="my-6" /> <h4 className="mb-6">Bank Details (Secondary)</h4>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {" "}
        <FormItem label="Secondary Account Number">
          <Controller
            name="secondary_account_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="Secondary Account No." {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem label="Secondary Bank Name">
          <Controller
            name="secondary_bank_name"
            control={control}
            render={({ field }) => (
              // <Select
              //   placeholder="Select Bank"
              //   options={bankNameOptions}
              //   {...field}
              // />
              <Input type="text" {...field} placeholder="Enter Bank Name" />
            )}
          />
        </FormItem>{" "}
        <FormItem label="Secondary IFSC Code">
          <Controller
            name="secondary_ifsc_code"
            control={control}
            render={({ field }) => (
              <Input placeholder="Secondary IFSC" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="Secondary Bank Verification Photo"
          className="md:col-span-3"
        >
          <Controller
            name="secondary_bank_verification_photo"
            control={control}
            render={({ field: { onChange, ref } }) => (
              <Input
                type="file"
                ref={ref}
                accept="image/*,application/pdf"
                onChange={(e) => onChange(e.target.files?.[0])}
              />
            )}
          />
          {typeof secondaryBankPhotoValue === "string" &&
            secondaryBankPhotoValue && (
              <img
                src={secondaryBankPhotoValue}
                alt="Secondary bank photo"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>{" "}
      </div>{" "}
      <hr className="my-6" />{" "}
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Additional Bank Details</h4>
        <Button
          type="button"
          icon={<TbPlus />}
          size="sm"
          onClick={() =>
            append({
              bank_account_number: "",
              bank_name: undefined,
              ifsc_code: "",
              bank_verification_photo: undefined,
              type: undefined,
            })
          }
        >
          Add More Banks
        </Button>
      </div>{" "}
      {fields.map((item, index) => {
        const bankPhotoValue = watch(
          `additional_bank_details.${index}.bank_verification_photo`
        );
        return (
          <Card key={item.id} className="mb-4 border-black rounded-md relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 items-start">
              <FormItem label={`Type`}>
                <Controller
                  name={`additional_bank_details.${index}.type`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select Type"
                      options={bankTypeOptions}
                      {...field}
                    />
                  )}
                />
              </FormItem>
              <FormItem label={`Account Number`}>
                <Controller
                  name={`additional_bank_details.${index}.bank_account_number`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Account No." {...field} />
                  )}
                />
              </FormItem>
              <FormItem label={`Bank Name`}>
                <Controller
                  name={`additional_bank_details.${index}.bank_name`}
                  control={control}
                  render={({ field }) => (
                    // <Select
                    //   placeholder="Select Bank"
                    //   options={bankNameOptions}
                    //   {...field}
                    // />
                    <Input type="text" {...field} placeholder="Enter Bank Name" />
                  )}
                />
              </FormItem>
              <FormItem label={`IFSC Code`}>
                <Controller
                  name={`additional_bank_details.${index}.ifsc_code`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="IFSC" {...field} />
                  )}
                />
              </FormItem>
              <FormItem
                label={`Bank Verification Photo`}
                className="md:col-span-2"
              >
                <Controller
                  name={`additional_bank_details.${index}.bank_verification_photo`}
                  control={control}
                  render={({ field: { onChange, ref } }) => (
                    <Input
                      type="file"
                      ref={ref}
                      accept="image/*,application/pdf"
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  )}
                />
                {typeof bankPhotoValue === "string" && bankPhotoValue && (
                  <img
                    src={bankPhotoValue}
                    alt={`Bank ${index + 1} photo`}
                    className="mt-2 h-16 w-auto"
                  />
                )}
              </FormItem>
              <Button
                type="button"
                variant="plain"
                className="absolute text-xs right-2 top-2"
                size="sm"
                icon={<TbTrash size={16}/>}
                onClick={() => remove(index)}
              >Remove</Button>
            </div>
          </Card>
        );
      })}{" "}
    </Card>
  );
};

// --- SpotVerificationSection ---
const SpotVerificationSection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "company_spot_verification_data",
  });
  return (
    <Card id="spotVerification">
      {" "}
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Spot Verifications</h4>
        <Button
          type="button"
          icon={<TbPlus />}
          size="sm"
          onClick={() =>
            append({
              is_verified: false,
              verified_by_name: "",
              photo_upload: undefined,
              remarks: "",
            })
          }
        >
          Add Verification Entry
        </Button>
      </div>{" "}
      {fields.map((item, index) => {
        const photoValue = watch(
          `company_spot_verification_data.${index}.photo_upload`
        );
        return (
          <Card key={item.id} className="mb-4 border-black rounded-md relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-start">
              <div className="flex items-center gap-4">
                <Controller
                  name={`company_spot_verification_data.${index}.is_verified`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={!!field.value} onChange={field.onChange}>
                    </Checkbox>
                  )}
                />
                <FormItem label="Verified By (Name)" className="flex-grow">
                  <Controller
                    name={`company_spot_verification_data.${index}.verified_by_name`}
                    control={control}
                    render={({ field }) => (
                      <Input placeholder="Verifier's Name" {...field} />
                    )}
                  />
                </FormItem>
              </div>
              <FormItem label="Upload Document">
                <Controller
                  name={`company_spot_verification_data.${index}.photo_upload`}
                  control={control}
                  render={({ field: { onChange, ref } }) => (
                    <Input
                      type="file"
                      ref={ref}
                      accept="image/*,application/pdf"
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  )}
                />
                {typeof photoValue === "string" && photoValue && (
                  <a
                    href={photoValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                  >
                    View Uploaded
                  </a>
                )}
              </FormItem>
              <FormItem label="Remarks" className="md:col-span-2">
                <Controller
                  name={`company_spot_verification_data.${index}.remarks`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="Add remarks here..."
                      {...field}
                    />
                  )}
                />
              </FormItem>
            </div>
            <div className="flex justify-center absolute top-2 right-2">
              <Button
                type="button"
                variant="plain"
                size="sm"
                className="text-xs"
                icon={<TbTrash size={16}/>}
                onClick={() => remove(index)}
              >Remove</Button>
            </div>
          </Card>
        );
      })}{" "}
    </Card>
  );
};

// --- ReferenceSection ---
const ReferenceSection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "references",
  });

  return (
    <Card id="reference">
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">References</h4>
        <Button
          type="button"
          icon={<TbPlus />}
          size="sm"
          onClick={() =>
            append({
              person_name: "",
              company_name: "",
              contact_number: "",
              remark: "",
            })
          }
        >
          Add Reference
        </Button>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border-black rounded-md relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-start">
            <FormItem label="Person Name">
              <Controller
                name={`references.${index}.person_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Person's Name" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Company Name">
              <Controller
                name={`references.${index}.company_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Partner Name" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Contact Number">
              <Controller
                name={`references.${index}.contact_number`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Contact Number" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Remark" className="sm:col-span-3">
              <Controller
                name={`references.${index}.remark`}
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Add remarks here..."
                    {...field}
                  />
                )}
              />
            </FormItem>
          </div>
          <div className="flex justify-center absolute top-2 right-2">
            <Button
              type="button"
              variant="plain"
              size="sm"
              className="text-xs"
              icon={<TbTrash size={16}/>}
              onClick={() => remove(index)}
            > Remove
              </Button>
          </div>
        </Card>
      ))}
    </Card>
  );
};

// --- AccessibilitySection ---
const AccessibilitySection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "billing_documents",
  });
  const domainOptions = [
    { value: "retail.com", label: "retail.com" },
    { value: "service.co", label: "service.co" },
  ];
  return (
    <Card id="accessibility">
      {" "}
      <h4 className="mb-6">Accessibility & Configuration</h4>{" "}
      <div className="grid grid-cols-1 gap-y-4">
        {" "}
        <div className="flex items-center gap-x-8">
          {" "}
          <FormItem>
            <Controller
              name="KYC_FIELD"
              control={control}
              render={({ field }) => (
                <Checkbox checked={!!field.value} onChange={field.onChange}>
                  KYC Verified
                </Checkbox>
              )}
            />
          </FormItem>{" "}
          <FormItem>
            <Controller
              name="BILLING_FIELD"
              control={control}
              render={({ field }) => (
                <Checkbox checked={!!field.value} onChange={field.onChange}>
                  Enable Billing
                </Checkbox>
              )}
            />
          </FormItem>{" "}
        </div>{" "}
        <hr />{" "}
        <div className="flex justify-between items-center mb-2">
          <h5 className="mb-0">Transaction Documents</h5>
          <Button
            type="button"
            icon={<TbPlus />}
            size="sm"
            onClick={() =>
              append({ document_name: "", document_file: undefined })
            }
          >
            Add Transaction Doc
          </Button>
        </div>{" "}
        {fields.map((item, index) => {
          const docFileValue = watch(
            `billing_documents.${index}.document_file`
          );
          return (
            <Card key={item.id} className="border-black rounded-md ">
              <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
                <FormItem label="Document Name" className="md:col-span-4">
                  <Controller
                    name={`billing_documents.${index}.document_name`}
                    control={control}
                    render={({ field }) => (
                      <Input placeholder="e.g., Invoice Template" {...field} />
                    )}
                  />
                </FormItem>
                <FormItem label="Upload Document" className="md:col-span-4">
                  <Controller
                    name={`billing_documents.${index}.document_file`}
                    control={control}
                    render={({ field: { onChange, ref } }) => (
                      <Input
                        type="file"
                        ref={ref}
                        accept="image/*,application/pdf"
                        onChange={(e) => onChange(e.target.files?.[0])}
                      />
                    )}
                  />
                  {typeof docFileValue === "string" && docFileValue && (
                    <a
                      href={docFileValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                    >
                      View Uploaded
                    </a>
                  )}
                </FormItem>
                <Button
                  type="button"
                  shape="circle"
                  size="sm"
                  className="mt-2"
                  icon={<TbTrash size={16} />}
                  onClick={() => remove(index)}
                />
              </div>
            </Card>
          );
        })}{" "}
        {/* <FormItem label="Domain Management">
          <Controller
            name="DOMAIN_MANAGEMENT_FIELD"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Domains"
                options={domainOptions}
                isMulti
                {...field}
              />
            )}
          />
        </FormItem>{" "} */}
        {/* <Card className="mt-4 col-span-full">
          <hr className="my-6" />
          <h4 className="mb-4">Social Media Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <FormItem label="Facebook URL">
              <Controller
                name="facebook"
                control={control}
                render={({ field }) => (
                  <Input
                    type="url"
                    placeholder="https://facebook.com/..."
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Instagram URL">
              <Controller
                name="instagram"
                control={control}
                render={({ field }) => (
                  <Input
                    type="url"
                    placeholder="https://instagram.com/..."
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="LinkedIn URL">
              <Controller
                name="linkedin"
                control={control}
                render={({ field }) => (
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="YouTube URL">
              <Controller
                name="youtube"
                control={control}
                render={({ field }) => (
                  <Input
                    type="url"
                    placeholder="https://youtube.com/..."
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Twitter URL">
              <Controller
                name="twitter"
                control={control}
                render={({ field }) => (
                  <Input
                    type="url"
                    placeholder="https://twitter.com/..."
                    {...field}
                  />
                )}
              />
            </FormItem>
          </div>
        </Card>{" "} */}
      </div>{" "}
    </Card>
  );
};

// --- MemberManagementSection ---
const MemberManagementSection = ({
  control,
  errors,
  formMethods,
}: FormSectionBaseProps) => {
  const { memberData } = useSelector(masterSelector);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  // Correctly access nested data for paginated results
  const memberOptions = useMemo(() => {
    const data = memberData?.data?.data || memberData;
    return Array.isArray(data)
      ? data.map((m: any) => ({
        value: String(m.id),
        label: `${m.name} (ID:${m.id})`,
      }))
      : [];
  }, [memberData]);

  return (
    <Card id="memberManagement">
      {" "}
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Team Management</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            icon={<TbPlus />}
            onClick={() =>
              append({
                type: "team",
                member: undefined, // ignored for team
                designation: "",
                person_name: "",
                contact_number: "",
              })
            }

          >
            Add Team
          </Button>
          {/* <Button
            type="button"
            size="sm"
            icon={<TbPlus />}
            onClick={() =>
              append({
                type: "member",
                member: undefined,
                designation: "",
                person_name: "",
                contact_number: "",
              })
            }
          >
            Add Member
          </Button> */}
          
          {/* <Button type="button" size="sm" icon={<TbPlus />}>
            <NavLink to="/business-entities/member-create">
              Create New Member
            </NavLink>
          </Button> */}
        </div>
      </div>{" "}
      {fields.map((item, index) => (
        <Card key={item.id} className="border-black relative rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 items-center">
            <FormItem label={item.type === "team" ? "Team Name" : "Member"}>
              <Controller
                name={`members.${index}.${item.type === "team" ? "team_name" : "member"}`}
                control={control}
                render={({ field }) =>
                  item.type === "team" ? (
                    <Input placeholder="Team Name" {...field} />
                  ) : (
                    <Select
                      placeholder="Select Member"
                      options={memberOptions}
                      {...field}
                    />
                  )
                }
              />
            </FormItem>
            <FormItem label="Designation">
              <Controller
                name={`members.${index}.designation`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="e.g., CEO" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Person Name">
              <Controller
                name={`members.${index}.person_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Person Name" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Contact Number">
              <Controller
                name={`members.${index}.contact_number`}
                control={control}
                render={({ field }) => (
                  <Input type="tel" placeholder="Contact Number" {...field} />
                )}
              />
            </FormItem>
            <div className="md:col-span-4 flex justify-end">
              <Button
                type="button"
                variant="plain"
                size="sm"
                className="absolute top-2 right-2 text-xs"
                icon={<TbTrash size={16} />}
                onClick={() => remove(index)}
              >Remove</Button>
            </div>
          </div>
        </Card>
      ))}{" "}
    </Card>
  );
};

// --- CompanyFormComponent ---
type CompanyFormComponentProps = {
  onFormSubmit: (
    values: CompanyFormSchema,
    formMethods: UseFormReturn<CompanyFormSchema>
  ) => void;
  defaultValues?: Partial<CompanyFormSchema>;
  isEditMode?: boolean;
  onDiscard?: () => void;
  isSubmitting?: boolean;
};
const CompanyFormComponent = (props: CompanyFormComponentProps) => {
  const { onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting } =
    props;
  const [activeSection, setActiveSection] = useState<string>(
    companyNavigationList[0].link
  );
  const companySchema = z
    .object({
      name: z.string().trim().min(1, { message: "Name is Required!" }),
      company_code: z
        .string()
        .trim()
        .min(1, { message: "Partner code is required!" }),
      company_primary_email_id: z
        .string()
        .trim()
        .min(1, { message: "Email is Required !" })
        .email("Invalid email format"),
      status: z
        .object({ value: z.string(), label: z.string() })
        .optional()
        .nullable(),
      company_primary_contact_number: z
        .string()
        .trim()
        .min(1, { message: "Primary contact number is required!" })
        .regex(/^\+?\d{7,15}$/, { message: "Invalid contact number format" }),
      company_website: z
        .string()
        .url({ message: "Invalid website URL" })
        .optional()
        .or(z.literal("")),
      support_email: z
        .string()
        .email({ message: "Invalid support email" })
        .optional()
        .or(z.literal("")),
    })
    .passthrough();
  const formMethods = useForm<CompanyFormSchema>({
    defaultValues: defaultValues || {},
    resolver: zodResolver(companySchema),
  });
  const {
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = formMethods;
  useEffect(() => {
    const initialValues = defaultValues || {};
    const fullInitialValues: Partial<CompanyFormSchema> = {
      members: [],
      additional_bank_details: [],
      company_spot_verification_data: [],
      references: [],
      company_certificates: [],
      company_branches: [],
      billing_documents: [],
      ...initialValues,
    };
    reset(fullInitialValues);
  }, [defaultValues, reset]);
  const internalFormSubmit = (values: CompanyFormSchema) => {
    onFormSubmit?.(values, formMethods);
  };
  const navigationKeys = companyNavigationList.map((item) => item.link);
  const handleNext = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex < navigationKeys.length - 1)
      setActiveSection(navigationKeys[currentIndex + 1]);
  };
  const handlePrevious = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]);
  };
  const renderActiveSection = () => {
    const sectionProps = { errors, control, formMethods };
    switch (activeSection) {
      case "companyDetails":
        return <CompanyDetailsSection {...sectionProps} />;
      case "kycDocuments":
        return <KYCDetailSection {...sectionProps} />;
      case "bankDetails":
        return <BankDetailsSection {...sectionProps} />;
      // case "spotVerification":
      //   return <SpotVerificationSection {...sectionProps} />;
      case "reference":
        return <ReferenceSection {...sectionProps} />;
      case "accessibility":
        return <AccessibilitySection {...sectionProps} />;
      case "memberManagement":
        return <MemberManagementSection {...sectionProps} />;
      default:
        return <CompanyDetailsSection {...sectionProps} />;
    }
  };
  return (
    <>
      {" "}
      <div className="flex gap-1 items-end mb-3">
        {" "}
        <NavLink to="/business-entities/company">
          <h6 className="font-semibold hover:text-primary-600">Partner</h6>
        </NavLink>{" "}
        <BiChevronRight size={22} />{" "}
        <h6 className="font-semibold text-primary">
          {isEditMode ? "Edit Partner" : "Add New Partner"}
        </h6>{" "}
      </div>{" "}
      <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
        <NavigatorComponent
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />
      </Card>{" "}
      <div className="flex flex-col gap-4 pb-20">{renderActiveSection()}</div>{" "}
      <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {" "}
        <div className="flex justify-between items-center p-4">
          {" "}
          <div>
            {onDiscard && (
              <Button
                type="button"
                customColorClass={() =>
                  "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                }
                icon={<TbTrash />}
                onClick={onDiscard}
                disabled={isSubmitting}
              >
                Discard
              </Button>
            )}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <Button
              type="button"
              onClick={handlePrevious}
              disabled={
                isSubmitting || navigationKeys.indexOf(activeSection) === 0
              }
            >
              Previous
            </Button>{" "}
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                isSubmitting ||
                navigationKeys.indexOf(activeSection) ===
                navigationKeys.length - 1
              }
            >
              Next
            </Button>{" "}
            <Button
              variant="solid"
              type="button"
              loading={isSubmitting}
              onClick={handleSubmit(internalFormSubmit)}
              disabled={isSubmitting}
            >
              {isEditMode ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </Card>{" "}
    </>
  );
};

// --- CompanyFormPage (Combined Add/Edit Page) ---
const CreatePartner = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [initialData, setInitialData] =
    useState<Partial<CompanyFormSchema> | null>(null);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEmptyFormValues = (): Partial<CompanyFormSchema> => ({
    name: "",
    company_primary_contact_number: "",
    primary_contact_country_code: undefined,
    company_profile_settings_id: "",
    alternate_contact_number: "",
    alternate_contact_country_code: undefined,
    company_primary_email_id: "",
    alternate_email_id: "",
    ownership_type: undefined,
    owner_director_proprietor_name: "",
    company_address: "",
    city: undefined,
    state: undefined,
    zip_postal_code: "",
    country: undefined,
    continent_name: undefined,
    gst_number: "",
    pan_number: "",
    trn_number: "",
    tan_number: "",
    company_establishment_year: "",
    no_of_employees: "",
    company_website: "",
    company_logo_brochure: undefined,
    primary_business_type: undefined,
    primary_business_category: "",
    sub_category: [],
    interested_in: undefined,
    company_certificates: [],
    company_branches: [],
    declaration_206ab: undefined,
    declaration_206ab_remark: "",
    declaration_206ab_remark_enabled: false,
    declaration_194q: undefined,
    declaration_194q_remark: "",
    declaration_194q_remark_enabled: false,
    office_photo: undefined,
    office_photo_remark: "",
    office_photo_remark_enabled: false,
    gst_certificate: undefined,
    gst_certificate_remark: "",
    gst_certificate_remark_enabled: false,
    authority_letter: undefined,
    authority_letter_remark: "",
    authority_letter_remark_enabled: false,
    visiting_card: undefined,
    visiting_card_remark: "",
    visiting_card_remark_enabled: false,
    cancel_cheque: undefined,
    cancel_cheque_remark: "",
    cancel_cheque_remark_enabled: false,
    aadhar_card: undefined,
    aadhar_card_remark: "",
    aadhar_card_remark_enabled: false,
    pan_card: undefined,
    pan_card_remark: "",
    pan_card_remark_enabled: false,
    other_document: undefined,
    other_document_remark: "",
    other_document_remark_enabled: false,
    primary_account_number: "",
    primary_bank_name: undefined,
    primary_ifsc_code: "",
    primary_bank_verification_photo: undefined,
    secondary_account_number: "",
    secondary_bank_name: undefined,
    secondary_ifsc_code: "",
    secondary_bank_verification_photo: undefined,
    additional_bank_details: [],
    KYC_FIELD: false,
    BILLING_FIELD: false,
    billing_documents: [],
    DOMAIN_MANAGEMENT_FIELD: [],
    members: [],
    status: undefined,
    company_code: "",
    brands: [],
    category: [],
    support_email: "",
    mobile: "",
    company_type: undefined,
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    twitter: "",
    notification_email: "",
    company_spot_verification_data: [],
    references: [],
  });

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getBrandAction());
    dispatch(getCategoriesAction());
    dispatch(getMembersAction());
  }, [dispatch]);
  useEffect(() => {
    const emptyForm = getEmptyFormValues();
    if (isEditMode && id) {
      const fetchCompanyData = async () => {
        setPageLoading(true);
        try {
          const actionResult = await dispatch(
            getCompanyByIdAction(id)
          ).unwrap();
          if (actionResult) {
            const transformed = transformApiToFormSchema(actionResult);
            setInitialData({ ...emptyForm, ...transformed });
          } else {
            toast.push(
              <Notification type="danger" title="Fetch Error">
                Partner data not found.
              </Notification>
            );
            navigate("/business-entities/company");
          }
        } catch (error: any) {
          toast.push(
            <Notification type="danger" title="Fetch Error">
              {error?.message || "Error fetching company data."}
            </Notification>
          );
          navigate("/business-entities/company");
        } finally {
          setPageLoading(false);
        }
      };
      fetchCompanyData();
    } else {
      setInitialData(emptyForm);
      setPageLoading(false);
    }
  }, [id, isEditMode, navigate, dispatch]);
  const handleFormSubmit = async (
    formValues: CompanyFormSchema,
    formMethods: UseFormReturn<CompanyFormSchema>
  ) => {
    setIsSubmitting(true);
    const payload = preparePayloadForApi(
      formValues,
      isEditMode,
      initialData || {}
    );
    try {
      if (isEditMode && id) {
        await dispatch(editCompanyAction({ id: id, payload })).unwrap();
        toast.push(
          <Notification type="success" title="Partner Updated">
            Details updated successfully.
          </Notification>
        );
      } else {
        await dispatch(addcompanyAction(payload)).unwrap();
        toast.push(
          <Notification type="success" title="Partner Created">
            New company created successfully.
          </Notification>
        );
      }
      navigate("/business-entities/company");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        `Failed to ${isEditMode ? "update" : "create"} company.`;
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        Object.keys(validationErrors).forEach((key) => {
          let formKey = key as keyof CompanyFormSchema;
          if (key === "address") formKey = "company_address";
          if (key === "gst") formKey = "gst_number";
          formMethods.setError(formKey, {
            type: "manual",
            message: Array.isArray(validationErrors[key])
              ? validationErrors[key][0]
              : validationErrors[key],
          });
        });
        toast.push(
          <Notification type="danger" title="Validation Error">
            Please check the form fields.
          </Notification>
        );
      } else {
        toast.push(
          <Notification
            type="danger"
            title={`${isEditMode ? "Update" : "Creation"} Failed`}
          >
            {errorMessage}
          </Notification>
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const openDiscardDialog = () => setDiscardConfirmationOpen(true);
  const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
  const handleConfirmDiscard = () => {
    closeDiscardDialog();
    navigate("/business-entities/company");
  };
  if (pageLoading)
    return (
      <Container className="h-full flex justify-center items-center">
        <p>Loading company details...</p>
      </Container>
    );
  if (!initialData)
    return (
      <Container className="h-full flex justify-center items-center">
        <p>Initializing form...</p>
      </Container>
    );
  return (
    <Container className="h-full">
      {" "}
      <Form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col min-h-screen"
      >
        {" "}
        <div className="flex-grow">
          {" "}
          <CompanyFormComponent
            onFormSubmit={handleFormSubmit}
            defaultValues={initialData}
            isEditMode={isEditMode}
            onDiscard={openDiscardDialog}
            isSubmitting={isSubmitting}
          />{" "}
        </div>{" "}
        <ConfirmDialog
          isOpen={discardConfirmationOpen}
          type="danger"
          title="Discard Changes"
          onClose={closeDiscardDialog}
          onRequestClose={closeDiscardDialog}
          onCancel={closeDiscardDialog}
          onConfirm={handleConfirmDiscard}
        >
          {" "}
          <p>
            Are you sure you want to discard changes? This cannot be undone.
          </p>{" "}
        </ConfirmDialog>{" "}
      </Form>{" "}
    </Container>
  );
};

export default CreatePartner;