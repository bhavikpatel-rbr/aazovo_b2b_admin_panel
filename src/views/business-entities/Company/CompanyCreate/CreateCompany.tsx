import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { NavLink, useNavigate, useParams } from "react-router-dom";

// UI Components
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import NumericInput from "@/components/shared/NumericInput";
import { Dialog, Spinner } from "@/components/ui";
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
  addMemberAction,
  editCompanyAction,
  getCompanyAction,
  getCompanyByIdAction,
  getContinentsAction,
  getCountriesAction,
  getDocumentListAction,
  getEmployeesListingAction,
  getMemberAction,
  getParentCategoriesAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { BiChevronRight } from "react-icons/bi";
import { TbBrandWhatsapp, TbCategory, TbChevronLeft, TbChevronRight, TbFile, TbFileSpreadsheet, TbFileTypePdf, TbMail, TbPhone, TbPlus, TbTrash, TbUserCircle, TbWorld, TbX } from "react-icons/tb";
import { useSelector } from "react-redux";
import { z } from "zod";


// --- START: Helper Components for Document Viewing ---
interface ImageViewerProps {
  images: { src: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

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
  }, [handleNext, handlePrev, onClose]);

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
        type="button"
        shape="circle"
        variant="solid"
        icon={<TbX />}
        className="absolute top-4 right-4 z-[52] bg-black/50 hover:bg-black/80"
        onClick={onClose}
      />

      <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
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
    <div
      className="w-full h-full p-2 flex flex-col items-center justify-center text-center"
    >
      {getFileIcon()}
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-all">
        {fileName}
      </p>
    </div>
  );
};
// --- END: Helper Components ---
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

// --- Type Definitions ---
interface ReferenceItemFE {
  id?: string;
  person_name?: string;
  company_id?: { label: string; value: string };
  number?: string;
  remark?: string;
}
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
  verified_by_id?: { label: string; value: string };
  photo_upload?: File | string | null;
  remark?: string;
}

interface CompanyBankDetailItemFE {
  id?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  swift_code?: string;
  verification_photo?: File | string | null;
  type?: { label: string; value: string };
  is_default?: boolean;
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
  document_name?: { label: string; value: string };
  document?: File | string | null;
}

interface EnabledBillingDocItemFE {
  id?: string;
  document_name?: { label: string; value: string };
  document?: File | string | null;
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
  primary_benificeiry_name?: string;
  primary_bank_name?: string;
  primary_ifsc_code?: string;
  primary_swift_code?: string;
  primary_bank_verification_photo?: File | string | null;
  primary_is_default?: boolean;
  secondary_account_number?: string;
  secondary_benificeiry_name?: string;
  secondary_bank_name?: string;
  secondary_ifsc_code?: string;
  secondary_swift_code?: string;
  secondary_bank_verification_photo?: File | string | null;
  secondary_is_default?: boolean;
  company_bank_details?: CompanyBankDetailItemFE[];

  USER_ACCESS?: boolean;
  billing_documents?: BillingDocItemFE[];
  enabled_billing_docs?: EnabledBillingDocItemFE[];

  company_members?: CompanyMemberItemFE[];
  company_teams?: CompanyTeamItemFE[];
  company_spot_verification?: SpotVerificationItemFE[];
  company_references?: ReferenceItemFE[];
}

// MODIFIED PROPS INTERFACE
export interface FormSectionBaseProps {
  control: Control<CompanyFormSchema>;
  errors: FieldErrors<CompanyFormSchema>;
  formMethods: UseFormReturn<CompanyFormSchema>;
  getValues: UseFormReturn<CompanyFormSchema>['getValues'];
  handlePreviewClick: (file: File | string | null | undefined, label: string) => void;
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
  company_certificate?: Array<{ id: number; certificate_id: string; certificate_name: string; upload_certificate: string | null; upload_certificate_path?: string; }>;
  office_info?: Array<{ id: number; office_type: string; office_name: string; address: string; country_id: string; state: string; city: string; zip_code: string; gst_number: string | null; contact_person?: string; office_email?: string; office_phone?: string; }>;

  ['206AB_file']?: string | null;
  ['206AB_verified']?: boolean | string;
  ['206AB_remark']?: string | null;
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
  primary_benificeiry_name?: string | null;
  primary_ifsc_code?: string | null;
  primary_swift_code?: string | null;
  primary_bank_verification_photo?: string | null;
  primary_is_default?: boolean | string;
  secondary_account_number?: string | null;
  secondary_benificeiry_name?: string | null;
  secondary_bank_name?: string | null;
  secondary_ifsc_code?: string | null;
  secondary_swift_code?: string | null;
  secondary_bank_verification_photo?: string | null;
  secondary_is_default?: boolean | string;
  company_bank_details?: Array<{ id: number; bank_account_number: string; bank_name: string; ifsc_code: string; swift_code?: string; type: string; verification_photo: string | null; is_default?: boolean | string; }>;
  billing_documents?: Array<{ id: number; document_name: { label: string; value: string }; document: string | null; }>;
  enable_billing_documents?: Array<{ id: number; document_name: { label: string; value: string }; document: string | null; }>;
  company_member_management?: Array<{ member_id: string; designation: string; person_name: string; number: string; }>;
  company_team_members?: Array<{ team_name: string; designation: string; person_name: string; number: string; }>;
  company_spot_verification?: Array<{ id: number; verified_by_id?: string | number; verified_by_name?: string; verified: boolean | string; remark: string | null; photo_upload: string | null; }>;
  company_references?: Array<{ id: number; person_name: string; company_id: string; number: string; remark: string | null; }>;
}

// --- Helper to transform API data to CompanyFormSchema for EDIT mode ---
const transformApiToFormSchema = (
  apiData: ApiSingleCompanyItem,
  allCountries: Array<{ id: string | number; name: string }>,
  allContinents: Array<{ id: string | number; name: string }>,
  allMembers: Array<{ value: string; label: string }>,
  allEmployees: Array<{ value: string; label: string }>,
  allCompaniesForRef: Array<{ value: string; label: string }>,
  documentTypeOptions: Array<{ value: string; label: string }>
): Partial<CompanyFormSchema> => {
  const stringToBoolean = (value: boolean | string | undefined | null): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerVal = value.toLowerCase();
      return lowerVal === '1' || lowerVal === 'true' || lowerVal === 'yes';
    }
    return false;
  };

  const findOptionByValue = (options: Array<{ value: string; label: string }>, value?: string | number | null) => {
    if (value === null || value === undefined) return undefined;
    return options.find(opt => String(opt.value) === String(value));
  };

  const findOptionByLabel = (options: Array<{ value: string; label: string }>, label?: string | null) => {
    if (!label) return undefined;
    return options.find(opt => opt.label.toLowerCase().includes(label.toLowerCase()));
  };

  const mapCountries = allCountries.map(c => ({ value: String(c.id), label: c.name }));
  const mapContinents = allContinents.map(c => ({ value: String(c.id), label: c.name }));

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
    country_id: findOptionByValue(mapCountries, apiData.country_id) || (apiData.country?.name ? { label: apiData.country.name, value: String(apiData.country_id) } : undefined),
    continent_id: findOptionByValue(mapContinents, apiData.continent_id) || (apiData.continent?.name ? { label: apiData.continent.name, value: String(apiData.continent_id) } : null),
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
      id: String(cert.id),
      certificate_id: cert.certificate_id,
      certificate_name: cert.certificate_name || '',
      upload_certificate: cert.upload_certificate_path || cert.upload_certificate || null,
    })) || [],
    office_info: apiData.office_info?.map(office => ({
      id: String(office.id),
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

    declaration_206ab: apiData["206AB_file"] || null,
    declaration_206ab_remark: apiData["206AB_remark"] || '',
    declaration_206ab_remark_enabled: stringToBoolean(apiData["206AB_verified"]),
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
    primary_bank_name: apiData.primary_bank_name || '',
    primary_benificeiry_name: apiData.primary_benificeiry_name || '',
    primary_ifsc_code: apiData.primary_ifsc_code || '',
    primary_swift_code: apiData.primary_swift_code || '',
    primary_bank_verification_photo: apiData.primary_bank_verification_photo || null,
    primary_is_default: stringToBoolean(apiData.primary_is_default),
    secondary_account_number: apiData.secondary_account_number || '',
    secondary_benificeiry_name: apiData?.secondary_benificeiry_name || '',
    secondary_bank_name: apiData.secondary_bank_name || '',
    secondary_ifsc_code: apiData.secondary_ifsc_code || '',
    secondary_swift_code: apiData.secondary_swift_code || '',
    secondary_bank_verification_photo: apiData.secondary_bank_verification_photo || null,
    secondary_is_default: stringToBoolean(apiData.secondary_is_default),
    company_bank_details: apiData.company_bank_details?.map(bank => ({
      id: String(bank.id),
      bank_account_number: bank.bank_account_number || '',
      bank_name: bank.bank_name || undefined,
      ifsc_code: bank.ifsc_code || '',
      swift_code: bank.swift_code || '',
      type: bank.type ? { label: bank.type, value: bank.type } : undefined,
      verification_photo: bank.verification_photo || null,
      is_default: stringToBoolean(bank.is_default),
    })) || [],

    USER_ACCESS: stringToBoolean(apiData.kyc_verified),
    billing_documents: apiData.billing_documents?.map(doc => ({
      id: String(doc.id),
      document_name: findOptionByValue(documentTypeOptions, doc.document_name as any), // Cast to any to handle potential type mismatch
      document: doc.document || null,
    })) || [],
    enabled_billing_docs: apiData.enable_billing_documents?.map(doc => ({
      id: String(doc.id),
      document_name: findOptionByValue(documentTypeOptions, doc.document_name as any), // Cast to any
      document: doc.document || null
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
      id: String(item.id),
      verified: stringToBoolean(item.verified),
      verified_by_id: findOptionByValue(allEmployees, item.verified_by_id) || findOptionByLabel(allEmployees, item.verified_by_name),
      photo_upload: item.photo_upload || null,
      remark: item.remark || '',
    })) || [],
    company_references: apiData.company_references?.map(ref => ({
      id: String(ref.id),
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
      // Keep it empty for backend
    } else if (typeof value === 'boolean') {
      apiPayload.append(key, value ? "1" : "0");
    } else if (value instanceof File) {
      apiPayload.append(key, value);
    } else if (typeof value === 'object' && !Array.isArray(value) && value.value !== undefined) {
      apiPayload.append(key, value.value);
    }
    else {
      apiPayload.append(key, String(value));
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
    "primary_account_number", "primary_benificeiry_name", "primary_bank_name", "primary_ifsc_code", "primary_swift_code", "primary_is_default",
    "secondary_account_number", "secondary_benificeiry_name", "secondary_bank_name", "secondary_ifsc_code", "secondary_swift_code", "secondary_is_default"
  ];
  simpleFields.forEach(field => {
    if (data[field] !== undefined) appendField(field, data[field])
  });

  appendField("kyc_verified", data.USER_ACCESS);
  appendField("company_logo", data.company_logo);
  appendField("primary_bank_verification_photo", data.primary_bank_verification_photo);
  appendField("secondary_bank_verification_photo", data.secondary_bank_verification_photo);

  // Certificates
  data.company_certificate?.forEach((cert: CertificateItemFE, index: number) => {
    appendField(`company_certificate[${index}][certificate_id]`, cert.certificate_id);
    appendField(`company_certificate[${index}][certificate_name]`, cert.certificate_name);
    appendField(`company_certificate[${index}][upload_certificate]`, cert.upload_certificate);
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
    appendField(doc.beFileKey, data[doc.feFileKey]);
    appendField(doc.beVerifyKey, data[doc.feVerifyKey]);
    appendField(doc.beRemarkKey, data[doc.feRemarkKey]);
  });

  data.company_bank_details?.forEach((bank: CompanyBankDetailItemFE, index: number) => {
    appendField(`company_bank_details[${index}][bank_account_number]`, bank.bank_account_number);
    appendField(`company_bank_details[${index}][bank_name]`, bank.bank_name);
    appendField(`company_bank_details[${index}][ifsc_code]`, bank.ifsc_code);
    appendField(`company_bank_details[${index}][swift_code]`, bank.swift_code);
    appendField(`company_bank_details[${index}][type]`, bank.type?.value);
    appendField(`company_bank_details[${index}][verification_photo]`, bank.verification_photo);
    appendField(`company_bank_details[${index}][is_default]`, bank.is_default);
  });

  data.billing_documents?.forEach((doc: BillingDocItemFE, index: number) => {
    appendField(`billing_documents[${index}][document_name]`, doc.document_name?.value);
    appendField(`billing_documents[${index}][document]`, doc.document);
  });

  data.enabled_billing_docs?.forEach((doc: EnabledBillingDocItemFE, index: number) => {
    appendField(`enable_billing_documents[${index}][document_name]`, doc.document_name?.value);
    appendField(`enable_billing_documents[${index}][document]`, doc.document);
    if (isEditMode && doc.id) {
      appendField(`enable_billing_documents[${index}][id]`, doc.id);
    }
  });

  data.company_members?.forEach((member: CompanyMemberItemFE, index: number) => {
    appendField(`company_member_management[${index}][member_id]`, member.member_id?.value);
    appendField(`company_member_management[${index}][designation]`, member.designation);
    appendField(`company_member_management[${index}][person_name]`, member.person_name);
    appendField(`company_member_management[${index}][number]`, member.number);
  });

  data.company_teams?.forEach((member: CompanyTeamItemFE, index: number) => {
    appendField(`company_team_members[${index}][team_name]`, member.team_name);
    appendField(`company_team_members[${index}][designation]`, member.designation);
    appendField(`company_team_members[${index}][person_name]`, member.person_name);
    appendField(`company_team_members[${index}][number]`, member.number);
  });

  data.company_spot_verification?.forEach((item: SpotVerificationItemFE, index: number) => {
    appendField(`company_spot_verification[${index}][verified]`, item.verified);
    appendField(`company_spot_verification[${index}][verified_by_id]`, item.verified_by_id);
    appendField(`company_spot_verification[${index}][remark]`, item.remark);
    appendField(`company_spot_verification[${index}][photo_upload]`, item.photo_upload);
  });

  data.company_references?.forEach((ref: ReferenceItemFE, index: number) => {
    appendField(`company_references[${index}][person_name]`, ref.person_name);
    appendField(`company_references[${index}][company_id]`, ref.company_id?.value);
    appendField(`company_references[${index}][number]`, ref.number);
    appendField(`company_references[${index}][remark]`, ref.remark);
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

// --- CompanyDetailsSection ---
const CompanyDetailsSection = ({
  control,
  errors,
  formMethods,
  handlePreviewClick,
}: FormSectionBaseProps) => {
  const {
    CountriesData = [],
    ContinentsData = [],
  } = useSelector(masterSelector);
  const { watch } = formMethods;

  const countryOptions = useMemo(() => {
    const uniqueCountriesMap = new Map();
    (CountriesData || []).forEach((country: any) => {
      uniqueCountriesMap.set(country.id, country);
    });
    return Array.from(uniqueCountriesMap.values()).map((value: any) => ({
      value: String(value.id),
      label: value.name,
    }));
  }, [CountriesData]);

  const countryCodeOptions = useMemo(() => {
    const uniqueCodes = new Set<string>();
    (CountriesData || []).forEach((c: any) => {
      if (c.phone_code) {
        uniqueCodes.add(`${c.phone_code}`);
      }
    });
    return Array.from(uniqueCodes)
      .sort((a, b) => a.localeCompare(b))
      .map(code => ({
        value: code,
        label: code,
      }));
  }, [CountriesData]);

  const continentOptions = useMemo(() => ContinentsData.map((value: any) => ({
    value: String(value.id),
    label: value.name,
  })), [ContinentsData]);

  const ownershipTypeOptions = [
    { value: "Sole Proprietorship", label: "Sole Proprietorship" },
    { value: "Partner", label: "Partner" },
    { value: "LLC", label: "LLC" },
    { value: "Corporate", label: "Corporate" },
    { value: "Private Limited", label: "Private Limited" },
    { value: "Public Limited", label: "Public Limited" },
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

  const selectedCountry = watch("country_id");
  const isIndiaSelected = selectedCountry?.value === '101';

  const isViewableImage = (file: unknown): boolean => {
    if (file instanceof File) return file.type.startsWith('image/');
    if (typeof file === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file);
    return false;
  }

  return (
    <Card id="companyDetails">
      <h4 className="mb-4">Primary Information</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} invalid={!!errors.status} errorMessage={errors.status?.message as string}>
          <Controller name="status" control={control} render={({ field }) => (<Select options={statusOptions} placeholder="Select Status" {...field} />)} />
        </FormItem>
        <FormItem label={<div>Company Name<span className="text-red-500"> * </span></div>} invalid={!!errors.company_name} errorMessage={errors.company_name?.message as string}>
          <Controller name="company_name" control={control} render={({ field }) => (<Input placeholder="Company Name" {...field} onInput={(e: any) => { if (e.target.value) e.target.value = e.target.value.toUpperCase() }} />)} />
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
            <div className="w-2/6"> <Controller name="primary_contact_number_code" control={control} render={({ field }) => (<Select options={countryCodeOptions} placeholder="Code" {...field} />)} /> </div>
            <div className="w-3/5"> <Controller name="primary_contact_number" control={control} render={({ field }) => (<Input placeholder="Primary Contact" {...field} />)} /> </div>
          </div>
        </FormItem>
        <FormItem className="sm:col-span-6 lg:col-span-4" label="Alternate Contact Number">
          <div className="flex items-start gap-2">
            <div className="w-2/6"> <Controller name="alternate_contact_number_code" control={control} render={({ field }) => (<Select options={countryCodeOptions} placeholder="Code" {...field} />)} /> </div>
            <div className="w-3/5"> <Controller name="alternate_contact_number" control={control} render={({ field }) => (<Input placeholder="Alternate Contact" {...field} />)} /> </div>
          </div>
        </FormItem>
        <FormItem className="sm:col-span-6 lg:col-span-4" label={<div>Landline</div>} invalid={!!errors.general_contact_number || !!errors.general_contact_number_code} errorMessage={(errors.general_contact_number?.message || (errors.general_contact_number_code as any)?.message) as string}>
          <div className="flex items-start gap-2">
            <div className="w-3/5"> <Controller name="general_contact_number" control={control} render={({ field }) => (<Input placeholder="Company Landline" {...field} />)} /> </div>
          </div>
        </FormItem>
      </div>

      <hr className="my-6" />
      <h4 className="mb-4">Trade Information</h4>
      <div className="grid md:grid-cols-4 gap-3">

        <FormItem label={<div>GST Number{isIndiaSelected && <span className="text-red-500"> *</span>}</div>} invalid={!!errors.gst_number} errorMessage={errors.gst_number?.message as string}><Controller name="gst_number" control={control} render={({ field }) => (<Input placeholder="GST Number" {...field} />)} /></FormItem>
        <FormItem label={<div>PAN Number{isIndiaSelected && <span className="text-red-500"> *</span>}</div>} invalid={!!errors.pan_number} errorMessage={errors.pan_number?.message as string}><Controller name="pan_number" control={control} render={({ field }) => (<Input placeholder="PAN Number" {...field} />)} /></FormItem>

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
          <Controller 
            name="company_logo"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <Input 
                {...rest}
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
              />
          )} />
           {companyLogoValue && (
            <div className="mt-2">
                <button
                    type="button"
                    onClick={() => handlePreviewClick(companyLogoValue, 'Company Logo')}
                    className="w-full h-24 border rounded-md p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                >
                    {isViewableImage(companyLogoValue) ? (
                        <img
                            src={companyLogoValue instanceof File ? URL.createObjectURL(companyLogoValue) : String(companyLogoValue)}
                            alt="Company Logo Preview"
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <DocumentPlaceholder
                            fileName={companyLogoValue instanceof File ? companyLogoValue.name : companyLogoValue.split('/').pop() || 'Document'}
                            fileUrl={companyLogoValue instanceof File ? URL.createObjectURL(companyLogoValue) : String(companyLogoValue)}
                        />
                    )}
                </button>
            </div>
          )}
        </FormItem>
        <FormItem label="Company Website" invalid={!!errors.company_website} errorMessage={errors.company_website?.message as string}>
          <Controller name="company_website" control={control} render={({ field }) => (<Input type="url" placeholder="https://example.com" {...field} />)} />
        </FormItem>
      </div>

      <hr className="my-6" />
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Certificates</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => appendCert({ certificate_id: undefined, certificate_name: "", upload_certificate: null })}> Add Certificate </Button>
      </div>
      {certFields.map((item, index) => {
        const uploadCertificateValue = watch(`company_certificate.${index}.upload_certificate`);
        const certificateName = watch(`company_certificate.${index}.certificate_name`);
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
                <Controller 
                  name={`company_certificate.${index}.upload_certificate`}
                  control={control}
                  render={({ field: { value, onChange, ...rest } }) => (
                    <Input 
                      {...rest}
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => onChange(e.target.files?.[0] || null)}
                    />
                )} />
                 {uploadCertificateValue && (
                    <div className="mt-2">
                        <button
                            type="button"
                            onClick={() => handlePreviewClick(uploadCertificateValue, certificateName || `Certificate ${index + 1}`)}
                            className="w-full h-24 border rounded-md p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                        >
                            {isViewableImage(uploadCertificateValue) ? (
                                <img
                                    src={uploadCertificateValue instanceof File ? URL.createObjectURL(uploadCertificateValue) : String(uploadCertificateValue)}
                                    alt="Certificate Preview"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <DocumentPlaceholder
                                    fileName={uploadCertificateValue instanceof File ? uploadCertificateValue.name : uploadCertificateValue.split('/').pop() || 'Document'}
                                    fileUrl={uploadCertificateValue instanceof File ? URL.createObjectURL(uploadCertificateValue) : String(uploadCertificateValue)}
                                />
                            )}
                        </button>
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
const KYCDetailSection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
    const { watch, getValues } = formMethods;
    const selectedCountry = watch("country_id");
    const isIndiaSelected = selectedCountry?.value === '101';
  
    const handleShare = useCallback(async (shareType: 'email' | 'whatsapp' | 'native', file: File | string | null, docLabel: string) => {
      if (!file) {
        toast.push(<Notification type="warning" title="No File">No document to share.</Notification>);
        return;
      }
  
      const companyName = getValues("company_name") || "this company";
      const subject = `${docLabel} for ${companyName}`;
      const message = `Please find the ${docLabel} for ${companyName}.`;
  
      if (typeof file === 'string' && (file.startsWith('http') || file.startsWith('blob:'))) {
        const fullMessage = `${message}\n\nLink: ${file}`;
        const encodedMessage = encodeURIComponent(fullMessage);
        let shareUrl = '';
  
        if (shareType === 'email') {
          const encodedSubject = encodeURIComponent(subject);
          shareUrl = `mailto:?subject=${encodedSubject}&body=${encodedMessage}`;
        } else if (shareType === 'whatsapp') {
          shareUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
        }
  
        if (shareUrl) {
          window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
  
      if (file instanceof File) {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: subject,
              text: message,
            });
          } catch (error: any) {
            if (error.name !== 'AbortError') {
              console.error("Web Share API failed:", error);
              toast.push(<Notification type="danger" title="Sharing Failed">Could not share the file directly.</Notification>);
            }
          }
        } else {
          toast.push(
            <Notification type="info" title="Action Required" duration={6000}>
              To share this new file, please save the company first. Your browser doesn't support direct sharing of unsaved files.
            </Notification>
          );
        }
        return;
      }
  
      toast.push(<Notification type="danger" title="Unsupported File">Cannot share this file type.</Notification>);
  
    }, [getValues]);
  
    const kycDocs = useMemo(() => [
        { label: "Aadhar Card", name: "aadhar_card_file" as const, remarkName: "aadhar_card_remark" as const, enabledName: "aadhar_card_remark_enabled" as const, required: isIndiaSelected },
        { label: "PAN Card", name: "pan_card_file" as const, remarkName: "pan_card_remark" as const, enabledName: "pan_card_remark_enabled" as const, required: isIndiaSelected },
        { label: "GST Certificate", name: "gst_certificate_file" as const, remarkName: "gst_certificate_remark" as const, enabledName: "gst_certificate_remark_enabled" as const, required: false },
        { label: "Visiting Card", name: "visiting_card_file" as const, remarkName: "visiting_card_remark" as const, enabledName: "visiting_card_remark_enabled" as const },
        { label: "Office Photo", name: "office_photo_file" as const, remarkName: "office_photo_remark" as const, enabledName: "office_photo_remark_enabled" as const, required: false },
        { label: "Authority Letter", name: "authority_letter_file" as const, remarkName: "authority_letter_remark" as const, enabledName: "authority_letter_remark_enabled" as const },
        { label: "Cancelled Cheque", name: "cancel_cheque_file" as const, remarkName: "cancel_cheque_remark" as const, enabledName: "cancel_cheque_remark_enabled" as const, required: false },
        { label: "194Q Declaration", name: "ABCQ_file" as const, remarkName: "ABCQ_remark" as const, enabledName: "ABCQ_remark_enabled" as const },
        { label: "Other Document", name: "other_document_file" as const, remarkName: "other_document_remark" as const, enabledName: "other_document_remark_enabled" as const },
      ], [isIndiaSelected]);
  
    const isViewableImage = (file: unknown): boolean => {
        if (file instanceof File) return file.type.startsWith('image/');
        if (typeof file === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file);
        return false;
    }
  
    return (
      <Card id="kycDocuments">
        <h5 className="mb-4">KYC Documents</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
          {kycDocs.map((doc) => {
            const fileValue = watch(doc.name);
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
                  {doc.label} {doc.required && <span className="text-red-500">*</span>}
                </label>
                <FormItem invalid={!!(errors as any)[doc.name]} errorMessage={(errors as any)[doc.name]?.message as string} >
                  <Controller
                    name={doc.name}
                    control={control}
                    render={({ field: { value, onChange, ...rest } }) => (
                      <Input
                        {...rest}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => onChange(e.target.files?.[0] || null)}
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
                      {isViewableImage(fileValue) ? (
                        <img
                          src={fileValue instanceof File ? URL.createObjectURL(fileValue) : String(fileValue)}
                          alt={doc.label}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <DocumentPlaceholder
                          fileName={fileValue instanceof File ? fileValue.name : fileValue.split('/').pop() || 'Document'}
                          fileUrl={fileValue instanceof File ? URL.createObjectURL(fileValue) : String(fileValue)}
                        />
                      )}
                    </button>
                    {doc.name === 'cancel_cheque_file' && (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          icon={<TbMail />}
                          onClick={() => handleShare('email', fileValue, doc.label)}
                          title="Share via Email"
                        >
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          icon={<TbBrandWhatsapp />}
                          onClick={() => handleShare('whatsapp', fileValue, doc.label)}
                          title="Share on WhatsApp"
                        >
                          WhatsApp
                        </Button>
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
const BankDetailsSection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
  const { watch, setValue, getValues } = formMethods;
  const bankTypeOptions = [{ value: "Primary", label: "Primary" }, { value: "Secondary", label: "Secondary" }, { value: "Other", label: "Other" }];

  const { fields, append, remove } = useFieldArray({ control, name: "company_bank_details" });

  const primaryBankPhotoValue = watch("primary_bank_verification_photo");
  const secondaryBankPhotoValue = watch("secondary_bank_verification_photo");

  const isViewableImage = (file: unknown): boolean => {
    if (file instanceof File) return file.type.startsWith('image/');
    if (typeof file === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file);
    return false;
  }
  
  const handleShare = useCallback((shareType: 'email' | 'whatsapp', file: File | string | null, docLabel: string) => {
    if (!file) {
      toast.push(<Notification type="warning" title="No File">No document to share.</Notification>);
      return;
    }

    if (typeof file !== 'string' || !file.startsWith('http')) {
      toast.push(
        <Notification type="info" title="Action Required" duration={5000}>
          Please save the company first. Sharing is only available for uploaded documents.
        </Notification>
      );
      return;
    }

    const documentUrl = file;
    const companyName = getValues("company_name") || "this company";
    const subject = `${docLabel} for ${companyName}`;
    const message = `Please find the ${docLabel} for ${companyName} at the following link: ${documentUrl}`;
    const encodedMessage = encodeURIComponent(message);

    let shareUrl = '';
    if (shareType === 'email') {
      const encodedSubject = encodeURIComponent(subject);
      shareUrl = `mailto:?subject=${encodedSubject}&body=${encodedMessage}`;
    } else if (shareType === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }, [getValues]);

  const handleSetDefaultBank = useCallback((type: 'primary' | 'secondary' | 'additional', index?: number) => {
    // Reset all defaults first
    setValue('primary_is_default', false, { shouldDirty: true });
    setValue('secondary_is_default', false, { shouldDirty: true });
    const additionalBanks = getValues('company_bank_details') || [];
    const updatedAdditionalBanks = additionalBanks.map(bank => ({ ...bank, is_default: false }));

    // Set the new default
    if (type === 'primary') {
      setValue('primary_is_default', true, { shouldDirty: true });
    } else if (type === 'secondary') {
      setValue('secondary_is_default', true, { shouldDirty: true });
    } else if (type === 'additional' && index !== undefined) {
      updatedAdditionalBanks[index].is_default = true;
    }

    setValue('company_bank_details', updatedAdditionalBanks, { shouldDirty: true, shouldTouch: true });
  }, [getValues, setValue]);

  const renderPreview = (fileValue: File | string | null, label: string) => {
    if (!fileValue) return null;
    return (
        <button
            type="button"
            onClick={() => handlePreviewClick(fileValue, label)}
            className="w-24 h-24 border rounded-md p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
        >
            {isViewableImage(fileValue) ? (
                <img
                    src={fileValue instanceof File ? URL.createObjectURL(fileValue) : String(fileValue)}
                    alt={label}
                    className="max-h-full max-w-full object-contain"
                />
            ) : (
                <DocumentPlaceholder
                    fileName={fileValue instanceof File ? fileValue.name : fileValue.split('/').pop() || 'Document'}
                    fileUrl={fileValue instanceof File ? URL.createObjectURL(fileValue) : String(fileValue)}
                />
            )}
        </button>
    )
  }

  return (
    <Card id="bankDetails">
      <h4 className="mb-6">Bank Details (Primary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <FormItem label="Primary Beneficiary Name" invalid={!!errors.primary_benificeiry_name} errorMessage={errors.primary_benificeiry_name?.message as string}>
          <Controller name="primary_benificeiry_name" control={control} render={({ field }) => (<Input type="text" {...field} placeholder="Enter Beneficiary Name" />)} />
        </FormItem>
        <FormItem label="Primary Bank Name" invalid={!!errors.primary_bank_name} errorMessage={errors.primary_bank_name?.message as string}>
          <Controller name="primary_bank_name" control={control} render={({ field }) => (<Input type="text" {...field} placeholder="Enter Bank Name" />)} />
        </FormItem>
        <FormItem label="Primary IFSC Code" invalid={!!errors.primary_ifsc_code} errorMessage={errors.primary_ifsc_code?.message as string}>
          <Controller name="primary_ifsc_code" control={control} render={({ field }) => (<Input placeholder="Primary IFSC" {...field} />)} />
        </FormItem>
        <FormItem label="Primary Account Number" invalid={!!errors.primary_account_number} errorMessage={errors.primary_account_number?.message as string}>
          <Controller name="primary_account_number" control={control} render={({ field }) => (<Input placeholder="Primary Account No." {...field} />)} />
        </FormItem>
        <FormItem label="Primary Bank Verification Photo" className="md:col-span-3" invalid={!!errors.primary_bank_verification_photo} errorMessage={(errors.primary_bank_verification_photo as any)?.message as string}>
          <Controller 
            name="primary_bank_verification_photo" 
            control={control} 
            render={({ field: { value, onChange, ...rest } }) => (
              <Input {...rest} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
          )} />
          {primaryBankPhotoValue && (
            <div className="mt-2 flex items-start gap-4">
               {renderPreview(primaryBankPhotoValue, 'Primary Bank Verification Photo')}
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="xs" icon={<TbMail />} onClick={() => handleShare('email', primaryBankPhotoValue, 'Primary Bank Verification Photo')}>Email</Button>
                <Button type="button" variant="outline" size="xs" icon={<TbBrandWhatsapp />} onClick={() => handleShare('whatsapp', primaryBankPhotoValue, 'Primary Bank Verification Photo')}>WhatsApp</Button>
              </div>
            </div>
          )}
        </FormItem>
        <FormItem label="Primary Swift Code" invalid={!!errors.primary_swift_code} errorMessage={errors.primary_swift_code?.message as string}>
          <Controller name="primary_swift_code" control={control} render={({ field }) => (<Input placeholder="Primary Swift Code" {...field} />)} />
        </FormItem>
      </div>
      <div className="border-t dark:border-gray-600 mt-4 pt-3">
        <Controller name="primary_is_default" control={control} render={({ field }) => (<Checkbox checked={field.value} onChange={(e) => { field.onChange(e); if (e) handleSetDefaultBank('primary'); }}>Set as Default</Checkbox>)} />
      </div>

      <hr className="my-6" />

      <h4 className="mb-6">Bank Details (Secondary)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <FormItem label="Secondary Beneficiary Number" invalid={!!errors.secondary_benificeiry_name} errorMessage={errors.secondary_benificeiry_name?.message as string}>
          <Controller name="secondary_benificeiry_name" control={control} render={({ field }) => (<Input placeholder="Secondary Account No." {...field} />)} />
        </FormItem>
        <FormItem label="Secondary Bank Name" invalid={!!errors.secondary_bank_name} errorMessage={errors.secondary_bank_name?.message as string}>
          <Controller name="secondary_bank_name" control={control} render={({ field }) => (<Input type="text" {...field} placeholder="Enter Bank Name" />)} />
        </FormItem>
        <FormItem label="Secondary IFSC Code" invalid={!!errors.secondary_ifsc_code} errorMessage={errors.secondary_ifsc_code?.message as string}>
          <Controller name="secondary_ifsc_code" control={control} render={({ field }) => (<Input placeholder="Secondary IFSC" {...field} />)} />
        </FormItem>
        <FormItem label="Secondary Account Number" invalid={!!errors.secondary_account_number} errorMessage={errors.secondary_account_number?.message as string}>
          <Controller name="secondary_account_number" control={control} render={({ field }) => (<Input placeholder="Secondary Account No." {...field} />)} />
        </FormItem>
        <FormItem label="Secondary Bank Verification Photo" className="md:col-span-3" invalid={!!errors.secondary_bank_verification_photo} errorMessage={(errors.secondary_bank_verification_photo as any)?.message as string}>
          <Controller 
            name="secondary_bank_verification_photo" 
            control={control} 
            render={({ field: { value, onChange, ...rest } }) => (
              <Input {...rest} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
          )} />
          {secondaryBankPhotoValue && (
            <div className="mt-2 flex items-start gap-4">
              {renderPreview(secondaryBankPhotoValue, 'Secondary Bank Verification Photo')}
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="xs" icon={<TbMail />} onClick={() => handleShare('email', secondaryBankPhotoValue, 'Secondary Bank Verification Photo')}>Email</Button>
                <Button type="button" variant="outline" size="xs" icon={<TbBrandWhatsapp />} onClick={() => handleShare('whatsapp', secondaryBankPhotoValue, 'Secondary Bank Verification Photo')}>WhatsApp</Button>
              </div>
            </div>
          )}
        </FormItem>
        <FormItem label="Secondary Swift Code" invalid={!!errors.secondary_swift_code} errorMessage={errors.secondary_swift_code?.message as string}>
          <Controller name="secondary_swift_code" control={control} render={({ field }) => (<Input placeholder="Secondary Swift Code" {...field} />)} />
        </FormItem>
      </div>
      <div className="border-t dark:border-gray-600 mt-4 pt-3">
        <Controller name="secondary_is_default" control={control} render={({ field }) => (<Checkbox checked={field.value} onChange={(e) => { field.onChange(e); if (e) handleSetDefaultBank('secondary'); }}>Set as Default</Checkbox>)} />
      </div>

      <hr className="my-6" />
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Additional Bank Details</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ bank_account_number: "", bank_name: undefined, ifsc_code: "", swift_code: "", verification_photo: null, type: undefined, is_default: false })}> Add More Banks </Button>
      </div>
      {fields.map((item, index) => {
        const bankPhotoValue = watch(`company_bank_details.${index}.verification_photo`);
        const photoLabel = `Bank ${index + 1} Verification Photo`;
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
              <FormItem label={photoLabel} className="md:col-span-1">
                <Controller 
                  name={`company_bank_details.${index}.verification_photo`} 
                  control={control} 
                  render={({ field: { value, onChange, ...rest } }) => (
                    <Input {...rest} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
                )} />
                {bankPhotoValue && (
                  <div className="mt-2 flex items-start gap-4">
                    {renderPreview(bankPhotoValue, photoLabel)}
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" size="xs" icon={<TbMail />} onClick={() => handleShare('email', bankPhotoValue, photoLabel)}>Email</Button>
                      <Button type="button" variant="outline" size="xs" icon={<TbBrandWhatsapp />} onClick={() => handleShare('whatsapp', bankPhotoValue, photoLabel)}>WhatsApp</Button>
                    </div>
                  </div>
                )}
              </FormItem>
            </div>
            <div className="border-t dark:border-gray-600 mt-4 pt-3">
              <Controller name={`company_bank_details.${index}.is_default`} control={control} render={({ field }) => (<Checkbox checked={field.value} onChange={(e) => { field.onChange(e); if (e) handleSetDefaultBank('additional', index); }}>Set as Default</Checkbox>)} />
            </div>
          </Card>
        );
      })}
    </Card>
  );
};

// --- SpotVerificationSection ---
const SpotVerificationSection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
  const { watch } = formMethods;
  const { fields, append, remove } = useFieldArray({ control, name: "company_spot_verification" });
  const { EmployeesList } = useSelector(masterSelector);

  const employeeOptions = useMemo(() => {
    const employeeDataSource = EmployeesList?.data?.data || EmployeesList?.data || EmployeesList;
    const actualList = Array.isArray(employeeDataSource) ? employeeDataSource : [];

    return actualList.map((m: any) => ({
      value: String(m.id),
      label: `(${m.employee_id}) - ${m.name || 'N/A'}`,
    }));
  }, [EmployeesList]);

  const isViewableImage = (file: unknown): boolean => {
    if (file instanceof File) return file.type.startsWith('image/');
    if (typeof file === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file);
    return false;
  }

  return (
    <Card id="spotVerification">
      <div className="flex justify-between items-center mb-4">
        <h4 className="mb-0">Spot Verifications</h4>
        <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ verified: false, verified_by_id: undefined, photo_upload: null, remark: "" })}> Add Verification Entry </Button>
      </div>
      {fields.map((item, index) => {
        const photoValue = watch(`company_spot_verification.${index}.photo_upload`);
        const photoLabel = `Spot Verification Document ${index + 1}`;
        return (
          <Card key={item.id} className="mb-4 border dark:border-gray-600 rounded-md relative" bodyClass="p-4">
            <Button type="button" variant="plain" size="xs" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10" > Remove </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-start">
              <div className="flex items-center gap-4">
                <Controller name={`company_spot_verification.${index}.verified`} control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={field.onChange} />)} />
                <FormItem label={`Verified By ${index + 1}`} className="flex-grow" invalid={!!errors.company_spot_verification?.[index]?.verified_by_id} errorMessage={(errors.company_spot_verification?.[index]?.verified_by_id as any)?.message as string}>
                  <Controller name={`company_spot_verification.${index}.verified_by_id`} control={control} render={({ field }) => (<Select placeholder="Select Employee" options={employeeOptions} {...field} />)} />
                </FormItem>
              </div>
              <FormItem label={photoLabel}>
                <Controller 
                  name={`company_spot_verification.${index}.photo_upload`} 
                  control={control} 
                  render={({ field: { value, onChange, ...rest } }) => (
                    <Input {...rest} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
                )} />
                 {photoValue && (
                    <div className="mt-2">
                        <button
                            type="button"
                            onClick={() => handlePreviewClick(photoValue, photoLabel)}
                            className="w-full h-24 border rounded-md p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                        >
                            {isViewableImage(photoValue) ? (
                                <img
                                    src={photoValue instanceof File ? URL.createObjectURL(photoValue) : String(photoValue)}
                                    alt={photoLabel}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <DocumentPlaceholder
                                    fileName={photoValue instanceof File ? photoValue.name : photoValue.split('/').pop() || 'Document'}
                                    fileUrl={photoValue instanceof File ? URL.createObjectURL(photoValue) : String(photoValue)}
                                />
                            )}
                        </button>
                    </div>
                  )}
              </FormItem>
              <FormItem label={`Remark ${index + 1}`} className="md:col-span-2">
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
const ReferenceSection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
  const { CompanyData } = useSelector(masterSelector);

  const companyOptions = useMemo(() =>
    (CompanyData?.data || []).map((c: any) => ({
      value: String(c.id),
      label: `(${c.company_code}) - ${c.company_name}`,
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
            <FormItem label={`Person Name ${index + 1}`} invalid={!!errors.company_references?.[index]?.person_name} errorMessage={errors.company_references?.[index]?.person_name?.message as string}>
              <Controller name={`company_references.${index}.person_name`} control={control} render={({ field }) => (<Input placeholder="Person's Name" {...field} />)} />
            </FormItem>
            <FormItem label={`Company Name ${index + 1}`} invalid={!!errors.company_references?.[index]?.company_id} errorMessage={(errors.company_references?.[index]?.company_id as any)?.message as string}>
              <Controller name={`company_references.${index}.company_id`} control={control} render={({ field }) => (<Select placeholder="Company Name" options={companyOptions} {...field} />)} />
            </FormItem>
            <FormItem label={`Contact Number ${index + 1}`} invalid={!!errors.company_references?.[index]?.number} errorMessage={errors.company_references?.[index]?.number?.message as string}>
              <Controller name={`company_references.${index}.number`} control={control} render={({ field }) => (<Input placeholder="Contact Number" {...field} />)} />
            </FormItem>
            <FormItem label={`Remark ${index + 1}`} className="sm:col-span-3">
              <Controller name={`company_references.${index}.remark`} control={control} render={({ field }) => (<Input placeholder="Add remarks here..." {...field} />)} />
            </FormItem>
          </div>
        </Card>
      ))}
    </Card>
  );
};

// --- AccessibilitySection ---
const AccessibilitySection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
  const { watch } = formMethods;

  const { fields, append, remove } = useFieldArray({ control, name: "billing_documents" });
  const { fields: enabledFields, append: appendEnabled, remove: removeEnabled } = useFieldArray({ control, name: "enabled_billing_docs" });
  const { DocumentListData = [] } = useSelector(masterSelector);

  const documentTypeOptions = useMemo(() => {
    return Array.isArray(DocumentListData) ? DocumentListData.map((d: any) => ({ value: d.id, label: d.name })) : [];
  }, [DocumentListData]);

  const isViewableImage = (file: unknown): boolean => {
    if (file instanceof File) return file.type.startsWith('image/');
    if (typeof file === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file);
    return false;
  }

  const renderPreview = (fileValue: File | string | null, label: string, index: number, fieldName: 'billing_documents' | 'enabled_billing_docs') => {
    const docName = watch(`${fieldName}.${index}.document_name`)?.label;
    const finalLabel = `${label}: ${docName || `File ${index + 1}`}`;
    if (!fileValue) return null;
    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={() => handlePreviewClick(fileValue, finalLabel)}
                className="w-full h-24 border rounded-md p-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
            >
                {isViewableImage(fileValue) ? (
                    <img
                        src={fileValue instanceof File ? URL.createObjectURL(fileValue) : String(fileValue)}
                        alt={finalLabel}
                        className="max-h-full max-w-full object-contain"
                    />
                ) : (
                    <DocumentPlaceholder
                        fileName={fileValue instanceof File ? fileValue.name : fileValue.split('/').pop() || 'Document'}
                        fileUrl={fileValue instanceof File ? URL.createObjectURL(fileValue) : String(fileValue)}
                    />
                )}
            </button>
        </div>
    )
  }

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
            <Button type="button" icon={<TbPlus />} size="sm" onClick={() => append({ document_name: null, document: null })}> Add Document </Button>
            <Button type="button" icon={<TbPlus />} size="sm" onClick={() => appendEnabled({ document_name: null, document: null })}> Add Enable Billing Documents </Button>
          </div>
        </div>

        {/* Old Billing Docs */}
        {fields.map((item, index) => {
          const docFileValue = watch(`billing_documents.${index}.document`);
          return (
            <Card key={item.id} className="border dark:border-gray-600 rounded-md" bodyClass="p-4">
              <div className="md:grid grid-cols-1 md:grid-cols-9 gap-4 items-start">
                <FormItem label={`Doc Name ${index + 1}`} className="md:col-span-4" invalid={!!errors.billing_documents?.[index]?.document_name} errorMessage={(errors.billing_documents?.[index]?.document_name as any)?.message as string}>
                  <Controller name={`billing_documents.${index}.document_name`} control={control} render={({ field }) => (
                    <Select
                      placeholder="Document Name"
                      options={documentTypeOptions}
                      value={field.value}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption)
                      }}
                    />
                  )} />
                </FormItem>
                <FormItem label={`Upload Doc ${index + 1}`} className="md:col-span-4">
                  <Controller 
                    name={`billing_documents.${index}.document`} 
                    control={control} 
                    render={({ field: { value, onChange, ...rest } }) => (
                      <Input {...rest} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
                  )} />
                  {renderPreview(docFileValue, 'Billing Document', index, 'billing_documents')}
                </FormItem>
                <Button type="button" shape="circle" size="sm" className="mt-2 md:mt-0 md:self-center" icon={<TbTrash />} onClick={() => remove(index)} variant="plain" />
              </div>
            </Card>
          );
        })}

        {/* New Enabled Billing Docs */}
        {enabledFields.length > 0 && <h6 className="mt-4 -mb-2">Enabled Billing Documents</h6>}
        {enabledFields.map((item, index) => {
          const docFileValue = watch(`enabled_billing_docs.${index}.document`);
          return (
            <Card key={item.id} className="border dark:border-gray-600 rounded-md" bodyClass="p-4">
              <div className="md:grid grid-cols-1 md:grid-cols-9 gap-4 items-start">
                <FormItem label={`Document Type ${index + 1}`} className="md:col-span-4" invalid={!!errors.enabled_billing_docs?.[index]?.document_name} errorMessage={(errors.enabled_billing_docs?.[index]?.document_name as any)?.message as string}>
                  <Controller name={`enabled_billing_docs.${index}.document_name`} control={control} render={({ field }) => (
                    <Select
                      placeholder="Document Name"
                      options={documentTypeOptions}
                      value={field.value}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption)
                      }}
                    />
                  )} />
                </FormItem>
                <FormItem label={`Upload File ${index + 1}`} className="md:col-span-4">
                  <Controller 
                    name={`enabled_billing_docs.${index}.document`} 
                    control={control} 
                    render={({ field: { value, onChange, ...rest } }) => (
                      <Input {...rest} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
                  )} />
                  {renderPreview(docFileValue, 'Enabled Billing Document', index, 'enabled_billing_docs')}
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

// --- START: New Member Add Form (for Modal) ---
interface MemberAddFormSchema {
  status: { label: string; value: string };
  name: string;
  mobile_no: string;
  contact_country_code: { label: string; value: string };
  email: string;
  password?: string;
  country_id: { label: string; value: string };
  interested_category_ids: { label: string; value: string }[];
}

const memberAddSchema = z.object({
  status: z.object({ value: z.string().min(1), label: z.string() }, { required_error: 'Status is required.' }),
  name: z.string().trim().min(1, { message: "Full Name is required." }),
  mobile_no: z.string().trim().min(7, { message: "A valid mobile number is required." }),
  contact_country_code: z.object({ value: z.string().min(1), label: z.string() }, { required_error: 'Country code is required.' }),
  email: z.string().trim().min(1, { message: "Email is required." }).email("Invalid email format."),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  country_id: z.object({ value: z.string().min(1), label: z.string() }, { required_error: 'Country is required.' }),
  interested_category_ids: z.array(z.object({ value: z.string(), label: z.string() })).min(1, { message: "At least one category is required." }),
});

const preparePayloadForApiAdd = (formData: MemberAddFormSchema): any => {
  const getValue = (field: any) => (typeof field === 'object' && field !== null ? field.value : field);

  const payload = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    status: getValue(formData.status),
    number: formData.mobile_no,
    customer_code: getValue(formData.contact_country_code),
    country_id: getValue(formData.country_id),
    interested_category_ids: formData.interested_category_ids.map(c => getValue(c)),
    role_type: '0', // Assuming '0' corresponds to 'Member' role
  };

  return payload;
};

const MemberAddForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void; }) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    CountriesData = [],
    ParentCategories = [],
    status: masterLoadingStatus
  } = useSelector(masterSelector);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<MemberAddFormSchema>({
    // resolver: zodResolver(memberAddSchema),
    defaultValues: {
      status: { label: "Active", value: "Active" },
      name: '', mobile_no: '', contact_country_code: undefined, email: '', password: '', country_id: undefined, interested_category_ids: [],
    },
    mode: 'onChange',
  });


  useEffect(() => {
    // Fetches categories only when this modal is opened. Good for performance.
    dispatch(getParentCategoriesAction());
  }, [dispatch]);

  const countryOptions = useMemo(() => {
    const uniqueCountriesMap = new Map();
    (CountriesData || []).forEach((country: any) => {
      uniqueCountriesMap.set(country.id, country);
    });
    return Array.from(uniqueCountriesMap.values()).map((country: any) => ({
      value: String(country.id),
      label: country.name
    }));
  }, [CountriesData]);

  const countryCodeOptions = useMemo(() => {
    const uniqueCodes = new Set<string>();
    (CountriesData || []).forEach((c: any) => {
      if (c.phone_code) {
        uniqueCodes.add(`+${c.phone_code}`);
      }
    });
    return Array.from(uniqueCodes)
      .sort((a, b) => a.localeCompare(b))
      .map(code => ({
        value: code,
        label: code
      }));
  }, [CountriesData]);

  const categoryOptions = useMemo(() =>
    ParentCategories.map((c: any) => ({ value: String(c.id), label: c.name }))
    , [ParentCategories]);

  const statusOptions = [
    { label: "Active", value: "Active" }, { label: "Unregistered", value: "Unregistered" }, { label: "Disabled", value: "Disabled" },
  ];

  const handleFormSubmit = async (data: MemberAddFormSchema) => {
    setIsSubmitting(true);
    const payload = preparePayloadForApiAdd(data);

    try {
      await dispatch(addMemberAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Member Created">New member added successfully.</Notification>);
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to create member.";
      toast.push(<Notification type="danger" title="Creation Failed">{errorMessage}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (masterLoadingStatus === 'loading') {
    return <div className="p-8 flex justify-center"><Spinner /></div>;
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-4">
        <FormItem label="Status" invalid={!!errors.status} errorMessage={errors.status?.message}>
          <Controller name="status" control={control} render={({ field }) => (<Select {...field} placeholder="Select Status" options={statusOptions} />)} />
        </FormItem>
        <FormItem label="Full Name" invalid={!!errors.name} errorMessage={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => (<Input {...field} prefix={<TbUserCircle />} placeholder="Member’s full name" onInput={(e: any) => { if (e.target.value) e.target.value = e.target.value.toUpperCase() }} />)} />
        </FormItem>
        <FormItem label="Mobile Number" invalid={!!errors.mobile_no || !!errors.contact_country_code} errorMessage={errors.mobile_no?.message || errors.contact_country_code?.message}>
          <div className="flex items-center gap-2">
            <Controller name="contact_country_code" control={control} render={({ field }) => (<Select {...field} placeholder="Code" className="w-36" options={countryCodeOptions} />)} />
            <Controller name="mobile_no" control={control} render={({ field }) => (<Input {...field} prefix={<TbPhone />} placeholder="Primary contact number" />)} />
          </div>
        </FormItem>
        <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}>
          <Controller name="email" control={control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="example@domain.com" />)} />
        </FormItem>
        <FormItem label="Password" invalid={!!errors.password} errorMessage={errors.password?.message}>
          <Controller name="password" control={control} render={({ field }) => (<Input {...field} type="password" placeholder="Enter new password" />)} />
        </FormItem>
        <FormItem label="Country" invalid={!!errors.country_id} errorMessage={errors.country_id?.message}>
          <Controller name="country_id" control={control} render={({ field }) => (<Select {...field} prefix={<TbWorld />} placeholder="Select Country" options={countryOptions} />)} />
        </FormItem>
        <FormItem label="Interested Categories" className="md:col-span-2" invalid={!!errors.interested_category_ids} errorMessage={errors.interested_category_ids?.message}>
          <Controller name="interested_category_ids" control={control} render={({ field }) => (<Select {...field} isMulti prefix={<TbCategory />} placeholder="Select interested categories" options={categoryOptions} />)} />
        </FormItem>
      </div>

      <div className="flex justify-end gap-4 mt-6 p-4 border-t dark:border-gray-700">
        <Button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="solid" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>
          Create Member
        </Button>
      </div>
    </form>
  );
};
// --- END: New Member Add Form ---


// --- MemberManagementSection ---
const MemberManagementSection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
  const dispatch = useAppDispatch();
  const { MemberData } = useSelector(masterSelector);
  const { fields, append, remove } = useFieldArray({ control, name: "company_members" });

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const memberOptions = useMemo(() => {
    const data = MemberData?.data || MemberData || [];
    return Array.isArray(data)
      ? data.map((m: any) => ({
        value: String(m.id),
        label: `(${m.customer_code}) - ${m.name || 'N/A'}`,
        status: m.status,
      }))
      : [];
  }, [MemberData]);

  const handleMemberAdded = useCallback(() => {
    setIsAddMemberModalOpen(false);
    dispatch(getMemberAction());
  }, [dispatch]);

  return (
    <>
      <Card id="memberManagement">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h4 className="mb-0">Member Management</h4>
          <div className="flex gap-2">
            <Button type="button" size="sm" icon={<TbPlus />} onClick={() => append({ member_id: undefined, designation: "", person_name: "", number: "" })}>
              Add Member to Company
            </Button>
            <Button
              type="button"
              size="sm"
              variant="solid"
              icon={<TbPlus />}
              onClick={() => setIsAddMemberModalOpen(true)}
            >
              Create New Member
            </Button>
          </div>
        </div>

        {fields.map((item, index) => (
          <Card key={item.id} className="mb-4 border dark:border-gray-600 relative rounded-md" bodyClass="p-4">
            <Button type="button" variant="plain" size="xs" icon={<TbTrash size={16} />} onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10">Remove</Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
              <FormItem label={`Member ${index + 1}`} invalid={!!errors.company_members?.[index]?.member_id} errorMessage={(errors.company_members?.[index]?.member_id as any)?.message as string}>
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
                      }}
                    />
                  )}
                />
              </FormItem>
              <FormItem label={`Designation ${index + 1}`} invalid={!!errors.company_members?.[index]?.designation} errorMessage={errors.company_members?.[index]?.designation?.message as string}>
                <Controller name={`company_members.${index}.designation`} control={control} render={({ field }) => (<Input placeholder="Designation in this company" {...field} />)} />
              </FormItem>
              <FormItem label={`Person Name ${index + 1}`} invalid={!!errors.company_members?.[index]?.person_name} errorMessage={errors.company_members?.[index]?.person_name?.message as string}>
                <Controller name={`company_members.${index}.person_name`} control={control} render={({ field }) => (<Input placeholder="Display Name" {...field} />)} />
              </FormItem>
              <FormItem label={`Contact No. ${index + 1}`} invalid={!!errors.company_members?.[index]?.number} errorMessage={errors.company_members?.[index]?.number?.message as string}>
                <Controller name={`company_members.${index}.number`} control={control} render={({ field }) => (<Input type="tel" placeholder="Contact Number" {...field} />)} />
              </FormItem>
            </div>
          </Card>
        ))}
      </Card>

      <Dialog
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onRequestClose={() => setIsAddMemberModalOpen(false)}
        width={900}
        closable={false}
      >
        <h5 className="mb-4">Create a New Member</h5>
        <p className="mb-6 text-sm">Create a new member record. Once created, it will be available in the 'Member' dropdown to add to this company.</p>
        <MemberAddForm
          onSuccess={handleMemberAdded}
          onCancel={() => setIsAddMemberModalOpen(false)}
        />
      </Dialog>
    </>
  );
};


// --- TeamManagementSection ---
const TeamManagementSection = ({ control, errors, formMethods, handlePreviewClick }: FormSectionBaseProps) => {
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

  // --- START: CENTRALIZED VIEWER STATE ---
  const [imageViewerState, setImageViewerState] = useState({ isOpen: false, startIndex: 0 });
  const [genericFileViewerState, setGenericFileViewerState] = useState<{ isOpen: boolean, file: File | string | null }>({ isOpen: false, file: null });
  // --- END: CENTRALIZED VIEWER STATE ---


  const companySchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    company_name: z.string().trim().min(1, "Company Name is required."),
    alternate_contact_number: z.string().trim().regex(/^\d{7,15}$/, "Invalid contact number (7-15 digits).").optional().or(z.literal("")).nullable(),
    alternate_contact_number_code: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
    alternate_email_id: z.string().trim().email("Invalid email format.").optional().or(z.literal("")).nullable(),
    ownership_type: z.object({ label: z.string(), value: z.string().min(1, "Ownership Type is required.") }, { required_error: "Ownership Type is required." }),
    owner_name: z.string().trim().min(1, "Owner/Director Name is required."),
    city: z.string().trim().optional(),
    country_id: z.object({ label: z.string(), value: z.string().min(1, "Country is required.") }, { required_error: "Country is required." }),
    continent_id: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
   
    // establishment_year: z.string().trim().regex(/^\d{4}$/, "Invalid year format (YYYY).").optional().or(z.literal("")).nullable(),
    // no_of_employees: z.union([z.number().int().positive().optional().nullable(), z.string().regex(/^\d*$/).optional().nullable(), z.literal("")]).optional().nullable(),
    // company_website: z.string().trim().url("Invalid website URL.").optional().or(z.literal("")).nullable(),
    // company_logo: z.any().optional().nullable(),
    // primary_business_type: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
    // status: z.object({ label: z.string(), value: z.string().min(1, "Status is required.") }, { required_error: "Status is required." }),
    // notification_email: z.string().trim().email("Invalid email format.").optional().or(z.literal("")).nullable(),

    // company_certificate: z.array(z.object({
    //   certificate_id: z.any().optional(),
    //   certificate_name: z.string().trim().optional(),
    //   upload_certificate: z.any().optional().nullable(),
    // })).optional(),
    // office_info: z.array(z.object({
    //   office_type: z.object({ label: z.string(), value: z.string() }, { required_error: "Office type is required." }),
    //   office_name: z.string().trim().optional(),
    //   address: z.string().trim().optional(),
    //   country_id: z.object({ label: z.string(), value: z.string() }, { required_error: "Country is required." }),
    //   state: z.string().trim().optional(),
    //   city: z.string().trim().optional(),
    //   zip_code: z.string().trim().regex(/^\d{3,10}$/, "Invalid ZIP code format.").optional(),
    //   gst_number: z.string().trim().optional().or(z.literal("")).nullable(),
    //   contact_person: z.string().trim().optional().nullable(),
    //   office_email: z.string().trim().email("Invalid email format.").optional().nullable(),
    //   office_phone: z.string().optional().nullable(),
    // })).optional(),

    // aadhar_card_file: z.any().optional().nullable(),
    // pan_card_file: z.any().optional().nullable(),
    // gst_certificate_file: z.any().optional().nullable(),
    // cancel_cheque_file: z.any().optional().nullable(),
    // office_photo_file: z.any().optional().nullable(),

    // primary_account_number: z.string().trim().optional().or(z.literal("")).nullable(),
    // primary_contact_number: z.string().trim().regex(/^[0-9]{7,15}$/, "Invalid contact number").optional().or(z.literal("")).nullable(),
    // primary_bank_name: z.string().trim().optional().or(z.literal("")).nullable(),
    // primary_benificeiry_name: z.string().trim().optional().or(z.literal("")).nullable(),
    // primary_ifsc_code: z.string().trim().optional().or(z.literal("")).nullable(),
    // primary_swift_code: z.string().trim().optional().or(z.literal("")).nullable(),
    // primary_bank_verification_photo: z.any().optional().nullable(),
    // primary_is_default: z.boolean().optional(),
    // secondary_account_number: z.string().trim().optional().or(z.literal("")).nullable(),
    // secondary_benificeiry_name: z.string().trim().optional().or(z.literal("")).nullable(),
    // secondary_bank_name: z.string().trim().optional().or(z.literal("")).nullable(),
    // secondary_ifsc_code: z.string().trim().optional().or(z.literal("")).nullable(),
    // secondary_swift_code: z.string().trim().optional().or(z.literal("")).nullable(),
    // secondary_bank_verification_photo: z.any().optional().nullable(),
    // secondary_is_default: z.boolean().optional(),
    // company_bank_details: z.array(z.object({
    //   bank_account_number: z.string().trim().min(1, "Account number required if bank entry added"),
    //   bank_name: z.string().min(1, "Bank name required"),
    //   ifsc_code: z.string().trim().min(1, "IFSC code required"),
    //   swift_code: z.string().trim().optional().nullable(),
    //   verification_photo: z.any().optional().nullable(),
    //   type: z.object({ label: z.string(), value: z.string().min(1, "Bank type required") }, { required_error: "Bank type is required" }),
    //   is_default: z.boolean().optional(),
    // })).optional(),

    // USER_ACCESS: z.boolean({ required_error: "User Access selection is required" }),
    // billing_documents: z.array(z.object({
    //   document_name: z.any(),
    //   document: z.any().optional().nullable(),
    // })).optional(),
    // enabled_billing_docs: z.array(z.object({
    //   document_name: z.any(),
    //   document: z.any().optional().nullable()
    // })).optional(),

    // company_members: z.array(z.object({
    //   member_id: z.object({ label: z.string(), value: z.string() }, { required_error: "Member selection is required." }),
    //   designation: z.string().trim().min(1, "Designation is required."),
    //   person_name: z.string().trim().optional().nullable(),
    //   number: z.string().trim().optional().nullable(),
    // })).optional(),

    // company_teams: z.array(z.object({
    //   team_name: z.string().trim().min(1, "Team Name is required."),
    //   designation: z.string().trim().min(1, "Designation is required."),
    //   person_name: z.string().trim().min(1, "Person Name is required."),
    //   number: z.string().trim().min(1, "Contact Number is required.").regex(/^\d+$/, "Invalid number format"),
    // })).optional(),

    // company_spot_verification: z.array(z.object({
    //   verified: z.boolean().optional(),
    //   verified_by_id: z.object({ label: z.string(), value: z.string() }, { required_error: "Verifier selection is required." }),
    //   photo_upload: z.any().optional().nullable(),
    //   remark: z.string().trim().optional().or(z.literal("")).nullable(),
    // })).optional(),
    // company_references: z.array(z.object({
    //   person_name: z.string().trim().min(1, "Person name is required."),
    //   company_id: z.object({ label: z.string(), value: z.string().min(1, "Company is required.") }, { required_error: "Company selection is required" }),
    //   number: z.string().trim().min(1, "Contact number is required.").regex(/^\d+$/, "Invalid number format"),
    //   remark: z.string().trim().optional().or(z.literal("")).nullable(),
    // })).optional(),


    gst_number: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format.").optional().or(z.literal("")).nullable(),
    pan_number: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card number format.").optional().or(z.literal("")).nullable(),
  }).passthrough().superRefine((data, ctx) => {
    if (data.country_id?.value === '101') {
      if (!data.gst_number) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GST Number is required for India.", path: ['gst_number'] });
      }
      if (!data.pan_number) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN Number is required for India.", path: ['pan_number'] });
      }

    }
  });

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
    watch
  } = formMethods;

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  // --- START: CENTRALIZED PREVIEW LOGIC ---
  const watchedFiles = watch([
    "company_logo", "company_certificate", "aadhar_card_file", "pan_card_file", 
    "gst_certificate_file", "visiting_card_file", "office_photo_file", 
    "authority_letter_file", "cancel_cheque_file", "ABCQ_file", "other_document_file",
    "primary_bank_verification_photo", "secondary_bank_verification_photo", 
    "company_bank_details", "company_spot_verification", "billing_documents", "enabled_billing_docs"
  ]);

  const allImageDocsForViewer = useMemo(() => {
    const images: { src: string; alt: string }[] = [];
    const isImage = (file: unknown) => (file instanceof File && file.type.startsWith('image/')) || (typeof file === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file));
    const getSrc = (file: any) => file instanceof File ? URL.createObjectURL(file) : String(file);

    const formData = getValues(); // Get current form values

    // Single fields
    if (formData.company_logo && isImage(formData.company_logo)) images.push({ src: getSrc(formData.company_logo), alt: 'Company Logo' });
    if (formData.aadhar_card_file && isImage(formData.aadhar_card_file)) images.push({ src: getSrc(formData.aadhar_card_file), alt: 'Aadhar Card' });
    if (formData.pan_card_file && isImage(formData.pan_card_file)) images.push({ src: getSrc(formData.pan_card_file), alt: 'PAN Card' });
    if (formData.gst_certificate_file && isImage(formData.gst_certificate_file)) images.push({ src: getSrc(formData.gst_certificate_file), alt: 'GST Certificate' });
    if (formData.visiting_card_file && isImage(formData.visiting_card_file)) images.push({ src: getSrc(formData.visiting_card_file), alt: 'Visiting Card' });
    if (formData.office_photo_file && isImage(formData.office_photo_file)) images.push({ src: getSrc(formData.office_photo_file), alt: 'Office Photo' });
    if (formData.authority_letter_file && isImage(formData.authority_letter_file)) images.push({ src: getSrc(formData.authority_letter_file), alt: 'Authority Letter' });
    if (formData.cancel_cheque_file && isImage(formData.cancel_cheque_file)) images.push({ src: getSrc(formData.cancel_cheque_file), alt: 'Cancelled Cheque' });
    if (formData.ABCQ_file && isImage(formData.ABCQ_file)) images.push({ src: getSrc(formData.ABCQ_file), alt: '194Q Declaration' });
    if (formData.other_document_file && isImage(formData.other_document_file)) images.push({ src: getSrc(formData.other_document_file), alt: 'Other Document' });
    if (formData.primary_bank_verification_photo && isImage(formData.primary_bank_verification_photo)) images.push({ src: getSrc(formData.primary_bank_verification_photo), alt: 'Primary Bank Verification Photo' });
    if (formData.secondary_bank_verification_photo && isImage(formData.secondary_bank_verification_photo)) images.push({ src: getSrc(formData.secondary_bank_verification_photo), alt: 'Secondary Bank Verification Photo' });
    
    // Array fields
    formData.company_certificate?.forEach((cert, i) => { if(cert.upload_certificate && isImage(cert.upload_certificate)) images.push({ src: getSrc(cert.upload_certificate), alt: cert.certificate_name || `Certificate ${i+1}` }) });
    formData.company_bank_details?.forEach((bank, i) => { if(bank.verification_photo && isImage(bank.verification_photo)) images.push({ src: getSrc(bank.verification_photo), alt: `Bank ${i+1} Verification Photo` }) });
    formData.company_spot_verification?.forEach((spot, i) => { if(spot.photo_upload && isImage(spot.photo_upload)) images.push({ src: getSrc(spot.photo_upload), alt: `Spot Verification Document ${i+1}` }) });
    formData.billing_documents?.forEach((doc, i) => { if(doc.document && isImage(doc.document)) images.push({ src: getSrc(doc.document), alt: doc.document_name?.label || `Billing Document ${i+1}` }) });
    formData.enabled_billing_docs?.forEach((doc, i) => { if(doc.document && isImage(doc.document)) images.push({ src: getSrc(doc.document), alt: doc.document_name?.label || `Enabled Billing Document ${i+1}` }) });

    return images;
  }, [watchedFiles, getValues]);

  const handlePreviewClick = useCallback((file: File | string | null | undefined, label: string) => {
    if (!file) return;

    const isImage = (f: unknown): boolean => {
      if (f instanceof File) return f.type.startsWith('image/');
      if (typeof f === 'string') return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(f);
      return false;
    }

    if (isImage(file)) {
        const src = file instanceof File ? URL.createObjectURL(file) : String(file);
        const index = allImageDocsForViewer.findIndex(img => img.src === src);
        if (index > -1) {
            setImageViewerState({ isOpen: true, startIndex: index });
        } else {
            // Fallback for an image not in the main list for some reason
            setImageViewerState({ isOpen: true, startIndex: 0 });
        }
    } else {
        setGenericFileViewerState({ isOpen: true, file: file as File | string });
    }
  }, [allImageDocsForViewer]);
  // --- END: CENTRALIZED PREVIEW LOGIC ---

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
    const sectionProps = { errors, control, formMethods, getValues, handlePreviewClick }; // Pass handlePreviewClick down
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
      
      {/* Render viewers at the top level */}
      {imageViewerState.isOpen && (
        <ImageViewer
          images={allImageDocsForViewer}
          startIndex={imageViewerState.startIndex}
          onClose={() => setImageViewerState({ isOpen: false, startIndex: 0 })}
        />
      )}
      {genericFileViewerState.isOpen && genericFileViewerState.file && (
        <GenericFileViewer
          file={genericFileViewerState.file}
          onClose={() => setGenericFileViewerState({ isOpen: false, file: null })}
        />
      )}

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
  const [pageLoading, setPageLoading] = useState(true);
  const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { CountriesData, ContinentsData, MemberData, CompanyData: AllCompaniesData, EmployeesList, DocumentListData } = useSelector(masterSelector);

  const getEmptyFormValues = useCallback((): CompanyFormSchema => ({
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
    primary_account_number: "", primary_benificeiry_name: "", primary_bank_name: "", primary_ifsc_code: "",
    primary_swift_code: "", primary_bank_verification_photo: null, primary_is_default: false,
    secondary_account_number: "", secondary_benificeiry_name: "", secondary_bank_name: "", secondary_ifsc_code: "",
    secondary_swift_code: "", secondary_bank_verification_photo: null, secondary_is_default: false,
    company_bank_details: [],
    USER_ACCESS: false, billing_documents: [], enabled_billing_docs: [],
    company_members: [], company_teams: [],
    company_spot_verification: [], company_references: [],
  }), []);

  // Effect 1: Fetch all static lookup data once on component mount.
  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getEmployeesListingAction());
    dispatch(getMemberAction());
    dispatch(getCompanyAction());
    dispatch(getDocumentListAction());
  }, [dispatch]);

  const lookupsReady = useMemo(() => {
    return !!(
      CountriesData?.length &&
      ContinentsData?.length &&
      MemberData &&
      AllCompaniesData &&
      EmployeesList &&
      DocumentListData
    );
  }, [AllCompaniesData, CountriesData, ContinentsData, DocumentListData, EmployeesList, MemberData]);


  // Effect 2: Initialize the form. Runs for Add mode immediately, or for Edit mode once lookups are ready.
  useEffect(() => {
    if (isEditMode) {
      if (id && lookupsReady) {
        const fetchCompanyData = async () => {
          try {
            const actionResult = await dispatch(getCompanyByIdAction(id)).unwrap();
            if (actionResult) {
              const documentTypeOptions = Array.isArray(DocumentListData) ? DocumentListData.map((d: any) => ({ value: d.id, label: d.name })) : [];
              const allMembersForSelect = (MemberData?.data || []).map((m: any) => ({ value: String(m.id), label: `(${m.customer_code}) - ${m.name}` }));
              const employeeDataSource = EmployeesList?.data?.data || EmployeesList?.data || EmployeesList;
              const allEmployeesForSelect = (Array.isArray(employeeDataSource) ? employeeDataSource : []).map((m: any) => ({ value: String(m.id), label: `(${m.employee_id}) - ${m.name || 'N/A'}` }));
              const allCompaniesForRefSelect = (AllCompaniesData?.data || []).map((c: any) => ({ value: String(c.id), label: `(${c.company_code}) - ${c.company_name}` }));

              const transformed = transformApiToFormSchema(actionResult, CountriesData, ContinentsData, allMembersForSelect, allEmployeesForSelect, allCompaniesForRefSelect, documentTypeOptions);
              setInitialData({ ...getEmptyFormValues(), ...transformed });
            } else {
              toast.push(<Notification type="danger" title="Fetch Error">Company data not found.</Notification>);
              navigate("/business-entities/company");
            }
          } catch (error: any) {
            toast.push(<Notification type="danger" title="Fetch Error">{error?.message || "Error fetching company data."}</Notification>);
            navigate("/business-entities/company");
          } finally {
            setPageLoading(false);
          }
        };
        fetchCompanyData();
      }
    } else {
      setInitialData(getEmptyFormValues());
      setPageLoading(false);
    }
  }, [isEditMode, dispatch, navigate, getEmptyFormValues]);

  const handleFormSubmit = useCallback(async (formValues: CompanyFormSchema, formMethods: UseFormReturn<CompanyFormSchema>) => {
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
          const message = Array.isArray(validationErrors[key]) ? validationErrors[key][0] : validationErrors[key];
          try {
            formMethods.setError(key as keyof CompanyFormSchema, { type: "manual", message: message });
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
  }, [dispatch, isEditMode, id, navigate]);

  const openDiscardDialog = () => setDiscardConfirmationOpen(true);
  const closeDiscardDialog = () => setDiscardConfirmationOpen(false);
  const handleConfirmDiscard = async () => {
    closeDiscardDialog();
    navigate("/business-entities/company");
  };

  if (pageLoading || !initialData) {
    return (
      <Container className="h-full flex justify-center items-center">
        <Spinner size="40px" />
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