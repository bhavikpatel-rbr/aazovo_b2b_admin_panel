import { useEffect, useState } from 'react'
import { Form } from '@/components/ui/Form'
import Card from '@/components/ui/Card' // Keep Card
import Container from '@/components/shared/Container'
import EmployeesDetails from './components/DocumentSubmission'
// import TradeInformation from './components/TradeInformation'
import Navigator, { NavigationItem } from './components/Navigator'
// import useLayoutGap from '@/utils/hooks/useLayoutGap' // Not needed for this change
// import useResponsive from '@/utils/hooks/useResponsive' // Not needed for this change
import isEmpty from 'lodash/isEmpty'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import type { EmployeeFormSchema } from './types'
import type { CommonProps } from '@/@types/common'
import RoleResponsibilitySection from './components/RoleResponsibility'
import AccessibilitySection from './components/Registration'
import MemberManagementSection from './components/PersonalInformation'
import TrainingSection from './components/Training'
import TimeAttendance from './components/TimeAttendance'
import OffBoardingSection from './components/OffBoarding'
import EquipmentsAssetsSection from './components/EquipmentsAssets'
import { NavLink } from 'react-router-dom'
import { BiChevronRight } from 'react-icons/bi'
import { Button } from '@/components/ui'
type EmployeeFormProps = {
    children: ReactNode
    onFormSubmit: (values: EmployeeFormSchema) => void
    defaultValues?: EmployeeFormSchema
    newEmployees?: boolean
} & CommonProps

type FormSectionKey =
    | 'registration'
    | 'personalInformation'
    | 'documentSubmission'
    | 'roleResponsibility'
    | 'training'
    | 'equipmentsAssetsProvided'
    | 'timeAttendence'
    | 'offBoarding'



const EmployeeForm = (props: EmployeeFormProps) => {
    const { onFormSubmit, children, defaultValues } = props

    const [activeSection, setActiveSection] = useState<FormSectionKey>('registration');


    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
    }, [defaultValues])

    const onSubmit = (values: EmployeeFormSchema) => {
        onFormSubmit?.(values)
    }

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<EmployeeFormSchema>({
        defaultValues: {
            ...(defaultValues ? defaultValues : {}),
        },
    })

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'registration':
                return <AccessibilitySection control={control} errors={errors} />
            case 'personalInformation':
                return <MemberManagementSection control={control} errors={errors} />
            case 'documentSubmission':
                return <EmployeesDetails control={control} errors={errors} />
            case 'roleResponsibility':
                return <RoleResponsibilitySection control={control} errors={errors}/>
            case 'training':
                return <TrainingSection control={control} errors={errors}/>
            case 'equipmentsAssetsProvided':
                return <EquipmentsAssetsSection control={control} errors={errors}/>
            case 'timeAttendence':
                return <TimeAttendance control={control} errors={errors}/>
            case 'offBoarding':
                return <OffBoardingSection control={control} errors={errors}/>
            default:
                return <EmployeesDetails control={control} errors={errors} />
        }
    }


    return (
        <div>
            <Form
                className="flex flex-col"
                onSubmit={handleSubmit(onSubmit)}
            >
                <Container>
                    {/* Horizontal Navigator within Card */}
                    {/* Add padding to the Card's body using bodyClass or directly if supported */}

                    <div className='flex gap-1 items-end mb-3 '>
                        <NavLink to="/business-entities/employees">
                            <h6 className='font-semibold hover:text-primary'>Employees</h6>
                        </NavLink>
                        <BiChevronRight size={22} color='black'/>
                        <h6 className='font-semibold text-primary'>Add New Employee</h6>
                    </div>

                    <Card 
                        className="mb-6" 
                        // Option 1: If your Card component has a bodyClass prop for internal padding
                        bodyClass="px-4 md:px-6 py-2" // Example: Add horizontal padding
                        // Option 2: If Card doesn't have bodyClass, you might need to wrap Navigator
                        // or hope the Card's default padding is sufficient.
                    >
                        {/* 
                            If Card's default padding isn't what you want and bodyClass isn't available,
                            you could add a div wrapper here:
                            <div className="px-4 md:px-6"> 
                        */}
                        <Navigator
                            activeSection={activeSection}
                            onNavigate={(sectionKey) => setActiveSection(sectionKey as FormSectionKey)}
                        />
                        {/* 
                            </div> 
                        */}
                    </Card>

                    {/* Form Sections Area */}
                    <div className="flex flex-col gap-4">
                        {renderActiveSection()}
                    </div>
                    {/* {children}  */}
                </Container>
            </Form>
            {/* Footer with Save and Cancel buttons */}
            <Card bodyClass="flex justify-end gap-2" className='mt-4'>
                <Button type="button" className="px-4 py-2">Cancel</Button>
                <Button type="button" className="px-4 py-2">Previous</Button>
                <Button type="button" className="px-4 py-2">Next</Button>
                <Button type="button" className="px-4 py-2">Draft</Button>
                <Button type="submit" className="px-4 py-2" variant="solid">Save</Button>
            </Card>

        </div>
    )
}

export default EmployeeForm