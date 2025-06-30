import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, useFieldArray, type Control, type FieldErrors, UseFormReturn } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/reduxtool/store';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
import dayjs from "dayjs";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";

// --- IMPORTS ---
import Container from '@/components/shared/Container';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, Button, Input, DatePicker, Select, Radio, Checkbox, FormItem, Spinner, Notification, toast } from '@/components/ui';
import { BiChevronRight } from 'react-icons/bi';
import { HiOutlineTrash } from 'react-icons/hi';
import { addEmployeesAction, editEmployeesAction, apiGetEmployeeById, getCategoriesAction } from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { 
    getRolesAction, getDepartmentsAction, getDesignationsAction, 
    getCountriesAction, getParentCategoriesAction, 
    getBrandAction, getAllProductsAction, getMemberAction, getReportingTo
} from '@/reduxtool/master/middleware';


// --- 1. TYPE DEFINITIONS ---
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
    personalInformation: { status: { label: string, value: string }; dateOfBirth: Date | null; age: number | string; gender: { label: string, value: string }; nationalityId: { label: string, value: string }; bloodGroup: { label: string, value: string }; permanentAddress: string; localAddress: string; maritalStatus: { label: string, value: string }; };
    roleResponsibility: { roleId: { label: string, value: string }; departmentId: { label: string, value: string }[]; designationId: { label: string, value: string }; countryId: { label: string, value: string }[]; categoryId: { label: string, value: string }[]; subcategoryId: { label: string, value: string }[]; brandId: { label: string, value: string }[]; productServiceId: { label: string, value: string }[]; reportingHrId: { label: string, value: string }[]; reportingHeadId: { label: string, value: string }; };
    training: { inductionDateCompletion: Date | null; inductionRemarks: string; departmentTrainingDateCompletion: Date | null; departmentTrainingRemarks: string; };
    offBoarding: { exit_interview_conducted: 'yes' | 'no' | ''; exit_interview_remark: string; resignation_letter_received: 'yes' | 'no' | ''; resignation_letter_remark: string; company_assets_returned: 'all' | 'partial' | 'none' | ''; assets_returned_remarks: string; full_and_final_settlement: 'yes' | 'no' | ''; fnf_remarks: string; notice_period_status: 'served' | 'waived' | ''; notice_period_remarks: string; };
    equipmentsAssetsProvided: { items: EquipmentItemFE[]; };
    documentSubmission: { [key: string]: File | string | null; profile_pic?: File | string | null; };
}
interface FormSectionBaseProps { control: Control<EmployeeFormSchema>; errors: FieldErrors<EmployeeFormSchema>; }
type FormSectionKey = keyof Omit<EmployeeFormSchema, 'id'>;


// --- 2. ZOD SCHEMA ---
const employeeFormValidationSchema = z.object({
    registration: z.object({
        fullName: z.string().min(1, 'Full Name is required'),
        dateOfJoining: z.date({ required_error: "Date of joining is required." }),
        mobileNumber: z.string().min(1, 'Mobile number is required').regex(/^\d{7,15}$/, "Invalid phone number"),
        mobileNumberCode: z.object({ label: z.string(), value: z.string() }, { required_error: "Country code is required." }),
        email: z.string().min(1, 'Email is required').email('Invalid email format'),
        experience: z.string().min(1, 'Experience is required'),
        password: z.string().optional(),
    }),
    personalInformation: z.object({
        status: z.object({ label: z.string(), value: z.string() }, { required_error: "Status is required." }),
        dateOfBirth: z.date({ required_error: "Date of birth is required." }).nullable(),
        age: z.union([z.string(), z.number()]).nullable(),
        gender: z.object({ label: z.string(), value: z.string() }).nullable(),
        nationalityId: z.object({ label: z.string(), value: z.string() }, { required_error: "Nationality is required." }).nullable(),
        bloodGroup: z.object({ label: z.string(), value: z.string() }).optional().nullable(),
        permanentAddress: z.string().nullable(),
        localAddress: z.string().optional().nullable(),
        maritalStatus: z.object({ label: z.string(), value: z.string() }).nullable(),
    }),
   
}).passthrough().refine(data => {
    // Conditionally require password only if it's NOT in edit mode (i.e., no ID)
    if (!data.id && (!data.registration.password || data.registration.password.length < 6)) {
      return false;
    }
    return true;
  }, {
    message: "Password is required and must be at least 6 characters for new employees",
    path: ["registration", "password"],
});


// --- 3. FORM SECTION & NAVIGATOR COMPONENTS ---
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
        .map((c: any) => ({
            value: `+${c.phone_code}`,
            label: `+${c.phone_code} (${c.name})`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) : [], [CountriesData]);

    return (
        <Card id="registration"><h4 className="mb-6">Registration</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormItem label={<>Full Name <span className="text-red-500">*</span></>} invalid={!!errors.registration?.fullName} errorMessage={errors.registration?.fullName?.message}><Controller name="registration.fullName" control={control} render={({ field }) => <Input placeholder="Enter full name" {...field} />} /></FormItem>
            <FormItem label={<>Date of Joining <span className="text-red-500">*</span></>} invalid={!!errors.registration?.dateOfJoining} errorMessage={errors.registration?.dateOfJoining?.message}><Controller name="registration.dateOfJoining" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label={<>Mobile Number <span className="text-red-500">*</span></>} invalid={!!errors.registration?.mobileNumber || !!(errors.registration as any)?.mobileNumberCode} errorMessage={errors.registration?.mobileNumber?.message || (errors.registration as any)?.mobileNumberCode?.message}>
                <div className='flex gap-2'><div className='w-1/3'><Controller name="registration.mobileNumberCode" control={control} render={({ field }) => <Select options={countryCodeOptions} placeholder="Code" {...field} />} /></div><div className='w-2/3'><Controller name="registration.mobileNumber" control={control} render={({ field }) => <Input type="tel" placeholder="9876543210" {...field} />} /></div></div></FormItem>
            <FormItem label={<>Email <span className="text-red-500">*</span></>} invalid={!!errors.registration?.email} errorMessage={errors.registration?.email?.message}><Controller name="registration.email" control={control} render={({ field }) => <Input type="email" placeholder="employee@company.com" {...field} />} /></FormItem>
            <FormItem label={<>Experience <span className="text-red-500">*</span></>} invalid={!!errors.registration?.experience} errorMessage={errors.registration?.experience?.message}><Controller name="registration.experience" control={control} render={({ field }) => <Input placeholder="e.g., 3 years" {...field} />} /></FormItem>
            {!isEditMode && (<FormItem label={<>Password <span className="text-red-500">*</span></>} invalid={!!errors.registration?.password} errorMessage={errors.registration?.password?.message}><Controller name="registration.password" control={control} render={({ field }) => <Input type="password" placeholder="Enter password" {...field} />} /></FormItem>)}
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
            <FormItem label="Status" invalid={!!errors.personalInformation?.status} errorMessage={errors.personalInformation?.status?.message}><Controller name="personalInformation.status" control={control} defaultValue={{ value: 'Active', label: 'Active' }} render={({ field }) => <Select placeholder="Select Status" options={statusOptions} {...field} />} /></FormItem>
            <FormItem label="Date of Birth" invalid={!!errors.personalInformation?.dateOfBirth} errorMessage={errors.personalInformation?.dateOfBirth?.message}><Controller name="personalInformation.dateOfBirth" control={control} render={({ field }) => <DatePicker placeholder="Select Date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Age" invalid={!!errors.personalInformation?.age} errorMessage={errors.personalInformation?.age?.message}><Controller name="personalInformation.age" control={control} render={({ field }) => <Input type="number" placeholder="Enter Age" {...field} onChange={e => field.onChange(parseInt(e.target.value) || '')} />} /></FormItem>
            <FormItem label="Gender" invalid={!!errors.personalInformation?.gender} errorMessage={errors.personalInformation?.gender?.message}><Controller name="personalInformation.gender" control={control} render={({ field }) => <Select placeholder="Select Gender" options={genderOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Marital Status" invalid={!!errors.personalInformation?.maritalStatus} errorMessage={errors.personalInformation?.maritalStatus?.message}><Controller name="personalInformation.maritalStatus" control={control} render={({ field }) => <Select placeholder="Select Marital Status" options={maritalStatusOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Nationality" invalid={!!errors.personalInformation?.nationalityId} errorMessage={errors.personalInformation?.nationalityId?.message}><Controller name="personalInformation.nationalityId" control={control} render={({ field }) => <Select placeholder="Select Nationality" options={nationalityOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Blood Group" invalid={!!errors.personalInformation?.bloodGroup} errorMessage={errors.personalInformation?.bloodGroup?.message}><Controller name="personalInformation.bloodGroup" control={control} render={({ field }) => <Select placeholder="Select Blood Group" options={bloodGroupOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Permanent Address" invalid={!!errors.personalInformation?.permanentAddress} errorMessage={errors.personalInformation?.permanentAddress?.message} className="md:col-span-2 lg:col-span-3"><Controller name="personalInformation.permanentAddress" control={control} render={({ field }) => <Input textArea placeholder="Enter Permanent Address" {...field} />} /></FormItem>
            <FormItem label="Local Address" invalid={!!errors.personalInformation?.localAddress} errorMessage={errors.personalInformation?.localAddress?.message} className="md:col-span-2 lg:col-span-3"><Controller name="personalInformation.localAddress" control={control} render={({ field }) => <Input textArea placeholder="Enter Local Address" {...field} />} /></FormItem>
        </div></Card>
    );
};

const DocumentSubmissionSection = ({ control, errors }: FormSectionBaseProps) => {
    const documentFields = [
        { name: 'profile_pic', label: "Profile Picture", accept: "image/*" },
        { name: 'identity_proof', label: "Identity Proof (e.g., Aadhaar, Passport)", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'address_proof', label: "Address Proof (e.g., Utility Bill)", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'educational_certificates', label: "Educational Certificates", accept: ".pdf,.zip" },
        { name: 'experience_certificates', label: "Experience Certificates", accept: ".pdf,.zip" },
        { name: 'offer_letter', label: "Offer Letter", accept: ".pdf" },
        { name: 'past_offer_letter', label: "Past Offer Letter(s)", accept: ".pdf,.zip" },
        { name: 'relieving_letter', label: "Relieving Letter", accept: ".pdf" },
        { name: 'designation_letter', label: "Designation Letter", accept: ".pdf" },
        { name: 'salary_slips', label: "Salary Slips (Last 3 Months)", accept: ".pdf,.zip" },
        { name: 'bank_account_proof', label: "Bank Account Proof", accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'pan_card', label: "PAN Card", accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'passport_size_photograph', label: "Passport Size Photograph", accept: ".jpg,.jpeg,.png" },
    ];
    
    return (
        <Card id="documentSubmission"><h4 className="mb-6">Document Submission</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
            {documentFields.map(doc => ( 
            <FormItem key={doc.name} label={<>{doc.label}{doc.required && <span className="text-red-500"> *</span>}</>} invalid={!!(errors.documentSubmission as any)?.[doc.name]} errorMessage={(errors.documentSubmission as any)?.[doc.name]?.message}>
                <Controller name={`documentSubmission.${doc.name}` as any} control={control} render={({ field: { onChange, value, ...rest } }) => {
                    const isImage = typeof value === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(value);
                    const isFileObject = value instanceof File;
                    return (
                        <div className="flex items-center gap-4">
                            <Input type="file" {...rest} accept={doc.accept} onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} />
                            { (isFileObject && value.type.startsWith('image/')) && <img src={URL.createObjectURL(value)} alt="Preview" className="w-16 h-16 rounded-md object-cover" /> }
                            { isImage && <img src={value} alt="Preview" className="w-16 h-16 rounded-md object-cover" /> }
                            { (typeof value === 'string' && !isImage) && <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View Document</a>}
                        </div>
                    )
                }} />
            </FormItem>
            ))}
        </div></Card>
    );
};

const RoleResponsibilitySection = ({ control, errors }: FormSectionBaseProps) => {
    const dispatch = useAppDispatch();
    const { Roles, departmentsData, designationsData, BrandData, CategoriesData, AllProducts, memberData, reportingTo, CountriesData } = useSelector(masterSelector);
    useEffect(() => {
        dispatch(getRolesAction()); dispatch(getDepartmentsAction()); dispatch(getDesignationsAction()); dispatch(getBrandAction());
        dispatch(getCategoriesAction()); dispatch(getAllProductsAction()); dispatch(getMemberAction()); dispatch(getReportingTo());
        dispatch(getCountriesAction());
    }, [dispatch]);

    
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
            <FormItem label="Role" invalid={!!errors.roleResponsibility?.roleId}><Controller name="roleResponsibility.roleId" control={control} render={({ field }) => <Select placeholder="Select Role" options={roleOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Department" invalid={!!errors.roleResponsibility?.departmentId}><Controller name="roleResponsibility.departmentId" control={control} render={({ field }) => <Select isMulti placeholder="Select Departments" options={departmentOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Designation" invalid={!!errors.roleResponsibility?.designationId}><Controller name="roleResponsibility.designationId" control={control} render={({ field }) => <Select placeholder="Select Designation" options={designationOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Country (Responsibility)" invalid={!!errors.roleResponsibility?.countryId}><Controller name="roleResponsibility.countryId" control={control} render={({ field }) => <Select isMulti placeholder="Select Countries" options={countryOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Category (Focus Area)" invalid={!!errors.roleResponsibility?.categoryId}><Controller name="roleResponsibility.categoryId" control={control} render={({ field }) => <Select isMulti placeholder="Select Categories" options={categoryOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Brand (Responsibility)" invalid={!!errors.roleResponsibility?.brandId}><Controller name="roleResponsibility.brandId" control={control} render={({ field }) => <Select isMulti placeholder="Select Brands" options={brandOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Product/Service (Focus)" invalid={!!errors.roleResponsibility?.productServiceId}><Controller name="roleResponsibility.productServiceId" control={control} render={({ field }) => <Select isMulti placeholder="Select Products" options={productOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Reporting HR" invalid={!!errors.roleResponsibility?.reportingHrId}><Controller name="roleResponsibility.reportingHrId" control={control} render={({ field }) => <Select isMulti placeholder="Select Reporting HR" options={reportingHrOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Reporting Head" invalid={!!errors.roleResponsibility?.reportingHeadId}><Controller name="roleResponsibility.reportingHeadId" control={control} render={({ field }) => <Select placeholder="Select Reporting Head" options={reportingHeadOptions} value={field.value} onChange={field.onChange} />} /></FormItem>
        </div></Card>
    );
};

const EquipmentsAssetsSection = ({ control, errors }: FormSectionBaseProps) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'equipmentsAssetsProvided.items' });
    const onAddAsset = () => append({ name: '', serial_no: '', remark: '', provided: true, attachment: null });
    return (
        <Card id="equipmentsAssetsProvided"><div className="flex justify-between items-center mb-6"><h4>Equipments & Assets Issued</h4><Button type="button" size="sm" onClick={onAddAsset}>Add Asset</Button></div>
            <div className="flex flex-col gap-y-6">
                {fields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md relative">
                        <Button shape="circle" size="sm" icon={<HiOutlineTrash />} className="absolute top-2 right-2" type="button" onClick={() => remove(index)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem label="Asset Name" invalid={!!errors.equipmentsAssetsProvided?.items?.[index]?.name} errorMessage={errors.equipmentsAssetsProvided?.items?.[index]?.name?.message}><Controller name={`equipmentsAssetsProvided.items.${index}.name`} control={control} render={({ field }) => <Input placeholder="e.g., Laptop" {...field} />} /></FormItem>
                            <FormItem label="Serial Number"><Controller name={`equipmentsAssetsProvided.items.${index}.serial_no`} control={control} render={({ field }) => <Input placeholder="e.g., DL12345XYZ" {...field} />} /></FormItem>
                            <FormItem label="Remark" className="md:col-span-2"><Controller name={`equipmentsAssetsProvided.items.${index}.remark`} control={control} render={({ field }) => <Input placeholder="e.g., New Dell Machine" {...field} />} /></FormItem>
                            <FormItem label="Attachment"><Controller name={`equipmentsAssetsProvided.items.${index}.attachment`} control={control} render={({ field: { onChange, value, ...rest } }) => {
                                const isImage = typeof value === 'string' && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(value);
                                const isFileObject = value instanceof File;
                                return (
                                    <div className='flex items-center gap-4'>
                                        <Input type="file" {...rest} onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} />
                                        {(isFileObject && value.type.startsWith('image/')) && <img src={URL.createObjectURL(value)} alt="Preview" className="w-16 h-16 rounded-md object-cover" /> }
                                        {isImage && <img src={value} alt="Preview" className="w-16 h-16 rounded-md object-cover" /> }
                                        {(typeof value === 'string' && !isImage) && <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View Doc</a>}
                                    </div>
                                )
                            }} /></FormItem>
                            <FormItem label="Provided?" className="flex items-center pt-6"><Controller name={`equipmentsAssetsProvided.items.${index}.provided`} control={control} render={({ field }) => (<Checkbox checked={field.value} onChange={field.onChange} />)} /></FormItem>
                        </div>
                    </div>
                ))}
                {fields.length === 0 && <p className="text-center text-gray-500">No assets added.</p>}
            </div></Card>
    );
};

const TrainingSection = ({ control, errors }: FormSectionBaseProps) => (
    <Card id="trainingInformation"><h4 className="mb-6">Training Information</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
        { key: 'exit_interview_conducted', label: 'Exit Interview Conducted?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], remarksKey: 'exit_interview_remark', remarksLabel: 'Remarks' },
        { key: 'resignation_letter_received', label: 'Resignation Letter Received?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], remarksKey: 'resignation_letter_remark', remarksLabel: 'Remarks' },
        { key: 'company_assets_returned', label: 'Company Assets Returned?', options: [{ value: 'all', label: 'All' }, { value: 'partial', label: 'Partial' }, { value: 'none', label: 'None' }], remarksKey: 'assets_returned_remarks', remarksLabel: 'Remarks' },
        { key: 'full_and_final_settlement', label: 'FNF Processed?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], remarksKey: 'fnf_remarks', remarksLabel: 'Remarks' },
    ];
    return (
        <Card id="offBoarding"><h4 className="mb-6">Off-Boarding Process</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {config.map((item) => (
                <div key={item.key} className="flex flex-col gap-y-4">
                    <FormItem label={item.label} invalid={!!(errors.offBoarding as any)?.[item.key]} errorMessage={(errors.offBoarding as any)?.[item.key]?.message}><Controller name={`offBoarding.${item.key as 'exit_interview_conducted'}`} control={control} render={({ field }) => <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">{item.options.map((opt) => (<Radio key={opt.value} {...field} value={opt.value} checked={field.value === opt.value}>{opt.label}</Radio>))}</div>} /></FormItem>
                    <FormItem label={item.remarksLabel} invalid={!!(errors.offBoarding as any)?.[item.remarksKey]} errorMessage={(errors.offBoarding as any)?.[item.remarksKey]?.message}><Controller name={`offBoarding.${item.remarksKey as 'exit_interview_remark'}`} control={control} render={({ field }) => <Input textArea placeholder="Enter remarks..." {...field} />} /></FormItem>
                </div>
            ))}
        </div></Card>
    );
};

// --- 4. CORE FORM COMPONENT ---
const sectionKeys: FormSectionKey[] = ['registration', 'personalInformation', 'documentSubmission', 'roleResponsibility', 'training', 'equipmentsAssetsProvided', 'offBoarding'];
interface EmployeeFormProps { onFormSubmit: (data: FormData, id?: string) => void; defaultValues?: Partial<EmployeeFormSchema>; isEdit?: boolean; isSubmitting?: boolean; onDiscard: () => void; }

const EmployeeFormComponent = ({ onFormSubmit, defaultValues, isEdit = false, isSubmitting = false, onDiscard }: EmployeeFormProps) => {
    const [activeSection, setActiveSection] = useState<FormSectionKey>('registration');
    const activeSectionIndex = sectionKeys.indexOf(activeSection);
    const { handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeFormSchema>({
        defaultValues: defaultValues || {},
        resolver: zodResolver(employeeFormValidationSchema)
    });

    const internalFormSubmit = (values: EmployeeFormSchema) => {
        const formData = new FormData();
        const formatDate = (date: Date | null) => date ? dayjs(date).format('YYYY-MM-DD') : '';
        const arrayToCommaString = (arr: any[] | undefined) => (arr || []).map(item => item.value).join(',');
        const objToValue = (obj: any) => obj?.value || '';

        if (isEdit && defaultValues?.id) {
            formData.append('_method', "PUT");
            formData.append('employee_id', defaultValues.id);
        }

        formData.append('name', values.registration?.fullName || '');
        formData.append('date_of_joining', formatDate(values.registration?.dateOfJoining));
        formData.append('mobile_number', values.registration?.mobileNumber || '');
        formData.append('mobile_number_code', objToValue(values.registration?.mobileNumberCode));
        formData.append('email', values.registration?.email || '');
        formData.append('experience', values.registration?.experience || '');
        if (!isEdit && values.registration.password) formData.append('password', values.registration.password);
        
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
            if (file instanceof File) {
                formData.append(key, file);
            }
        });

        formData.append('training_date_of_completion', formatDate(values.training?.inductionDateCompletion));
        formData.append('training_remark', values.training?.inductionRemarks || '');
        formData.append('specific_training_date_of_completion', formatDate(values.training?.departmentTrainingDateCompletion));
        formData.append('specific_training_remark', values.training?.departmentTrainingRemarks || '');

        const yesNoToBoolString = (value: 'yes' | 'no' | '') => String(Number(value === 'yes'));
        formData.append('exit_interview_conducted', yesNoToBoolString(values.offBoarding?.exit_interview_conducted));
        formData.append('resignation_letter_received', yesNoToBoolString(values.offBoarding?.resignation_letter_received));
        formData.append('full_and_final_settlement', yesNoToBoolString(values.offBoarding?.full_and_final_settlement));
        formData.append('exit_interview_remark', values.offBoarding?.exit_interview_remark || '');
        formData.append('resignation_letter_remark', values.offBoarding?.resignation_letter_remark || '');
        formData.append('company_assets_returned', values.offBoarding?.company_assets_returned || '');
        formData.append('assets_returned_remarks', values.offBoarding?.assets_returned_remarks || '');
        formData.append('fnf_remarks', values.offBoarding?.fnf_remarks || '');

        if (values.equipmentsAssetsProvided?.items) {
            const equipmentDataForJson = values.equipmentsAssetsProvided.items.map(item => ({ name: item.name, serial_no: item.serial_no, remark: item.remark, provided: item.provided }));
            formData.append('equipments_assets_issued', JSON.stringify(equipmentDataForJson));
            values.equipmentsAssetsProvided.items.forEach((item, index) => {
                if (item.attachment instanceof File) {
                    formData.append(`equipment_attachment_${index}`, item.attachment);
                }
            });
        }
        
        onFormSubmit(formData, defaultValues?.id);
    };

    const renderActiveSection = () => {
        const sectionProps = { control, errors };
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
        <form onSubmit={handleSubmit(internalFormSubmit, (err) => console.log("Form Validation Errors:", err))} className="h-full">
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
                            <Button variant="solid" type="submit" loading={isSubmitting} disabled={isSubmitting}>{isEdit ? "Update" : "Create"}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};


// --- 5. PAGE-LEVEL COMPONENT ---
const EmployeeFormPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id:employeeId } = useParams<{ id: string }>();
    const isEditMode = !!employeeId;

    const [employeeData, setEmployeeData] = useState<Partial<EmployeeFormSchema> | null>(null);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);

    const lookups = useSelector(masterSelector);
    
    useEffect(() => {
        dispatch(getRolesAction());
        dispatch(getDepartmentsAction());
        dispatch(getDesignationsAction());
        dispatch(getCountriesAction());
        dispatch(getParentCategoriesAction());
        dispatch(getBrandAction());
        dispatch(getAllProductsAction());
        dispatch(getMemberAction());
        dispatch(getReportingTo());
    }, [dispatch]);

    useEffect(() => {
     
        const apiToForm = (apiData: any): Partial<EmployeeFormSchema> => {
            const findOption = (options: {value:string, label:string}[], value: any) => options.find(o => String(o.value) === String(value));
            const findMultiOptions = (options: {value:string, label:string}[], values: any[]) => Array.isArray(values) ? options.filter(o => values.includes(String(o.value))) : [];
            const toOptions = (data: any, labelKey = 'name', valueKey = 'id') => Array.isArray(data) ? data.map((item) => ({ value: String(item[valueKey]), label: item[labelKey] })) : [];
            const mapApiBoolToYesNo = (value: any): 'yes' | 'no' | '' => {
                if (value === true || value === 1 || value === '1') return 'yes';
                if (value === false || value === 0 || value === '0') return 'no';
                return '';
            };

            const roleOptions = Array.isArray(lookups.Roles) ? lookups.Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [];
            const departmentOptions = toOptions(lookups.departmentsData?.data);
            const designationOptions = toOptions(lookups.designationsData?.data);
            const countryOptions = toOptions(lookups.CountriesData);
            const categoryOptions = toOptions(lookups.ParentCategories?.data);
            const brandOptions = toOptions(lookups.BrandData);
            const productOptions = toOptions(lookups.AllProducts);
            const reportingHrOptions = toOptions(lookups.reportingTo?.data);
            const reportingHeadOptions = toOptions(lookups.memberData?.data?.data || lookups.memberData?.data);
            
            const commaStringToArray = (str: string | null | undefined): string[] => (str ? String(str).split(',') : []);

            return {
                id: apiData.id,
                registration: {
                    fullName: apiData.name || '',
                    dateOfJoining: apiData.date_of_joining ? new Date(apiData.date_of_joining) : null,
                    mobileNumber: apiData.mobile_number || '',
                    mobileNumberCode: { value: apiData.mobile_number_code || '+91', label: apiData.mobile_number_code || '+91' },
                    email: apiData.email || '',
                    experience: apiData.experience || '',
                },
                personalInformation: {
                    status: { value: apiData.status || 'Active', label: apiData.status || 'Active' },
                    dateOfBirth: apiData.date_of_birth ? new Date(apiData.date_of_birth) : null,
                    age: apiData.age || '',
                    gender: { value: apiData.gender || '', label: apiData.gender || '' },
                    nationalityId: findOption(countryOptions, apiData.nationality_id),
                    bloodGroup: { value: apiData.blood_group || '', label: apiData.blood_group || '' },
                    permanentAddress: apiData.permanent_address || '',
                    localAddress: apiData.local_address || '',
                    maritalStatus: { value: apiData.maritual_status || '', label: apiData.maritual_status || '' },
                },
                roleResponsibility: {
                    roleId: findOption(roleOptions, apiData.role_id),
                    departmentId: findMultiOptions(departmentOptions, commaStringToArray(apiData.department_id)),
                    designationId: findOption(designationOptions, apiData.designation_id),
                    countryId: findMultiOptions(countryOptions, commaStringToArray(apiData.country_id)),
                    categoryId: findMultiOptions(categoryOptions, commaStringToArray(apiData.category_id)),
                    subcategoryId: [], // Subcategory needs parent category to be fetched first
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
            return transformed;
        };
        
        const fetchCompanyData = async () => {
            if (isEditMode && employeeId) {
                setIsLoading(true);
                const actionResult = await dispatch(apiGetEmployeeById(employeeId)).unwrap();
                console.log(actionResult, 'actionResult');
                
                try {
                    if (actionResult) {
                        setEmployeeData(apiToForm(actionResult?.data?.data))
                        setIsLoading(false)
                    } else if (!isEditMode) {
                        setEmployeeData({});
                        setIsLoading(false);
                    }
                } catch {

                }
            }
        };
        fetchCompanyData();
    }, [employeeId]);

    const handleFormSubmit = (formData: FormData, id?: string) => {
        setIsSubmitting(true);
        const action = isEditMode && id ? editEmployeesAction({ employeeId: id, data: formData }) : addEmployeesAction(formData);

        (dispatch(action) as any).unwrap()
            .then((res: any) => {
                if (res.status) {
                    toast.push(<Notification title="Success" type="success">{`Employee ${isEditMode ? 'updated' : 'added'} successfully.`}</Notification>);
                    navigate('/hr-employees/employees');
                } else {
                    toast.push(<Notification title="Error" type="danger" duration={5000}>{JSON.stringify(res?.errors) || 'Submission failed'}</Notification>);
                }
            })
            .catch((err: any) => { toast.push(<Notification title="Error" type="danger">{err.message || 'An error occurred.'}</Notification>); })
            .finally(() => setIsSubmitting(false));
    };

    const onDiscardOpen = () => setDiscardConfirmationOpen(true);
    const onDiscardClose = () => setDiscardConfirmationOpen(false);
    const handleDiscardConfirm = () => {
        onDiscardClose();
        navigate('/hr-employees/employees');
    };

    if (isLoading || (isEditMode && !employeeData)) {
        return <Container className="h-full"><div className="h-full flex flex-col items-center justify-center"><Spinner size={40} /><h3>Loading Employee Data...</h3></div></Container>;
    }

    return (
        <Container className="h-full">
            {employeeData && (
                <EmployeeFormComponent 
                    isEdit={isEditMode} 
                    defaultValues={employeeData} 
                    onFormSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    onDiscard={onDiscardOpen}
                />
            )}
            <ConfirmDialog
                isOpen={discardConfirmationOpen}
                type="danger"
                title="Discard changes"
                onClose={onDiscardClose}
                onRequestClose={onDiscardClose}
                onCancel={onDiscardClose}
                onConfirm={handleDiscardConfirm}
            >
                <p>Are you sure you want to discard your changes? This action cannot be undone.</p>
            </ConfirmDialog>
        </Container>
    );
};

export default EmployeeFormPage;