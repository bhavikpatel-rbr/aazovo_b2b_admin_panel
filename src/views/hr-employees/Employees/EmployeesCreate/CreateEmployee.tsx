// src/views/hr-employees/EmployeeFormPage.tsx

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, Controller, useFieldArray, type Control, type FieldErrors, UseFormReturn } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/reduxtool/store';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
import dayjs from "dayjs";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";

// --- UI Components ---
import Container from '@/components/shared/Container';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, Button, Input, DatePicker, Select, Radio, Checkbox, FormItem, Spinner, Notification, toast, Avatar } from '@/components/ui';
import { BiChevronRight } from 'react-icons/bi';
import { HiOutlineTrash } from 'react-icons/hi';
import { TbPlus, TbTrash, TbX, TbChevronLeft, TbChevronRight, TbFile, TbFileSpreadsheet, TbFileTypePdf } from "react-icons/tb";

// Redux
import { addEmployeesAction, editEmployeesAction, apiGetEmployeeById } from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import {
    getRolesAction, getDepartmentsAction, getDesignationsAction,
    getCountriesAction, getCategoriesAction,
    getBrandAction, getAllProductsAction, getMemberAction, getEmployeesListingAction
} from '@/reduxtool/master/middleware';


// --- Helper Components for Document Viewing ---
interface ImageViewerProps {
  images: { src: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const handleNext = () => { setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length); };
    const handlePrev = () => { setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length); };
  
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
  
    if (!images || images.length === 0) return null;
    const currentImage = images[currentIndex];
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[100] transition-opacity duration-300 p-4" onClick={onClose}>
        <Button type="button" shape="circle" variant="solid" icon={<TbX />} className="absolute top-4 right-4 z-[102] bg-black/50 hover:bg-black/80" onClick={onClose}/>
        <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <div className="relative flex-grow flex items-center justify-center w-full max-w-6xl overflow-hidden">
            <Button type="button" shape="circle" variant="solid" size="lg" icon={<TbChevronLeft />} className="absolute left-2 md:left-4 opacity-70 hover:opacity-100 transition-opacity z-[101] bg-black/50 hover:bg-black/80" onClick={handlePrev}/>
            <div className="flex flex-col items-center justify-center h-full">
              <img src={currentImage.src} alt={currentImage.alt} className="max-h-[calc(100%-4rem)] max-w-full object-contain select-none"/>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-md">{currentImage.alt} ({currentIndex + 1} / {images.length})</div>
            </div>
            <Button type="button" shape="circle" variant="solid" size="lg" icon={<TbChevronRight />} className="absolute right-2 md:right-4 opacity-70 hover:opacity-100 transition-opacity z-[101] bg-black/50 hover:bg-black/80" onClick={handleNext}/>
          </div>
          <div className="w-full max-w-5xl flex-shrink-0 mt-4"><div className="flex justify-center p-2"><div className="flex gap-3 overflow-x-auto pb-2">{images.map((image, index) => (<button type="button" key={index} onClick={() => setCurrentIndex(index)} className={classNames("w-24 h-16 flex-shrink-0 rounded-md border-2 transition-all focus:outline-none", { 'border-white opacity-100 scale-105': currentIndex === index, 'border-transparent opacity-60 hover:opacity-100': currentIndex !== index })}><img src={image.src} alt={image.alt} className="w-full h-full object-cover rounded-sm" /></button>))}</div></div></div>
        </div>
      </div>
    );
};

const DocumentPlaceholder = ({ fileName, fileUrl }: { fileName: string; fileUrl: string; }) => {
    const getFileIcon = () => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf': return <TbFileTypePdf className="text-red-500" size={48} />;
        case 'xls': case 'xlsx': return <TbFileSpreadsheet className="text-green-500" size={48} />;
        default: return <TbFile className="text-gray-500" size={48} />;
      }
    };
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full p-2 flex flex-col items-center justify-center text-center">
        {getFileIcon()}
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-all line-clamp-2">{fileName}</p>
      </a>
    );
};
  
const GenericFileViewer = ({ file, onClose }: { file: File | string; onClose: () => void; }) => {
    const fileUrl = useMemo(() => (file instanceof File ? URL.createObjectURL(file) : file), [file]);
    const fileName = useMemo(() => (file instanceof File ? file.name : (file.split('/').pop() || 'file')), [file]);
    const fileExtension = useMemo(() => fileName.split('.').pop()?.toLowerCase(), [fileName]);
    const isPdf = fileExtension === 'pdf';
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[100] transition-opacity duration-300 p-4" onClick={onClose}>
            <Button type="button" shape="circle" variant="solid" icon={<TbX />} className="absolute top-4 right-4 z-[102] bg-black/50 hover:bg-black/80" onClick={onClose} />
            <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                {isPdf ? (<iframe src={fileUrl} title={fileName} className="w-full h-full border-none rounded-lg bg-white" />) : (<div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center flex flex-col items-center justify-center max-w-md">{getFileIcon()}<h4 className="mb-2 mt-4">Preview not available</h4><p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs">This file type can't be shown here. You can open it in a new tab to view or download it.</p><Button variant="solid" onClick={() => window.open(fileUrl, '_blank')}>Open '{fileName}'</Button></div>)}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-md">{fileName}</div>
            </div>
        </div>
    );
};

interface FileInputPreviewProps {
    label: string;
    required?: boolean;
    control: Control<any>;
    name: string;
    errors: FieldErrors<any>;
    accept?: string;
    onPreviewClick: (file: File | string, label: string) => void;
}

const FileInputPreview: React.FC<FileInputPreviewProps> = ({ label, required, control, name, errors, accept, onPreviewClick }) => {
    const getNestedError = (name: string, errors: FieldErrors) => {
        const keys = name.split('.');
        let error = errors;
        for (const key of keys) {
            if (error && typeof error === 'object' && key in error) {
                error = (error as any)[key];
            } else {
                return undefined;
            }
        }
        return error;
    };

    const error = getNestedError(name, errors);

    return (
        <FormItem
            label={<>{label}{required && <span className="text-red-500"> *</span>}</>}
            invalid={!!error}
            errorMessage={error?.message as string}
        >
            <Controller
                name={name}
                control={control}
                render={({ field: { onChange, value } }) => {
                    const isImage = (f: any): f is File | string => (f instanceof File && f.type.startsWith('image/')) || (typeof f === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(f));
                    const fileUrl = value instanceof File ? URL.createObjectURL(value) : (typeof value === 'string' ? value : null);
                    const fileName = value instanceof File ? value.name : (typeof value === 'string' ? value.split('/').pop() : 'Document');
                    
                    return (
                        <div className="flex flex-col gap-2">
                            <Input
                                type="file"
                                accept={accept}
                                onChange={(e) => onChange(e.target.files?.[0] || null)}
                            />
                            {value && (
                                <div 
                                    className="w-full h-24 border-2 border-dashed rounded-md flex items-center justify-center p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onClick={() => onPreviewClick(value, label)}
                                >
                                    {isImage(value) ? (
                                        <img src={fileUrl} alt={label} className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <TbFile className="mx-auto text-4xl text-gray-400" />
                                            <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }}
            />
        </FormItem>
    );
};

// --- TYPE DEFINITIONS ---
interface EquipmentItemFE {
    id?: string;
    name: string;
    serial_no: string;
    remark: string;
    provided: boolean;
    attachment: File | string | null;
}

interface EmployeeFormSchema {
    id?: string;
    registration: { fullName: string; dateOfJoining: Date | null; mobileNumber: string; mobileNumberCode: { label: string, value: string }; email: string; experience: string; password?: string; };
    personalInformation: { status: { label: string, value: string }; dateOfBirth: Date | null; age: number | string; gender: { label: string, value: string } | null; nationalityId: { label: string, value: string } | null; bloodGroup: { label: string, value: string } | null; permanentAddress: string; localAddress: string; maritalStatus: { label: string, value: string } | null; };
    roleResponsibility: { roleId: { label: string, value: string } | null; departmentId: { label: string, value: string }[]; designationId: { label: string, value: string } | null; countryId: { label: string, value: string }[]; categoryId: { label: string, value: string }[]; subcategoryId: { label: string, value: string }[]; brandId: { label: string, value: string }[]; productServiceId: { label: string, value: string }[]; reportingHrId: { label: string, value: string }[]; reportingHeadId: { label: string, value: string } | null; };
    training: { inductionDateCompletion: Date | null; inductionRemarks: string; departmentTrainingDateCompletion: Date | null; departmentTrainingRemarks: string; };
    offBoarding: { exit_interview_conducted: 'yes' | 'no' | ''; exit_interview_remark: string; resignation_letter_received: 'yes' | 'no' | ''; resignation_letter_remark: string; company_assets_returned: 'all' | 'partial' | 'none' | ''; assets_returned_remarks: string; full_and_final_settlement: 'yes' | 'no' | ''; fnf_remarks: string; notice_period_status: 'served' | 'waived' | ''; notice_period_remarks: string; };
    equipmentsAssetsProvided: { items: EquipmentItemFE[]; };
    documentSubmission: { [key: string]: File | string | null; profile_pic?: File | string | null; };
}
interface FormSectionBaseProps { control: Control<EmployeeFormSchema>; errors: FieldErrors<EmployeeFormSchema>; formMethods: UseFormReturn<EmployeeFormSchema> }
type FormSectionKey = keyof Omit<EmployeeFormSchema, 'id'>;


// --- ZOD SCHEMA ---
const requiredSelectSchema = z.object({ label: z.string(), value: z.string() }, { required_error: "This field is required." });
const optionalSelectSchema = z.object({ label: z.string(), value: z.string() }).nullable().optional();
const requiredFileSchema = z.any().refine(val => val !== null && val !== undefined && val !== '', { message: "This file is required." });

const employeeFormValidationSchema = z.object({
    id: z.string().optional(),
    registration: z.object({
        fullName: z.string().min(1, 'Full Name is required'),
        dateOfJoining: z.date({ required_error: "Date of joining is required." }),
        mobileNumber: z.string().min(7, 'Mobile number must be at least 7 digits').regex(/^\d+$/, "Invalid phone number"),
        mobileNumberCode: requiredSelectSchema,
        email: z.string().min(1, 'Email is required').email('Invalid email format'),
        experience: z.string().min(1, 'Experience is required'),
        password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
    }),
    personalInformation: z.object({
        status: requiredSelectSchema,
        dateOfBirth: z.date({ required_error: "Date of birth is required." }),
        nationalityId: requiredSelectSchema,
    }).passthrough(),
    documentSubmission: z.object({
        identity_proof: requiredFileSchema,
        address_proof: requiredFileSchema,
    }).passthrough(),
    roleResponsibility: z.object({
        roleId: requiredSelectSchema,
        departmentId: z.array(requiredSelectSchema).min(1, "At least one department is required."),
        designationId: requiredSelectSchema,
    }).passthrough(),
    training: z.any().optional(),
    offBoarding: z.any().optional(),
    equipmentsAssetsProvided: z.any().optional(),
}).superRefine((data, ctx) => {
    if (!data.id && (!data.registration.password || data.registration.password.length < 6)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password is required for new employees.", path: ["registration", "password"] });
    }
    if (data.registration.dateOfJoining && data.personalInformation.dateOfBirth) {
        if (dayjs(data.personalInformation.dateOfBirth).isAfter(data.registration.dateOfJoining)) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DOB cannot be after joining date.", path: ["personalInformation", "dateOfBirth"] });
        }
    }
});


// --- FORM SECTION & NAVIGATOR COMPONENTS ---
const Navigator = ({ activeSection, onNavigate }: { activeSection: FormSectionKey, onNavigate: (key: FormSectionKey) => void }) => {
    const sections: { key: FormSectionKey; label: string }[] = [
        { key: 'registration', label: 'Registration' }, { key: 'personalInformation', label: 'Personal Info' }, { key: 'documentSubmission', label: 'Documents' },
        { key: 'roleResponsibility', label: 'Role' }, { key: 'training', label: 'Training' }, { key: 'equipmentsAssetsProvided', label: 'Equipment' }, { key: 'offBoarding', label: 'Off-Boarding' },
    ];
    return (
        <div className="flex overflow-x-auto sm:justify-center">
            <div className="flex flex-nowrap gap-x-6 gap-y-2">
                {sections.map(sec => (
                    <button
                        key={sec.key} type="button" onClick={() => onNavigate(sec.key)}
                        className={classNames('cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max',
                            'hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none', {
                            'bg-indigo-50 dark:bg-indigo-700/60 text-primary dark:text-indigo-200 font-semibold': activeSection === sec.key,
                            'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200': activeSection !== sec.key,
                        })} title={sec.label}>
                        <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">{sec.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
const RegistrationSection = ({ control, errors }: FormSectionBaseProps) => {
    const isEditMode = !!control._formValues.id;
    const dispatch = useAppDispatch();
    const { CountriesData = [] } = useSelector(masterSelector);
    useEffect(() => { if (!Array.isArray(CountriesData) || CountriesData.length === 0) dispatch(getCountriesAction()); }, [dispatch, CountriesData]);

    const countryCodeOptions = useMemo(() => Array.isArray(CountriesData) ? CountriesData
        .filter((c: any) => c.phone_code)
        .map((c: any) => ({ value: `+${c.phone_code}`, label: `+${c.phone_code} (${c.name})` }))
        .sort((a, b) => a.label.localeCompare(b.label)) : [], [CountriesData]);

    return (
        <Card id="registration"><h4 className="mb-6">Registration</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormItem label={<>Full Name <span className="text-red-500">*</span></>} invalid={!!errors.registration?.fullName} errorMessage={errors.registration?.fullName?.message}><Controller name="registration.fullName" control={control} render={({ field }) => <Input placeholder="Enter full name" {...field} />} /></FormItem>
            <FormItem label={<>Date of Joining <span className="text-red-500">*</span></>} invalid={!!errors.registration?.dateOfJoining} errorMessage={errors.registration?.dateOfJoining?.message}><Controller name="registration.dateOfJoining" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label={<>Mobile Number <span className="text-red-500">*</span></>} invalid={!!errors.registration?.mobileNumber || !!errors.registration?.mobileNumberCode} errorMessage={errors.registration?.mobileNumber?.message || (errors.registration?.mobileNumberCode as any)?.message}>
                <div className='flex gap-2'><div className='w-1/3'><Controller name="registration.mobileNumberCode" control={control} render={({ field }) => <Select options={countryCodeOptions} placeholder="Code" {...field} />} /></div><div className='w-2/3'><Controller name="registration.mobileNumber" control={control} render={({ field }) => <Input type="tel" placeholder="9876543210" {...field} />} /></div></div></FormItem>
            <FormItem label={<>Email <span className="text-red-500">*</span></>} invalid={!!errors.registration?.email} errorMessage={errors.registration?.email?.message}><Controller name="registration.email" control={control} render={({ field }) => <Input type="email" placeholder="employee@company.com" {...field} />} /></FormItem>
            <FormItem label={<>Experience <span className="text-red-500">*</span></>} invalid={!!errors.registration?.experience} errorMessage={errors.registration?.experience?.message}><Controller name="registration.experience" control={control} render={({ field }) => <Input placeholder="e.g., 3 years" {...field} />} /></FormItem>
            <FormItem label={<>Password {!isEditMode && <span className="text-red-500">*</span>}</>} invalid={!!errors.registration?.password} errorMessage={errors.registration?.password?.message}><Controller name="registration.password" control={control} render={({ field }) => <Input type="password" placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"} {...field} />} /></FormItem>
        </div></Card>
    );
};
const PersonalInformationSection = ({ control, errors }: FormSectionBaseProps) => {
    const dispatch = useAppDispatch();
    const { CountriesData = [] } = useSelector(masterSelector);
    useEffect(() => { if (!Array.isArray(CountriesData) || CountriesData.length === 0) dispatch(getCountriesAction()); }, [dispatch, CountriesData]);
    const nationalityOptions = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((c: any) => ({ value: String(c.id), label: c.name })) : [], [CountriesData]);
    const statusOptions = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];
    const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
    const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'B+', label: 'B+' }, { value: 'O+', label: 'O+' }, { value: 'A-', label: 'A-' }, { value: 'B-', label: 'B-' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }, { value: 'Other', label: 'Other' }];
    const maritalStatusOptions = [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }];
    return (
        <Card id="personalInformation"><h4 className="mb-6">Personal Information</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormItem label={<>Status <span className="text-red-500">*</span></>} invalid={!!errors.personalInformation?.status} errorMessage={(errors.personalInformation?.status as any)?.message}><Controller name="personalInformation.status" control={control} defaultValue={{ value: 'Active', label: 'Active' }} render={({ field }) => <Select placeholder="Select Status" options={statusOptions} {...field} />} /></FormItem>
            <FormItem label={<>Date of Birth <span className="text-red-500">*</span></>} invalid={!!errors.personalInformation?.dateOfBirth} errorMessage={errors.personalInformation?.dateOfBirth?.message}><Controller name="personalInformation.dateOfBirth" control={control} render={({ field }) => <DatePicker placeholder="Select Date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Age" invalid={!!errors.personalInformation?.age} errorMessage={errors.personalInformation?.age?.message}><Controller name="personalInformation.age" control={control} render={({ field }) => <Input type="number" placeholder="Enter Age" {...field} onChange={e => field.onChange(parseInt(e.target.value) || '')} />} /></FormItem>
            <FormItem label="Gender" invalid={!!errors.personalInformation?.gender} errorMessage={(errors.personalInformation?.gender as any)?.message}><Controller name="personalInformation.gender" control={control} render={({ field }) => <Select placeholder="Select Gender" options={genderOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Marital Status" invalid={!!errors.personalInformation?.maritalStatus} errorMessage={(errors.personalInformation?.maritalStatus as any)?.message}><Controller name="personalInformation.maritalStatus" control={control} render={({ field }) => <Select placeholder="Select Marital Status" options={maritalStatusOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label={<>Nationality <span className="text-red-500">*</span></>} invalid={!!errors.personalInformation?.nationalityId} errorMessage={(errors.personalInformation?.nationalityId as any)?.message}><Controller name="personalInformation.nationalityId" control={control} render={({ field }) => <Select placeholder="Select Nationality" options={nationalityOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Blood Group" invalid={!!errors.personalInformation?.bloodGroup} errorMessage={(errors.personalInformation?.bloodGroup as any)?.message}><Controller name="personalInformation.bloodGroup" control={control} render={({ field }) => <Select placeholder="Select Blood Group" options={bloodGroupOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Permanent Address" invalid={!!errors.personalInformation?.permanentAddress} errorMessage={errors.personalInformation?.permanentAddress?.message} className="md:col-span-2 lg:col-span-3"><Controller name="personalInformation.permanentAddress" control={control} render={({ field }) => <Input textArea placeholder="Enter Permanent Address" {...field} />} /></FormItem>
            <FormItem label="Local Address" invalid={!!errors.personalInformation?.localAddress} errorMessage={errors.personalInformation?.localAddress?.message} className="md:col-span-2 lg:col-span-3"><Controller name="personalInformation.localAddress" control={control} render={({ field }) => <Input textArea placeholder="Enter Local Address" {...field} />} /></FormItem>
        </div></Card>
    );
};

const DocumentSubmissionSection = ({ control, errors, formMethods }: FormSectionBaseProps) => {
    const [viewerIsOpen, setViewerIsOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [viewingFile, setViewingFile] = useState<File | string | null>(null);

    const documentFields = useMemo(() => [
        { name: 'profile_pic' as const, label: "Profile Picture", accept: ".jpg,.jpeg,.png"  },
        { name: 'identity_proof' as const, label: "Identity Proof", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'address_proof' as const, label: "Address Proof", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'educational_certificates' as const, label: "Educational Certificates", accept: ".pdf,.zip" },
        { name: 'experience_certificates' as const, label: "Experience Certificates", accept: ".pdf,.zip" },
        { name: 'offer_letter' as const, label: "Offer Letter", accept: ".pdf" },
        { name: 'past_offer_letter' as const, label: "Past Offer Letter(s)", accept: ".pdf,.zip" },
        { name: 'relieving_letter' as const, label: "Relieving Letter", accept: ".pdf" },
        { name: 'designation_letter' as const, label: "Designation Letter", accept: ".pdf" },
        { name: 'salary_slips' as const, label: "Salary Slips", accept: ".pdf,.zip" },
        { name: 'bank_account_proof' as const, label: "Bank Account Proof", accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'pan_card' as const, label: "PAN Card", accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'passport_size_photograph' as const, label: "Passport Photograph", accept: ".jpg,.jpeg,.png" },
    ], []);
    
    const watchedFileValues = documentFields.map(doc => formMethods.watch(`documentSubmission.${doc.name}`));

    const imageDocsForViewer = useMemo(() => {
        return documentFields
          .map((doc, index) => ({ ...doc, fileValue: watchedFileValues[index] }))
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
    }, [documentFields, ...watchedFileValues]);

    const handlePreviewClick = (fileValue: File | string | null | undefined, docLabel: string) => {
        if (!fileValue) return;
        const isImage = (file: unknown): file is File | string => (file instanceof File && file.type.startsWith('image/')) || (typeof file === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(file));
    
        if (isImage(fileValue)) {
          const index = imageDocsForViewer.findIndex(img => img.alt === docLabel);
          if (index > -1) {
            setSelectedImageIndex(index);
            setViewerIsOpen(true);
          }
        } else {
          setViewingFile(fileValue);
        }
    };
    
    return (
        <>
            <Card id="documentSubmission">
                <h4 className="mb-6">Document Submission</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    {documentFields.map(doc => (
                        <FileInputPreview
                            key={doc.name}
                            label={doc.label}
                            required={doc.required}
                            control={control}
                            name={`documentSubmission.${doc.name}`}
                            errors={errors}
                            accept={doc.accept}
                            onPreviewClick={handlePreviewClick}
                        />
                    ))}
                </div>
            </Card>
            {viewerIsOpen && <ImageViewer images={imageDocsForViewer} startIndex={selectedImageIndex} onClose={() => setViewerIsOpen(false)} />}
            {viewingFile && <GenericFileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
        </>
    );
};

const RoleResponsibilitySection = ({ control, errors }: FormSectionBaseProps) => {
    const { Roles, departmentsData, designationsData, BrandData, CategoriesData, AllProducts, memberData, reportingTo, CountriesData } = useSelector(masterSelector);
    
    const toOptions = (data: any, labelKey = 'name', valueKey = 'id') => Array.isArray(data) ? data.map((item) => ({ value: String(item[valueKey]), label: item[labelKey] })) : [];
    const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
    const departmentOptions = useMemo(() => toOptions(departmentsData?.data), [departmentsData]);
    const designationOptions = useMemo(() => toOptions(designationsData?.data), [designationsData]);
    const countryOptions = useMemo(() => toOptions(CountriesData), [CountriesData]);
    const categoryOptions = useMemo(() => toOptions(CategoriesData), [CategoriesData]);
    const brandOptions = useMemo(() => toOptions(BrandData), [BrandData]);
    const productOptions = useMemo(() => toOptions(AllProducts), [AllProducts]);
    const reportingHrOptions = useMemo(() => toOptions(reportingTo?.data), [reportingTo]);
    const reportingHeadOptions = useMemo(() => toOptions(memberData), [memberData]);
    return (
        <Card id="roleResponsibility"><h4 className="mb-6">Role & Responsibility</h4><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <FormItem label={<>Role <span className="text-red-500">*</span></>} invalid={!!errors.roleResponsibility?.roleId} errorMessage={(errors.roleResponsibility?.roleId as any)?.message}><Controller name="roleResponsibility.roleId" control={control} render={({ field }) => <Select placeholder="Select Role" options={roleOptions} {...field} />} /></FormItem>
            <FormItem label={<>Department <span className="text-red-500">*</span></>} invalid={!!errors.roleResponsibility?.departmentId} errorMessage={(errors.roleResponsibility?.departmentId as any)?.message}><Controller name="roleResponsibility.departmentId" control={control} render={({ field }) => <Select isMulti placeholder="Select Departments" options={departmentOptions} {...field} />} /></FormItem>
            <FormItem label={<>Designation <span className="text-red-500">*</span></>} invalid={!!errors.roleResponsibility?.designationId} errorMessage={(errors.roleResponsibility?.designationId as any)?.message}><Controller name="roleResponsibility.designationId" control={control} render={({ field }) => <Select placeholder="Select Designation" options={designationOptions} {...field} />} /></FormItem>
            <FormItem label="Country (Responsibility)"><Controller name="roleResponsibility.countryId" control={control} render={({ field }) => <Select isMulti placeholder="Select Countries" options={countryOptions} {...field} />} /></FormItem>
            <FormItem label="Category (Focus Area)"><Controller name="roleResponsibility.categoryId" control={control} render={({ field }) => <Select isMulti placeholder="Select Categories" options={categoryOptions} {...field} />} /></FormItem>
            <FormItem label="Brand (Responsibility)"><Controller name="roleResponsibility.brandId" control={control} render={({ field }) => <Select isMulti placeholder="Select Brands" options={brandOptions} {...field} />} /></FormItem>
            <FormItem label="Product/Service (Focus)"><Controller name="roleResponsibility.productServiceId" control={control} render={({ field }) => <Select isMulti placeholder="Select Products" options={productOptions} {...field} />} /></FormItem>
            <FormItem label="Reporting HR"><Controller name="roleResponsibility.reportingHrId" control={control} render={({ field }) => <Select isMulti placeholder="Select Reporting HR" options={reportingHrOptions} {...field} />} /></FormItem>
            <FormItem label="Reporting Head"><Controller name="roleResponsibility.reportingHeadId" control={control} render={({ field }) => <Select placeholder="Select Reporting Head" options={reportingHeadOptions} {...field} />} /></FormItem>
        </div></Card>
    );
};

const EquipmentsAssetsSection = ({ control, formMethods }: FormSectionBaseProps) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'equipmentsAssetsProvided.items' });
    const { watch } = formMethods;
    const [viewingFile, setViewingFile] = useState<File | string | null>(null);

    const handlePreviewClick = (fileValue: File | string | null | undefined) => {
        if (fileValue) setViewingFile(fileValue);
    };

    return (
        <>
            <Card id="equipmentsAssetsProvided">
                <div className="flex justify-between items-center mb-6"><h4>Equipments & Assets Issued</h4><Button type="button" size="sm" icon={<TbPlus />} onClick={() => append({ name: '', serial_no: '', remark: '', provided: true, attachment: null })}>Add Asset</Button></div>
                <div className="flex flex-col gap-y-6">
                    {fields.map((item, index) => {
                        const attachmentValue = watch(`equipmentsAssetsProvided.items.${index}.attachment`);
                        return (
                            <div key={item.id} className="p-4 border rounded-md relative">
                                <Button shape="circle" size="sm" icon={<HiOutlineTrash />} className="absolute top-2 right-2 text-red-500 hover:text-red-700" type="button" onClick={() => remove(index)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormItem label="Asset Name"><Controller name={`equipmentsAssetsProvided.items.${index}.name`} control={control} render={({ field }) => <Input placeholder="e.g., Laptop" {...field} />} /></FormItem>
                                    <FormItem label="Serial Number"><Controller name={`equipmentsAssetsProvided.items.${index}.serial_no`} control={control} render={({ field }) => <Input placeholder="e.g., DL12345XYZ" {...field} />} /></FormItem>
                                    <FormItem label="Remark" className="md:col-span-2"><Controller name={`equipmentsAssetsProvided.items.${index}.remark`} control={control} render={({ field }) => <Input placeholder="e.g., New Dell Machine" {...field} />} /></FormItem>
                                    <div className="md:col-span-2">
                                        <FileInputPreview
                                            label="Attachment"
                                            control={control}
                                            name={`equipmentsAssetsProvided.items.${index}.attachment`}
                                            errors={errors}
                                            onPreviewClick={(file) => handlePreviewClick(file)}
                                        />
                                    </div>
                                    <FormItem label="Provided?" className="flex items-center pt-2">
                                        <Controller name={`equipmentsAssetsProvided.items.${index}.provided`} control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={field.onChange} />)} />
                                    </FormItem>
                                </div>
                            </div>
                        );
                    })}
                    {fields.length === 0 && <p className="text-center text-gray-500">No assets added.</p>}
                </div>
            </Card>
            {viewingFile && <GenericFileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
        </>
    );
};

const TrainingSection = ({ control, errors }: FormSectionBaseProps) => (
    <Card id="training"><h4 className="mb-6">Training Information</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="flex flex-col gap-y-4"><h5 className="text-base font-semibold">Induction Training</h5>
            <FormItem label="Date of Completion" invalid={!!errors.training?.inductionDateCompletion} errorMessage={errors.training?.inductionDateCompletion?.message}><Controller name="training.inductionDateCompletion" control={control} render={({ field }) => <DatePicker placeholder="Select Date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Remarks" invalid={!!errors.training?.inductionRemarks} errorMessage={errors.training?.inductionRemarks?.message}><Controller name="training.inductionRemarks" control={control} render={({ field }) => <Input textArea placeholder="Enter remarks for induction..." {...field} />} /></FormItem>
        </div>
        <div className="flex flex-col gap-y-4"><h5 className="text-base font-semibold">Department Specific Training</h5>
            <FormItem label="Date of Completion" invalid={!!errors.training?.departmentTrainingDateCompletion} errorMessage={errors.training?.departmentTrainingDateCompletion?.message}><Controller name="training.departmentTrainingDateCompletion" control={control} render={({ field }) => <DatePicker placeholder="Select Date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Remarks" invalid={!!errors.training?.departmentTrainingRemarks} errorMessage={errors.training?.departmentTrainingRemarks?.message}><Controller name="training.departmentTrainingRemarks" control={control} render={({ field }) => <Input textArea placeholder="Enter remarks for specific training..." {...field} />} /></FormItem>
        </div>
    </div></Card>
);

const OffBoardingSection = ({ control, errors }: FormSectionBaseProps) => {
    const config = [
        { key: 'exit_interview_conducted' as const, label: 'Exit Interview Conducted?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], remarksKey: 'exit_interview_remark' as const, remarksLabel: 'Remarks' },
        { key: 'resignation_letter_received' as const, label: 'Resignation Letter Received?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], remarksKey: 'resignation_letter_remark' as const, remarksLabel: 'Remarks' },
        { key: 'company_assets_returned' as const, label: 'Company Assets Returned?', options: [{ value: 'all', label: 'All' }, { value: 'partial', label: 'Partial' }, { value: 'none', label: 'None' }], remarksKey: 'assets_returned_remarks' as const, remarksLabel: 'Remarks' },
        { key: 'full_and_final_settlement' as const, label: 'FNF Processed?', options: [{ value: 'yes', label: 'Yes' }, { 'value': 'no', 'label': 'No' }], remarksKey: 'fnf_remarks' as const, remarksLabel: 'Remarks' },
    ];
    return (
        <Card id="offBoarding"><h4 className="mb-6">Off-Boarding Process</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {config.map((item) => (
                <div key={item.key} className="flex flex-col gap-y-4">
                    <FormItem label={item.label} invalid={!!(errors.offBoarding as any)?.[item.key]} errorMessage={(errors.offBoarding as any)?.[item.key]?.message}><Controller name={`offBoarding.${item.key}`} control={control} render={({ field }) => <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">{item.options.map((opt) => (<Radio key={opt.value} {...field} value={opt.value} checked={field.value === opt.value}>{opt.label}</Radio>))}</div>} /></FormItem>
                    <FormItem label={item.remarksLabel} invalid={!!(errors.offBoarding as any)?.[item.remarksKey]} errorMessage={(errors.offBoarding as any)?.[item.remarksKey]?.message}><Controller name={`offBoarding.${item.remarksKey}`} control={control} render={({ field }) => <Input textArea placeholder="Enter remarks..." {...field} />} /></FormItem>
                </div>
            ))}
        </div></Card>
    );
};


// --- CORE FORM COMPONENT ---
const sectionKeys: FormSectionKey[] = ['registration', 'personalInformation', 'documentSubmission', 'roleResponsibility', 'training', 'equipmentsAssetsProvided', 'offBoarding'];
interface EmployeeFormProps { onFormSubmit: (data: FormData, id?: string) => void; defaultValues: Partial<EmployeeFormSchema>; isEdit: boolean; isSubmitting: boolean; onDiscard: () => void; }

const EmployeeFormComponent = ({ onFormSubmit, defaultValues, isEdit = false, isSubmitting = false, onDiscard }: EmployeeFormProps) => {
    const [activeSection, setActiveSection] = useState<FormSectionKey>('registration');
    const activeSectionIndex = sectionKeys.indexOf(activeSection);

    const formMethods = useForm<EmployeeFormSchema>({
        defaultValues,
        resolver: zodResolver(employeeFormValidationSchema),
        mode: 'onTouched',
    });
    
    const { handleSubmit, reset, control, formState: { errors } } = formMethods;

    useEffect(() => {
        reset(defaultValues);
    }, [defaultValues, reset]);

    const onValidSubmit = (values: EmployeeFormSchema) => {
        const formData = new FormData();
        const formatDate = (date: Date | null | undefined) => date ? dayjs(date).format('YYYY-MM-DD') : '';
        const arrayToCommaString = (arr: any[] | undefined) => (arr || []).map(item => item.value).join(',');
        const objToValue = (obj: any) => obj?.value || '';

        if (isEdit && defaultValues?.id) { formData.append('_method', "PUT"); formData.append('employee_id', String(defaultValues.id)); }

        formData.append('name', values.registration?.fullName || '');
        formData.append('date_of_joining', formatDate(values.registration?.dateOfJoining));
        formData.append('mobile_number', values.registration?.mobileNumber || '');
        formData.append('mobile_number_code', objToValue(values.registration?.mobileNumberCode));
        formData.append('email', values.registration?.email || '');
        formData.append('experience', values.registration?.experience || '');
        if (values.registration.password) formData.append('password', values.registration.password);
        formData.append('status', objToValue(values.personalInformation?.status));
        formData.append('date_of_birth', formatDate(values.personalInformation?.dateOfBirth));
        formData.append('age', String(values.personalInformation?.age || ''));
        formData.append('gender', objToValue(values.personalInformation?.gender));
        formData.append('nationality_id', objToValue(values.personalInformation?.nationalityId));
        formData.append('blood_group', objToValue(values.personalInformation?.bloodGroup));
        formData.append('permanent_address', values.personalInformation?.permanentAddress || '');
        formData.append('local_address', values.personalInformation?.localAddress || '');
        formData.append('maritual_status', objToValue(values.personalInformation?.maritalStatus));
        formData.append('role_id', objToValue(values.roleResponsibility?.roleId));
        formData.append('department_id', arrayToCommaString(values.roleResponsibility?.departmentId));
        formData.append('designation_id', objToValue(values.roleResponsibility?.designationId));
        formData.append('country_id', arrayToCommaString(values.roleResponsibility?.countryId));
        formData.append('category_id', arrayToCommaString(values.roleResponsibility?.categoryId));
        formData.append('subcategory_id', arrayToCommaString(values.roleResponsibility?.subcategoryId));
        formData.append('brand_id', arrayToCommaString(values.roleResponsibility?.brandId));
        formData.append('product_service_id', arrayToCommaString(values.roleResponsibility?.productServiceId));
        formData.append('reporting_hr_id', arrayToCommaString(values.roleResponsibility?.reportingHrId));
        formData.append('reporting_head_id', objToValue(values.roleResponsibility?.reportingHeadId));
        
        Object.entries(values.documentSubmission || {}).forEach(([key, file]) => {
            if (file instanceof File) formData.append(key, file);
        });

        formData.append('training_date_of_completion', formatDate(values.training?.inductionDateCompletion));
        formData.append('training_remark', values.training?.inductionRemarks || '');
        formData.append('specific_training_date_of_completion', formatDate(values.training?.departmentTrainingDateCompletion));
        formData.append('specific_training_remark', values.training?.departmentTrainingRemarks || '');
        
        const yesNoToBoolString = (value: 'yes' | 'no' | '') => value === 'yes' ? '1' : value === 'no' ? '0' : '';
        formData.append('exit_interview_conducted', yesNoToBoolString(values.offBoarding?.exit_interview_conducted));
        formData.append('resignation_letter_received', yesNoToBoolString(values.offBoarding?.resignation_letter_received));
        formData.append('full_and_final_settlement', yesNoToBoolString(values.offBoarding?.full_and_final_settlement));
        formData.append('exit_interview_remark', values.offBoarding?.exit_interview_remark || '');
        formData.append('resignation_letter_remark', values.offBoarding?.resignation_letter_remark || '');
        formData.append('company_assets_returned', values.offBoarding?.company_assets_returned || '');
        formData.append('assets_returned_remarks', values.offBoarding?.assets_returned_remarks || '');
        formData.append('fnf_remarks', values.offBoarding?.fnf_remarks || '');
        formData.append('notice_period_status', values.offBoarding?.notice_period_status || '');
        formData.append('notice_period_remarks', values.offBoarding?.notice_period_remarks || '');
        
        if (values.equipmentsAssetsProvided?.items) {
            const equipmentDataForJson = values.equipmentsAssetsProvided.items.map(item => ({ name: item.name, serial_no: item.serial_no, remark: item.remark, provided: item.provided }));
            formData.append('equipments_assets_issued', JSON.stringify(equipmentDataForJson));
            values.equipmentsAssetsProvided.items.forEach((item, index) => {
                if (item.attachment instanceof File) formData.append(`equipment_attachment_${index}`, item.attachment);
            });
        }
        
        onFormSubmit(formData, defaultValues?.id);
    };
    
    const onInvalidSubmit = (errorData: FieldErrors<EmployeeFormSchema>) => {
        console.log(errorData);
        
        toast.push(<Notification title="Error" type="danger">Please fix the errors before submitting.</Notification>);
        for (const key of sectionKeys) {
            if (errorData[key]) {
                setActiveSection(key);
                setTimeout(() => { document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
                break;
            }
        }
    };

    const renderActiveSection = () => {
        const sectionProps = { control, errors, formMethods };
        switch (activeSection) {
            case 'registration': return <RegistrationSection {...sectionProps} />;
            case 'personalInformation': return <PersonalInformationSection {...sectionProps} />;
            case 'documentSubmission': return <DocumentSubmissionSection {...sectionProps} />;
            case 'roleResponsibility': return <RoleResponsibilitySection {...sectionProps} />;
            case 'training': return <TrainingSection {...sectionProps} />;
            case 'equipmentsAssetsProvided': return <EquipmentsAssetsSection {...sectionProps} />;
            case 'offBoarding': return <OffBoardingSection {...sectionProps} />;
            default: return <RegistrationSection {...sectionProps} />;
        }
    };

    const handleNext = () => activeSectionIndex < sectionKeys.length - 1 && setActiveSection(sectionKeys[activeSectionIndex + 1]);
    const handlePrevious = () => activeSectionIndex > 0 && setActiveSection(sectionKeys[activeSectionIndex - 1]);

    return (
        <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="h-full">
            <div className="h-full flex flex-col justify-between">
                <div className="flex-grow pb-6">
                    <div className="flex gap-1 items-end mb-3">
                        <NavLink to="/hr-employees/employees"><h6 className="font-semibold hover:text-primary">Employees</h6></NavLink>
                        <BiChevronRight size={22} />
                        <h6 className="font-semibold text-primary dark:text-indigo-200">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h6>
                    </div>
                    <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
                        <Navigator activeSection={activeSection} onNavigate={setActiveSection} />
                    </Card>
                    <div className="flex flex-col gap-4">
                        {renderActiveSection()}
                    </div>
                </div>
                <div className="bg-white sticky bottom-0 -mx-8 px-8 py-4 border-t dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <Button type="button" icon={<HiOutlineTrash />} onClick={onDiscard} disabled={isSubmitting}>Discard</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" onClick={handlePrevious} disabled={isSubmitting || activeSectionIndex === 0}>Previous</Button>
                            <Button type="button" onClick={handleNext} disabled={isSubmitting || activeSectionIndex === sectionKeys.length - 1}>Next</Button>
                            <Button variant="solid" type="submit" loading={isSubmitting} disabled={isSubmitting}>
                                {isEdit ? "Update" : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};


// --- PAGE-LEVEL COMPONENT ---
const EmployeeFormPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id: employeeId } = useParams<{ id: string }>();
    const isEditMode = !!employeeId;

    const [initialData, setInitialData] = useState<Partial<EmployeeFormSchema> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);

    const lookups = useSelector(masterSelector);

    useEffect(() => {
        dispatch(getRolesAction());
        dispatch(getDepartmentsAction());
        dispatch(getDesignationsAction());
        dispatch(getCountriesAction());
        dispatch(getCategoriesAction());
        dispatch(getBrandAction());
        dispatch(getAllProductsAction());
        dispatch(getMemberAction());
        dispatch(getEmployeesListingAction());
    }, [dispatch]);

    const apiToForm = useCallback((apiData: any, lookups: any): Partial<EmployeeFormSchema> => {
        const toOptions = (data: any[], labelKey = 'name', valueKey = 'id') => Array.isArray(data) ? data.map((item) => ({ value: String(item[valueKey]), label: item[labelKey] })) : [];
        const findOption = (options: { value: string, label: string }[], value: any) => options.find(o => String(o.value) === String(value)) || null;
        const findMultiOptions = (options: { value: string, label: string }[], values: any[]) => Array.isArray(values) ? options.filter(o => values.some(val => String(val) === String(o.value))) : [];
        const mapApiBoolToYesNo = (value: any): 'yes' | 'no' | '' => {
            if (value === true || value === 1 || value === '1') return 'yes';
            if (value === false || value === 0 || value === '0') return 'no';
            return '';
        };
        const commaStringToArray = (str: string | null | undefined): string[] => (str ? String(str).split(',') : []);

        const roleOptions = Array.isArray(lookups.Roles) ? lookups.Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [];
        const departmentOptions = toOptions(lookups.departmentsData?.data);
        const designationOptions = toOptions(lookups.designationsData?.data);
        const countryOptions = toOptions(lookups.CountriesData);
        const categoryOptions = toOptions(lookups.CategoriesData || []);
        const brandOptions = toOptions(lookups.BrandData || []);
        const productOptions = toOptions(lookups.AllProducts || []);
        const reportingHrOptions = toOptions(lookups.EmployeesList?.data?.data);
        const reportingHeadOptions = toOptions(lookups.memberData);

        return {
            id: String(apiData.id),
            registration: {
                fullName: apiData.name || '',
                dateOfJoining: apiData.date_of_joining ? new Date(apiData.date_of_joining) : null,
                mobileNumber: apiData.mobile_number || '',
                mobileNumberCode: { value: apiData.mobile_number_code || '', label: apiData.mobile_number_code || '' },
                email: apiData.email || '',
                experience: apiData.experience || '',
            },
            personalInformation: {
                status: { value: apiData.status || 'Active', label: apiData.status || 'Active' },
                dateOfBirth: apiData.date_of_birth ? new Date(apiData.date_of_birth) : null,
                age: apiData.age || '',
                gender: apiData.gender ? { value: apiData.gender, label: apiData.gender } : null,
                nationalityId: findOption(countryOptions, apiData.nationality_id),
                bloodGroup: apiData.blood_group ? { value: apiData.blood_group, label: apiData.blood_group } : null,
                permanentAddress: apiData.permanent_address || '',
                localAddress: apiData.local_address || '',
                maritalStatus: apiData.maritual_status ? { value: apiData.maritual_status, label: apiData.maritual_status } : null,
            },
            roleResponsibility: {
                roleId: findOption(roleOptions, apiData.role_id),
                departmentId: findMultiOptions(departmentOptions, commaStringToArray(apiData.department_id)),
                designationId: findOption(designationOptions, apiData.designation_id),
                countryId: findMultiOptions(countryOptions, commaStringToArray(apiData.country_id)),
                categoryId: findMultiOptions(categoryOptions, commaStringToArray(apiData.category_id)),
                subcategoryId: [],
                brandId: findMultiOptions(brandOptions, commaStringToArray(apiData.brand_id)),
                productServiceId: findMultiOptions(productOptions, commaStringToArray(apiData.product_service_id)),
                reportingHrId: findMultiOptions(reportingHrOptions, commaStringToArray(apiData.reporting_hr_id)),
                reportingHeadId: findOption(reportingHeadOptions, apiData.reporting_head_id),
            },
            documentSubmission: {
                profile_pic: apiData.profile_pic_path,
                identity_proof: apiData.identity_proof_path,
                address_proof: apiData.address_proof_path,
                educational_certificates: apiData.educational_certificates_path?.[0],
                experience_certificates: apiData.experience_certificates_path?.[0],
                offer_letter: apiData.offer_letter_path,
                past_offer_letter: apiData.past_offer_letter_path,
                relieving_letter: apiData.relieving_letter_path,
                designation_letter: apiData.designation_letter_path,
                salary_slips: apiData.salary_slips_path?.[0],
                bank_account_proof: apiData.bank_account_proof_path,
                pan_card: apiData.pan_card_path,
                passport_size_photograph: apiData.passport_size_photograph_path,
            },
            training: {
                inductionDateCompletion: apiData.training_date_of_completion ? new Date(apiData.training_date_of_completion) : null,
                inductionRemarks: apiData.training_remark || '',
                departmentTrainingDateCompletion: apiData.specific_training_date_of_completion ? new Date(apiData.specific_training_date_of_completion) : null,
                departmentTrainingRemarks: apiData.specific_training_remark || '',
            },
            offBoarding: {
                exit_interview_conducted: mapApiBoolToYesNo(apiData.exit_interview_conducted), exit_interview_remark: apiData.exit_interview_remark || '',
                resignation_letter_received: mapApiBoolToYesNo(apiData.resignation_letter_received), resignation_letter_remark: apiData.resignation_letter_remark || '',
                company_assets_returned: apiData.company_assets_returned || '', assets_returned_remarks: apiData.assets_returned_remarks || '',
                full_and_final_settlement: mapApiBoolToYesNo(apiData.full_and_final_settlement), fnf_remarks: apiData.fnf_remarks || '',
                notice_period_status: apiData.notice_period_status || '', notice_period_remarks: apiData.notice_period_remarks || '',
            },
            equipmentsAssetsProvided: {
                items: (apiData.assets || []).map((item: any) => ({ ...item, attachment: item.attachment_url || null })),
            },
        };
    }, []);

    useEffect(() => {
        const lookupsReady = lookups.CountriesData?.length > 0 && lookups.Roles?.length > 0 && lookups.departmentsData?.data?.length > 0;
        
        if (isEditMode && employeeId && lookupsReady) {
            if (initialData === null) { 
                setIsLoading(true);
                dispatch(apiGetEmployeeById(employeeId)).unwrap()
                    .then(actionResult => {
                        const apiData = actionResult?.data?.data;
                        if (apiData) {
                            setInitialData(apiToForm(apiData, lookups));
                        } else { throw new Error('Employee data not found.'); }
                    })
                    .catch(error => {
                        toast.push(<Notification type="danger" title="Error">Could not load employee details.</Notification>);
                        navigate('/hr-employees/employees');
                    })
                    .finally(() => setIsLoading(false));
            }
        } else if (!isEditMode) {
            setIsLoading(false);
            if (initialData === null) setInitialData({});
        }
    }, [employeeId, isEditMode, dispatch, navigate, apiToForm, initialData]);
    
    const handleFormSubmit = (formData: FormData, id?: string) => {
        setIsSubmitting(true);
        const action = isEditMode && id ? editEmployeesAction({ employeeId: id, data: formData }) : addEmployeesAction(formData);

        dispatch(action as any).unwrap()
            .then(() => {
                toast.push(<Notification title="Success" type="success">{`Employee ${isEditMode ? 'updated' : 'added'} successfully.`}</Notification>);
                navigate('/hr-employees/employees');
            })
            .catch((error: any) => { 
                const errorMessage = error?.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'create'} employee.`;
                toast.push(<Notification title="Error" type="danger">{errorMessage}</Notification>);
            })
            .finally(() => setIsSubmitting(false));
    };

    const onDiscardOpen = () => setDiscardConfirmationOpen(true);

    if (isLoading || !initialData) {
        return (
            <Container className="h-full">
                <div className="h-full flex flex-col items-center justify-center">
                    <Spinner size={40} />
                    <h3 className="mt-4">Loading Employee Data...</h3>
                </div>
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <EmployeeFormComponent
                isEdit={isEditMode}
                defaultValues={initialData}
                onFormSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                onDiscard={onDiscardOpen}
            />
            <ConfirmDialog
                isOpen={discardConfirmationOpen}
                type="danger"
                title="Discard changes"
                onClose={() => setDiscardConfirmationOpen(false)}
                onConfirm={() => { setDiscardConfirmationOpen(false); navigate('/hr-employees/employees'); }}
            >
                <p>Are you sure you want to discard your changes? This action cannot be undone.</p>
            </ConfirmDialog>
        </Container>
    );
};

export default EmployeeFormPage;