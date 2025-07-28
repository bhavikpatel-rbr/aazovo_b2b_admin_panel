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
  getDocumentTypeAction,
  getCountriesAction,
  getpartnerAction,
  getpartnerByIdAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { BiChevronRight } from "react-icons/bi";
import { TbPlus, TbTrash, TbX, TbChevronLeft, TbChevronRight, TbFile, TbFileSpreadsheet, TbFileTypePdf } from "react-icons/tb";
import { useSelector } from "react-redux";
import { z } from "zod";


// --- START: Enhanced ImageViewer Component with Thumbnails ---
interface ImageViewerProps {
  images: { src: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <Button
        shape="circle"
        variant="solid"
        icon={<TbX />}
        className="absolute top-4 right-4 z-[52] bg-black/50 hover:bg-black/80"
        onClick={onClose}
      />

      <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* Main Image & Navigation */}
        <div className="relative flex-grow flex items-center justify-center w-full max-w-6xl overflow-hidden">
          <Button
            type="button"
            shape="circle"
            variant="solid"
            size="lg"
            icon={<TbChevronLeft />}
            className="absolute left-2 md:left-4 opacity-70 hover:opacity-100 transition-opacity z-[51] bg-black/50 hover:bg-black/80"
            onClick={handlePrev}
          />

          <div className="flex flex-col items-center justify-center h-full">
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className="max-h-[calc(100%-4rem)] max-w-full object-contain select-none transition-transform duration-300"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-md">
              {currentImage.alt} ({currentIndex + 1} / {images.length})
            </div>
          </div>

          <Button
            type="button"
            shape="circle"
            variant="solid"
            size="lg"
            icon={<TbChevronRight />}
            className="absolute right-2 md:right-4 opacity-70 hover:opacity-100 transition-opacity z-[51] bg-black/50 hover:bg-black/80"
            onClick={handleNext}
          />
        </div>

        {/* Thumbnail Strip */}
        <div className="w-full max-w-5xl flex-shrink-0 mt-4">
          <div className="flex justify-center p-2">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={classNames(
                    "w-24 h-16 flex-shrink-0 rounded-md border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white",
                    {
                      'border-white opacity-100 scale-105': currentIndex === index,
                      'border-transparent opacity-60 hover:opacity-100': currentIndex !== index
                    }
                  )}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-sm"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- END: Enhanced ImageViewer Component ---

// --- START: New DocumentPlaceholder Component ---
const DocumentPlaceholder = ({ fileName, fileUrl }: { fileName: string; fileUrl: string; }) => {
  const getFileIcon = () => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <TbFileTypePdf className="text-red-500" size={32} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <TbFileSpreadsheet className="text-green-500" size={32} />;
      default:
        return <TbFile className="text-gray-500" size={32} />;
    }
  };

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full h-24 border rounded-md p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
    >
      {getFileIcon()}
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-all truncate">
        {fileName}
      </p>
    </a>
  );
};
// --- END: New DocumentPlaceholder Component ---

const isImageUrl = (url: unknown): url is string =>
  typeof url === "string" && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);


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
  country_id?: { label: string; value: any };
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
  document_name?: { label: string; value: any };
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
  company_name?: string;
  partner_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country_id?: { label: string; value: any };
  continent_id?: { label: string; value: any };
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
  partner_offices?: BranchItemFE[];

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

  primary_benificeiry_name?: any;
  primary_account_number?: any;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: File | string | null;
  secondary_account_number?: string;
  secondary_benificeiry_name?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_bank_verification_photo?: File | string | null;
  partner_bank_details?: CompanyBankDetailItemFE[];

  USER_ACCESS?: boolean;
  BILLING_FIELD?: boolean;
  billing_cycle?: number | string;
  billing_documents?: OtherDocItemFE[];

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
  company_name?: string;
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
  primary_benificeiry_name?: string;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_bank_verification_photo?: string;
  secondary_benificeiry_name?: string;
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
  partner_offices?: any[];
  partner_certificate?: any[];
  partner_references?: any[];
  billing_documents?: any[];
}


// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (
  apiData: ApiSingleCompanyItem,
  partnerOptions: { label: string; value: any }[],
  companyOptions: { label: string; value: any }[],
  documentTypeOptions: { label: string; value: any }[],
  countryOptions: { label: string; value: any }[]
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

  const findCountryById = (id?: string) => {
    if (!id) return undefined;
    return countryOptions.find(c => String(c.value) === String(id));
  }

  return {
    id: apiData.id,
    partner_name: apiData.partner_name,
    company_name: apiData.company_name,
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
    country_id: findCountryById(apiData.country_id),
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
    primary_benificeiry_name: apiData.primary_benificeiry_name,
    primary_bank_name: apiData.primary_bank_name,
    primary_ifsc_code: apiData.primary_ifsc_code,
    primary_bank_verification_photo: apiData.primary_bank_verification_photo,
    secondary_account_number: apiData.secondary_account_number,
    secondary_benificeiry_name: apiData.secondary_benificeiry_name,
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
    partner_offices: apiData.partner_offices?.map((b: any) => ({
      office_type: toSelectObject(b.office_type),
      office_name: b.office_name,
      address: b.address,
      country_id: findCountryById(b.country_id),
      state: b.state,
      city: b.city,
      zip_code: b.zip_code,
      gst_number: b.gst_number,
      contact_person: b.contact_person,
      office_email: b.office_email,
      office_phone: b.office_phone
    })),
    member: apiData.partner_team_members?.map((m: any) => ({
      id: m.id,
      person_name: m.person_name,
      company_name: m.company_name,
      email: m.email,
      designation: m.designation,
      number: m.number,
    })),
    billing_documents: apiData.billing_documents?.map((doc: any) => ({
      id: doc.id,
      document_name: documentTypeOptions.find(opt => String(opt.value) === String(doc.document_name)),
      document: doc.document
    })),
    // FIX: Correctly map reference data, ensuring company_id is an object for the Select component.
    partner_references: apiData.partner_references?.map((ref: any) => ({
      id: ref.id,
      referenced_partner_id: partnerOptions.find(p => String(p.value) === String(ref.referenced_partner_id)),
      company_id: companyOptions.find(c => String(c.value) === String(ref.company_id)),
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

  if (isEditMode && data.id) {
    apiPayload.append("id", String(data.id));
    apiPayload.append("_method", "PUT");
  }

  const simpleFields: (keyof CompanyFormSchema)[] = [
    "partner_name", "company_name", "partner_address", "support_email", "status",
    "gst_number", "pan_number", "country_id", "join_us_as", "continent_id",
    "industrial_expertise", "state", "city", "zip_code", "primary_email_id",
    "primary_contact_number", "primary_contact_number_code", "general_contact_number",
    "general_contact_number_code", "alternate_email_id", "alternate_contact_number",
    "alternate_contact_number_code", "ownership_type", "tan_number", "trn_number",
    "establishment_year", "no_of_employees", "partner_website", "notification_email",
    "primary_account_number","primary_benificeiry_name","secondary_benificeiry_name", "primary_bank_name", "primary_ifsc_code",
    "secondary_account_number", "secondary_bank_name", "secondary_ifsc_code",
    "billing_cycle"
  ];
  simpleFields.forEach(key => append(key, data[key]));

  append("kyc_verified", data.USER_ACCESS);
  append("enable_billing", data.BILLING_FIELD);
  append("partner_logo", data.partner_logo);
  append("primary_bank_verification_photo", data.primary_bank_verification_photo);
  append("secondary_bank_verification_photo", data.secondary_bank_verification_photo);

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
    append(doc.beFile, data[doc.feFile]);
    append(doc.beVerify, data[doc.feVerify]);
    append(doc.beRemark, data[doc.feRemark]);
  });

  (data.partner_bank_details || []).forEach((bank: any, index: number) => {
    if (bank.bank_account_number) {
      append(`partner_bank_details[${index}][bank_account_number]`, bank.bank_account_number);
      append(`partner_bank_details[${index}][bank_name]`, bank.bank_name);
      append(`partner_bank_details[${index}][ifsc_code]`, bank.ifsc_code);
      append(`partner_bank_details[${index}][type]`, bank.type);
      append(`partner_bank_details[${index}][verification_photo]`, bank.verification_photo);
    }
  });

  (data.partner_certificate || []).forEach((cert: any, index: number) => {
    if (cert.certificate_id) {
      append(`partner_certificate[${index}][certificate_id]`, cert.certificate_id);
      append(`partner_certificate[${index}][certificate_name]`, cert.certificate_name);
      append(`partner_certificate[${index}][upload_certificate]`, cert.upload_certificate);
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
    append(`partner_references[${index}][person_name]`, ref.referenced_partner_id?.label);
    append(`partner_references[${index}][company_id]`, ref.company_id?.value);
    append(`partner_references[${index}][email]`, ref.email);
    append(`partner_references[${index}][number]`, ref.number);
    append(`partner_references[${index}][remark]`, ref.remark);
  });

  (data.billing_documents || []).forEach((doc: any, index: number) => {
    if (doc.id) {
      append(`billing_documents[${index}][id]`, doc.id);
    }
    append(`billing_documents[${index}][document_name]`, doc.document_name);
    append(`billing_documents[${index}][document]`, doc.document);
  });

  (data.partner_offices || []).forEach((office: any, index: number) => {
    append(`partner_offices[${index}][office_type]`, office.office_type);
    append(`partner_offices[${index}][office_name]`, office.office_name);
    append(`partner_offices[${index}][country_id]`, office.country_id);
    append(`partner_offices[${index}][state]`, office.state);
    append(`partner_offices[${index}][city]`, office.city);
    append(`partner_offices[${index}][zip_code]`, office.zip_code);
    append(`partner_offices[${index}][gst_number]`, office.gst_number);
    append(`partner_offices[${index}][address]`, office.address);
    append(`partner_offices[${index}][contact_person]`, office.contact_person);
    append(`partner_offices[${index}][office_email]`, office.office_email);
    append(`partner_offices[${index}][office_phone]`, office.office_phone);
  });

  return apiPayload;
};

// --- Navigator Component ---
const companyNavigationList = [
  { label: "Partner Details", link: "PartnerDetails" },
  { label: "KYC Documents", link: "kycDocuments" },
  { label: "Bank Details", link: "bankDetails" },
  { label: "Reference", link: "reference" },
  { label: "Other Documents", link: "accessibility" },
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

// --- CompanyDetailsSection ---
const CompanyDetailsSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const {
    CountriesData = [],
    ContinentsData = [],
  } = useSelector(masterSelector);
  const { watch } = formMethods;

  const watchedCountry = watch("country_id");
  const isIndiaSelected = String(watchedCountry?.value) === '101';

  const countryOptions = CountriesData.map((value: any) => ({
    value: value.id,
    label: value.name,
  }));
  const countryCodeOptions = CountriesData.map((c: any) => ({
    value: `${c.phone_code}`,
    label: `${c.phone_code}`,
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
    { value: "Private Limited", label: "Private Limited" },
    { value: "Public Limited", label: "Public Limited" },
    { value: "Others", label: "Others" },
  ];

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Active", label: "Active" },
    { value: "Disabled", label: "Disabled" },
    { value: "Blocked", label: "Blocked" },
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
  } = useFieldArray({ control, name: "partner_offices" });
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
              <Input placeholder="Partner Name" {...field} onInput={(e: React.ChangeEvent<HTMLInputElement>) => { if (e?.target?.value) e.target.value = e.target.value.toUpperCase() }} />
            )}
          />
        </FormItem>

        <FormItem
          label={<div>Company Name<span className="text-red-500"> * </span></div>}
          invalid={!!errors.company_name}
          errorMessage={
            errors.company_name?.message as string
          }
        >
          <Controller
            name="company_name"
            control={control}
            render={({ field }) => (
              <Input placeholder="Company Name" {...field} />
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
          label={<div>Industrial Expertise<span className="text-red-500"> * </span></div>}
          invalid={!!errors.industrial_expertise}
          errorMessage={(errors.industrial_expertise as any)?.message as string}
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
          label={<div>Join Us As<span className="text-red-500"> * </span></div>}
          invalid={!!errors.join_us_as}
          errorMessage={(errors.join_us_as as any)?.message as string}
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
          label="Postal Code"
          invalid={!!errors.zip_code}
          errorMessage={errors.zip_code?.message as string}
        >
          <Controller
            name="zip_code"
            control={control}
            render={({ field }) => <Input placeholder="Post Code" {...field} />}
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
          className="sm:col-span-6 lg:col-span-4"
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
          className="sm:col-span-6 lg:col-span-4"
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
        <FormItem className="sm:col-span-6 lg:col-span-4" label="Alternate Contact Number" invalid={!!errors.alternate_contact_number}>
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

        <FormItem className="sm:col-span-6 lg:col-span-4" label="Landline" invalid={!!errors.general_contact_number}>
          <Controller
            name="general_contact_number"
            control={control}
            render={({ field }) => (
              <Input placeholder="Landline Number" {...field} />
            )}
          />
        </FormItem>

      </div>

      <hr className="my-6" /> <h4 className="mb-4">Trade Information</h4>
      <div className="grid md:grid-cols-4 gap-3">
        <FormItem
          label={<div>GST Number{isIndiaSelected && <span className="text-red-500"> * </span>}</div>}
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
          label={<div>PAN Number{isIndiaSelected && <span className="text-red-500"> * </span>}</div>}
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
          {companyLogoBrochureValue && (
            <div className="mt-2 h-20 w-20">
              <img
                src={typeof companyLogoBrochureValue === 'string' ? companyLogoBrochureValue : URL.createObjectURL(companyLogoBrochureValue)}
                alt="logo preview"
                className="h-full w-full object-contain"
              />
            </div>
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
        const uploadCertificateValue = watch(`partner_certificate[${index}][upload_certificate]`);
        return (
          <Card key={item.id} className="mb-4 rounded-md border border-black" bodyClass="p-4">
            <div className="grid md:grid-cols-10 gap-3 items-center">
              <FormItem label="Certificate ID" className="col-span-3">
                <Controller
                  name={`partner_certificate[${index}][certificate_id]`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="e.g., 12345" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="Certificate Name" className="col-span-3">
                <Controller
                  name={`partner_certificate[${index}][certificate_name]`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="e.g., ISO 9001" {...field} />
                  )}
                />
              </FormItem>
              <FormItem label="Upload Certificate" className="col-span-3">
                <Controller
                  name={`partner_certificate[${index}][upload_certificate]`}
                  control={control}
                  render={({ field: { onChange, ref } }) => (
                    <Input
                      type="file"
                      ref={ref}
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  )}
                />
                {uploadCertificateValue && (
                  <div className="mt-2">
                    <a href={typeof uploadCertificateValue === 'string' ? uploadCertificateValue : URL.createObjectURL(uploadCertificateValue)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">View Uploaded Document</a>
                  </div>
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
            <FormItem label="Office Type"><Controller name={`partner_offices[${index}][office_type]`} control={control} render={({ field }) => <Select placeholder="Select Office Type" options={officeTypeOptions} {...field} />} /></FormItem>
            <FormItem label="Office Name"><Controller name={`partner_offices[${index}][office_name]`} control={control} render={({ field }) => <Input placeholder="e.g. Main Office" {...field} />} /></FormItem>
            <FormItem label="Contact Person"><Controller name={`partner_offices[${index}][contact_person]`} control={control} render={({ field }) => <Input placeholder="Contact Person Name" {...field} />} /></FormItem>
            <FormItem label="Office Email"><Controller name={`partner_offices[${index}][office_email]`} control={control} render={({ field }) => <Input type="email" placeholder="office@example.com" {...field} />} /></FormItem>
            <FormItem label="Office Phone" invalid={!!errors.partner_offices?.[index]?.office_phone}>
              <Controller name={`partner_offices[${index}][office_phone]`} control={control} render={({ field }) => <Input type="tel" placeholder="Office Phone" {...field} />} />
            </FormItem>
            <FormItem label="GST/REG Number"><Controller name={`partner_offices[${index}][gst_number]`} control={control} render={({ field }) => <Input placeholder="GST or Registration Number" {...field} />} /></FormItem>
            <div className="col-span-4 grid md:grid-cols-4 gap-4 border-t pt-4 mt-2">
              <FormItem label="Country"><Controller name={`partner_offices[${index}][country_id]`} control={control} render={({ field }) => <Select placeholder="Select Country" options={countryOptions} {...field} />} /></FormItem>
              <FormItem label="State"><Controller name={`partner_offices[${index}][state]`} control={control} render={({ field }) => <Input placeholder="Enter state" {...field} />} /></FormItem>
              <FormItem label="City"><Controller name={`partner_offices[${index}][city]`} control={control} render={({ field }) => <Input placeholder="Enter city" {...field} />} /></FormItem>
              <FormItem label="Post Code"><Controller name={`partner_offices[${index}][zip_code]`} control={control} render={({ field }) => <Input placeholder="Post Code" {...field} />} /></FormItem>
              <FormItem label="Address" className="md:col-span-4"><Controller name={`partner_offices[${index}][address]`} control={control} render={({ field }) => <Input placeholder="Full Address" {...field} />} /></FormItem>
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
const GenericFileViewer = ({ file, onClose }: { file: File | string; onClose: () => void; }) => {
  const fileUrl = useMemo(() => (file instanceof File ? URL.createObjectURL(file) : file), [file]);
  const fileName = useMemo(() => (file instanceof File ? file.name : (file.split('/').pop() || 'file')), [file]);
  const fileExtension = useMemo(() => fileName.split('.').pop()?.toLowerCase(), [fileName]);

  const isPdf = fileExtension === 'pdf';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'pdf': return <TbFileTypePdf className="text-red-500" size={64} />;
      case 'xls': case 'xlsx': case 'csv': return <TbFileSpreadsheet className="text-green-500" size={64} />;
      default: return <TbFile className="text-gray-500" size={64} />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <Button
        type="button"
        shape="circle"
        variant="solid"
        icon={<TbX />}
        className="absolute top-4 right-4 z-[52] bg-black/50 hover:bg-black/80"
        onClick={onClose}
      />

      <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {isPdf ? (
          <iframe src={fileUrl} title={fileName} className="w-full h-full border-none rounded-lg bg-white" />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center flex flex-col items-center justify-center max-w-md">
            {getFileIcon()}
            <h4 className="mb-2 mt-4">Preview not available</h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs">
              This file type can't be shown here. You can open it in a new tab to view or download it.
            </p>
            <Button
              variant="solid"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              Open '{fileName}'
            </Button>
          </div>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-md">
          {fileName}
        </div>
      </div>
    </div>
  );
};
// --- KYCDetailSection ---
const KYCDetailSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewingFile, setViewingFile] = useState<File | string | null>(null);

  const watchedCountry = watch("country_id");
  const isIndiaSelected = String(watchedCountry?.value) === '101';

  const kycDocs = useMemo(() => [
    { label: "Aadhar Card", name: "aadhar_card_file" as const, remarkName: "aadhar_card_remark" as const, enabledName: "aadhar_card_verified" as const, isConditionallyRequired: isIndiaSelected },
    { label: "PAN Card", name: "pan_card_file" as const, remarkName: "pan_card_remark" as const, enabledName: "pan_card_verified" as const, isConditionallyRequired: isIndiaSelected },
    { label: "GST Certificate", name: "gst_certificate_file" as const, remarkName: "gst_certificate_remark" as const, enabledName: "gst_certificate_verified" as const, isConditionallyRequired: true },
    { label: "Visiting Card", name: "visiting_card_file" as const, remarkName: "visiting_card_remark" as const, enabledName: "visiting_card_verified" as const, isConditionallyRequired: false },
    { label: "Office Photo", name: "office_photo_file" as const, remarkName: "office_photo_remark" as const, enabledName: "office_photo_verified" as const, isConditionallyRequired: true },
    { label: "Authority Letter", name: "authority_letter_file" as const, remarkName: "authority_letter_remark" as const, enabledName: "authority_letter_verified" as const, isConditionallyRequired: false },
    { label: "Cancel Cheque", name: "cancel_cheque_file" as const, remarkName: "cancel_cheque_remark" as const, enabledName: "cancel_cheque_verified" as const, isConditionallyRequired: true },
    { label: "Agreement/Quotation", name: "agreement_file" as const, remarkName: "agreement_remark" as const, enabledName: "agreement_verified" as const, isConditionallyRequired: false },
    { label: "Other Document", name: "other_document_file" as const, remarkName: "other_document_remark" as const, enabledName: "other_document_verified" as const, isConditionallyRequired: false },
  ], [isIndiaSelected]);

  const watchedFileValues = watch(kycDocs.map(doc => doc.name));

  const imageDocsForViewer = useMemo(() => {
    return kycDocs
      .map((doc, index) => ({
        ...doc,
        fileValue: watchedFileValues[index]
      }))
      .filter(doc => {
        const url = doc.fileValue;
        if (!url) return false;
        if (url instanceof File) return url.type.startsWith('image/');
        if (typeof url === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);
        return false;
      })
      .map(doc => ({
        src: doc.fileValue instanceof File ? URL.createObjectURL(doc.fileValue) : doc.fileValue as string,
        alt: doc.label
      }));
  }, [kycDocs, watchedFileValues]);

  const openImageViewer = (docLabel: string) => {
    const index = imageDocsForViewer.findIndex(img => img.alt === docLabel);
    if (index > -1) {
      setSelectedImageIndex(index);
      setViewerIsOpen(true);
    }
  };

  const closeImageViewer = () => setViewerIsOpen(false);
  const closeGenericViewer = () => setViewingFile(null);

  const handlePreviewClick = (fileValue: File | string | null | undefined, docLabel: string) => {
    if (!fileValue) return;

    const isImage = (file: unknown): boolean => {
      if (file instanceof File) return file.type.startsWith('image/');
      if (typeof file === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file);
      return false;
    }

    if (isImage(fileValue)) {
      openImageViewer(docLabel);
    } else {
      setViewingFile(fileValue as File | string);
    }
  };

  return (
    <Card id="kycDocuments">
      <h5 className="mb-4">KYC Documents</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
        {kycDocs.map((doc) => {
          const fileValue = watch(doc.name);
          const isFileObject = fileValue instanceof File;
          const isViewableImage = isFileObject ? fileValue.type.startsWith('image/') : (typeof fileValue === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(fileValue));

          return (
            <div key={doc.name}>
              <label className="flex items-center gap-2 mb-1">
                <Controller
                  name={doc.enabledName}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={!!field.value}
                      onChange={field.onChange}
                      disabled={!fileValue}
                    />
                  )}
                />
                {doc.label}
                {/* {doc.isConditionallyRequired && <span className="text-red-500">*</span>} */}
              </label>
              <FormItem
                invalid={!!(errors as any)[doc.name]}
                errorMessage={(errors as any)[doc.name]?.message as string}
              >
                <Controller
                  name={doc.name}
                  control={control}
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <Input
                      {...fieldProps}
                      type="file"
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  )}
                />
              </FormItem>

              {fileValue && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handlePreviewClick(fileValue, doc.label)}
                    className="w-full h-24 border rounded-md p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                  >
                    {isViewableImage ? (
                      <img
                        src={isFileObject ? URL.createObjectURL(fileValue) : String(fileValue)}
                        alt={doc.label}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <DocumentPlaceholder
                        fileName={isFileObject ? fileValue.name : String(fileValue).split('/').pop() || 'Document'}
                        fileUrl={isFileObject ? URL.createObjectURL(fileValue) : String(fileValue)}
                      />
                    )}
                  </button>
                </div>
              )}

              <FormItem
                className="mt-2"
                invalid={!!(errors as any)[doc.remarkName]}
                errorMessage={(errors as any)[doc.remarkName]?.message as string}
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
      {viewerIsOpen && (
        <ImageViewer
          images={imageDocsForViewer}
          startIndex={selectedImageIndex}
          onClose={closeImageViewer}
        />
      )}
      {viewingFile && (
        <GenericFileViewer file={viewingFile} onClose={closeGenericViewer} />
      )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <FormItem label="Primary Beneficiary Name">
          <Controller
            name="primary_benificeiry_name"
            control={control} render={({ field }) => (
              <Input type="text" {...field} placeholder="Enter Beneficiary Name" />
            )} />
        </FormItem>
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
          {/* FIX: Show preview for new or existing bank photo */}
          {primaryBankPhotoValue && (
            <div className="mt-2 h-20">
              {isImageUrl(primaryBankPhotoValue) ? (
                <img src={typeof primaryBankPhotoValue === 'string' ? primaryBankPhotoValue : URL.createObjectURL(primaryBankPhotoValue)} alt="Primary bank photo" className="h-full w-auto" />
              ) : (
                <DocumentPlaceholder fileName={primaryBankPhotoValue instanceof File ? primaryBankPhotoValue.name : 'document'} fileUrl={typeof primaryBankPhotoValue === 'string' ? primaryBankPhotoValue : URL.createObjectURL(primaryBankPhotoValue)} />
              )}
            </div>
          )}
        </FormItem>
      </div>
      <hr className="my-3" /> <h4 className="mb-6">Bank Details (Secondary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <FormItem label="Secondary Beneficiary Name">
          <Controller
            name="secondary_benificeiry_name"
            control={control} render={({ field }) => (
              <Input type="text" {...field} placeholder="Enter Beneficiary Name" />
            )} />
        </FormItem>
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
          {/* FIX: Show preview for new or existing bank photo */}
          {secondaryBankPhotoValue && (
            <div className="mt-2 h-20">
              {isImageUrl(secondaryBankPhotoValue) ? (
                <img src={typeof secondaryBankPhotoValue === 'string' ? secondaryBankPhotoValue : URL.createObjectURL(secondaryBankPhotoValue)} alt="Secondary bank photo" className="h-full w-auto" />
              ) : (
                <DocumentPlaceholder fileName={secondaryBankPhotoValue instanceof File ? secondaryBankPhotoValue.name : 'document'} fileUrl={typeof secondaryBankPhotoValue === 'string' ? secondaryBankPhotoValue : URL.createObjectURL(secondaryBankPhotoValue)} />
              )}
            </div>
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
          `partner_bank_details[${index}][verification_photo]`
        );
        return (
          <Card key={item.id} className="mb-4 border-black relative rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 items-start">
              <FormItem label={`Type`}>
                <Controller
                  name={`partner_bank_details[${index}][type]`}
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
                  name={`partner_bank_details[${index}][bank_account_number]`}
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Account No." {...field} />
                  )}
                />
              </FormItem>
              <FormItem label={`Bank Name`}>
                <Controller
                  name={`partner_bank_details[${index}][bank_name]`}
                  control={control}
                  render={({ field }) => (
                    <Input type="text" {...field} placeholder="Enter Bank Name" />
                  )}
                />
              </FormItem>
              <FormItem label={`IFSC Code`}>
                <Controller
                  name={`partner_bank_details[${index}][ifsc_code]`}
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
                  name={`partner_bank_details[${index}][verification_photo]`}
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
                {/* FIX: Show preview for new or existing bank photo */}
                {bankPhotoValue && (
                  <div className="mt-2 h-20">
                    {isImageUrl(bankPhotoValue) ? (
                      <img src={typeof bankPhotoValue === 'string' ? bankPhotoValue : URL.createObjectURL(bankPhotoValue)} alt={`Bank ${index + 1} photo`} className="h-full w-auto" />
                    ) : (
                      <DocumentPlaceholder fileName={bankPhotoValue instanceof File ? bankPhotoValue.name : 'document'} fileUrl={typeof bankPhotoValue === 'string' ? bankPhotoValue : URL.createObjectURL(bankPhotoValue)} />
                    )}
                  </div>
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
const ReferenceSection = ({ control, formMethods }: FormSectionBaseProps) => {
  const dispatch = useAppDispatch();
  const { partnerData, CompanyData } = useSelector(masterSelector);
  const { setValue } = formMethods;

  useEffect(() => {
    if (!partnerData?.data || partnerData.data.length === 0) {
      dispatch(getpartnerAction());
    }
    if (!CompanyData?.data || CompanyData.data.length === 0) {
      dispatch(getCompanyAction());
    }
  }, [partnerData, CompanyData, dispatch]);

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
              <Controller
                name={`partner_references[${index}][referenced_partner_id]`}
                control={control}
                render={({ field }) => {
                  // FIX: Ensure related fields are populated correctly when a partner is selected.
                  const handlePartnerChange = (selectedOption: { value: any; label: string } | null) => {
                    field.onChange(selectedOption);
                    if (selectedOption) {
                      const fullPartnerList = partnerData?.data || [];
                      const selectedPartner = fullPartnerList.find((p: ApiSingleCompanyItem) => String(p.id) === String(selectedOption.value));
                      if (selectedPartner) {
                        // Find the company in the options list to get the full {label, value} object
                        const companyToSet = companyOptions.find(c => c.label === selectedPartner.company_name);
                        setValue(`partner_references[${index}][email]`, selectedPartner.primary_email_id || '');
                        setValue(`partner_references[${index}][number]`, selectedPartner.primary_contact_number || '');
                        // Set the full object for the react-select component
                        setValue(`partner_references[${index}][company_id]`, companyToSet, { shouldValidate: true });
                      }
                    } else {
                      setValue(`partner_references[${index}][email]`, '');
                      setValue(`partner_references[${index}][number]`, '');
                      setValue(`partner_references[${index}][company_id]`, undefined);
                    }
                  };
                  return <Select placeholder="Select Partner" options={partnerOptions} value={field.value} onChange={handlePartnerChange} />;
                }}
              />
            </FormItem>
            <FormItem label="Company Name">
              <Controller name={`partner_references[${index}][company_id]`} control={control} render={({ field }) => <Select placeholder="Select Company" options={companyOptions} {...field} />} />
            </FormItem>
            <FormItem label="Email"><Controller name={`partner_references[${index}][email]`} control={control} render={({ field }) => <Input type="email" placeholder="Email ID" {...field} />} /></FormItem>
            <FormItem label="Contact Number"><Controller name={`partner_references[${index}][number]`} control={control} render={({ field }) => <Input placeholder="Contact Number" {...field} />} /></FormItem>
            <FormItem label="Remark" className="sm:col-span-full"><Controller name={`partner_references[${index}][remark]`} control={control} render={({ field }) => <Input placeholder="Add remarks here..." {...field} />} /></FormItem>
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
    name: "billing_documents",
  });
  const { DocumentTypeData = [] } = useSelector(masterSelector);

  const documentTypes = useMemo(() =>
    DocumentTypeData.map((c: any) => ({
      value: c.id,
      label: c.name,
    })), [DocumentTypeData]);

  return (
    <Card id="accessibility">
      <div className="grid grid-cols-1 gap-y-6">
        <div className="flex justify-between items-center">
          <h5 className="mb-0">Other Documents</h5>
          <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ document_name: undefined, document: undefined })}>Add Document</Button>
        </div>
        {fields.map((item, index) => {
          const documentValue = watch(`billing_documents[${index}][document]`);
          const isFileObject = documentValue instanceof File;
          return (
            // FIX: Improved UI for the "Other Documents" section.
            <Card key={item.id} className="border-black rounded-md" bodyClass="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <FormItem label="Document Name" className="md:col-span-1">
                  <Controller
                    name={`billing_documents[${index}][document_name]`}
                    control={control}
                    render={({ field }) => <Select
                      options={documentTypes}
                      placeholder="Select Document Type"
                      {...field}
                    />}
                  />
                </FormItem>
                <div className="md:col-span-2 grid grid-cols-2 gap-4 items-start">
                  <FormItem label="Upload Document" className="col-span-1">
                    <Controller
                      name={`billing_documents[${index}][document]`}
                      control={control}
                      render={({ field: { onChange, ref } }) => <Input type="file" ref={ref} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => onChange(e.target.files?.[0])} />}
                    />
                  </FormItem>
                  {/* FIX: Show preview immediately after upload. */}
                  {documentValue && (
                    <div className="mt-2 w-32 h-24 col-span-1">
                      {isImageUrl(documentValue) || (isFileObject && documentValue.type.startsWith('image/')) ? (
                        <img
                          src={isFileObject ? URL.createObjectURL(documentValue) : String(documentValue)}
                          alt="Document Preview"
                          className="max-h-full max-w-full object-contain border rounded-md"
                        />
                      ) : (
                        <DocumentPlaceholder
                          fileName={isFileObject ? documentValue.name : String(documentValue).split('/').pop() || 'Document'}
                          fileUrl={isFileObject ? URL.createObjectURL(documentValue) : String(documentValue)}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => remove(index)} />
                </div>
              </div>
            </Card>
          )
        })}
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
            <FormItem label="Person Name"><Controller name={`member[${index}][person_name]`} control={control} render={({ field }) => <Input placeholder="Person Name" {...field} />} /></FormItem>
            <FormItem label="Company Name"><Controller name={`member[${index}][company_name]`} control={control} render={({ field }) => <Input placeholder="Company Name" {...field} />} /></FormItem>
            <FormItem label="Email ID"><Controller name={`member[${index}][email]`} control={control} render={({ field }) => <Input type="email" placeholder="Email ID" {...field} />} /></FormItem>
            <FormItem label="Designation"><Controller name={`member[${index}][designation]`} control={control} render={({ field }) => <Input placeholder="e.g., CEO" {...field} />} /></FormItem>
            <FormItem label="Contact Number"><Controller name={`member[${index}][number]`} control={control} render={({ field }) => <Input type="tel" placeholder="Contact Number" {...field} />} /></FormItem>
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

  const phoneRegex = /^\d{10}$/;
  const optionalPhoneValidation = z.string().optional().or(z.literal('')).refine(val => !val || phoneRegex.test(val), { message: "Must be exactly 10 digits if provided" });
  const selectObjectSchema = z.object({ value: z.any(), label: z.any() }).nullable().optional();

  // Refined Zod Schema for perfect validation
  const companySchema = z.object({
    partner_name: z.string().trim().min(1, "Partner Name is required"),
    company_name: z.string().trim().min(1, "Company Name is required"),
    status: selectObjectSchema.refine(val => val?.value, "Status is required"),
    ownership_type: selectObjectSchema.refine(val => val?.value, "Ownership Type is required"),
    industrial_expertise: selectObjectSchema.refine(val => val?.value, "Industrial Expertise is required"),
    join_us_as: selectObjectSchema.refine(val => val?.value, "Join us as is required"),
    country_id: selectObjectSchema.refine(val => val?.value, "Country is required"),
    primary_email_id: z.string().trim().min(1, "Primary Email is required").email("Invalid email format"),
    primary_contact_number: z.string().trim().min(1, "Primary contact is required").regex(phoneRegex, "Must be exactly 10 digits"),
    primary_contact_number_code: selectObjectSchema.refine(val => val?.value, "Country code is required"),


    // // Statically required documents
    // gst_certificate_file: z.any().refine(file => file, { message: "GST Certificate is required." }),
    // office_photo_file: z.any().refine(file => file, { message: "Office Photo is required." }),
    // cancel_cheque_file: z.any().refine(file => file, { message: "Cancel Cheque is required." }),

  }).passthrough().superRefine((data, ctx) => {
    // Dynamic validation based on country
    const isIndia = String(data.country_id?.value) === '101';
    if (isIndia) {
      // if(!data.gst_number || data.gst_number.trim() === '') {
      //     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GST Number is required for India.", path: ["gst_number"] });
      // }
      // if(!data.pan_number || data.pan_number.trim() === '') {
      //     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN Number is required for India.", path: ["pan_number"] });
      // }
      // if(!data.aadhar_card_file) {
      //     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Aadhar Card is required for India.", path: ["aadhar_card_file"] });
      // }
      // if(!data.pan_card_file) {
      //     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN Card is required for India.", path: ["pan_card_file"] });
      // }
    }
  });


  const formMethods = useForm<CompanyFormSchema>({
    resolver: zodResolver(companySchema),
    mode: 'onTouched',
    defaultValues: defaultValues,
  });
  const { handleSubmit, reset, formState: { errors }, control, watch, trigger } = formMethods;

  // --- FIX: Add useEffect to trigger validation when country changes ---
  const watchedCountry = watch("country_id");
  useEffect(() => {
    // Only trigger if watchedCountry is not in its initial undefined state
    if (watchedCountry !== undefined) {
      trigger([
        'gst_number',
        'pan_number',
        'aadhar_card_file',
        'pan_card_file'
      ]);
    }
  }, [watchedCountry, trigger]);

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

  const { partnerData = {}, CompanyData = {}, DocumentTypeData = [], CountriesData = [] } = useSelector(masterSelector);

  const partnerOptions = useMemo(() => {
    const data = partnerData?.data || [];
    return Array.isArray(data) ? data.map((p: any) => ({ value: p.id, label: p.partner_name })) : [];
  }, [partnerData]);

  const companyOptions = useMemo(() => {
    const data = CompanyData?.data || [];
    return Array.isArray(data) ? data.map((c: any) => ({ value: c.id, label: c.company_name })) : [];
  }, [CompanyData]);

  const documentTypeOptions = useMemo(() => {
    return Array.isArray(DocumentTypeData) ? DocumentTypeData.map((d: any) => ({ value: d.id, label: d.name })) : [];
  }, [DocumentTypeData]);

  const countryOptions = useMemo(() => {
    return Array.isArray(CountriesData) ? CountriesData.map((c: any) => ({ value: c.id, label: c.name })) : [];
  }, [CountriesData]);


  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getDocumentTypeAction());
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
            setInitialData(transformApiToFormSchema(actionResult, partnerOptions, companyOptions, documentTypeOptions, countryOptions));
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

      if (partnerOptions.length > 0 && companyOptions.length > 0 && documentTypeOptions.length > 0 && countryOptions.length > 0) {
        fetchPartnerData();
      }
    } else {
      setInitialData({});
      setPageLoading(false);
    }
  }, [isEditMode, navigate, dispatch, id, partnerOptions.length, companyOptions.length, documentTypeOptions.length, countryOptions.length]);

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