import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormReturn,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { NavLink, useNavigate, useParams } from "react-router-dom";

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
  addpartnerAction,
  editpartnerAction,
  getBrandAction,
  getCategoriesAction,
  getContinentsAction,
  getCountriesAction,
  getMemberAction,
  getMembersAction,
  getpartnerAction,
  getpartnerByIdAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { BiChevronRight } from "react-icons/bi";
import { TbPlus, TbTrash } from "react-icons/tb";
import { useSelector } from "react-redux";
import { z } from "zod";

// --- Type Definitions ---

interface MemberItem {
  member_id?: string | { label: string; value: string };
  designation?: string;
  person_name?: string;
  number?: string;
  type?: string;
  team_name?: string;
}


interface CompanyBankDetailItemFE {
  bank_account_number?: string;
  bank_name?: string | { label: string; value: string };
  ifsc_code?: string;
  verification_photo?: File | string;
  type?: string | { label: string; value: string };
}

interface CertificateItemFE {
  certificate_id?: any;
  certificate_name?: string;
  upload_certificate?: File | string;
}

interface BranchItemFE {
  office_type?: string | { label: string; value: string };
  office_name?: string;
  address?: string;
  country_id?: string | { label: string; value: string };
  state?: string;
  city?: string;
  zip_code?: string;
  gst_number?: string;
}

interface BillingDocItemFE {
  document_name?: string;
  document?: File | string;
}

interface ReferenceItemFE {
  person_name?: string;
  referenced_partner_id?: string | { label: string; value: string };
  number?: string;
  remark?: string;
}

export interface CompanyFormSchema {
  id?: string | number;
  company_profile_settings_id?: any;

  partner_name?: string;
  primary_contact_number?: string;
  primary_contact_number_code?: { label: string; value: string };
  general_contact_number?: string;
  general_contact_number_code?: { label: string; value: string };
  alternate_contact_number?: string;
  alternate_contact_number_code?: { label: string; value: string };
  primary_email_id?: string;
  alternate_email_id?: string;
  ownership_type?: string | { label: string; value: string };
  owner_name?: string;
  partner_address?: string;
  city?: string | { label: string; value: string };
  state?: string | { label: string; value: string };
  zip_code?: string;
  country_id?: string | { label: string; value: string };
  continent_id?: string | { label: string; value: string };
  join_us_as?: string | { label: string; value: string },
  industrial_expertise?: string | { label: string; value: string },
  gst_number?: string;
  pan_number?: string;
  trn_number?: string;
  tan_number?: string;
  establishment_year?: string;
  no_of_employees?: number | string;
  partner_website?: string;
  partner_logo?: File | string;
  primary_business_type?: string | { label: string; value: string };
  primary_business_category?: string;
  sub_category?: Array<{ label: string; value: string }>;
  interested_in?: { label: string; value: string };

  partner_certificate?: CertificateItemFE[];
  office_info?: BranchItemFE[];

  declaration_206ab?: File | string;
  declaration_206ab_remark?: string;
  declaration_206ab_remark_enabled?: boolean;
  agreement_file?: File | string;
  agreement_remark?: string;
  agreement_verified?: boolean;
  office_photo_file?: File | string;
  office_photo_remark?: string;
  office_photo_verified?: boolean;
  gst_certificate_file?: File | string;
  gst_certificate_remark?: string;
  gst_certificate_verified?: boolean;
  authority_letter_file?: File | string;
  authority_letter_remark?: string;
  authority_letter_verified?: boolean;
  visiting_card_file?: File | string;
  visiting_card_remark?: string;
  visiting_card_verified?: boolean;
  cancel_cheque_file?: File | string;
  cancel_cheque_remark?: string;
  cancel_cheque_verified?: boolean;
  aadhar_card_file?: File | string;
  aadhar_card_remark?: string;
  aadhar_card_verified?: boolean;
  pan_card_file?: File | string;
  pan_card_remark?: string;
  pan_card_verified?: boolean;
  other_document_file?: File | string;
  other_document_remark?: string;
  other_document_verified?: boolean;

  primary_account_number?: any;
  primary_bank_name?: string | { label: string; value: string };
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: File | string;
  secondary_account_number?: string;
  secondary_bank_name?: string | { label: string; value: string };
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo?: File | string;
  partner_bank_details?: CompanyBankDetailItemFE[];

  USER_ACCESS?: boolean;
  BILLING_FIELD?: boolean;
  billing_documents?: BillingDocItemFE[];
  DOMAIN_MANAGEMENT_FIELD?: Array<{ label: string; value: string }>;

  member?: MemberItem[];

  status?: string | { label: string; value: string };
  // company_code?: string;
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
  partner_references?: ReferenceItemFE[];
}

export interface FormSectionBaseProps {
  control: Control<CompanyFormSchema>;
  errors: FieldErrors<CompanyFormSchema>;
  formMethods: UseFormReturn<CompanyFormSchema>;
}

interface ApiSingleCompanyItem {
  id: number;
  partner_name?: string;
  company_profile_settings_id?: any;
  status?: string;
  // company_code?: string;
  primary_contact_number?: string;
  primary_contact_number_code?: string;
  general_contact_number?: string;
  general_contact_number_code?: string;
  alternate_contact_number?: string;
  alternate_contact_number_code?: string;
  primary_email_id?: string;
  alternate_email_id?: string;
  ownership_type?: string;
  owner_name?: string;
  partner_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country_id?: string;
  continent_id?: string;
  industrial_expertise?: string;
  join_us_as?: string;
  continent?: any | {};
  brands?: string;
  category?: string;
  sub_category?: string;
  interested_in?: string;
  kyc_verified?: boolean | "Yes" | "No";
  enable_billing?: boolean | "Yes" | "No";
  billing_documents?: any[];
  domain_id?: string;
  primary_account_number?: string;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: string;
  secondary_account_number?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo?: string;
  support_email?: string;
  mobile?: string;
  partner_logo?: string;
  gst_number?: string;
  pan_number?: string;
  tan_number?: string;
  company_type?: string;
  trn_number?: string;
  establishment_year?: string;
  no_of_employees?: number;
  partner_website?: string;
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
  agreement_file?: string;
  agreement_verified?: boolean | string;
  agreement_remark?: string;
  office_photo_file?: string;
  office_photo_verified?: boolean | string;
  office_photo_remark?: string;
  gst_certificate_file?: string;
  gst_certificate_verified?: boolean | string;
  gst_certificate_remark?: string;
  authority_letter_file?: string;
  authority_letter_verified?: boolean | string;
  authority_letter_remark?: string;
  visiting_card_file?: string;
  visiting_card_verified?: boolean | string;
  visiting_card_remark?: string;
  cancel_cheque_file?: string;
  cancel_cheque_verified?: boolean | string;
  cancel_cheque_remark?: string;
  aadhar_card_file?: string;
  aadhar_card_verified?: boolean | string;
  aadhar_card_remark?: string;
  pan_card_file?: string;
  pan_card_verified?: boolean | string;
  pan_card_remark?: string;
  other_document_file?: string;
  other_document_verified?: boolean | string;
  other_document_remark?: string;

  company_spot_verification?: any[];
  partner_team_members?: any[],
  company_member_management?: any[];
  partner_bank_details?: any[];
  office_info?: any[];
  partner_certificate?: any[];
  partner_references?: any[];
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (apiData: ApiSingleCompanyItem, data: any = []): Partial<CompanyFormSchema> => {
  const kycVerifyToBoolean = (verifyValue: boolean | string = false): boolean => {
    if (typeof verifyValue === "string") {
      return (
        verifyValue.toLowerCase() !== "" ||
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
    partner_name: apiData.partner_name,
    primary_contact_number: apiData.primary_contact_number,
    primary_contact_number_code: apiData.primary_contact_number_code
      ? {
        label: apiData.primary_contact_number_code,
        value: apiData.primary_contact_number_code,
      }
      : undefined,
    general_contact_number: apiData.general_contact_number,
    general_contact_number_code: apiData.general_contact_number_code
      ? {
        label: apiData.general_contact_number_code,
        value: apiData.general_contact_number_code,
      }
      : undefined,
    alternate_contact_number: apiData.alternate_contact_number,
    alternate_contact_number_code: apiData.alternate_contact_number_code
      ? {
        label: apiData.alternate_contact_number_code,
        value: apiData.alternate_contact_number_code,
      }
      : undefined,
    primary_email_id: apiData.primary_email_id,
    alternate_email_id: apiData.alternate_email_id,
    ownership_type: apiData.ownership_type
      ? { label: apiData.ownership_type, value: apiData.ownership_type }
      : undefined,
    owner_name: apiData.owner_name,
    partner_address: apiData.partner_address,
    city: apiData.city,
    state: apiData.state,
    zip_code: apiData.zip_code,
    country_id: apiData.country_id
      ? { label: apiData.country_id, value: apiData.country_id }
      : undefined,
    continent_id: apiData.continent_id  
      ? { label: apiData?.continent?.name, value: apiData.continent_id }
      : undefined,
    join_us_as: apiData.join_us_as
      ? { label: apiData?.continent?.name, value: apiData.join_us_as }
      : undefined,
    industrial_expertise: apiData.industrial_expertise
      ? { label: apiData?.continent?.name, value: apiData.industrial_expertise }
      : undefined,
    gst_number: apiData.gst_number,
    pan_number: apiData.pan_number,
    trn_number: apiData.trn_number,
    tan_number: apiData.tan_number,
    establishment_year: apiData.establishment_year,
    no_of_employees: apiData.no_of_employees,
    partner_website: apiData.partner_website,
    partner_logo: apiData.partner_logo,
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
    partner_certificate: apiData.partner_certificate,
    office_info: apiData.office_info?.map((b) => ({
      office_type: b.office_type
        ? { label: b.office_type, value: b.office_type }
        : undefined,
      office_name: b.office_name,
      address: b.address,
      country_id: b.country_id
        ? { label: b.country_id, value: b.country_id }
        : undefined,
      state: b.state,
      city: b.city,
      zip_code: b.zip_code,
      gst_number: b.gst_number,
    })),
    agreement_file: apiData.agreement_file,
    agreement_verified: kycVerifyToBoolean(apiData.agreement_verified),
    agreement_remark: apiData.agreement_remark,
    office_photo_file: apiData.office_photo_file,
    office_photo_verified: kycVerifyToBoolean(apiData.office_photo_verified),
    office_photo_remark: apiData.office_photo_remark,
    gst_certificate_file: apiData.gst_certificate_file,
    gst_certificate_verified: kycVerifyToBoolean(apiData.gst_certificate_verified),
    gst_certificate_remark: apiData.gst_certificate_remark,
    authority_letter_file: apiData.authority_letter_file,
    authority_letter_verified: kycVerifyToBoolean(apiData.authority_letter_verified),
    authority_letter_remark: apiData.authority_letter_remark,
    visiting_card_file: apiData.visiting_card_file,
    visiting_card_verified: kycVerifyToBoolean(apiData.visiting_card_verified),
    visiting_card_remark: apiData.visiting_card_remark,
    cancel_cheque_file: apiData.cancel_cheque_file,
    cancel_cheque_verified: kycVerifyToBoolean(apiData.cancel_cheque_verified),
    cancel_cheque_remark: apiData.cancel_cheque_remark,
    aadhar_card_file: apiData.aadhar_card_file,
    aadhar_card_verified: kycVerifyToBoolean(apiData.aadhar_card_verified),
    aadhar_card_remark: apiData.aadhar_card_remark,
    pan_card_file: apiData.pan_card_file,
    pan_card_verified: kycVerifyToBoolean(apiData.pan_card_verified),
    pan_card_remark: apiData.pan_card_remark,
    other_document_file: apiData.other_document_file,
    other_document_verified: kycVerifyToBoolean(apiData.other_document_verified),
    other_document_remark: apiData.other_document_remark,
    primary_account_number: apiData.primary_account_number,
    primary_bank_name: apiData.primary_bank_name,
    primary_ifsc_code: apiData.primary_ifsc_code,
    primary_bank_verification_photo: apiData.primary_bank_verification_photo,
    secondary_account_number: apiData.secondary_account_number,
    secondary_bank_name: apiData.secondary_bank_name,
    secondary_ifsc_code: apiData.secondary_ifsc_code,
    secondary_bank_verification_photo:
      apiData.secondary_bank_verification_photo,

    partner_bank_details: apiData.partner_bank_details?.map((b) => ({
      bank_account_number: b.bank_account_number,
      bank_name: b.bank_name,
      ifsc_code: b.ifsc_code,
      type: b.type
        ? { label: String(b.type), value: String(b.type) }
        : undefined,
      verification_photo: b.verification_photo,
    })),
    USER_ACCESS: kycVerifyToBoolean(apiData.kyc_verified),
    BILLING_FIELD: kycVerifyToBoolean(apiData.enable_billing),
    billing_documents: apiData.billing_documents?.map((doc) => ({
      document_name: doc.document_name,
      document: doc.document,
    })),
    DOMAIN_MANAGEMENT_FIELD: stringToSelectArray(apiData.domain_id),
    member: apiData.partner_team_members?.map((m) => ({
      type: "team",
      member: m.member_id ? { label: `Member ${m.member_id}`, value: String(m.member_id) } : undefined,
      designation: m.designation,
      person_name: m.person_name,
      team_name: m.team_name,
      number: m.number,
    })),
    status: apiData.status
      ? { label: apiData.status, value: apiData.status }
      : undefined,
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
    // company_spot_verification: apiData.company_spot_verification?.map(
    //   (item) => ({
    //     verified: kycVerifyToBoolean(item.verified),
    //     verified_by_name: item.verified_by_name,
    //     remark: item.remark,
    //     photo_upload: (item as any).photo_upload_url || item.photo_upload,
    //   })
    // ),
    partner_references: apiData.partner_references?.map((ref) => ({
      person_name: ref.person_name,
      referenced_partner_id: data?.find((value: any) => value.value == ref.partner_id) ?? ref.partner_id,
      number: ref.number,
      remark: ref.remark,
    })),
  };
};

// Helper to prepare payload for API submission (both ADD and EDIT)
const preparePayloadForApi = (
  formData: CompanyFormSchema,
  isEditMode: boolean
): FormData => {
  const apiPayload = new FormData();
  const data: any = { ...formData }; // Use a shorter name

  // --- 1. A simpler, more reliable helper for appending data ---
  const append = (key: string, value: any) => {
    // This helper handles the most common cases. Complex arrays are handled separately.
    if (value === null || value === undefined) {
      apiPayload.append(key, "");
    } else if (typeof value === 'boolean') {
      apiPayload.append(key, value ? "1" : "0");
    } else if (typeof value === 'object' && !Array.isArray(value) && value.value !== undefined) {
      // Handles { value, label } objects from Select components
      apiPayload.append(key, value.value);
    } else if (Array.isArray(value)) {
      // Handles simple arrays from multi-selects by joining their values
      const simpleValues = value.map(item => (typeof item === 'object' && item.value) ? item.value : item);
      apiPayload.append(key, simpleValues.join(','));
    } else {
      // Handles strings, numbers, and files
      apiPayload.append(key, value);
    }
  };

  // --- 2. Append all simple, top-level fields ---
  if (isEditMode && data.id) {
    apiPayload.append("id", String(data.id));
  }

  append("partner_name", data.partner_name);
  append("owner_name", data.owner_name);
  append("partner_address", data.partner_address);
  append("support_email", data.support_email);
  append("status", data.status);
  append("gst_number", data.gst_number);
  append("pan_number", data.pan_number);
  append("country_id", data.country_id);
  append("join_us_as", data.join_us_as);
  append("continent_id", data.continent_id);
  append("industrial_expertise", data.industrial_expertise);
  append("state", data.state);
  append("city", data.city);
  append("zip_code", data.zip_code);
  append("primary_email_id", data.primary_email_id);
  append("primary_contact_number", data.primary_contact_number);
  append("primary_contact_number_code", data.primary_contact_number_code);
  append("general_contact_number", data.general_contact_number);
  append("general_contact_number_code", data.general_contact_number_code);
  append("alternate_email_id", data.alternate_email_id);
  append("alternate_contact_number", data.alternate_contact_number);
  append("alternate_contact_number_code", data.alternate_contact_number_code);
  append("ownership_type", data.ownership_type);
  append("tan_number", data.tan_number);
  append("trn_number", data.trn_number);
  append("establishment_year", data.establishment_year);
  append("no_of_employees", data.no_of_employees);
  append("partner_website", data.partner_website);
  append("notification_email", data.notification_email);
  append("kyc_verified", data.USER_ACCESS);
  append("enable_billing", data.BILLING_FIELD);

  // Handle file upload for logo
  append("partner_logo", data.partner_logo);

  // Handle multi-selects explicitly
  append("brands", data.brands);
  append("category", data.category);
  append("sub_category", data.sub_category);

  // --- 3. Handle complex arrays EXPLICITLY ---

  // Bank Details
  append("primary_account_number", data.primary_account_number);
  append("primary_bank_name", data.primary_bank_name);
  append("primary_ifsc_code", data.primary_ifsc_code);
  append("primary_bank_verification_photo", data.primary_bank_verification_photo);

  append("secondary_account_number", data.secondary_account_number);
  append("secondary_bank_name", data.secondary_bank_name);
  append("secondary_ifsc_code", data.secondary_ifsc_code);
  append("secondary_bank_verification_photo", data.secondary_bank_verification_photo);

  const allBankDetails: any = [];
  if (data.partner_bank_details) {
    data.partner_bank_details.forEach(bank => {
      if (bank.bank_account_number) allBankDetails.push(bank);
    });
  }

  allBankDetails.forEach((bank: any, index: number) => {
    apiPayload.append(`partner_bank_details[${index}][bank_account_number]`, bank.bank_account_number || '');
    apiPayload.append(`partner_bank_details[${index}][bank_name]`, (typeof bank.bank_name === 'object' ? bank.bank_name?.value : bank.bank_name) || '');
    apiPayload.append(`partner_bank_details[${index}][ifsc_code]`, bank.ifsc_code || '');
    apiPayload.append(`partner_bank_details[${index}][type]`, bank.type?.value || 'Other');
    apiPayload.append(`partner_bank_details[${index}][verification_photo]`, bank.verification_photo);
  });

  // Certificates
  if (data.partner_certificate) {
    data.partner_certificate.forEach((cert, index) => {
      const certIdValue = (typeof cert.certificate_id === 'object' ? cert.certificate_id?.value : cert.certificate_id);
      if (certIdValue) { // Only append if a certificate type was selected
        apiPayload.append(`partner_certificate[${index}][certificate_id]`, String(certIdValue));
        apiPayload.append(`partner_certificate[${index}][certificate_name]`, cert.certificate_name || "");
        apiPayload.append(`partner_certificate[${index}][upload_certificate]`, cert.upload_certificate);
      }
    });
  }

  // Members
  if (data.member) {
    data.member.forEach((member, index) => {
      apiPayload.append(`partner_team_members[${index}][team_name]`, member.team_name || '');
      apiPayload.append(`partner_team_members[${index}][designation]`, member.designation || '');
      apiPayload.append(`partner_team_members[${index}][person_name]`, member.person_name || '');
      apiPayload.append(`partner_team_members[${index}][number]`, member.number || '');
    });

  }

  // References
  if (data.partner_references) {
    data.partner_references.forEach((ref, index) => {
      apiPayload.append(`partner_references[${index}][person_name]`, ref.person_name || "");
      apiPayload.append(`partner_references[${index}][referenced_partner_id]`, (typeof ref.referenced_partner_id === 'object' ? ref.referenced_partner_id?.value : ref.referenced_partner_id) || "");
      apiPayload.append(`partner_references[${index}][number]`, ref.number || "");
      apiPayload.append(`partner_references[${index}][remark]`, ref.remark || "");
    });
  }
  if (data.billing_documents) {
    data.billing_documents.forEach((ref, index) => {
      apiPayload.append(`billing_documents[${index}][document_name]`, ref.document_name || "");
      apiPayload.append(`billing_documents[${index}][document]`, ref.document || "");
    });
  }
  if (data.office_info) {
    data.office_info.forEach((ofice, index) => {
      apiPayload.append(`office_info[${index}][office_type]`, (typeof ofice.office_type === 'object' ? ofice.office_type?.value : ofice.office_type) || "")
      apiPayload.append(`office_info[${index}][office_name]`, ofice.office_name || "");
      apiPayload.append(`office_info[${index}][country_id]`, (typeof ofice.country_id === 'object' ? ofice.country_id?.value : ofice.country_id) || "");
      apiPayload.append(`office_info[${index}][state]`, ofice.state || "");
      apiPayload.append(`office_info[${index}][city]`, ofice.city || "");
      apiPayload.append(`office_info[${index}][zip_code]`, ofice.zip_code || "");
      apiPayload.append(`office_info[${index}][gst_number]`, ofice.gst_number || "");
      apiPayload.append(`office_info[${index}][address]`, ofice.address || "");
    });
  }

  // (Apply the same explicit forEach pattern for other arrays like branches, references, etc.)

  // --- 4. KYC Documents (Your existing logic for this is good) ---
  const kycDocsConfig = [
    { feFile: "agreement_file", beFile: "declaration_194Q", feVerify: "agreement_verified", beVerify: "agreement_verified", feRemark: "agreement_remark", beRemark: "agreement_remark" },
    { feFile: "office_photo_file", beFile: "office_photo", feVerify: "office_photo_verified", beVerify: "office_photo_verified", feRemark: "office_photo_remark", beRemark: "office_photo_remark" },
    { feFile: "gst_certificate_file", beFile: "gst_certificate", feVerify: "gst_certificate_verified", beVerify: "gst_certificate_verified", feRemark: "gst_certificate_remark", beRemark: "gst_certificate_remark" },
    { feFile: "authority_letter_file", beFile: "authority_letter", feVerify: "authority_letter_verified", beVerify: "authority_letter_verified", feRemark: "authority_letter_remark", beRemark: "authority_letter_remark" },
    { feFile: "visiting_card_file", beFile: "visiting_card", feVerify: "visiting_card_verified", beVerify: "visiting_card_verified", feRemark: "visiting_card_remark", beRemark: "visiting_card_remark" },
    { feFile: "cancel_cheque_file", beFile: "cancel_cheque", feVerify: "cancel_cheque_verified", beVerify: "cancel_cheque_verified", feRemark: "cancel_cheque_remark", beRemark: "cancel_cheque_remark" },
    { feFile: "aadhar_card_file", beFile: "aadhar_card", feVerify: "aadhar_card_verified", beVerify: "aadhar_card_verified", feRemark: "aadhar_card_remark", beRemark: "aadhar_card_remark" },
    { feFile: "pan_card_file", beFile: "pan_card", feVerify: "pan_card_verified", beVerify: "pan_card_verified", feRemark: "pan_card_remark", beRemark: "pan_card_remark" },
    { feFile: "other_document_file", beFile: "other_document", feVerify: "other_document_verified", beVerify: "other_document_verified", feRemark: "other_document_remark", beRemark: "other_document_remark" },
  ];

  kycDocsConfig.forEach((doc: any) => {
    apiPayload.append(doc.feFile, data[doc.feFile]);
    apiPayload.append(doc.beVerify, data[doc.feVerify] ? "1" : "0");
    apiPayload.append(doc.beRemark, data[doc.feRemark] || "");
  });

  // For debugging:
  for (let [key, value] of apiPayload.entries()) {
    console.log(`${key}:`, value);
  }

  return apiPayload;
};

// --- Navigator Component ---
const companyNavigationList = [
  { label: "Partner Details", link: "PartnerDetails" },
  { label: "KYC Documents", link: "kycDocuments" },
  { label: "Bank Details", link: "bankDetails" },
  { label: "Reference", link: "reference" },
  { label: "Accessibility", link: "accessibility" },
  { label: "Member Management", link: "memberManagement" },
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
    value: `${c.phone_code}`,
    label: `${c.phone_code} (${c.iso_code})`,
  }));
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
    { value: "LLP", label: "LLP" },
    { value: "One Person Company (OPC)", label: "One Person Company (OPC)" },
    { value: "Manufacturer", label: "Manufacturer" },
    { value: "Exporter / Importer", label: "Exporter / Importer" },
    { value: "Distributor / Wholesaler", label: "Distributor / Wholesaler" },
    { value: "Retailer", label: "Retailer" },
    { value: "Trader / Merchant", label: "Trader / Merchant" },
    { value: "Franchise / Dealer", label: "Franchise / Dealer" },
    { value: "Government Organization", label: "Government Organization" },
    { value: "NGO / Trust / Society", label: "NGO / Trust / Society" },
    { value: "Foreign Company", label: "Foreign Company" },
  ];
  const statusOptions = [
    { value: "Verified", label: "Verified" },
    { value: "Non Verified", label: "Non Verified" },
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
    control,
    name: "partner_certificate",
  });
  const {
    fields: branchFields,
    append: appendBranch,
    remove: removeBranch,
  } = useFieldArray({ control, name: "office_info" });
  const companyLogoBrochureValue = watch("partner_logo");
  return (
    <Card id="companyDetails">
      <h4 className="mb-4">Primary Information</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
          invalid={!!errors.partner_name}
          className=""
          errorMessage={errors.partner_name?.message as string}
        >
          <Controller
            name="partner_name"
            control={control}
            render={({ field }) => (
              <Input placeholder="Partner Name" {...field} />
            )}
          />
        </FormItem>

        <FormItem
          label={<div>Owner/Director Name<span className="text-red-500"> * </span></div>}
          invalid={!!errors.owner_name}
          errorMessage={
            errors.owner_name?.message as string
          }
        >
          <Controller
            name="owner_name"
            control={control}
            render={({ field }) => (
              <Input placeholder="Owner/Director Name" {...field} />
            )}
          />
        </FormItem>


      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">

        <FormItem
          label={<div>Ownership Type<span className="text-red-500"> * </span></div>}
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
                  { label: "Logistics", value: "Logistics" },
                  { label: "CHA", value: "CHA" },
                  { label: "Account", value: "Account" },
                  { label: "CA", value: "CA" },
                  { label: "Sales Consultant", value: "Sales Consultant" },
                  { label: "HR Related Services", value: "HR Related Services" },
                  { label: "Finance", value: "Finance" },
                  { label: "Banking", value: "Banking" },
                  { label: "IT", value: "IT" },
                  { label: "Non IT Hardware", value: "Non IT Hardware" },
                  { label: "Retail", value: "Retail" },
                  { label: "Non Profit", value: "Non Profit" },
                  { label: "Others", value: "Others" },
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
                  { label: "Team", value: "Team" },
                  { label: "Remote Partner", value: "Remote Partner" },
                  { label: "Consultant", value: "Consultant" },
                  { label: "Auditor", value: "Auditor" },
                  { label: "Other", value: "Other" },
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
          invalid={!!errors.continent_id}
          errorMessage={errors.continent_id?.message as string}
        >
          <Controller
            name="continent_id"
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
          invalid={!!errors.country_id}
          errorMessage={errors.country_id?.message as string}
        >
          <Controller
            name="country_id"
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
          label={<div>State<span className="text-red-500"> * </span></div>}
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
          label={<div>City<span className="text-red-500"> * </span></div>}
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
          invalid={!!errors.zip_code}
          errorMessage={errors.zip_code?.message as string}
        >
          <Controller
            name="zip_code"
            control={control}
            render={({ field }) => <Input placeholder="ZIP Code" {...field} />}
          />
        </FormItem>
        <FormItem
          label="Company Address"
          invalid={!!errors.partner_address}
          errorMessage={errors.partner_address?.message as string}
          className="md:col-span-5"
        >
          <Controller
            name="partner_address"
            control={control}
            render={({ field }) => (
              <Input placeholder="Company Address" {...field} />
            )}
          />
        </FormItem>
      </div>
      <hr className="my-6" /> <h4 className="mb-4">Contact Information</h4>{" "}
      <div className="sm:grid md:grid-cols-12 gap-3">
        <FormItem
          className="sm:col-span-6 lg:col-span-3"
          label={<div>Primary Email ID<span className="text-red-500"> * </span></div>}
          invalid={!!errors.primary_email_id}
          errorMessage={errors.primary_email_id?.message as string}
        >
          <Controller
            name="primary_email_id"
            control={control}
            render={({ field }) => (
              <Input type="email" placeholder="Primary Email" {...field} />
            )}
          />
        </FormItem>
        <FormItem
          className="sm:col-span-6 lg:col-span-3"
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
          className="sm:col-span-6 lg:col-span-3"
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
        <FormItem label="Notification Email" className="sm:col-span-6 lg:col-span-3">
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
        <FormItem
          className="sm:col-span-6 lg:col-span-4"
          label={<div>Primary Contact Number<span className="text-red-500"> * </span></div>}
          invalid={!!errors.primary_contact_number}
          errorMessage={
            errors.primary_contact_number?.message as string
          }
        >
          <div className="flex items-center gap-2">
            <Controller
              name="primary_contact_number_code"
              control={control}
              render={({ field }) => (
                <Select
                  options={countryCodeOptions}
                  className="w-58"
                  {...field}
                />
              )}
            />
            <Controller
              name="primary_contact_number"
              control={control}
              render={({ field }) => (
                <Input placeholder="Primary Contact" {...field} />
              )}
            />
          </div>
        </FormItem>
        <FormItem className="sm:col-span-6 lg:col-span-4" label="Alternate Contact Number">
          <div className="flex items-center gap-2">
            <Controller
              name="alternate_contact_number_code"
              control={control}
              render={({ field }) => (
                <Select
                  options={countryCodeOptions}
                  className="w-58"
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

        <FormItem className="sm:col-span-6 lg:col-span-4" label="General Mobile">
          <div className="flex items-center gap-2">
            <Controller
              name="general_contact_number_code"
              control={control}
              render={({ field }) => (
                <Select
                  options={countryCodeOptions}
                  className="w-58"
                  {...field}
                />
              )}
            />
            <Controller
              name="general_contact_number"
              control={control}
              render={({ field }) => (
                <Input placeholder="Company Mobile" {...field} />
              )}
            />
          </div>
        </FormItem>{" "}

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
      <hr className="my-6" /> <h4 className="mb-4">Company Information</h4>{" "}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
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
        <FormItem
          label="Establishment Year"
          invalid={!!errors.establishment_year}
          errorMessage={errors.establishment_year?.message as string}
        >
          <Controller
            name="establishment_year"
            control={control}
            render={({ field }) => (
              <Input placeholder="YYYY" maxLength={4} {...field} />
            )}
          />
        </FormItem>{" "}

        <FormItem
          label="Partner Website"
          invalid={!!errors.partner_website}
          errorMessage={errors.partner_website?.message as string}
        >
          <Controller
            name="partner_website"
            control={control}
            render={({ field }) => (
              <Input type="url" placeholder="https://example.com" {...field} />
            )}
          />
        </FormItem>{" "}
        <FormItem
          label="Partner Logo/Brochure"
          invalid={!!errors.partner_logo}
          errorMessage={errors.partner_logo?.message as string}
        >
          <Controller
            name="partner_logo"
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
                src={`https://aazovo.codefriend.in/${companyLogoBrochureValue}`}
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
          label="Company Type"
          invalid={!!errors.company_type}
          errorMessage={errors.company_type?.message as string}
        >
          <Controller
            name="company_type"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select Company Type"
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
        const uploadCertificateValue = watch(`partner_certificate.${index}.upload_certificate`);
        return (
          <Card key={item.id} className="mb-4 rounded-md border border-black" bodyClass="p-4">
            <div className="grid md:grid-cols-10 gap-3 items-center">
              <FormItem label="Certificate ID" className="col-span-3">
                <Controller
                  name={`partner_certificate.${index}.certificate_id`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="e.g., 12345" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="Certificate Name" className="col-span-3">
                <Controller
                  name={`partner_certificate.${index}.certificate_name`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="e.g., ISO 9001" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="Upload Certificate" className="col-span-3">
                <Controller
                  name={`partner_certificate.${index}.upload_certificate`}
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
              <div className="text-right">
                <Button
                  type="button"
                  shape="circle"
                  size="sm"
                  icon={<TbTrash />}
                  className="md:mt-2"
                  onClick={() => removeCert(index)}
                  danger
                />

              </div>
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
              office_name: "",
              address: "",
              country_id: undefined,
              state: undefined,
              zip_code: "",
              gst_number: "",
            })
          }
        >
          Add Office
        </Button>
      </div>{" "}
      {branchFields.map((item, index) => (
        <Card key={item.id} className="mb-4 border rounded-md border-black relative">
          <div className="grid md:grid-cols-3 gap-3">
            <FormItem label="Office Type">
              <Controller
                name={`office_info.${index}.office_type`}
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
                name={`office_info.${index}.office_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="e.g. Main Office" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="GST/REG Number">
              <Controller
                name={`office_info.${index}.gst_number`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="GST or Registration Number" {...field} />
                )}
              />
            </FormItem>
            <div className="col-span-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormItem label="Country">
                <Controller
                  name={`office_info.${index}.country_id`}
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
                  name={`office_info.${index}.state`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Enter state" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="ZIP Code">
                <Controller
                  name={`office_info.${index}.zip_code`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="ZIP Code" {...field} />
                  )}
                />
              </FormItem>
            </div>

            <FormItem label="Address" className="md:col-span-3">
              <Controller
                name={`office_info.${index}.address`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Full Address" {...field} />
                )}
              />
            </FormItem>
            <div className="md:col-span-3 flex justify-end absolute right-2 top-2">
              <Button
                type="button"
                size="sm"
                variant="plain"
                className="text-xs"
                icon={<TbTrash size={16} />}
                onClick={() => removeBranch(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        </Card>
      ))}{" "}
    </Card>
  );
};

// --- KYCDetailSection ---
const KYCDetailSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const kycDocs = [
    {
      label: "Aadhar Card",
      name: "aadhar_card_file" as const,
      remarkName: "aadhar_card_remark" as const,
      enabledName: "aadhar_card_verified" as const,
    },
    {
      label: "PAN Card",
      name: "pan_card_file" as const,
      remarkName: "pan_card_remark" as const,
      enabledName: "pan_card_verified" as const,
    },
    {
      label: "GST Certificate",
      name: "gst_certificate_file" as const,
      remarkName: "gst_certificate_remark" as const,
      enabledName: "gst_certificate_verified" as const,
    },

    {
      label: "Visiting Card",
      name: "visiting_card_file" as const,
      remarkName: "visiting_card_remark" as const,
      enabledName: "visiting_card_verified" as const,
    },
    {
      label: "Office Photo",
      name: "office_photo_file" as const,
      remarkName: "office_photo_remark" as const,
      enabledName: "office_photo_verified" as const,
    },

    {
      label: "Authority Letter",
      name: "authority_letter_file" as const,
      remarkName: "authority_letter_remark" as const,
      enabledName: "authority_letter_verified" as const,
    },
    {
      label: "Cancel Cheque",
      name: "cancel_cheque_file" as const,
      remarkName: "cancel_cheque_remark" as const,
      enabledName: "cancel_cheque_verified" as const,
    },
    {
      label: "agreement/Quotation",
      name: "agreement_file" as const,
      remarkName: "agreement_remark" as const,
      enabledName: "agreement_verified" as const,
    },
    // {
    //   label: "206AB Declaration",
    //   name: "declaration_206ab" as const,
    //   remarkName: "declaration_206ab_remark" as const,
    //   enabledName: "declaration_206ab_remark_enabled" as const,
    // },
    {
      label: "Other Document",
      name: "other_document_file" as const,
      remarkName: "other_document_remark" as const,
      enabledName: "other_document_verified" as const,
    },
  ];
  return (
    <Card id="kycDocuments">
      {" "}
      <h5 className="mb-4">Current Documents</h5>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
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
              <label className="flex items-center gap-2 mb-1">
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
                      src={`https://aazovo.codefriend.in/${fileValue}`}
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
    name: "partner_bank_details",
  });
  const primaryBankPhotoValue = watch("primary_bank_verification_photo");
  const secondaryBankPhotoValue = watch("secondary_bank_verification_photo");
  return (
    <Card id="bankDetails">
      {" "}
      <h4 className="mb-6">Bank Details (Primary)</h4>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
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
                src={`https://aazovo.codefriend.in/${primaryBankPhotoValue}`}
                alt="Primary bank photo"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>{" "}
      </div>{" "}
      <hr className="my-3" /> <h4 className="mb-6">Bank Details (Secondary)</h4>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
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
                src={`https://aazovo.codefriend.in/${secondaryBankPhotoValue}`}
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
              verification_photo: undefined,
              type: undefined,
            })
          }
        >
          Add More Banks
        </Button>
      </div>{" "}
      {fields.map((item, index) => {
        const bankPhotoValue = watch(
          `partner_bank_details.${index}.verification_photo`
        );
        return (
          <Card key={item.id} className="mb-4 border-black relative rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 items-start">
              <FormItem label={`Type`}>
                <Controller
                  name={`partner_bank_details.${index}.type`}
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
                  name={`partner_bank_details.${index}.bank_account_number`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Account No." {...field} />
                  )}
                />
              </FormItem>
              <FormItem label={`Bank Name`}>
                <Controller
                  name={`partner_bank_details.${index}.bank_name`}
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
                  name={`partner_bank_details.${index}.ifsc_code`}
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
                  name={`partner_bank_details.${index}.verification_photo`}
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
                    src={`https://aazovo.codefriend.in/${bankPhotoValue}`}
                    alt={`Bank ${index + 1} photo`}
                    className="mt-2 h-16 w-auto"
                  />
                )}
              </FormItem>
              <div className="flex absolute justify-center right-0 top-2">
                <Button
                  type="button"
                  size="sm"
                  variant="plain"
                  className="text-xs"
                  icon={<TbTrash size={16} />}
                  onClick={() => remove(index)}
                >Remove
                </Button>
              </div>
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
  const { partnerData = [] } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getpartnerAction());
  }, [dispatch]);
  const companyOptions = partnerData?.data?.map((c: any) => ({
    value: String(c.id),
    label: c.partner_name,
  }));
  const { fields, append, remove } = useFieldArray({
    control,
    name: "partner_references",
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
              referenced_partner_id: "",
              number: "",
              remark: "",
            })
          }
        >
          Add Reference
        </Button>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border-black relative rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 items-start">
            <FormItem label="Person Name">
              <Controller
                name={`partner_references.${index}.person_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Person's Name" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="partner Name">
              <Controller
                name={`partner_references.${index}.referenced_partner_id`}
                control={control}
                render={({ field }) => (
                  <Select
                    placeholder="partner Name"
                    options={companyOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Contact Number">
              <Controller
                name={`partner_references.${index}.number`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Contact Number" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Remark" className="sm:col-span-3">
              <Controller
                name={`partner_references.${index}.remark`}
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
          <div className="md:col-span-3 flex justify-end absolute right-2 top-2">
            <Button
              type="button"
              variant="plain"
              size="sm"
              icon={<TbTrash size={16} />}
              onClick={() => remove(index)}
            >Remove
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
      <div className="grid grid-cols-1 gap-y-6">
        {" "}
        <div className="flex items-center gap-x-8">
          {" "}
          {/* <FormItem label="KYC Verified">
            <Controller
              name="KYC_FIELD"
              control={control}
              render={({ field }) => (
                <Checkbox checked={!!field.value} onChange={field.onChange}>
                  Enabled
                </Checkbox>
              )}
            />
          </FormItem>{" "} */}
          <FormItem label={<div>Enable Billing<span className="text-red-500"> * </span></div>}>
            <Controller
              name="BILLING_FIELD"
              control={control}
              render={({ field }) => (
                <Checkbox checked={!!field.value} onChange={field.onChange}>
                  Enabled
                </Checkbox>
              )}
            />
          </FormItem>{" "}
          <FormItem label={<div>User Access<span className="text-red-500"> * </span></div>}>
            <Controller
              name="USER_ACCESS"
              control={control}
              render={({ field }) => (
                <Checkbox checked={!!field.value} onChange={field.onChange}>
                  Enabled
                </Checkbox>
              )}
            />
          </FormItem>{" "}
        </div>{" "}
        <hr />{" "}
        <div className="flex justify-between items-center">
          <h5 className="mb-0">Transaction Documents</h5>
          <Button
            type="button"
            icon={<TbPlus />}
            size="sm"
            onClick={() =>
              append({ document_name: "", document: undefined })
            }
          >
            Add Transaction Doc
          </Button>
        </div>
        {fields.map((item, index) => {
          const docFileValue = watch(`billing_documents.${index}.document`);
          return (
            <Card key={item.id} className=" border-black rounded-md" bodyClass="p-4">
              <div className="md:grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
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
                    name={`billing_documents.${index}.document`}
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
                  icon={<TbTrash />}
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
  const dispatch = useAppDispatch();
  const { memberData } = useSelector(masterSelector);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "member",
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

  useEffect(() => {
    dispatch(getMemberAction());
  }, [dispatch]);
  return (
    <Card id="memberManagement">
      {" "}
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Member Management</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            icon={<TbPlus />}
            onClick={() =>
              append({
                type: "team",
                member_id: undefined, // ignored for team
                designation: "",
                person_name: "",
                number: "",
              })
            }

          >
            Add Team
          </Button>
        </div>
      </div>{" "}
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border-black relative rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
            <FormItem label={item.type === "team" ? "Team Name" : "Member"}>
              <Controller
                name={`member.${index}.${item.type === "team" ? "team_name" : "member_id"}`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Team Name" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Designation">
              <Controller
                name={`member.${index}.designation`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="e.g., CEO" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Person Name">
              <Controller
                name={`member.${index}.person_name`}
                control={control}
                render={({ field }) => (
                  <Input placeholder="Person Name" {...field} />
                )}
              />
            </FormItem>
            <FormItem label="Contact Number">
              <Controller
                name={`member.${index}.number`}
                control={control}
                render={({ field }) => (
                  <Input type="tel" placeholder="Contact Number" {...field} />
                )}
              />
            </FormItem>
            <div className="absolute right-0 top-2">
              <Button
                type="button"
                variant="plain"
                size="sm"
                className="text-xs"
                icon={<TbTrash size={16} />}
                onClick={() => remove(index)}
              >
                Remove
              </Button>
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
      partner_name: z.string().trim().min(1, { message: "Company Name is Required!" }),
      owner_name: z.string().trim().min(1, { message: "Owner/Director Name is Required!" }),
      gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
        message: "Invalid GST number format",
      }),
      pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
        message: "Invalid PAN card number format",
      }),
      city: z.string().trim().min(1, { message: "City Name is Required!" }),
      state: z.string().trim().min(1, { message: "State Name is Required!" }),
      primary_email_id: z
        .string()
        .trim()
        .min(1, { message: "Email is Required !" })
        .email("Invalid email format"),
      status: z
        .object({ value: z.string(), label: z.string() })
        .optional()
        .nullable(),
      primary_contact_number: z
        .string()
        .trim()
        .min(1, { message: "Primary contact number is required!" })
        .regex(/^\+?\d{7,15}$/, { message: "Invalid contact number format" }),
      // partner_website: z
      //   .string()
      //   .url({ message: "Invalid website URL" })
      //   .optional()
      //   .or(z.literal("")),
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
    getValues,
  } = formMethods;
  useEffect(() => {
    const initialValues = defaultValues || {};
    const fullInitialValues: Partial<CompanyFormSchema> = {
      member: [],
      partner_bank_details: [],
      partner_references: [],
      partner_certificate: [],
      office_info: [],
      billing_documents: [],
      ...initialValues,
    };
    reset(fullInitialValues);
  }, [defaultValues, reset]);
  const internalFormSubmit = (values: CompanyFormSchema) => {
    console.log(values, 'Payload');

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
    const sectionProps = { errors, control, formMethods, getValues };
    switch (activeSection) {
      case "companyDetails":
        return <CompanyDetailsSection {...sectionProps} />;
      case "kycDocuments":
        return <KYCDetailSection {...sectionProps} />;
      case "bankDetails":
        return <BankDetailsSection {...sectionProps} />;
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
        <NavLink to="/business-entities/partner">
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
    partner_name: "",
    primary_contact_number: "",
    primary_contact_number_code: undefined,
    general_contact_number: "",
    general_contact_number_code: undefined,
    company_profile_settings_id: "",
    alternate_contact_number: "",
    alternate_contact_number_code: undefined,
    primary_email_id: "",
    alternate_email_id: "",
    ownership_type: undefined,
    owner_name: "",
    partner_address: "",
    city: undefined,
    state: undefined,
    zip_code: "",
    country_id: undefined,
    continent_id: undefined,
    join_us_as: "",
    industrial_expertise: "",
    gst_number: "",
    pan_number: "",
    trn_number: "",
    tan_number: "",
    establishment_year: "",
    no_of_employees: "",
    partner_website: "",
    partner_logo: undefined,
    primary_business_type: undefined,
    primary_business_category: "",
    sub_category: [],
    interested_in: undefined,
    partner_certificate: [],
    office_info: [],
    declaration_206ab: undefined,
    declaration_206ab_remark: "",
    declaration_206ab_remark_enabled: false,
    agreement_file: undefined,
    agreement_remark: "",
    agreement_verified: false,
    office_photo_file: undefined,
    office_photo_remark: "",
    office_photo_verified: false,
    gst_certificate_file: undefined,
    gst_certificate_remark: "",
    gst_certificate_verified: false,
    authority_letter_file: undefined,
    authority_letter_remark: "",
    authority_letter_verified: false,
    visiting_card_file: undefined,
    visiting_card_remark: "",
    visiting_card_verified: false,
    cancel_cheque_file: undefined,
    cancel_cheque_remark: "",
    cancel_cheque_verified: false,
    aadhar_card_file: undefined,
    aadhar_card_remark: "",
    aadhar_card_verified: false,
    pan_card_file: undefined,
    pan_card_remark: "",
    pan_card_verified: false,
    other_document_file: undefined,
    other_document_remark: "",
    other_document_verified: false,
    primary_account_number: "",
    primary_bank_name: undefined,
    primary_ifsc_code: "",
    primary_bank_verification_photo: undefined,
    secondary_account_number: "",
    secondary_bank_name: undefined,
    secondary_ifsc_code: "",
    secondary_bank_verification_photo: undefined,
    partner_bank_details: [],
    USER_ACCESS: false,
    BILLING_FIELD: false,
    billing_documents: [],
    DOMAIN_MANAGEMENT_FIELD: [],
    member: [],
    status: undefined,
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
    company_spot_verification: [],
    partner_references: [],
  });

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getBrandAction());
    dispatch(getCategoriesAction());
    dispatch(getMembersAction());
  }, [dispatch]);

  const { CompanyData = [] } = useSelector(masterSelector);
  const companyOptions = CompanyData?.data?.map((c: any) => ({
    value: String(c.id),
    label: c.partner_name,
  }));

  useEffect(() => {
    const emptyForm = getEmptyFormValues();
    if (isEditMode && id) {
      const fetchCompanyData = async () => {
        setPageLoading(true);
        try {
          const actionResult = await dispatch(getpartnerByIdAction(id)).unwrap();
          console.log(actionResult, 'actionResult');

          if (actionResult) {
            const transformed = transformApiToFormSchema(actionResult, companyOptions);
            setInitialData({ ...emptyForm, ...transformed });
          } else {
            toast.push(
              <Notification type="danger" title="Fetch Error">
                Partner data not found.
              </Notification>
            );
            navigate("/business-entities/partner");
          }
        } catch (error: any) {
          toast.push(
            <Notification type="danger" title="Fetch Error">
              {error?.message || "Error fetching partner data."}
            </Notification>
          );
          navigate("/business-entities/partner");
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

  const handleFormSubmit = async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
    setIsSubmitting(true);
    const payload = preparePayloadForApi(
      formValues,
      isEditMode,
    );
    console.log(formValues, 'payload');

    try {
      if (isEditMode && id) {
        await dispatch(editpartnerAction({ id: id, payload })).unwrap();
        toast.push(
          <Notification type="success" title="partner Updated">
            Details updated successfully.
          </Notification>
        );
      } else {
        await dispatch(addpartnerAction(payload)).unwrap();
        toast.push(
          <Notification type="success" title="partner Created">
            New partner created successfully.
          </Notification>
        );
      }
      navigate("/business-entities/partner");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        `Failed to ${isEditMode ? "update" : "create"} partner.`;
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        Object.keys(validationErrors).forEach((key) => {
          let formKey = key as keyof CompanyFormSchema;
          if (key === "partner_address") formKey = "partner_address";
          if (key === "gst_number") formKey = "gst_number";
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
    navigate("/business-entities/partner");
  };
  if (pageLoading)
    return (
      <Container className="h-full flex justify-center items-center">
        <p>Loading Partner details...</p>
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