import { useEffect, useState } from 'react'
import { Form } from '@/components/ui/Form'
import Card from '@/components/ui/Card' // Keep Card
import Container from '@/components/shared/Container'
import CompanyDetails from './components/CompanyDetails'
// import TradeInformation from './components/TradeInformation'
import Navigator, { NavigationItem } from './components/Navigator'
// import useLayoutGap from '@/utils/hooks/useLayoutGap' // Not needed for this change
// import useResponsive from '@/utils/hooks/useResponsive' // Not needed for this change
import isEmpty from 'lodash/isEmpty'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import type { CompanyFormSchema } from './types'
import type { CommonProps } from '@/@types/common'
import KYCDetailSection from './components/KYC'
import AccessibilitySection from './components/Accessibility'
import BankDetailsSection from './components/BankDetails'
import MemberManagementSection from './components/MemberManagement'
import { NavLink } from 'react-router-dom'
import { BiChevronRight } from 'react-icons/bi'
import { Button } from '@/components/ui'
type CompanyFormProps = {
    children: ReactNode
    onFormSubmit: (values: CompanyFormSchema) => void
    defaultValues?: CompanyFormSchema
    newCompany?: boolean
} & CommonProps

type FormSectionKey =
    | 'companyDetails'
    | 'kycDocuments'
    | 'bankDetails'
    | 'accessibility'
    | 'memberManagement'


const CompanyForm = (props: CompanyFormProps) => {
    const { onFormSubmit, children, defaultValues } = props

    const [activeSection, setActiveSection] = useState<FormSectionKey>('companyDetails');

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
    }, [defaultValues])

    const onSubmit = (values: CompanyFormSchema) => {
        onFormSubmit?.(values)
    }

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<CompanyFormSchema>({
        defaultValues: {
            ...(defaultValues ? defaultValues : {}),
        },
    })

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'companyDetails':
                return <CompanyDetails control={control} errors={errors} />
            case 'kycDocuments':
                return <KYCDetailSection control={control} errors={errors} />
            case 'bankDetails':
                return <BankDetailsSection control={control} errors={errors} />
            case 'accessibility':
                return <AccessibilitySection control={control} errors={errors} />
            case 'memberManagement':
                return <MemberManagementSection control={control} errors={errors} />
            default:
                return <CompanyDetails control={control} errors={errors} />
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
                        <NavLink to="/business-entities/company">
                            <h6 className='font-semibold hover:text-primary'>Company</h6>
                        </NavLink>
                        <BiChevronRight size={22} color='black'/>
                        <h6 className='font-semibold text-primary'>Add New Company</h6>
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
            

        </div>
    )
}

export default CompanyForm