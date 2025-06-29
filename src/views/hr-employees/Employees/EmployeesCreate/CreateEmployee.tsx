import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/reduxtool/store';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

// --- IMPORTS ---
import Container from '@/components/shared/Container';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, Form, Button, Input, DatePicker, Select, Radio, Checkbox, FormItem, Spinner, Notification, toast } from '@/components/ui';
import { BiChevronRight } from 'react-icons/bi';
import { HiOutlineTrash } from 'react-icons/hi';
import { addEmployeesAction, editEmployeesAction, apiGetEmployeeById } from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { 
    getRolesAction, getDepartmentsAction, getDesignationsAction, 
    getCountriesAction, getParentCategoriesAction, 
    getBrandAction, getAllProductsAction, getMemberAction, getReportingTo
} from '@/reduxtool/master/middleware';


// --- 1. TYPE DEFINITIONS ---
interface EmployeeFormSchema {
    id?: string;
    registration: { fullName: string; dateOfJoining: Date | null; mobileNumber: string; mobileNumberCode: string; email: string; experience: string; password?: string; };
    personalInformation: { status: string; dateOfBirth: Date | null; age: number | string; gender: string; nationalityId: number | string; bloodGroup: string; permanentAddress: string; localAddress: string; maritalStatus: string; };
    roleResponsibility: { roleId: string; departmentId: string[]; designationId: string; countryId: string[]; categoryId: string[]; subcategoryId: string[]; brandId: string[]; productServiceId: string[]; reportingHrId: string[]; reportingHeadId: string; };
    training: { inductionDateCompletion: Date | null; inductionRemarks: string; departmentTrainingDateCompletion: Date | null; departmentTrainingRemarks: string; };
    offBoarding: { exit_interview_conducted: 'yes' | 'no' | ''; exit_interview_remark: string; resignation_letter_received: 'yes' | 'no' | ''; resignation_letter_remark: string; company_assets_returned: 'all' | 'partial' | 'none' | ''; assets_returned_remarks: string; full_and_final_settlement: 'yes' | 'no' | ''; fnf_remarks: string; notice_period_status: 'served' | 'waived' | ''; notice_period_remarks: string; };
    equipmentsAssetsProvided: { items: { name: string; serial_no: string; remark: string; provided: boolean; attachment: FileList | null; attachment_url?: string; }[]; };
    documentSubmission: { [key: string]: FileList | null; profile_pic?: FileList | null; };
}
interface FormSectionBaseProps { control: Control<EmployeeFormSchema>; errors: FieldErrors<EmployeeFormSchema>; }
type FormSectionKey = keyof Omit<EmployeeFormSchema, 'id'>;


// --- 2. FORM SECTION & NAVIGATOR COMPONENTS ---
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
    return (
        <Card id="registration"><h4 className="mb-6">Registration</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormItem label="Full Name *" invalid={!!errors.registration?.fullName} errorMessage={errors.registration?.fullName?.message}><Controller name="registration.fullName" control={control} rules={{ required: 'Full Name is required' }} render={({ field }) => <Input placeholder="Enter full name" {...field} />} /></FormItem>
            <FormItem label="Date of Joining *" invalid={!!errors.registration?.dateOfJoining} errorMessage={errors.registration?.dateOfJoining?.message}><Controller name="registration.dateOfJoining" control={control} rules={{ required: 'Date of Joining is required' }} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Mobile Number *" invalid={!!errors.registration?.mobileNumber} errorMessage={errors.registration?.mobileNumber?.message}><Controller name="registration.mobileNumber" control={control} rules={{ required: 'Mobile Number is required' }} render={({ field }) => <Input type="tel" placeholder="9876543210" {...field} />} /></FormItem>
            <FormItem label="Email *" invalid={!!errors.registration?.email} errorMessage={errors.registration?.email?.message}><Controller name="registration.email" control={control} rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } }} render={({ field }) => <Input type="email" placeholder="employee@company.com" {...field} />} /></FormItem>
            <FormItem label="Experience *" invalid={!!errors.registration?.experience} errorMessage={errors.registration?.experience?.message}><Controller name="registration.experience" control={control} rules={{ required: 'Experience is required' }} render={({ field }) => <Input placeholder="e.g., 3 years" {...field} />} /></FormItem>
            {!isEditMode && (<FormItem label="Password *" invalid={!!errors.registration?.password} errorMessage={errors.registration?.password?.message}><Controller name="registration.password" control={control} rules={{ required: 'Password is required for new employees' }} render={({ field }) => <Input type="password" placeholder="Enter password" {...field} />} /></FormItem>)}
        </div></Card>
    );
};

const PersonalInformationSection = ({ control, errors }: FormSectionBaseProps) => {
    const dispatch = useAppDispatch();
    const { CountriesData = [] } = useSelector(masterSelector);
    useEffect(() => { if (!Array.isArray(CountriesData) || CountriesData.length === 0) dispatch(getCountriesAction()); }, [dispatch, CountriesData]);
    const nationalityOptions = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((c: any) => ({ value: c.id, label: c.name })) : [], [CountriesData]);
    const statusOptions = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];
    const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
    const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'B+', label: 'B+' }, { value: 'O+', label: 'O+' }, { value: 'A-', label: 'A-' }, { value: 'B-', label: 'B-' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }, { value: 'Other', label: 'Other' }];
    const maritalStatusOptions = [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }];
    return (
        <Card id="personalInformation"><h4 className="mb-6">Personal Information</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormItem label="Status *" invalid={!!errors.personalInformation?.status} errorMessage={errors.personalInformation?.status?.message}><Controller name="personalInformation.status" control={control} rules={{ required: 'Status is required' }} render={({ field }) => <Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Date of Birth *" invalid={!!errors.personalInformation?.dateOfBirth} errorMessage={errors.personalInformation?.dateOfBirth?.message}><Controller name="personalInformation.dateOfBirth" control={control} rules={{ required: 'Date of Birth is required' }} render={({ field }) => <DatePicker placeholder="Select Date" value={field.value} onChange={field.onChange} />} /></FormItem>
            <FormItem label="Age *" invalid={!!errors.personalInformation?.age} errorMessage={errors.personalInformation?.age?.message}><Controller name="personalInformation.age" control={control} rules={{ required: 'Age is required' }} render={({ field }) => <Input type="number" placeholder="Enter Age" {...field} onChange={e => field.onChange(parseInt(e.target.value) || '')} />} /></FormItem>
            <FormItem label="Gender *" invalid={!!errors.personalInformation?.gender} errorMessage={errors.personalInformation?.gender?.message}><Controller name="personalInformation.gender" control={control} rules={{ required: 'Gender is required' }} render={({ field }) => <Select placeholder="Select Gender" options={genderOptions} value={genderOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Marital Status" invalid={!!errors.personalInformation?.maritalStatus} errorMessage={errors.personalInformation?.maritalStatus?.message}><Controller name="personalInformation.maritalStatus" control={control} render={({ field }) => <Select placeholder="Select Marital Status" options={maritalStatusOptions} value={maritalStatusOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Nationality *" invalid={!!errors.personalInformation?.nationalityId} errorMessage={errors.personalInformation?.nationalityId?.message}><Controller name="personalInformation.nationalityId" control={control} rules={{ required: 'Nationality is required' }} render={({ field }) => <Select placeholder="Select Nationality" options={nationalityOptions} value={nationalityOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Blood Group" invalid={!!errors.personalInformation?.bloodGroup} errorMessage={errors.personalInformation?.bloodGroup?.message}><Controller name="personalInformation.bloodGroup" control={control} render={({ field }) => <Select placeholder="Select Blood Group" options={bloodGroupOptions} value={bloodGroupOptions.find(c => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Permanent Address *" invalid={!!errors.personalInformation?.permanentAddress} errorMessage={errors.personalInformation?.permanentAddress?.message} className="md:col-span-2 lg:col-span-3"><Controller name="personalInformation.permanentAddress" control={control} rules={{ required: 'Permanent Address is required' }} render={({ field }) => <Input textArea placeholder="Enter Permanent Address" {...field} />} /></FormItem>
            <FormItem label="Local Address" invalid={!!errors.personalInformation?.localAddress} errorMessage={errors.personalInformation?.localAddress?.message} className="md:col-span-2 lg:col-span-3"><Controller name="personalInformation.localAddress" control={control} render={({ field }) => <Input textArea placeholder="Enter Local Address" {...field} />} /></FormItem>
        </div></Card>
    );
};

const DocumentSubmissionSection = ({ control, errors }: FormSectionBaseProps) => {
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const documentFields = [
        { name: 'profile_pic', label: "Profile Picture", required: true, accept: "image/*" }, { name: 'identity_proof', label: "Identity Proof", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
        { name: 'address_proof', label: "Address Proof", required: true, accept: ".pdf,.jpg,.jpeg,.png" }, { name: 'educational_certificates', label: "Educational Certificates", required: true, accept: ".pdf,.zip" },
        { name: 'experience_certificates', label: "Experience Certificates", accept: ".pdf,.zip" }, { name: 'relieving_letter', label: "Relieving Letter", accept: ".pdf" },
    ];
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, rhfOnChange: (files: FileList | null) => void) => {
        const files = e.target.files;
        rhfOnChange(files);
        if (files && files[0] && files[0].type.startsWith("image/")) { const newPreviewUrl = URL.createObjectURL(files[0]); setPreviews(prev => ({ ...prev, [fieldName]: newPreviewUrl }));
        } else { setPreviews(prev => ({ ...prev, [fieldName]: '' })); }
    };
    useEffect(() => () => { Object.values(previews).forEach(URL.revokeObjectURL); }, [previews]);
    return (
        <Card id="documentSubmission"><h4 className="mb-6">Document Submission</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
            {documentFields.map(doc => ( <FormItem key={doc.name} label={<div>{doc.label}{doc.required && <span className="text-red-500"> *</span>}</div>} invalid={!!errors.documentSubmission?.[doc.name as keyof {}]} errorMessage={errors.documentSubmission?.[doc.name as keyof {}]?.message}>
                <div className="flex items-center gap-4">
                    <Controller name={`documentSubmission.${doc.name}` as any} control={control} rules={{ required: doc.required ? `${doc.label} is required` : false }} render={({ field: { onChange, onBlur, name, ref } }) => <Input type="file" name={name} ref={ref} onBlur={onBlur} accept={doc.accept} onChange={(e) => handleFileChange(e, doc.name, onChange)} />} />
                    {previews[doc.name] && <img src={previews[doc.name]} alt="Preview" className="w-16 h-16 rounded-md object-cover" />}
                </div></FormItem>
            ))}
        </div></Card>
    );
};

const RoleResponsibilitySection = ({ control, errors }: FormSectionBaseProps) => {
    const dispatch = useAppDispatch();
    const { Roles, departmentsData, designationsData, BrandData, ParentCategories, AllProducts, memberData, reportingTo } = useSelector(masterSelector);
    useEffect(() => {
        dispatch(getRolesAction()); dispatch(getDepartmentsAction()); dispatch(getDesignationsAction()); dispatch(getBrandAction());
        dispatch(getParentCategoriesAction()); dispatch(getAllProductsAction()); dispatch(getMemberAction()); dispatch(getReportingTo());
    }, [dispatch]);
    const toOptions = (data: any, labelKey = 'name', valueKey = 'id') => Array.isArray(data) ? data.map((item) => ({ value: String(item[valueKey]), label: item[labelKey] })) : [];
    const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
    const departmentOptions = useMemo(() => toOptions(departmentsData?.data), [departmentsData]);
    const designationOptions = useMemo(() => toOptions(designationsData?.data), [designationsData]);
    const categoryOptions = useMemo(() => toOptions(ParentCategories?.data), [ParentCategories]);
    const brandOptions = useMemo(() => toOptions(BrandData), [BrandData]);
    const productOptions = useMemo(() => toOptions(AllProducts), [AllProducts]);
    const reportingHrOptions = useMemo(() => toOptions(reportingTo?.data), [reportingTo]);
    const reportingHeadOptions = useMemo(() => toOptions(memberData?.data?.data || memberData?.data), [memberData]);
    const findMultiSelectValues = (options: any[], values: any) => Array.isArray(values) ? options.filter(option => values.includes(String(option.value))) : [];
    return (
        <Card id="roleResponsibility"><h4 className="mb-6">Role & Responsibility</h4><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <FormItem label="Role *" invalid={!!errors.roleResponsibility?.roleId}><Controller name="roleResponsibility.roleId" control={control} rules={{ required: 'Role is required' }} render={({ field }) => <Select placeholder="Select Role" options={roleOptions} value={roleOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Department *" invalid={!!errors.roleResponsibility?.departmentId}><Controller name="roleResponsibility.departmentId" control={control} rules={{ required: 'Department is required' }} render={({ field }) => <Select isMulti placeholder="Select Departments" options={departmentOptions} value={findMultiSelectValues(departmentOptions, field.value)} onChange={opts => field.onChange(opts.map(o => o.value))} />} /></FormItem>
            <FormItem label="Designation *" invalid={!!errors.roleResponsibility?.designationId}><Controller name="roleResponsibility.designationId" control={control} rules={{ required: 'Designation is required' }} render={({ field }) => <Select placeholder="Select Designation" options={designationOptions} value={designationOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem>
            <FormItem label="Category (Focus Area)" invalid={!!errors.roleResponsibility?.categoryId}><Controller name="roleResponsibility.categoryId" control={control} render={({ field }) => <Select isMulti placeholder="Select Categories" options={categoryOptions} value={findMultiSelectValues(categoryOptions, field.value)} onChange={opts => field.onChange(opts.map(o => o.value))} />} /></FormItem>
            <FormItem label="Brand (Responsibility)" invalid={!!errors.roleResponsibility?.brandId}><Controller name="roleResponsibility.brandId" control={control} render={({ field }) => <Select isMulti placeholder="Select Brands" options={brandOptions} value={findMultiSelectValues(brandOptions, field.value)} onChange={opts => field.onChange(opts.map(o => o.value))} />} /></FormItem>
            <FormItem label="Product/Service (Focus)" invalid={!!errors.roleResponsibility?.productServiceId}><Controller name="roleResponsibility.productServiceId" control={control} render={({ field }) => <Select isMulti placeholder="Select Products" options={productOptions} value={findMultiSelectValues(productOptions, field.value)} onChange={opts => field.onChange(opts.map(o => o.value))} />} /></FormItem>
            <FormItem label="Reporting HR *" invalid={!!errors.roleResponsibility?.reportingHrId}><Controller name="roleResponsibility.reportingHrId" control={control} rules={{ required: 'Reporting HR is required' }} render={({ field }) => <Select isMulti placeholder="Select Reporting HR" options={reportingHrOptions} value={findMultiSelectValues(reportingHrOptions, field.value)} onChange={opts => field.onChange(opts.map(o => o.value))} />} /></FormItem>
            <FormItem label="Reporting Head *" invalid={!!errors.roleResponsibility?.reportingHeadId}><Controller name="roleResponsibility.reportingHeadId" control={control} rules={{ required: 'Reporting Head is required' }} render={({ field }) => <Select placeholder="Select Reporting Head" options={reportingHeadOptions} value={reportingHeadOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem>
        </div></Card>
    );
};

const EquipmentsAssetsSection = ({ control, errors }: FormSectionBaseProps) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'equipmentsAssetsProvided.items' });
    const onAddAsset = () => append({ name: '', serial_no: '', remark: '', provided: true, attachment: null, attachment_url: '' });
    return (
        <Card id="equipmentsAssetsProvided"><div className="flex justify-between items-center mb-6"><h4>Equipments & Assets Issued</h4><Button type="button" size="sm" onClick={onAddAsset}>Add Asset</Button></div>
        <div className="flex flex-col gap-y-6">
            {fields.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-md relative">
                    <Button shape="circle" size="sm" icon={<HiOutlineTrash />} className="absolute top-2 right-2" type="button" onClick={() => remove(index)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem label="Asset Name *" invalid={!!errors.equipmentsAssetsProvided?.items?.[index]?.name} errorMessage={errors.equipmentsAssetsProvided?.items?.[index]?.name?.message}><Controller name={`equipmentsAssetsProvided.items.${index}.name`} control={control} rules={{ required: 'Asset name is required' }} render={({ field }) => <Input placeholder="e.g., Laptop" {...field} />} /></FormItem>
                        <FormItem label="Serial Number"><Controller name={`equipmentsAssetsProvided.items.${index}.serial_no`} control={control} render={({ field }) => <Input placeholder="e.g., DL12345XYZ" {...field} />} /></FormItem>
                        <FormItem label="Remark" className="md:col-span-2"><Controller name={`equipmentsAssetsProvided.items.${index}.remark`} control={control} render={({ field }) => <Input placeholder="e.g., New Dell Machine" {...field} />} /></FormItem>
                        <FormItem label="Attachment"><Controller name={`equipmentsAssetsProvided.items.${index}.attachment`} control={control} render={({ field: { onChange, onBlur, name, ref } }) => <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e) => onChange(e.target.files)} />} />{item.attachment_url && <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">View attachment</a>}</FormItem>
                        <FormItem label="Provided?" className="flex items-center pt-6"><Controller name={`equipmentsAssetsProvided.items.${index}.provided`} control={control} render={({ field }) => ( <Checkbox checked={field.value} onChange={field.onChange} /> )} /></FormItem>
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
        { key: 'exit_interview_conducted', label: 'Exit Interview Conducted?', options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}], remarksKey: 'exit_interview_remark', remarksLabel: 'Remarks' },
        { key: 'resignation_letter_received', label: 'Resignation Letter Received?', options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}], remarksKey: 'resignation_letter_remark', remarksLabel: 'Remarks' },
        { key: 'company_assets_returned', label: 'Company Assets Returned?', options: [{value: 'all', label: 'All'}, {value: 'partial', label: 'Partial'}, {value: 'none', label: 'None'}], remarksKey: 'assets_returned_remarks', remarksLabel: 'Remarks' },
        { key: 'full_and_final_settlement', label: 'FNF Processed?', options: [{value: 'yes', label: 'Yes'}, {value: 'no', label: 'No'}], remarksKey: 'fnf_remarks', remarksLabel: 'Remarks' },
    ];
    return (
        <Card id="offBoarding"><h4 className="mb-6">Off-Boarding Process</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {config.map((item) => (
                <div key={item.key} className="flex flex-col gap-y-4">
                    <FormItem label={item.label} invalid={!!errors.offBoarding?.[item.key as keyof {}]} errorMessage={errors.offBoarding?.[item.key as keyof {}]?.message}><Controller name={`offBoarding.${item.key as 'exit_interview_conducted'}`} control={control} render={({ field }) => <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">{item.options.map((opt) => ( <Radio key={opt.value} {...field} value={opt.value} checked={field.value === opt.value}>{opt.label}</Radio>))}</div>} /></FormItem>
                    <FormItem label={item.remarksLabel} invalid={!!errors.offBoarding?.[item.remarksKey as keyof {}]} errorMessage={errors.offBoarding?.[item.remarksKey as keyof {}]?.message}><Controller name={`offBoarding.${item.remarksKey as 'exit_interview_remark'}`} control={control} render={({ field }) => <Input textArea placeholder="Enter remarks..." {...field} />} /></FormItem>
                </div>
            ))}
        </div></Card>
    );
};

// --- 3. CORE FORM COMPONENT ---
const sectionKeys: FormSectionKey[] = ['registration', 'personalInformation', 'documentSubmission', 'roleResponsibility', 'training', 'equipmentsAssetsProvided', 'offBoarding'];
interface EmployeeFormProps { onFormSubmit: (data: FormData, id?: string) => void; defaultValues?: Partial<EmployeeFormSchema>; isEdit?: boolean; isSubmitting?: boolean; onDiscard: () => void; }

const EmployeeForm = ({ onFormSubmit, defaultValues, isEdit = false, isSubmitting = false, onDiscard }: EmployeeFormProps) => {
    const [activeSection, setActiveSection] = useState<FormSectionKey>('registration');
    const activeSectionIndex = sectionKeys.indexOf(activeSection);
    const { handleSubmit, reset, control, formState: { errors } } = useForm<EmployeeFormSchema>({ defaultValues: defaultValues || {} });

    useEffect(() => { if (!isEmpty(defaultValues)) reset(defaultValues) }, [defaultValues, reset]);

    const internalFormSubmit = (values: EmployeeFormSchema) => {
        const formData = new FormData();
        const formatDate = (date: Date | null) => date ? new Date(date).toISOString().split('T')[0] : '';
        const arrayToCommaString = (arr: any[] | undefined) => (arr || []).join(',');

        formData.append('employee_id', defaultValues?.id || '');
        formData.append('name', values.registration?.fullName || '');
        formData.append('date_of_joining', formatDate(values.registration?.dateOfJoining));
        formData.append('mobile_number', values.registration?.mobileNumber || '');
        formData.append('mobile_number_code', values.registration?.mobileNumberCode || '+91');
        formData.append('email', values.registration?.email || '');
        formData.append('experience', values.registration?.experience || '');
        if (!isEdit && values.registration.password) formData.append('password', values.registration.password);
        
        Object.entries(values.personalInformation || {}).forEach(([key, value]) => formData.append(key, key === 'dateOfBirth' ? formatDate(value as Date) : String(value ?? '')));
        Object.entries(values.roleResponsibility || {}).forEach(([key, value]) => formData.append(key, Array.isArray(value) ? arrayToCommaString(value) : String(value ?? '')));

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

        if (values.documentSubmission) {
            Object.keys(values.documentSubmission).forEach(key => {
                const fileList = values.documentSubmission[key as keyof {}];
                if (fileList && fileList[0]) formData.append(key, fileList[0]);
            });
        }
        
        if (values.equipmentsAssetsProvided?.items) {
            const equipmentDataForJson = values.equipmentsAssetsProvided.items.map(item => ({ name: item.name, serial_no: item.serial_no, remark: item.remark, provided: item.provided }));
            formData.append('equipments_assets_issued', JSON.stringify(equipmentDataForJson));
            values.equipmentsAssetsProvided.items.forEach((item, index) => {
                if (item.attachment && item.attachment[0]) formData.append(`equipment_attachment_${index}`, item.attachment[0]);
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
        <Form onSubmit={handleSubmit(internalFormSubmit)} className="h-full">
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
        </Form>
    );
};


// --- 4. PAGE-LEVEL COMPONENT ---
const EmployeeFormPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { employeeId } = useParams<{ employeeId: string }>();
    const isEditMode = !!employeeId;

    const [employeeData, setEmployeeData] = useState<Partial<EmployeeFormSchema> | null>(null);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    
    const apiToForm = (apiData: any): Partial<EmployeeFormSchema> => {
        const commaStringToArray = (str: string | null | undefined): string[] => (str ? String(str).split(',') : []);
        const mapApiBoolToYesNo = (value: any): 'yes' | 'no' | '' => {
            if (value === true || value === 1 || value === '1') return 'yes';
            if (value === false || value === 0 || value === '0') return 'no';
            return '';
        };

        return {
            id: apiData.id,
            registration: {
                fullName: apiData.name || '', dateOfJoining: apiData.date_of_joining ? new Date(apiData.date_of_joining) : null,
                mobileNumber: apiData.mobile_number || '', mobileNumberCode: apiData.mobile_number_code || '+91',
                email: apiData.email || '', experience: apiData.experience || '',
            },
            personalInformation: {
                status: apiData.status || 'Active', dateOfBirth: apiData.date_of_birth ? new Date(apiData.date_of_birth) : null,
                age: apiData.age || '', gender: apiData.gender || '', nationalityId: apiData.nationality_id || '', bloodGroup: apiData.blood_group || '',
                permanentAddress: apiData.permanent_address || '', localAddress: apiData.local_address || '', maritalStatus: apiData.marital_status || '',
            },
            roleResponsibility: {
                roleId: apiData.role_id || '', departmentId: commaStringToArray(apiData.department_id),
                designationId: apiData.designation_id || '', countryId: commaStringToArray(apiData.country_id),
                categoryId: commaStringToArray(apiData.category_id), subcategoryId: commaStringToArray(apiData.subcategory_id),
                brandId: commaStringToArray(apiData.brand_id), productServiceId: commaStringToArray(apiData.product_service_id),
                reportingHrId: commaStringToArray(apiData.reporting_hr_id), reportingHeadId: apiData.reporting_head_id || '',
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
                items: (typeof apiData.equipments_assets_issued === 'string' ? JSON.parse(apiData.equipments_assets_issued) : (apiData.equipments_assets_issued || [])).map((item: any) => ({ ...item, attachment: null, attachment_url: item.attachment_url || '' })),
            },
            documentSubmission: {},
        };
    };
    
    useEffect(() => {
        if (isEditMode && employeeId) {
            setIsLoading(true);
            (apiGetEmployeeById(employeeId) as Promise<{ data: any }>)
                .then((resp) => { if (resp.data) setEmployeeData(apiToForm(resp.data)); })
                .catch(console.error).finally(() => setIsLoading(false));
        } else {
             setEmployeeData({});
        }
    }, [employeeId, isEditMode]);

    const handleFormSubmit = (formData: FormData, id?: any = 0) => {
        setIsSubmitting(true);
        const action = isEditMode && id ? editEmployeesAction({ employeeId: id, data: formData }) : addEmployeesAction(formData);
        
        // @ts-ignore
        dispatch(action).unwrap()
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
            <EmployeeForm 
                isEdit={isEditMode} 
                defaultValues={employeeData || {}} 
                onFormSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                onDiscard={onDiscardOpen}
            />
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