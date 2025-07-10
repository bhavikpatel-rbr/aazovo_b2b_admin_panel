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
import { FormItem } from "@/components/ui/Form";
import Input from "@/components/ui/Input";
import Notification from "@/components/ui/Notification";
import Select from "@/components/ui/Select";
import toast from "@/components/ui/toast";

// Icons & Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addcompanyAction,
  deletecompanyAction,
  editCompanyAction,
  getBrandAction,
  getCategoriesAction,
  getCompanyAction,
  getCompanyByIdAction,
  getContinentsAction,
  getCountriesAction,
  getMemberAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { BiChevronRight } from "react-icons/bi";
import { TbPlus, TbTrash } from "react-icons/tb";
import { useSelector } from "react-redux";
import { z } from "zod";

// --- Type Definitions ---

interface CompanyMemberItemFE {
  id?: string;
  member_id?: { label: string; value: string };
  designation?: string;
  person_name?: string;
  number?: string;
}

interface CompanyTeamItemFE {
  id?: string;
  team_name?: string;
  designation?: string;
  person_name?: string;
  number?: string;
}

interface SpotVerificationItemFE {
  id?: string;
  verified?: boolean;
  verified_by?: { label: string; value: string }; // Changed from verified_by_name
  photo_upload?: File | string | null;
  remark?: string;
}

interface CompanyBankDetailItemFE {
  id?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  swift_code?: string; // New
  verification_photo?: File | string | null;
  type?: { label: string; value: string };
}

interface CertificateItemFE {
  id?: string;
  certificate_id?: string;
  certificate_name?: string;
  upload_certificate?: File | string | null;
}

interface BranchItemFE {
  id?: string;
  office_type?: { label: string; value: string };
  office_name?: string;
  address?: string;
  country_id?: { label: string; value: string };
  state?: string;
  city?: string;
  zip_code?: string;
  gst_number?: string;
  contact_person?: string;
  office_email?: string;
  office_phone?: string;
}

interface BillingDocItemFE {
  id?: string;
  document_name?: string;
  document?: File | string | null;
}

// New type for Enable Billing Docs
interface EnabledBillingDocItemFE {
    id?: string;
    document_type?: { label: string, value: string };
    document_file?: File | string | null;
}

export interface CompanyFormSchema {
  id?: string | number;

  company_name?: string;
  primary_contact_number?: string;
  primary_contact_number_code?: { label: string; value: string };
  general_contact_number?: string;
  general_contact_number_code?: { label: string; value: string };
  alternate_contact_number?: string;
  alternate_contact_number_code?: { label: string; value: string } | null;
  primary_email_id?: string;
  alternate_email_id?: string;
  ownership_type?: { label: string; value: string };
  owner_name?: string;
  company_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country_id?: { label: string; value: string };
  continent_id?: { label: string; value: string } | null;
  gst_number?: string;
  pan_number?: string;
  trn_number?: string;
  tan_number?: string;
  establishment_year?: string;
  no_of_employees?: number | string;
  company_website?: string;
  company_logo?: File | string | null;
  primary_business_type?: { label: string; value: string } | null;
  status?: { label: string; value: string };
  support_email?: string;
  notification_email?: string;

  company_certificate?: CertificateItemFE[];
  office_info?: BranchItemFE[];

  declaration_206ab?: File | string | null;
  declaration_206ab_remark?: string;
  declaration_206ab_remark_enabled?: boolean;
  ABCQ_file?: File | string | null;
  ABCQ_remark?: string;
  ABCQ_remark_enabled?: boolean;
  office_photo_file?: File | string | null;
  office_photo_remark?: string;
  office_photo_remark_enabled?: boolean;
  gst_certificate_file?: File | string | null;
  gst_certificate_remark?: string;
  gst_certificate_remark_enabled?: boolean;
  authority_letter_file?: File | string | null;
  authority_letter_remark?: string;
  authority_letter_remark_enabled?: boolean;
  visiting_card_file?: File | string | null;
  visiting_card_remark?: string;
  visiting_card_remark_enabled?: boolean;
  cancel_cheque_file?: File | string | null;
  cancel_cheque_remark?: string;
  cancel_cheque_remark_enabled?: boolean;
  aadhar_card_file?: File | string | null;
  aadhar_card_remark?: string;
  aadhar_card_remark_enabled?: boolean;
  pan_card_file?: File | string | null;
  pan_card_remark?: string;
  pan_card_remark_enabled?: boolean;
  other_document_file?: File | string | null;
  other_document_remark?: string;
  other_document_remark_enabled?: boolean;

  primary_account_number?: string;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_swift_code?: string; // New
  primary_bank_verification_photo?: File | string | null;
  secondary_account_number?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_swift_code?: string; // New
  secondary_bank_verification_photo?: File | string | null;
  company_bank_details?: CompanyBankDetailItemFE[];

  USER_ACCESS?: boolean;
  // BILLING_FIELD?: boolean; // Removed
  billing_documents?: BillingDocItemFE[];
  enabled_billing_docs?: EnabledBillingDocItemFE[]; // New

  company_members?: CompanyMemberItemFE[];
  company_teams?: CompanyTeamItemFE[];
  company_spot_verification?: SpotVerificationItemFE[];
  company_references?: ReferenceItemFE[];
}

export interface FormSectionBaseProps {
  control: Control<CompanyFormSchema>;
  errors: FieldErrors<CompanyFormSchema>;
  formMethods: UseFormReturn<CompanyFormSchema>;
  getValues: UseFormReturn<CompanyFormSchema>['getValues'];
}

interface ApiSingleCompanyItem {
  id: number;
  company_name?: string;
  status?: string;
  primary_contact_number?: string;
  primary_contact_number_code?: string;
  general_contact_number?: string;
  general_contact_number_code?: string;
  alternate_contact_number?: string | null;
  alternate_contact_number_code?: string | null;
  primary_email_id?: string;
  alternate_email_id?: string | null;
  ownership_type?: string;
  owner_name?: string;
  company_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country_id?: string;
  continent_id?: string;
  continent?: { id: string | number, name: string };
  country?: { id: string | number, name: string };
  gst_number?: string;
  pan_number?: string;
  trn_number?: string | null;
  tan_number?: string | null;
  establishment_year?: string | null;
  no_of_employees?: number | string | null;
  company_website?: string | null;
  company_logo?: string | null;
  primary_business_type?: string | null;
  support_email?: string | null;
  notification_email?: string | null;
  kyc_verified?: boolean | string;
  // enable_billing?: boolean | string; // Removed from direct mapping
  company_certificate?: Array<{ certificate_id: string; certificate_name: string; upload_certificate: string | null; upload_certificate_path?: string; }>;
  office_info?: Array<{ office_type: string; office_name: string; address: string; country_id: string; state: string; city: string; zip_code: string; gst_number: string | null; contact_person?: string; office_email?: string; office_phone?: string; }>;
  declaration_206AB_url?: string | null;
  declaration_206AB_verify?: boolean | string;
  declaration_206AB_remark?: string | null;
  ABCQ_file?: string | null;
  ABCQ_verified?: boolean | string;
  ABCQ_remark?: string | null;
  office_photo_file?: string | null;
  office_photo_verified?: boolean | string;
  office_photo_remark?: string | null;
  gst_certificate_file?: string | null;
  gst_certificate_verified?: boolean | string;
  gst_certificate_remark?: string | null;
  authority_letter_file?: string | null;
  authority_letter_verified?: boolean | string;
  authority_letter_remark?: string | null;
  visiting_card_file?: string | null;
  visiting_card_verified?: boolean | string;
  visiting_card_remark?: string | null;
  cancel_cheque_file?: string | null;
  cancel_cheque_verified?: boolean | string;
  cancel_cheque_remark?: string | null;
  aadhar_card_file?: string | null;
  aadhar_card_verified?: boolean | string;
  aadhar_card_remark?: string | null;
  pan_card_file?: string | null;
  pan_card_verified?: boolean | string;
  pan_card_remark?: string | null;
  other_document_file?: string | null;
  other_document_verified?: boolean | string;
  other_document_remark?: string | null;
  primary_account_number?: string | null;
  primary_bank_name?: string | null;
  primary_ifsc_code?: string | null;
  primary_swift_code?: string | null; // New
  primary_bank_verification_photo?: string | null;
  secondary_account_number?: string | null;
  secondary_bank_name?: string | null;
  secondary_ifsc_code?: string | null;
  secondary_swift_code?: string | null; // New
  secondary_bank_verification_photo?: string | null;
  company_bank_details?: Array<{ bank_account_number: string; bank_name: string; ifsc_code: string; swift_code?: string; type: string; verification_photo: string | null; }>; // Added swift_code
  billing_documents?: Array<{ document_name: string; document: string | null; }>;
  enabled_billing_docs?: Array<{ document_type: string; document_file: string | null; }>; // New
  company_member_management?: Array<{ member_id: string; designation: string; person_name: string; number: string; }>;
  company_team_members?: Array<{ team_name: string; designation: string; person_name: string; number: string; }>;
  company_spot_verification?: Array<{ verified_by_id?: string; verified_by_name?: string; verified: boolean | string; remark: string | null; photo_upload: string | null; photo_upload_path?: string; }>; // Added verified_by_id
  company_references?: Array<{ person_name: string; company_id: string; number: string; remark: string | null; }>;
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (
  apiData: ApiSingleCompanyItem,
  allCountries: Array<{ id: string | number; name: string }>,
  allContinents: Array<{ id: string | number; name: string }>,
  allMembers: Array<{ value: string; label: string }>,
  allCompaniesForRef: Array<{ value: string; label: string }>
): Partial<CompanyFormSchema> => {
    const stringToBoolean = (value: boolean | string | undefined | null): boolean => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lowerVal = value.toLowerCase();
          return lowerVal === '1' || lowerVal === 'true' || lowerVal === 'yes';
        }
        return false;
    };
    
    const findOptionByValue = (options: Array<{ value: string; label: string }>, value?: string | null) => {
        if (!value) return undefined;
        return options.find(opt => String(opt.value) === String(value));
    };

    const findOptionByLabel = (options: Array<{ value: string; label: string }>, label?: string | null) => {
        if (!label) return undefined;
        // This is a bit brittle, but required if API only gives name.
        return options.find(opt => opt.label.toLowerCase().includes(label.toLowerCase()));
    };

    const mapCountries = allCountries.map(c => ({ value: String(c.id), label: c.name }));
    const mapContinents = allContinents.map(c => ({ value: String(c.id), label: c.name }));
    
    // Assuming you have a doc type list for this new feature
    const enabledBillDocTypes = [
        { label: 'Proforma Invoice', value: 'Proforma Invoice'},
        { label: 'Commercial Invoice', value: 'Commercial Invoice'},
        { label: 'Packing List', value: 'Packing List'},
        { label: 'Certificate of Origin', value: 'Certificate of Origin'},
    ];
    
    return {
        id: apiData.id,
        company_name: apiData.company_name || '',
        primary_contact_number: apiData.primary_contact_number || '',
        primary_contact_number_code: apiData.primary_contact_number_code ? { label: apiData.primary_contact_number_code, value: apiData.primary_contact_number_code } : undefined,
        general_contact_number: apiData.general_contact_number || '',
        general_contact_number_code: apiData.general_contact_number_code ? { label: apiData.general_contact_number_code, value: apiData.general_contact_number_code } : undefined,
        alternate_contact_number: apiData.alternate_contact_number || '',
        alternate_contact_number_code: apiData.alternate_contact_number_code ? { label: apiData.alternate_contact_number_code, value: apiData.alternate_contact_number_code } : null,
        primary_email_id: apiData.primary_email_id || '',
        alternate_email_id: apiData.alternate_email_id || '',
        ownership_type: apiData.ownership_type ? { label: apiData.ownership_type, value: apiData.ownership_type } : undefined,
        owner_name: apiData.owner_name || '',
        company_address: apiData.company_address || '',
        city: apiData.city || '',
        state: apiData.state || '',
        zip_code: apiData.zip_code || '',
        country_id: findOptionByValue(mapCountries, apiData.country_id) || (apiData.country?.name ? {label: apiData.country.name, value: String(apiData.country_id)} : undefined),
        continent_id: findOptionByValue(mapContinents, apiData.continent_id) || (apiData.continent?.name ? {label: apiData.continent.name, value: String(apiData.continent_id)} : null),
        gst_number: apiData.gst_number || '',
        pan_number: apiData.pan_number || '',
        trn_number: apiData.trn_number || '',
        tan_number: apiData.tan_number || '',
        establishment_year: apiData.establishment_year || '',
        no_of_employees: apiData.no_of_employees || '',
        company_website: apiData.company_website || '',
        company_logo: apiData.company_logo || null,
        primary_business_type: apiData.primary_business_type ? { label: apiData.primary_business_type, value: apiData.primary_business_type } : null,
        status: apiData.status ? { label: apiData.status, value: apiData.status } : undefined,
        support_email: apiData.support_email || '',
        notification_email: apiData.notification_email || '',
    
        company_certificate: apiData.company_certificate?.map(cert => ({
            certificate_id: cert.certificate_id,
            certificate_name: cert.certificate_name || '',
            upload_certificate: cert.upload_certificate_path || cert.upload_certificate || null,
        })) || [],
        office_info: apiData.office_info?.map(office => ({
            office_type: office.office_type ? { label: office.office_type, value: office.office_type } : undefined,
            office_name: office.office_name || '',
            address: office.address || '',
            country_id: findOptionByValue(mapCountries, office.country_id),
            state: office.state || '',
            city: office.city || '',
            zip_code: office.zip_code || '',
            gst_number: office.gst_number || '',
            contact_person: office.contact_person || '',
            office_email: office.office_email || '',
            office_phone: office.office_phone || '',
        })) || [],
    
        declaration_206ab: apiData.declaration_206AB_url || null,
        declaration_206ab_remark: apiData.declaration_206AB_remark || '',
        declaration_206ab_remark_enabled: stringToBoolean(apiData.declaration_206AB_verify),
        ABCQ_file: apiData.ABCQ_file || null,
        ABCQ_remark: apiData.ABCQ_remark || '',
        ABCQ_remark_enabled: stringToBoolean(apiData.ABCQ_verified),
        office_photo_file: apiData.office_photo_file || null,
        office_photo_remark: apiData.office_photo_remark || "",
        office_photo_remark_enabled: stringToBoolean(apiData.office_photo_verified),
        gst_certificate_file: apiData.gst_certificate_file || null,
        gst_certificate_remark: apiData.gst_certificate_remark || "",
        gst_certificate_remark_enabled: stringToBoolean(apiData.gst_certificate_verified),
        authority_letter_file: apiData.authority_letter_file || null,
        authority_letter_remark: apiData.authority_letter_remark || "",
        authority_letter_remark_enabled: stringToBoolean(apiData.authority_letter_verified),
        visiting_card_file: apiData.visiting_card_file || null,
        visiting_card_remark: apiData.visiting_card_remark || "",
        visiting_card_remark_enabled: stringToBoolean(apiData.visiting_card_verified),
        cancel_cheque_file: apiData.cancel_cheque_file || null,
        cancel_cheque_remark: apiData.cancel_cheque_remark || "",
        cancel_cheque_remark_enabled: stringToBoolean(apiData.cancel_cheque_verified),
        aadhar_card_file: apiData.aadhar_card_file || null,
        aadhar_card_remark: apiData.aadhar_card_remark || "",
        aadhar_card_remark_enabled: stringToBoolean(apiData.aadhar_card_verified),
        pan_card_file: apiData.pan_card_file || null,
        pan_card_remark: apiData.pan_card_remark || "",
        pan_card_remark_enabled: stringToBoolean(apiData.pan_card_verified),
        other_document_file: apiData.other_document_file || null,
        other_document_remark: apiData.other_document_remark || "",
        other_document_remark_enabled: stringToBoolean(apiData.other_document_verified),
    
        primary_account_number: apiData.primary_account_number || '',
        primary_bank_name: apiData.primary_bank_name || null,
        primary_ifsc_code: apiData.primary_ifsc_code || '',
        primary_swift_code: apiData.primary_swift_code || '',
        primary_bank_verification_photo: apiData.primary_bank_verification_photo || null,
        secondary_account_number: apiData.secondary_account_number || '',
        secondary_bank_name: apiData.secondary_bank_name || null,
        secondary_ifsc_code: apiData.secondary_ifsc_code || '',
        secondary_swift_code: apiData.secondary_swift_code || '',
        secondary_bank_verification_photo: apiData.secondary_bank_verification_photo || null,
        company_bank_details: apiData.company_bank_details?.map(bank => ({
            bank_account_number: bank.bank_account_number || '',
            bank_name: bank.bank_name || undefined,
            ifsc_code: bank.ifsc_code || '',
            swift_code: bank.swift_code || '',
            type: bank.type ? { label: bank.type, value: bank.type } : undefined,
            verification_photo: bank.verification_photo || null,
        })) || [],
    
        USER_ACCESS: stringToBoolean(apiData.kyc_verified),
        billing_documents: apiData.billing_documents?.map(doc => ({
            document_name: doc.document_name || '',
            document: doc.document || null,
        })) || [],
        enabled_billing_docs: apiData.enabled_billing_docs?.map(doc => ({
            document_type: findOptionByValue(enabledBillDocTypes, doc.document_type),
            document_file: doc.document_file || null
        })) || [],
    
        company_members: apiData.company_member_management?.map(m => ({
            member_id: findOptionByValue(allMembers, m.member_id),
            designation: m.designation || '',
            person_name: m.person_name || '',
            number: m.number || '',
        })) || [],
        company_teams: apiData.company_team_members?.map(m => ({
            team_name: m.team_name || '',
            designation: m.designation || '',
            person_name: m.person_name || '',
            number: m.number || '',
        })) || [],
    
        company_spot_verification: apiData.company_spot_verification?.map(item => ({
            verified: stringToBoolean(item.verified),
            verified_by: findOptionByValue(allMembers, item.verified_by_id) || findOptionByLabel(allMembers, item.verified_by_name),
            photo_upload: item.photo_upload_path || item.photo_upload || null,
            remark: item.remark || '',
        })) || [],
        company_references: apiData.company_references?.map(ref => ({
            person_name: ref.person_name || '',
            company_id: findOptionByValue(allCompaniesForRef, ref.company_id),
            number: ref.number || '',
            remark: ref.remark || '',
        })) || [],
      };
};

const preparePayloadForApi = (
  formData: CompanyFormSchema,
  isEditMode: boolean
): FormData => {
    const apiPayload = new FormData();
    const data: any = { ...formData };
  
    const appendField = (key: string, value: any) => {
      if (value === null || value === undefined) {
        apiPayload.append(key, "");
      } else if (typeof value === 'boolean') {
        apiPayload.append(key, value ? "1" : "0");
      } else if (typeof value === 'object' && !Array.isArray(value) && value.value !== undefined && value.label !== undefined) {
        apiPayload.append(key, value.value);
      } else if (value instanceof File) {
        apiPayload.append(key, value);
      }
       else {
        apiPayload.append(key, String(value));
      }
    };
    
    const appendFileIfExists = (key: string, value: any) => {
      if (value instanceof File) {
          apiPayload.append(key, value);
      } else if (value === null || value === '') {
          apiPayload.append(key, '');
      }
    };
  
    if (isEditMode && data.id) {
      apiPayload.append("id", String(data.id));
      apiPayload.append("_method", "PUT");
    }
  
    const simpleFields: (keyof CompanyFormSchema)[] = [
        "company_name", "primary_contact_number", "primary_contact_number_code", "general_contact_number", "general_contact_number_code",
        "alternate_contact_number", "alternate_contact_number_code", "primary_email_id", "alternate_email_id", "ownership_type", "owner_name",
        "company_address", "city", "state", "zip_code", "country_id", "continent_id", "gst_number", "pan_number", "trn_number", "tan_number",
        "establishment_year", "no_of_employees", "company_website", "primary_business_type", "status", "support_email", "notification_email",
        "primary_account_number", "primary_bank_name", "primary_ifsc_code", "primary_swift_code", 
        "secondary_account_number", "secondary_bank_name", "secondary_ifsc_code", "secondary_swift_code"
    ];
    simpleFields.forEach(field => appendField(field, data[field]));
  
    appendField("kyc_verified", data.USER_ACCESS);
    // Removed BILLING_FIELD
  
    appendFileIfExists("company_logo", data.company_logo);
    appendFileIfExists("primary_bank_verification_photo", data.primary_bank_verification_photo);
    appendFileIfExists("secondary_bank_verification_photo", data.secondary_bank_verification_photo);
  
    // Certificates
    data.company_certificate?.forEach((cert: CertificateItemFE, index: number) => {
        apiPayload.append(`company_certificate[${index}][certificate_id]`, cert.certificate_id || "");
        apiPayload.append(`company_certificate[${index}][certificate_name]`, cert.certificate_name || "");
        appendFileIfExists(`company_certificate[${index}][upload_certificate]`, cert.upload_certificate);
    });
  
    // Office Info
    data.office_info?.forEach((office: BranchItemFE, index: number) => {
      appendField(`office_info[${index}][office_type]`, office.office_type);
      appendField(`office_info[${index}][office_name]`, office.office_name);
      appendField(`office_info[${index}][address]`, office.address);
      appendField(`office_info[${index}][country_id]`, office.country_id);
      appendField(`office_info[${index}][state]`, office.state);
      appendField(`office_info[${index}][city]`, office.city);
      appendField(`office_info[${index}][zip_code]`, office.zip_code);
      appendField(`office_info[${index}][gst_number]`, office.gst_number);
      appendField(`office_info[${index}][contact_person]`, office.contact_person);
      appendField(`office_info[${index}][office_email]`, office.office_email);
      appendField(`office_info[${index}][office_phone]`, office.office_phone);
    });
  
    // KYC Documents
    const kycDocsConfig = [
      { feFileKey: "declaration_206ab", beFileKey: "declaration_206AB_file", feVerifyKey: "declaration_206ab_remark_enabled", beVerifyKey: "declaration_206AB_verify", feRemarkKey: "declaration_206ab_remark", beRemarkKey: "declaration_206AB_remark" },
      { feFileKey: "ABCQ_file", beFileKey: "ABCQ_file", feVerifyKey: "ABCQ_remark_enabled", beVerifyKey: "ABCQ_verified", feRemarkKey: "ABCQ_remark", beRemarkKey: "ABCQ_remark" },
      { feFileKey: "office_photo_file", beFileKey: "office_photo_file", feVerifyKey: "office_photo_remark_enabled", beVerifyKey: "office_photo_verified", feRemarkKey: "office_photo_remark", beRemarkKey: "office_photo_remark" },
      { feFileKey: "gst_certificate_file", beFileKey: "gst_certificate_file", feVerifyKey: "gst_certificate_remark_enabled", beVerifyKey: "gst_certificate_verified", feRemarkKey: "gst_certificate_remark", beRemarkKey: "gst_certificate_remark" },
      { feFileKey: "authority_letter_file", beFileKey: "authority_letter_file", feVerifyKey: "authority_letter_remark_enabled", beVerifyKey: "authority_letter_verified", feRemarkKey: "authority_letter_remark", beRemarkKey: "authority_letter_remark" },
      { feFileKey: "visiting_card_file", beFileKey: "visiting_card_file", feVerifyKey: "visiting_card_remark_enabled", beVerifyKey: "visiting_card_verified", feRemarkKey: "visiting_card_remark", beRemarkKey: "visiting_card_remark" },
      { feFileKey: "cancel_cheque_file", beFileKey: "cancel_cheque_file", feVerifyKey: "cancel_cheque_remark_enabled", beVerifyKey: "cancel_cheque_verified", feRemarkKey: "cancel_cheque_remark", beRemarkKey: "cancel_cheque_remark" },
      { feFileKey: "aadhar_card_file", beFileKey: "aadhar_card_file", feVerifyKey: "aadhar_card_remark_enabled", beVerifyKey: "aadhar_card_verified", feRemarkKey: "aadhar_card_remark", beRemarkKey: "aadhar_card_remark" },
      { feFileKey: "pan_card_file", beFileKey: "pan_card_file", feVerifyKey: "pan_card_remark_enabled", beVerifyKey: "pan_card_verified", feRemarkKey: "pan_card_remark", beRemarkKey: "pan_card_remark" },
      { feFileKey: "other_document_file", beFileKey: "other_document_file", feVerifyKey: "other_document_remark_enabled", beVerifyKey: "other_document_verified", feRemarkKey: "other_document_remark", beRemarkKey: "other_document_remark" },
    ];
    kycDocsConfig.forEach(doc => {
      appendFileIfExists(doc.beFileKey, data[doc.feFileKey]);
      apiPayload.append(doc.beVerifyKey, data[doc.feVerifyKey] ? "1" : "0");
      apiPayload.append(doc.beRemarkKey, data[doc.feRemarkKey] || "");
    });
  
    // Bank Details
    data.company_bank_details?.forEach((bank: CompanyBankDetailItemFE, index: number) => {
      apiPayload.append(`company_bank_details[${index}][bank_account_number]`, bank.bank_account_number || '');
      apiPayload.append(`company_bank_details[${index}][bank_name]`,bank.bank_name || '');
      apiPayload.append(`company_bank_details[${index}][ifsc_code]`, bank.ifsc_code || '');
      apiPayload.append(`company_bank_details[${index}][swift_code]`, bank.swift_code || ''); // New
      apiPayload.append(`company_bank_details[${index}][type]`, bank.type?.value || 'Other');
      appendFileIfExists(`company_bank_details[${index}][verification_photo]`, bank.verification_photo);
    });
  
    // Billing Documents
    data.billing_documents?.forEach((doc: BillingDocItemFE, index: number) => {
      apiPayload.append(`billing_documents[${index}][document_name]`, doc.document_name || "");
      appendFileIfExists(`billing_documents[${index}][document]`, doc.document);
    });

    // Enabled Billing Documents (New)
    data.enabled_billing_docs?.forEach((doc: EnabledBillingDocItemFE, index: number) => {
        appendField(`enabled_billing_docs[${index}][document_type]`, doc.document_type);
        appendFileIfExists(`enabled_billing_docs[${index}][document_file]`, doc.document_file);
    });
  
    // Member Management
    data.company_members?.forEach((member: CompanyMemberItemFE, index: number) => {
        apiPayload.append(`company_member_management[${index}][member_id]`, member.member_id?.value || '');
        apiPayload.append(`company_member_management[${index}][designation]`, member.designation || '');
        apiPayload.append(`company_member_management[${index}][person_name]`, member.person_name || '');
        apiPayload.append(`company_member_management[${index}][number]`, member.number || '');
    });
    // Team Management
    data.company_teams?.forEach((member: CompanyTeamItemFE, index: number) => {
        apiPayload.append(`company_team_members[${index}][team_name]`, member.team_name || '');
        apiPayload.append(`company_team_members[${index}][designation]`, member.designation || '');
        apiPayload.append(`company_team_members[${index}][person_name]`, member.person_name || '');
        apiPayload.append(`company_team_members[${index}][number]`, member.number || '');
    });
  
    // Spot Verifications
    data.company_spot_verification?.forEach((item: SpotVerificationItemFE, index: number) => {
      apiPayload.append(`company_spot_verification[${index}][verified]`, item.verified ? "1" : "0");
      appendField(`company_spot_verification[${index}][verified_by_id]`, item.verified_by); // Changed
      apiPayload.append(`company_spot_verification[${index}][remark]`, item.remark || "");
      appendFileIfExists(`company_spot_verification[${index}][photo_upload]`, item.photo_upload);
    });
  
    // References
    data.company_references?.forEach((ref: ReferenceItemFE, index: number) => {
      apiPayload.append(`company_references[${index}][person_name]`, ref.person_name || "");
      apiPayload.append(`company_references[${index}][company_id]`, ref.company_id?.value || "");
      apiPayload.append(`company_references[${index}][number]`, ref.number || "");
      apiPayload.append(`company_references[${index}][remark]`, ref.remark || "");
    });
    
    return apiPayload;
};

// --- Navigator Component ---
const companyNavigationList = [
  { label: "Company Details", link: "companyDetails" },
  { label: "KYC Documents", link: "kycDocuments" },
  { label: "Bank Details", link: "bankDetails" },
  { label: "Spot Verification", link: "spotVerification" },
  { label: "Reference", link: "reference" },
  { label: "Accessibility", link: "accessibility" },
  { label: "Member Management", link: "memberManagement" },
  { label: "Team Management", link: "teamManagement" },
];
type NavigatorComponentProps = {
  activeSection: string;
  onNavigate: (sectionKey: string) => void;
};
const NavigatorComponent = (props: NavigatorComponentProps) => {
  const { activeSection, onNavigate } = props;
  return (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
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
          <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">
            {nav.label}
          </span>
        </button>
      ))}
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
  } = useSelector(masterSelector);
  const { watch } = formMethods;
  
  const countryOptions = CountriesData.map((value: any) => ({
    value: String(value.id),
    label: value.name,
  }));

  const countryCodeOptions = CountriesData
    .filter((c: any) => c.phone_code)
    .map((c: any) => ({
        value: `${c.phone_code}`,
        label: `${c.iso_code}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const continentOptions = ContinentsData.map((value: any) => ({
    value: String(value.id),
    label: value.name,
  }));
  const ownershipTypeOptions = [
    { value: "Sole Proprietorship", label: "Sole Proprietorship" },
    { value: "Partner", label: "Partner" },
    { value: "LLC", label: "LLC" },
    { value: "Corporate", label: "Corporate" },
    { value: "Private Limited", label: "Private Limited"},
    { value: "Public Limited", label: "Public Limited"},
    { value: "Others", label: "Others" },
  ];
  const primaryBusinessTypeOptions = [
    { value: "Manufacturer", label: "Manufacturer" },
    { value: "Distributor", label: "Distributor" },
    { value: "Wholesaler", label: "Wholesaler" },
    { value: "Retailer", label: "Retailer" },
    { value: "Corporate", label: "Corporate" },
    { value: "Others", label: "Others" },
  ];
  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Disabled", label: "Disabled" },
    { value: "Blocked", label: "Blocked" },
    { value: "Inactive", label: "Inactive" },
  ];
  const officeTypeOptions = [
    { label: "Head Office", value: "Head Office" },
    { label: "Branch", value: "Branch" },
    { label: "Regional Office", value: "Regional Office" },
    { label: "Warehouse", value: "Warehouse" },
    { label: "Pick up location", value: "Pick up location" },
    { label: "Delivery location", value: "Delivery location" },
    { label: "Manufacturing unit", value: "Manufacturing unit" },
    { label: "Other", value: "Other" },
  ];

  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: "company_certificate" });
  const { fields: branchFields, append: appendBranch, remove: removeBranch } = useFieldArray({ control, name: "office_info" });
  
  const companyLogoValue = watch("company_logo");

  return (
    <Card id="companyDetails">
      <h4 className="mb-4">Primary Information</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} invalid={!!errors.status} errorMessage={errors.status?.message as string}>
          <Controller name="status" control={control} render={({ field }) => ( <Select options={statusOptions} placeholder="Select Status" {...field} /> )} />
        </FormItem>
        <FormItem label={<div>Company Name<span className="text-red-500"> * </span></div>} invalid={!!errors.company_name} errorMessage={errors.company_name?.message as string}>
          <Controller name="company_name" control={control} render={({ field }) => (<Input placeholder="Company Name" {...field} />)} />
        </FormItem>
        <FormItem label={<div>Ownership Type<span className="text-red-500"> * </span></div>} invalid={!!errors.ownership_type} errorMessage={errors.ownership_type?.message as string}>
          <Controller name="ownership_type" control={control} render={({ field }) => (<Select placeholder="Select Ownership" options={ownershipTypeOptions} {...field} />)} />
        </FormItem>
        <FormItem label={<div>Owner/Director Name<span className="text-red-500"> * </span></div>} invalid={!!errors.owner_name} errorMessage={errors.owner_name?.message as string}>
          <Controller name="owner_name" control={control} render={({ field }) => (<Input placeholder="Owner/Director Name" {...field} />)} />
        </FormItem>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-4">
        <FormItem label={<div>Country<span className="text-red-500"> * </span></div>} invalid={!!errors.country_id} errorMessage={errors.country_id?.message as string}>
          <Controller name="country_id" control={control} render={({ field }) => (<Select placeholder="Select Country" options={countryOptions} {...field} />)} />
        </FormItem>
        <FormItem label="Continent" invalid={!!errors.continent_id} errorMessage={errors.continent_id?.message as string}>
          <Controller name="continent_id" control={control} render={({ field }) => (<Select placeholder="Select Continent" options={continentOptions} {...field} />)} />
        </FormItem>
        <FormItem label={<div>City</div>} invalid={!!errors.city} errorMessage={errors.city?.message as string}>
          <Controller name="city" control={control} render={({ field }) => (<Input placeholder="Enter city" {...field} />)} />
        </FormItem>
        <FormItem label={<div>State</div>} invalid={!!errors.state} errorMessage={errors.state?.message as string}>
          <Controller name="state" control={control} render={({ field }) => (<Input placeholder="Enter state" {...field} />)} />
        </FormItem>
        <FormItem label={<div>Postal Code</div>} invalid={!!errors.zip_code} errorMessage={errors.zip_code?.message as string}>
          <Controller name="zip_code" control={control} render={({ field }) => <Input placeholder="ZIP / Postal Code" {...field} />} />
        </FormItem>
        <FormItem label={<div>Company Address</div>} invalid={!!errors.company_address} errorMessage={errors.company_address?.message as string} className="md:col-span-5">
          <Controller name="company_address" control={control} render={({ field }) => (<Input placeholder="Company Address" {...field} />)} />
        </FormItem>
      </div>

      <hr className="my-6" />
      <h4 className="mb-4">Contact Information</h4>
      <div className="sm:grid md:grid-cols-12 gap-3">
        <FormItem className="sm:col-span-6 lg:col-span-4" label={<div>Primary Email ID</div>} invalid={!!errors.primary_email_id} errorMessage={errors.primary_email_id?.message as string}>
          <Controller name="primary_email_id" control={control} render={({ field }) => (<Input type="email" placeholder="Primary Email" {...field} />)} />
        </FormItem>
        <FormItem className="sm:col-span-6 lg:col-span-8" label="Alternate E-mail ID" invalid={!!errors.alternate_email_id} errorMessage={errors.alternate_email_id?.message as string}>
          <Controller name="alternate_email_id" control={control} render={({ field }) => (<Input type="email" placeholder="Alternate Email" {...field} />)} />
        </FormItem>
        
        <FormItem className="sm:col-span-6 lg:col-span-4" label={<div>Primary Contact Number</div>} invalid={!!errors.primary_contact_number || !!errors.primary_contact_number_code} errorMessage={(errors.primary_contact_number?.message || (errors.primary_contact_number_code as any)?.message) as string}>
          <div className="flex items-start gap-2">
            <div className="w-2/5"> <Controller name="primary_contact_number_code" control={control} render={({ field }) => (<Select options={countryCodeOptions} placeholder="Code" {...field} />)} /> </div>
            <div className="w-3/5"> <Controller name="primary_contact_number" control={control} render={({ field }) => (<Input placeholder="Primary Contact" {...field} />)} /> </div>
          </div>
        </FormItem>
        <FormItem className="sm:col-span-6 lg:col-span-4" label="Alternate Contact Number">
          <div className="flex items-start gap-2">
            <div className="w-2/5"> <Controller name="alternate_contact_number_code" control={control} render={({ field }) => (<Select options={countryCodeOptions} placeholder="Code" {...field} />)} /> </div>
            <div className="w-3/5"> <Controller name="alternate_contact_number" control={control} render={({ field }) => (<Input placeholder="Alternate Contact" {...field} />)} /> </div>
          </div>
        </FormItem>
        <FormItem className="sm:col-span-6 lg:col-span-4" label={<div>Landline</div>} invalid={!!errors.general_contact_number || !!errors.general_contact_number_code} errorMessage={(errors.general_contact_number?.message || (errors.general_contact_number_code as any)?.message) as string}>
          <div className="flex items-start gap-2">
            <div className="w-3/5"> <Controller name="general_contact_number" control={control} render={({ field }) => (<Input placeholder="Company Landline" {...field} />)} /> </div>
          </div>
        </FormItem>
         {/* <FormItem className="sm:col-span-6 lg:col-span-6" label="Support Email" invalid={!!errors.support_email} errorMessage={errors.support_email?.message as string}>
          <Controller name="support_email" control={control} render={({ field }) => (<Input type="email" placeholder="support@example.com" {...field} />)} />
        </FormItem> */}
        {/* <FormItem label="Notification Email" className="sm:col-span-6 lg:col-span-6">
          <Controller name="notification_email" control={control} render={({ field }) => (<Input type="email" placeholder="notifications@example.com" {...field} />)} />
        </FormItem> */}
      </div>

      <hr className="my-6" />
      <h4 className="mb-4">Trade Information</h4>
      <div className="grid md:grid-cols-4 gap-3">
        <FormItem label={<div>GST Number<span className="text-red-500"> * </span></div>} invalid={!!errors.gst_number} errorMessage={errors.gst_number?.message as string}>
          <Controller name="gst_number" control={control} render={({ field }) => (<Input placeholder="GST Number" {...field} />)} />
        </FormItem>
        <FormItem label={<div>PAN Number<span className="text-red-500"> * </span></div>} invalid={!!errors.pan_number} errorMessage={errors.pan_number?.message as string}>
          <Controller name="pan_number" control={control} render={({ field }) => (<Input placeholder="PAN Number" {...field} />)} />
        </FormItem>
        <FormItem label={<div>TRN Number</div>} invalid={!!errors.trn_number} errorMessage={errors.trn_number?.message as string}>
          <Controller name="trn_number" control={control} render={({ field }) => (<Input placeholder="TRN Number" {...field} />)} />
        </FormItem>
        <FormItem label={<div>TAN Number</div>} invalid={!!errors.tan_number} errorMessage={errors.tan_number?.message as string}>
          <Controller name="tan_number" control={control} render={({ field }) => (<Input placeholder="TAN Number" {...field} />)} />
        </FormItem>
      </div>

      <hr className="my-6" />
      <h4 className="mb-4">Company Information</h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
         <FormItem label="Establishment Year" invalid={!!errors.establishment_year} errorMessage={errors.establishment_year?.message as string}>
          <Controller name="establishment_year" control={control} render={({ field }) => (<Input placeholder="YYYY" maxLength={4} {...field} />)} />
        </FormItem>
         <FormItem label="No. of Employees" invalid={!!errors.no_of_employees} errorMessage={errors.no_of_employees?.message as string}>
          <Controller name="no_of_employees" control={control} render={({ field }) => (<NumericInput placeholder="e.g., 100" {...field} onChange={(value) => field.onChange(value)} />)} />
        </FormItem>
        <FormItem label="Company Logo/Brochure" invalid={!!errors.company_logo} errorMessage={errors.company_logo?.message as string}>
          <Controller name="company_logo" control={control} render={({ field: { onChange, ref, value, ...restField } }) => (<Input type="file" ref={ref} onChange={(e) => onChange(e.target.files?.[0])} {...restField} />)} />
          {companyLogoValue && (
            <div className="mt-2">
              {companyLogoValue instanceof File ? (<img src={URL.createObjectURL(companyLogoValue)} alt="logo preview" className="h-16 w-auto object-contain border rounded" />)
              : typeof companyLogoValue === 'string' ? (<img src={`${companyLogoValue}`} alt="logo preview" className="h-16 w-auto object-contain border rounded" />)
              : null}
            </div>
          )}
        </FormItem>
        <FormItem label="Company Website" invalid={!!errors.company_website} errorMessage={errors.company_website?.message as string}>
          <Controller name="company_website" control={control} render={({ field }) => (<Input type="url" placeholder="https://example.com" {...field} />)} />
        </FormItem>
        <FormItem label="Primary Business Type" invalid={!!errors.primary_business_type} errorMessage={errors.primary_business_type?.message as string}>
          <Controller name="primary_business_type" control={control} render={({ field }) => (<Select placeholder="Select Business Type" options={primaryBusinessTypeOptions} {...field} />)} />
        </FormItem>
      </div>

      <hr className="my-6" />
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Certificates</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => appendCert({ certificate_id: undefined, certificate_name: "", upload_certificate: null })}> Add Certificate </Button>
      </div>
      {certFields.map((item, index) => {
        const uploadCertificateValue = watch(`company_certificate.${index}.upload_certificate`);
        return (
          <Card key={item.id} className="mb-4 rounded-md border dark:border-gray-600" bodyClass="p-4">
            <div className="grid md:grid-cols-10 gap-3 items-start">
              <FormItem label={`Certificate ID ${index + 1}`} className="col-span-10 md:col-span-3" invalid={!!errors.company_certificate?.[index]?.certificate_id} errorMessage={(errors.company_certificate?.[index]?.certificate_id as any)?.message as string}>
                <Controller name={`company_certificate.${index}.certificate_id`} control={control} render={({ field }) => (<Input placeholder="e.g., 12345 or select" {...field} />)} />
              </FormItem>
              <FormItem label={`Name ${index + 1}`} className="col-span-10 md:col-span-3" invalid={!!errors.company_certificate?.[index]?.certificate_name} errorMessage={errors.company_certificate?.[index]?.certificate_name?.message as string}>
                <Controller name={`company_certificate.${index}.certificate_name`} control={control} render={({ field }) => (<Input placeholder="e.g., ISO 9001" {...field} />)} />
              </FormItem>
              <FormItem label={`Upload ${index + 1}`} className="col-span-10 md:col-span-3">
                <Controller name={`company_certificate.${index}.upload_certificate`} control={control} render={({ field: { onChange, value, ref, ...restField } }) => ( <Input type="file" ref={ref} onChange={(e) => onChange(e.target.files?.[0])} {...restField} /> )} />
                {uploadCertificateValue && (
                  <div className="mt-1">
                    {uploadCertificateValue instanceof File ? (<span className="text-sm text-gray-500">{uploadCertificateValue.name}</span>)
                    : typeof uploadCertificateValue === 'string' ? (<a href={`${uploadCertificateValue}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline"> View Uploaded </a>)
                    : null}
                  </div>
                )}
              </FormItem>
              <div className="text-right col-span-10 md:col-span-1 md:self-center">
                <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => removeCert(index)} variant="plain" className="text-red-500 hover:text-red-700" />
              </div>
            </div>
          </Card>
        );
      })}
  
        <hr className="my-6" />
        <div className="flex justify-between items-center mb-4">
          <h4 className="mb-0">Office Information</h4>
          <Button type="button" icon={<TbPlus />} size="sm" onClick={() => appendBranch({ office_type: undefined, office_name: "", address: "", country_id: undefined, state: "", city: "", zip_code: "", gst_number: "", contact_person: "", office_email: "", office_phone: "" })}> Add Office </Button>
        </div>
        {branchFields.map((item, index) => (
          <Card key={item.id} className="mb-4 border dark:border-gray-600 rounded-md relative" bodyClass="p-4">
             <Button type="button" size="xs" variant="plain" icon={<TbTrash size={16} />} onClick={() => removeBranch(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10" > Remove </Button>
            <div className="grid md:grid-cols-4 gap-4">
              <FormItem label={`Office Type ${index + 1}`} invalid={!!errors.office_info?.[index]?.office_type} errorMessage={(errors.office_info?.[index]?.office_type as any)?.message as string}>
                <Controller name={`office_info.${index}.office_type`} control={control} render={({ field }) => (<Select placeholder="Select Office Type" options={officeTypeOptions} {...field} />)} />
              </FormItem>
              <FormItem label={`Office Name ${index + 1}`} invalid={!!errors.office_info?.[index]?.office_name} errorMessage={errors.office_info?.[index]?.office_name?.message as string}>
                <Controller name={`office_info.${index}.office_name`} control={control} render={({ field }) => (<Input placeholder="e.g. Main Office" {...field} />)} />
              </FormItem>
              <FormItem label={`GST/REG Number ${index + 1}`}>
                <Controller name={`office_info.${index}.gst_number`} control={control} render={({ field }) => (<Input placeholder="GST or Registration Number" {...field} />)} />
              </FormItem>
              <FormItem label={`Contact Person ${index + 1}`} invalid={!!errors.office_info?.[index]?.contact_person} errorMessage={errors.office_info?.[index]?.contact_person?.message as string}>
                  <Controller name={`office_info.${index}.contact_person`} control={control} render={({ field }) => (<Input placeholder="John Doe" {...field} />)} />
              </FormItem>
              <FormItem label={`Email ${index + 1}`} invalid={!!errors.office_info?.[index]?.office_email} errorMessage={errors.office_info?.[index]?.office_email?.message as string}>
                  <Controller name={`office_info.${index}.office_email`} control={control} render={({ field }) => (<Input type="email" placeholder="office.contact@example.com" {...field} />)} />
              </FormItem>
              <FormItem label={`Phone ${index + 1}`} invalid={!!errors.office_info?.[index]?.office_phone} errorMessage={errors.office_info?.[index]?.office_phone?.message as string}>
                  <Controller name={`office_info.${index}.office_phone`} control={control} render={({ field }) => (<Input type="tel" placeholder="Office Phone Number" {...field} />)} />
              </FormItem>
              
              <div className="md:col-span-4 border-t dark:border-gray-600 pt-4 mt-2">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormItem label={`Country ${index + 1}`} invalid={!!errors.office_info?.[index]?.country_id} errorMessage={(errors.office_info?.[index]?.country_id as any)?.message as string}>
                      <Controller name={`office_info.${index}.country_id`} control={control} render={({ field }) => (<Select placeholder="Select Country" options={countryOptions} {...field} />)} />
                  </FormItem>
                  <FormItem label={`State ${index + 1}`} invalid={!!errors.office_info?.[index]?.state} errorMessage={errors.office_info?.[index]?.state?.message as string}>
                      <Controller name={`office_info.${index}.state`} control={control} render={({ field }) => (<Input placeholder="Enter state" {...field} />)} />
                  </FormItem>
                  <FormItem label={`City ${index + 1}`} invalid={!!errors.office_info?.[index]?.city} errorMessage={errors.office_info?.[index]?.city?.message as string}>
                      <Controller name={`office_info.${index}.city`} control={control} render={({ field }) => (<Input placeholder="Enter city" {...field} />)} />
                  </FormItem>
                  <FormItem label={`ZIP Code ${index + 1}`} invalid={!!errors.office_info?.[index]?.zip_code} errorMessage={errors.office_info?.[index]?.zip_code?.message as string}>
                      <Controller name={`office_info.${index}.zip_code`} control={control} render={({ field }) => (<Input placeholder="ZIP Code" {...field} />)} />
                  </FormItem>
                </div>
              </div>
              <FormItem label={`Address ${index + 1}`} className="md:col-span-4" invalid={!!errors.office_info?.[index]?.address} errorMessage={errors.office_info?.[index]?.address?.message as string}>
                <Controller name={`office_info.${index}.address`} control={control} render={({ field }) => (<Input placeholder="Full Address" {...field} />)} />
              </FormItem>
            </div>
          </Card>
        ))}
    </Card>
  );
};

// --- KYCDetailSection ---
const KYCDetailSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const kycDocs = [
    { label: "Aadhar Card", name: "aadhar_card_file" as const, remarkName: "aadhar_card_remark" as const, enabledName: "aadhar_card_remark_enabled" as const, required: true },
    { label: "PAN Card", name: "pan_card_file" as const, remarkName: "pan_card_remark" as const, enabledName: "pan_card_remark_enabled" as const, required: true },
    { label: "GST Certificate", name: "gst_certificate_file" as const, remarkName: "gst_certificate_remark" as const, enabledName: "gst_certificate_remark_enabled" as const, required: true },
    { label: "Visiting Card", name: "visiting_card_file" as const, remarkName: "visiting_card_remark" as const, enabledName: "visiting_card_remark_enabled" as const },
    { label: "Office Photo", name: "office_photo_file" as const, remarkName: "office_photo_remark" as const, enabledName: "office_photo_remark_enabled" as const, required: true },
    { label: "Authority Letter", name: "authority_letter_file" as const, remarkName: "authority_letter_remark" as const, enabledName: "authority_letter_remark_enabled" as const },
    { label: "Cancel Cheque", name: "cancel_cheque_file" as const, remarkName: "cancel_cheque_remark" as const, enabledName: "cancel_cheque_remark_enabled" as const, required: true },
    { label: "194Q Declaration", name: "ABCQ_file" as const, remarkName: "ABCQ_remark" as const, enabledName: "ABCQ_remark_enabled" as const },
    { label: "Other Document", name: "other_document_file" as const, remarkName: "other_document_remark" as const, enabledName: "other_document_remark_enabled" as const },
  ];

  return (
    <Card id="kycDocuments">
      <h5 className="mb-4">KYC Documents</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
        {kycDocs.map((doc) => {
          const fileValue = watch(doc.name);
          const isImageFile = (file: unknown): file is File => file instanceof File && file.type.startsWith("image/");
          const isImageUrl = (url: unknown): url is string => typeof url === "string" && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);
          
          return (
           <div key={doc.name}>
                <label className="flex items-center gap-2 mb-1">
                    <Controller name={doc.enabledName} control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={field.onChange} />)} />
                    {doc.label} {doc.required && <span className="text-red-500">*</span>}
                </label>
              <FormItem invalid={!!(errors as any)[doc.name]} errorMessage={(errors as any)[doc.name]?.message as string} >
                <Controller name={doc.name} control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} onChange={(e) => onChange(e.target.files?.[0])} {...rest} />)} />
              </FormItem>
              {fileValue && (
                <div className="mt-2">
                  {isImageFile(fileValue) ? (
                    <img src={URL.createObjectURL(fileValue)} alt="Preview" className="h-20 w-auto object-contain border rounded p-1" />
                  ) : isImageUrl(fileValue) ? (
                    <img src={`${fileValue}`} alt="Preview" className="h-20 w-auto object-contain border rounded p-1" />
                  ) : (
                    <div className="text-xs">
                      {typeof fileValue === "string" ? (
                        <a href={`${fileValue}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"> View Document </a>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">{(fileValue as File).name}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <FormItem className="mt-2" invalid={!!(errors as any)[doc.remarkName]} errorMessage={(errors as any)[doc.remarkName]?.message as string} >
                <Controller name={doc.remarkName} control={control} render={({ field }) => (<Input placeholder={`Remark for ${doc.label}`} {...field} />)} />
              </FormItem>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- BankDetailsSection ---
const BankDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const bankTypeOptions = [ { value: "Primary", label: "Primary" }, { value: "Secondary", label: "Secondary" }, { value: "Other", label: "Other" } ];
  
  const { fields, append, remove } = useFieldArray({ control, name: "company_bank_details" });
  
  const primaryBankPhotoValue = watch("primary_bank_verification_photo");
  const secondaryBankPhotoValue = watch("secondary_bank_verification_photo");

  return (
    <Card id="bankDetails">
      <h4 className="mb-6">Bank Details (Primary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <FormItem label="Primary Account Number" invalid={!!errors.primary_account_number} errorMessage={errors.primary_account_number?.message as string}>
          <Controller name="primary_account_number" control={control} render={({ field }) => (<Input placeholder="Primary Account No." {...field} />)} />
        </FormItem>
        <FormItem label="Primary Bank Name" invalid={!!errors.primary_bank_name} errorMessage={errors.primary_bank_name?.message as string}>
          <Controller name="primary_bank_name" control={control} render={({ field }) => (<Input type="text" {...field} placeholder="Enter Bank Name" />)} />
        </FormItem>
        <FormItem label="Primary IFSC Code" invalid={!!errors.primary_ifsc_code} errorMessage={errors.primary_ifsc_code?.message as string}>
          <Controller name="primary_ifsc_code" control={control} render={({ field }) => (<Input placeholder="Primary IFSC" {...field} />)} />
        </FormItem>
         <FormItem label="Primary Swift Code" invalid={!!errors.primary_swift_code} errorMessage={errors.primary_swift_code?.message as string}>
          <Controller name="primary_swift_code" control={control} render={({ field }) => (<Input placeholder="Primary Swift Code" {...field} />)} />
        </FormItem>
        <FormItem label="Primary Bank Verification Photo" className="md:col-span-4" invalid={!!errors.primary_bank_verification_photo} errorMessage={(errors.primary_bank_verification_photo as any)?.message as string}>
          <Controller name="primary_bank_verification_photo" control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest}/>)} />
          {primaryBankPhotoValue && (
            <div className="mt-1">
                {primaryBankPhotoValue instanceof File ? (<img src={URL.createObjectURL(primaryBankPhotoValue)} alt="Primary bank photo" className="h-16 w-auto"/>)
                : typeof primaryBankPhotoValue === 'string' ? (<img src={`${primaryBankPhotoValue}`} alt="Primary bank photo" className="h-16 w-auto"/>)
                : null}
            </div>
          )}
        </FormItem>
      </div>

      <hr className="my-3" />
      <h4 className="mb-6">Bank Details (Secondary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <FormItem label="Secondary Account Number" invalid={!!errors.secondary_account_number} errorMessage={errors.secondary_account_number?.message as string}>
          <Controller name="secondary_account_number" control={control} render={({ field }) => (<Input placeholder="Secondary Account No." {...field} />)} />
        </FormItem>
        <FormItem label="Secondary Bank Name" invalid={!!errors.secondary_bank_name} errorMessage={errors.secondary_bank_name?.message as string}>
          <Controller name="secondary_bank_name" control={control} render={({ field }) => (<Input type="text" {...field} placeholder="Enter Bank Name" />)} />
        </FormItem>
        <FormItem label="Secondary IFSC Code" invalid={!!errors.secondary_ifsc_code} errorMessage={errors.secondary_ifsc_code?.message as string}>
          <Controller name="secondary_ifsc_code" control={control} render={({ field }) => (<Input placeholder="Secondary IFSC" {...field} />)} />
        </FormItem>
         <FormItem label="Secondary Swift Code" invalid={!!errors.secondary_swift_code} errorMessage={errors.secondary_swift_code?.message as string}>
          <Controller name="secondary_swift_code" control={control} render={({ field }) => (<Input placeholder="Secondary Swift Code" {...field} />)} />
        </FormItem>
        <FormItem label="Secondary Bank Verification Photo" className="md:col-span-4" invalid={!!errors.secondary_bank_verification_photo} errorMessage={(errors.secondary_bank_verification_photo as any)?.message as string}>
          <Controller name="secondary_bank_verification_photo" control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />)} />
           {secondaryBankPhotoValue && (
             <div className="mt-1">
                {secondaryBankPhotoValue instanceof File ? (<img src={URL.createObjectURL(secondaryBankPhotoValue)} alt="Secondary bank photo" className="h-16 w-auto"/>)
                : typeof secondaryBankPhotoValue === 'string' ? (<img src={`${secondaryBankPhotoValue}`} alt="Secondary bank photo" className="h-16 w-auto"/>)
                : null}
            </div>
           )}
        </FormItem>
      </div>

      <hr className="my-6" />
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Additional Bank Details</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ bank_account_number: "", bank_name: undefined, ifsc_code: "", swift_code: "", verification_photo: null, type: undefined })}> Add More Banks </Button>
      </div>
      {fields.map((item, index) => {
        const bankPhotoValue = watch(`company_bank_details.${index}.verification_photo`);
        return (
          <Card key={item.id} className="mb-4 border dark:border-gray-600 relative rounded-md" bodyClass="p-4">
            <Button type="button" size="xs" variant="plain" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"> Remove </Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 items-start">
              <FormItem label={`Type ${index + 1}`} invalid={!!errors.company_bank_details?.[index]?.type} errorMessage={(errors.company_bank_details?.[index]?.type as any)?.message as string}>
                <Controller name={`company_bank_details.${index}.type`} control={control} render={({ field }) => (<Select placeholder="Select Type" options={bankTypeOptions} {...field} />)} />
              </FormItem>
              <FormItem label={`Account Number ${index + 1}`} invalid={!!errors.company_bank_details?.[index]?.bank_account_number} errorMessage={errors.company_bank_details?.[index]?.bank_account_number?.message as string}>
                <Controller name={`company_bank_details.${index}.bank_account_number`} control={control} render={({ field }) => (<Input placeholder="Account No." {...field} />)} />
              </FormItem>
              <FormItem label={`Bank Name ${index + 1}`} invalid={!!errors.company_bank_details?.[index]?.bank_name} errorMessage={errors.company_bank_details?.[index]?.bank_name?.message as string}>
                <Controller name={`company_bank_details.${index}.bank_name`} control={control} render={({ field }) => (<Input type="text" {...field} placeholder="Enter Bank Name" />)} />
              </FormItem>
              <FormItem label={`IFSC Code ${index + 1}`} invalid={!!errors.company_bank_details?.[index]?.ifsc_code} errorMessage={errors.company_bank_details?.[index]?.ifsc_code?.message as string}>
                <Controller name={`company_bank_details.${index}.ifsc_code`} control={control} render={({ field }) => (<Input placeholder="IFSC" {...field} />)} />
              </FormItem>
               <FormItem label={`Swift Code ${index + 1}`} invalid={!!errors.company_bank_details?.[index]?.swift_code} errorMessage={errors.company_bank_details?.[index]?.swift_code?.message as string}>
                <Controller name={`company_bank_details.${index}.swift_code`} control={control} render={({ field }) => (<Input placeholder="Swift Code" {...field} />)} />
              </FormItem>
              <FormItem label={`Bank Verification Photo ${index + 1}`} className="md:col-span-1">
                <Controller name={`company_bank_details.${index}.verification_photo`} control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest}/>)} />
                 {bankPhotoValue && (
                    <div className="mt-1">
                        {bankPhotoValue instanceof File ? (<img src={URL.createObjectURL(bankPhotoValue)} alt={`Bank ${index + 1} photo`} className="h-16 w-auto"/>)
                        : typeof bankPhotoValue === 'string' ? (<img src={`${bankPhotoValue}`} alt={`Bank ${index + 1} photo`} className="h-16 w-auto"/>)
                        : null}
                    </div>
                 )}
              </FormItem>
            </div>
          </Card>
        );
      })}
    </Card>
  );
};

// --- SpotVerificationSection ---
const SpotVerificationSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const { fields, append, remove } = useFieldArray({ control, name: "company_spot_verification" });
  const { MemberData } = useSelector(masterSelector);
  
  const memberOptions = useMemo(() => {
    const data = MemberData?.data || MemberData || [];
    return Array.isArray(data)
      ? data.map((m: any) => ({
          value: String(m.id),
          label: `${m.name || 'N/A'} (ID:${m.id})`,
        }))
      : [];
  }, [MemberData]);

  return (
    <Card id="spotVerification">
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Spot Verifications</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ verified: false, verified_by: undefined, photo_upload: null, remark: "" })}> Add Verification Entry </Button>
      </div>
      {fields.map((item, index) => {
        const photoValue = watch(`company_spot_verification.${index}.photo_upload`);
        return (
          <Card key={item.id} className="mb-4 border dark:border-gray-600 rounded-md relative" bodyClass="p-4">
            <Button type="button" variant="plain" size="xs" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10" > Remove </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-start">
              <div className="flex items-center gap-4">
                <Controller name={`company_spot_verification.${index}.verified`} control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={field.onChange} />)} />
                <FormItem label={`Verified By ${index+1}`} className="flex-grow" invalid={!!errors.company_spot_verification?.[index]?.verified_by} errorMessage={(errors.company_spot_verification?.[index]?.verified_by as any)?.message as string}>
                  <Controller name={`company_spot_verification.${index}.verified_by`} control={control} render={({ field }) => (<Select placeholder="Select Employee" options={memberOptions} {...field} />)} />
                </FormItem>
              </div>
              <FormItem label={`Upload Document ${index+1}`}>
                <Controller name={`company_spot_verification.${index}.photo_upload`} control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest}/>)} />
                {photoValue && (
                  <div className="mt-1">
                    {photoValue instanceof File ? (<span className="text-sm text-gray-500">{photoValue.name}</span>)
                    : typeof photoValue === 'string' ? (<a href={`${photoValue}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline"> View Uploaded </a>)
                    : null}
                  </div>
                )}
              </FormItem>
              <FormItem label={`Remark ${index+1}`} className="md:col-span-2">
                <Controller name={`company_spot_verification.${index}.remark`} control={control} render={({ field }) => (<Input placeholder="Add remark here..." {...field} />)} />
              </FormItem>
            </div>
          </Card>
        );
      })}
    </Card>
  );
};

// --- ReferenceSection ---
const ReferenceSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { CompanyData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    if(!CompanyData || !CompanyData.data || CompanyData.data.length === 0) {
        dispatch(getCompanyAction());
    }
  }, [dispatch, CompanyData]);

  const companyOptions = useMemo(() => 
    (CompanyData?.data || []).map((c: any) => ({
        value: String(c.id),
        label: c.company_name || `Company ID: ${c.id}`,
    })), [CompanyData]);

  const { fields, append, remove } = useFieldArray({ control, name: "company_references" });

  return (
    <Card id="reference">
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">References</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ person_name: "", company_id: undefined, number: "", remark: "" })}> Add Reference </Button>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border dark:border-gray-600 relative rounded-md" bodyClass="p-4">
          <Button type="button" variant="plain" size="xs" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10" > Remove </Button>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 items-start">
            <FormItem label={`Person Name ${index+1}`} invalid={!!errors.company_references?.[index]?.person_name} errorMessage={errors.company_references?.[index]?.person_name?.message as string}>
              <Controller name={`company_references.${index}.person_name`} control={control} render={({ field }) => (<Input placeholder="Person's Name" {...field} />)} />
            </FormItem>
            <FormItem label={`Company Name ${index+1}`} invalid={!!errors.company_references?.[index]?.company_id} errorMessage={(errors.company_references?.[index]?.company_id as any)?.message as string}>
              <Controller name={`company_references.${index}.company_id`} control={control} render={({ field }) => (<Select placeholder="Company Name" options={companyOptions} {...field} />)} />
            </FormItem>
            <FormItem label={`Contact Number ${index+1}`} invalid={!!errors.company_references?.[index]?.number} errorMessage={errors.company_references?.[index]?.number?.message as string}>
              <Controller name={`company_references.${index}.number`} control={control} render={({ field }) => (<Input placeholder="Contact Number" {...field} />)} />
            </FormItem>
            <FormItem label={`Remark ${index+1}`} className="sm:col-span-3">
              <Controller name={`company_references.${index}.remark`} control={control} render={({ field }) => (<Input placeholder="Add remarks here..." {...field} />)} />
            </FormItem>
          </div>
        </Card>
      ))}
    </Card>
  );
};

// --- AccessibilitySection ---
const AccessibilitySection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const { fields, append, remove } = useFieldArray({ control, name: "billing_documents" });
  const { fields: enabledFields, append: appendEnabled, remove: removeEnabled } = useFieldArray({ control, name: "enabled_billing_docs"});

  const enabledBillDocTypes = [
    { label: 'Proforma Invoice', value: 'Proforma Invoice'},
    { label: 'Commercial Invoice', value: 'Commercial Invoice'},
    { label: 'Packing List', value: 'Packing List'},
    { label: 'Certificate of Origin', value: 'Certificate of Origin'},
  ];

  return (
    <Card id="accessibility">
      <h4 className="mb-6">Accessibility & Configuration</h4>
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex items-center gap-x-8">
          <FormItem label={<div>User Access</div>} invalid={!!errors.USER_ACCESS} errorMessage={(errors.USER_ACCESS as any)?.message as string}>
            <Controller name="USER_ACCESS" control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={field.onChange}> Enabled </Checkbox>)} />
          </FormItem>
        </div>
        <hr />
        <div className="flex justify-between items-center">
          <h5 className="mb-0">Billing Documents</h5>
          <div className="flex gap-2">
            <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ document_name: "", document: null })}> Add Billing Doc </Button>
            <Button type="button" icon={<TbPlus />} size="sm" onClick={() => appendEnabled({ document_type: undefined, document_file: null })}> Add Enable Billing Documents </Button>
          </div>
        </div>
        
        {/* Old Billing Docs */}
        {fields.map((item, index) => {
          const docFileValue = watch(`billing_documents.${index}.document`);
          return (
            <Card key={item.id} className="border dark:border-gray-600 rounded-md" bodyClass="p-4">
              <div className="md:grid grid-cols-1 md:grid-cols-9 gap-4 items-start">
                <FormItem label={`Doc Name ${index+1}`} className="md:col-span-4" invalid={!!errors.billing_documents?.[index]?.document_name} errorMessage={errors.billing_documents?.[index]?.document_name?.message as string}>
                  <Controller name={`billing_documents.${index}.document_name`} control={control} render={({ field }) => (<Input placeholder="e.g., Invoice Template" {...field} />)} />
                </FormItem>
                <FormItem label={`Upload Doc ${index+1}`} className="md:col-span-4">
                  <Controller name={`billing_documents.${index}.document`} control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest}/>)} />
                  {docFileValue && (
                     <div className="mt-1">
                        {docFileValue instanceof File ? (<span className="text-sm text-gray-500">{docFileValue.name}</span>)
                        : typeof docFileValue === 'string' ? (<a href={`${docFileValue}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline"> View Uploaded </a>)
                        : null}
                    </div>
                  )}
                </FormItem>
                <Button type="button" shape="circle" size="sm" className="mt-2 md:mt-0 md:self-center" icon={<TbTrash />} onClick={() => remove(index)} variant="plain" />
              </div>
            </Card>
          );
        })}

        {/* New Enabled Billing Docs */}
        {enabledFields.length > 0 && <h6 className="mt-4 -mb-2">Enabled Billing Documents</h6>}
        {enabledFields.map((item, index) => {
            const docFileValue = watch(`enabled_billing_docs.${index}.document_file`);
            return (
                 <Card key={item.id} className="border dark:border-gray-600 rounded-md" bodyClass="p-4">
                    <div className="md:grid grid-cols-1 md:grid-cols-9 gap-4 items-start">
                        <FormItem label={`Document Type ${index+1}`} className="md:col-span-4" invalid={!!errors.enabled_billing_docs?.[index]?.document_type} errorMessage={(errors.enabled_billing_docs?.[index]?.document_type as any)?.message as string}>
                            <Controller name={`enabled_billing_docs.${index}.document_type`} control={control} render={({field}) => <Select placeholder="Select Document Type" options={enabledBillDocTypes} {...field} />} />
                        </FormItem>
                        <FormItem label={`Upload File ${index+1}`} className="md:col-span-4">
                            <Controller name={`enabled_billing_docs.${index}.document_file`} control={control} render={({ field: { onChange, ref, value, ...rest } }) => (<Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest}/>)} />
                            {docFileValue && (
                                <div className="mt-1">
                                    {docFileValue instanceof File ? (<span className="text-sm text-gray-500">{docFileValue.name}</span>)
                                    : typeof docFileValue === 'string' ? (<a href={`${docFileValue}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline"> View Uploaded </a>)
                                    : null}
                                </div>
                            )}
                        </FormItem>
                        <Button type="button" shape="circle" size="sm" className="mt-2 md:mt-0 md:self-center" icon={<TbTrash />} onClick={() => removeEnabled(index)} variant="plain" />
                    </div>
                </Card>
            )
        })}
      </div>
    </Card>
  );
};

// --- MemberManagementSection ---
const MemberManagementSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const dispatch = useAppDispatch();
  const { MemberData } = useSelector(masterSelector);
  const { fields, append, remove } = useFieldArray({ control, name: "company_members" });
  
  const memberOptions = useMemo(() => {
    const data = MemberData?.data || MemberData || [];
    
    return Array.isArray(data)
      ? data.map((m: any) => ({
          value: String(m.id),
          label: `${m.name || 'N/A'} (ID:${m.id})`,
          status: m.status, 
        }))
      : [];
  }, [MemberData]);

  useEffect(() => {
    if (!MemberData) {
        dispatch(getMemberAction());
    }
  }, [dispatch, MemberData]);

  return (
    <Card id="memberManagement">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h4 className="mb-0">Member Management</h4>
        <div className="flex gap-2">
            <Button type="button" size="sm" icon={<TbPlus />} onClick={() => append({ member_id: undefined, designation: "", person_name: "", number: "" })}>Add Member</Button>
            <Button as={NavLink} to="/business-entities/member-create" type="button" size="sm" icon={<TbPlus />}>Create New Member</Button>
        </div>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border dark:border-gray-600 relative rounded-md" bodyClass="p-4">
            <Button type="button" variant="plain" size="xs" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10">Remove</Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
                <FormItem label={`Member ${index+1}`} invalid={!!errors.company_members?.[index]?.member_id} errorMessage={(errors.company_members?.[index]?.member_id as any)?.message as string}>
                    <Controller 
                      name={`company_members.${index}.member_id`} 
                      control={control} 
                      render={({ field }) => (
                        <Select 
                          placeholder="Select Member" 
                          options={memberOptions} 
                          value={field.value}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption); 
                            
                            const fullMember = memberOptions.find(opt => opt.value === selectedOption?.value);
                            
                            if (fullMember && fullMember.status?.toLowerCase() !== 'active') {
                                toast.push(
                                    <Notification type="warning" title="Member Inactive" duration={4000}>
                                        The selected member '{fullMember.label}' is currently not active.
                                    </Notification>
                                );
                            }
                          }} 
                        />
                      )} 
                    />
                </FormItem>
                <FormItem label={`Designation ${index+1}`} invalid={!!errors.company_members?.[index]?.designation} errorMessage={errors.company_members?.[index]?.designation?.message as string}>
                    <Controller name={`company_members.${index}.designation`} control={control} render={({ field }) => (<Input placeholder="Designation in this company" {...field} />)} />
                </FormItem>
                <FormItem label={`Person Name (Override) ${index+1}`} invalid={!!errors.company_members?.[index]?.person_name} errorMessage={errors.company_members?.[index]?.person_name?.message as string}>
                    <Controller name={`company_members.${index}.person_name`} control={control} render={({ field }) => (<Input placeholder="Display Name" {...field} />)} />
                </FormItem>
                <FormItem label={`Contact No. (Override) ${index+1}`} invalid={!!errors.company_members?.[index]?.number} errorMessage={errors.company_members?.[index]?.number?.message as string}>
                    <Controller name={`company_members.${index}.number`} control={control} render={({ field }) => (<Input type="tel" placeholder="Contact Number" {...field} />)} />
                </FormItem>
            </div>
        </Card>
      ))}
    </Card>
  );
};

// --- TeamManagementSection ---
const TeamManagementSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { fields, append, remove } = useFieldArray({ control, name: "company_teams" });

  return (
    <Card id="teamManagement">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h4 className="mb-0">Team Management</h4>
        <Button type="button" size="sm" icon={<TbPlus />} onClick={() => append({ team_name: "", designation: "", person_name: "", number: "" })}>Add Team Member</Button>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border dark:border-gray-600 relative rounded-md" bodyClass="p-4">
          <Button type="button" variant="plain" size="xs" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10">Remove</Button>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
            <FormItem label={`Team Name ${index + 1}`} invalid={!!errors.company_teams?.[index]?.team_name} errorMessage={errors.company_teams?.[index]?.team_name?.message as string}>
              <Controller name={`company_teams.${index}.team_name`} control={control} render={({ field }) => (<Input placeholder="e.g., Sales Team" {...field} />)} />
            </FormItem>
            <FormItem label={`Designation ${index + 1}`} invalid={!!errors.company_teams?.[index]?.designation} errorMessage={errors.company_teams?.[index]?.designation?.message as string}>
              <Controller name={`company_teams.${index}.designation`} control={control} render={({ field }) => (<Input placeholder="e.g., Manager" {...field} />)} />
            </FormItem>
            <FormItem label={`Person Name ${index + 1}`} invalid={!!errors.company_teams?.[index]?.person_name} errorMessage={errors.company_teams?.[index]?.person_name?.message as string}>
              <Controller name={`company_teams.${index}.person_name`} control={control} render={({ field }) => (<Input placeholder="Person Name" {...field} />)} />
            </FormItem>
            <FormItem label={`Contact No. ${index + 1}`} invalid={!!errors.company_teams?.[index]?.number} errorMessage={errors.company_teams?.[index]?.number?.message as string}>
              <Controller name={`company_teams.${index}.number`} control={control} render={({ field }) => (<Input type="tel" placeholder="Contact Number" {...field} />)} />
            </FormItem>
          </div>
        </Card>
      ))}
    </Card>
  );
};


// --- CompanyFormComponent ---
type CompanyFormComponentProps = {
  onFormSubmit: (values: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => void;
  defaultValues?: Partial<CompanyFormSchema>;
  isEditMode?: boolean;
  onDiscard?: () => void;
  isSubmitting?: boolean;
};

const CompanyFormComponent = (props: CompanyFormComponentProps) => {
    const { onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting } = props;
    const [activeSection, setActiveSection] = useState<string>(companyNavigationList[0].link);

    const fileValidation = z.any().refine(val => val !== null && val !== undefined && val !== '', { message: "File is required." });

    const companySchema = z.object({
        id: z.union([z.string(), z.number()]).optional(),
        company_name: z.string().trim().min(1, "Company Name is required."),
        // primary_contact_number: z.string().trim().min(1, "Primary Contact Number is required.").regex(/^\d{7,15}$/, "Invalid contact number (7-15 digits)."),
        // primary_contact_number_code: z.object({ label: z.string(), value: z.string() }, { required_error: "Country code is required." }),
        // general_contact_number: z.string().trim().min(1, "Landline number is required.").regex(/^\d{7,15}$/, "Invalid contact number (7-15 digits)."),
        // general_contact_number_code: z.object({ label: z.string(), value: z.string() }, { required_error: "Country code is required." }),
        alternate_contact_number: z.string().trim().regex(/^\d{7,15}$/, "Invalid contact number (7-15 digits).").optional().or(z.literal("")).nullable(),
        alternate_contact_number_code: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
        // primary_email_id: z.string().trim().min(1, "Primary Email is required.").email("Invalid email format."),
        alternate_email_id: z.string().trim().email("Invalid email format.").optional().or(z.literal("")).nullable(),
        ownership_type: z.object({ label: z.string(), value: z.string().min(1, "Ownership Type is required.") }, { required_error: "Ownership Type is required." }),
        owner_name: z.string().trim().min(1, "Owner/Director Name is required."),
        // company_address: z.string().trim().min(1, "Company Address is required."),
        city: z.string().trim(),
        // state: z.string().trim().min(1, "State is required."),
        // zip_code: z.string().trim().min(1, "ZIP/Postal Code is required.").regex(/^\d{3,10}$/, "Invalid ZIP code format."),
        country_id: z.object({ label: z.string(), value: z.string().min(1, "Country is required.") }, { required_error: "Country is required." }),
        continent_id: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
        gst_number: z.string().trim().min(1, "GST Number is required.").regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format."),
        pan_number: z.string().trim().min(1, "PAN Number is required.").regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card number format."),
        // trn_number: z.string().trim().min(1, "TRN Number is required."),
        // tan_number: z.string().trim().min(1, "TAN Number is required."),
        establishment_year: z.string().trim().regex(/^\d{4}$/, "Invalid year format (YYYY).").optional().or(z.literal("")).nullable(),
        no_of_employees: z.union([z.number().int().positive().optional().nullable(), z.string().regex(/^\d+$/).optional().nullable(), z.literal("")]).optional().nullable(),
        company_website: z.string().trim().url("Invalid website URL.").optional().or(z.literal("")).nullable(),
        company_logo: z.any().optional().nullable(),
        primary_business_type: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
        status: z.object({ label: z.string(), value: z.string().min(1, "Status is required.") }, { required_error: "Status is required." }),
        // support_email: z.string().trim().email("Invalid email format.").optional().or(z.literal("")).nullable(),
        notification_email: z.string().trim().email("Invalid email format.").optional().or(z.literal("")).nullable(),
    
        company_certificate: z.array(z.object({
            certificate_id: z.string(),
            certificate_name: z.string().trim(),
            upload_certificate: z.any().optional().nullable(),
        })).optional(),
        office_info: z.array(z.object({
            office_type: z.object({ label: z.string(), value: z.string() }, { required_error: "Office type is required." }),
            office_name: z.string().trim(),
            address: z.string().trim(),
            country_id: z.object({ label: z.string(), value: z.string()}, { required_error: "Country is required." }),
            state: z.string().trim(),
            city: z.string().trim(),
            zip_code: z.string().trim().regex(/^\d{3,10}$/, "Invalid ZIP code format."),
            gst_number: z.string().trim().optional().or(z.literal("")).nullable(),
            contact_person: z.string().trim().optional().nullable(),
            office_email: z.string().trim().email("Invalid email format.").optional().nullable(),
            office_phone: z.string().regex(/^\d{7,15}$/, "Invalid phone number.").optional().nullable(),
        })).optional(),
        
        // KYC Docs
        aadhar_card_file: fileValidation,
        pan_card_file: fileValidation,
        gst_certificate_file: fileValidation,
        cancel_cheque_file: fileValidation,
        office_photo_file: fileValidation,
        
        primary_account_number: z.string().trim().optional().or(z.literal("")).nullable(),
        primary_bank_name: z.string().trim().optional().or(z.literal("")).nullable(),
        primary_ifsc_code: z.string().trim().optional().or(z.literal("")).nullable(),
        primary_swift_code: z.string().trim().optional().or(z.literal("")).nullable(),
        primary_bank_verification_photo: z.any().optional().nullable(),
        secondary_account_number: z.string().trim().optional().or(z.literal("")).nullable(),
        secondary_bank_name: z.string().trim().optional().or(z.literal("")).nullable(),
        secondary_ifsc_code: z.string().trim().optional().or(z.literal("")).nullable(),
        secondary_swift_code: z.string().trim().optional().or(z.literal("")).nullable(),
        secondary_bank_verification_photo: z.any().optional().nullable(),
        company_bank_details: z.array(z.object({
            bank_account_number: z.string().trim().min(1,"Account number required if bank entry added"),
            bank_name: z.string().min(1,"Bank name required"),
            ifsc_code: z.string().trim().min(1,"IFSC code required"),
            swift_code: z.string().trim().optional().nullable(),
            verification_photo: z.any().optional().nullable(),
            type: z.object({ label: z.string(), value: z.string().min(1, "Bank type required") }, {required_error: "Bank type is required"}),
        })).optional(),
    
        USER_ACCESS: z.boolean({required_error: "User Access selection is required"}),
        billing_documents: z.array(z.object({
            document_name: z.string().trim().min(1, "Document name is required."),
            document: z.any().optional().nullable(),
        })).optional(),
        enabled_billing_docs: z.array(z.object({
            document_type: z.object({ label: z.string(), value: z.string()}, { required_error: "Document type is required."}),
            document_file: z.any().optional().nullable()
        })).optional(),
        
        company_members: z.array(z.object({
            member_id: z.object({ label: z.string(), value: z.string() }, {required_error: "Member selection is required."}),
            designation: z.string().trim().min(1, "Designation is required."),
            person_name: z.string().trim().optional().nullable(),
            number: z.string().trim().optional().nullable(),
        })).optional(),
    
        company_teams: z.array(z.object({
            team_name: z.string().trim().min(1, "Team Name is required."),
            designation: z.string().trim().min(1, "Designation is required."),
            person_name: z.string().trim().min(1, "Person Name is required."),
            number: z.string().trim().min(1, "Contact Number is required.").regex(/^\d+$/, "Invalid number format"),
        })).optional(),
    
        company_spot_verification: z.array(z.object({
            verified: z.boolean().optional(),
            verified_by: z.object({ label: z.string(), value: z.string() }, {required_error: "Verifier selection is required."}),
            photo_upload: z.any().optional().nullable(),
            remark: z.string().trim().optional().or(z.literal("")).nullable(),
        })).optional(),
        company_references: z.array(z.object({
            person_name: z.string().trim().min(1, "Person name is required."),
            company_id: z.object({ label: z.string(), value: z.string().min(1, "Company is required.")}, {required_error: "Company selection is required"}),
            number: z.string().trim().min(1, "Contact number is required.").regex(/^\d+$/, "Invalid number format"),
            remark: z.string().trim().optional().or(z.literal("")).nullable(),
        })).optional(),
    }).passthrough();
  
    const formMethods = useForm<CompanyFormSchema>({
      defaultValues: defaultValues || {},
      resolver: zodResolver(companySchema),
      mode: "onTouched",
    });
    const {
      handleSubmit,
      reset,
      formState: { errors },
      control,
      getValues,
    } = formMethods;
  
    useEffect(() => {
      if (defaultValues) {
        reset(defaultValues);
      }
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
      const sectionProps = { errors, control, formMethods, getValues };
      switch (activeSection) {
        case "companyDetails": return <CompanyDetailsSection {...sectionProps} />;
        case "kycDocuments": return <KYCDetailSection {...sectionProps} />;
        case "bankDetails": return <BankDetailsSection {...sectionProps} />;
        case "spotVerification": return <SpotVerificationSection {...sectionProps} />;
        case "reference": return <ReferenceSection {...sectionProps} />;
        case "accessibility": return <AccessibilitySection {...sectionProps} />;
        case "memberManagement": return <MemberManagementSection {...sectionProps} />;
        case "teamManagement": return <TeamManagementSection {...sectionProps} />;
        default: return <CompanyDetailsSection {...sectionProps} />;
      }
    };
  
    return (
      <>
        <div className="flex gap-1 items-end mb-3">
          <NavLink to="/business-entities/company">
            <h6 className="font-semibold hover:text-primary-600">Company</h6>
          </NavLink>
          <BiChevronRight size={22} />
          <h6 className="font-semibold text-primary-600 dark:text-primary-300">
            {isEditMode ? "Edit Company" : "Add New Company"}
          </h6>
        </div>
        <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
          <NavigatorComponent activeSection={activeSection} onNavigate={setActiveSection} />
        </Card>
        <form onSubmit={handleSubmit(internalFormSubmit, (err) => console.log("Zod Validation Errors:", err))} className="flex flex-col gap-4 pb-20">
          {renderActiveSection()}
        </form>
        <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center p-4">
            <div>
              {onDiscard && (
                <Button type="button" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"} icon={<TbTrash />} onClick={onDiscard} disabled={isSubmitting} >
                  Discard
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={handlePrevious} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === 0} > Previous </Button>
              <Button type="button" onClick={handleNext} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === navigationKeys.length - 1} > Next </Button>
              <Button variant="solid" type="button" loading={isSubmitting} onClick={handleSubmit(internalFormSubmit, (err) => {
                  console.log("Validation Errors: ", err);
                  toast.push(<Notification type="danger" title="Validation Error">Please fix the errors before submitting.</Notification>);
              })} disabled={isSubmitting} > {isEditMode ? "Update" : "Create"} </Button>
            </div>
          </div>
        </Card>
      </>
    );
};

// --- CompanyFormPage (Combined Add/Edit Page) ---
const CompanyCreate = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [initialData, setInitialData] = useState<Partial<CompanyFormSchema> | null>(null);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { CountriesData, ContinentsData, MemberData, CompanyData: AllCompaniesData } = useSelector(masterSelector);


  const getEmptyFormValues = (): CompanyFormSchema => ({
    company_name: "", primary_contact_number: "", primary_contact_number_code: undefined,
    general_contact_number: "", general_contact_number_code: undefined,
    alternate_contact_number: "", alternate_contact_number_code: null,
    primary_email_id: "", alternate_email_id: "", ownership_type: undefined,
    owner_name: "", company_address: "", city: "", state: "", zip_code: "",
    country_id: undefined, continent_id: null, gst_number: "", pan_number: "",
    trn_number: "", tan_number: "", establishment_year: "", no_of_employees: "",
    company_website: "", company_logo: null, primary_business_type: null,
    status: undefined, support_email: "", notification_email: "",
    company_certificate: [], office_info: [],
    declaration_206ab: null, declaration_206ab_remark: "", declaration_206ab_remark_enabled: false,
    ABCQ_file: null, ABCQ_remark: "", ABCQ_remark_enabled: false,
    office_photo_file: null, office_photo_remark: "", office_photo_remark_enabled: false,
    gst_certificate_file: null, gst_certificate_remark: "", gst_certificate_remark_enabled: false,
    authority_letter_file: null, authority_letter_remark: "", authority_letter_remark_enabled: false,
    visiting_card_file: null, visiting_card_remark: "", visiting_card_remark_enabled: false,
    cancel_cheque_file: null, cancel_cheque_remark: "", cancel_cheque_remark_enabled: false,
    aadhar_card_file: null, aadhar_card_remark: "", aadhar_card_remark_enabled: false,
    pan_card_file: null, pan_card_remark: "", pan_card_remark_enabled: false,
    other_document_file: null, other_document_remark: "", other_document_remark_enabled: false,
    primary_account_number: "", primary_bank_name: null, primary_ifsc_code: "",
    primary_swift_code: "", primary_bank_verification_photo: null, 
    secondary_account_number: "", secondary_bank_name: null, secondary_ifsc_code: "",
    secondary_swift_code: "", secondary_bank_verification_photo: null, 
    company_bank_details: [],
    USER_ACCESS: false, billing_documents: [], enabled_billing_docs: [],
    company_members: [], company_teams: [],
    company_spot_verification: [], company_references: [],
  });

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getBrandAction());
    dispatch(getCategoriesAction());
    dispatch(getMemberAction());
    dispatch(getCompanyAction());
  }, [dispatch]);

  useEffect(() => {
    // Guard clause to prevent running until all lookup data is available.
    const lookupsReady = CountriesData?.length > 0 && ContinentsData?.length > 0 && MemberData && AllCompaniesData;

    if (isEditMode && id && lookupsReady) {
      const fetchCompanyData = async () => {
        setPageLoading(true);
        try {
          const actionResult = await dispatch(getCompanyByIdAction(id)).unwrap();
          if (actionResult) {
            const allMembersForSelect = (MemberData?.data || []).map((m: any) => ({ value: String(m.id), label: `${m.name} (ID:${m.id})` }));
            const allCompaniesForRefSelect = (AllCompaniesData?.data || []).map((c: any) => ({ value: String(c.id), label: c.company_name }));
            const transformed = transformApiToFormSchema(
              actionResult, 
              CountriesData, 
              ContinentsData,
              allMembersForSelect,
              allCompaniesForRefSelect
            );
            setInitialData({ ...getEmptyFormValues(), ...transformed });
          } else {
            toast.push(<Notification type="danger" title="Fetch Error"> Company data not found. </Notification>);
            navigate("/business-entities/company");
          }
        } catch (error: any) {
          toast.push(<Notification type="danger" title="Fetch Error"> {error?.message || "Error fetching company data."} </Notification>);
          navigate("/business-entities/company");
        } finally {
          setPageLoading(false);
        }
      };
      fetchCompanyData();
    } else if (!isEditMode) {
      setInitialData(getEmptyFormValues());
      setPageLoading(false);
    }
  }, [id, isEditMode, navigate, dispatch, CountriesData, ContinentsData, MemberData, AllCompaniesData]);


  const handleFormSubmit = async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
    setIsSubmitting(true);
    const payload = preparePayloadForApi(formValues, isEditMode);
    
    try {
      if (isEditMode && id) {
        await dispatch(editCompanyAction({ id: id, payload })).unwrap();
        toast.push(<Notification type="success" title="Company Updated"> Details updated successfully. </Notification>);
      } else {
        await dispatch(addcompanyAction(payload)).unwrap();
        toast.push(<Notification type="success" title="Company Created"> New company created successfully. </Notification>);
      }
      navigate("/business-entities/company");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEditMode ? "update" : "create"} company.`;
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        Object.keys(validationErrors).forEach((key) => {
          let formKey = key as keyof CompanyFormSchema;
          const message = Array.isArray(validationErrors[key]) ? validationErrors[key][0] : validationErrors[key];
          
          try {
            formMethods.setError(formKey, { type: "manual", message: message });
          } catch (e) {
             console.warn(`API error for unmapped/unexpected key: ${key} - ${message}`);
          }
        });
        toast.push(<Notification type="danger" title="Validation Error"> Please check the form fields. </Notification>);
      } else {
        toast.push(<Notification type="danger" title={`${isEditMode ? "Update" : "Creation"} Failed`}> {errorMessage} </Notification>);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDiscardDialog = () => setDiscardConfirmationOpen(true);
  const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
  const handleConfirmDiscard = async () => {
    closeDiscardDialog();
    navigate("/business-entities/company");
  };

  if (pageLoading || !initialData) {
    return (
      <Container className="h-full flex justify-center items-center">
        <p>Loading company details...</p>
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <CompanyFormComponent
            onFormSubmit={handleFormSubmit}
            defaultValues={initialData}
            isEditMode={isEditMode}
            onDiscard={openDiscardDialog}
            isSubmitting={isSubmitting}
          />
        </div>
        <ConfirmDialog
          isOpen={discardConfirmationOpen}
          type="danger"
          title={isEditMode ? "Discard Changes" : "Cancel Creation"}
          onClose={closeDiscardDialog}
          onRequestClose={closeDiscardDialog}
          onCancel={closeDiscardDialog}
          onConfirm={handleConfirmDiscard}
        >
          <p> Are you sure you want to {isEditMode ? "discard changes" : "cancel creating this company"}? This action cannot be undone. </p>
        </ConfirmDialog>
      </div>
    </Container>
  );
};

export default CompanyCreate;