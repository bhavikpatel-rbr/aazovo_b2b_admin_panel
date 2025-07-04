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
  deletepartnerAction,
  editpartnerAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction,
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
  id?: string;
  designation?: string;
  person_name?: string;
  company_name?: string;
  email?: string;
  number?: string;
}

interface CompanyBankDetailItemFE {
  id?: string;
  bank_account_number?: string;
  bank_name?: string | { label: string; value: string };
  ifsc_code?: string;
  verification_photo?: File | string | null;
  type?: string | { label: string; value: string };
}

interface CertificateItemFE {
  id?: string;
  certificate_id?: any;
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

interface OtherDocItemFE {
  id?: string;
  document_name?: string;
  document?: File | string | null;
}

interface ReferenceItemFE {
  id?: string;
  referenced_partner_id?: { label: string; value: string };
  company_id?: { label: string; value: string };
  email?: string;
  number?: string;
  remark?: string;
}

export interface CompanyFormSchema {
  id?: string | number;
  partner_name?: string;
  primary_contact_number?: string;
  primary_contact_number_code?: { label: string; value: string };
  general_contact_number?: string;
  general_contact_number_code?: { label: string; value: string };
  alternate_contact_number?: string;
  alternate_contact_number_code?: { label: string; value: string };
  primary_email_id?: string;
  alternate_email_id?: string;
  ownership_type?: { label: string; value: string };
  owner_name?: string;
  partner_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country_id?: { label: string; value: string };
  continent_id?: { label: string; value: string };
  join_us_as?: { label: string; value: string },
  industrial_expertise?: { label: string; value: string },
  gst_number?: string;
  pan_number?: string;
  trn_number?: string;
  tan_number?: string;
  establishment_year?: string;
  no_of_employees?: number | string;
  partner_website?: string;
  partner_logo?: File | string | null;

  partner_certificate?: CertificateItemFE[];
  office_info?: BranchItemFE[];

  agreement_file?: File | string | null;
  agreement_remark?: string;
  agreement_verified?: boolean;
  office_photo_file?: File | string | null;
  office_photo_remark?: string;
  office_photo_verified?: boolean;
  gst_certificate_file?: File | string | null;
  gst_certificate_remark?: string;
  gst_certificate_verified?: boolean;
  authority_letter_file?: File | string | null;
  authority_letter_remark?: string;
  authority_letter_verified?: boolean;
  visiting_card_file?: File | string | null;
  visiting_card_remark?: string;
  visiting_card_verified?: boolean;
  cancel_cheque_file?: File | string | null;
  cancel_cheque_remark?: string;
  cancel_cheque_verified?: boolean;
  aadhar_card_file?: File | string | null;
  aadhar_card_remark?: string;
  aadhar_card_verified?: boolean;
  pan_card_file?: File | string | null;
  pan_card_remark?: string;
  pan_card_verified?: boolean;
  other_document_file?: File | string | null;
  other_document_remark?: string;
  other_document_verified?: boolean;

  primary_account_number?: any;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: File | string | null;
  secondary_account_number?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo?: File | string | null;
  partner_bank_details?: CompanyBankDetailItemFE[];

  USER_ACCESS?: boolean;
  BILLING_FIELD?: boolean;
  billing_cycle?: number | string;
  other_documents?: OtherDocItemFE[];

  member?: MemberItem[];

  status?: { label: string; value: string };
  support_email?: string;
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
  status?: string;
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
  continent?: { name: string };
  kyc_verified?: boolean | "Yes" | "No" | "1" | "0";
  enable_billing?: boolean | "Yes" | "No" | "1" | "0";
  billing_cycle?: number;
  primary_account_number?: string;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: string;
  secondary_account_number?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo?: string;
  support_email?: string;
  partner_logo?: string;
  gst_number?: string;
  pan_number?: string;
  tan_number?: string;
  trn_number?: string;
  establishment_year?: string;
  no_of_employees?: number;
  partner_website?: string;
  notification_email?: string;
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
  partner_team_members?: any[];
  partner_bank_details?: any[];
  office_info?: any[];
  partner_certificate?: any[];
  partner_references?: any[];
  other_documents?: any[];
}


// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (
  apiData: ApiSingleCompanyItem,
  partnerOptions: { label: string; value: any }[],
  companyOptions: { label: string; value: any }[]
): Partial<CompanyFormSchema> => {
  const toBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'yes' || lower === '1' || lower === 'true';
    }
    return !!value;
  };

  const toSelectObject = (value?: string | null): { label: string; value: string } | undefined => {
    if (!value) return undefined;
    return { label: value, value: value };
  };

  const toSelectObjectFromId = (id?: string, name?: string): { label: string; value: string } | undefined => {
    if (!id) return undefined;
    return { label: name || id, value: id };
  };

  return {
    id: apiData.id,
    partner_name: apiData.partner_name,
    owner_name: apiData.owner_name,
    primary_email_id: apiData.primary_email_id,
    alternate_email_id: apiData.alternate_email_id,
    support_email: apiData.support_email,
    notification_email: apiData.notification_email,
    primary_contact_number: apiData.primary_contact_number,
    primary_contact_number_code: toSelectObject(apiData.primary_contact_number_code),
    general_contact_number: apiData.general_contact_number,
    general_contact_number_code: toSelectObject(apiData.general_contact_number_code),
    alternate_contact_number: apiData.alternate_contact_number,
    alternate_contact_number_code: toSelectObject(apiData.alternate_contact_number_code),
    ownership_type: toSelectObject(apiData.ownership_type),
    partner_address: apiData.partner_address,
    city: apiData.city,
    state: apiData.state,
    zip_code: apiData.zip_code,
    country_id: toSelectObject(apiData.country_id),
    continent_id: toSelectObjectFromId(apiData.continent_id, apiData.continent?.name),
    join_us_as: toSelectObject(apiData.join_us_as),
    industrial_expertise: toSelectObject(apiData.industrial_expertise),
    gst_number: apiData.gst_number,
    pan_number: apiData.pan_number,
    trn_number: apiData.trn_number,
    tan_number: apiData.tan_number,
    establishment_year: apiData.establishment_year,
    no_of_employees: apiData.no_of_employees,
    partner_website: apiData.partner_website,
    partner_logo: apiData.partner_logo,
    status: toSelectObject(apiData.status),

    agreement_file: apiData.agreement_file,
    agreement_verified: toBoolean(apiData.agreement_verified),
    agreement_remark: apiData.agreement_remark,
    office_photo_file: apiData.office_photo_file,
    office_photo_verified: toBoolean(apiData.office_photo_verified),
    office_photo_remark: apiData.office_photo_remark,
    gst_certificate_file: apiData.gst_certificate_file,
    gst_certificate_verified: toBoolean(apiData.gst_certificate_verified),
    gst_certificate_remark: apiData.gst_certificate_remark,
    authority_letter_file: apiData.authority_letter_file,
    authority_letter_verified: toBoolean(apiData.authority_letter_verified),
    authority_letter_remark: apiData.authority_letter_remark,
    visiting_card_file: apiData.visiting_card_file,
    visiting_card_verified: toBoolean(apiData.visiting_card_verified),
    visiting_card_remark: apiData.visiting_card_remark,
    cancel_cheque_file: apiData.cancel_cheque_file,
    cancel_cheque_verified: toBoolean(apiData.cancel_cheque_verified),
    cancel_cheque_remark: apiData.cancel_cheque_remark,
    aadhar_card_file: apiData.aadhar_card_file,
    aadhar_card_verified: toBoolean(apiData.aadhar_card_verified),
    aadhar_card_remark: apiData.aadhar_card_remark,
    pan_card_file: apiData.pan_card_file,
    pan_card_verified: toBoolean(apiData.pan_card_verified),
    pan_card_remark: apiData.pan_card_remark,
    other_document_file: apiData.other_document_file,
    other_document_verified: toBoolean(apiData.other_document_verified),
    other_document_remark: apiData.other_document_remark,

    primary_account_number: apiData.primary_account_number,
    primary_bank_name: apiData.primary_bank_name,
    primary_ifsc_code: apiData.primary_ifsc_code,
    primary_bank_verification_photo: apiData.primary_bank_verification_photo,
    secondary_account_number: apiData.secondary_account_number,
    secondary_bank_name: apiData.secondary_bank_name,
    secondary_ifsc_code: apiData.secondary_ifsc_code,
    secondary_bank_verification_photo: apiData.secondary_bank_verification_photo,
    partner_bank_details: apiData.partner_bank_details?.map((b: any) => ({
      bank_account_number: b.bank_account_number,
      bank_name: b.bank_name,
      ifsc_code: b.ifsc_code,
      type: toSelectObject(b.type),
      verification_photo: b.verification_photo,
    })),

    partner_certificate: apiData.partner_certificate,
    office_info: apiData.office_info?.map((b: any) => ({
      office_type: toSelectObject(b.office_type),
      office_name: b.office_name,
      address: b.address,
      country_id: toSelectObject(b.country_id),
      state: b.state,
      city: b.city,
      zip_code: b.zip_code,
      gst_number: b.gst_number,
      contact_person: b.contact_person,
      office_email: b.office_email,
      office_phone: b.office_phone
    })),
    member: apiData.partner_team_members?.map((m: any) => ({
      person_name: m.person_name,
      company_name: m.company_name,
      email: m.email,
      designation: m.designation,
      number: m.number,
    })),
    other_documents: apiData.other_documents,
    partner_references: apiData.partner_references?.map((ref: any) => ({
      referenced_partner_id: partnerOptions.find(p => p.value === ref.referenced_partner_id),
      company_id: companyOptions.find(c => c.value === ref.company_id),
      email: ref.email,
      number: ref.number,
      remark: ref.remark,
    })),
    USER_ACCESS: toBoolean(apiData.kyc_verified),
    BILLING_FIELD: toBoolean(apiData.enable_billing),
    billing_cycle: apiData.billing_cycle,
  };
};

// Helper to prepare payload for API submission
const preparePayloadForApi = (formData: CompanyFormSchema, isEditMode: boolean): FormData => {
  const apiPayload = new FormData();
  const data: any = { ...formData };

  const append = (key: string, value: any) => {
    if (value === null || value === undefined) {
      apiPayload.append(key, "");
    } else if (typeof value === 'boolean') {
      apiPayload.append(key, value ? "1" : "0");
    } else if (value instanceof File) {
      apiPayload.append(key, value);
    } else if (typeof value === 'object' && !Array.isArray(value) && value.value !== undefined) {
      apiPayload.append(key, value.value);
    } else if (Array.isArray(value)) {
      const simpleValues = value.map(item => (typeof item === 'object' && item.value) ? item.value : item);
      apiPayload.append(key, simpleValues.join(','));
    } else {
      apiPayload.append(key, String(value));
    }
  };

  const appendFileIfExists = (key: string, value: any) => {
    if (value instanceof File) {
      apiPayload.append(key, value);
    } else if (value === null) {
      apiPayload.append(key, '');
    }
  };

  if (isEditMode && data.id) {
    apiPayload.append("id", String(data.id));
    apiPayload.append("_method", "PUT");
  }

  const simpleFields: (keyof CompanyFormSchema)[] = [
    "partner_name", "owner_name", "partner_address", "support_email", "status",
    "gst_number", "pan_number", "country_id", "join_us_as", "continent_id",
    "industrial_expertise", "state", "city", "zip_code", "primary_email_id",
    "primary_contact_number", "primary_contact_number_code", "general_contact_number",
    "general_contact_number_code", "alternate_email_id", "alternate_contact_number",
    "alternate_contact_number_code", "ownership_type", "tan_number", "trn_number",
    "establishment_year", "no_of_employees", "partner_website", "notification_email",
    "primary_account_number", "primary_bank_name", "primary_ifsc_code",
    "secondary_account_number", "secondary_bank_name", "secondary_ifsc_code",
    "billing_cycle"
  ];
  simpleFields.forEach(key => append(key, data[key]));

  append("kyc_verified", data.USER_ACCESS);
  append("enable_billing", data.BILLING_FIELD);
  appendFileIfExists("partner_logo", data.partner_logo);
  appendFileIfExists("primary_bank_verification_photo", data.primary_bank_verification_photo);
  appendFileIfExists("secondary_bank_verification_photo", data.secondary_bank_verification_photo);

  const kycDocsConfig = [
    { feFile: "agreement_file", beFile: "agreement_file", feVerify: "agreement_verified", beVerify: "agreement_verified", feRemark: "agreement_remark", beRemark: "agreement_remark" },
    { feFile: "office_photo_file", beFile: "office_photo_file", feVerify: "office_photo_verified", beVerify: "office_photo_verified", feRemark: "office_photo_remark", beRemark: "office_photo_remark" },
    { feFile: "gst_certificate_file", beFile: "gst_certificate_file", feVerify: "gst_certificate_verified", beVerify: "gst_certificate_verified", feRemark: "gst_certificate_remark", beRemark: "gst_certificate_remark" },
    { feFile: "authority_letter_file", beFile: "authority_letter_file", feVerify: "authority_letter_verified", beVerify: "authority_letter_verified", feRemark: "authority_letter_remark", beRemark: "authority_letter_remark" },
    { feFile: "visiting_card_file", beFile: "visiting_card_file", feVerify: "visiting_card_verified", beVerify: "visiting_card_verified", feRemark: "visiting_card_remark", beRemark: "visiting_card_remark" },
    { feFile: "cancel_cheque_file", beFile: "cancel_cheque_file", feVerify: "cancel_cheque_verified", beVerify: "cancel_cheque_verified", feRemark: "cancel_cheque_remark", beRemark: "cancel_cheque_remark" },
    { feFile: "aadhar_card_file", beFile: "aadhar_card_file", feVerify: "aadhar_card_verified", beVerify: "aadhar_card_verified", feRemark: "aadhar_card_remark", beRemark: "aadhar_card_remark" },
    { feFile: "pan_card_file", beFile: "pan_card_file", feVerify: "pan_card_verified", beVerify: "pan_card_verified", feRemark: "pan_card_remark", beRemark: "pan_card_remark" },
    { feFile: "other_document_file", beFile: "other_document_file", feVerify: "other_document_verified", beVerify: "other_document_verified", feRemark: "other_document_remark", beRemark: "other_document_remark" },
  ];
  kycDocsConfig.forEach((doc: any) => {
    appendFileIfExists(doc.beFile, data[doc.feFile]);
    append(doc.beVerify, data[doc.feVerify]);
    append(doc.beRemark, data[doc.feRemark]);
  });

  (data.partner_bank_details || []).forEach((bank: any, index: number) => {
    if (bank.bank_account_number) {
      append(`partner_bank_details[${index}][bank_account_number]`, bank.bank_account_number);
      append(`partner_bank_details[${index}][bank_name]`, bank.bank_name);
      append(`partner_bank_details[${index}][ifsc_code]`, bank.ifsc_code);
      append(`partner_bank_details[${index}][type]`, bank.type);
      appendFileIfExists(`partner_bank_details[${index}][verification_photo]`, bank.verification_photo);
    }
  });

  (data.partner_certificate || []).forEach((cert: any, index: number) => {
    if (cert.certificate_id) {
      append(`partner_certificate[${index}][certificate_id]`, cert.certificate_id);
      append(`partner_certificate[${index}][certificate_name]`, cert.certificate_name);
      appendFileIfExists(`partner_certificate[${index}][upload_certificate]`, cert.upload_certificate);
    }
  });

  (data.member || []).forEach((member: any, index: number) => {
    append(`partner_team_members[${index}][person_name]`, member.person_name);
    append(`partner_team_members[${index}][company_name]`, member.company_name);
    append(`partner_team_members[${index}][email]`, member.email);
    append(`partner_team_members[${index}][designation]`, member.designation);
    append(`partner_team_members[${index}][number]`, member.number);
  });

  (data.partner_references || []).forEach((ref: any, index: number) => {
    append(`partner_references[${index}][referenced_partner_id]`, ref.referenced_partner_id?.value);
    append(`partner_references[${index}][company_id]`, ref.company_id?.value);
    append(`partner_references[${index}][email]`, ref.email);
    append(`partner_references[${index}][number]`, ref.number);
    append(`partner_references[${index}][remark]`, ref.remark);
  });

  (data.other_documents || []).forEach((doc: any, index: number) => {
    append(`other_documents[${index}][document_name]`, doc.document_name);
    appendFileIfExists(`other_documents[${index}][document]`, doc.document);
  });

  (data.office_info || []).forEach((office: any, index: number) => {
    append(`office_info[${index}][office_type]`, office.office_type)
    append(`office_info[${index}][office_name]`, office.office_name);
    append(`office_info[${index}][country_id]`, office.country_id);
    append(`office_info[${index}][state]`, office.state);
    append(`office_info[${index}][city]`, office.city);
    append(`office_info[${index}][zip_code]`, office.zip_code);
    append(`office_info[${index}][gst_number]`, office.gst_number);
    append(`office_info[${index}][address]`, office.address);
    append(`office_info[${index}][contact_person]`, office.contact_person);
    append(`office_info[${index}][office_email]`, office.office_email);
    append(`office_info[${index}][office_phone]`, office.office_phone);
  });

  return apiPayload;
};

// --- Navigator Component ---
const companyNavigationList = [
  { label: "Partner Details", link: "PartnerDetails" },
  { label: "KYC Documents", link: "kycDocuments" },
  { label: "Bank Details", link: "bankDetails" },
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
const CompanyDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const {
    CountriesData = [],
    ContinentsData = [],
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
          errorMessage={(errors.status as any)?.message as string}
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
          errorMessage={(errors.ownership_type as any)?.message as string}
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
          errorMessage={(errors.continent_id as any)?.message as string}
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
          errorMessage={(errors.country_id as any)?.message as string}
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
      <hr className="my-6" /> <h4 className="mb-4">Contact Information</h4>
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
        </FormItem>
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
        </FormItem>
        <FormItem
          className="sm:col-span-6 lg:col-span-4"
          label={<div>Primary Contact Number<span className="text-red-500"> * </span></div>}
          invalid={!!errors.primary_contact_number || !!errors.primary_contact_number_code}
          errorMessage={
            (errors.primary_contact_number?.message || (errors.primary_contact_number_code as any)?.message) as string
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
        </FormItem>

      </div>

      <hr className="my-6" /> <h4 className="mb-4">Trade Information</h4>
      <div className="grid md:grid-cols-4 gap-3">
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
        </FormItem>
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
        </FormItem>
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
        </FormItem>
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
        </FormItem>
      </div>
      <hr className="my-6" /> <h4 className="mb-4">Company Information</h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
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
        </FormItem>

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
        </FormItem>
        <FormItem
          label="Partner Logo/Brochure"
          invalid={!!errors.partner_logo}
          errorMessage={(errors.partner_logo as any)?.message as string}
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
                src={`${companyLogoBrochureValue}`}
                alt="logo preview"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>
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
        </FormItem>
      </div>
      <hr className="my-6" />
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
      </div>
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
                      href={`${uploadCertificateValue}`}
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
                  className="md:mt-6"
                  onClick={() => removeCert(index)}
                  danger
                />

              </div>
            </div>
          </Card>
        );
      })}
      <hr className="my-6" />
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
              state: "",
              zip_code: "",
              gst_number: "",
              contact_person: "",
              office_email: "",
              office_phone: ""
            })
          }
        >
          Add Office
        </Button>
      </div>
      {branchFields.map((item, index) => (
        <Card key={item.id} className="mb-4 border rounded-md border-black relative">
          <div className="grid md:grid-cols-4 gap-4 p-4">
            <FormItem label="Office Type"><Controller name={`office_info.${index}.office_type`} control={control} render={({ field }) => <Select placeholder="Select Office Type" options={officeTypeOptions} {...field} />} /></FormItem>
            <FormItem label="Office Name"><Controller name={`office_info.${index}.office_name`} control={control} render={({ field }) => <Input placeholder="e.g. Main Office" {...field} />} /></FormItem>
            <FormItem label="Contact Person"><Controller name={`office_info.${index}.contact_person`} control={control} render={({ field }) => <Input placeholder="Contact Person Name" {...field} />} /></FormItem>
            <FormItem label="Office Email"><Controller name={`office_info.${index}.office_email`} control={control} render={({ field }) => <Input type="email" placeholder="office@example.com" {...field} />} /></FormItem>
            <FormItem label="Office Phone"><Controller name={`office_info.${index}.office_phone`} control={control} render={({ field }) => <Input type="tel" placeholder="Office Phone" {...field} />} /></FormItem>
            <FormItem label="GST/REG Number"><Controller name={`office_info.${index}.gst_number`} control={control} render={({ field }) => <Input placeholder="GST or Registration Number" {...field} />} /></FormItem>
            <div className="col-span-4 grid md:grid-cols-4 gap-4 border-t pt-4 mt-2">
              <FormItem label="Country"><Controller name={`office_info.${index}.country_id`} control={control} render={({ field }) => <Select placeholder="Select Country" options={countryOptions} {...field} />} /></FormItem>
              <FormItem label="State"><Controller name={`office_info.${index}.state`} control={control} render={({ field }) => <Input placeholder="Enter state" {...field} />} /></FormItem>
              <FormItem label="City"><Controller name={`office_info.${index}.city`} control={control} render={({ field }) => <Input placeholder="Enter city" {...field} />} /></FormItem>
              <FormItem label="ZIP Code"><Controller name={`office_info.${index}.zip_code`} control={control} render={({ field }) => <Input placeholder="ZIP Code" {...field} />} /></FormItem>
              <FormItem label="Address" className="md:col-span-4"><Controller name={`office_info.${index}.address`} control={control} render={({ field }) => <Input placeholder="Full Address" {...field} />} /></FormItem>
            </div>
          </div>
          <div className="absolute right-2 top-2">
            <Button
              type="button"
              size="sm"
              variant="plain"
              icon={<TbTrash size={16} />}
              onClick={() => removeBranch(index)}
            >
              Remove
            </Button>
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
    { label: "Aadhar Card", name: "aadhar_card_file" as const, remarkName: "aadhar_card_remark" as const, enabledName: "aadhar_card_verified" as const, },
    { label: "PAN Card", name: "pan_card_file" as const, remarkName: "pan_card_remark" as const, enabledName: "pan_card_verified" as const, },
    { label: "GST Certificate", name: "gst_certificate_file" as const, remarkName: "gst_certificate_remark" as const, enabledName: "gst_certificate_verified" as const, },
    { label: "Visiting Card", name: "visiting_card_file" as const, remarkName: "visiting_card_remark" as const, enabledName: "visiting_card_verified" as const, },
    { label: "Office Photo", name: "office_photo_file" as const, remarkName: "office_photo_remark" as const, enabledName: "office_photo_verified" as const, },
    { label: "Authority Letter", name: "authority_letter_file" as const, remarkName: "authority_letter_remark" as const, enabledName: "authority_letter_verified" as const, },
    { label: "Cancel Cheque", name: "cancel_cheque_file" as const, remarkName: "cancel_cheque_remark" as const, enabledName: "cancel_cheque_verified" as const, },
    { label: "agreement/Quotation", name: "agreement_file" as const, remarkName: "agreement_remark" as const, enabledName: "agreement_verified" as const, },
    { label: "Other Document", name: "other_document_file" as const, remarkName: "other_document_remark" as const, enabledName: "other_document_verified" as const, },
  ];
  return (
    <Card id="kycDocuments">
      <h5 className="mb-4">Current Documents</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
        {kycDocs.map((doc) => {
          const fileValue = watch(doc.name);
          const isImageFile = (file: unknown): file is File => file instanceof File && file.type.startsWith("image/");
          const isImageUrl = (url: unknown): url is string => typeof url === "string" && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);
          return (
          <div key={doc.name}>
              <label className="flex items-center gap-2 mb-1">
                <Controller
                  name={doc.enabledName}
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={!!field.value} onChange={field.onChange}>
                      {doc.label} (Verified)
                    </Checkbox>
                  )}
                />
              </label>
              <FormItem
                invalid={!!errors[doc.name]}
                errorMessage={(errors[doc.name] as any)?.message as string}
              >
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
                />
              </FormItem>
              {fileValue && (
                <div className="mt-2">
                  {isImageFile(fileValue) ? (
                    <img
                      src={URL.createObjectURL(fileValue)}
                      alt="Preview"
                      className="h-24 w-auto object-contain border rounded p-1"
                    />
                  ) : isImageUrl(fileValue) ? (
                    <img
                      src={`${fileValue}`}
                      alt="Preview"
                      className="h-24 w-auto object-contain border rounded p-1"
                    />
                  ) : (
                    <div className="text-sm">
                      {typeof fileValue === "string" ? (
                        <a
                          href={`${fileValue}`}
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
                      )}
                    </div>
                  )}
                </div>
              )}
              <FormItem
                className="mt-2"
                invalid={!!errors[doc.remarkName]}
                errorMessage={(errors[doc.remarkName] as any)?.message as string}
              >
                <Controller
                  name={doc.remarkName}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder={`Remark for ${doc.label}`}
                      {...field}
                    />
                  )}
                />
              </FormItem>
            </div>
          );
        })}
      </div>
      <hr className="my-6" /> <h5 className="mb-4">Past Documents</h5>
      <p className="text-gray-500">
        Section for past documents can be built here if needed.
      </p>
    </Card>
  );
};

// --- BankDetailsSection ---
const BankDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
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
      <h4 className="mb-6">Bank Details (Primary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
        <FormItem label="Primary Account Number">
          <Controller
            name="primary_account_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="Primary Account No." {...field} />
            )}
          />
        </FormItem>
        <FormItem label="Primary Bank Name">
          <Controller
            name="primary_bank_name"
            control={control}
            render={({ field }) => (
              <Input type="text" {...field} placeholder="Enter Bank Name" />
            )}
          />
        </FormItem>
        <FormItem label="Primary IFSC Code">
          <Controller
            name="primary_ifsc_code"
            control={control}
            render={({ field }) => (
              <Input placeholder="Primary IFSC" {...field} />
            )}
          />
        </FormItem>
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
                src={`${primaryBankPhotoValue}`}
                alt="Primary bank photo"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>
      </div>
      <hr className="my-3" /> <h4 className="mb-6">Bank Details (Secondary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
        <FormItem label="Secondary Account Number">
          <Controller
            name="secondary_account_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="Secondary Account No." {...field} />
            )}
          />
        </FormItem>
        <FormItem label="Secondary Bank Name">
          <Controller
            name="secondary_bank_name"
            control={control}
            render={({ field }) => (
              <Input type="text" {...field} placeholder="Enter Bank Name" />
            )}
          />
        </FormItem>
        <FormItem label="Secondary IFSC Code">
          <Controller
            name="secondary_ifsc_code"
            control={control}
            render={({ field }) => (
              <Input placeholder="Secondary IFSC" {...field} />
            )}
          />
        </FormItem>
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
                src={`${secondaryBankPhotoValue}`}
                alt="Secondary bank photo"
                className="mt-2 h-16 w-auto"
              />
            )}
        </FormItem>
      </div>
      <hr className="my-6" />
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
      </div>
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
                    src={`${bankPhotoValue}`}
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
      })}
    </Card>
  );
};


// --- ReferenceSection ---
const ReferenceSection = ({ control }: FormSectionBaseProps) => {
  const dispatch = useAppDispatch();
  const { partnerData, CompanyData } = useSelector(masterSelector);

  // FIX: Removed `dispatch` from dependency array and added conditional fetch
  useEffect(() => {
    if (!partnerData?.data || partnerData.data.length === 0) {
      dispatch(getpartnerAction());
    }
    if (!CompanyData?.data || CompanyData.data.length === 0) {
      dispatch(getCompanyAction());
    }
  }, [partnerData, CompanyData]); // Dependency on data, not dispatch

  const partnerOptions = useMemo(() => {
    const data = partnerData?.data || [];
    return Array.isArray(data)
      ? data.map((p: any) => ({ value: p.id, label: p.partner_name }))
      : [];
  }, [partnerData]);

  const companyOptions = useMemo(() => {
    const data = CompanyData?.data || [];
    return Array.isArray(data)
      ? data.map((c: any) => ({ value: c.id, label: c.company_name }))
      : [];
  }, [CompanyData]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "partner_references",
  });

  return (
    <Card id="reference">
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">References</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ referenced_partner_id: undefined, company_id: undefined, email: "", number: "", remark: "" })}>
          Add Reference
        </Button>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border-black relative rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 p-4">
            <FormItem label="Person Name">
              <Controller name={`partner_references.${index}.referenced_partner_id`} control={control} render={({ field }) => <Select placeholder="Select Partner" options={partnerOptions} {...field} />} />
            </FormItem>
            <FormItem label="Company Name">
              <Controller name={`partner_references.${index}.company_id`} control={control} render={({ field }) => <Select placeholder="Select Company" options={companyOptions} {...field} />} />
            </FormItem>
            <FormItem label="Email"><Controller name={`partner_references.${index}.email`} control={control} render={({ field }) => <Input type="email" placeholder="Email ID" {...field} />} /></FormItem>
            <FormItem label="Contact Number"><Controller name={`partner_references.${index}.number`} control={control} render={({ field }) => <Input placeholder="Contact Number" {...field} />} /></FormItem>
            <FormItem label="Remark" className="sm:col-span-full"><Controller name={`partner_references.${index}.remark`} control={control} render={({ field }) => <Input placeholder="Add remarks here..." {...field} />} /></FormItem>
          </div>
          <div className="absolute right-2 top-2">
            <Button type="button" variant="plain" size="sm" icon={<TbTrash size={16} />} onClick={() => remove(index)}>Remove</Button>
          </div>
        </Card>
      ))}
    </Card>
  );
};

// --- AccessibilitySection ---
const AccessibilitySection = ({ control, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "other_documents",
  });
  const isBillingEnabled = watch("BILLING_FIELD");

  return (
    <Card id="accessibility">
      <h4 className="mb-6">Accessibility & Configuration</h4>
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex items-center gap-x-8">
          <FormItem label="Enable Billing">
            <Controller name="BILLING_FIELD" control={control} render={({ field }) => <Checkbox checked={!!field.value} onChange={field.onChange}>Enabled</Checkbox>} />
          </FormItem>
          {isBillingEnabled && (
            <FormItem label="Billing Cycle (Days)">
              <Controller name="billing_cycle" control={control} render={({ field }) => <NumericInput placeholder="e.g., 30" {...field} />} />
            </FormItem>
          )}
          <FormItem label="User Access"><Controller name="USER_ACCESS" control={control} render={({ field }) => <Checkbox checked={!!field.value} onChange={field.onChange}>Enabled</Checkbox>} /></FormItem>
        </div>
        <hr />
        <div className="flex justify-between items-center">
          <h5 className="mb-0">Other Documents</h5>
          <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ document_name: "", document: undefined })}>Add Document</Button>
        </div>
        {fields.map((item, index) => (
          <Card key={item.id} className="border-black rounded-md" bodyClass="p-4">
            <div className="md:grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
              <FormItem label="Document Name" className="md:col-span-4"><Controller name={`other_documents.${index}.document_name`} control={control} render={({ field }) => <Input placeholder="e.g., NDA" {...field} />} /></FormItem>
              <FormItem label="Upload Document" className="md:col-span-4"><Controller name={`other_documents.${index}.document`} control={control} render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0])} />} /></FormItem>
              <Button type="button" shape="circle" size="sm" className="mt-2" icon={<TbTrash />} onClick={() => remove(index)} />
            </div>
          </Card>
        )
        )}
      </div>
    </Card>
  );
};

// --- MemberManagementSection ---
const MemberManagementSection = ({ control }: FormSectionBaseProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "member",
  });

  return (
    <Card id="memberManagement">
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Team Management</h4>
        <div className="flex gap-2">
          <Button type="button" size="sm" icon={<TbPlus />} onClick={() => append({ person_name: "", company_name: "", email: "", designation: "", number: "" })}>Add Team Member</Button>
        </div>
      </div>
      {fields.map((item, index) => (
        <Card key={item.id} className="mb-4 border-black relative rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 items-start">
            <FormItem label="Person Name"><Controller name={`member.${index}.person_name`} control={control} render={({ field }) => <Input placeholder="Person Name" {...field} />} /></FormItem>
            <FormItem label="Company Name"><Controller name={`member.${index}.company_name`} control={control} render={({ field }) => <Input placeholder="Company Name" {...field} />} /></FormItem>
            <FormItem label="Email ID"><Controller name={`member.${index}.email`} control={control} render={({ field }) => <Input type="email" placeholder="Email ID" {...field} />} /></FormItem>
            <FormItem label="Designation"><Controller name={`member.${index}.designation`} control={control} render={({ field }) => <Input placeholder="e.g., CEO" {...field} />} /></FormItem>
            <FormItem label="Contact Number"><Controller name={`member.${index}.number`} control={control} render={({ field }) => <Input type="tel" placeholder="Contact Number" {...field} />} /></FormItem>
            <div className="absolute right-2 top-2">
              <Button type="button" variant="plain" size="sm" icon={<TbTrash size={16} />} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10" onClick={() => remove(index)}>Remove</Button>
            </div>
          </div>
        </Card>
      ))}
    </Card>
  );
};

// --- CompanyFormComponent ---
type CompanyFormComponentProps = {
  onFormSubmit: (values: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => void;
  defaultValues: Partial<CompanyFormSchema>;
  isEditMode: boolean;
  onDelete?: () => void;
  isSubmitting?: boolean;
};

const CompanyFormComponent = (props: CompanyFormComponentProps) => {
  const { onFormSubmit, defaultValues, isEditMode, onDelete, isSubmitting } = props;
  const [activeSection, setActiveSection] = useState<string>(companyNavigationList[0].link);

  const selectObjectSchema = z.object({ value: z.any(), label: z.any() }).nullable().optional();
  const companySchema = z.object({
    partner_name: z.string().trim().min(1, "Partner Name is required"),
    owner_name: z.string().trim().min(1, "Owner/Director Name is required"),
    ownership_type: selectObjectSchema.refine(val => val?.value, "Ownership Type is required"),
    primary_email_id: z.string().trim().min(1, "Primary Email is required").email("Invalid email format"),
    primary_contact_number: z.string().trim().min(1, "Primary contact number is required").regex(/^\d{7,15}$/, "Invalid contact number format"),
    primary_contact_number_code: selectObjectSchema.refine(val => val?.value, "Country code is required"),
    gst_number: z.string().trim().min(1, "GST Number is required.").regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format."),
    pan_number: z.string().trim().min(1, "PAN Number is required.").regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card number format."),
    country_id: selectObjectSchema.refine(val => val?.value, "Country is required"),
    state: z.string().trim().min(1, "State is required"),
    city: z.string().trim().min(1, "City is required"),
    partner_address: z.string().trim().min(1, "Partner Address is required"),
    status: selectObjectSchema.refine(val => val?.value, "Status is required"),
  }).passthrough();

  const formMethods = useForm<CompanyFormSchema>({
    resolver: zodResolver(companySchema),
    mode: 'onTouched',
    defaultValues: defaultValues,
  });
  const { handleSubmit, reset, formState: { errors }, control } = formMethods;

  useEffect(() => { reset(defaultValues); }, [defaultValues, reset]);

  const internalFormSubmit = (values: CompanyFormSchema) => {
    onFormSubmit?.(values, formMethods);
  };

  const navigationKeys = companyNavigationList.map((item) => item.link);
  const handleNext = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex < navigationKeys.length - 1) setActiveSection(navigationKeys[currentIndex + 1]);
  };
  const handlePrevious = () => {
    const currentIndex = navigationKeys.indexOf(activeSection);
    if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]);
  };

  const renderActiveSection = () => {
    const sectionProps = { errors, control, formMethods };
    switch (activeSection) {
      case "PartnerDetails": return <CompanyDetailsSection {...sectionProps} />;
      case "kycDocuments": return <KYCDetailSection {...sectionProps} />;
      case "bankDetails": return <BankDetailsSection {...sectionProps} />;
      case "reference": return <ReferenceSection {...sectionProps} />;
      case "accessibility": return <AccessibilitySection {...sectionProps} />;
      case "memberManagement": return <MemberManagementSection {...sectionProps} />;
      default: return <CompanyDetailsSection {...sectionProps} />;
    }
  };

  return (
    <>
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/business-entities/partner"><h6 className="font-semibold hover:text-primary-600">Partner</h6></NavLink>
        <BiChevronRight size={22} /><h6 className="font-semibold text-primary">{isEditMode ? "Edit Partner" : "Add New Partner"}</h6>
      </div>
      <Card className="mb-6" bodyClass="px-4 py-2 md:px-6"><NavigatorComponent activeSection={activeSection} onNavigate={setActiveSection} /></Card>
      <div className="flex flex-col gap-4 pb-20">{renderActiveSection()}</div>
      <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4">
          <div>{isEditMode && onDelete && <Button type="button" variant="outline" color="red" icon={<TbTrash />} onClick={onDelete} disabled={isSubmitting}>Delete Partner</Button>}</div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={handlePrevious} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === 0}>Previous</Button>
            <Button type="button" onClick={handleNext} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === navigationKeys.length - 1}>Next</Button>
            <Button variant="solid" type="button" loading={isSubmitting} onClick={handleSubmit(internalFormSubmit)} disabled={isSubmitting}>{isEditMode ? "Update Partner" : "Create Partner"}</Button>
          </div>
        </div>
      </Card>
    </>
  );
};

const CreatePartner = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [initialData, setInitialData] = useState<Partial<CompanyFormSchema> | null>(null);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { partnerData = {}, CompanyData = {} } = useSelector(masterSelector);

  const partnerOptions = useMemo(() => {
    const data = partnerData?.data || [];
    return Array.isArray(data) ? data.map((p: any) => ({ value: p.id, label: p.partner_name })) : [];
  }, [partnerData]);

  const companyOptions = useMemo(() => {
    const data = CompanyData?.data || [];
    return Array.isArray(data) ? data.map((c: any) => ({ value: c.id, label: c.company_name })) : [];
  }, [CompanyData]);

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getpartnerAction());
    dispatch(getCompanyAction());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchPartnerData = async () => {
        setPageLoading(true);
        try {
          const actionResult = await dispatch(getpartnerByIdAction(id)).unwrap();
          if (actionResult) {
            setInitialData(transformApiToFormSchema(actionResult, partnerOptions, companyOptions));
          } else {
            toast.push(<Notification type="danger" title="Fetch Error">Partner data not found.</Notification>);
            navigate("/business-entities/partner");
          }
        } catch (error: any) {
          toast.push(<Notification type="danger" title="Fetch Error">{error?.message || "Error fetching partner data."}</Notification>);
          navigate("/business-entities/partner");
        } finally {
          setPageLoading(false);
        }
      };
      fetchPartnerData();
    } else {
      setInitialData({});
      setPageLoading(false);
    }
  }, [id, isEditMode, navigate, dispatch, partnerOptions, companyOptions]);

  const handleFormSubmit = async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
    setIsSubmitting(true);
    const payload = preparePayloadForApi(formValues, isEditMode);
    try {
      if (isEditMode && id) {
        await dispatch(editpartnerAction({ id, payload })).unwrap();
        toast.push(<Notification type="success" title="Partner Updated">Details updated successfully.</Notification>);
      } else {
        await dispatch(addpartnerAction(payload)).unwrap();
        toast.push(<Notification type="success" title="Partner Created">New partner created successfully.</Notification>);
      }
      navigate("/business-entities/partner");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${isEditMode ? "update" : "create"} partner.`;
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        Object.keys(validationErrors).forEach((key) => {
          formMethods.setError(key as keyof CompanyFormSchema, {
            type: "manual",
            message: Array.isArray(validationErrors[key]) ? validationErrors[key][0] : validationErrors[key],
          });
        });
        toast.push(<Notification type="danger" title="Validation Error">Please check the form for errors.</Notification>);
      } else {
        toast.push(<Notification type="danger" title={`${isEditMode ? "Update" : "Creation"} Failed`}>{errorMessage}</Notification>);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = () => setDeleteConfirmationOpen(true);
  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteConfirmationOpen(false);
    try {
      await dispatch(deletepartnerAction({ id })).unwrap();
      toast.push(<Notification title="Partner Deleted" type="success" />);
      dispatch(getpartnerAction());
      navigate("/business-entities/partner");
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>);
    }
  };

  if (pageLoading || !initialData) {
    return <Container className="h-full flex justify-center items-center"><p>Loading Partner details...</p></Container>;
  }

  return (
    <Container className="h-full">
      <Form onSubmit={(e) => e.preventDefault()} className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <CompanyFormComponent
            onFormSubmit={handleFormSubmit}
            defaultValues={initialData}
            isEditMode={isEditMode}
            onDelete={openDeleteDialog}
            isSubmitting={isSubmitting}
          />
        </div>
        <ConfirmDialog
          isOpen={deleteConfirmationOpen}
          type="danger"
          title="Delete Partner"
          onClose={() => setDeleteConfirmationOpen(false)}
          onRequestClose={() => setDeleteConfirmationOpen(false)}
          onCancel={() => setDeleteConfirmationOpen(false)}
          onConfirm={handleConfirmDelete}
          confirmButtonColor="red-600"
        >
          <p>Are you sure you want to delete this partner? This action cannot be undone.</p>
        </ConfirmDialog>
      </Form>
    </Container>
  );
};

export default CreatePartner;