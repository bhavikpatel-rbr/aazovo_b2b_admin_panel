import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NavLink, useNavigate } from 'react-router-dom'
import isEmpty from 'lodash/isEmpty'
import type { ReactNode } from 'react'
import Container from '@/components/shared/Container'
import { Card, Form, Button } from '@/components/ui'
import { BiChevronRight } from 'react-icons/bi'
import type { CommonProps } from '@/@types/common'

// Import all your section components
import RegistrationSection from './components/Registration'
import PersonalInformationSection from './components/PersonalInformation'
import DocumentSubmissionSection from './components/DocumentSubmission' // Assuming you have this
import RoleResponsibilitySection from './components/RoleResponsibility'
import TrainingSection from './components/Training'
import EquipmentsAssetsSection from './components/EquipmentsAssets'
import TimeAttendanceSection from './components/TimeAttendance'
import OffBoardingSection from './components/OffBoarding'
import Navigator from './components/Navigator'
import type { EmployeeFormSchema } from './types'

const sectionKeys: FormSectionKey[] = ['registration', 'personalInformation', 'documentSubmission', 'roleResponsibility', 'training', 'equipmentsAssetsProvided', 'timeAttendence', 'offBoarding'];
type FormSectionKey = keyof Omit<EmployeeFormSchema, 'id'>;

type EmployeeFormProps = {
    onFormSubmit: (data: FormData, id?: string) => void
    defaultValues?: Partial<EmployeeFormSchema>
    isEdit?: boolean
} & CommonProps

const EmployeeForm = (props: EmployeeFormProps) => {
    const { onFormSubmit, defaultValues, isEdit = false } = props
    const navigate = useNavigate()
    const [activeSection, setActiveSection] = useState<FormSectionKey>('registration')
    const activeSectionIndex = sectionKeys.indexOf(activeSection)

    const { handleSubmit, reset, formState: { errors }, control } = useForm<EmployeeFormSchema>({
        defaultValues: defaultValues || {},
    })

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
    }, [defaultValues, reset])


    const onSubmit = (values: EmployeeFormSchema) => {
        const formData = new FormData()

        // --- DATA MAPPING: Form Schema -> FormData (with defensive checks) ---

        // Registration (Use ?. and provide fallbacks || '')
        formData.append('name', values.registration?.fullName || '');
        if (values.registration?.dateOfJoining) {
            formData.append('date_of_joining', new Date(values.registration.dateOfJoining).toISOString().split('T')[0]);
        }
        formData.append('mobile_number', values.registration?.mobileNumber || '');
        formData.append('mobile_number_code', values.registration?.mobileNumberCode || '+91');
        formData.append('email', values.registration?.email || '');
        formData.append('experience', String(values.registration?.experience || ''));
        if (!isEdit && values.registration?.password) {
            formData.append('password', values.registration.password);
        }

        // THE FIX IS HERE: Use optional chaining on `values.personalInformation`
        formData.append('status', values.personalInformation?.status || 'Active'); // Provide a sensible default

        // Personal Information
        if (values.personalInformation?.dateOfBirth) {
            formData.append('date_of_birth', new Date(values.personalInformation.dateOfBirth).toISOString().split('T')[0]);
        }
        formData.append('age', String(values.personalInformation?.age || ''));
        formData.append('gender', values.personalInformation?.gender || '');
        formData.append('nationality_id', String(values.personalInformation?.nationalityId || ''));
        formData.append('blood_group', values.personalInformation?.bloodGroup || '');
        formData.append('permanent_address', values.personalInformation?.permanentAddress || '');
        formData.append('local_address', values.personalInformation?.localAddress || '');

        // Role & Responsibility
        formData.append('role_id', String(values.roleResponsibility?.roleId || ''));
        formData.append('department_id', String(values.roleResponsibility?.departmentId || ''));
        formData.append('designation_id', String(values.roleResponsibility?.designationId || ''));
        // ... (apply ?. and || '' to all other role fields)

        // Training
        if (values.training?.training_date_of_completion) {
            formData.append('training_date_of_completion', new Date(values.training.training_date_of_completion).toISOString().split('T')[0]);
        }
        formData.append('training_remark', values.training?.training_remark || '');
        // ... (map specific training fields with ?. )

        // Off-Boarding
        formData.append('exit_interview_conducted', String(values.offBoarding?.exit_interview_conducted === 'yes'));
        formData.append('exit_interview_remark', values.offBoarding?.exit_interview_remark || '');
        // ... (apply to all other off-boarding fields)

        // Equipments & Assets (Array of objects) - this check is already safe
        if (values.equipmentsAssetsProvided?.items) {
            formData.append('equipments_assets_issued', JSON.stringify(values.equipmentsAssetsProvided.items));
        }

        // Documents (File Uploads) - this check is also safe
        if (values.documentSubmission) {
            Object.keys(values.documentSubmission).forEach(key => {
                const fileList = values.documentSubmission[key as keyof typeof values.documentSubmission];
                if (fileList && fileList[0]) {
                    formData.append(key, fileList[0]);
                }
            });
        }

        onFormSubmit(formData, defaultValues?.id)
    }

    

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'registration': return <RegistrationSection control={control} errors={errors} />
            case 'personalInformation': return <PersonalInformationSection control={control} errors={errors} />
            case 'documentSubmission': return <DocumentSubmissionSection control={control} errors={errors} />
            case 'roleResponsibility': return <RoleResponsibilitySection control={control} errors={errors} />
            case 'training': return <TrainingSection control={control} errors={errors} />
            case 'equipmentsAssetsProvided': return <EquipmentsAssetsSection control={control} errors={errors} />
            case 'timeAttendence': return <TimeAttendanceSection control={control} errors={errors} />
            case 'offBoarding': return <OffBoardingSection control={control} errors={errors} />
            default: return <RegistrationSection control={control} errors={errors} />
        }
    }

    const handleNext = () => activeSectionIndex < sectionKeys.length - 1 && setActiveSection(sectionKeys[activeSectionIndex + 1]);
    const handlePrevious = () => activeSectionIndex > 0 && setActiveSection(sectionKeys[activeSectionIndex - 1]);

    return (
        <Form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
            <Container className="flex-grow">
                <div className="flex gap-1 items-end mb-3">
                    <NavLink to="/business-entities/employees"><h6 className="font-semibold hover:text-primary">Employees</h6></NavLink>
                    <BiChevronRight size={22} color="black" />
                    <h6 className="font-semibold text-primary">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h6>
                </div>
                <Card className="mb-6" bodyClass="px-4 md:px-6 py-2">
                    <Navigator activeSection={activeSection} onNavigate={(key) => setActiveSection(key as FormSectionKey)} />
                </Card>
                <div className="flex flex-col gap-4">{renderActiveSection()}</div>
            </Container>
            <Card bodyClass="flex justify-end gap-2" className="mt-4 sticky bottom-0 z-10">
                <Button type="button" onClick={() => navigate('/hr-employees/employees')}>Cancel</Button>
                <Button type="button" onClick={handlePrevious} disabled={activeSectionIndex === 0}>Previous</Button>
                <Button type="button" onClick={handleNext} disabled={activeSectionIndex === sectionKeys.length - 1}>Next</Button>
                <Button type="button">Draft</Button>
                <Button type="submit" variant="solid">{isEdit ? 'Update Employee' : 'Save Employee'}</Button>
            </Card>
        </Form>
    )
}

export default EmployeeForm